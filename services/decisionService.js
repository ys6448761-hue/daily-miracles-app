/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Decision Service - Aurora5 결정문 관리 시스템
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Task 5: DECISIONS_LOG 시스템
 * - Draft Append: 결정문 요청 시 DECISIONS_LOG.md에 prepend
 * - Finalize: "✅ Final:" 입력 시 Status=Final로 변경
 *
 * 작성일: 2026-01-16
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs').promises;
const path = require('path');

// 경로 설정
const DECISIONS_LOG_PATH = path.join(__dirname, '..', 'docs', 'DECISIONS_LOG.md');

// 오늘 날짜 기준 Decision ID 카운터
let dailyCounter = 0;
let lastDate = '';

/**
 * Decision ID 생성 (D-YYYYMMDD-###)
 */
function generateDecisionId() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (lastDate !== today) {
    lastDate = today;
    dailyCounter = 0;
  }

  dailyCounter++;
  const seq = String(dailyCounter).padStart(3, '0');

  return `D-${today}-${seq}`;
}

/**
 * 결정문 블록 템플릿 생성
 */
function createDecisionBlock(params) {
  const {
    decisionId,
    topic,
    slackThreadLink = 'TBD',
    background = 'TBD',
    lumiStance = { opinion: 'TBD', reason: '', risk: '', alternative: '' },
    jaemiStance = { opinion: 'TBD', reason: '', risk: '', alternative: '' },
    komiStance = { opinion: 'TBD', reason: '', risk: '', alternative: '' },
    decision = 'TBD',
    actionItems = [],
    status = 'Draft'
  } = params;

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');

  const actionsTable = actionItems.length > 0
    ? actionItems.map(a => `| ${a.owner || 'TBD'} | ${a.task || ''} | ${a.deadline || 'TBD'} | ${a.status || 'ToDo'} |`).join('\n')
    : '| TBD | TBD | TBD | ToDo |';

  return `
---
## [${decisionId}] ${topic}
- Date: ${today} (KST)
- Slack Thread: ${slackThreadLink}
- Status: ${status}
- Decision Owner: 푸르미르

### 1) 배경
- ${background}

### 2) 관점 총평(STANCE MATRIX)
| 역할 | 총평 | 근거 | 리스크 | 대안 |
|---|---|---|---|---|
| 루미 | ${lumiStance.opinion} | ${lumiStance.reason} | ${lumiStance.risk} | ${lumiStance.alternative} |
| 재미 | ${jaemiStance.opinion} | ${jaemiStance.reason} | ${jaemiStance.risk} | ${jaemiStance.alternative} |
| 코미 | ${komiStance.opinion} | ${komiStance.reason} | ${komiStance.risk} | ${komiStance.alternative} |

### 3) 최종 결정
- ${decision}

### 4) 액션 아이템
| 담당 | 할일 | 기한 | 상태 |
|---|---|---|---|
${actionsTable}

### 5) 변경 이력
- v1: Draft 생성(코미) - ${today}
---
`;
}

/**
 * DECISIONS_LOG.md에 결정문 prepend
 */
async function appendDecisionDraft(topic, slackThreadLink = null, background = null) {
  try {
    // 현재 파일 읽기
    let content = '';
    try {
      content = await fs.readFile(DECISIONS_LOG_PATH, 'utf8');
    } catch (e) {
      console.error('[Decision] DECISIONS_LOG.md 파일 없음, 생성 필요');
      return { success: false, error: 'FILE_NOT_FOUND' };
    }

    // Decision ID 생성
    const decisionId = generateDecisionId();

    // 결정문 블록 생성
    const decisionBlock = createDecisionBlock({
      decisionId,
      topic,
      slackThreadLink: slackThreadLink || 'TBD',
      background: background || topic,
      status: 'Draft'
    });

    // INDEX 업데이트
    const today = new Date().toISOString().slice(0, 10);
    const indexLine = `| ${decisionId} | ${topic} | ${today} | Draft | 푸르미르 |`;

    // INDEX_END 바로 앞에 새 항목 추가
    content = content.replace(
      '<!-- INDEX_END -->',
      `${indexLine}\n<!-- INDEX_END -->`
    );

    // DECISIONS_START 바로 뒤에 새 결정문 추가 (prepend)
    content = content.replace(
      '<!-- DECISIONS_START -->',
      `<!-- DECISIONS_START -->\n${decisionBlock}`
    );

    // 파일 저장
    await fs.writeFile(DECISIONS_LOG_PATH, content, 'utf8');

    console.log(`[Decision] Draft 생성 완료: ${decisionId}`);

    return {
      success: true,
      decisionId,
      topic,
      message: `📝 결정문 Draft가 생성되었습니다.\n\n• ID: \`${decisionId}\`\n• 주제: ${topic}\n• Status: Draft\n\n푸르미르님이 \`✅ Final: 승인\` 메시지로 확정해주세요.`
    };

  } catch (error) {
    console.error('[Decision] Draft 생성 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 결정문 Final로 변경
 */
async function finalizeDecision(decisionId, finalMessage = '') {
  try {
    let content = await fs.readFile(DECISIONS_LOG_PATH, 'utf8');

    // 해당 Decision ID 블록 찾기
    const blockRegex = new RegExp(
      `(## \\[${decisionId}\\][^]*?- Status: )Draft([^]*?### 5\\) 변경 이력[^]*?)(---)`,
      'g'
    );

    if (!blockRegex.test(content)) {
      return { success: false, error: 'DECISION_NOT_FOUND', decisionId };
    }

    // Status를 Final로 변경
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');

    content = content.replace(blockRegex, (match, p1, p2, p3) => {
      // 변경 이력에 Final 추가
      const historyAddition = `\n- v2: Final 확정(푸르미르) - ${today}${finalMessage ? ` - "${finalMessage}"` : ''}`;
      return `${p1}Final${p2}${historyAddition}\n${p3}`;
    });

    // INDEX도 업데이트
    content = content.replace(
      new RegExp(`(\\| ${decisionId} \\|[^|]*\\|[^|]*\\| )Draft( \\|)`),
      `$1Final$2`
    );

    await fs.writeFile(DECISIONS_LOG_PATH, content, 'utf8');

    console.log(`[Decision] Final 확정: ${decisionId}`);

    return {
      success: true,
      decisionId,
      message: `✅ 결정문이 확정되었습니다.\n\n• ID: \`${decisionId}\`\n• Status: Final\n• 확정 메시지: ${finalMessage || '(없음)'}`
    };

  } catch (error) {
    console.error('[Decision] Final 변경 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * "결정문" 또는 "decision" 트리거 감지
 */
function isDecisionTrigger(text) {
  const triggers = [
    '결정문 생성',
    '결정문 작성',
    '결정문 만들어',
    'decision'
  ];

  const lowerText = text.toLowerCase();
  return triggers.some(t => lowerText.includes(t));
}

/**
 * "✅ Final:" 트리거 감지
 */
function isFinalTrigger(text) {
  return text.includes('✅ Final:') || text.includes('✅Final:');
}

/**
 * Final 메시지에서 내용 추출
 */
function extractFinalMessage(text) {
  const match = text.match(/✅\s*Final:\s*(.+)/i);
  return match ? match[1].trim() : '';
}

/**
 * 텍스트에서 주제 추출 (결정문 요청 시)
 */
function extractDecisionTopic(text) {
  // "결정문 생성 {주제}" 또는 "@Aurora5 decision {주제}"
  const patterns = [
    /결정문\s*(?:생성|작성|만들어)[줘요]?\s*[:\-]?\s*(.+)/i,
    /decision\s*[:\-]?\s*(.+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/<@[A-Z0-9]+>/g, '').trim();
    }
  }

  return '새 결정 사항';
}

/**
 * 최근 Draft 결정문 ID 조회
 */
async function getLatestDraftId() {
  try {
    const content = await fs.readFile(DECISIONS_LOG_PATH, 'utf8');
    const match = content.match(/## \[(D-\d{8}-\d{3})\][^]*?- Status: Draft/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

module.exports = {
  generateDecisionId,
  createDecisionBlock,
  appendDecisionDraft,
  finalizeDecision,
  isDecisionTrigger,
  isFinalTrigger,
  extractFinalMessage,
  extractDecisionTopic,
  getLatestDraftId,
  DECISIONS_LOG_PATH
};
