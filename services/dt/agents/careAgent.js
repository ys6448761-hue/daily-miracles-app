/**
 * careAgent.js — P0 고도화 (이탈 방지 개입 엔진)
 *
 * 메시지 유형: empathy | direction | restart
 * 발송: SMS (phone 있을 때) / app_only (없을 때)
 * 기록: dt_dream_logs (log_type='care') + dt_agent_runs
 *
 * SSOT 톤:
 *   짧게 / 따뜻하게 / 판단 금지 / 죄책감 유발 금지
 *   "다시 시작할 수 있다"는 느낌 유지
 */

const db = require('../../../database/db');
const { OpenAI } = require('openai');
const { sendSensSMS } = require('../../../services/messageProvider');
const logService = require('../logService');
const { makeLogger } = require('../../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const log = makeLogger('careAgent');

// ── 맥락 기반 메시지 유형 선택 ─────────────────────────────────
function selectMessageType(context) {
  const { activityCount, choiceCount, hasWisdom, day } = context;

  if (activityCount === 0) return 'restart';           // 아예 아무것도 안 한 경우
  if (choiceCount === 0 && !hasWisdom) return 'empathy'; // 들어왔지만 선택/지혜 없음
  return 'direction';                                   // 활동은 있지만 멈춘 경우
}

// ── 유형별 system prompt ────────────────────────────────────────
const SYSTEM_PROMPTS = {
  empathy:   `당신은 Aurora5입니다. 소원이가 조금 멈춰있을 때, 공감의 말을 전합니다.
규칙: 짧게(2-3문장) / 따뜻하게 / 판단 금지 / 죄책감 유발 금지
예시 톤: "멈춘 것처럼 보여도, 여정은 사라지지 않았습니다."`,

  direction: `당신은 Aurora5입니다. 소원이에게 다음 방향을 조용히 가리켜 줍니다.
규칙: 짧게(2-3문장) / 따뜻하게 / 지시적이지 않게
예시 톤: "속도보다 방향이 더 중요할 때가 있습니다."`,

  restart:   `당신은 Aurora5입니다. 소원이에게 다시 시작해도 괜찮다는 메시지를 전합니다.
규칙: 짧게(2-3문장) / 따뜻하게 / "다시 시작"을 부담 없이
예시 톤: "오늘은 다시 시작하기에 충분한 날입니다."`,
};

// ── Day1~6 고정 메시지 (GPT 불필요) ────────────────────────────
const DAILY_TEMPLATES = {
  welcome: (n) =>
    `✨ ${n}이(가) 별로 태어났어요.\n소원꿈터에서 조용히 빛나고 있습니다.\n오늘 하루, 소원을 한 번 떠올려보세요.`,
  daily: (n, d) =>
    `🌟 ${n} Day${d}\n어제보다 조금 더 나아가고 있어요.\n오늘도 소원꿈터에서 함께합니다.`,
  checkin: (n) =>
    `🌙 ${n}의 소원이 기다리고 있어요.\n잠깐 들어와 기록을 남겨보세요.`,
  welcome_paid: (n) =>
    `🎉 ${n}의 1년 여정이 시작됐습니다.\n매일의 기록이 쌓여 하나의 이야기가 될 거예요.`,
};

// ── 맥락 수집 ──────────────────────────────────────────────────
async function gatherContext(starId) {
  const [logs, wisdom, choices] = await Promise.all([
    db.query(
      `SELECT log_type FROM dt_dream_logs
       WHERE star_id=$1 AND log_type NOT IN ('origin','artifact')
         AND created_at >= NOW() - INTERVAL '7 days'`,
      [starId]
    ),
    db.query(
      `SELECT id FROM dt_wisdom_logs WHERE star_id=$1 LIMIT 1`,
      [starId]
    ),
    db.query(
      `SELECT id FROM dt_choice_logs WHERE star_id=$1 LIMIT 1`,
      [starId]
    ),
  ]);
  return {
    activityCount: logs.rows.length,
    hasWisdom:     wisdom.rows.length > 0,
    choiceCount:   choices.rows.length,
  };
}

// ── GPT 개입 메시지 생성 ────────────────────────────────────────
async function generateInterventionMessage(wishText, starName, messageType, day) {
  const system = SYSTEM_PROMPTS[messageType];
  const userPrompt =
    `소원이의 별 이름: ${starName}\n` +
    `소원: "${wishText}"\n` +
    `현재 Day: ${day}\n\n` +
    `위 소원이에게 맞는 ${messageType} 메시지를 2-3문장으로 작성해주세요. ` +
    `메시지 텍스트만 출력하세요.`;

  const res = await openai.chat.completions.create({
    model:       'gpt-4.1-mini',
    messages:    [
      { role: 'system', content: system },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens:  150,
    temperature: 0.85,
  });
  return res.choices[0].message.content.trim();
}

// ── 메인 실행 ──────────────────────────────────────────────────
async function run(starId, input = {}) {
  const { day = 1, mode = 'daily' } = input;

  // 별 + 소원 조회
  const starResult = await db.query(
    `SELECT s.star_name, w.wish_text
     FROM dt_stars s JOIN dt_wishes w ON s.wish_id = w.id
     WHERE s.id = $1`,
    [starId]
  );
  const star     = starResult.rows[0];
  const starName = star?.star_name || '별';
  const wishText = star?.wish_text  || '';

  // 전화번호 조회
  const phoneResult = await db.query(
    `SELECT phone_number FROM dt_voyage_schedule
     WHERE star_id=$1 AND phone_number IS NOT NULL LIMIT 1`,
    [starId]
  );
  const phone = phoneResult.rows[0]?.phone_number || null;

  // ── 개입 모드: GPT 생성 ────────────────────────────────────
  let messageType = null;
  let messageText = '';
  let reason      = mode;

  const isIntervention = ['intervention', 'checkin'].includes(mode) ||
    (mode === 'daily' && day === 3);

  if (isIntervention) {
    const context = await gatherContext(starId);
    context.day   = day;
    messageType   = selectMessageType(context);
    reason        = day === 3 ? 'day3_intervention' : `${mode}_intervention`;
    messageText   = await generateInterventionMessage(wishText, starName, messageType, day);
  } else {
    // 고정 템플릿 모드 (welcome/daily/welcome_paid)
    const fn = DAILY_TEMPLATES[mode] || DAILY_TEMPLATES.daily;
    messageText = fn(starName, day);
    messageType = 'template';
    reason      = mode;
  }

  // ── SMS 발송 ───────────────────────────────────────────────
  let sent    = false;
  let channel = 'app_only';

  if (phone) {
    try {
      await sendSensSMS(phone, messageText);
      sent    = true;
      channel = 'sms';
    } catch (err) {
      log.warn('SMS 실패 — 기록만', { star_id: starId, error: err.message });
    }
  }

  // ── dream_log 기록 (log_type='care') ──────────────────────
  await logService.createLog(starId, 'care', {
    message_type: messageType,
    message_text: messageText,
    reason,
    day,
    sent,
    channel,
  });

  log.info('care 메시지 처리', { star_id: starId, type: messageType, mode, day, sent });

  return {
    message_type: messageType,
    message_text: messageText,
    reason,
    sent,
    channel,
    star_name: starName,
  };
}

module.exports = { run };
