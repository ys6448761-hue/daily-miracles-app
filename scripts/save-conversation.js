/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 대화 저장 스크립트
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 실행: npm run save-conversation -- --title="브랜드 에센스 정의"
 * 또는: npm run save-conversation (제목 입력 프롬프트)
 *
 * 저장 위치:
 *   .claude/team-memory/conversations/2025-01-30_브랜드-에센스-정의.md
 *
 * @version 1.0
 * @date 2025-01-30
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  conversationsDir: '.claude/team-memory/conversations',
  templatePath: '.claude/team-memory/conversations/_template.md'
};

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^가-힣a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 템플릿
// ═══════════════════════════════════════════════════════════════════════════

function generateTemplate(title, summary, decisions, learnings, nextSteps) {
  const dateStr = getDateString();
  const timeStr = getTimeString();

  return `# ${title}

> 대화 일시: ${dateStr} ${timeStr}

---

## 요약

${summary || '(대화 내용 요약)'}

---

## 주요 결정사항

${decisions || '- (결정사항 없음)'}

---

## 배운 것들

${learnings || '- (배운 것 없음)'}

---

## 다음 단계

${nextSteps || '- (다음 단계 없음)'}

---

## 생성된 파일

- (이 대화에서 생성/수정된 파일 목록)

---

*저장 시간: ${dateStr} ${timeStr}*
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인
// ═══════════════════════════════════════════════════════════════════════════

async function saveConversation() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  💬 대화 저장');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const projectRoot = path.join(__dirname, '..');
  const conversationsDir = path.join(projectRoot, CONFIG.conversationsDir);

  // 폴더 확인/생성
  if (!fs.existsSync(conversationsDir)) {
    fs.mkdirSync(conversationsDir, { recursive: true });
  }

  // 인자에서 제목 가져오기
  let title = '';
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith('--title=')) {
      title = arg.replace('--title=', '').replace(/"/g, '');
    }
  }

  // 제목이 없으면 입력 받기
  if (!title) {
    title = await askQuestion('📝 대화 제목: ');
  }

  if (!title.trim()) {
    console.log('❌ 제목을 입력해주세요.');
    process.exit(1);
  }

  console.log('');
  console.log('📋 대화 내용을 입력하세요 (각 항목은 엔터로 구분, 빈 줄이면 다음 항목):');
  console.log('');

  // 요약 입력
  console.log('【요약】 (한 줄 요약 후 엔터):');
  const summary = await askQuestion('> ');

  // 결정사항 입력
  console.log('');
  console.log('【주요 결정사항】 (각 항목 입력 후 엔터, 완료하려면 빈 줄):');
  const decisions = [];
  while (true) {
    const decision = await askQuestion('- ');
    if (!decision.trim()) break;
    decisions.push(`- ${decision}`);
  }

  // 배운 것들 입력
  console.log('');
  console.log('【배운 것들】 (각 항목 입력 후 엔터, 완료하려면 빈 줄):');
  const learnings = [];
  while (true) {
    const learning = await askQuestion('- ');
    if (!learning.trim()) break;
    learnings.push(`- ${learning}`);
  }

  // 다음 단계 입력
  console.log('');
  console.log('【다음 단계】 (각 항목 입력 후 엔터, 완료하려면 빈 줄):');
  const nextSteps = [];
  while (true) {
    const step = await askQuestion('- ');
    if (!step.trim()) break;
    nextSteps.push(`- ${step}`);
  }

  // 파일 생성
  const dateStr = getDateString();
  const slug = slugify(title);
  const fileName = `${dateStr}_${slug}.md`;
  const filePath = path.join(conversationsDir, fileName);

  const content = generateTemplate(
    title,
    summary || null,
    decisions.length > 0 ? decisions.join('\n') : null,
    learnings.length > 0 ? learnings.join('\n') : null,
    nextSteps.length > 0 ? nextSteps.join('\n') : null
  );

  fs.writeFileSync(filePath, content, 'utf8');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ 대화 저장 완료!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📄 저장 위치: ${filePath}`);
  console.log('');

  return filePath;
}

// ═══════════════════════════════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════════════════════════════

saveConversation()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ 저장 실패:', err.message);
    process.exit(1);
  });
