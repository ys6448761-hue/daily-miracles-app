/**
 * p23-reqlog-migration.test.js — req.log migration regression tests
 *
 * Validates:
 *   1. videoJobRoutes: background error uses req.log
 *   2. wuRoutes: catch blocks use req.log.error
 *   3. wishRoutes: logs are privacy-safe (no phone/name/birthdate)
 *   4. wishRoutes: PII fields never appear in log calls
 *   5. All routes: req.log fallback to console (no crash)
 *   6. All routes: requestId present via req.log
 *
 * Run: node tests/middleware/p23-reqlog-migration.test.js
 */

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

// ── Capture helper: intercepts log calls and records args ──
function createLogSpy() {
  const calls = { info: [], warn: [], error: [], debug: [] };
  return {
    calls,
    info(msg, meta) { calls.info.push({ msg, meta }); },
    warn(msg, meta) { calls.warn.push({ msg, meta }); },
    error(msg, meta) { calls.error.push({ msg, meta }); },
    debug(msg, meta) { calls.debug.push({ msg, meta }); },
  };
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ videoJobRoutes: req.log migration ═══\n');

// 1. Background error uses req.log (captured via closure)
{
  const logSpy = createLogSpy();

  // Read the route file source to verify the pattern
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/videoJobRoutes.js'), 'utf8'
  );

  // Verify: req.log || console pattern present
  assert(
    routeSrc.includes('req.log || console'),
    'videoJobRoutes: uses req.log || console fallback'
  );

  // Verify: structured log format for background error
  assert(
    routeSrc.includes("bgLog.error('[VideoJob] background_exec_failed'"),
    'videoJobRoutes: background error uses structured log'
  );

  // Verify: job creation info log added
  assert(
    routeSrc.includes("log.info('[VideoJob] job_created'"),
    'videoJobRoutes: job creation info log present'
  );

  // Verify: module-level console.log kept (no req context)
  assert(
    routeSrc.includes("console.log('✅ VideoJob 오케스트레이터 로드 성공')"),
    'videoJobRoutes: module-level console.log kept'
  );
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ wuRoutes: req.log migration ═══\n');

// 2. All 6 catch blocks use req.log.error
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/wuRoutes.js'), 'utf8'
  );

  const expectedActions = [
    { tag: 'session_start_failed', action: 'start' },
    { tag: 'session_get_failed', action: 'get' },
    { tag: 'answer_submit_failed', action: 'answer' },
    { tag: 'session_complete_failed', action: 'complete' },
    { tag: 'session_abandon_failed', action: 'abandon' },
    { tag: 'profile_get_failed', action: 'getProfile' },
  ];

  for (const { tag, action } of expectedActions) {
    assert(
      routeSrc.includes(`'[WU] ${tag}'`) && routeSrc.includes(`action: '${action}'`),
      `wuRoutes: ${tag} with action='${action}'`
    );
  }

  // Verify fallback pattern
  const fallbackCount = (routeSrc.match(/\(req\.log \|\| console\)\.error/g) || []).length;
  assert(fallbackCount === 6, `wuRoutes: 6 fallback patterns (got ${fallbackCount})`);

  // Verify module-level console kept
  assert(
    routeSrc.includes("console.log('✅ WU 서비스 로드 성공')"),
    'wuRoutes: module-level console.log kept'
  );
  assert(
    routeSrc.includes("console.error('❌ WU 서비스 로드 실패:'"),
    'wuRoutes: module-level console.error kept'
  );

  // Verify no request-scoped console.error remains
  // (module-level console.error/warn are at lines 35, 42 — inside try/catch at module scope)
  const lines = routeSrc.split('\n');
  let requestScopedConsole = 0;
  let inRouter = false;
  for (const line of lines) {
    if (line.includes('router.')) inRouter = true;
    if (inRouter && /console\.(error|warn|log)/.test(line)) {
      requestScopedConsole++;
    }
  }
  assert(requestScopedConsole === 0, `wuRoutes: no request-scoped console calls remain (got ${requestScopedConsole})`);
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ wishRoutes: req.log migration + PII safety ═══\n');

// 3. PII fields never appear in log calls
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/wishRoutes.js'), 'utf8'
  );

  // Extract all log.* and console.* call lines (approximate — looks for log. or console. calls)
  const logLines = routeSrc.split('\n').filter(line => {
    const trimmed = line.trim();
    return (
      (trimmed.startsWith('log.') || trimmed.includes('(req.log || console).')) &&
      !trimmed.startsWith('//')
    );
  });

  assert(logLines.length > 0, `wishRoutes: found ${logLines.length} log lines to check`);

  // Check: no phone VALUES in log lines
  // Safe: rawPhone.length, normalizedPhone.length (integer only)
  // Unsafe: rawPhone, normalizedPhone (string value), phone: <var>
  const phoneValueInLogs = logLines.some(l => {
    // Allow .length property access — that's just an integer
    const cleaned = l.replace(/rawPhone\.length/g, '').replace(/normalizedPhone\.length/g, '');
    return cleaned.includes('rawPhone') || cleaned.includes('normalizedPhone') ||
      /phone:\s/.test(cleaned) || /phone,/.test(cleaned);
  });
  assert(!phoneValueInLogs, 'wishRoutes PII: no phone value in any log call');

  // Check: no name variable in log lines
  const nameInLogs = logLines.some(l => {
    return /\bname\b/.test(l) && !l.includes('// ');
  });
  assert(!nameInLogs, 'wishRoutes PII: no name in any log call');

  // Check: no birthdate VALUES in log lines (tag names like 'birthdate_saved' are OK)
  const birthdateValueInLogs = logLines.some(l =>
    /birthdate[^_']/.test(l) || /birthdate:\s/.test(l) || /birthdate,/.test(l)
  );
  assert(!birthdateValueInLogs, 'wishRoutes PII: no birthdate value in any log call');
}

// 4. Structured log tags present
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/wishRoutes.js'), 'utf8'
  );

  const expectedTags = [
    'phone_validated',
    'phone_rejected',
    'gem_fallback',
    'daily_limit',
    'event_log_failed',
    'wish_received',
    'red_signal',
    'red_alert_sent',
    'red_alert_skipped',
    'ack_generated',
    'ack_sent',
    'ack_skipped',
    'wish_submit_failed',
    'wish_list_failed',
    'upgrade_click',
    'upgrade_click_failed',
    'birthdate_saved',
    'birthdate_save_failed',
  ];

  let tagCount = 0;
  for (const tag of expectedTags) {
    const found = routeSrc.includes(tag);
    if (found) tagCount++;
    assert(found, `wishRoutes tag: ${tag}`);
  }
  assert(tagCount === expectedTags.length, `wishRoutes: all ${expectedTags.length} tags present (got ${tagCount})`);
}

// 5. Critical PII fix: lines 98-103 no longer expose full phone
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/wishRoutes.js'), 'utf8'
  );

  // Old pattern: rawPhone: rawPhone (full phone exposed)
  assert(
    !routeSrc.includes("rawPhone: rawPhone,"),
    'wishRoutes PII FIX: rawPhone no longer exposed in log'
  );
  assert(
    !routeSrc.includes("normalizedPhone: normalizedPhone,"),
    'wishRoutes PII FIX: normalizedPhone no longer exposed in log'
  );

  // New pattern: only length info
  assert(
    routeSrc.includes("reason: 'invalid_length'") && routeSrc.includes('length:'),
    'wishRoutes PII FIX: phone rejection logs length only'
  );
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ Fallback safety: req.log || console ═══\n');

// 6. All routes have fallback pattern — no crash if req.log is undefined
{
  const fs = require('fs');
  const path = require('path');

  // videoJobRoutes
  const vidSrc = fs.readFileSync(path.join(__dirname, '../../routes/videoJobRoutes.js'), 'utf8');
  assert(
    vidSrc.includes('req.log || console'),
    'videoJobRoutes: has req.log || console fallback'
  );

  // wuRoutes
  const wuSrc = fs.readFileSync(path.join(__dirname, '../../routes/wuRoutes.js'), 'utf8');
  assert(
    wuSrc.includes('req.log || console'),
    'wuRoutes: has req.log || console fallback'
  );

  // wishRoutes — uses both patterns: `const log = req.log || console` and `(req.log || console)`
  const wishSrc = fs.readFileSync(path.join(__dirname, '../../routes/wishRoutes.js'), 'utf8');
  assert(
    wishSrc.includes('req.log || console'),
    'wishRoutes: has req.log || console fallback'
  );
}

// 7. Functional fallback test: no crash when req.log is undefined
{
  let crashed = false;
  try {
    // Simulate the fallback pattern used in all routes
    const req = { log: undefined };
    const log = req.log || console;
    log.info('test message', { action: 'test' });
    log.error('test error', { action: 'test' });
    log.warn('test warn', { action: 'test' });
  } catch (e) {
    crashed = true;
  }
  assert(!crashed, 'fallback: req.log=undefined does not crash');
}

// 8. Functional fallback test: works when req.log is a spy
{
  const spy = createLogSpy();
  const req = { log: spy };
  const log = req.log || console;
  log.info('[Test] msg', { action: 'test' });
  assert(spy.calls.info.length === 1, 'fallback: req.log spy receives info call');
  assert(spy.calls.info[0].msg === '[Test] msg', 'fallback: req.log spy receives correct message');
  assert(spy.calls.info[0].meta.action === 'test', 'fallback: req.log spy receives correct meta');
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ Module-level console calls preserved ═══\n');

// 9. Module-level console calls are intentionally kept
{
  const fs = require('fs');
  const path = require('path');

  const vidSrc = fs.readFileSync(path.join(__dirname, '../../routes/videoJobRoutes.js'), 'utf8');
  const wuSrc = fs.readFileSync(path.join(__dirname, '../../routes/wuRoutes.js'), 'utf8');
  const wishSrc = fs.readFileSync(path.join(__dirname, '../../routes/wishRoutes.js'), 'utf8');

  // Count total console calls — should only be module-level
  const vidConsole = (vidSrc.match(/console\.(log|error|warn)/g) || []).length;
  const wuConsole = (wuSrc.match(/console\.(log|error|warn)/g) || []).length;
  const wishConsole = (wishSrc.match(/console\.(log|error|warn)/g) || []).length;

  assert(vidConsole === 2, `videoJobRoutes: exactly 2 module-level console calls (got ${vidConsole})`);
  assert(wuConsole === 3, `wuRoutes: exactly 3 module-level console calls (got ${wuConsole})`);
  assert(wishConsole === 2, `wishRoutes: exactly 2 module-level console calls (got ${wishConsole})`);
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══ settlementRoutes: req.log migration + redaction ═══\n');

// 10. Redaction helpers — redactId
{
  const settlementRouter = require('../../routes/settlementRoutes');
  const { _redactId: redactId } = settlementRouter;

  assert(typeof redactId === 'function', 'redactId: exported as function');
  assert(redactId(null) === '(none)', 'redactId: null → "(none)"');
  assert(redactId('') === '(none)', 'redactId: empty → "(none)"');
  assert(redactId('abc') === 'abc', 'redactId: short id kept whole');
  assert(redactId('abcdef') === 'abcdef', 'redactId: exactly 6 chars kept whole');
  assert(redactId('abcdefg') === '…bcdefg', 'redactId: 7 chars → last 6 with ellipsis');
  assert(redactId('evt_123456789') === '…456789', 'redactId: long id → last 6');
  assert(redactId(12345678) === '…345678', 'redactId: numeric id handled');
}

// 11. Redaction helpers — bucketAmount
{
  const { _bucketAmount: bucketAmount } = require('../../routes/settlementRoutes');

  assert(typeof bucketAmount === 'function', 'bucketAmount: exported as function');
  assert(bucketAmount(-5) === 'negative', 'bucketAmount: negative');
  assert(bucketAmount(0) === '0-9', 'bucketAmount: 0');
  assert(bucketAmount(5) === '0-9', 'bucketAmount: 5');
  assert(bucketAmount(9.99) === '0-9', 'bucketAmount: 9.99');
  assert(bucketAmount(10) === '10-49', 'bucketAmount: 10');
  assert(bucketAmount(49) === '10-49', 'bucketAmount: 49');
  assert(bucketAmount(50) === '50-99', 'bucketAmount: 50');
  assert(bucketAmount(100) === '100-999', 'bucketAmount: 100');
  assert(bucketAmount(999) === '100-999', 'bucketAmount: 999');
  assert(bucketAmount(1000) === '1k-9k', 'bucketAmount: 1000');
  assert(bucketAmount(9999) === '1k-9k', 'bucketAmount: 9999');
  assert(bucketAmount(10000) === '10k+', 'bucketAmount: 10000');
  assert(bucketAmount(999999) === '10k+', 'bucketAmount: 999999');
  assert(bucketAmount(null) === '0-9', 'bucketAmount: null → 0-9');
  assert(bucketAmount(undefined) === '0-9', 'bucketAmount: undefined → 0-9');
}

// 12. All settlement log tags present
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/settlementRoutes.js'), 'utf8'
  );

  const expectedTags = [
    'balance_invariant_failed',
    'event_create_failed',
    'reversal_create_failed',
    'event_get_failed',
    'creator_summary_failed',
    'creator_history_failed',
    'batch_create_failed',
    'batch_confirm_failed',
    'batch_get_failed',
    'batch_list_failed',
    'stats_get_failed',
    'constants_get_failed',
    'calculate_failed',
    'release_held_failed',
  ];

  let tagCount = 0;
  for (const tag of expectedTags) {
    const found = routeSrc.includes(tag);
    if (found) tagCount++;
    assert(found, `settlement tag: ${tag}`);
  }
  assert(tagCount === expectedTags.length, `settlement: all ${expectedTags.length} tags present (got ${tagCount})`);
}

// 13. Settlement logs do NOT contain sensitive keys
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/settlementRoutes.js'), 'utf8'
  );

  // Extract all log call lines
  const logLines = routeSrc.split('\n').filter(line => {
    const trimmed = line.trim();
    return (
      (trimmed.includes('(req.log || console).') || trimmed.includes('(log || console).')) &&
      !trimmed.startsWith('//')
    );
  });

  assert(logLines.length > 0, `settlement: found ${logLines.length} log lines to check`);

  // Forbidden keys that must NEVER appear in log calls
  const forbiddenKeys = [
    'token', 'authorization', 'card', 'account', 'signature',
    'bank', 'secret', 'password', 'credential',
    'buyer_user_id', 'creator_root_id', 'referrer_id',
  ];

  for (const key of forbiddenKeys) {
    const found = logLines.some(l => l.toLowerCase().includes(key.toLowerCase()));
    assert(!found, `settlement sensitive: no '${key}' in log calls`);
  }
}

// 14. Settlement: only error.message, not full error object
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/settlementRoutes.js'), 'utf8'
  );

  // Extract catch blocks with log calls
  const logLines = routeSrc.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.includes('.error(') && trimmed.includes('[Settlement]');
  });

  // None should pass the raw `error` object — all should use `error.message`
  const rawErrorPassed = logLines.some(l => {
    // Look for patterns like: error }  or  error)  — passing the raw error object
    // But NOT: error.message or error:
    return /,\s*error\s*[})]/i.test(l) && !l.includes('error.message');
  });
  assert(!rawErrorPassed, 'settlement: no raw error object in log calls (uses error.message only)');
}

// 15. Settlement: req.log || console fallback in all handlers
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/settlementRoutes.js'), 'utf8'
  );

  assert(
    routeSrc.includes('req.log || console'),
    'settlement: has req.log || console fallback'
  );

  // Count fallback patterns — should be 13 catch blocks + 1 invariant (via `log || console`)
  const catchFallbacks = (routeSrc.match(/\(req\.log \|\| console\)/g) || []).length;
  assert(catchFallbacks === 13, `settlement: 13 catch-block fallback patterns (got ${catchFallbacks})`);

  // checkInvariant uses (log || console)
  assert(
    routeSrc.includes('(log || console).error'),
    'settlement: checkInvariant uses log || console fallback'
  );
}

// 16. Settlement: exactly 1 module-level console.log (init)
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/settlementRoutes.js'), 'utf8'
  );

  const consoleCount = (routeSrc.match(/console\.(log|error|warn)/g) || []).length;
  assert(consoleCount === 1, `settlement: exactly 1 module-level console call (got ${consoleCount})`);
}

// 17. Settlement: checkInvariant uses redactId for eventId
{
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/settlementRoutes.js'), 'utf8'
  );

  assert(
    routeSrc.includes('redactId(eventId)'),
    'settlement: checkInvariant redacts eventId'
  );
  assert(
    routeSrc.includes('bucketAmount('),
    'settlement: checkInvariant uses bucketAmount for balance diff'
  );
}

// 18. Settlement: response body unchanged on error paths
{
  // Verify that all catch blocks still return the same status/body structure
  const fs = require('fs');
  const path = require('path');
  const routeSrc = fs.readFileSync(
    path.join(__dirname, '../../routes/settlementRoutes.js'), 'utf8'
  );

  // All error responses should have { success: false, error: 'server_error' }
  const serverErrorResponses = (routeSrc.match(/error: 'server_error'/g) || []).length;
  assert(serverErrorResponses >= 13, `settlement: ${serverErrorResponses} server_error responses (>=13 expected)`);

  // Some include message: error.message
  const withMessage = (routeSrc.match(/message: error\.message/g) || []).length;
  assert(withMessage >= 4, `settlement: ${withMessage} responses include error.message (>=4 expected)`);
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════');
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('═══════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
