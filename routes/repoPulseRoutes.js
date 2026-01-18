/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RepoPulse Routes - 코드 변화 감지 Webhook API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Endpoints:
 * - POST /api/repopulse/github   GitHub Webhook (push, PR merged)
 * - POST /api/repopulse/render   Render Deploy Webhook
 * - GET  /api/repopulse/status   RepoPulse 상태 확인
 *
 * 작성일: 2026-01-18
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

let repoPulseService = null;
try {
  repoPulseService = require('../services/repoPulseService');
  console.log('✅ RepoPulse 서비스 로드 성공');
} catch (error) {
  console.error('❌ RepoPulse 서비스 로드 실패:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/repopulse/github - GitHub Webhook
// ═══════════════════════════════════════════════════════════════════════════

router.post('/github', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!repoPulseService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const deliveryId = req.headers['x-github-delivery'];

    console.log(`[RepoPulse] GitHub Webhook 수신: ${event} (${deliveryId})`);

    // 서명 검증 (선택적 - Secret 설정 시)
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (signature && !repoPulseService.verifyGitHubSignature(rawBody, signature)) {
      console.warn('[RepoPulse] GitHub 서명 검증 실패');
      return res.status(401).json({
        success: false,
        error: 'invalid_signature'
      });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    let result;

    switch (event) {
      case 'push':
        result = await repoPulseService.handleGitHubPush(payload);
        break;

      case 'pull_request':
        if (payload.action === 'closed' && payload.pull_request?.merged) {
          result = await repoPulseService.handleGitHubPRMerged(payload);
        } else {
          result = { success: true, skipped: true, reason: 'not_merged_pr' };
        }
        break;

      case 'ping':
        console.log('[RepoPulse] GitHub Webhook ping 수신');
        result = { success: true, event: 'ping', zen: payload.zen };
        break;

      default:
        result = { success: true, skipped: true, reason: `unsupported_event: ${event}` };
    }

    res.json(result);

  } catch (error) {
    console.error('[RepoPulse] GitHub Webhook 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/repopulse/render - Render Deploy Webhook
// ═══════════════════════════════════════════════════════════════════════════

router.post('/render', async (req, res) => {
  if (!repoPulseService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  try {
    const payload = req.body;

    console.log(`[RepoPulse] Render Webhook 수신: ${payload.status || 'unknown'}`);

    const result = await repoPulseService.handleRenderDeploy(payload);

    res.json(result);

  } catch (error) {
    console.error('[RepoPulse] Render Webhook 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/repopulse/status - RepoPulse 상태 확인
// ═══════════════════════════════════════════════════════════════════════════

router.get('/status', async (req, res) => {
  res.json({
    success: true,
    service: 'RepoPulse',
    version: '1.0.0',
    endpoints: {
      github: 'POST /api/repopulse/github',
      render: 'POST /api/repopulse/render'
    },
    config: {
      githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET ? 'configured' : 'not_configured',
      slackChannel: process.env.SLACK_CHANNEL_UPGRADES || 'default',
      airtableTable: process.env.AIRTABLE_TABLE_UPGRADES || 'Upgrades'
    },
    impactRules: Object.keys(repoPulseService?.IMPACT_RULES || {}).length
  });
});

module.exports = router;
