/**
 * Debug: Cafe benefits query
 */

require('dotenv').config();
const db = require('./database/db');

async function debugCafeBenefits() {
  console.log('DEBUG: Cafe Benefits Query\n');

  try {
    const result = await db.query(`
      SELECT b.partner_id, p.name, b.title, b.display_copy, b.is_active
      FROM dt_benefits b
      JOIN dt_partners p ON b.partner_id = p.id
      WHERE p.city_code = $1
      AND p.category IN ('cafe', 'beverage', 'coffee')
      AND b.is_active = true
      ORDER BY p.name, b.created_at DESC
    `, ['YEOSU']);

    console.log('Results:');
    result.rows.forEach(row => {
      console.log(`  Partner: ${row.name} (${row.partner_id})`);
      console.log(`  Title: ${row.title}`);
      console.log(`  Display: "${row.display_copy}"`);
      console.log(`  Active: ${row.is_active}\n`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }

  process.exit(0);
}

debugCafeBenefits();
