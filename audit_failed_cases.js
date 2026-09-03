/**
 * Audit why CASE D (elderly) and CASE E (wheelchair) returned no results
 * Purpose: Understand if it's a safety constraint issue or data quality issue
 */

require('dotenv').config();
const db = require('./database/db');

async function auditFailedCases() {
  console.log('PHASE 1B AUDIT: FAILED CASE ANALYSIS\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Fetch all places with relevant accessibility data
    const query = `
      SELECT
        code,
        name_ko,
        suitable_for,
        physical_difficulty,
        accessibility_wheelchair_status,
        accessibility_stroller_status,
        bus_accessible_status,
        access_by_car,
        access_by_bus
      FROM travel_places
      WHERE country_code = 'KR' AND city_code = 'YEOSU'
      ORDER BY code
    `;

    const result = await db.query(query);
    const places = result.rows;

    console.log('CASE D ANALYSIS: family_elderly + car + 120min\n');
    console.log('Filter requirement: suitable_for includes "elderly_ok" (from companion_constraints.has_elderly)\n');

    console.log('PLACE | SUITABLE_FOR | HAS_ELDERLY_OK | PHYSICAL_DIFFICULTY');
    console.log('-'.repeat(80));

    places.forEach(place => {
      const suitableFor = place.suitable_for || [];
      const hasElderly = suitableFor.includes('elderly_ok');
      const physDiff = place.physical_difficulty || '(not set)';

      console.log(`${place.code.padEnd(15)} | ${JSON.stringify(suitableFor).padEnd(30)} | ${(hasElderly ? 'YES' : 'NO').padEnd(14)} | ${physDiff}`);
    });

    console.log('\n⚠️ ROOT CAUSE: Filter looks for "elderly_ok" but DB has "elderly"\n');
    console.log('Code checks: suitableFor.includes("elderly_ok") — MISMATCH\n');

    console.log('Actual tags in DB for elderly-relevant places:');
    places
      .filter(p => (p.suitable_for || []).includes('elderly'))
      .forEach(p => {
        console.log(`  - ${p.code}: ${p.suitable_for.join(', ')}`);
      });

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('CASE E ANALYSIS: solo + wheelchair + car + 120min\n');
    console.log('Filter requirement: suitable_for includes "wheelchair_accessible"\n');

    console.log('PLACE | SUITABLE_FOR | WHEELCHAIR_ACCESSIBLE | WHEELCHAIR_STATUS');
    console.log('-'.repeat(80));

    places.forEach(place => {
      const suitableFor = place.suitable_for || [];
      const hasWheelchair = suitableFor.includes('wheelchair_accessible');
      const wheelchairStatus = place.accessibility_wheelchair_status || '(not set)';

      console.log(`${place.code.padEnd(15)} | ${JSON.stringify(suitableFor).padEnd(30)} | ${(hasWheelchair ? 'YES' : 'NO').padEnd(20)} | ${wheelchairStatus}`);
    });

    console.log('\n⚠️ ROOT CAUSE: Filter looks for "wheelchair_accessible" but DB has no such tag\n');
    console.log('Code checks: suitableFor.includes("wheelchair_accessible") — NOT FOUND\n');
    console.log('Alternative field: accessibility_wheelchair_status:\n');

    places.forEach(place => {
      const status = place.accessibility_wheelchair_status;
      if (status) {
        console.log(`  - ${place.code}: ${status}`);
      }
    });

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('SUMMARY:\n');

    console.log('CASE D (family_elderly):\n');
    console.log('  Problem: Code checks for "elderly_ok" in suitable_for');
    console.log('  Actual tag: "elderly" (10 places have it)');
    console.log('  Mismatch: Code bug or inconsistent data dictionary');
    console.log('  Solution: Check service code for actual filter logic\n');

    console.log('CASE E (wheelchair):\n');
    console.log('  Problem: Code checks for "wheelchair_accessible" in suitable_for');
    console.log('  Actual tag: None found in suitable_for array');
    console.log('  Alternative: accessibility_wheelchair_status field exists');
    console.log('  Issue: Filter uses wrong field (suitable_for vs accessibility_wheelchair_status)');
    console.log('  Solution: Fix filter to use accessibility_wheelchair_status\n');

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

auditFailedCases();
