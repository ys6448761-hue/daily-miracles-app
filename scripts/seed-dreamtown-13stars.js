/**
 * DreamTown Seed Stars v2 — 13 Seed Stars
 * AIL-DT-006: 테스트 별 정리 + Seed Stars 전체 교체
 *
 * 실행 전 주의:
 *   - 시스템 계정(Aurora5) 외 모든 별/소원 삭제
 *   - 기존 Founding Stars 3개 삭제 후 새 13개로 교체
 *
 * Usage: node scripts/seed-dreamtown-13stars.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── 고정 ID ────────────────────────────────────────────────
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

// UUID 생성 헬퍼 (고정 패턴)
const starId  = (n) => `00000000-0000-0000-0001-${String(n).padStart(12, '0')}`;
const wishId  = (n) => `00000000-0000-0000-0002-${String(n).padStart(12, '0')}`;
const seedId  = (n) => `00000000-0000-0000-0003-${String(n).padStart(12, '0')}`;

// ── Seed Star 정의 ──────────────────────────────────────────
const SEED_STARS = [
  {
    n: 1, galaxy: 'growth',
    wish: '매일 조금씩 어제보다 나은 내가 되고 싶어요',
    gem: 'sapphire',
    name: '어제보다의 별',
    slug: 'yesterday-star',
    daysAgo: 14,
    logs: [
      { dPlus: 1, emotion: '좀 정리됐어요', tag: '정리',  growth: '어제보다 조금 더 명확해졌어요' },
      { dPlus: 5, emotion: '좀 용기났어요', tag: '실행',  growth: '작은 것 하나를 실제로 해봤어요' },
      { dPlus: 11, emotion: '좀 믿고 싶어졌어요', tag: '성장', growth: '조금씩 달라지고 있다는 걸 느꼈어요' },
    ],
  },
  {
    n: 2, galaxy: 'challenge',
    wish: '두려워서 못 했던 그 일을 한 번 해보고 싶어요',
    gem: 'ruby',
    name: '두려움 너머의 별',
    slug: 'beyond-fear-star',
    daysAgo: 11,
    logs: [
      { dPlus: 1, emotion: '좀 용기났어요',     tag: '실행',  growth: '두려움을 인정하니 조금 가벼워졌어요' },
      { dPlus: 6, emotion: '좀 믿고 싶어졌어요', tag: '믿음',  growth: '나도 할 수 있다는 생각이 생겼어요' },
    ],
  },
  {
    n: 3, galaxy: 'healing',
    wish: '오래된 상처 하나를 내려놓고 싶어요',
    gem: 'emerald',
    name: '내려놓음의 별',
    slug: 'letting-go-star',
    daysAgo: 9,
    logs: [
      { dPlus: 1, emotion: '좀 편해졌어요', tag: '위로',   growth: '오래된 감정을 꺼내봤어요' },
      { dPlus: 4, emotion: '좀 정리됐어요', tag: '놓아줌', growth: '조금 숨이 쉬어졌어요' },
    ],
  },
  {
    n: 4, galaxy: 'relationship',
    wish: '멀어진 그 사람과 다시 따뜻해지고 싶어요',
    gem: 'citrine',
    name: '따뜻해짐의 별',
    slug: 'warm-again-star',
    daysAgo: 8,
    logs: [
      { dPlus: 1, emotion: '좀 편해졌어요',     tag: '연결',    growth: '그 사람을 다시 생각해봤어요' },
      { dPlus: 5, emotion: '좀 믿고 싶어졌어요', tag: '마음열기', growth: '먼저 다가가고 싶어졌어요' },
    ],
  },
  {
    n: 5, galaxy: 'healing',
    wish: '나를 미워하는 것을 멈추고 그냥 나를 좋아해 주고 싶어요',
    gem: 'emerald',
    name: '자기사랑의 별',
    slug: 'self-love-star',
    daysAgo: 12,
    logs: [
      { dPlus: 1, emotion: '좀 편해졌어요', tag: '위로',   growth: '나를 미워하지 않아도 된다는 걸 떠올렸어요' },
      { dPlus: 7, emotion: '좀 정리됐어요', tag: '수용',   growth: '있는 그대로의 나를 봐주기 시작했어요' },
      { dPlus: 10, emotion: '좀 편해졌어요', tag: '다정함', growth: '나에게 조금 부드러워졌어요' },
    ],
  },
  {
    n: 6, galaxy: 'growth',
    wish: '올해는 미루던 한 걸음을 드디어 시작하고 싶어요',
    gem: 'diamond',
    name: '한 걸음의 별',
    slug: 'one-step-star',
    daysAgo: 7,
    logs: [
      { dPlus: 1, emotion: '좀 용기났어요', tag: '실행', growth: '미뤄온 이유를 솔직하게 들여다봤어요' },
      { dPlus: 4, emotion: '좀 정리됐어요', tag: '정리', growth: '첫 발을 어디서부터 내딛을지 보였어요' },
    ],
  },
  {
    n: 7, galaxy: 'relationship',
    wish: '하고 싶은 말을 더 잘 표현하고 싶어요',
    gem: 'citrine',
    name: '표현의 별',
    slug: 'expression-star',
    daysAgo: 5,
    logs: [
      { dPlus: 1, emotion: '좀 정리됐어요', tag: '표현', growth: '말하지 못했던 이유를 알아챘어요' },
      { dPlus: 3, emotion: '좀 용기났어요', tag: '연결', growth: '작은 한마디를 건네봤어요' },
    ],
  },
  {
    n: 8, galaxy: 'challenge',
    wish: '아직 늦지 않았다는 걸 나 스스로 믿고 싶어요',
    gem: 'ruby',
    name: '믿음의 별',
    slug: 'belief-star',
    daysAgo: 10,
    logs: [
      { dPlus: 1, emotion: '좀 믿고 싶어졌어요', tag: '믿음', growth: '늦었다는 생각이 두려움에서 온다는 걸 알았어요' },
      { dPlus: 6, emotion: '좀 용기났어요',      tag: '실행', growth: '지금 이 순간부터가 시작이라고 느꼈어요' },
      { dPlus: 9, emotion: '좀 정리됐어요',      tag: '성장', growth: '어제보다 조금 더 나를 믿게 됐어요' },
    ],
  },
  {
    n: 9, galaxy: 'relationship',
    wish: '소중한 사람에게 고마워를 더 자주 말하고 싶어요',
    gem: 'citrine',
    name: '감사의 별',
    slug: 'gratitude-star',
    daysAgo: 6,
    logs: [
      { dPlus: 1, emotion: '좀 편해졌어요',     tag: '감사',    growth: '오늘 고마운 사람이 떠올랐어요' },
      { dPlus: 4, emotion: '좀 믿고 싶어졌어요', tag: '연결',    growth: '말로 전하는 것이 두렵지 않아졌어요' },
    ],
  },
  {
    n: 10, galaxy: 'healing',
    wish: '나에게 조금 더 다정해지고 싶어요',
    gem: 'emerald',
    name: '다정함의 별',
    slug: 'gentleness-star',
    daysAgo: 13,
    logs: [
      { dPlus: 1,  emotion: '좀 편해졌어요', tag: '다정함', growth: '나를 다그치는 말투를 알아챘어요' },
      { dPlus: 5,  emotion: '좀 정리됐어요', tag: '수용',   growth: '완벽하지 않아도 괜찮다고 느꼈어요' },
      { dPlus: 10, emotion: '좀 편해졌어요', tag: '위로',   growth: '나에게 조금 부드럽게 말해봤어요' },
    ],
  },
  {
    n: 11, galaxy: 'challenge',
    wish: '그 한 걸음을 드디어 내딛고 싶어요',
    gem: 'diamond',
    name: '내딛음의 별',
    slug: 'first-step-star',
    daysAgo: 3,
    logs: [
      { dPlus: 1, emotion: '좀 용기났어요', tag: '실행', growth: '멈춰 있던 이유를 처음으로 써봤어요' },
      { dPlus: 2, emotion: '좀 정리됐어요', tag: '정리', growth: '딱 하나만 먼저 해보기로 했어요' },
    ],
  },
  {
    n: 12, galaxy: 'growth',
    wish: '조금 더 나를 믿어보고 싶어요',
    gem: 'sapphire',
    name: '자기신뢰의 별',
    slug: 'self-trust-star',
    daysAgo: 4,
    logs: [
      { dPlus: 1, emotion: '좀 믿고 싶어졌어요', tag: '믿음', growth: '내 판단을 의심해온 습관을 알아챘어요' },
      { dPlus: 3, emotion: '좀 정리됐어요',      tag: '성장', growth: '작은 결정 하나를 스스로 내려봤어요' },
    ],
  },
  {
    n: 13, galaxy: 'healing',
    wish: '마음 편히 쉴 수 있으면 좋겠어요',
    gem: 'emerald',
    name: '쉼의 별',
    slug: 'rest-star',
    daysAgo: 2,
    logs: [
      { dPlus: 1, emotion: '좀 편해졌어요', tag: '위로', growth: '아무것도 하지 않아도 된다고 허락해봤어요' },
    ],
  },
];

// ── 유틸: n일 전 날짜 ────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function addDays(baseIso, n) {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + n);
  // 약간의 시간 변화 (자정 이후 오후 시간대)
  d.setHours(14 + (n % 6), 30, 0, 0);
  return d.toISOString();
}

async function run() {
  console.log('\n🌌 DreamTown Seed Stars v2 시작...\n');

  // ── 0. Galaxy IDs ──────────────────────────────────────────
  const galaxies = await pool.query('SELECT id, code FROM dt_galaxies');
  const galaxyMap = {};
  for (const g of galaxies.rows) galaxyMap[g.code] = g.id;

  // ── 1. 테스트 별 정리 ──────────────────────────────────────
  console.log('🧹 테스트 데이터 정리 중...');

  // voyage_logs: 시스템 계정 외 삭제
  const delLogs = await pool.query(
    `DELETE FROM dt_voyage_logs WHERE user_id != $1`,
    [SYSTEM_USER_ID]
  );
  console.log(`  voyage_logs 삭제: ${delLogs.rowCount}건`);

  // stars: 시스템 계정 외 삭제
  const delStars = await pool.query(
    `DELETE FROM dt_stars WHERE user_id != $1`,
    [SYSTEM_USER_ID]
  );
  console.log(`  stars 삭제: ${delStars.rowCount}건`);

  // star_seeds: 고아 데이터 삭제
  const delSeeds = await pool.query(`
    DELETE FROM dt_star_seeds
    WHERE wish_id IN (
      SELECT id FROM dt_wishes WHERE user_id != $1
    )
  `, [SYSTEM_USER_ID]);
  console.log(`  star_seeds 삭제: ${delSeeds.rowCount}건`);

  // wishes: 시스템 계정 외 삭제
  const delWishes = await pool.query(
    `DELETE FROM dt_wishes WHERE user_id != $1`,
    [SYSTEM_USER_ID]
  );
  console.log(`  wishes 삭제: ${delWishes.rowCount}건`);

  // 기존 시스템 voyage_logs (founding stars) 삭제 후 재생성
  await pool.query(`DELETE FROM dt_voyage_logs WHERE user_id = $1`, [SYSTEM_USER_ID]);
  // 기존 시스템 stars 삭제 후 재생성
  await pool.query(`DELETE FROM dt_stars WHERE user_id = $1`, [SYSTEM_USER_ID]);
  await pool.query(`DELETE FROM dt_star_seeds WHERE wish_id IN (SELECT id FROM dt_wishes WHERE user_id = $1)`, [SYSTEM_USER_ID]);
  await pool.query(`DELETE FROM dt_wishes WHERE user_id = $1`, [SYSTEM_USER_ID]);
  console.log('  기존 founding stars 삭제 완료\n');

  // ── 2. Seed Stars 생성 ─────────────────────────────────────
  console.log('⭐ Seed Stars 생성 중...\n');

  for (const s of SEED_STARS) {
    const createdAt = daysAgo(s.daysAgo);

    // wish
    await pool.query(`
      INSERT INTO dt_wishes (id, user_id, wish_text, gem_type, yeosu_theme, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'night_sea', 'converted_to_star', $5, $5)
      ON CONFLICT (id) DO UPDATE
        SET wish_text = EXCLUDED.wish_text, updated_at = EXCLUDED.updated_at
    `, [wishId(s.n), SYSTEM_USER_ID, s.wish, s.gem, createdAt]);

    // star_seed
    await pool.query(`
      INSERT INTO dt_star_seeds (id, wish_id, seed_name, seed_state, created_at)
      VALUES ($1, $2, $3, 'promoted', $4)
      ON CONFLICT (id) DO UPDATE SET seed_name = EXCLUDED.seed_name
    `, [seedId(s.n), wishId(s.n), `${s.name} 빛구슬`, createdAt]);

    // star
    await pool.query(`
      INSERT INTO dt_stars
        (id, user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, birth_scene_version, star_stage, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'v1', 'day1', $8, $8)
      ON CONFLICT (id) DO UPDATE
        SET star_name = EXCLUDED.star_name, updated_at = EXCLUDED.updated_at
    `, [starId(s.n), SYSTEM_USER_ID, wishId(s.n), seedId(s.n), s.name, s.slug, galaxyMap[s.galaxy], createdAt]);

    // voyage logs
    for (const log of s.logs) {
      const loggedAt = addDays(createdAt, log.dPlus - 1);
      await pool.query(`
        INSERT INTO dt_voyage_logs
          (user_id, star_id, emotion, tag, growth, source, logged_at)
        VALUES ($1, $2, $3, $4, $5, 'daily', $6)
      `, [SYSTEM_USER_ID, starId(s.n), log.emotion, log.tag, log.growth, loggedAt]);
    }

    const galaxyLabel = { growth: '성장', challenge: '도전', healing: '치유', relationship: '관계' };
    console.log(`  ✅ #${String(s.n).padStart(4,'0')} ${s.name.padEnd(12)} | ${galaxyLabel[s.galaxy]} | "${s.wish.slice(0, 20)}..." | 항해 ${s.logs.length}건`);
  }

  // ── 3. 최종 확인 ──────────────────────────────────────────
  const total = await pool.query(`SELECT COUNT(*) FROM dt_stars WHERE user_id = $1`, [SYSTEM_USER_ID]);
  const totalLogs = await pool.query(`SELECT COUNT(*) FROM dt_voyage_logs WHERE user_id = $1`, [SYSTEM_USER_ID]);
  console.log(`\n🌌 총 별: ${total.rows[0].count}개 | 항해 로그: ${totalLogs.rows[0].count}건`);
  console.log('\n🐢 DreamTown Seed Stars v2 완료!\n');

  await pool.end();
}

run().catch(err => {
  console.error('❌ Seed 실패:', err.message);
  process.exit(1);
});
