const crypto = require('crypto');

/**
 * Request ID middleware — assigns a unique ID to every request.
 * Honors incoming X-Request-ID header (from reverse proxy/client).
 * Also creates req.log child logger with requestId for structured per-request logging.
 */

let _logger = null;
function _getLogger() {
  if (_logger === null) {
    try { _logger = require('../config/logger').logger; } catch (_) { _logger = false; }
  }
  return _logger || null;
}

function requestIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);

  const logger = _getLogger();
  req.log = logger ? logger.child({ requestId: id }) : console;

  next();
}

module.exports = requestIdMiddleware;
