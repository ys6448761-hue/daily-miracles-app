/**
 * notificationService.js
 * 인앱 알림 서비스
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/notificationService: DB 로드 실패:', error.message);
}

/**
 * 알림 생성
 */
async function createNotification(userId, { type, title, body, data = {} }) {
  if (!db) {
    console.warn('⚠️ 알림 생성 실패: DB 없음');
    return null;
  }

  const result = await db.query(`
    INSERT INTO harbor_notifications (user_id, type, title, body, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [userId, type, title, body, JSON.stringify(data)]);

  console.log(`🔔 알림 생성: user=${userId}, type=${type}`);
  return result.rows[0];
}

/**
 * 알림 목록 조회
 */
async function getNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
  if (!db) return [];

  let query = `
    SELECT * FROM harbor_notifications
    WHERE user_id = $1
  `;

  if (unreadOnly) {
    query += ' AND is_read = false';
  }

  query += ' ORDER BY created_at DESC LIMIT $2';

  const result = await db.query(query, [userId, limit]);
  return result.rows;
}

/**
 * 알림 읽음 처리
 */
async function markAsRead(notificationId, userId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const result = await db.query(`
    UPDATE harbor_notifications
    SET is_read = true
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `, [notificationId, userId]);

  return result.rows[0];
}

/**
 * 모든 알림 읽음 처리
 */
async function markAllAsRead(userId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const result = await db.query(`
    UPDATE harbor_notifications
    SET is_read = true
    WHERE user_id = $1 AND is_read = false
  `, [userId]);

  return result.rowCount;
}

/**
 * 읽지 않은 알림 개수
 */
async function getUnreadCount(userId) {
  if (!db) return 0;

  const result = await db.query(`
    SELECT COUNT(*) FROM harbor_notifications
    WHERE user_id = $1 AND is_read = false
  `, [userId]);

  return parseInt(result.rows[0]?.count || 0, 10);
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
