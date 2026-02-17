const crypto = require('crypto');

/**
 * Request ID middleware — assigns a unique ID to every request.
 * Honors incoming X-Request-ID header (from reverse proxy/client).
 */
function requestIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = requestIdMiddleware;
