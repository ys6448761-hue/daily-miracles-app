/**
 * Aurora Video Job API Routes
 * AIL-2026-0301-VIDJOB-001
 *
 * POST   /api/video-jobs              Job 생성 → NEW
 * GET    /api/video-jobs/:id          상태/아티팩트 조회
 * POST   /api/video-jobs/:id/retry    운영자 수동 재시도
 */

'use strict';

const express = require('express');
const router  = express.Router();
const store   = require('../services/aurora/AuroraJobStore');
const { validateSpec } = require('../services/aurora/collisionValidator');

// requestId 추적 (기존 미들웨어 활용)
function getRequestId(req) {
  return req.requestId || req.headers['x-request-id'] || 'none';
}

// ── POST /api/video-jobs ───────────────────────────────────────────────────
router.post('/api/video-jobs', async (req, res) => {
  const reqId = getRequestId(req);

  const { spec, max_attempts } = req.body || {};

  if (!spec || typeof spec !== 'object') {
    return res.status(400).json({
      success: false,
      error:   'spec (AuroraSpec v1.2 object) is required',
      requestId: reqId,
    });
  }

  // 얕은 spec 구조 검증
  if (!Array.isArray(spec.units) || spec.units.length === 0) {
    return res.status(400).json({
      success: false,
      error:   'spec.units must be a non-empty array',
      requestId: reqId,
    });
  }

  // Gate pre-check (스펙 오류는 Job 생성 전에 거부)
  try {
    validateSpec(spec);
  } catch (gateErr) {
    return res.status(422).json({
      success: false,
      error:   gateErr.message,
      requestId: reqId,
    });
  }

  try {
    const job = await store.createJob({
      spec_json:    spec,
      max_attempts: max_attempts || 3,
    });

    return res.status(202).json({
      success:    true,
      job_id:     job.id,
      status:     job.status,
      status_url: `/api/video-jobs/${job.id}`,
      requestId:  reqId,
    });
  } catch (err) {
    console.error(`[auroraJobRoutes] createJob error [reqId=${reqId}]:`, err.message);
    return res.status(500).json({
      success: false,
      error:   'Job 생성 실패: ' + err.message,
      requestId: reqId,
    });
  }
});

// ── GET /api/video-jobs/:id ────────────────────────────────────────────────
router.get('/api/video-jobs/:id', async (req, res) => {
  const reqId = getRequestId(req);
  const { id }  = req.params;

  try {
    const job = await store.getJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error:   `Job not found: ${id}`,
        requestId: reqId,
      });
    }

    return res.json({
      success:          true,
      job_id:           job.id,
      status:           job.status,
      attempt:          job.attempt,
      max_attempts:     job.max_attempts,
      retryable:        job.retryable,
      last_error:       job.last_error,
      last_error_stage: job.last_error_stage,
      artifacts:        job.artifacts,
      started_at:       job.started_at,
      finished_at:      job.finished_at,
      created_at:       job.created_at,
      updated_at:       job.updated_at,
      requestId:        reqId,
    });
  } catch (err) {
    console.error(`[auroraJobRoutes] getJob error [reqId=${reqId}]:`, err.message);
    return res.status(500).json({
      success: false,
      error:   err.message,
      requestId: reqId,
    });
  }
});

// ── POST /api/video-jobs/:id/retry ────────────────────────────────────────
router.post('/api/video-jobs/:id/retry', async (req, res) => {
  const reqId = getRequestId(req);
  const { id }  = req.params;

  try {
    const job = await store.getJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error:   `Job not found: ${id}`,
        requestId: reqId,
      });
    }

    if (job.status !== 'FAILED') {
      return res.status(409).json({
        success: false,
        error:   `재시도는 FAILED 상태에서만 가능 (현재: ${job.status})`,
        requestId: reqId,
      });
    }

    if (!job.retryable) {
      return res.status(409).json({
        success: false,
        error:   'Gate 실패 Job은 재시도 불가 (retryable=false)',
        requestId: reqId,
      });
    }

    if (job.attempt >= job.max_attempts) {
      return res.status(409).json({
        success: false,
        error:   `최대 재시도 횟수 초과 (attempt=${job.attempt}, max=${job.max_attempts})`,
        requestId: reqId,
      });
    }

    // 수동 재시도: next_run_at = NOW() (즉시 실행 큐)
    // failJob을 통하지 않고 직접 상태를 NEW로 리셋
    await store.failJob(id, {
      error:     '운영자 수동 재시도',
      stage:     'MANUAL_RETRY',
      retryable: true,
    });

    // next_run_at을 즉시로 업데이트 (store의 in-memory/db 모두 처리)
    // 간단하게: failJob 직후 store의 next_run_at이 30s 후 → 그냥 큐에 올라가도록 둠
    // 또는 즉시 실행을 원하면 별도 업데이트 필요 (v1은 30s backoff 허용)

    const updated = await store.getJob(id);

    return res.json({
      success:    true,
      job_id:     id,
      status:     updated.status,
      attempt:    updated.attempt,
      message:    '재시도 큐에 등록됨 (30초 내 실행)',
      requestId:  reqId,
    });
  } catch (err) {
    console.error(`[auroraJobRoutes] retry error [reqId=${reqId}]:`, err.message);
    return res.status(500).json({
      success: false,
      error:   err.message,
      requestId: reqId,
    });
  }
});

module.exports = router;
