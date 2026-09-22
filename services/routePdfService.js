'use strict';
/**
 * routePdfService — MY ROUTE PDF Generator
 * Generates a customer-facing itinerary PDF from payload.route + payload.quote.
 * Security: no COST/margin fields exposed. Price authority = payload.quote only.
 * Font: Noto Sans KR via file:// paths (no Google Fonts runtime dependency).
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

// ── Font CSS (loaded once, reused) ─────────────────────────────────────────

let _fontCssCache = null;
function buildFontFaceCSS() {
  if (_fontCssCache) return _fontCssCache;
  const fontsDir = path.join(__dirname, '..', 'node_modules', '@fontsource', 'noto-sans-kr');
  const filesAbsolute = path.join(fontsDir, 'files').replace(/\\/g, '/');
  const fileUrl = `file:///${filesAbsolute}`;

  const css400 = fs.readFileSync(path.join(fontsDir, '400.css'), 'utf8')
    .replace(/url\(\.\/files\//g, `url(${fileUrl}/`);
  const css700 = fs.readFileSync(path.join(fontsDir, '700.css'), 'utf8')
    .replace(/url\(\.\/files\//g, `url(${fileUrl}/`);

  _fontCssCache = css400 + '\n' + css700;
  return _fontCssCache;
}

// ── Sanitization ────────────────────────────────────────────────────────────

/**
 * Strip internal fields from route items; add badge label for display.
 * NEVER exposes: commerce_code, quotable, sequence, source, selection_status
 */
function sanitizeRouteForPdf(route) {
  if (!route) return null;
  return {
    ...route,
    days: (route.days || []).map(day => ({
      ...day,
      items: (day.items || []).map(item => {
        const { commerce_code, quotable, sequence, source, selection_status, ...safe } = item;
        return {
          ...safe,
          badge: selection_status === 'LOCKED' ? '선택한 일정'
               : source === 'SOUL_RECOMMENDED' ? 'SOUL 추천'
               : null
        };
      })
    }))
  };
}

/**
 * Strip cost/margin from quote. Price authority: totalList, totalSell, totalSavings only.
 * NEVER exposes: totalCost, totalMargin, cost per breakdown item
 */
function sanitizeQuoteForPdf(quote) {
  if (!quote) return null;
  const { totalCost, totalMargin, ...safePricing } = (quote.pricing || {});
  return {
    ...quote,
    pricing: safePricing,
    breakdown: (quote.breakdown || []).map(({ cost, ...item }) => item)
  };
}

// ── Time slot label ─────────────────────────────────────────────────────────

const TIME_SLOT_LABEL = {
  arrival: null,
  morning: '오전',
  lunch: '점심',
  afternoon: '오후',
  evening: '저녁',
  night: '밤',
  departure: null
};

const TYPE_ICON = {
  hotel: '🏨',
  leisure: '🎡',
  attraction: '🗺️',
  meal: '🍽️',
  arrival: '📍',
  departure: '🏁'
};

// ── HTML builder ────────────────────────────────────────────────────────────

function buildRoutePdfHtml(route, quote) {
  const fontFaceCSS = buildFontFaceCSS();

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

  const SLOT_ORDER = ['arrival', 'morning', 'lunch', 'afternoon', 'evening', 'night', 'departure'];

  function buildDayHtml(day) {
    const groups = {};
    for (const item of (day.items || [])) {
      const slot = item.time_slot || 'morning';
      if (!groups[slot]) groups[slot] = [];
      groups[slot].push(item);
    }

    const slotHtml = SLOT_ORDER
      .filter(s => groups[s] && groups[s].length > 0)
      .map(slot => {
        const label = TIME_SLOT_LABEL[slot];
        const itemsHtml = groups[slot].map(item => {
          const icon = TYPE_ICON[item.type] || '📌';
          const badgeHtml = item.badge
            ? `<span class="route-badge ${item.badge === '선택한 일정' ? 'badge-locked' : 'badge-soul'}">${item.badge}</span>`
            : '';
          let subText = '';
          if (item.type === 'hotel' && item.time_slot === 'evening') subText = '체크인';
          else if (item.type === 'hotel' && item.time_slot === 'morning') subText = '체크아웃';
          if (item.time && subText) subText = `${subText} · ${item.time}`;
          else if (item.time) subText = item.time;

          return `
            <div class="route-item ${item.badge === '선택한 일정' ? 'item-locked' : ''}">
              <span class="item-icon">${icon}</span>
              <div class="item-content">
                <span class="item-name">${item.name || ''}</span>
                ${subText ? `<span class="item-sub">${subText}</span>` : ''}
              </div>
              ${badgeHtml}
            </div>`;
        }).join('');

        return `
          <div class="route-slot">
            ${label ? `<div class="slot-label">${label}</div>` : ''}
            ${itemsHtml}
          </div>`;
      }).join('');

    return `
      <div class="route-day">
        <div class="day-header">DAY ${day.day} · ${fmtDate(day.date)}</div>
        ${slotHtml}
      </div>`;
  }

  const daysHtml = (route.days || []).map(buildDayHtml).join('');

  let quoteHtml = '';
  if (quote && quote.pricing) {
    const p = quote.pricing;
    const breakdownRows = (quote.breakdown || []).map(b => {
      const perNote = b.perPerson ? `<br><small>${b.guests}명 × ${fmtKRW(b.perPerson)}</small>` : '';
      return `<tr><td>${b.name || ''}${perNote}</td><td class="price-col">${fmtKRW(b.sell)}</td></tr>`;
    }).join('');

    quoteHtml = `
      <div class="quote-section">
        <h2 class="section-title">MY QUOTE</h2>
        <table class="quote-table">
          <tbody>${breakdownRows}</tbody>
        </table>
        <div class="quote-totals">
          ${p.totalList != null ? `<div class="total-row"><span>정상가 합계</span><span>${fmtKRW(p.totalList)}</span></div>` : ''}
          ${p.totalSavings != null ? `<div class="total-row savings-row"><span>할인혜택</span><span>− ${fmtKRW(p.totalSavings)}</span></div>` : ''}
          ${p.totalSell != null ? `<div class="total-row main-total"><span>최종 금액</span><span>${fmtKRW(p.totalSell)}</span></div>` : ''}
        </div>
      </div>`;
  }

  const partyLabel = route.party === 'couple' ? '2인 커플'
    : route.party === 'family' ? '가족'
    : route.party === 'group' ? '단체'
    : route.party ? route.party : '';

  const dateRange = route.start_date
    ? `${fmtDate(route.start_date)}${route.end_date ? ` ~ ${fmtDate(route.end_date)}` : ''}`
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
  font-size: 11pt;
  line-height: 1.6;
  color: #1a1a2e;
}
.doc { max-width: 180mm; margin: 0 auto; }
.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d6b 100%);
  color: white;
  padding: 24px 20px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}
.header h1 { font-size: 18pt; font-weight: 700; margin-bottom: 4px; }
.header .sub { font-size: 10pt; opacity: 0.65; margin-bottom: 12px; }
.header .meta { font-size: 10pt; opacity: 0.85; }
.section-title {
  font-size: 11pt; font-weight: 700;
  color: #2d2d6b; margin-bottom: 12px;
  padding-bottom: 6px; border-bottom: 2px solid #2d2d6b;
}
.route-day { margin-bottom: 20px; }
.day-header {
  font-size: 11pt; font-weight: 700;
  background: #f0f2ff; padding: 8px 12px;
  border-radius: 6px; margin-bottom: 8px;
}
.route-slot { margin-bottom: 4px; }
.slot-label {
  font-size: 9pt; font-weight: 600;
  color: #888; text-transform: uppercase;
  letter-spacing: 0.5px; margin: 8px 0 4px 12px;
}
.route-item {
  display: flex; align-items: center;
  padding: 8px 12px; border-radius: 6px;
  margin-bottom: 4px; background: #fafafa;
  border: 1px solid #eeeeee;
}
.route-item.item-locked {
  background: #f0f4ff; border-color: #c0ccff;
}
.item-icon { font-size: 16pt; margin-right: 10px; flex-shrink: 0; }
.item-content { flex: 1; }
.item-name { font-size: 11pt; font-weight: 500; display: block; }
.item-sub { font-size: 9pt; color: #777; display: block; }
.route-badge {
  font-size: 8pt; font-weight: 600;
  padding: 2px 7px; border-radius: 10px;
  white-space: nowrap; margin-left: 8px;
}
.badge-locked { background: #dce4ff; color: #2d3db5; }
.badge-soul { background: #dcf5e6; color: #1a7a3e; }
.quote-section { margin-top: 20px; }
.quote-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
.quote-table td { padding: 8px 4px; border-bottom: 1px solid #eee; font-size: 10pt; }
.quote-table .price-col { text-align: right; font-weight: 600; }
.quote-totals { background: #f8f9ff; border-radius: 8px; padding: 12px 16px; }
.total-row { display: flex; justify-content: space-between; font-size: 10pt; padding: 3px 0; }
.savings-row { color: #c0392b; }
.main-total { font-size: 13pt; font-weight: 800; margin-top: 8px; padding-top: 8px; border-top: 2px solid #1a1a2e; }
.footer { margin-top: 20px; text-align: center; font-size: 9pt; color: #aaa; }
.notice { margin-top: 12px; font-size: 9pt; color: #888; line-height: 1.7; background: #fffbf0; border: 1px solid #f0e0a0; border-radius: 6px; padding: 10px 12px; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <h1>MY ROUTE</h1>
    <div class="sub">하루하루의 기적 · 여수 소원항해</div>
    ${dateRange || partyLabel ? `<div class="meta">${[dateRange, partyLabel].filter(Boolean).join(' · ')}</div>` : ''}
  </div>

  ${daysHtml}

  ${quoteHtml}

  <div class="notice">
    ※ 본 일정은 SOUL이 추천한 여행 초안입니다. 현장 상황에 따라 순서가 변경될 수 있습니다.<br>
    ※ 가격은 견적 기준이며, 최종 확정은 예약 완료 시 안내드립니다.
  </div>

  <div class="footer">하루하루의 기적 · 1899-6117 · app.dailymiracles.kr</div>
</div>
</body>
</html>`;
}

// ── PDF generation ──────────────────────────────────────────────────────────

async function generateRoutePdf(routeData, quoteData) {
  const route = sanitizeRouteForPdf(routeData);
  const quote = sanitizeQuoteForPdf(quoteData);
  const html = buildRoutePdfHtml(route, quote);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });
    return pdfBuffer;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  sanitizeRouteForPdf,
  sanitizeQuoteForPdf,
  generateRoutePdf
};
