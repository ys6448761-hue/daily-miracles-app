/**
 * B2 Core — Negative Security Tests
 * P0-1: cross-SOWON wish isolation
 * P0-2: booking ownership verification
 *
 * Tests ownership logic via wishOwnershipService (pure, DB-injectable)
 * and auth boundary via requireAuthenticatedPrincipal middleware.
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const guestService = require('../../services/guestCredentialService');
const authMiddleware = require('../../middleware/authenticatedPrincipal');
const { resolveOwnerForCreation, verifyWishAccess } = require('../../services/wishOwnershipService');

const { requireAuthenticatedPrincipal } = authMiddleware;
const JWT_SECRET = authMiddleware.JWT_SECRET;
const GUEST_JWT_SECRET = authMiddleware.GUEST_JWT_SECRET;

// ── Helpers ───────────────────────────────────────────────────────────────

function createMockRequest(authToken = null, body = {}, query = {}) {
  const req = {
    headers: authToken ? { authorization: `Bearer ${authToken}` } : {},
    body,
    query,
    ip: '127.0.0.1'
  };
  return req;
}

function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    statusCode: 200
  };
  res.status.mockImplementation((code) => { res.statusCode = code; return res; });
  return res;
}

function createMockDb(rows = [], rowCount = null) {
  return {
    query: jest.fn().mockResolvedValue({
      rows,
      rowCount: rowCount ?? rows.length
    })
  };
}

function makeWishRow(owner_sowon_id) {
  return {
    id: uuidv4(),
    wish_text: '테스트 소원',
    status: 'draft_created',
    owner_sowon_id
  };
}

// ─────────────────────────────────────────────────────────────────────────
describe('B2 Core Security', () => {

  // ── Wish Creation Ownership ────────────────────────────────────────────

  test('1. Guest A creates wish → owner_sowon_id resolved from req.sowon_id', () => {
    const sowon_A = uuidv4();
    const req = { sowon_id: sowon_A, body: { wish_text: '소원' } };

    const result = resolveOwnerForCreation(req);

    expect(result.ok).toBe(true);
    expect(result.owner_sowon_id).toBe(sowon_A);
  });

  // ── Wish Read Ownership (P0-1) ─────────────────────────────────────────

  test('2. Guest A reads own wish → ALLOW', async () => {
    const sowon_A = uuidv4();
    const db = createMockDb([makeWishRow(sowon_A)]);

    const result = await verifyWishAccess('wish_id', sowon_A, db);

    expect(result.allowed).toBe(true);
    expect(result.wish.owner_sowon_id).toBe(sowon_A);
  });

  test('3. Guest A reads Guest B wish → CROSS_OWNER (403)', async () => {
    const sowon_A = uuidv4();
    const sowon_B = uuidv4();
    const db = createMockDb([makeWishRow(sowon_B)]);

    const result = await verifyWishAccess('wish_id', sowon_A, db);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('CROSS_OWNER');
  });

  test('4. Guest A mutates Guest B wish → CROSS_OWNER (403)', async () => {
    const sowon_A = uuidv4();
    const sowon_B = uuidv4();
    const db = createMockDb([makeWishRow(sowon_B)]);

    const result = await verifyWishAccess('wish_id', sowon_A, db);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('CROSS_OWNER');
  });

  // ── Booking Ownership (P0-2) ───────────────────────────────────────────

  test('5. Guest A books own wish → ALLOW', async () => {
    const sowon_A = uuidv4();
    const db = createMockDb([makeWishRow(sowon_A)]);

    const result = await verifyWishAccess('wish_id', sowon_A, db);

    expect(result.allowed).toBe(true);
  });

  test('6. Guest A books Guest B wish → CROSS_OWNER (403)', async () => {
    const sowon_A = uuidv4();
    const sowon_B = uuidv4();
    const db = createMockDb([makeWishRow(sowon_B)]);

    const result = await verifyWishAccess('wish_id', sowon_A, db);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('CROSS_OWNER');
  });

  // ── Client Identity Override Prevention ───────────────────────────────

  test('7. Guest A + body.sowon_id=B → req.sowon_id remains A (from JWT only)', async () => {
    const sowon_A = uuidv4();
    const sowon_B = uuidv4();
    const guestA = await guestService.issueGuestCredential(sowon_A);

    // Middleware: req.sowon_id must come from verified JWT, not body
    const req = createMockRequest(guestA.token, { sowon_id: sowon_B });
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    // req.sowon_id MUST be A (from JWT), not B (from body)
    expect(req.sowon_id).toBe(sowon_A);
    expect(req.sowon_id).not.toBe(sowon_B);
    expect(next).toHaveBeenCalled();
  });

  test('8. Guest A + body.user_id=B → req.sowon_id remains A', async () => {
    const sowon_A = uuidv4();
    const guestA = await guestService.issueGuestCredential(sowon_A);

    const req = createMockRequest(guestA.token, { user_id: uuidv4() });
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    expect(req.sowon_id).toBe(sowon_A);
    expect(next).toHaveBeenCalled();
  });

  test('9. Guest A + query.sowon_id=B → req.sowon_id remains A', async () => {
    const sowon_A = uuidv4();
    const guestA = await guestService.issueGuestCredential(sowon_A);

    const req = createMockRequest(guestA.token, {}, { sowon_id: uuidv4() });
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    expect(req.sowon_id).toBe(sowon_A);
    expect(next).toHaveBeenCalled();
  });

  // ── No Credential (401) ────────────────────────────────────────────────

  test('10. No credential → protected wish → 401', async () => {
    const req = createMockRequest(null);
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'UNAUTHORIZED',
      code: 'AUTHENTICATION_REQUIRED'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('11. No credential → booking → 401', async () => {
    const req = createMockRequest(null, { wish_id: uuidv4(), customer_name: '홍길동' });
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Legacy NULL Owner (fail-closed) ───────────────────────────────────

  test('12. owner_sowon_id NULL (legacy wish) → LEGACY_OWNER_NULL (fail-closed)', async () => {
    const sowon_A = uuidv4();
    const db = createMockDb([makeWishRow(null)]); // NULL owner = legacy

    const result = await verifyWishAccess('wish_id', sowon_A, db);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('LEGACY_OWNER_NULL');
  });

  // ── Invalid Credentials (401) ──────────────────────────────────────────

  test('13. Tampered Guest credential → 401', async () => {
    const guestA = await guestService.issueGuestCredential(uuidv4());
    const req = createMockRequest(guestA.token + 'TAMPERED');
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'UNAUTHORIZED',
      code: 'INVALID_CREDENTIAL'
    });
  });

  test('14. Expired Guest credential → 401', async () => {
    const expired = jwt.sign(
      { sub: uuidv4(), principal_type: 'GUEST', sowon_id: uuidv4(), jti: uuidv4() },
      GUEST_JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = createMockRequest(expired);
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ── USER without resolvable SOWON_ID (fail-closed) ────────────────────

  test('15. Authenticated USER without SOWON_ID → SOWON_ID_UNRESOLVED (fail-closed, never Guest fallback)', async () => {
    // USER JWT has no sowon_id claim (D2: DIFFERENT_OR_UNRESOLVED)
    const user_jwt = jwt.sign(
      { userId: uuidv4(), email: 'user@test.com' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const req = createMockRequest(user_jwt);
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthenticatedPrincipal(req, res, next);

    // Middleware accepts USER JWT — principal is set
    expect(next).toHaveBeenCalled();
    expect(req.principal.principal_type).toBe('USER');
    // But req.sowon_id is NOT set (D2: unresolved)
    expect(req.sowon_id).toBeUndefined();

    // Attempting wish creation with no sowon_id → fail-closed
    const creation = resolveOwnerForCreation(req);
    expect(creation.ok).toBe(false);
    expect(creation.reason).toBe('SOWON_ID_UNRESOLVED');

    // Attempting wish access with no sowon_id → fail-closed
    const db = createMockDb([makeWishRow(uuidv4())]);
    const access = await verifyWishAccess('wish_id', req.sowon_id, db);
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe('SOWON_ID_UNRESOLVED');
  });

  // ── Ownership Continuity ───────────────────────────────────────────────

  test('16. Guest A repeated requests → same SOWON_ID, same ownership result', async () => {
    const sowon_A = uuidv4();
    const guestA = await guestService.issueGuestCredential(sowon_A);

    // First request
    const req1 = createMockRequest(guestA.token);
    const res1 = createMockResponse();
    const next1 = jest.fn();
    await requireAuthenticatedPrincipal(req1, res1, next1);

    // Second request (same token)
    const req2 = createMockRequest(guestA.token);
    const res2 = createMockResponse();
    const next2 = jest.fn();
    await requireAuthenticatedPrincipal(req2, res2, next2);

    // Both requests resolve same sowon_id
    expect(req1.sowon_id).toBe(sowon_A);
    expect(req2.sowon_id).toBe(sowon_A);
    expect(req1.sowon_id).toBe(req2.sowon_id);

    // Both requests would pass ownership check for same wish
    const db1 = createMockDb([makeWishRow(sowon_A)]);
    const db2 = createMockDb([makeWishRow(sowon_A)]);

    const access1 = await verifyWishAccess('wish_id', req1.sowon_id, db1);
    const access2 = await verifyWishAccess('wish_id', req2.sowon_id, db2);

    expect(access1.allowed).toBe(true);
    expect(access2.allowed).toBe(true);
  });

  // ── Additional edge cases ──────────────────────────────────────────────

  test('17. verifyWishAccess with undefined sowon_id → SOWON_ID_UNRESOLVED', async () => {
    const db = createMockDb([makeWishRow(uuidv4())]);

    const result = await verifyWishAccess('wish_id', undefined, db);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SOWON_ID_UNRESOLVED');
  });

  test('18. wish not found → NOT_FOUND (no info leak)', async () => {
    const db = createMockDb([]); // empty = not found

    const result = await verifyWishAccess('nonexistent_id', uuidv4(), db);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('NOT_FOUND');
    expect(result.wish).toBeUndefined(); // no resource details leaked
  });
});
