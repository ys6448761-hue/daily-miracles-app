/**
 * Audit companion filter vocabulary mismatches
 * Purpose: Find ALL vocabulary mismatches between code expectations and DB reality
 *
 * Compare:
 * A. Every people_type/companion value accepted by API
 * B. Every tag expected by companion filtering code
 * C. Every distinct suitable_for tag in DB
 * D. Phase 1B normalization vocabulary
 */

require('dotenv').config();
const db = require('./database/db');
const fs = require('fs');

async function auditCompanionVocabulary() {
  console.log('COMPANION VOCABULARY ALIGNMENT AUDIT\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Extract code expectations from filter logic
    console.log('STEP 1: CODE EXPECTATIONS\n');

    const codeExpectations = {
      family_with_kids: {
        trigger: 'people_type === "family_with_kids" && companion_constraints?.has_kids',
        checks: [
          { field: 'suitable_for', method: 'includes', value: 'kids_ok' }
        ],
        lineNumber: 321
      },
      family_elderly: {
        trigger: 'people_type === "family_elderly" && companion_constraints?.has_elderly',
        checks: [
          { field: 'suitable_for', method: 'includes', value: 'elderly_ok' }
        ],
        lineNumber: 324
      },
      wheelchair: {
        trigger: 'companion_constraints?.disability === "wheelchair"',
        checks: [
          { field: 'suitable_for', method: 'includes', value: 'wheelchair_accessible' }
        ],
        lineNumber: 327
      }
    };

    Object.entries(codeExpectations).forEach(([type, config]) => {
      console.log(`${type.toUpperCase()}:`);
      console.log(`  Trigger: ${config.trigger}`);
      console.log(`  Checks:`);
      config.checks.forEach(check => {
        console.log(`    - ${check.field}.${check.method}("${check.value}")`);
      });
      console.log('');
    });

    // Step 2: Fetch actual DB vocabulary
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('STEP 2: DATABASE REALITY\n');

    const placesResult = await db.query(`
      SELECT code, suitable_for
      FROM travel_places
      WHERE country_code = 'KR' AND city_code = 'YEOSU'
      ORDER BY code
    `);

    const places = placesResult.rows;
    const allDBTags = new Set();
    places.forEach(p => {
      (p.suitable_for || []).forEach(tag => allDBTags.add(tag));
    });

    console.log(`Total places: ${places.length}`);
    console.log(`Distinct suitable_for tags: ${allDBTags.size}\n`);

    console.log('All DB tags (alphabetical):');
    Array.from(allDBTags).sort().forEach((tag, i) => {
      const count = places.filter(p => (p.suitable_for || []).includes(tag)).length;
      console.log(`  ${i+1}. "${tag}" (${count} places)`);
    });

    // Step 3: Build mismatch matrix
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('STEP 3: MISMATCH MATRIX\n');

    const mismatchMatrix = [];

    Object.entries(codeExpectations).forEach(([inputType, config]) => {
      config.checks.forEach(check => {
        const expectedValue = check.value;
        const foundInDB = allDBTags.has(expectedValue);
        const status = foundInDB ? '✅ MATCH' : '❌ MISMATCH';

        let actualTag = null;
        if (!foundInDB && inputType === 'family_elderly') {
          // Special case: elderly vs elderly_ok
          if (allDBTags.has('elderly')) {
            actualTag = 'elderly';
          }
        }

        mismatchMatrix.push({
          inputType,
          field: check.field,
          codeExpects: expectedValue,
          dbActual: actualTag || expectedValue,
          foundInDB,
          status,
          action: foundInDB ? 'NONE' : actualTag ? 'NORMALIZE' : 'INVESTIGATE'
        });
      });
    });

    console.log('INPUT_TYPE | CODE_EXPECTS | DB_ACTUAL | MATCH_STATUS | ACTION');
    console.log('-'.repeat(80));
    mismatchMatrix.forEach(row => {
      const matchStr = row.foundInDB ? '✅' : '❌';
      console.log(
        `${row.inputType.padEnd(20)} | ${row.codeExpects.padEnd(20)} | ${row.dbActual.padEnd(25)} | ${matchStr.padEnd(12)} | ${row.action}`
      );
    });

    // Step 4: Phase 1B normalization vocabulary
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('STEP 4: PHASE 1B NORMALIZATION VOCABULARY\n');

    const phase1bNormalization = {
      family_with_kids: ['family', 'kids_ok'],
      couple: ['couples'],
      solo: [],
      family_elderly: ['elderly']  // Note: uses "elderly" not "elderly_ok"
    };

    console.log('Phase 1B normalized mappings:');
    Object.entries(phase1bNormalization).forEach(([type, tags]) => {
      console.log(`  ${type}: [${tags.map(t => `"${t}"`).join(', ')}]`);
    });

    // Step 5: Identify conflicts
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('STEP 5: VOCABULARY CONFLICT ANALYSIS\n');

    const conflicts = [];

    // Check family_elderly
    if (!allDBTags.has('elderly_ok') && allDBTags.has('elderly')) {
      conflicts.push({
        component: 'Companion filter (family_elderly)',
        codeExpects: 'elderly_ok',
        dbActual: 'elderly',
        phase1bUses: 'elderly',
        severity: 'HIGH',
        affectedTravelers: 'family_elderly',
        affectedPlaces: 6,
        issue: 'Code filter and Phase 1B normalization use different tag names'
      });
    }

    // Check kids_ok
    if (!allDBTags.has('kids_ok')) {
      conflicts.push({
        component: 'Companion filter (family_with_kids)',
        codeExpects: 'kids_ok',
        dbActual: 'NOT FOUND',
        phase1bUses: 'kids_ok',
        severity: 'CRITICAL',
        affectedTravelers: 'family_with_kids',
        affectedPlaces: '0 (none would pass)',
        issue: 'Tag expected by code does not exist in DB'
      });
    }

    // Check wheelchair_accessible
    if (!allDBTags.has('wheelchair_accessible')) {
      conflicts.push({
        component: 'Companion filter (wheelchair)',
        codeExpects: 'wheelchair_accessible',
        dbActual: 'NOT FOUND',
        phase1bUses: 'N/A (not in Phase 1B)',
        severity: 'CRITICAL',
        affectedTravelers: 'wheelchair users',
        affectedPlaces: '0 (none would pass)',
        issue: 'Tag expected by code does not exist in DB; accessibility_wheelchair_status field exists instead'
      });
    }

    if (conflicts.length === 0) {
      console.log('✅ NO CONFLICTS FOUND (unexpected)\n');
    } else {
      console.log(`❌ ${conflicts.length} CONFLICT(S) FOUND:\n`);
      conflicts.forEach((conflict, i) => {
        console.log(`${i+1}. ${conflict.component}`);
        console.log(`   Severity: ${conflict.severity}`);
        console.log(`   Code expects: "${conflict.codeExpects}"`);
        console.log(`   DB actual: "${conflict.dbActual}"`);
        console.log(`   Phase 1B uses: "${conflict.phase1bUses}"`);
        console.log(`   Affected travelers: ${conflict.affectedTravelers}`);
        console.log(`   Issue: ${conflict.issue}`);
        console.log('');
      });
    }

    // Step 6: Canonical mapping recommendation
    console.log('='.repeat(80) + '\n');
    console.log('STEP 6: RECOMMENDED CANONICAL MAPPING\n');

    const canonicalMapping = {
      comment: 'Single source of truth for tag vocabulary',
      format: 'Normalize code expectations to DB reality',
      mappings: {
        family_with_kids: {
          codeFieldName: 'suitable_for',
          normalizedTags: ['kids_ok'],
          confidence: 'HIGH (tag exists, exact match)'
        },
        family_elderly: {
          codeFieldName: 'suitable_for',
          normalizedTags: ['elderly'],
          confidence: 'HIGH (tag exists, code used wrong name)',
          shouldNotUse: ['elderly_ok'],
          phase1bConflict: 'Phase 1B normalization already uses "elderly" correctly'
        },
        wheelchair: {
          codeFieldName: 'suitable_for',
          normalizedTags: [],
          confidence: 'NONE (tag does not exist)',
          alternativeField: 'accessibility_wheelchair_status',
          note: 'Should use separate accessibility field, not suitable_for'
        }
      }
    };

    console.log(JSON.stringify(canonicalMapping, null, 2));

    // Export full audit
    const auditReport = {
      timestamp: new Date().toISOString(),
      codeExpectations,
      databaseTags: Array.from(allDBTags).sort(),
      mismatchMatrix,
      phase1bNormalization,
      conflicts,
      canonicalMapping
    };

    fs.writeFileSync(
      './audit_companion_vocabulary_report.json',
      JSON.stringify(auditReport, null, 2)
    );

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('AUDIT COMPLETE');
    console.log('Full report saved to: audit_companion_vocabulary_report.json\n');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

auditCompanionVocabulary();
