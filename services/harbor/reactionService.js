/**
 * reactionService.js
 * 반응 처리 (🔥 FIRE, 🤝 ME_TOO)
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/reactionService: DB 로드 실패:', error.message);
}

const temperatureService = require('./temperatureService');
const notificationService = require('./notificationService');

// 유효한 반응 타입
const VALID_REACTIONS = ['FIRE', 'ME_TOO'];

/**
 * 반응 추가
 */
async function addReaction(wishId, userId, reactionType) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  // 유효성 검사
  if (!VALID_REACTIONS.includes(reactionType)) {
    throw new Error('INVALID_REACTION_TYPE');
  }

  // 소원 조회
  const wish = await db.query(
    'SELECT user_id, content FROM harbor_wishes WHERE id = $1',
    [wishId]
  );

  if (!wish.rows[0]) {
    throw new Error('WISH_NOT_FOUND');
  }

  const wishOwnerId = wish.rows[0].user_id;

  // 자기 소원에 반응 불가
  if (wishOwnerId === userId) {
    throw new Error('CANNOT_REACT_OWN_WISH');
  }

  // 중복 반응 체크 (UNIQUE 제약에 의해 DB에서도 막힘)
  const existing = await db.query(`
    SELECT id FROM harbor_reactions
    WHERE wish_id = $1 AND user_id = $2 AND reaction_type = $3
  `, [wishId, userId, reactionType]);

  if (existing.rows.length > 0) {
    throw new Error('ALREADY_REACTED');
  }

  // 반응 저장
  const result = await db.query(`
    INSERT INTO harbor_reactions (wish_id, user_id, reaction_type)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [wishId, userId, reactionType]);

  // 온도 변화 적용
  // 보내는 사람: fire_send
  if (reactionType === 'FIRE') {
    await temperatureService.applyTemperatureChange(userId, wishId, 'fire_send');
  }

  // 받는 사람: fire_receive 또는 me_too_receive
  const receiveReason = reactionType === 'FIRE' ? 'fire_receive' : 'me_too_receive';
  await temperatureService.applyTemperatureChange(wishOwnerId, wishId, receiveReason);

  // 알림 생성
  const reactionEmoji = reactionType === 'FIRE' ? '🔥' : '🤝';
  const reactionName = reactionType === 'FIRE' ? '응원' : '나도';

  await notificationService.createNotification(wishOwnerId, {
    type: 'reaction',
    title: `${reactionEmoji} ${reactionName} 반응이 왔어요!`,
    body: `누군가 당신의 소원에 ${reactionName} 반응을 남겼어요.`,
    data: { wishId, reactionType }
  });

  console.log(`${reactionEmoji} 반응: wish=${wishId}, type=${reactionType}, from=${userId}`);

  return result.rows[0];
}

/**
 * 반응 취소
 */
async function removeReaction(wishId, userId, reactionType) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const result = await db.query(`
    DELETE FROM harbor_reactions
    WHERE wish_id = $1 AND user_id = $2 AND reaction_type = $3
    RETURNING *
  `, [wishId, userId, reactionType]);

  return result.rows[0] || null;
}

/**
 * 소원의 반응 조회
 */
async function getReactions(wishId) {
  if (!db) return { FIRE: 0, ME_TOO: 0, total: 0 };

  const result = await db.query(`
    SELECT reaction_type, COUNT(*) as count
    FROM harbor_reactions
    WHERE wish_id = $1
    GROUP BY reaction_type
  `, [wishId]);

  const counts = { FIRE: 0, ME_TOO: 0 };
  result.rows.forEach(row => {
    counts[row.reaction_type] = parseInt(row.count, 10);
  });

  return {
    ...counts,
    total: counts.FIRE + counts.ME_TOO
  };
}

/**
 * 사용자가 해당 소원에 반응했는지 확인
 */
async function getUserReactions(wishId, userId) {
  if (!db) return [];

  const result = await db.query(`
    SELECT reaction_type FROM harbor_reactions
    WHERE wish_id = $1 AND user_id = $2
  `, [wishId, userId]);

  return result.rows.map(r => r.reaction_type);
}

module.exports = {
  VALID_REACTIONS,
  addReaction,
  removeReaction,
  getReactions,
  getUserReactions
};
