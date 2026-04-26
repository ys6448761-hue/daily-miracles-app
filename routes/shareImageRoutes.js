'use strict';

/**
 * shareImageRoutes.js — DreamTown 공유 이미지 자동 생성 API
 * prefix: /api
 *
 * POST /generate-share-image  — SSOT 기반 이미지 온디맨드 생성
 */

const router = require('express').Router();

let generateShareImage = null;
let SCENE_MAP = {};
try {
  ({ generateShareImage, SCENE_MAP } = require('../services/imageGenerationService'));
} catch (_) {}

// ── 허용 location 목록 (SCENE_MAP + normalize 대상) ───────────────
const ALLOWED_LOCATIONS = new Set([
  'yeosu-cablecar', 'yeosu_cablecar',
  'lattoa_cafe', 'lattoa-cafe',
  'forestland',
  'paransi',
  'cablecar',
]);

// ── POST /api/generate-share-image ────────────────────────────────
router.post('/generate-share-image', async (req, res) => {
  const { location, emotion } = req.body;

  // 입력 검증
  if (!location) {
    return res.status(400).json({ success: false, error: 'location 필수' });
  }
  if (!emotion) {
    return res.status(400).json({ success: false, error: 'emotion 필수' });
  }
  if (!ALLOWED_LOCATIONS.has(location)) {
    return res.status(400).json({
      success: false,
      error:   `알 수 없는 location: ${location}`,
      allowed: [...ALLOWED_LOCATIONS],
    });
  }

  // 서비스 가용 여부
  if (!generateShareImage) {
    return res.status(503).json({ success: false, error: 'imageGenerationService 로드 실패' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ success: false, error: 'OPENAI_API_KEY 미설정' });
  }

  try {
    const result = await generateShareImage(location, emotion);
    return res.json({
      success:   true,
      image_url: result.image_url,
      emotion,
      location:  result.location,
      image_id:  result.image_id,
    });
  } catch (err) {
    console.error('[share-image] 생성 실패:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
