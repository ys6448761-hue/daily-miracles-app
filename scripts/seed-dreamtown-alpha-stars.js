/**
 * DreamTown Closed Alpha Seed Stars
 * Star #0011 ~ #0020 (Closed Alpha 세계관 구축용)
 *
 * 목표: 처음 들어온 사람이 살아있는 DreamTown을 느끼게 한다.
 *
 * 기존 Seed Stars (#0001~#0010):
 *   #0001 Origin Star        → Growth
 *   #0002 Courage Star       → Challenge
 *   #0003 Healing Star       → Healing
 *   #0004~#0010             → 각 은하
 *
 * 이 스크립트 추가분 (#0011~#0020):
 *   #0011 Family Healing Star → Healing
 *   #0012 Courage Spark       → Challenge
 *   #0013 Heart Connection    → Relationship
 *   #0014 Quiet Light         → Healing
 *   #0015 Growth Path         → Growth
 *   #0016 Home Warmth         → Relationship
 *   #0017 Dream Spark         → Challenge
 *   #0018 Gratitude Light     → Growth
 *   #0019 Healing Dawn        → Healing
 *   #0020 New Horizon         → Challenge
 *
 * Usage: node scripts/seed-dreamtown-alpha-stars.js
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
    // #0011
    wishId:   '00000000-0000-0000-0000-000000001102',
    seedId:   '00000000-0000-0000-0000-000000001103',
    starId:   '00000000-0000-0000-0000-000000001104',
    wishText: '부모님이 오래 건강하게 함께했으면 좋겠습니다.',
    gemType:  'emerald',
    yeosuTheme: 'odongdo',
    starName: 'Family Healing Star',
    starSlug: 'family-healing-star',
    galaxy:   'healing',
    seedName: '가족의 치유 빛구슬',
  },
  {
    // #0012
    wishId:   '00000000-0000-0000-0000-000000001202',
    seedId:   '00000000-0000-0000-0000-000000001203',
    starId:   '00000000-0000-0000-0000-000000001204',
    wishText: '두려워도 새로운 일을 시작할 용기를 얻고 싶습니다.',
    gemType:  'ruby',
    yeosuTheme: 'hyangiram',
    starName: 'Bold Spark',
    starSlug: 'bold-spark',
    galaxy:   'challenge',
    seedName: '용기의 빛구슬',
  },
  {
    // #0013
    wishId:   '00000000-0000-0000-0000-000000001302',
    seedId:   '00000000-0000-0000-0000-000000001303',
    starId:   '00000000-0000-0000-0000-000000001304',
    wishText: '사랑하는 사람과 더 깊이 이해하며 살고 싶습니다.',
    gemType:  'diamond',
    yeosuTheme: 'night_sea',
    starName: 'Heart Connection',
    starSlug: 'heart-connection',
    galaxy:   'relationship',
    seedName: '마음 연결의 빛구슬',
  },
  {
    // #0014
    wishId:   '00000000-0000-0000-0000-000000001402',
    seedId:   '00000000-0000-0000-0000-000000001403',
    starId:   '00000000-0000-0000-0000-000000001404',
    wishText: '바쁜 일상 속에서도 마음의 쉼을 찾고 싶습니다.',
    gemType:  'citrine',
    yeosuTheme: 'odongdo',
    starName: 'Gentle Light',
    starSlug: 'gentle-light',
    galaxy:   'healing',
    seedName: '고요한 빛구슬',
  },
  {
    // #0015
    wishId:   '00000000-0000-0000-0000-000000001502',
    seedId:   '00000000-0000-0000-0000-000000001503',
    starId:   '00000000-0000-0000-0000-000000001504',
    wishText: '조금씩 더 나은 사람이 되고 싶습니다.',
    gemType:  'sapphire',
    yeosuTheme: 'odongdo',
    starName: 'Growth Path',
    starSlug: 'growth-path',
    galaxy:   'growth',
    seedName: '성장의 길 빛구슬',
  },
  {
    // #0016
    wishId:   '00000000-0000-0000-0000-000000001602',
    seedId:   '00000000-0000-0000-0000-000000001603',
    starId:   '00000000-0000-0000-0000-000000001604',
    wishText: '가족과 더 많은 시간을 함께 보내고 싶습니다.',
    gemType:  'emerald',
    yeosuTheme: 'night_sea',
    starName: 'Home Warmth',
    starSlug: 'home-warmth',
    galaxy:   'relationship',
    seedName: '따뜻한 집의 빛구슬',
  },
  {
    // #0017
    wishId:   '00000000-0000-0000-0000-000000001702',
    seedId:   '00000000-0000-0000-0000-000000001703',
    starId:   '00000000-0000-0000-0000-000000001704',
    wishText: '언젠가 꼭 이루고 싶은 꿈을 향해 한 걸음 나아가고 싶습니다.',
    gemType:  'ruby',
    yeosuTheme: 'hyangiram',
    starName: 'Dream Spark',
    starSlug: 'dream-spark',
    galaxy:   'challenge',
    seedName: '꿈의 빛구슬',
  },
  {
    // #0018
    wishId:   '00000000-0000-0000-0000-000000001802',
    seedId:   '00000000-0000-0000-0000-000000001803',
    starId:   '00000000-0000-0000-0000-000000001804',
    wishText: '매일 작은 감사들을 잊지 않고 살고 싶습니다.',
    gemType:  'citrine',
    yeosuTheme: 'odongdo',
    starName: 'Gratitude Light',
    starSlug: 'gratitude-light',
    galaxy:   'growth',
    seedName: '감사의 빛구슬',
  },
  {
    // #0019
    wishId:   '00000000-0000-0000-0000-000000001902',
    seedId:   '00000000-0000-0000-0000-000000001903',
    starId:   '00000000-0000-0000-0000-000000001904',
    wishText: '힘들었던 시간을 지나 다시 웃을 수 있기를 바랍니다.',
    gemType:  'emerald',
    yeosuTheme: 'night_sea',
    starName: 'Healing Dawn',
    starSlug: 'healing-dawn',
    galaxy:   'healing',
    seedName: '치유의 새벽 빛구슬',
  },
  {
    // #0020
    wishId:   '00000000-0000-0000-0000-000000002002',
    seedId:   '00000000-0000-0000-0000-000000002003',
    starId:   '00000000-0000-0000-0000-000000002004',
    wishText: '아직 보지 못한 나의 가능성을 발견하고 싶습니다.',
    gemType:  'sapphire',
    yeosuTheme: 'hyangiram',
    starName: 'Far Horizon',
    starSlug: 'far-horizon',
    galaxy:   'challenge',
    seedName: '새 지평의 빛구슬',
  },
];

async function run() {
  console.log('\n🌌 DreamTown Closed Alpha Seed Stars 시작 (#0011 ~ #0020)...\n');

  const galaxies = await pool.query('SELECT id, code FROM dt_galaxies');
  const galaxyMap = {};
  for (const g of galaxies.rows) galaxyMap[g.code] = g.id;

  let count = 11;
  for (const s of STARS) {
    await pool.query(`
      INSERT INTO dt_wishes (id, user_id, wish_text, gem_type, yeosu_theme, status)
      VALUES ($1, $2, $3, $4, $5, 'converted_to_star')
      ON CONFLICT (id) DO NOTHING
    `, [s.wishId, SYSTEM_USER_ID, s.wishText, s.gemType, s.yeosuTheme]);

    await pool.query(`
      INSERT INTO dt_star_seeds (id, wish_id, seed_name, seed_state)
      VALUES ($1, $2, $3, 'promoted')
      ON CONFLICT (id) DO NOTHING
    `, [s.seedId, s.wishId, s.seedName]);

    await pool.query(`
      INSERT INTO dt_stars
        (id, user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, birth_scene_version, star_stage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'v1', 'day1')
      ON CONFLICT (id) DO NOTHING
    `, [s.starId, SYSTEM_USER_ID, s.wishId, s.seedId, s.starName, s.starSlug, galaxyMap[s.galaxy]]);

    console.log(`✅ Star #${String(count).padStart(4, '0')} ${s.starName.padEnd(22)} → ${s.galaxy} | "${s.wishText}"`);
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
    console.log(`  #${String(i + 1).padStart(4, '0')} ${r.star_name.padEnd(24)} | ${r.galaxy.padEnd(12)} | "${r.wish_text}"`);
  });

  const byGalaxy = {};
  for (const r of all.rows) {
    byGalaxy[r.galaxy] = (byGalaxy[r.galaxy] || 0) + 1;
  }
  console.log('\n📊 은하별 Seed 집계:');
  for (const [galaxy, cnt] of Object.entries(byGalaxy)) {
    console.log(`  ${galaxy.padEnd(20)} ${cnt}개`);
  }

  console.log('\n🌌 Closed Alpha Seed Stars 완료.\n');
  await pool.end();
}

run().catch(err => {
  console.error('❌ Seed 실패:', err.message);
  process.exit(1);
});
