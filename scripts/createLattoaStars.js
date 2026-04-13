'use strict';
/**
 * scripts/createLattoaStars.js
 * 라또아 커피숍 파트너 등록 + 샘플 별 10개 생성
 *
 * 실행: node scripts/createLattoaStars.js
 * 재실행 안전: 파트너 중복 체크, 별 10개 미만일 때만 추가
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt         = require('bcryptjs');
const db             = require('../database/db');

const TEST_PASSWORD = 'ys1234';
const PARTNER_NAME  = '라또아 커피숍';

// ── 소원 10개 ────────────────────────────────────────────────────────
const WISH_TEXTS = [
  '오늘 마음이 조금 더 편안해졌으면 좋겠어요',
  '이곳에서 시작한 소원이 좋은 방향으로 자라나길',
  '나 자신을 더 믿을 수 있는 하루가 되었으면 좋겠어요',
  '사랑하는 사람들과 오래 웃을 수 있길 바라요',
  '새로운 기회가 자연스럽게 찾아왔으면 좋겠어요',
  '지금의 고민이 조금씩 풀려가길 바래요',
  '작은 용기로도 충분한 하루였으면 좋겠어요',
  '여기서 시작한 마음이 별처럼 오래 남았으면 좋겠어요',
  '지친 마음이 조금 더 가벼워졌으면 좋겠어요',
  '다시 오고 싶은 기억으로 남았으면 좋겠어요',
];

// ── 별 이름 10개 (치유 은하 테마) ────────────────────────────────────
const STAR_NAMES = [
  '쉬어가는 별',
  '따스한 빛',
  '고요한 별',
  '위로의 빛',
  '평온한 별',
  '마음의 빛',
  '작은 용기별',
  '라또아의 별',
  '가벼운 빛',
  '기억의 별',
];

// ── QR 코드 생성 ─────────────────────────────────────────────────────
function makeQrCode(partnerId) {
  const prefix = partnerId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HT_${prefix}_${rand}`;
}

async function getGalaxyId(code) {
  const r = await db.query(
    `SELECT id FROM dt_galaxies WHERE code = $1 LIMIT 1`, [code]
  );
  if (r.rows.length > 0) return r.rows[0].id;
  // 폴백: miracle
  const fb = await db.query(`SELECT id FROM dt_galaxies WHERE code = 'miracle' LIMIT 1`);
  return fb.rows[0]?.id ?? null;
}

async function getOrCreateDemoUser(loginId) {
  const email = `demo_${loginId}@sample.dreamtown`;
  const ex = await db.query(`SELECT id FROM dt_users WHERE email = $1 LIMIT 1`, [email]);
  if (ex.rows.length > 0) return ex.rows[0].id;
  const r = await db.query(
    `INSERT INTO dt_users (nickname, email, is_sample) VALUES ($1, $2, TRUE) RETURNING id`,
    [`샘플_${loginId}`, email]
  );
  return r.rows[0].id;
}

async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${PARTNER_NAME} 파트너 + 샘플 별 10개 생성`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── ① 파트너 조회 or 생성 ─────────────────────────────────────────
  let partnerId, qrCode;

  const existingPartner = await db.query(
    `SELECT id, hometown_qr_code FROM dt_partners WHERE name = $1 LIMIT 1`,
    [PARTNER_NAME]
  );

  if (existingPartner.rows.length > 0) {
    partnerId = existingPartner.rows[0].id;
    qrCode    = existingPartner.rows[0].hometown_qr_code;
    console.log(`ℹ️  기존 파트너 사용`);
    console.log(`   partner_id: ${partnerId}`);

    // QR 없으면 발급
    if (!qrCode) {
      qrCode = makeQrCode(partnerId);
      await db.query(
        `UPDATE dt_partners SET hometown_qr_code = $1, hometown_qr_generated_at = NOW() WHERE id = $2`,
        [qrCode, partnerId]
      );
      console.log(`   QR 신규 발급`);
    }
  } else {
    partnerId = uuidv4();
    qrCode    = makeQrCode(partnerId);
    await db.query(
      `INSERT INTO dt_partners
         (id, city_code, name, category, address, phone, is_active,
          hometown_qr_code, hometown_qr_generated_at)
       VALUES ($1, 'yeosu', $2, 'cafe',
               '전라남도 여수시 라또아커피숍 주소', '000-0000-0000',
               TRUE, $3, NOW())`,
      [partnerId, PARTNER_NAME, qrCode]
    );
    console.log(`✅ 파트너 신규 생성`);
    console.log(`   partner_id: ${partnerId}`);
  }

  const qrUrl = `https://app.dailymiracles.kr/hometown?partner=${qrCode}`;
  console.log(`   QR URL   : ${qrUrl}\n`);

  // ── ② 파트너 계정 생성 (없으면) ─────────────────────────────────
  const LOGIN_ID = 'DT-YS-C902';
  const pwHash   = await bcrypt.hash(TEST_PASSWORD, 10);

  const existingAccount = await db.query(
    `SELECT id FROM partner_accounts WHERE partner_id = $1 LIMIT 1`,
    [partnerId]
  );
  if (existingAccount.rows.length > 0) {
    await db.query(
      `UPDATE partner_accounts SET password_hash = $1 WHERE partner_id = $2`,
      [pwHash, partnerId]
    );
    console.log(`ℹ️  계정 기존 사용 — 비번 ys1234로 갱신`);
  } else {
    const email = `${LOGIN_ID.toLowerCase().replace(/-/g, '')}@partner.dailymiracles.kr`;
    await db.query(
      `INSERT INTO partner_accounts
         (id, partner_id, email, password_hash, login_id, is_active, galaxy_type, region_code)
       VALUES ($1, $2, $3, $4, $5, TRUE, 'healing', 'KR_YEOSU')`,
      [uuidv4(), partnerId, email, pwHash, LOGIN_ID]
    );
    console.log(`✅ 계정 생성: ${LOGIN_ID} / ${TEST_PASSWORD}`);
  }

  // ── ③ 기존 샘플 별 수 확인 ──────────────────────────────────────
  const existingStars = await db.query(
    `SELECT COUNT(*) AS cnt FROM dt_stars
      WHERE hometown_partner_id = $1 AND is_sample = TRUE`,
    [partnerId]
  );
  const existingCount = parseInt(existingStars.rows[0].cnt, 10);

  if (existingCount >= 10) {
    console.log(`\nℹ️  샘플 별 이미 ${existingCount}개 있음 — 추가 생성 건너뜀`);
    printReport(partnerId, qrUrl, existingCount);
    return;
  }

  const needCount = 10 - existingCount;
  console.log(`\n▶ 별 ${needCount}개 생성 시작 (기존 ${existingCount}개 + ${needCount}개 = 10개)`);

  // ── ④ 갤럭시 ID ─────────────────────────────────────────────────
  const galaxyId = await getGalaxyId('healing');
  if (!galaxyId) {
    console.error('❌ healing 갤럭시 ID 없음');
    process.exit(1);
  }

  // ── ⑤ 데모 유저 ─────────────────────────────────────────────────
  const demoUserId = await getOrCreateDemoUser(LOGIN_ID);

  // ── ⑥ 별 생성 ──────────────────────────────────────────────────
  let created = 0;
  const startIdx = existingCount; // 이미 있는 만큼 건너뜀

  for (let i = 0; i < needCount; i++) {
    const idx = startIdx + i;
    try {
      // wish
      const wishR = await db.query(
        `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status)
         VALUES ($1, $2, 'sapphire', 'converted_to_star') RETURNING id`,
        [demoUserId, WISH_TEXTS[idx]]
      );
      const wishId = wishR.rows[0].id;

      // star_seed
      const seedR = await db.query(
        `INSERT INTO dt_star_seeds (wish_id, seed_name) VALUES ($1, '라또아 시드') RETURNING id`,
        [wishId]
      );
      const seedId = seedR.rows[0].id;

      // star — created_at 최근 며칠 내 분산 (0~9일 전)
      await db.query(
        `INSERT INTO dt_stars
           (user_id, wish_id, star_seed_id, star_name, galaxy_id,
            is_sample, partner_id,
            hometown_partner_id, hometown_confirmed_at,
            created_at, updated_at)
         VALUES
           ($1,$2,$3,$4,$5, TRUE,$6,
            $7, NOW() - ($8 || ' days')::INTERVAL,
            NOW() - ($8 || ' hours')::INTERVAL,
            NOW() - ($8 || ' hours')::INTERVAL)`,
        [
          demoUserId, wishId, seedId,
          STAR_NAMES[idx], galaxyId,
          LOGIN_ID,   // partner_id VARCHAR
          partnerId,  // hometown_partner_id UUID
          String(idx * 18 + Math.floor(Math.random() * 12)), // 시간 단위 분산
        ]
      );
      created++;
      console.log(`  ✅ [${idx + 1}/10] ${STAR_NAMES[idx]}`);
    } catch (e) {
      console.log(`  ⚠️  [${idx + 1}/10] 실패: ${e.message}`);
    }
  }

  // ── ⑦ hometown_star_count 갱신 ──────────────────────────────────
  await db.query(
    `UPDATE dt_partners SET hometown_star_count = $1 WHERE id = $2`,
    [existingCount + created, partnerId]
  );

  printReport(partnerId, qrUrl, existingCount + created);
}

function printReport(partnerId, qrUrl, totalStars) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  완료 보고');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  파트너명  : ${PARTNER_NAME}`);
  console.log(`  partner_id: ${partnerId}`);
  console.log(`  로그인 ID : DT-YS-C902`);
  console.log(`  비밀번호  : ys1234`);
  console.log(`  샘플 별   : ${totalStars}개`);
  console.log(`  진입 URL  : ${qrUrl}`);
  console.log(`  재실행    : 중복 생성 없음 (10개 이상이면 건너뜀)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch(console.error).finally(() => process.exit());
