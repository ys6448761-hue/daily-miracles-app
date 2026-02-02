/**
 * commentService.js
 * 댓글 서비스 (80자 제한, 응원만 허용)
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/commentService: DB 로드 실패:', error.message);
}

const temperatureService = require('./temperatureService');
const notificationService = require('./notificationService');

// 조언 키워드 차단 목록
const BLOCKED_KEYWORDS = [
  '해야', '하지 마', '정답은', '내가 보기엔', '해라',
  '하세요', '해봐', '안 돼', '그러지 마', '하지마',
  '해야지', '해야해', '하면 안', '하지 않', '말고'
];

// 프리셋 응원 카드 10종
const PRESETS = [
  { id: 1, text: '응원해요! 꼭 이뤄질 거예요' },
  { id: 2, text: '함께 응원합니다' },
  { id: 3, text: '좋은 일이 생길 거예요' },
  { id: 4, text: '당신의 소원을 응원해요' },
  { id: 5, text: '힘내세요! 파이팅!' },
  { id: 6, text: '분명 좋은 결과가 있을 거예요' },
  { id: 7, text: '마음이 따뜻해지네요' },
  { id: 8, text: '소원이 이뤄지길 빌어요' },
  { id: 9, text: '당신의 용기가 멋져요' },
  { id: 10, text: '좋은 기운 보내드려요' }
];

/**
 * 댓글 유효성 검사
 */
function validateComment(content) {
  // 길이 검사
  if (!content || content.length === 0) {
    return { valid: false, error: 'CONTENT_REQUIRED' };
  }

  if (content.length > 80) {
    return { valid: false, error: 'TOO_LONG', maxLength: 80 };
  }

  // 조언 키워드 검사
  for (const keyword of BLOCKED_KEYWORDS) {
    if (content.includes(keyword)) {
      return {
        valid: false,
        error: 'ADVICE_BLOCKED',
        keyword,
        message: '응원만 남겨주세요. 조언은 삼가해주세요.'
      };
    }
  }

  return { valid: true };
}

/**
 * 댓글 작성
 */
async function createComment(wishId, userId, { content, presetId = null }) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  let finalContent = content;
  let isPreset = false;

  // 프리셋 사용 시
  if (presetId) {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) {
      throw new Error('INVALID_PRESET_ID');
    }
    finalContent = preset.text;
    isPreset = true;
  }

  // 유효성 검사
  const validation = validateComment(finalContent);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.details = validation;
    throw error;
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

  // 댓글 저장
  const result = await db.query(`
    INSERT INTO harbor_comments (wish_id, user_id, content, is_preset, preset_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [wishId, userId, finalContent, isPreset, presetId]);

  const comment = result.rows[0];

  // 온도 변화 (소원 작성자에게)
  if (wishOwnerId !== userId) {
    await temperatureService.applyTemperatureChange(wishOwnerId, wishId, 'comment_receive');

    // 알림 생성
    await notificationService.createNotification(wishOwnerId, {
      type: 'comment',
      title: '✍️ 새 댓글이 달렸어요!',
      body: finalContent.substring(0, 50) + (finalContent.length > 50 ? '...' : ''),
      data: { wishId, commentId: comment.id }
    });
  }

  console.log(`✍️ 댓글 생성: wish=${wishId}, comment=${comment.id}, preset=${isPreset}`);

  return comment;
}

/**
 * 댓글 목록 조회
 */
async function getComments(wishId, { limit = 50, offset = 0 } = {}) {
  if (!db) return [];

  const result = await db.query(`
    SELECT c.*, u.nickname as author_nickname
    FROM harbor_comments c
    LEFT JOIN users_anon u ON c.user_id = u.id
    WHERE c.wish_id = $1 AND c.status = 'ACTIVE'
    ORDER BY c.created_at ASC
    LIMIT $2 OFFSET $3
  `, [wishId, limit, offset]);

  return result.rows;
}

/**
 * 댓글 삭제 (본인만)
 */
async function deleteComment(commentId, userId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const result = await db.query(`
    UPDATE harbor_comments
    SET status = 'DELETED'
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `, [commentId, userId]);

  return result.rows[0];
}

/**
 * 댓글 숨김 (신고 누적 등)
 */
async function hideComment(commentId) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  const result = await db.query(`
    UPDATE harbor_comments
    SET status = 'HIDDEN'
    WHERE id = $1
    RETURNING *
  `, [commentId]);

  return result.rows[0];
}

/**
 * 프리셋 목록 반환
 */
function getPresets() {
  return PRESETS;
}

module.exports = {
  BLOCKED_KEYWORDS,
  PRESETS,
  validateComment,
  createComment,
  getComments,
  deleteComment,
  hideComment,
  getPresets
};
