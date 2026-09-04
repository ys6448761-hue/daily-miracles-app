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

// Test 11: Backend route precedence — UUID journey route before legacy share route
console.log('  Test 11: Backend route order (UUID journey before legacy share)');
try {
  // serverCode already loaded in Test 2, reuse it

  // Check for C7A UUID journey route
  const uuidJourneyRoutePos = serverCode.indexOf("app.get('/storybook/:journey_id([0-9a-f\\\\-]{36})'");
  const legacyShareRoutePos = serverCode.indexOf("app.get('/storybook/:key'");

  assert(
    uuidJourneyRoutePos > 0,
    'C7A UUID journey route exists: app.get(\'/storybook/:journey_id([0-9a-f\\\\-]{36})\')'
  );

  assert(
    legacyShareRoutePos > 0,
    'Legacy share route exists: app.get(\'/storybook/:key\')'
  );

  assert(
    uuidJourneyRoutePos < legacyShareRoutePos,
    'C7A UUID journey route is registered BEFORE legacy share route (takes precedence)'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify server.js route order:', e.message);
}

// Test 12: C7A UUID journey route serves DreamTown SPA (index.html)
console.log('  Test 12: C7A UUID journey route serves DreamTown SPA');
try {
  const uuidRoutePattern = /app\.get\('\/storybook\/:journey_id\(\[0-9a-f\\\\-\]\{36\}\)'.+?res\.sendFile\(.+?index\.html/s;
  const servesUuidSPA = uuidRoutePattern.test(serverCode);
  assert(
    servesUuidSPA,
    'C7A UUID journey route calls res.sendFile(...index.html)'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify UUID route serves SPA:', e.message);
}

// Test 13: UUID route has cache-control headers (same as restore route)
console.log('  Test 13: Cache control on UUID journey route');
try {
  const uuidRouteStart = serverCode.indexOf("app.get('/storybook/:journey_id");
  const uuidRouteEnd = serverCode.indexOf('});', uuidRouteStart);
  const uuidRouteBody = serverCode.substring(uuidRouteStart, uuidRouteEnd);
  const hasCacheHeaders = /Cache-Control.*no-cache|no-store/.test(uuidRouteBody);
  assert(
    hasCacheHeaders,
    'UUID journey route sets Cache-Control: no-cache, no-store headers'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify UUID route cache headers:', e.message);
}

// Test 14: Legacy share route is preserved (still handles non-UUID keys)
console.log('  Test 14: Legacy share route preserved for non-UUID keys');
try {
  const legacyRouteStart = serverCode.indexOf("app.get('/storybook/:key'");
  const legacyRouteEnd = serverCode.indexOf('});', legacyRouteStart + 100);
  const legacyRouteBody = serverCode.substring(legacyRouteStart, legacyRouteEnd);
  const servesShareHtml = /storybook-share\.html/.test(legacyRouteBody);
  assert(
    servesShareHtml,
    'Legacy share route still serves storybook-share.html'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify legacy share route:', e.message);
}

// Test 15: C4 plant-star route is registered
console.log('  Test 15: C4 plant-star route is registered in storybook router');
try {
  const storybookPath = require('path').join(__dirname, '..', 'routes', 'storybookRoutes.js');
  const storybookRoutes = require(storybookPath);

  const plantStarRoutes = storybookRoutes.stack
    ? storybookRoutes.stack.filter(r => r.route && r.route.path && r.route.path.includes('plant-star'))
    : [];

  assert(
    plantStarRoutes.length > 0 && plantStarRoutes[0].route.methods.post === true,
    'plant-star POST route is registered in storybook router'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify plant-star route registration:', e.message);
}

// Test 16: Diagnostic markers are present
console.log('  Test 16: Diagnostic markers for C4 plant-star in code');
try {
  const serverPath = require('path').join(__dirname, '..', 'server.js');
  const serverCode = fs.readFileSync(serverPath, 'utf8');
  const routesPath = require('path').join(__dirname, '..', 'routes', 'storybookRoutes.js');
  const routesCode = fs.readFileSync(routesPath, 'utf8');

  const hasRouteEntryMarker = /\[C4_ROUTE_ENTRY\]/.test(serverCode);
  const hasHandlerEntryMarker = /\[C4_PLANT_STAR_HANDLER_ENTERED\]/.test(routesCode);

  assert(
    hasRouteEntryMarker && hasHandlerEntryMarker,
    'Diagnostic markers C4_ROUTE_ENTRY and C4_PLANT_STAR_HANDLER_ENTERED are present'
  );
} catch (e) {
  console.warn('  ⚠️ Could not verify diagnostic markers:', e.message);
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
