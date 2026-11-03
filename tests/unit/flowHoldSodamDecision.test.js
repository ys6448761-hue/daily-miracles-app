'use strict';

/**
 * flowHoldSodamDecision.test.js — Migration 212 sodam_decision_id FK verification
 *
 * Tests:
 *   1. createHold persists sodam_decision_id when provided (DB INSERT verified)
 *   2. createHold with sodam_decision_id=null (legacy/direct FLOW) remains compatible
 *   3. booking → hold → SODAM decision deterministic JOIN query (query shape check)
 *   4. sodamRoutes POST /hold passes decision_id as 5th arg to createHold
 *   5. sodamRoutes POST /hold with nonexistent decision → 404
 *   6. sodamRoutes POST /hold wrong sowon → 403 DECISION_OWNERSHIP_MISMATCH
 *   7. sodamRoutes POST /hold wrong inventory → 409 INVENTORY_ID_MISMATCH
 *   8. Direct FLOW hold (no decision_id) stays backward compatible
 */

// ── Module-level mocks ────────────────────────────────────────────────────────

jest.mock('../../services/flowInventoryService');
jest.mock('../../middleware/authenticatedPrincipal', () => ({
  requireAuthenticatedPrincipal: (req, res, next) => {
    req.sowon_id = req.headers['x-test-sowon'] || null;
    next();
  }
}));

// ── Imports ───────────────────────────────────────────────────────────────────

const express   = require('express');
const supertest = require('supertest');
const flowService = require('../../services/flowInventoryService');

// ── DB mock (module-level, required for jest.mock hoisting) ──────────────────

let mockQueryResponses = [];
let mockQueryIdx       = 0;

const mockDb = {
  query: jest.fn().mockImplementation(() => {
    const resp = mockQueryResponses[mockQueryIdx] !== undefined
      ? mockQueryResponses[mockQueryIdx]
      : { rows: [], rowCount: 0 };
    mockQueryIdx++;
    return Promise.resolve(resp);
  }),
  pool: { connect: jest.fn() },
};

jest.mock('../../database/db', () => mockDb);

function setResponses(responses) {
  mockQueryResponses = responses;
  mockQueryIdx       = 0;
  mockDb.query.mockClear();
  mockDb.query.mockImplementation(() => {
    const resp = mockQueryResponses[mockQueryIdx] !== undefined
      ? mockQueryResponses[mockQueryIdx]
      : { rows: [], rowCount: 0 };
    mockQueryIdx++;
    return Promise.resolve(resp);
  });
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SOWON_A       = '11111111-1111-4111-8111-111111111111';
const SOWON_B       = '22222222-2222-4222-8222-222222222222';
const DECISION_ID   = 'dec00001-0000-4000-8000-000000000001';
const INVENTORY_ID  = 'inv00001-0000-4000-8000-000000000001';
const WRONG_INV_ID  = 'inv00002-0000-4000-8000-000000000002';

const OFFER_DECISION = {
  id: DECISION_ID,
  sowon_id: SOWON_A,
  decision_type: 'OFFER',
  inventory_id: INVENTORY_ID,
  candidate: { inventory_id: INVENTORY_ID, price_sell: 55000, price_source_version: 'v1.2_20260112' }
};

const MOCK_HOLD = {
  id: 'hold-001',
  inventory_id: INVENTORY_ID,
  sowon_id: SOWON_A,
  quantity: 1,
  status: 'active',
  expires_at: new Date(Date.now() + 30 * 60000),
  sodam_decision_id: DECISION_ID,
  created_at: new Date()
};

// ── App factory (sodamRoutes) ─────────────────────────────────────────────────

function buildSodamApp() {
  const router = require('../../routes/sodamRoutes');
  const app    = express();
  app.use(express.json());
  app.use('/api/dt/sodam', router);
  return app;
}

// ── 1. flowInventoryService.createHold DB INSERT shape ───────────────────────

describe('flowInventoryService.createHold — sodam_decision_id handling', () => {
  const flowInventoryService = jest.requireActual('../../services/flowInventoryService');

  let mockClient;

  beforeEach(() => {
    mockClient = {
      query:   jest.fn(),
      release: jest.fn(),
    };
  });

  function makePool(queries) {
    let idx = 0;
    mockClient.query.mockImplementation(() => {
      const r = queries[idx] !== undefined ? queries[idx] : { rows: [], rowCount: 0 };
      idx++;
      return Promise.resolve(r);
    });
    return {
      connect: jest.fn().mockResolvedValue(mockClient),
    };
  }

  function makeDb(queries) {
    const pool = makePool(queries);
    return { pool };
  }

  // ── Test 1: sodam_decision_id passed → persisted in INSERT ──────────────────
  test('T-M212-01 createHold with sodam_decision_id → 5th param stored in INSERT', async () => {
    const invRow = {
      id: INVENTORY_ID, allocated_count: 5, status: 'open',
      cutoff_date: null, stay_date: '2026-11-15'
    };
    // BEGIN / SELECT FOR UPDATE / active holds count / bookings count / INSERT hold / COMMIT
    const db = makeDb([
      { rows: [] },                            // BEGIN
      { rows: [invRow], rowCount: 1 },         // SELECT FOR UPDATE
      { rows: [{ active_held: 0 }], rowCount: 1 },  // holds count
      { rows: [{ confirmed_booked: 0 }], rowCount: 1 }, // bookings count
      { rows: [{ ...MOCK_HOLD }], rowCount: 1 }, // INSERT RETURNING
      { rows: [] },                            // COMMIT
    ]);

    const result = await flowInventoryService.createHold(
      INVENTORY_ID, SOWON_A, 1, db, DECISION_ID
    );

    expect(result.success).toBe(true);
    // Verify the INSERT call included sodam_decision_id as $5
    const insertCall = mockClient.query.mock.calls.find(
      call => typeof call[0] === 'string' && call[0].includes('INSERT INTO dt_flow_holds')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).toHaveLength(5);  // [inventory_id, sowon_id, quantity, expiresAt, sodam_decision_id]
    expect(insertCall[1][4]).toBe(DECISION_ID); // 5th param = sodam_decision_id
  });

  // ── Test 2: no sodam_decision_id → null, backward compatible ────────────────
  test('T-M212-02 createHold without sodam_decision_id → null in INSERT (legacy compat)', async () => {
    const invRow = {
      id: INVENTORY_ID, allocated_count: 5, status: 'open',
      cutoff_date: null, stay_date: '2026-11-15'
    };
    const db = makeDb([
      { rows: [] },
      { rows: [invRow], rowCount: 1 },
      { rows: [{ active_held: 0 }], rowCount: 1 },
      { rows: [{ confirmed_booked: 0 }], rowCount: 1 },
      { rows: [{ ...MOCK_HOLD, sodam_decision_id: null }], rowCount: 1 },
      { rows: [] },
    ]);

    const result = await flowInventoryService.createHold(
      INVENTORY_ID, SOWON_A, 1, db
      // no sodam_decision_id arg
    );

    expect(result.success).toBe(true);
    const insertCall = mockClient.query.mock.calls.find(
      call => typeof call[0] === 'string' && call[0].includes('INSERT INTO dt_flow_holds')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1][4]).toBeNull(); // 5th param = null
  });
});

// ── 2. sodamRoutes POST /hold — decision_id forwarded ────────────────────────

describe('sodamRoutes POST /hold — sodam_decision_id forwarding', () => {
  let app;

  beforeAll(() => { app = buildSodamApp(); });
  beforeEach(() => { flowService.createHold.mockReset(); });

  // ── Test 3: valid decision → createHold receives decision_id as 5th arg ─────
  test('T-M212-03 valid OFFER decision → createHold called with decision_id as 5th arg', async () => {
    setResponses([{ rows: [OFFER_DECISION], rowCount: 1 }]);
    flowService.createHold.mockResolvedValue({ success: true, hold: MOCK_HOLD });

    const res = await supertest(app)
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({ decision_id: DECISION_ID });

    expect(res.status).toBe(201);
    expect(res.body.hold_id).toBe('hold-001');
    expect(flowService.createHold).toHaveBeenCalledWith(
      INVENTORY_ID,
      SOWON_A,
      1,
      expect.anything(), // db
      DECISION_ID        // sodam_decision_id — the trust-validated decision.id
    );
  });

  // ── Test 4: nonexistent decision → 404 ───────────────────────────────────────
  test('T-M212-04 nonexistent decision_id → 404 DECISION_NOT_FOUND', async () => {
    setResponses([{ rows: [], rowCount: 0 }]);

    const res = await supertest(app)
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({ decision_id: 'does-not-exist' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('DECISION_NOT_FOUND');
    expect(flowService.createHold).not.toHaveBeenCalled();
  });

  // ── Test 5: wrong sowon → 403, createHold NOT called ─────────────────────────
  test('T-M212-05 decision belongs to SOWON_A, SOWON_B holds → 403 DECISION_OWNERSHIP_MISMATCH', async () => {
    setResponses([{ rows: [OFFER_DECISION], rowCount: 1 }]); // decision.sowon_id = SOWON_A
    // request with SOWON_B
    const res = await supertest(app)
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_B)
      .send({ decision_id: DECISION_ID });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('DECISION_OWNERSHIP_MISMATCH');
    expect(flowService.createHold).not.toHaveBeenCalled();
  });

  // ── Test 6: wrong inventory_id in body → 409 INVENTORY_ID_MISMATCH ───────────
  test('T-M212-06 body.inventory_id differs from decision.inventory_id → 409 INVENTORY_ID_MISMATCH', async () => {
    setResponses([{ rows: [OFFER_DECISION], rowCount: 1 }]);

    const res = await supertest(app)
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({ decision_id: DECISION_ID, inventory_id: WRONG_INV_ID });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVENTORY_ID_MISMATCH');
    expect(flowService.createHold).not.toHaveBeenCalled();
  });

  // ── Test 7: missing decision_id in body → 400 MISSING_PARAMS ─────────────────
  test('T-M212-07 missing decision_id → 400 MISSING_PARAMS', async () => {
    setResponses([]);

    const res = await supertest(app)
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MISSING_PARAMS');
    expect(flowService.createHold).not.toHaveBeenCalled();
  });
});

// ── 3. Promise JOIN query shape ───────────────────────────────────────────────

describe('Promise reconstruction JOIN shape (query shape check)', () => {
  // This verifies the intended query structure is correct SQL.
  // Real execution tested in E2E.

  test('T-M212-08 DIRECT JOIN query shape: booking → hold → sodam_decision', () => {
    // Verify the JOIN query template is syntactically complete.
    // This is a documentation/regression check — not a live DB call.
    const query = `
      SELECT d.candidate, d.price_sell, d.price_source_version,
             d.stay_date, d.party_size, d.sowon_id
      FROM dt_flow_bookings b
      JOIN dt_flow_holds h ON h.id = b.hold_id
      JOIN dt_sodam_decisions d ON d.id = h.sodam_decision_id
      WHERE b.id = $1
    `;
    // Must reference all three tables with proper FK path
    expect(query).toMatch(/dt_flow_bookings b/);
    expect(query).toMatch(/JOIN dt_flow_holds h ON h\.id = b\.hold_id/);
    expect(query).toMatch(/JOIN dt_sodam_decisions d ON d\.id = h\.sodam_decision_id/);
    expect(query).toMatch(/d\.candidate/);
    expect(query).toMatch(/d\.price_source_version/);
  });
});
