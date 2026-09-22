'use strict';
/**
 * Route PDF Routes — POST /api/dt/lumi/route-pdf
 * Accepts payload.route + payload.quote (client sanitized),
 * generates and streams a PDF buffer.
 */

const express = require('express');
const { generateRoutePdf } = require('../services/routePdfService');

const router = express.Router();

function buildContentDisposition(startDate) {
  const dateStr = ((startDate || '').replace(/-/g, '')).replace(/[\r\n]/g, '');
  const korean = `나의_여수여행_일정_${dateStr}.pdf`;
  const ascii = `my-route-${dateStr}.pdf`;
  const encoded = encodeURIComponent(korean);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

router.post('/route-pdf', async (req, res) => {
  const { route, quote } = req.body;

  if (!route || !Array.isArray(route.days) || route.days.length === 0) {
    return res.status(400).json({ error: 'route.days required' });
  }
  if (!quote || !quote.pricing) {
    return res.status(400).json({ error: 'quote.pricing required' });
  }

  try {
    const pdfBuffer = await generateRoutePdf(route, quote);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', buildContentDisposition(route.start_date));
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[routePdfRoutes] PDF generation failed:', err.message);
    res.status(500).json({ error: 'PDF 생성에 실패했습니다.' });
  }
});

module.exports = router;
module.exports.buildContentDisposition = buildContentDisposition;
