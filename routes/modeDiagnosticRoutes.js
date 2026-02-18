// ═══════════════════════════════════════════════════════════
// Mode Diagnostic Routes — P1-SSOT (ISSUE 2 + 3)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { diagnose, buildDiagnosticResult } = require('../services/modeDiagnosticService');
const { getModeById, getAllModes } = require('../config/modesLoader');

// ── POST /api/mode/diagnose — 1분 진단 ──
router.post('/diagnose', (req, res) => {
  const { answers, miracleScores, user_key } = req.body || {};

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'answers (object) 필수',
    });
  }

  const result = diagnose({ answers, miracleScores });

  // Save to in-memory store for marketing segment export (ISSUE 3)
  if (user_key && global._modeDiagnosticStore) {
    global._modeDiagnosticStore.set(user_key, {
      mode_id: result.mode_id,
      date: new Date().toISOString().slice(0, 10),
      confidence: result.confidence,
    });
  }

  res.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
});

// ── GET /api/mode/:modeId — 특정 모드 조회 (SSOT) ──
router.get('/:modeId', (req, res) => {
  const mode = getModeById(req.params.modeId);

  if (!mode) {
    return res.status(404).json({
      success: false,
      error: `mode '${req.params.modeId}' not found`,
    });
  }

  res.json({
    success: true,
    mode,
  });
});

// ── GET /api/mode — 전체 모드 목록 ──
router.get('/', (_req, res) => {
  const modes = getAllModes();
  res.json({
    success: true,
    count: modes.length,
    modes: modes.map(m => ({
      mode_id: m.mode_id,
      label_kr: m.label_kr,
      tagline: m.tagline,
      linked_miracle_index: m.linked_miracle_index,
    })),
  });
});

// ── ISSUE 3: GET /api/mode/segment/today — 마케팅 세그먼트 export ──
router.get('/segment/today', (req, res) => {
  const userKey = req.query.user_key;

  if (!userKey) {
    return res.status(400).json({
      success: false,
      error: 'user_key query parameter 필수',
    });
  }

  // TODO: DB에서 오늘 진단 결과 조회
  // 현재 v1: in-memory store에서 조회 (없으면 미진단 응답)
  const todayResult = global._modeDiagnosticStore?.get(userKey);

  if (!todayResult) {
    return res.status(200).json({
      success: true,
      diagnosed: false,
      user_key: userKey,
      date: new Date().toISOString().slice(0, 10),
      mode_id: null,
      label_kr: null,
      ad_hook_keywords: [],
      message: '오늘 진단을 아직 받지 않았습니다.',
    });
  }

  const mode = getModeById(todayResult.mode_id);
  if (!mode) {
    return res.status(200).json({
      success: true,
      diagnosed: true,
      user_key: userKey,
      date: todayResult.date,
      mode_id: todayResult.mode_id,
      label_kr: 'unknown',
      ad_hook_keywords: [],
    });
  }

  res.json({
    success: true,
    diagnosed: true,
    user_key: userKey,
    date: todayResult.date,
    mode_id: mode.mode_id,
    label_kr: mode.label_kr,
    ad_hook_keywords: mode.ad_hook_keywords,
    marketing_archetypes: mode.marketing_archetypes || [],
  });
});

module.exports = router;
