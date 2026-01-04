#!/usr/bin/env node
/**
 * Raw → Docs 가공 스크립트
 * 루미 규칙 v1.0 기반
 *
 * 사용법: node scripts/process-raw.js [파일경로]
 *
 * 기능:
 * - raw 문서에서 결정사항(DEC), 액션(ACT), 인사이트 추출
 * - 루미 v1.0 frontmatter 포함한 정본 문서 생성
 * - docs/ 적절한 폴더에 저장
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const RAW_DIR = path.join(DOCS_DIR, 'raw', 'conversations');

// 문서 타입별 출력 폴더
const OUTPUT_DIRS = {
  decision: 'decisions',
  action: 'actions',
  spec: 'specs',
  policy: 'policies',
  guide: 'guides',
  checklist: 'checklists'
};

/**
 * 결정사항 패턴 추출
 */
function extractDecisions(content) {
  const decisions = [];

  // DEC-xxxx-xxxx-xxx 패턴
  const decPattern = /(?:DEC-\d{4}-\d{4}-\d+|결정[:\s]*|✅\s*결정|##\s*결정)/gi;

  // 결정 섹션 찾기
  const decSections = content.match(/##\s*(?:\d+[.)]?\s*)?결정.*?(?=##|\n---|\n\n\n|$)/gis) || [];

  decSections.forEach((section, idx) => {
    decisions.push({
      index: idx + 1,
      content: section.trim(),
      type: 'decision'
    });
  });

  // "확정", "승인", "결정됨" 키워드 포함 문장
  const confirmPatterns = content.match(/[^\n]*(?:확정|승인됨|결정됨|최종 결정)[^\n]*/gi) || [];
  confirmPatterns.forEach(match => {
    if (!decisions.some(d => d.content.includes(match))) {
      decisions.push({
        content: match.trim(),
        type: 'confirmation'
      });
    }
  });

  return decisions;
}

/**
 * 액션 아이템 추출
 */
function extractActions(content) {
  const actions = [];

  // 체크박스 패턴
  const checkboxes = content.match(/- \[[ x]\] .+/gi) || [];
  checkboxes.forEach(item => {
    const done = item.includes('[x]') || item.includes('[X]');
    actions.push({
      content: item.replace(/- \[[ xX]\] /, '').trim(),
      status: done ? 'done' : 'todo',
      type: 'checkbox'
    });
  });

  // 담당자 패턴 (담당: xxx, 기한: xxx)
  const assignmentPattern = /(?:담당[:\s]*([가-힣a-zA-Z]+))/gi;
  let match;
  while ((match = assignmentPattern.exec(content)) !== null) {
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const lineEnd = content.indexOf('\n', match.index);
    const line = content.slice(lineStart, lineEnd > 0 ? lineEnd : undefined);

    if (!actions.some(a => a.content.includes(line.trim()))) {
      actions.push({
        content: line.trim(),
        assignee: match[1],
        type: 'assignment'
      });
    }
  }

  return actions;
}

/**
 * 핵심 인사이트 추출
 */
function extractInsights(content) {
  const insights = [];

  // 핵심, 중요, 인사이트, 💡 패턴
  const patterns = [
    /(?:💡|📌|⚡|🎯)\s*[^\n]+/g,
    /(?:핵심|중요|인사이트)[:\s]*[^\n]+/gi,
    />\s*\*\*[^\n]+\*\*/g  // blockquote 강조
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.replace(/^[>💡📌⚡🎯\s*]+/, '').trim();
      if (cleaned.length > 10 && !insights.includes(cleaned)) {
        insights.push(cleaned);
      }
    });
  });

  return insights.slice(0, 10); // 최대 10개
}

/**
 * 메타데이터 추출 (제목, 작성자, 날짜 등)
 */
function extractMetadata(content, filename) {
  const meta = {};

  // 제목 (첫 번째 # 헤더)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  meta.title = titleMatch ? titleMatch[1].replace(/[🚀📋✅❌💡]/g, '').trim() : path.basename(filename, '.md');

  // 작성자
  const authorMatch = content.match(/작성[:\s]*([가-힣a-zA-Z\s()]+)/);
  meta.author = authorMatch ? authorMatch[1].trim() : 'team';

  // 날짜
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  meta.date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

  // 우선순위
  const priorityMatch = content.match(/P([0-3])/);
  meta.priority = priorityMatch ? `P${priorityMatch[1]}` : 'P2';

  // 태그 추출
  meta.tags = [];
  const tagKeywords = ['소원', 'storybook', 'aurora', 'kpi', '가격', '결제', '마케팅', '자동화', '런칭'];
  tagKeywords.forEach(kw => {
    if (content.toLowerCase().includes(kw.toLowerCase())) {
      meta.tags.push(kw);
    }
  });

  return meta;
}

/**
 * 요약 생성 (첫 500자 기반)
 */
function generateSummary(content) {
  // 첫 번째 --- 이후 내용에서 요약
  const afterFrontmatter = content.split('---').slice(2).join('---');
  const text = afterFrontmatter || content;

  // 첫 번째 문단 또는 500자
  const firstParagraph = text.match(/(?:^|\n\n)([^\n#*-].{50,500})/);
  if (firstParagraph) {
    return firstParagraph[1].trim().substring(0, 200) + '...';
  }

  // fallback: 첫 200자
  return text.replace(/[#*\-\[\]]/g, '').trim().substring(0, 200) + '...';
}

/**
 * 가공 문서 생성
 */
function generateProcessedDoc(rawContent, rawPath, meta, decisions, actions, insights) {
  const relativePath = path.relative(DOCS_DIR, rawPath).replace(/\\/g, '/');
  const docId = `DOC-${meta.date.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  // Owner 매핑
  const ownerMap = {
    '루미': 'rumi',
    '코미': 'comi',
    '코드': 'code',
    '푸르미르': 'ceo'
  };
  const owner = Object.entries(ownerMap).find(([kr]) => meta.author.includes(kr))?.[1] || 'team';

  // Frontmatter (루미 v1.0)
  const frontmatter = `---
id: ${docId}
type: document
project: aurora5
priority: ${meta.priority}
topic: ${meta.tags[0] || 'general'}
tags: [${meta.tags.join(', ')}]
owner: ${owner}
status: active
created_at: ${meta.date}
source:
  - ${relativePath}
---`;

  // 본문
  let body = `# ${meta.title}

> **가공일:** ${new Date().toISOString().split('T')[0]}
> **원본:** ${relativePath}
> **작성자:** ${meta.author}

---

## 요약

${generateSummary(rawContent)}

---
`;

  // 결정사항 섹션
  if (decisions.length > 0) {
    body += `\n## 결정사항\n\n`;
    decisions.forEach((dec, idx) => {
      body += `### ${idx + 1}. ${dec.content.substring(0, 50)}...\n\n`;
    });
  }

  // 액션 아이템 섹션
  if (actions.length > 0) {
    body += `\n## 액션 아이템\n\n`;
    body += `| # | 내용 | 상태 | 담당 |\n`;
    body += `|---|------|------|------|\n`;
    actions.slice(0, 10).forEach((act, idx) => {
      const status = act.status === 'done' ? '✅' : '⬜';
      body += `| ${idx + 1} | ${act.content.substring(0, 50)} | ${status} | ${act.assignee || '-'} |\n`;
    });
  }

  // 핵심 인사이트 섹션
  if (insights.length > 0) {
    body += `\n## 핵심 인사이트\n\n`;
    insights.forEach((insight, idx) => {
      body += `${idx + 1}. ${insight}\n`;
    });
  }

  body += `\n---\n\n*자동 가공: ${new Date().toISOString()}*\n`;

  return frontmatter + '\n\n' + body;
}

/**
 * 단일 파일 처리
 */
function processFile(filePath) {
  console.log(`\n📄 처리 중: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // 메타데이터 추출
  const meta = extractMetadata(content, filePath);
  console.log(`   제목: ${meta.title}`);
  console.log(`   날짜: ${meta.date}`);

  // 결정/액션/인사이트 추출
  const decisions = extractDecisions(content);
  const actions = extractActions(content);
  const insights = extractInsights(content);

  console.log(`   결정: ${decisions.length}개`);
  console.log(`   액션: ${actions.length}개`);
  console.log(`   인사이트: ${insights.length}개`);

  // 가공 문서 생성
  const processed = generateProcessedDoc(content, filePath, meta, decisions, actions, insights);

  // 출력 경로 결정
  const outputDir = path.join(DOCS_DIR, 'processed');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputName = `${meta.date}_${path.basename(filePath).replace(/[_\s]+/g, '-')}`;
  const outputPath = path.join(outputDir, outputName);

  fs.writeFileSync(outputPath, processed, 'utf-8');
  console.log(`   ✅ 저장: docs/processed/${outputName}`);

  return { meta, decisions, actions, insights, outputPath };
}

/**
 * 전체 raw 폴더 처리
 */
function processAll() {
  console.log('🔄 Raw → Docs 가공 시작...\n');

  const files = [];

  function collectFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        collectFiles(fullPath);
      } else if (item.endsWith('.md') && !item.startsWith('_')) {
        files.push(fullPath);
      }
    }
  }

  collectFiles(RAW_DIR);
  console.log(`📁 발견된 raw 문서: ${files.length}개`);

  const results = {
    processed: 0,
    decisions: 0,
    actions: 0,
    insights: 0
  };

  files.forEach(file => {
    try {
      const result = processFile(file);
      results.processed++;
      results.decisions += result.decisions.length;
      results.actions += result.actions.length;
      results.insights += result.insights.length;
    } catch (err) {
      console.error(`   ❌ 오류: ${err.message}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('📊 가공 결과 요약');
  console.log('='.repeat(50));
  console.log(`   처리된 문서: ${results.processed}개`);
  console.log(`   추출된 결정: ${results.decisions}개`);
  console.log(`   추출된 액션: ${results.actions}개`);
  console.log(`   추출된 인사이트: ${results.insights}개`);
  console.log('\n✨ 완료! docs/processed/ 폴더를 확인하세요.');
}

/**
 * 메인
 */
const args = process.argv.slice(2);

if (args.length > 0) {
  // 특정 파일 처리
  const filePath = path.resolve(args[0]);
  if (fs.existsSync(filePath)) {
    processFile(filePath);
  } else {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }
} else {
  // 전체 처리
  processAll();
}
