/**
 * starAgent.js
 * STAR_CREATED 트리거 → 초기 상태 보장
 *
 * 역할:
 * - dream_log 'origin' 존재 확인 + 없으면 생성
 * - artifact job(image) 존재 확인 + 없으면 생성
 */

const db = require('../../../database/db');
const logService = require('../logService');
const artifactService = require('../artifactService');
const { makeLogger } = require('../../../utils/logger');
const log = makeLogger('starAgent');

async function run(starId, input = {}) {
  // ── origin log 보장 ────────────────────────────────────────
  const logCheck = await db.query(
    `SELECT id FROM dt_dream_logs WHERE star_id=$1 AND log_type='origin' LIMIT 1`,
    [starId]
  );
  if (logCheck.rows.length === 0) {
    await logService.createLog(starId, 'origin', {
      wish_text: input.wish_text || '',
      gem_type:  input.gem_type  || '',
      source:    'starAgent',
    });
    log.info('origin log 생성', { star_id: starId });
  }

  // ── artifact job 보장 (image) ──────────────────────────────
  const jobCheck = await db.query(
    `SELECT id FROM dt_artifact_jobs WHERE star_id=$1 AND type='image' LIMIT 1`,
    [starId]
  );
  let artifactJob = null;
  if (jobCheck.rows.length === 0) {
    artifactJob = await artifactService.createJob(starId, 'image', null);
    log.info('artifact job 생성', { star_id: starId, job_id: artifactJob.id });
  } else {
    artifactJob = { id: jobCheck.rows[0].id, status: 'exists' };
  }

  return {
    star_id:      starId,
    origin_log:   logCheck.rows.length === 0 ? 'created' : 'exists',
    artifact_job: artifactJob.id,
  };
}

module.exports = { run };
