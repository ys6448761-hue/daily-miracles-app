#!/usr/bin/env node
/**
 * Context Bundle 요약 파이프라인
 * P4-2: 검색 결과를 판단 가능한 문서로 변환
 *
 * 사용법:
 *   node scripts/context-summarize.js --in artifacts/context_bundle.json --out artifacts/context_summary.md
 *   node scripts/context-summarize.js --in artifacts/context_bundle.json --out artifacts/context_summary.md --mode decision
 *
 * 옵션:
 *   --in         입력 파일 (context_bundle.json) [필수]
 *   --out        출력 파일 경로 [필수]
 *   --mode       general|decision|action (기본: general)
 *   --max-items  참고 문서 최대 개수 (기본: 5)
 */

const fs = require('fs');
const path = require('path');

// OpenAI 설정 (환경변수에서 로드)
let openai = null;
try {
  const { OpenAI } = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  // OpenAI 모듈 없거나 API 키 없으면 fallback 모드
}

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    in: null,
    out: null,
    mode: 'general',
    maxItems: 5
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--in' && args[i + 1]) {
      result.in = args[++i];
    } else if (arg.startsWith('--in=')) {
      result.in = arg.split('=').slice(1).join('=');
    } else if (arg === '--out' && args[i + 1]) {
      result.out = args[++i];
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=').slice(1).join('=');
    } else if (arg === '--mode' && args[i + 1]) {
      result.mode = args[++i];
    } else if (arg.startsWith('--mode=')) {
      result.mode = arg.split('=')[1];
    } else if (arg === '--max-items' && args[i + 1]) {
      result.maxItems = parseInt(args[++i]) || 5;
    } else if (arg.startsWith('--max-items=')) {
      result.maxItems = parseInt(arg.split('=')[1]) || 5;
    }
  }

  return result;
}

/**
 * 입력 파일 검증 및 로드
 */
function loadContextBundle(inputPath) {
  const fullPath = path.resolve(inputPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`입력 파일을 찾을 수 없습니다: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const data = JSON.parse(content);

  // 스키마 검증
  if (!data.query || !data.results) {
    throw new Error('유효하지 않은 context_bundle 형식입니다.');
  }

  return data;
}

/**
 * 모드별 프롬프트 생성
 */
function buildPrompt(bundle, mode) {
  const docList = bundle.results
    .map((r, i) => `${i + 1}. [${r.title}]\n   - 경로: ${r.path}\n   - 날짜: ${r.updated_at || 'N/A'}\n   - 내용: ${r.snippet || '(스니펫 없음)'}`)
    .join('\n\n');

  const modeInstructions = {
    general: `
당신은 문서 요약 전문가입니다. 아래 검색 결과를 분석하여:
1. 핵심 요약 (3~5문장)
2. 주요 발견 사항
3. 관련 참고 사항
을 작성해주세요. 명확하고 간결하게 작성합니다.`,

    decision: `
당신은 의사결정 지원 분석가입니다. 아래 검색 결과를 분석하여:
1. 핵심 요약 (3~5문장) - 정책/원칙 중심
2. 결정 사항 후보 - 체크박스 형식으로 (- [ ] 형태)
3. 주의/고려 사항
을 작성해주세요. 결정문(DEC) 작성에 바로 활용 가능하도록 작성합니다.`,

    action: `
당신은 프로젝트 매니저입니다. 아래 검색 결과를 분석하여:
1. 핵심 요약 (3~5문장) - 할 일 중심
2. 액션 아이템 후보 - 동사형 체크박스 (- [ ] ~하기 형태)
3. 우선순위 제안
을 작성해주세요. 실행 계획 수립에 바로 활용 가능하도록 작성합니다.`
  };

  return `${modeInstructions[mode] || modeInstructions.general}

## 검색 쿼리
"${bundle.query}"

## 검색 범위
${(bundle.scopes || ['all']).join(', ')}

## 검색된 문서 (${bundle.results.length}개)

${docList}

---

위 내용을 바탕으로 요약해주세요. 한국어로 작성하며, 마크다운 형식을 사용합니다.`;
}

/**
 * LLM을 통한 요약 생성
 */
async function generateSummaryWithLLM(bundle, mode) {
  if (!openai) {
    return null; // LLM 사용 불가
  }

  const prompt = buildPrompt(bundle, mode);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 기술 문서 분석 및 요약 전문가입니다. 명확하고 구조화된 마크다운 형식으로 응답합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error('LLM 호출 실패:', err.message);
    return null;
  }
}

/**
 * Fallback 요약 생성 (LLM 없이)
 */
function generateFallbackSummary(bundle, mode) {
  const results = bundle.results;

  // 핵심 요약: 첫 3개 문서의 스니펫 요약
  const summaryPoints = results.slice(0, 3).map(r => {
    const snippet = r.snippet || '';
    const firstSentence = snippet.split(/[.!?]/)[0] + '.';
    return `- ${r.title}: ${firstSentence.slice(0, 100)}`;
  });

  // 결정 사항 후보 (decision 모드)
  const decisionItems = results.slice(0, 5).map(r => {
    // 제목에서 핵심 키워드 추출
    return `- [ ] ${r.title} 관련 사항 검토 필요`;
  });

  // 액션 아이템 후보 (action 모드)
  const actionItems = results.slice(0, 5).map(r => {
    return `- [ ] ${r.title} 내용 확인하기`;
  });

  return { summaryPoints, decisionItems, actionItems };
}

/**
 * 최종 Markdown 문서 생성
 */
function buildMarkdownOutput(bundle, llmSummary, fallback, options) {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const generated = kstTime.toISOString().slice(0, 16).replace('T', ' ') + ' KST';

  const topResults = bundle.results.slice(0, options.maxItems);

  let md = `# Context Summary

## 검색 정보
- **Query**: ${bundle.query}
- **Scopes**: ${(bundle.scopes || ['all']).join(', ')}
- **Mode**: ${options.mode}
- **Generated**: ${generated}

---

`;

  // LLM 요약이 있으면 사용
  if (llmSummary) {
    md += `## 핵심 요약

${llmSummary}

---

`;
  } else {
    // Fallback 요약
    md += `## 핵심 요약 (3~5문장)

${fallback.summaryPoints.join('\n')}

---

`;

    if (options.mode === 'decision' || options.mode === 'general') {
      md += `## 결정 사항 후보

${fallback.decisionItems.join('\n')}

---

`;
    }

    if (options.mode === 'action' || options.mode === 'general') {
      md += `## 액션 아이템 후보

${fallback.actionItems.join('\n')}

---

`;
    }
  }

  // 참고 문서 목록
  md += `## 참고 문서

`;

  topResults.forEach((doc, idx) => {
    md += `${idx + 1}. **${doc.title}**
   - Path: \`${doc.path}\`
   - Score: ${doc.score}
   - Updated: ${doc.updated_at || 'N/A'}

`;
  });

  return md;
}

/**
 * 결과 저장
 */
function saveOutput(content, outPath) {
  const fullPath = path.resolve(outPath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
Context Bundle 요약 파이프라인 (P4-2)

사용법:
  node scripts/context-summarize.js --in <입력파일> --out <출력파일> [옵션]

필수 옵션:
  --in          context_bundle.json 경로
  --out         출력 파일 경로

선택 옵션:
  --mode        general | decision | action (기본: general)
  --max-items   참고 문서 최대 개수 (기본: 5)

예시:
  node scripts/context-summarize.js --in artifacts/context_bundle.json --out artifacts/context_summary.md
  node scripts/context-summarize.js --in artifacts/context_bundle.json --out artifacts/summary.md --mode decision
  node scripts/context-summarize.js --in artifacts/context_bundle.json --out artifacts/actions.md --mode action --max-items 10
`);
}

/**
 * 메인 실행
 */
async function main() {
  const args = process.argv.slice(2);

  // 도움말
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const options = parseArgs(args);

  // 필수 옵션 체크
  if (!options.in) {
    console.error('❌ --in 옵션이 필요합니다.');
    printUsage();
    process.exit(1);
  }

  if (!options.out) {
    console.error('❌ --out 옵션이 필요합니다.');
    printUsage();
    process.exit(1);
  }

  // 모드 검증
  const validModes = ['general', 'decision', 'action'];
  if (!validModes.includes(options.mode)) {
    console.error(`❌ 유효하지 않은 모드: ${options.mode}`);
    console.error(`   사용 가능: ${validModes.join(', ')}`);
    process.exit(1);
  }

  try {
    // 1. 입력 로드
    console.log(`📥 입력 로드: ${options.in}`);
    const bundle = loadContextBundle(options.in);
    console.log(`   문서 ${bundle.results.length}개 로드됨`);

    // 2. 요약 생성
    console.log(`🧠 요약 생성 중... (mode: ${options.mode})`);

    let llmSummary = null;
    if (openai) {
      llmSummary = await generateSummaryWithLLM(bundle, options.mode);
      if (llmSummary) {
        console.log('   ✅ LLM 요약 완료');
      }
    }

    const fallback = generateFallbackSummary(bundle, options.mode);

    // 3. Markdown 생성
    const markdown = buildMarkdownOutput(bundle, llmSummary, fallback, options);

    // 4. 저장
    const savedPath = saveOutput(markdown, options.out);
    console.log(`\n✅ 저장됨: ${savedPath}`);
    console.log(`   모드: ${options.mode}`);
    console.log(`   참고 문서: ${Math.min(bundle.results.length, options.maxItems)}개`);

  } catch (err) {
    console.error(`❌ 오류: ${err.message}`);
    process.exit(1);
  }
}

main();
