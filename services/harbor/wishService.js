/**
 * wishService.js
 * 소원 CRUD + 신호등 시스템
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/wishService: DB 로드 실패:', error.message);
}

// 신호등 키워드 규칙
const TRAFFIC_LIGHT_RULES = {
  RED: [
    '자살', '죽고', '죽을', '살인', '폭력', '마약',
    '주민번호', '계좌번호', '비밀번호'
  ],
  YELLOW: [
    '병원', '의사', '약', '법원', '변호사', '소송',
    '우울', '힘들어', '괴로워', '무섭', '불안'
  ]
};

// 유효한 항로
const VALID_ROUTES = ['love', 'career', 'health', 'money', 'family', 'self', 'other'];

/**
 * 신호등 분류
 */
function classifyTrafficLight(content) {
  const lowerContent = content.toLowerCase();

  for (const keyword of TRAFFIC_LIGHT_RULES.RED) {
    if (lowerContent.includes(keyword)) {
      return 'RED';
    }
  }

  for (const keyword of TRAFFIC_LIGHT_RULES.YELLOW) {
    if (lowerContent.includes(keyword)) {
      return 'YELLOW';
    }
  }

  return 'GREEN';
}

/**
 * 소원 작성
 */
async function createWish(userId, { content, route, visibility = 'public' }) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  // 유효성 검사
  if (!content || content.length === 0) {
    throw new Error('CONTENT_REQUIRED');
  }
  if (content.length > 80) {
    throw new Error('CONTENT_TOO_LONG');
  }
  if (!VALID_ROUTES.includes(route)) {
    throw new Error('INVALID_ROUTE');
  }
  if (!['public', 'route_only', 'private'].includes(visibility)) {
    throw new Error('INVALID_VISIBILITY');
  }

  // 신호등 분류
  const trafficLight = classifyTrafficLight(content);

  // 상태 결정: RED면 HIDDEN, 아니면 NEW
  const status = trafficLight === 'RED' ? 'HIDDEN' : 'NEW';

  const result = await db.query(`
    INSERT INTO harbor_wishes (user_id, content, route, visibility, traffic_light, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [userId, content, route, visibility, trafficLight, status]);

  const wish = result.rows[0];

  console.log(`✨ 소원 생성: id=${wish.id}, route=${route}, traffic_light=${trafficLight}`);

  return wish;
}

/**
 * 소원 조회
 */
async function getWishById(wishId) {
  if (!db) return null;

  const result = await db.query(`
    SELECT w.*, u.nickname as author_nickname,
           (SELECT COUNT(*) FROM harbor_reactions WHERE wish_id = w.id) as reaction_count,
           (SELECT COUNT(*) FROM harbor_comments WHERE wish_id = w.id AND status = 'ACTIVE') as comment_count
    FROM harbor_wishes w
    LEFT JOIN users_anon u ON w.user_id = u.id
    WHERE w.id = $1
  `, [wishId]);

  return result.rows[0] || null;
}

/**
 * 내 소원 목록
 */
async function getMyWishes(userId, { limit = 20, offset = 0 } = {}) {
  if (!db) return [];

  const result = await db.query(`
    SELECT w.*,
           (SELECT COUNT(*) FROM harbor_reactions WHERE wish_id = w.id) as reaction_count,
           (SELECT COUNT(*) FROM harbor_comments WHERE wish_id = w.id AND status = 'ACTIVE') as comment_count
    FROM harbor_wishes w
    WHERE w.user_id = $1 AND w.status != 'HIDDEN'
    ORDER BY w.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);

  return result.rows;
}

/**
 * 소원 상태 업데이트
 */
async function updateWishStatus(wishId, status) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const result = await db.query(`
    UPDATE harbor_wishes SET status = $1 WHERE id = $2 RETURNING *
  `, [status, wishId]);

  return result.rows[0];
}

/**
 * 소원 숨김 처리 (신고 누적 등)
 */
async function hideWish(wishId) {
  return await updateWishStatus(wishId, 'HIDDEN');
}

/**
 * 🟡 YELLOW 3Q 판단 트리 적용
 * (댓글 제한, 비공개 강제 등)
 */
function getYellowRestrictions(trafficLight) {
  if (trafficLight !== 'YELLOW') {
    return { restricted: false };
  }

  return {
    restricted: true,
    rules: [
      'comments_moderated',  // 댓글 사전 검토
      'visibility_limited',   // 공개범위 제한 권장
      'care_message_shown'    // 케어 메시지 표시
    ],
    careMessage: '당신의 마음이 걱정됩니다. 필요하시면 전문 상담을 받아보세요.'
  };
}

module.exports = {
  TRAFFIC_LIGHT_RULES,
  VALID_ROUTES,
  classifyTrafficLight,
  createWish,
  getWishById,
  getMyWishes,
  updateWishStatus,
  hideWish,
  getYellowRestrictions
};
