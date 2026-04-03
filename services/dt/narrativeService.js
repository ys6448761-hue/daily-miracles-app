/**
 * services/dt/narrativeService.js
 * Narrative Engine 오케스트레이터
 *
 * 흐름:
 *   requestNarrative()  → 중복 체크 → job 생성 (202)
 *   processJob()        → worker 호출용 실행기
 *   getNarratives()     → 저장된 챕터 조회
 */

const db = require('../../database/db');
const { buildNarrative } = require('./narrativeBuilder');
const logService = require('./logService');
const { makeLogger } = require('../../utils/logger');

const log = makeLogger('narrativeService');
const MAX_ATTEMPTS = 3;

// ── 중복 방지 기준: 24시간 이내 done 챕터가 있으면 재사용 ─────
const DEDUP_HOURS = 24;

/**
 * requestNarrative — POST /narrative 진입점
 * 1. 유효한 done 챕터가 있으면 즉시 반환 (재생성 생략)
 * 2. pending/processing job이 있으면 해당 job 반환
 * 3. 없으면 새 job 생성 → 202
 */
async function requestNarrative(starId) {
  // ── 1. 기존 챕터 확인 (24h 이내) ───────────────────────────
  const existingChapters = await db.query(
    `SELECT id, chapter, title, content, created_at
     FROM dt_narrative_logs
     WHERE star_id = $1
       AND chapter = 1
       AND created_at >= NOW() - INTERVAL '${DEDUP_HOURS} hours'
     LIMIT 1`,
    [starId]
  );

  if (existingChapters.rows.length > 0) {
    const allChapters = await db.query(
      `SELECT id, chapter, title, content, created_at
       FROM dt_narrative_logs
       WHERE star_id = $1
         AND created_at >= (
           SELECT created_at FROM dt_narrative_logs
           WHERE star_id = $1 AND chapter = 1
           ORDER BY created_at DESC LIMIT 1
         ) - INTERVAL '1 minute'
       ORDER BY chapter ASC`,
      [starId]
    );

    log.info('기존 서사 재사용', { star_id: starId, chapters: allChapters.rows.length });
    return { reused: true, job_id: null, chapters: allChapters.rows };
  }

  // ── 2. 진행 중인 job 확인 ───────────────────────────────────
  const activeJob = await db.query(
    `SELECT id, status FROM dt_narrative_jobs
     WHERE star_id = $1 AND status IN ('pending', 'processing')
     ORDER BY created_at DESC LIMIT 1`,
    [starId]
  );

  if (activeJob.rows.length > 0) {
    const job = activeJob.rows[0];
    log.info('진행 중인 job 반환', { star_id: starId, job_id: job.id, status: job.status });
    return { reused: false, job_id: job.id, status: job.status, chapters: null };
  }

  // ── 3. 새 job 생성 ──────────────────────────────────────────
  const jobResult = await db.query(
    `INSERT INTO dt_narrative_jobs (star_id) VALUES ($1)
     RETURNING id, status`,
    [starId]
  );
  const job = jobResult.rows[0];
  log.info('narrative job 생성', { star_id: starId, job_id: job.id });
  return { reused: false, job_id: job.id, status: 'pending', chapters: null };
}

/**
 * processJob — Worker 실행 함수
 * job_id 기반으로 실제 서사 생성 + 저장
 */
async function processJob(jobId) {
  // processing 상태로 전환
  const jobResult = await db.query(
    `UPDATE dt_narrative_jobs
     SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
     WHERE id = $1
     RETURNING id, star_id, attempts`,
    [jobId]
  );
  if (jobResult.rows.length === 0) throw new Error('job not found');
  const job = jobResult.rows[0];

  try {
    // ── 별 + 소원 조회 ──────────────────────────────────────
    const starResult = await db.query(
      `SELECT s.id, s.star_name, s.star_stage, w.wish_text
       FROM dt_stars s JOIN dt_wishes w ON s.wish_id = w.id
       WHERE s.id = $1`,
      [job.star_id]
    );
    if (starResult.rows.length === 0) throw new Error('별을 찾을 수 없습니다');
    const star = starResult.rows[0];

    // ── dream_logs 수집 ─────────────────────────────────────
    const logsResult = await db.query(
      `SELECT log_type, payload, created_at FROM dt_dream_logs
       WHERE star_id = $1 ORDER BY created_at ASC`,
      [job.star_id]
    );

    // ── 최근 성장 리포트 ─────────────────────────────────────
    const reportResult = await db.query(
      `SELECT summary, pattern, change_point FROM dt_growth_reports
       WHERE star_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [job.star_id]
    );

    // ── 서사 생성 ────────────────────────────────────────────
    const chapters = await buildNarrative(star, logsResult.rows, reportResult.rows[0] || null);

    // ── dt_narrative_logs 챕터별 저장 ────────────────────────
    const chapterKeys = [];
    for (const [key, chap] of Object.entries(chapters)) {
      await db.query(
        `INSERT INTO dt_narrative_logs (star_id, chapter, title, content)
         VALUES ($1, $2, $3, $4)`,
        [job.star_id, chap.chapter, chap.title, chap.content]
      );
      chapterKeys.push(key);
    }

    // ── job done ─────────────────────────────────────────────
    await db.query(
      `UPDATE dt_narrative_jobs
       SET status = 'done', chapters = $1, updated_at = NOW()
       WHERE id = $2`,
      [chapterKeys, jobId]
    );

    await logService.createLog(job.star_id, 'growth', {
      engine: 'narrative', job_id: jobId, chapters: chapterKeys,
    });

    log.info('✅ job 완료', { job_id: jobId, chapters: chapterKeys });
    return chapterKeys;

  } catch (err) {
    const isFinal = job.attempts >= MAX_ATTEMPTS;
    await db.query(
      `UPDATE dt_narrative_jobs
       SET status = $1, error_msg = $2, updated_at = NOW()
       WHERE id = $3`,
      [isFinal ? 'failed' : 'pending', err.message, jobId]
    );
    log.warn(`${isFinal ? '❌ 최종실패' : '⚠️ 재시도 예정'}`, {
      job_id: jobId, attempts: job.attempts, error: err.message,
    });
    throw err;
  }
}

async function getJob(jobId) {
  const result = await db.query(
    `SELECT id, star_id, status, chapters, error_msg, attempts, created_at, updated_at
     FROM dt_narrative_jobs WHERE id = $1`,
    [jobId]
  );
  return result.rows[0] || null;
}

async function getNarratives(starId) {
  const result = await db.query(
    `SELECT id, chapter, title, content, created_at
     FROM dt_narrative_logs
     WHERE star_id = $1
     ORDER BY chapter ASC, created_at DESC`,
    [starId]
  );
  return result.rows;
}

module.exports = { requestNarrative, processJob, getJob, getNarratives };
