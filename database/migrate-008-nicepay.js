/**
 * migrate-008-nicepay.js
 * 나이스페이 결제 테이블 마이그레이션
 *
 * 실행: node database/migrate-008-nicepay.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'yeosu_miracle_travel',
        user: process.env.DB_USER || 'yeosu_user',
        password: process.env.DB_PASSWORD || 'XEVFpHtXr7CsYZSYYmDhogjbXzo32hCR',
        ssl: { rejectUnauthorized: false }
      };

  const client = new Client(connectionConfig);

  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📦 Migration 008: NicePay Payments Table');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 Time: ${new Date().toISOString()}`);

    await client.connect();
    console.log('✅ Connected to database');

    const sqlPath = path.join(__dirname, 'migrations', '008_nicepay_payments.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📄 Loaded: ${sqlPath}`);

    // 기존 테이블 확인
    const existing = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'nicepay_payments'
    `);

    if (existing.rows.length > 0 && !process.argv.includes('--force')) {
      console.log('⚠️  nicepay_payments already exists. Use --force to re-run.');
      process.exit(0);
    }

    await client.query(sql);
    console.log('✅ Migration completed');

    // 테이블 확인
    const verify = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'nicepay_payments'
      ORDER BY ordinal_position
    `);
    console.log('');
    console.log('📋 Table schema:');
    verify.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected');
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

runMigration();
