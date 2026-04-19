'use strict';

/**
 * dtStarTrajectoryRoutes.js
 * 등록 위치: /api/dt/trajectory (및 /api/dt/star)
 *
 * GET  /stars/:starId          별 궤적 전체 조회 (UI용)
 * POST /stars/:starId/travel   여행 로그 직접 등록
 * POST /stars/:starId/refresh  timeline_summary 수동 갱신
 * GET  /day8-status            Day 8 전환 상태 조회
 * POST /day8-choose            Day 8 플랜 선택
 */

const express  = require('express');
const router   = express.Router();
const traj     = require('../services/dt/starTrajectoryService');
const summary  = require('../services/dt/starSummaryService');
const planSvc  = require('../services/dt/userPlanService');
const eventSvc = require('../services/dt/userEventService');
const { makeLogger } = require('../utils/logger');
const log = makeLogger('dtStarTrajectoryRoutes');

// ══════════════════════════════════════════════════════════════
// GET /api/dt/trajectory/summary?user_id=uuid
// 별 페이지 전체 요약 — 5블록 (phase / flow / pattern / growth / next_action)
// ══════════════════════════════════════════════════════════════
router.get('/summary', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id 필수' });
  try {
    const data = await summary.getStarSummary(user_id);
    return res.json({ success: true, ...data });
  } catch (err) {
    log.error('star summary 조회 실패', { err: err.message });
    return res.status(500).json({ error: '별 요약 조회에 실패했습니다' });
  }
});

// GET /api/dt/trajectory/stars/:starId
router.get('/stars/:starId', async (req, res) => {
  try {
    const data = await traj.getStarTrajectory(req.params.starId);
    return res.json({ success: true, ...data });
  } catch (err) {
    log.error('궤적 조회 실패', { err: err.message });
    return res.status(500).json({ error: '궤적 조회에 실패했습니다' });
  }
});

// POST /api/dt/trajectory/stars/:starId/travel
// Body: { user_id, place_type, place_name, wish_text, user_state }
router.post('/stars/:starId/travel', async (req, res) => {
  const { user_id, place_type, place_name, wish_text, user_state } = req.body;
  if (!user_id || !place_type) {
    return res.status(400).json({ error: 'user_id, place_type 필수' });
  }

  try {
    const engine = require('../services/dt/wishJourneyEngine');
    const engineResult = engine.generateResponse({ wish_text, user_state, history: [] });

    const logId = await traj.createStarTravelLog({
      userId: user_id,
      starId: req.params.starId,
      placeType: place_type,
      placeName: place_name,
      engineResult,
    });

    // 비동기 summary 갱신
    traj.refreshTimelineSummary(req.params.starId).catch(() => {});

    return res.status(201).json({ success: true, log_id: logId, journey: engineResult });
  } catch (err) {
    log.error('여행 로그 저장 실패', { err: err.message });
    return res.status(500).json({ error: '여행 로그 저장에 실패했습니다' });
  }
});

// POST /api/dt/trajectory/stars/:starId/refresh
router.post('/stars/:starId/refresh', async (req, res) => {
  try {
    await traj.refreshTimelineSummary(req.params.starId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'summary 갱신 실패' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/dt/star/day8-status?user_id=uuid
// Day 8 전환 상태 조회
// ══════════════════════════════════════════════════════════════
router.get('/day8-status', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id 필수' });
  try {
    const status = await planSvc.getDay8Status(user_id);
    // 노출 이벤트 기록 (비동기)
    if (status.show_transition) {
      eventSvc.logEvent({ userId: user_id, eventType: eventSvc.EVENTS.DAY8_EXPOSED, metadata: {} })
        .catch(() => {});
    }
    return res.json({ success: true, ...status });
  } catch (err) {
    log.error('day8 status 조회 실패', { err: err.message });
    return res.status(500).json({ error: 'Day 8 상태 조회에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/dt/star/day8-choose
// Day 8 플랜 선택
// Body: { user_id, choice }  — choice: 'continue' | 'lite' | 'pause'
// ══════════════════════════════════════════════════════════════
const CHOICE_TO_PLAN = { continue: 'flow', lite: 'lite', pause: 'paused' };
const CHOICE_EVENTS  = {
  continue: 'continue_clicked',
  lite:     'lite_selected',
  pause:    'pause_selected',
};

router.post('/day8-choose', async (req, res) => {
  const { user_id, choice } = req.body;
  if (!user_id || !choice) return res.status(400).json({ error: 'user_id, choice 필수' });

  const planType  = CHOICE_TO_PLAN[choice];
  const eventType = CHOICE_EVENTS[choice];
  if (!planType) return res.status(400).json({ error: 'choice는 continue / lite / pause 중 하나여야 합니다' });

  try {
    const response = { success: true, plan_type: planType, choice };

    if (choice === 'continue') {
      // 결제 성공 전 plan 전환 금지 — 이벤트만 기록
      eventSvc.logEvent({ userId: user_id, eventType: eventSvc.EVENTS.CONTINUE_CLICKED, metadata: { choice } })
        .catch(() => {});
      response.payment_required = true;
      response.message = '이 흐름을 계속 이어가기 위해 작은 도움을 받고 있어요';
    } else {
      // lite / pause → 즉시 플랜 전환
      await planSvc.updatePlan(user_id, planType);
      const evMap = { lite: 'LITE_SELECTED', pause: 'PAUSE_SELECTED' };
      eventSvc.logEvent({ userId: user_id, eventType: eventSvc.EVENTS[evMap[choice]] ?? eventType, metadata: { choice, plan_type: planType } })
        .catch(() => {});
      response.message = choice === 'lite'
        ? '가볍게 유지하기를 선택해 주셨어요. 주 2회 케어를 계속 보내드릴게요'
        : '잠시 멈춰도 괜찮아요. 언제든 다시 시작할 수 있어요';
    }

    return res.json(response);
  } catch (err) {
    log.error('day8 선택 처리 실패', { err: err.message });
    return res.status(500).json({ error: 'Day 8 선택 처리에 실패했습니다' });
  }
});

module.exports = router;
