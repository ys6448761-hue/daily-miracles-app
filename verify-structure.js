// Verify travel_places structure before implementation
const db = require('./database/db');

async function verify() {
  try {
    console.log('\n=== TRAVEL PLACES STRUCTURE ===\n');

    const result = await db.query(
      `SELECT code, zone_code, name_ko
       FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'
       ORDER BY code
       LIMIT 5`
    );

    console.log('Sample records (code vs zone_code):');
    result.rows.forEach(row => {
      console.log(`  code: '${row.code}', zone_code: '${row.zone_code}', name: ${row.name_ko}`);
    });

    console.log('\n=== ORIGIN MAPPING VERIFICATION ===\n');

    const allCodes = await db.query(
      `SELECT code, zone_code FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'
       ORDER BY code`
    );

    console.log('All place codes:');
    allCodes.rows.forEach(row => {
      console.log(`  ${row.code} (zone: ${row.zone_code})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verify();
