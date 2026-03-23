/**
 * DreamTown First Star Seed
 * Canon #0001 — "First Wish Star"
 * Usage: node scripts/seed-dreamtown-first-star.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const FIRST_STAR_USER_ID   = '00000000-0000-0000-0000-000000000001';
const FIRST_STAR_WISH_ID   = '00000000-0000-0000-0000-000000000002';
const FIRST_STAR_SEED_ID   = '00000000-0000-0000-0000-000000000003';
const FIRST_STAR_ID        = '00000000-0000-0000-0000-000000000004';

async function run() {
  console.log('\n⭐ DreamTown First Star Seed 시작...\n');

  // user (Aurora5 시스템 계정)
  await pool.query(`
    INSERT INTO dt_users (id, nickname, provider)
    VALUES ($1, 'Aurora5', 'system')
    ON CONFLICT (id) DO NOTHING
  `, [FIRST_STAR_USER_ID]);
  console.log('① Aurora5 system user 등록');

  // wish
  await pool.query(`
    INSERT INTO dt_wishes (id, user_id, wish_text, gem_type, yeosu_theme, status)
    VALUES ($1, $2, '조금 더 나아지기를', 'sapphire', 'night_sea', 'converted_to_star')
    ON CONFLICT (id) DO NOTHING
  `, [FIRST_STAR_WISH_ID, FIRST_STAR_USER_ID]);
  console.log('② wish 등록: "조금 더 나아지기를"');

  // galaxy
  const g = await pool.query("SELECT id FROM dt_galaxies WHERE code = 'growth'");
  const galaxyId = g.rows[0].id;

  // star_seed
  await pool.query(`
    INSERT INTO dt_star_seeds (id, wish_id, seed_name, seed_state)
    VALUES ($1, $2, '첫 번째 빛구슬', 'promoted')
    ON CONFLICT (id) DO NOTHING
  `, [FIRST_STAR_SEED_ID, FIRST_STAR_WISH_ID]);
  console.log('③ star_seed 등록');

  // star
  await pool.query(`
    INSERT INTO dt_stars
      (id, user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, birth_scene_version, star_stage)
    VALUES ($1, $2, $3, $4, 'First Wish Star', 'first-wish-star', $5, 'v1', 'day1')
    ON CONFLICT (id) DO NOTHING
  `, [FIRST_STAR_ID, FIRST_STAR_USER_ID, FIRST_STAR_WISH_ID, FIRST_STAR_SEED_ID, galaxyId]);
  console.log('④ star 등록: First Wish Star (STAR-0001)');

  // 확인
  const check = await pool.query(`
    SELECT s.star_name, s.star_slug, w.wish_text, g.name_ko AS galaxy
    FROM dt_stars s
    JOIN dt_wishes w ON w.id = s.wish_id
    JOIN dt_galaxies g ON g.id = s.galaxy_id
    WHERE s.id = $1
  `, [FIRST_STAR_ID]);

  console.log('\n✅ First Star Canon 확인:');
  console.log(JSON.stringify(check.rows[0], null, 2));
  console.log('\n🌟 DreamTown의 첫 번째 빛이 심어졌습니다.\n');

  await pool.end();
}

run().catch(err => {
  console.error('❌ Seed 실패:', err.message);
  process.exit(1);
});
