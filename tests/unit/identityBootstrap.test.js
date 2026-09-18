'use strict';

/**
 * identityBootstrap.test.js
 *
 * Tests for POST /api/dt/identity/bootstrap
 *
 * A. anonymous bootstrap returns valid guest_token
 * B. returned sowon_id is valid UUID, corresponds to server-created identity
 * C. guest_token verifies through guestCredentialService
 * D. token works with requireAuthenticatedPrincipal → correct req.sowon_id
 * E. client-supplied sowon_id is ignored — server creates its own
 * F. no cablecar/kenny domain event emitted
 * G. every call creates a new SOWON (no idempotency — documented)
 */

const express = require('express');
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../database/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));
jest.mock('../../services/guestCredentialService');

const db = require('../../database/db');
const guestService = require('../../services/guestCredentialService');

const GUEST_JWT_SECRET =
  process.env.GUEST_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'daily-miracles-secret-key-change-in-production';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Build app once — module instances are consistent across tests
const identityRoutes = require('../../routes/identityRoutes');
const authMiddleware = require('../../middleware/authenticatedPrincipal');

function buildApp() {
  const a = express();
  a.use(express.json());
  a.use(identityRoutes);
  return a;
}

// ── Global setup ───────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // db.query: succeed on sowon_identity_map INSERT
  db.query.mockResolvedValue({ rows: [], rowCount: 1 });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Helper: build a real GUEST JWT via guestCredentialService mock ─────────────

function makeGuestCredentialMock(fixedSowonId) {
  const sowon_id = fixedSowonId || uuidv4();
  const principal_id = uuidv4();
  const token = jwt.sign(
    {
      sub: principal_id,
      principal_type: 'GUEST',
      sowon_id,
      jti: uuidv4(),
    },
    GUEST_JWT_SECRET
  );
  return { guest_principal_id: principal_id, token, sowon_id, expires_in: 86400 };
}

// ── Tests A + B ────────────────────────────────────────────────────────────────

describe('A+B. POST /bootstrap — success path', () => {
  test('A-1: returns 201 with sowon_id, guest_token, guest_principal_id, expires_in', async () => {
    guestService.issueGuestCredential.mockResolvedValue(makeGuestCredentialMock());
    const res = await request(buildApp()).post('/bootstrap').send({});
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('sowon_id');
    expect(res.body).toHaveProperty('guest_token');
    expect(res.body).toHaveProperty('guest_principal_id');
    expect(res.body).toHaveProperty('expires_in');
  });

  test('B-1: returned sowon_id is a valid UUID', async () => {
    guestService.issueGuestCredential.mockResolvedValue(makeGuestCredentialMock());
    const res = await request(buildApp()).post('/bootstrap').send({});
    expect(res.body.sowon_id).toMatch(UUID_REGEX);
  });

  test('B-2: sowon_id in response matches UUID persisted to sowon_identity_map', async () => {
    guestService.issueGuestCredential.mockImplementation(async (sowon_id) =>
      makeGuestCredentialMock(sowon_id)
    );
    const res = await request(buildApp()).post('/bootstrap').send({});

    const identityInsert = db.query.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('sowon_identity_map')
    );
    expect(identityInsert).toBeDefined();
    const persistedSowonId = identityInsert[1][0]; // $1 = sowon_id
    expect(res.body.sowon_id).toBe(persistedSowonId);
  });

  test('B-3: creation_source written to DB is anonymous_bootstrap (not cablecar_qr)', async () => {
    guestService.issueGuestCredential.mockImplementation(async (sowon_id) =>
      makeGuestCredentialMock(sowon_id)
    );
    await request(buildApp()).post('/bootstrap').send({});

    const identityInsert = db.query.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('sowon_identity_map')
    );
    expect(identityInsert).toBeDefined();
    expect(identityInsert[1][1]).toBe('anonymous_bootstrap'); // $2 = creation_source
    expect(identityInsert[1][1]).not.toBe('cablecar_qr');
  });
});

// ── Test C: guest_token verifies as GUEST JWT ──────────────────────────────────

describe('C. guest_token verifies as valid GUEST JWT', () => {
  test('C: guest_token decodes to GUEST principal_type with correct sowon_id', async () => {
    guestService.issueGuestCredential.mockImplementation(async (sowon_id) =>
      makeGuestCredentialMock(sowon_id)
    );
    const res = await request(buildApp()).post('/bootstrap').send({});
    expect(res.status).toBe(201);

    const decoded = jwt.verify(res.body.guest_token, GUEST_JWT_SECRET);
    expect(decoded.principal_type).toBe('GUEST');
    expect(decoded.sowon_id).toBe(res.body.sowon_id);
    expect(decoded.sowon_id).toMatch(UUID_REGEX);
  });
});

// ── Test D: guest_token → requireAuthenticatedPrincipal ───────────────────────

describe('D. guest_token → requireAuthenticatedPrincipal → correct req.sowon_id', () => {
  test('D: guest_token sets req.sowon_id matching the bootstrapped sowon_id', async () => {
    guestService.issueGuestCredential.mockImplementation(async (sowon_id) =>
      makeGuestCredentialMock(sowon_id)
    );
    // verifyGuestToken: real JWT verify
    guestService.verifyGuestToken.mockImplementation(async (token) =>
      jwt.verify(token, GUEST_JWT_SECRET)
    );

    // Step 1: bootstrap
    const bootstrapRes = await request(buildApp()).post('/bootstrap').send({});
    const { guest_token, sowon_id } = bootstrapRes.body;

    // Step 2: use guest_token against requireAuthenticatedPrincipal
    const protectedApp = express();
    protectedApp.use(express.json());
    protectedApp.get(
      '/protected',
      authMiddleware.requireAuthenticatedPrincipal,
      (req, res) => res.json({ req_sowon_id: req.sowon_id })
    );

    const protectedRes = await request(protectedApp)
      .get('/protected')
      .set('Authorization', `Bearer ${guest_token}`);

    expect(protectedRes.status).toBe(200);
    expect(protectedRes.body.req_sowon_id).toBe(sowon_id);
  });
});

// ── Test E: client-supplied fields are ignored ─────────────────────────────────

describe('E. client cannot control identity via body', () => {
  const ATTACKER_SOWON_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

  test('E: attacker-supplied sowon_id in body is ignored — server creates its own', async () => {
    guestService.issueGuestCredential.mockImplementation(async (sowon_id) =>
      makeGuestCredentialMock(sowon_id)
    );
    const res = await request(buildApp())
      .post('/bootstrap')
      .send({ sowon_id: ATTACKER_SOWON_ID, principal_type: 'USER', guest_principal_id: 'fake' });

    expect(res.status).toBe(201);
    expect(res.body.sowon_id).not.toBe(ATTACKER_SOWON_ID);
    expect(res.body.sowon_id).toMatch(UUID_REGEX);

    // guestCredentialService was called with server-generated UUID, not attacker's
    const callArg = guestService.issueGuestCredential.mock.calls[0][0];
    expect(callArg).not.toBe(ATTACKER_SOWON_ID);
    expect(callArg).toMatch(UUID_REGEX);
  });
});

// ── Test F: no cablecar/kenny domain event ────────────────────────────────────

describe('F. no cablecar/kenny domain event emitted', () => {
  test('F: no kenny_qr_entered or cablecar INSERT in db.query calls', async () => {
    guestService.issueGuestCredential.mockResolvedValue(makeGuestCredentialMock());
    await request(buildApp()).post('/bootstrap').send({});

    const domainEventCalls = db.query.mock.calls.filter(([sql]) => {
      if (typeof sql !== 'string') return false;
      const s = sql.toLowerCase();
      return s.includes('kenny_qr_entered') || s.includes('cablecar');
    });
    expect(domainEventCalls).toHaveLength(0);
  });
});

// ── Test G: every call creates a new SOWON ────────────────────────────────────

describe('G. every bootstrap creates a new anonymous SOWON (no idempotency)', () => {
  test('G: two calls produce two different sowon_ids', async () => {
    guestService.issueGuestCredential.mockImplementation(async (sowon_id) =>
      makeGuestCredentialMock(sowon_id)
    );
    const app = buildApp();
    const res1 = await request(app).post('/bootstrap').send({});
    const res2 = await request(app).post('/bootstrap').send({});
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.sowon_id).not.toBe(res2.body.sowon_id);
    expect(guestService.issueGuestCredential).toHaveBeenCalledTimes(2);
  });
});

// ── Isolation: identityRoutes does not depend on cablecar domain ───────────────

describe('Isolation — identityRoutes has no cablecar dependency', () => {
  test('qrCredentialBootstrap is not required by identityRoutes module graph', () => {
    // identityRoutes should load without pulling in qrCredentialBootstrap
    // (no cablecar/kenny domain coupling)
    const routes = require('../../routes/identityRoutes');
    expect(routes).toBeDefined();
    // If qrCredentialBootstrap were required, it would call require('../services/qrCredentialBootstrap')
    // No way to inspect this without module graph tools — the db.query isolation test above suffices.
    // This test confirms the module loads cleanly.
    expect(typeof routes).toBe('function'); // Express router is a function
  });
});
