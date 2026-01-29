/**
 * 기적 금고 (Miracle Treasury) - API 라우트
 *
 * 통합 재무관리 시스템 API 엔드포인트
 *
 * @module routes/financeRoutes
 * @version 1.0.0 - 2025.01.29
 */

const express = require('express');
const router = express.Router();

// 서비스 로드
let financeService;
try {
  financeService = require('../services/financeService');
} catch (e) {
  console.error('[FinanceRoutes] 서비스 로드 실패:', e.message);
}

// ============ 미들웨어 ============

/**
 * 에러 핸들러
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 서비스 체크
 */
function checkService(req, res, next) {
  if (!financeService) {
    return res.status(503).json({
      success: false,
      error: '재무 서비스를 사용할 수 없습니다'
    });
  }
  next();
}

router.use(checkService);

// ============ 거래 관리 API ============

/**
 * POST /api/finance/transactions - 거래 등록
 */
router.post('/transactions', asyncHandler(async (req, res) => {
  const data = req.body;

  // 필수 필드 검증
  if (!data.type || !data.amount || !data.description || !data.transactionDate) {
    return res.status(400).json({
      success: false,
      error: '필수 항목이 누락되었습니다 (type, amount, description, transactionDate)'
    });
  }

  if (!['income', 'expense'].includes(data.type)) {
    return res.status(400).json({
      success: false,
      error: 'type은 income 또는 expense여야 합니다'
    });
  }

  const transaction = await financeService.createTransaction(data);

  res.status(201).json({
    success: true,
    data: transaction,
    message: '거래가 등록되었습니다'
  });
}));

/**
 * GET /api/finance/transactions - 거래 목록 조회
 */
router.get('/transactions', asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    type,
    categoryId,
    partnerId,
    paymentMethod,
    limit,
    offset,
    orderBy,
    orderDir
  } = req.query;

  const result = await financeService.getTransactions({
    startDate,
    endDate,
    type,
    categoryId: categoryId ? parseInt(categoryId) : null,
    partnerId: partnerId ? parseInt(partnerId) : null,
    paymentMethod,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
    orderBy,
    orderDir
  });

  res.json({
    success: true,
    ...result
  });
}));

/**
 * GET /api/finance/transactions/:id - 거래 상세 조회
 */
router.get('/transactions/:id', asyncHandler(async (req, res) => {
  const transaction = await financeService.getTransaction(parseInt(req.params.id));

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: '거래를 찾을 수 없습니다'
    });
  }

  res.json({
    success: true,
    data: transaction
  });
}));

/**
 * PUT /api/finance/transactions/:id - 거래 수정
 */
router.put('/transactions/:id', asyncHandler(async (req, res) => {
  const transaction = await financeService.updateTransaction(
    parseInt(req.params.id),
    req.body
  );

  res.json({
    success: true,
    data: transaction,
    message: '거래가 수정되었습니다'
  });
}));

/**
 * DELETE /api/finance/transactions/:id - 거래 삭제
 */
router.delete('/transactions/:id', asyncHandler(async (req, res) => {
  const result = await financeService.deleteTransaction(parseInt(req.params.id));

  res.json({
    success: true,
    message: '거래가 삭제되었습니다',
    deleted: result.deleted
  });
}));

// ============ 카테고리 API ============

/**
 * GET /api/finance/categories - 카테고리 목록
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const categories = await financeService.getCategories(type);

  res.json({
    success: true,
    data: categories
  });
}));

/**
 * POST /api/finance/categories/suggest - 카테고리 자동 추천
 */
router.post('/categories/suggest', asyncHandler(async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({
      success: false,
      error: 'description이 필요합니다'
    });
  }

  const suggestion = await financeService.suggestCategory(description);

  res.json({
    success: true,
    data: suggestion,
    hasSuggestion: !!suggestion
  });
}));

// ============ 거래처 API ============

/**
 * POST /api/finance/partners - 거래처 등록
 */
router.post('/partners', asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data.name) {
    return res.status(400).json({
      success: false,
      error: '거래처명이 필요합니다'
    });
  }

  const partner = await financeService.createPartner(data);

  res.status(201).json({
    success: true,
    data: partner,
    message: '거래처가 등록되었습니다'
  });
}));

/**
 * GET /api/finance/partners - 거래처 목록
 */
router.get('/partners', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const partners = await financeService.getPartners(type);

  res.json({
    success: true,
    data: partners
  });
}));

// ============ 예산 API ============

/**
 * POST /api/finance/budgets - 예산 설정
 */
router.post('/budgets', asyncHandler(async (req, res) => {
  const { year, month, categoryId, amount, alertThreshold, memo } = req.body;

  if (!year || !month || !categoryId || !amount) {
    return res.status(400).json({
      success: false,
      error: '필수 항목이 누락되었습니다 (year, month, categoryId, amount)'
    });
  }

  const budget = await financeService.setBudget({
    year: parseInt(year),
    month: parseInt(month),
    categoryId: parseInt(categoryId),
    amount: parseFloat(amount),
    alertThreshold,
    memo
  });

  res.json({
    success: true,
    data: budget,
    message: '예산이 설정되었습니다'
  });
}));

/**
 * GET /api/finance/budgets/:year/:month - 월별 예산 조회
 */
router.get('/budgets/:year/:month', asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const budgets = await financeService.getBudgets(parseInt(year), parseInt(month));

  res.json({
    success: true,
    data: budgets
  });
}));

// ============ 보고서 API ============

/**
 * GET /api/finance/reports/income-statement/:year/:month - 손익계산서
 */
router.get('/reports/income-statement/:year/:month', asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const report = await financeService.getIncomeStatement(parseInt(year), parseInt(month));

  res.json({
    success: true,
    data: report
  });
}));

/**
 * GET /api/finance/reports/cash-flow/:year/:month - 현금흐름표
 */
router.get('/reports/cash-flow/:year/:month', asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const report = await financeService.getCashFlow(parseInt(year), parseInt(month));

  res.json({
    success: true,
    data: report
  });
}));

/**
 * GET /api/finance/reports/trend/:months - 월별 추이
 */
router.get('/reports/trend/:months', asyncHandler(async (req, res) => {
  const months = parseInt(req.params.months) || 6;
  const report = await financeService.getTrend(Math.min(months, 24));

  res.json({
    success: true,
    data: report
  });
}));

// ============ 세금 API ============

/**
 * GET /api/finance/tax/vat-preview/:year/:quarter - 부가세 예상액
 */
router.get('/tax/vat-preview/:year/:quarter', asyncHandler(async (req, res) => {
  const { year, quarter } = req.params;
  const preview = await financeService.getVATPreview(parseInt(year), parseInt(quarter));

  res.json({
    success: true,
    data: preview
  });
}));

/**
 * GET /api/finance/tax/calendar/:year - 세금 캘린더
 */
router.get('/tax/calendar/:year', asyncHandler(async (req, res) => {
  const calendar = await financeService.getTaxCalendar(parseInt(req.params.year));

  res.json({
    success: true,
    data: calendar
  });
}));

// ============ 대시보드 API ============

/**
 * GET /api/finance/dashboard - 종합 대시보드
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const dashboard = await financeService.getDashboard();

  res.json({
    success: true,
    data: dashboard
  });
}));

// ============ AI 인사이트 API (Phase 2) ============

/**
 * GET /api/finance/dashboard/insights - AI 인사이트 목록
 */
router.get('/dashboard/insights', asyncHandler(async (req, res) => {
  const insights = await financeService.generateInsights();

  res.json({
    success: true,
    data: insights
  });
}));

// ============ 엑셀 Import/Export API (Phase 2) ============

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('엑셀 파일(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다'));
    }
  }
});

/**
 * GET /api/finance/export/excel/:year/:month - 엑셀 내보내기
 */
router.get('/export/excel/:year/:month', asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const result = await financeService.exportToExcel(parseInt(year), parseInt(month));

  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
  res.send(result.buffer);
}));

/**
 * POST /api/finance/import/excel - 엑셀 가져오기
 */
router.post('/import/excel', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '파일이 업로드되지 않았습니다'
    });
  }

  const result = await financeService.importFromExcel(req.file.buffer);

  res.json({
    success: true,
    data: result,
    message: `${result.success}건 등록 완료 (중복 ${result.duplicates}건, 실패 ${result.failed}건)`
  });
}));

// ============ 예산 알림 API (Phase 2) ============

/**
 * GET /api/finance/budgets/status - 예산 대비 실적 현황
 */
router.get('/budgets/status', asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;

  const status = await financeService.getBudgetStatus(year, month);

  res.json({
    success: true,
    data: status
  });
}));

// ============ 상태 API ============

/**
 * GET /api/finance/status - 서비스 상태
 */
router.get('/status', (req, res) => {
  const status = financeService.getServiceStatus();

  res.json({
    success: true,
    data: status
  });
});

// ============ 에러 핸들러 ============

router.use((err, req, res, next) => {
  console.error('[FinanceRoutes] 에러:', err.message);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || '서버 오류가 발생했습니다',
    path: req.path
  });
});

module.exports = router;
