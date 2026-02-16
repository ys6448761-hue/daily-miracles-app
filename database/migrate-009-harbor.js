/**
 * migrate-009-harbor.js
 * 소원항해단 v3.1-MVP 스키마 마이그레이션
 *
 * 실행: node database/migrate-009-harbor.js
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
    console.log('📦 Migration 009: Harbor (소원항해단 v3.1-MVP)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 Time: ${new Date().toISOString()}`);

    await client.connect();
    console.log('✅ Connected to database');

    const sqlPath = path.join(__dirname, 'migrations', '009_harbor_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📄 Loaded: ${sqlPath}`);

    // 기존 테이블 확인
    const existing = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users_anon'
    `);

    if (existing.rows.length > 0 && !process.argv.includes('--force')) {
      console.log('⚠️  users_anon already exists. Use --force to re-run.');
    }

    await client.query(sql);
    console.log('✅ Migration completed');

    // 테이블 목록 확인
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users_anon', 'harbor_wishes', 'harbor_reactions',
                           'harbor_comments', 'harbor_notifications', 'harbor_reports',
                           'temperature_logs', 'first_wind_logs')
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
        AND typname IN ('visibility_type', 'traffic_light_type', 'wish_status_type',
                        'reaction_type_enum', 'wind_type_enum')
    `);

    console.log('');
    console.log('📋 Created ENUM types:');
    enums.rows.forEach(e => {
      console.log(`   ✓ ${e.typname}`);
    });

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('');
    console.log('🔌 Disconnected');
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

runMigration();
