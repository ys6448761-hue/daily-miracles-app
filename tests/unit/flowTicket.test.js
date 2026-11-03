'use strict';

/**
 * flowTicket.test.js — PHX-COMMERCE-TICKET-001
 *
 * Tests for:
 *  - ticketAuthService (HMAC-SHA256 verification, nonce replay, timestamp)
 *  - flowTicketRoutes POST /ticket-hold
 *  - flowTicketRoutes POST /ticket-book (including idempotency, ops alerts)
 */

const crypto  = require('crypto');
const express = require('express');
const request = require('supertest');

// ─── Mock flowInventoryService ──────────────────────────────────────────────
jest.mock('../../services/flowInventoryService', () => ({
  createHold: jest.fn(),
  consumeHold: jest.fn(),
}));

// ─── Mock messageProvider ───────────────────────────────────────────────────
jest.mock('../../services/messageProvider', () => ({
  sendSensSMS: jest.fn().mockResolvedValue({ success: true }),
}));

const flowService   = require('../../services/flowInventoryService');
const messageProvider = require('../../services/messageProvider');

// ─── ticketAuthService (requires real env var) ──────────────────────────────
const TEST_SECRET      = 'test-secret-for-unit-tests-min32chars!!';
const TEST_SOWON_ID    = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

// Set env before requiring the module so TICKET_SECRET is captured
beforeAll(() => {
  process.env.FLOW_TICKET_ENABLED  = 'true';
  process.env.FLOW_TICKET_SECRET   = TEST_SECRET;
  process.env.FLOW_TICKET_SOWON_ID = TEST_SOWON_ID;
  process.env.ADMIN_PHONE          = '01000000000';
});

const ticketAuth = require('../../services/ticketAuthService');

// ─── App factory (fresh per test group to avoid nonce store bleed) ──────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.locals.db = {
    query: jest.fn(),
  };
  const router = require('../../routes/flowTicketRoutes');
  app.use('/api/dt/flow', router);
  return app;
}

// ─── Signature helper ───────────────────────────────────────────────────────
// normalizeBody strips undefined values so the canonical string matches
// what Express receives after JSON.stringify + parse (undefined → omitted).
function normalizeBody(body) {
  return JSON.parse(JSON.stringify(body));
}

function makeHeaders(method, path, body, secret = TEST_SECRET, overrides = {}) {
  const timestamp  = String(Date.now());
  const nonce      = crypto.randomBytes(16).toString('hex');
  const cleanBody  = normalizeBody(body || {});
  const signature  = ticketAuth.computeSignature(secret, { timestamp, nonce, method, path, body: cleanBody });
  return {
    'x-ticket-timestamp': timestamp,
    'x-ticket-nonce':     nonce,
    'x-ticket-signature': signature,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// §1 ticketAuthService — unit tests
// ═══════════════════════════════════════════════════════════════════════════
describe('ticketAuthService', () => {
  describe('buildCanonical', () => {
    it('sorts body keys alphabetically', () => {
      const canonical = ticketAuth.buildCanonical({
        timestamp: '1000', nonce: 'abc', method: 'POST', path: '/test',
        body: { z: '3', a: '1', m: '2' },
      });
      expect(canonical).toBe('1000\nabc\nPOST\n/test\na=1&m=2&z=3');
    });

    it('handles empty body', () => {
      const canonical = ticketAuth.buildCanonical({
        timestamp: '1000', nonce: 'abc', method: 'GET', path: '/test', body: {},
      });
      expect(canonical).toBe('1000\nabc\nGET\n/test\n');
    });
  });

  describe('verify', () => {
    function makeReq(overrides = {}) {
      const timestamp = String(Date.now());
      const nonce     = crypto.randomBytes(16).toString('hex');
      const method    = 'POST';
      const path      = '/ticket-hold';
      const body      = { inventory_id: 'inv-1', quantity: '1' };
      const signature = ticketAuth.computeSignature(TEST_SECRET, { timestamp, nonce, method, path, body });
      return {
        headers: {
          'x-ticket-timestamp': timestamp,
          'x-ticket-nonce':     nonce,
          'x-ticket-signature': signature,
          ...overrides.headers,
        },
        method,
        path,
        body,
        ...overrides,
      };
    }

    it('returns valid:true for a correct request', () => {
      const result = ticketAuth.verify(makeReq());
      expect(result.valid).toBe(true);
    });

    it('returns MISSING_AUTH_HEADERS when headers absent', () => {
      const req = makeReq({ headers: {} });
      expect(ticketAuth.verify(req)).toEqual({ valid: false, reason: 'MISSING_AUTH_HEADERS' });
    });

    it('returns TIMESTAMP_EXPIRED for old timestamp', () => {
      const oldTs = String(Date.now() - 10 * 60 * 1000); // 10 min ago
      const nonce     = crypto.randomBytes(16).toString('hex');
      const sig = ticketAuth.computeSignature(TEST_SECRET, {
        timestamp: oldTs, nonce, method: 'POST', path: '/ticket-hold', body: {},
      });
      const req = {
        headers: { 'x-ticket-timestamp': oldTs, 'x-ticket-nonce': nonce, 'x-ticket-signature': sig },
        method: 'POST', path: '/ticket-hold', body: {},
      };
      expect(ticketAuth.verify(req)).toEqual({ valid: false, reason: 'TIMESTAMP_EXPIRED' });
    });

    it('returns NONCE_REUSED on replay', () => {
      const req = makeReq();
      ticketAuth.verify(req); // first call marks nonce
      expect(ticketAuth.verify(req)).toEqual({ valid: false, reason: 'NONCE_REUSED' });
    });

    it('returns INVALID_SIGNATURE for wrong secret', () => {
      const timestamp = String(Date.now());
      const nonce     = crypto.randomBytes(16).toString('hex');
      const body      = { inventory_id: 'inv-1' };
      const badSig    = ticketAuth.computeSignature('wrong-secret', { timestamp, nonce, method: 'POST', path: '/ticket-hold', body });
      const req = {
        headers: { 'x-ticket-timestamp': timestamp, 'x-ticket-nonce': nonce, 'x-ticket-signature': badSig },
        method: 'POST', path: '/ticket-hold', body,
      };
      expect(ticketAuth.verify(req)).toEqual({ valid: false, reason: 'INVALID_SIGNATURE' });
    });

    it('returns INVALID_SIGNATURE_FORMAT for non-hex signature', () => {
      const req = makeReq({ headers: { 'x-ticket-signature': 'not-hex-!!!' } });
      // Also need valid timestamp+nonce
      const timestamp = String(Date.now());
      const nonce = crypto.randomBytes(16).toString('hex');
      req.headers['x-ticket-timestamp'] = timestamp;
      req.headers['x-ticket-nonce'] = nonce;
      expect(ticketAuth.verify(req).reason).toBe('INVALID_SIGNATURE_FORMAT');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// §1b Feature Flag — FLOW_TICKET_ENABLED
// Verifies the production safety gate: API disabled by default.
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature Flag — FLOW_TICKET_ENABLED', () => {
  afterEach(() => {
    // Restore to test-suite default so subsequent suites run with API enabled
    process.env.FLOW_TICKET_ENABLED = 'true';
  });

  it('returns 503 TICKET_API_DISABLED when FLOW_TICKET_ENABLED is not set', async () => {
    delete process.env.FLOW_TICKET_ENABLED;
    const app = buildApp();
    const body = { inventory_id: 'inv-1' };
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .set(makeHeaders('POST', '/ticket-hold', body))
      .send(body);
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('TICKET_API_DISABLED');
  });

  it('returns 503 TICKET_API_DISABLED when FLOW_TICKET_ENABLED is "false"', async () => {
    process.env.FLOW_TICKET_ENABLED = 'false';
    const app = buildApp();
    const body = { inventory_id: 'inv-1' };
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .set(makeHeaders('POST', '/ticket-hold', body))
      .send(body);
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('TICKET_API_DISABLED');
  });

  it('proceeds to auth check when FLOW_TICKET_ENABLED is "true"', async () => {
    process.env.FLOW_TICKET_ENABLED = 'true';
    const app = buildApp();
    // No auth headers → 401 (not 503 DISABLED)
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .send({ inventory_id: 'inv-1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TICKET_AUTH_FAILED');
  });

  it('returns 503 TICKET_API_DISABLED on ticket-book when disabled', async () => {
    delete process.env.FLOW_TICKET_ENABLED;
    const app = buildApp();
    const body = { hold_id: 'h', ticket_order_id: 'ORD-X', ticket_paid_at: new Date().toISOString() };
    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', body))
      .send(body);
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('TICKET_API_DISABLED');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// §2 POST /ticket-hold
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/dt/flow/ticket-hold', () => {
  let app;
  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
  });

  it('returns 401 without auth headers', async () => {
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .send({ inventory_id: 'inv-1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TICKET_AUTH_FAILED');
  });

  it('returns 400 when inventory_id missing', async () => {
    const body = {};
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .set(makeHeaders('POST', '/ticket-hold', body))
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_INVENTORY_ID');
  });

  it('returns 201 with hold on success', async () => {
    flowService.createHold.mockResolvedValue({
      success: true,
      hold:    { id: 'hold-uuid', expires_at: new Date().toISOString() },
    });

    const body = { inventory_id: 'inv-1', quantity: 2 };
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .set(makeHeaders('POST', '/ticket-hold', body))
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.hold_id).toBe('hold-uuid');
    expect(flowService.createHold).toHaveBeenCalledWith(
      'inv-1', TEST_SOWON_ID, 2, expect.anything()
    );
  });

  it('returns 409 for INSUFFICIENT_AVAILABILITY', async () => {
    flowService.createHold.mockResolvedValue({
      success:   false,
      reason:    'INSUFFICIENT_AVAILABILITY',
      available: 0,
    });

    const body = { inventory_id: 'inv-1', quantity: 5 };
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .set(makeHeaders('POST', '/ticket-hold', body))
      .send(body);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('INSUFFICIENT_AVAILABILITY');
  });

  it('returns 404 for INVENTORY_NOT_FOUND', async () => {
    flowService.createHold.mockResolvedValue({ success: false, reason: 'INVENTORY_NOT_FOUND' });
    const body = { inventory_id: 'no-such' };
    const res = await request(app)
      .post('/api/dt/flow/ticket-hold')
      .set(makeHeaders('POST', '/ticket-hold', body))
      .send(body);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// §3 POST /ticket-book
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/dt/flow/ticket-book', () => {
  let app;
  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
    // Default: no existing booking
    app.locals.db.query = jest.fn().mockResolvedValue({ rows: [] });
  });

  const baseBody = {
    hold_id:         'hold-uuid',
    ticket_order_id: 'ORD-001',
    ticket_paid_at:  new Date().toISOString(),
    customer_name:   '홍길동',
    phone:           '01012345678',
  };

  it('returns 401 without auth headers', async () => {
    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .send(baseBody);
    expect(res.status).toBe(401);
  });

  it('returns 400 when hold_id missing', async () => {
    const body = { ...baseBody, hold_id: undefined };
    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', body))
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_HOLD_ID');
  });

  it('returns 400 when ticket_order_id missing', async () => {
    const body = { ...baseBody, ticket_order_id: undefined };
    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', body))
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_TICKET_ORDER_ID');
  });

  it('returns 400 when ticket_paid_at missing', async () => {
    const body = { ...baseBody, ticket_paid_at: undefined };
    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', body))
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_TICKET_PAID_AT');
  });

  it('returns 201 with booking_id on success', async () => {
    flowService.consumeHold.mockResolvedValue({
      success: true,
      booking: { id: 'booking-uuid', ticket_order_id: 'ORD-001' },
    });

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking_id).toBe('booking-uuid');
    expect(res.body.ticket_order_id).toBe('ORD-001');

    expect(flowService.consumeHold).toHaveBeenCalledWith(
      'hold-uuid',
      TEST_SOWON_ID,
      expect.objectContaining({ ticket_order_id: 'ORD-001' }),
      expect.anything()
    );
  });

  it('returns 200 idempotent when ticket_order_id already confirmed', async () => {
    app.locals.db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'existing-booking', ticket_order_id: 'ORD-001' }],
    });

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(200);
    expect(res.body.idempotent).toBe(true);
    expect(res.body.booking_id).toBe('existing-booking');
    expect(flowService.consumeHold).not.toHaveBeenCalled();
  });

  it('sends ops SMS alert on HOLD_EXPIRED', async () => {
    flowService.consumeHold.mockResolvedValue({ success: false, reason: 'HOLD_EXPIRED' });

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(409);
    expect(messageProvider.sendSensSMS).toHaveBeenCalledTimes(1);
    const smsArg = messageProvider.sendSensSMS.mock.calls[0][1];
    expect(smsArg).toContain('HOLD_EXPIRED');
    expect(smsArg).toContain('ORD-001');
  });

  it('sends ops SMS alert on HOLD_NOT_FOUND', async () => {
    flowService.consumeHold.mockResolvedValue({ success: false, reason: 'HOLD_NOT_FOUND' });

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(404);
    expect(messageProvider.sendSensSMS).toHaveBeenCalledTimes(1);
  });

  it('does NOT send ops SMS for HOLD_OWNERSHIP_MISMATCH', async () => {
    flowService.consumeHold.mockResolvedValue({ success: false, reason: 'HOLD_OWNERSHIP_MISMATCH' });

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(403);
    expect(messageProvider.sendSensSMS).not.toHaveBeenCalled();
  });

  it('sends ops SMS on unexpected DB error (500)', async () => {
    flowService.consumeHold.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(500);
    expect(messageProvider.sendSensSMS).toHaveBeenCalledTimes(1);
    const smsArg = messageProvider.sendSensSMS.mock.calls[0][1];
    expect(smsArg).toContain('DB connection lost');
  });

  it('sends ops SMS alert on HOLD_NOT_ACTIVE', async () => {
    flowService.consumeHold.mockResolvedValue({ success: false, reason: 'HOLD_NOT_ACTIVE' });

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(409);
    expect(messageProvider.sendSensSMS).toHaveBeenCalledTimes(1);
    const smsArg = messageProvider.sendSensSMS.mock.calls[0][1];
    expect(smsArg).toContain('HOLD_NOT_ACTIVE');
    expect(smsArg).toContain('ORD-001');
  });

  it('returns 200 idempotent on concurrent duplicate (PG 23505)', async () => {
    // Simulate: idempotency SELECT misses (race), then INSERT hits UNIQUE constraint
    const pgUniqueError = Object.assign(new Error('duplicate key value'), {
      code:       '23505',
      constraint: 'uq_dt_flow_bookings_ticket_order',
    });
    flowService.consumeHold.mockRejectedValue(pgUniqueError);

    // After the unique error, re-query finds the existing booking
    app.locals.db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [] })                              // idempotency SELECT → miss
      .mockResolvedValueOnce({ rows: [{ id: 'booking-concurrent', ticket_order_id: 'ORD-001' }] }); // re-query

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(200);
    expect(res.body.idempotent).toBe(true);
    expect(res.body.booking_id).toBe('booking-concurrent');
    // No ops SMS for concurrent idempotent case
    expect(messageProvider.sendSensSMS).not.toHaveBeenCalled();
  });

  it('returns 500 + ops SMS when concurrent re-query also fails', async () => {
    const pgUniqueError = Object.assign(new Error('duplicate key'), {
      code:       '23505',
      constraint: 'uq_dt_flow_bookings_ticket_order',
    });
    flowService.consumeHold.mockRejectedValue(pgUniqueError);

    // idempotency SELECT → miss, re-query after 23505 → also fails
    app.locals.db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [] })                   // idempotency SELECT → miss
      .mockRejectedValueOnce(new Error('DB offline'));       // re-query → fail

    const res = await request(app)
      .post('/api/dt/flow/ticket-book')
      .set(makeHeaders('POST', '/ticket-book', baseBody))
      .send(baseBody);

    expect(res.status).toBe(500);
    expect(messageProvider.sendSensSMS).toHaveBeenCalledTimes(1);
  });
});
