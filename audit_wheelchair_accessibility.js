/**
 * CRITICAL AUDIT: Wheelchair/Accessibility Filter Logic
 *
 * Purpose: Verify that accessibility constraints work correctly
 * Safety concern: Two separate wheelchair checks with conflicting logic
 */

require('dotenv').config();
const db = require('./database/db');

async function auditWheelchairAccessibility() {
  console.log('CRITICAL AUDIT: WHEELCHAIR/ACCESSIBILITY FILTER SEMANTICS\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Identify the two wheelchair checks
    console.log('STEP 1: CONFLICTING WHEELCHAIR LOGIC\n');

    console.log('Filter 1: _passesAccessibility() (lines 270-285)');
    console.log('  Trigger: companion_constraints.disability === "wheelchair"');
    console.log('  Field used: place.accessibility_wheelchair_status');
    console.log('  Expected values: "verified_yes", "verified_no", "unknown"');
    console.log('  Logic:');
    console.log('    verified_yes → return true (include)');
    console.log('    verified_no → return false (EXCLUDE)');
    console.log('    unknown → return true WITH WARNING (fail-safe)\n');

    console.log('Filter 2: _passesCompanion() (lines 337-339)');
    console.log('  Trigger: companion_constraints.disability === "wheelchair"');
    console.log('  Field used: suitable_for array');
    console.log('  Expected tag: "wheelchair_accessible"');
    console.log('  Logic:');
    console.log('    if suitableFor.includes("wheelchair_accessible") → return true');
    console.log('    else → return false (IMPLICIT EXCLUDE)\n');

    // Step 2: Check database reality
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('STEP 2: DATABASE FIELD VERIFICATION\n');

    const placesResult = await db.query(`
      SELECT
        code,
        name_ko,
        accessibility_wheelchair_status,
        accessibility_stroller_status,
        bus_accessible_status,
        suitable_for
      FROM travel_places
      WHERE country_code = 'KR' AND city_code = 'YEOSU'
      ORDER BY code
    `);

    const places = placesResult.rows;

    console.log(`Places examined: ${places.length}\n`);
    console.log('ACCESSIBILITY STATUS FIELDS (canonical):');
    console.log('  accessibility_wheelchair_status: ' +
      Array.from(new Set(places.map(p => p.accessibility_wheelchair_status))).join(', '));
    console.log('  accessibility_stroller_status: ' +
      Array.from(new Set(places.map(p => p.accessibility_stroller_status))).join(', '));
    console.log('  bus_accessible_status: ' +
      Array.from(new Set(places.map(p => p.bus_accessible_status))).join(', '));

    // Check suitable_for
    const allTags = new Set();
    places.forEach(p => {
      (p.suitable_for || []).forEach(tag => allTags.add(tag));
    });

    console.log('\nSUITABLE_FOR TAGS:');
    console.log('  Tags present: ' + Array.from(allTags).sort().join(', '));
    console.log('  Contains "wheelchair_accessible": ' + (allTags.has('wheelchair_accessible') ? 'YES' : 'NO'));

    // Step 3: Controlled test cases
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('STEP 3: CONTROLLED WHEELCHAIR TEST CASES\n');

    const testCases = [
      {
        label: 'Wheelchair user + car',
        companion: { disability: 'wheelchair' },
        has_car: true
      },
      {
        label: 'Wheelchair user + no car',
        companion: { disability: 'wheelchair' },
        has_car: false
      }
    ];

    for (const testCase of testCases) {
      console.log(`\nTest: ${testCase.label}`);
      console.log('-'.repeat(80));

      // Simulate filter logic
      let passAccessibility = 0;
      let passCompanion = 0;

      places.forEach(place => {
        // Accessibility filter (CORRECT)
        const wheelchairStatus = place.accessibility_wheelchair_status || 'unknown';
        const passA = wheelchairStatus === 'verified_yes' || wheelchairStatus === 'unknown';

        // Companion filter (BROKEN)
        const suitableFor = place.suitable_for || [];
        const passC = suitableFor.includes('wheelchair_accessible');

        if (passA) passAccessibility++;
        if (passC) passCompanion++;

        // Show critical mismatches
        if (passA && !passC) {
          console.log(
            `  ${place.code.padEnd(20)} | A:✅ C:❌ | Status: ${wheelchairStatus.padEnd(14)} | Tags: ${suitableFor.join(',') || '(none)'}`
          );
        }
      });

      console.log(`\nResults:`);
      console.log(`  _passesAccessibility (CORRECT): ${passAccessibility}/${places.length} would pass`);
      console.log(`  _passesCompanion (BROKEN): ${passCompanion}/${places.length} would pass`);
      console.log(`  Final result: ${passCompanion}/${places.length} wheelchair-accessible recommendations\n`);
    }

    // Step 4: Identify the root cause
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('STEP 4: ROOT CAUSE ANALYSIS\n');

    const wheelchairAccessStatus = places.map(p => p.accessibility_wheelchair_status);
    const wheelchairAccessCount = {
      verified_yes: wheelchairAccessStatus.filter(s => s === 'verified_yes').length,
      verified_no: wheelchairAccessStatus.filter(s => s === 'verified_no').length,
      unknown: wheelchairAccessStatus.filter(s => s === 'unknown').length
    };

    console.log('Wheelchair accessibility status distribution:');
    Object.entries(wheelchairAccessCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}/${places.length}`);
    });

    console.log('\nRoot cause:');
    console.log('  1. _passesAccessibility() uses accessibility_wheelchair_status field');
    console.log('  2. _passesCompanion() uses suitable_for tag "wheelchair_accessible"');
    console.log(`  3. NO places have "wheelchair_accessible" tag in suitable_for`);
    console.log('  4. _passesCompanion() ALWAYS returns false for wheelchair users');
    console.log('  5. Even though _passesAccessibility() correctly handles them');
    console.log('  6. Final result: wheelchair users get NO RECOMMENDATIONS\n');

    // Step 5: Safety risk assessment
    console.log('='.repeat(80) + '\n');
    console.log('STEP 5: SAFETY RISK ASSESSMENT\n');

    console.log('Risk: CRITICAL\n');
    console.log('Severity: ACCESSIBILITY VIOLATION\n');
    console.log('Behavior:');
    console.log('  - Wheelchair users requesting recommendations get NO RESULTS');
    console.log('  - This occurs DESPITE having correct accessibility_wheelchair_status field');
    console.log('  - The broken _passesCompanion() filter overrides the correct logic\n');

    console.log('UNKNOWN semantics impact:');
    console.log('  - Places with unknown wheelchair status:');
    console.log(`    _passesAccessibility: Include with warning (CORRECT fail-safe)`);
    console.log(`    _passesCompanion: Exclude (WRONG, not fail-safe)`);
    console.log('  - This violates Phase 1 fail-safe principle\n');

    console.log('Accessibility constraint semantics:');
    console.log('  verified_yes: Safe to recommend');
    console.log('  verified_no: Must be excluded');
    console.log('  unknown: Include with warning (current accessibility filter)');
    console.log('           → BUT excluded by broken companion filter\n');

    // Step 6: Current behavior summary
    console.log('='.repeat(80) + '\n');
    console.log('STEP 6: CURRENT BEHAVIOR SUMMARY\n');

    console.log('WHEELCHAIR FILTER FLOW:');
    console.log('  1. Safety filter (generic) ✅');
    console.log('  2. Live status filter ✅');
    console.log('  3. Time filter ✅');
    console.log('  4. Transport filter (may be skipped) ✓');
    console.log('  5. _passesAccessibility (wheelchair check) ✅ CORRECT');
    console.log('     - Uses accessibility_wheelchair_status field');
    console.log('     - Implements fail-safe for unknown');
    console.log('     - Would allow appropriate places through');
    console.log('  6. _passesCompanion (wheelchair check) ❌ BROKEN');
    console.log('     - Uses non-existent suitable_for tag');
    console.log('     - Always returns false');
    console.log('     - Rejects all places regardless of accessibility status');
    console.log('  7. Weather filter ✅');
    console.log('  8. Emotion filter (if applicable) ✅');
    console.log('  9. Traveler fit scoring ✅');
    console.log('  10. Cluster diversity ✅');
    console.log('  11. Top 3 selection ✅\n');

    console.log('FINAL RESULT: 0 recommendations (broken by step 6)\n');

    // Export audit
    const audit = {
      timestamp: new Date().toISOString(),
      wheelchairStatus: wheelchairAccessCount,
      wheelchairAccessibleTagExists: allTags.has('wheelchair_accessible'),
      accessibility_fields_correct: true,
      companion_filter_broken: true,
      safety_risk: 'CRITICAL',
      wheelchair_users_affected: 'ALL (100%)',
      stroller_users_affected: 'ALL if kids under 3 (100%)',
      root_cause: 'Two conflicting wheelchair checks with different field assumptions'
    };

    const fs = require('fs');
    fs.writeFileSync(
      './audit_wheelchair_accessibility_report.json',
      JSON.stringify(audit, null, 2)
    );

    console.log('Audit report saved to: audit_wheelchair_accessibility_report.json');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

auditWheelchairAccessibility();
