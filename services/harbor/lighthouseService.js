/**
 * lighthouseService.js
 * 오늘의 등대 5개 큐레이션
 *
 * 규칙:
 * 1. status != HIDDEN, traffic_light != RED
 * 2. visibility in (public, route_only)
 * 3. route 다양성 우선
 * 4. 응원 0~2개 소원 2개 포함 (소외 방지)
 * 5. 나머지 랜덤
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/lighthouseService: DB 로드 실패:', error.message);
}

/**
 * 오늘의 등대 5개 조회
 */
async function getTodayLighthouse() {
  if (!db) return [];

  try {
    // 복합 쿼리: 소외 방지 + 다양성
    const result = await db.query(`
      WITH reaction_counts AS (
        SELECT wish_id, COUNT(*) as cnt
        FROM harbor_reactions
        GROUP BY wish_id
      ),
      -- 1. 응원이 적은 소원 2개 (소외 방지)
      low_engagement AS (
        SELECT w.*, COALESCE(r.cnt, 0) as reaction_count
        FROM harbor_wishes w
        LEFT JOIN reaction_counts r ON w.id = r.wish_id
        WHERE w.status NOT IN ('HIDDEN')
          AND w.traffic_light != 'RED'
          AND w.visibility IN ('public', 'route_only')
          AND COALESCE(r.cnt, 0) <= 2
        ORDER BY w.created_at DESC
        LIMIT 2
      ),
      -- 2. 다양한 항로에서 각 1개씩 (최대 3개)
      diverse_routes AS (
        SELECT DISTINCT ON (route) w.*, COALESCE(r.cnt, 0) as reaction_count
        FROM harbor_wishes w
        LEFT JOIN reaction_counts r ON w.id = r.wish_id
        WHERE w.status NOT IN ('HIDDEN')
          AND w.traffic_light != 'RED'
          AND w.visibility IN ('public', 'route_only')
          AND w.id NOT IN (SELECT id FROM low_engagement)
        ORDER BY route, RANDOM()
        LIMIT 3
      ),
      -- 결합
      combined AS (
        SELECT * FROM low_engagement
        UNION ALL
        SELECT * FROM diverse_routes
      )
      SELECT DISTINCT ON (id) *
      FROM combined
      ORDER BY id
      LIMIT 5
    `);

    // 부족하면 추가 랜덤 선택
    if (result.rows.length < 5) {
      const existingIds = result.rows.map(r => r.id);
      const remaining = 5 - result.rows.length;

      const additional = await db.query(`
        SELECT w.*, COALESCE(
          (SELECT COUNT(*) FROM harbor_reactions WHERE wish_id = w.id), 0
        ) as reaction_count
        FROM harbor_wishes w
        WHERE w.status NOT IN ('HIDDEN')
          AND w.traffic_light != 'RED'
          AND w.visibility IN ('public', 'route_only')
          ${existingIds.length > 0 ? `AND w.id NOT IN (${existingIds.map((_, i) => `$${i + 1}`).join(',')})` : ''}
        ORDER BY RANDOM()
        LIMIT $${existingIds.length + 1}
      `, [...existingIds, remaining]);

      result.rows.push(...additional.rows);
    }

    // 셔플 (순서 랜덤화)
    const shuffled = result.rows.sort(() => Math.random() - 0.5);

    console.log(`🗼 등대 조회: ${shuffled.length}개 소원`);

    return shuffled.slice(0, 5);

  } catch (error) {
    console.error('❌ 등대 조회 실패:', error.message);
    return [];
  }
}

/**
 * 특정 항로의 소원 목록
 */
async function getWishesByRoute(route, { limit = 20, offset = 0 } = {}) {
  if (!db) return [];

  const result = await db.query(`
    SELECT w.*, COALESCE(
      (SELECT COUNT(*) FROM harbor_reactions WHERE wish_id = w.id), 0
    ) as reaction_count,
    COALESCE(
      (SELECT COUNT(*) FROM harbor_comments WHERE wish_id = w.id AND status = 'ACTIVE'), 0
    ) as comment_count
    FROM harbor_wishes w
    WHERE w.route = $1
      AND w.status NOT IN ('HIDDEN')
      AND w.traffic_light != 'RED'
      AND w.visibility IN ('public', 'route_only')
    ORDER BY w.created_at DESC
    LIMIT $2 OFFSET $3
  `, [route, limit, offset]);

  return result.rows;
}

/**
 * 최신 소원 목록 (공개)
 */
async function getRecentWishes({ limit = 20, offset = 0, excludeUserId = null } = {}) {
  if (!db) return [];

  let query = `
    SELECT w.*, u.nickname as author_nickname,
    COALESCE(
      (SELECT COUNT(*) FROM harbor_reactions WHERE wish_id = w.id), 0
    ) as reaction_count,
    COALESCE(
      (SELECT COUNT(*) FROM harbor_comments WHERE wish_id = w.id AND status = 'ACTIVE'), 0
    ) as comment_count
    FROM harbor_wishes w
    LEFT JOIN users_anon u ON w.user_id = u.id
    WHERE w.status NOT IN ('HIDDEN')
      AND w.traffic_light != 'RED'
      AND w.visibility = 'public'
  `;

  const params = [];

  if (excludeUserId) {
    params.push(excludeUserId);
    query += ` AND w.user_id != $${params.length}`;
  }

  params.push(limit, offset);
  query += ` ORDER BY w.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await db.query(query, params);
  return result.rows;
}

module.exports = {
  getTodayLighthouse,
  getWishesByRoute,
  getRecentWishes
};
