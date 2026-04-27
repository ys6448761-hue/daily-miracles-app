'use strict';

/**
 * momentRoutes.js — Moment API (append-only)
 * prefix: /api/moments
 *
 * POST / — 순간 추가 (이미지 생성 포함)
 *
 * Moment는 수정/삭제 없음 — 계속 쌓기만
 */

const router = require('express').Router();
const db     = require('../database/db');

let generateShareImage = null;
try { ({ generateShareImage } = require('../services/imageGenerationService')); } catch (_) {}

let emitKpiEvent = null;
try { ({ emitKpiEvent } = require('../services/kpiEventEmitter')); } catch (_) {}

const DEFAULT_FALLBACK = '/images/fallback/star-default.svg';

// ── POST /api/moments ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { journey_id, emotion, context_type = 'cablecar' } = req.body;

  if (!journey_id || !emotion) {
    return res.status(400).json({ success: false, error: 'journey_id, emotion 필수' });
  }

  try {
    // journey 존재 확인
    const { rows: jRows } = await db.query(
      'SELECT id FROM journeys WHERE id = $1',
      [journey_id]
    );
    if (!jRows.length) {
      return res.status(404).json({ success: false, error: '여정을 찾을 수 없습니다.' });
    }

    // 이미지 생성 — 3s timeout + fallback 보장 (UX 끊김 없음)
    let image_url   = DEFAULT_FALLBACK;
    let is_fallback = true;

    if (generateShareImage) {
      try {
        const result = await generateShareImage(context_type, emotion);
        image_url    = result.image_url;
        is_fallback  = result.is_fallback ?? false;
      } catch (imgErr) {
        console.warn('[moment] 이미지 생성 예외, fallback 사용:', imgErr.message);
      }
    }

    // moment 저장 (append-only)
    const { rows } = await db.query(
      `INSERT INTO moments (journey_id, emotion, context_type, image_url, is_fallback)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, journey_id, emotion, context_type, image_url, is_fallback, created_at`,
      [journey_id, emotion, context_type, image_url, is_fallback]
    );
    const moment = rows[0];

    if (emitKpiEvent) {
      emitKpiEvent({
        eventName: 'moment_created',
        source:    'moment_api',
        extra:     { journey_id, is_fallback },
      }).catch(() => {});
    }

    console.log(`[moment] 생성 | id:${moment.id} | fallback:${is_fallback}`);
    return res.status(201).json({
      success:    true,
      moment_id:  moment.id,
      image_url:  moment.image_url,
      is_fallback: moment.is_fallback,
    });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ success: false, error: 'migration 146 필요 (moments 테이블 없음)' });
    }
    console.error('[moment] POST / error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
