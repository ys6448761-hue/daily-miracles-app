/**
 * 기적 금고 테스트 데이터 시드 스크립트
 *
 * 사용법: node scripts/seed-finance-test-data.js
 *
 * @version 1.0.0 - 2025.01.29
 */

require('dotenv').config();

const testTransactions = [
  // 수입 거래
  {
    type: 'income',
    amount: 150000,
    categoryName: '서비스매출',
    description: '하루하루의 기적 분석 서비스 - 홍길동',
    transactionDate: '2025-01-15',
    paymentMethod: 'transfer',
    taxInvoiceYn: true
  },
  {
    type: 'income',
    amount: 200000,
    categoryName: '컨설팅수입',
    description: '소원여정 컨설팅 - 김철수',
    transactionDate: '2025-01-18',
    paymentMethod: 'transfer',
    taxInvoiceYn: true
  },
  {
    type: 'income',
    amount: 80000,
    categoryName: '서비스매출',
    description: '기적분석 서비스 - 이영희',
    transactionDate: '2025-01-22',
    paymentMethod: 'card',
    taxInvoiceYn: false
  },

  // 지출 거래
  {
    type: 'expense',
    amount: 35200,
    categoryName: '서버/호스팅',
    description: 'Render Pro 월 요금',
    transactionDate: '2025-01-01',
    paymentMethod: 'card',
    taxInvoiceYn: true
  },
  {
    type: 'expense',
    amount: 22000,
    categoryName: 'API 비용',
    description: 'Anthropic Claude API 사용료',
    transactionDate: '2025-01-05',
    paymentMethod: 'card',
    taxInvoiceYn: true
  },
  {
    type: 'expense',
    amount: 15400,
    categoryName: 'API 비용',
    description: 'Naver SENS API 사용료 (SMS/알림톡)',
    transactionDate: '2025-01-10',
    paymentMethod: 'card',
    taxInvoiceYn: true
  },
  {
    type: 'expense',
    amount: 50000,
    categoryName: '마케팅/광고',
    description: '인스타그램 광고비',
    transactionDate: '2025-01-12',
    paymentMethod: 'card',
    taxInvoiceYn: false
  },
  {
    type: 'expense',
    amount: 16500,
    categoryName: '소프트웨어',
    description: 'Notion Plus 월 구독',
    transactionDate: '2025-01-01',
    paymentMethod: 'card',
    taxInvoiceYn: true
  },
  {
    type: 'expense',
    amount: 8800,
    categoryName: '통신비',
    description: 'KT 인터넷 요금',
    transactionDate: '2025-01-15',
    paymentMethod: 'transfer',
    taxInvoiceYn: true
  },
  {
    type: 'expense',
    amount: 25000,
    categoryName: '도서/교육',
    description: '스타트업 마케팅 서적',
    transactionDate: '2025-01-20',
    paymentMethod: 'card',
    taxInvoiceYn: false
  }
];

async function seedTestData() {
  console.log('🌱 기적 금고 테스트 데이터 시드 시작...\n');

  let db;
  try {
    db = require('../database/db');
  } catch (e) {
    console.error('❌ DB 연결 실패:', e.message);
    console.log('\n📌 PostgreSQL 연결 정보를 확인하세요 (.env 파일)');
    process.exit(1);
  }

  try {
    // 1. 마이그레이션 실행 확인
    console.log('📋 테이블 존재 확인 중...');

    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'finance_transactions'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ finance_transactions 테이블이 없습니다.');
      console.log('📌 먼저 마이그레이션을 실행하세요:');
      console.log('   psql -d your_database -f database/migrations/003_finance_tables.sql\n');
      process.exit(1);
    }

    // 2. 카테고리 맵 가져오기
    console.log('📂 카테고리 정보 로드 중...');
    const categories = await db.query('SELECT id, name FROM finance_categories');
    const categoryMap = {};
    categories.rows.forEach(c => {
      categoryMap[c.name] = c.id;
    });

    console.log(`   ${Object.keys(categoryMap).length}개 카테고리 로드됨\n`);

    // 3. 테스트 거래 삽입
    console.log('💰 테스트 거래 삽입 중...\n');

    let successCount = 0;
    for (const tx of testTransactions) {
      const categoryId = categoryMap[tx.categoryName];

      if (!categoryId) {
        console.log(`   ⚠️ 카테고리 없음: ${tx.categoryName}`);
        continue;
      }

      // 부가세 계산
      const supplyAmount = Math.round(tx.amount / 1.1);
      const vatAmount = tx.amount - supplyAmount;

      await db.query(`
        INSERT INTO finance_transactions (
          type, amount, vat_amount, supply_amount, category_id,
          description, transaction_date, payment_method, tax_invoice_yn
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        tx.type,
        tx.amount,
        vatAmount,
        supplyAmount,
        categoryId,
        tx.description,
        tx.transactionDate,
        tx.paymentMethod,
        tx.taxInvoiceYn
      ]);

      const icon = tx.type === 'income' ? '📈' : '📉';
      console.log(`   ${icon} ${tx.description.substring(0, 30)}... - ${tx.amount.toLocaleString()}원`);
      successCount++;
    }

    console.log(`\n✅ ${successCount}개 거래 삽입 완료!\n`);

    // 4. 요약 출력
    const summary = await db.query(`
      SELECT
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM finance_transactions
      GROUP BY type
    `);

    console.log('📊 거래 요약:');
    summary.rows.forEach(row => {
      const icon = row.type === 'income' ? '💵 수입' : '💸 지출';
      console.log(`   ${icon}: ${row.count}건 / ${parseFloat(row.total).toLocaleString()}원`);
    });

    const income = summary.rows.find(r => r.type === 'income');
    const expense = summary.rows.find(r => r.type === 'expense');
    const netIncome = (parseFloat(income?.total || 0) - parseFloat(expense?.total || 0));

    console.log(`   📈 순이익: ${netIncome.toLocaleString()}원\n`);

    console.log('🎉 테스트 데이터 시드 완료!');
    console.log('📌 API 테스트: GET /api/finance/dashboard');

  } catch (error) {
    console.error('❌ 시드 실패:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

seedTestData();
