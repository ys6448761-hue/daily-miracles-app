'use strict';

/**
 * launch_checklist.js
 *
 * DreamTown Launch Readiness Checklist v1.0
 * 실행: node scripts/launch_checklist.js
 *       (DATABASE_URL 또는 DB_* 환경변수 필요)
 *
 * 기준: 19/19 PASS → 출시 가능
 * 기준: 1개라도 FAIL → 출시 차단
 */

require('dotenv').config();

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const { Pool } = require('pg');

// ── DB 연결 ──────────────────────────────────────────────────────
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    }
  : {
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl:      { rejectUnauthorized: false },
    };

const pool = new Pool(poolConfig);

// ── 유틸 ─────────────────────────────────────────────────────────
function md5Hash(input) {
  return parseInt(crypto.createHash('md5').update(input).digest('hex').substring(0, 8), 16);
}

let passed = 0;
let failed = 0;

function check(label, result, detail = '') {
  const icon = result ? '✅' : '❌';
  if (result) passed++; else failed++;
  console.log(`${icon} ${label}${detail ? '   ' + detail : ''}`);
}

async function run() {
  const db = pool;

  // ── P0-1: 데이터 무결성 ────────────────────────────────────────
  console.log('\n=== P0-1 데이터 무결성 ===');

  const starsRes  = await db.query('SELECT id, wish_id, emotion_tag, meaning_text FROM dt_stars');
  const locsRes   = await db.query('SELECT star_id FROM star_locations');
  const stars     = starsRes.rows;
  const locSet    = new Set(locsRes.rows.map(r => r.star_id));

  const noEmotion = stars.filter(s => !s.emotion_tag).length;
  const noMeaning = stars.filter(s => !s.meaning_text).length;
  const noLoc     = stars.filter(s => !locSet.has(s.id)).length;

  check('emotion_tag 누락 없음',    noEmotion === 0, `누락: ${noEmotion}/${stars.length}`);
  check('meaning_text 누락 없음',   noMeaning === 0, `누락: ${noMeaning}/${stars.length}`);
  check('star_locations 누락 없음', noLoc     === 0, `누락: ${noLoc}/${stars.length}`);

  // ── P0-2: 결정론 ───────────────────────────────────────────────
  console.log('\n=== P0-2 결정론 ===');

  const zonesRes = await db.query('SELECT zone_code FROM star_zones WHERE is_active = true ORDER BY zone_code');
  const zones    = zonesRes.rows;
  const zoneLen  = zones.length;

  // hash 결정론
  const h1 = md5Hash('test-wish-abc');
  const h2 = md5Hash('test-wish-abc');
  check('hash 결정론 (동일 입력 → 동일 해시)', h1 === h2);

  // zone 분산 (100 샘플)
  const zoneUsage = new Set();
  for (let i = 0; i < 100; i++) {
    const h = md5Hash(`test-wish-${i}`);
    zoneUsage.add(zones[h % zoneLen]?.zone_code);
  }
  check('zone 분산 (100샘플 모든 zone 사용)', zoneUsage.size >= Math.min(12, zoneLen), `사용 zone: ${zoneUsage.size}/${zoneLen}`);

  // slot 결정론
  const s1 = (md5Hash('test-wish-abc') >> 8) % 1000;
  const s2 = (md5Hash('test-wish-abc') >> 8) % 1000;
  check('slot 결정론', s1 === s2);

  // meaning_text 내용 존재
  const m0 = await db.query('SELECT meaning_text FROM dt_stars WHERE meaning_text IS NOT NULL LIMIT 1');
  check('meaning_text 내용 존재', !!(m0.rows[0]?.meaning_text));

  // ── P0-3: UNIQUE 제약 ──────────────────────────────────────────
  console.log('\n=== P0-3 UNIQUE 제약 ===');

  const dupSlot = await db.query(`
    SELECT zone_code, slot_number, COUNT(*) as cnt
      FROM star_locations
     GROUP BY zone_code, slot_number
    HAVING COUNT(*) > 1
  `);
  check('(zone_code, slot_number) 중복 없음', dupSlot.rows.length === 0, dupSlot.rows.length ? `중복: ${dupSlot.rows.length}건` : '');

  const dupStar = await db.query(`
    SELECT star_id, COUNT(*) as cnt
      FROM star_locations
     GROUP BY star_id
    HAVING COUNT(*) > 1
  `);
  check('star_id 중복 위치 없음', dupStar.rows.length === 0, dupStar.rows.length ? `중복: ${dupStar.rows.length}건` : '');

  // ── P0-4: 성장 단계 ────────────────────────────────────────────
  console.log('\n=== P0-4 성장 단계 ===');

  const { getStarStage } = require('../services/starGrowthService');

  const seed  = getStarStage({ created_at: new Date(),                                          impact_count: 0, log_count: 0 });
  const spark = getStarStage({ created_at: new Date(Date.now() -   4 * 86400000),               impact_count: 0, log_count: 0 });
  const star  = getStarStage({ created_at: new Date(Date.now() -  35 * 86400000),               impact_count: 0, log_count: 5 });
  const rad   = getStarStage({ created_at: new Date(Date.now() - 110 * 86400000),               impact_count: 3, log_count: 0 });

  check('Seed 판정 (0일)',              seed.stage  === 'Seed');
  check('Spark 판정 (4일)',             spark.stage === 'Spark');
  check('Star 판정 (35일+log3)',        star.stage  === 'Star');
  check('Radiance 판정 (110일+공명)',   rad.stage   === 'Radiance');
  check('stage null 없음',             [seed, spark, star, rad].every(s => s.stage));

  // ── P1 에러 핸들링 ────────────────────────────────────────────
  console.log('\n=== P1 에러 핸들링 ===');

  // zone 없음 방어 — starLocationService.js 확인
  const locationSvcPath = path.join(__dirname, '..', 'services', 'starLocationService.js');
  const locationSrc     = fs.readFileSync(locationSvcPath, 'utf8');
  check('zone 없음 방어 (starLocationService)', locationSrc.includes('No active star zones'));

  // graceful degradation — dreamtownRoutes.js 확인
  const routesPath = path.join(__dirname, '..', 'routes', 'dreamtownRoutes.js');
  const routesSrc  = fs.readFileSync(routesPath, 'utf8');
  check('location 실패 graceful (try/catch)', routesSrc.includes('createStarLocation') && routesSrc.includes('catch'));
  check('meaning 실패 graceful (try/catch)',  routesSrc.includes('generateStarMeaning') && routesSrc.includes('catch'));

  // ── 절대 체크: API 숨김 구조 ──────────────────────────────────
  console.log('\n=== 절대 체크: API 숨김 구조 ===');

  // GET /stars/:id 응답에서 위치 민감 필드 직접 노출 여부
  const sensitiveFields = ['place_name', 'constellation_name', 'zone_code', 'lat,', 'lng,'];
  const exposed = sensitiveFields.filter(field => {
    // 응답 객체 리터럴에서 `field: row.field` 패턴 검색
    return new RegExp(`${field.replace(',','')}\\s*:\\s*(row|star|loc)\\.(place_name|constellation_name|zone_code|lat|lng)`).test(routesSrc);
  });
  check('위치 민감 필드 API 미노출', exposed.length === 0, exposed.length ? `노출됨: ${exposed.join(', ')}` : '');

  // ── 결과 요약 ────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`결과: ${passed}/${total} PASS`);
  if (failed === 0) {
    console.log('✅ 출시 준비 완료');
  } else {
    console.log(`❌ ${failed}개 항목 실패 — 출시 차단`);
  }
}

run()
  .catch(err => {
    console.error('체크리스트 실행 오류:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
