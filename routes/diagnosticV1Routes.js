// ═══════════════════════════════════════════════════════════
// Diagnostic API v1 Routes — SSOT-locked
//
// Mount points (server.js):
//   app.use('/v1/diagnostic', router)  → POST /v1/diagnostic/submit
//   app.use('/v1/marketing',  router)  → GET  /v1/marketing/segment/today
//
// Error format: { ok: false, error: { type, message, request_id } }
// ═══════════════════════════════════════════════════════════

'use strict';

const express = require('express');
const router = express.Router();

const {
  validateSubmit,
  submitDiagnostic,
  getTodaySegment,
} = require('../services/diagnosticV1Service');

const { ValidationError, NotFoundError } = require('../utils/errors');

// ── POST /v1/diagnostic/submit ─────────────────────────────
router.post('/submit', (req, res, next) => {
  try {
    const { user_key, date, answers, et } = req.body || {};

    validateSubmit({ user_key, answers });

    const { idempotent, result } = submitDiagnostic({
      user_key: user_key.trim(),
      date: date || undefined,
      answers,
      et: typeof et === 'number' ? et : null,
    });

    return res.status(200).json({ ok: true, idempotent, result });
  } catch (err) {
    return next(err);
  }
});

// ── GET /v1/marketing/segment/today ────────────────────────
router.get('/segment/today', (req, res, next) => {
  try {
    const user_key = req.query.user_key;

    if (!user_key || typeof user_key !== 'string' || user_key.trim() === '') {
      throw new ValidationError('user_key query parameter는 필수입니다.', 'user_key');
    }

    const segment = getTodaySegment({ user_key: user_key.trim() });

    if (!segment) {
      throw new NotFoundError('오늘의 진단 결과', user_key);
    }

    return res.status(200).json({ ok: true, segment });
  } catch (err) {
    return next(err);
  }
});

// ── v1 Local Error Handler ─────────────────────────────────
router.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);

  const {
    AppError,
    ValidationError: VE,
    NotFoundError: NFE,
    ServiceLimitError: SLE,
    DatabaseError: DBE,
  } = require('../utils/errors');

  let type = 'Unknown';
  let statusCode = 500;
  let message = '서버 오류가 발생했습니다.';

  if (err instanceof VE) {
    type = 'Validation';
    statusCode = 400;
    message = err.message;
  } else if (err instanceof NFE) {
    type = 'NotFound';
    statusCode = 404;
    message = err.message;
  } else if (err instanceof DBE) {
    type = 'DB';
    statusCode = 500;
    message = '데이터 오류가 발생했습니다.';
  } else if (err instanceof SLE || err.statusCode === 429) {
    type = 'RateLimit';
    statusCode = 429;
    message = err.message;
  } else if (err instanceof AppError) {
    type = 'System';
    statusCode = err.statusCode || 500;
    message = err.message;
  }

  return res.status(statusCode).json({
    ok: false,
    error: {
      type,
      message,
      request_id: _req.requestId || null,
    },
  });
});

module.exports = router;
