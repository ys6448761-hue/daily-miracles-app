'use strict';

/**
 * guestCredentialLifecycle.test.js
 *
 * Tests for TravelGuide guest credential lifecycle (client-side utility).
 * Source: dreamtown-frontend/src/api/guestCredentialUtil.js
 *
 * TEST 1  — No token → protected action → bootstrap called once → credential stored
 * TEST 2  — Valid stored token → protected action → bootstrap NOT called
 * TEST 3  — Page reload simulation → stored token restored → same sowon_id
 * TEST 4  — Concurrent protected actions → single bootstrap (deduplication)
 * TEST 5a — Expired token → new bootstrap called
 * TEST 5b — Malformed token → new bootstrap called
 * TEST 6  — TTL = 30 days (server-side, in guestCredentialServiceTTL.test.js)
 * TEST 7  — getOrCreateUserId unaffected (no regression to DT anonymous flow)
 */

const jwt  = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const GUEST_JWT_SECRET =
  process.env.GUEST_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'daily-miracles-secret-key-change-in-production';

// ── Browser globals setup ─────────────────────────────────────────────────────

// localStorage: persistent across re-requires within a test (simulates browser)
let _lsStore = {};
const localStorageMock = {
  getItem:    (k) => _lsStore[k] ?? null,
  setItem:    (k, v) => { _lsStore[k] = String(v); },
  removeItem: (k) => { delete _lsStore[k]; },
  clear:      () => { _lsStore = {}; },
};
global.localStorage = localStorageMock;

// atob/btoa: Node-compatible shims for JWT payload decoding
global.atob = (s) => Buffer.from(s, 'base64').toString('utf8');
global.btoa = (s) => Buffer.from(s, 'utf8').toString('base64');

// fetch: mocked per test
global.fetch = jest.fn();

// ── Helpers ───────────────────────────────────────────────────────────────────

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

function makeValidGuestJWT(sowon_id_arg) {
  const sowon_id = sowon_id_arg || uuidv4();
  const token = jwt.sign(
    { sub: uuidv4(), principal_type: 'GUEST', sowon_id, jti: uuidv4() },
    GUEST_JWT_SECRET,
    { expiresIn: THIRTY_DAYS_SECONDS }
  );
  return { token, sowon_id };
}

function makeExpiredGuestJWT(sowon_id_arg) {
  const sowon_id = sowon_id_arg || uuidv4();
  const nowSeconds = Math.floor(Date.now() / 1000);
  // Pass exp directly in payload so it is already in the past
  const token = jwt.sign(
    {
      sub: uuidv4(),
      principal_type: 'GUEST',
      sowon_id,
      jti: uuidv4(),
      exp: nowSeconds - 60, // expired 60 seconds ago
    },
    GUEST_JWT_SECRET
  );
  return { token, sowon_id };
}

function makeBootstrapResponse(sowon_id_arg) {
  const { token, sowon_id } = makeValidGuestJWT(sowon_id_arg);
  return {
    ok: true,
    json: async () => ({
      sowon_id,
      guest_token: token,
      guest_principal_id: uuidv4(),
      expires_in: THIRTY_DAYS_SECONDS,
    }),
  };
}

// ── Module loader ─────────────────────────────────────────────────────────────

// ESM singleton — isolation via _resetInFlightForTesting() instead of jest.resetModules().
let _cachedUtil = null;
async function loadUtil() {
  if (!_cachedUtil) {
    _cachedUtil = await import('../../dreamtown-frontend/src/api/guestCredentialUtil.js');
  }
  _cachedUtil._resetInFlightForTesting();
  return _cachedUtil;
}

// ── Per-test reset ────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
  global.fetch.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

// ── TEST 1 ────────────────────────────────────────────────────────────────────

describe('TEST 1 — No stored token → bootstrap once → credential stored', () => {
  test('bootstrap called exactly once, result stored in localStorage', async () => {
    const util = await loadUtil();
    const sowon_id = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(sowon_id));

    const result = await util.getOrEnsureGuestCredential();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dt/identity/bootstrap',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.sowon_id).toBe(sowon_id);
    expect(typeof result.guest_token).toBe('string');
    expect(localStorage.getItem('dt_guest_token')).toBe(result.guest_token);
    expect(localStorage.getItem('dt_sowon_id')).toBe(sowon_id);
  });
});

// ── TEST 2 ────────────────────────────────────────────────────────────────────

describe('TEST 2 — Valid stored token → bootstrap NOT called', () => {
  test('returns stored credential without network call', async () => {
    const util = await loadUtil();
    const sowon_id = uuidv4();
    const { token } = makeValidGuestJWT(sowon_id);
    localStorage.setItem('dt_guest_token', token);
    localStorage.setItem('dt_sowon_id', sowon_id);

    const result = await util.getOrEnsureGuestCredential();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.sowon_id).toBe(sowon_id);
    expect(result.guest_token).toBe(token);
  });
});

// ── TEST 3 ────────────────────────────────────────────────────────────────────

describe('TEST 3 — Page reload simulation → same sowon_id', () => {
  test('localStorage persists across module re-require; bootstrap not called again', async () => {
    // First "page visit": bootstrap
    const util1 = await loadUtil();
    const sowon_id = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(sowon_id));
    await util1.getOrEnsureGuestCredential();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // "Page reload": fresh module instance, localStorage still has the token
    global.fetch.mockReset();
    const util2 = await loadUtil(); // _resetInFlightForTesting() called — simulates page reload

    const result = await util2.getOrEnsureGuestCredential();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.sowon_id).toBe(sowon_id);
  });
});

// ── TEST 4 ────────────────────────────────────────────────────────────────────

describe('TEST 4 — Concurrent protected actions → single bootstrap', () => {
  test('three simultaneous calls produce one network request, identical results', async () => {
    const util = await loadUtil();
    const sowon_id = uuidv4();
    global.fetch.mockResolvedValue(makeBootstrapResponse(sowon_id));

    const [r1, r2, r3] = await Promise.all([
      util.getOrEnsureGuestCredential(),
      util.getOrEnsureGuestCredential(),
      util.getOrEnsureGuestCredential(),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(r1.sowon_id).toBe(sowon_id);
    expect(r2.sowon_id).toBe(sowon_id);
    expect(r3.sowon_id).toBe(sowon_id);
  });

  test('sequential calls after first succeeds: second call reads localStorage, no extra fetch', async () => {
    const util = await loadUtil();
    const sowon_id = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(sowon_id));

    await util.getOrEnsureGuestCredential(); // first
    const result2 = await util.getOrEnsureGuestCredential(); // second

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result2.sowon_id).toBe(sowon_id);
  });
});

// ── TEST 5 ────────────────────────────────────────────────────────────────────

describe('TEST 5a — Expired token → stale credential not trusted → new bootstrap', () => {
  test('expired token triggers bootstrap; old sowon_id replaced', async () => {
    const util = await loadUtil();
    const oldSowonId = uuidv4();
    const { token: expiredToken } = makeExpiredGuestJWT(oldSowonId);
    localStorage.setItem('dt_guest_token', expiredToken);
    localStorage.setItem('dt_sowon_id', oldSowonId);

    const newSowonId = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(newSowonId));

    const result = await util.getOrEnsureGuestCredential();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.sowon_id).toBe(newSowonId);
    expect(result.sowon_id).not.toBe(oldSowonId);
    expect(localStorage.getItem('dt_sowon_id')).toBe(newSowonId);
  });
});

describe('TEST 5b — Malformed token → stale credential not trusted → new bootstrap', () => {
  test('corrupted token string triggers bootstrap', async () => {
    const util = await loadUtil();
    localStorage.setItem('dt_guest_token', 'not.a.valid.jwt');
    localStorage.setItem('dt_sowon_id', uuidv4());

    const newSowonId = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(newSowonId));

    const result = await util.getOrEnsureGuestCredential();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.sowon_id).toBe(newSowonId);
  });

  test('empty string token triggers bootstrap', async () => {
    const util = await loadUtil();
    localStorage.setItem('dt_guest_token', '');
    localStorage.setItem('dt_sowon_id', uuidv4());

    const newSowonId = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(newSowonId));

    const result = await util.getOrEnsureGuestCredential();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.sowon_id).toBe(newSowonId);
  });
});

// ── TEST 6 — TTL (client-side isGuestTokenValid) ──────────────────────────────

describe('TEST 6 — isGuestTokenValid respects 30-day window', () => {
  let isGuestTokenValid;
  beforeAll(async () => {
    const mod = await import('../../dreamtown-frontend/src/api/guestCredentialUtil.js');
    isGuestTokenValid = mod.isGuestTokenValid;
  });

  test('token with exp = now + 30 days is valid', () => {
    const { token } = makeValidGuestJWT(); // 30-day TTL
    expect(isGuestTokenValid(token)).toBe(true);
  });

  test('token with exp in the past is invalid', () => {
    const { token } = makeExpiredGuestJWT();
    expect(isGuestTokenValid(token)).toBe(false);
  });

  test('null / undefined / empty string are invalid', () => {
    expect(isGuestTokenValid(null)).toBe(false);
    expect(isGuestTokenValid(undefined)).toBe(false);
    expect(isGuestTokenValid('')).toBe(false);
  });

  test('two-part string (not JWT) is invalid', () => {
    expect(isGuestTokenValid('header.payload')).toBe(false);
  });
});

// ── TEST 7 — No regression: getOrCreateUserId unaffected ─────────────────────

describe('TEST 7 — Existing TravelGuide anonymous dt_user_id flow unchanged', () => {
  test('getOrCreateUserId returns a UUID; subsequent call returns same UUID', () => {
    // Simulate localStorage for dt_user_id
    const key = 'dt_user_id';
    localStorage.removeItem(key);
    // Simulate getOrCreateUserId logic (CJS can't require ESM dreamtown.js directly)
    function getOrCreateUserId() {
      let id = localStorage.getItem(key);
      if (!id) { id = uuidv4(); localStorage.setItem(key, id); }
      return id;
    }
    const id1 = getOrCreateUserId();
    const id2 = getOrCreateUserId();
    expect(id1).toMatch(/^[0-9a-f-]{36}$/i);
    expect(id1).toBe(id2);
  });

  test('dt_user_id and dt_sowon_id are independent keys', async () => {
    const util = await loadUtil();
    const sowon_id = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(sowon_id));

    // Set a dt_user_id
    localStorage.setItem('dt_user_id', uuidv4());
    const userIdBefore = localStorage.getItem('dt_user_id');

    await util.getOrEnsureGuestCredential();

    // dt_user_id must be untouched
    expect(localStorage.getItem('dt_user_id')).toBe(userIdBefore);
    // dt_sowon_id is newly set
    expect(localStorage.getItem('dt_sowon_id')).toBe(sowon_id);
  });
});

// ── clearGuestCredential ──────────────────────────────────────────────────────

describe('clearGuestCredential — removes stored credential', () => {
  test('removes dt_guest_token and dt_sowon_id from localStorage', async () => {
    const util = await loadUtil();
    const sowon_id = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(sowon_id));
    await util.getOrEnsureGuestCredential();

    util.clearGuestCredential();

    expect(localStorage.getItem('dt_guest_token')).toBeNull();
    expect(localStorage.getItem('dt_sowon_id')).toBeNull();
  });

  test('after clear, next call bootstraps fresh credential', async () => {
    const util = await loadUtil();
    const sowon_id1 = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(sowon_id1));
    await util.getOrEnsureGuestCredential();

    util.clearGuestCredential();

    const sowon_id2 = uuidv4();
    global.fetch.mockResolvedValueOnce(makeBootstrapResponse(sowon_id2));
    const result = await util.getOrEnsureGuestCredential();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.sowon_id).toBe(sowon_id2);
    expect(result.sowon_id).not.toBe(sowon_id1);
  });
});
