/**
 * certificateRoutes.js
 * 입항 증명서 (4:5 Certificate) API
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 서비스 (tolerant loading)
let certificateService = null;
let captionService = null;
try {
  certificateService = require('../services/certificateService');
} catch (err) {
  console.error('[CertificateRoutes] certificateService 로드 실패:', err.message);
}
try {
  captionService = require('../services/captionService');
} catch (err) {
  console.error('[CertificateRoutes] captionService 로드 실패:', err.message);
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/**
 * POST /api/certificate/generate
 *
 * Body:
 * - image_path (필수): 소스 이미지 경로 (예: "/images/wishes/wish_xxx.png" 또는 절대경로)
 * - date (선택): 날짜 (기본: 오늘)
 * - boarding_id (선택): 증명서 ID (기본: 자동 생성)
 * - caption (선택): 캡션 텍스트 (미제공 시 captionService 자동 생성)
 * - tone (선택): 캡션 톤 (HOPEFUL|CALM|RESTART, 기본: HOPEFUL)
 */
router.post('/generate', async (req, res) => {
  try {
    if (!certificateService) {
      return res.status(503).json({ success: false, error: 'Certificate service unavailable' });
    }

    const { image_path, date, boarding_id, caption, tone = 'CALM' } = req.body;

    if (!image_path) {
      return res.status(400).json({ success: false, error: 'image_path is required' });
    }

    // 이미지 경로 해석
    let resolvedPath;
    if (path.isAbsolute(image_path)) {
      resolvedPath = image_path;
    } else if (image_path.startsWith('/images/')) {
      resolvedPath = path.join(PUBLIC_DIR, image_path);
    } else {
      resolvedPath = path.join(PUBLIC_DIR, 'images', 'wishes', path.basename(image_path));
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, error: 'Source image not found' });
    }

    // 캡션 자동 생성
    let finalCaption = caption;
    let captionMeta = null;
    if (!finalCaption && captionService) {
      const result = await captionService.generateCaption({ tone });
      finalCaption = result.caption;
      captionMeta = result.safety_flags;
    }
    if (!finalCaption) {
      finalCaption = '좋은 방향으로 한 걸음 더.';
    }

    // 날짜/ID 자동 생성
    const finalDate = date || new Date().toISOString().split('T')[0];
    const finalBoardingId = boarding_id || `YG-${finalDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    // 증명서 생성
    const result = await certificateService.generateCertificate({
      imagePath: resolvedPath,
      date: finalDate,
      boardingId: finalBoardingId,
      caption: finalCaption
    });

    res.json({
      success: true,
      ...result,
      captionGenerated: !caption,
      captionSafety: captionMeta
    });

  } catch (error) {
    console.error('[Certificate] Generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Certificate generation failed',
      details: error.message
    });
  }
});

/**
 * GET /api/certificate/list
 * 생성된 증명서 목록
 */
router.get('/list', (req, res) => {
  const certDir = path.join(PUBLIC_DIR, 'images', 'certificates');
  if (!fs.existsSync(certDir)) {
    return res.json({ success: true, certificates: [] });
  }

  const files = fs.readdirSync(certDir)
    .filter(f => f.endsWith('.png'))
    .map(f => ({
      filename: f,
      url: `/images/certificates/${f}`,
      created: fs.statSync(path.join(certDir, f)).mtime
    }))
    .sort((a, b) => b.created - a.created);

  res.json({ success: true, count: files.length, certificates: files });
});

module.exports = router;
