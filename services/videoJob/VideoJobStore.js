/**
 * VideoJobStore — DB 저장소 + in-memory fallback
 * AIL-2026-0219-VID-003 / VID-004
 *
 * DB 가용 시 → INSERT/UPDATE (video_jobs 테이블)
 * DB 불가 시 → in-memory Map fallback (로컬 개발용)
 *
 * Production: DB 필수 (VIDEO_JOB_REQUIRE_DB=true 또는 NODE_ENV=production)
 */

const { v4: uuidv4 } = require('uuid');
const { STATES } = require('./constants');

// DB pool (optional — null if unavailable)
let pool = null;
try {
  pool = require('../../config/db');
} catch (_) {
  // DB 미구성 → in-memory 모드
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const REQUIRE_DB = process.env.VIDEO_JOB_REQUIRE_DB === 'true' || IS_PRODUCTION;

class VideoJobStore {
  constructor() {
    this._memory = new Map();
    this._useDb = pool !== null;

    if (this._useDb) {
      console.log('  📀 [VideoJobStore] DB 모드 활성화');
    } else if (REQUIRE_DB) {
      console.error('🔴 [VideoJobStore] DB 연결 실패 — 프로덕션에서 DB 필수 (VIDEO_JOB_REQUIRE_DB=true)');
      throw new Error('VideoJobStore: DB required in production but pool is null');
    } else {
      console.warn('  ⚠️ [VideoJobStore] in-memory fallback 모드 (서버 재시작 시 유실됨)');
    }
  }

  /**
   * 새 Job 생성
   * @returns {Object} created job
   */
  async createJob(data) {
    const job = {
      id: uuidv4(),
      request_id: data.request_id || uuidv4(),
      job_type: data.job_type || 'hero8',
      hero_id: data.hero_id || 'HERO1',
      topic: data.topic || '',
      mood: data.mood || 'calm',
      tier: data.tier || 'free',
      config_id: data.config_id || null,
      user_context: data.user_context || {},
      status: STATES.QUEUED,
      error_code: null,
      error_message: null,
      retry_count: 0,
      max_retries: data.max_retries || 5,
      output_dir: null,
      meta_json: {},
      cix_video: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
    };

    if (this._useDb) {
      try {
        const result = await pool.query(
          `INSERT INTO video_jobs (request_id, job_type, hero_id, topic, mood, tier, config_id, user_context)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [job.request_id, job.job_type, job.hero_id, job.topic,
           job.mood, job.tier, job.config_id, JSON.stringify(job.user_context)]
        );
        return this._normalize(result.rows[0]);
      } catch (dbErr) {
        console.warn(`⚠️ [VideoJobStore] DB 쓰기 실패, in-memory fallback: ${dbErr.message}`);
      }
    }

    this._memory.set(job.request_id, job);
    return { ...job };
  }

  /**
   * request_id로 Job 조회
   */
  async getJob(requestId) {
    if (this._useDb) {
      try {
        const result = await pool.query(
          'SELECT * FROM video_jobs WHERE request_id = $1', [requestId]
        );
        if (result.rows.length > 0) return this._normalize(result.rows[0]);
      } catch (_) { /* fallback */ }
    }
    const job = this._memory.get(requestId);
    return job ? { ...job } : null;
  }

  /**
   * 상태 업데이트
   */
  async updateState(requestId, newState, meta = {}) {
    const now = new Date().toISOString();
    const updates = {
      status: newState,
      updated_at: now,
      ...meta,
    };

    if (newState === STATES.BUILD && !meta.started_at) {
      updates.started_at = now;
    }
    if (newState === STATES.DONE) {
      updates.completed_at = now;
    }

    if (this._useDb) {
      try {
        const setClauses = [];
        const values = [];
        let i = 1;
        for (const [key, val] of Object.entries(updates)) {
          const dbKey = key === 'meta_json' || key === 'cix_video' || key === 'user_context'
            ? key : key;
          const dbVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
          setClauses.push(`${dbKey} = $${i}`);
          values.push(dbVal);
          i++;
        }
        values.push(requestId);
        await pool.query(
          `UPDATE video_jobs SET ${setClauses.join(', ')} WHERE request_id = $${i}`,
          values
        );
        return await this.getJob(requestId);
      } catch (_) { /* fallback */ }
    }

    const job = this._memory.get(requestId);
    if (job) {
      Object.assign(job, updates);
      this._memory.set(requestId, job);
      return { ...job };
    }
    return null;
  }

  /**
   * 실패 처리
   */
  async failJob(requestId, errorCode, errorMessage) {
    return this.updateState(requestId, STATES.FAILED, {
      error_code: errorCode,
      error_message: errorMessage,
    });
  }

  /**
   * 재시도 카운트 증가
   */
  async incrementRetry(requestId) {
    if (this._useDb) {
      try {
        await pool.query(
          'UPDATE video_jobs SET retry_count = retry_count + 1 WHERE request_id = $1',
          [requestId]
        );
        return await this.getJob(requestId);
      } catch (_) { /* fallback */ }
    }

    const job = this._memory.get(requestId);
    if (job) {
      job.retry_count = (job.retry_count || 0) + 1;
      job.updated_at = new Date().toISOString();
      return { ...job };
    }
    return null;
  }

  /**
   * 상태별 Job 목록 조회
   */
  async getJobsByStatus(status, limit = 20) {
    if (this._useDb) {
      try {
        const result = await pool.query(
          'SELECT * FROM video_jobs WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
          [status, limit]
        );
        return result.rows.map(r => this._normalize(r));
      } catch (_) { /* fallback */ }
    }

    return Array.from(this._memory.values())
      .filter(j => j.status === status)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  /**
   * 현재 동작 모드 반환 (진단용)
   */
  getMode() {
    return {
      useDb: this._useDb,
      requireDb: REQUIRE_DB,
      isProduction: IS_PRODUCTION,
      mode: this._useDb ? 'db' : 'memory',
      jobCount: this._useDb ? null : this._memory.size,
    };
  }

  /**
   * DB row → normalized object
   */
  _normalize(row) {
    if (!row) return null;
    return {
      ...row,
      user_context: typeof row.user_context === 'string' ? JSON.parse(row.user_context) : (row.user_context || {}),
      meta_json: typeof row.meta_json === 'string' ? JSON.parse(row.meta_json) : (row.meta_json || {}),
      cix_video: typeof row.cix_video === 'string' ? JSON.parse(row.cix_video) : (row.cix_video || {}),
    };
  }
}

module.exports = VideoJobStore;
