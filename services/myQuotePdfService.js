'use strict';
/**
 * myQuotePdfService — INDIVIDUAL MY QUOTE PDF Generator
 * Generates a customer-facing quote PDF from a sanitized quote payload.
 * Security: no COST/margin/totalCost/totalMargin/settlement exposed.
 * Price authority = payload.quote (sanitized by quoteEngine.sanitizeForCustomer).
 * Font: Noto Sans KR embedded as base64 (no Google Fonts runtime).
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

// ── Font CSS (module-level cache) ──────────────────────────────────────────

let _fontCssCache = null;
function buildFontFaceCSS() {
  if (_fontCssCache) return _fontCssCache;
  const pkgRoot = path.dirname(require.resolve('@fontsource/noto-sans-kr/package.json'));
  const woff2Path = path.join(pkgRoot, 'files', 'noto-sans-kr-korean-400-normal.woff2');
  let fontBase64;
  try {
    fontBase64 = fs.readFileSync(woff2Path).toString('base64');
  } catch (e) {
    throw new Error(
      `[myQuotePdfService] Korean font not found at ${woff2Path}. ` +
      `Ensure @fontsource/noto-sans-kr is in production dependencies. Original: ${e.message}`
    );
  }
  _fontCssCache = `@font-face {
  font-family: 'Noto Sans KR';
  font-weight: 400;
  font-style: normal;
  src: url('data:font/woff2;base64,${fontBase64}') format('woff2');
}`;
  return _fontCssCache;
}

// ── Sanitization ─────────────────────────────────────────────────────────────

const BLOCKED_PRICING_KEYS = new Set(['totalCost', 'totalMargin', 'cost', 'margin', 'settlement', 'commission']);
const BLOCKED_ITEM_KEYS = new Set(['cost', 'margin', 'settlement', 'commission', 'supplier_price', 'contract_price', 'deposit']);

/**
 * Strip cost/margin internals from quote for customer PDF.
 * Defense-in-depth: called server-side even if frontend payload is already sanitized.
 */
function sanitizeQuoteForCustomerPdf(quote) {
  if (!quote) return null;

  const rawPricing = quote.pricing || {};
  const safePricing = {};
  for (const [k, v] of Object.entries(rawPricing)) {
    if (!BLOCKED_PRICING_KEYS.has(k)) safePricing[k] = v;
  }

  const safeBreakdown = (quote.breakdown || []).map(item => {
    const safe = {};
    for (const [k, v] of Object.entries(item)) {
      if (!BLOCKED_ITEM_KEYS.has(k)) safe[k] = v;
    }
    return safe;
  });

  return {
    guestCount: quote.guestCount,
    pricing: safePricing,
    breakdown: safeBreakdown,
    validUntil: quote.validUntil,
    quoteId: quote.quoteId,
    status: quote.status,
  };
}

/**
 * Extract only customer-facing travel metadata from routeContext.
 */
function sanitizeRouteContextForPdf(routeContext) {
  if (!routeContext) return {};
  const { start_date, end_date, party } = routeContext;
  return { start_date, end_date, party };
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  return `${m}월 ${day}일(${DOW[d.getDay()]})`;
}

function fmtKRW(n) {
  if (n == null || isNaN(n)) return '';
  return n.toLocaleString('ko-KR') + '원';
}

function buildQuotePdfHtml(quote, routeContext) {
  const fontFaceCSS = buildFontFaceCSS();

  const dateRange = routeContext.start_date
    ? `${fmtDate(routeContext.start_date)}${routeContext.end_date ? ` ~ ${fmtDate(routeContext.end_date)}` : ''}`
    : '';

  const party = routeContext.party;
  const partyLabel = party
    ? (() => {
        const typeMap = { couple: '커플', family: '가족', friends: '일행', adults: '일행' };
        const label = typeMap[party.type] || '일행';
        return `${party.count || ''}인 ${label}`;
      })()
    : '';

  const p = quote.pricing || {};
  const breakdown = quote.breakdown || [];

  const itemRows = breakdown.map(b => {
    const perNote = b.perPerson && b.guests
      ? `<div class="item-note">${b.guests}명 × ${fmtKRW(b.perPerson)}</div>`
      : '';
    const roomNote = b.roomType ? `<div class="item-note">${b.roomType}</div>` : '';
    const hasDiscount = b.list != null && b.sell != null && b.list > b.sell;
    return `
      <tr>
        <td class="item-name-cell">
          <div class="item-name">${b.name || ''}</div>
          ${roomNote}${perNote}
        </td>
        <td class="price-cell list-price${hasDiscount ? ' has-discount' : ''}">
          ${b.list != null ? fmtKRW(b.list) : ''}
        </td>
        <td class="price-cell sell-price">
          ${b.sell != null ? fmtKRW(b.sell) : ''}
        </td>
      </tr>`;
  }).join('');

  const perPersonBox = p.totalSell != null && (quote.guestCount || 0) > 1
    ? `<div class="final-box">
        <div class="final-left">
          <div class="final-label">최종 결제 예정금액</div>
          <div class="per-person">1인당 약 ${fmtKRW(Math.round(p.totalSell / (quote.guestCount || 1)))}</div>
        </div>
        <div class="final-amount">${fmtKRW(p.totalSell)}</div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
${fontFaceCSS}
@page { size: A4; margin: 15mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Noto Sans KR', -apple-system, sans-serif;
  font-size: 11pt; line-height: 1.6; color: #1a1a2e;
}
.doc { max-width: 180mm; margin: 0 auto; }
.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d6b 100%);
  color: white; padding: 24px 20px 20px; border-radius: 10px; margin-bottom: 24px;
}
.header-label { font-size: 9pt; opacity: 0.6; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.header h1 { font-size: 22pt; font-weight: 700; margin-bottom: 4px; }
.header .sub { font-size: 10pt; opacity: 0.65; margin-bottom: 12px; }
.header .meta { font-size: 10pt; opacity: 0.85; }
.section-title {
  font-size: 10pt; font-weight: 700; color: #2d2d6b;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #2d2d6b;
}
table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
thead th {
  font-size: 9pt; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.4px;
  padding: 0 0 8px; text-align: left; border-bottom: 1px solid #ddd;
}
thead th.price-col { text-align: right; }
tbody tr { border-bottom: 1px solid #f0f0f0; }
tbody tr:last-child { border-bottom: none; }
td { padding: 12px 0; vertical-align: top; }
.item-name-cell { padding-right: 12px; }
.item-name { font-size: 12pt; font-weight: 500; }
.item-note { font-size: 9pt; color: #999; margin-top: 2px; }
.price-cell { text-align: right; font-size: 11pt; white-space: nowrap; padding-left: 8px; }
.list-price { color: #aaa; }
.list-price.has-discount { text-decoration: line-through; color: #bbb; font-size: 10pt; }
.sell-price { font-weight: 700; color: #1a1a2e; }
.totals-box { margin-top: 16px; background: #f8f9ff; border-radius: 10px; padding: 16px 20px; }
.total-row { display: flex; justify-content: space-between; font-size: 11pt; color: #555; padding: 4px 0; }
.total-row.savings { color: #c0392b; font-weight: 600; }
.total-row.final { font-size: 14pt; font-weight: 800; color: #1a1a2e; margin-top: 10px; padding-top: 10px; border-top: 2px solid #1a1a2e; }
.final-box {
  margin-top: 16px; background: #1a1a2e; color: white;
  border-radius: 10px; padding: 18px 22px;
  display: flex; justify-content: space-between; align-items: center;
}
.final-left .final-label { font-size: 10pt; opacity: 0.7; }
.final-left .per-person { font-size: 9pt; opacity: 0.55; margin-top: 2px; }
.final-amount { font-size: 24pt; font-weight: 800; letter-spacing: -1px; }
.notice {
  margin-top: 14px; background: #fffbf0; border: 1px solid #f0e0a0;
  border-radius: 8px; padding: 10px 14px; font-size: 9pt; color: #7a6000; line-height: 1.8;
}
.quote-meta { margin-top: 10px; font-size: 9pt; color: #bbb; text-align: right; }
.footer { margin-top: 20px; text-align: center; font-size: 9pt; color: #bbb; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <div class="header-label">MY QUOTE</div>
    <h1>여수 여행 견적서</h1>
    <div class="sub">하루하루의 기적 · Yeosu Sowon Voyage</div>
    ${dateRange || partyLabel ? `<div class="meta">${[dateRange, partyLabel].filter(Boolean).join(' · ')}</div>` : ''}
  </div>

  <div class="section-title">상품별 견적</div>
  <table>
    <thead>
      <tr>
        <th>상품 / 서비스</th>
        <th class="price-col">정상가</th>
        <th class="price-col">여행가</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals-box">
    ${p.totalList != null ? `<div class="total-row"><span>정상가 합계</span><span>${fmtKRW(p.totalList)}</span></div>` : ''}
    ${p.totalSavings != null && p.totalSavings > 0 ? `<div class="total-row savings"><span>할인혜택</span><span>− ${fmtKRW(p.totalSavings)}</span></div>` : ''}
    ${p.totalSell != null ? `<div class="total-row final"><span>최종 여행금액</span><span>${fmtKRW(p.totalSell)}</span></div>` : ''}
  </div>

  ${perPersonBox}

  <div class="notice">
    ※ 본 견적은 현재 선택한 여행 일정 기준이며, 최종 확정은 예약 완료 시 안내드립니다.<br>
    ※ 현장 추가 선택 사항은 별도 안내드립니다.<br>
    ${quote.validUntil ? `※ 견적 유효기간: <strong>${quote.validUntil}</strong>까지` : ''}
  </div>

  ${quote.quoteId ? `<div class="quote-meta">견적번호: ${quote.quoteId}</div>` : ''}
  <div class="footer">하루하루의 기적 · 1899-6117 · app.dailymiracles.kr</div>
</div>
</body>
</html>`;
}

// ── PDF generation ─────────────────────────────────────────────────────────────

async function generateQuotePdf(quoteData, routeContextData) {
  const quote = sanitizeQuoteForCustomerPdf(quoteData);
  const routeCtx = sanitizeRouteContextForPdf(routeContextData);
  const html = buildQuotePdfHtml(quote, routeCtx);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluateHandle('document.fonts.ready');
    const pdfResult = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });
    // Normalize Uint8Array → Buffer for correct binary HTTP response
    return Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  sanitizeQuoteForCustomerPdf,
  sanitizeRouteContextForPdf,
  generateQuotePdf,
};
