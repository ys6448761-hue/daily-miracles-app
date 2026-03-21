/**
 * safetyFilter.js — DreamTown 소원 안전 필터
 *
 * classifyWish(wishText) → { level: 'RED'|'YELLOW'|'GREEN', reason }
 * notifyRedSignal(source, wishText) → Slack 운영 알림 (OPS_SLACK_WEBHOOK)
 *
 * 원본 키워드: routes/wishRoutes.js classifyWish 함수와 동일하게 유지
 * SSOT: 이 파일이 DreamTown + Daily Miracles 공용 필터 정본
 */

const RED_KEYWORDS = [
  '자살', '죽고싶', '죽고 싶', '죽을래', '죽을 래',
  '자해', '손목', '목숨', '끝내고 싶', '끝내고싶',
  '사라지고 싶', '사라지고싶', '없어지고 싶', '없어지고싶',
  '포기하고 싶', '힘들어서 못살', '살기 싫', '살기싫',
];

const YELLOW_KEYWORDS = [
  { keyword: '빚',      category: '재정' },
  { keyword: '대출',    category: '재정' },
  { keyword: '파산',    category: '재정' },
  { keyword: '신용불량', category: '재정' },
  { keyword: '암',      category: '건강' },
  { keyword: '수술',    category: '건강' },
  { keyword: '병원',    category: '건강' },
  { keyword: '치료',    category: '건강' },
  { keyword: '소송',    category: '법적' },
  { keyword: '고소',    category: '법적' },
  { keyword: '합의금',  category: '법적' },
  { keyword: '이혼',    category: '가정' },
  { keyword: '별거',    category: '가정' },
  { keyword: '양육권',  category: '가정' },
  { keyword: '폭력',    category: '위험' },
  { keyword: '학대',    category: '위험' },
];

/**
 * @param {string} wishText
 * @returns {{ level: 'RED'|'YELLOW'|'GREEN', reason: string }}
 */
function classifyWish(wishText) {
  const text = (wishText || '').toLowerCase();

  for (const keyword of RED_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        level:  'RED',
        reason: `위험 키워드 감지: "${keyword}"`,
      };
    }
  }

  for (const item of YELLOW_KEYWORDS) {
    if (text.includes(item.keyword)) {
      return {
        level:  'YELLOW',
        reason: `주의 키워드 감지 (${item.category}): "${item.keyword}"`,
      };
    }
  }

  return { level: 'GREEN', reason: '일반 소원' };
}

/**
 * RED 신호 발생 시 Slack 운영 알림 (fire-and-forget)
 * OPS_SLACK_WEBHOOK 미설정 시 콘솔 경고로 대체
 *
 * @param {string} source  - 'dreamtown' | 'daily-miracles'
 * @param {string} wishText
 * @param {string} reason
 */
async function notifyRedSignal(source, wishText, reason) {
  const webhook = process.env.OPS_SLACK_WEBHOOK;

  const safeText = wishText.length > 30
    ? wishText.slice(0, 30) + '…'
    : wishText;

  const message = [
    `🚨 *[RED 신호] ${source}*`,
    `사유: ${reason}`,
    `소원(앞 30자): \`${safeText}\``,
    `시각: ${new Date().toISOString()}`,
  ].join('\n');

  if (!webhook) {
    console.error('[SafetyFilter] RED signal (no Slack webhook):', reason, '| text:', safeText);
    return;
  }

  try {
    const res = await fetch(webhook, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: message }),
    });
    if (!res.ok) {
      console.error('[SafetyFilter] Slack notify failed:', res.status);
    }
  } catch (err) {
    console.error('[SafetyFilter] Slack notify error:', err.message);
  }
}

module.exports = { classifyWish, notifyRedSignal };
