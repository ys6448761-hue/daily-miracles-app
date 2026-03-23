/**
 * VideoJob Routes — 완전 자동화 영상 생성 API
 * AIL-2026-0219-VID-003
 *
 * POST /api/video/job           — Job 생성 + 실행
 * GET  /api/video/job/status/:id — Job 상태 폴링
 * GET  /api/video/job/health     — 헬스체크
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Feature flag check
let featureFlags = null;
try {
  featureFlags = require('../config/featureFlags');
} catch (_) {}

// VideoJob 서비스 로딩 (tolerant)
let VideoJobOrchestrator = null;
try {
  VideoJobOrchestrator = require('../services/videoJob/VideoJobOrchestrator');
  console.log('✅ VideoJob 오케스트레이터 로드 성공');
} catch (error) {
  console.error('❌ VideoJob 오케스트레이터 로드 실패:', error.message);
}

/**
 * Feature flag 미들웨어 — VIDEO_JOB_ORCHESTRATOR OFF 시 503
 */
function requireVideoFlag(req, res, next) {
  if (featureFlags && featureFlags.video && featureFlags.video.VIDEO_JOB_ORCHESTRATOR) {
    return next();
  }
  return res.status(503).json({
    success: false,
    error: 'service_disabled',
    message: 'VideoJob 오케스트레이터가 비활성화되어 있습니다. VIDEO_JOB_ORCHESTRATOR=true 설정 필요.',
  });
}

/**
 * GET /api/video/job/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'VID-003-v1',
    timestamp: new Date().toISOString(),
    services: {
      orchestrator: VideoJobOrchestrator !== null,
    },
    featureFlags: {
      VIDEO_JOB_ORCHESTRATOR: !!(featureFlags && featureFlags.video && featureFlags.video.VIDEO_JOB_ORCHESTRATOR),
      VIDEO_KOREAN_SUBTITLE: !!(featureFlags && featureFlags.video && featureFlags.video.VIDEO_KOREAN_SUBTITLE),
      VIDEO_CIX_SCORING: !!(featureFlags && featureFlags.video && featureFlags.video.VIDEO_CIX_SCORING),
    },
  });
});

/**
 * POST /api/video/job
 * Body: { type, hero_id, topic, mood, tier, config_id, user_context }
 */
router.post('/', requireVideoFlag, async (req, res) => {
  if (!VideoJobOrchestrator) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable',
      message: 'VideoJob 서비스가 로드되지 않았습니다.',
    });
  }

  const { type, hero_id, topic, mood, tier, config_id, user_context, miracle_score, segment, cta_mode } = req.body;
  const requestId = req.requestId || uuidv4();

  // 입력 검증
  const jobType = type || 'hero8';
  if (!['hero8', 'adCreative'].includes(jobType)) {
    return res.status(400).json({
      success: false,
      error: 'invalid_type',
      message: `type은 hero8 또는 adCreative만 가능합니다. 입력: ${type}`,
    });
  }

  if (jobType === 'hero8' && !topic) {
    return res.status(400).json({
      success: false,
      error: 'missing_topic',
      message: 'hero8 타입은 topic이 필수입니다.',
    });
  }

  if (jobType === 'adCreative' && !config_id) {
    return res.status(400).json({
      success: false,
      error: 'missing_config_id',
      message: 'adCreative 타입은 config_id가 필수입니다. (healing-high, growth-high, healing-mid, growth-mid)',
    });
  }

  try {
    const orchestrator = new VideoJobOrchestrator();

    // 비동기 실행 (즉시 응답)
    const jobData = {
      request_id: requestId,
      job_type: jobType,
      hero_id: hero_id || 'HERO1',
      topic: topic || '',
      mood: mood || 'calm',
      tier: tier || cta_mode || 'free',
      config_id: config_id || null,
      user_context: { ...(user_context || {}), miracle_score, segment },
    };

    // Job 생성만 하고 즉시 응답
    const job = await orchestrator.store.createJob(jobData);
    const log = req.log || console;
    log.info('[VideoJob] job_created', { action: 'create', jobType, requestId });

    // 백그라운드 실행 (capture log before detaching from request)
    const bgLog = log;
    orchestrator.execute(jobData).catch(err => {
      bgLog.error('[VideoJob] background_exec_failed', { action: 'execute', jobType, error: err.message });
    });

    res.status(202).json({
      success: true,
      request_id: requestId,
      status: job.status,
      status_url: `/api/video/job/status/${requestId}`,
      message: 'Job이 생성되었습니다. status_url로 진행 상황을 확인하세요.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      request_id: requestId,
      error: error.name || 'processing_error',
      message: error.message,
    });
  }
});

/**
 * GET /api/video/job/status/:id
 */
router.get('/status/:id', async (req, res) => {
  if (!VideoJobOrchestrator) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable',
      message: 'VideoJob 서비스가 로드되지 않았습니다.',
    });
  }

  try {
    const orchestrator = new VideoJobOrchestrator();
    const job = await orchestrator.store.getJob(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: `Job을 찾을 수 없습니다: ${req.params.id}`,
      });
    }

    res.json({
      success: true,
      request_id: job.request_id,
      status: job.status,
      job_type: job.job_type,
      error_code: job.error_code,
      error_message: job.error_message,
      retry_count: job.retry_count,
      cix_video: job.cix_video,
      created_at: job.created_at,
      updated_at: job.updated_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      download_url: job.status === 'DONE' ? `/output/${job.request_id}/output.zip` : null,
      video_url: job.status === 'DONE' ? `/output/${job.request_id}/final.mp4` : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'status_error',
      message: error.message,
    });
  }
});

module.exports = router;
