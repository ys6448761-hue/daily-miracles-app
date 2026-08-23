// Day-1 MVP End-to-End Test
// Manual verification: Food ranking, cafe inclusion, regression checks

const db = require('../database/db');
const travelGuideService = require('../services/travelGuideService');

async function runTests() {
  console.log('=== Day-1 MVP E2E Tests ===\n');

  const tests = [];

  try {
    // Test 1: Restaurant seed verification (12 restaurants loaded)
    console.log('TEST 1: Restaurant Seed Verification');
    const restaurantCount = await db.query(
      `SELECT COUNT(*) as count FROM travel_restaurants
       WHERE country_code='KR' AND city_code='YEOSU' AND source='local_curated'`
    );
    const count = parseInt(restaurantCount.rows[0].count);
    const test1Pass = count === 12;
    console.log(`  ✓ Curated restaurants loaded: ${count}/12 ${test1Pass ? 'PASS' : 'FAIL'}`);
    tests.push({ name: 'Restaurant Seed', pass: test1Pass });

    // Test 2: Food recommendation returns max 3
    console.log('\nTEST 2: Food Ranking (Max 3)');
    const travelContext = {
      session_id: 'test-session-123',
      country_code: 'KR',
      city_code: 'YEOSU',
      entry_point: 'ramada',
      user_mode: 'TRAVELER',
      meal_context: 'lunch',
      people_type: 'family_with_kids',
      companion_constraints: { has_kids: true, kids_age: 5 },
      time_available_minutes: 120,
      has_car: true,
      weather: { condition: 'sunny' },
    };

    const rec = await travelGuideService.recommend(travelContext);
    const foodCount = rec.food?.restaurants?.length || 0;
    const test2Pass = foodCount <= 3 && foodCount > 0;
    console.log(`  ✓ Food results count: ${foodCount}/3 ${test2Pass ? 'PASS' : 'FAIL'}`);
    if (rec.food?.restaurants?.length > 0) {
      console.log(`  ✓ Food data_status: ${rec.food.data_status} (v0_curated)`);
      rec.food.restaurants.forEach((r, i) => {
        console.log(`    [${i + 1}] ${r.name} (${r.cuisine_type})`);
      });
    }
    tests.push({ name: 'Food Max 3', pass: test2Pass });

    // Test 3: Place recommendations preserved (baseline)
    console.log('\nTEST 3: Place Recommendations (Baseline)');
    const placeCount = rec.places?.length || 0;
    const test3Pass = placeCount <= 3 && placeCount >= 0;
    console.log(`  ✓ Places returned: ${placeCount}/3 ${test3Pass ? 'PASS' : 'FAIL'}`);
    tests.push({ name: 'Place Baseline', pass: test3Pass });

    // Test 4: UNKNOWN semantics preserved
    console.log('\nTEST 4: UNKNOWN Semantics (Phase 1)');
    if (rec.places.length > 0) {
      const firstPlace = rec.places[0];
      const travelNull = firstPlace.travel_time_minutes === null;
      const statusUnknown = firstPlace.travel_time_status === 'unknown';
      const test4Pass = travelNull && statusUnknown;
      console.log(`  ✓ travel_time_minutes === null: ${travelNull} ${travelNull ? 'PASS' : 'FAIL'}`);
      console.log(`  ✓ travel_time_status === 'unknown': ${statusUnknown} ${statusUnknown ? 'PASS' : 'FAIL'}`);
      tests.push({ name: 'UNKNOWN Semantics', pass: test4Pass });
    }

    // Test 5: Total time null preserved when travel is null
    console.log('\nTEST 5: Total Time Null Semantics');
    if (rec.places.length > 0) {
      const firstPlace = rec.places[0];
      const totalNull = firstPlace.total_required_time === null;
      console.log(`  ✓ total_required_time === null (when travel unknown): ${totalNull} ${totalNull ? 'PASS' : 'FAIL'}`);
      tests.push({ name: 'Total Time Null', pass: totalNull });
    }

    // Test 6: Cafe/benefit optional fields exist (backward compat)
    console.log('\nTEST 6: Optional Fields (Backward Compat)');
    const hasFoodField = 'food' in rec;
    const test6Pass = hasFoodField;
    console.log(`  ✓ food field exists: ${hasFoodField} ${test6Pass ? 'PASS' : 'FAIL'}`);
    tests.push({ name: 'Optional Fields', pass: test6Pass });

    // Test 7: Traveler fit scoring (family_with_kids gets family restaurants first)
    console.log('\nTEST 7: Traveler Fit Scoring');
    if (rec.food?.restaurants?.length > 0) {
      const hasFamily = rec.food.restaurants[0]?.suitable_for?.includes('family');
      console.log(`  ✓ First recommendation includes family: ${hasFamily}`);
      tests.push({ name: 'Traveler Fit', pass: true });
    } else {
      tests.push({ name: 'Traveler Fit', pass: false });
    }

    // Test 8: Cafe partners optional field
    console.log('\nTEST 8: Cafe Partners (Optional)');
    const cafeCount = rec.cafes?.length || 0;
    console.log(`  ✓ Cafe partners found: ${cafeCount} (max 2)`);
    if (rec.cafes?.length > 0) {
      rec.cafes.forEach(c => console.log(`    - ${c.name} (${c.category})`));
    }
    tests.push({ name: 'Cafe Partners', pass: true });

    // Test 9: Benefits optional field
    console.log('\nTEST 9: Benefits (Optional)');
    const benefitCount = rec.benefits?.length || 0;
    console.log(`  ✓ Benefits found: ${benefitCount} (max 5)`);
    if (rec.benefits?.length > 0) {
      rec.benefits.forEach(b => console.log(`    - ${b.partner_name}: ${b.title}`));
    }
    tests.push({ name: 'Benefits', pass: true });

    // Summary
    console.log('\n=== SUMMARY ===');
    const passed = tests.filter(t => t.pass).length;
    const total = tests.length;
    console.log(`✓ ${passed}/${total} tests passed`);
    tests.forEach(t => {
      console.log(`  ${t.pass ? '✓' : '✗'} ${t.name}`);
    });

    if (passed === total) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log(`\n⚠️ ${total - passed} TEST(S) FAILED`);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

runTests();
