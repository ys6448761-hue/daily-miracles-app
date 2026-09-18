'use strict';

/**
 * guestCredentialServiceTTL.test.js
 *
 * TEST 6 — server-issued credential TTL = 30 days
 *
 * Verifies:
 *   - expires_in = 30 * 24 * 60 * 60 = 2,592,000 seconds
 *   - NOT 24 hours (86,400 seconds)
 *   - NOT accidental 24 days (2,073,600 seconds — from old parseFloat('24h') bug)
 *   - JWT exp - iat matches expires_in exactly
 *   - GUEST_TOKEN_TTL_DAYS env override works
 */

const jwt   = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const THIRTY_DAYS  = 30 * 24 * 60 * 60; // 2,592,000
const TWENTY_FOUR_HOURS = 24 * 60 * 60;  // 86,400 — old intent
const OLD_BUG_TTL = 24 * 24 * 60 * 60;  // 2,073,600 — old parseFloat('24h') result

describe('TEST 6 — guestCredentialService: 30-day TTL policy', () => {
  let guestCredentialService;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.GUEST_TOKEN_TTL_DAYS;
    guestCredentialService = require('../../services/guestCredentialService');
  });

  afterEach(() => {
    delete process.env.GUEST_TOKEN_TTL_DAYS;
  });

  test('default TTL = 30 days (2,592,000 seconds)', async () => {
    const result = await guestCredentialService.issueGuestCredential(uuidv4());

    expect(result.expires_in).toBe(THIRTY_DAYS);
    expect(result.expires_in).not.toBe(TWENTY_FOUR_HOURS);
    expect(result.expires_in).not.toBe(OLD_BUG_TTL);
  });

  test('JWT exp − iat matches expires_in exactly (30 days)', async () => {
    const result = await guestCredentialService.issueGuestCredential(uuidv4());
    const decoded = jwt.decode(result.token);

    const actualTTL = decoded.exp - decoded.iat;
    expect(actualTTL).toBe(THIRTY_DAYS);
    expect(actualTTL).not.toBe(TWENTY_FOUR_HOURS);
    expect(actualTTL).not.toBe(OLD_BUG_TTL);
  });

  test('JWT is verifiable and contains GUEST principal_type', async () => {
    const sowon_id = uuidv4();
    const result = await guestCredentialService.issueGuestCredential(sowon_id);

    const GUEST_JWT_SECRET =
      process.env.GUEST_JWT_SECRET ||
      process.env.JWT_SECRET ||
      'daily-miracles-secret-key-change-in-production';

    const decoded = jwt.verify(result.token, GUEST_JWT_SECRET);
    expect(decoded.principal_type).toBe('GUEST');
    expect(decoded.sowon_id).toBe(sowon_id);
  });

  test('GUEST_TOKEN_TTL_DAYS=7 env override → 7-day TTL', async () => {
    process.env.GUEST_TOKEN_TTL_DAYS = '7';
    jest.resetModules();
    const svc = require('../../services/guestCredentialService');

    const result = await svc.issueGuestCredential(uuidv4());
    const sevenDays = 7 * 24 * 60 * 60;
    expect(result.expires_in).toBe(sevenDays);
  });

  test('verifyGuestToken accepts a valid token and rejects an expired one', async () => {
    const result = await guestCredentialService.issueGuestCredential(uuidv4());
    // Valid: should not throw
    const decoded = await guestCredentialService.verifyGuestToken(result.token);
    expect(decoded.principal_type).toBe('GUEST');

    // Expired: manually create an expired JWT
    const GUEST_JWT_SECRET =
      process.env.GUEST_JWT_SECRET ||
      process.env.JWT_SECRET ||
      'daily-miracles-secret-key-change-in-production';
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.sign(
      { sub: uuidv4(), principal_type: 'GUEST', sowon_id: uuidv4(), jti: uuidv4(),
        exp: nowSeconds - 60 },
      GUEST_JWT_SECRET
    );
    await expect(guestCredentialService.verifyGuestToken(expiredToken))
      .rejects.toThrow('GUEST_TOKEN_EXPIRED');
  });
});
