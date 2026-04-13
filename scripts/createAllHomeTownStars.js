'use strict';
/**
 * scripts/createAllHomeTownStars.js
 * 4개 업체 정보 업데이트 + 샘플 별 10개씩 생성
 *
 * 실행: node scripts/createAllHomeTownStars.js
 * 재실행 안전: 별 10개 이상이면 추가 생성 없음
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt         = require('bcryptjs');
const db             = require('../database/db');

const TEST_PASSWORD = 'ys1234';

// ── 공통 소원 10개 ────────────────────────────────────────────────────
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

// ── 업체 정의 ─────────────────────────────────────────────────────────
const PARTNERS = [
  {
    // 이미 DB에 있음 — 정보 업데이트 + 별 보완
    existingId: '324d92dc-da0c-42b5-a3ee-c9eb11c3fc73',
    name:       '라또아 커피숍',
    address:    '전남 여수시 공화남3길 32 5층 전층',
    phone:      '061-666-5811',
    category:   'cafe',
    galaxy:     'healing',
    loginId:    'DT-YS-C902',
    gemType:    'sapphire',
    starNames:  ['쉬어가는 별','따스한 빛','고요한 별','위로의 빛','평온한 별',
                 '마음의 빛','작은 용기별','라또아의 별','가벼운 빛','기억의 별'],
  },
  {
    name:       '여수해상케이블카',
    address:    '전라남도 여수시 돌산읍 돌산로 3600-1',
    phone:      '061-664-7301',
    category:   'activity',
    galaxy:     'challenge',
    loginId:    'DT-YS-A901',
    gemType:    'citrine',
    starNames:  ['도전의 별','용기의 빛','새벽의 별','앞으로의 빛','시작의 별',
                 '높이의 별','바람의 별','하늘의 별','비상의 빛','의지의 별'],
  },
  {
    name:       '여수 유탑마리나 호텔',
    address:    '전라남도 여수시 오동도로 61-15',
    phone:      '061-690-8000',
    category:   'accommodation',
    galaxy:     'healing',
    loginId:    'DT-YS-C901',
    gemType:    'sapphire',
    starNames:  ['쉼의 별','바다의 빛','여유의 별','맑은 빛','파도의 별',
                 '항구의 빛','조용한 별','새벽 바다별','해안의 빛','평화의 별'],
  },
  {
    name:       '여수 베네치아 호텔 앤 스위트',
    address:    '전라남도 여수시 오동도로 61-13',
    phone:      '061-664-0001',
    category:   'accommodation',
    galaxy:     'miracle',
    loginId:    'DT-YS-M901',
    gemType:    'diamond',
    starNames:  ['기적의 별','소원의 빛','여수의 별','꿈의 빛','오늘의 기적',
                 '빛나는 별','설레임의 빛','황금의 별','아름다운 빛','기억의 빛'],
  },
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
  const fb = await db.query(`SELECT id FROM dt_galaxies LIMIT 1`);
  return fb.rows[0]?.id ?? null;
}

async function getOrCreateDemoUser(loginId) {
  const email = `demo_${loginId.toLowerCase().replace(/-/g,'')}@sample.dreamtown`;
  const ex = await db.query(
    `SELECT id FROM dt_users WHERE email = $1 LIMIT 1`, [email]
  );
  if (ex.rows.length > 0) return ex.rows[0].id;
  const r = await db.query(
    `INSERT INTO dt_users (nickname, email, is_sample) VALUES ($1,$2,TRUE) RETURNING id`,
    [`샘플_${loginId}`, email]
  );
  return r.rows[0].id;
}

async function processPartner(cfg, pwHash) {
  console.log(`\n▶ [${cfg.name}]`);

  // ── ① 파트너 조회 or 생성 ─────────────────────────────────────────
  let partnerId, qrCode;

  // existingId로 직접 조회 (라또아)
  if (cfg.existingId) {
    const r = await db.query(
      `SELECT id, hometown_qr_code FROM dt_partners WHERE id = $1`, [cfg.existingId]
    );
    if (r.rows.length > 0) {
      partnerId = r.rows[0].id;
      qrCode    = r.rows[0].hometown_qr_code;
      // 주소/전화 업데이트
      await db.query(
        `UPDATE dt_partners SET address=$1, phone=$2 WHERE id=$3`,
        [cfg.address, cfg.phone, partnerId]
      );
      console.log(`  ↩  기존 파트너 사용 + 주소/전화 업데이트`);
    }
  }

  // 이름으로 조회 (나머지 업체)
  if (!partnerId) {
    const r = await db.query(
      `SELECT id, hometown_qr_code FROM dt_partners WHERE name=$1 LIMIT 1`, [cfg.name]
    );
    if (r.rows.length > 0) {
      partnerId = r.rows[0].id;
      qrCode    = r.rows[0].hometown_qr_code;
      await db.query(
        `UPDATE dt_partners SET address=$1, phone=$2 WHERE id=$3`,
        [cfg.address, cfg.phone, partnerId]
      );
      console.log(`  ↩  기존 파트너 사용`);
    }
  }

  // 없으면 신규 생성
  if (!partnerId) {
    partnerId = uuidv4();
    qrCode    = makeQrCode(partnerId);
    await db.query(
      `INSERT INTO dt_partners
         (id, city_code, name, category, address, phone, is_active,
          hometown_qr_code, hometown_qr_generated_at)
       VALUES ($1,'yeosu',$2,$3,$4,$5,TRUE,$6,NOW())`,
      [partnerId, cfg.name, cfg.category, cfg.address, cfg.phone, qrCode]
    );
    console.log(`  ✅ 신규 파트너 생성`);
  }

  // QR 없으면 발급
  if (!qrCode) {
    qrCode = makeQrCode(partnerId);
    await db.query(
      `UPDATE dt_partners SET hometown_qr_code=$1, hometown_qr_generated_at=NOW() WHERE id=$2`,
      [qrCode, partnerId]
    );
  }

  console.log(`  partner_id : ${partnerId}`);
  const qrUrl = `https://app.dailymiracles.kr/hometown?partner=${qrCode}`;
  console.log(`  QR URL     : ${qrUrl}`);

  // ── ② 계정 생성 or 비번 갱신 ────────────────────────────────────
  const existAcc = await db.query(
    `SELECT id FROM partner_accounts WHERE partner_id=$1 LIMIT 1`, [partnerId]
  );
  if (existAcc.rows.length > 0) {
    await db.query(
      `UPDATE partner_accounts SET password_hash=$1 WHERE partner_id=$2`,
      [pwHash, partnerId]
    );
    console.log(`  ↩  계정 기존 — 비번 ys1234 갱신`);
  } else {
    const email = `${cfg.loginId.toLowerCase().replace(/-/g,'')}@partner.dailymiracles.kr`;
    await db.query(
      `INSERT INTO partner_accounts
         (id, partner_id, email, password_hash, login_id, is_active, galaxy_type, region_code)
       VALUES ($1,$2,$3,$4,$5,TRUE,$6,'KR_YEOSU')`,
      [uuidv4(), partnerId, email, pwHash, cfg.loginId, cfg.galaxy]
    );
    console.log(`  ✅ 계정 생성: ${cfg.loginId} / ${TEST_PASSWORD}`);
  }

  // ── ③ 기존 샘플 별 수 확인 ──────────────────────────────────────
  const existStars = await db.query(
    `SELECT COUNT(*) AS cnt FROM dt_stars
      WHERE hometown_partner_id=$1 AND is_sample=TRUE`,
    [partnerId]
  );
  const existCount = parseInt(existStars.rows[0].cnt, 10);

  if (existCount >= 10) {
    console.log(`  ⏭  샘플 별 이미 ${existCount}개 — 건너뜀`);
    return { name: cfg.name, loginId: cfg.loginId, qrUrl, stars: existCount, status: 'skipped' };
  }

  const needCount = 10 - existCount;
  if (needCount > 0) {
    console.log(`  ▶ 별 ${needCount}개 생성 중...`);
  }

  // ── ④ 갤럭시 + 데모 유저 ─────────────────────────────────────────
  const galaxyId   = await getGalaxyId(cfg.galaxy);
  const demoUserId = await getOrCreateDemoUser(cfg.loginId);

  // ── ⑤ 별 생성 ──────────────────────────────────────────────────
  let created = 0;
  for (let i = 0; i < needCount; i++) {
    const idx = existCount + i;
    try {
      const wishR = await db.query(
        `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status)
         VALUES ($1,$2,$3,'converted_to_star') RETURNING id`,
        [demoUserId, WISH_TEXTS[idx], cfg.gemType]
      );
      const wishId = wishR.rows[0].id;

      const seedR = await db.query(
        `INSERT INTO dt_star_seeds (wish_id, seed_name) VALUES ($1,$2) RETURNING id`,
        [wishId, `${cfg.name} 시드`]
      );
      const seedId = seedR.rows[0].id;

      await db.query(
        `INSERT INTO dt_stars
           (user_id, wish_id, star_seed_id, star_name, galaxy_id,
            is_sample, partner_id,
            hometown_partner_id, hometown_confirmed_at,
            created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7,
                 NOW() - ($8 || ' hours')::INTERVAL,
                 NOW() - ($8 || ' hours')::INTERVAL,
                 NOW() - ($8 || ' hours')::INTERVAL)`,
        [
          demoUserId, wishId, seedId,
          cfg.starNames[idx], galaxyId,
          cfg.loginId, partnerId,
          String(idx * 20 + 6),
        ]
      );
      created++;
    } catch (e) {
      console.log(`  ⚠️  별 ${idx + 1} 실패: ${e.message}`);
    }
  }

  // ── ⑥ hometown_star_count 갱신 ──────────────────────────────────
  const totalStars = existCount + created;
  await db.query(
    `UPDATE dt_partners SET hometown_star_count=$1 WHERE id=$2`,
    [totalStars, partnerId]
  );

  console.log(`  ✅ 별 ${created}개 생성 → 총 ${totalStars}개`);
  return { name: cfg.name, loginId: cfg.loginId, qrUrl, stars: totalStars, status: 'done' };
}

// ── 메인 ────────────────────────────────────────────────────────────
async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  4개 업체 샘플 별 10개씩 일괄 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const pwHash  = await bcrypt.hash(TEST_PASSWORD, 10);
  const results = [];

  for (const cfg of PARTNERS) {
    const r = await processPartner(cfg, pwHash);
    results.push(r);
  }

  // ── 최종 보고 ────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  최종 완료 보고');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const r of results) {
    const icon = r.status === 'skipped' ? '⏭' : '✅';
    console.log(`\n${icon} ${r.name}`);
    console.log(`   로그인 : ${r.loginId} / ${TEST_PASSWORD}`);
    console.log(`   별 수  : ${r.stars}개`);
    console.log(`   QR URL : ${r.qrUrl}`);
  }
  console.log('\n재실행 시 중복 생성: 없음 (10개 이상이면 건너뜀)\n');
}

run().catch(console.error).finally(() => process.exit());
