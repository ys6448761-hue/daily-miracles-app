/**
 * Guest Credential Service
 * Issues server-signed guest tokens (no privilege)
 * Links guest principals to SOWON_IDs
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';

// TTL: 30 days (2,592,000 seconds)
// Override via GUEST_TOKEN_TTL_DAYS (integer, days). Prior GUEST_TOKEN_TTL env var is ignored.
const GUEST_TOKEN_TTL_DAYS = parseInt(process.env.GUEST_TOKEN_TTL_DAYS, 10) || 30;
const GUEST_TOKEN_EXPIRES_IN = GUEST_TOKEN_TTL_DAYS * 24 * 60 * 60;

// In-memory cache (NON-AUTHORITATIVE — SOWON_ID is recovered from signed JWT claim)
// Process restart does not destroy identity continuity — JWT is the source of truth
const guestPrincipalMap = new Map(); // guest_principal_id → {sowon_id, issued_at}

/**
 * Issue a new guest credential
 * Returns: {guest_principal_id, token, sowon_id, expires_in}
 */
async function issueGuestCredential(sowon_id) {
  if (!sowon_id) {
    throw new Error('SOWON_ID required for guest credential issuance');
  }

  const guest_principal_id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = GUEST_TOKEN_EXPIRES_IN;

  // Create guest token payload
  const payload = {
    sub: guest_principal_id,
    principal_type: 'GUEST',
    sowon_id: sowon_id, // cryptographic binding — source of truth on verify
    iat: now,
    exp: now + expiresIn,
    jti: uuidv4()
  };

  // Sign guest token
  const token = jwt.sign(payload, GUEST_JWT_SECRET);

  // Store mapping (guest → sowon)
  guestPrincipalMap.set(guest_principal_id, {
    sowon_id,
    issued_at: Date.now()
  });

  return {
    guest_principal_id,
    token,
    sowon_id,
    expires_in: expiresIn
  };
}

/**
 * Verify and decode guest token
 * Returns: {sub, principal_type, ...payload}
 * Throws: Error on invalid/expired
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyGuestToken(token) {
  try {
    const decoded = jwt.verify(token, GUEST_JWT_SECRET);

    if (decoded.principal_type !== 'GUEST') {
      throw new Error('GUEST_TOKEN_INVALID');
    }

    if (!decoded.sowon_id || !UUID_REGEX.test(decoded.sowon_id)) {
      throw new Error('GUEST_TOKEN_INVALID');
    }

    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('GUEST_TOKEN_EXPIRED');
    }
    if (err.message === 'GUEST_TOKEN_INVALID') throw err;
    throw new Error('GUEST_TOKEN_INVALID');
  }
}

/**
 * Get guest principal metadata
 */
function getGuestMetadata(guest_principal_id) {
  return guestPrincipalMap.get(guest_principal_id) || null;
}

/**
 * Revoke guest credential (optional)
 */
function revokeGuestCredential(guest_principal_id) {
  return guestPrincipalMap.delete(guest_principal_id);
}

module.exports = {
  issueGuestCredential,
  verifyGuestToken,
  getGuestMetadata,
  revokeGuestCredential
};
