/**
 * DreamTown API Routes — P0
 *
 * POST /api/dt/wishes              소원 생성
 * POST /api/dt/stars/create        별 생성 (wish → star)
 * GET  /api/dt/stars/:id           내 별 조회
 * GET  /api/dt/galaxies            은하 목록
 * GET  /api/dt/galaxies/:code      은하 상세 + constellations + stories
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 소원 텍스트 → 별 이름 생성 (자연스러운 단어 경계 기준)
function makeStarName(wishText) {
  const MAX = 12;
  if (wishText.length <= MAX) return `${wishText}의 별`;
  // 공백 기준으로 단어를 붙여가며 MAX를 넘지 않는 마지막 단어까지 사용
  const words = wishText.split(' ');
  let result = '';
  for (const word of words) {
    const next = result ? `${result} ${word}` : word;
    if (next.length > MAX) break;
    result = next;
  }
  // 단어 분리가 안 되는 경우(한 단어가 MAX 초과) → 그냥 MAX자 절단
  if (!result) result = wishText.slice(0, MAX);
  return `${result}의 별`;
}

// gem_type → galaxy code 분류표
const GEM_GALAXY_MAP = {
  ruby:      'challenge',
  sapphire:  'growth',
  emerald:   'healing',
  diamond:   'growth',
  citrine:   'relationship',
};

// ─────────────────────────────────────────────
// POST /api/dt/wishes — 소원 생성
// ─────────────────────────────────────────────
router.post('/wishes', async (req, res) => {
  console.log('[DT] POST /wishes 진입 | body:', JSON.stringify(req.body));
  try {
    const { user_id, wish_text, gem_type, yeosu_theme } = req.body;

    if (!user_id || !wish_text || !gem_type) {
      return res.status(400).json({ error: 'user_id, wish_text, gem_type 필수' });
    }

    const validGems = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];
    if (!validGems.includes(gem_type)) {
      return res.status(400).json({ error: `gem_type은 ${validGems.join('/')} 중 하나여야 합니다` });
    }

    // user 없으면 자동 생성 (Prototype: 게스트 허용)
    let userId = user_id;
    const userCheck = await db.query('SELECT id FROM dt_users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      const newUser = await db.query(
        'INSERT INTO dt_users (id, nickname) VALUES ($1, $2) RETURNING id',
        [userId, 'Guest']
      );
      userId = newUser.rows[0].id;
    }

    const result = await db.query(
      `INSERT INTO dt_wishes (user_id, wish_text, gem_type, yeosu_theme, status)
       VALUES ($1, $2, $3, $4, 'submitted')
       RETURNING id, status`,
      [userId, wish_text, gem_type, yeosu_theme || null]
    );

    const wish = result.rows[0];
    res.status(201).json({ wish_id: wish.id, status: wish.status });

  } catch (err) {
    console.error('[DT] POST /wishes error:', err.message, '| code:', err.code, '| stack:', err.stack?.split('\n')[1]);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/stars/create — 별 생성
// ─────────────────────────────────────────────
router.post('/stars/create', async (req, res) => {
  console.log('[DT] POST /stars/create 진입 | body:', JSON.stringify(req.body));
  try {
    const { wish_id, user_id } = req.body;

    if (!wish_id || !user_id) {
      return res.status(400).json({ error: 'wish_id, user_id 필수' });
    }

    // 소원 조회
    const wishResult = await db.query(
      'SELECT * FROM dt_wishes WHERE id = $1 AND user_id = $2',
      [wish_id, user_id]
    );
    if (wishResult.rowCount === 0) {
      return res.status(404).json({ error: '소원을 찾을 수 없습니다' });
    }
    const wish = wishResult.rows[0];

    // galaxy 분류
    const galaxyCode = GEM_GALAXY_MAP[wish.gem_type] || 'growth';
    const galaxyResult = await db.query(
      'SELECT id, code FROM dt_galaxies WHERE code = $1',
      [galaxyCode]
    );
    if (galaxyResult.rowCount === 0) {
      return res.status(500).json({ error: '은하 데이터 없음 — seed 데이터를 확인하세요' });
    }
    const galaxy = galaxyResult.rows[0];

    // star_seed 생성
    const seedName = `${wish.wish_text.slice(0, 10)} 씨앗`;
    const seedResult = await db.query(
      `INSERT INTO dt_star_seeds (wish_id, seed_name, seed_state)
       VALUES ($1, $2, 'promoted')
       RETURNING id`,
      [wish_id, seedName]
    );
    const seed = seedResult.rows[0];

    const starName = makeStarName(wish.wish_text);
    const starSlug = `star-${Date.now()}`;

    // star 생성
    const starResult = await db.query(
      `INSERT INTO dt_stars
         (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, star_stage)
       VALUES ($1, $2, $3, $4, $5, $6, 'day1')
       RETURNING id, star_name, star_slug, star_stage`,
      [user_id, wish_id, seed.id, starName, starSlug, galaxy.id]
    );
    const star = starResult.rows[0];

    // wish status 업데이트
    await db.query(
      "UPDATE dt_wishes SET status = 'converted_to_star' WHERE id = $1",
      [wish_id]
    );

    res.status(201).json({
      star_id:              star.id,
      star_name:            star.star_name,
      star_slug:            star.star_slug,
      galaxy:               galaxyCode,
      constellation:        null,
      birth_scene_version:  'v1',
      star_stage:           star.star_stage,
    });

  } catch (err) {
    console.error('[DT] POST /stars/create error:', err.message, '| code:', err.code, '| stack:', err.stack?.split('\n')[1]);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id — 내 별 조회
// ─────────────────────────────────────────────
router.get('/stars/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         s.id         AS star_id,
         s.star_name,
         s.star_slug,
         s.star_stage,
         s.created_at,
         w.wish_text,
         g.code       AS galaxy_code,
         g.name_ko    AS galaxy_name_ko
       FROM dt_stars s
       JOIN dt_wishes   w ON w.id = s.wish_id
       JOIN dt_galaxies g ON g.id = s.galaxy_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }

    const row = result.rows[0];
    res.json({
      star_id:        row.star_id,
      star_name:      row.star_name,
      wish_text:      row.wish_text,
      wish_image_url: null,
      galaxy: {
        code:    row.galaxy_code,
        name_ko: row.galaxy_name_ko,
      },
      constellation: null,
      star_stage:    row.star_stage,
      created_at:    row.created_at,
    });

  } catch (err) {
    console.error('[DT] GET /stars/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/galaxies — 은하 목록
// ─────────────────────────────────────────────
router.get('/galaxies', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT code, name_ko, name_en, direction FROM dt_galaxies WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ galaxies: result.rows });
  } catch (err) {
    console.error('[DT] GET /galaxies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/galaxies/:code — 은하 상세
// ─────────────────────────────────────────────
router.get('/galaxies/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const galaxyResult = await db.query(
      'SELECT id, code, name_ko, name_en, direction, description FROM dt_galaxies WHERE code = $1 AND is_active = true',
      [code]
    );
    if (galaxyResult.rowCount === 0) {
      return res.status(404).json({ error: '은하를 찾을 수 없습니다' });
    }
    const galaxy = galaxyResult.rows[0];

    // constellations + stories (P1 테이블이 없으면 빈 배열 반환)
    let constellations = [];
    try {
      const constResult = await db.query(
        'SELECT id, code, name_ko, name_en FROM dt_constellations WHERE galaxy_id = $1',
        [galaxy.id]
      );
      for (const c of constResult.rows) {
        const storiesResult = await db.query(
          'SELECT id, title, story_text FROM dt_constellation_stories WHERE constellation_id = $1 LIMIT 5',
          [c.id]
        );
        constellations.push({ ...c, stories: storiesResult.rows });
      }
    } catch {
      // P1 테이블 미생성 시 graceful fallback
    }

    res.json({
      code:           galaxy.code,
      name_ko:        galaxy.name_ko,
      name_en:        galaxy.name_en,
      direction:      galaxy.direction,
      description:    galaxy.description,
      constellations,
    });

  } catch (err) {
    console.error('[DT] GET /galaxies/:code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/health — 헬스체크
// ─────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dreamtown-api', timestamp: new Date().toISOString() });
});

module.exports = router;
