/**
 * kWisdomAgent.js — P0 고도화 (행동 유도 타이밍 개입 엔진)
 *
 * 출력 구조: { insight, action, timing_reason }
 * 3개 시나리오:
 *   day3_no_activity   → 3일 무활동 개입
 *   stuck_pattern      → 선택 반복/정체
 *   emotion_drop       → 감정 하락 감지
 *
 * SSOT 원칙:
 *   일반 명언 금지 / 범용 문장 금지
 *   반드시 "왜 지금 이 문장인지" 설명 가능한 구조
 *   insight + action 세트로 제공
 */

const db = require('../../../database/db');
const { OpenAI } = require('openai');
const logService = require('../logService');
const { makeLogger } = require('../../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const log = makeLogger('kWisdomAgent');

// ── 시나리오 감지 ──────────────────────────────────────────────
async function detectScenario(starId, input = {}) {
  const { phase } = input;

  // 최근 7일 로그
  const recentLogs = await db.query(
    `SELECT log_type, created_at FROM dt_dream_logs
     WHERE star_id=$1 AND created_at >= NOW() - INTERVAL '7 days'
     ORDER BY created_at DESC`,
    [starId]
  );
  const logs = recentLogs.rows;

  // 최근 선택 패턴 (중복 choice_type 체크)
  const recentChoices = await db.query(
    `SELECT choice_type FROM dt_choice_logs
     WHERE star_id=$1 AND created_at >= NOW() - INTERVAL '7 days'
     ORDER BY created_at DESC LIMIT 10`,
    [starId]
  );
  const choiceTypes = recentChoices.rows.map(r => r.choice_type);
  const isStuck = choiceTypes.length >= 3 &&
    new Set(choiceTypes.slice(0, 3)).size === 1;  // 같은 선택 3번 반복

  // 활동량
  const nonSystemLogs = logs.filter(l => !['origin','artifact','care'].includes(l.log_type));
  const activityCount = nonSystemLogs.length;
  const daysSinceLast = logs.length > 0
    ? Math.floor((Date.now() - new Date(logs[0].created_at)) / 86400000)
    : 7;

  // 시나리오 결정 (우선순위 순)
  if (activityCount === 0 || daysSinceLast >= 3) return 'day3_no_activity';
  if (isStuck) return 'stuck_pattern';
  return 'emotion_drop';  // default: 감정 관리 필요
}

// ── 시나리오별 프롬프트 ──────────────────────────────────────────
function buildPrompt(scenario, wishText, starName) {
  const contextMap = {
    day3_no_activity: `이 사람은 3일 동안 소원꿈터에 접속하지 않았습니다. 무언가에 막혀 멈춰있을 수 있습니다.`,
    stuck_pattern:    `이 사람은 같은 선택을 반복하고 있습니다. 무언가에 갇혀있는 패턴이 보입니다.`,
    emotion_drop:     `이 사람의 활동이 줄어들고 있습니다. 지속하기 어려운 감정 상태일 수 있습니다.`,
  };

  const context = contextMap[scenario];

  return `당신은 Aurora5입니다. 한국의 깊은 지혜로 소원이의 여정에 개입합니다.

별 이름: ${starName}
소원: "${wishText}"
상황: ${context}

지금 이 사람에게 정확히 필요한 개입 메시지를 JSON으로 작성하세요.

규칙:
- insight: 이 상황을 꿰뚫는 통찰 (1-2문장, 일반 명언 금지, 반드시 이 소원/상황에 맞게)
- action: 지금 당장 할 수 있는 행동 1개 (구체적, 1분 이내 가능한 것)
- timing_reason: 왜 지금 이 개입인지 (${scenario})

JSON 형식:
{
  "insight": "...",
  "action": "...",
  "timing_reason": "${scenario}"
}`;
}

// ── 메인 실행 ──────────────────────────────────────────────────
async function run(starId, input = {}) {
  const { phase = 'week' } = input;

  // 별 + 소원 조회
  const starResult = await db.query(
    `SELECT s.star_name, w.wish_text
     FROM dt_stars s JOIN dt_wishes w ON s.wish_id = w.id
     WHERE s.id = $1`,
    [starId]
  );
  const star     = starResult.rows[0];
  const starName = star?.star_name || '이름 없는 별';
  const wishText = star?.wish_text  || '';

  // 시나리오 감지
  const scenario = await detectScenario(starId, input);
  const prompt   = buildPrompt(scenario, wishText, starName);

  // GPT 구조화 출력
  const res = await openai.chat.completions.create({
    model:           'gpt-4.1-mini',
    messages:        [{ role: 'user', content: prompt }],
    max_tokens:      300,
    temperature:     0.8,
    response_format: { type: 'json_object' },
  });

  let structured = { insight: '', action: '', timing_reason: scenario };
  try {
    structured = JSON.parse(res.choices[0].message.content);
    structured.timing_reason = structured.timing_reason || scenario;
  } catch {
    structured.insight = res.choices[0].message.content.trim();
  }

  // ── dt_wisdom_logs 저장 ────────────────────────────────────
  const wisdomResult = await db.query(
    `INSERT INTO dt_wisdom_logs (star_id, content, phase, aurora5_prompt)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      starId,
      `[${structured.timing_reason}]\n${structured.insight}\n👉 ${structured.action}`,
      phase,
      `scenario=${scenario}`,
    ]
  );
  const wisdomId = wisdomResult.rows[0].id;

  // ── dt_dream_logs 기록 (log_type='wisdom') ────────────────
  await logService.createLog(starId, 'wisdom', {
    wisdom_id:     wisdomId,
    scenario,
    insight:       structured.insight,
    action:        structured.action,
    timing_reason: structured.timing_reason,
    phase,
  });

  log.info('K-Wisdom 개입 완료', { star_id: starId, scenario, wisdom_id: wisdomId });

  return {
    wisdom_id:     wisdomId,
    insight:       structured.insight,
    action:        structured.action,
    timing_reason: structured.timing_reason,
    scenario,
    phase,
  };
}

module.exports = { run };
