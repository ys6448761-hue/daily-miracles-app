/**
 * migrate-006-daily-checks.js
 * 일일 체크(출석/실행/기록) 테이블 마이그레이션 실행 스크립트
 *
 * 실행 방법:
 * - CLI: node database/migrate-006-daily-checks.js
 * - 환경변수: DATABASE_URL 또는 개별 DB_* 변수 필요
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6 - Gap 해소
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
    console.log('📦 Migration 006: Daily Checks Table');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 Time: ${new Date().toISOString()}`);
    console.log('');

    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to database');

    // 마이그레이션 파일 읽기
    const sqlPath = path.join(__dirname, 'migrations', '006_daily_checks_table.sql');

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
      AND table_name = 'daily_checks'
    `);

    if (existingTables.rows.length > 0) {
      console.log('⚠️  daily_checks table already exists');

      // --force 플래그가 없으면 중단
      if (!process.argv.includes('--force')) {
        console.log('💡 Use --force flag to run migration anyway (will skip existing objects)');
        console.log('   Example: node database/migrate-006-daily-checks.js --force');
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
      AND table_name = 'daily_checks'
    `);

    if (tablesResult.rows.length > 0) {
      console.log('✅ daily_checks table created/verified');
    } else {
      console.log('❌ daily_checks table not found!');
    }

    // 인덱스 확인
    console.log('\n📑 Indexes created:');
    const indexResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'daily_checks'
      ORDER BY indexname
    `);

    indexResult.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    // 뷰 확인
    console.log('\n📊 Views created:');
    const viewResult = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
      AND viewname = 'v_attendance_streak'
    `);

    if (viewResult.rows.length > 0) {
      console.log('   - v_attendance_streak');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration 006 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');
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
