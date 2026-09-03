/**
 * Wheelchair Accessibility Fix Verification
 * Test that wheelchair users receive recommendations after removing broken companion check
 */

require('dotenv').config();
const crypto = require('crypto');

const travelGuideService = require('./services/travelGuideService');

async function testWheelchairFix() {
  console.log('WHEELCHAIR ACCESSIBILITY FIX VERIFICATION\n');
  console.log('='.repeat(80) + '\n');

  const testCases = [
    {
      label: 'A: Wheelchair user + car',
      context: {
        people_type: 'solo',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { disability: 'wheelchair' },
        weather: { condition: 'clear' },
        user_id: crypto.randomUUID(),
        session_id: crypto.randomUUID()
      }
    },
    {
      label: 'B: Wheelchair user + no car',
      context: {
        people_type: 'solo',
        time_available_minutes: 180,
        has_car: false,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { disability: 'wheelchair' },
        user_id: crypto.randomUUID(),
        session_id: crypto.randomUUID()
      }
    },
    {
      label: 'C: Stroller required + car (kids under 3)',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { has_kids: true, kids_age: 1 },
        user_id: crypto.randomUUID(),
        session_id: crypto.randomUUID()
      }
    },
    {
      label: 'D: Stroller required + no car',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 180,
        has_car: false,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { has_kids: true, kids_age: 1 },
        user_id: crypto.randomUUID(),
        session_id: crypto.randomUUID()
      }
    },
    {
      label: 'E: Family_elderly + car',
      context: {
        people_type: 'family_elderly',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { has_elderly: true },
        user_id: crypto.randomUUID(),
        session_id: crypto.randomUUID()
      }
    },
    {
      label: 'F: No accessibility requirement',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        user_id: crypto.randomUUID(),
        session_id: crypto.randomUUID()
      }
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      const result = await travelGuideService.recommend(testCase.context);

      const top3 = (result.places || []).slice(0, 3);
      results.push({
        label: testCase.label,
        success: result.places.length > 0,
        placesReturned: result.places.length,
        top3: top3.map(p => ({
          code: p.place_code,
          name: p.name_ko,
          warnings: p.warnings
        })),
        message: result.message
      });

      console.log(`${testCase.label}`);
      console.log(`  Status: ${result.places.length > 0 ? '✅' : '❌'} ${result.places.length} places returned`);
      if (result.places.length > 0) {
        top3.forEach((p, i) => {
          const warnings = p.warnings && p.warnings.length > 0 ? ` (⚠️ ${p.warnings.join(', ')})` : '';
          console.log(`    ${i+1}. ${p.place_code} - ${p.name_ko}${warnings}`);
        });
      } else {
        console.log(`  Message: ${result.message}`);
      }
      console.log('');
    } catch (e) {
      console.log(`${testCase.label}: ERROR - ${e.message}\n`);
      results.push({
        label: testCase.label,
        error: e.message
      });
    }
  }

  // Summary
  console.log('='.repeat(80) + '\n');
  console.log('SUMMARY:\n');

  const wheelchairCases = results.filter(r => r.label.includes('Wheelchair'));
  const strollerCases = results.filter(r => r.label.includes('Stroller'));
  const elderlyCase = results.find(r => r.label.includes('family_elderly'));

  console.log('Wheelchair users:');
  wheelchairCases.forEach(r => {
    const status = r.success ? `✅ ${r.placesReturned} places` : '❌ 0 places (BROKEN)';
    console.log(`  ${r.label}: ${status}`);
  });

  console.log('\nStroller users:');
  strollerCases.forEach(r => {
    const status = r.success ? `✅ ${r.placesReturned} places` : '❌ 0 places (BROKEN)';
    console.log(`  ${r.label}: ${status}`);
  });

  console.log('\nFamily_elderly (vocabulary fix verification):');
  if (elderlyCase) {
    const status = elderlyCase.success ? `✅ ${elderlyCase.placesReturned} places` : '❌ 0 places (BROKEN)';
    console.log(`  ${elderlyCase.label}: ${status}`);
  }

  console.log('\nNo accessibility requirement:');
  const normalCase = results.find(r => r.label.includes('No accessibility'));
  if (normalCase) {
    const status = normalCase.success ? `✅ ${normalCase.placesReturned} places` : '❌ 0 places';
    console.log(`  ${normalCase.label}: ${status}`);
  }

  // Verdict
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('VERDICT:\n');

  const wheelchairFixed = wheelchairCases.every(r => r.success);
  const strollerWorking = strollerCases.every(r => r.success);
  const elderlyFixed = elderlyCase && elderlyCase.success;
  const normalWorking = normalCase && normalCase.success;

  console.log(`Wheelchair fix: ${wheelchairFixed ? '✅ FIXED' : '❌ STILL BROKEN'}`);
  console.log(`Stroller working: ${strollerWorking ? '✅ YES' : '❌ NO'}`);
  console.log(`Family_elderly fix: ${elderlyFixed ? '✅ FIXED' : '❌ STILL BROKEN'}`);
  console.log(`Normal (no constraints): ${normalWorking ? '✅ YES' : '❌ NO'}`);

  if (wheelchairFixed && strollerWorking && elderlyFixed && normalWorking) {
    console.log('\n✅ ALL TESTS PASS - Fix is working correctly');
  } else {
    console.log('\n❌ SOME TESTS FAILED - Fix may be incomplete');
  }

  process.exit(wheelchairFixed && strollerWorking && elderlyFixed && normalWorking ? 0 : 1);
}

testWheelchairFix().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
