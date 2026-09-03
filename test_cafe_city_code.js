/**
 * Debug: Check city_code values in dt_partners
 */

require('dotenv').config();
const db = require('./database/db');

async function debugCityCode() {
  console.log('DEBUG: City Code Values\n');

  try {
    const cafesResult = await db.query(`
      SELECT DISTINCT city_code, COUNT(*) as count
      FROM dt_partners
      WHERE category IN ('cafe', 'beverage', 'coffee')
      GROUP BY city_code
    `);

    console.log('City codes in cafe partners:');
    cafesResult.rows.forEach(row => {
      console.log(`  "${row.city_code}" (${row.count} cafes)`);
    });

    // Now try with the actual city code
    if (cafesResult.rows.length > 0) {
      const actualCityCode = cafesResult.rows[0].city_code;
      console.log(`\nTrying benefits query with city_code="${actualCityCode}":\n`);

      const benefitsResult = await db.query(`
        SELECT b.partner_id, p.name, p.city_code, b.title, b.display_copy, b.is_active
        FROM dt_benefits b
        JOIN dt_partners p ON b.partner_id = p.id
        WHERE p.city_code = $1
        AND p.category IN ('cafe', 'beverage', 'coffee')
        AND b.is_active = true
        ORDER BY p.name, b.created_at DESC
      `, [actualCityCode]);

      console.log('Benefits found:');
      benefitsResult.rows.forEach(row => {
        console.log(`  ${row.name}: ${row.title}`);
      });
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  process.exit(0);
}

debugCityCode();
