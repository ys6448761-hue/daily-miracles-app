'use strict';

/**
 * kennyQrBootstrapInstance.test.js — REGRESSION GUARD for UNIT A
 *
 * Verifies that performQRBootstrap correctly constructs SowonIdentityService
 * as a class instance (new SowonIdentityService(db)) rather than calling
 * instance methods directly on the class constructor.
 *
 * CRITICAL: sowonIdentityService is NOT mocked in this file.
 *   If the code reverts to: sowonIdentityService.createAnonymousSowon(...)
 *   → TypeError: sowonIdentityService.createAnonymousSowon is not a function
 *   → this test FAILS, catching the regression immediately.
 *
 *   If the code correctly uses: new sowonIdentityService(dbClient).createAnonymousSowon(...)
 *   → succeeds (this.db = dbClient → db.query resolves) → PASS.
 */

// guestCredentialService is mocked (JWT infrastructure not needed here)
jest.mock('../../services/guestCredentialService');
// database/db is mocked (no real PostgreSQL needed)
jest.mock('../../database/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));
// sowonIdentityService is intentionally NOT mocked — real class must be used correctly

const guestService = require('../../services/guestCredentialService');
const db           = require('../../database/db');

// Suppress fire-and-forget event log (emitKennyQrEnteredEvent failure is expected without real DB)
beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));

beforeEach(() => {
  jest.clearAllMocks();

  // db.query mock: returns success for INSERT INTO sowon_identity_map
  // (SowonIdentityService.createAnonymousSowon calls this.db.query with the INSERT)
  db.query.mockResolvedValue({ rows: [], rowCount: 1 });

  guestService.issueGuestCredential.mockResolvedValue({
    token: 'guest-token-regression-test',
    guest_principal_id: 'gp-regression-001',
  });
});

it('T-INSTANCE performQRBootstrap constructs SowonIdentityService as instance — class direct call would throw', async () => {
  const { performQRBootstrap } = require('../../services/qrCredentialBootstrap');

  // If code calls: sowonIdentityService.createAnonymousSowon('cablecar_qr')
  //   SowonIdentityService.createAnonymousSowon = undefined → TypeError (test FAILS)
  //
  // If code calls: new sowonIdentityService(dbClient).createAnonymousSowon('cablecar_qr')
  //   this.db = dbClient → this.db.query resolves → sowon_id returned (test PASSES)
  const result = await performQRBootstrap(db);

  expect(result.guest_token).toBe('guest-token-regression-test');
  expect(typeof result.sowon_id).toBe('string');
  expect(result.sowon_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  // Verify SowonIdentityService.createAnonymousSowon was invoked via db.query
  // (the INSERT INTO sowon_identity_map call — proves this.db.query reached the real service method)
  const identityInsert = db.query.mock.calls.find(
    ([sql]) => typeof sql === 'string' && sql.includes('sowon_identity_map')
  );
  expect(identityInsert).toBeDefined();
  expect(identityInsert[1]).toHaveLength(4); // [sowon_id, creation_source, is_anonymous, created_at]
  expect(identityInsert[1][1]).toBe('cablecar_qr'); // creation_source
  expect(identityInsert[1][2]).toBe(true);           // is_anonymous
});

it('T-INSTANCE sowon_id in result matches the UUID written to sowon_identity_map', async () => {
  const { performQRBootstrap } = require('../../services/qrCredentialBootstrap');

  const result = await performQRBootstrap(db);
  await new Promise(r => setImmediate(r));

  const identityInsert = db.query.mock.calls.find(
    ([sql]) => typeof sql === 'string' && sql.includes('sowon_identity_map')
  );
  expect(identityInsert).toBeDefined();
  const persistedSowonId = identityInsert[1][0]; // first param = sowon_id

  // The sowon_id returned to the caller must be the same UUID persisted to the DB
  expect(result.sowon_id).toBe(persistedSowonId);
});
