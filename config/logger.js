const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 로그 디렉토리 생성
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 커스텀 로그 포맷
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 콘솔용 포맷 (개발 환경)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;

    if (stack) {
      log += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// 전체 로그 (모든 레벨)
const allLogsTransport = new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '30d',
  format: logFormat,
  level: 'silly'
});

// 에러 로그만
const errorLogsTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '30d',
  format: logFormat,
  level: 'error'
});

// 접근 로그 (HTTP 요청)
const accessLogsTransport = new DailyRotateFile({
  filename: path.join(logDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '30d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  level: 'info'
});

// 메인 로거
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: {
    service: 'daily-miracles',
    version: '1.0.0'
  },
  transports: [
    allLogsTransport,
    errorLogsTransport
  ],
  // 예외 처리
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  // 처리되지 않은 Promise 거부 처리
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: logFormat
    })
  ],
  exitOnError: false
});

// 개발 환경에서는 콘솔에도 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// HTTP 접근 로그용 별도 로거
const accessLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [accessLogsTransport],
  exitOnError: false
});

// Express 미들웨어용 로거
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      contentLength: res.get('content-length') || 0,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      duration: `${duration}ms`
    };

    if (res.statusCode >= 400) {
      accessLogger.warn('HTTP Error', logData);
    } else {
      accessLogger.info('HTTP Request', logData);
    }
  });

  next();
};

// 로그 레벨별 헬퍼 함수들
const logHelpers = {
  // 일반 정보 로그
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  // 경고 로그
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  // 에러 로그
  error: (message, error = null, meta = {}) => {
    const logMeta = { ...meta };

    if (error instanceof Error) {
      logMeta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    } else if (error) {
      logMeta.error = error;
    }

    logger.error(message, logMeta);
  },

  // 디버그 로그
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },

  // 데이터베이스 관련 로그
  database: (action, details = {}) => {
    logger.info(`Database ${action}`, {
      category: 'database',
      ...details
    });
  },

  // OpenAI API 관련 로그
  openai: (action, details = {}) => {
    logger.info(`OpenAI ${action}`, {
      category: 'openai',
      ...details
    });
  },

  // 스토리 생성 관련 로그
  story: (action, storyId, details = {}) => {
    logger.info(`Story ${action}`, {
      category: 'story',
      storyId,
      ...details
    });
  }
};

// 서버 시작 시 로그 디렉토리 정보 출력
logger.info('Logger initialized', {
  logDirectory: logDir,
  environment: process.env.NODE_ENV || 'development',
  logLevel: logger.level
});

module.exports = {
  logger,
  accessLogger,
  requestLogger,
  ...logHelpers
};