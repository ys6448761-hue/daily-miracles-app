/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AIL-JOB-405: 피드/추천 (Exposure Engine)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 철학점수 기반 피드 노출
 * - grade >= B만 피드 노출
 * - help_score 기반 추천
 * - 랭킹 = 0.55*score_total + 0.35*help_score + 0.10*freshness
 */

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 메인 피드 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getFeed(options = {}) {
  if (!db) throw new Error('DB not initialized');

  const {
    limit = 20,
    offset = 0,
    type = null,      // wish_card, daily_quest, remix_storybook
    reality_tag = null,
    min_grade = 'B'   // 최소 등급 (기본 B 이상)
  } = options;

  // 등급 필터링
  const gradeFilter = getGradeFilter(min_grade);

  let query = `
    SELECT
      a.artifact_id,
      a.user_id,
      a.type,
      a.content_json,
      a.tags_json,
      a.remix_depth,
      a.created_at,
      s.score_total,
      s.grade,
      COALESCE(h.help_score, 0) as help_score,
      COALESCE(h.warm_count, 0) as warm_count,
      COALESCE(h.thanks_count, 0) as thanks_count,
      COALESCE(h.saved_count, 0) as saved_count,
      COALESCE(h.cheer_count, 0) as cheer_count,
      -- 랭킹 점수 계산
      (0.55 * s.score_total +
       0.35 * COALESCE(h.help_score, 0) +
       0.10 * GREATEST(0, 100 - EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 1728)) as rank_score
    FROM artifacts a
    JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    LEFT JOIN artifact_help_scores h ON a.artifact_id = h.artifact_id
    WHERE a.visibility = 'public'
      AND a.status = 'active'
      AND s.grade IN (${gradeFilter})
      AND s.gate_result = 'pass'
  `;

  const params = [];
  let paramIndex = 1;

  if (type) {
    query += ` AND a.type = $${paramIndex++}`;
    params.push(type);
  }

  if (reality_tag) {
    query += ` AND a.content_json->>'reality_tag' = $${paramIndex++}`;
    params.push(reality_tag);
  }

  query += ` ORDER BY rank_score DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 하이라이트 (S/A 등급 + 높은 help_score)
// ═══════════════════════════════════════════════════════════════════════════
async function getHighlights(options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { limit = 10 } = options;

  const result = await db.query(`
    SELECT
      a.artifact_id,
      a.user_id,
      a.type,
      a.content_json,
      a.created_at,
      s.score_total,
      s.grade,
      COALESCE(h.help_score, 0) as help_score
    FROM artifacts a
    JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    LEFT JOIN artifact_help_scores h ON a.artifact_id = h.artifact_id
    WHERE a.visibility = 'public'
      AND a.status = 'active'
      AND s.grade IN ('S', 'A')
      AND s.gate_result = 'pass'
    ORDER BY h.help_score DESC NULLS LAST, s.score_total DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 리믹스 인기 (리믹스 많이 된 원본)
// ═══════════════════════════════════════════════════════════════════════════
async function getPopularForRemix(options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { limit = 10 } = options;

  const result = await db.query(`
    SELECT
      a.artifact_id,
      a.user_id,
      a.type,
      a.content_json,
      a.created_at,
      s.score_total,
      s.grade,
      COUNT(r.artifact_id) as remix_count
    FROM artifacts a
    JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    LEFT JOIN artifacts r ON r.root_id = a.artifact_id OR r.parent_id = a.artifact_id
    WHERE a.visibility = 'public'
      AND a.status = 'active'
      AND s.grade IN ('S', 'A', 'B')
      AND a.parent_id IS NULL
    GROUP BY a.artifact_id, s.score_total, s.grade
    ORDER BY remix_count DESC, s.score_total DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 태그별 피드
// ═══════════════════════════════════════════════════════════════════════════
async function getFeedByTag(realityTag, options = {}) {
  return getFeed({ ...options, reality_tag: realityTag });
}

// ═══════════════════════════════════════════════════════════════════════════
// 최신순 피드
// ═══════════════════════════════════════════════════════════════════════════
async function getRecentFeed(options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { limit = 20, offset = 0 } = options;

  const result = await db.query(`
    SELECT
      a.artifact_id,
      a.user_id,
      a.type,
      a.content_json,
      a.created_at,
      s.score_total,
      s.grade,
      COALESCE(h.help_score, 0) as help_score
    FROM artifacts a
    JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    LEFT JOIN artifact_help_scores h ON a.artifact_id = h.artifact_id
    WHERE a.visibility = 'public'
      AND a.status = 'active'
      AND s.grade IN ('S', 'A', 'B')
      AND s.gate_result = 'pass'
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼: 등급 필터 생성
// ═══════════════════════════════════════════════════════════════════════════
function getGradeFilter(minGrade) {
  const grades = ['S', 'A', 'B', 'C', 'D'];
  const minIndex = grades.indexOf(minGrade);
  if (minIndex === -1) return "'S', 'A', 'B'";

  const allowedGrades = grades.slice(0, minIndex + 1);
  return allowedGrades.map(g => `'${g}'`).join(', ');
}

// ═══════════════════════════════════════════════════════════════════════════
// 피드 통계
// ═══════════════════════════════════════════════════════════════════════════
async function getFeedStats() {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT
      s.grade,
      COUNT(*) as count,
      AVG(s.score_total) as avg_score,
      AVG(COALESCE(h.help_score, 0)) as avg_help_score
    FROM artifacts a
    JOIN artifact_scores s ON a.artifact_id = s.artifact_id
    LEFT JOIN artifact_help_scores h ON a.artifact_id = h.artifact_id
    WHERE a.visibility = 'public' AND a.status = 'active'
    GROUP BY s.grade
    ORDER BY s.grade
  `);

  return result.rows;
}

module.exports = {
  init: (database) => { db = database; },
  getFeed,
  getHighlights,
  getPopularForRemix,
  getFeedByTag,
  getRecentFeed,
  getFeedStats
};
