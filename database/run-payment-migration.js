/**
 * 결제 필드 마이그레이션 실행 스크립트
 *
 * 사용법: node database/run-payment-migration.js
 */

const fs = require('fs');
const path = require('path');

// DB 연결
let db;
try {
  db = require('./db');
} catch (error) {
  console.error('DB 모듈 로드 실패:', error.message);
  process.exit(1);
}

async function runMigration() {
  console.log('='.repeat(60));
  console.log('결제 필드 마이그레이션 시작');
  console.log('='.repeat(60));

  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'migrations', 'add_payment_fields.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('마이그레이션 파일을 찾을 수 없습니다:', sqlPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('SQL 파일 로드 완료');

    // 마이그레이션 실행
    await db.query(sql);
    console.log('마이그레이션 실행 완료');

    // 결과 확인
    const result = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'quotes'
        AND column_name LIKE 'payment%'
      ORDER BY ordinal_position
    `);

    console.log('\n추가된 결제 필드:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('마이그레이션 완료!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
