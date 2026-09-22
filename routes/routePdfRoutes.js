'use strict';
/**
 * Route PDF Routes — POST /api/dt/lumi/route-pdf
 * Accepts payload.route + payload.quote (client sanitized),
 * generates and streams a PDF buffer.
 */

const express = require('express');
const { generateRoutePdf } = require('../services/routePdfService');

const router = express.Router();

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
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="여수-여정-${today}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[routePdfRoutes] PDF generation failed:', err.message);
    res.status(500).json({ error: 'PDF 생성에 실패했습니다.' });
  }
});

module.exports = router;
