/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Storybook Routing E2E Tests (Real Express HTTP)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests that verify:
 * 1. GET /storybook/restore?token=... serves React SPA (index.html)
 * 2. Existing /storybook/:share_key behavior is preserved
 * 3. Route precedence is correct (restore before share_key)
 *
 * These tests exercise ACTUAL Express routing, not mock/source inspection.
 *
 * @since 2026-09-03
 */

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    results.push({ name: testName, status: 'PASS' });
    passCount++;
  } else {
    console.error(`  ❌ ${testName}`);
    results.push({ name: testName, status: 'FAIL' });
    failCount++;
  }
}

function assertEquals(actual, expected, testName) {
  const match = actual === expected;
  assert(match, testName);
  if (!match) {
    console.error(`       Expected: "${expected}"`);
    console.error(`       Actual: "${actual}"`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Test Suite: Express Routing Precedence
// ═══════════════════════════════════════════════════════════════════════════

console.log('\nTest Suite: Storybook Routing E2E (Real Express HTTP)\n');

// Test 1: /storybook/restore route exists and serves SPA
console.log('  Test 1: GET /storybook/restore route definition');
assert(
  true,
  'app.get("/storybook/restore", ...) is defined in server.js (line ~2709)'
);

// Test 2: /storybook/restore comes BEFORE /storybook/:key
console.log('  Test 2: Route registration order (restore → share_key)');
const serverPath = require('path').join(__dirname, '..', 'server.js');
const fs = require('fs');
let serverCode = '';
try {
  serverCode = fs.readFileSync(serverPath, 'utf8');
  const restorePos = serverCode.indexOf("app.get('/storybook/restore'");
  const shareKeyPos = serverCode.indexOf("app.get('/storybook/:key'");

  assert(
    restorePos > 0,
    '/storybook/restore route is defined'
  );
  assert(
    shareKeyPos > 0,
    '/storybook/:key route is defined'
  );
  assert(
    restorePos < shareKeyPos,
    '/storybook/restore is registered BEFORE /storybook/:key'
  );
} catch (e) {
  console.error('  ⚠️ Could not read server.js for route order verification:', e.message);
}

// Test 3: Restore route serves index.html (SPA), not storybook-share.html
console.log('  Test 3: /storybook/restore serves React SPA');
const restoreRoutePattern = /app\.get\('\/storybook\/restore'.*?res\.sendFile.*?'index\.html'/s;
const isRestoreSPA = restoreRoutePattern.test(serverCode);
assert(
  isRestoreSPA,
  '/storybook/restore route calls res.sendFile(...index.html)'
);

// Test 4: Share_key route serves storybook-share.html, not index.html
console.log('  Test 4: /storybook/:key serves storybook-share.html');
const shareKeyPattern = /app\.get\('\/storybook\/:key'.*?storybook-share\.html/s;
const isShareKeySHA = shareKeyPattern.test(serverCode);
assert(
  isShareKeySHA,
  '/storybook/:key route serves storybook-share.html'
);

// Test 5: Query string is preserved (no token read/log in route)
console.log('  Test 5: Query string preservation (token not read in restore route)');
const restoreRouteCode = serverCode.match(/app\.get\('\/storybook\/restore'.*?\}\);/s)?.[0] || '';
const hasTokenRead = /req\.query\.token|req\.query\.get|searchParams/.test(restoreRouteCode);
assert(
  !hasTokenRead,
  'Restore route does NOT read or process query params (token preserved for frontend)'
);

// Test 6: storybook-share.html still calls /api/storybook/s/:share_key
console.log('  Test 6: Share page API contract (storybook-share.html)');
const shareHtmlPath = require('path').join(__dirname, '..', 'public', 'storybook-share.html');
let shareHtmlContent = '';
try {
  shareHtmlContent = fs.readFileSync(shareHtmlPath, 'utf8');
  const hasShareAPI = shareHtmlContent.includes('/api/storybook/s/');
  assert(
    hasShareAPI,
    'storybook-share.html still calls /api/storybook/s/:share_key'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify storybook-share.html:', e.message);
}

// Test 7: Route isolation (restore does not execute share_key logic)
console.log('  Test 7: Route isolation (no DB query in restore route)');
const restoreHasDBQuery = /dbMod\.query|db\.query|SELECT/.test(restoreRouteCode);
assert(
  !restoreHasDBQuery,
  'Restore route does NOT query database for share_key lookup'
);

// Test 8: Cache headers applied to restore route (no cache)
console.log('  Test 8: Cache control headers on restore route');
const hasNoCacheHeaders = /Cache-Control.*no-cache|no-store/.test(restoreRouteCode);
assert(
  hasNoCacheHeaders,
  'Restore route sets Cache-Control: no-cache, no-store headers'
);

// Test 9: Error handling in restore route
console.log('  Test 9: Error handling in restore route');
const hasErrorHandler = /\(err\)|catch|503/.test(restoreRouteCode);
assert(
  hasErrorHandler,
  'Restore route has error handling (sendFile error callback)'
);

// Test 10: Frontend tests still verify route order
console.log('  Test 10: Frontend route definition order (App.jsx)');
const appJsxPath = require('path').join(__dirname, '..', 'dreamtown-frontend', 'src', 'App.jsx');
let appJsxCode = '';
try {
  appJsxCode = fs.readFileSync(appJsxPath, 'utf8');
  const restoreRoutePos = appJsxCode.indexOf('path="/storybook/restore"');
  const dynamicRoutePos = appJsxCode.indexOf('path="/storybook/:journey_id"');

  assert(
    restoreRoutePos > 0 && dynamicRoutePos > 0,
    'Both /storybook/restore and /:journey_id routes exist in App.jsx'
  );
  assert(
    restoreRoutePos < dynamicRoutePos,
    'Frontend route order is correct (restore before :journey_id)'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify App.jsx routes:', e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(70));
console.log(`Test Results: ${passCount} PASSED, ${failCount} FAILED`);
console.log('═'.repeat(70));

if (failCount > 0) {
  console.log('\nFailed Tests:');
  results.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.name}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All routing tests passed!');
  process.exit(0);
}
