/**
 * PRODUCTION SMOKE TESTS
 * Run against Render production deployment
 * Verifies all P0 features working correctly
 */

require('dotenv').config();
const crypto = require('crypto');

// Use production API endpoint
const PRODUCTION_URL = process.env.PRODUCTION_API_URL || 'https://daily-miracles-mvp.onrender.com';
const API_ENDPOINT = `${PRODUCTION_URL}/api/dt/travel/recommend`;

async function runSmokeTests() {
  console.log(`PRODUCTION SMOKE TESTS\n`);
  console.log(`API Endpoint: ${API_ENDPOINT}\n`);
  console.log('═'.repeat(100) + '\n');

  let passCount = 0;
  let failCount = 0;

  // Test 1: 반나절 (180 min)
  console.log('TEST 1: 반나절 (180 min) with Ramada entry point\n');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          people_type: 'family_with_kids',
          time_available_minutes: 180,
          has_car: true,
          entry_point: 'RAMADA_YEOSU',
          country_code: 'KR',
          city_code: 'YEOSU',
          meal_context: 'lunch',
          user_id: crypto.randomUUID(),
          session_id: crypto.randomUUID()
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const hasJaisanPark = data.places?.some(p => p.place_code === 'jaisan_park');
      const hasCourse = data.course?.blocks?.length > 0;

      console.log(`Status: ${response.status} ✓`);
      console.log(`Places: ${data.places?.map(p => p.place_code).join(', ')}`);
      console.log(`Jaisan park excluded: ${!hasJaisanPark ? '✓' : '✗'}`);
      console.log(`Course blocks: ${hasCourse ? '✓' : '✗'}`);

      if (!hasJaisanPark && hasCourse) {
        console.log('✅ PASS\n');
        passCount++;
      } else {
        console.log('❌ FAIL\n');
        failCount++;
      }
    } else {
      console.log(`Error: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data)}\n`);
      console.log('❌ FAIL\n');
      failCount++;
    }
  } catch (e) {
    console.log(`Network error: ${e.message}\n`);
    console.log('❌ FAIL\n');
    failCount++;
  }

  // Test 2: 하루 (480 min) with cafe benefits
  console.log('TEST 2: 하루 (480 min) with cafe benefits\n');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          people_type: 'family_with_kids',
          time_available_minutes: 480,
          has_car: true,
          entry_point: 'RAMADA_YEOSU',
          country_code: 'KR',
          city_code: 'YEOSU',
          meal_context: 'lunch',
          user_id: crypto.randomUUID(),
          session_id: crypto.randomUUID()
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const cafeBlock = data.course?.blocks?.find(b => b.type === 'cafe');
      const hasJaisanPark = data.places?.some(p => p.place_code === 'jaisan_park');
      const hasCafeBenefit = cafeBlock?.cafes?.some(c => c.benefit?.display_copy);

      console.log(`Status: ${response.status} ✓`);
      console.log(`Places: ${data.places?.map(p => p.place_code).join(', ')}`);
      console.log(`Jaisan park excluded: ${!hasJaisanPark ? '✓' : '✗'}`);
      console.log(`Cafe benefit present: ${hasCafeBenefit ? '✓' : '✗'}`);
      if (hasCafeBenefit) {
        console.log(`Cafe benefit: ${cafeBlock.cafes[0].benefit?.display_copy.substring(0, 30)}...`);
      }

      if (!hasJaisanPark && hasCafeBenefit) {
        console.log('✅ PASS\n');
        passCount++;
      } else {
        console.log('❌ FAIL\n');
        failCount++;
      }
    } else {
      console.log(`Error: ${response.status}\n`);
      console.log('❌ FAIL\n');
      failCount++;
    }
  } catch (e) {
    console.log(`Network error: ${e.message}\n`);
    console.log('❌ FAIL\n');
    failCount++;
  }

  // Test 3: 직접 시간 선택 (Custom time)
  console.log('TEST 3: 직접 시간 선택 (240 min custom)\n');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          people_type: 'couple',
          time_available_minutes: 240,
          has_car: true,
          entry_point: 'RAMADA_YEOSU',
          country_code: 'KR',
          city_code: 'YEOSU',
          meal_context: 'lunch',
          user_id: crypto.randomUUID(),
          session_id: crypto.randomUUID()
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const hasCourse = data.course?.available_minutes === 240;
      const hasCourseBlocks = data.course?.blocks?.length > 0;

      console.log(`Status: ${response.status} ✓`);
      console.log(`Custom time preserved: ${hasCourse ? '✓' : '✗'}`);
      console.log(`Course blocks: ${hasCourseBlocks ? '✓' : '✗'}`);

      if (hasCourse && hasCourseBlocks) {
        console.log('✅ PASS\n');
        passCount++;
      } else {
        console.log('❌ FAIL\n');
        failCount++;
      }
    } else {
      console.log(`Error: ${response.status}\n`);
      console.log('❌ FAIL\n');
      failCount++;
    }
  } catch (e) {
    console.log(`Network error: ${e.message}\n`);
    console.log('❌ FAIL\n');
    failCount++;
  }

  // Test 4: Moipin benefit (10% only)
  console.log('TEST 4: Moipin benefit (10% 할인 only)\n');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          people_type: 'couple',
          time_available_minutes: 180,
          has_car: true,
          entry_point: 'RAMADA_YEOSU',
          country_code: 'KR',
          city_code: 'YEOSU',
          meal_context: 'lunch',
          user_id: crypto.randomUUID(),
          session_id: crypto.randomUUID()
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const moipinBenefit = data.benefits?.find(b => b.partner_name?.includes('모이핀'))?.title;
      const isCorrect = moipinBenefit?.includes('할인') && !moipinBenefit?.includes('무료');

      console.log(`Status: ${response.status} ✓`);
      console.log(`Moipin benefit: "${moipinBenefit || '(not found)'}"`);
      console.log(`Correct (10% only): ${isCorrect ? '✓' : '✗'}`);

      if (isCorrect) {
        console.log('✅ PASS\n');
        passCount++;
      } else {
        console.log('❌ FAIL\n');
        failCount++;
      }
    } else {
      console.log(`Error: ${response.status}\n`);
      console.log('❌ FAIL\n');
      failCount++;
    }
  } catch (e) {
    console.log(`Network error: ${e.message}\n`);
    console.log('❌ FAIL\n');
    failCount++;
  }

  // Test 5: Copy cleanup (no English, no debug text)
  console.log('TEST 5: Copy cleanup (Korean only, no debug text)\n');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          people_type: 'family_with_kids',
          time_available_minutes: 180,
          has_car: true,
          entry_point: 'RAMADA_YEOSU',
          country_code: 'KR',
          city_code: 'YEOSU',
          meal_context: 'lunch',
          user_id: crypto.randomUUID(),
          session_id: crypto.randomUUID()
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const reason = data.places?.[0]?.reason || '';
      const hasEnglish = reason.includes('Your') || reason.includes('matches');
      const hasKorean = reason.includes('맞') || reason.includes('조건');
      const noDebugText = !JSON.stringify(data).includes('course with');

      console.log(`Status: ${response.status} ✓`);
      console.log(`Reason (sample): "${reason.substring(0, 40)}..."`);
      console.log(`No English copy: ${!hasEnglish ? '✓' : '✗'}`);
      console.log(`Has Korean copy: ${hasKorean ? '✓' : '✗'}`);
      console.log(`No debug text: ${noDebugText ? '✓' : '✗'}`);

      if (!hasEnglish && hasKorean && noDebugText) {
        console.log('✅ PASS\n');
        passCount++;
      } else {
        console.log('❌ FAIL\n');
        failCount++;
      }
    } else {
      console.log(`Error: ${response.status}\n`);
      console.log('❌ FAIL\n');
      failCount++;
    }
  } catch (e) {
    console.log(`Network error: ${e.message}\n`);
    console.log('❌ FAIL\n');
    failCount++;
  }

  // Test 6: UNKNOWN travel semantics
  console.log('TEST 6: UNKNOWN travel semantics (480 min)\n');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          people_type: 'couple',
          time_available_minutes: 480,
          has_car: true,
          entry_point: 'RAMADA_YEOSU',
          country_code: 'KR',
          city_code: 'YEOSU',
          meal_context: 'lunch',
          user_id: crypto.randomUUID(),
          session_id: crypto.randomUUID()
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const summary = data.course?.summary;
      const travelBlock = data.course?.blocks?.find(b => b.type === 'travel_transition');

      const hasNullRange = summary?.estimated_total_range === null;
      const hasCorrectFitStatus = summary?.fit_status === 'travel_time_unverified';
      const hasTravelTransitionMessage = travelBlock?.message_ko?.includes('확인 중');

      console.log(`Status: ${response.status} ✓`);
      console.log(`Total range is null: ${hasNullRange ? '✓' : '✗'}`);
      console.log(`Fit status correct: ${hasCorrectFitStatus ? '✓' : '✗'}`);
      console.log(`Travel message shows "확인 중": ${hasTravelTransitionMessage ? '✓' : '✗'}`);

      if (hasNullRange && hasCorrectFitStatus && hasTravelTransitionMessage) {
        console.log('✅ PASS\n');
        passCount++;
      } else {
        console.log('❌ FAIL\n');
        failCount++;
      }
    } else {
      console.log(`Error: ${response.status}\n`);
      console.log('❌ FAIL\n');
      failCount++;
    }
  } catch (e) {
    console.log(`Network error: ${e.message}\n`);
    console.log('❌ FAIL\n');
    failCount++;
  }

  // Summary
  console.log('═'.repeat(100));
  console.log(`\nRESULTS: ${passCount}/6 PASS\n`);

  if (passCount === 6) {
    console.log('✅ PRODUCTION DEPLOYMENT VERIFIED\n');
  } else {
    console.log(`❌ ${failCount} test(s) failed\n`);
  }

  process.exit(passCount === 6 ? 0 : 1);
}

runSmokeTests();
