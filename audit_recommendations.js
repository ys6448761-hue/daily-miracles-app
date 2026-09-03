// Travel Guide Recommendation Audit
// Test 8 different traveler conditions to measure personalization

const travelGuideService = require('./services/travelGuideService');
const crypto = require('crypto');

function generateUserId() {
  return crypto.randomUUID();
}

async function testRecommendation(label, context) {
  try {
    const userId = generateUserId();
    const payload = {
      context: {
        country_code: 'KR',
        city_code: 'YEOSU',
        user_id: userId,
        session_id: generateUserId(),
        ...context
      }
    };

    const response = await travelGuideService.recommend(payload);

    console.log(`\n=== ${label} ===`);
    console.log(`Context: people_type=${context.people_type}, time=${context.time_available_minutes}min, car=${context.has_car}, origin=${context.entry_point || 'default'}`);
    if (context.weather?.condition) console.log(`Weather: ${context.weather.condition}`);
    if (context.companion_constraints) console.log(`Companion: ${JSON.stringify(context.companion_constraints)}`);

    console.log(`\nPlaces returned: ${response.places?.length || 0}`);
    console.log(`Food status: ${response.food?.data_status}`);
    console.log(`Error: ${response.message}`);

    console.log(`\nTop 3 Recommendations:`);
    response.places?.forEach((place, i) => {
      console.log(`${i+1}. ${place.name_ko} (${place.place_code})`);
      console.log(`   stay: ${place.stay_minutes}min, total: ${place.total_required_time}min, time_status: ${place.total_required_time_status}`);
      console.log(`   reason: ${place.reason}`);
    });

    return {
      label,
      top1: response.places?.[0]?.place_code,
      top2: response.places?.[1]?.place_code,
      top3: response.places?.[2]?.place_code,
      places: response.places?.map(p => p.place_code) || []
    };
  } catch (e) {
    console.error(`Error in ${label}:`, e.message);
    return { label, error: e.message };
  }
}

async function runAudit() {
  console.log('TRAVEL GUIDE PERSONALIZATION AUDIT\n');
  const results = [];

  // Case A: family_with_kids + car + daytime + 180 min
  results.push(await testRecommendation('CASE A: Family w/kids + car + day + 180min', {
    people_type: 'family_with_kids',
    time_available_minutes: 180,
    has_car: true,
    entry_point: 'RAMADA_YEOSU',
    weather: { condition: 'clear', temperature_celsius: 25 }
  }));

  // Case B: couple + car + evening + 180 min
  results.push(await testRecommendation('CASE B: Couple + car + evening + 180min', {
    people_type: 'couple',
    time_available_minutes: 180,
    has_car: true,
    entry_point: 'RAMADA_YEOSU',
    weather: { condition: 'clear', temperature_celsius: 20 }
  }));

  // Case C: solo + no car + daytime + 120 min
  results.push(await testRecommendation('CASE C: Solo + no car + day + 120min', {
    people_type: 'solo',
    time_available_minutes: 120,
    has_car: false,
    entry_point: 'RAMADA_YEOSU',
    weather: { condition: 'clear', temperature_celsius: 25 }
  }));

  // Case D: family elderly + car + daytime + 120 min
  results.push(await testRecommendation('CASE D: Family elderly + car + day + 120min', {
    people_type: 'family_elderly',
    time_available_minutes: 120,
    has_car: true,
    entry_point: 'RAMADA_YEOSU',
    companion_constraints: { has_elderly: true }
  }));

  // Case E: wheelchair required + car + 120 min
  results.push(await testRecommendation('CASE E: Wheelchair + car + 120min', {
    people_type: 'solo',
    time_available_minutes: 120,
    has_car: true,
    entry_point: 'RAMADA_YEOSU',
    companion_constraints: { disability: 'wheelchair' }
  }));

  // Case F: family_with_kids + no car + 240 min
  results.push(await testRecommendation('CASE F: Family w/kids + no car + 240min', {
    people_type: 'family_with_kids',
    time_available_minutes: 240,
    has_car: false,
    entry_point: 'RAMADA_YEOSU'
  }));

  // Case G: Same as A but from Expo Station
  results.push(await testRecommendation('CASE G: Family w/kids + car + day + 180min (from EXPO)', {
    people_type: 'family_with_kids',
    time_available_minutes: 180,
    has_car: true,
    entry_point: 'YEOSU_EXPO_STATION',
    weather: { condition: 'clear', temperature_celsius: 25 }
  }));

  // Case H: Couple + evening + from Expo
  results.push(await testRecommendation('CASE H: Couple + car + evening + 180min (from EXPO)', {
    people_type: 'couple',
    time_available_minutes: 180,
    has_car: true,
    entry_point: 'YEOSU_EXPO_STATION',
    weather: { condition: 'clear', temperature_celsius: 20 }
  }));

  // SUMMARY
  console.log('\n\n=== PERSONALIZATION SUMMARY ===');
  const uniqueSets = new Set();
  const dolsanCollisions = [];
  const topCodes = {};

  results.forEach(r => {
    if (!r.error) {
      const key = [r.top1, r.top2, r.top3].join(',');
      uniqueSets.add(key);
      console.log(`${r.label}: ${r.top1}, ${r.top2}, ${r.top3}`);

      // Check for Dolsan cluster collisions
      const dolsanCodes = ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar'];
      const dolsanInTop3 = r.places.filter(p => dolsanCodes.includes(p));
      if (dolsanInTop3.length >= 2) {
        dolsanCollisions.push({ case: r.label, count: dolsanInTop3.length, codes: dolsanInTop3 });
      }

      // Track top-1 frequency
      topCodes[r.top1] = (topCodes[r.top1] || 0) + 1;
    }
  });

  console.log(`\nUnique Top-3 sets: ${uniqueSets.size} / 8`);
  console.log(`Dolsan cluster collisions: ${dolsanCollisions.length} cases`);
  dolsanCollisions.forEach(c => {
    console.log(`  ${c.case}: ${c.codes.join(', ')} (${c.count} places from cluster)`);
  });

  console.log(`\nMost common Top-1: ${Object.entries(topCodes).sort((a, b) => b[1] - a[1])[0]}`);
  console.log(`Top-1 frequency: ${Object.entries(topCodes).map(([code, count]) => `${code}=${count}`).join(', ')}`);

  process.exit(0);
}

runAudit().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
