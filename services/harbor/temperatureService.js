/**
 * temperatureService.js
 * 온도 엔진 (메인 리텐션 메커니즘)
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/temperatureService: DB 로드 실패:', error.message);
}

const notificationService = require('./notificationService');

// 온도 변화 규칙
const TEMP_RULES = {
  fire_send: +0.3,       // 🔥 보내기
  fire_receive: +0.5,    // 🔥 받기
  me_too_receive: +0.3,  // 🤝 받기
  comment_receive: +0.5, // 댓글 받기
  daily_visit: +0.1,     // 하루 1회 방문
  decay: -0.5            // 24h 미접속당
};

const TEMP_MIN = 20.0;
const TEMP_MAX = 40.0;

// 마일스톤 (텍스트 알림)
const MILESTONES = [
  { temp: 30, title: '🌡️ 온도 30도 돌파!', body: '당신의 소원에 따뜻한 바람이 불어요' },
  { temp: 33, title: '🔥 온도 33도!', body: '소원이 점점 뜨거워지고 있어요' },
  { temp: 36.5, title: '💫 체온에 도달!', body: '소원이 당신의 일부가 되었어요' },
  { temp: 37.5, title: '✨ 열정의 온도!', body: '소원이 현실로 다가오고 있어요' }
];

/**
 * 온도 변화 적용
 */
async function applyTemperatureChange(userId, wishId, reason) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const delta = TEMP_RULES[reason];
  if (delta === undefined) {
    throw new Error(`INVALID_REASON: ${reason}`);
  }

  // 1. 온도 로그 기록
  await db.query(`
    INSERT INTO temperature_logs (user_id, wish_id, delta, reason)
    VALUES ($1, $2, $3, $4)
  `, [userId, wishId, delta, reason]);

  // 2. 사용자 온도 업데이트
  const result = await db.query(`
    UPDATE users_anon
    SET temperature = GREATEST($1, LEAST($2, temperature + $3))
    WHERE id = $4
    RETURNING temperature
  `, [TEMP_MIN, TEMP_MAX, delta, userId]);

  const newTemp = parseFloat(result.rows[0]?.temperature || 25.0);

  console.log(`🌡️ 온도 변화: user=${userId}, delta=${delta > 0 ? '+' : ''}${delta}, reason=${reason}, new=${newTemp}`);

  // 3. 마일스톤 체크
  await checkMilestone(userId, newTemp, delta);

  return newTemp;
}

/**
 * 마일스톤 체크 및 알림
 */
async function checkMilestone(userId, newTemp, delta) {
  if (delta <= 0) return; // 하락 시 마일스톤 체크 안 함

  for (const milestone of MILESTONES) {
    // 이번 변화로 마일스톤을 통과했는지 확인
    const prevTemp = newTemp - delta;
    if (prevTemp < milestone.temp && newTemp >= milestone.temp) {
      console.log(`🎉 마일스톤 도달: user=${userId}, temp=${milestone.temp}`);

      await notificationService.createNotification(userId, {
        type: 'milestone',
        title: milestone.title,
        body: milestone.body,
        data: { temperature: newTemp, milestone: milestone.temp }
      });
    }
  }
}

/**
 * 일일 방문 온도 적용 (중복 방지)
 */
async function applyDailyVisit(userId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const today = new Date().toISOString().split('T')[0];

  // 오늘 이미 방문 기록이 있는지 확인
  const existing = await db.query(`
    SELECT id FROM temperature_logs
    WHERE user_id = $1 AND reason = 'daily_visit'
      AND created_at::date = $2
    LIMIT 1
  `, [userId, today]);

  if (existing.rows.length > 0) {
    return null; // 이미 오늘 방문 기록 있음
  }

  return await applyTemperatureChange(userId, null, 'daily_visit');
}

/**
 * 냉각(Decay) 처리 - 24h 미접속 시
 * (배치 작업 또는 접속 시 호출)
 */
async function applyDecay(userId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  // 마지막 활동 시간 조회
  const user = await db.query(
    'SELECT last_active_at, temperature FROM users_anon WHERE id = $1',
    [userId]
  );

  if (!user.rows[0] || !user.rows[0].last_active_at) {
    return null;
  }

  const lastActive = new Date(user.rows[0].last_active_at);
  const now = new Date();
  const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);

  // 24시간 미접속 시 -0.5/일 적용
  const daysInactive = Math.floor(hoursSinceActive / 24);

  if (daysInactive < 1) {
    return null;
  }

  // 최대 냉각량 계산 (하한 20.0까지)
  const currentTemp = parseFloat(user.rows[0].temperature);
  const maxDecay = currentTemp - TEMP_MIN;
  const decayAmount = Math.min(daysInactive * 0.5, maxDecay);

  if (decayAmount <= 0) {
    return currentTemp;
  }

  // 냉각 로그 기록
  await db.query(`
    INSERT INTO temperature_logs (user_id, wish_id, delta, reason)
    VALUES ($1, NULL, $2, 'decay')
  `, [userId, -decayAmount]);

  // 온도 업데이트
  const result = await db.query(`
    UPDATE users_anon
    SET temperature = GREATEST($1, temperature - $2)
    WHERE id = $3
    RETURNING temperature
  `, [TEMP_MIN, decayAmount, userId]);

  console.log(`❄️ 냉각 적용: user=${userId}, days=${daysInactive}, decay=-${decayAmount}`);

  return parseFloat(result.rows[0]?.temperature);
}

/**
 * 온도 로그 조회
 */
async function getTemperatureLogs(userId, limit = 20) {
  if (!db) return [];

  const result = await db.query(`
    SELECT * FROM temperature_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [userId, limit]);

  return result.rows;
}

module.exports = {
  TEMP_RULES,
  TEMP_MIN,
  TEMP_MAX,
  MILESTONES,
  applyTemperatureChange,
  applyDailyVisit,
  applyDecay,
  getTemperatureLogs
};
