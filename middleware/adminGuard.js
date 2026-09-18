/**
 * Admin Guard Middleware
 * Verifies X-Admin-Token header against ADMIN_TOKEN environment variable.
 * Fail-closed: NO development bypass — if ADMIN_TOKEN is not configured, deny all.
 *
 * 401 UNAUTHORIZED — no credential supplied
 * 403 FORBIDDEN    — credential supplied but does not match ADMIN_TOKEN
 * 503 SERVICE_UNAVAILABLE — ADMIN_TOKEN not configured in this environment
 */

/**
 * requireAdmin: gate middleware — blocks non-admins entirely.
 * Use on routes that are fully admin-only.
 */
function requireAdmin(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      code: 'ADMIN_NOT_CONFIGURED',
    });
  }

  const supplied = req.headers['x-admin-token'];

  if (!supplied) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      code: 'ADMIN_CREDENTIAL_REQUIRED',
    });
  }

  if (supplied !== adminToken) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code: 'ADMIN_CREDENTIAL_INVALID',
    });
  }

  next();
}

/**
 * verifyAdminToken: non-blocking helper for routes with tiered responses.
 * Returns true only when X-Admin-Token matches ADMIN_TOKEN exactly.
 * Client-supplied query params / body fields have no effect.
 *
 * @param {Object} req — Express request
 * @returns {boolean}
 */
function verifyAdminToken(req) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return false;
  const supplied = req.headers['x-admin-token'];
  if (!supplied) return false;
  return supplied === adminToken;
}

module.exports = { requireAdmin, verifyAdminToken };
