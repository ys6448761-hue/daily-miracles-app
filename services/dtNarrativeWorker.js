/**
 * dtNarrativeWorker.js
 * Narrative Engine 비동기 워커 — artifact_jobs 패턴 동일
 *
 * - dt_narrative_jobs WHERE status='pending' 폴링 (15초 간격)
 * - 한 번에 2개 처리 (GPT 비용 제어)
 * - 최대 3회 재시도
 */

const { makeLogger } = require('../utils/logger');
const log = makeLogger('dtNarrativeWorker');

let db = null;
try {
  db = require('../database/db');
} catch (e) {
  log.warn('DB 모듈 로드 실패 — 워커 비활성화', { error: e.message });
}

const { processJob } = require('./dt/narrativeService');

const POLL_INTERVAL_MS = 15_000;
const BATCH_SIZE       = 2;     // GPT 비용 제어
const MAX_ATTEMPTS     = 3;

let _timer   = null;
let _running = false;

async function processJobs() {
  if (_running) return;
  _running = true;

  try {
    // pending → processing 원자적 전환
    const pick = await db.query(`
      UPDATE dt_narrative_jobs
      SET status = 'processing', updated_at = NOW()
      WHERE id IN (
        SELECT id FROM dt_narrative_jobs
        WHERE status = 'pending' AND attempts < $1
        ORDER BY created_at ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id
    `, [MAX_ATTEMPTS, BATCH_SIZE]);

    if (pick.rows.length === 0) {
      _running = false;
      return;
    }

    log.info(`${pick.rows.length}개 narrative job 처리 시작`);

    // 순차 처리 (GPT rate limit 고려)
    for (const row of pick.rows) {
      try {
        await processJob(row.id);
      } catch (err) {
        // processJob 내부에서 상태 업데이트 처리됨
      }
    }

  } catch (err) {
    log.error('워커 배치 오류', { error: err.message });
  } finally {
    _running = false;
  }
}

function start() {
  if (!db) {
    log.warn('DB 없음 — 워커 시작 스킵');
    return;
  }
  if (_timer) return;

  log.info(`시작 — 폴링 간격 ${POLL_INTERVAL_MS / 1000}초, batch=${BATCH_SIZE}`);
  _timer = setInterval(processJobs, POLL_INTERVAL_MS);
  setTimeout(processJobs, 3_000);
}

function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    log.info('중지됨');
  }
}

module.exports = { start, stop };
