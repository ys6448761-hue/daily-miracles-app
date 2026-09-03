// Phase 2A READ-ONLY Audit
// No modifications, only investigation

const db = require('./database/db');

async function runAudit() {
  try {
    console.log('\n=== PHASE 2A — MOBILITY DATA AUDIT ===\n');

    // STEP 1: Check if Ramada/Expo exist as places
    console.log('STEP 1: Origin location audit\n');

    const allPlaces = await db.query(
      `SELECT code, name_ko, name_en, lat, lng
       FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'
       ORDER BY code`
    );

    const ramadaMatch = allPlaces.rows.find(p =>
      p.name_ko.includes('라마다') || p.name_ko.includes('Ramada') ||
      p.name_en?.includes('Ramada')
    );
    const expoMatch = allPlaces.rows.find(p =>
      p.name_ko.includes('엑스포') || p.name_en?.includes('Expo')
    );

    console.log(`Ramada Plaza in travel_places: ${ramadaMatch ? 'YES - ' + ramadaMatch.code : 'NO'}`);
    console.log(`Yeosu Expo in travel_places: ${expoMatch ? 'YES - ' + expoMatch.code : 'NO'}`);
    console.log(`Total travel_places (Yeosu): ${allPlaces.rowCount}`);

    // STEP 2: Core 12 places verification
    console.log('\n\nSTEP 2: Core 12 place truth\n');

    const corePlaces = await db.query(
      `SELECT
         id,
         code,
         name_ko,
         lat,
         lng,
         avg_stay_minutes,
         access_by_car,
         bus_accessible_status,
         accessibility_wheelchair_status,
         accessibility_stroller_status,
         zone_code
       FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'
       ORDER BY code`
    );

    console.log(`Core places found: ${corePlaces.rowCount}`);
    console.log('\nPlace records:');
    corePlaces.rows.forEach(p => {
      console.log(`  ${p.code.padEnd(20)} | ${p.name_ko.padEnd(15)} | stay=${p.avg_stay_minutes}min | wheel=${p.accessibility_wheelchair_status} | bus=${p.bus_accessible_status}`);
    });

    // STEP 3: Check existing travel time storage
    console.log('\n\nSTEP 3: Travel time storage audit\n');

    // Check if travel_time_estimates table exists
    const tables = await db.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema='public'
       AND table_name LIKE '%travel%'
       ORDER BY table_name`
    );

    console.log('Travel-related tables in schema:');
    tables.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

    // Check benefit_credentials structure (may have location data)
    const bcColumns = await db.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name='benefit_credentials'
       ORDER BY column_name`
    );

    console.log('\nbenefit_credentials columns (for reference):');
    bcColumns.rows.slice(0, 10).forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type}`);
    });

    // STEP 4: Bus data needs assessment
    console.log('\n\nSTEP 4: Bus data model assessment\n');

    const busStatus = await db.query(
      `SELECT bus_accessible_status, COUNT(*) as count
       FROM travel_places
       WHERE country_code='KR' AND city_code='YEOSU'
       GROUP BY bus_accessible_status`
    );

    console.log('Current bus_accessible_status distribution:');
    busStatus.rows.forEach(row => {
      console.log(`  ${row.bus_accessible_status || 'NULL'}: ${row.count}`);
    });

    // STEP 5: Check if matrix-like structures exist
    console.log('\n\nSTEP 5: Existing structured data for routing\n');

    // Check if any travel time estimates are stored
    const travelEstimates = await db.query(
      `SELECT *
       FROM information_schema.tables
       WHERE table_name IN ('travel_time_estimates', 'travel_routes', 'travel_matrix', 'route_times')
       AND table_schema='public'`
    );

    console.log(`Travel time matrix tables: ${travelEstimates.rowCount > 0 ? 'EXISTS' : 'NONE FOUND'}`);

    // Check if sessionService stores location data
    const sessionCols = await db.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name='travel_guide_sessions'`
    );

    console.log('\ntravel_guide_sessions columns:');
    sessionCols.rows.forEach(c => console.log(`  - ${c.column_name}`));

    // STEP 6: Verify Phase 1 UNKNOWN semantics are preserved
    console.log('\n\nSTEP 6: Phase 1 UNKNOWN semantics verification\n');

    const unknownCount = await db.query(
      `SELECT status, COUNT(*) as count
       FROM travel_live_status
       WHERE country_code='KR' AND city_code='YEOSU'
       GROUP BY status`
    );

    console.log('travel_live_status distribution:');
    unknownCount.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    const accessStatusCount = await db.query(
      `SELECT
         bus_accessible_status,
         COUNT(*) as count
       FROM travel_places
       WHERE country_code='KR' AND city_code='YEOSU'
       GROUP BY bus_accessible_status`
    );

    console.log('\nbus_accessible_status distribution:');
    accessStatusCount.rows.forEach(row => {
      console.log(`  ${row.bus_accessible_status}: ${row.count}`);
    });

    console.log('\n=== AUDIT COMPLETE ===\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Audit error:', error.message);
    process.exit(1);
  }
}

runAudit();
