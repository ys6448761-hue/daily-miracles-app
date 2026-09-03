// Data Truth Reconciliation Queries
const db = require('./database/db');

async function runAudit() {
  try {
    console.log('\n=== LIVE STATUS CHECK ===\n');

    // Query 1: Row count
    const countResult = await db.query('SELECT COUNT(*) as count FROM travel_live_status');
    console.log('1. Total travel_live_status rows:', countResult.rows[0].count);

    // Query 2: Status breakdown
    const statusBreakdown = await db.query(
      'SELECT status, COUNT(*) as count FROM travel_live_status GROUP BY status ORDER BY status'
    );
    console.log('\n2. Status breakdown:');
    statusBreakdown.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    // Query 3: All rows
    const allRows = await db.query(
      `SELECT place_code, status, manually_updated_at, automated_data_source
       FROM travel_live_status
       ORDER BY place_code`
    );
    console.log(`\n3. All travel_live_status rows (${allRows.rowCount}):`);
    allRows.rows.forEach(row => {
      console.log(`   ${row.place_code}: ${row.status} (manual: ${row.manually_updated_at}, source: ${row.automated_data_source})`);
    });

    console.log('\n=== OPENING HOURS CHECK ===\n');

    // Query 4: Opening hours completeness
    const hoursResult = await db.query(
      `SELECT
        COUNT(*) as total,
        COUNT(opening_hours_json) as populated,
        SUM(CASE WHEN opening_hours_json IS NULL THEN 1 ELSE 0 END) as null_count
       FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'`
    );
    const hoursRow = hoursResult.rows[0];
    console.log(`Opening hours: ${hoursRow.populated}/${hoursRow.total} populated (${hoursRow.null_count} NULL)`);

    // Query 5: Sample opening hours
    const sampleHours = await db.query(
      `SELECT code, opening_hours_json
       FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'
       LIMIT 3`
    );
    console.log('\nSample opening_hours_json:');
    sampleHours.rows.forEach(row => {
      console.log(`   ${row.code}: ${JSON.stringify(row.opening_hours_json)}`);
    });

    console.log('\n=== ACCESSIBILITY SCHEMA DEFAULTS ===\n');

    // Query 6: Accessibility field values
    const accessResult = await db.query(
      `SELECT
        code,
        access_by_car,
        access_by_bus,
        accessibility_wheelchair,
        accessibility_stroller
       FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'
       ORDER BY code`
    );
    console.log('All 12 places accessibility:');
    accessResult.rows.forEach(row => {
      console.log(`   ${row.code}: car=${row.access_by_car}, bus=${row.access_by_bus}, wheel=${row.accessibility_wheelchair}, stroller=${row.accessibility_stroller}`);
    });

    console.log('\n=== TRAVEL GUIDE SESSIONS ===\n');

    // Query 7: Sessions count
    const sessionsResult = await db.query(
      `SELECT COUNT(*) as count FROM travel_guide_sessions`
    );
    console.log(`Sessions table rows: ${sessionsResult.rows[0].count}`);

    // Query 8: Events count
    const eventsResult = await db.query(
      `SELECT COUNT(*) as count FROM travel_guide_events`
    );
    console.log(`Events table rows: ${eventsResult.rows[0].count}`);

    console.log('\n✅ Audit queries complete\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Audit error:', error.message);
    process.exit(1);
  }
}

runAudit();
