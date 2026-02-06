/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 공유 서비스 (Share Engine)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 공유 링크 생성, 조회, 유입 추적
 */

const crypto = require('crypto');

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 공유 링크 생성
// ═══════════════════════════════════════════════════════════════════════════
async function createShareLink(artifactId, sharerUserId = null) {
  if (!db) throw new Error('DB not initialized');

  // 아티팩트 확인
  const artifact = await db.query(`
    SELECT a.artifact_id, a.user_id, a.visibility, a.status,
           s.grade, s.gate_result
    FROM artifacts a
    LEFT JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    WHERE a.artifact_id = $1
  `, [artifactId]);

  if (artifact.rows.length === 0) {
    return { success: false, error: 'artifact_not_found' };
  }

  const art = artifact.rows[0];

  // 차단된 콘텐츠는 공유 불가
  if (art.status === 'blocked' || art.gate_result === 'block') {
    return { success: false, error: 'blocked_content' };
  }

  // D등급은 공유 불가
  if (art.grade === 'D') {
    return { success: false, error: 'grade_too_low', message: '등급이 낮아 공유할 수 없습니다. 콘텐츠를 개선해주세요.' };
  }

  // 기존 공유 링크 확인
  const existing = await db.query(
    'SELECT share_slug FROM shares WHERE artifact_id = $1 AND sharer_user_id = $2',
    [artifactId, sharerUserId]
  );

  if (existing.rows.length > 0) {
    return {
      success: true,
      share_slug: existing.rows[0].share_slug,
      share_url: buildShareUrl(existing.rows[0].share_slug),
      existing: true
    };
  }

  // 새 공유 슬러그 생성
  const shareSlug = generateShareSlug();

  await db.query(`
    INSERT INTO shares (artifact_id, share_slug, visibility_at_share, sharer_user_id)
    VALUES ($1, $2, $3, $4)
  `, [artifactId, shareSlug, art.visibility, sharerUserId]);

  return {
    success: true,
    share_slug: shareSlug,
    share_url: buildShareUrl(shareSlug),
    existing: false
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 공유 링크로 아티팩트 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getByShareSlug(shareSlug, viewerInfo = {}) {
  if (!db) throw new Error('DB not initialized');

  // 공유 정보 조회
  const share = await db.query(`
    SELECT s.share_id, s.artifact_id, s.visibility_at_share, s.sharer_user_id, s.created_at,
           a.content_json, a.type, a.user_id as creator_id, a.status,
           sc.score_total, sc.grade
    FROM shares s
    JOIN artifacts a ON s.artifact_id = a.artifact_id
    LEFT JOIN artifact_scores sc ON a.artifact_id = sc.artifact_id
    WHERE s.share_slug = $1
  `, [shareSlug]);

  if (share.rows.length === 0) {
    return { success: false, error: 'share_not_found' };
  }

  const data = share.rows[0];

  // 차단된 콘텐츠
  if (data.status === 'blocked') {
    return { success: false, error: 'blocked_content' };
  }

  // 조회 기록
  await recordView(data.share_id, viewerInfo);

  return {
    success: true,
    artifact: {
      artifact_id: data.artifact_id,
      type: data.type,
      content_json: data.content_json,
      score_total: data.score_total,
      grade: data.grade,
      creator_id: data.creator_id
    },
    share: {
      share_id: data.share_id,
      sharer_user_id: data.sharer_user_id,
      shared_at: data.created_at
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 조회 기록
// ═══════════════════════════════════════════════════════════════════════════
async function recordView(shareId, viewerInfo = {}) {
  if (!db) return;

  const { viewer_user_id = null, user_agent = '', ip = '' } = viewerInfo;

  // 해시 처리 (개인정보 보호)
  const userAgentHash = user_agent ? hashString(user_agent) : null;
  const ipHash = ip ? hashString(ip) : null;

  await db.query(`
    INSERT INTO share_views (share_id, viewer_user_id, user_agent_hash, ip_hash)
    VALUES ($1, $2, $3, $4)
  `, [shareId, viewer_user_id, userAgentHash, ipHash]);
}

// ═══════════════════════════════════════════════════════════════════════════
// 공유 통계
// ═══════════════════════════════════════════════════════════════════════════
async function getShareStats(artifactId) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT
      COUNT(DISTINCT s.share_id) as share_count,
      COUNT(sv.view_id) as total_views,
      COUNT(DISTINCT sv.viewer_user_id) FILTER (WHERE sv.viewer_user_id IS NOT NULL) as unique_member_views
    FROM shares s
    LEFT JOIN share_views sv ON s.share_id = sv.share_id
    WHERE s.artifact_id = $1
  `, [artifactId]);

  return result.rows[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// 사용자의 공유 목록
// ═══════════════════════════════════════════════════════════════════════════
async function getUserShares(userId, options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { limit = 20, offset = 0 } = options;

  const result = await db.query(`
    SELECT
      s.share_id,
      s.share_slug,
      s.artifact_id,
      s.created_at,
      COUNT(sv.view_id) as view_count
    FROM shares s
    LEFT JOIN share_views sv ON s.share_id = sv.share_id
    WHERE s.sharer_user_id = $1
    GROUP BY s.share_id
    ORDER BY s.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);

  return result.rows.map(row => ({
    ...row,
    share_url: buildShareUrl(row.share_slug)
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// OG 메타데이터 생성 (카카오/SNS 공유용)
// ═══════════════════════════════════════════════════════════════════════════
function generateOGMeta(artifact) {
  const content = artifact.content_json || {};

  return {
    title: content.heart_line?.slice(0, 60) || '하루하루의 기적',
    description: content.blessing_line?.slice(0, 100) || '소원놀이터에서 만든 따뜻한 메시지',
    image: 'https://dailymiracles.kr/og-image-playground.png',
    url: buildShareUrl(artifact.share_slug)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════════════════
function generateShareSlug() {
  return crypto.randomBytes(8).toString('base64url');
}

function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function buildShareUrl(slug) {
  const baseUrl = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';
  return `${baseUrl}/s/${slug}`;
}

module.exports = {
  init: (database) => { db = database; },
  createShareLink,
  getByShareSlug,
  recordView,
  getShareStats,
  getUserShares,
  generateOGMeta,
  buildShareUrl
};
