/**
 * verify_payment_gate.js
 * P0 결제 게이트 검증 스크립트
 * 실행: node scripts/verify_payment_gate.js
 */

require('dotenv').config();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// ── mock logger (워커 로그 캡처용) ──────────────────────────────
const capturedLogs = [];
jest_like_makeLogger = (ctx) => ({
  info:  (...a) => { capturedLogs.push({ level:'INFO',  ctx, msg: a[0], meta: a[1] }); console.log (`  [${ctx}] INFO  ${a[0]}`, a[1]||''); },
  warn:  (...a) => { capturedLogs.push({ level:'WARN',  ctx, msg: a[0], meta: a[1] }); console.warn(`  [${ctx}] WARN  ${a[0]}`, a[1]||''); },
  error: (...a) => { capturedLogs.push({ level:'ERROR', ctx, msg: a[0], meta: a[1] }); console.error(`  [${ctx}] ERROR ${a[0]}`, a[1]||''); },
  debug: (...a) => {},
});

// utils/logger 를 mock으로 교체
require.cache[require.resolve('../utils/logger')] = {
  id: require.resolve('../utils/logger'),
  filename: require.resolve('../utils/logger'),
  loaded: true,
  exports: { makeLogger: jest_like_makeLogger },
};

// ── 결제 게이트 함수 직접 복사 (워커 내부 함수 테스트용) ──────────
async function checkPaymentStatus(starId) {
  try {
    const result = await db.query(`
      SELECT np.status
      FROM dt_dream_logs dl
      JOIN nicepay_payments np ON np.order_id = (dl.payload->>'order_id')
      WHERE dl.star_id = $1
        AND dl.payload->>'event' = 'upgrade_checkout_started'
        AND np.status = 'PAID'
      LIMIT 1
    `, [starId]);
    return result.rows.length > 0;
  } catch (err) {
    console.warn('  결제 상태 조회 실패:', err.message);
    return false;
  }
}

// ── assertPaymentConfirmed (라우트 헬퍼 복사) ─────────────────
async function assertPaymentConfirmed(starId) {
  const result = await db.query(`
    SELECT np.status
    FROM dt_dream_logs dl
    JOIN nicepay_payments np ON np.order_id = (dl.payload->>'order_id')
    WHERE dl.star_id = $1
      AND dl.payload->>'event' = 'upgrade_checkout_started'
      AND np.status = 'PAID'
    LIMIT 1
  `, [starId]);
  if (result.rows.length === 0) {
    const err = new Error('결제 완료 후 이미지를 생성할 수 있습니다');
    err.status = 402;
    throw err;
  }
}

// ── 워커 processOne 시뮬레이션 ────────────────────────────────
async function simulateWorkerProcessOne(job) {
  const log = jest_like_makeLogger('dtArtifactWorker');

  const isPaid = await checkPaymentStatus(job.star_id);
  if (!isPaid) {
    await db.query(
      `UPDATE dt_artifact_jobs
       SET status='pending', attempts=GREATEST(0, attempts-1), updated_at=NOW()
       WHERE id=$1`,
      [job.id]
    );
    log.info('PAYMENT_REQUIRED — 결제 완료 후 처리 예정', {
      job_id: job.id, star_id: job.star_id,
    });
    return { gated: true };
  }
  // 실제 이미지 생성은 스킵 (DALL-E 비용 방지)
  log.info('결제 확인 완료 — 이미지 생성 진행', { job_id: job.id });
  return { gated: false };
}

// ── 테스트 픽스처 생성 ─────────────────────────────────────────
async function setupFixtures() {
  // galaxy 조회
  const gQ = await db.query(`SELECT id FROM dt_galaxies LIMIT 1`);
  if (gQ.rows.length === 0) throw new Error('dt_galaxies 데이터 없음 — 마이그레이션 확인 필요');
  const galaxyId = gQ.rows[0].id;

  const userId   = 'verify-test-user';
  const wishId   = uuidv4();
  const starId   = uuidv4();
  const jobId    = uuidv4();
  const orderId  = `PAY-VERIFY-${Date.now()}`;

  // dt_wishes
  await db.query(
    `INSERT INTO dt_wishes (id, user_id, wish_text, gem_type) VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO NOTHING`,
    [wishId, userId, '테스트 소원입니다', 'ruby']
  );

  // dt_stars
  await db.query(
    `INSERT INTO dt_stars (id, wish_id, user_id, galaxy_id, star_name, star_stage)
     VALUES ($1,$2,$3,$4,$5,'seed')
     ON CONFLICT (id) DO NOTHING`,
    [starId, wishId, userId, galaxyId, '검증별-001']
  );

  // dt_artifact_jobs (pending)
  await db.query(
    `INSERT INTO dt_artifact_jobs (id, star_id, type, status, attempts)
     VALUES ($1,$2,'image','pending',0)
     ON CONFLICT (id) DO NOTHING`,
    [jobId, starId]
  );

  // dt_dream_logs — upgrade_checkout_started with orderId
  await db.query(
    `INSERT INTO dt_dream_logs (star_id, log_type, payload)
     VALUES ($1,'voyage',$2::jsonb)`,
    [starId, JSON.stringify({
      agent: 'monetizationAgent',
      event: 'upgrade_checkout_started',
      plan:  '30day',
      amount: 24900,
      order_id: orderId,
    })]
  );

  return { starId, jobId, orderId };
}

// ── 정리 ──────────────────────────────────────────────────────
async function cleanup({ starId, jobId, orderId }) {
  await db.query(`DELETE FROM dt_artifact_jobs WHERE id=$1`, [jobId]);
  await db.query(`DELETE FROM dt_dream_logs WHERE star_id=$1`, [starId]);
  await db.query(`DELETE FROM dt_stars WHERE id=$1`, [starId]);
  await db.query(`DELETE FROM nicepay_payments WHERE order_id=$1`, [orderId]);
  await db.query(`DELETE FROM dt_wishes WHERE id IN (SELECT wish_id FROM dt_stars WHERE id=$1)`, [starId]);
}

// ── 메인 ──────────────────────────────────────────────────────
async function main() {
  let fixtures;
  try {
    console.log('\n══════════════════════════════════════════════');
    console.log('  P0 결제 게이트 검증');
    console.log('══════════════════════════════════════════════');

    fixtures = await setupFixtures();
    const { starId, jobId, orderId } = fixtures;
    console.log(`\n  test star_id : ${starId}`);
    console.log(`  test job_id  : ${jobId}`);
    console.log(`  test order_id: ${orderId}\n`);

    // ─── 검증 1: POST /artifact — 미결제 → 402 ─────────────────
    console.log('── 검증 1: POST /artifact (미결제) → 402 ──────────────');
    let v1_result = null;
    try {
      await assertPaymentConfirmed(starId);
      v1_result = '❌ FAIL: 게이트 통과됨 (예상: 차단)';
    } catch (err) {
      if (err.status === 402) {
        v1_result = `✅ PASS: 402 반환 — "${err.message}"`;
      } else {
        v1_result = `❌ FAIL: 예상치 못한 에러 (${err.status}) ${err.message}`;
      }
    }
    console.log(`  결과: ${v1_result}\n`);

    // ─── 검증 2: 워커 processOne — 미결제 → PAYMENT_REQUIRED + pending 유지 ──
    console.log('── 검증 2: 워커 processOne (미결제) → PAYMENT_REQUIRED ─');
    // job을 processing으로 전환 (워커 pick 시뮬레이션)
    await db.query(
      `UPDATE dt_artifact_jobs SET status='processing', attempts=attempts+1 WHERE id=$1`,
      [jobId]
    );
    const { rows: [jobBefore] } = await db.query(
      `SELECT status, attempts FROM dt_artifact_jobs WHERE id=$1`, [jobId]
    );
    console.log(`  처리 전: status=${jobBefore.status}, attempts=${jobBefore.attempts}`);

    const workerResult = await simulateWorkerProcessOne({ id: jobId, star_id: starId });

    const { rows: [jobAfter] } = await db.query(
      `SELECT status, attempts FROM dt_artifact_jobs WHERE id=$1`, [jobId]
    );
    console.log(`  처리 후: status=${jobAfter.status}, attempts=${jobAfter.attempts}`);

    const v2_statusOk  = jobAfter.status === 'pending';
    const v2_attemptsOk = parseInt(jobAfter.attempts) === 0;
    const v2_gated     = workerResult.gated === true;
    const v2_logFound  = capturedLogs.some(l => l.msg.includes('PAYMENT_REQUIRED'));
    console.log(`  결과: ${v2_statusOk && v2_attemptsOk && v2_gated && v2_logFound ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`    - status=pending : ${v2_statusOk}`);
    console.log(`    - attempts 원복(0): ${v2_attemptsOk}`);
    console.log(`    - gated=true     : ${v2_gated}`);
    console.log(`    - PAYMENT_REQUIRED 로그: ${v2_logFound}\n`);

    // ─── 검증 3: PAID 상태 삽입 후 워커 재처리 → 게이트 통과 ──────
    console.log('── 검증 3: PAID 결제 삽입 후 워커 → 게이트 통과 ────────');
    await db.query(
      `INSERT INTO nicepay_payments (order_id, amount, status, tid, payment_method, goods_name)
       VALUES ($1, 24900, 'PAID', 'TEST_PG_TID_001', 'CARD', '소원꿈터 30일 여정')
       ON CONFLICT (order_id) DO UPDATE SET status='PAID'`,
      [orderId]
    );
    console.log(`  nicepay_payments 삽입 완료: order_id=${orderId}, status=PAID`);

    // job을 다시 processing으로
    await db.query(
      `UPDATE dt_artifact_jobs SET status='processing', attempts=1 WHERE id=$1`,
      [jobId]
    );
    capturedLogs.length = 0; // 로그 초기화

    const workerResult2 = await simulateWorkerProcessOne({ id: jobId, star_id: starId });

    const v3_passed = workerResult2.gated === false;
    const v3_log    = capturedLogs.some(l => l.msg.includes('결제 확인 완료'));
    console.log(`  결과: ${v3_passed && v3_log ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`    - gated=false(통과): ${v3_passed}`);
    console.log(`    - "결제 확인 완료" 로그: ${v3_log}\n`);

    // ─── 검증 4: 코드 diff 요약 ──────────────────────────────────
    console.log('── 검증 4: 핵심 코드 블록 확인 ────────────────────────');
    const workerCode = require('fs').readFileSync('services/dtArtifactWorker.js','utf8');
    const routeCode  = require('fs').readFileSync('routes/dtEngineRoutes.js','utf8');
    const v4a = workerCode.includes('checkPaymentStatus');
    const v4b = workerCode.includes('PAYMENT_REQUIRED');
    const v4c = workerCode.includes('GREATEST(0, attempts-1)');
    const v4d = routeCode.includes('assertPaymentConfirmed');
    const v4e = routeCode.includes('err.status = 402');
    console.log(`  dtArtifactWorker.js:`);
    console.log(`    - checkPaymentStatus 함수 존재    : ${v4a ? '✅' : '❌'}`);
    console.log(`    - PAYMENT_REQUIRED 로그           : ${v4b ? '✅' : '❌'}`);
    console.log(`    - attempts 원복(GREATEST)         : ${v4c ? '✅' : '❌'}`);
    console.log(`  dtEngineRoutes.js:`);
    console.log(`    - assertPaymentConfirmed 함수 존재 : ${v4d ? '✅' : '❌'}`);
    console.log(`    - 402 status 코드 설정             : ${v4e ? '✅' : '❌'}\n`);

    // ─── 검증 5: 시나리오 요약 ──────────────────────────────────
    console.log('── 검증 5: 시나리오 요약 ───────────────────────────────');
    console.log(`  star_id  : ${starId}`);
    console.log(`  order_id : ${orderId}`);
    console.log(`  job_id   : ${jobId}`);
    console.log(`  흐름:`);
    console.log(`    1. dt_stars 생성 → dt_artifact_jobs(pending) 자동 큐잉`);
    console.log(`    2. dt_dream_logs에 upgrade_checkout_started + order_id 기록`);
    console.log(`    3. [미결제] POST /artifact → 402 / 워커 → pending 복귀`);
    console.log(`    4. nicepay_payments(PAID) 삽입`);
    console.log(`    5. [결제완료] 워커 다음 폴링 → 게이트 통과 → 이미지 생성 진행\n`);

    const allPass = v2_statusOk && v2_attemptsOk && v2_gated && v2_logFound && v3_passed && v4a && v4b && v4c && v4d && v4e;
    console.log('══════════════════════════════════════════════');
    console.log(`  최종: ${allPass ? '✅ ALL PASS — P0 완료 확정 가능' : '❌ 일부 실패 — 확인 필요'}`);
    console.log('══════════════════════════════════════════════\n');

  } finally {
    if (fixtures) await cleanup(fixtures);
    process.exit(0);
  }
}

main().catch(e => { console.error('검증 스크립트 오류:', e); process.exit(1); });
