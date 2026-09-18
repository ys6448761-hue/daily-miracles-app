/**
 * QR Credential Bootstrap Service
 * Resolves the principal context for POST /api/cablecar/enter
 * Returns path classification — never trusts client-supplied identity fields
 *
 * PATH A: no credential      → bootstrap new GUEST identity
 * PATH B: valid GUEST token  → reuse existing GUEST principal + SOWON_ID
 * PATH C: valid USER JWT     → preserve USER principal (SOWON_ID unresolved, D2)
 * INVALID: bad credential    → fail-closed (do NOT fall through to bootstrap)
 */

const jwt = require('jsonwebtoken');
const guestService = require('./guestCredentialService');
const sowonIdentityService = require('./sowonIdentityService');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';

/**
 * Inspect the Authorization header and return the principal context.
 * Does NOT create identities — only resolves what is already signed.
 *
 * @returns {Object}
 *   { path: 'A' }                             — no credential present
 *   { path: 'B', principal_type, principal_id, sowon_id } — valid GUEST
 *   { path: 'C', principal_type, principal_id, sowon_id: null } — valid USER
 *   { path: 'INVALID' }                       — credential present but invalid
 */
async function resolveQRPrincipal(req) {
  const authHeader = req.headers && req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { path: 'A' };
  }

  const token = authHeader.slice(7);

  let decoded;
  try {
    decoded = jwt.decode(token);
  } catch (_) {
    return { path: 'INVALID' };
  }

  if (!decoded) return { path: 'INVALID' };

  try {
    if (decoded.principal_type === 'GUEST') {
      // PATH B: verifyGuestToken validates signature + expiry + UUID sowon_id
      const verified = await guestService.verifyGuestToken(token);
      return {
        path: 'B',
        principal_type: 'GUEST',
        principal_id: verified.sub,
        sowon_id: verified.sowon_id,
      };
    } else {
      // PATH C: USER JWT — verify signature and expiry
      const verified = jwt.verify(token, JWT_SECRET);
      if (!verified.userId) return { path: 'INVALID' };
      return {
        path: 'C',
        principal_type: 'USER',
        principal_id: verified.userId,
        sowon_id: null, // USER→SOWON_ID not resolvable (D2: DIFFERENT_OR_UNRESOLVED)
      };
    }
  } catch (_) {
    return { path: 'INVALID' };
  }
}

/**
 * Emit kenny_qr_entered to dt_events. Fire-and-forget — failure must not
 * block QR entry or invalidate an issued credential.
 *
 * sowon_id is always server-resolved — never from body/query.
 *
 * @param {Object} dbClient  - db instance (injectable for tests)
 * @param {string} sowon_id  - server-resolved UUID
 * @param {string} creation_source
 * @param {boolean} is_new_sowon
 */
function emitKennyQrEnteredEvent(dbClient, sowon_id, creation_source, is_new_sowon) {
  dbClient.query(
    `INSERT INTO dt_events (event_name, user_id, params) VALUES ($1, $2, $3)`,
    [
      'kenny_qr_entered',
      sowon_id,
      JSON.stringify({ sowon_id, creation_source, is_new_sowon }),
    ]
  ).catch(e => console.error('[Kenny Event] kenny_qr_entered write failed:', e.message));
}

/**
 * Create a new anonymous SOWON_ID and issue a signed GUEST credential.
 * Called only when resolveQRPrincipal returns path === 'A'.
 *
 * @param {Object} [dbOverride]  - injectable db for tests; defaults to module-level db
 * @returns {{ guest_token, sowon_id, guest_principal_id }}
 */
async function performQRBootstrap(dbOverride) {
  const dbClient = dbOverride || db;
  const sowon = await new sowonIdentityService(dbClient).createAnonymousSowon('cablecar_qr');
  const guestCred = await guestService.issueGuestCredential(sowon.sowon_id);

  // Fire-and-forget: event write failure must not invalidate the issued credential
  emitKennyQrEnteredEvent(dbClient, sowon.sowon_id, 'cablecar_qr', true);

  return {
    guest_token: guestCred.token,
    sowon_id: sowon.sowon_id,
    guest_principal_id: guestCred.guest_principal_id,
  };
}

module.exports = { resolveQRPrincipal, performQRBootstrap, emitKennyQrEnteredEvent };
