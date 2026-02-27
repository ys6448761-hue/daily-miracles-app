/**
 * experimentEventRoutes.js
 *
 * POST /api/experiment/event — 실험 이벤트 수집 엔드포인트
 * - experiment_exposure: 실험 노출 (session당 1회)
 * - cta_click: CTA 클릭
 * - page_engagement: scroll depth, 체류시간
 */

const express = require('express');
const router = express.Router();
const { logEvent, EVENT_TYPES } = require('../services/eventLogger');

// session_id 기반 exposure 중복 방지 (메모리 캐시, 서버 재시작 시 리셋)
const exposureCache = new Set();
const CACHE_MAX = 10000;

const ALLOWED_EVENT_TYPES = [
  EVENT_TYPES.EXPERIMENT_EXPOSURE,
  EVENT_TYPES.CTA_CLICK,
  EVENT_TYPES.PAGE_ENGAGEMENT,
  EVENT_TYPES.JOURNEY_START,
];

router.post('/event', async (req, res) => {
  try {
    const { event_type, experiment_id, variant, session_id, payload } = req.body;

    // 필수 필드 검증
    if (!event_type || !experiment_id || !variant || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: event_type, experiment_id, variant, session_id',
      });
    }

    // 허용된 이벤트 타입만 수락
    if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid event_type. Allowed: ${ALLOWED_EVENT_TYPES.join(', ')}`,
      });
    }

    // exposure 중복 방지: session_id + experiment_id 조합
    if (event_type === EVENT_TYPES.EXPERIMENT_EXPOSURE) {
      const cacheKey = `${session_id}:${experiment_id}`;
      if (exposureCache.has(cacheKey)) {
        return res.json({ success: true, deduplicated: true });
      }
      exposureCache.add(cacheKey);
      // 캐시 크기 제한
      if (exposureCache.size > CACHE_MAX) {
        const first = exposureCache.values().next().value;
        exposureCache.delete(first);
      }
    }

    const eventPayload = {
      experiment_id,
      variant,
      session_id,
      ...(payload || {}),
    };

    await logEvent(event_type, eventPayload, {
      source: 'experiment',
      skipDedup: true, // 자체 중복 방지 로직 사용
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[ExperimentEvent] Error:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
