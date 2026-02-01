/**
 * migrate-005-points.js
 * 포인트/추천/예고편 시스템 마이그레이션 실행 스크립트
 *
 * 실행 방법:
 * - CLI: node database/migrate-005-points.js
 * - 환경변수: DATABASE_URL 또는 개별 DB_* 변수 필요
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // 환경변수 또는 기본값에서 DB 연결 정보 가져오기
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
    console.log('📦 Migration 005: Points/Referral/Preview System');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 Time: ${new Date().toISOString()}`);
    console.log('');

    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to database');

    // 마이그레이션 파일 읽기
    const sqlPath = path.join(__dirname, 'migrations', '005_points_referral_schema.sql');

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration file not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📄 Loaded migration file: ${sqlPath}`);
    console.log(`   File size: ${sql.length} bytes`);

    // 기존 테이블 확인 (중복 실행 방지)
    console.log('\n🔍 Checking existing tables...');
    const existingTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('point_ledger', 'referral', 'preview_redemption', 'feature_flags')
    `);

    if (existingTables.rows.length > 0) {
      console.log('⚠️  Some tables already exist:');
      existingTables.rows.forEach(row => console.log(`   - ${row.table_name}`));
      console.log('');

      // --force 플래그가 없으면 중단
      if (!process.argv.includes('--force')) {
        console.log('💡 Use --force flag to run migration anyway (will skip existing objects)');
        console.log('   Example: node database/migrate-005-points.js --force');
        process.exit(0);
      }
      console.log('⚠️  --force flag detected, proceeding with migration...');
    }

    // 마이그레이션 실행
    console.log('\n📝 Running migration...');
    const startTime = Date.now();

    await client.query(sql);

    const duration = Date.now() - startTime;
    console.log(`✅ Migration completed in ${duration}ms`);

    // 생성된 테이블 확인
    console.log('\n🔍 Verifying created tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'point_ledger', 'point_daily_cap',
        'preview_redemption', 'preview_weekly_quota',
        'referral', 'referral_monthly_quota',
        'admin_hold_queue', 'feature_flags'
      )
      ORDER BY table_name;
    `);

    console.log(`\n📊 Tables created/verified (${tablesResult.rows.length}/8):`);
    const expectedTables = [
      'admin_hold_queue', 'feature_flags', 'point_daily_cap', 'point_ledger',
      'preview_redemption', 'preview_weekly_quota', 'referral', 'referral_monthly_quota'
    ];
    expectedTables.forEach(table => {
      const exists = tablesResult.rows.some(r => r.table_name === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });

    // Feature flags 확인
    console.log('\n🚩 Feature flags status:');
    const flagsResult = await client.query(`
      SELECT flag_key, is_enabled, description
      FROM feature_flags
      ORDER BY flag_key
    `);

    flagsResult.rows.forEach(row => {
      console.log(`   ${row.is_enabled ? '🟢' : '🔴'} ${row.flag_key}: ${row.is_enabled ? 'ON' : 'OFF'}`);
    });

    // 인덱스 확인
    console.log('\n📑 Indexes created:');
    const indexResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      AND tablename IN (
        'point_ledger', 'point_daily_cap',
        'preview_redemption', 'preview_weekly_quota',
        'referral', 'referral_monthly_quota',
        'admin_hold_queue'
      )
      ORDER BY tablename, indexname
    `);

    indexResult.rows.forEach(row => {
      console.log(`   - ${row.indexname} (${row.tablename})`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration 005 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Enable feature flags via Admin API:');
    console.log('      PUT /api/admin/feature-flags/points_enabled');
    console.log('   2. Register batch jobs (cron/GitHub Actions)');
    console.log('   3. Run smoke tests');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('💥 Migration failed!');
    console.error('Error:', error.message);

    if (error.message.includes('already exists')) {
      console.error('');
      console.error('💡 Hint: Some objects already exist. Use --force to skip existing objects.');
    }

    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

runMigration();
