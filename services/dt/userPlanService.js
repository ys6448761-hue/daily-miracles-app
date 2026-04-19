'use strict';

const db  = require('../../database/db');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('userPlan');

const PLAN_TYPES = ['free', 'lite', 'flow', 'paused'];

// ── Day 8 판별 ────────────────────────────────────────────────────
function isDay8(starCreatedAt) {
  if (!starCreatedAt) return false;
  const diff = Date.now() - new Date(starCreatedAt).getTime();
  const days = Math.floor(diff / 86_400_000);
  return days === 7;
}

// ── 사용자 최신 별 조회 ───────────────────────────────────────────
async function getLatestStar(userId) {
  const { rows } = await db.query(
    `SELECT id, created_at FROM dt_stars WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// ── 현재 플랜 조회 ────────────────────────────────────────────────
async function getPlan(userId) {
  const { rows } = await db.query(
    `SELECT plan_type, plan_started_at, trial_ended_at FROM user_plan_status WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || { plan_type: 'free', plan_started_at: null, trial_ended_at: null };
}

// ── 플랜 업데이트 ─────────────────────────────────────────────────
async function updatePlan(userId, planType) {
  if (!PLAN_TYPES.includes(planType)) throw new Error(`허용되지 않는 plan_type: ${planType}`);

  await db.query(
    `INSERT INTO user_plan_status (user_id, plan_type, plan_started_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET plan_type = EXCLUDED.plan_type,
           plan_started_at = NOW(),
           updated_at = NOW()`,
    [userId, planType]
  );
  log.info('플랜 업데이트', { userId, planType });
}

// ── Day 8 상태 응답 ───────────────────────────────────────────────
async function getDay8Status(userId) {
  const [star, plan] = await Promise.all([getLatestStar(userId), getPlan(userId)]);

  const day8 = star ? isDay8(star.created_at) : false;

  // 이미 플랜 선택한 사용자는 전환 화면 다시 보여주지 않음
  const alreadyChosen = plan.plan_type !== 'free';

  return {
    is_day8:          day8,
    show_transition:  day8 && !alreadyChosen,
    current_plan:     plan.plan_type,
    message:          '이 흐름을 계속 이어가고 싶으신가요',
    options: [
      { type: 'continue', label: '계속 이어가기' },
      { type: 'lite',     label: '가볍게 유지하기' },
      { type: 'pause',    label: '잠시 멈추기' },
    ],
  };
}

// ── Lite 주 2회 제한 ──────────────────────────────────────────────
async function isTwicePerWeek(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS n FROM user_events
     WHERE user_id = $1
       AND event_type = 'care_sent'
       AND created_at >= date_trunc('week', NOW())`,
    [userId]
  );
  return Number(rows[0]?.n) < 2;
}

async function canSendCare(userId) {
  const plan = await getPlan(userId);
  if (plan.plan_type === 'paused') return false;
  if (plan.plan_type === 'lite')   return isTwicePerWeek(userId);
  return true; // free / flow → 제한 없음
}

module.exports = { isDay8, getPlan, updatePlan, getDay8Status, canSendCare, getLatestStar };
