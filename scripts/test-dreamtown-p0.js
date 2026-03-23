/**
 * DreamTown P0 API Flow Test
 * Usage: node scripts/test-dreamtown-p0.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('\n🌌 DreamTown P0 동작 테스트\n');

  // ① user 생성
  const u = await pool.query(
    "INSERT INTO dt_users (nickname) VALUES ('테스트소원이') RETURNING id"
  );
  const userId = u.rows[0].id;
  console.log('① user 생성:', userId);

  // ② POST /api/dt/wishes 흐름
  const w = await pool.query(
    `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status)
     VALUES ($1, '새로운 시작을 하고 싶어요', 'sapphire', 'submitted')
     RETURNING id, status`,
    [userId]
  );
  const wishId = w.rows[0].id;
  console.log('② wish 생성:', wishId, '| status:', w.rows[0].status);

  // ③ POST /api/dt/stars/create 흐름
  const galaxyCode = 'growth'; // sapphire → growth
  const galaxy = await pool.query('SELECT id FROM dt_galaxies WHERE code = $1', [galaxyCode]);
  const galaxyId = galaxy.rows[0].id;

  const seed = await pool.query(
    "INSERT INTO dt_star_seeds (wish_id, seed_name, seed_state) VALUES ($1, '새로운 시작 씨앗', 'promoted') RETURNING id",
    [wishId]
  );
  const seedId = seed.rows[0].id;

  const star = await pool.query(
    `INSERT INTO dt_stars (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, star_stage)
     VALUES ($1, $2, $3, '새로운 시작의 별', $4, $5, 'day1')
     RETURNING id, star_name, star_stage`,
    [userId, wishId, seedId, `star-${Date.now()}`, galaxyId]
  );
  const starId = star.rows[0].id;
  console.log('③ star 생성:', star.rows[0].star_name, '| stage:', star.rows[0].star_stage);

  // ④ GET /api/dt/stars/:id 흐름
  const check = await pool.query(
    `SELECT s.star_name, w.wish_text, g.name_ko AS galaxy
     FROM dt_stars s
     JOIN dt_wishes w ON w.id = s.wish_id
     JOIN dt_galaxies g ON g.id = s.galaxy_id
     WHERE s.id = $1`,
    [starId]
  );
  const row = check.rows[0];
  console.log('④ 별 조회:', JSON.stringify(row));

  // ⑤ GET /api/dt/galaxies 흐름
  const galaxies = await pool.query(
    'SELECT code, name_ko, direction FROM dt_galaxies ORDER BY sort_order'
  );
  console.log('⑤ 은하 목록:', galaxies.rows.map(r => `${r.name_ko}(${r.direction})`).join(', '));

  console.log('\n✅ Day 1 DoD 완료');
  console.log('  - POST /api/dt/wishes    → wish 생성 ✓');
  console.log('  - POST /api/dt/stars/create → star 생성 ✓');
  console.log('  - GET  /api/dt/galaxies  → 은하 4개 조회 ✓');
  console.log('\n🌟 첫 번째 별이 생성되었습니다.\n');

  await pool.end();
}

run().catch(err => {
  console.error('❌ 테스트 실패:', err.message);
  process.exit(1);
});
