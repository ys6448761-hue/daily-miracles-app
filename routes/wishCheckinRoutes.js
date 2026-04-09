/**
 * wishCheckinRoutes.js — 소원 전 상태 체크인
 *
 * GET  /api/dt/wish-checkin/states  — 상태 6개 목록 반환
 * POST /api/dt/wish-checkin         — 상태 선택 로그 + 응답 반환
 *
 * 로그 구조: dreamtown_flow { stage:'wish', action:'state_checkin', value:{...} }
 */

'use strict';

const express  = require('express');
const router   = express.Router();
const checkin  = require('../services/wishCheckinService');
const flow     = require('../services/dreamtownFlowService');

// ── GET /states — 상태 목록 ───────────────────────────────────
router.get('/states', (_req, res) => {
  res.json({ states: checkin.getStates() });
});

// ── POST / — 상태 선택 → 응답 + 로그 ────────────────────────
router.post('/', async (req, res) => {
  const { user_id, state_key, action_clicked = false, session_id = null } = req.body;

  if (!state_key) {
    return res.status(400).json({ error: 'state_key 필수' });
  }

  const response = checkin.getResponse(state_key);
  if (!response) {
    return res.status(400).json({ error: `알 수 없는 state_key: ${state_key}` });
  }

  // 로그 저장 (fire-and-forget — 실패해도 응답에 영향 없음)
  if (user_id) {
    flow.log({
      userId:    String(user_id),
      stage:     'wish',
      action:    'state_checkin',
      value:     {
        state_selected: state_key,
        action_clicked: Boolean(action_clicked),
        timestamp:      new Date().toISOString(),
      },
      sessionId: session_id ?? null,
    }).catch(e => console.warn('flow log failed (wish/state_checkin)', e.message));
  }

  return res.json(response);
});

module.exports = router;
