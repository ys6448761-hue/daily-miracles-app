/**
 * Critical Audit:
 * 1. travel_places schema - what fields are required/optional?
 * 2. 모이핀 (Moipin) current benefit - verify contract vs production
 * 3. Gather verified data for 돌산공원 and 더 포레스트랜드
 */

require('dotenv').config();
const db = require('./database/db');

async function auditSchema() {
  console.log('CRITICAL AUDIT: Place Schema & Moipin Benefit\n');
  console.log('═'.repeat(100) + '\n');

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('1. travel_places SCHEMA (required vs optional fields)\n');

  try {
    const schemaResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'travel_places'
      ORDER BY ordinal_position
    `);

    if (schemaResult.rows.length > 0) {
      console.log('Columns:');
      schemaResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'nullable' : 'REQUIRED';
        const hasDefault = col.column_default ? `(default: ${col.column_default})` : '';
        console.log(`  ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(20)} | ${nullable} ${hasDefault}`);
      });
    }
  } catch (e) {
    console.error('Error querying schema:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\n2. MOIPIN CURRENT BENEFIT AUDIT\n');

  try {
    const moipinBenefitsResult = await db.query(`
      SELECT p.name, p.id, b.id as benefit_id, b.benefit_type, b.title, b.display_copy, b.is_active
      FROM dt_partners p
      LEFT JOIN dt_benefits b ON p.id = b.partner_id
      WHERE p.name = '모이핀'
      ORDER BY b.is_active DESC, b.created_at DESC
    `);

    if (moipinBenefitsResult.rows.length > 0) {
      console.log('모이핀 benefits in production:');
      moipinBenefitsResult.rows.forEach(row => {
        if (row.benefit_id) {
          console.log(`\n  Partner: ${row.name} (${row.id})`);
          console.log(`  Benefit ID: ${row.benefit_id}`);
          console.log(`  Type: ${row.benefit_type}`);
          console.log(`  Title: ${row.title}`);
          console.log(`  Display: "${row.display_copy}"`);
          console.log(`  Active: ${row.is_active}`);
        } else {
          console.log(`\n  Partner: ${row.name} (${row.id})`);
          console.log(`  (no benefits)`);
        }
      });
    }
  } catch (e) {
    console.error('Error querying moipin benefits:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\n3. EXISTING PLACE EXAMPLES (for reference: structure and values)\n');

  try {
    const exampleResult = await db.query(`
      SELECT
        code, name_ko, name_en, avg_stay_minutes, emotion_primary, emotion_tags,
        indoor_outdoor, access_by_car, accessibility_wheelchair, accessibility_stroller,
        suitable_for, weather_suitable, live_status
      FROM travel_places
      WHERE city_code = 'YEOSU'
      LIMIT 3
    `);

    if (exampleResult.rows.length > 0) {
      console.log('Example places (for reference):');
      exampleResult.rows.forEach(p => {
        console.log(`\n  ${p.code}: ${p.name_ko}`);
        console.log(`    Stay: ${p.avg_stay_minutes} min`);
        console.log(`    Emotion: ${p.emotion_primary}, Tags: ${p.emotion_tags}`);
        console.log(`    Indoor: ${p.indoor_outdoor}`);
        console.log(`    Car access: ${p.access_by_car}`);
        console.log(`    Wheelchair: ${p.accessibility_wheelchair}`);
        console.log(`    Stroller: ${p.accessibility_stroller}`);
        console.log(`    Suitable: ${p.suitable_for}`);
        console.log(`    Weather: ${p.weather_suitable}`);
        console.log(`    Live status: ${p.live_status}`);
      });
    }
  } catch (e) {
    console.error('Error querying examples:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\n4. KNOWN/VERIFIED DATA FOR NEW PLACES\n');

  console.log('돌산공원 (Dolsan Park):');
  console.log('  Status: NEEDS VERIFICATION');
  console.log('  Questions:');
  console.log('    - Exact Korean name?');
  console.log('    - Where is it (lat/lng)?');
  console.log('    - How long to stay?');
  console.log('    - Emotion/tags?');
  console.log('    - Wheelchair/stroller accessible?');
  console.log('    - Indoor/outdoor?');
  console.log('    - Any data source/website?');

  console.log('\n더 포레스트랜드 (More Forest Land):');
  console.log('  Partner exists: YES (as cafe)');
  console.log('  Benefit exists: YES ("아메리카노 1인 무료")');
  console.log('  Status: NEEDS PLACE DATA');
  console.log('  Questions:');
  console.log('    - Exact location/address?');
  console.log('    - Coordinates (lat/lng)?');
  console.log('    - Average stay duration?');
  console.log('    - Hydrangea season: when?');
  console.log('    - Open year-round?');
  console.log('    - Accessibility details?');

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\nCRITICAL FINDINGS\n');

  console.log('⚠️  MOIPIN BENEFIT MISMATCH:');
  console.log('  Previous contract: "10% 할인만"');
  console.log('  Current production: Check audit results above');
  console.log('  ACTION: Verify which is correct before deploying\n');

  console.log('⚠️  MISSING VERIFIED DATA:');
  console.log('  - 돌산공원: No schema data found in system');
  console.log('  - 더 포레스트랜드: Exists as partner/cafe, data as place TBD\n');

  console.log('⚠️  REQUIRED BEFORE INSERT:');
  console.log('  - Schema check: Which fields are REQUIRED vs nullable?');
  console.log('  - 돌산공원: Gather/verify all fields from source');
  console.log('  - 더 포레스트랜드: Get coordinates, stay duration, accessibility\n');

  process.exit(0);
}

auditSchema().catch(e => {
  console.error('Audit error:', e);
  process.exit(1);
});
