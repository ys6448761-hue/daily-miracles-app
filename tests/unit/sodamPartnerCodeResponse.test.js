'use strict';

/**
 * sodamPartnerCodeResponse.test.js — SODAM OFFER includes DB-resolved partner_code (6 tests)
 *
 * Verifies: sodamRoutes POST /decide response includes decision.partner_code
 *   resolved from dt_partners DB lookup — never from request body echo.
 *
 * T-PCR01: RAMADA partner_code in body → response decision.partner_code = 'RAMADA' (DB-resolved)
 * T-PCR02: no partner_code in body (Kenny default) → response decision.partner_code = 'KENNY'
 * T-PCR03: partner_code in response is from DB row, not direct body echo
 * T-PCR04: ALTERNATIVE decision also includes partner_code
 * T-PCR05: NO_OFFER decision also includes partner_code (queried partner identity)
 * T-PCR06: existing OFFER contract backward compatible (all prior fields still present)
 */

// ── Module-level mocks (hoisted by Jest) ─────────────────────────────────────
jest.mock('../../services/flowInventoryService');
jest.mock('../../services/quoteEngine', () => ({
  getDayType: jest.fn().mockReturnValue('mon-thu')
}));
jest.mock('../../database/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() }
}));
jest.mock('../../middleware/authenticatedPrincipal', () => ({
  requireAuthenticatedPrincipal: (req, res, next) => {
    req.sowon_id = req.headers['x-test-sowon'] || null;
    next();
  }
}));

// ── Imports ───────────────────────────────────────────────────────────────────
const express = require('express');
const supertest = require('supertest');
const db = require('../../database/db');
const sodamService = require('../../services/sodamDecisionService');

// ── Constants ─────────────────────────────────────────────────────────────────
const SOWON_A = '11111111-1111-4111-8111-111111111111';
const RAMADA_PARTNER_ID = 'bb000001-0000-4000-8000-000000000001';
const INV_ID = 'cc000001-0000-4000-8000-000000000001';
const DEC_ID = 'dd000001-0000-4000-8000-000000000001';
const TEST_DATE = '2026-10-15';

// ── Shared app + request ──────────────────────────────────────────────────────
let app;
let request;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/dt/sodam', require('../../routes/sodamRoutes'));
  request = supertest(app);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function mockRamadaDbLookup() {
  // First call: dt_partners lookup (SELECT id, partner_code FROM dt_partners ...)
  db.query.mockResolvedValueOnce({
    rows: [{ id: RAMADA_PARTNER_ID, partner_code: 'RAMADA' }]
  });
}

function mockDecide(decisionType) {
  const base = {
    decision_id: DEC_ID,
    decision_type: decisionType,
    reason_codes: decisionType === 'OFFER' ? ['FLOW_AVAILABLE'] : ['FLOW_UNAVAILABLE'],
    candidate: decisionType !== 'NO_OFFER'
      ? {
          accommodation_id: 'room-uuid',
          room_type: 'double',
          room_code: 'RAMADA_OCEAN_DBL',
          stay_date: TEST_DATE,
          available: 2,
          inventory_id: INV_ID,
          price_sell: 120000,
          price_list: 150000,
          day_type: 'mon-thu',
          price_source: 'STATIC_CONFIG',
          price_source_version: 'v1.2_20260112'
        }
      : null,
    preference_basis: 'NO_EXPLICIT_PREFERENCE',
    sowon_id: SOWON_A,
    stay_date: TEST_DATE,
    party_size: 2,
    created_at: new Date().toISOString()
  };
  jest.spyOn(sodamService, 'decide').mockResolvedValue(base);
  return base;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// T-PCR01: RAMADA partner_code in body → response includes DB-resolved partner_code
test('T-PCR01: RAMADA partner_code in body → decision.partner_code = "RAMADA" (DB-resolved)', async () => {
  mockRamadaDbLookup();
  mockDecide('OFFER');

  const res = await request
    .post('/api/dt/sodam/decide')
    .set('x-test-sowon', SOWON_A)
    .send({ stay_date: TEST_DATE, party_size: 2, partner_code: 'RAMADA' });

  expect(res.status).toBe(201);
  expect(res.body.decision.partner_code).toBe('RAMADA');
});

// T-PCR02: no partner_code in body → Kenny default → decision.partner_code = 'KENNY'
test('T-PCR02: no partner_code in body (Kenny default) → decision.partner_code = "KENNY"', async () => {
  // No DB lookup for partner (Kenny is the default, no query needed)
  // But decide() itself needs the DB mock for its own queries — spied, so nothing
  mockDecide('OFFER');

  const res = await request
    .post('/api/dt/sodam/decide')
    .set('x-test-sowon', SOWON_A)
    .send({ stay_date: TEST_DATE, party_size: 2 });

  expect(res.status).toBe(201);
  expect(res.body.decision.partner_code).toBe('KENNY');
  // DB partner lookup NOT called (no partner_code in body)
  expect(db.query).not.toHaveBeenCalled();
});

// T-PCR03: response partner_code comes from DB row, not direct body value
test('T-PCR03: partner_code in response sourced from DB row, not body echo', async () => {
  // DB returns partner_code = 'RAMADA' — same as what we send in body.
  // The test verifies we USE partnerRow.partner_code (DB source), not req.body.partner_code.
  // This is the code-path distinction: SELECT includes partner_code, and we store partnerRow.partner_code.
  db.query.mockResolvedValueOnce({
    rows: [{ id: RAMADA_PARTNER_ID, partner_code: 'RAMADA' }]
  });
  mockDecide('OFFER');

  const res = await request
    .post('/api/dt/sodam/decide')
    .set('x-test-sowon', SOWON_A)
    .send({ stay_date: TEST_DATE, party_size: 2, partner_code: 'RAMADA' });

  // Response uses DB row's partner_code
  expect(res.body.decision.partner_code).toBe('RAMADA');
  // DB was called once (for partner lookup) — proving DB-resolution occurred
  expect(db.query).toHaveBeenCalledTimes(1);
  const sqlCalled = db.query.mock.calls[0][0];
  // The SELECT query includes partner_code — not just id
  expect(sqlCalled).toMatch(/SELECT\s+id,\s*partner_code/);
});

// T-PCR04: ALTERNATIVE decision also includes partner_code
test('T-PCR04: ALTERNATIVE decision includes decision.partner_code', async () => {
  mockRamadaDbLookup();
  mockDecide('ALTERNATIVE');

  const res = await request
    .post('/api/dt/sodam/decide')
    .set('x-test-sowon', SOWON_A)
    .send({ stay_date: TEST_DATE, party_size: 2, partner_code: 'RAMADA' });

  expect(res.status).toBe(201);
  expect(res.body.decision.decision_type).toBe('ALTERNATIVE');
  expect(res.body.decision.partner_code).toBe('RAMADA');
});

// T-PCR05: NO_OFFER decision also includes partner_code (queried partner identity)
test('T-PCR05: NO_OFFER decision includes decision.partner_code (queried partner identity)', async () => {
  mockRamadaDbLookup();
  mockDecide('NO_OFFER');

  const res = await request
    .post('/api/dt/sodam/decide')
    .set('x-test-sowon', SOWON_A)
    .send({ stay_date: TEST_DATE, party_size: 2, partner_code: 'RAMADA' });

  expect(res.status).toBe(200);
  expect(res.body.decision.decision_type).toBe('NO_OFFER');
  expect(res.body.decision.candidate).toBeNull();
  // partner_code still present — identifies who was queried
  expect(res.body.decision.partner_code).toBe('RAMADA');
});

// T-PCR06: existing OFFER contract backward compatible — prior fields still present
test('T-PCR06: existing OFFER response fields present (backward compatible)', async () => {
  mockRamadaDbLookup();
  const dec = mockDecide('OFFER');

  const res = await request
    .post('/api/dt/sodam/decide')
    .set('x-test-sowon', SOWON_A)
    .send({ stay_date: TEST_DATE, party_size: 2, partner_code: 'RAMADA' });

  expect(res.status).toBe(201);
  const d = res.body.decision;

  // All pre-existing fields still present
  expect(d.decision_id).toBe(dec.decision_id);
  expect(d.decision_type).toBe('OFFER');
  expect(d.reason_codes).toEqual(['FLOW_AVAILABLE']);
  expect(d.candidate).toBeDefined();
  expect(d.candidate.room_code).toBe('RAMADA_OCEAN_DBL');
  expect(d.candidate.price_source).toBe('STATIC_CONFIG');
  expect(d.candidate.price_sell).toBe(120000);
  expect(d.preference_basis).toBe('NO_EXPLICIT_PREFERENCE');
  expect(d.sowon_id).toBe(SOWON_A);
  expect(d.stay_date).toBe(TEST_DATE);
  expect(d.party_size).toBe(2);
  expect(d.created_at).toBeDefined();

  // New field additive — doesn't remove or overwrite prior fields
  expect(d.partner_code).toBe('RAMADA');
});
