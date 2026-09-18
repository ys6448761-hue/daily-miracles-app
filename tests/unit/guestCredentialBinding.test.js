/**
 * B1-Credential Binding Tests
 * Verifies SOWON_ID is cryptographically bound to GUEST JWT
 * and that req.sowon_id is set from signed claim only — never client-controlled
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const guestService = require('../../services/guestCredentialService');
const authMiddleware = require('../../middleware/authenticatedPrincipal');

function createMockRequest(authHeader = null, body = {}, query = {}) {
  return {
    headers: authHeader ? { authorization: `Bearer ${authHeader}` } : {},
    body,
    query,
    ip: '127.0.0.1'
  };
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

describe('B1-Credential Binding', () => {

  // ─────────────────────────────────────────────────────────
  // Test B1-1: sowon_id present in issued GUEST JWT payload
  // ─────────────────────────────────────────────────────────
  test('B1-1. issued GUEST JWT contains sowon_id claim', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    const decoded = jwt.decode(guest.token);
    expect(decoded.sowon_id).toBe(sowon_id);
    expect(decoded.principal_type).toBe('GUEST');
    expect(decoded.sub).toBe(guest.guest_principal_id);
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-2: sowon_id is a valid UUID in issued token
  // ─────────────────────────────────────────────────────────
  test('B1-2. sowon_id in JWT is UUID format', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    const decoded = jwt.decode(guest.token);
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(UUID_REGEX.test(decoded.sowon_id)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-3: req.sowon_id set from verified JWT — not from body
  // ─────────────────────────────────────────────────────────
  test('B1-3. req.sowon_id is set from JWT claim after middleware', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    const req = createMockRequest(guest.token);
    const res = createMockResponse();
    const next = jest.fn();

    await authMiddleware.requireAuthenticatedPrincipal(req, res, next);

    expect(req.sowon_id).toBe(sowon_id);
    expect(next).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-4: body.sowon_id cannot override req.sowon_id
  // ─────────────────────────────────────────────────────────
  test('B1-4. body.sowon_id does not override req.sowon_id', async () => {
    const real_sowon_id = uuidv4();
    const fake_sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(real_sowon_id);

    const req = createMockRequest(guest.token, { sowon_id: fake_sowon_id });
    const res = createMockResponse();
    const next = jest.fn();

    await authMiddleware.requireAuthenticatedPrincipal(req, res, next);

    expect(req.sowon_id).toBe(real_sowon_id);
    expect(req.sowon_id).not.toBe(fake_sowon_id);
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-5: query.sowon_id cannot override req.sowon_id
  // ─────────────────────────────────────────────────────────
  test('B1-5. query.sowon_id does not override req.sowon_id', async () => {
    const real_sowon_id = uuidv4();
    const fake_sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(real_sowon_id);

    const req = createMockRequest(guest.token, {}, { sowon_id: fake_sowon_id });
    const res = createMockResponse();
    const next = jest.fn();

    await authMiddleware.requireAuthenticatedPrincipal(req, res, next);

    expect(req.sowon_id).toBe(real_sowon_id);
    expect(req.sowon_id).not.toBe(fake_sowon_id);
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-6: GUEST token without sowon_id claim → rejected
  // ─────────────────────────────────────────────────────────
  test('B1-6. GUEST token missing sowon_id claim → 401', async () => {
    const token = jwt.sign(
      { sub: uuidv4(), principal_type: 'GUEST', jti: uuidv4() },
      authMiddleware.GUEST_JWT_SECRET,
      { expiresIn: '1h' }
    );

    const req = createMockRequest(token);
    const res = createMockResponse();
    const next = jest.fn();

    await authMiddleware.requireAuthenticatedPrincipal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'UNAUTHORIZED',
      code: 'INVALID_CREDENTIAL'
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-7: GUEST token with non-UUID sowon_id → rejected
  // ─────────────────────────────────────────────────────────
  test('B1-7. GUEST token with non-UUID sowon_id → 401', async () => {
    const token = jwt.sign(
      { sub: uuidv4(), principal_type: 'GUEST', sowon_id: 'not-a-uuid', jti: uuidv4() },
      authMiddleware.GUEST_JWT_SECRET,
      { expiresIn: '1h' }
    );

    const req = createMockRequest(token);
    const res = createMockResponse();
    const next = jest.fn();

    await authMiddleware.requireAuthenticatedPrincipal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-8: verifyGuestToken rejects non-UUID sowon_id
  // ─────────────────────────────────────────────────────────
  test('B1-8. verifyGuestToken throws on non-UUID sowon_id', async () => {
    const token = jwt.sign(
      { sub: uuidv4(), principal_type: 'GUEST', sowon_id: 'sowon_LEGACY', jti: uuidv4() },
      authMiddleware.GUEST_JWT_SECRET,
      { expiresIn: '1h' }
    );

    await expect(guestService.verifyGuestToken(token)).rejects.toThrow('GUEST_TOKEN_INVALID');
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-9: USER JWT does not set req.sowon_id
  // ─────────────────────────────────────────────────────────
  test('B1-9. USER JWT → req.sowon_id not set (D2 preserved)', async () => {
    const user_jwt = jwt.sign(
      { userId: uuidv4(), email: 'user@test.com' },
      authMiddleware.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const req = createMockRequest(user_jwt);
    const res = createMockResponse();
    const next = jest.fn();

    await authMiddleware.requireAuthenticatedPrincipal(req, res, next);

    expect(req.principal.principal_type).toBe('USER');
    expect(req.sowon_id).toBeUndefined();
  });

  // ─────────────────────────────────────────────────────────
  // Test B1-10: sowon_id preserved across server restart simulation
  // ─────────────────────────────────────────────────────────
  test('B1-10. sowon_id recoverable from JWT after map cleared (restart simulation)', async () => {
    const sowon_id = uuidv4();
    const guest = await guestService.issueGuestCredential(sowon_id);

    // Simulate server restart: clear in-memory map
    const metadata_before = guestService.getGuestMetadata(guest.guest_principal_id);
    expect(metadata_before).not.toBeNull();

    guestService.revokeGuestCredential(guest.guest_principal_id); // clears map entry

    const metadata_after = guestService.getGuestMetadata(guest.guest_principal_id);
    expect(metadata_after).toBeNull(); // map is empty

    // But JWT still works — sowon_id recovered from signed claim
    const req = createMockRequest(guest.token);
    const res = createMockResponse();
    const next = jest.fn();

    await authMiddleware.requireAuthenticatedPrincipal(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.sowon_id).toBe(sowon_id); // recovered from JWT, not map
  });
});
