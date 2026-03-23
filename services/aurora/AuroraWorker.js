/**
 * AuroraWorker — DB 폴링 + 분산 락 + 재시도 워커
 * AIL-2026-0301-VIDJOB-001
 *
 * 동작:
 *   1. 5초마다 DB 폴링 (claimJob: SELECT FOR UPDATE SKIP LOCKED)
 *   2. Job 획득 시 AuroraOrchestrator.runJob() 실행
 *   3. 10분마다 스턱 락(locked_at > 10m) 자동 해제
 *   4. SIGTERM/SIGINT 시 graceful shutdown
 */

'use strict';

const store        = require('./AuroraJobStore');
const { runJob }   = require('./AuroraOrchestrator');

const POLL_MS       = 5_000;   // 폴링 주기
const STUCK_CHECK_MS = 10 * 60 * 1000; // 10분마다 스턱 체크

class AuroraWorker {
  constructor() {
    this._running     = false;
    this._pollTimer   = null;
    this._stuckTimer  = null;
    this._activePoll  = false;  // 중복 실행 방지
  }

  /**
   * 워커 시작
   */
  start() {
    if (this._running) return;
    this._running = true;

    console.log('[AuroraWorker] 시작 (폴링 간격:', POLL_MS / 1000, 's)');

    // 즉시 1회 실행 후 interval
    this._doPoll();
    this._pollTimer = setInterval(() => this._doPoll(), POLL_MS);

    // 스턱 락 체크
    this._stuckTimer = setInterval(() => this._doStuckCheck(), STUCK_CHECK_MS);

    // Graceful shutdown
    process.once('SIGTERM', () => this.stop());
    process.once('SIGINT',  () => this.stop());
  }

  /**
   * 워커 정지 (graceful)
   */
  stop() {
    if (!this._running) return;
    this._running = false;

    if (this._pollTimer)  clearInterval(this._pollTimer);
    if (this._stuckTimer) clearInterval(this._stuckTimer);

    console.log('[AuroraWorker] 정지됨');
  }

  // ── 내부: 폴링 1회 ─────────────────────────────────────────────────────────
  async _doPoll() {
    if (!this._running || this._activePoll) return;
    this._activePoll = true;

    try {
      const job = await store.claimJob();
      if (!job) return; // 처리할 Job 없음

      console.log(`[AuroraWorker] Job 획득: ${job.id} (attempt ${job.attempt + 1}/${job.max_attempts})`);

      await runJob(job);

      const updated = await store.getJob(job.id);
      console.log(`[AuroraWorker] Job 완료: ${job.id} → ${updated?.status}`);
    } catch (err) {
      console.error('[AuroraWorker] 폴링 오류:', err.message);
    } finally {
      this._activePoll = false;
    }
  }

  // ── 내부: 스턱 락 정리 ──────────────────────────────────────────────────────
  async _doStuckCheck() {
    try {
      const count = await store.releaseStuck();
      if (count > 0) {
        console.warn(`[AuroraWorker] 스턱 Job ${count}건 해제 (locked_at > 10m)`);
      }
    } catch (err) {
      console.error('[AuroraWorker] 스턱 체크 오류:', err.message);
    }
  }
}

module.exports = AuroraWorker;
