const { Client } = require('pg');

async function checkDB() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Render Database\n');

    // List all tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Existing Tables:');
    if (result.rows.length === 0) {
      console.log('  (empty database)\n');
    } else {
      result.rows.forEach((row) => {
        console.log('  - ' + row.table_name);
      });
      console.log('');
    }

    // Check for star_zones
    const hasStarZones = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'star_zones'
      )
    `);

    if (hasStarZones.rows[0].exists) {
      console.log('✅ star_zones exists - FK reference available\n');
      return true;
    } else {
      console.log('❌ star_zones NOT FOUND - FK constraint will fail\n');
      console.log('⚠️  SOLUTION: Remove FK constraint from travel_places migration');
      console.log('   OR: Run base schema migrations (Aurora5) first\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

checkDB().then((success) => {
  process.exit(success ? 0 : 1);
});
