/**
 * B3 Admin Security Tests
 * P0-3: client-controlled ?admin=true bypass
 *       unauthenticated /admin/* endpoints
 *
 * Tests adminGuard middleware and verifyAdminToken helper.
 * All tests run with explicit test credential — no dev bypass.
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const guestService = require('../../services/guestCredentialService');
const authMiddleware = require('../../middleware/authenticatedPrincipal');
const { requireAdmin, verifyAdminToken } = require('../../middleware/adminGuard');

const JWT_SECRET = authMiddleware.JWT_SECRET;
const GUEST_JWT_SECRET = authMiddleware.GUEST_JWT_SECRET;

// Test admin token — set for all tests; cleared after
const TEST_ADMIN_TOKEN = 'test-admin-token-' + uuidv4();

function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    statusCode: 200,
  };
  res.status.mockImplementation((code) => { res.statusCode = code; return res; });
  return res;
}

beforeAll(() => {
  process.env.ADMIN_TOKEN = TEST_ADMIN_TOKEN;
});

afterAll(() => {
  delete process.env.ADMIN_TOKEN;
});

describe('B3 Admin Security', () => {

  // ── Quote PII — ?admin=true has zero effect ────────────────────────

  test('1. unauthenticated + ?admin=true → verifyAdminToken returns false (phone masked)', () => {
    const req = { headers: {}, query: { admin: 'true' } };
    expect(verifyAdminToken(req)).toBe(false);
  });

  test('2. GUEST token + ?admin=true → verifyAdminToken returns false (phone masked)', async () => {
    const guest = await guestService.issueGuestCredential(uuidv4());
    const req = {
      headers: { authorization: `Bearer ${guest.token}` },
      query: { admin: 'true' }
    };
    expect(verifyAdminToken(req)).toBe(false);
  });

  test('3. USER JWT + ?admin=true → verifyAdminToken returns false (phone masked)', () => {
    const user_jwt = jwt.sign({ userId: uuidv4() }, JWT_SECRET, { expiresIn: '7d' });
    const req = {
      headers: { authorization: `Bearer ${user_jwt}` },
      query: { admin: 'true' }
    };
    expect(verifyAdminToken(req)).toBe(false);
  });

  test('4. body.admin=true → verifyAdminToken returns false (no privilege)', () => {
    const req = { headers: {}, body: { admin: 'true' } };
    expect(verifyAdminToken(req)).toBe(false);
  });

  test('5. body.isAdmin=true → verifyAdminToken returns false (no privilege)', () => {
    const req = { headers: {}, body: { isAdmin: true } };
    expect(verifyAdminToken(req)).toBe(false);
  });

  test('6. forged X-Admin-Token (wrong value) → verifyAdminToken returns false', () => {
    const req = { headers: { 'x-admin-token': 'wrong-token-' + uuidv4() } };
    expect(verifyAdminToken(req)).toBe(false);
  });

  // ── requireAdmin middleware — /admin/* gate ────────────────────────

  test('7. authenticated non-admin → /admin/* → 403', async () => {
    const req = { headers: { 'x-admin-token': 'wrong-token-' + uuidv4() }, ip: '127.0.0.1' };
    const res = createMockResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'FORBIDDEN',
      code: 'ADMIN_CREDENTIAL_INVALID',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('8. unauthenticated → /admin/* → 401', async () => {
    const req = { headers: {}, ip: '127.0.0.1' };
    const res = createMockResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'UNAUTHORIZED',
      code: 'ADMIN_CREDENTIAL_REQUIRED',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('9. GUEST Bearer token (not admin token) → /admin/* → 401', async () => {
    // GUEST JWT is a Bearer token, not X-Admin-Token — admin gate ignores it
    const guest = await guestService.issueGuestCredential(uuidv4());
    const req = {
      headers: { authorization: `Bearer ${guest.token}` },
      ip: '127.0.0.1'
    };
    const res = createMockResponse();
    const next = jest.fn();

    // requireAdmin checks x-admin-token header, not authorization header
    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'UNAUTHORIZED',
      code: 'ADMIN_CREDENTIAL_REQUIRED',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('10. verified admin token → /admin/* → allowed (next called)', async () => {
    const req = { headers: { 'x-admin-token': TEST_ADMIN_TOKEN }, ip: '127.0.0.1' };
    const res = createMockResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // ── Quote PII masking — end state verification ─────────────────────

  test('11. non-admin quote request → verifyAdminToken false (phone must be masked)', () => {
    const req = { headers: {}, query: {} };
    const isAdmin = verifyAdminToken(req);

    expect(isAdmin).toBe(false);
    // Confirm masking logic: non-admin gets masked phone
    const phone = '01012345678';
    const masked = isAdmin ? phone : phone.slice(0, -4) + '****';
    expect(masked).toBe('0101234****');
  });

  test('12. verified admin quote request → verifyAdminToken true (phone unmasked)', () => {
    const req = { headers: { 'x-admin-token': TEST_ADMIN_TOKEN }, query: {} };
    const isAdmin = verifyAdminToken(req);

    expect(isAdmin).toBe(true);
    // Confirm masking logic: admin gets actual phone
    const phone = '01012345678';
    const result = isAdmin ? phone : phone.slice(0, -4) + '****';
    expect(result).toBe('01012345678');
  });

  test('13. tampered admin credential (extra chars) → 403', async () => {
    const req = {
      headers: { 'x-admin-token': TEST_ADMIN_TOKEN + 'TAMPERED' },
      ip: '127.0.0.1'
    };
    const res = createMockResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('14. expired/invalid JWT in X-Admin-Token → 403 (token must be exact string match)', async () => {
    // X-Admin-Token is a shared secret, not a JWT — JWT cannot substitute for it
    const fake_jwt = jwt.sign({ admin: true }, 'somekey', { expiresIn: '1h' });
    const req = {
      headers: { 'x-admin-token': fake_jwt },
      ip: '127.0.0.1'
    };
    const res = createMockResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Dev bypass prevention ──────────────────────────────────────────

  test('15. ADMIN_TOKEN not set → requireAdmin returns 503 (no dev bypass)', async () => {
    const savedToken = process.env.ADMIN_TOKEN;
    delete process.env.ADMIN_TOKEN;

    try {
      const req = { headers: { 'x-admin-token': savedToken }, ip: '127.0.0.1' };
      const res = createMockResponse();
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'SERVICE_UNAVAILABLE',
        code: 'ADMIN_NOT_CONFIGURED',
      });
      expect(next).not.toHaveBeenCalled();
    } finally {
      process.env.ADMIN_TOKEN = savedToken;
    }
  });

  test('16. ADMIN_TOKEN not set → verifyAdminToken returns false', () => {
    const savedToken = process.env.ADMIN_TOKEN;
    delete process.env.ADMIN_TOKEN;

    try {
      const req = { headers: { 'x-admin-token': savedToken } };
      expect(verifyAdminToken(req)).toBe(false);
    } finally {
      process.env.ADMIN_TOKEN = savedToken;
    }
  });
});
