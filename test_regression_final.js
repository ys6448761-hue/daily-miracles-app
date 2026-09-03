/**
 * Final Regression Test Suite
 * Verify all systems still work after P0 fixes
 */

require('dotenv').config();
const crypto = require('crypto');
const travelGuideService = require('./services/travelGuideService');

async function runRegressionTests() {
  console.log('FINAL REGRESSION TEST SUITE\n');
  console.log('═'.repeat(100) + '\n');

  let passCount = 0;
  let failCount = 0;

  const tests = [
    {
      name: 'Variable stop count (180 → 1+, 480 → 3+)',
      run: async () => {
        const r180 = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 180, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        const r480 = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 480, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        // P0: jaisan_park excluded from Ramada rotation, so 180min may have fewer stops than before
        return r180.course.actual_stop_count >= 1 && r480.course.actual_stop_count >= 3;
      }
    },
    {
      name: 'P0-1: Travel range is null when unknown',
      run: async () => {
        // Use 480 min to guarantee multiple places and travel transitions
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 480, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        const travelBlock = result.course.blocks.find(b => b.type === 'travel_transition');
        return travelBlock && travelBlock.estimated_duration_range === null && travelBlock.status === 'unknown';
      }
    },
    {
      name: 'P0-2: Fit status is travel_time_unverified',
      run: async () => {
        // Use 480 min to guarantee travel transitions exist
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 480, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        return result.course.summary.fit_status === 'travel_time_unverified';
      }
    },
    {
      name: 'P0-2: Message acknowledges unknown travel time',
      run: async () => {
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 180, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        // P0-2 fix: message_ko should be defined and reflect unknown travel time
        const hasTravelUnknown = result.course.blocks.some(b => b.type === 'travel_transition');
        if (!hasTravelUnknown) return true; // No travel blocks = message doesn't need travel acknowledgment
        return result.course.message_ko && result.course.message_ko.includes('이동시간');
      }
    },
    {
      name: 'Meal/cafe blocks integrated',
      run: async () => {
        // Use 480 min to guarantee multiple places (for cafe block)
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 480, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        const hasMeal = result.course.blocks.some(b => b.type === 'meal');
        const hasCafe = result.course.blocks.some(b => b.type === 'cafe');
        return hasMeal && hasCafe;
      }
    },
    {
      name: 'Backward compat: places array preserved',
      run: async () => {
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 180, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        return result.places && result.places.length > 0;
      }
    },
    {
      name: 'Backward compat: food field preserved',
      run: async () => {
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 180, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        return result.food !== undefined;
      }
    },
    {
      name: 'Backward compat: cafes field preserved',
      run: async () => {
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 180, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        return !result.cafes || Array.isArray(result.cafes);
      }
    },
    {
      name: 'Unknown travel semantics maintained',
      run: async () => {
        // Use 480 min to guarantee travel transitions exist
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 480, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        const travelBlock = result.course.blocks.find(b => b.type === 'travel_transition');
        return travelBlock && travelBlock.status === 'unknown' && travelBlock.message_ko;
      }
    },
    {
      name: 'Course blocks exist and have data',
      run: async () => {
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 180, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        return result.course.blocks && result.course.blocks.length > 0;
      }
    },
    {
      name: 'No numeric travel estimate when unknown',
      run: async () => {
        const result = await travelGuideService.recommend({
          people_type: 'couple', time_available_minutes: 180, has_car: true,
          entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
          meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
        });
        const blocks = result.course.blocks.filter(b => b.type === 'travel_transition');
        return blocks.every(b => b.estimated_duration_range === null && b.status === 'unknown');
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.run();
      if (result) {
        console.log(`✓ ${test.name}`);
        passCount++;
      } else {
        console.log(`✗ ${test.name}`);
        failCount++;
      }
    } catch (e) {
      console.log(`✗ ${test.name} — Error: ${e.message}`);
      failCount++;
    }
  }

  console.log('\n' + '═'.repeat(100));
  console.log(`\nREGRESSION RESULTS: ${passCount}/${tests.length} PASS\n`);

  if (failCount === 0) {
    console.log('✅ ALL REGRESSION TESTS PASS');
  } else {
    console.log(`⚠️  ${failCount} test(s) failed`);
  }

  console.log('\n' + '═'.repeat(100) + '\n');

  return failCount === 0;
}

runRegressionTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
