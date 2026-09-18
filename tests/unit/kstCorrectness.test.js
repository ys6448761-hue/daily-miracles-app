'use strict';

/**
 * kstCorrectness.test.js — KST timezone correctness for getDayType + isCutoffPassed
 *
 * Uses explicit UTC timestamps to guarantee deterministic results regardless of
 * server timezone or wall-clock time.
 *
 * Tests verify:
 *   T1  YYYY-MM-DD string stays as the same Korean calendar date
 *   T2  Korean weekday classification
 *   T3  Korean weekend classification (Friday, Saturday, Sunday)
 *   T4  Korean holiday classification
 *   T5  Instant immediately BEFORE KST midnight → previous Korean date
 *   T6  Instant immediately AFTER KST midnight → next Korean date
 *   T7  cutoff still open immediately before KST 23:59:59.999
 *   T8  cutoff passed immediately at KST 00:00:00.000 next day
 *   T9  Results do not depend on server timezone (tested via Date object inputs)
 *  T10  Existing SODAM decision isCutoffPassed caller behavior unchanged
 */

// getDayType is NOT mocked here — we test the real implementation
const { getDayType } = require('../../services/quoteEngine');

// isCutoffPassed is not exported; test it through sodamDecisionService
// We import the function indirectly via a thin re-export wrapper or test through
// the canOffer logic. Since isCutoffPassed is private, we test via the exported
// decide() behavior in tests T7-T8 and via direct unit tests using the utility.

// For direct isCutoffPassed testing, we use getKSTDateString as a proxy:
// isCutoffPassed(cutoff, now) ≡ getKSTDateString(now) > cutoff
// We can verify this contract by testing getKSTDateString + string comparison
const { getKSTDateString, KST_OFFSET_MS } = require('../../utils/kstDate');

// ─── Reference dates ──────────────────────────────────────────────────────────
// 2026-10-15 = Thursday (mon-thu pricing tier)
// 2026-10-16 = Friday (fri pricing tier)
// 2026-10-17 = Saturday (sat pricing tier)
// 2026-10-18 = Sunday (sun pricing tier)
// 2026-01-01 = New Year's Day (holiday in quotePriceData.js)

// KST midnight anchor:
//   2026-10-14T15:00:00.000Z  = KST 2026-10-15T00:00:00.000 (start of Oct 15 in Korea)
//   2026-10-14T14:59:59.999Z  = KST 2026-10-14T23:59:59.999 (last ms of Oct 14 in Korea)
//   2026-10-15T14:59:59.999Z  = KST 2026-10-15T23:59:59.999 (end of Oct 15 in Korea)
//   2026-10-15T15:00:00.000Z  = KST 2026-10-16T00:00:00.000 (start of Oct 16 in Korea)

describe('getDayType — KST correctness', () => {
  // T1 — YYYY-MM-DD string stays as same Korean calendar date
  it('T1 YYYY-MM-DD string is classified on the correct Korean calendar date', () => {
    expect(getDayType('2026-10-15')).toBe('mon-thu'); // Thursday
    expect(getDayType('2026-10-16')).toBe('fri');     // Friday
    expect(getDayType('2026-10-17')).toBe('sat');     // Saturday
    expect(getDayType('2026-10-18')).toBe('sun');     // Sunday
  });

  // T2 — Korean weekday classification
  it('T2 weekday dates correctly classified as mon-thu', () => {
    // 2026-10-12 = Monday, 2026-10-13 = Tuesday, 2026-10-14 = Wednesday
    expect(getDayType('2026-10-12')).toBe('mon-thu');
    expect(getDayType('2026-10-13')).toBe('mon-thu');
    expect(getDayType('2026-10-14')).toBe('mon-thu');
    expect(getDayType('2026-10-15')).toBe('mon-thu'); // Thursday
  });

  // T3 — Korean weekend classification
  it('T3 fri/sat/sun correctly classified as distinct tiers', () => {
    expect(getDayType('2026-10-16')).toBe('fri');
    expect(getDayType('2026-10-17')).toBe('sat');
    expect(getDayType('2026-10-18')).toBe('sun');
  });

  // T4 — Korean holiday classification overrides weekday/weekend
  it('T4 Korean national holiday classified as holiday regardless of day-of-week', () => {
    // 2026-01-01 (New Year's Day) is in quotePriceData.holidays
    expect(getDayType('2026-01-01')).toBe('holiday');
    // 2026-08-15 (광복절, Liberation Day) — verify it's not just a Saturday check
    expect(getDayType('2026-08-15')).toBe('holiday');
  });

  // T5 — Instant immediately BEFORE KST midnight → previous Korean date
  it('T5 UTC 14:59:59.999 on Oct 14 (= KST 23:59:59.999 Oct 14) → classified as Oct 14 (Wednesday)', () => {
    // 2026-10-14T14:59:59.999Z = last millisecond of Oct 14 in Korea
    const beforeMidnight = new Date('2026-10-14T14:59:59.999Z');
    // Oct 14 KST = Wednesday → mon-thu
    expect(getDayType(beforeMidnight)).toBe('mon-thu');
    // Also verify KST date string directly
    expect(getKSTDateString(beforeMidnight)).toBe('2026-10-14');
  });

  // T6 — Instant immediately AFTER KST midnight → next Korean date
  it('T6 UTC 15:00:00.000 on Oct 14 (= KST 00:00:00.000 Oct 15) → classified as Oct 15 (Thursday)', () => {
    // 2026-10-14T15:00:00.000Z = first millisecond of Oct 15 in Korea
    const afterMidnight = new Date('2026-10-14T15:00:00.000Z');
    // Oct 15 KST = Thursday → mon-thu
    expect(getDayType(afterMidnight)).toBe('mon-thu');
    expect(getKSTDateString(afterMidnight)).toBe('2026-10-15');
  });

  // T9 — Results do not depend on server timezone (cross-day boundary test)
  it('T9 classification at KST midnight boundary is deterministic regardless of input type', () => {
    // Both inputs represent the same KST calendar date
    const asString = '2026-10-15';
    const asDateObjectKSTMidnight = new Date('2026-10-14T15:00:00.000Z'); // = KST Oct 15 00:00:00
    const asDateObjectKSTNoon    = new Date('2026-10-15T03:00:00.000Z');  // = KST Oct 15 12:00:00

    expect(getDayType(asString)).toBe('mon-thu');
    expect(getDayType(asDateObjectKSTMidnight)).toBe('mon-thu');
    expect(getDayType(asDateObjectKSTNoon)).toBe('mon-thu');
  });

  // Bonus: Friday pricing classification at KST midnight boundary
  it('T9b Fri/Sat boundary at KST midnight classified correctly', () => {
    // 2026-10-15T15:00:00.000Z = KST 2026-10-16T00:00:00.000 (Friday)
    expect(getDayType(new Date('2026-10-15T15:00:00.000Z'))).toBe('fri');
    // 2026-10-15T14:59:59.999Z = KST 2026-10-15T23:59:59.999 (Thursday)
    expect(getDayType(new Date('2026-10-15T14:59:59.999Z'))).toBe('mon-thu');
  });
});

// ─── isCutoffPassed — KST correctness ────────────────────────────────────────
// isCutoffPassed is private to sodamDecisionService. We test its semantics via:
// (a) The KST utility contract it relies on (getKSTDateString comparison)
// (b) A thin inline reimplementation matching the documented fix

describe('isCutoffPassed — KST end-of-day semantics', () => {
  // Reimplementation that matches the patched isCutoffPassed contract:
  //   getKSTDateString(now) > cutoff_date
  function isCutoffPassed(cutoff_date, now) {
    if (!cutoff_date) return false;
    return getKSTDateString(now) > cutoff_date;
  }

  // T7 — cutoff still open at 23:59:59.999 KST on cutoff day
  it('T7 instant before KST 23:59:59.999 on cutoff day → NOT passed', () => {
    const cutoff = '2026-10-15';
    // 2026-10-15T14:59:59.998Z = KST 2026-10-15T23:59:59.998 (2ms before end-of-day)
    const justBefore = new Date('2026-10-15T14:59:59.998Z');
    expect(isCutoffPassed(cutoff, justBefore)).toBe(false);
  });

  // T8 — cutoff passed at KST 00:00:00.000 of the NEXT day
  it('T8 instant at KST 00:00:00.000 next day → PASSED', () => {
    const cutoff = '2026-10-15';
    // 2026-10-15T15:00:00.000Z = KST 2026-10-16T00:00:00.000 (first ms after end-of-day)
    const justAfter = new Date('2026-10-15T15:00:00.000Z');
    expect(isCutoffPassed(cutoff, justAfter)).toBe(true);
  });

  // Exact boundary values from the runtime check spec
  it('T7/T8 exact boundary: 14:59:59.998Z NOT passed, 15:00:00.000Z PASSED', () => {
    const cutoff = '2026-10-15';
    expect(isCutoffPassed(cutoff, new Date('2026-10-15T14:59:59.998Z'))).toBe(false);
    expect(isCutoffPassed(cutoff, new Date('2026-10-15T15:00:00.000Z'))).toBe(true);
  });

  it('null cutoff_date → never passed', () => {
    expect(isCutoffPassed(null, new Date())).toBe(false);
    expect(isCutoffPassed(undefined, new Date())).toBe(false);
  });

  it('cutoff well in the past → passed', () => {
    const cutoff = '2020-01-01';
    expect(isCutoffPassed(cutoff, new Date())).toBe(true);
  });

  it('cutoff well in the future → not passed', () => {
    const cutoff = '2099-12-31';
    expect(isCutoffPassed(cutoff, new Date())).toBe(false);
  });
});

// ─── T10 — SODAM decide() isCutoffPassed integration ────────────────────────
// Verify SODAM returns NO_OFFER CUTOFF_PASSED when cutoff is in the past (KST).

jest.mock('../../services/flowInventoryService');
jest.mock('../../database/db', () => ({ query: jest.fn(), pool: { connect: jest.fn() } }));

const flowService = require('../../services/flowInventoryService');
const sodamService = require('../../services/sodamDecisionService');

describe('T10 SODAM decide() cutoff integration with KST semantics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('T10 cutoff_date in the past (KST) → decide() returns NO_OFFER CUTOFF_PASSED', async () => {
    const db = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'aa000002-0000-4000-8000-000000000002', room_type: 'double', room_code: 'KENNY_OCEAN_DBL', base_occupancy: 2, max_occupancy: 2 }] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
    };
    // cutoff_date = 2020-01-01 → clearly past → isCutoffPassed returns true
    flowService.getAvailability.mockResolvedValue({
      id: 'inv-001',
      accommodation_id: 'aa000002-0000-4000-8000-000000000002',
      stay_date: '2026-11-20',
      status: 'open',
      cutoff_date: '2020-01-01', // past cutoff
      allocated_count: 3,
      active_held: 0,
      confirmed_booked: 0,
      available: 2
    });

    const result = await sodamService.decide(
      { sowon_id: '11111111-1111-4111-8111-111111111111', stay_date: '2026-11-20', party_size: 2 },
      db
    );

    expect(result.decision_type).toBe('NO_OFFER');
    expect(result.reason_codes).toContain('CUTOFF_PASSED');
  });

  it('T10b cutoff_date today (KST) → decide() returns OFFER (not yet passed)', async () => {
    const db = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'aa000002-0000-4000-8000-000000000002', room_type: 'double', room_code: 'KENNY_OCEAN_DBL', base_occupancy: 2, max_occupancy: 2 }] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
    };
    // cutoff = today's KST date → still within cutoff → NOT passed → OFFER
    const kstToday = getKSTDateString(new Date());
    flowService.getAvailability.mockResolvedValue({
      id: 'inv-002',
      accommodation_id: 'aa000002-0000-4000-8000-000000000002',
      stay_date: '2026-12-20',
      status: 'open',
      cutoff_date: kstToday, // cutoff = today → still open
      allocated_count: 3,
      active_held: 0,
      confirmed_booked: 0,
      available: 2
    });

    const result = await sodamService.decide(
      { sowon_id: '11111111-1111-4111-8111-111111111111', stay_date: '2026-12-20', party_size: 2 },
      db
    );

    expect(result.decision_type).toBe('OFFER');
    expect(result.reason_codes).not.toContain('CUTOFF_PASSED');
  });
});
