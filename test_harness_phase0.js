/**
 * Travel Guide V0 - Phase 0 Test Harness
 *
 * Purpose: Measure actual recommendation outputs without changing production code
 * - No DB modifications
 * - No schema changes
 * - No algorithm changes
 * - Test-only instrumentation
 *
 * Collects:
 * - 8 traveler profiles (different demographics/accessibility)
 * - 6 time-budget variations (60-480 min)
 * - Decision path for each recommendation
 * - Dolsan cluster collision observations
 */

const db = require('./database/db');
const crypto = require('crypto');

// ============================================================
// INSTRUMENTED WRAPPER AROUND REAL SERVICE
// ============================================================

class InstrumentedTravelGuide {
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
        entry_point: context.entry_point,
        companion_constraints: context.companion_constraints
      },
      execution: {}
    };

    try {
      // Call real service
      const result = await this.service.recommend(context);

      logEntry.execution.success = true;
      logEntry.execution.placesReturned = result.places?.length || 0;
      logEntry.execution.message = result.message;
      logEntry.execution.foodStatus = result.food?.data_status;

      // Log top-3 with cluster tracking
      const CLUSTERS = { dolsan_area: ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar'] };
      logEntry.topRecommendations = (result.places || []).slice(0, 3).map(p => {
        const cluster = Object.entries(CLUSTERS).find(([_, members]) => members.includes(p.place_code))?.[0] || null;
        return {
          code: p.place_code,
          name: p.name_ko,
          cluster: cluster,
          stayMinutes: p.stay_minutes,
          travelTimeMinutes: p.travel_time_minutes,
          travelTimeStatus: p.travel_time_status,
          totalRequiredTime: p.total_required_time,
          totalTimeStatus: p.total_required_time_status,
          suitableFor: p.accessibility?.['suitable_for'],
          reason: p.reason,
          warnings: p.warnings
        };
      });

      // Track cluster collisions
      const clustersInTop3 = logEntry.topRecommendations.filter(p => p.cluster !== null).map(p => p.cluster);
      const uniqueClusters = new Set(clustersInTop3);
      logEntry.clusterCollision = clustersInTop3.length - uniqueClusters.size;

      this.decisionLog.push(logEntry);
      return result;
    } catch (e) {
      logEntry.execution.success = false;
      logEntry.execution.error = e.message;
      logEntry.execution.stack = e.stack;
      this.decisionLog.push(logEntry);
      throw e;
    }
  }

  getLog() {
    return this.decisionLog;
  }
}

// ============================================================
// TEST EXECUTION
// ============================================================

async function runPhase0Test() {
  console.log('TRAVEL GUIDE V0 - PHASE 0 TEST HARNESS\n');
  console.log('Purpose: Measure actual recommendation outputs\n');

  const travelGuideService = require('./services/travelGuideService');
  const harness = new InstrumentedTravelGuide(travelGuideService);

  // Test cases
  const testCases = [
    {
      label: 'CASE A: Family w/kids + car + 180min',
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
      label: 'CASE B: Couple + car + 180min',
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
      label: 'CASE C: Solo + no car + 120min',
      context: {
        people_type: 'solo',
        time_available_minutes: 120,
        has_car: false,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    },
    {
      label: 'CASE D: Senior + car + 120min',
      context: {
        people_type: 'family_elderly',
        time_available_minutes: 120,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { has_elderly: true }
      }
    },
    {
      label: 'CASE E: Wheelchair + car + 120min',
      context: {
        people_type: 'solo',
        time_available_minutes: 120,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        companion_constraints: { disability: 'wheelchair' }
      }
    },
    {
      label: 'CASE F: Family + no car + 240min',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 240,
        has_car: false,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    },
    {
      label: 'CASE G: Family + car + 180min (from Ramada)',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'RAMADA_PLAZA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    },
    {
      label: 'CASE H: Family + car + 180min (from Expo)',
      context: {
        people_type: 'family_with_kids',
        time_available_minutes: 180,
        has_car: true,
        entry_point: 'YEOSU_EXPO_STATION',
        country_code: 'KR',
        city_code: 'YEOSU'
      }
    }
  ];

  console.log('=== TRAVELER PROFILE TEST CASES ===\n');

  for (const testCase of testCases) {
    try {
      // Add required session fields
      testCase.context.user_id = crypto.randomUUID();
      testCase.context.session_id = crypto.randomUUID();

      await harness.recommend(testCase.context);
    } catch (e) {
      console.log(`${testCase.label}: FAILED - ${e.message}`);
    }
  }

  // TIME BUDGET TEST
  console.log('\n=== TIME BUDGET VARIATIONS ===\n');

  const timeBudgets = [60, 120, 180, 240, 360, 480];
  for (const time of timeBudgets) {
    try {
      const context = {
        people_type: 'family_with_kids',
        time_available_minutes: time,
        has_car: true,
        entry_point: 'RAMADA_YEOSU',
        country_code: 'KR',
        city_code: 'YEOSU',
        user_id: crypto.randomUUID(),
        session_id: crypto.randomUUID(),
        companion_constraints: { has_kids: true, kids_age: 5 },
        weather: { condition: 'clear' }
      };

      await harness.recommend(context);
    } catch (e) {
      console.log(`${time}min: FAILED - ${e.message}`);
    }
  }

  // ANALYSIS
  console.log('\n=== RESULTS ANALYSIS ===\n');

  const log = harness.getLog();
  const successfulCases = log.filter(e => e.execution.success);

  if (successfulCases.length === 0) {
    console.log('ERROR: No successful test cases. Check logs above.');
    process.exit(1);
  }

  console.log(`Successful recommendations: ${successfulCases.length} / ${log.length}`);

  // Collect top-3 sets
  const top3Sets = new Map();
  successfulCases.forEach(entry => {
    if (entry.topRecommendations?.length > 0) {
      const key = entry.topRecommendations.slice(0, 3).map(p => p.code).join(',');
      top3Sets.set(key, (top3Sets.get(key) || 0) + 1);
    }
  });

  console.log(`\nUnique Top-3 combinations: ${top3Sets.size}`);
  top3Sets.forEach((count, key) => {
    console.log(`  ${key} (${count} cases)`);
  });

  // Dolsan cluster analysis
  const dolsanPlaces = ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar'];
  let dolsanCollisions = 0;
  successfulCases.forEach(entry => {
    const dolsanInTop3 = entry.topRecommendations?.filter(p => dolsanPlaces.includes(p.code)) || [];
    if (dolsanInTop3.length >= 2) {
      dolsanCollisions++;
    }
  });

  console.log(`\nDolsan cluster collisions: ${dolsanCollisions} / ${successfulCases.length}`);

  // Most frequent top-1
  const top1Counts = new Map();
  successfulCases.forEach(entry => {
    if (entry.topRecommendations?.[0]) {
      const code = entry.topRecommendations[0].code;
      top1Counts.set(code, (top1Counts.get(code) || 0) + 1);
    }
  });

  const sortedTop1 = Array.from(top1Counts.entries()).sort((a, b) => b[1] - a[1]);
  console.log('\nMost frequent Top-1:');
  sortedTop1.slice(0, 5).forEach(([code, count]) => {
    console.log(`  ${code}: ${count}x`);
  });

  // Export for analysis
  console.log('\n=== EXPORTING DETAILED RESULTS ===\n');
  const fs = require('fs');
  fs.writeFileSync(
    './test_phase0_results.json',
    JSON.stringify(log, null, 2)
  );
  console.log('Results exported to: test_phase0_results.json');

  console.log('\nPhase 0 test harness complete.');
  process.exit(0);
}

// ============================================================
// EXECUTION
// ============================================================

runPhase0Test().catch(e => {
  console.error('FATAL ERROR:', e);
  process.exit(1);
});
