'use strict';

/**
 * flowKstCutoff.test.js — 4F-B FLOW cutoff KST correctness
 *
 * Tests that createHold() uses Korea-calendar-date semantics for cutoff,
 * not server-local time. Mirrors the STEP 4D fix applied to sodamDecisionService.
 *
 * KST anchor for tests (cutoff_date = '2026-10-15'):
 *   2026-10-15T14:59:59.998Z  = KST 2026-10-15T23:59:59.998  → hold ALLOWED
 *   2026-10-15T15:00:00.000Z  = KST 2026-10-16T00:00:00.000  → CUTOFF_PASSED
 *
 * Tests:
 *   T1  Immediately before KST midnight on cutoff day → hold ALLOWED
 *   T2  Immediately after KST midnight (next Korean date) → CUTOFF_PASSED
 *   T3  Server timezone must not determine result (UTC mock clock used)
 *   T4  null cutoff_date → hold ALLOWED (no cutoff)
 *   T5  cutoff_date well in the past (KST) → CUTOFF_PASSED
 */

const { getKSTDateString } = require('../../utils/kstDate');

// We test createHold indirectly by injecting a mock db pool client
// and controlling the inv.cutoff_date + current time via Date mock.

// Build a mock db that simulates the pool.connect() → client pattern
function makeFlowDb({ cutoff_date, status = 'open', allocated = 2, held = 0, booked = 0 }) {
  const client = {
    query: jest.fn(),
    release: jest.fn(),
  };

  client.query
    // BEGIN
    .mockResolvedValueOnce({})
    // SELECT FOR UPDATE (inventory row)
    .mockResolvedValueOnce({
      rows: [{
        id: 'inv-001',
        allocated_count: allocated,
        status,
        cutoff_date,
        stay_date: '2026-10-20',
      }],
    })
    // Active holds count
    .mockResolvedValueOnce({ rows: [{ active_held: held }] })
    // Confirmed bookings count
    .mockResolvedValueOnce({ rows: [{ confirmed_booked: booked }] })
    // INSERT hold
    .mockResolvedValueOnce({
      rows: [{
        id: 'hold-001',
        inventory_id: 'inv-001',
        sowon_id: 'sw-001',
        quantity: 1,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 60 * 1000),
        created_at: new Date(),
      }],
    })
    // COMMIT
    .mockResolvedValueOnce({});

  // ROLLBACK path (used when cutoff fails, etc.)
  client.query.mockResolvedValue({});

  return {
    pool: {
      connect: jest.fn().mockResolvedValue(client),
    },
    _client: client,
  };
}

// Re-require flowInventoryService fresh each test to avoid module-level Date capture
let flowService;
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  flowService = require('../../services/flowInventoryService');
});

afterEach(() => {
  jest.useRealTimers();
});

// T1 — Immediately before KST midnight on cutoff day → ALLOWED
it('T1 UTC 14:59:59.998 on cutoff date = KST 23:59:59.998 → hold ALLOWED', async () => {
  // Freeze clock to 2026-10-15T14:59:59.998Z (= KST 2026-10-15T23:59:59.998 — still cutoff day)
  jest.useFakeTimers({ now: new Date('2026-10-15T14:59:59.998Z').getTime() });

  const db = makeFlowDb({ cutoff_date: '2026-10-15' });
  const result = await flowService.createHold('inv-001', 'sw-001', 1, db);

  expect(result.success).toBe(true);
  expect(result.reason).toBeUndefined();

  // Confirm KST date is still the cutoff date (not past it)
  expect(getKSTDateString(new Date())).toBe('2026-10-15');
});

// T2 — Immediately after KST midnight → CUTOFF_PASSED
it('T2 UTC 15:00:00.000 on cutoff date = KST next day 00:00:00.000 → CUTOFF_PASSED', async () => {
  // Freeze clock to 2026-10-15T15:00:00.000Z (= KST 2026-10-16T00:00:00.000 — past cutoff)
  jest.useFakeTimers({ now: new Date('2026-10-15T15:00:00.000Z').getTime() });

  const db = makeFlowDb({ cutoff_date: '2026-10-15' });
  const result = await flowService.createHold('inv-001', 'sw-001', 1, db);

  expect(result.success).toBe(false);
  expect(result.reason).toBe('CUTOFF_PASSED');

  // Confirm KST date has crossed to next day
  expect(getKSTDateString(new Date())).toBe('2026-10-16');
});

// T3 — Server timezone agnostic: result is determined by KST date string comparison
it('T3 exact boundary values deterministic regardless of server-local timezone', async () => {
  // 2ms before KST midnight → allowed
  jest.useFakeTimers({ now: new Date('2026-10-15T14:59:59.998Z').getTime() });
  const db1 = makeFlowDb({ cutoff_date: '2026-10-15' });
  const r1 = await flowService.createHold('inv-001', 'sw-001', 1, db1);
  expect(r1.success).toBe(true);

  // Reset to exactly KST midnight → cutoff passed
  jest.useFakeTimers({ now: new Date('2026-10-15T15:00:00.000Z').getTime() });
  jest.resetModules();
  flowService = require('../../services/flowInventoryService');
  const db2 = makeFlowDb({ cutoff_date: '2026-10-15' });
  const r2 = await flowService.createHold('inv-001', 'sw-001', 1, db2);
  expect(r2.success).toBe(false);
  expect(r2.reason).toBe('CUTOFF_PASSED');
});

// T4 — null cutoff_date → hold always allowed (no cutoff restriction)
it('T4 null cutoff_date → hold ALLOWED', async () => {
  jest.useFakeTimers({ now: new Date('2026-10-15T15:00:00.000Z').getTime() });

  const db = makeFlowDb({ cutoff_date: null });
  const result = await flowService.createHold('inv-001', 'sw-001', 1, db);

  expect(result.success).toBe(true);
});

// T5 — cutoff_date well in the past → CUTOFF_PASSED
it('T5 cutoff_date in the past → CUTOFF_PASSED', async () => {
  // Real time (2026-09-17); cutoff was 2020-01-01
  const db = makeFlowDb({ cutoff_date: '2020-01-01' });
  const result = await flowService.createHold('inv-001', 'sw-001', 1, db);

  expect(result.success).toBe(false);
  expect(result.reason).toBe('CUTOFF_PASSED');
});
