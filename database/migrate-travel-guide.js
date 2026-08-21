/**
 * Travel Guide Migration Runner
 * Executes Phase 1 migrations and seeds
 * Usage: node database/migrate-travel-guide.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runTravelGuideMigration() {
  const { getConnectionConfig } = require('./dbConfig');
  const config = getConnectionConfig();
  // Add SSL for Render PostgreSQL
  if (config.connectionString) {
    config.ssl = { rejectUnauthorized: false };
  }
  const client = new Client(config);

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get DB identity
    const identity = await client.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        current_user AS db_user
    `);
    const db = identity.rows[0];

    const searchPathResult = await client.query('SHOW search_path');
    const dbSearchPath = searchPathResult.rows[0].search_path;

    console.log('📊 Database Identity:');
    console.log(`   Database: ${db.database_name}`);
    console.log(`   Schema: ${db.schema_name}`);
    console.log(`   User: ${db.db_user}`);
    console.log(`   Search Path: ${dbSearchPath}\n`);

    // Migration files (in order)
    const migrations = [
      '200_travel_places.sql',
      '201_travel_restaurants.sql',
      '202_travel_live_status.sql',
      '203_travel_guide_sessions.sql',
      '204_travel_guide_events.sql',
    ];

    console.log('📝 Running Travel Guide Migrations...\n');

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'migrations', migration);

      if (!fs.existsSync(migrationPath)) {
        console.warn(`⚠️  Skipped (not found): ${migration}`);
        continue;
      }

      console.log(`▶️  Running: ${migration}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      try {
        await client.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (error) {
        // Ignore "already exists" errors (idempotent)
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key')
        ) {
          console.log(`   ⚠️  Already exists (skipped)\n`);
        } else {
          throw error;
        }
      }
    }

    // Seed files (in order)
    const seeds = [
      '001_travel_places.sql',
      '002_travel_live_status.sql',
      '003_travel_restaurants.sql',
    ];

    console.log('\n📦 Running Travel Guide Seeds...\n');

    for (const seed of seeds) {
      const seedPath = path.join(__dirname, 'seeds', seed);

      if (!fs.existsSync(seedPath)) {
        console.warn(`⚠️  Skipped (not found): ${seed}`);
        continue;
      }

      console.log(`▶️  Running: ${seed}`);
      const sql = fs.readFileSync(seedPath, 'utf8');

      try {
        await client.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (error) {
        // Ignore duplicate key errors (idempotent)
        if (error.message.includes('duplicate key')) {
          console.log(`   ⚠️  Already exists (skipped)\n`);
        } else {
          throw error;
        }
      }
    }

    // Verify results
    console.log('\n🔍 Verifying Travel Guide Data...\n');

    const queries = [
      {
        name: 'travel_places',
        sql: `SELECT COUNT(*) as count FROM travel_places WHERE country_code = 'KR' AND city_code = 'YEOSU'`,
      },
      {
        name: 'travel_restaurants',
        sql: `SELECT COUNT(*) as count FROM travel_restaurants WHERE country_code = 'KR' AND city_code = 'YEOSU'`,
      },
      {
        name: 'travel_live_status',
        sql: `SELECT COUNT(*) as count FROM travel_live_status WHERE country_code = 'KR' AND city_code = 'YEOSU'`,
      },
      {
        name: 'travel_guide_sessions',
        sql: `SELECT COUNT(*) as count FROM travel_guide_sessions`,
      },
      {
        name: 'travel_guide_events',
        sql: `SELECT COUNT(*) as count FROM travel_guide_events`,
      },
    ];

    const results = {};
    for (const query of queries) {
      try {
        const result = await client.query(query.sql);
        const count = parseInt(result.rows[0]?.count || 0, 10);
        results[query.name] = count;
        console.log(`   ${query.name}: ${count} records`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ${query.name}: TABLE NOT FOUND`);
          results[query.name] = 'NOT_FOUND';
        } else {
          throw error;
        }
      }
    }

    // Detailed place info
    console.log('\n📍 Travel Places Detail (YEOSU):\n');
    const placesDetail = await client.query(
      `SELECT code, name_ko, zone_code, trust_level FROM travel_places WHERE country_code = 'KR' AND city_code = 'YEOSU' ORDER BY code`
    );
    placesDetail.rows.forEach((row) => {
      console.log(
        `   - ${row.code} (${row.name_ko}) [zone: ${row.zone_code}, trust: ${row.trust_level}]`
      );
    });

    // Live status summary
    console.log('\n🔄 Travel Live Status Summary:\n');
    const liveStatusSummary = await client.query(
      `SELECT status, COUNT(*) as count FROM travel_live_status WHERE country_code = 'KR' AND city_code = 'YEOSU' GROUP BY status`
    );
    liveStatusSummary.rows.forEach((row) => {
      console.log(`   ${row.status}: ${row.count} places`);
    });

    // Deduplication report
    console.log('\n📊 Deduplication Report:\n');
    const dedup = await client.query(
      `SELECT origin_seed_id, COUNT(*) as count FROM travel_places WHERE country_code = 'KR' AND city_code = 'YEOSU' AND origin_seed_id IS NOT NULL GROUP BY origin_seed_id`
    );
    if (dedup.rows.length > 0) {
      console.log('   ORIGIN Places (deduplicated with star_zones):');
      dedup.rows.forEach((row) => {
        console.log(`     - ${row.origin_seed_id}: unified`);
      });
    } else {
      console.log('   (No ORIGIN deduplications)');
    }

    console.log('\n✅ Travel Guide Migration & Seed Complete!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('📈 Migration Results:');
    console.log(`   travel_places: ${results.travel_places} records`);
    console.log(`   travel_restaurants: ${results.travel_restaurants} records`);
    console.log(`   travel_live_status: ${results.travel_live_status} records`);
    console.log(`   travel_guide_sessions: ${results.travel_guide_sessions} records`);
    console.log(`   travel_guide_events: ${results.travel_guide_events} records`);
    console.log('═══════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Travel Guide Migration Failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database\n');
  }
}

runTravelGuideMigration();
