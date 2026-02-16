/**
 * Migration 011: MICE 결과보고 패키지 테이블
 *
 * 실행: node database/migrate-011-mice-report.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const { getConnectionConfig } = require('./dbConfig');
const pool = new Pool(getConnectionConfig());

async function migrate() {
  console.log('🚀 Migration 011: MICE 결과보고 패키지 테이블 시작...\n');

  const sqlPath = path.join(__dirname, 'migrations', '011_mice_report_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // SQL 실행
    await client.query(sql);

    await client.query('COMMIT');
    console.log('✅ Migration 011 완료!\n');

    // 테이블 확인
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'ops_mice_%'
      ORDER BY table_name
    `);

    console.log('📋 생성된 MICE 테이블:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // ENUM 확인
    const enums = await client.query(`
      SELECT typname
      FROM pg_type
      WHERE typname LIKE 'mice_%'
      ORDER BY typname
    `);

    console.log('\n📋 생성된 ENUM 타입:');
    enums.rows.forEach(row => {
      console.log(`   - ${row.typname}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 실패:', error.message);

    // 이미 존재하는 타입인 경우
    if (error.message.includes('already exists')) {
      console.log('\n⚠️ 일부 타입이 이미 존재합니다. 개별 실행을 시도합니다...');
    }

    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
