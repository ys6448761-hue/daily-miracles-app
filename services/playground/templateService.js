/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AIL-501: 소원놀이터 템플릿 서비스
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 첫 제작 완료율 상승을 위한 템플릿 10개 제공
 * - 백지 공포 제거
 * - 4칸 구조 자동 준수
 * - 헌법 게이트(B 이상) 통과 보장
 */

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 템플릿 목록 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getTemplates(options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { category = null, limit = 20, includeInactive = false } = options;

  let query = `
    SELECT
      id,
      template_key,
      title,
      category,
      heart_line,
      reality_hint,
      one_step,
      blessing_line,
      reality_tag,
      tone,
      sort_order,
      use_count
    FROM playground_templates
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (!includeInactive) {
    query += ` AND is_active = true`;
  }

  if (category) {
    query += ` AND category = $${paramIndex++}`;
    params.push(category);
  }

  query += ` ORDER BY sort_order ASC, title ASC`;

  if (limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(limit);
  }

  const result = await db.query(query, params);
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 단일 템플릿 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getTemplateById(id) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT *
    FROM playground_templates
    WHERE id = $1 AND is_active = true
  `, [id]);

  return result.rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 템플릿 키로 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getTemplateByKey(templateKey) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT *
    FROM playground_templates
    WHERE template_key = $1 AND is_active = true
  `, [templateKey]);

  return result.rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 템플릿 사용 기록
// ═══════════════════════════════════════════════════════════════════════════
async function recordTemplateUsage(templateId, userId = null, artifactId = null) {
  if (!db) return;

  try {
    // 사용 로그 저장
    await db.query(`
      INSERT INTO playground_template_usage (template_id, user_id, artifact_id)
      VALUES ($1, $2, $3)
    `, [templateId, userId, artifactId]);

    // 사용 횟수 증가
    await db.query(`
      UPDATE playground_templates
      SET use_count = use_count + 1, updated_at = NOW()
      WHERE id = $1
    `, [templateId]);

    return { success: true };
  } catch (error) {
    console.warn('[Template] 사용 기록 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 카테고리 목록
// ═══════════════════════════════════════════════════════════════════════════
async function getCategories() {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM playground_templates
    WHERE is_active = true
    GROUP BY category
    ORDER BY category
  `);

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 템플릿 → content_json 변환
// ═══════════════════════════════════════════════════════════════════════════
function templateToContentJson(template) {
  return {
    heart_line: template.heart_line,
    reality_hint: template.reality_hint,
    reality_tag: template.reality_tag || 'self',
    one_step: template.one_step,
    blessing_line: template.blessing_line,
    tone: template.tone || 'warm',
    template_id: template.id,
    template_key: template.template_key
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 인기 템플릿
// ═══════════════════════════════════════════════════════════════════════════
async function getPopularTemplates(limit = 5) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT
      id,
      template_key,
      title,
      category,
      heart_line,
      use_count
    FROM playground_templates
    WHERE is_active = true
    ORDER BY use_count DESC, sort_order ASC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 템플릿 통계
// ═══════════════════════════════════════════════════════════════════════════
async function getTemplateStats() {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT
      t.id,
      t.template_key,
      t.title,
      t.use_count,
      COUNT(u.id) as usage_7days
    FROM playground_templates t
    LEFT JOIN playground_template_usage u
      ON t.id = u.template_id
      AND u.created_at >= NOW() - INTERVAL '7 days'
    WHERE t.is_active = true
    GROUP BY t.id
    ORDER BY usage_7days DESC, t.use_count DESC
  `);

  return result.rows;
}

module.exports = {
  init: (database) => { db = database; },
  getTemplates,
  getTemplateById,
  getTemplateByKey,
  recordTemplateUsage,
  getCategories,
  templateToContentJson,
  getPopularTemplates,
  getTemplateStats
};
