/**
 * Travel Guide V1B - Test Harness
 *
 * Purpose: Measure traveler fit scoring impact
 * - Phase 1A cluster diversity baseline: 12/14 cases return identical top-3
 * - Phase 1B adds traveler fit scoring: measure differentiation
 *
 * Test cases:
 * - A: family_with_kids + car + 180
 * - B: couple + car + 180
 * - C: solo + car + 180
 * - D: family_elderly + car + 180 (expected to fail due to existing bug)
 * - E: family_with_kids + no-car + 240
 * - F: couple + no-car + 240
 * - G: no people_type + car + 180 (baseline, should match Phase 1A)
 */

require('dotenv').config();
const db = require('./database/db');
const crypto = require('crypto');

class InstrumentedTravelGuidePhase1B {
  constructor(realService) {
    this.service = realService;
    this.decisionLog = [];
  }

  async recommend(context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context: {
        people_type: context.people_type,
        time_available_minutes: context.time_available_minutes,
        has_car: context.has_car,
        entry_point: context.entry_point
      },
      execution: {}
    };

    try {
      const result = await this.service.recommend(context);

      logEntry.execution.success = true;
      logEntry.execution.placesReturned = result.places?.length || 0;
      logEntry.execution.message = result.message;

      logEntry.topRecommendations = (result.places || []).slice(0, 3).map(p => ({
        code: p.place_code,
        name: p.name_ko,
        stayMinutes: p.stay_minutes,
        totalRequiredTime: p.total_required_time,
        totalTimeStatus: p.total_required_time_status,
        reason: p.reason,
        warnings: p.warnings
      }));

      this.decisionLog.push(logEntry);
      return result;
    } catch (e) {
      logEntry.execution.success = false;
      logEntry.execution.error = e.message;
      this.decisionLog.push(logEntry);
      throw e;
    }
  }

  getLog() {
    return this.decisionLog;
  }
}

async function runPhase1BTest() {
  console.log('TRAVEL GUIDE V0 - PHASE 1B TEST HARNESS\n');
  console.log('Purpose: Measure traveler fit scoring impact\n');

  const travelGuideService = require('./services/travelGuideService');
  const harness = new InstrumentedTravelGuidePhase1B(travelGuideService);

  const testCases = [
    {
      label: 'CASE A: family_with_kids + car + 180min',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { has_kids: true, kids_age: 5 },
        weather: { condition: 'clear' }
      }
    },
    {
      label: 'CASE B: couple + car + 180min',
      context: {
        people_type: 'couple',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    },
    {
      label: 'CASE C: solo + car + 180min',
      context: {
        people_type: 'solo',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    },
    {
      label: 'CASE D: family_elderly + car + 180min',
      context: {
        people_type: 'family_elderly',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { has_elderly: true }
      }
    },
    {
      label: 'CASE E: family_with_kids + no-car + 240min',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 240,
        has_car: false,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { has_kids: true, kids_age: 5 }
      }
    },
    {
      label: 'CASE F: couple + no-car + 240min',
      context: {
        people_type: 'couple',
        time_available_minutes: 240,
        has_car: false,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    },
    {
      label: 'CASE G: no people_type + car + 180min (baseline)',
      context: {
        // people_type: undefined
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    }
  ];

  console.log('=== TRAVELER TYPE TEST CASES ===\n');

  for (const testCase of testCases) {
    try {
      testCase.context.user_id = crypto.randomUUID();
      testCase.context.session_id = crypto.randomUUID();

      await harness.recommend(testCase.context);
    } catch (e) {
      console.log(`${testCase.label}: FAILED - ${e.message}`);
    }
  }

  // Analysis
  console.log('\n=== RESULTS ANALYSIS ===\n');

  const log = harness.getLog();
  const successfulCases = log.filter(e => e.execution.success && e.execution.placesReturned > 0);

  console.log(`Successful recommendations: ${successfulCases.length} / ${log.length}\n`);

  if (successfulCases.length === 0) {
    console.log('ERROR: No successful test cases.');
    process.exit(1);
  }

  // Collect top-3 sets
  const top3Sets = new Map();
  const caseResults = [];

  successfulCases.forEach((entry, idx) => {
    if (entry.topRecommendations?.length > 0) {
      const top3Codes = entry.topRecommendations.slice(0, 3).map(p => p.code);
      const key = top3Codes.join(',');
      top3Sets.set(key, (top3Sets.get(key) || 0) + 1);

      caseResults.push({
        caseLabel: log[log.indexOf(entry)],
        top3: top3Codes,
        key: key
      });
    }
  });

  console.log('TOP-3 RESULTS BY CASE:\n');
  successfulCases.forEach(entry => {
    const top3 = entry.topRecommendations.slice(0, 3).map(p => p.code).join(' → ');
    const context = entry.context;
    const travelerType = context.people_type || '(none)';
    console.log(`${travelerType.padEnd(18)} | ${entry.execution.placesReturned} places | ${top3}`);
  });

  console.log(`\nUnique Top-3 combinations: ${top3Sets.size}`);
  console.log('Distribution:');
  [...top3Sets.entries()].sort((a, b) => b[1] - a[1]).forEach(([key, count]) => {
    console.log(`  ${key} (${count} case(s))`);
  });

  // Comparison with Phase 1A
  console.log('\n' + '='.repeat(80));
  console.log('\nCOMPARISON WITH PHASE 1A BASELINE:\n');
  console.log('Phase 1A result: cablecar, hyangiram, jaisan_park (12/12 cases)\n');
  console.log('Phase 1B expected variance:');
  console.log('  - family_with_kids (A, E): Same as Phase 1A (family tags boost cablecar equally)');
  console.log('  - couple (B, F): Different (dolsan_nightscape has couples tag)');
  console.log('  - solo (C): Same as Phase 1A (no solo tags in DB)');
  console.log('  - no people_type (G): Same as Phase 1A (no traveler fit input)\n');

  // Check if couple case got different result
  const coupleCase = successfulCases.find(e => e.context.people_type === 'couple');
  const familyCase = successfulCases.find(e => e.context.people_type === 'family_with_kids');

  if (coupleCase && familyCase) {
    const coupleTop3 = coupleCase.topRecommendations.slice(0, 3).map(p => p.code).join(',');
    const familyTop3 = familyCase.topRecommendations.slice(0, 3).map(p => p.code).join(',');

    if (coupleTop3 !== familyTop3) {
      console.log('✅ TRAVELER FIT WORKING: couple and family got different top-3');
    } else {
      console.log('⚠️  Couple and family got same top-3 (may indicate couples tag not being used)');
    }
  }

  // Export results
  console.log('\n=== EXPORTING RESULTS ===\n');
  const fs = require('fs');
  fs.writeFileSync(
    './test_phase1b_results.json',
    JSON.stringify(log, null, 2)
  );
  console.log('Results exported to: test_phase1b_results.json');

  console.log('\nPhase 1B test harness complete.');
  process.exit(0);
}

runPhase1BTest().catch(e => {
  console.error('FATAL ERROR:', e);
  process.exit(1);
});
