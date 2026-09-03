// Time Budget Sensitivity Test
// Tests whether different time budgets produce different recommendations

const crypto = require('crypto');

function generateUserId() {
  return crypto.randomUUID();
}

async function testTimeVariation(timeMinutes) {
  try {
    const payload = {
      context: {
        entry_point: 'RAMADA_YEOSU',
        user_mode: 'PUBLIC',
        country_code: 'KR',
        city_code: 'YEOSU',
        user_id: generateUserId(),
        session_id: generateUserId(),
        people_type: 'family_with_kids',
        time_available_minutes: timeMinutes,
        has_car: true,
        companion_constraints: { has_kids: true, kids_age: 5 },
        weather: { condition: 'clear', temperature_celsius: 25 }
      }
    };

    const response = await fetch('http://localhost:5100/api/dt/travel/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 5000
    });

    if (!response.ok) {
      console.log(`${timeMinutes}min: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      timeMinutes,
      placesCount: data.places?.length || 0,
      top1: data.places?.[0]?.place_code,
      top2: data.places?.[1]?.place_code,
      top3: data.places?.[2]?.place_code,
      top3TotalTime: data.places?.[0]?.total_required_time,
      travelTimeStatus: data.places?.[0]?.travel_time_status,
      totalTimeStatus: data.places?.[0]?.total_required_time_status,
      places: data.places?.map(p => ({
        code: p.place_code,
        name: p.name_ko,
        stay: p.stay_minutes,
        totalTime: p.total_required_time,
        reason: p.reason,
        warnings: p.warnings
      })) || []
    };
  } catch (e) {
    console.log(`${timeMinutes}min: Error - ${e.message}`);
    return null;
  }
}

async function runTest() {
  console.log('TIME BUDGET SENSITIVITY TEST');
  console.log('Traveler: family_with_kids + car + clear day\n');

  const timeBudgets = [60, 120, 180, 240, 360, 480];
  const results = [];

  for (const time of timeBudgets) {
    const result = await testTimeVariation(time);
    if (result) {
      results.push(result);
      console.log(`${time}min: ${result.top1} / ${result.top2} / ${result.top3}`);
      console.log(`        places: ${result.placesCount}, total_time: ${result.top3TotalTime}, status: ${result.totalTimeStatus}`);
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
  }

  console.log('\n=== ANALYSIS ===');
  const uniqueSets = new Set();
  results.forEach(r => {
    const key = [r.top1, r.top2, r.top3].join(',');
    uniqueSets.add(key);
  });

  console.log(`Unique Top-3 combinations: ${uniqueSets.size} / ${results.length}`);
  results.forEach(r => {
    console.log(`\n${r.timeMinutes}min:`);
    r.places.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.code} (${p.name})`);
      console.log(`     stay: ${p.stay}min, total_time: ${p.totalTime}min`);
      console.log(`     reason: ${p.reason}`);
      if (p.warnings?.length) console.log(`     warnings: ${p.warnings.join(', ')}`);
    });
  });

  process.exit(0);
}

runTest().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
