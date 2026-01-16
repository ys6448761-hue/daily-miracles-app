/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Judge Service - LLM-as-a-Judge 품질 게이트 시스템
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Task 6: 멀티에이전트 품질 안정화
 * - 모델 캐스케이드 (중간급 → Judge Fail → 상위 모델)
 * - LLM-as-a-Judge 5항목 체크
 * - 컨텍스트 압축 (2단계 파이프라인)
 * - 품질 로그 지표
 *
 * 작성일: 2026-01-16
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 모델 설정
// ═══════════════════════════════════════════════════════════════════════════

const MODELS = {
  base: 'gpt-4o-mini',      // 기본 모델 (루미/재미)
  premium: 'gpt-4o',        // 상위 모델 (코미 결정문, 승급 시)
  judge: 'gpt-4o-mini'      // Judge 모델
};

// 에이전트별 모델 매핑
const AGENT_MODELS = {
  komi: { base: 'gpt-4o', premium: 'gpt-4o' },           // 코미 결정문은 항상 상위
  lumi: { base: 'gpt-4o-mini', premium: 'gpt-4o' },     // 루미: 중간급 → 승급
  jaemi: { base: 'gpt-4o-mini', premium: 'gpt-4o' },    // 재미: 중간급 → 승급
  ju: { base: 'gpt-4o-mini', premium: 'gpt-4o' },       // 주: 중간급 → 승급
  default: { base: 'gpt-4o-mini', premium: 'gpt-4o' }
};

// ═══════════════════════════════════════════════════════════════════════════
// 품질 로그 지표
// ═══════════════════════════════════════════════════════════════════════════

const qualityStats = {
  totalResponses: 0,
  judgePass: 0,
  judgeFail: 0,
  upgrades: 0,
  downgrades: 0,
  finalModifications: 0,
  failReasons: {}  // { "형식_미준수": 3, "환각_위험": 1, ... }
};

/**
 * 품질 통계 기록
 */
function recordQualityStat(passed, failReason = null, upgraded = false) {
  qualityStats.totalResponses++;

  if (passed) {
    qualityStats.judgePass++;
  } else {
    qualityStats.judgeFail++;
    if (failReason) {
      qualityStats.failReasons[failReason] = (qualityStats.failReasons[failReason] || 0) + 1;
    }
  }

  if (upgraded) {
    qualityStats.upgrades++;
  }
}

/**
 * 품질 통계 조회
 */
function getQualityStats() {
  const total = qualityStats.totalResponses || 1;
  const upgradeRate = Math.round((qualityStats.upgrades / total) * 100);
  const passRate = Math.round((qualityStats.judgePass / total) * 100);

  // Top 3 Fail 사유
  const failTop3 = Object.entries(qualityStats.failReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => `${reason}(${count})`);

  return {
    total: qualityStats.totalResponses,
    passRate: `${passRate}%`,
    upgradeRate: `${upgradeRate}%`,
    downgrades: qualityStats.downgrades,
    finalModifications: qualityStats.finalModifications,
    failTop3: failTop3.length > 0 ? failTop3 : ['없음']
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM-as-a-Judge (5항목 체크)
// ═══════════════════════════════════════════════════════════════════════════

const JUDGE_CRITERIA = [
  { id: 'format', name: '형식 준수', description: '루미/재미/코미 포맷을 지켰는가?' },
  { id: 'evidence', name: '근거성', description: 'docs/raw 어디서 가져왔는가? 링크/인용 있는가?' },
  { id: 'consistency', name: '일관성', description: '스레드 앞부분 결정과 모순 없는가?' },
  { id: 'uncertainty', name: '불확실성 표시', description: '모르면 TBD/질문으로 처리했는가?' },
  { id: 'hallucination', name: '환각 위험', description: '없는 사실을 단정하지 않았는가?' }
];

/**
 * Judge 프롬프트 생성
 */
function createJudgePrompt(agentRole, userQuery, response, context = '') {
  return `당신은 Aurora5 팀의 품질 검수 AI입니다.
다음 응답이 5가지 기준을 충족하는지 평가하세요.

## 평가 대상
- 에이전트: ${agentRole}
- 사용자 질문: ${userQuery}
- 응답:
\`\`\`
${response}
\`\`\`

${context ? `## 컨텍스트\n${context}\n` : ''}

## 평가 기준 (5항목)
1. 형식 준수: ${agentRole} 표준 포맷을 지켰는가?
2. 근거성: 주장에 근거/인용이 있는가?
3. 일관성: 이전 대화/결정과 모순 없는가?
4. 불확실성: 모르는 것은 TBD/질문으로 표시했는가?
5. 환각 위험: 확인되지 않은 사실을 단정하지 않았는가?

## 출력 형식 (JSON)
{
  "pass": true/false,
  "scores": {
    "format": 1,
    "evidence": 1,
    "consistency": 1,
    "uncertainty": 1,
    "hallucination": 1
  },
  "failReason": "실패 시 주요 사유 (없으면 null)",
  "suggestion": "개선 제안 (있으면)"
}

각 항목은 1(충족) 또는 0(미충족)으로 평가하세요.
pass는 5항목 중 4개 이상 충족 시 true입니다.
JSON만 출력하세요.`;
}

/**
 * Judge 실행
 */
async function runJudge(agentRole, userQuery, response, context = '') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[Judge] OPENAI_API_KEY 없음 - Judge 스킵');
    return { pass: true, skipped: true };
  }

  try {
    const judgePrompt = createJudgePrompt(agentRole, userQuery, response, context);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODELS.judge,
        messages: [{ role: 'user', content: judgePrompt }],
        max_tokens: 500,
        temperature: 0
      })
    });

    if (!res.ok) {
      console.error('[Judge] API 오류');
      return { pass: true, skipped: true, error: 'API_ERROR' };
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content || '';

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Judge] JSON 파싱 실패');
      return { pass: true, skipped: true, error: 'PARSE_ERROR' };
    }

    const result = JSON.parse(jsonMatch[0]);

    // 통계 기록
    recordQualityStat(result.pass, result.failReason, false);

    console.log(`[Judge] 평가 완료: ${result.pass ? 'PASS' : 'FAIL'}`, result.scores);

    return result;

  } catch (error) {
    console.error('[Judge] 실행 오류:', error.message);
    return { pass: true, skipped: true, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 컨텍스트 압축 (2단계 파이프라인)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1단계: 컨텍스트 압축 (저비용 모델)
 * 긴 스레드/docs를 800~1500자로 요약
 */
async function compressContext(longContext, maxLength = 1500) {
  if (!longContext || longContext.length < maxLength) {
    return longContext;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // API 없으면 단순 자르기
    return longContext.substring(0, maxLength) + '...(압축됨)';
  }

  try {
    const compressPrompt = `다음 대화/문서를 핵심만 추려 ${maxLength}자 이내로 구조화 요약하세요.
중요한 결정사항, 액션아이템, 핵심 논의를 보존하세요.

원본:
${longContext.substring(0, 4000)}

요약 (${maxLength}자 이내):`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODELS.base,  // 저비용 모델로 압축
        messages: [{ role: 'user', content: compressPrompt }],
        max_tokens: 800,
        temperature: 0.3
      })
    });

    if (!res.ok) {
      return longContext.substring(0, maxLength) + '...(압축됨)';
    }

    const data = await res.json();
    const compressed = data.choices[0]?.message?.content || '';

    console.log(`[Compress] ${longContext.length}자 → ${compressed.length}자`);
    return compressed;

  } catch (error) {
    console.error('[Compress] 오류:', error.message);
    return longContext.substring(0, maxLength) + '...(압축됨)';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 모델 캐스케이드 응답 생성
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 캐스케이드 응답 생성
 * 1. base 모델로 응답 생성
 * 2. Judge 평가
 * 3. Fail 시 premium 모델로 재생성
 */
async function generateWithCascade(role, prompt, systemPrompt, context = '') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const models = AGENT_MODELS[role] || AGENT_MODELS.default;

  // 컨텍스트가 길면 압축
  const compressedContext = await compressContext(context, 1500);

  // 1단계: base 모델 응답
  let response = await callOpenAI(models.base, systemPrompt, prompt, compressedContext);

  // Judge 평가 (코미 결정문은 항상 premium이므로 Judge 스킵)
  if (role !== 'komi') {
    const judgeResult = await runJudge(role, prompt, response, compressedContext);

    // Judge Fail → premium 모델로 재생성
    if (!judgeResult.pass && !judgeResult.skipped) {
      console.log(`[Cascade] Judge Fail → ${models.premium}로 승급`);
      recordQualityStat(false, judgeResult.failReason, true);

      response = await callOpenAI(models.premium, systemPrompt, prompt, compressedContext);

      // 승급 표시 추가
      response += `\n\n_⚡ 품질 향상을 위해 상위 모델로 재생성되었습니다._`;
    }
  }

  return response;
}

/**
 * OpenAI API 호출 (공통)
 */
async function callOpenAI(model, systemPrompt, userMessage, context = '') {
  const apiKey = process.env.OPENAI_API_KEY;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  if (context) {
    messages.push({
      role: 'system',
      content: `컨텍스트:\n${context}`
    });
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '응답 생성 실패';
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // 모델 설정
  MODELS,
  AGENT_MODELS,
  // Judge
  runJudge,
  createJudgePrompt,
  JUDGE_CRITERIA,
  // 압축
  compressContext,
  // 캐스케이드
  generateWithCascade,
  callOpenAI,
  // 통계
  recordQualityStat,
  getQualityStats,
  qualityStats
};
