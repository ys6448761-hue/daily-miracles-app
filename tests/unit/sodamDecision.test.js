'use strict';

/**
 * sodamDecision.test.js — SODAM Decision Service + Routes (20 tests)
 *
 * Service tests (T01–T14, T20): call sodamDecisionService.decide() directly
 *   with injected local db mock — independent of the db module mock.
 *
 * Route tests (T13, T15–T19): mount sodamRoutes on a test express app and
 *   exercise via supertest; mock db module for decision lookup, mock flowService
 *   for createHold.
 */

// ── Module-level mocks (hoisted by Jest) ─────────────────────────────────────
jest.mock('../../services/flowInventoryService');
jest.mock('../../services/quoteEngine', () => ({
  getDayType: jest.fn()
}));
jest.mock('../../database/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() }
}));
jest.mock('../../middleware/authenticatedPrincipal', () => ({
  requireAuthenticatedPrincipal: (req, res, next) => {
    // Test header drives sowon_id — simulates verified JWT middleware
    req.sowon_id = req.headers['x-test-sowon'] || null;
    next();
  }
}));

// ── Imports ───────────────────────────────────────────────────────────────────
const express = require('express');
const supertest = require('supertest');
const flowService = require('../../services/flowInventoryService');
const { getDayType } = require('../../services/quoteEngine');
const db = require('../../database/db');
const sodamService = require('../../services/sodamDecisionService');

// ── Constants ─────────────────────────────────────────────────────────────────
const SOWON_A = '11111111-1111-4111-8111-111111111111';
const SOWON_B = '22222222-2222-4222-8222-222222222222';

const ROOM_DBL = {
  id: 'aa000002-0000-4000-8000-000000000002',
  room_type: 'double',
  room_code: 'KENNY_OCEAN_DBL',
  base_occupancy: 2,
  max_occupancy: 2
};
const ROOM_TWN = {
  id: 'aa000003-0000-4000-8000-000000000003',
  room_type: 'twin',
  room_code: 'KENNY_OCEAN_TWN',
  base_occupancy: 2,
  max_occupancy: 3
};
const INV_DBL_ID = 'bb000001-0000-4000-8000-000000000001';
const INV_TWN_ID = 'bb000002-0000-4000-8000-000000000002';
const DEC_OFFER_ID = 'cc000001-0000-4000-8000-000000000001';
const TEST_DATE = '2026-10-15'; // Thu → mon-thu

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeAvail(overrides = {}) {
  return {
    id: INV_DBL_ID,
    accommodation_id: ROOM_DBL.id,
    stay_date: TEST_DATE,
    status: 'open',
    cutoff_date: null,
    allocated_count: 3,
    active_held: 0,
    confirmed_booked: 0,
    available: 2,
    ...overrides
  };
}

/**
 * Creates a local db mock with sequential query responses.
 * NOT the module-level db mock — injected directly into decide().
 */
function makeLocalDb(responses = []) {
  let idx = 0;
  return {
    query: jest.fn().mockImplementation(() => {
      const resp = idx < responses.length ? responses[idx++] : { rows: [], rowCount: 1 };
      return Promise.resolve(resp);
    })
  };
}

// ── Test suite: service-level ─────────────────────────────────────────────────
describe('sodamDecisionService.decide()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDayType.mockReturnValue('mon-thu');
  });

  // T01 — available preferred room → OFFER
  it('T01 available preferred room → OFFER with USER_EXPLICIT basis', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL, ROOM_TWN] }, // accommodation query
      { rows: [], rowCount: 1 }        // INSERT dt_sodam_decisions
    ]);
    flowService.getAvailability.mockResolvedValue(makeAvail({ id: INV_DBL_ID }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: 'double' },
      localDb
    );

    expect(result.decision_type).toBe('OFFER');
    expect(result.candidate.accommodation_id).toBe(ROOM_DBL.id);
    expect(result.candidate.inventory_id).toBe(INV_DBL_ID);
    expect(result.preference_basis).toBe('USER_EXPLICIT');
    expect(result.candidate.price_source).toBe('STATIC_CONFIG');
    expect(result.candidate.price_source_version).toBe('v1.3_20260922');
    expect(typeof result.candidate.price_sell).toBe('number');
    expect(result.candidate.price_sell).toBeGreaterThan(0);
    expect(result.decision_id).toBeTruthy();
  });

  // T02 — preferred double unavailable + compatible twin available → ALTERNATIVE
  it('T02 preferred double unavailable, twin available → ALTERNATIVE', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL, ROOM_TWN] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability
      .mockResolvedValueOnce(makeAvail({ id: INV_DBL_ID, available: 0 }))
      .mockResolvedValueOnce(makeAvail({ id: INV_TWN_ID, accommodation_id: ROOM_TWN.id, available: 2 }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: 'double' },
      localDb
    );

    expect(result.decision_type).toBe('ALTERNATIVE');
    expect(result.candidate.room_type).toBe('twin');
    expect(result.candidate.inventory_id).toBe(INV_TWN_ID);
    expect(result.reason_codes).toContain('PREFERRED_UNAVAILABLE');
    expect(result.preference_basis).toBe('USER_EXPLICIT');
  });

  // T03 — all rooms unavailable (no preference) → NO_OFFER
  it('T03 all compatible rooms unavailable → NO_OFFER', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL, ROOM_TWN] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeAvail({ available: 0 }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: null },
      localDb
    );

    expect(result.decision_type).toBe('NO_OFFER');
    expect(result.candidate).toBeNull();
    // Both rooms should have been evaluated
    expect(flowService.getAvailability).toHaveBeenCalledTimes(2);
  });

  // T04 — no allocation row → NO_OFFER FLOW_ALLOCATION_ABSENT
  it('T04 getAvailability returns null → NO_OFFER FLOW_ALLOCATION_ABSENT', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(null);

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: null },
      localDb
    );

    expect(result.decision_type).toBe('NO_OFFER');
    expect(result.reason_codes).toContain('FLOW_ALLOCATION_ABSENT');
  });

  // T05 — inventory status closed → NO_OFFER INVENTORY_CLOSED
  it('T05 inventory status=closed → NO_OFFER INVENTORY_CLOSED', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeAvail({ status: 'closed', available: 3 }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: null },
      localDb
    );

    expect(result.decision_type).toBe('NO_OFFER');
    expect(result.reason_codes).toContain('INVENTORY_CLOSED');
  });

  // T06 — cutoff date passed → NO_OFFER CUTOFF_PASSED
  it('T06 cutoff_date in the past → NO_OFFER CUTOFF_PASSED', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(
      makeAvail({ cutoff_date: '2020-01-01', available: 3 })
    );

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: null },
      localDb
    );

    expect(result.decision_type).toBe('NO_OFFER');
    expect(result.reason_codes).toContain('CUTOFF_PASSED');
  });

  // T07 — missing stay_date → validation throw
  it('T07 missing stay_date → throws VALIDATION_ERROR field=stay_date', async () => {
    const localDb = makeLocalDb([]);
    await expect(
      sodamService.decide({ sowon_id: SOWON_A, stay_date: null, party_size: 2 }, localDb)
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', field: 'stay_date' });
    // db must not be called (validation is pre-DB)
    expect(localDb.query).not.toHaveBeenCalled();
  });

  // T08 — missing party_size → validation throw
  it('T08 missing party_size → throws VALIDATION_ERROR field=party_size', async () => {
    const localDb = makeLocalDb([]);
    await expect(
      sodamService.decide({ sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: null }, localDb)
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', field: 'party_size' });
    expect(localDb.query).not.toHaveBeenCalled();
  });

  // T09 — party_size=5, no compatible rooms → NO_OFFER INVALID_PARTY_SIZE
  it('T09 party_size=5 no compatible rooms → NO_OFFER INVALID_PARTY_SIZE', async () => {
    const localDb = makeLocalDb([
      { rows: [] },              // no rooms (max_occupancy < 5)
      { rows: [], rowCount: 1 }  // INSERT
    ]);

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 5 },
      localDb
    );

    expect(result.decision_type).toBe('NO_OFFER');
    expect(result.reason_codes).toContain('INVALID_PARTY_SIZE');
  });

  // T10 — unrecognized dayType → price lookup returns null → NO_OFFER PRICE_UNAVAILABLE
  it('T10 unknown dayType → lookupKennyPrice null → NO_OFFER PRICE_UNAVAILABLE', async () => {
    getDayType.mockReturnValue('unknown_day_type_xyz');
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeAvail({ available: 2 }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: null },
      localDb
    );

    expect(result.decision_type).toBe('NO_OFFER');
    expect(result.reason_codes).toContain('PRICE_UNAVAILABLE');
  });

  // T11 — null preferred_room_type → NO_EXPLICIT_PREFERENCE; still returns OFFER
  it('T11 null preferred_room_type → preference_basis NO_EXPLICIT_PREFERENCE', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL, ROOM_TWN] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeAvail({ available: 2 }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: null },
      localDb
    );

    expect(result.preference_basis).toBe('NO_EXPLICIT_PREFERENCE');
    expect(result.decision_type).toBe('OFFER');
    // First alphabetical room (KENNY_OCEAN_DBL) selected
    expect(result.candidate.room_code).toBe('KENNY_OCEAN_DBL');
  });

  // T12 — extra inferred context fields are ignored; cannot affect outcome
  it('T12 inferred context fields are silently ignored', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeAvail({ available: 2 }));

    const result = await sodamService.decide(
      {
        sowon_id: SOWON_A,
        stay_date: TEST_DATE,
        party_size: 2,
        // Inferred fields — must be ignored
        emotion_primary: 'excited',
        has_kids: true,
        people_type: 'family',
        time_available_minutes: 120
      },
      localDb
    );

    expect(result.decision_type).toBe('OFFER');
    // Response must not echo back inferred fields
    expect(result).not.toHaveProperty('emotion_primary');
    expect(result).not.toHaveProperty('has_kids');
    expect(result).not.toHaveProperty('people_type');
    expect(result).not.toHaveProperty('time_available_minutes');
  });

  // T14 — DB INSERT failure → decide() throws (fail closed — no unrecorded OFFER)
  it('T14 INSERT failure → decide() throws (fail closed)', async () => {
    const localDb = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [ROOM_DBL] })    // room query succeeds
        .mockRejectedValueOnce(new Error('DB connection lost')) // INSERT fails
    };
    flowService.getAvailability.mockResolvedValue(makeAvail({ available: 2 }));

    await expect(
      sodamService.decide(
        { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, preferred_room_type: null },
        localDb
      )
    ).rejects.toThrow('DB connection lost');
  });

  // T20 — price provenance fields present in OFFER candidate
  it('T20 OFFER candidate includes STATIC_CONFIG provenance and numeric price_sell', async () => {
    const localDb = makeLocalDb([
      { rows: [ROOM_DBL] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeAvail({ available: 2 }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2 },
      localDb
    );

    expect(result.candidate.price_source).toBe('STATIC_CONFIG');
    expect(result.candidate.price_source_version).toBe('v1.3_20260922');
    expect(typeof result.candidate.price_sell).toBe('number');
    expect(result.candidate.price_sell).toBeGreaterThan(0);
    expect(typeof result.candidate.price_list).toBe('number');
    expect(result.candidate.day_type).toBe('mon-thu');
  });
});

// ── Test suite: route-level ───────────────────────────────────────────────────
describe('sodamRoutes', () => {
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
    getDayType.mockReturnValue('mon-thu');
  });

  // T13 — body.sowon_id cannot override req.sowon_id
  it('T13 body.sowon_id is ignored; route uses req.sowon_id from middleware', async () => {
    const decideSpy = jest.spyOn(sodamService, 'decide').mockResolvedValue({
      decision_id: DEC_OFFER_ID,
      decision_type: 'OFFER',
      candidate: {
        accommodation_id: ROOM_DBL.id,
        inventory_id: INV_DBL_ID,
        price_sell: 50000,
        price_source: 'STATIC_CONFIG',
        price_source_version: 'v1.3_20260922'
      },
      preference_basis: 'USER_EXPLICIT',
      sowon_id: SOWON_A,
      stay_date: TEST_DATE,
      party_size: 2,
      reason_codes: ['FLOW_AVAILABLE'],
      created_at: new Date().toISOString()
    });

    await request
      .post('/api/dt/sodam/decide')
      .set('x-test-sowon', SOWON_A)
      .send({
        stay_date: TEST_DATE,
        party_size: 2,
        preferred_room_type: 'double',
        sowon_id: 'evil-override-id' // must be ignored
      });

    // Service received req.sowon_id (SOWON_A), not the body value
    expect(decideSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sowon_id: SOWON_A }),
      expect.anything()
    );
    expect(decideSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ sowon_id: 'evil-override-id' }),
      expect.anything()
    );

    decideSpy.mockRestore();
  });

  // T15 — Guest B cannot hold Guest A's decision
  it('T15 Guest B requests hold on Guest A decision → 403 DECISION_OWNERSHIP_MISMATCH', async () => {
    db.query.mockResolvedValue({
      rows: [{
        id: DEC_OFFER_ID,
        sowon_id: SOWON_A,   // decision belongs to A
        decision_type: 'OFFER',
        inventory_id: INV_DBL_ID,
        candidate: { inventory_id: INV_DBL_ID }
      }]
    });

    const res = await request
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_B)  // logged in as B
      .send({ decision_id: DEC_OFFER_ID });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('DECISION_OWNERSHIP_MISMATCH');
  });

  // T16 — Guest A holds own OFFER decision → FLOW createHold called
  it('T16 Guest A holds own OFFER decision → 201, createHold called', async () => {
    db.query.mockResolvedValue({
      rows: [{
        id: DEC_OFFER_ID,
        sowon_id: SOWON_A,
        decision_type: 'OFFER',
        inventory_id: INV_DBL_ID,
        candidate: { inventory_id: INV_DBL_ID }
      }]
    });
    flowService.createHold.mockResolvedValue({
      success: true,
      hold: { id: 'hold-123', expires_at: new Date(Date.now() + 30 * 60000), quantity: 1 }
    });

    const res = await request
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({ decision_id: DEC_OFFER_ID });

    expect(res.status).toBe(201);
    expect(res.body.hold_id).toBe('hold-123');
    expect(flowService.createHold).toHaveBeenCalledWith(
      INV_DBL_ID,
      SOWON_A,
      1,
      expect.anything(), // db
      DEC_OFFER_ID       // sodam_decision_id — passed from server-validated decision
    );
  });

  // T17 — NO_OFFER decision → hold rejected
  it('T17 NO_OFFER decision cannot be held → 409 DECISION_NOT_HOLDABLE', async () => {
    db.query.mockResolvedValue({
      rows: [{
        id: DEC_OFFER_ID,
        sowon_id: SOWON_A,
        decision_type: 'NO_OFFER',
        inventory_id: null,
        candidate: null
      }]
    });

    const res = await request
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({ decision_id: DEC_OFFER_ID });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DECISION_NOT_HOLDABLE');
    expect(flowService.createHold).not.toHaveBeenCalled();
  });

  // T18 — body provides mismatched inventory_id → rejected
  it('T18 body.inventory_id mismatches decision record → 409 INVENTORY_ID_MISMATCH', async () => {
    db.query.mockResolvedValue({
      rows: [{
        id: DEC_OFFER_ID,
        sowon_id: SOWON_A,
        decision_type: 'OFFER',
        inventory_id: INV_DBL_ID,
        candidate: { inventory_id: INV_DBL_ID }
      }]
    });

    const res = await request
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({ decision_id: DEC_OFFER_ID, inventory_id: 'tampered-wrong-uuid' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVENTORY_ID_MISMATCH');
    expect(flowService.createHold).not.toHaveBeenCalled();
  });

  // T19 — stale OFFER: FLOW returns INSUFFICIENT_AVAILABILITY → 409 (no oversell)
  it('T19 stale OFFER → FLOW INSUFFICIENT_AVAILABILITY → 409, inventory not oversold', async () => {
    db.query.mockResolvedValue({
      rows: [{
        id: DEC_OFFER_ID,
        sowon_id: SOWON_A,
        decision_type: 'OFFER',
        inventory_id: INV_DBL_ID,
        candidate: { inventory_id: INV_DBL_ID }
      }]
    });
    flowService.createHold.mockResolvedValue({
      success: false,
      reason: 'INSUFFICIENT_AVAILABILITY',
      available: 0
    });

    const res = await request
      .post('/api/dt/sodam/hold')
      .set('x-test-sowon', SOWON_A)
      .send({ decision_id: DEC_OFFER_ID });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INSUFFICIENT_AVAILABILITY');
    // Prove createHold was called (not short-circuited before FLOW)
    expect(flowService.createHold).toHaveBeenCalled();
  });
});
