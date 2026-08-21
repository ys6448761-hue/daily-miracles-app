/**
 * Smoke Test: Verify basic API functionality
 * - PUBLIC session
 * - WISH_TRAVELER session
 * - Session reuse
 * - Food=0 handling
 * - Live=unknown handling
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runSmokeTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Phase 1 Smoke Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: PUBLIC session creation + recommendation
  console.log('1️⃣  Test: PUBLIC Session + Recommendation');
  console.log('');
  try {
    const publicContext = {
      country_code: 'KR',
      city_code: 'YEOSU',
      entry_point: 'RAMADA_YEOSU',
      user_mode: 'PUBLIC',
      people_type: 'family_with_kids',
      time_available_minutes: 180,
      has_car: true,
      companion_constraints: {
        has_kids: true,
        kids_age: 7,
      },
      weather: {
        condition: 'clear',
        temperature_celsius: 25,
      },
    };

    const result = await makeRequest('POST', '/api/dt/travel/recommend', {
      context: publicContext,
    });

    if (result.status === 200 && result.data.places) {
      console.log('✅ PASS: Recommendation returned');
      console.log(`   - Session ID: ${result.data.session_id.substring(0, 8)}...`);
      console.log(`   - Places: ${result.data.places.length}`);
      console.log(`   - Food: ${result.data.food.type}`);
      testsPassed++;
      global.publicSessionId = result.data.session_id;
    } else {
      console.log(`❌ FAIL: ${result.status}`);
      testsFailed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 2: WISH_TRAVELER session
  console.log('2️⃣  Test: WISH_TRAVELER Session + Recommendation');
  console.log('');
  try {
    const wishContext = {
      country_code: 'KR',
      city_code: 'YEOSU',
      entry_point: 'RAMADA_YEOSU',
      user_mode: 'WISH_TRAVELER',
      wish_id: '12345-wish-uuid',
      wish_context: {
        emotion_primary: 'healing',
        emotion_tags: ['nature', 'quiet'],
      },
      people_type: 'couple',
      time_available_minutes: 120,
      has_car: false,
      weather: {
        condition: 'clear',
        temperature_celsius: 22,
      },
    };

    const result = await makeRequest('POST', '/api/dt/travel/recommend', {
      context: wishContext,
    });

    if (result.status === 200 && result.data.places) {
      console.log('✅ PASS: WISH_TRAVELER recommendation returned');
      console.log(`   - Session ID: ${result.data.session_id.substring(0, 8)}...`);
      console.log(`   - Places: ${result.data.places.length}`);
      testsPassed++;
      global.wishSessionId = result.data.session_id;
    } else {
      console.log(`❌ FAIL: ${result.status}`);
      testsFailed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 3: Session reuse
  console.log('3️⃣  Test: Session Reuse');
  console.log('');
  try {
    const context = {
      session_id: global.publicSessionId,
      country_code: 'KR',
      city_code: 'YEOSU',
      entry_point: 'RAMADA_YEOSU',
      user_mode: 'PUBLIC',
      people_type: 'solo',
      time_available_minutes: 90,
      has_car: true,
      weather: { condition: 'clear', temperature_celsius: 20 },
    };

    const result = await makeRequest('POST', '/api/dt/travel/recommend', {
      context: context,
    });

    if (result.status === 200 && result.data.session_id === global.publicSessionId) {
      console.log('✅ PASS: Session reused successfully');
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Session not reused`);
      testsFailed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 4: Food=0 handling
  console.log('4️⃣  Test: Food=0 (No Restaurants)');
  console.log('');
  try {
    const context = {
      country_code: 'KR',
      city_code: 'YEOSU',
      entry_point: 'RAMADA_YEOSU',
      user_mode: 'PUBLIC',
      people_type: 'family_with_kids',
      time_available_minutes: 120,
      has_car: true,
      meal_context: 'lunch',
      weather: { condition: 'clear', temperature_celsius: 25 },
    };

    const result = await makeRequest('POST', '/api/dt/travel/recommend', {
      context: context,
    });

    if (result.status === 200) {
      const food = result.data.food;
      if (food.data_status === 'unavailable' && !food.name) {
        console.log('✅ PASS: Food safely handled as unavailable');
        console.log(`   - Status: ${food.data_status}`);
        console.log(`   - Message: ${food.message}`);
        testsPassed++;
      } else {
        console.log('⚠️  WARN: Food response unexpected');
        console.log(`   - Got: ${JSON.stringify(food)}`);
        testsFailed++;
      }
    } else {
      console.log(`❌ FAIL: HTTP ${result.status}`);
      testsFailed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 5: Live=unknown handling
  console.log('5️⃣  Test: Live Status = Unknown (No assumptions)');
  console.log('');
  try {
    const context = {
      country_code: 'KR',
      city_code: 'YEOSU',
      entry_point: 'RAMADA_YEOSU',
      user_mode: 'PUBLIC',
      people_type: 'solo',
      time_available_minutes: 100,
      has_car: true,
      weather: { condition: 'clear', temperature_celsius: 23 },
    };

    const result = await makeRequest('POST', '/api/dt/travel/recommend', {
      context: context,
    });

    if (result.status === 200 && result.data.places.length > 0) {
      const place = result.data.places[0];
      if (place.live_status === 'unknown') {
        console.log('✅ PASS: Live status remains unknown (no preset)');
        console.log(`   - Place: ${place.place_code}`);
        console.log(`   - Live: ${place.live_status}`);
        testsPassed++;
      } else {
        console.log(`⚠️  WARN: Live status preset to ${place.live_status}`);
        testsFailed++;
      }
    } else {
      console.log(`❌ FAIL: ${result.status}`);
      testsFailed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    testsFailed++;
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Smoke Test Results');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log('');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runSmokeTests().catch((err) => {
  console.error('Test Error:', err);
  process.exit(1);
});
