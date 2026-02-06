/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AIL-JOB-404: 아티팩트 (창작물) 서비스
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * UGC 포맷 강제 구조 (3층 + Blessing Slot)
 */

const scoreService = require('./scoreService');
const crypto = require('crypto');

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 게스트 유저 생성/조회 (user_id 하드코딩 방지)
// ═══════════════════════════════════════════════════════════════════════════
async function getOrCreateGuestUser(guestToken) {
  if (!db) return null;

  // 토큰이 없으면 새로 생성
  if (!guestToken) {
    guestToken = 'guest_' + crypto.randomBytes(16).toString('hex');
  }

  // 기존 게스트 조회
  const existing = await db.query(
    'SELECT user_id FROM playground_users WHERE external_id = $1',
    [guestToken]
  );

  if (existing.rows.length > 0) {
    return { user_id: existing.rows[0].user_id, guest_token: guestToken, new: false };
  }

  // 새 게스트 생성
  const result = await db.query(`
    INSERT INTO playground_users (external_id, locale)
    VALUES ($1, 'ko')
    RETURNING user_id
  `, [guestToken]);

  return { user_id: result.rows[0].user_id, guest_token: guestToken, new: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// 필수 필드 검증
// ═══════════════════════════════════════════════════════════════════════════
const REQUIRED_FIELDS = ['heart_line', 'reality_hint', 'reality_tag', 'one_step', 'blessing_line'];
const VALID_REALITY_TAGS = ['time', 'money', 'relationship', 'health', 'anxiety', 'career', 'family', 'self', 'other'];
const VALID_TONES = ['calm', 'warm', 'poetic'];

function validateContentJson(contentJson, isDraft = false) {
  const errors = [];

  // 드래프트는 필수 필드 검증 스킵
  if (!isDraft) {
    for (const field of REQUIRED_FIELDS) {
      if (!contentJson[field] || contentJson[field].trim() === '') {
        errors.push(`필수 필드 누락: ${field}`);
      }
    }

    // reality_tag 유효성
    if (contentJson.reality_tag && !VALID_REALITY_TAGS.includes(contentJson.reality_tag)) {
      errors.push(`유효하지 않은 reality_tag: ${contentJson.reality_tag}`);
    }
  }

  // tone 유효성 (선택 필드)
  if (contentJson.tone && !VALID_TONES.includes(contentJson.tone)) {
    errors.push(`유효하지 않은 tone: ${contentJson.tone}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 아티팩트 생성
// ═══════════════════════════════════════════════════════════════════════════
async function createArtifact(userId, data) {
  if (!db) throw new Error('DB not initialized');

  const {
    type = 'wish_card',
    visibility = 'private',
    content_json,
    tags_json = [],
    parent_id = null,
    status = 'active'
  } = data;

  // 드래프트 여부
  const isDraft = status === 'draft';

  // 필수 필드 검증
  const validation = validateContentJson(content_json, isDraft);
  if (!validation.valid) {
    return {
      success: false,
      error: 'validation_error',
      errors: validation.errors
    };
  }

  // 리믹스인 경우 root_id와 depth 계산
  let rootId = null;
  let remixDepth = 0;

  if (parent_id) {
    const parent = await db.query(
      'SELECT root_id, remix_depth FROM artifacts WHERE artifact_id = $1',
      [parent_id]
    );
    if (parent.rows.length > 0) {
      rootId = parent.rows[0].root_id || parent_id;
      remixDepth = (parent.rows[0].remix_depth || 0) + 1;
    }
  }

  // 아티팩트 저장
  const result = await db.query(`
    INSERT INTO artifacts (user_id, type, visibility, parent_id, root_id, remix_depth, content_json, tags_json, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING artifact_id, created_at
  `, [
    userId,
    type,
    visibility,
    parent_id,
    rootId,
    remixDepth,
    JSON.stringify(content_json),
    JSON.stringify(tags_json),
    status
  ]);

  const artifactId = result.rows[0].artifact_id;

  // 드래프트가 아니면 점수 계산
  let scoreResult = null;
  if (!isDraft) {
    scoreResult = await scoreService.scoreArtifact(artifactId);

    // 점수 기반으로 visibility 강제 조정
    const rights = scoreService.getExposureRights(scoreResult.grade, scoreResult.gate_result);
    if (!rights.canPublic && visibility === 'public') {
      await db.query(
        'UPDATE artifacts SET visibility = $1 WHERE artifact_id = $2',
        ['private', artifactId]
      );
    }
  }

  return {
    success: true,
    artifact_id: artifactId,
    created_at: result.rows[0].created_at,
    score: scoreResult
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 아티팩트 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getArtifact(artifactId, requestUserId = null) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT a.*, s.score_total, s.grade, s.gate_result,
           h.help_score, h.warm_count, h.thanks_count, h.saved_count, h.cheer_count
    FROM artifacts a
    LEFT JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    LEFT JOIN artifact_help_scores h ON a.artifact_id = h.artifact_id
    WHERE a.artifact_id = $1
  `, [artifactId]);

  if (result.rows.length === 0) {
    return null;
  }

  const artifact = result.rows[0];

  // 비공개/차단 콘텐츠 접근 제한
  if (artifact.status === 'blocked') {
    if (artifact.user_id !== requestUserId) {
      return { error: 'blocked', message: '차단된 콘텐츠입니다.' };
    }
  }

  if (artifact.visibility === 'private' && artifact.user_id !== requestUserId) {
    return { error: 'private', message: '비공개 콘텐츠입니다.' };
  }

  return artifact;
}

// ═══════════════════════════════════════════════════════════════════════════
// 아티팩트 수정
// ═══════════════════════════════════════════════════════════════════════════
async function updateArtifact(artifactId, userId, data) {
  if (!db) throw new Error('DB not initialized');

  // 소유권 확인
  const owner = await db.query(
    'SELECT user_id, status FROM artifacts WHERE artifact_id = $1',
    [artifactId]
  );

  if (owner.rows.length === 0) {
    return { success: false, error: 'not_found' };
  }

  if (owner.rows[0].user_id !== userId) {
    return { success: false, error: 'forbidden' };
  }

  if (owner.rows[0].status === 'blocked') {
    return { success: false, error: 'blocked', message: '차단된 콘텐츠는 수정할 수 없습니다.' };
  }

  const { content_json, visibility, tags_json, status } = data;
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (content_json) {
    const isDraft = status === 'draft' || owner.rows[0].status === 'draft';
    const validation = validateContentJson(content_json, isDraft);
    if (!validation.valid) {
      return { success: false, error: 'validation_error', errors: validation.errors };
    }
    updates.push(`content_json = $${paramIndex++}`);
    values.push(JSON.stringify(content_json));
  }

  if (visibility) {
    updates.push(`visibility = $${paramIndex++}`);
    values.push(visibility);
  }

  if (tags_json) {
    updates.push(`tags_json = $${paramIndex++}`);
    values.push(JSON.stringify(tags_json));
  }

  if (status) {
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  updates.push(`updated_at = NOW()`);
  values.push(artifactId);

  await db.query(`
    UPDATE artifacts SET ${updates.join(', ')}
    WHERE artifact_id = $${paramIndex}
  `, values);

  // 점수 재계산 (드래프트가 아닌 경우)
  if (content_json && status !== 'draft') {
    await scoreService.scoreArtifact(artifactId);
  }

  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// 사용자 아티팩트 목록
// ═══════════════════════════════════════════════════════════════════════════
async function getUserArtifacts(userId, options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { type, status = 'active', limit = 20, offset = 0 } = options;

  let query = `
    SELECT a.*, s.score_total, s.grade
    FROM artifacts a
    LEFT JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    WHERE a.user_id = $1 AND a.status = $2
  `;
  const params = [userId, status];

  if (type) {
    query += ` AND a.type = $3`;
    params.push(type);
  }

  query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 반응 추가
// ═══════════════════════════════════════════════════════════════════════════
async function addReaction(artifactId, userId, reactionType) {
  if (!db) throw new Error('DB not initialized');

  const validTypes = ['warm', 'thanks', 'saved', 'cheer'];
  if (!validTypes.includes(reactionType)) {
    return { success: false, error: 'invalid_type' };
  }

  try {
    await db.query(`
      INSERT INTO artifact_reactions (artifact_id, user_id, type)
      VALUES ($1, $2, $3)
      ON CONFLICT (artifact_id, user_id, type) DO NOTHING
    `, [artifactId, userId, reactionType]);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 반응 제거
// ═══════════════════════════════════════════════════════════════════════════
async function removeReaction(artifactId, userId, reactionType) {
  if (!db) throw new Error('DB not initialized');

  await db.query(`
    DELETE FROM artifact_reactions
    WHERE artifact_id = $1 AND user_id = $2 AND type = $3
  `, [artifactId, userId, reactionType]);

  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// 리믹스 계보 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getRemixTree(rootId) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT artifact_id, user_id, parent_id, remix_depth, created_at
    FROM artifacts
    WHERE root_id = $1 OR artifact_id = $1
    ORDER BY remix_depth, created_at
  `, [rootId]);

  return result.rows;
}

module.exports = {
  init: (database) => { db = database; },
  validateContentJson,
  createArtifact,
  getArtifact,
  updateArtifact,
  getUserArtifacts,
  addReaction,
  removeReaction,
  getRemixTree,
  getOrCreateGuestUser,
  REQUIRED_FIELDS,
  VALID_REALITY_TAGS
};
