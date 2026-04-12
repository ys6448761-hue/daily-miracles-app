'use strict';
/**
 * scripts/createSampleStars.js
 * 파트너별 샘플 별 5개 자동 생성
 *
 * 실행 전: migration 116 실행 필요
 * 실행: node scripts/createSampleStars.js
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');

// 세계관에 맞는 샘플 소원 10개
const SAMPLE_WISHES = [
  '여수에서 소중한 사람과 행복한 시간을 보내고 싶어요',
  '올해는 꼭 하고 싶은 일을 시작하고 싶어요',
  '가족 모두 건강하고 행복했으면 좋겠어요',
  '새로운 도전을 두려워하지 않는 용기를 갖고 싶어요',
  '매일 조금씩 더 나은 내가 되고 싶어요',
  '소중한 인연들과 오래오래 함께하고 싶어요',
  '여수 바다처럼 넓은 마음을 갖고 싶어요',
  '꿈꾸던 일이 현실이 되는 기적을 경험하고 싶어요',
  '지금 이 순간을 오래 기억하고 싶어요',
  '별처럼 빛나는 하루하루를 살고 싶어요',
];

// 은하별 소원 인덱스 + 별 이름
const GALAXY_CONFIG = {
  healing: {
    wishIdx: [0, 2, 6, 8, 9],
    names:   ['쉬어가는 별', '따뜻한 빛', '고요한 별', '위로의 별', '평온한 빛'],
    gemType: 'aquamarine',
  },
  relationship: {
    wishIdx: [0, 2, 5, 6, 9],
    names:   ['연결의 별', '함께하는 빛', '인연의 별', '따뜻한 만남', '소중한 빛'],
    gemType: 'rose_quartz',
  },
  challenge: {
    wishIdx: [1, 3, 4, 7, 9],
    names:   ['도전의 별', '용기의 빛', '새벽의 별', '앞으로의 빛', '시작의 별'],
    gemType: 'topaz',
  },
  growth: {
    wishIdx: [1, 4, 7, 8, 9],
    names:   ['성장의 별', '배움의 빛', '내일의 별', '가능성의 빛', '변화의 별'],
    gemType: 'emerald',
  },
  miracle: {
    wishIdx: [0, 7, 8, 9, 2],
    names:   ['기적의 별', '소원의 빛', '여수의 별', '꿈의 빛', '하루의 기적'],
    gemType: 'diamond',
  },
};

// 기본값 (unknown galaxy_type)
const DEFAULT_CONFIG = GALAXY_CONFIG.miracle;

async function getOrCreateDemoUser(loginId) {
  const email = `demo_${loginId}@sample.dreamtown`;
  // 기존 데모 유저 조회
  const existing = await db.query(
    `SELECT id FROM dt_users WHERE email = $1 LIMIT 1`,
    [email]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  // 신규 생성
  const r = await db.query(
    `INSERT INTO dt_users (nickname, email, is_sample)
     VALUES ($1, $2, TRUE)
     RETURNING id`,
    [`샘플_${loginId}`, email]
  );
  return r.rows[0].id;
}

async function getGalaxyId(galaxyType) {
  const r = await db.query(
    `SELECT id FROM dt_galaxies WHERE code = $1 LIMIT 1`,
    [galaxyType]
  );
  if (r.rows.length === 0) {
    // 폴백: miracle
    const fallback = await db.query(
      `SELECT id FROM dt_galaxies WHERE code = 'miracle' LIMIT 1`
    );
    return fallback.rows[0]?.id ?? null;
  }
  return r.rows[0].id;
}

async function getOrCreateStarSeed(userId, wishId) {
  // 기존 시드 조회
  const existing = await db.query(
    `SELECT id FROM dt_star_seeds WHERE wish_id = $1 LIMIT 1`,
    [wishId]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  // 시드 생성
  const r = await db.query(
    `INSERT INTO dt_star_seeds (wish_id, seed_name)
     VALUES ($1, $2)
     RETURNING id`,
    [wishId, '샘플 시드']
  );
  return r.rows[0].id;
}

async function createSampleStars() {
  console.log('🌟 샘플 별 생성 시작\n');

  // 파트너 목록
  const partners = await db.query(
    `SELECT login_id, galaxy_type
     FROM partner_accounts
     WHERE is_active = TRUE
     ORDER BY login_id`
  );
  console.log(`파트너 ${partners.rowCount}개 처리 중...\n`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const partner of partners.rows) {
    const galaxyType = partner.galaxy_type || 'miracle';
    const cfg        = GALAXY_CONFIG[galaxyType] || DEFAULT_CONFIG;

    const galaxyId = await getGalaxyId(galaxyType);
    if (!galaxyId) {
      console.log(`  ⚠️  ${partner.login_id} — galaxy_id 없음 (건너뜀)`);
      continue;
    }

    // 이미 샘플 별이 있으면 건너뜀
    const existing = await db.query(
      `SELECT COUNT(*) AS cnt FROM dt_stars
       WHERE partner_id = $1 AND is_sample = TRUE`,
      [partner.login_id]
    );
    if (parseInt(existing.rows[0].cnt, 10) >= 5) {
      console.log(`  ⏭  ${partner.login_id} — 이미 샘플 5개 있음`);
      totalSkipped += 5;
      continue;
    }

    const demoUserId = await getOrCreateDemoUser(partner.login_id);
    let count = 0;

    for (let i = 0; i < 5; i++) {
      const wishText = SAMPLE_WISHES[cfg.wishIdx[i]];
      const starName = cfg.names[i];

      try {
        // wish 생성
        const wishR = await db.query(
          `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status)
           VALUES ($1, $2, $3, 'fulfilled')
           RETURNING id`,
          [demoUserId, wishText, cfg.gemType]
        );
        const wishId = wishR.rows[0].id;

        // star_seed 생성
        const seedId = await getOrCreateStarSeed(demoUserId, wishId);

        // 별 생성 (created_at을 i일 전으로 분산)
        await db.query(
          `INSERT INTO dt_stars
             (user_id, wish_id, star_seed_id, star_name, galaxy_id,
              is_sample, partner_id,
              created_at, updated_at)
           VALUES
             ($1,$2,$3,$4,$5, TRUE,$6,
              NOW() - ($7 || ' days')::INTERVAL,
              NOW() - ($7 || ' days')::INTERVAL)`,
          [demoUserId, wishId, seedId, starName, galaxyId,
           partner.login_id, String(i * 3)]
        );
        count++;
      } catch (e) {
        console.log(`    ⚠️  별 ${i+1} 생성 실패: ${e.message}`);
      }
    }

    console.log(`  ✅ ${partner.login_id} (${galaxyType}) → ${count}개 샘플 별 생성`);
    totalCreated += count;
  }

  console.log(`\n🌟 완료! 총 ${totalCreated}개 생성, ${totalSkipped}개 건너뜀`);
}

createSampleStars().catch(console.error).finally(() => process.exit());
