// 기본 애플리케이션 에러 클래스
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      isOperational: this.isOperational
    };
  }
}

// 검증 관련 에러
class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

// 데이터베이스 관련 에러
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

// OpenAI API 관련 에러
class OpenAIError extends AppError {
  constructor(message, apiError = null) {
    super(message, 503, 'OPENAI_ERROR');
    this.apiError = apiError;

    // OpenAI 에러 코드에 따른 세분화
    if (apiError) {
      if (apiError.status === 429) {
        this.statusCode = 429;
        this.errorCode = 'RATE_LIMITED';
        this.message = '현재 요청이 많아 잠시 후 다시 시도해주세요.';
      } else if (apiError.status === 401) {
        this.statusCode = 500;
        this.errorCode = 'API_KEY_ERROR';
        this.message = 'AI 서비스 설정에 문제가 있습니다.';
      } else if (apiError.status >= 500) {
        this.statusCode = 503;
        this.errorCode = 'AI_SERVICE_UNAVAILABLE';
        this.message = 'AI 서비스가 일시적으로 사용할 수 없습니다.';
      }
    }
  }
}

// 파일 처리 관련 에러
class FileError extends AppError {
  constructor(message, filePath = null) {
    super(message, 500, 'FILE_ERROR');
    this.filePath = filePath;
  }
}

// 리소스를 찾을 수 없음 에러
class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
    this.resourceId = id;
  }
}

// 권한 관련 에러
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// 동시성 관련 에러
class ConcurrencyError extends AppError {
  constructor(message = 'Resource is currently being processed') {
    super(message, 409, 'CONCURRENCY_ERROR');
  }
}

// 서비스 제한 관련 에러
class ServiceLimitError extends AppError {
  constructor(message = 'Service limit exceeded') {
    super(message, 429, 'SERVICE_LIMIT_ERROR');
  }
}

// 에러 생성 헬퍼 함수들
const createError = {
  validation: (message, field = null) => new ValidationError(message, field),

  database: (message, originalError = null) => new DatabaseError(message, originalError),

  openai: (message, apiError = null) => new OpenAIError(message, apiError),

  file: (message, filePath = null) => new FileError(message, filePath),

  notFound: (resource = 'Resource', id = null) => new NotFoundError(resource, id),

  authorization: (message = 'Access denied') => new AuthorizationError(message),

  concurrency: (message = 'Resource is currently being processed') => new ConcurrencyError(message),

  serviceLimit: (message = 'Service limit exceeded') => new ServiceLimitError(message),

  // 사용자 친화적 메시지로 변환
  userFriendly: (error) => {
    const friendlyMessages = {
      'VALIDATION_ERROR': '입력하신 정보를 다시 확인해주세요.',
      'DATABASE_ERROR': '데이터 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      'OPENAI_ERROR': 'AI 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      'RATE_LIMITED': '현재 요청이 많습니다. 잠시 후 다시 시도해주세요.',
      'API_KEY_ERROR': '서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.',
      'AI_SERVICE_UNAVAILABLE': 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
      'FILE_ERROR': '파일 처리 중 문제가 발생했습니다.',
      'NOT_FOUND': '요청하신 내용을 찾을 수 없습니다.',
      'AUTHORIZATION_ERROR': '접근 권한이 없습니다.',
      'CONCURRENCY_ERROR': '다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.',
      'SERVICE_LIMIT_ERROR': '서비스 이용 한도를 초과했습니다.',
      'INTERNAL_ERROR': '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    };

    if (error instanceof AppError) {
      return friendlyMessages[error.errorCode] || error.message;
    }

    return friendlyMessages['INTERNAL_ERROR'];
  }
};

// 에러가 운영상 에러인지 확인 (로깅 레벨 결정에 사용)
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  OpenAIError,
  FileError,
  NotFoundError,
  AuthorizationError,
  ConcurrencyError,
  ServiceLimitError,
  createError,
  isOperationalError
};