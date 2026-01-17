/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Wish Intake Routes - WISH 7문항 대화형 인입 API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * P0-02: WISH 7문항 대화 플로우
 *
 * Endpoints:
 * - POST /api/wish-intake/start       세션 시작
 * - GET  /api/wish-intake/:sessionId  세션 조회
 * - POST /api/wish-intake/:sessionId/answer  답변 제출
 * - GET  /api/wish-intake/:sessionId/summary 요약 조회
 *
 * 작성일: 2026-01-17
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

let wishIntakeService = null;
try {
  wishIntakeService = require('../services/wishIntakeService');
  console.log('✅ Wish Intake 서비스 로드 성공');
} catch (error) {
  console.error('❌ Wish Intake 서비스 로드 실패:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/wish-intake/start - 새 세션 시작
// ═══════════════════════════════════════════════════════════════════════════

router.post('/start', async (req, res) => {
  if (!wishIntakeService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable',
      message: 'Wish Intake 서비스가 로드되지 않았습니다.'
    });
  }

  try {
    const { channel = 'web', userId, userName, source } = req.body;

    // 세션 생성
    const result = await wishIntakeService.createSession({
      channel,
      userId: userId || `anon_${Date.now()}`,
      userName: userName || '',
      source: source || 'direct'
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'session_creation_failed',
        message: result.error
      });
    }

    // 상태를 IN_PROGRESS로 전이
    await wishIntakeService.updateSessionStatus(
      result.session.session_id,
      wishIntakeService.SESSION_STATUS.IN_PROGRESS
    );

    // 첫 번째 질문 가져오기
    const firstQuestion = wishIntakeService.WISH_QUESTIONS[0];

    res.json({
      success: true,
      session: {
        id: result.session.session_id,
        correlationId: result.session.correlation_id
      },
      question: {
        id: firstQuestion.id,
        key: firstQuestion.key,
        number: 1,
        total: 7,
        display: firstQuestion.display,
        guide: firstQuestion.guide
      },
      progress: 0,
      simulated: result.simulated || false
    });

  } catch (error) {
    console.error('[WishIntake] 세션 시작 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/wish-intake/:sessionId - 세션 상태 조회
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:sessionId', async (req, res) => {
  if (!wishIntakeService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  try {
    const { sessionId } = req.params;

    const sessionResult = await wishIntakeService.getSession(sessionId);
    if (!sessionResult.success) {
      return res.status(404).json({
        success: false,
        error: 'session_not_found',
        message: `세션을 찾을 수 없습니다: ${sessionId}`
      });
    }

    const session = sessionResult.session;

    // 현재 질문 정보 (완료되지 않은 경우)
    let currentQuestion = null;
    if (session.run_status === wishIntakeService.SESSION_STATUS.IN_PROGRESS) {
      const qIndex = (session.current_question || 1) - 1;
      if (qIndex < 7) {
        const q = wishIntakeService.WISH_QUESTIONS[qIndex];
        currentQuestion = {
          id: q.id,
          key: q.key,
          number: qIndex + 1,
          total: 7,
          display: q.display,
          guide: q.guide
        };
      }
    }

    res.json({
      success: true,
      session: {
        id: session.session_id,
        correlationId: session.correlation_id,
        status: session.run_status,
        progress: session.progress || 0,
        answeredCount: session.answered_count || 0,
        riskLevel: session.risk_level || 'GREEN',
        paused: session.pause_flow || false,
        createdAt: session.created_at,
        completedAt: session.completed_at
      },
      currentQuestion,
      simulated: sessionResult.simulated || false
    });

  } catch (error) {
    console.error('[WishIntake] 세션 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/wish-intake/:sessionId/answer - 답변 제출
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:sessionId/answer', async (req, res) => {
  if (!wishIntakeService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    // 답변 길이 검증 (DEC-002: 최대 1000자)
    if (answer && answer.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'answer_too_long',
        message: '답변은 1000자를 초과할 수 없습니다.'
      });
    }

    // 답변 제출
    const result = await wishIntakeService.submitAnswer(sessionId, answer || '');

    if (!result.success) {
      // 세션 중단 상태
      if (result.paused) {
        return res.json({
          success: true,
          paused: true,
          reason: result.reason,
          message: result.message || '세션이 중단되었습니다.'
        });
      }

      return res.status(400).json({
        success: false,
        error: result.error || 'submit_failed'
      });
    }

    // 🔴 Safety 감지로 중단된 경우
    if (result.paused) {
      return res.json({
        success: true,
        paused: true,
        reason: result.reason,
        message: result.message,
        helpline: '정신건강위기상담전화 1393'
      });
    }

    // 완료된 경우
    if (result.completed) {
      return res.json({
        success: true,
        completed: true,
        progress: 1,
        message: result.message,
        nextStep: 'summary' // 다음 단계: 요약 생성
      });
    }

    // 다음 질문 반환
    const nextQ = result.nextQuestion;
    res.json({
      success: true,
      question: {
        id: nextQ.id,
        key: nextQ.key,
        number: nextQ.number,
        total: nextQ.total,
        display: nextQ.display,
        guide: nextQ.guide
      },
      progress: result.progress,
      riskLevel: result.risk?.level || 'GREEN'
    });

  } catch (error) {
    console.error('[WishIntake] 답변 제출 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/wish-intake/:sessionId/messages - 모든 답변 조회
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:sessionId/messages', async (req, res) => {
  if (!wishIntakeService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  try {
    const { sessionId } = req.params;

    const result = await wishIntakeService.getSessionMessages(sessionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'messages_not_found'
      });
    }

    res.json({
      success: true,
      sessionId,
      count: result.messages.length,
      messages: result.messages.map(m => ({
        questionId: m.question_id,
        questionKey: m.question_key,
        questionText: m.question_text,
        answer: m.answer_final_text,
        skipped: m.skipped,
        riskLevel: m.risk_level,
        createdAt: m.created_at
      })),
      simulated: result.simulated || false
    });

  } catch (error) {
    console.error('[WishIntake] 메시지 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/wish-intake/:sessionId/summary - 요약 생성 (P0-05)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:sessionId/summary', async (req, res) => {
  if (!wishIntakeService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  try {
    const { sessionId } = req.params;

    // 세션 상태 확인
    const sessionResult = await wishIntakeService.getSession(sessionId);
    if (!sessionResult.success) {
      return res.status(404).json({
        success: false,
        error: 'session_not_found',
        message: `세션을 찾을 수 없습니다: ${sessionId}`
      });
    }

    const session = sessionResult.session;

    // COMPLETED 상태에서만 요약 생성 가능
    if (session.run_status !== wishIntakeService.SESSION_STATUS.COMPLETED) {
      // 이미 요약이 생성된 경우
      if (session.run_status === wishIntakeService.SESSION_STATUS.SUMMARIZED) {
        return res.json({
          success: true,
          alreadySummarized: true,
          summary_short: session.summary_short,
          summary_structured: session.summary_structured ? JSON.parse(session.summary_structured) : null
        });
      }

      return res.status(400).json({
        success: false,
        error: 'invalid_state',
        message: `요약 생성은 COMPLETED 상태에서만 가능합니다. 현재: ${session.run_status}`
      });
    }

    // 요약 생성 및 저장
    const result = await wishIntakeService.processSessionSummary(sessionId);

    if (!result.success && !result.simulated) {
      return res.status(500).json({
        success: false,
        error: 'summary_failed',
        message: result.error
      });
    }

    res.json({
      success: true,
      summary_short: result.summary_short,
      summary_structured: result.summary_structured,
      fallback: result.fallback || false
    });

  } catch (error) {
    console.error('[WishIntake] 요약 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/wish-intake/:sessionId/summary - 요약 조회
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:sessionId/summary', async (req, res) => {
  if (!wishIntakeService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  try {
    const { sessionId } = req.params;

    const sessionResult = await wishIntakeService.getSession(sessionId);
    if (!sessionResult.success) {
      return res.status(404).json({
        success: false,
        error: 'session_not_found'
      });
    }

    const session = sessionResult.session;

    // 요약이 없는 경우
    if (!session.summary_short) {
      return res.json({
        success: true,
        hasSummary: false,
        message: '아직 요약이 생성되지 않았습니다.'
      });
    }

    res.json({
      success: true,
      hasSummary: true,
      summary_short: session.summary_short,
      summary_structured: session.summary_structured ? JSON.parse(session.summary_structured) : null
    });

  } catch (error) {
    console.error('[WishIntake] 요약 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/wish-intake/questions - 질문 목록 조회 (정적)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/meta/questions', async (req, res) => {
  if (!wishIntakeService) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable'
    });
  }

  res.json({
    success: true,
    version: 'DEC-2026-0117-002',
    count: wishIntakeService.WISH_QUESTIONS.length,
    questions: wishIntakeService.WISH_QUESTIONS.map(q => ({
      id: q.id,
      key: q.key,
      order: q.order,
      display: q.display,
      guide: q.guide
    }))
  });
});

module.exports = router;
