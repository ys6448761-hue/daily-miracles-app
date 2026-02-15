/**
 * migrate-010-yeosu-ops.js
 * 여수여행센터 운영 컨트롤타워 OS v0 스키마 마이그레이션
 *
 * 실행: node database/migrate-010-yeosu-ops.js
 * 강제: node database/migrate-010-yeosu-ops.js --force
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const { getConnectionConfig } = require('./dbConfig');
  const client = new Client(getConnectionConfig());

  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📦 Migration 010: Yeosu Ops Center (운영 컨트롤타워 OS v0)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 Time: ${new Date().toISOString()}`);

    await client.connect();
    console.log('✅ Connected to database');

    const sqlPath = path.join(__dirname, 'migrations', '010_yeosu_ops_center.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📄 Loaded: ${sqlPath}`);

    // 기존 테이블 확인
    const existing = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'ops_events'
    `);

    if (existing.rows.length > 0 && !process.argv.includes('--force')) {
      console.log('⚠️  ops_events already exists. Use --force to re-run.');
    }

    await client.query(sql);
    console.log('✅ Migration completed');

    // 테이블 목록 확인
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'ops_%'
      ORDER BY table_name
    `);

    console.log('');
    console.log('📋 Created tables:');
    tables.rows.forEach(t => {
      console.log(`   ✓ ${t.table_name}`);
    });

    // ENUM 타입 확인
    const enums = await client.query(`
      SELECT typname FROM pg_type
      WHERE typtype = 'e'
        AND typname LIKE 'ops_%'
      ORDER BY typname
    `);

    console.log('');
    console.log('📋 Created ENUM types:');
    enums.rows.forEach(e => {
      console.log(`   ✓ ${e.typname}`);
    });

    // 인덱스 개수 확인
    const indexes = await client.query(`
      SELECT COUNT(*) as count FROM pg_indexes
      WHERE indexname LIKE 'idx_ops_%'
    `);
    console.log('');
    console.log(`📋 Created indexes: ${indexes.rows[0].count}`);

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('');
    console.log('🔌 Disconnected');
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

runMigration();
