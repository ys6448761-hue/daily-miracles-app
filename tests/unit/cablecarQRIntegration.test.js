/**
 * B1-QR Integration Tests
 * Tests the QR entry credential resolution (3-path) and bootstrap logic
 * Validates SOWON_ID continuity, INVALID credential fail-closed, client override prevention
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ── Mock sowonIdentityService (requires DB) before any module imports ──
// Factory exposes a shared createAnonymousSowon fn both on the constructor (for test assertions)
// and on each instance (for the code under test which uses: new SowonIdentityService(db).createAnonymousSowon())
jest.mock('../../services/sowonIdentityService', () => {
  const createAnonymousSowon = jest.fn();
  const MockClass = jest.fn().mockImplementation(() => ({ createAnonymousSowon }));
  MockClass.createAnonymousSowon = createAnonymousSowon;
  return MockClass;
});
const sowonService = require('../../services/sowonIdentityService');

// Real guestCredentialService (no DB dependency)
const guestService = require('../../services/guestCredentialService');
const authMiddleware = require('../../middleware/authenticatedPrincipal');

// System under test (after mocks registered)
const { resolveQRPrincipal, performQRBootstrap } = require('../../services/qrCredentialBootstrap');

const JWT_SECRET = authMiddleware.JWT_SECRET;
const GUEST_JWT_SECRET = authMiddleware.GUEST_JWT_SECRET;

function makeReq(authToken = null, body = {}) {
  return {
    headers: authToken ? { authorization: `Bearer ${authToken}` } : {},
    body,
    ip: '127.0.0.1'
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('B1-QR Integration', () => {

  // ─────────────────────────────────────────────────────────
  // Tests 1–3: PATH A — No credential (first-time QR visitor)
  // ─────────────────────────────────────────────────────────

  test('1. No credential → PATH A resolved, Guest token issued', async () => {
    const mockSowonId = uuidv4();
    sowonService.createAnonymousSowon.mockResolvedValueOnce({ sowon_id: mockSowonId });

    const principal = await resolveQRPrincipal(makeReq());
    expect(principal.path).toBe('A');

    const bootstrap = await performQRBootstrap();
    expect(bootstrap.guest_token).toBeDefined();
    expect(bootstrap.guest_principal_id).toBeDefined();
  });

  test('2. No credential → Anonymous SOWON_ID created via service', async () => {
    const mockSowonId = uuidv4();
    sowonService.createAnonymousSowon.mockResolvedValueOnce({ sowon_id: mockSowonId });

    await performQRBootstrap();

    expect(sowonService.createAnonymousSowon).toHaveBeenCalledTimes(1);
    expect(sowonService.createAnonymousSowon).toHaveBeenCalledWith('cablecar_qr');
  });

  test('3. Issued Guest token → signed sowon_id equals created SOWON_ID', async () => {
    const mockSowonId = uuidv4();
    sowonService.createAnonymousSowon.mockResolvedValueOnce({ sowon_id: mockSowonId });

    const bootstrap = await performQRBootstrap();

    const decoded = jwt.decode(bootstrap.guest_token);
    expect(decoded.sowon_id).toBe(mockSowonId);
    expect(decoded.sowon_id).toBe(bootstrap.sowon_id);
  });

  // ─────────────────────────────────────────────────────────
  // Tests 4–6: PATH B — Returning Guest (valid GUEST token)
  // ─────────────────────────────────────────────────────────

  test('4. Returning valid Guest → same principal (PATH B)', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    const principal = await resolveQRPrincipal(makeReq(guest.token));

    expect(principal.path).toBe('B');
    expect(principal.principal_type).toBe('GUEST');
    expect(principal.principal_id).toBe(guest.guest_principal_id);
  });

  test('5. Returning valid Guest → same SOWON_ID recovered from JWT', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    const principal = await resolveQRPrincipal(makeReq(guest.token));

    expect(principal.sowon_id).toBe(sowon_id);
  });

  test('6. Returning valid Guest → no new Anonymous SOWON_ID created', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    await resolveQRPrincipal(makeReq(guest.token));

    expect(sowonService.createAnonymousSowon).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // Tests 7–8: PATH C — Logged-in USER JWT
  // ─────────────────────────────────────────────────────────

  test('7. Valid USER JWT → remains USER (PATH C)', async () => {
    const user_jwt = jwt.sign(
      { userId: uuidv4(), email: 'user@test.com' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const principal = await resolveQRPrincipal(makeReq(user_jwt));

    expect(principal.path).toBe('C');
    expect(principal.principal_type).toBe('USER');
  });

  test('8. USER JWT → no Guest credential issued, sowon_id null (D2 preserved)', async () => {
    const user_jwt = jwt.sign(
      { userId: uuidv4(), email: 'user@test.com' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const principal = await resolveQRPrincipal(makeReq(user_jwt));

    expect(principal.guest_token).toBeUndefined();
    expect(principal.sowon_id).toBeNull();
    expect(sowonService.createAnonymousSowon).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // Tests 9–10: INVALID credential — fail-closed
  // ─────────────────────────────────────────────────────────

  test('9. Tampered Guest token → INVALID (not treated as no-credential)', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);
    const tampered = guest.token + 'TAMPERED';

    const principal = await resolveQRPrincipal(makeReq(tampered));

    expect(principal.path).toBe('INVALID');
    // Must NOT fall through to PATH A bootstrap
    expect(sowonService.createAnonymousSowon).not.toHaveBeenCalled();
  });

  test('10. Expired Guest token → INVALID (fail-closed)', async () => {
    const expired = jwt.sign(
      { sub: uuidv4(), principal_type: 'GUEST', sowon_id: uuidv4(), jti: uuidv4() },
      GUEST_JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const principal = await resolveQRPrincipal(makeReq(expired));

    expect(principal.path).toBe('INVALID');
    expect(sowonService.createAnonymousSowon).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // Tests 11–13: Client-supplied identity fields ignored
  // ─────────────────────────────────────────────────────────

  test('11. body.user_id alone → PATH A (cannot establish principal)', async () => {
    const req = makeReq(null, { user_id: uuidv4() });
    const principal = await resolveQRPrincipal(req);

    expect(principal.path).toBe('A');
    expect(principal.principal_id).toBeUndefined();
    expect(principal.sowon_id).toBeUndefined();
  });

  test('12. body.sowon_id alone → PATH A (cannot override signed identity)', async () => {
    const req = makeReq(null, { sowon_id: uuidv4() });
    const principal = await resolveQRPrincipal(req);

    expect(principal.path).toBe('A');
    expect(principal.principal_id).toBeUndefined();
  });

  test('13. Guest A token + body.sowon_id=B → remains Guest A SOWON_ID', async () => {
    const sowon_A = uuidv4();
    const sowon_B = uuidv4();
    const guestA = await guestService.issueGuestCredential(sowon_A);

    const req = makeReq(guestA.token, { sowon_id: sowon_B });
    const principal = await resolveQRPrincipal(req);

    expect(principal.path).toBe('B');
    expect(principal.sowon_id).toBe(sowon_A);
    expect(principal.sowon_id).not.toBe(sowon_B);
  });

  // ─────────────────────────────────────────────────────────
  // Test 14: Repeated QR scan — identity continuity
  // ─────────────────────────────────────────────────────────

  test('14. Repeated QR scan with valid Guest credential → identity continuity', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    // First scan
    const principal1 = await resolveQRPrincipal(makeReq(guest.token));
    // Second scan (same token)
    const principal2 = await resolveQRPrincipal(makeReq(guest.token));

    expect(principal1.path).toBe('B');
    expect(principal2.path).toBe('B');
    expect(principal1.principal_id).toBe(principal2.principal_id);
    expect(principal1.sowon_id).toBe(principal2.sowon_id);
    // Must NOT create new identity on repeat scans
    expect(sowonService.createAnonymousSowon).not.toHaveBeenCalled();
  });
});
