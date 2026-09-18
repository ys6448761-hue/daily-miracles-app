/**
 * guestCredentialUtil.js — Guest Credential Client Utility
 *
 * On-demand bootstrap + localStorage reuse for anonymous SOWON identity.
 * Designed for TravelGuide and any future protected-domain action.
 *
 * Invariants:
 *   - Never call on page mount — each bootstrap creates a new SOWON
 *   - Call immediately before a protected action that requires Bearer auth
 *   - Concurrent calls deduplicated via module-level promise (_inFlight)
 *   - Storage: localStorage ('dt_guest_token', 'dt_sowon_id')
 *   - TTL: 30 days (server-issued, validated client-side via JWT exp claim)
 *   - Token scope: anonymous DreamTown context only (no payment, no user data)
 */

const DT_GUEST_TOKEN_KEY = 'dt_guest_token';
const DT_SOWON_ID_KEY = 'dt_sowon_id';

// Module-level dedup: prevents concurrent bootstrap calls from creating multiple SOWONs
let _bootstrapInFlight = null;

function _decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('INVALID_JWT_STRUCTURE');
  return JSON.parse(atob(parts[1]));
}

function isGuestTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const payload = _decodeJwtPayload(token);
    const nowSeconds = Math.floor(Date.now() / 1000);
    return !!(payload.exp && payload.exp > nowSeconds);
  } catch {
    return false;
  }
}

async function _doBootstrap() {
  const response = await fetch('/api/dt/identity/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error('IDENTITY_BOOTSTRAP_FAILED:' + response.status);
  }
  const data = await response.json();
  localStorage.setItem(DT_GUEST_TOKEN_KEY, data.guest_token);
  localStorage.setItem(DT_SOWON_ID_KEY, data.sowon_id);
  return { guest_token: data.guest_token, sowon_id: data.sowon_id };
}

async function getOrEnsureGuestCredential() {
  const storedToken = localStorage.getItem(DT_GUEST_TOKEN_KEY);
  const storedSowonId = localStorage.getItem(DT_SOWON_ID_KEY);

  if (storedToken && storedSowonId && isGuestTokenValid(storedToken)) {
    return { guest_token: storedToken, sowon_id: storedSowonId };
  }

  if (_bootstrapInFlight) {
    return _bootstrapInFlight;
  }

  _bootstrapInFlight = _doBootstrap().finally(() => {
    _bootstrapInFlight = null;
  });
  return _bootstrapInFlight;
}

function clearGuestCredential() {
  localStorage.removeItem(DT_GUEST_TOKEN_KEY);
  localStorage.removeItem(DT_SOWON_ID_KEY);
}

function _resetInFlightForTesting() {
  _bootstrapInFlight = null;
}

export {
  getOrEnsureGuestCredential,
  clearGuestCredential,
  isGuestTokenValid,
  _resetInFlightForTesting,
  DT_GUEST_TOKEN_KEY,
  DT_SOWON_ID_KEY,
};
