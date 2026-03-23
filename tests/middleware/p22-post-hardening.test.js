/**
 * p22-post-hardening.test.js — requestId propagation, requestLogger,
 * alertCooldown memory safety, end-to-end verification.
 *
 * Run: node tests/middleware/p22-post-hardening.test.js
 */

const {
  AppError, ValidationError, createError,
} = require('../../utils/errors');
const { globalErrorHandler, notFoundHandler, initSlackSender } = require('../../middleware/errorHandler');
const requestIdMiddleware = require('../../middleware/requestId');
const { requestLogger } = require('../../config/logger');
const { AlertCooldown, MAX_COOLDOWN_ENTRIES, COOLDOWN_MS } = require('../../middleware/alertCooldown');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

// ── Mock helpers ──────────────────────────────────────────────
function mockReq(overrides = {}) {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    url: '/api/test',
    ip: '127.0.0.1',
    headers: {},
    get: () => null,
    requestId: null,
    connection: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function mockRes() {
  const res = {
    headersSent: false,
    _status: null,
    _json: null,
    _headers: {},
    _finishHandlers: [],
    statusCode: 200,
    status(code) { res._status = code; res.statusCode = code; return res; },
    json(data) { res._json = data; return res; },
    setHeader(k, v) { res._headers[k] = v; },
    get(k) { return res._headers[k] || null; },
    on(event, fn) { if (event === 'finish') res._finishHandlers.push(fn); },
    _triggerFinish() { res._finishHandlers.forEach(fn => fn()); },
  };
  return res;
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ req.log child logger ═══\n');

// 1. requestId middleware creates req.log
{
  const req = mockReq();
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  assert(req.log !== undefined && req.log !== null, 'req.log is created');
}

// 2. req.log has requestId in child metadata
{
  const req = mockReq();
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  // Winston child logger stores defaultMeta
  assert(typeof req.requestId === 'string' && req.requestId.length === 36, 'requestId is a UUID');
  // Verify child logger is a logger instance with standard methods
  assert(typeof req.log.info === 'function', 'req.log.info is a function');
  assert(typeof req.log.error === 'function', 'req.log.error is a function');
}

// 3. req.log.warn works without throwing
{
  const req = mockReq();
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  let threw = false;
  try { req.log.warn('test warning', { test: true }); } catch (_) { threw = true; }
  assert(!threw, 'req.log.warn() does not throw');
}

// 4. Honors existing X-Request-ID in child logger
{
  const req = mockReq({ headers: { 'x-request-id': 'custom-abc-123' } });
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  assert(req.requestId === 'custom-abc-123', 'requestId matches custom header');
  assert(req.log !== undefined, 'req.log created even with custom header');
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ requestLogger structured fields ═══\n');

// 5. 200 OK: requestLogger logs requestId + durationMs + url
{
  const req = mockReq({ requestId: 'req-200-test', originalUrl: '/api/health' });
  const res = mockRes();
  let capturedData = null;
  // Spy on accessLogger by intercepting the requestLogger output
  const origInfo = require('../../config/logger').accessLogger.info;
  require('../../config/logger').accessLogger.info = (msg, data) => { capturedData = data; };
  requestLogger(req, res, () => {});
  res.statusCode = 200;
  res._triggerFinish();
  require('../../config/logger').accessLogger.info = origInfo;

  assert(capturedData !== null, '200: log data captured');
  assert(capturedData.requestId === 'req-200-test', '200: requestId in log');
  assert(typeof capturedData.durationMs === 'number', '200: durationMs is a number');
  assert(capturedData.durationMs >= 0, '200: durationMs is non-negative');
  assert(capturedData.url === '/api/health', '200: url matches originalUrl');
  assert(capturedData.method === 'GET', '200: method present');
  assert(capturedData.statusCode === 200, '200: statusCode present');
}

// 6. 404 response: requestLogger logs with error fields
{
  const req = mockReq({ requestId: 'req-404-test', originalUrl: '/api/nonexistent' });
  const res = mockRes();
  let capturedData = null;
  const origWarn = require('../../config/logger').accessLogger.warn;
  require('../../config/logger').accessLogger.warn = (msg, data) => { capturedData = data; };
  requestLogger(req, res, () => {});
  res.statusCode = 404;
  res._errorClass = 'NotFound';
  res._triggerFinish();
  require('../../config/logger').accessLogger.warn = origWarn;

  assert(capturedData !== null, '404: log data captured');
  assert(capturedData.requestId === 'req-404-test', '404: requestId in log');
  assert(capturedData.headersSent !== undefined, '404: headersSent field present');
  assert(capturedData.error_class === 'NotFound', '404: error_class in log');
  assert(capturedData.url === '/api/nonexistent', '404: url is meaningful for 404');
}

// 7. 500 response: requestLogger logs with error fields
{
  const req = mockReq({ requestId: 'req-500-test' });
  const res = mockRes();
  let capturedData = null;
  const origWarn = require('../../config/logger').accessLogger.warn;
  require('../../config/logger').accessLogger.warn = (msg, data) => { capturedData = data; };
  requestLogger(req, res, () => {});
  res.statusCode = 500;
  res._errorClass = 'Unknown';
  res._triggerFinish();
  require('../../config/logger').accessLogger.warn = origWarn;

  assert(capturedData !== null, '500: log data captured');
  assert(capturedData.requestId === 'req-500-test', '500: requestId in log');
  assert(capturedData.error_class === 'Unknown', '500: error_class in log');
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ End-to-end requestId ═══\n');

const OLD_ENV = process.env.NODE_ENV;
process.env.NODE_ENV = 'development';

// 8. 200 OK: X-Request-Id in response header
{
  const req = mockReq();
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  assert(typeof res._headers['X-Request-Id'] === 'string', 'e2e 200: X-Request-Id in response header');
  assert(res._headers['X-Request-Id'] === req.requestId, 'e2e 200: header matches req.requestId');
}

// 9. 404: requestId in error response body
{
  const req = mockReq();
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  const reqId = req.requestId;
  let nextErr = null;
  notFoundHandler(req, res, (err) => { nextErr = err; });
  globalErrorHandler(nextErr, req, res, () => {});
  assert(res._json?.error?.request_id === reqId, 'e2e 404: request_id in response body');
}

// 10. 500: requestId in error response body + Slack alert payload
{
  let slackPayload = null;
  initSlackSender((msg) => { slackPayload = msg; return Promise.resolve(); });

  const req = mockReq();
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  const reqId = req.requestId;
  const err = new Error('test crash');
  globalErrorHandler(err, req, res, () => {});
  assert(res._json?.error?.request_id === reqId, 'e2e 500: request_id in response body');
  assert(JSON.stringify(slackPayload).includes(reqId), 'e2e 500: requestId in Slack alert payload');

  initSlackSender(null);
}

process.env.NODE_ENV = OLD_ENV;

// ══════════════════════════════════════════════════════════════
console.log('\n═══ alertCooldown memory safety ═══\n');

// 11. MAX_COOLDOWN_ENTRIES is exported and equals 10000
{
  assert(MAX_COOLDOWN_ENTRIES === 10_000, `MAX_COOLDOWN_ENTRIES = ${MAX_COOLDOWN_ENTRIES}`);
}

// 12. Entries stay under MAX after mass insertion
{
  const cd = new AlertCooldown();
  for (let i = 0; i < MAX_COOLDOWN_ENTRIES; i++) {
    cd._entries.set(`key-${i}`, { lastSentAt: Date.now() - i, suppressedCount: 0 });
  }
  // Next check triggers emergency purge
  cd.check('overflow-key', null);
  const maxAllowed = Math.floor(MAX_COOLDOWN_ENTRIES * 0.75) + 1; // +1 for the new entry
  assert(cd.size <= maxAllowed, `size after emergency purge: ${cd.size} <= ${maxAllowed}`);
  cd.destroy();
}

// 13. Emergency purge reduces to 75% of MAX
{
  const cd = new AlertCooldown();
  for (let i = 0; i < MAX_COOLDOWN_ENTRIES + 100; i++) {
    cd._entries.set(`key-${i}`, { lastSentAt: Date.now() - (MAX_COOLDOWN_ENTRIES + 100 - i), suppressedCount: 0 });
  }
  cd._lastEmergencyPurgeAt = 0; // Reset guard
  cd._emergencyPurge();
  const target = Math.floor(MAX_COOLDOWN_ENTRIES * 0.75);
  assert(cd.size <= target, `emergency purge target: ${cd.size} <= ${target}`);
  cd.destroy();
}

// 14. Emergency purge does NOT run repeatedly in same burst (1s guard)
{
  const cd = new AlertCooldown();
  // Fill to MAX
  for (let i = 0; i < MAX_COOLDOWN_ENTRIES; i++) {
    cd._entries.set(`key-${i}`, { lastSentAt: Date.now() - i, suppressedCount: 0 });
  }
  // First check triggers emergency purge
  cd.check('burst-key-1', null);
  const sizeAfterFirst = cd.size;
  // Add more entries to reach MAX again (simulating burst)
  for (let i = 0; i < MAX_COOLDOWN_ENTRIES; i++) {
    cd._entries.set(`burst-${i}`, { lastSentAt: Date.now(), suppressedCount: 0 });
  }
  // Second check within 1s — emergency purge should NOT run (guard prevents)
  cd.check('burst-key-2', null);
  // Size should still be >= MAX (purge was skipped)
  assert(cd.size >= MAX_COOLDOWN_ENTRIES, `burst guard: size ${cd.size} >= ${MAX_COOLDOWN_ENTRIES} (purge skipped within 1s)`);
  cd.destroy();
}

// 15. Regular _purge() removes stale entries
{
  const cd = new AlertCooldown();
  const staleTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
  cd._entries.set('stale-1', { lastSentAt: staleTime, suppressedCount: 5 });
  cd._entries.set('stale-2', { lastSentAt: staleTime, suppressedCount: 3 });
  cd._entries.set('fresh-1', { lastSentAt: Date.now(), suppressedCount: 0 });
  assert(cd.size === 3, `before purge: size=3 (got ${cd.size})`);
  cd._purge();
  assert(cd.size === 1, `after purge: size=1 (got ${cd.size})`);
  assert(cd._entries.has('fresh-1'), 'fresh entry preserved');
  cd.destroy();
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ Regression: existing behavior unchanged ═══\n');

process.env.NODE_ENV = 'development';

// 16. 404 behavior unchanged
{
  const req = mockReq({ requestId: 'reg-404', originalUrl: '/api/missing' });
  const res = mockRes();
  let nextErr = null;
  notFoundHandler(req, res, (err) => { nextErr = err; });
  assert(nextErr instanceof AppError, 'regression 404: creates AppError');
  assert(nextErr.statusCode === 404, `regression 404: status=404 (got ${nextErr.statusCode})`);
  globalErrorHandler(nextErr, req, res, () => {});
  assert(res._status === 404, 'regression 404: response status=404');
  assert(res._json?.error?.request_id === 'reg-404', 'regression 404: request_id in body');
}

// 17. 500 behavior unchanged
{
  const err = new Error('regression crash');
  const req = mockReq({ requestId: 'reg-500' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._status === 500, 'regression 500: response status=500');
  assert(res._json?.error?.request_id === 'reg-500', 'regression 500: request_id in body');
  assert(res._json?.error?.error_class === 'Unknown', 'regression 500: error_class=Unknown');
}

// 18. durationMs is a number and non-negative (dedicated test)
{
  const req = mockReq({ requestId: 'dur-test' });
  const res = mockRes();
  let capturedData = null;
  const origInfo = require('../../config/logger').accessLogger.info;
  require('../../config/logger').accessLogger.info = (msg, data) => { capturedData = data; };
  requestLogger(req, res, () => {});
  // Simulate some processing time
  res.statusCode = 200;
  res._triggerFinish();
  require('../../config/logger').accessLogger.info = origInfo;

  assert(capturedData !== null, 'durationMs: data captured');
  assert(typeof capturedData.durationMs === 'number', `durationMs: is number (got ${typeof capturedData.durationMs})`);
  assert(capturedData.durationMs >= 0, `durationMs: non-negative (got ${capturedData.durationMs})`);
  assert(Number.isFinite(capturedData.durationMs), `durationMs: is finite (got ${capturedData.durationMs})`);
}

process.env.NODE_ENV = OLD_ENV;

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════');
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('═══════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
