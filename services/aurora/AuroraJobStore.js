/**
 * AuroraJobStore — aurora_video_jobs DB 저장소
 * AIL-2026-0301-VIDJOB-001
 *
 * DB 가용 시: PostgreSQL (config/db Pool)
 * DB 불가 시: in-memory Map fallback (로컬 개발)
 *
 * 핵심 기능:
 *   - createJob      : NEW 상태로 Job 생성
 *   - claimJob       : SELECT FOR UPDATE SKIP LOCKED 로 1건 획득
 *   - transitionTo   : 상태 전이 + 타임스탬프
 *   - failJob        : FAILED 처리 + backoff 계산
 *   - releaseStuck   : 스턱 락(10m 초과) 해제
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const os             = require('os');

// DB pool (optional)
let pool = null;
try {
  pool = require('../../config/db');
} catch (_) {
  // DB 미구성 → in-memory 모드
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const REQUIRE_DB    = process.env.AURORA_JOB_REQUIRE_DB === 'true' || IS_PRODUCTION;

// 락 소유자 식별자: hostname-pid
const WORKER_ID = `${os.hostname()}-${process.pid}`;

// Backoff 정책 (초): attempt 1→30s, 2→2m, 3→10m
const BACKOFF_SECONDS = [30, 120, 600];

function backoffSec(attempt) {
  return BACKOFF_SECONDS[Math.min(attempt - 1, BACKOFF_SECONDS.length - 1)] || 30;
}

// ── VALID 상태 전이 ──────────────────────────────────────────────────────────
const TRANSITIONS = {
  NEW:        ['RENDERING', 'FAILED', 'CANCELLED'],
  RENDERING:  ['ASSEMBLING', 'FAILED'],
  ASSEMBLING: ['DONE', 'FAILED'],
  DONE:       [],
  FAILED:     ['RENDERING'],   // 재시도 시
  CANCELLED:  [],
};

function assertTransition(from, to) {
  if (!(TRANSITIONS[from] || []).includes(to)) {
    throw new Error(`Invalid aurora_video_jobs transition: ${from} → ${to}`);
  }
}

// ── In-Memory Fallback ───────────────────────────────────────────────────────
class MemoryStore {
  constructor() { this._map = new Map(); }

  async create(job) { this._map.set(job.id, { ...job }); return { ...job }; }
  async findById(id) { return this._map.has(id) ? { ...this._map.get(id) } : null; }
  async update(id, patch) {
    const j = this._map.get(id);
    if (!j) return null;
    const updated = { ...j, ...patch, updated_at: new Date().toISOString() };
    this._map.set(id, updated);
    return { ...updated };
  }
  async claimOne() {
    const now = Date.now();
    for (const j of this._map.values()) {
      if (
        ['NEW', 'FAILED'].includes(j.status) &&
        j.retryable &&
        j.attempt < j.max_attempts &&
        new Date(j.next_run_at).getTime() <= now &&
        !j.locked_at
      ) {
        j.locked_at = new Date().toISOString();
        j.locked_by = WORKER_ID;
        return { ...j };
      }
    }
    return null;
  }
  async releaseStuck() {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    let count = 0;
    for (const j of this._map.values()) {
      if (j.locked_at && new Date(j.locked_at) < cutoff && !['DONE','CANCELLED'].includes(j.status)) {
        j.locked_at = null;
        j.locked_by = null;
        j.status = 'FAILED';
        j.last_error = 'Worker heartbeat timeout (10m)';
        j.last_error_stage = 'LOCK_TIMEOUT';
        j.next_run_at = new Date(Date.now() + 60000).toISOString();
        count++;
      }
    }
    return count;
  }
}

// ── AuroraJobStore ───────────────────────────────────────────────────────────
class AuroraJobStore {
  constructor() {
    this._useDb = pool !== null;
    this._mem   = this._useDb ? null : new MemoryStore();

    if (this._useDb) {
      console.log('  📀 [AuroraJobStore] DB 모드 (aurora_video_jobs)');
    } else if (REQUIRE_DB) {
      throw new Error('AuroraJobStore: DB required (AURORA_JOB_REQUIRE_DB=true) but pool is null');
    } else {
      console.warn('  ⚠️ [AuroraJobStore] in-memory fallback (서버 재시작 시 유실)');
    }
  }

  // ── createJob ─────────────────────────────────────────────────────────────
  async createJob({ spec_json, max_attempts = 3 }) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const job = {
      id,
      spec_json: typeof spec_json === 'string' ? spec_json : JSON.stringify(spec_json),
      status: 'NEW',
      attempt: 0,
      max_attempts,
      retryable: true,
      next_run_at: now,
      locked_at: null,
      locked_by: null,
      started_at: null,
      finished_at: null,
      last_error: null,
      last_error_stage: null,
      artifacts: null,
      created_at: now,
      updated_at: now,
    };

    if (!this._useDb) return this._mem.create(job);

    const sql = `
      INSERT INTO aurora_video_jobs
        (id, spec_json, status, attempt, max_attempts, retryable, next_run_at)
      VALUES ($1, $2, 'NEW', 0, $3, true, NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [id, job.spec_json, max_attempts]);
    return this._normalize(rows[0]);
  }

  // ── getJob ────────────────────────────────────────────────────────────────
  async getJob(id) {
    if (!this._useDb) return this._mem.findById(id);

    const { rows } = await pool.query(
      'SELECT * FROM aurora_video_jobs WHERE id = $1',
      [id]
    );
    return rows[0] ? this._normalize(rows[0]) : null;
  }

  // ── claimJob: SELECT FOR UPDATE SKIP LOCKED ───────────────────────────────
  async claimJob() {
    if (!this._useDb) return this._mem.claimOne();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(`
        SELECT * FROM aurora_video_jobs
        WHERE  status IN ('NEW', 'FAILED')
          AND  retryable = true
          AND  attempt   < max_attempts
          AND  next_run_at <= NOW()
          AND  locked_at IS NULL
        ORDER BY next_run_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const job = rows[0];
      const { rows: updated } = await client.query(`
        UPDATE aurora_video_jobs
        SET locked_at = NOW(), locked_by = $2
        WHERE id = $1
        RETURNING *
      `, [job.id, WORKER_ID]);

      await client.query('COMMIT');
      return this._normalize(updated[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── transitionTo: 상태 전이 ───────────────────────────────────────────────
  async transitionTo(id, newStatus, opts = {}) {
    const job = this._useDb
      ? (await pool.query('SELECT * FROM aurora_video_jobs WHERE id = $1', [id])).rows[0]
      : await this._mem.findById(id);
    if (!job) throw new Error(`AuroraJobStore.transitionTo: job ${id} not found`);

    assertTransition(job.status, newStatus);

    const patch = {
      status: newStatus,
      last_error: opts.error || null,
      last_error_stage: opts.stage || null,
    };

    if (newStatus === 'RENDERING' && job.status === 'NEW') {
      patch.started_at = 'NOW()';
      patch.attempt    = (job.attempt || 0) + 1;
    }
    if (newStatus === 'RENDERING' && job.status === 'FAILED') {
      // 재시도: attempt 증가, 락 해제
      patch.attempt    = (job.attempt || 0) + 1;
      patch.locked_at  = null;
      patch.locked_by  = null;
    }
    if (newStatus === 'DONE') {
      patch.finished_at = 'NOW()';
      patch.locked_at   = null;
      patch.locked_by   = null;
      if (opts.artifacts) patch.artifacts = opts.artifacts;
    }
    if (newStatus === 'FAILED') {
      patch.locked_at  = null;
      patch.locked_by  = null;
    }

    if (!this._useDb) {
      const plain = { ...patch };
      delete plain.started_at;
      delete plain.finished_at;
      if (newStatus === 'RENDERING' && job.status === 'NEW') plain.started_at = new Date().toISOString();
      if (newStatus === 'DONE') plain.finished_at = new Date().toISOString();
      return this._mem.update(id, plain);
    }

    // DB: 동적 SET 구성
    const sets  = [];
    const vals  = [];
    let   idx   = 1;

    for (const [k, v] of Object.entries(patch)) {
      if (v === 'NOW()') {
        sets.push(`${k} = NOW()`);
      } else if (v === null) {
        sets.push(`${k} = NULL`);
      } else if (k === 'artifacts') {
        sets.push(`${k} = $${idx++}`);
        vals.push(JSON.stringify(v));
      } else {
        sets.push(`${k} = $${idx++}`);
        vals.push(v);
      }
    }

    vals.push(id);
    const sql = `
      UPDATE aurora_video_jobs
      SET ${sets.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const { rows } = await pool.query(sql, vals);
    return this._normalize(rows[0]);
  }

  // ── failJob ───────────────────────────────────────────────────────────────
  async failJob(id, { error, stage, retryable = true }) {
    const job = await this.getJob(id);
    if (!job) throw new Error(`AuroraJobStore.failJob: job ${id} not found`);

    assertTransition(job.status, 'FAILED');

    const delay = backoffSec(job.attempt + 1);
    const patch  = {
      status:           'FAILED',
      last_error:       error,
      last_error_stage: stage || null,
      locked_at:        null,
      locked_by:        null,
      retryable,
    };

    if (!this._useDb) {
      return this._mem.update(id, {
        ...patch,
        next_run_at: new Date(Date.now() + delay * 1000).toISOString(),
      });
    }

    const { rows } = await pool.query(`
      UPDATE aurora_video_jobs
      SET status           = 'FAILED',
          last_error       = $2,
          last_error_stage = $3,
          locked_at        = NULL,
          locked_by        = NULL,
          retryable        = $4,
          next_run_at      = NOW() + ($5 || ' seconds')::INTERVAL
      WHERE id = $1
      RETURNING *
    `, [id, error, stage || null, retryable, String(delay)]);

    return this._normalize(rows[0]);
  }

  // ── releaseStuck: locked_at > 10분 잠긴 Job 해제 ─────────────────────────
  async releaseStuck() {
    if (!this._useDb) return this._mem.releaseStuck();

    const { rowCount } = await pool.query(`
      UPDATE aurora_video_jobs
      SET status           = 'FAILED',
          locked_at        = NULL,
          locked_by        = NULL,
          last_error       = 'Worker heartbeat timeout (10m)',
          last_error_stage = 'LOCK_TIMEOUT',
          next_run_at      = NOW() + INTERVAL '60 seconds'
      WHERE locked_at < NOW() - INTERVAL '10 minutes'
        AND status NOT IN ('DONE', 'CANCELLED')
    `);

    return rowCount || 0;
  }

  // ── _normalize ────────────────────────────────────────────────────────────
  _normalize(row) {
    if (!row) return null;
    return {
      ...row,
      spec_json: typeof row.spec_json === 'string'
        ? JSON.parse(row.spec_json)
        : row.spec_json,
      artifacts: row.artifacts
        ? (typeof row.artifacts === 'string' ? JSON.parse(row.artifacts) : row.artifacts)
        : null,
    };
  }
}

module.exports = new AuroraJobStore();
