/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WU Routes — Aurora5 통합 엔진 API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Endpoints:
 *   GET  /api/wu/types                   활성 WU 유형 목록
 *   POST /api/wu/start                   WU 세션 시작
 *   GET  /api/wu/:sessionId              세션 상태 조회
 *   POST /api/wu/:sessionId/answer       답변 제출
 *   POST /api/wu/:sessionId/complete     WU 완료 처리
 *   POST /api/wu/:sessionId/abandon      WU 이탈 처리
 *   GET  /api/wu/profile/:profileId      소원이 대시보드
 *
 * 가드레일:
 *   [1] DB 세션 SSOT       [2] TTL 30분 + 410
 *   [3] AI 1회 + keywords  [4] RED → paused → 409
 *   [5] OG 분리            [6] JSON 질문 로드
 *
 * @since 2026-02-13
 */

const express = require('express');
const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// 의존성 (tolerant loading)
// ═══════════════════════════════════════════════════════════════════════════

let wuService = null;
try {
  wuService = require('../services/wuService');
  console.log('✅ WU 서비스 로드 성공');
} catch (error) {
  console.error('❌ WU 서비스 로드 실패:', error.message);
}

let featureFlags = null;
try {
  featureFlags = require('../config/featureFlags');
} catch (error) {
  console.warn('⚠️ featureFlags 로드 실패:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limiter (세션별 5회/10초, wishIntakeRoutes 패턴)
// ═══════════════════════════════════════════════════════════════════════════

const RATE_LIMIT_WINDOW_MS = 10000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map();

function checkRateLimit(sessionId) {
  const now = Date.now();
  let entry = rateLimitMap.get(sessionId);

  if (!entry) {
    entry = { timestamps: [] };
    rateLimitMap.set(sessionId, entry);
  }

  entry.timestamps = entry.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.max(1, Math.ceil(
      (RATE_LIMIT_WINDOW_MS - (now - entry.timestamps[0])) / 1000
    ));
    return { allowed: false, retryAfter };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.timestamps.length };
}

// 30초마다 정리
setInterval(() => {
  const now = Date.now();
  for (const [sid, entry] of rateLimitMap.entries()) {
    entry.timestamps = entry.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (entry.timestamps.length === 0) rateLimitMap.delete(sid);
  }
}, 30000);

// ═══════════════════════════════════════════════════════════════════════════
// 서비스 가용성 미들웨어
// ═══════════════════════════════════════════════════════════════════════════

function requireService(req, res, next) {
  if (!wuService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable',
      message: 'WU 서비스가 로드되지 않았습니다.',
    });
  }
  next();
}

router.use(requireService);

// ═══════════════════════════════════════════════════════════════════════════
// GET /types — 활성 WU 유형 목록
// ═══════════════════════════════════════════════════════════════════════════

router.get('/types', (req, res) => {
  const enabledTypes = featureFlags
    ? featureFlags.getEnabledWuTypes()
    : ['REL', 'SELF_ST_TXT'];

  const types = enabledTypes.map(wuType => {
    const content = wuService.loadQuestions(wuType);
    return {
      wu_type: wuType,
      wu_code: content?.wu_code || wuType,
      title: content?.title || wuType,
      description: content?.description || '',
      question_count: content?.question_count || 7,
    };
  });

  res.json({ success: true, types });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /start — WU 세션 시작
// ═══════════════════════════════════════════════════════════════════════════

router.post('/start', async (req, res) => {
  try {
    const { phone_hash, wu_type, nickname, birth_year_month } = req.body;

    // 필수값 검증
    if (!phone_hash || !wu_type) {
      return res.status(400).json({
        success: false,
        error: 'missing_fields',
        message: 'phone_hash, wu_type은 필수입니다.',
      });
    }

    // Feature Flag 게이트
    if (featureFlags && !featureFlags.isWuEnabled(wu_type)) {
      return res.status(403).json({
        success: false,
        error: 'wu_type_disabled',
        message: `${wu_type} 유형은 현재 비활성 상태입니다.`,
      });
    }

    const result = await wuService.startSession(
      phone_hash, wu_type, nickname, birth_year_month
    );

    res.json({
      success: true,
      session: {
        id: result.sessionId,
        profileId: result.profileId,
        expiresAt: result.expiresAt,
      },
      question: result.question,
      progress: result.progress,
      wuTitle: result.wuTitle,
    });

  } catch (error) {
    console.error('[WU] 세션 시작 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /:sessionId — 세션 상태 조회
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:sessionId', async (req, res) => {
  try {
    const session = await wuService.getSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'session_not_found',
      });
    }

    if (session.status === 'expired') {
      return res.status(410).json({
        success: false,
        error: 'session_expired',
        message: '세션이 만료되었습니다. 새 세션을 시작해주세요.',
      });
    }

    // 현재 질문 정보
    let currentQuestion = null;
    if (session.status === 'active') {
      const content = wuService.loadQuestions(session.wu_type);
      if (content && session.current_question_idx < content.question_count) {
        const q = content.questions[session.current_question_idx];
        currentQuestion = {
          idx: q.idx,
          key: q.key,
          text: q.text,
          guide: q.guide,
          category_hint: q.category_hint,
          input_type: q.input_type || null,
          total: content.question_count,
        };
      }
    }

    res.json({
      success: true,
      session: {
        id: session.session_id,
        profileId: session.profile_id,
        wuType: session.wu_type,
        status: session.status,
        progress: session.answer_count / 7,
        answerCount: session.answer_count,
        riskLevel: session.risk_level,
        startedAt: session.started_at,
        expiresAt: session.expires_at,
        completedAt: session.completed_at,
        shareId: session.share_id,
      },
      currentQuestion,
    });

  } catch (error) {
    console.error('[WU] 세션 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:sessionId/answer — 답변 제출
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:sessionId/answer', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    // Rate limit
    const rateCheck = checkRateLimit(sessionId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'rate_limit_exceeded',
        message: `요청이 너무 빠릅니다. ${rateCheck.retryAfter}초 후 다시 시도해주세요.`,
        retryAfter: rateCheck.retryAfter,
      });
    }

    const result = await wuService.submitAnswer(sessionId, answer || '');

    // 에러 응답
    if (result.error) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
      });
    }

    // RED 안전게이트 (가드레일 [4])
    if (result.paused) {
      return res.json({
        success: true,
        paused: true,
        reason: result.reason,
        helpline: result.helpline,
      });
    }

    // 마지막 질문 완료 시그널
    if (result.readyToComplete) {
      return res.json({
        success: true,
        readyToComplete: true,
        progress: result.progress,
        riskLevel: result.riskLevel,
        message: '모든 질문이 완료되었습니다. /complete를 호출해주세요.',
      });
    }

    // 다음 질문
    res.json({
      success: true,
      question: result.question,
      progress: result.progress,
      riskLevel: result.riskLevel,
    });

  } catch (error) {
    console.error('[WU] 답변 제출 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:sessionId/complete — WU 완료 처리
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:sessionId/complete', async (req, res) => {
  try {
    const result = await wuService.completeSession(req.params.sessionId);

    // 에러 응답
    if (result.error) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      result: {
        id: result.resultId,
        miracle_score: result.miracleScore,
        ef_scores: result.efScores,
        energy_type: result.energyType,
        energy_name: result.energyName,
        ai_response: result.aiResponse,
        keywords: result.keywords,
        badges_earned: [], // complete_wu() DB 함수에서 처리, 별도 조회 필요 시 추가
        share_id: result.shareId,
        duration_sec: result.durationSec,
      },
    });

  } catch (error) {
    console.error('[WU] 완료 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:sessionId/abandon — WU 이탈 처리
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:sessionId/abandon', async (req, res) => {
  try {
    const result = await wuService.abandonSession(req.params.sessionId);

    if (result.error) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({ success: true, abandoned: true });

  } catch (error) {
    console.error('[WU] 이탈 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /profile/:profileId — 소원이 대시보드
// ═══════════════════════════════════════════════════════════════════════════

router.get('/profile/:profileId', async (req, res) => {
  try {
    const profile = await wuService.getProfile(req.params.profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'profile_not_found',
      });
    }

    res.json({ success: true, profile });

  } catch (error) {
    console.error('[WU] 프로필 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

module.exports = router;
