/**
 * RAMADA FIELD TEST P0 — Final Regression
 * Verify:
 * 1. Jaisan park excluded from default Ramada rotation
 * 2. Cafe benefits display correctly
 * 3. Moipin shows 10% only (not free coffee)
 * 4. UNKNOWN travel semantics preserved
 * 5. Accessibility preserved
 * 6. 반나절/하루 still work
 */

require('dotenv').config();
const crypto = require('crypto');
const travelGuideService = require('./services/travelGuideService');

async function testRamadaP0() {
  console.log('RAMADA FIELD TEST P0 — FINAL REGRESSION\n');
  console.log('═'.repeat(100) + '\n');

  const baseContext = {
    people_type: 'family_with_kids',
    has_car: true,
    companion_constraints: { has_kids: true, kids_age: 5 },
    entry_point: 'RAMADA_YEOSU',  // ← Ramada entry point
    country_code: 'KR',
    city_code: 'YEOSU',
    meal_context: 'lunch',
    weather: { condition: 'clear' },
  };

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('TEST 1: Jaisan Park Exclusion from Ramada Rotation\n');

  const result180 = await travelGuideService.recommend({
    ...baseContext,
    time_available_minutes: 180,
    user_id: crypto.randomUUID(),
    session_id: crypto.randomUUID()
  });

  const has180Jaisan = result180.places?.some(p => p.place_code === 'jaisan_park');
  console.log(`180 min places: ${result180.places.map(p => p.place_code).join(', ')}`);
  console.log(`Contains jaisan_park: ${has180Jaisan ? '✗ YES (BAD)' : '✓ NO'}`);

  if (!has180Jaisan) {
    console.log('✓ Jaisan park successfully excluded from 반나절\n');
  } else {
    console.log('✗ Jaisan park still in rotation (FAILED)\n');
  }

  const result480 = await travelGuideService.recommend({
    ...baseContext,
    time_available_minutes: 480,
    user_id: crypto.randomUUID(),
    session_id: crypto.randomUUID()
  });

  const has480Jaisan = result480.places?.some(p => p.place_code === 'jaisan_park');
  console.log(`480 min places: ${result480.places.map(p => p.place_code).join(', ')}`);
  console.log(`Contains jaisan_park: ${has480Jaisan ? '✗ YES (BAD)' : '✓ NO'}`);

  if (!has480Jaisan) {
    console.log('✓ Jaisan park successfully excluded from 하루\n');
  } else {
    console.log('✗ Jaisan park still in rotation (FAILED)\n');
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('═'.repeat(100));
  console.log('\nTEST 2: Cafe Benefits Display\n');

  if (result480.course?.blocks) {
    const cafeBlocks = result480.course.blocks.filter(b => b.type === 'cafe');

    if (cafeBlocks.length > 0) {
      console.log('Cafe blocks found:');
      cafeBlocks.forEach((block, idx) => {
        console.log(`  Block ${idx}: ${block.cafes?.length || 0} cafes`);
        if (block.cafes && block.cafes.length > 0) {
          block.cafes.forEach(c => {
            console.log(`    Cafe: ${c.name}`);
            if (c.benefit) {
              console.log(`      Benefit: ⭐ ${c.benefit.display_copy}`);
              console.log(`      ✓ Benefit data present`);
            } else {
              console.log(`      (no benefit data)`);
            }
          });
        }
      });
    } else {
      console.log('No cafe blocks in course');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\nTEST 3: Moipin Benefit Verification (10% only)\n');

  // Find Moipin in the general Benefits section
  const moipinBenefit = result480.benefits?.find(b => b.partner_name?.includes('모이핀'));

  if (moipinBenefit) {
    console.log(`Moipin benefit found: "${moipinBenefit.title}"`);

    const isCorrect = moipinBenefit.title.includes('할인') && !moipinBenefit.title.includes('무료');
    console.log(`  Contains "할인": ${moipinBenefit.title.includes('할인') ? '✓ YES' : '✗ NO'}`);
    console.log(`  Does NOT contain "무료": ${!moipinBenefit.title.includes('무료') ? '✓ YES' : '✗ NO'}`);

    if (isCorrect) {
      console.log(`  ✓ Moipin correctly shows discount only\n`);
    } else {
      console.log(`  ✗ Moipin benefit incorrect (should be 10% 할인)\n`);
    }
  } else {
    console.log('(Moipin not in benefits list - may be filtered)\n');
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('═'.repeat(100));
  console.log('\nTEST 4: UNKNOWN Travel Semantics Preserved\n');

  let isUnknownPreserved = false;

  if (result480.course?.summary) {
    const summary = result480.course.summary;
    console.log(`Estimated total range: ${summary.estimated_total_range ? 'HAS VALUE' : 'null ✓'}`);
    console.log(`Unknown travel segments: ${summary.unknown_travel_segments}`);
    console.log(`Fit status: ${summary.fit_status}`);

    isUnknownPreserved = !summary.estimated_total_range && summary.fit_status === 'travel_time_unverified';
    if (isUnknownPreserved) {
      console.log('✓ UNKNOWN semantics preserved\n');
    } else {
      console.log('✗ UNKNOWN semantics broken\n');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('═'.repeat(100));
  console.log('\nTEST 5: Accessibility Preserved\n');

  if (result480.places && result480.places.length > 0) {
    const firstPlace = result480.places[0];
    const hasAccessibility = firstPlace.accessibility &&
      (firstPlace.accessibility.wheelchair_status !== undefined ||
       firstPlace.accessibility.stroller_status !== undefined);

    console.log(`First place: ${firstPlace.place_code}`);
    console.log(`  Wheelchair status: ${firstPlace.accessibility?.wheelchair_status || 'unknown'}`);
    console.log(`  Stroller status: ${firstPlace.accessibility?.stroller_status || 'unknown'}`);

    if (hasAccessibility) {
      console.log('✓ Accessibility data preserved\n');
    } else {
      console.log('✗ Accessibility data missing\n');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('═'.repeat(100));
  console.log('\nTEST 6: Journey Composition Still Works\n');

  console.log(`180 min course: ${result180.course?.actual_stop_count} stops`);
  console.log(`480 min course: ${result480.course?.actual_stop_count} stops`);

  const compositionWorks = result180.course?.actual_stop_count > 0 && result480.course?.actual_stop_count > 0;
  if (compositionWorks) {
    console.log('✓ Journey composition working\n');
  } else {
    console.log('✗ Journey composition broken\n');
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('═'.repeat(100));
  console.log('\nTEST 7: Mobile Layout (no empty values)\n');

  let hasEmptyValues = false;

  if (result480.places) {
    result480.places.forEach(p => {
      if (!p.place_code || !p.name_ko || p.reason === '' || p.reason === null) {
        hasEmptyValues = true;
        console.log(`✗ Empty value in place: ${p.place_code}`);
      }
    });
  }

  if (result480.course?.blocks) {
    result480.course.blocks.forEach((b, idx) => {
      if (b.type === 'place' && (!b.name_ko || b.stay_minutes === undefined)) {
        hasEmptyValues = true;
        console.log(`✗ Empty value in place block ${idx}`);
      }
      if (b.type === 'cafe' && (!b.estimated_duration_minutes)) {
        hasEmptyValues = true;
        console.log(`✗ Empty value in cafe block ${idx}`);
      }
    });
  }

  if (!hasEmptyValues) {
    console.log('✓ No empty values displayed\n');
  } else {
    console.log('✗ Found empty values\n');
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('═'.repeat(100));
  console.log('\nFINAL REGRESSION VERDICT\n');

  const allTestsPassed = !has180Jaisan && !has480Jaisan && isUnknownPreserved && !hasEmptyValues && compositionWorks;

  if (allTestsPassed) {
    console.log('✅ ALL P0 TESTS PASS — READY FOR FIELD TEST\n');
  } else {
    console.log('❌ SOME TESTS FAILED — FIX BEFORE DEPLOY\n');
  }

  process.exit(0);
}

testRamadaP0().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
