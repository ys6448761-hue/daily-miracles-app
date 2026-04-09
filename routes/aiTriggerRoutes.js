/**
 * aiTriggerRoutes.js — AI 트리거 체크 API (SSOT: 4개 트리거만 허용)
 *
 * GET /api/dt/ai-trigger/check?userId=xxx
 *   → 멈춤 자동 감지 (day1_miss / day7_stall) + 게이트 확인 → lumi 반환
 *
 * POST /api/dt/ai-trigger/idle
 *   → 클라이언트가 30초 무행동 감지 후 호출 (idle_after_star)
 *   → 서버: 별 있고 Day1 미시작 확인 + 게이트 확인 → lumi 반환
 *
 * POST /api/dt/ai-trigger/click
 *   → 추천 클릭 로그
 *
 * POST /api/dt/ai-trigger/action
 *   → 추천 후 실제 행동 로그 (전환 KPI용)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const flow    = require('../services/dreamtownFlowService');
const { getTriggerRecommendation, detectStall } = require('../services/aiRecommendationService');

// ── GET /api/dt/ai-trigger/check ─────────────────────────────
// 앱 진입 / 화면 전환 시 호출 → 멈춤 자동 감지
router.get('/check', async (req, res) => {
  const userId = req.query.userId || req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'userId 필요' });

  try {
    const trigger = await detectStall(String(userId));
    const lumi    = trigger ? await getTriggerRecommendation(String(userId), trigger) : null;
    res.json({ lumi });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dt/ai-trigger/idle ─────────────────────────────
// 클라이언트: 별 생성 후 30초 무행동 감지 → 서버 검증 + lumi 반환
router.post('/idle', async (req, res) => {
  const { userId, user_id } = req.body ?? {};
  const uid = userId || user_id;
  if (!uid) return res.status(400).json({ error: 'userId 필요' });

  try {
    // 서버 검증: 별은 있고 Day1 미시작인지 확인
    const { rows } = await db.query(
      `SELECT
         MAX(1) FILTER (WHERE stage='star'   AND action='create')     AS has_star,
         MAX(1) FILTER (WHERE stage='growth' AND action='day1_start') AS has_day1
       FROM dreamtown_flow WHERE user_id = $1`,
      [String(uid)]
    );
    const r = rows[0] ?? {};

    if (!r.has_star || r.has_day1) {
      // 조건 불충족 — 조용히 null 반환
      return res.json({ lumi: null });
    }

    const lumi = await getTriggerRecommendation(String(uid), 'idle_after_star');
    res.json({ lumi });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dt/ai-trigger/click ────────────────────────────
router.post('/click', async (req, res) => {
  const { userId, user_id, trigger } = req.body ?? {};
  const uid = userId || user_id;
  if (!uid || !trigger) return res.status(400).json({ error: 'userId, trigger 필요' });

  try {
    await flow.log({
      userId: String(uid),
      stage:  'recommendation',
      action: 'click',
      value:  { trigger },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dt/ai-trigger/action ───────────────────────────
// 추천 후 실제 행동 완료 — 전환 KPI
router.post('/action', async (req, res) => {
  const { userId, user_id, trigger } = req.body ?? {};
  const uid = userId || user_id;
  if (!uid || !trigger) return res.status(400).json({ error: 'userId, trigger 필요' });

  try {
    await flow.log({
      userId: String(uid),
      stage:  'recommendation',
      action: 'converted',
      value:  { trigger },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
