const { error: logError } = require('../config/logger');
const { AppError, createError, isOperationalError } = require('../utils/errors');

// 개발 환경에서 상세한 에러 정보 반환
function sendErrorDev(err, res) {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      status: err.statusCode || 500,
      errorCode: err.errorCode || 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack,
      timestamp: err.timestamp || new Date().toISOString(),
      ...(err.field && { field: err.field }),
      ...(err.resource && { resource: err.resource }),
      ...(err.resourceId && { resourceId: err.resourceId })
    }
  });
}

// 프로덕션 환경에서 사용자 친화적 에러 메시지 반환
function sendErrorProd(err, res) {
  // 운영상 에러 (클라이언트에게 안전하게 노출 가능)
  if (isOperationalError(err)) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        status: err.statusCode,
        errorCode: err.errorCode,
        message: createError.userFriendly(err),
        timestamp: err.timestamp || new Date().toISOString()
      }
    });
  } else {
    // 프로그래밍 에러 (일반적인 메시지만 반환)
    res.status(500).json({
      success: false,
      error: {
        status: 500,
        errorCode: 'INTERNAL_ERROR',
        message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// SQLite 에러 처리
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

// OpenAI 에러 처리
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

// 유효성 검사 에러 처리
function handleValidationError(error) {
  const errors = [];

  if (error.details) {
    // Joi 검증 에러
    error.details.forEach(detail => {
      errors.push({
        field: detail.path.join('.'),
        message: detail.message
      });
    });
  } else if (error.errors) {
    // Mongoose 검증 에러
    Object.keys(error.errors).forEach(key => {
      errors.push({
        field: key,
        message: error.errors[key].message
      });
    });
  }

  const message = errors.length > 0
    ? `입력 값 검증 실패: ${errors.map(e => e.message).join(', ')}`
    : '입력 값이 올바르지 않습니다.';

  const validationError = createError.validation(message);
  validationError.validationErrors = errors;
  return validationError;
}

// 네트워크/시스템 에러 처리
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

// 중앙화된 에러 핸들러 미들웨어
function globalErrorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // 요청 정보 로깅
  const requestInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  };

  // 특정 에러 타입별 처리
  if (err.name === 'CastError') {
    error = createError.validation('잘못된 ID 형식입니다.');
  } else if (err.code && err.code.startsWith('SQLITE_')) {
    error = handleSQLiteError(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.status && err.status >= 400 && err.status < 500) {
    // OpenAI API 에러
    error = handleOpenAIError(err);
  } else if (err.code && ['ENOENT', 'EACCES', 'EMFILE', 'ENFILE', 'ECONNRESET', 'ETIMEDOUT'].includes(err.code)) {
    error = handleSystemError(err);
  } else if (!(err instanceof AppError)) {
    // 예상치 못한 에러
    error = new AppError('서버 내부 오류가 발생했습니다.', 500, 'INTERNAL_ERROR', false);
  }

  // 에러 로깅
  if (error.statusCode >= 500) {
    logError('Server Error', err, {
      request: requestInfo,
      errorCode: error.errorCode,
      isOperational: error.isOperational
    });
  } else {
    logError('Client Error', null, {
      request: requestInfo,
      errorCode: error.errorCode,
      message: error.message,
      statusCode: error.statusCode
    });
  }

  // 응답 전송
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
}

// 404 에러 핸들러
function notFoundHandler(req, res, next) {
  const error = createError.notFound('페이지', req.originalUrl);
  next(error);
}

// 처리되지 않은 Promise 거부 처리
function handleUnhandledRejection() {
  process.on('unhandledRejection', (err, promise) => {
    logError('Unhandled Promise Rejection', err, {
      promise: promise.toString()
    });
  });
}

// 처리되지 않은 예외 처리
function handleUncaughtException() {
  process.on('uncaughtException', (err) => {
    logError('Uncaught Exception', err);

    // Graceful shutdown
    process.exit(1);
  });
}

// 에러 핸들링 초기화
function initializeErrorHandling() {
  handleUnhandledRejection();
  handleUncaughtException();

  console.log('✅ 전역 에러 핸들링 초기화 완료');
}

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  initializeErrorHandling
};