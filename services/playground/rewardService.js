/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AIL-JOB-406: 배지/크레딧 (Reward Engine)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * '조회수' 금지, '도움' 중심 보상
 * - 배지: warm_one_liner, healed_someone, remix_spark, bring_a_creator
 * - 크레딧: weekly_S_grade, first_creator_via_link, top_help_score_weekly
 */

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 배지 정의
// ═══════════════════════════════════════════════════════════════════════════
const BADGES = {
  warm_one_liner: {
    key: 'warm_one_liner',
    name: '따뜻한 한 줄러',
    description: 'S/A 등급 + 따뜻한 반응 5회 이상',
    check: async (userId, db) => {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM artifacts a
        JOIN artifact_scores s ON a.artifact_id = s.artifact_id
        JOIN artifact_reactions r ON a.artifact_id = r.artifact_id
        WHERE a.user_id = $1
          AND s.grade IN ('S', 'A')
          AND r.type IN ('warm', 'thanks')
      `, [userId]);
      return parseInt(result.rows[0].count) >= 5;
    }
  },

  healed_someone: {
    key: 'healed_someone',
    name: '누군가를 치유한 사람',
    description: 'saved/thanks 반응 10회 이상 받음',
    check: async (userId, db) => {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM artifacts a
        JOIN artifact_reactions r ON a.artifact_id = r.artifact_id
        WHERE a.user_id = $1 AND r.type IN ('saved', 'thanks')
      `, [userId]);
      return parseInt(result.rows[0].count) >= 10;
    }
  },

  remix_spark: {
    key: 'remix_spark',
    name: '리믹스 불꽃',
    description: '내 작품이 3회 이상 리믹스됨',
    check: async (userId, db) => {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM artifacts child
        JOIN artifacts parent ON child.parent_id = parent.artifact_id
        WHERE parent.user_id = $1
      `, [userId]);
      return parseInt(result.rows[0].count) >= 3;
    }
  },

  bring_a_creator: {
    key: 'bring_a_creator',
    name: '창작자 초대장',
    description: '내 공유 링크로 새 창작자 발생',
    check: async (userId, db) => {
      // 공유 링크 통해 유입된 사용자가 창작물 생성한 경우
      const result = await db.query(`
        SELECT COUNT(DISTINCT sv.viewer_user_id) as count
        FROM shares s
        JOIN share_views sv ON s.share_id = sv.share_id
        JOIN artifacts a ON sv.viewer_user_id = a.user_id
        WHERE s.sharer_user_id = $1
          AND sv.viewer_user_id IS NOT NULL
          AND sv.viewer_user_id != $1
      `, [userId]);
      return parseInt(result.rows[0].count) >= 1;
    }
  },

  first_artifact: {
    key: 'first_artifact',
    name: '첫 발자국',
    description: '첫 번째 창작물 생성',
    check: async (userId, db) => {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM artifacts WHERE user_id = $1 AND status = 'active'
      `, [userId]);
      return parseInt(result.rows[0].count) >= 1;
    }
  },

  s_grade_master: {
    key: 's_grade_master',
    name: 'S등급 마스터',
    description: 'S등급 창작물 5개 이상',
    check: async (userId, db) => {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM artifacts a
        JOIN artifact_scores s ON a.artifact_id = s.artifact_id
        WHERE a.user_id = $1 AND s.grade = 'S'
      `, [userId]);
      return parseInt(result.rows[0].count) >= 5;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 크레딧 정의
// ═══════════════════════════════════════════════════════════════════════════
const CREDIT_RULES = {
  weekly_s_grade: {
    key: 'weekly_s_grade',
    amount: 100,
    description: '주간 S등급 획득'
  },
  first_creator_via_link: {
    key: 'first_creator_via_link',
    amount: 200,
    description: '공유 링크로 첫 창작자 유입'
  },
  top_help_score_weekly: {
    key: 'top_help_score_weekly',
    amount: 300,
    description: '주간 도움 점수 상위'
  },
  artifact_s_grade: {
    key: 'artifact_s_grade',
    amount: 50,
    description: 'S등급 창작물 생성'
  },
  artifact_a_grade: {
    key: 'artifact_a_grade',
    amount: 20,
    description: 'A등급 창작물 생성'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 배지 체크 및 지급
// ═══════════════════════════════════════════════════════════════════════════
async function checkAndGrantBadges(userId) {
  if (!db) throw new Error('DB not initialized');

  const granted = [];

  for (const [key, badge] of Object.entries(BADGES)) {
    // 이미 보유 중인지 확인
    const existing = await db.query(
      'SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_key = $2',
      [userId, key]
    );

    if (existing.rows.length > 0) continue;

    // 조건 체크
    const eligible = await badge.check(userId, db);
    if (eligible) {
      // 배지 지급
      await db.query(`
        INSERT INTO user_badges (user_id, badge_key, meta)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, badge_key) DO NOTHING
      `, [userId, key, JSON.stringify({ name: badge.name, description: badge.description })]);

      // 보상 로그
      await db.query(`
        INSERT INTO rewards (user_id, type, key, amount, meta)
        VALUES ($1, 'badge', $2, 0, $3)
        ON CONFLICT (user_id, type, key) DO NOTHING
      `, [userId, key, JSON.stringify({ name: badge.name })]);

      granted.push({ key, name: badge.name });
    }
  }

  return granted;
}

// ═══════════════════════════════════════════════════════════════════════════
// 크레딧 지급
// ═══════════════════════════════════════════════════════════════════════════
async function grantCredit(userId, creditKey, meta = {}) {
  if (!db) throw new Error('DB not initialized');

  const rule = CREDIT_RULES[creditKey];
  if (!rule) {
    return { success: false, error: 'unknown_credit_key' };
  }

  // 중복 체크용 고유 키 생성 (예: weekly_s_grade_2026_06)
  const uniqueKey = meta.unique_suffix
    ? `${creditKey}_${meta.unique_suffix}`
    : creditKey;

  try {
    // 보상 로그 (중복 방지)
    await db.query(`
      INSERT INTO rewards (user_id, type, key, amount, meta)
      VALUES ($1, 'credit', $2, $3, $4)
      ON CONFLICT (user_id, type, key) DO NOTHING
    `, [userId, uniqueKey, rule.amount, JSON.stringify(meta)]);

    // 사용자 크레딧 업데이트
    await db.query(`
      UPDATE playground_users
      SET total_credits = total_credits + $1
      WHERE user_id = $2
    `, [rule.amount, userId]);

    return { success: true, amount: rule.amount, key: uniqueKey };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 아티팩트 생성 시 크레딧 자동 지급
// ═══════════════════════════════════════════════════════════════════════════
async function processArtifactReward(userId, artifactId, grade) {
  if (!db) throw new Error('DB not initialized');

  const results = [];

  // 등급별 크레딧
  if (grade === 'S') {
    const result = await grantCredit(userId, 'artifact_s_grade', {
      artifact_id: artifactId,
      unique_suffix: `artifact_${artifactId}`
    });
    if (result.success) results.push(result);
  } else if (grade === 'A') {
    const result = await grantCredit(userId, 'artifact_a_grade', {
      artifact_id: artifactId,
      unique_suffix: `artifact_${artifactId}`
    });
    if (result.success) results.push(result);
  }

  // 배지 체크
  const badges = await checkAndGrantBadges(userId);
  if (badges.length > 0) {
    results.push({ type: 'badges', items: badges });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// 사용자 보상 현황 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getUserRewards(userId) {
  if (!db) throw new Error('DB not initialized');

  // 배지 목록
  const badges = await db.query(`
    SELECT badge_key, earned_at, meta
    FROM user_badges
    WHERE user_id = $1
    ORDER BY earned_at DESC
  `, [userId]);

  // 총 크레딧
  const credits = await db.query(`
    SELECT total_credits FROM playground_users WHERE user_id = $1
  `, [userId]);

  // 최근 보상 로그
  const recentRewards = await db.query(`
    SELECT type, key, amount, meta, created_at
    FROM rewards
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [userId]);

  return {
    badges: badges.rows,
    total_credits: credits.rows[0]?.total_credits || 0,
    recent_rewards: recentRewards.rows
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 주간 Top Help Score 처리 (크론 잡용)
// ═══════════════════════════════════════════════════════════════════════════
async function processWeeklyTopHelpScore(weekKey) {
  if (!db) throw new Error('DB not initialized');

  // 주간 상위 3명
  const top = await db.query(`
    SELECT a.user_id, SUM(COALESCE(h.help_score, 0)) as total_help
    FROM artifacts a
    LEFT JOIN artifact_help_scores h ON a.artifact_id = h.artifact_id
    WHERE a.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY a.user_id
    ORDER BY total_help DESC
    LIMIT 3
  `);

  const results = [];
  for (const row of top.rows) {
    const result = await grantCredit(row.user_id, 'top_help_score_weekly', {
      week: weekKey,
      total_help: row.total_help,
      unique_suffix: weekKey
    });
    results.push({ user_id: row.user_id, ...result });
  }

  return results;
}

module.exports = {
  init: (database) => { db = database; },
  BADGES,
  CREDIT_RULES,
  checkAndGrantBadges,
  grantCredit,
  processArtifactReward,
  getUserRewards,
  processWeeklyTopHelpScore
};
