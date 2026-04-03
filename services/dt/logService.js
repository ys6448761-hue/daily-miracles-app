/**
 * services/dt/logService.js
 * dt_dream_logs 중앙 이벤트 원장 기록 전담
 * Rule 2: 모든 이벤트는 여기에도 기록된다
 */

const db = require('../../database/db');

async function createLog(starId, logType, payload = {}) {
  const result = await db.query(
    `INSERT INTO dt_dream_logs (star_id, log_type, payload)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [starId, logType, JSON.stringify(payload)]
  );
  return result.rows[0].id;
}

async function getLogs(starId, limit = 100) {
  const result = await db.query(
    `SELECT id, log_type, payload, created_at
     FROM dt_dream_logs
     WHERE star_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [starId, limit]
  );
  return result.rows;
}

module.exports = { createLog, getLogs };
