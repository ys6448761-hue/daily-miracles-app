'use strict';

/**
 * kennyQrEntry.test.js — 4F-A Kenny QR Entry Event
 *
 * Tests:
 *   T1  New guest (PATH A) → kenny_qr_entered emitted with correct sowon_id, is_new_sowon=true
 *   T2  Returning guest → emitKennyQrEnteredEvent emits with same sowon_id, is_new_sowon=false
 *   T3  Client identity injection cannot alter event sowon_id (user_id column = server-resolved)
 *   T4  Event INSERT fails → QR bootstrap succeeds (credential returned, no throw)
 *   T5  Credential issuance fails → event is NOT emitted
 */

jest.mock('../../services/guestCredentialService');
jest.mock('../../services/sowonIdentityService');
jest.mock('../../database/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));

// Suppress console.error — fire-and-forget async emits may log during teardown (T4)
beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));

const guestService       = require('../../services/guestCredentialService');
const sowonIdentityService = require('../../services/sowonIdentityService');
const db                 = require('../../database/db');
const { performQRBootstrap, emitKennyQrEnteredEvent } = require('../../services/qrCredentialBootstrap');

const SOWON_ID      = '11111111-1111-4111-8111-111111111111';
const TOKEN         = 'signed.guest.token';
const PRINCIPAL_ID  = 'gp-22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  jest.clearAllMocks();
  // performQRBootstrap uses: new sowonIdentityService(dbClient).createAnonymousSowon(...)
  // so the mock must be a constructor whose instances have the method
  sowonIdentityService.mockImplementation(() => ({
    createAnonymousSowon: jest.fn().mockResolvedValue({
      sowon_id:    SOWON_ID,
      status:      'CREATED',
      is_anonymous: true,
      created_at:  new Date(),
    }),
  }));
  guestService.issueGuestCredential = jest.fn().mockResolvedValue({
    token:               TOKEN,
    guest_principal_id:  PRINCIPAL_ID,
  });
  db.query.mockResolvedValue({ rowCount: 1 });
});

// T1 — New guest QR bootstrap emits kenny_qr_entered with correct sowon_id and is_new_sowon=true
it('T1 new guest QR bootstrap emits kenny_qr_entered with correct sowon_id', async () => {
  const result = await performQRBootstrap(db);

  // Credential returned correctly
  expect(result.sowon_id).toBe(SOWON_ID);
  expect(result.guest_token).toBe(TOKEN);

  // Allow event emission to flush (it is fire-and-forget, not awaited by caller)
  await new Promise(r => setImmediate(r));

  const eventCall = db.query.mock.calls.find(
    ([, p]) => Array.isArray(p) && p[0] === 'kenny_qr_entered'
  );
  expect(eventCall).toBeDefined();

  const [, [, eventUserId, eventParamsJson]] = eventCall;
  expect(eventUserId).toBe(SOWON_ID);

  const params = JSON.parse(eventParamsJson);
  expect(params.sowon_id).toBe(SOWON_ID);
  expect(params.creation_source).toBe('cablecar_qr');
  expect(params.is_new_sowon).toBe(true);
});

// T2 — Returning guest (PATH B): emitKennyQrEnteredEvent called with is_new_sowon=false
it('T2 returning guest emits kenny_qr_entered with is_new_sowon=false', async () => {
  const mockDb = { query: jest.fn().mockResolvedValue({ rowCount: 1 }) };

  await emitKennyQrEnteredEvent(mockDb, SOWON_ID, 'cablecar_qr', false);

  expect(mockDb.query).toHaveBeenCalledTimes(1);
  const [, [eventName, eventUserId, eventParamsJson]] = mockDb.query.mock.calls[0];
  expect(eventName).toBe('kenny_qr_entered');
  expect(eventUserId).toBe(SOWON_ID);
  const params = JSON.parse(eventParamsJson);
  expect(params.sowon_id).toBe(SOWON_ID);
  expect(params.is_new_sowon).toBe(false);
});

// T3 — Client identity injection: user_id in event always comes from server-resolved sowon_id
it('T3 user_id in event row equals server-resolved sowon_id (client cannot inject)', async () => {
  // performQRBootstrap takes sowon_id ONLY from sowonIdentityService.createAnonymousSowon
  // — it accepts no body or query params
  const result = await performQRBootstrap(db);
  await new Promise(r => setImmediate(r));

  const eventCall = db.query.mock.calls.find(
    ([, p]) => Array.isArray(p) && p[0] === 'kenny_qr_entered'
  );
  expect(eventCall).toBeDefined();
  const [, [, eventUserId]] = eventCall;
  // Must equal the SOWON_ID returned by createAnonymousSowon, not any external input
  expect(eventUserId).toBe(result.sowon_id);
  expect(eventUserId).toBe(SOWON_ID);
});

// T4 — Event INSERT failure does not fail QR bootstrap
it('T4 event INSERT failure does not throw and credential is still returned', async () => {
  db.query.mockImplementation(async (sql, params) => {
    if (Array.isArray(params) && params[0] === 'kenny_qr_entered') {
      throw new Error('DB_WRITE_FAILURE');
    }
    return { rowCount: 1 };
  });

  const result = await performQRBootstrap(db);
  await new Promise(r => setImmediate(r));

  // Bootstrap must succeed regardless of event failure
  expect(result.sowon_id).toBe(SOWON_ID);
  expect(result.guest_token).toBe(TOKEN);
});

// T5 — Credential issuance failure means event is NOT emitted
it('T5 credential issuance failure → event NOT emitted', async () => {
  guestService.issueGuestCredential.mockRejectedValue(new Error('CRED_ISSUE_FAILED'));

  await expect(performQRBootstrap(db)).rejects.toThrow('CRED_ISSUE_FAILED');
  await new Promise(r => setImmediate(r));

  const eventCall = db.query.mock.calls.find(
    ([, p]) => Array.isArray(p) && p[0] === 'kenny_qr_entered'
  );
  expect(eventCall).toBeUndefined();
});
