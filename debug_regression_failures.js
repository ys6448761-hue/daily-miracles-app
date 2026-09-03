/**
 * Debug: Regression test failures
 */

require('dotenv').config();
const crypto = require('crypto');
const travelGuideService = require('./services/travelGuideService');

async function debug() {
  const result = await travelGuideService.recommend({
    people_type: 'couple', time_available_minutes: 180, has_car: true,
    entry_point: 'RAMADA_YEOSU', country_code: 'KR', city_code: 'YEOSU',
    meal_context: 'lunch', user_id: crypto.randomUUID(), session_id: crypto.randomUUID()
  });

  console.log('DEBUG: Regression Test Failures\n');

  console.log('COURSE STRUCTURE:');
  console.log(JSON.stringify(result.course, null, 2));

  console.log('\n\nBLOCKS:');
  result.course.blocks.forEach((b, idx) => {
    console.log(`[${idx}] ${b.type}:`);
    if (b.type === 'travel_transition') {
      console.log(`  estimated_duration_range: ${b.estimated_duration_range}`);
      console.log(`  status: ${b.status}`);
    }
    if (b.type === 'meal') {
      console.log(`  restaurants: ${b.restaurants?.length || 0}`);
    }
    if (b.type === 'cafe') {
      console.log(`  cafes: ${b.cafes?.length || 0}`);
    }
  });

  console.log('\n\nSUMMARY:');
  console.log(JSON.stringify(result.course.summary, null, 2));

  process.exit(0);
}

debug().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
