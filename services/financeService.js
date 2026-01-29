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
    version: '2.0.0',
    status: db ? 'active' : 'inactive',
    dbConnected: !!db,
    vatRate: VAT_RATE,
    withholdingRate: WITHHOLDING_RATE,
    categoryRulesCount: Object.keys(CATEGORY_RULES).length
  };
}

// ============ AI 인사이트 엔진 (Phase 2) ============

/**
 * AI 인사이트 생성
 * - 지출 이상 감지
 * - 절세 기회
 * - 현금흐름 예측
 * - 비용 절감 제안
 * - 수익 트렌드
 */
async function generateInsights() {
  if (!db) throw new Error('DB 연결 필요');

  const insights = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  try {
    // 1. 지출 이상 감지 - 평균 대비 높은 지출 카테고리
    const expenseAnomaly = await db.query(`
      WITH monthly_avg AS (
        SELECT
          category_id,
          AVG(amount) as avg_amount
        FROM finance_transactions
        WHERE type = 'expense'
        GROUP BY category_id
      ),
      recent_expense AS (
        SELECT
          t.category_id,
          c.name as category_name,
          SUM(t.amount) as total_amount
        FROM finance_transactions t
        JOIN finance_categories c ON t.category_id = c.id
        WHERE t.type = 'expense'
          AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY t.category_id, c.name
      )
      SELECT
        r.category_name,
        r.total_amount,
        m.avg_amount,
        ROUND((r.total_amount / NULLIF(m.avg_amount, 0) - 1) * 100) as increase_pct
      FROM recent_expense r
      JOIN monthly_avg m ON r.category_id = m.category_id
      WHERE r.total_amount > m.avg_amount * 1.5
      ORDER BY increase_pct DESC
      LIMIT 1
    `);

    if (expenseAnomaly.rows.length > 0) {
      const anomaly = expenseAnomaly.rows[0];
      insights.push({
        type: 'expense_anomaly',
        icon: '⚠️',
        title: '지출 이상 감지',
        description: `${anomaly.category_name} 지출이 평균 대비 ${anomaly.increase_pct}% 높습니다. 최근 30일: ${parseFloat(anomaly.total_amount).toLocaleString()}원`,
        severity: 'warning',
        actionable: true
      });
    }

    // 2. 절세 기회 - 세금계산서 미발행 건
    const taxInvoiceMissing = await db.query(`
      SELECT
        COUNT(*) as count,
        SUM(amount) as total
      FROM finance_transactions
      WHERE type = 'expense'
        AND tax_invoice_yn = false
        AND amount >= 30000
        AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    if (taxInvoiceMissing.rows[0]?.count > 0) {
      const missing = taxInvoiceMissing.rows[0];
      insights.push({
        type: 'tax_opportunity',
        icon: '💡',
        title: '절세 기회',
        description: `세금계산서 미발행 건 ${missing.count}건 (${parseFloat(missing.total).toLocaleString()}원). 발행 시 부가세 환급 가능!`,
        severity: 'info',
        actionable: true
      });
    }

    // 3. 현금흐름 예측
    const cashFlowTrend = await db.query(`
      SELECT
        type,
        SUM(amount) as total
      FROM finance_transactions
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY type
    `);

    const income90 = parseFloat(cashFlowTrend.rows.find(r => r.type === 'income')?.total || 0);
    const expense90 = parseFloat(cashFlowTrend.rows.find(r => r.type === 'expense')?.total || 0);
    const avgMonthlyNet = (income90 - expense90) / 3;

    insights.push({
      type: 'cash_flow_prediction',
      icon: '📊',
      title: '현금흐름 예측',
      description: avgMonthlyNet >= 0
        ? `월평균 순수익 ${Math.round(avgMonthlyNet).toLocaleString()}원 유지 중. 안정적인 현금흐름입니다.`
        : `월평균 ${Math.abs(Math.round(avgMonthlyNet)).toLocaleString()}원 적자 추세. 지출 관리가 필요합니다.`,
      severity: avgMonthlyNet >= 0 ? 'success' : 'danger',
      actionable: avgMonthlyNet < 0
    });

    // 4. 비용 절감 제안 - 반복 지출 분석
    const recurringExpenses = await db.query(`
      SELECT
        description,
        COUNT(*) as occurrence,
        AVG(amount) as avg_amount
      FROM finance_transactions
      WHERE type = 'expense'
        AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY description
      HAVING COUNT(*) >= 2
      ORDER BY AVG(amount) DESC
      LIMIT 3
    `);

    if (recurringExpenses.rows.length > 0) {
      const topRecurring = recurringExpenses.rows[0];
      insights.push({
        type: 'cost_reduction',
        icon: '💰',
        title: '비용 절감 제안',
        description: `'${topRecurring.description.substring(0, 20)}...' 반복 지출 발견 (${topRecurring.occurrence}회, 평균 ${parseFloat(topRecurring.avg_amount).toLocaleString()}원). 구독료 점검을 권장합니다.`,
        severity: 'info',
        actionable: true
      });
    }

    // 5. 수익 트렌드
    const revenueTrend = await db.query(`
      SELECT
        EXTRACT(MONTH FROM transaction_date) as month,
        SUM(amount) as total
      FROM finance_transactions
      WHERE type = 'income'
        AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY month
      ORDER BY month
    `);

    if (revenueTrend.rows.length >= 2) {
      const months = revenueTrend.rows;
      const lastMonth = parseFloat(months[months.length - 1]?.total || 0);
      const prevMonth = parseFloat(months[months.length - 2]?.total || 0);
      const change = prevMonth > 0 ? Math.round((lastMonth / prevMonth - 1) * 100) : 0;

      insights.push({
        type: 'revenue_trend',
        icon: change >= 0 ? '📈' : '📉',
        title: '수익 트렌드',
        description: change >= 0
          ? `전월 대비 수익 ${change}% 증가! 좋은 흐름입니다.`
          : `전월 대비 수익 ${Math.abs(change)}% 감소. 매출 확대 전략이 필요합니다.`,
        severity: change >= 0 ? 'success' : 'warning',
        actionable: change < 0
      });
    }

    // 기본 인사이트 (데이터 부족 시)
    if (insights.length === 0) {
      insights.push({
        type: 'welcome',
        icon: '✨',
        title: '기적 금고 활성화',
        description: '거래 데이터가 쌓이면 AI 인사이트가 자동으로 생성됩니다.',
        severity: 'info',
        actionable: false
      });
    }

  } catch (error) {
    console.error('[Finance] 인사이트 생성 오류:', error.message);
    insights.push({
      type: 'error',
      icon: '⚠️',
      title: '인사이트 생성 실패',
      description: '데이터 분석 중 오류가 발생했습니다.',
      severity: 'warning',
      actionable: false
    });
  }

  return {
    insights,
    generatedAt: new Date().toISOString(),
    count: insights.length
  };
}

// ============ 엑셀 Import/Export (Phase 2) ============

const XLSX = require('xlsx');

/**
 * 엑셀 내보내기 - 월별 거래 내역
 */
async function exportToExcel(year, month) {
  if (!db) throw new Error('DB 연결 필요');

  // 거래 내역 조회
  const transactions = await db.query(`
    SELECT
      t.transaction_date as "거래일",
      CASE WHEN t.type = 'income' THEN '수입' ELSE '지출' END as "유형",
      c.name as "카테고리",
      t.description as "적요",
      t.amount as "금액",
      t.supply_amount as "공급가액",
      t.vat_amount as "부가세",
      CASE WHEN t.tax_invoice_yn THEN 'Y' ELSE 'N' END as "세금계산서",
      t.payment_method as "결제수단",
      p.name as "거래처"
    FROM finance_transactions t
    LEFT JOIN finance_categories c ON t.category_id = c.id
    LEFT JOIN partners p ON t.partner_id = p.id
    WHERE EXTRACT(YEAR FROM t.transaction_date) = $1
      AND EXTRACT(MONTH FROM t.transaction_date) = $2
    ORDER BY t.transaction_date, t.id
  `, [year, month]);

  // 손익 요약
  const summary = await db.query(`
    SELECT
      type,
      SUM(amount) as total,
      SUM(supply_amount) as supply_total,
      SUM(vat_amount) as vat_total,
      COUNT(*) as count
    FROM finance_transactions
    WHERE EXTRACT(YEAR FROM transaction_date) = $1
      AND EXTRACT(MONTH FROM transaction_date) = $2
    GROUP BY type
  `, [year, month]);

  const income = summary.rows.find(r => r.type === 'income') || { total: 0, count: 0 };
  const expense = summary.rows.find(r => r.type === 'expense') || { total: 0, count: 0 };

  // 워크북 생성
  const wb = XLSX.utils.book_new();

  // 시트 1: 거래 내역
  const wsData = transactions.rows.map(row => ({
    '거래일': row.거래일 ? new Date(row.거래일).toISOString().split('T')[0] : '',
    '유형': row.유형,
    '카테고리': row.카테고리 || '',
    '적요': row.적요,
    '금액': parseFloat(row.금액),
    '공급가액': parseFloat(row.공급가액 || 0),
    '부가세': parseFloat(row.부가세 || 0),
    '세금계산서': row.세금계산서,
    '결제수단': row.결제수단 || '',
    '거래처': row.거래처 || ''
  }));

  const ws1 = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws1, '거래내역');

  // 시트 2: 손익계산서
  const summaryData = [
    { '항목': '기간', '금액': `${year}년 ${month}월` },
    { '항목': '', '금액': '' },
    { '항목': '【수입】', '금액': '' },
    { '항목': '총 수입', '금액': parseFloat(income.total || 0) },
    { '항목': '수입 건수', '금액': parseInt(income.count || 0) },
    { '항목': '', '금액': '' },
    { '항목': '【지출】', '금액': '' },
    { '항목': '총 지출', '금액': parseFloat(expense.total || 0) },
    { '항목': '지출 건수', '금액': parseInt(expense.count || 0) },
    { '항목': '', '금액': '' },
    { '항목': '【손익】', '금액': '' },
    { '항목': '순이익', '금액': parseFloat(income.total || 0) - parseFloat(expense.total || 0) },
    { '항목': '수익률', '금액': income.total > 0 ? `${Math.round((1 - expense.total / income.total) * 100)}%` : '0%' }
  ];

  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws2, '손익계산서');

  // 버퍼 생성
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return {
    buffer,
    filename: `기적금고_${year}년${month}월_거래내역.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

/**
 * 엑셀 가져오기 - 거래 일괄 등록
 */
async function importFromExcel(fileBuffer) {
  if (!db) throw new Error('DB 연결 필요');

  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws);

  const results = {
    total: rows.length,
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  };

  const categories = await getCategories();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // 컬럼 매핑 (다양한 형식 지원)
      const transactionDate = row['거래일'] || row['날짜'] || row['date'] || row['Date'];
      const amount = parseFloat(row['금액'] || row['amount'] || row['Amount'] || 0);
      const description = row['적요'] || row['설명'] || row['description'] || row['Description'] || '';
      const typeRaw = row['유형'] || row['type'] || row['Type'] || '';
      const categoryName = row['카테고리'] || row['category'] || row['Category'] || '';

      if (!transactionDate || !amount || !description) {
        results.failed++;
        results.errors.push(`행 ${i + 2}: 필수 데이터 누락 (거래일, 금액, 적요)`);
        continue;
      }

      // 유형 결정
      let type = 'expense';
      if (typeRaw.includes('수입') || typeRaw.toLowerCase().includes('income')) {
        type = 'income';
      } else if (amount < 0) {
        type = 'expense';
      }

      // 카테고리 찾기 또는 AI 추천
      let categoryId = null;
      if (categoryName) {
        const matched = categories.find(c =>
          c.name === categoryName || c.name.includes(categoryName)
        );
        if (matched) categoryId = matched.id;
      }
      if (!categoryId) {
        const suggestion = await suggestCategory(description);
        if (suggestion) categoryId = suggestion.categoryId;
      }

      // 중복 체크
      const duplicate = await db.query(`
        SELECT id FROM finance_transactions
        WHERE transaction_date = $1
          AND amount = $2
          AND description = $3
        LIMIT 1
      `, [transactionDate, Math.abs(amount), description]);

      if (duplicate.rows.length > 0) {
        results.duplicates++;
        continue;
      }

      // 거래 등록
      await createTransaction({
        type,
        amount: Math.abs(amount),
        categoryId,
        description,
        transactionDate,
        paymentMethod: row['결제수단'] || row['payment_method'] || 'card',
        taxInvoiceYn: row['세금계산서'] === 'Y' || row['tax_invoice'] === 'Y'
      });

      results.success++;

    } catch (error) {
      results.failed++;
      results.errors.push(`행 ${i + 2}: ${error.message}`);
    }
  }

  return results;
}

// ============ 예산 알림 시스템 (Phase 2) ============

/**
 * 예산 대비 실적 현황 (게이지 바용)
 */
async function getBudgetStatus(year, month) {
  if (!db) throw new Error('DB 연결 필요');

  // 예산 설정 조회
  const budgetResult = await db.query(`
    SELECT
      b.id,
      b.category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      b.amount as budget_amount,
      b.alert_threshold,
      b.memo
    FROM finance_budgets b
    JOIN finance_categories c ON b.category_id = c.id
    WHERE b.year = $1 AND b.month = $2
    ORDER BY c.sort_order
  `, [year, month]);

  // 각 예산별 실적 계산
  const budgets = [];
  for (const budget of budgetResult.rows) {
    const spentResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as spent
      FROM finance_transactions
      WHERE category_id = $1
        AND EXTRACT(YEAR FROM transaction_date) = $2
        AND EXTRACT(MONTH FROM transaction_date) = $3
    `, [budget.category_id, year, month]);

    const spent = parseFloat(spentResult.rows[0].spent);
    const budgetAmount = parseFloat(budget.budget_amount);
    const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
    const remaining = budgetAmount - spent;

    let status = 'healthy';
    if (percentage >= 100) {
      status = 'over';
    } else if (percentage >= budget.alert_threshold) {
      status = 'warning';
    }

    budgets.push({
      id: budget.id,
      categoryId: budget.category_id,
      categoryName: budget.category_name,
      categoryIcon: budget.category_icon,
      categoryColor: budget.category_color,
      budgetAmount,
      spent,
      remaining,
      percentage,
      alertThreshold: budget.alert_threshold,
      status,
      memo: budget.memo
    });
  }

  // 전체 요약
  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return {
    period: { year, month },
    budgets,
    summary: {
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      overCount: budgets.filter(b => b.status === 'over').length,
      warningCount: budgets.filter(b => b.status === 'warning').length,
      healthyCount: budgets.filter(b => b.status === 'healthy').length
    },
    generatedAt: new Date().toISOString()
  };
}

// ============ 증빙 발행 시스템 (Phase 3) ============

const boltaService = require('./boltaService');

/**
 * 미발행 증빙 목록 조회
 */
async function getPendingReceipts(options = {}) {
  if (!db) throw new Error('DB 연결 필요');

  const { year, month, limit = 50 } = options;

  let query = `
    SELECT
      t.id,
      t.type,
      t.amount,
      t.supply_amount,
      t.vat_amount,
      t.description,
      t.transaction_date,
      t.partner_type,
      t.receipt_type,
      t.receipt_status,
      c.name as category_name,
      p.name as partner_name,
      p.business_number as partner_business_number
    FROM finance_transactions t
    LEFT JOIN finance_categories c ON t.category_id = c.id
    LEFT JOIN partners p ON t.partner_id = p.id
    WHERE t.type = 'income'
      AND t.receipt_status = 'pending'
  `;

  const params = [];
  let paramIndex = 1;

  if (year && month) {
    query += ` AND EXTRACT(YEAR FROM t.transaction_date) = $${paramIndex++}`;
    params.push(year);
    query += ` AND EXTRACT(MONTH FROM t.transaction_date) = $${paramIndex++}`;
    params.push(month);
  }

  query += ` ORDER BY t.transaction_date ASC LIMIT $${paramIndex}`;
  params.push(limit);

  const result = await db.query(query, params);

  // 발행 기한 계산 추가
  const receipts = result.rows.map(row => {
    const deadline = boltaService.calculateDeadline(
      row.transaction_date,
      row.receipt_type || 'tax_invoice'
    );

    return {
      ...row,
      amount: parseFloat(row.amount),
      supplyAmount: parseFloat(row.supply_amount || 0),
      vatAmount: parseFloat(row.vat_amount || 0),
      receiptTypeLabel: boltaService.RECEIPT_TYPES[row.receipt_type]?.label || '미지정',
      receiptTypeIcon: boltaService.RECEIPT_TYPES[row.receipt_type]?.icon || '📄',
      ...deadline
    };
  });

  return {
    receipts,
    total: receipts.length,
    hasUrgent: receipts.some(r => r.isUrgent),
    hasOverdue: receipts.some(r => r.isOverdue)
  };
}

/**
 * 발행 기한 임박 건 조회 (익월 10일 기준)
 */
async function getDeadlineReceipts() {
  if (!db) throw new Error('DB 연결 필요');

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 이번 달 10일까지의 기한 (전월 거래 대상)
  const deadlineDate = new Date(currentYear, currentMonth, 10);

  // 전월 거래 중 미발행 건
  const prevMonth = currentMonth === 0 ? 12 : currentMonth;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const result = await db.query(`
    SELECT
      t.id,
      t.amount,
      t.description,
      t.transaction_date,
      t.receipt_type,
      t.receipt_status,
      p.name as partner_name
    FROM finance_transactions t
    LEFT JOIN partners p ON t.partner_id = p.id
    WHERE t.type = 'income'
      AND t.receipt_status = 'pending'
      AND EXTRACT(YEAR FROM t.transaction_date) = $1
      AND EXTRACT(MONTH FROM t.transaction_date) = $2
    ORDER BY t.transaction_date ASC
  `, [prevYear, prevMonth]);

  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    receipts: result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount)
    })),
    total: result.rows.length,
    deadline: deadlineDate.toISOString().split('T')[0],
    daysUntilDeadline,
    isUrgent: daysUntilDeadline <= 5 && daysUntilDeadline > 0,
    isOverdue: daysUntilDeadline < 0,
    message: daysUntilDeadline > 0
      ? `${result.rows.length}건의 세금계산서 발행 기한이 ${daysUntilDeadline}일 남았습니다.`
      : daysUntilDeadline === 0
        ? `오늘이 세금계산서 발행 마감일입니다! (${result.rows.length}건)`
        : `세금계산서 발행 기한이 지났습니다! (${result.rows.length}건)`
  };
}

/**
 * 증빙 발행 요청
 */
async function issueReceipt(transactionId, options = {}) {
  if (!db) throw new Error('DB 연결 필요');

  const { provider = 'manual', receiptNumber, issuedAt } = options;

  // 거래 조회
  const txResult = await db.query(
    'SELECT * FROM finance_transactions WHERE id = $1',
    [transactionId]
  );

  if (txResult.rows.length === 0) {
    throw new Error('거래를 찾을 수 없습니다');
  }

  const transaction = txResult.rows[0];

  // 볼타 API로 발행 시도
  let issueResult;
  if (provider === 'bolta') {
    if (transaction.receipt_type === 'tax_invoice') {
      issueResult = await boltaService.issueTaxInvoice({
        transactionId,
        supplyAmount: transaction.supply_amount,
        vatAmount: transaction.vat_amount,
        totalAmount: transaction.amount,
        itemName: transaction.description
      });
    } else {
      issueResult = await boltaService.issueCashReceipt({
        transactionId,
        receiptType: transaction.receipt_type,
        amount: transaction.amount,
        itemName: transaction.description
      });
    }
  } else {
    // 수동 발행 (홈택스에서 직접 발행 후 상태 업데이트)
    issueResult = {
      success: true,
      status: 'issued',
      provider: 'manual',
      receiptNumber: receiptNumber || null,
      issuedAt: issuedAt || new Date().toISOString()
    };
  }

  // 발행 성공 시 거래 업데이트
  if (issueResult.success) {
    await db.query(`
      UPDATE finance_transactions
      SET
        receipt_status = 'issued',
        receipt_number = $1,
        receipt_issued_at = $2,
        receipt_provider = $3,
        tax_invoice_yn = true,
        updated_at = NOW()
      WHERE id = $4
    `, [
      issueResult.receiptNumber || receiptNumber,
      issueResult.issuedAt || new Date(),
      issueResult.provider || provider,
      transactionId
    ]);
  }

  // 로그 기록
  await db.query(`
    INSERT INTO receipt_logs (
      transaction_id, receipt_type, status, provider,
      request_data, response_data, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    transactionId,
    transaction.receipt_type,
    issueResult.success ? 'success' : 'failed',
    provider,
    JSON.stringify({ transactionId, options }),
    JSON.stringify(issueResult),
    issueResult.message || null
  ]);

  return issueResult;
}

/**
 * 증빙 상태 수동 업데이트
 */
async function updateReceiptStatus(transactionId, statusData) {
  if (!db) throw new Error('DB 연결 필요');

  const {
    receiptStatus,
    receiptNumber,
    receiptIssuedAt,
    receiptProvider,
    receiptType,
    partnerType
  } = statusData;

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (receiptStatus) {
    updates.push(`receipt_status = $${paramIndex++}`);
    params.push(receiptStatus);
  }
  if (receiptNumber !== undefined) {
    updates.push(`receipt_number = $${paramIndex++}`);
    params.push(receiptNumber);
  }
  if (receiptIssuedAt) {
    updates.push(`receipt_issued_at = $${paramIndex++}`);
    params.push(receiptIssuedAt);
  }
  if (receiptProvider) {
    updates.push(`receipt_provider = $${paramIndex++}`);
    params.push(receiptProvider);
  }
  if (receiptType) {
    updates.push(`receipt_type = $${paramIndex++}`);
    params.push(receiptType);
  }
  if (partnerType) {
    updates.push(`partner_type = $${paramIndex++}`);
    params.push(partnerType);
  }

  // tax_invoice_yn 동기화
  if (receiptStatus === 'issued') {
    updates.push(`tax_invoice_yn = true`);
  }

  updates.push(`updated_at = NOW()`);

  params.push(transactionId);

  const result = await db.query(`
    UPDATE finance_transactions
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params);

  if (result.rows.length === 0) {
    throw new Error('거래를 찾을 수 없습니다');
  }

  return result.rows[0];
}

/**
 * 증빙 현황 통계
 */
async function getReceiptStats(year, month) {
  if (!db) throw new Error('DB 연결 필요');

  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;

  // 이번 달 통계
  const statsResult = await db.query(`
    SELECT
      receipt_status,
      receipt_type,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM finance_transactions
    WHERE type = 'income'
      AND EXTRACT(YEAR FROM transaction_date) = $1
      AND EXTRACT(MONTH FROM transaction_date) = $2
    GROUP BY receipt_status, receipt_type
  `, [targetYear, targetMonth]);

  // 집계
  const stats = {
    period: { year: targetYear, month: targetMonth },
    pending: { count: 0, amount: 0 },
    issued: { count: 0, amount: 0 },
    notRequired: { count: 0, amount: 0 },
    byType: {
      tax_invoice: { pending: 0, issued: 0 },
      cash_receipt_deduction: { pending: 0, issued: 0 },
      cash_receipt_expense: { pending: 0, issued: 0 },
      none: { count: 0 }
    }
  };

  statsResult.rows.forEach(row => {
    const count = parseInt(row.count);
    const amount = parseFloat(row.total_amount || 0);

    if (row.receipt_status === 'pending') {
      stats.pending.count += count;
      stats.pending.amount += amount;
    } else if (row.receipt_status === 'issued') {
      stats.issued.count += count;
      stats.issued.amount += amount;
    } else if (row.receipt_status === 'not_required') {
      stats.notRequired.count += count;
      stats.notRequired.amount += amount;
    }

    if (row.receipt_type && stats.byType[row.receipt_type]) {
      if (row.receipt_status === 'pending') {
        stats.byType[row.receipt_type].pending = count;
      } else if (row.receipt_status === 'issued') {
        stats.byType[row.receipt_type].issued = count;
      }
    }
  });

  // 발행률 계산
  const totalNeedIssue = stats.pending.count + stats.issued.count;
  stats.issueRate = totalNeedIssue > 0
    ? Math.round((stats.issued.count / totalNeedIssue) * 100)
    : 100;

  stats.generatedAt = new Date().toISOString();

  return stats;
}

/**
 * 증빙 발행 기한 체크 알림
 */
async function checkReceiptDeadlineAlerts() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const alerts = [];

  // 익월 5~10일 사이에만 알림
  if (dayOfMonth >= 5 && dayOfMonth <= 10) {
    const deadlineInfo = await getDeadlineReceipts();

    if (deadlineInfo.total > 0) {
      alerts.push({
        type: deadlineInfo.isOverdue ? 'danger' : deadlineInfo.isUrgent ? 'warning' : 'info',
        icon: deadlineInfo.isOverdue ? '🚨' : '⚠️',
        title: deadlineInfo.isOverdue ? '증빙 발행 기한 초과' : '증빙 발행 기한 임박',
        message: deadlineInfo.message,
        count: deadlineInfo.total,
        deadline: deadlineInfo.deadline,
        daysRemaining: deadlineInfo.daysUntilDeadline,
        actionUrl: '/admin/finance-receipts.html'
      });
    }
  }

  return alerts;
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
  getBudgetStatus,

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

  // AI 인사이트 (Phase 2)
  generateInsights,

  // 엑셀 Import/Export (Phase 2)
  exportToExcel,
  importFromExcel,

  // 증빙 발행 시스템 (Phase 3)
  getPendingReceipts,
  getDeadlineReceipts,
  issueReceipt,
  updateReceiptStatus,
  getReceiptStats,
  checkReceiptDeadlineAlerts,

  // 유틸리티
  getServiceStatus,

  // 상수
  VAT_RATE,
  WITHHOLDING_RATE,
  TAX_SCHEDULE
};
