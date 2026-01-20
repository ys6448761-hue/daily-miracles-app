/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Chat Log Routes - 대화 내용 요약 및 Slack/Airtable 저장 API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * API:
 * - POST /api/chat-log/save - 대화 내용 저장 (x-chatlog-secret 헤더 필요)
 *
 * 작성일: 2026-01-18
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

// Chat Log 서비스 로딩
let chatLogService = null;
try {
  chatLogService = require('../services/chatLogService');
  console.log('✅ Chat Log 서비스 로드 성공');
} catch (error) {
  console.error('❌ Chat Log 서비스 로드 실패:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// API Secret 검증 미들웨어
// ═══════════════════════════════════════════════════════════════════════════

/**
 * x-chatlog-secret 헤더 검증
 * 환경변수: CHAT_LOG_API_SECRET
 */
function verifyChatLogSecret(req, res, next) {
  const expectedSecret = process.env.CHAT_LOG_API_SECRET;

  // Secret 미설정 시 경고 후 통과 (개발 환경용)
  if (!expectedSecret) {
    console.warn('[ChatLog] ⚠️ CHAT_LOG_API_SECRET 미설정 - 인증 스킵');
    return next();
  }

  const providedSecret = req.headers['x-chatlog-secret'];

  if (!providedSecret) {
    console.warn('[ChatLog] ❌ x-chatlog-secret 헤더 누락');
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'x-chatlog-secret header is required'
    });
  }

  if (providedSecret !== expectedSecret) {
    console.warn('[ChatLog] ❌ x-chatlog-secret 불일치');
    return res.status(403).json({
      success: false,
      error: 'forbidden',
      message: 'Invalid x-chatlog-secret'
    });
  }

  next();
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/chat-log/save - 대화 내용 저장
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route POST /api/chat-log/save
 * @description 대화 내용을 PII 마스킹, LLM 요약 후 Slack+Airtable에 저장
 * @access Internal (x-chatlog-secret 헤더 필요)
 *
 * @body {string} conversation_text - 대화 내용 (필수)
 * @body {string} topic - 주제
 * @body {string} owner - 작성자 (코미, 재미, 루미 등)
 * @body {string} sensitivity - PUBLIC | INTERNAL | SENSITIVE (기본: INTERNAL)
 *
 * @returns {Object}
 *   - success: boolean
 *   - status: 'saved' | 'duplicate'
 *   - log_id: string
 *   - slack_ts: string
 *   - airtable_record_id: string
 *   - summary: string
 *   - decisions_count: number
 *   - actions_count: number
 */
router.post('/save', verifyChatLogSecret, async (req, res) => {
  if (!chatLogService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable',
      message: 'Chat Log 서비스가 로드되지 않았습니다'
    });
  }

  try {
    const { conversation_text, topic, owner, sensitivity } = req.body;

    // 필수 파라미터 검증
    if (!conversation_text) {
      return res.status(400).json({
        success: false,
        error: 'missing_parameter',
        message: 'conversation_text is required',
        example: {
          conversation_text: '대화 내용...',
          topic: 'WISH 7문항 스키마 결정',
          owner: '코미',
          sensitivity: 'INTERNAL'
        }
      });
    }

    // Sensitivity 검증
    const validSensitivities = ['PUBLIC', 'INTERNAL', 'SENSITIVE'];
    const normalizedSensitivity = (sensitivity || 'INTERNAL').toUpperCase();

    if (!validSensitivities.includes(normalizedSensitivity)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_sensitivity',
        message: `sensitivity must be one of: ${validSensitivities.join(', ')}`,
        provided: sensitivity
      });
    }

    console.log(`[ChatLog] API 요청: topic="${topic}", owner="${owner}", sensitivity="${normalizedSensitivity}"`);

    // Chat Log 저장 실행
    const result = await chatLogService.saveChatLogFull({
      conversation_text,
      topic,
      owner,
      sensitivity: normalizedSensitivity
    });

    if (result.success) {
      const statusCode = result.status === 'duplicate' ? 200 : 201;
      return res.status(statusCode).json(result);
    }

    return res.status(500).json({
      success: false,
      error: 'save_failed',
      message: result.error || 'Unknown error'
    });

  } catch (error) {
    console.error('[ChatLog] API 오류:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/chat-log/health - 서비스 상태 확인
// ═══════════════════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'chat-log',
    status: chatLogService ? 'ready' : 'not_loaded',
    config: {
      slack_channel: process.env.SLACK_CHANNEL_CHAT_LOGS ? 'configured' : 'default',
      airtable_table: process.env.AIRTABLE_TABLE_CHAT_LOGS || 'Chat Logs',
      secret_configured: !!process.env.CHAT_LOG_API_SECRET
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
