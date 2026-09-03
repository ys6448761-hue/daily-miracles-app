/**
 * Audit: Current places and benefits data
 * P0-1: Check 자산공원, 돌산공원 status
 * P0-2: Check cafe partners and benefits
 * P0-2-Add: Check 더 포레스트 랜드 status
 */

require('dotenv').config();
const db = require('./database/db');

async function auditData() {
  console.log('AUDIT: Places and Benefits Data\n');
  console.log('═'.repeat(100) + '\n');

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('P0-1: PLACES IN YEOSU (focused on parks/dolsan area)\n');

  try {
    const placesResult = await db.query(`
      SELECT code, name_ko, name_en, emotion_primary, emotion_tags, suitable_for
      FROM travel_places
      WHERE country_code = 'KR' AND city_code = 'YEOSU'
      AND (name_ko LIKE '%공원%' OR name_ko LIKE '%돌산%' OR name_ko LIKE '%포레스트%' OR code LIKE '%park%' OR code LIKE '%jasan%' OR code LIKE '%dolsan%' OR code LIKE '%forest%')
      ORDER BY code
    `);

    if (placesResult.rows.length > 0) {
      console.log('Matching places:');
      placesResult.rows.forEach(p => {
        console.log(`  ${p.code}: ${p.name_ko}`);
        console.log(`    Emotion: ${p.emotion_primary}, Tags: ${p.emotion_tags}`);
        console.log(`    Suitable: ${p.suitable_for}`);
      });
    } else {
      console.log('No matching places found');
    }
  } catch (e) {
    console.error('Error querying places:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\nALL PLACES IN YEOSU (complete list)\n');

  try {
    const allResult = await db.query(`
      SELECT code, name_ko, name_en, avg_stay_minutes
      FROM travel_places
      WHERE country_code = 'KR' AND city_code = 'YEOSU'
      ORDER BY code
    `);

    if (allResult.rows.length > 0) {
      console.log(`Total places: ${allResult.rows.length}\n`);
      allResult.rows.forEach(p => {
        console.log(`  ${p.code.padEnd(20)} | ${p.name_ko.padEnd(25)} | ${p.name_en} | ${p.avg_stay_minutes}min`);
      });
    }
  } catch (e) {
    console.error('Error querying all places:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\nP0-2: CAFE PARTNERS AND BENEFITS\n');

  try {
    const cafesResult = await db.query(`
      SELECT id, name, category, is_active
      FROM dt_partners
      WHERE LOWER(city_code) = 'yeosu'
      AND category IN ('cafe', 'beverage', 'coffee')
      ORDER BY name
    `);

    if (cafesResult.rows.length > 0) {
      console.log('Cafe partners:');
      cafesResult.rows.forEach(c => {
        console.log(`  ${c.id}: ${c.name} (${c.category}) - Active: ${c.is_active}`);
      });
    } else {
      console.log('No cafe partners found');
    }
  } catch (e) {
    console.error('Error querying cafes:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\nBENEFITS DATA FOR CAFES\n');

  try {
    const benefitsResult = await db.query(`
      SELECT p.name, b.benefit_type, b.title, b.display_copy, b.is_active
      FROM dt_benefits b
      JOIN dt_partners p ON b.partner_id = p.id
      WHERE p.city_code = 'yeosu'
      AND p.category IN ('cafe', 'beverage', 'coffee')
      ORDER BY p.name, b.title
    `);

    if (benefitsResult.rows.length > 0) {
      console.log('Cafe benefits:');
      benefitsResult.rows.forEach(b => {
        console.log(`  ${b.name}: ${b.title}`);
        console.log(`    Type: ${b.benefit_type}, Display: "${b.display_copy}"`);
        console.log(`    Active: ${b.is_active}`);
      });
    } else {
      console.log('No cafe benefits found');
    }
  } catch (e) {
    console.error('Error querying benefits:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\nALL BENEFITS (complete list for context)\n');

  try {
    const allBenefitsResult = await db.query(`
      SELECT p.name, b.benefit_type, b.title, b.display_copy, b.is_active
      FROM dt_benefits b
      JOIN dt_partners p ON b.partner_id = p.id
      WHERE p.city_code = 'yeosu'
      ORDER BY p.name, b.title
    `);

    if (allBenefitsResult.rows.length > 0) {
      console.log(`Total benefits: ${allBenefitsResult.rows.length}\n`);
      allBenefitsResult.rows.forEach(b => {
        console.log(`  ${b.name}: ${b.title}`);
        console.log(`    Display: "${b.display_copy}", Active: ${b.is_active}`);
      });
    }
  } catch (e) {
    console.error('Error querying all benefits:', e.message);
  }

  // ════════════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(100));
  console.log('\nAUDIT FINDINGS\n');

  console.log('P0-1: 자산공원 status:');
  console.log('  [ ] Check if 자산공원 (jaisan_park) exists');
  console.log('  [ ] Check if 돌산공원 (dolsan_park) exists');
  console.log('  [ ] Decision: Keep 자산공园 for seasonal, register 돌산공园 as primary\n');

  console.log('P0-2: Cafe benefits connection:');
  console.log('  [ ] Verify 카페하루 has benefit: "아메리카노 1잔 무료"');
  console.log('  [ ] Verify 모이핀 has benefit: "10% 할인"');
  console.log('  [ ] Add benefit lookup in CourseDisplay cafe block\n');

  console.log('P0-2-Add: 더 포레스트 랜드:');
  console.log('  [ ] Check if "더 포레스트 랜드" or similar exists');
  console.log('  [ ] Verify partner and benefit data');
  console.log('  [ ] Decision: Register or flag as missing\n');

  process.exit(0);
}

auditData().catch(e => {
  console.error('Audit error:', e);
  process.exit(1);
});
