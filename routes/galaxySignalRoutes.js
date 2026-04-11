/**
 * galaxySignalRoutes.js — Galaxy Signal 조회
 *
 * GET /api/dt/galaxy-signal?journey_id={id}
 *
 * 응답:
 * {
 *   dominant_context: "before_sleep",
 *   dominant_emotion: "calm",
 *   recent_signals: [
 *     { type: "context", key: "before_sleep", count: 5 },
 *     { type: "emotion", key: "calm",         count: 3 }
 *   ]
 * }
 */

const express = require('express');
const router  = express.Router();
const { getUserSignalState } = require('../services/galaxySignalService');

router.get('/', async (req, res) => {
  const { journey_id } = req.query;
  if (!journey_id) return res.status(400).json({ error: 'journey_id required' });

  try {
    const state = await getUserSignalState(journey_id);
    res.json(state);
  } catch (err) {
    console.error('[galaxySignal] 조회 실패:', err);
    res.status(500).json({ error: 'Failed to get signal state' });
  }
});

module.exports = router;
