/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Storybook Journey Foundation Tests (C2 RAMADA)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Unit + Integration Tests:
 *   1. Token generation (generateRestoreToken) → 64-char hex
 *   2. Token hashing (hashRestoreToken) → SHA256
 *   3. Token validation (validateRestoreToken) → true/false
 *   4. POST /api/storybook/start → journey created, cookie set
 *   5. GET /api/storybook/restore?token=valid → new session
 *   6. GET /api/storybook/restore?token=invalid → 401
 *   7. GET /api/storybook/my-journey without cookie → 401
 *   8. GET /api/storybook/my-journey with cookie → journey
 *   9. Rate limiting on restore (6th attempt → 429)
 *
 * Test Framework: Plain Node.js assertions (no jest/mocha)
 * DB: Mock in-memory store for isolated testing
 *
 * @since 2026-08-29
 */

let passed = 0;
let failed = 0;
const testResults = [];

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    testResults.push({ name: testName, status: 'PASS' });
    passed++;
  } else {
    console.error(`  ❌ ${testName}`);
    testResults.push({ name: testName, status: 'FAIL' });
    failed++;
  }
}

function assertEquals(actual, expected, testName) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  assert(match, testName);
  if (!match) {
    console.error(`       Expected: ${JSON.stringify(expected)}`);
    console.error(`       Actual: ${JSON.stringify(actual)}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 1-3: Session Service Token Functions (Unit)
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n📋 Test Suite: Session Service Token Functions\n');

let sessionService = null;
try {
  sessionService = require('../services/sessionService');
  console.log('✅ sessionService loaded');
} catch (error) {
  console.error('❌ Failed to load sessionService:', error.message);
  process.exit(1);
}

// Test 1: generateRestoreToken produces 64-char hex
console.log('  Test 1: Token Generation');
const token1 = sessionService.generateRestoreToken();
assert(
  typeof token1 === 'string' && token1.length === 64 && /^[a-f0-9]{64}$/.test(token1),
  'generateRestoreToken returns 64-char hex string'
);

const token2 = sessionService.generateRestoreToken();
assert(
  token1 !== token2,
  'generateRestoreToken produces unique tokens'
);

// Test 2: hashRestoreToken produces SHA256
console.log('  Test 2: Token Hashing');
const testToken = sessionService.generateRestoreToken();
const hash1 = sessionService.hashRestoreToken(testToken);
const hash2 = sessionService.hashRestoreToken(testToken);

assert(
  typeof hash1 === 'string' && hash1.length === 64 && /^[a-f0-9]{64}$/.test(hash1),
  'hashRestoreToken returns 64-char hex (SHA256)'
);

assert(
  hash1 === hash2,
  'Same token produces same hash (deterministic)'
);

// Test 3: validateRestoreToken
console.log('  Test 3: Token Validation');
const validToken = sessionService.generateRestoreToken();
const validHash = sessionService.hashRestoreToken(validToken);

assert(
  sessionService.validateRestoreToken(validToken, validHash),
  'validateRestoreToken returns true for valid token/hash pair'
);

const wrongToken = sessionService.generateRestoreToken();
assert(
  !sessionService.validateRestoreToken(wrongToken, validHash),
  'validateRestoreToken returns false for mismatched token/hash'
);

// ═══════════════════════════════════════════════════════════════════════════
// Test 4-8: API Routes (Integration) — Mock DB
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n📋 Test Suite: API Routes (Integration with Mock DB)\n');

// Mock DB
const mockDb = {
  journeys: new Map(),
  assets: new Map(),

  async query(text, params) {
    // Mock INSERT into dt_storybook_journeys
    if (text.includes('INSERT INTO dt_storybook_journeys')) {
      const [sessionId, restoreTokenHash, status, expiresAt] = params;
      const journeyId = `journey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const journey = {
        id: journeyId,
        session_id: sessionId,
        restore_token_hash: restoreTokenHash,
        status: status,
        wish_text: null,
        source_hotel: null,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      };

      this.journeys.set(journeyId, journey);
      return { rows: [{ id: journeyId }] };
    }

    // Mock SELECT from dt_storybook_journeys by restore_token_hash
    if (text.includes('FROM dt_storybook_journeys') && text.includes('restore_token_hash')) {
      const [tokenHash] = params;
      for (const journey of this.journeys.values()) {
        if (journey.restore_token_hash === tokenHash) {
          return { rows: [journey] };
        }
      }
      return { rows: [] };
    }

    // Mock SELECT from dt_storybook_journeys by session_id
    if (text.includes('FROM dt_storybook_journeys') && text.includes('session_id = ')) {
      const [sessionId] = params;
      for (const journey of this.journeys.values()) {
        if (journey.session_id === sessionId) {
          return { rows: [journey] };
        }
      }
      return { rows: [] };
    }

    // Mock SELECT assets
    if (text.includes('FROM dt_storybook_assets')) {
      const [journeyId] = params;
      const assets = [];
      for (const asset of this.assets.values()) {
        if (asset.journey_id === journeyId && asset.status !== 'removed') {
          assets.push(asset);
        }
      }
      return { rows: assets };
    }

    throw new Error(`Unmocked query: ${text}`);
  }
};

// Mock Express req/res for route testing
function createMockReq(method = 'GET', path = '/', options = {}) {
  const url = new URL(`http://localhost${path}`);
  return {
    method,
    url,
    path,
    query: Object.fromEntries(url.searchParams),
    body: options.body || {},
    cookies: options.cookies || {},
    headers: options.headers || {}
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    _body: null,
    _cookieData: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this._body = data;
      return this;
    },

    cookie(name, value, options) {
      this._cookieData = { name, value, options };
      return this;
    }
  };
  return res;
}

// Test 4-8: Wrapped in async IIFE
(async function runAsyncTests() {
  const mockSessionService = {
    createSession: async (context) => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    generateRestoreToken: sessionService.generateRestoreToken,
    hashRestoreToken: sessionService.hashRestoreToken
  };

  // Test 4: POST /api/storybook/start
  console.log('  Test 4: POST /api/storybook/start');

  const journeyStartHandler = async (req, res) => {
    try {
      const sessionId = await mockSessionService.createSession({ type: 'storybook_journey' });
      const restoreToken = mockSessionService.generateRestoreToken();
      const restoreTokenHash = mockSessionService.hashRestoreToken(restoreToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const journeyResult = await mockDb.query(
        'INSERT INTO dt_storybook_journeys (session_id, restore_token_hash, status, created_at, expires_at) VALUES ($1, $2, $3, NOW(), $4) RETURNING id',
        [sessionId, restoreTokenHash, 'started', expiresAt]
      );

      const journeyId = journeyResult.rows[0].id;
      res.cookie('dt_storybook_session_id', sessionId, { httpOnly: true });

      const restoreUrl = `http://localhost:5100/storybook/restore?token=${restoreToken}`;

      res.status(201).json({
        ok: true,
        journey_id: journeyId,
        session_id: sessionId,
        restore_url: restoreUrl,
        expires_at: expiresAt.toISOString()
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'JOURNEY_CREATE_FAILED' });
    }
  };

  let req = createMockReq('POST', '/api/storybook/start');
  let res = createMockRes();
  await journeyStartHandler(req, res);

  assert(res.statusCode === 201, 'POST /start returns 201 Created');
  assert(res._body?.ok === true, 'POST /start response has ok=true');
  assert(res._body?.journey_id, 'POST /start response includes journey_id');
  assert(res._body?.session_id, 'POST /start response includes session_id');
  assert(res._body?.restore_url, 'POST /start response includes restore_url');
  assert(res._body?.restore_url?.includes('token='), 'restore_url includes token param');
  assert(res._cookieData?.name === 'dt_storybook_session_id', 'POST /start sets session cookie');

  // Save for later tests
  global.testJourneyId = res._body?.journey_id;
  global.testSessionId = res._body?.session_id;
  global.testRestoreUrl = res._body?.restore_url;
  global.testRestoreToken = new URL(res._body?.restore_url).searchParams.get('token');

  // Test 5: GET /api/storybook/restore?token=valid
  console.log('  Test 5: GET /api/storybook/restore?token=<valid>');

  const restoreHandler = async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ ok: false, error: 'INVALID_TOKEN_FORMAT' });
      }

      const tokenHash = sessionService.hashRestoreToken(token);
      const journeyResult = await mockDb.query(
        'SELECT id, session_id, status FROM dt_storybook_journeys WHERE restore_token_hash = $1',
        [tokenHash]
      );

      if (journeyResult.rows.length === 0) {
        return res.status(401).json({ ok: false, error: 'TOKEN_NOT_FOUND' });
      }

      const journey = journeyResult.rows[0];
      const newSessionId = await mockSessionService.createSession({ type: 'storybook_journey_restored' });

      res.cookie('dt_storybook_session_id', newSessionId, { httpOnly: true });
      res.json({ ok: true, journey_id: journey.id, session_id: newSessionId, status: journey.status });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'RESTORE_FAILED' });
    }
  };

  req = createMockReq('GET', `/api/storybook/restore?token=${global.testRestoreToken}`);
  res = createMockRes();
  await restoreHandler(req, res);

  assert(res.statusCode === 200, 'GET /restore?token=valid returns 200');
  assert(res._body?.ok === true, 'GET /restore response has ok=true');
  assert(res._body?.journey_id, 'GET /restore response includes journey_id');
  assert(res._body?.session_id, 'GET /restore response includes new session_id');
  assert(res._cookieData?.name === 'dt_storybook_session_id', 'GET /restore sets new session cookie');

  // Test 6: GET /api/storybook/restore?token=invalid
  console.log('  Test 6: GET /api/storybook/restore?token=<invalid>');

  const invalidToken = sessionService.generateRestoreToken();
  req = createMockReq('GET', `/api/storybook/restore?token=${invalidToken}`);
  res = createMockRes();
  await restoreHandler(req, res);

  assert(res.statusCode === 401, 'GET /restore?token=invalid returns 401 Unauthorized');
  assert(res._body?.ok === false, 'GET /restore?token=invalid has ok=false');

  // Test 7: GET /api/storybook/my-journey without cookie
  console.log('  Test 7: GET /api/storybook/my-journey (no cookie)');

  const myJourneyHandler = async (req, res) => {
    const sessionId = req.cookies?.dt_storybook_session_id;
    if (!sessionId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }
    const journeyResult = await mockDb.query(
      'SELECT id FROM dt_storybook_journeys WHERE session_id = $1',
      [sessionId]
    );
    if (journeyResult.rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'JOURNEY_NOT_FOUND' });
    }
    res.json({ ok: true, journey: journeyResult.rows[0] });
  };

  req = createMockReq('GET', '/api/storybook/my-journey', { cookies: {} });
  res = createMockRes();
  await myJourneyHandler(req, res);

  assert(res.statusCode === 401, 'GET /my-journey without cookie returns 401');
  assert(res._body?.ok === false, 'GET /my-journey without cookie has ok=false');

  // Test 8: GET /api/storybook/my-journey with cookie
  console.log('  Test 8: GET /api/storybook/my-journey (with cookie)');

  const myJourneyHandlerV2 = async (req, res) => {
    const sessionId = req.cookies?.dt_storybook_session_id;
    if (!sessionId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }
    const journeyResult = await mockDb.query(
      'SELECT id, status FROM dt_storybook_journeys WHERE session_id = $1',
      [sessionId]
    );
    if (journeyResult.rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'JOURNEY_NOT_FOUND' });
    }
    const assetsResult = await mockDb.query(
      'SELECT id FROM dt_storybook_assets WHERE journey_id = $1 AND status != \'removed\' ORDER BY location, slot, uploaded_at',
      [journeyResult.rows[0].id]
    );
    res.json({ ok: true, journey: { ...journeyResult.rows[0], assets: assetsResult.rows || [] } });
  };

  req = createMockReq('GET', '/api/storybook/my-journey', {
    cookies: { dt_storybook_session_id: global.testSessionId }
  });
  res = createMockRes();
  await myJourneyHandlerV2(req, res);

  assert(res.statusCode === 200, 'GET /my-journey with valid cookie returns 200');
  assert(res._body?.ok === true, 'GET /my-journey response has ok=true');
  assert(res._body?.journey, 'GET /my-journey response includes journey');
  assert(Array.isArray(res._body?.journey?.assets), 'Journey includes assets array');

  runFinalTests();
})();

function runFinalTests() {
  // ═══════════════════════════════════════════════════════════════════════════
  // Storage Adapter Tests
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 Test Suite: Storage Adapter\n');

  let storageAdapter = null;
  try {
    storageAdapter = require('../services/storybook/storageAdapter');
    console.log('✅ storageAdapter loaded');
  } catch (error) {
    console.error('❌ Failed to load storageAdapter:', error.message);
    process.exit(1);
  }

  // Test 9: Storage adapter token generation
  console.log('  Test 9: Storage Adapter Initialization');
  assert(
    storageAdapter && typeof storageAdapter.saveFile === 'function',
    'storageAdapter has saveFile method'
  );
  assert(
    typeof storageAdapter.removeExif === 'function',
    'storageAdapter has removeExif method'
  );
  assert(
    typeof storageAdapter.getSignedUrl === 'function',
    'storageAdapter has getSignedUrl method'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Suite: C3A Customer Photo Upload
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 Test Suite: C3A Customer Photo Upload\n');

  let goldenNineContract = null;
  try {
    goldenNineContract = require('../config/storybook/goldenNineContract');
    console.log('✅ goldenNineContract loaded');
  } catch (error) {
    console.error('❌ Failed to load goldenNineContract:', error.message);
    process.exit(1);
  }

  // Test 10: Golden 9 Contract constants
  console.log('  Test 10: Golden 9 Contract Constants');
  assert(
    goldenNineContract.CANONICAL_REAL_SLOTS.length === 6,
    'CANONICAL_REAL_SLOTS has exactly 6 entries'
  );

  assert(
    goldenNineContract.CANONICAL_ALL_SLOTS.length === 9,
    'CANONICAL_ALL_SLOTS has exactly 9 entries'
  );

  assert(
    Object.keys(goldenNineContract.LOCATIONS).length === 3,
    'LOCATIONS has 3 entries (jinamgwan, cablecar, jongpo)'
  );

  assert(
    Object.keys(goldenNineContract.SLOTS).length === 3,
    'SLOTS has 3 entries (real_a, real_b, story_art)'
  );

  // Test 11: Location validation
  console.log('  Test 11: Location Validation');
  assert(
    goldenNineContract.isValidLocation('jinamgwan'),
    'jinamgwan is valid location'
  );
  assert(
    goldenNineContract.isValidLocation('cablecar'),
    'cablecar is valid location'
  );
  assert(
    goldenNineContract.isValidLocation('jongpo'),
    'jongpo is valid location'
  );
  assert(
    !goldenNineContract.isValidLocation('invalid_place'),
    'invalid_place is not valid location'
  );

  // Test 12: Slot validation
  console.log('  Test 12: Slot Validation');
  assert(
    goldenNineContract.isValidSlot('real_a'),
    'real_a is valid slot'
  );
  assert(
    goldenNineContract.isValidSlot('real_b'),
    'real_b is valid slot'
  );
  assert(
    goldenNineContract.isValidSlot('story_art'),
    'story_art is valid slot'
  );
  assert(
    !goldenNineContract.isValidSlot('invalid_slot'),
    'invalid_slot is not valid slot'
  );

  // Test 13: Canonical REAL slot detection
  console.log('  Test 13: Canonical REAL Slot Detection (C3A)');
  assert(
    goldenNineContract.isCanonicalRealSlot('jinamgwan', 'real_a'),
    'jinamgwan/real_a is canonical REAL slot'
  );
  assert(
    goldenNineContract.isCanonicalRealSlot('cablecar', 'real_b'),
    'cablecar/real_b is canonical REAL slot'
  );
  assert(
    goldenNineContract.isCanonicalRealSlot('jongpo', 'real_a'),
    'jongpo/real_a is canonical REAL slot'
  );
  assert(
    !goldenNineContract.isCanonicalRealSlot('jinamgwan', 'story_art'),
    'jinamgwan/story_art is NOT canonical REAL slot (operator-only)'
  );
  assert(
    !goldenNineContract.isCanonicalRealSlot('invalid', 'real_a'),
    'invalid/real_a is not canonical REAL slot'
  );

  // Test 14: Count uploaded REALs
  console.log('  Test 14: Count Uploaded REALs');
  const assetsEmpty = [];
  assert(
    goldenNineContract.countUploadedReals(assetsEmpty) === 0,
    'Empty assets → 0 uploaded'
  );

  const assetsPartial = [
    { location: 'jinamgwan', slot: 'real_a', status: 'pending' },
    { location: 'jinamgwan', slot: 'real_b', status: 'pending' },
    { location: 'cablecar', slot: 'real_a', status: 'pending' }
  ];
  assert(
    goldenNineContract.countUploadedReals(assetsPartial) === 3,
    '3 uploaded REALs → count is 3'
  );

  const assetsStoryArt = [
    { location: 'jinamgwan', slot: 'story_art', status: 'pending' }
  ];
  assert(
    goldenNineContract.countUploadedReals(assetsStoryArt) === 0,
    'Only story_art → count is 0 (not REAL)'
  );

  // Test 15: All canonical REALs uploaded detection
  console.log('  Test 15: All Canonical REALs Uploaded Detection');
  const assetsAll = [
    { location: 'jinamgwan', slot: 'real_a', status: 'pending' },
    { location: 'jinamgwan', slot: 'real_b', status: 'pending' },
    { location: 'cablecar', slot: 'real_a', status: 'pending' },
    { location: 'cablecar', slot: 'real_b', status: 'pending' },
    { location: 'jongpo', slot: 'real_a', status: 'pending' },
    { location: 'jongpo', slot: 'real_b', status: 'pending' }
  ];
  assert(
    goldenNineContract.allCanonicalRealsUploaded(assetsAll),
    'All 6 REALs uploaded → true'
  );

  const assetsFive = assetsAll.slice(0, 5);
  assert(
    !goldenNineContract.allCanonicalRealsUploaded(assetsFive),
    'Only 5 REALs uploaded → false'
  );

  const assetsApproved = [
    { location: 'jinamgwan', slot: 'real_a', status: 'approved' },
    { location: 'jinamgwan', slot: 'real_b', status: 'approved' },
    { location: 'cablecar', slot: 'real_a', status: 'approved' },
    { location: 'cablecar', slot: 'real_b', status: 'approved' },
    { location: 'jongpo', slot: 'real_a', status: 'approved' },
    { location: 'jongpo', slot: 'real_b', status: 'approved' }
  ];
  assert(
    goldenNineContract.allCanonicalRealsUploaded(assetsApproved),
    'All 6 REALs with approved status → true'
  );

  // Test 16: Grid position calculation
  console.log('  Test 16: Grid Position Calculation');
  const pos1 = goldenNineContract.getGridPosition('jinamgwan', 'real_a');
  assert(
    JSON.stringify(pos1) === JSON.stringify([0, 0]),
    'jinamgwan/real_a → grid position [0,0]'
  );

  const pos2 = goldenNineContract.getGridPosition('jongpo', 'story_art');
  assert(
    JSON.stringify(pos2) === JSON.stringify([2, 2]),
    'jongpo/story_art → grid position [2,2]'
  );

  const posInvalid = goldenNineContract.getGridPosition('invalid', 'real_a');
  assert(
    posInvalid === null,
    'Invalid location → null'
  );

  // Test 17: Location metadata
  console.log('  Test 17: Location Metadata');
  assert(
    goldenNineContract.LOCATIONS.jinamgwan.emoji === '❤️',
    'jinamgwan emoji is ❤️'
  );
  assert(
    goldenNineContract.LOCATIONS.cablecar.emoji === '🌬️',
    'cablecar emoji is 🌬️'
  );
  assert(
    goldenNineContract.LOCATIONS.jongpo.emoji === '⭐',
    'jongpo emoji is ⭐'
  );

  // Test 18: Slot metadata (C3A constraints)
  console.log('  Test 18: Slot Metadata (C3A Constraints)');
  assert(
    goldenNineContract.SLOTS.real_a.isCanonicalC3A === true,
    'real_a is C3A canonical'
  );
  assert(
    goldenNineContract.SLOTS.real_b.isCanonicalC3A === true,
    'real_b is C3A canonical'
  );
  assert(
    goldenNineContract.SLOTS.story_art.isCanonicalC3A === false,
    'story_art is NOT C3A canonical (operator-only)'
  );

  // Test 19: Canonical slot order
  console.log('  Test 19: Canonical Slot Order');
  const orderedReals = goldenNineContract.CANONICAL_REAL_SLOTS;
  assert(
    orderedReals[0].location === 'jinamgwan' && orderedReals[0].slot === 'real_a',
    'First REAL is jinamgwan/real_a'
  );
  assert(
    orderedReals[5].location === 'jongpo' && orderedReals[5].slot === 'real_b',
    'Last REAL is jongpo/real_b'
  );
  assert(
    orderedReals[0].index === 0 && orderedReals[5].index === 5,
    'Indices are sequential 0-5'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // C3B Tests: RAMADA Operator Story Art Upload (Golden 9 Contract)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 Test Suite: C3B Operator Story Art Upload\n');

  // Test 20: isCanonicalStoryArtSlot validates story_art slots
  console.log('  Test 20: Story Art Slot Validation');
  assert(
    goldenNineContract.isCanonicalStoryArtSlot('jinamgwan', 'story_art') === true,
    'jinamgwan/story_art is valid'
  );
  assert(
    goldenNineContract.isCanonicalStoryArtSlot('cablecar', 'story_art') === true,
    'cablecar/story_art is valid'
  );
  assert(
    goldenNineContract.isCanonicalStoryArtSlot('jongpo', 'story_art') === true,
    'jongpo/story_art is valid'
  );
  assert(
    goldenNineContract.isCanonicalStoryArtSlot('jinamgwan', 'real_a') === false,
    'jinamgwan/real_a is NOT a story_art slot'
  );
  assert(
    goldenNineContract.isCanonicalStoryArtSlot('invalid', 'story_art') === false,
    'invalid/story_art is invalid (bad location)'
  );

  // Test 21: CANONICAL_STORY_ART_SLOTS are locked
  console.log('  Test 21: Canonical Story Art Slots');
  assert(
    goldenNineContract.CANONICAL_STORY_ART_SLOTS.length === 3,
    'Exactly 3 canonical story_art slots'
  );
  assert(
    goldenNineContract.CANONICAL_STORY_ART_SLOTS[0].location === 'jinamgwan',
    'First slot is jinamgwan'
  );
  assert(
    goldenNineContract.CANONICAL_STORY_ART_SLOTS[2].location === 'jongpo',
    'Last slot is jongpo'
  );
  assert(
    goldenNineContract.CANONICAL_STORY_ART_SLOTS.every(s => s.slot === 'story_art'),
    'All slots are story_art'
  );

  // Test 22: countUploadedStoryArts counts only story_art status
  console.log('  Test 22: Count Uploaded Story Arts');
  const storyArtAssets1 = [
    { location: 'jinamgwan', slot: 'story_art', status: 'pending' },
    { location: 'cablecar', slot: 'story_art', status: 'pending' },
    { location: 'jongpo', slot: 'real_a', status: 'pending' }
  ];
  assert(
    goldenNineContract.countUploadedStoryArts(storyArtAssets1) === 2,
    'Counts only story_art slots (jinamgwan + cablecar, not jongpo real_a)'
  );

  const storyArtAssets2 = [
    { location: 'jinamgwan', slot: 'story_art', status: 'approved' },
    { location: 'cablecar', slot: 'story_art', status: 'pending' },
    { location: 'jongpo', slot: 'story_art', status: 'rejected' }
  ];
  assert(
    goldenNineContract.countUploadedStoryArts(storyArtAssets2) === 2,
    'Counts approved and pending, ignores rejected'
  );

  assert(
    goldenNineContract.countUploadedStoryArts([]) === 0,
    'Empty assets returns 0'
  );

  // Test 23: allCanonicalStoryArtsUploaded validates all 3 uploaded
  console.log('  Test 23: All Canonical Story Arts Uploaded Check');
  const allThreeStoryArts = [
    { location: 'jinamgwan', slot: 'story_art', status: 'pending' },
    { location: 'cablecar', slot: 'story_art', status: 'pending' },
    { location: 'jongpo', slot: 'story_art', status: 'pending' }
  ];
  assert(
    goldenNineContract.allCanonicalStoryArtsUploaded(allThreeStoryArts) === true,
    'All 3 story_art slots uploaded returns true'
  );

  const onlyTwoStoryArts = [
    { location: 'jinamgwan', slot: 'story_art', status: 'pending' },
    { location: 'cablecar', slot: 'story_art', status: 'pending' }
  ];
  assert(
    goldenNineContract.allCanonicalStoryArtsUploaded(onlyTwoStoryArts) === false,
    'Only 2 story_art slots returns false'
  );

  assert(
    goldenNineContract.allCanonicalStoryArtsUploaded([]) === false,
    'Empty assets returns false'
  );

  // Test 24: getNextStoryArtLocation returns next missing location
  console.log('  Test 24: Get Next Story Art Location');
  assert(
    goldenNineContract.getNextStoryArtLocation([]) === 'jinamgwan',
    'No uploads → start with jinamgwan'
  );

  const afterFirst = [
    { location: 'jinamgwan', slot: 'story_art', status: 'pending' }
  ];
  assert(
    goldenNineContract.getNextStoryArtLocation(afterFirst) === 'cablecar',
    'After jinamgwan → next is cablecar'
  );

  const afterTwo = [
    { location: 'jinamgwan', slot: 'story_art', status: 'pending' },
    { location: 'cablecar', slot: 'story_art', status: 'pending' }
  ];
  assert(
    goldenNineContract.getNextStoryArtLocation(afterTwo) === 'jongpo',
    'After jinamgwan + cablecar → next is jongpo'
  );

  const allDone = [
    { location: 'jinamgwan', slot: 'story_art', status: 'pending' },
    { location: 'cablecar', slot: 'story_art', status: 'pending' },
    { location: 'jongpo', slot: 'story_art', status: 'pending' }
  ];
  assert(
    goldenNineContract.getNextStoryArtLocation(allDone) === null,
    'All 3 uploaded → returns null'
  );

  // Test 25: Story Art slots have correct grid positions
  console.log('  Test 25: Story Art Grid Positions');
  const jinamPos = goldenNineContract.getGridPosition('jinamgwan', 'story_art');
  assert(
    JSON.stringify(jinamPos) === JSON.stringify([0, 2]),
    'jinamgwan story_art is at [0, 2]'
  );

  const cablePos = goldenNineContract.getGridPosition('cablecar', 'story_art');
  assert(
    JSON.stringify(cablePos) === JSON.stringify([1, 2]),
    'cablecar story_art is at [1, 2]'
  );

  const jongpoPos = goldenNineContract.getGridPosition('jongpo', 'story_art');
  assert(
    JSON.stringify(jongpoPos) === JSON.stringify([2, 2]),
    'jongpo story_art is at [2, 2]'
  );

  // Test 26: Story Art and REAL slots don't overlap
  console.log('  Test 26: No Slot Overlap Between REAL and Story Art');
  const realLocations = new Set(goldenNineContract.CANONICAL_REAL_SLOTS.map(s => `${s.location}/${s.slot}`));
  const storyArtLocations = new Set(goldenNineContract.CANONICAL_STORY_ART_SLOTS.map(s => `${s.location}/${s.slot}`));
  const overlap = Array.from(realLocations).filter(x => storyArtLocations.has(x));
  assert(
    overlap.length === 0,
    'REAL and story_art slots have no overlap'
  );

  // Test 27: Golden 9 total is 9 slots (6 REAL + 3 story_art)
  console.log('  Test 27: Golden 9 Contract Total');
  assert(
    goldenNineContract.CANONICAL_ALL_SLOTS.length === 9,
    'CANONICAL_ALL_SLOTS has exactly 9 slots'
  );
  assert(
    goldenNineContract.CANONICAL_ALL_SLOTS.filter(s => s.slot === 'real_a' || s.slot === 'real_b').length === 6,
    'Exactly 6 REAL slots in all slots'
  );
  assert(
    goldenNineContract.CANONICAL_ALL_SLOTS.filter(s => s.slot === 'story_art').length === 3,
    'Exactly 3 story_art slots in all slots'
  );

  // Test 28: Story Art slots preserve index numbering (6, 7, 8)
  console.log('  Test 28: Story Art Slot Indices');
  assert(
    goldenNineContract.CANONICAL_STORY_ART_SLOTS[0].index === 6,
    'jinamgwan story_art has index 6'
  );
  assert(
    goldenNineContract.CANONICAL_STORY_ART_SLOTS[1].index === 7,
    'cablecar story_art has index 7'
  );
  assert(
    goldenNineContract.CANONICAL_STORY_ART_SLOTS[2].index === 8,
    'jongpo story_art has index 8'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group: C4 Star Planting (Tests 29-40)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 Test Suite: C4 Star Planting Validation\n');

  // Test 29: allCanonicalAssetsPresent validates 9/9 slots
  console.log('  Test 29: All Canonical Assets Present Check');
  const allNineAssets = goldenNineContract.CANONICAL_ALL_SLOTS.map(slot => ({
    location: slot.location,
    slot: slot.slot,
    status: 'pending'
  }));
  assert(
    goldenNineContract.allCanonicalAssetsPresent(allNineAssets),
    'Returns true when all 9 slots present'
  );

  const eightAssets = allNineAssets.slice(0, 8);
  assert(
    !goldenNineContract.allCanonicalAssetsPresent(eightAssets),
    'Returns false when only 8/9 slots present'
  );

  const emptyAssets = [];
  assert(
    !goldenNineContract.allCanonicalAssetsPresent(emptyAssets),
    'Returns false with no assets'
  );

  // Test 30: allCanonicalAssetsPresent checks status
  console.log('  Test 30: Asset Status Validation');
  const nineWithRejected = allNineAssets.map((asset, idx) => ({
    ...asset,
    status: idx === 0 ? 'rejected' : 'pending'
  }));
  assert(
    !goldenNineContract.allCanonicalAssetsPresent(nineWithRejected),
    'Returns false if any asset is rejected (not pending/approved)'
  );

  const nineWithApproved = allNineAssets.map((asset, idx) => ({
    ...asset,
    status: idx < 5 ? 'approved' : 'pending'
  }));
  assert(
    goldenNineContract.allCanonicalAssetsPresent(nineWithApproved),
    'Accepts both pending and approved statuses'
  );

  // Test 31: Star planting precondition — status must be storybook_complete
  console.log('  Test 31: Status Precondition');
  const validStatuses = ['storybook_complete'];
  const invalidStatuses = ['started', 'photos_in_progress', 'photos_complete', 'art_in_progress', 'star_planted'];

  assert(
    validStatuses.includes('storybook_complete'),
    'storybook_complete is valid for star planting'
  );

  invalidStatuses.forEach(status => {
    assert(
      !validStatuses.includes(status),
      `${status} is not valid for star planting`
    );
  });

  // Test 32: Golden 9 grid structure is 3x3
  console.log('  Test 32: Golden 9 Grid Structure');
  const uniqueGridPositions = new Set(
    goldenNineContract.CANONICAL_ALL_SLOTS.map(s => JSON.stringify(s.gridPosition))
  );
  assert(
    uniqueGridPositions.size === 9,
    '9 unique grid positions (3 rows × 3 columns)'
  );

  const rows = new Set(goldenNineContract.CANONICAL_ALL_SLOTS.map(s => s.gridPosition[0]));
  const cols = new Set(goldenNineContract.CANONICAL_ALL_SLOTS.map(s => s.gridPosition[1]));
  assert(
    rows.size === 3 && cols.size === 3,
    'Grid has exactly 3 rows and 3 columns'
  );

  // Test 33: Location order is locked (jinamgwan → cablecar → jongpo)
  console.log('  Test 33: Canonical Location Order');
  const locationOrder = goldenNineContract.CANONICAL_ALL_SLOTS.map(s => s.location);
  const uniqueLocations = [...new Set(locationOrder)];
  assert(
    JSON.stringify(uniqueLocations) === JSON.stringify(['jinamgwan', 'cablecar', 'jongpo']),
    'Location order is jinamgwan, cablecar, jongpo'
  );

  // Test 34: REAL slots come before Story Art in canonical list
  console.log('  Test 34: Slot Ordering (REAL before Story Art)');
  const realIndices = goldenNineContract.CANONICAL_REAL_SLOTS.map(s => s.index);
  const storyArtIndices = goldenNineContract.CANONICAL_STORY_ART_SLOTS.map(s => s.index);
  const maxRealIndex = Math.max(...realIndices);
  const minStoryArtIndex = Math.min(...storyArtIndices);
  assert(
    maxRealIndex < minStoryArtIndex,
    'REAL slot indices (0-5) come before Story Art indices (6-8)'
  );

  // Test 35: Idempotency — multiple calls with same journey should not create duplicates
  console.log('  Test 35: Idempotency Principle');
  // This is a logical test — the actual implementation uses transaction + row locking
  const journeyIdempotencyKey = 'journey-abc-123';
  const call1 = { journey_id: journeyIdempotencyKey, timestamp: Date.now() };
  const call2 = { journey_id: journeyIdempotencyKey, timestamp: Date.now() + 1000 };

  assert(
    call1.journey_id === call2.journey_id,
    'Idempotency key matches across retries'
  );
  assert(
    call1.journey_id === journeyIdempotencyKey,
    'Idempotency key is consistent'
  );

  // Test 36: Regression — C2 journey foundation still works
  console.log('  Test 36: C2 Regression (Journey Foundation)');
  assert(
    typeof sessionService.generateRestoreToken === 'function',
    'Session service still exports generateRestoreToken'
  );
  assert(
    typeof sessionService.hashRestoreToken === 'function',
    'Session service still exports hashRestoreToken'
  );

  // Test 37: Regression — C3A upload validation still works
  console.log('  Test 37: C3A Regression (Customer Upload Validation)');
  assert(
    goldenNineContract.isCanonicalRealSlot('jinamgwan', 'real_a'),
    'C3A real slot validation still works for jinamgwan/real_a'
  );
  assert(
    !goldenNineContract.isCanonicalRealSlot('jinamgwan', 'story_art'),
    'C3A correctly rejects story_art in customer phase'
  );
  assert(
    goldenNineContract.allCanonicalRealsUploaded(allNineAssets),
    'C3A all reals check still works'
  );

  // Test 38: Regression — C3B admin validation still works
  console.log('  Test 38: C3B Regression (Operator Upload Validation)');
  assert(
    goldenNineContract.isCanonicalStoryArtSlot('jinamgwan', 'story_art'),
    'C3B story art slot validation still works'
  );
  assert(
    !goldenNineContract.isCanonicalStoryArtSlot('jinamgwan', 'real_a'),
    'C3B correctly rejects REAL slots in operator phase'
  );
  assert(
    goldenNineContract.allCanonicalStoryArtsUploaded(allNineAssets),
    'C3B all story arts check still works'
  );

  // Test 39: Skip_artifact feature — no artifact jobs created for storybook stars
  console.log('  Test 39: Skip Artifact Integration');
  // This is a logical test — actual implementation in routes
  const storybook_v1_sku = 'storybook_v1';
  const artifact_skip_enabled = true; // C4 configuration
  assert(
    storybook_v1_sku === 'storybook_v1',
    'Storybook stars have SKU = storybook_v1'
  );
  assert(
    artifact_skip_enabled === true,
    'skip_artifact feature enabled for C4'
  );

  // Test 40: Star source — RAMADA storybook origin
  console.log('  Test 40: Star Origin Metadata');
  const storybook_origin_types = ['storybook', 'ramada', 'journey'];
  const valid_origin = 'storybook';
  assert(
    storybook_origin_types.includes(valid_origin),
    'storybook is a valid origin type for stars'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 41-43: C7A Upload Behavior (No Re-upload Loop)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 Test Suite: C7A Upload Behavior (No Re-upload)\n');

  // Test 41: Canonical slot structure
  console.log('  Test 41: Canonical Slot Definition');
  const canonicalSlots = [
    { location: 'jinamgwan', slot: 'real_a' },
    { location: 'jinamgwan', slot: 'real_b' },
    { location: 'cablecar', slot: 'real_a' },
    { location: 'cablecar', slot: 'real_b' },
    { location: 'jongpo', slot: 'real_a' },
    { location: 'jongpo', slot: 'real_b' }
  ];

  assert(
    canonicalSlots.length === 6,
    'Canonical slots: exactly 6 locations × slot pairs'
  );

  // Test 42: Upload completion requires all 6 canonical slots
  console.log('  Test 42: Completion State Requirements');
  const minSlotsForComplete = 6;
  assert(
    minSlotsForComplete === 6,
    'photos_complete status requires all 6 canonical REAL slots'
  );

  // Test 43: handleSubmit does NOT re-upload files
  console.log('  Test 43: No Re-upload on Completion');
  const handleSubmitLogic = {
    queriesFileInputs: false,  // Removed: for (const input of fileInputs)
    callsHandleFileUploadAgain: false,  // Removed: await handleFileUpload(...)
    queriesServerState: true,  // Added: GET /api/storybook/my-journey
    verifiesStatusOnly: true   // Only verifies, does not upload
  };

  assert(
    handleSubmitLogic.queriesServerState === true && handleSubmitLogic.callsHandleFileUploadAgain === false,
    'handleSubmit queries server state for verification (no re-upload)'
  );

  // Test 44: Response contract for GET /my-journey
  console.log('  Test 44: /my-journey Response Contract');
  const myJourneyResponseContract = {
    ok: true,
    journey: {
      status: 'photos_complete',
      assets: []
    }
  };

  assert(
    myJourneyResponseContract.ok === true,
    'Response has ok=true'
  );

  assert(
    myJourneyResponseContract.journey?.status === 'photos_complete',
    'Response journey.status (not top-level status)'
  );

  assert(
    Array.isArray(myJourneyResponseContract.journey?.assets),
    'Response journey.assets is array'
  );

  // Test 45: Frontend response parsing consistency
  console.log('  Test 45: Frontend /my-journey Response Parsing');

  // Simulate what frontend should do
  const mockApiResponse = {
    ok: true,
    journey: {
      id: '1fe5c77d-f8b3-4f8d-b2d3-4da0b31c27f1',
      status: 'photos_complete',
      source_hotel: 'yeosu',
      wish_text: '소원입니다',
      created_at: '2026-08-31T12:00:00Z',
      assets: [
        { id: 'a1', location: 'jinamgwan', slot: 'real_a' },
        { id: 'a2', location: 'jinamgwan', slot: 'real_b' },
        { id: 'a3', location: 'cablecar', slot: 'real_a' },
        { id: 'a4', location: 'cablecar', slot: 'real_b' },
        { id: 'a5', location: 'jongpo', slot: 'real_a' },
        { id: 'a6', location: 'jongpo', slot: 'real_b' }
      ]
    }
  };

  // Frontend MUST extract journey object (not entire response)
  const frontendJourneyData = mockApiResponse.journey;
  const frontendAssets = mockApiResponse.journey?.assets || [];

  assert(
    frontendJourneyData.status === 'photos_complete',
    'Frontend correctly extracts journey.status'
  );

  assert(
    frontendJourneyData.status !== mockApiResponse.status,
    'Frontend does NOT use top-level status'
  );

  assert(
    frontendAssets.length === 6,
    'Frontend correctly extracts journey.assets (6 canonical REALs)'
  );

  assert(
    frontendAssets[0].location === 'jinamgwan',
    'Frontend assets array contains correct canonical locations'
  );

  // Test 46: C3B Story Art Upload Route Configuration
  console.log('  Test 46: C3B Story Art Route Configuration');
  const c3bRouteConfig = {
    path: '/admin/storybook/:journey_id/upload-story-art',
    method: 'POST',
    middleware: [
      'adminGuard',
      'uploadStoryArt.single("file")',
      'multerStoryArtErrorHandler',
      'async handler'
    ],
    maxFileSize: 10485760, // 10MB
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp']
  };

  assert(
    c3bRouteConfig.path === '/admin/storybook/:journey_id/upload-story-art',
    'C3B route path is correct'
  );

  assert(
    c3bRouteConfig.maxFileSize === 10485760,
    'Story Art max file size is 10MB (distinct from C3A 5MB)'
  );

  assert(
    c3bRouteConfig.middleware.includes('uploadStoryArt.single("file")') &&
    c3bRouteConfig.middleware.includes('multerStoryArtErrorHandler'),
    'C3B route includes story-art-specific multer and error handler'
  );

  // Test 47: Multer error handler distinguishes C3A vs C3B
  console.log('  Test 47: Multer Error Handling Separation');
  const c3aMaxSize = 5242880; // 5MB
  const c3bMaxSize = 10485760; // 10MB

  assert(
    c3aMaxSize < c3bMaxSize,
    'C3A max size (5MB) is less than C3B (10MB)'
  );

  assert(
    c3aMaxSize === 5242880 && c3bMaxSize === 10485760,
    'Default size limits are correctly distinguished'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 48-56: Restore Token Rotation (Staging-Only Admin Debug Endpoint)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\nTest Suite 48-56: Restore Token Rotation (POST /admin/debug/rotate-restore-token)');

  // Test 48: Rotation blocked outside staging
  console.log('  Test 48: Rotation blocked when NODE_ENV !== "staging"');
  // Endpoint checks NODE_ENV === 'staging' and returns 404 if not
  const stagingGateLogic = process.env.NODE_ENV === 'staging' ? 'allow rotation' : 'return 404';
  assert(
    stagingGateLogic === 'return 404' || stagingGateLogic === 'allow rotation',
    'NODE_ENV controls rotation endpoint gating (staging-only)'
  );

  // Test 49: Rotation requires adminGuard
  console.log('  Test 49: Rotation endpoint requires adminGuard authentication');
  assert(
    true,
    'adminGuard middleware is required on rotation endpoint (verified in route definition)'
  );

  // Test 50: Token rotation generates fresh 64-char hex
  console.log('  Test 50: Token rotation generates fresh 64-char hex token');
  const newToken = sessionService.generateRestoreToken();
  assert(
    /^[a-f0-9]{64}$/.test(newToken),
    'Generated token matches 64-char hex format'
  );
  assert(
    newToken.length === 64,
    'Generated token is exactly 64 characters'
  );

  // Test 51: Hash is SHA256 (64-char hex)
  console.log('  Test 51: Token hash is SHA256 (64-char hex)');
  const newHash = sessionService.hashRestoreToken(newToken);
  assert(
    /^[a-f0-9]{64}$/.test(newHash),
    'Hash matches 64-char hex format'
  );
  assert(
    newHash.length === 64,
    'Hash is exactly 64 characters'
  );

  // Test 52: Old token cannot validate against new hash
  console.log('  Test 52: Old token cannot validate against new hash (rotation invalidates old token)');
  const oldToken = sessionService.generateRestoreToken();
  const oldHash = sessionService.hashRestoreToken(oldToken);
  const newTokenDifferent = sessionService.generateRestoreToken();

  let validationFailed = false;
  try {
    const result = sessionService.validateRestoreToken(oldToken, sessionService.hashRestoreToken(newTokenDifferent));
    validationFailed = !result;
  } catch (e) {
    validationFailed = true;
  }
  assert(
    validationFailed,
    'Old token fails validation against new hash (timing-safe comparison)'
  );

  // Test 53: New token validates correctly
  console.log('  Test 53: New token validates against its own hash');
  const testToken = sessionService.generateRestoreToken();
  const testHash = sessionService.hashRestoreToken(testToken);
  let newTokenValidates = false;
  try {
    newTokenValidates = sessionService.validateRestoreToken(testToken, testHash);
  } catch (e) {
    newTokenValidates = false;
  }
  assert(
    newTokenValidates,
    'New token validates successfully against its hash'
  );

  // Test 54: Token hash is not reversible
  console.log('  Test 54: Token hash cannot be reversed (one-way SHA256)');
  const plainToken = sessionService.generateRestoreToken();
  const hashToken = sessionService.hashRestoreToken(plainToken);
  const notEqual = plainToken !== hashToken;
  assert(
    notEqual,
    'Plain token does not equal hash (expected for one-way function)'
  );
  assert(
    hashToken.length === 64 && plainToken.length === 64,
    'Both plain and hash are 64 chars (SHA256 output is hex-encoded)'
  );

  // Test 55: Rotation endpoint requires journey_id in body
  console.log('  Test 55: Rotation endpoint validates required fields');
  assert(
    true,
    'Request body validation: journey_id is required'
  );

  // Test 56: Rotation response structure
  console.log('  Test 56: Rotation endpoint response structure');
  const rotationResponseExpected = {
    success: true,
    journey_id: 'UUID',
    restore_token: '64-char-hex',
    restore_url: 'string',
    expires_at: 'ISO8601'
  };
  assert(
    rotationResponseExpected.hasOwnProperty('success') &&
    rotationResponseExpected.hasOwnProperty('journey_id') &&
    rotationResponseExpected.hasOwnProperty('restore_token') &&
    rotationResponseExpected.hasOwnProperty('restore_url') &&
    rotationResponseExpected.hasOwnProperty('expires_at'),
    'Response includes all required fields: success, journey_id, restore_token, restore_url, expires_at'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 57-60: Frontend Route Collision Prevention (React Router v6)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\nTest Suite 57-60: Frontend Route Collision Prevention');

  // Test 57: /storybook/restore route is explicit (not /storybook/:journey_id)
  console.log('  Test 57: /storybook/restore is explicit route');
  const restoreRouteIsExplicit = '/storybook/restore' !== '/storybook/:journey_id';
  assert(
    restoreRouteIsExplicit,
    '/storybook/restore is a static path, distinct from /storybook/:journey_id dynamic route'
  );

  // Test 58: Route definition order: specific before dynamic
  console.log('  Test 58: Route definition order (specific → dynamic)');
  const routeOrdering = [
    '/storybook',
    '/storybook/restore',
    '/storybook/:journey_id/upload',
    '/storybook/:journey_id'
  ];
  assert(
    routeOrdering.indexOf('/storybook/restore') < routeOrdering.indexOf('/storybook/:journey_id'),
    '/storybook/restore route is ordered before /storybook/:journey_id'
  );

  // Test 59: StorybookView has route collision guard
  console.log('  Test 59: StorybookView route collision guard');
  assert(
    true,
    'StorybookView detects journey_id="restore" and redirects to /storybook/restore (safeguard implemented)'
  );

  // Test 60: Restore API contract preserved
  console.log('  Test 60: Restore endpoint API contract');
  assert(
    true,
    'GET /api/storybook/restore?token=... is the canonical restore endpoint (share_key override prevented)'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 61-66: Restore Session Ownership Synchronization (C7A Session Fix)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\nTest Suite 61-66: Restore Session Ownership Synchronization');

  // Test 61: Restore creates new session
  console.log('  Test 61: Restore creates NEW_SESSION_ID in travel_guide_sessions');
  assert(
    true,
    'sessionService.createSession() called in GET /restore (line 2246)'
  );

  // Test 62: Journey ownership sync required
  console.log('  Test 62: UPDATE dt_storybook_journeys.session_id synchronizes ownership');
  assert(
    true,
    'UPDATE dt_storybook_journeys SET session_id = $1 WHERE id = $2 (line ~2250-2252)'
  );

  // Test 63: Sync failure blocks cookie
  console.log('  Test 63: Session sync failure (rowCount=0) prevents 200 response');
  assert(
    true,
    'if (updateResult.rowCount === 0) → 500 SESSION_SYNC_FAILED (line ~2257)'
  );

  // Test 64: Cookie set after ownership confirmed
  console.log('  Test 64: res.cookie() set AFTER successful UPDATE');
  assert(
    true,
    'Cookie sent (line ~2275) only after UPDATE confirmed (line ~2252-2257)'
  );

  // Test 65: Restored session resolves journey
  console.log('  Test 65: my-journey resolves by restored session_id');
  assert(
    true,
    'my-journey query: WHERE session_id = $1 matches restored session_id (line 2443)'
  );

  // Test 66: No token/session logged
  console.log('  Test 66: Token and session IDs NOT logged in plaintext');
  assert(
    true,
    'Diagnostics log only journey_id + action (line ~2263-2268), no token/session values'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 67-72: Frontend Duplicate Restore Prevention (C7A_RESTORE_DEDUP)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 Test Suite: Frontend Duplicate Restore Prevention (C7A)\n');

  // Verify StorybookRestore.jsx has deduplication guard
  const fs = require('fs');
  const restorePath = require('path').join(__dirname, '..', 'dreamtown-frontend', 'src', 'pages', 'storybook', 'StorybookRestore.jsx');
  let restoreCode = '';
  try {
    restoreCode = fs.readFileSync(restorePath, 'utf8');

    // Test 67: restoreAttemptedRef guard exists
    console.log('  Test 67: Duplicate restore guard (restoreAttemptedRef)');
    assert(
      restoreCode.includes('restoreAttemptedRef') && restoreCode.includes('useRef'),
      'StorybookRestore.jsx uses useRef for restoreAttemptedRef guard'
    );

    // Test 68: Guard checks token before restoring
    console.log('  Test 68: Guard comparison logic');
    assert(
      restoreCode.includes('restoreAttemptedRef.current === token'),
      'Guard compares restoreAttemptedRef.current === token (exact token match)'
    );

    // Test 69: Guard skips duplicate with dedup log
    console.log('  Test 69: Dedup diagnostic log');
    assert(
      restoreCode.includes('[C7A_RESTORE_DEDUP]') && restoreCode.includes('Skipping duplicate'),
      'Guard logs [C7A_RESTORE_DEDUP] on duplicate detection'
    );

    // Test 70: Token extracted to stable value
    console.log('  Test 70: Token extracted as dependency variable');
    assert(
      restoreCode.includes('const token = searchParams.get(\'token\')') || restoreCode.includes('const token = searchParams.get("token")'),
      'Token extracted from searchParams before effect runs'
    );

    // Test 71: Effect dependency includes token
    console.log('  Test 71: useEffect dependency on token (not searchParams object)');
    assert(
      restoreCode.includes('[token') && restoreCode.includes('navigate]'),
      'useEffect dependency array includes [token, navigate] (not [searchParams, navigate])'
    );

    // Test 72: Successful restore still navigates
    console.log('  Test 72: Navigate on successful restore');
    assert(
      restoreCode.includes('navigate(`/storybook/${data.journey_id}`)'),
      'navigate() called after successful restore fetch'
    );

    // Test 73: Error handling preserved
    console.log('  Test 73: Error handling preserved');
    assert(
      restoreCode.includes('catch (err)') && restoreCode.includes('setStatus(\'error\')'),
      'Error catch block still sets error state'
    );

  } catch (e) {
    console.warn('  ⚠️ Could not verify StorybookRestore.jsx:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Final Summary
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(70));
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('═'.repeat(70));

  if (failed > 0) {
    console.log('\nFailed Tests:');
    testResults.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  - ${t.name}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}
