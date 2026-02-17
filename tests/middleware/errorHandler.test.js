/**
 * errorHandler.test.js — Error classification, Slack alert, request ID
 */

const {
  AppError, ValidationError, DatabaseError, OpenAIError, ServiceLimitError,
  createError,
} = require('../../utils/errors');
const { globalErrorHandler, notFoundHandler, initSlackSender } = require('../../middleware/errorHandler');
const requestIdMiddleware = require('../../middleware/requestId');

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
    get: () => 'test-agent',
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
    status(code) { res._status = code; return res; },
    json(data) { res._json = data; return res; },
    setHeader(k, v) { res._headers[k] = v; },
  };
  return res;
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ requestId middleware ═══\n');

// 1. Generates UUID when no header
{
  const req = mockReq();
  const res = mockRes();
  let called = false;
  requestIdMiddleware(req, res, () => { called = true; });
  assert(called, 'calls next()');
  assert(typeof req.requestId === 'string' && req.requestId.length === 36, `generates UUID (${req.requestId})`);
  assert(res._headers['X-Request-Id'] === req.requestId, 'sets X-Request-Id response header');
}

// 2. Honors existing X-Request-ID header
{
  const req = mockReq({ headers: { 'x-request-id': 'custom-id-123' } });
  const res = mockRes();
  requestIdMiddleware(req, res, () => {});
  assert(req.requestId === 'custom-id-123', 'honors incoming X-Request-ID');
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ Error classification ═══\n');

const OLD_ENV = process.env.NODE_ENV;
process.env.NODE_ENV = 'development'; // Dev mode for stack visibility

// 3. ValidationError → class=Validation
{
  const err = new ValidationError('bad input');
  const req = mockReq({ requestId: 'req-001' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._status === 400, `status=400 (got ${res._status})`);
  assert(res._json?.error?.error_class === 'Validation', `class=Validation (got ${res._json?.error?.error_class})`);
  assert(res._json?.error?.request_id === 'req-001', 'request_id in response');
}

// 4. DatabaseError → class=DB
{
  const err = new DatabaseError('db fail');
  const req = mockReq({ requestId: 'req-002' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._json?.error?.error_class === 'DB', `class=DB (got ${res._json?.error?.error_class})`);
}

// 5. OpenAIError → class=OpenAI/External
{
  const err = new OpenAIError('openai fail');
  const req = mockReq({ requestId: 'req-003' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._json?.error?.error_class === 'OpenAI/External', `class=OpenAI/External (got ${res._json?.error?.error_class})`);
}

// 6. ServiceLimitError → class=RateLimit
{
  const err = new ServiceLimitError('rate limited');
  const req = mockReq({ requestId: 'req-004' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._status === 429, `status=429 (got ${res._status})`);
  assert(res._json?.error?.error_class === 'RateLimit', `class=RateLimit (got ${res._json?.error?.error_class})`);
}

// 7. System error (ETIMEDOUT) → class=System
{
  const err = new Error('connection timed out');
  err.code = 'ETIMEDOUT';
  const req = mockReq({ requestId: 'req-005' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._json?.error?.error_class === 'System', `class=System (got ${res._json?.error?.error_class})`);
}

// 8. Plain Error → class=Unknown
{
  const err = new Error('something broke');
  const req = mockReq({ requestId: 'req-006' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._status === 500, `status=500 (got ${res._status})`);
  assert(res._json?.error?.error_class === 'Unknown', `class=Unknown (got ${res._json?.error?.error_class})`);
}

// 9. SQLite error → class=DB
{
  const err = new Error('sqlite constraint');
  err.code = 'SQLITE_CONSTRAINT';
  const req = mockReq();
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._json?.error?.error_class === 'DB', `SQLITE → class=DB (got ${res._json?.error?.error_class})`);
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ Slack alert behavior ═══\n');

// 10. 500-level error triggers Slack alert
{
  let slackCalled = false;
  let slackMsg = null;
  initSlackSender((msg) => { slackCalled = true; slackMsg = msg; return Promise.resolve(); });

  const err = new Error('crash test');
  const req = mockReq({ requestId: 'req-slack-1' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(slackCalled, 'Slack sender called for 500 error');
  assert(slackMsg?.blocks?.[0]?.text?.text?.includes('Unknown'), 'Slack header contains error class');
  assert(JSON.stringify(slackMsg).includes('req-slack-1'), 'Slack payload contains request_id');
}

// 11. 400-level error does NOT trigger Slack
{
  let slackCalled = false;
  initSlackSender(() => { slackCalled = true; return Promise.resolve(); });

  const err = new ValidationError('bad input');
  const req = mockReq();
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(!slackCalled, 'Slack NOT called for 400 error');
}

// Reset slack sender
initSlackSender(null);

// ══════════════════════════════════════════════════════════════
console.log('\n═══ Response format ═══\n');

// 12. Dev mode includes stack
{
  process.env.NODE_ENV = 'development';
  const err = new Error('dev error');
  const req = mockReq({ requestId: 'req-dev' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(typeof res._json?.error?.stack === 'string', 'dev mode: stack present');
  assert(res._json?.error?.request_id === 'req-dev', 'dev mode: request_id present');
}

// 13. Prod mode hides stack
{
  process.env.NODE_ENV = 'production';
  const err = new Error('prod error');
  const req = mockReq({ requestId: 'req-prod' });
  const res = mockRes();
  globalErrorHandler(err, req, res, () => {});
  assert(res._json?.error?.stack === undefined, 'prod mode: stack hidden');
  assert(res._json?.error?.request_id === 'req-prod', 'prod mode: request_id present');
  assert(res._json?.error?.error_class === 'Unknown', 'prod mode: error_class present');
}

process.env.NODE_ENV = OLD_ENV;

// ══════════════════════════════════════════════════════════════
console.log('\n═══ headersSent guard ═══\n');

// 14. Does not send if headers already sent
{
  const err = new Error('double send');
  const req = mockReq();
  const res = mockRes();
  res.headersSent = true;
  let nextCalled = false;
  globalErrorHandler(err, req, res, () => { nextCalled = true; });
  assert(nextCalled, 'calls next(err) when headersSent=true');
  assert(res._status === null, 'does NOT set status');
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ notFoundHandler ═══\n');

// 15. Creates 404 error and calls next
{
  const req = mockReq({ originalUrl: '/api/missing' });
  const res = mockRes();
  let nextErr = null;
  notFoundHandler(req, res, (err) => { nextErr = err; });
  assert(nextErr instanceof AppError, 'creates AppError');
  assert(nextErr.statusCode === 404, `status=404 (got ${nextErr.statusCode})`);
  assert(nextErr.message.includes('/api/missing'), 'message contains path');
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════');
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('═══════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
