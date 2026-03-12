const { error: logError } = require('../config/logger');
const {
  AppError, ValidationError, DatabaseError, OpenAIError, ServiceLimitError,
  createError, isOperationalError,
} = require('../utils/errors');
const alertCooldown = require('./alertCooldown');

// ── Slack sender (injected at init to avoid circular deps) ──
let _slackSender = null;

function initSlackSender(sendFn) {
  _slackSender = sendFn;
}

/**
 * Slack alert for 500-level request errors (non-crash, no exit).
 * Fire-and-forget — never blocks the HTTP response.
 * P2.3: Applies cooldown to prevent alert fatigue.
 */
function sendErrorAlert(err, req, errorClass, severity) {
  if (!_slackSender) return;

  const statusCode = err.statusCode || 500;
  const cooldownKey = alertCooldown.constructor.buildKey({
    errorClass,
    route: `${req.method} ${req.originalUrl}`,
    statusCode,
  });

  // Determine severity tier for cooldown interval
  const cooldownSeverity = statusCode >= 500 ? null : 'degraded'; // 500s use default 5min
  const { allowed, cooldown_suppressed, suppressedCount } = alertCooldown.check(cooldownKey, cooldownSeverity);

  if (!allowed) {
    logError('Slack alert suppressed (cooldown)', null, {
      cooldown_suppressed: true,
      key: cooldownKey,
      suppressedCount,
    });
    return;
  }

  const msg = {
    text: `${severity} Server Error: ${errorClass}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `${severity} Server Error: ${errorClass}`, emoji: true } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Route:*\n\`${req.method} ${req.originalUrl}\`` },
          { type: 'mrkdwn', text: `*Request ID:*\n\`${req.requestId || 'N/A'}\`` },
          { type: 'mrkdwn', text: `*Error Class:*\n${errorClass}` },
          { type: 'mrkdwn', text: `*Status:*\n${statusCode}` },
        ],
      },
      { type: 'section', text: { type: 'mrkdwn', text: `\`\`\`${String(err.stack || err.message).slice(0, 1500)}\`\`\`` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `env: ${process.env.NODE_ENV || 'dev'} | pid: ${process.pid} | ${new Date().toISOString()}` }] },
    ],
  };

  _slackSender(msg).catch(() => {});
}

// ── Response formatters ──────────────────────────────────────

function sendErrorDev(err, req, res) {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      status: err.statusCode || 500,
      error_class: err.errorClass || 'Unknown',
      errorCode: err.errorCode || 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack,
      request_id: req.requestId || null,
      timestamp: err.timestamp || new Date().toISOString(),
      ...(err.field && { field: err.field }),
      ...(err.resource && { resource: err.resource }),
      ...(err.resourceId && { resourceId: err.resourceId }),
    },
  });
}

function sendErrorProd(err, req, res) {
  if (isOperationalError(err)) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        status: err.statusCode,
        error_class: err.errorClass || 'Unknown',
        errorCode: err.errorCode,
        message: createError.userFriendly(err),
        request_id: req.requestId || null,
        timestamp: err.timestamp || new Date().toISOString(),
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        status: 500,
        error_class: err.errorClass || 'Unknown',
        errorCode: 'INTERNAL_ERROR',
        message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        request_id: req.requestId || null,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// ── Type-specific error handlers ─────────────────────────────

function handleSQLiteError(error) {
  let message = '데이터베이스 작업 중 오류가 발생했습니다.';
  let errorCode = 'DATABASE_ERROR';

  switch (error.code) {
    case 'SQLITE_CONSTRAINT':
      message = '데이터 제약 조건 위반입니다.';
      errorCode = 'CONSTRAINT_VIOLATION';
      break;
    case 'SQLITE_BUSY':
      message = '데이터베이스가 사용 중입니다. 잠시 후 다시 시도해주세요.';
      errorCode = 'DATABASE_BUSY';
      break;
    case 'SQLITE_LOCKED':
      message = '데이터베이스가 잠겨있습니다. 잠시 후 다시 시도해주세요.';
      errorCode = 'DATABASE_LOCKED';
      break;
    case 'SQLITE_CORRUPT':
      message = '데이터베이스 파일에 문제가 있습니다.';
      errorCode = 'DATABASE_CORRUPT';
      break;
    case 'SQLITE_NOTADB':
      message = '데이터베이스 파일이 유효하지 않습니다.';
      errorCode = 'INVALID_DATABASE';
      break;
    default:
      if (error.message.includes('no such table')) {
        message = '필요한 데이터 테이블이 존재하지 않습니다.';
        errorCode = 'TABLE_NOT_FOUND';
      } else if (error.message.includes('no such column')) {
        message = '데이터 구조에 문제가 있습니다.';
        errorCode = 'COLUMN_NOT_FOUND';
      }
      break;
  }

  return createError.database(message, error);
}

function handleOpenAIError(error) {
  let message = 'AI 서비스 처리 중 오류가 발생했습니다.';

  if (error.status === 401) {
    message = 'AI 서비스 인증에 실패했습니다.';
  } else if (error.status === 429) {
    message = '현재 AI 서비스 요청이 많습니다. 잠시 후 다시 시도해주세요.';
  } else if (error.status >= 500) {
    message = 'AI 서비스가 일시적으로 사용할 수 없습니다.';
  } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
    message = 'AI 서비스에 연결할 수 없습니다.';
  }

  return createError.openai(message, error);
}

function handleValidationError(error) {
  const errors = [];

  if (error.details) {
    error.details.forEach((detail) => {
      errors.push({ field: detail.path.join('.'), message: detail.message });
    });
  } else if (error.errors) {
    Object.keys(error.errors).forEach((key) => {
      errors.push({ field: key, message: error.errors[key].message });
    });
  }

  const message = errors.length > 0
    ? `입력 값 검증 실패: ${errors.map((e) => e.message).join(', ')}`
    : '입력 값이 올바르지 않습니다.';

  const validationError = createError.validation(message);
  validationError.validationErrors = errors;
  return validationError;
}

function handleSystemError(error) {
  let message = '시스템 오류가 발생했습니다.';
  let errorCode = 'SYSTEM_ERROR';

  switch (error.code) {
    case 'ENOENT':
      message = '필요한 파일을 찾을 수 없습니다.';
      errorCode = 'FILE_NOT_FOUND';
      break;
    case 'EACCES':
      message = '파일 접근 권한이 없습니다.';
      errorCode = 'ACCESS_DENIED';
      break;
    case 'EMFILE':
    case 'ENFILE':
      message = '시스템 리소스가 부족합니다.';
      errorCode = 'RESOURCE_EXHAUSTED';
      break;
    case 'ECONNRESET':
      message = '네트워크 연결이 끊어졌습니다.';
      errorCode = 'CONNECTION_RESET';
      break;
    case 'ETIMEDOUT':
      message = '요청 시간이 초과되었습니다.';
      errorCode = 'TIMEOUT';
      break;
    default:
      if (error.message.includes('EPERM')) {
        message = '작업 권한이 없습니다.';
        errorCode = 'PERMISSION_DENIED';
      }
      break;
  }

  return new AppError(message, 500, errorCode);
}

// ── Central error handler middleware ──────────────────────────

function globalErrorHandler(err, req, res, next) {
  // Prevent double-send
  if (res.headersSent) return next(err);

  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  let errorClass = 'Unknown';

  // ── Error classification ──
  if (err.name === 'CastError') {
    error = createError.validation('잘못된 ID 형식입니다.');
    errorClass = 'Validation';
  } else if (err.code && String(err.code).startsWith('SQLITE_')) {
    error = handleSQLiteError(err);
    errorClass = 'DB';
  } else if (err.name === 'ValidationError' || err instanceof ValidationError) {
    error = handleValidationError(err);
    errorClass = 'Validation';
  } else if (err instanceof DatabaseError) {
    error = err;
    errorClass = 'DB';
  } else if (err.type === 'entity.parse.failed' || (err.status === 400 && err.body !== undefined)) {
    // express.json() body parse failure — NOT an OpenAI error
    error = createError.validation('요청 본문이 올바른 JSON 형식이 아닙니다.');
    errorClass = 'Validation';
  } else if (err.code && ['ENOENT', 'EACCES', 'EMFILE', 'ENFILE', 'ECONNRESET', 'ETIMEDOUT'].includes(err.code)) {
    error = handleSystemError(err);
    errorClass = 'System';
  } else if (err instanceof OpenAIError || (err.status && err.status >= 400 && err.status < 500 && err.status !== 400)) {
    error = handleOpenAIError(err);
    errorClass = 'OpenAI/External';
  } else if (err instanceof ServiceLimitError || err.statusCode === 429) {
    error = err instanceof AppError ? err : createError.serviceLimit();
    errorClass = 'RateLimit';
  } else if (!(err instanceof AppError)) {
    error = new AppError('서버 내부 오류가 발생했습니다.', 500, 'INTERNAL_ERROR', false);
    errorClass = 'Unknown';
  }

  error.errorClass = errorClass;
  const statusCode = error.statusCode || 500;
  const severity = statusCode >= 500 ? '🔴' : '🟡';

  // ── Logging ──
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId || 'N/A',
    ip: req.ip || req.connection?.remoteAddress,
  };

  if (statusCode >= 500) {
    logError('Server Error', err, { request: requestInfo, errorClass, severity });
    sendErrorAlert(err, req, errorClass, severity);
  } else {
    logError('Client Error', null, { request: requestInfo, errorClass, message: error.message });
  }

  // ── Response ──
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
}

// ── 404 handler ──────────────────────────────────────────────

function notFoundHandler(req, res, next) {
  const error = createError.notFound('API 경로', req.originalUrl);
  next(error);
}

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  initSlackSender,
};
