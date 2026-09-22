'use strict';
/**
 * quotePdfRoutes — POST /api/dt/lumi/quote-pdf
 * Individual MY QUOTE PDF download endpoint.
 * Security: server-side sanitization regardless of frontend payload state.
 */

const express = require('express');
const router = express.Router();
const { generateQuotePdf } = require('../services/myQuotePdfService');

// RFC 5987 Content-Disposition — no raw Korean in filename=
function buildContentDisposition(dateStr) {
  const safe = (dateStr || '').replace(/[^0-9]/g, '').replace(/[\r\n]/g, '');
  const asciiFilename = `my-quote-${safe || 'yeosu'}.pdf`;
  const koreanFilename = encodeURIComponent(`나의_여수여행_견적서_${safe || 'yeosu'}.pdf`);
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${koreanFilename}`;
}

router.post('/quote-pdf', async (req, res) => {
  const { quote, routeContext } = req.body || {};

  if (!quote || !quote.pricing) {
    return res.status(400).json({
      error: 'QUOTE_PDF_ERROR',
      message: 'quote with pricing is required'
    });
  }

  try {
    const pdfResult = await generateQuotePdf(quote, routeContext || {});
    // Normalize Uint8Array → Buffer (defense-in-depth, generateQuotePdf already normalizes)
    const pdfBuffer = Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);

    const dateStr = ((routeContext?.start_date || '').replace(/-/g, '')).replace(/[\r\n]/g, '');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': buildContentDisposition(dateStr),
      'Content-Length': pdfBuffer.length,
    });
    // res.end for binary safety — Express res.send infers type and may corrupt binary
    res.end(pdfBuffer);
  } catch (err) {
    // Do not log full quote payload — may contain customer PII
    console.error('[quotePdfRoutes] PDF generation failed:', err.message);
    res.status(500).json({
      error: 'QUOTE_PDF_ERROR',
      message: 'PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
});

module.exports = router;
module.exports.buildContentDisposition = buildContentDisposition;
