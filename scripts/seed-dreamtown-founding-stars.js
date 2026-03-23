/**
 * DreamTown Founding Stars Seed
 * Star #0002 Courage Star + Star #0003 Healing Star
 * (#0001 First Wish Star은 seed-dreamtown-first-star.js에서 완료)
 * Usage: node scripts/seed-dreamtown-founding-stars.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 고정 UUID
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'; // Aurora5 system (기존)

const COURAGE_WISH_ID = '00000000-0000-0000-0000-000000000012';
const COURAGE_SEED_ID = '00000000-0000-0000-0000-000000000013';
const COURAGE_STAR_ID = '00000000-0000-0000-0000-000000000014';

const HEALING_WISH_ID = '00000000-0000-0000-0000-000000000022';
const HEALING_SEED_ID = '00000000-0000-0000-0000-000000000023';
const HEALING_STAR_ID = '00000000-0000-0000-0000-000000000024';

async function run() {
  console.log('\n🌟 DreamTown Founding Stars Seed 시작...\n');

  // Galaxy IDs
  const galaxies = await pool.query('SELECT id, code FROM dt_galaxies');
  const galaxyMap = {};
  for (const g of galaxies.rows) galaxyMap[g.code] = g.id;

  // ── Star #0002: Courage Star ──────────────────
  await pool.query(`
    INSERT INTO dt_wishes (id, user_id, wish_text, gem_type, yeosu_theme, status)
    VALUES ($1, $2, '한 번 더 도전해보고 싶어요', 'ruby', 'hyangiram', 'converted_to_star')
    ON CONFLICT (id) DO NOTHING
  `, [COURAGE_WISH_ID, SYSTEM_USER_ID]);

  await pool.query(`
    INSERT INTO dt_star_seeds (id, wish_id, seed_name, seed_state)
    VALUES ($1, $2, '용기의 빛구슬', 'promoted')
    ON CONFLICT (id) DO NOTHING
  `, [COURAGE_SEED_ID, COURAGE_WISH_ID]);

  await pool.query(`
    INSERT INTO dt_stars
      (id, user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, birth_scene_version, star_stage)
    VALUES ($1, $2, $3, $4, 'Courage Star', 'courage-star', $5, 'v1', 'day1')
    ON CONFLICT (id) DO NOTHING
  `, [COURAGE_STAR_ID, SYSTEM_USER_ID, COURAGE_WISH_ID, COURAGE_SEED_ID, galaxyMap['challenge']]);

  console.log('✅ Star #0002 Courage Star → Challenge Galaxy');

  // ── Star #0003: Healing Star ──────────────────
  await pool.query(`
    INSERT INTO dt_wishes (id, user_id, wish_text, gem_type, yeosu_theme, status)
    VALUES ($1, $2, '마음이 조금 편해지기를', 'emerald', 'odongdo', 'converted_to_star')
    ON CONFLICT (id) DO NOTHING
  `, [HEALING_WISH_ID, SYSTEM_USER_ID]);

  await pool.query(`
    INSERT INTO dt_star_seeds (id, wish_id, seed_name, seed_state)
    VALUES ($1, $2, '치유의 빛구슬', 'promoted')
    ON CONFLICT (id) DO NOTHING
  `, [HEALING_SEED_ID, HEALING_WISH_ID]);

  await pool.query(`
    INSERT INTO dt_stars
      (id, user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, birth_scene_version, star_stage)
    VALUES ($1, $2, $3, $4, 'Healing Star', 'healing-star', $5, 'v1', 'day1')
    ON CONFLICT (id) DO NOTHING
  `, [HEALING_STAR_ID, SYSTEM_USER_ID, HEALING_WISH_ID, HEALING_SEED_ID, galaxyMap['healing']]);

  console.log('✅ Star #0003 Healing Star → Healing Galaxy');

  // 전체 확인
  const all = await pool.query(`
    SELECT s.star_name, s.star_slug, w.wish_text, g.name_ko AS galaxy
    FROM dt_stars s
    JOIN dt_wishes w ON w.id = s.wish_id
    JOIN dt_galaxies g ON g.id = s.galaxy_id
    WHERE s.id IN ($1, $2, $3)
    ORDER BY s.created_at
  `, [
    '00000000-0000-0000-0000-000000000004', // STAR-0001
    COURAGE_STAR_ID,
    HEALING_STAR_ID,
  ]);

  console.log('\n🌌 Founding Stars 전체 확인:');
  all.rows.forEach((r, i) => {
    console.log(`  #${String(i + 1).padStart(4, '0')} ${r.star_name.padEnd(20)} | ${r.galaxy} | "${r.wish_text}"`);
  });

  console.log('\n📍 Relationship Galaxy → 첫 번째 실제 사용자의 별을 기다리는 중...\n');

  await pool.end();
}

run().catch(err => {
  console.error('❌ Seed 실패:', err.message);
  process.exit(1);
});
