'use strict';

/**
 * ticketE2E.test.js — Ticket PHP ↔ FLOW Integration E2E Tests
 *
 * 이 테스트는 비운영 환경 전용이다.
 *   - Production DB 접촉 없음
 *   - Real NicePay 결제 없음
 *   - Mock PostgreSQL (jest-mock-extended + 수동 stub)
 *   - Mock NicePay Provider
 *   - PhpHmacAdapter (PHP 서버 서명 시뮬레이션)
 *
 * 환경변수 (테스트 실행 전 설정):
 *   FLOW_TICKET_ENABLED  = 'true'
 *   FLOW_TICKET_SECRET   = TEST_SECRET (테스트 전용)
 *   FLOW_TICKET_SOWON_ID = TEST_SOWON_ID (테스트용 UUID)
 *
 * 시나리오:
 *   S-01: Hold 성공 → Mock 결제 승인 → Book 성공
 *   S-02: Hold 실패 → 결제 시작 차단
 *   S-03: 미승인 결제 → Book 차단 (인증 우회 시도)
 *   S-04: 중복 콜백 → Booking 1개 (idempotent)
 *   S-05: 만료 Hold → Booking 실패 + ops SMS
 *   S-06: 주문번호 충돌 → 안전한 거부
 *   S-07: PHP ↔ Node HMAC 서명 4-벡터 일치
 *   S-08: Nonce 재전송 차단
 *   S-09: DB 장애 시 실패 처리 + ops SMS
 *   S-10: ops SMS 실패 시 사건 추적 (console.error)
 */

const request      = require('supertest');
const express      = require('express');
const PhpHmacAdapter = require('./phpHmacAdapter');
const MockNicePay    = require('./mockNicePay');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const TEST_SECRET   = 'test-secret-for-e2e-ticket-flow-min32chars!!';
const TEST_SOWON_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const TEST_INV_ID   = 'inv-e2e-test-001';
const HOLD_TTL_MS   = 30 * 60 * 1000; // 30 minutes

// HMAC Test Vectors (from COMMERCE-TICKET-005-PHP-SPEC-V0_1.md §3)
const VECTOR_SECRET    = 'test-secret-for-php-contract-verification-v01';
const VECTOR_TIMESTAMP = '1730624400000';
const VECTORS = [
  {
    id: 'V1', desc: 'ticket-hold (quantity 포함)',
    method: 'POST', path: '/ticket-hold',
    nonce: 'a1b2c3d4e5f6789012345678deadbeef',
    body: { inventory_id: 'inv-test-001', quantity: 2 },
    expected: 'db43bdbbbf6c2c446dae702303c0c3c51a966fcfc89cfa9bcec91c7b7f4f191b',
  },
  {
    id: 'V2', desc: 'ticket-hold (quantity 생략)',
    method: 'POST', path: '/ticket-hold',
    nonce: 'a1b2c3d4e5f6789012345678deadbeef2',
    body: { inventory_id: 'inv-test-001' },
    expected: 'd38ec1ecb61e2a0ace79d9274b11e8c9613c7b83866c03a60329cc60b4de2ff2',
  },
  {
    id: 'V3', desc: 'ticket-book (전체 필드)',
    method: 'POST', path: '/ticket-book',
    nonce: 'a1b2c3d4e5f6789012345678deadbeef3',
    body: { customer_name: '홍길동', hold_id: 'hold-uuid-0001', phone: '01012345678', ticket_order_id: 'ORD-2026-TEST-001', ticket_paid_at: '2026-11-03T09:00:05.000Z' },
    expected: '6f52351d6b4b7d7548a8c454744f0e8b25d61fcfb9e298102ab3071f9a5142c0',
  },
  {
    id: 'V4', desc: 'ticket-book (필수 필드만)',
    method: 'POST', path: '/ticket-book',
    nonce: 'a1b2c3d4e5f6789012345678deadbeef4',
    body: { hold_id: 'hold-uuid-0002', ticket_order_id: 'ORD-2026-TEST-002', ticket_paid_at: '2026-11-03T09:05:00.000Z' },
    expected: 'a6f82dd3b57c4b659d475d5c2afc398ce96d22e9810db48b4673d2f92e1010df',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock DB builder
// ─────────────────────────────────────────────────────────────────────────────
function makeMockDb(overrides = {}) {
  const holds    = new Map(); // hold_id -> hold record
  const bookings = new Map(); // ticket_order_id -> booking record

  const db = {
    pool: {
      connect: jest.fn(async () => {
        const client = {
          query: jest.fn(async (sql, params) => {
            // BEGIN / COMMIT / ROLLBACK
            if (/^\s*(BEGIN|COMMIT|ROLLBACK)/i.test(sql)) return { rows: [] };

            // ---- dt_flow_inventory SELECT FOR UPDATE ----
            if (/FROM dt_flow_inventory/i.test(sql)) {
              if (overrides.inventoryError) throw overrides.inventoryError;
              const invId = params[0];
              if (invId !== TEST_INV_ID) return { rows: [] };
              return { rows: [{ id: invId, allocated_count: 10, status: 'open', cutoff_date: null, stay_date: null }] };
            }

            // ---- dt_flow_holds active count ----
            if (/active_held/i.test(sql)) return { rows: [{ active_held: 0 }] };

            // ---- dt_flow_bookings confirmed count ----
            if (/confirmed_booked/i.test(sql) && !/WHERE ticket_order_id/i.test(sql)) {
              return { rows: [{ confirmed_booked: 0 }] };
            }

            // ---- INSERT dt_flow_holds ----
            if (/INSERT INTO dt_flow_holds/i.test(sql)) {
              if (overrides.holdInsertError) throw overrides.holdInsertError;
              const [inventory_id, sowon_id, quantity, expires_at] = params;
              const id = 'hold-e2e-' + Date.now();
              const hold = { id, inventory_id, sowon_id, quantity: quantity || 1, status: 'active', expires_at };
              holds.set(id, hold);
              return { rows: [hold] };
            }

            // ---- SELECT dt_flow_holds FOR UPDATE (by hold_id) ----
            if (/FROM dt_flow_holds h\s+WHERE h\.id/i.test(sql) || /FROM dt_flow_holds\s+WHERE.*id\s*=\s*\$1.*FOR UPDATE/i.test(sql)) {
              const hold_id = params[0];
              const hold = holds.get(hold_id);
              if (!hold) return { rows: [] };
              // Simulate expiry
              if (overrides.expireHold && overrides.expireHold === hold_id) {
                hold.expires_at = new Date(Date.now() - 1000).toISOString();
              }
              return { rows: [hold] };
            }

            // ---- SELECT dt_flow_bookings WHERE ticket_order_id ----
            if (/FROM dt_flow_bookings\s+WHERE ticket_order_id/i.test(sql)) {
              const tid = params[0];
              const booking = bookings.get(tid);
              if (!booking) return { rows: [] };
              return { rows: [booking] };
            }

            // ---- INSERT dt_flow_bookings ----
            if (/INSERT INTO dt_flow_bookings/i.test(sql)) {
              if (overrides.bookingInsertError) throw overrides.bookingInsertError;
              const ticket_order_id = params[6]; // position in VALUES
              if (overrides.uniqueViolation && bookings.has(ticket_order_id)) {
                const err = new Error('duplicate key value violates unique constraint');
                err.code = '23505';
                err.constraint = 'uq_dt_flow_bookings_ticket_order';
                throw err;
              }
              const id = 'booking-e2e-' + Date.now();
              const booking = { id, ticket_order_id, status: 'confirmed' };
              bookings.set(ticket_order_id, booking);
              return { rows: [booking] };
            }

            // ---- UPDATE dt_flow_holds SET status='consumed' ----
            if (/UPDATE dt_flow_holds.*consumed/i.test(sql)) {
              const hold_id = params[0];
              const hold = holds.get(hold_id);
              if (hold) hold.status = 'consumed';
              return { rows: [] };
            }

            return { rows: [] };
          }),
          release: jest.fn(),
        };
        return client;
      }),
    },
    query: jest.fn(async (sql, params) => {
      // idempotency SELECT and re-query SELECT — check override map, then live bookings map
      if (/FROM dt_flow_bookings\s+WHERE ticket_order_id/i.test(sql)) {
        const tid = params[0];
        const booking = (overrides.existingBookings && overrides.existingBookings.get(tid))
                        || bookings.get(tid);
        if (!booking) return { rows: [] };
        return { rows: [booking] };
      }
      return { rows: [] };
    }),
    _holds:    holds,
    _bookings: bookings,
  };
  return db;
}

// ─────────────────────────────────────────────────────────────────────────────
// App factory
// ─────────────────────────────────────────────────────────────────────────────
function makeApp(db, msgMock) {
  const app = express();
  app.use(express.json());
  app.locals.db = db;

  // Inject mock message provider
  jest.doMock('../../../services/messageProvider', () => ({ sendSensSMS: msgMock || jest.fn().mockResolvedValue('ok') }));
  jest.resetModules();

  const router = require('../../../routes/flowTicketRoutes');
  app.use('/api/dt/flow', router);
  return app;
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────
beforeAll(() => {
  process.env.FLOW_TICKET_ENABLED  = 'true';
  process.env.FLOW_TICKET_SECRET   = TEST_SECRET;
  process.env.FLOW_TICKET_SOWON_ID = TEST_SOWON_ID;
  process.env.ADMIN_PHONE          = '01000000000';
});

afterAll(() => {
  delete process.env.FLOW_TICKET_ENABLED;
  delete process.env.FLOW_TICKET_SECRET;
  delete process.env.FLOW_TICKET_SOWON_ID;
});

// ─────────────────────────────────────────────────────────────────────────────
// S-07: HMAC 테스트 벡터 일치 검증 (PHP ↔ Node 계약)
// 다른 시나리오보다 먼저 실행 — 기반 계약 확인
// ─────────────────────────────────────────────────────────────────────────────
describe('S-07: PHP ↔ Node HMAC 서명 테스트 벡터 4개 일치', () => {
  const adapter = new PhpHmacAdapter(VECTOR_SECRET);

  VECTORS.forEach(v => {
    test(`${v.id}: ${v.desc}`, () => {
      const result = adapter.verifyVector({
        timestamp: VECTOR_TIMESTAMP,
        nonce:     v.nonce,
        method:    v.method,
        path:      v.path,
        body:      v.body,
        expectedSignature: v.expected,
      });
      expect(result.match).toBe(true);
      expect(result.actual).toBe(v.expected);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-01: Hold 성공 → Mock 결제 승인 → Book 성공
// ─────────────────────────────────────────────────────────────────────────────
describe('S-01: Hold 성공 → Mock 결제 승인 → Book 성공', () => {
  const nPay    = new MockNicePay();
  const php     = new PhpHmacAdapter(TEST_SECRET);
  let holdId, db, app;

  beforeAll(() => {
    db  = makeMockDb();
    app = makeApp(db);
    nPay.reset();
  });

  test('Step 1: ticket-hold 성공 (201)', async () => {
    const body    = { inventory_id: TEST_INV_ID, quantity: 1 };
    const headers = php.buildHeaders('POST', '/ticket-hold', body);
    const res     = await request(app).post('/api/dt/flow/ticket-hold').set(headers).send(body);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.hold_id).toBeDefined();
    holdId = res.body.hold_id;
  });

  test('Step 2: Mock NicePay 결제 승인', () => {
    const result = nPay.approve({ moid: 'ORD-E2E-001', amount: 99000, goodsName: '케이블카 1매' });
    expect(result.success).toBe(true);
    expect(result.resultCode).toBe('3001');
    expect(result.tid).toBeDefined();
    // PHP: NicePay verify before calling ticket-book
    const verify = nPay.verify({ tid: result.tid, moid: 'ORD-E2E-001', amount: 99000 });
    expect(verify.verified).toBe(true);
  });

  test('Step 3: ticket-book 성공 (201)', async () => {
    const body    = { hold_id: holdId, ticket_order_id: 'ORD-E2E-001', ticket_paid_at: new Date().toISOString(), customer_name: '홍길동', phone: '01012345678' };
    const headers = php.buildHeaders('POST', '/ticket-book', body);
    const res     = await request(app).post('/api/dt/flow/ticket-book').set(headers).send(body);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking_id).toBeDefined();
    expect(res.body.ticket_order_id).toBe('ORD-E2E-001');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-02: Hold 실패 → 결제 시작 차단
// ─────────────────────────────────────────────────────────────────────────────
describe('S-02: Hold 실패 → 결제창 열지 않음', () => {
  const php = new PhpHmacAdapter(TEST_SECRET);

  test('재고 없는 inventory_id → 404', async () => {
    const db   = makeMockDb();
    const app  = makeApp(db);
    const body = { inventory_id: 'inv-does-not-exist', quantity: 1 };
    const hdrs = php.buildHeaders('POST', '/ticket-hold', body);
    const res  = await request(app).post('/api/dt/flow/ticket-hold').set(hdrs).send(body);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('INVENTORY_NOT_FOUND');
    // PHP must NOT open payment page on any non-201 response
  });

  test('수량 101 → 400 INVALID_QUANTITY', async () => {
    const db   = makeMockDb();
    const app  = makeApp(db);
    // quantity=0 is coerced to 1 by parseInt(0)||1. Use 101 to exceed range.
    const body = { inventory_id: TEST_INV_ID, quantity: 101 };
    const hdrs = php.buildHeaders('POST', '/ticket-hold', body);
    const res  = await request(app).post('/api/dt/flow/ticket-hold').set(hdrs).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_QUANTITY');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-03: 미승인 결제 → Book 차단 (인증 우회 시도)
// ─────────────────────────────────────────────────────────────────────────────
describe('S-03: 인증 우회 시도 → Book 차단', () => {
  test('서명 없이 ticket-book 호출 → 401', async () => {
    const db  = makeMockDb();
    const app = makeApp(db);
    const res = await request(app).post('/api/dt/flow/ticket-book')
      .set('Content-Type', 'application/json')
      .send({ hold_id: 'any', ticket_order_id: 'ORD-FAKE', ticket_paid_at: new Date().toISOString() });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TICKET_AUTH_FAILED');
    expect(res.body.reason).toBe('MISSING_AUTH_HEADERS');
  });

  test('잘못된 Secret으로 서명 → 401 INVALID_SIGNATURE', async () => {
    const wrongPhp = new PhpHmacAdapter('wrong-secret-that-does-not-match-!!');
    const db  = makeMockDb();
    const app = makeApp(db);
    const body = { hold_id: 'any', ticket_order_id: 'ORD-FAKE', ticket_paid_at: new Date().toISOString() };
    const hdrs = wrongPhp.buildHeaders('POST', '/ticket-book', body);
    const res = await request(app).post('/api/dt/flow/ticket-book').set(hdrs).send(body);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TICKET_AUTH_FAILED');
    expect(res.body.reason).toBe('INVALID_SIGNATURE');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-04: 중복 콜백 → Booking 1개 (idempotent)
// ─────────────────────────────────────────────────────────────────────────────
describe('S-04: 중복 콜백 → Booking 1개', () => {
  const php = new PhpHmacAdapter(TEST_SECRET);

  test('동일 ticket_order_id 두 번 호출 → 두 번째는 idempotent', async () => {
    const db  = makeMockDb();
    const app = makeApp(db);

    // First: create a hold
    const holdBody = { inventory_id: TEST_INV_ID, quantity: 1 };
    const holdHdrs = php.buildHeaders('POST', '/ticket-hold', holdBody);
    const holdRes  = await request(app).post('/api/dt/flow/ticket-hold').set(holdHdrs).send(holdBody);
    expect(holdRes.status).toBe(201);
    const holdId = holdRes.body.hold_id;

    const bookBody = { hold_id: holdId, ticket_order_id: 'ORD-DUP-001', ticket_paid_at: new Date().toISOString() };

    // First book call
    const hdrs1  = php.buildHeaders('POST', '/ticket-book', bookBody);
    const res1   = await request(app).post('/api/dt/flow/ticket-book').set(hdrs1).send(bookBody);
    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);

    // Second book call (duplicate) — idempotency SELECT should return existing
    const hdrs2  = php.buildHeaders('POST', '/ticket-book', bookBody);
    const res2   = await request(app).post('/api/dt/flow/ticket-book').set(hdrs2).send(bookBody);
    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.idempotent).toBe(true);
    expect(res2.body.booking_id).toBe(res1.body.booking_id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-05: 만료 Hold → Booking 실패 + ops SMS
// ─────────────────────────────────────────────────────────────────────────────
describe('S-05: 만료 Hold → Booking 실패 + ops SMS', () => {
  const php = new PhpHmacAdapter(TEST_SECRET);

  test('Hold 만료 후 ticket-book → 409 HOLD_EXPIRED + ops SMS 발송', async () => {
    const smsMock = jest.fn().mockResolvedValue('ok');
    const db      = makeMockDb();
    const app     = makeApp(db, smsMock);

    // Create hold
    const holdBody = { inventory_id: TEST_INV_ID };
    const holdHdrs = php.buildHeaders('POST', '/ticket-hold', holdBody);
    const holdRes  = await request(app).post('/api/dt/flow/ticket-hold').set(holdHdrs).send(holdBody);
    const holdId   = holdRes.body.hold_id;

    // Force expire
    db._holds.get(holdId).expires_at = new Date(Date.now() - 1000).toISOString();

    const bookBody = { hold_id: holdId, ticket_order_id: 'ORD-EXP-001', ticket_paid_at: new Date().toISOString() };
    const bookHdrs = php.buildHeaders('POST', '/ticket-book', bookBody);
    const res      = await request(app).post('/api/dt/flow/ticket-book').set(bookHdrs).send(bookBody);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('HOLD_EXPIRED');
    expect(smsMock).toHaveBeenCalledTimes(1);
    expect(smsMock.mock.calls[0][1]).toMatch(/HOLD_EXPIRED/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-06: 주문번호 충돌 → 안전한 거부 (동시 경쟁, PG 23505)
// ─────────────────────────────────────────────────────────────────────────────
describe('S-06: 동시 콜백 PG 23505 → idempotent', () => {
  const php = new PhpHmacAdapter(TEST_SECRET);

  test('PG 23505 constraint violation → 200 idempotent (re-query success)', async () => {
    const existingBookings = new Map([
      ['ORD-RACE-001', { id: 'booking-existing-001', ticket_order_id: 'ORD-RACE-001', status: 'confirmed' }],
    ]);
    const db = makeMockDb({ bookingInsertError: Object.assign(new Error('dup'), { code: '23505', constraint: 'uq_dt_flow_bookings_ticket_order' }), existingBookings });
    const app = makeApp(db);

    // Create hold first
    const holdBody = { inventory_id: TEST_INV_ID };
    const holdHdrs = php.buildHeaders('POST', '/ticket-hold', holdBody);
    const holdRes  = await request(app).post('/api/dt/flow/ticket-hold').set(holdHdrs).send(holdBody);
    const holdId   = holdRes.body.hold_id;

    const bookBody = { hold_id: holdId, ticket_order_id: 'ORD-RACE-001', ticket_paid_at: new Date().toISOString() };
    const bookHdrs = php.buildHeaders('POST', '/ticket-book', bookBody);
    const res      = await request(app).post('/api/dt/flow/ticket-book').set(bookHdrs).send(bookBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.idempotent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-08: Nonce 재전송 차단
// ─────────────────────────────────────────────────────────────────────────────
describe('S-08: Nonce 재전송 차단', () => {
  test('동일 nonce 두 번 → 두 번째 401 NONCE_REUSED', async () => {
    const db  = makeMockDb();
    const app = makeApp(db);
    const php = new PhpHmacAdapter(TEST_SECRET);

    const body = { inventory_id: TEST_INV_ID };
    // First request: sign manually to reuse same nonce
    const { timestamp, nonce, signature } = php.sign('POST', '/ticket-hold', body);
    const headers = {
      'Content-Type':       'application/json',
      'X-Ticket-Timestamp': timestamp,
      'X-Ticket-Nonce':     nonce,
      'X-Ticket-Signature': signature,
    };

    const res1 = await request(app).post('/api/dt/flow/ticket-hold').set(headers).send(body);
    expect(res1.status).toBe(201);

    // Second request: same nonce (replay)
    const res2 = await request(app).post('/api/dt/flow/ticket-hold').set(headers).send(body);
    expect(res2.status).toBe(401);
    expect(res2.body.reason).toBe('NONCE_REUSED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-09: DB 장애 시 실패 처리 + ops SMS
// ─────────────────────────────────────────────────────────────────────────────
describe('S-09: DB 장애 → 500 + ops SMS', () => {
  const php = new PhpHmacAdapter(TEST_SECRET);

  test('ticket-book DB INSERT 오류 → 500 + ops SMS', async () => {
    const smsMock = jest.fn().mockResolvedValue('ok');

    // Need a real hold first, then fail on booking INSERT
    const dbSetup = makeMockDb();
    const appSetup = makeApp(dbSetup);
    const holdBody = { inventory_id: TEST_INV_ID };
    const holdHdrs = php.buildHeaders('POST', '/ticket-hold', holdBody);
    const holdRes  = await request(appSetup).post('/api/dt/flow/ticket-hold').set(holdHdrs).send(holdBody);
    const holdId   = holdRes.body.hold_id;
    const holdRecord = dbSetup._holds.get(holdId);

    // Now use a db that fails on booking INSERT
    const dbFail = makeMockDb({ bookingInsertError: new Error('PG connection lost') });
    // But the hold must exist in the fail db
    dbFail._holds.set(holdId, holdRecord);
    const appFail = makeApp(dbFail, smsMock);

    const bookBody = { hold_id: holdId, ticket_order_id: 'ORD-DBFAIL-001', ticket_paid_at: new Date().toISOString() };
    const bookHdrs = php.buildHeaders('POST', '/ticket-book', bookBody);
    const res      = await request(appFail).post('/api/dt/flow/ticket-book').set(bookHdrs).send(bookBody);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('INTERNAL_ERROR');
    expect(smsMock).toHaveBeenCalledTimes(1);
    expect(smsMock.mock.calls[0][1]).toMatch(/ticket-book DB 오류/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S-10: ops SMS 실패 → 사건 추적 (console.error)
// ─────────────────────────────────────────────────────────────────────────────
describe('S-10: ops SMS 실패 → console.error 기록', () => {
  const php = new PhpHmacAdapter(TEST_SECRET);

  test('ops SMS 실패해도 API는 원래 응답 반환', async () => {
    const smsMock = jest.fn().mockRejectedValue(new Error('SENS API 오류'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const dbSetup = makeMockDb();
    const appSetup = makeApp(dbSetup);
    const holdBody = { inventory_id: TEST_INV_ID };
    const holdHdrs = php.buildHeaders('POST', '/ticket-hold', holdBody);
    const holdRes  = await request(appSetup).post('/api/dt/flow/ticket-hold').set(holdHdrs).send(holdBody);
    const holdId   = holdRes.body.hold_id;
    const holdRecord = dbSetup._holds.get(holdId);

    const dbFail = makeMockDb({ bookingInsertError: new Error('DB error') });
    dbFail._holds.set(holdId, holdRecord);
    const appFail = makeApp(dbFail, smsMock);

    const bookBody = { hold_id: holdId, ticket_order_id: 'ORD-SMSFAIL-001', ticket_paid_at: new Date().toISOString() };
    const bookHdrs = php.buildHeaders('POST', '/ticket-book', bookBody);
    const res      = await request(appFail).post('/api/dt/flow/ticket-book').set(bookHdrs).send(bookBody);

    // API still returns 500 (original error)
    expect(res.status).toBe(500);
    // SMS was attempted
    expect(smsMock).toHaveBeenCalledTimes(1);
    // Error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/ops SMS failed/),
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });
});
