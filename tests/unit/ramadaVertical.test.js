'use strict';

/**
 * ramadaVertical.test.js — Ramada Second Partner Vertical Tests
 *
 * Suite 1 — SODAM Ramada decision (service-level, T-R01–T-R05):
 *   decide() with Ramada partner_id + hotel_key → uses Ramada pricing from quotePriceData.js
 *
 * Suite 2 — Cross-partner isolation (flowConfirmRoutes, T-R06–T-R08):
 *   Ramada PIN cannot confirm Kenny booking (owner_partner_code mismatch)
 *   Kenny PIN cannot confirm Ramada booking (owner_partner_code mismatch)
 *
 * All tests use mock DB — no real PostgreSQL required.
 */

// ── Module-level mocks (hoisted by Jest) ──────────────────────────────────────
jest.mock('../../services/flowInventoryService');
jest.mock('../../services/quoteEngine', () => ({
  getDayType: jest.fn()
}));
jest.mock('../../database/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() }
}));

// ── Imports ───────────────────────────────────────────────────────────────────
const express    = require('express');
const supertest  = require('supertest');
const crypto     = require('crypto');
const flowService = require('../../services/flowInventoryService');
const { getDayType } = require('../../services/quoteEngine');
const db         = require('../../database/db');
const sodamService = require('../../services/sodamDecisionService');

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SOWON_A = '11111111-1111-4111-8111-111111111111';

// Ramada UUIDs (from migration 213)
const RAMADA_PARTNER_ID = 'bb000001-0000-4000-8000-000000000001';
const RAMADA_DBL_ID     = 'bb000002-0000-4000-8000-000000000002';
const RAMADA_TWN_ID     = 'bb000003-0000-4000-8000-000000000003';
const RAMADA_INV_ID     = 'cc000010-0000-4000-8000-000000000010';

// Kenny UUIDs (from migration 209)
const KENNY_PARTNER_ID  = 'aa000001-0000-4000-8000-000000000001';
const KENNY_DBL_ID      = 'aa000002-0000-4000-8000-000000000002';
const KENNY_INV_ID      = 'dd000010-0000-4000-8000-000000000010';

const RAMADA_DBL_ROOM = {
  id: RAMADA_DBL_ID,
  room_type: 'double',
  room_code: 'RAMADA_OCEAN_DBL',
  base_occupancy: 2,
  max_occupancy: 2
};
const RAMADA_TWN_ROOM = {
  id: RAMADA_TWN_ID,
  room_type: 'twin',
  room_code: 'RAMADA_OCEAN_TWN',
  base_occupancy: 2,
  max_occupancy: 4
};

const TEST_DATE = '2026-10-15'; // Thu → mon-thu
const KENNY_PIN  = 'kenny_test_pin';
const RAMADA_PIN = 'ramada_test_pin';

function makeLocalDb(responses = []) {
  let idx = 0;
  return {
    query: jest.fn().mockImplementation(() => {
      const resp = idx < responses.length ? responses[idx++] : { rows: [], rowCount: 1 };
      return Promise.resolve(resp);
    })
  };
}

function makeRamadaAvail(overrides = {}) {
  return {
    id: RAMADA_INV_ID,
    accommodation_id: RAMADA_DBL_ID,
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

// ── Suite 1: SODAM Ramada decision ────────────────────────────────────────────
describe('sodamDecisionService.decide() — Ramada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDayType.mockReturnValue('mon-thu');
  });

  // T-R01: Ramada partner_id + hotel_key → OFFER with Ramada pricing
  it('T-R01 Ramada OFFER: uses Ramada partner_id and ramada pricing key', async () => {
    const localDb = makeLocalDb([
      { rows: [RAMADA_DBL_ROOM, RAMADA_TWN_ROOM] }, // getCompatibleRooms for RAMADA_PARTNER_ID
      { rows: [], rowCount: 1 }                      // INSERT dt_sodam_decisions
    ]);
    flowService.getAvailability.mockResolvedValue(makeRamadaAvail());

    const result = await sodamService.decide(
      {
        sowon_id: SOWON_A,
        stay_date: TEST_DATE,
        party_size: 2,
        partner_id: RAMADA_PARTNER_ID,
        hotel_key: 'ramada'
      },
      localDb
    );

    expect(result.decision_type).toBe('OFFER');
    expect(result.candidate.accommodation_id).toBe(RAMADA_DBL_ID);
    expect(result.candidate.room_code).toBe('RAMADA_OCEAN_DBL');
    expect(result.candidate.price_sell).toBe(70000);  // quotePriceData.js Ramada mon-thu 2인 sell
    expect(result.candidate.price_list).toBe(90000);  // quotePriceData.js Ramada mon-thu 2인 list
    expect(result.candidate.day_type).toBe('mon-thu');
    expect(result.candidate.price_source).toBe('STATIC_CONFIG');
    expect(result.candidate.price_source_version).toBe('v1.2_20260112');
    // DB query must use RAMADA_PARTNER_ID (not KENNY_PARTNER_ID)
    expect(localDb.query.mock.calls[0][1][0]).toBe(RAMADA_PARTNER_ID);
  });

  // T-R02: Ramada saturday pricing correct
  it('T-R02 Ramada saturday pricing: sell=140000 for 2인', async () => {
    getDayType.mockReturnValue('sat');
    const localDb = makeLocalDb([
      { rows: [RAMADA_DBL_ROOM] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeRamadaAvail());

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: '2026-10-17', party_size: 2, partner_id: RAMADA_PARTNER_ID, hotel_key: 'ramada' },
      localDb
    );

    expect(result.decision_type).toBe('OFFER');
    expect(result.candidate.price_sell).toBe(140000); // Ramada sat 2인 sell
    expect(result.candidate.price_list).toBe(175000);
  });

  // T-R03: Ramada twin (4인) pricing correct
  it('T-R03 Ramada twin 4인: sell=80000 mon-thu', async () => {
    const localDb = makeLocalDb([
      { rows: [RAMADA_TWN_ROOM] }, // only twin returned for party_size=4
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeRamadaAvail({ id: RAMADA_INV_ID, accommodation_id: RAMADA_TWN_ID }));

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 4, partner_id: RAMADA_PARTNER_ID, hotel_key: 'ramada' },
      localDb
    );

    expect(result.decision_type).toBe('OFFER');
    expect(result.candidate.room_code).toBe('RAMADA_OCEAN_TWN');
    expect(result.candidate.price_sell).toBe(80000);  // Ramada mon-thu 4인 sell
  });

  // T-R04: Kenny default unchanged — decide() without partner_id uses KENNY
  it('T-R04 Kenny backward compat: no partner_id → uses KENNY_PARTNER_ID', async () => {
    const KENNY_DBL = {
      id: KENNY_DBL_ID,
      room_type: 'double',
      room_code: 'KENNY_OCEAN_DBL',
      base_occupancy: 2,
      max_occupancy: 2
    };
    const localDb = makeLocalDb([
      { rows: [KENNY_DBL] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue({
      id: KENNY_INV_ID, accommodation_id: KENNY_DBL_ID, stay_date: TEST_DATE,
      status: 'open', cutoff_date: null, available: 2
    });

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2 }, // no partner_id
      localDb
    );

    expect(result.decision_type).toBe('OFFER');
    expect(result.candidate.room_code).toBe('KENNY_OCEAN_DBL');
    // DB query must use KENNY_PARTNER_ID (default)
    expect(localDb.query.mock.calls[0][1][0]).toBe(KENNY_PARTNER_ID);
  });

  // T-R05: Ramada OFFER → inventory_id in decision
  it('T-R05 Ramada OFFER persists inventory_id for hold linkage', async () => {
    const localDb = makeLocalDb([
      { rows: [RAMADA_DBL_ROOM] },
      { rows: [], rowCount: 1 }
    ]);
    flowService.getAvailability.mockResolvedValue(makeRamadaAvail());

    const result = await sodamService.decide(
      { sowon_id: SOWON_A, stay_date: TEST_DATE, party_size: 2, partner_id: RAMADA_PARTNER_ID, hotel_key: 'ramada' },
      localDb
    );

    expect(result.candidate.inventory_id).toBe(RAMADA_INV_ID);
    // persistDecision INSERT: $8 = inventory_id
    const insertCall = localDb.query.mock.calls[1];
    expect(insertCall[1][7]).toBe(RAMADA_INV_ID); // $8
  });
});

// ── Suite 2: Cross-partner isolation ─────────────────────────────────────────

// Reset module-level db mock for route tests
let mockQueryResponses = [];
let mockQueryIdx = 0;

function setResponses(responses) {
  mockQueryResponses = responses;
  mockQueryIdx = 0;
  db.query.mockClear();
  db.query.mockImplementation(() => {
    const resp = mockQueryResponses[mockQueryIdx] !== undefined
      ? mockQueryResponses[mockQueryIdx]
      : { rows: [], rowCount: 0 };
    mockQueryIdx++;
    return Promise.resolve(resp);
  });
}

describe('Cross-partner isolation — flowConfirmRoutes', () => {
  let app;

  beforeAll(() => {
    const router = require('../../routes/flowConfirmRoutes');
    app = express();
    app.use(express.json());
    app.use('/api/dt/flow', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const KENNY_BOOKING_ID  = 'b0000001-0000-4000-8000-000000000001';
  const RAMADA_BOOKING_ID = 'b0000002-0000-4000-8000-000000000002';

  // Booking with owner = KENNY
  const kennyBookingRow = {
    booking_id:         KENNY_BOOKING_ID,
    booking_status:     'confirmed',
    sowon_id:           '11111111-1111-4111-8111-111111111111',
    quantity:           1,
    stay_date:          '2026-11-15',
    accommodation_id:   KENNY_DBL_ID,
    room_code:          'KENNY_OCEAN_DBL',
    owner_partner_code: 'KENNY'
  };

  // Booking with owner = RAMADA
  const ramadaBookingRow = {
    booking_id:         RAMADA_BOOKING_ID,
    booking_status:     'confirmed',
    sowon_id:           '11111111-1111-4111-8111-111111111111',
    quantity:           1,
    stay_date:          '2026-11-15',
    accommodation_id:   RAMADA_DBL_ID,
    room_code:          'RAMADA_OCEAN_DBL',
    owner_partner_code: 'RAMADA'
  };

  function pinOk(partner_code, pin) {
    const hash = sha256(pin);
    return [
      { rows: [{ cnt: '0' }], rowCount: 1 },
      { rows: [{ id: 'cfg', pin_hash: hash, is_active: true, partner_name: partner_code === 'KENNY' ? '케니 호텔' : '라마다 호텔' }], rowCount: 1 }
    ];
  }

  // T-R06: Ramada PIN + Kenny booking → 403 PARTNER_MISMATCH
  it('T-R06 Ramada PIN cannot confirm Kenny booking → 403 PARTNER_MISMATCH', async () => {
    setResponses([
      ...pinOk('RAMADA', RAMADA_PIN), // PIN auth passes
      { rows: [kennyBookingRow], rowCount: 1 }, // booking lookup → owner=KENNY
    ]);

    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: KENNY_BOOKING_ID, partner_code: 'RAMADA', partner_pin: RAMADA_PIN });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PARTNER_RESOURCE_MISMATCH');
  });

  // T-R07: Kenny PIN + Ramada booking → 403 PARTNER_RESOURCE_MISMATCH
  it('T-R07 Kenny PIN cannot confirm Ramada booking → 403 PARTNER_RESOURCE_MISMATCH', async () => {
    setResponses([
      ...pinOk('KENNY', KENNY_PIN),
      { rows: [ramadaBookingRow], rowCount: 1 }, // booking lookup → owner=RAMADA
    ]);

    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: RAMADA_BOOKING_ID, partner_code: 'KENNY', partner_pin: KENNY_PIN });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PARTNER_RESOURCE_MISMATCH');
  });

  // T-R08: Ramada PIN + Ramada booking → 201 success (isolation boundary is clean)
  it('T-R08 Ramada PIN can confirm Ramada booking → 201', async () => {
    setResponses([
      ...pinOk('RAMADA', RAMADA_PIN),
      { rows: [ramadaBookingRow], rowCount: 1 }, // booking lookup → owner=RAMADA
      { rows: [], rowCount: 0 },                 // duplicate check (no existing confirmation)
      { rows: [{ id: 'conf-uuid', confirmed_at: new Date().toISOString() }], rowCount: 1 }, // INSERT confirmation
    ]);

    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: RAMADA_BOOKING_ID, partner_code: 'RAMADA', partner_pin: RAMADA_PIN });

    expect(res.status).toBe(201);
    expect(res.body.confirmed_by).toBe('RAMADA');
  });
});
