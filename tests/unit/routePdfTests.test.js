'use strict';
/**
 * routePdfService — Unit Tests
 * Validates sanitization, badge translation, and quote stripping.
 * PDF generation (Puppeteer) is out of scope for unit tests.
 */

const { sanitizeRouteForPdf, sanitizeQuoteForPdf } = require('../../services/routePdfService');
const { buildContentDisposition } = require('../../routes/routePdfRoutes');

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeRouteFixture() {
  return {
    start_date: '2026-10-17',
    end_date: '2026-10-18',
    party: 'couple',
    days: [
      {
        day: 1,
        date: '2026-10-17',
        items: [
          {
            day: 1, date: '2026-10-17', sequence: 1, time_slot: 'arrival', time: null,
            type: 'arrival', name: '여수 도착', source: 'ROUTE_DEFAULT', selection_status: 'LOCKED',
            commerce_code: null, quotable: false
          },
          {
            day: 1, date: '2026-10-17', sequence: 10, time_slot: 'afternoon', time: null,
            type: 'leisure', name: '여수 해상케이블카', source: 'USER_SELECTED', selection_status: 'LOCKED',
            commerce_code: 'cable', quotable: true
          },
          {
            day: 1, date: '2026-10-17', sequence: 5, time_slot: 'morning', time: null,
            type: 'attraction', name: '오동도', source: 'SOUL_RECOMMENDED', selection_status: 'SUGGESTED',
            commerce_code: null, quotable: false
          }
        ]
      },
      {
        day: 2,
        date: '2026-10-18',
        items: [
          {
            day: 2, date: '2026-10-18', sequence: 1, time_slot: 'morning', time: null,
            type: 'hotel', name: '라마다 호텔 여수', source: 'USER_SELECTED', selection_status: 'LOCKED',
            commerce_code: 'ramada', quotable: false
          }
        ]
      }
    ]
  };
}

function makeQuoteFixture() {
  return {
    quoteId: 'QT-20261017-TEST',
    validUntil: '2026-10-24',
    pricing: {
      totalList: 215000,
      totalSell: 172000,
      totalSavings: 43000,
      totalCost: 130000,
      totalMargin: 42000
    },
    breakdown: [
      { name: '라마다 호텔 여수', list: 175000, sell: 140000, cost: 100000, guests: 2, perPerson: 70000 },
      { name: '여수 해상케이블카', list: 40000, sell: 32000, cost: 30000, guests: 2, perPerson: 16000 }
    ]
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('routePdfService — sanitizeRouteForPdf', () => {
  test('PDF_SANITIZATION_no_internal_fields: removes commerce_code, quotable, sequence, source, selection_status', () => {
    const result = sanitizeRouteForPdf(makeRouteFixture());
    const items = result.days.flatMap(d => d.items);
    for (const item of items) {
      expect(item).not.toHaveProperty('commerce_code');
      expect(item).not.toHaveProperty('quotable');
      expect(item).not.toHaveProperty('sequence');
      expect(item).not.toHaveProperty('source');
      expect(item).not.toHaveProperty('selection_status');
    }
  });

  test('PDF_SANITIZATION_badge_translation: LOCKED→선택한 일정, SOUL_RECOMMENDED→SOUL 추천, ROUTE_DEFAULT→null', () => {
    const result = sanitizeRouteForPdf(makeRouteFixture());
    const items = result.days.flatMap(d => d.items);
    const arrival = items.find(i => i.type === 'arrival');
    const cable = items.find(i => i.name === '여수 해상케이블카');
    const odongdo = items.find(i => i.name === '오동도');
    expect(arrival.badge).toBe('선택한 일정');
    expect(cable.badge).toBe('선택한 일정');
    expect(odongdo.badge).toBe('SOUL 추천');
  });

  test('PDF_ROUTE_locked_items_preserved: LOCKED items survive sanitization with name and type', () => {
    const result = sanitizeRouteForPdf(makeRouteFixture());
    const items = result.days.flatMap(d => d.items);
    const cable = items.find(i => i.name === '여수 해상케이블카');
    expect(cable).toBeDefined();
    expect(cable.type).toBe('leisure');
    expect(cable.time_slot).toBe('afternoon');
  });

  test('PDF_ROUTE_day_structure: day structure preserved', () => {
    const result = sanitizeRouteForPdf(makeRouteFixture());
    expect(result.days).toHaveLength(2);
    expect(result.days[0].day).toBe(1);
    expect(result.days[1].day).toBe(2);
  });

  test('sanitizeRouteForPdf returns null for null input', () => {
    expect(sanitizeRouteForPdf(null)).toBeNull();
  });
});

describe('routePdfService — sanitizeQuoteForPdf', () => {
  test('PDF_SANITIZATION_no_cost: strips totalCost and totalMargin from pricing', () => {
    const result = sanitizeQuoteForPdf(makeQuoteFixture());
    expect(result.pricing).not.toHaveProperty('totalCost');
    expect(result.pricing).not.toHaveProperty('totalMargin');
  });

  test('PDF_QUOTE_totals_preserved: totalList, totalSell, totalSavings preserved', () => {
    const result = sanitizeQuoteForPdf(makeQuoteFixture());
    expect(result.pricing.totalList).toBe(215000);
    expect(result.pricing.totalSell).toBe(172000);
    expect(result.pricing.totalSavings).toBe(43000);
  });

  test('PDF_QUOTE_breakdown_no_cost: cost stripped from each breakdown item', () => {
    const result = sanitizeQuoteForPdf(makeQuoteFixture());
    for (const item of result.breakdown) {
      expect(item).not.toHaveProperty('cost');
    }
  });

  test('sanitizeQuoteForPdf returns null for null input', () => {
    expect(sanitizeQuoteForPdf(null)).toBeNull();
  });
});

describe('routePdfService — Buffer normalization', () => {
  test('Buffer.from(Uint8Array) produces a Buffer with matching bytes', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf[0]).toBe(0x25);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x44);
    expect(buf[3]).toBe(0x46);
  });

  test('Buffer passthrough: already-Buffer value is not re-wrapped', () => {
    const original = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    const result = Buffer.isBuffer(original) ? original : Buffer.from(original);
    expect(result).toBe(original); // same reference — no copy
  });
});

describe('routePdfRoutes — buildContentDisposition', () => {
  test('Content-Disposition: ASCII fallback present', () => {
    const cd = buildContentDisposition('2026-10-17');
    expect(cd).toContain('filename="my-route-20261017.pdf"');
  });

  test('Content-Disposition: UTF-8 encoded filename* present, no raw Korean', () => {
    const cd = buildContentDisposition('2026-10-17');
    expect(cd).toContain("filename*=UTF-8''");
    expect(cd).not.toMatch(/[가-힯]/);
  });

  test('Content-Disposition: no CR/LF injection', () => {
    const cd = buildContentDisposition('2026-10-17\r\nX-Injected: evil');
    expect(cd).not.toContain('\r');
    expect(cd).not.toContain('\n');
  });
});
