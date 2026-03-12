/**
 * DreamTown Sample Stars Seed
 * Star #0004 ~ #0010 (Private Test용 Seed Stars)
 *
 * 기존 Founding Stars:
 *   #0001 First Wish Star   → Growth Galaxy
 *   #0002 Courage Star      → Challenge Galaxy
 *   #0003 Healing Star      → Healing Galaxy
 *
 * 이 스크립트 추가분:
 *   #0004 Quiet Growth      → Growth Galaxy
 *   #0005 Braver Tomorrow   → Growth Galaxy
 *   #0006 New Beginning     → Challenge Galaxy
 *   #0007 Step Forward      → Challenge Galaxy
 *   #0008 Soft Night        → Healing Galaxy
 *   #0009 Resting Heart     → Healing Galaxy
 *   #0010 Reconnect         → Relationship Galaxy
 *
 * 배치 결과: Growth×3 / Challenge×3 / Healing×3 / Relationship×1
 *
 * Usage: node scripts/seed-dreamtown-sample-stars.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

const STARS = [
  {
    // #0004
    wishId:   '00000000-0000-0000-0000-000000000042',
    seedId:   '00000000-0000-0000-0000-000000000043',
    starId:   '00000000-0000-0000-0000-000000000044',
    wishText: '조금씩 나아가기를',
    gemType:  'sapphire',
    yeosuTheme: 'odongdo',
    starName: 'Quiet Growth',
    starSlug: 'quiet-growth',
    galaxy:   'growth',
    seedName: '조용한 성장의 빛구슬',
  },
  {
    // #0005
    wishId:   '00000000-0000-0000-0000-000000000052',
    seedId:   '00000000-0000-0000-0000-000000000053',
    starId:   '00000000-0000-0000-0000-000000000054',
    wishText: '내일은 조금 더 용감해지기를',
    gemType:  'diamond',
    yeosuTheme: 'night_sea',
    starName: 'Braver Tomorrow',
    starSlug: 'braver-tomorrow',
    galaxy:   'growth',
    seedName: '내일의 빛구슬',
  },
  {
    // #0006
    wishId:   '00000000-0000-0000-0000-000000000062',
    seedId:   '00000000-0000-0000-0000-000000000063',
    starId:   '00000000-0000-0000-0000-000000000064',
    wishText: '다시 시작할 용기를 얻기를',
    gemType:  'ruby',
    yeosuTheme: 'hyangiram',
    starName: 'New Beginning',
    starSlug: 'new-beginning',
    galaxy:   'challenge',
    seedName: '새 시작의 빛구슬',
  },
  {
    // #0007
    wishId:   '00000000-0000-0000-0000-000000000072',
    seedId:   '00000000-0000-0000-0000-000000000073',
    starId:   '00000000-0000-0000-0000-000000000074',
    wishText: '작은 첫걸음을 내딛기를',
    gemType:  'citrine',
    yeosuTheme: 'hyangiram',
    starName: 'Step Forward',
    starSlug: 'step-forward',
    galaxy:   'challenge',
    seedName: '첫걸음의 빛구슬',
  },
  {
    // #0008
    wishId:   '00000000-0000-0000-0000-000000000082',
    seedId:   '00000000-0000-0000-0000-000000000083',
    starId:   '00000000-0000-0000-0000-000000000084',
    wishText: '오늘 밤은 조금 덜 아프기를',
    gemType:  'emerald',
    yeosuTheme: 'odongdo',
    starName: 'Soft Night',
    starSlug: 'soft-night',
    galaxy:   'healing',
    seedName: '부드러운 밤의 빛구슬',
  },
  {
    // #0009
    wishId:   '00000000-0000-0000-0000-000000000092',
    seedId:   '00000000-0000-0000-0000-000000000093',
    starId:   '00000000-0000-0000-0000-000000000094',
    wishText: '내 마음이 잠시 쉬어가기를',
    gemType:  'sapphire',
    yeosuTheme: 'night_sea',
    starName: 'Resting Heart',
    starSlug: 'resting-heart',
    galaxy:   'healing',
    seedName: '쉬어가는 마음의 빛구슬',
  },
  {
    // #0010
    wishId:   '00000000-0000-0000-0000-000000000102',
    seedId:   '00000000-0000-0000-0000-000000000103',
    starId:   '00000000-0000-0000-0000-000000000104',
    wishText: '다시 연결될 수 있기를',
    gemType:  'ruby',
    yeosuTheme: 'night_sea',
    starName: 'Reconnect',
    starSlug: 'reconnect',
    galaxy:   'relationship',
    seedName: '연결의 빛구슬',
  },
];

async function run() {
  console.log('\n🌌 DreamTown Sample Stars Seed 시작 (#0004 ~ #0010)...\n');

  // Galaxy ID 맵
  const galaxies = await pool.query('SELECT id, code FROM dt_galaxies');
  const galaxyMap = {};
  for (const g of galaxies.rows) galaxyMap[g.code] = g.id;

  let count = 4; // #0001~#0003은 기존 스크립트에서 완료
  for (const s of STARS) {
    // wish
    await pool.query(`
      INSERT INTO dt_wishes (id, user_id, wish_text, gem_type, yeosu_theme, status)
      VALUES ($1, $2, $3, $4, $5, 'converted_to_star')
      ON CONFLICT (id) DO NOTHING
    `, [s.wishId, SYSTEM_USER_ID, s.wishText, s.gemType, s.yeosuTheme]);

    // seed
    await pool.query(`
      INSERT INTO dt_star_seeds (id, wish_id, seed_name, seed_state)
      VALUES ($1, $2, $3, 'promoted')
      ON CONFLICT (id) DO NOTHING
    `, [s.seedId, s.wishId, s.seedName]);

    // star
    await pool.query(`
      INSERT INTO dt_stars
        (id, user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, birth_scene_version, star_stage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'v1', 'day1')
      ON CONFLICT (id) DO NOTHING
    `, [s.starId, SYSTEM_USER_ID, s.wishId, s.seedId, s.starName, s.starSlug, galaxyMap[s.galaxy]]);

    console.log(`✅ Star #${String(count).padStart(4, '0')} ${s.starName.padEnd(20)} → ${s.galaxy} | "${s.wishText}"`);
    count++;
  }

  // 전체 Seed Stars 확인
  const all = await pool.query(`
    SELECT s.star_name, w.wish_text, g.code AS galaxy_code, g.name_ko AS galaxy
    FROM dt_stars s
    JOIN dt_wishes w ON w.id = s.wish_id
    JOIN dt_galaxies g ON g.id = s.galaxy_id
    WHERE s.user_id = $1
    ORDER BY s.created_at
  `, [SYSTEM_USER_ID]);

  console.log('\n🌟 전체 Seed Stars 확인:');
  all.rows.forEach((r, i) => {
    console.log(`  #${String(i + 1).padStart(4, '0')} ${r.star_name.padEnd(22)} | ${r.galaxy.padEnd(10)} | "${r.wish_text}"`);
  });

  // 은하별 집계
  const byGalaxy = {};
  for (const r of all.rows) {
    byGalaxy[r.galaxy] = (byGalaxy[r.galaxy] || 0) + 1;
  }
  console.log('\n📊 은하별 Seed 집계:');
  for (const [galaxy, cnt] of Object.entries(byGalaxy)) {
    console.log(`  ${galaxy.padEnd(20)} ${cnt}개`);
  }

  console.log('\n🌌 DreamTown Seed Stars 완료. Private Test 준비 완성.\n');
  await pool.end();
}

run().catch(err => {
  console.error('❌ Seed 실패:', err.message);
  process.exit(1);
});
