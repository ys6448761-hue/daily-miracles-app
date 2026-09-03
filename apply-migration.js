// Apply migration 206: accessibility_status columns
const db = require('./database/db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const migrationFile = path.join(__dirname, 'database/migrations/206_accessibility_status.sql');

  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('\n=== APPLYING MIGRATION 206 ===\n');
    console.log('Migration file:', migrationFile);

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
      console.log(`\nExecuting:\n${statement.substring(0, 100)}...`);
      await db.query(statement);
    }

    console.log('\n✅ Migration 206 applied successfully\n');

    // Verify
    const result = await db.query(
      `SELECT column_name, data_type, column_default
       FROM information_schema.columns
       WHERE table_name = 'travel_places'
       AND column_name LIKE '%status'
       ORDER BY column_name`
    );

    console.log('New columns created:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}, default: ${row.column_default})`);
    });

    // Verify data
    const dataResult = await db.query(
      `SELECT DISTINCT
        accessibility_wheelchair_status,
        accessibility_stroller_status,
        bus_accessible_status
       FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'`
    );

    console.log('\nData verification:');
    console.log(`  Distinct status combinations: ${dataResult.rowCount}`);
    dataResult.rows.forEach(row => {
      console.log(`    wheelchair: ${row.accessibility_wheelchair_status}, stroller: ${row.accessibility_stroller_status}, bus: ${row.bus_accessible_status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
