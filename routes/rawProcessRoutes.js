/**
 * rawProcessRoutes.js
 *
 * RAW 콘텐츠 가공 API 라우터
 *
 * POST /api/raw/process - RAW 콘텐츠 가공 (요약/키워드/액션/결정 추출 + Slack 전송)
 * GET  /api/raw/health  - 헬스체크
 *
 * @version 1.0
 * @date 2026-01-20
 */

const express = require('express');
const router = express.Router();

// 서비스 로드
let rawProcessService = null;
try {
  rawProcessService = require('../services/rawProcessService');
  console.log('✅ Raw Process 서비스 로드 성공');
} catch (error) {
  console.error('❌ Raw Process 서비스 로드 실패:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// 인증 미들웨어
// ═══════════════════════════════════════════════════════════════════════════

const RAW_PROCESS_API_SECRET = process.env.RAW_PROCESS_API_SECRET;

function verifySecret(req, res, next) {
  const secret = req.headers['x-raw-secret'];

  // 시크릿 미설정 시 경고만 (개발 편의)
  if (!RAW_PROCESS_API_SECRET) {
    console.warn('[RawProcess] RAW_PROCESS_API_SECRET 미설정 - 인증 스킵');
    return next();
  }

  if (!secret || secret !== RAW_PROCESS_API_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid x-raw-secret header'
    });
  }

  next();
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬스체크
// ═══════════════════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'RawProcess',
    version: '1.0.0',
    status: rawProcessService ? 'ready' : 'service_not_loaded',
    config: {
      secretConfigured: !!RAW_PROCESS_API_SECRET,
      slackChannel: process.env.SLACK_CHANNEL_RAW_DIGEST || '(default)',
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      slackConfigured: !!process.env.SLACK_BOT_TOKEN
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/raw/process - RAW 콘텐츠 가공
// ═══════════════════════════════════════════════════════════════════════════

router.post('/process', verifySecret, async (req, res) => {
  const startTime = Date.now();

  try {
    // 서비스 체크
    if (!rawProcessService) {
      return res.status(500).json({
        success: false,
        error: 'Raw Process 서비스가 로드되지 않았습니다.'
      });
    }

    // 요청 검증
    const { drive_url, title, category, content, created_at, source } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'content는 필수입니다.'
      });
    }

    // 처리
    const result = await rawProcessService.processRawContent({
      drive_url: drive_url || '',
      title: title || '',
      category: category || '',
      content: content,
      created_at: created_at || new Date().toISOString(),
      source: source || 'API'
    });

    const elapsed = Date.now() - startTime;

    if (result.success) {
      console.log(`[RawProcess] 처리 완료 (${elapsed}ms): ${result.doc_type}`);

      return res.json({
        success: true,
        summary: result.summary,
        keywords: result.keywords,
        actions: result.actions,
        decisions: result.decisions,
        doc_type: result.doc_type,
        sensitivity: result.sensitivity,
        slack_ts: result.slack_ts || null,
        duplicate: result.duplicate || false,
        elapsed_ms: elapsed
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || '처리 실패'
      });
    }

  } catch (error) {
    console.error('[RawProcess] 처리 오류:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
