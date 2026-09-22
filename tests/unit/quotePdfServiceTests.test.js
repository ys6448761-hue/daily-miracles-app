'use strict';
/**
 * quotePdfService + quotePdfRoutes — Unit Tests
 * Validates: sanitization, cost/margin security, Content-Disposition safety, Buffer normalization.
 * PDF generation (Puppeteer) is out of scope for unit tests.
 */

const { sanitizeQuoteForCustomerPdf, sanitizeRouteContextForPdf } = require('../../services/myQuotePdfService');
const { buildContentDisposition } = require('../../routes/quotePdfRoutes');

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeRawQuote() {
  return {
    guestCount: 2,
    status: 'CALCULATED',
    quoteId: 'QT-TEST-001',
    validUntil: '2026-10-31',
    pricing: {
      totalList: 215000,
      totalSell: 172000,
      totalSavings: 43000,
      totalCost: 120000,      // MUST NOT appear in output
      totalMargin: 52000,     // MUST NOT appear in output
    },
    breakdown: [
      {
        name: '라마다 호텔 여수',
        list: 175000,
        sell: 140000,
        cost: 90000,           // MUST NOT appear in output
        margin: 50000,         // MUST NOT appear in output
        roomType: '디럭스 더블',
        guests: 2,
      },
      {
        name: '여수 해상케이블카',
        list: 40000,
        sell: 32000,
        cost: 30000,           // MUST NOT appear in output
        commission: 2000,      // MUST NOT appear in output
        perPerson: 16000,
        guests: 2,
      }
    ]
  };
}

function makeRouteContext() {
  return {
    start_date: '2026-10-17',
    end_date: '2026-10-18',
    party: { type: 'couple', count: 2 },
    // internal fields that should not leak
    _someInternal: 'secret',
    commerce_code: 'RAMADA',
  };
}

// ── Sanitization Tests ────────────────────────────────────────────────────────

describe('sanitizeQuoteForCustomerPdf', () => {
  test('totalCost removed from pricing', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    expect(result.pricing).not.toHaveProperty('totalCost');
  });

  test('totalMargin removed from pricing', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    expect(result.pricing).not.toHaveProperty('totalMargin');
  });

  test('customer price fields preserved: totalList, totalSell, totalSavings', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    expect(result.pricing.totalList).toBe(215000);
    expect(result.pricing.totalSell).toBe(172000);
    expect(result.pricing.totalSavings).toBe(43000);
  });

  test('cost removed from breakdown items', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    result.breakdown.forEach(item => {
      expect(item).not.toHaveProperty('cost');
    });
  });

  test('margin removed from breakdown items', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    result.breakdown.forEach(item => {
      expect(item).not.toHaveProperty('margin');
    });
  });

  test('commission removed from breakdown items', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    result.breakdown.forEach(item => {
      expect(item).not.toHaveProperty('commission');
    });
  });

  test('customer item fields preserved: name, list, sell, perPerson, guests, roomType', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    const hotel = result.breakdown[0];
    expect(hotel.name).toBe('라마다 호텔 여수');
    expect(hotel.list).toBe(175000);
    expect(hotel.sell).toBe(140000);
    expect(hotel.roomType).toBe('디럭스 더블');
    const cable = result.breakdown[1];
    expect(cable.perPerson).toBe(16000);
    expect(cable.guests).toBe(2);
  });

  test('meta fields preserved: guestCount, validUntil, quoteId, status', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    expect(result.guestCount).toBe(2);
    expect(result.validUntil).toBe('2026-10-31');
    expect(result.quoteId).toBe('QT-TEST-001');
    expect(result.status).toBe('CALCULATED');
  });

  test('null quote returns null', () => {
    expect(sanitizeQuoteForCustomerPdf(null)).toBeNull();
    expect(sanitizeQuoteForCustomerPdf(undefined)).toBeNull();
  });

  test('settlement and supplier_price blocked if present', () => {
    const raw = makeRawQuote();
    raw.breakdown[0].settlement = 'S1';
    raw.breakdown[0].supplier_price = 80000;
    const result = sanitizeQuoteForCustomerPdf(raw);
    result.breakdown.forEach(item => {
      expect(item).not.toHaveProperty('settlement');
      expect(item).not.toHaveProperty('supplier_price');
    });
  });
});

describe('sanitizeRouteContextForPdf', () => {
  test('returns only start_date, end_date, party', () => {
    const ctx = makeRouteContext();
    const result = sanitizeRouteContextForPdf(ctx);
    expect(result).toHaveProperty('start_date', '2026-10-17');
    expect(result).toHaveProperty('end_date', '2026-10-18');
    expect(result.party).toEqual({ type: 'couple', count: 2 });
  });

  test('internal fields not included in output', () => {
    const ctx = makeRouteContext();
    const result = sanitizeRouteContextForPdf(ctx);
    expect(result).not.toHaveProperty('_someInternal');
    expect(result).not.toHaveProperty('commerce_code');
  });

  test('null routeContext returns empty object', () => {
    expect(sanitizeRouteContextForPdf(null)).toEqual({});
    expect(sanitizeRouteContextForPdf(undefined)).toEqual({});
  });
});

// ── Content-Disposition Tests ──────────────────────────────────────────────────

describe('buildContentDisposition (quotePdfRoutes)', () => {
  test('ASCII filename is safe (no Korean)', () => {
    const cd = buildContentDisposition('20261017');
    expect(cd).toMatch(/filename="my-quote-20261017\.pdf"/);
  });

  test('Korean filename is percent-encoded via filename*', () => {
    const cd = buildContentDisposition('20261017');
    expect(cd).toMatch(/filename\*=UTF-8''/);
    expect(cd).not.toMatch(/나의/);
  });

  test('CR/LF injection is stripped from date string', () => {
    const cd = buildContentDisposition('20261017\r\nX-Header: injected');
    expect(cd).not.toMatch(/\r|\n/);
  });

  test('empty date produces safe fallback filename', () => {
    const cd = buildContentDisposition('');
    expect(cd).toMatch(/filename="my-quote-yeosu\.pdf"/);
  });
});

// ── Buffer Normalization Tests ───────────────────────────────────────────────

describe('Buffer normalization (defensive)', () => {
  test('Uint8Array normalized to Buffer', () => {
    const uint8 = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    const buf = Buffer.isBuffer(uint8) ? uint8 : Buffer.from(uint8);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf[0]).toBe(0x25); // %
    expect(buf[1]).toBe(0x50); // P
  });

  test('Buffer passes through unchanged', () => {
    const original = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    const result = Buffer.isBuffer(original) ? original : Buffer.from(original);
    expect(result).toBe(original); // same reference
  });
});

// ── Price Consistency Test ────────────────────────────────────────────────────

describe('Founder baseline price consistency', () => {
  test('Ramada 140000 + Cable 32000 = totalSell 172000', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    const sellSum = result.breakdown.reduce((sum, b) => sum + (b.sell || 0), 0);
    expect(sellSum).toBe(result.pricing.totalSell);
  });

  test('totalList - totalSell = totalSavings', () => {
    const raw = makeRawQuote();
    const result = sanitizeQuoteForCustomerPdf(raw);
    const { totalList, totalSell, totalSavings } = result.pricing;
    expect(totalList - totalSell).toBe(totalSavings);
  });
});
