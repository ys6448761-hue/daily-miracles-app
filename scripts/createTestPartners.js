'use strict';
/**
 * scripts/createTestPartners.js
 * 테스트 업체 3곳 + 별 7개씩 일괄 생성
 *
 * 실행: node scripts/createTestPartners.js
 * 재실행 안전: 중복 방지 로직 포함 (login_id ON CONFLICT)
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt         = require('bcryptjs');
const db             = require('../database/db');

// ── 비밀번호 ─────────────────────────────────────────────────────────
const TEST_PASSWORD = 'ys1234';

// ── 업체 정의 ─────────────────────────────────────────────────────────
const PARTNERS = [
  {
    name:       '여수해상케이블카',
    address:    '전라남도 여수시 돌산읍 돌산로 3600-1',
    phone:      '061-664-7301',
    category:   'activity',
    galaxy:     'challenge',
    loginId:    'DT-YS-A901',
    gemType:    'topaz',
    starNames:  ['도전의 별', '용기의 빛', '새벽의 별', '앞으로의 빛', '시작의 별', '높이의 별', '바람의 별'],
  },
  {
    name:       '여수 유탑마리나 호텔',
    address:    '전라남도 여수시 오동도로 61-15',
    phone:      '061-690-8000',
    category:   'accommodation',
    galaxy:     'healing',
    loginId:    'DT-YS-C901',
    gemType:    'aquamarine',
    starNames:  ['쉬어가는 별', '따뜻한 빛', '고요한 별', '위로의 별', '평온한 빛', '쉼의 별', '바다의 별'],
  },
  {
    name:       '여수 베네치아 호텔 앤 스위트',
    address:    '전라남도 여수시 오동도로 61-13',
    phone:      '061-664-0001',
    category:   'accommodation',
    galaxy:     'miracle',
    loginId:    'DT-YS-M901',
    gemType:    'diamond',
    starNames:  ['기적의 별', '소원의 빛', '여수의 별', '꿈의 빛', '하루의 기적', '빛나는 별', '오늘의 별'],
  },
];

// ── 소원 7개 (모든 업체 공통) ────────────────────────────────────────
const WISH_TEXTS = [
  '오늘 하루가 조금 더 편안했으면 좋겠어요',
  '지금 하는 일이 잘 풀렸으면 좋겠어요',
  '사랑하는 사람들과 오래 함께하고 싶어요',
  '새로운 도전을 시작할 용기가 생기길',
  '나 자신을 더 믿을 수 있었으면 좋겠어요',
  '마음이 조금 더 가벼워졌으면 좋겠어요',
  '좋은 기회가 자연스럽게 찾아왔으면 좋겠어요',
];

// ── QR 코드 생성 ─────────────────────────────────────────────────────
function makeQrCode(partnerId) {
  const prefix = partnerId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HT_${prefix}_${rand}`;
}

// ── 갤럭시 ID 조회 ───────────────────────────────────────────────────
async function getGalaxyId(galaxyCode) {
  const r = await db.query(
    `SELECT id FROM dt_galaxies WHERE code = $1 LIMIT 1`,
    [galaxyCode]
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

// ── 데모 유저 생성 (업체별 1명) ─────────────────────────────────────
async function getOrCreateDemoUser(loginId) {
  const email = `demo_${loginId}@sample.dreamtown`;
  const existing = await db.query(
    `SELECT id FROM dt_users WHERE email = $1 LIMIT 1`,
    [email]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const r = await db.query(
    `INSERT INTO dt_users (nickname, email, is_sample)
     VALUES ($1, $2, TRUE)
     RETURNING id`,
    [`샘플_${loginId}`, email]
  );
  return r.rows[0].id;
}

// ── 메인 ────────────────────────────────────────────────────────────
async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  테스트 업체 + 별 생성 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const pwHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const results = [];

  for (const cfg of PARTNERS) {
    console.log(`\n▶ [${cfg.name}] 처리 중...`);

    // ① dt_partners 생성 (중복 시 기존 것 사용)
    let partnerId;
    const existingPartner = await db.query(
      `SELECT id FROM dt_partners WHERE name = $1 LIMIT 1`,
      [cfg.name]
    );
    if (existingPartner.rows.length > 0) {
      partnerId = existingPartner.rows[0].id;
      console.log(`  ↩  dt_partners 기존 사용: ${partnerId}`);
    } else {
      partnerId = uuidv4();
      const qrCode = makeQrCode(partnerId);
      await db.query(
        `INSERT INTO dt_partners
           (id, city_code, name, category, address, phone, is_active,
            hometown_qr_code, hometown_qr_generated_at)
         VALUES ($1, 'yeosu', $2, $3, $4, $5, TRUE, $6, NOW())`,
        [partnerId, cfg.name, cfg.category, cfg.address, cfg.phone, qrCode]
      );
      console.log(`  ✅ dt_partners 생성: ${partnerId}`);
    }

    // QR 코드 확인/발급
    const partnerRow = await db.query(
      `SELECT hometown_qr_code FROM dt_partners WHERE id = $1`,
      [partnerId]
    );
    let qrCode = partnerRow.rows[0]?.hometown_qr_code;
    if (!qrCode) {
      qrCode = makeQrCode(partnerId);
      await db.query(
        `UPDATE dt_partners SET hometown_qr_code = $1, hometown_qr_generated_at = NOW()
          WHERE id = $2`,
        [qrCode, partnerId]
      );
    }
    const qrUrl = `https://app.dailymiracles.kr/hometown?partner=${qrCode}`;
    console.log(`  🔗 QR URL: ${qrUrl}`);

    // ② partner_accounts 생성 (login_id 중복 시 비번만 업데이트)
    const existingAccount = await db.query(
      `SELECT id FROM partner_accounts WHERE login_id = $1 LIMIT 1`,
      [cfg.loginId]
    );
    if (existingAccount.rows.length > 0) {
      await db.query(
        `UPDATE partner_accounts SET password_hash = $1 WHERE login_id = $2`,
        [pwHash, cfg.loginId]
      );
      console.log(`  ↩  partner_accounts 기존 — 비번 ys1234로 업데이트`);
    } else {
      const email = `${cfg.loginId.toLowerCase().replace(/-/g, '')}@partner.dailymiracles.kr`;
      await db.query(
        `INSERT INTO partner_accounts
           (id, partner_id, email, password_hash, login_id, is_active,
            galaxy_type, region_code, is_founding_partner)
         VALUES ($1, $2, $3, $4, $5, TRUE, $6, 'KR_YEOSU', TRUE)`,
        [uuidv4(), partnerId, email, pwHash, cfg.loginId, cfg.galaxy]
      );
      console.log(`  ✅ partner_accounts 생성: ${cfg.loginId} / ${TEST_PASSWORD}`);
    }

    // ③ 갤럭시 ID 조회
    const galaxyId = await getGalaxyId(cfg.galaxy);
    if (!galaxyId) {
      console.log(`  ⚠️  갤럭시(${cfg.galaxy}) ID 없음 — 건너뜀`);
      continue;
    }

    // ④ 기존 샘플 별 수 확인
    const existingStars = await db.query(
      `SELECT COUNT(*) AS cnt FROM dt_stars
        WHERE hometown_partner_id = $1 AND is_sample = TRUE`,
      [partnerId]
    );
    const existingCount = parseInt(existingStars.rows[0].cnt, 10);
    if (existingCount >= 7) {
      console.log(`  ⏭  샘플 별 이미 ${existingCount}개 있음 — 건너뜀`);
      results.push({ name: cfg.name, loginId: cfg.loginId, qrUrl, stars: existingCount, status: 'skipped' });
      continue;
    }

    // ⑤ 데모 유저 생성
    const demoUserId = await getOrCreateDemoUser(cfg.loginId);

    // ⑥ 별 7개 생성
    let created = 0;
    for (let i = 0; i < 7; i++) {
      try {
        // wish
        const wishR = await db.query(
          `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status)
           VALUES ($1, $2, $3, 'fulfilled')
           RETURNING id`,
          [demoUserId, WISH_TEXTS[i], cfg.gemType]
        );
        const wishId = wishR.rows[0].id;

        // star_seed
        const seedR = await db.query(
          `INSERT INTO dt_star_seeds (wish_id, seed_name)
           VALUES ($1, $2)
           RETURNING id`,
          [wishId, '테스트 시드']
        );
        const seedId = seedR.rows[0].id;

        // star (created_at을 i일 전으로 분산)
        await db.query(
          `INSERT INTO dt_stars
             (user_id, wish_id, star_seed_id, star_name, galaxy_id,
              is_sample, partner_id,
              hometown_partner_id, hometown_confirmed_at,
              created_at, updated_at)
           VALUES
             ($1,$2,$3,$4,$5, TRUE,$6,
              $7, NOW() - ($8 || ' days')::INTERVAL,
              NOW() - ($8 || ' days')::INTERVAL,
              NOW() - ($8 || ' days')::INTERVAL)`,
          [
            demoUserId, wishId, seedId,
            cfg.starNames[i], galaxyId,
            cfg.loginId,           // partner_id (VARCHAR — 샘플 필터용)
            partnerId,             // hometown_partner_id (UUID — 조회 기준)
            String(i * 2),
          ]
        );
        created++;
      } catch (e) {
        console.log(`    ⚠️  별 ${i + 1} 실패: ${e.message}`);
      }
    }

    console.log(`  🌟 별 ${created}개 생성 완료`);
    results.push({ name: cfg.name, loginId: cfg.loginId, qrUrl, stars: created, status: 'created' });
  }

  // ── 최종 보고 ────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  완료 보고');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const r of results) {
    console.log(`\n🏢 ${r.name}`);
    console.log(`   로그인 ID : ${r.loginId}`);
    console.log(`   비밀번호  : ${TEST_PASSWORD}`);
    console.log(`   별 수     : ${r.stars}개`);
    console.log(`   QR URL    : ${r.qrUrl}`);
  }

  console.log('\n✅ 전체 완료');
}

run().catch(console.error).finally(() => process.exit());
