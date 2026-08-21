/**
 * DB Identity Diagnostic
 * Safely checks which database migrations and API are using
 * Shows: database name, schema, user, search_path, table existence
 * Hides: password, host, full DATABASE_URL
 *
 * Usage: node scripts/check-db-identity.js
 */

const { Client } = require('pg');

async function checkDBIdentity() {
  const { getConnectionConfig } = require('../database/dbConfig');
  const config = getConnectionConfig();

  // Add SSL if needed
  if (config.connectionString) {
    config.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(config);

  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 DB Identity Diagnostic (Safe Output)');
    console.log('═══════════════════════════════════════════════════════\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Get DB identity
    console.log('📊 Database Identity:');
    console.log('───────────────────────────────────────────────────────');
    const identity = await client.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        current_user AS db_user
    `);
    const db = identity.rows[0];
    console.log(`Database Name: ${db.database_name}`);
    console.log(`Schema:        ${db.schema_name}`);
    console.log(`User:          ${db.db_user}`);

    // 2. Get search_path
    const searchPath = await client.query('SHOW search_path');
    console.log(`Search Path:   ${searchPath.rows[0].search_path}\n`);

    // 3. Check Travel Guide tables
    console.log('📋 Travel Guide Tables:');
    console.log('───────────────────────────────────────────────────────');

    const tables = [
      'travel_places',
      'travel_restaurants',
      'travel_live_status',
      'travel_guide_sessions',
      'travel_guide_events'
    ];

    const tableResults = {};
    for (const tableName of tables) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count FROM ${tableName}
        `);
        const count = parseInt(result.rows[0]?.count || 0, 10);
        tableResults[tableName] = count;
        console.log(`✅ ${tableName.padEnd(30)} : ${count} rows`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          tableResults[tableName] = 'NOT_FOUND';
          console.log(`❌ ${tableName.padEnd(30)} : TABLE NOT FOUND`);
        } else {
          tableResults[tableName] = 'ERROR';
          console.log(`⚠️  ${tableName.padEnd(30)} : ${error.message}`);
        }
      }
    }

    // 4. Summary
    console.log('\n📈 Summary:');
    console.log('───────────────────────────────────────────────────────');

    const foundCount = Object.values(tableResults).filter(v => typeof v === 'number').length;
    const totalTables = tables.length;

    if (foundCount === totalTables) {
      console.log(`✅ All ${totalTables} Travel Guide tables exist`);
    } else if (foundCount > 0) {
      console.log(`⚠️  ${foundCount}/${totalTables} Travel Guide tables exist`);
      console.log('   Missing tables:');
      tables.forEach(t => {
        if (tableResults[t] === 'NOT_FOUND') {
          console.log(`   - ${t}`);
        }
      });
    } else {
      console.log(`❌ No Travel Guide tables found`);
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. DATABASE_URL is set in Render dashboard');
    console.error('2. PostgreSQL is accessible');
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected\n');
  }
}

checkDBIdentity();
