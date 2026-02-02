/**
 * userService.js
 * 익명 사용자 관리 서비스
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/userService: DB 로드 실패:', error.message);
}

/**
 * 익명 사용자 생성 또는 조회 (bootstrap)
 */
async function bootstrapUser(deviceId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  // 기존 사용자 조회
  const existing = await db.query(
    'SELECT * FROM users_anon WHERE device_id = $1',
    [deviceId]
  );

  if (existing.rows.length > 0) {
    // last_active_at 업데이트
    await db.query(
      'UPDATE users_anon SET last_active_at = NOW() WHERE id = $1',
      [existing.rows[0].id]
    );
    return { user: existing.rows[0], isNew: false };
  }

  // 신규 사용자 생성
  const result = await db.query(`
    INSERT INTO users_anon (device_id, last_active_at)
    VALUES ($1, NOW())
    RETURNING *
  `, [deviceId]);

  console.log(`✅ 신규 익명 사용자 생성: ${result.rows[0].id}`);
  return { user: result.rows[0], isNew: true };
}

/**
 * 사용자 조회
 */
async function getUserById(userId) {
  if (!db) return null;

  const result = await db.query(
    'SELECT * FROM users_anon WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * 사용자 활동 기록 (last_active_at 업데이트)
 */
async function recordActivity(userId) {
  if (!db) return;

  await db.query(
    'UPDATE users_anon SET last_active_at = NOW() WHERE id = $1',
    [userId]
  );
}

/**
 * 닉네임 설정
 */
async function setNickname(userId, nickname) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  if (nickname && nickname.length > 20) {
    throw new Error('NICKNAME_TOO_LONG');
  }

  const result = await db.query(`
    UPDATE users_anon SET nickname = $1 WHERE id = $2 RETURNING *
  `, [nickname, userId]);

  return result.rows[0];
}

/**
 * 온도 조회
 */
async function getTemperature(userId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const result = await db.query(
    'SELECT temperature FROM users_anon WHERE id = $1',
    [userId]
  );

  return result.rows[0]?.temperature || 25.0;
}

module.exports = {
  bootstrapUser,
  getUserById,
  recordActivity,
  setNickname,
  getTemperature
};
