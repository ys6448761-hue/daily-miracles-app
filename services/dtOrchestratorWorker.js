/**
 * dtOrchestratorWorker.js
 * Aurora5 오케스트레이터 워커
 *
 * 두 가지 역할:
 * 1. pending 이벤트 처리 (10초 폴링)
 * 2. 시간 기반 이벤트 생성 (1시간마다)
 *    - DAY_PASSED: 별 생성 후 N일 경과
 *    - NO_ACTIVITY: 72h 이상 활동 없음
 *    - DAY_6_UPSELL_READY: 6일 경과
 */

const { makeLogger } = require('../utils/logger');
const log = makeLogger('dtOrchestratorWorker');

let db = null;
try {
  db = require('../database/db');
} catch (e) {
  log.warn('DB 로드 실패 — 워커 비활성화', { error: e.message });
}

const { emitEvent, processEvent } = require('./dt/orchestrator/dtOrchestrator');

const POLL_INTERVAL_MS     = 10_000;   // 10초
const TIME_CHECK_INTERVAL  = 360;      // 360 폴링 = 1시간
const BATCH_SIZE           = 5;
const MAX_ATTEMPTS         = 3;

let _timer       = null;
let _pollCount   = 0;
let _running     = false;

// ── pending 이벤트 처리 ────────────────────────────────────
async function processPendingEvents() {
  if (_running) return;
  _running = true;

  try {
    const pick = await db.query(`
      SELECT id FROM dt_orchestrator_events
      WHERE status = 'pending' AND attempts < $1
      ORDER BY created_at ASC
      LIMIT $2
      FOR UPDATE SKIP LOCKED
    `, [MAX_ATTEMPTS, BATCH_SIZE]);

    if (pick.rows.length === 0) {
      _running = false;
      return;
    }

    log.info(`${pick.rows.length}개 이벤트 처리 시작`);

    // 순차 처리 (에이전트 간 의존 관계)
    for (const row of pick.rows) {
      try {
        await processEvent(row.id);
      } catch (err) {
        log.error('이벤트 처리 오류', { event_id: row.id, error: err.message });
      }
    }

  } catch (err) {
    log.error('워커 배치 오류', { error: err.message });
  } finally {
    _running = false;
  }
}

// ── 시간 기반 이벤트 생성 ─────────────────────────────────
async function generateTimeBasedEvents() {
  try {
    await checkDayPassed();
    await checkNoActivity();
    await checkDay6Upsell();
  } catch (err) {
    log.error('시간 기반 이벤트 생성 오류', { error: err.message });
  }
}

// Day 1~7 경과 체크
async function checkDayPassed() {
  // 오늘 DAY_PASSED 이벤트가 아직 없는 별 중 day가 1~7인 것
  const stars = await db.query(`
    SELECT
      s.id AS star_id,
      EXTRACT(DAY FROM NOW() - s.created_at)::INT AS day_num
    FROM dt_stars s
    WHERE EXTRACT(DAY FROM NOW() - s.created_at) BETWEEN 1 AND 7
      AND NOT EXISTS (
        SELECT 1 FROM dt_orchestrator_events e
        WHERE e.star_id = s.id
          AND e.event_type = 'DAY_PASSED'
          AND (e.payload->>'day')::INT = EXTRACT(DAY FROM NOW() - s.created_at)::INT
          AND e.created_at >= CURRENT_DATE
      )
    LIMIT 50
  `);

  for (const row of stars.rows) {
    // 활동 여부 확인
    const activity = await db.query(
      `SELECT id FROM dt_dream_logs
       WHERE star_id=$1 AND log_type NOT IN ('origin','artifact')
         AND created_at >= NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [row.star_id]
    );
    const no_activity = activity.rows.length === 0;

    await emitEvent(row.star_id, 'DAY_PASSED', {
      day: row.day_num,
      no_activity,
    });
    log.info(`DAY_PASSED 생성`, { star_id: row.star_id, day: row.day_num, no_activity });
  }
}

// 72h 이상 활동 없음 체크 (Day 3 기준)
async function checkNoActivity() {
  const stars = await db.query(`
    SELECT s.id AS star_id
    FROM dt_stars s
    WHERE s.created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM dt_dream_logs dl
        WHERE dl.star_id = s.id
          AND dl.log_type NOT IN ('origin','artifact')
          AND dl.created_at >= NOW() - INTERVAL '72 hours'
      )
      AND NOT EXISTS (
        SELECT 1 FROM dt_orchestrator_events e
        WHERE e.star_id = s.id
          AND e.event_type = 'NO_ACTIVITY'
          AND e.created_at >= NOW() - INTERVAL '72 hours'
      )
    LIMIT 30
  `);

  for (const row of stars.rows) {
    await emitEvent(row.star_id, 'NO_ACTIVITY', { hours: 72 });
  }
  if (stars.rows.length > 0) {
    log.info(`NO_ACTIVITY 이벤트 ${stars.rows.length}개 생성`);
  }
}

// Day 6 업셀 체크
async function checkDay6Upsell() {
  const stars = await db.query(`
    SELECT s.id AS star_id
    FROM dt_stars s
    WHERE EXTRACT(DAY FROM NOW() - s.created_at)::INT = 6
      AND NOT EXISTS (
        SELECT 1 FROM dt_orchestrator_events e
        WHERE e.star_id = s.id
          AND e.event_type = 'DAY_6_UPSELL_READY'
          AND e.created_at >= CURRENT_DATE
      )
    LIMIT 50
  `);

  for (const row of stars.rows) {
    await emitEvent(row.star_id, 'DAY_6_UPSELL_READY', {});
  }
  if (stars.rows.length > 0) {
    log.info(`DAY_6_UPSELL_READY ${stars.rows.length}개 생성`);
  }
}

// ── 메인 루프 ─────────────────────────────────────────────
async function tick() {
  _pollCount++;

  await processPendingEvents();

  // 1시간마다 시간 기반 이벤트 생성
  if (_pollCount % TIME_CHECK_INTERVAL === 0) {
    log.debug(`시간 기반 이벤트 체크 (poll #${_pollCount})`);
    await generateTimeBasedEvents();
  }
}

function start() {
  if (!db) {
    log.warn('DB 없음 — 워커 시작 스킵');
    return;
  }
  if (_timer) return;

  log.info(`시작 — 폴링 ${POLL_INTERVAL_MS / 1000}초, batch=${BATCH_SIZE}`);
  _timer = setInterval(tick, POLL_INTERVAL_MS);
  setTimeout(tick, 2_000);  // 즉시 1회
}

function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    log.info('중지됨');
  }
}

module.exports = { start, stop };
