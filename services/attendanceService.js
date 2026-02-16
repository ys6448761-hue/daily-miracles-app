/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Attendance Service — Living Wisdom 출석 + 체온 시스템
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DB SSOT:
 *   attendance_events  → 출석 이벤트 원장 (open 하루 1회 unique)
 *   temperature_state  → 유저별 체온/스트릭 캐시
 *
 * 체온 규칙:
 *   - open: +0.05 (기본)
 *   - streak 3일: +0.05 보너스
 *   - streak 7일: +0.10 보너스
 *   - streak 14일: +0.20 보너스
 *   - pay_success: +0.10
 *
 * @since 2026-02-14
 */

const db = require('../database/db');
const { getKSTDateString, getKSTYesterday } = require('../utils/kstDate');

// pointService — tolerant loading (포인트 미연동 시에도 출석은 동작)
let pointService = null;
try {
  pointService = require('./pointService');
} catch (e) {
  console.warn('⚠️ [Attendance] pointService 로드 실패 — 포인트 적립 비활성:', e.message);
}

// ─────────────────────────────────────────────────────
// 스트릭 보너스 테이블
// ─────────────────────────────────────────────────────
const STREAK_BONUSES = [
  { days: 14, bonus: 0.20 },
  { days:  7, bonus: 0.10 },
  { days:  3, bonus: 0.05 },
];

const BASE_OPEN_TEMP = 0.05;
const PAY_SUCCESS_TEMP = 0.10;
const DEFAULT_TEMP = 36.5;

/**
 * 출석 ping 처리
 * @param {string} userId - Wix 유저 ID
 * @param {string} eventType - 'open' | 'pay_success'
 * @param {string} [page] - 페이지명
 * @returns {{ ok: boolean, duplicate?: boolean, streak?: number, temperature?: number, pointsEarned?: number }}
 */
async function ping(userId, eventType, page) {
  const today = getKSTDateString();

  // 1) 이벤트 기록
  try {
    await db.query(
      `INSERT INTO attendance_events (user_id, event_type, event_date, page)
       VALUES ($1, $2, $3, $4)`,
      [userId, eventType, today, page || null]
    );
  } catch (err) {
    // open 중복 → unique constraint violation
    if (err.code === '23505' && eventType === 'open') {
      const state = await getState(userId);
      return { ok: true, duplicate: true, ...state };
    }
    throw err;
  }

  // 2) 이벤트 타입별 상태 업데이트
  if (eventType === 'open') {
    return await handleOpen(userId, today);
  }

  if (eventType === 'pay_success') {
    return await handlePaySuccess(userId);
  }

  return { ok: true };
}

/**
 * open 이벤트 처리: 스트릭 + 체온 계산 + 포인트 적립
 */
async function handleOpen(userId, today) {
  const stateRes = await db.query(
    `SELECT temperature, streak, last_open_date FROM temperature_state WHERE user_id = $1`,
    [userId]
  );

  let streak = 1;
  let temperature = DEFAULT_TEMP;

  if (stateRes.rowCount > 0) {
    const prev = stateRes.rows[0];
    const lastDate = prev.last_open_date
      ? getKSTDateString(prev.last_open_date)
      : null;

    const yesterday = getKSTYesterday();

    if (lastDate === yesterday) {
      // 연속 출석
      streak = prev.streak + 1;
    } else if (lastDate === today) {
      // 같은 날 중복 (unique constraint 통과한 경우 — pay_success 후 open 등)
      streak = prev.streak;
    }
    // else: 이틀+ 공백 → streak 1로 리셋

    temperature = Number(prev.temperature) + BASE_OPEN_TEMP;
  }

  // 스트릭 보너스 (해당 마일스톤 도달 시 1회 적용)
  for (const { days, bonus } of STREAK_BONUSES) {
    if (streak === days) {
      temperature += bonus;
      break;
    }
  }

  // UPSERT temperature_state
  await db.query(
    `INSERT INTO temperature_state (user_id, temperature, streak, last_open_date, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       temperature = $2,
       streak = $3,
       last_open_date = $4,
       updated_at = NOW()`,
    [userId, temperature, streak, today]
  );

  // 포인트 적립 (신규 open만, 중복은 ping()에서 이미 리턴)
  let pointsEarned = 0;
  if (pointService) {
    try {
      const pr = await pointService.earnPoints({
        subjectType: 'user',
        subjectId: userId,
        eventType: pointService.EVENT_TYPES.EARN_CHECKIN,
        amount: 50,
        category: 'checkin',
        referenceType: 'attendance',
        referenceId: `attendance-open-${today}`,
        description: '출석 체온 보상',
      });
      if (pr.success) {
        pointsEarned = pr.amount;
        console.log(`✅ [Attendance→Point] ${userId} +${pr.amount}P`);
      }
    } catch (e) {
      console.error('⚠️ [Attendance→Point] 적립 실패 (출석은 정상):', e.message);
    }
  }

  return { ok: true, streak, temperature: Number(temperature.toFixed(2)), pointsEarned };
}

/**
 * pay_success 이벤트 처리: 체온만 증가
 */
async function handlePaySuccess(userId) {
  await db.query(
    `INSERT INTO temperature_state (user_id, temperature, streak, updated_at)
     VALUES ($1, $2, 0, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       temperature = temperature_state.temperature + $3,
       updated_at = NOW()`,
    [userId, DEFAULT_TEMP + PAY_SUCCESS_TEMP, PAY_SUCCESS_TEMP]
  );

  const state = await getState(userId);
  return { ok: true, ...state };
}

/**
 * 유저 상태 조회
 */
async function getState(userId) {
  const res = await db.query(
    `SELECT temperature, streak, last_open_date FROM temperature_state WHERE user_id = $1`,
    [userId]
  );

  if (res.rowCount === 0) {
    return { streak: 0, temperature: DEFAULT_TEMP };
  }

  const row = res.rows[0];
  return {
    streak: row.streak,
    temperature: Number(Number(row.temperature).toFixed(2)),
  };
}

module.exports = { ping, getState };
