/**
 * Authenticated Principal Middleware
 * Normalizes USER (JWT) and GUEST (server-issued token) credentials
 * to unified req.principal structure
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';
const GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || JWT_SECRET; // Can differ if needed

/**
 * Extract credential from request
 * Accepts: Authorization: Bearer <token>
 * Rejects: body.user_id, query.user_id, body.sowon_id
 */
function extractCredential(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  // Try to decode without verification first to detect type
  try {
    const decoded = jwt.decode(token);
    if (decoded.principal_type === 'GUEST') {
      return { type: 'GUEST', value: token };
    } else {
      // Assume USER if no principal_type
      return { type: 'USER', value: token };
    }
  } catch (err) {
    return { type: 'UNKNOWN', value: token };
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verify credential signature and expiry
 */
async function verifyCredential(credential) {
  try {
    if (credential.type === 'GUEST') {
      const decoded = jwt.verify(credential.value, GUEST_JWT_SECRET);
      if (decoded.principal_type !== 'GUEST') {
        throw new Error('INVALID_CREDENTIAL');
      }
      if (!decoded.sowon_id || !UUID_REGEX.test(decoded.sowon_id)) {
        throw new Error('INVALID_CREDENTIAL');
      }
      return {
        principal_id: decoded.sub,
        principal_type: 'GUEST',
        sowon_id: decoded.sowon_id, // from signed JWT claim only — never client-supplied
        roles: []
      };
    } else if (credential.type === 'USER') {
      const decoded = jwt.verify(credential.value, JWT_SECRET);
      return {
        principal_id: decoded.userId,
        principal_type: 'USER',
        roles: decoded.roles || []
      };
    } else {
      throw new Error('Unknown credential type');
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error('INVALID_CREDENTIAL');
  }
}

/**
 * Normalize verified credential to req.principal
 */
function normalizePrincipal(verified, credential) {
  return {
    principal_id: verified.principal_id,
    principal_type: verified.principal_type,
    authentication_method: credential.type === 'GUEST' ? 'SIGNED_GUEST_TOKEN' : 'JWT',
    authenticated_at: Date.now(),
    roles: verified.roles
  };
}

/**
 * Main middleware: requireAuthenticatedPrincipal
 * Validates credential and sets req.principal
 */
async function requireAuthenticatedPrincipal(req, res, next) {
  const credential = extractCredential(req);

  if (!credential) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  try {
    const verified = await verifyCredential(credential);
    req.principal = normalizePrincipal(verified, credential);
    if (verified.sowon_id) {
      req.sowon_id = verified.sowon_id; // set from verified JWT claim — never from body/query
    }
    next();
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        code: 'AUTH_EXPIRED'
      });
    }
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      code: 'INVALID_CREDENTIAL'
    });
  }
}

module.exports = {
  requireAuthenticatedPrincipal,
  extractCredential,
  verifyCredential,
  normalizePrincipal,
  JWT_SECRET,
  GUEST_JWT_SECRET
};
