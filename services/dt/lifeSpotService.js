'use strict';

const db = require('../../database/db');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('lifeSpotService');

const ALLOWED_TYPES = ['home', 'work', 'cafe', 'outdoor', 'transit', 'other'];

// ── 장소 등록 ──────────────────────────────────────────────────────
async function createSpot({ userId, spotName, spotType, isFavorite = false }) {
  if (!ALLOWED_TYPES.includes(spotType)) spotType = 'other';
  const { rows } = await db.query(
    `INSERT INTO life_spots (user_id, spot_name, spot_type, is_favorite)
     VALUES ($1, $2, $3, $4)
     RETURNING id, spot_name, spot_type, is_favorite, visit_count, created_at`,
    [userId, spotName, spotType, isFavorite]
  );
  return rows[0];
}

// ── 장소 목록 ──────────────────────────────────────────────────────
async function listSpots(userId) {
  const { rows } = await db.query(
    `SELECT id, spot_name, spot_type, is_favorite, visit_count, last_visited_at
     FROM life_spots
     WHERE user_id = $1
     ORDER BY is_favorite DESC, visit_count DESC, created_at DESC`,
    [userId]
  );
  return rows;
}

// ── 장소 단건 조회 (엔진 컨텍스트용) ─────────────────────────────
async function getSpotContext({ userId, lifeSpotId }) {
  if (!userId || !lifeSpotId) return null;
  try {
    const { rows } = await db.query(
      `SELECT id, spot_name, spot_type, emotion_pattern, visit_count
       FROM life_spots
       WHERE id = $1 AND user_id = $2`,
      [lifeSpotId, userId]
    );
    return rows[0] || null;
  } catch (err) {
    log.warn('장소 조회 실패 (엔진 계속)', { err: err.message });
    return null;
  }
}

// ── 방문 로그 저장 + star_daily_log 자동 연결 ────────────────────
async function saveLog({ userId, spotId, engineResult, questionAnswer = null, sourceType = 'daily' }) {
  const { state, scene, action, direction, growth, question } = engineResult;
  let insertedId = null;
  try {
    const { rows } = await db.query(
      `INSERT INTO life_spot_logs
         (user_id, spot_id, state, scene, action, direction,
          emotion_signal, help_tag, growth_sentence,
          question_type, question_answer, source_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        userId, spotId, state, scene, action, direction,
        growth.emotion_signal, growth.help_tag, growth.growth_sentence,
        question?.type ?? null, questionAnswer, sourceType,
      ]
    );
    insertedId = rows[0]?.id;
  } catch (err) {
    log.warn('life_spot_log 저장 실패 (응답 계속)', { err: err.message });
    return;
  }

  // star_daily_log 자동 생성 (비동기, 실패해도 무시)
  if (insertedId) {
    try {
      const traj = require('./starTrajectoryService');
      const starId = await traj.getActiveStarId(userId);
      if (starId) {
        await traj.createStarDailyLog({
          userId, starId,
          spotLog: { id: insertedId, spot_id: spotId, state, ...growth },
        });
        traj.refreshTimelineSummary(starId).catch(() => {});
      }
    } catch (err) {
      log.warn('star_daily_log 자동 생성 실패 (계속)', { err: err.message });
    }
  }
}

// ── 방문 통계 업데이트 ────────────────────────────────────────────
async function touchSpot(spotId) {
  try {
    await db.query(
      `UPDATE life_spots
       SET visit_count = visit_count + 1, last_visited_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [spotId]
    );
  } catch (err) {
    log.warn('life_spots 방문 업데이트 실패', { err: err.message });
  }
}

module.exports = { createSpot, listSpots, getSpotContext, saveLog, touchSpot, ALLOWED_TYPES };
