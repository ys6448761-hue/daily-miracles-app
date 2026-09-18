/**
 * Wish Ownership Service — B2 Core
 * Pure helper functions for server-side ownership enforcement.
 * DB is passed as a parameter to enable direct unit testing without mocks at the module level.
 */

/**
 * Resolve the owner for a new wish creation from the verified server-side principal.
 * NEVER reads body.sowon_id, body.user_id, query.*, or session_key.
 *
 * @param {Object} req — Express request with req.sowon_id set by authenticatedPrincipal middleware
 * @returns {{ ok: true, owner_sowon_id: string } | { ok: false, reason: string }}
 */
function resolveOwnerForCreation(req) {
  if (!req.sowon_id) {
    return { ok: false, reason: 'SOWON_ID_UNRESOLVED' };
  }
  return { ok: true, owner_sowon_id: req.sowon_id };
}

/**
 * Verify that the requester's SOWON_ID matches the wish's recorded owner.
 * Fails closed on: missing SOWON_ID, NULL owner (legacy), cross-owner, not found.
 *
 * @param {string} wish_id
 * @param {string|undefined} requester_sowon_id — from req.sowon_id (server-verified, never client-supplied)
 * @param {Object} db — database client with .query(sql, params) interface
 * @returns {{ allowed: boolean, wish?: Object, reason?: string }}
 */
async function verifyWishAccess(wish_id, requester_sowon_id, db) {
  if (!requester_sowon_id) {
    return { allowed: false, reason: 'SOWON_ID_UNRESOLVED' };
  }

  const result = await db.query(
    `SELECT id, wish_text, status, owner_sowon_id FROM voyage_wishes WHERE id = $1`,
    [wish_id]
  );

  if (!result.rows || result.rows.length === 0) {
    return { allowed: false, reason: 'NOT_FOUND' };
  }

  const wish = result.rows[0];

  if (wish.owner_sowon_id === null || wish.owner_sowon_id === undefined) {
    return { allowed: false, wish, reason: 'LEGACY_OWNER_NULL' };
  }

  if (wish.owner_sowon_id !== requester_sowon_id) {
    return { allowed: false, wish, reason: 'CROSS_OWNER' };
  }

  return { allowed: true, wish };
}

module.exports = { resolveOwnerForCreation, verifyWishAccess };
