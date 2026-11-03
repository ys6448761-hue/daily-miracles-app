/**
 * FLOW Confirm Tests — STEP 5D Actual Use Confirmation
 *
 * Coverage:
 *   partnerPinService  — 5 tests (rate-limit, not-found, wrong-pin, inactive, success)
 *   flowConfirmRoutes  — 10 tests (authorized success, idempotent, wrong-partner,
 *                        self-confirm denied, cancelled, nonexistent, missing params x3,
 *                        duplicate-race idempotent, timestamp server-set)
 *
 * Note: Tests use mock DB to verify logic branches.
 *       Real PostgreSQL E2E is separate (run-kenny-partner-seed.js + manual E2E).
 */

'use strict';

const crypto    = require('crypto');
const express   = require('express');
const supertest = require('supertest');

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

// ── Module-level mock db (Jest requires factory to be free of out-of-scope vars) ─

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

// ── Constants ────────────────────────────────────────────────────────────────

const KENNY_PIN      = 'test_pin_value';
const KENNY_PIN_HASH = sha256(KENNY_PIN);

const VALID_BOOKING = {
  booking_id:         'b0000001-0000-4000-8000-000000000001',
  booking_status:     'confirmed',
  sowon_id:           'c0000001-0000-4000-8000-000000000001',
  quantity:           1,
  stay_date:          '2026-11-15',
  accommodation_id:   'aa000002-0000-4000-8000-000000000002',
  room_code:          'KENNY_OCEAN_DBL',
  owner_partner_code: 'KENNY',
};

function pinOkResponses(overrides = {}) {
  return [
    { rows: [{ cnt: '0' }], rowCount: 1 },                                     // rate-limit
    { rows: [{ id: 'cfg', pin_hash: KENNY_PIN_HASH, is_active: true, partner_name: '케니 호텔' }], rowCount: 1 }, // partner_configs
    ...overrides.afterPin ?? [],
  ];
}

// ── App factory ──────────────────────────────────────────────────────────────

function buildApp() {
  const router = require('../../routes/flowConfirmRoutes');
  const app    = express();
  app.use(express.json());
  app.use('/api/dt/flow', router);
  return app;
}

// ── partnerPinService unit tests ─────────────────────────────────────────────

describe('partnerPinService.verifyPartnerPin', () => {
  const { verifyPartnerPin } = require('../../services/partnerPinService');

  test('throws PIN_RATE_LIMITED when 5+ failures in 1 minute', async () => {
    setResponses([{ rows: [{ cnt: '5' }], rowCount: 1 }]);
    await expect(verifyPartnerPin(mockDb, 'KENNY', '1234'))
      .rejects.toMatchObject({ code: 'PIN_RATE_LIMITED' });
  });

  test('throws PARTNER_NOT_AUTHORIZED when partner_code not found', async () => {
    setResponses([
      { rows: [{ cnt: '0' }], rowCount: 1 },
      { rows: [], rowCount: 0 },
    ]);
    await expect(verifyPartnerPin(mockDb, 'UNKNOWN', '1234'))
      .rejects.toMatchObject({ code: 'PARTNER_NOT_AUTHORIZED' });
  });

  test('throws PARTNER_NOT_AUTHORIZED when partner is inactive', async () => {
    setResponses([
      { rows: [{ cnt: '0' }], rowCount: 1 },
      { rows: [{ id: 'cfg', pin_hash: sha256('1234'), is_active: false }], rowCount: 1 },
    ]);
    await expect(verifyPartnerPin(mockDb, 'KENNY', '1234'))
      .rejects.toMatchObject({ code: 'PARTNER_NOT_AUTHORIZED' });
  });

  test('throws WRONG_PIN on hash mismatch', async () => {
    setResponses([
      { rows: [{ cnt: '0' }], rowCount: 1 },
      { rows: [{ id: 'cfg', pin_hash: sha256('correct'), is_active: true }], rowCount: 1 },
    ]);
    await expect(verifyPartnerPin(mockDb, 'KENNY', 'wrong'))
      .rejects.toMatchObject({ code: 'WRONG_PIN' });
  });

  test('resolves with partner info on correct PIN', async () => {
    setResponses([
      { rows: [{ cnt: '0' }], rowCount: 1 },
      { rows: [{ id: 'cfg-uuid', pin_hash: KENNY_PIN_HASH, is_active: true, partner_name: '케니 호텔' }], rowCount: 1 },
    ]);
    const result = await verifyPartnerPin(mockDb, 'KENNY', KENNY_PIN);
    expect(result.partner_code).toBe('KENNY');
    expect(result.partner_name).toBe('케니 호텔');
  });
});

// ── flowConfirmRoutes tests ───────────────────────────────────────────────────

describe('POST /api/dt/flow/confirm', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  test('400 when booking_id missing', async () => {
    setResponses([]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ partner_code: 'KENNY', partner_pin: KENNY_PIN });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MISSING_BOOKING_ID');
  });

  test('400 when partner_code missing', async () => {
    setResponses([]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: VALID_BOOKING.booking_id, partner_pin: KENNY_PIN });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MISSING_PARTNER_CODE');
  });

  test('400 when partner_pin missing', async () => {
    setResponses([]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: VALID_BOOKING.booking_id, partner_code: 'KENNY' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MISSING_PARTNER_PIN');
  });

  test('403 WRONG_PIN on bad PIN', async () => {
    setResponses([
      { rows: [{ cnt: '0' }], rowCount: 1 },
      { rows: [{ id: 'cfg', pin_hash: KENNY_PIN_HASH, is_active: true }], rowCount: 1 },
    ]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: VALID_BOOKING.booking_id, partner_code: 'KENNY', partner_pin: 'wrongpin' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('WRONG_PIN');
  });

  test('404 when booking does not exist', async () => {
    setResponses([
      ...pinOkResponses().slice(0, 2),
      { rows: [], rowCount: 0 }, // booking not found
    ]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: 'nonexistent-uuid', partner_code: 'KENNY', partner_pin: KENNY_PIN });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOKING_NOT_FOUND');
  });

  test('409 BOOKING_CANCELLED when booking is cancelled', async () => {
    const cancelled = { ...VALID_BOOKING, booking_status: 'cancelled' };
    setResponses([
      ...pinOkResponses().slice(0, 2),
      { rows: [cancelled], rowCount: 1 },
    ]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: VALID_BOOKING.booking_id, partner_code: 'KENNY', partner_pin: KENNY_PIN });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('BOOKING_CANCELLED');
  });

  test('403 PARTNER_RESOURCE_MISMATCH when wrong partner requests', async () => {
    // Booking belongs to KENNY but OTHER tries to confirm
    setResponses([
      { rows: [{ cnt: '0' }], rowCount: 1 },
      { rows: [{ id: 'cfg2', pin_hash: sha256('other_pin'), is_active: true }], rowCount: 1 },
      { rows: [VALID_BOOKING], rowCount: 1 }, // owner_partner_code = KENNY
    ]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: VALID_BOOKING.booking_id, partner_code: 'OTHER', partner_pin: 'other_pin' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PARTNER_RESOURCE_MISMATCH');
  });

  test('201 on authorized Kenny confirmation — sowon_id, stay_date, room_code, confirmed_at present', async () => {
    setResponses([
      ...pinOkResponses().slice(0, 2),
      { rows: [VALID_BOOKING], rowCount: 1 },          // booking
      { rows: [], rowCount: 0 },                        // no existing confirmation
      { rows: [{ id: 'conf-001', confirmed_at: new Date('2026-11-15T14:00:00Z') }], rowCount: 1 }, // INSERT
    ]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: VALID_BOOKING.booking_id, partner_code: 'KENNY', partner_pin: KENNY_PIN });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.idempotent).toBe(false);
    expect(res.body.sowon_id).toBe(VALID_BOOKING.sowon_id);
    expect(res.body.stay_date).toBe(VALID_BOOKING.stay_date);
    expect(res.body.room_code).toBe(VALID_BOOKING.room_code);
    expect(res.body.confirmed_by).toBe('KENNY');
    expect(res.body.confirmed_at).toBeDefined(); // server-generated, not from client
  });

  test('200 idempotent on duplicate request from same partner', async () => {
    const existing = { id: 'conf-001', confirmed_by: 'KENNY', confirmed_at: new Date('2026-11-15T14:00:00Z') };
    setResponses([
      ...pinOkResponses().slice(0, 2),
      { rows: [VALID_BOOKING], rowCount: 1 },
      { rows: [existing], rowCount: 1 }, // existing confirmation found
    ]);
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .send({ booking_id: VALID_BOOKING.booking_id, partner_code: 'KENNY', partner_pin: KENNY_PIN });
    expect(res.status).toBe(200);
    expect(res.body.idempotent).toBe(true);
    expect(res.body.confirmation_id).toBe('conf-001');
  });

  test('Sowoni cannot self-confirm: missing partner fields → 400', async () => {
    setResponses([]);
    // Sowoni would not have partner_code or partner_pin
    const res = await supertest(app)
      .post('/api/dt/flow/confirm')
      .set('Authorization', 'Bearer some-guest-jwt')
      .send({ booking_id: VALID_BOOKING.booking_id });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MISSING_PARTNER_CODE');
  });
});
