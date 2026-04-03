/**
 * services/dt/artifactService.js
 * dt_artifact_jobs 큐 등록 전담
 */

const db = require('../../database/db');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('artifactService');

async function createJob(starId, type, prompt = null) {
  const result = await db.query(
    `INSERT INTO dt_artifact_jobs (star_id, type, prompt)
     VALUES ($1, $2, $3)
     RETURNING id, type, status`,
    [starId, type, prompt]
  );
  const job = result.rows[0];
  log.info('job 등록', { job_id: job.id, star_id: starId, type });
  return job;
}

async function getJob(jobId) {
  const result = await db.query(
    `SELECT id, star_id, type, status, result_url, error_msg, attempts, created_at, updated_at
     FROM dt_artifact_jobs WHERE id = $1`,
    [jobId]
  );
  return result.rows[0] || null;
}

module.exports = { createJob, getJob };
