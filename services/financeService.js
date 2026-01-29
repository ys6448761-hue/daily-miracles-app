/**
 * 기적 금고 (Miracle Treasury) - 통합 재무관리 서비스
 *
 * 스타트업 맞춤형 재무관리 + 한국 세무 특화
 *
 * @module services/financeService
 * @version 1.0.0 - 2025.01.29
 */

// DB 연결
let db;
try {
  db = require('../database/db');
} catch (e) {
  console.warn('[Finance] DB 모듈 로드 실패:', e.message);
}

// ============ 상수 정의 ============
const VAT_RATE = 0.10;  // 한국 부가세율 10%
const WITHHOLDING_RATE = 0.033;  // 원천징수율 3.3%

// 세금 일정 (한국)
const TAX_SCHEDULE = {
  vat: [
    { quarter: 1, period: '1-3월', dueMonth: 4, dueDay: 25 },
    { quarter: 2, period: '4-6월', dueMonth: 7, dueDay: 25 },
    { quarter: 3, period: '7-9월', dueMonth: 10, dueDay: 25 },
    { quarter: 4, period: '10-12월', dueMonth: 1, dueDay: 25, nextYear: true }
  ],
  income: { period: '1-12월', dueMonth: 5, dueDay: 31 },
  withholding: { dueDay: 10 }  // 매월 10일
};

// 카테고리 자동 분류 규칙
const CATEGORY_RULES = {
  // 서버/호스팅
  'render': '서버/호스팅',
  '렌더': '서버/호스팅',
  'aws': '서버/호스팅',
  'vercel': '서버/호스팅',
  'heroku': '서버/호스팅',
  'digitalocean': '서버/호스팅',
  'cloudflare': '서버/호스팅',
  '서버': '서버/호스팅',
  '호스팅': '서버/호스팅',

  // API 비용
  'anthropic': 'API 비용',
  'claude': 'API 비용',
  '클로드': 'API 비용',
  'openai': 'API 비용',
  'gpt': 'API 비용',
  'naver': 'API 비용',
  'sens': 'API 비용',
  'solapi': 'API 비용',
  'kakao': 'API 비용',
  'api': 'API 비용',

  // 마케팅/광고
  'instagram': '마케팅/광고',
  '인스타': '마케팅/광고',
  '인스타그램': '마케팅/광고',
  'facebook': '마케팅/광고',
  '페이스북': '마케팅/광고',
  'meta': '마케팅/광고',
  'google ads': '마케팅/광고',
  'naver 광고': '마케팅/광고',
  '광고': '마케팅/광고',

  // 소프트웨어
  'notion': '소프트웨어',
  '노션': '소프트웨어',
  'slack': '소프트웨어',
  '슬랙': '소프트웨어',
  'figma': '소프트웨어',
  '피그마': '소프트웨어',
  'github': '소프트웨어',
  'jira': '소프트웨어',

  // 통신비
  'kt': '통신비',
  'skt': '통신비',
  'lg u+': '통신비'
};

// ============ 거래 관리 ============

/**
 * 거래 등록
 */
async function createTransaction(data) {
  if (!db) throw new Error('DB 연결 필요');

  const {
    type,
    amount,
    categoryId,
    partnerId,
    description,
    memo,
    transactionDate,
    paymentMethod,
    taxInvoiceYn,
    taxInvoiceNumber,
    receiptUrl,
    isRecurring,
    recurringId,
    createdBy
  } = data;

  // 부가세 계산
  const { supplyAmount, vatAmount } = calculateVAT(amount, true);

  const result = await db.query(`
    INSERT INTO finance_transactions (
      type, amount, vat_amount, supply_amount, category_id, partner_id,
      description, memo, transaction_date, payment_method,
      tax_invoice_yn, tax_invoice_number, receipt_url,
      is_recurring, recurring_id, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `, [
    type, amount, vatAmount, supplyAmount, categoryId, partnerId,
    description, memo, transactionDate, paymentMethod,
    taxInvoiceYn || false, taxInvoiceNumber, receiptUrl,
    isRecurring || false, recurringId, createdBy
  ]);

  // 감사 로그
  await logAudit('create', 'finance_transactions', result.rows[0].id, null, result.rows[0]);

  return result.rows[0];
}

/**
 * 거래 목록 조회
 */
async function getTransactions(filters = {}) {
  if (!db) throw new Error('DB 연결 필요');

  const {
    startDate,
    endDate,
    type,
    categoryId,
    partnerId,
    paymentMethod,
    limit = 50,
    offset = 0,
    orderBy = 'transaction_date',
    orderDir = 'DESC'
  } = filters;

  let query = `
    SELECT
      t.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      c.tax_type as category_tax_type,
      p.name as partner_name
    FROM finance_transactions t
    LEFT JOIN finance_categories c ON t.category_id = c.id
    LEFT JOIN partners p ON t.partner_id = p.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (startDate) {
    query += ` AND t.transaction_date >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND t.transaction_date <= $${paramIndex++}`;
    params.push(endDate);
  }
  if (type) {
    query += ` AND t.type = $${paramIndex++}`;
    params.push(type);
  }
  if (categoryId) {
    query += ` AND t.category_id = $${paramIndex++}`;
    params.push(categoryId);
  }
  if (partnerId) {
    query += ` AND t.partner_id = $${paramIndex++}`;
    params.push(partnerId);
  }
  if (paymentMethod) {
    query += ` AND t.payment_method = $${paramIndex++}`;
    params.push(paymentMethod);
  }

  // 정렬 (SQL 인젝션 방지)
  const allowedOrderBy = ['transaction_date', 'amount', 'created_at'];
  const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'transaction_date';
  const safeOrderDir = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY t.${safeOrderBy} ${safeOrderDir}`;
  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // 전체 개수
  let countQuery = `
    SELECT COUNT(*) as total
    FROM finance_transactions t
    WHERE 1=1
  `;
  const countParams = [];
  let countIndex = 1;

  if (startDate) {
    countQuery += ` AND t.transaction_date >= $${countIndex++}`;
    countParams.push(startDate);
  }
  if (endDate) {
    countQuery += ` AND t.transaction_date <= $${countIndex++}`;
    countParams.push(endDate);
  }
  if (type) {
    countQuery += ` AND t.type = $${countIndex++}`;
    countParams.push(type);
  }
  if (categoryId) {
    countQuery += ` AND t.category_id = $${countIndex++}`;
    countParams.push(categoryId);
  }

  const countResult = await db.query(countQuery, countParams);

  return {
    transactions: result.rows,
    total: parseInt(countResult.rows[0].total),
    limit,
    offset
  };
}

/**
 * 거래 상세 조회
 */
async function getTransaction(id) {
  if (!db) throw new Error('DB 연결 필요');

  const result = await db.query(`
    SELECT
      t.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      c.tax_type as category_tax_type,
      p.name as partner_name,
      p.business_number as partner_business_number
    FROM finance_transactions t
    LEFT JOIN finance_categories c ON t.category_id = c.id
    LEFT JOIN partners p ON t.partner_id = p.id
    WHERE t.id = $1
  `, [id]);

  return result.rows[0] || null;
}

/**
 * 거래 수정
 */
async function updateTransaction(id, data) {
  if (!db) throw new Error('DB 연결 필요');

  // 기존 데이터 조회 (감사 로그용)
  const oldData = await getTransaction(id);
  if (!oldData) throw new Error('거래를 찾을 수 없습니다');

  const {
    type,
    amount,
    categoryId,
    partnerId,
    description,
    memo,
    transactionDate,
    paymentMethod,
    taxInvoiceYn,
    taxInvoiceNumber,
    receiptUrl
  } = data;

  // 부가세 재계산
  const { supplyAmount, vatAmount } = calculateVAT(amount, true);

  const result = await db.query(`
    UPDATE finance_transactions SET
      type = COALESCE($1, type),
      amount = COALESCE($2, amount),
      vat_amount = COALESCE($3, vat_amount),
      supply_amount = COALESCE($4, supply_amount),
      category_id = COALESCE($5, category_id),
      partner_id = $6,
      description = COALESCE($7, description),
      memo = $8,
      transaction_date = COALESCE($9, transaction_date),
      payment_method = COALESCE($10, payment_method),
      tax_invoice_yn = COALESCE($11, tax_invoice_yn),
      tax_invoice_number = $12,
      receipt_url = $13,
      updated_at = NOW()
    WHERE id = $14
    RETURNING *
  `, [
    type, amount, vatAmount, supplyAmount, categoryId, partnerId,
    description, memo, transactionDate, paymentMethod,
    taxInvoiceYn, taxInvoiceNumber, receiptUrl, id
  ]);

  // 감사 로그
  await logAudit('update', 'finance_transactions', id, oldData, result.rows[0]);

  return result.rows[0];
}

/**
 * 거래 삭제
 */
async function deleteTransaction(id) {
  if (!db) throw new Error('DB 연결 필요');

  const oldData = await getTransaction(id);
  if (!oldData) throw new Error('거래를 찾을 수 없습니다');

  await db.query('DELETE FROM finance_transactions WHERE id = $1', [id]);

  // 감사 로그
  await logAudit('delete', 'finance_transactions', id, oldData, null);

  return { success: true, deleted: oldData };
}

// ============ 카테고리 관리 ============

/**
 * 카테고리 목록 조회
 */
async function getCategories(type = null) {
  if (!db) throw new Error('DB 연결 필요');

  let query = `
    SELECT * FROM finance_categories
    WHERE is_active = true
  `;
  const params = [];

  if (type) {
    query += ' AND type = $1';
    params.push(type);
  }

  query += ' ORDER BY sort_order, name';

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 카테고리 자동 추천
 */
async function suggestCategory(description) {
  const normalizedDesc = description.toLowerCase();

  for (const [keyword, categoryName] of Object.entries(CATEGORY_RULES)) {
    if (normalizedDesc.includes(keyword)) {
      const categories = await getCategories();
      const matched = categories.find(c => c.name === categoryName);
      if (matched) {
        return {
          categoryId: matched.id,
          categoryName: matched.name,
          confidence: 0.9,
          matchedKeyword: keyword
        };
      }
    }
  }

  return null;
}

// ============ 거래처 관리 ============

/**
 * 거래처 등록
 */
async function createPartner(data) {
  if (!db) throw new Error('DB 연결 필요');

  const result = await db.query(`
    INSERT INTO partners (name, business_number, contact_name, contact_email, contact_phone, type, address, memo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    data.name,
    data.businessNumber,
    data.contactName,
    data.contactEmail,
    data.contactPhone,
    data.type || 'both',
    data.address,
    data.memo
  ]);

  return result.rows[0];
}

/**
 * 거래처 목록 조회
 */
async function getPartners(type = null) {
  if (!db) throw new Error('DB 연결 필요');

  let query = 'SELECT * FROM partners WHERE is_active = true';
  const params = [];

  if (type) {
    query += ' AND (type = $1 OR type = \'both\')';
    params.push(type);
  }

  query += ' ORDER BY name';

  const result = await db.query(query, params);
  return result.rows;
}

// ============ 예산 관리 ============

/**
 * 예산 설정
 */
async function setBudget(data) {
  if (!db) throw new Error('DB 연결 필요');

  const result = await db.query(`
    INSERT INTO finance_budgets (year, month, category_id, amount, alert_threshold, memo)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (year, month, category_id)
    DO UPDATE SET amount = $4, alert_threshold = $5, memo = $6, updated_at = NOW()
    RETURNING *
  `, [data.year, data.month, data.categoryId, data.amount, data.alertThreshold || 80, data.memo]);

  return result.rows[0];
}

/**
 * 월별 예산 조회
 */
async function getBudgets(year, month) {
  if (!db) throw new Error('DB 연결 필요');

  const result = await db.query(`
    SELECT
      b.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      COALESCE(spent.total, 0) as spent_amount
    FROM finance_budgets b
    JOIN finance_categories c ON b.category_id = c.id
    LEFT JOIN (
      SELECT category_id, SUM(amount) as total
      FROM finance_transactions
      WHERE type = 'expense'
        AND EXTRACT(YEAR FROM transaction_date) = $1
        AND EXTRACT(MONTH FROM transaction_date) = $2
      GROUP BY category_id
    ) spent ON b.category_id = spent.category_id
    WHERE b.year = $1 AND b.month = $2
    ORDER BY c.sort_order
  `, [year, month]);

  return result.rows.map(row => ({
    ...row,
    percentage: row.amount > 0 ? Math.round((row.spent_amount / row.amount) * 100) : 0,
    remaining: row.amount - row.spent_amount,
    isOverBudget: row.spent_amount > row.amount
  }));
}

// ============ 보고서 ============

/**
 * 손익계산서
 */
async function getIncomeStatement(year, month) {
  if (!db) throw new Error('DB 연결 필요');

  // 수입 집계
  const incomeResult = await db.query(`
    SELECT
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      SUM(t.amount) as total,
      SUM(t.supply_amount) as supply_total,
      SUM(t.vat_amount) as vat_total,
      COUNT(*) as count
    FROM finance_transactions t
    JOIN finance_categories c ON t.category_id = c.id
    WHERE t.type = 'income'
      AND EXTRACT(YEAR FROM t.transaction_date) = $1
      AND EXTRACT(MONTH FROM t.transaction_date) = $2
    GROUP BY c.id, c.name, c.icon, c.color, c.sort_order
    ORDER BY c.sort_order
  `, [year, month]);

  // 지출 집계
  const expenseResult = await db.query(`
    SELECT
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      c.tax_type,
      SUM(t.amount) as total,
      SUM(t.supply_amount) as supply_total,
      SUM(t.vat_amount) as vat_total,
      COUNT(*) as count
    FROM finance_transactions t
    JOIN finance_categories c ON t.category_id = c.id
    WHERE t.type = 'expense'
      AND EXTRACT(YEAR FROM t.transaction_date) = $1
      AND EXTRACT(MONTH FROM t.transaction_date) = $2
    GROUP BY c.id, c.name, c.icon, c.color, c.tax_type, c.sort_order
    ORDER BY c.sort_order
  `, [year, month]);

  const totalIncome = incomeResult.rows.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);
  const totalExpense = expenseResult.rows.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);
  const netIncome = totalIncome - totalExpense;

  return {
    period: { year, month },
    income: {
      categories: incomeResult.rows,
      total: totalIncome
    },
    expense: {
      categories: expenseResult.rows,
      total: totalExpense
    },
    netIncome,
    profitMargin: totalIncome > 0 ? Math.round((netIncome / totalIncome) * 100) : 0,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 현금흐름표
 */
async function getCashFlow(year, month) {
  if (!db) throw new Error('DB 연결 필요');

  // 일별 현금흐름
  const dailyResult = await db.query(`
    SELECT
      transaction_date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM finance_transactions
    WHERE EXTRACT(YEAR FROM transaction_date) = $1
      AND EXTRACT(MONTH FROM transaction_date) = $2
    GROUP BY transaction_date
    ORDER BY transaction_date
  `, [year, month]);

  // 결제수단별 집계
  const paymentMethodResult = await db.query(`
    SELECT
      payment_method,
      type,
      SUM(amount) as total
    FROM finance_transactions
    WHERE EXTRACT(YEAR FROM transaction_date) = $1
      AND EXTRACT(MONTH FROM transaction_date) = $2
    GROUP BY payment_method, type
    ORDER BY payment_method
  `, [year, month]);

  // 누적 계산
  let runningBalance = 0;
  const dailyFlow = dailyResult.rows.map(row => {
    const netFlow = parseFloat(row.income || 0) - parseFloat(row.expense || 0);
    runningBalance += netFlow;
    return {
      date: row.transaction_date,
      income: parseFloat(row.income || 0),
      expense: parseFloat(row.expense || 0),
      netFlow,
      runningBalance
    };
  });

  return {
    period: { year, month },
    dailyFlow,
    byPaymentMethod: paymentMethodResult.rows,
    summary: {
      totalInflow: dailyFlow.reduce((sum, d) => sum + d.income, 0),
      totalOutflow: dailyFlow.reduce((sum, d) => sum + d.expense, 0),
      netCashFlow: runningBalance
    },
    generatedAt: new Date().toISOString()
  };
}

/**
 * 월별 추이 분석
 */
async function getTrend(months = 6) {
  if (!db) throw new Error('DB 연결 필요');

  const result = await db.query(`
    SELECT
      EXTRACT(YEAR FROM transaction_date) as year,
      EXTRACT(MONTH FROM transaction_date) as month,
      type,
      SUM(amount) as total
    FROM finance_transactions
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '${months} months'
    GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date), type
    ORDER BY year, month
  `);

  // 월별로 그룹화
  const monthlyData = {};
  result.rows.forEach(row => {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { year: row.year, month: row.month, income: 0, expense: 0 };
    }
    if (row.type === 'income') {
      monthlyData[key].income = parseFloat(row.total);
    } else {
      monthlyData[key].expense = parseFloat(row.total);
    }
  });

  const trend = Object.values(monthlyData).map(m => ({
    ...m,
    netIncome: m.income - m.expense,
    profitMargin: m.income > 0 ? Math.round((m.income - m.expense) / m.income * 100) : 0
  }));

  return { trend, months };
}

// ============ 세금 관리 ============

/**
 * 부가세 계산
 */
function calculateVAT(totalAmount, isVATIncluded = true) {
  if (isVATIncluded) {
    const supplyAmount = Math.round(totalAmount / (1 + VAT_RATE));
    const vatAmount = totalAmount - supplyAmount;
    return { supplyAmount, vatAmount, totalAmount };
  } else {
    const vatAmount = Math.round(totalAmount * VAT_RATE);
    return {
      supplyAmount: totalAmount,
      vatAmount,
      totalAmount: totalAmount + vatAmount
    };
  }
}

/**
 * 분기별 부가세 예상액
 */
async function getVATPreview(year, quarter) {
  if (!db) throw new Error('DB 연결 필요');

  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;

  // 매출 부가세 (매출세액)
  const salesResult = await db.query(`
    SELECT
      SUM(vat_amount) as sales_vat,
      SUM(supply_amount) as sales_supply,
      COUNT(*) as sales_count
    FROM finance_transactions t
    JOIN finance_categories c ON t.category_id = c.id
    WHERE t.type = 'income'
      AND c.tax_type = 'vat'
      AND EXTRACT(YEAR FROM t.transaction_date) = $1
      AND EXTRACT(MONTH FROM t.transaction_date) BETWEEN $2 AND $3
  `, [year, startMonth, endMonth]);

  // 매입 부가세 (매입세액)
  const purchaseResult = await db.query(`
    SELECT
      SUM(vat_amount) as purchase_vat,
      SUM(supply_amount) as purchase_supply,
      COUNT(*) as purchase_count
    FROM finance_transactions t
    JOIN finance_categories c ON t.category_id = c.id
    WHERE t.type = 'expense'
      AND c.tax_type = 'vat'
      AND t.tax_invoice_yn = true
      AND EXTRACT(YEAR FROM t.transaction_date) = $1
      AND EXTRACT(MONTH FROM t.transaction_date) BETWEEN $2 AND $3
  `, [year, startMonth, endMonth]);

  const salesVAT = parseFloat(salesResult.rows[0]?.sales_vat || 0);
  const purchaseVAT = parseFloat(purchaseResult.rows[0]?.purchase_vat || 0);
  const payableVAT = salesVAT - purchaseVAT;

  // 납부 기한 계산
  const schedule = TAX_SCHEDULE.vat.find(s => s.quarter === quarter);
  const dueYear = schedule.nextYear ? year + 1 : year;
  const dueDate = new Date(dueYear, schedule.dueMonth - 1, schedule.dueDay);

  return {
    period: { year, quarter, description: `${year}년 ${quarter}분기 (${schedule.period})` },
    sales: {
      supplyAmount: parseFloat(salesResult.rows[0]?.sales_supply || 0),
      vatAmount: salesVAT,
      count: parseInt(salesResult.rows[0]?.sales_count || 0)
    },
    purchase: {
      supplyAmount: parseFloat(purchaseResult.rows[0]?.purchase_supply || 0),
      vatAmount: purchaseVAT,
      count: parseInt(purchaseResult.rows[0]?.purchase_count || 0)
    },
    payableVAT,
    isRefund: payableVAT < 0,
    dueDate: dueDate.toISOString().split('T')[0],
    generatedAt: new Date().toISOString()
  };
}

/**
 * 세금 캘린더
 */
async function getTaxCalendar(year) {
  const calendar = [];
  const now = new Date();

  // 부가세 (분기별)
  for (const schedule of TAX_SCHEDULE.vat) {
    const dueYear = schedule.nextYear ? year + 1 : year;
    const dueDate = new Date(dueYear, schedule.dueMonth - 1, schedule.dueDay);
    const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    calendar.push({
      taxType: 'vat',
      name: `부가가치세 ${schedule.quarter}기`,
      period: `${year}년 ${schedule.period}`,
      dueDate: dueDate.toISOString().split('T')[0],
      daysUntil,
      status: daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'urgent' : 'upcoming'
    });
  }

  // 종합소득세
  const incomeDue = new Date(year + 1, TAX_SCHEDULE.income.dueMonth - 1, TAX_SCHEDULE.income.dueDay);
  const incomeDaysUntil = Math.ceil((incomeDue - now) / (1000 * 60 * 60 * 24));

  calendar.push({
    taxType: 'income',
    name: '종합소득세',
    period: `${year}년 ${TAX_SCHEDULE.income.period}`,
    dueDate: incomeDue.toISOString().split('T')[0],
    daysUntil: incomeDaysUntil,
    status: incomeDaysUntil < 0 ? 'overdue' : incomeDaysUntil <= 30 ? 'urgent' : 'upcoming'
  });

  return calendar.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// ============ 대시보드 ============

/**
 * 종합 대시보드
 */
async function getDashboard() {
  if (!db) throw new Error('DB 연결 필요');

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  // 현재 월에 데이터가 없으면 가장 최근 데이터가 있는 월 찾기
  const latestCheck = await db.query(`
    SELECT
      EXTRACT(YEAR FROM transaction_date)::int as year,
      EXTRACT(MONTH FROM transaction_date)::int as month,
      COUNT(*) as count
    FROM finance_transactions
    WHERE EXTRACT(YEAR FROM transaction_date) = $1
      AND EXTRACT(MONTH FROM transaction_date) = $2
    GROUP BY year, month
  `, [year, month]);

  // 현재 월에 데이터가 없으면 가장 최근 월 조회
  if (!latestCheck.rows.length || latestCheck.rows[0].count === 0) {
    const recentMonth = await db.query(`
      SELECT
        EXTRACT(YEAR FROM transaction_date)::int as year,
        EXTRACT(MONTH FROM transaction_date)::int as month
      FROM finance_transactions
      ORDER BY transaction_date DESC
      LIMIT 1
    `);
    if (recentMonth.rows.length > 0) {
      year = recentMonth.rows[0].year;
      month = recentMonth.rows[0].month;
    }
  }

  // 해당 월 요약
  const monthlyResult = await db.query(`
    SELECT
      type,
      SUM(amount) as total,
      COUNT(*) as count
    FROM finance_transactions
    WHERE EXTRACT(YEAR FROM transaction_date) = $1
      AND EXTRACT(MONTH FROM transaction_date) = $2
    GROUP BY type
  `, [year, month]);

  const income = monthlyResult.rows.find(r => r.type === 'income');
  const expense = monthlyResult.rows.find(r => r.type === 'expense');

  // 최근 거래 5건
  const recentResult = await db.query(`
    SELECT
      t.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM finance_transactions t
    LEFT JOIN finance_categories c ON t.category_id = c.id
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT 5
  `);

  // 예산 현황
  const budgets = await getBudgets(year, month);
  const overBudgetCount = budgets.filter(b => b.isOverBudget).length;
  const warningCount = budgets.filter(b => b.percentage >= b.alert_threshold && !b.isOverBudget).length;

  // 다가오는 세금
  const taxCalendar = await getTaxCalendar(year);
  const upcomingTax = taxCalendar.filter(t => t.daysUntil > 0 && t.daysUntil <= 30);

  return {
    period: { year, month },
    summary: {
      income: parseFloat(income?.total || 0),
      expense: parseFloat(expense?.total || 0),
      netIncome: parseFloat(income?.total || 0) - parseFloat(expense?.total || 0),
      transactionCount: parseInt(income?.count || 0) + parseInt(expense?.count || 0)
    },
    recentTransactions: recentResult.rows,
    budgetStatus: {
      total: budgets.length,
      overBudget: overBudgetCount,
      warning: warningCount,
      healthy: budgets.length - overBudgetCount - warningCount
    },
    upcomingTax,
    generatedAt: new Date().toISOString()
  };
}

// ============ 유틸리티 ============

/**
 * 감사 로그 기록
 */
async function logAudit(action, tableName, recordId, oldValue, newValue, userId = 'system') {
  if (!db) return;

  try {
    await db.query(`
      INSERT INTO finance_audit_logs (user_id, action, table_name, record_id, old_value, new_value)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, action, tableName, recordId, JSON.stringify(oldValue), JSON.stringify(newValue)]);
  } catch (e) {
    console.warn('[Finance] 감사 로그 기록 실패:', e.message);
  }
}

/**
 * 서비스 상태 확인
 */
function getServiceStatus() {
  return {
    name: '기적 금고 (Miracle Treasury)',
    version: '1.0.0',
    status: db ? 'active' : 'inactive',
    dbConnected: !!db,
    vatRate: VAT_RATE,
    withholdingRate: WITHHOLDING_RATE,
    categoryRulesCount: Object.keys(CATEGORY_RULES).length
  };
}

// ============ 모듈 내보내기 ============
module.exports = {
  // 거래 관리
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,

  // 카테고리
  getCategories,
  suggestCategory,

  // 거래처
  createPartner,
  getPartners,

  // 예산
  setBudget,
  getBudgets,

  // 보고서
  getIncomeStatement,
  getCashFlow,
  getTrend,

  // 세금
  calculateVAT,
  getVATPreview,
  getTaxCalendar,

  // 대시보드
  getDashboard,

  // 유틸리티
  getServiceStatus,

  // 상수
  VAT_RATE,
  WITHHOLDING_RATE,
  TAX_SCHEDULE
};
