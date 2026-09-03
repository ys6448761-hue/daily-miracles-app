/**
 * Database Connectivity Validation
 * Minimal check to verify Supabase connection
 */

require('dotenv').config();
const { Pool } = require('pg');

async function validateConnection() {
  console.log('PHASE 1A VALIDATION RECOVERY\n');
  console.log('DATABASE CONNECTIVITY CHECK\n');

  const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
      };

  console.log('Connection config:');
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`  Host: ${url.hostname}`);
    console.log(`  Port: ${url.port || 5432}`);
    console.log(`  Database: ${url.pathname?.slice(1) || 'N/A'}`);
    console.log(`  User: ${url.username || 'N/A'}`);
  } else {
    console.log(`  Host: ${process.env.DB_HOST || 'N/A'}`);
    console.log(`  Port: ${process.env.DB_PORT || 5432}`);
    console.log(`  Database: ${process.env.DB_NAME || 'N/A'}`);
    console.log(`  User: ${process.env.DB_USER || 'N/A'}`);
  }
  console.log('');

  const pool = new Pool({
    ...poolConfig,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('Attempting connection...');
    const result = await pool.query('SELECT 1 as connection_check');

    console.log('✅ DB_CONNECTED = YES\n');

    // Try to get place count
    try {
      console.log('READ CHECK — Fetching travel places...\n');

      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM travel_places
         WHERE country_code='KR' AND city_code='YEOSU'`
      );
      const placeCount = parseInt(countResult.rows[0].count);
      console.log(`Found ${placeCount} travel places in YEOSU\n`);

      if (placeCount > 0) {
        console.log('Place codes (first 20):');
        const placesResult = await pool.query(
          `SELECT code, name_ko FROM travel_places
           WHERE country_code='KR' AND city_code='YEOSU'
           ORDER BY code
           LIMIT 20`
        );

        placesResult.rows.forEach((row, i) => {
          console.log(`  ${i+1}. ${row.code} — ${row.name_ko}`);
        });
        console.log('');

        console.log('READ_CHECK = SUCCESS');
      }
    } catch (readError) {
      console.error('Read error:', readError.message);
      console.log('READ_CHECK = FAILED');
    }

  } catch (error) {
    console.log('❌ DB_CONNECTED = NO\n');
    console.log('Connection Error:');
    console.log(`  Code: ${error.code}`);
    console.log(`  Message: ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      console.log('\nDiagnosis: Connection refused');
      console.log('Possible causes:');
      console.log('  - Database server not running');
      console.log('  - Hostname/port incorrect');
      console.log('  - Network access blocked');
      console.log('  - Firewall/security group restrictions');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

validateConnection().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
