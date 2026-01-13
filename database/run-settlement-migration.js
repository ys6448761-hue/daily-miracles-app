/**
 * P2-2 정산서 필드 마이그레이션 실행
 *
 * 사용법:
 *   node database/run-settlement-migration.js
 *
 * 환경변수:
 *   DATABASE_URL: PostgreSQL 연결 문자열
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('P2-2 정산서 필드 마이그레이션 시작');
  console.log('═══════════════════════════════════════════════════════════');

  // DATABASE_URL 확인
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  // 마이그레이션 SQL 로드
  const sqlPath = path.join(__dirname, 'migrations', 'add_settlement_pdf_fields.sql');
  let sql;
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`✅ SQL 파일 로드: ${sqlPath}`);
  } catch (err) {
    console.error('❌ SQL 파일 로드 실패:', err.message);
    process.exit(1);
  }

  // DB 연결
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // SQL 실행
    console.log('\n📌 마이그레이션 실행 중...');
    await pool.query(sql);
    console.log('\n✅ 마이그레이션 성공!\n');

    // 결과 확인
    const checkResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'quotes'
        AND column_name IN (
          'settlement_pdf_generated',
          'settlement_pdf_url',
          'commission_rate',
          'settlement_amount',
          'settlement_due_at',
          'agency_name',
          'agency_contact',
          'settlement_notes'
        )
      ORDER BY column_name
    `);

    console.log('추가된 컬럼:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'null'})`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('P2-2 마이그레이션 완료!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
