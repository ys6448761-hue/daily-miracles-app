const winston = require('winston');
const path = require('path');

// Vercel Serverless 환경 감지 (읽기전용 /var/task 파일시스템)
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

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

let logger, accessLogger;

if (IS_SERVERLESS) {
  // ── Serverless: Console transport만 사용 (파일 I/O 없음) ──
  logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'daily-miracles', version: '1.0.0' },
    transports: [
      new winston.transports.Console({ format: consoleFormat })
    ],
    exitOnError: false
  });

  accessLogger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({ format: consoleFormat })
    ],
    exitOnError: false
  });

  logger.info('Logger initialized (serverless mode — console only)');
} else {
  // ── 일반 환경: 파일 transport 사용 ──
  const DailyRotateFile = require('winston-daily-rotate-file');
  const fs = require('fs');

  const logDir = path.join(process.cwd(), 'logs');
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (err) {
    console.warn('[Logger] logs 디렉토리 생성 실패 (계속 실행):', err.message);
  }

  const allLogsTransport = new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '30d',
    format: logFormat,
    level: 'silly'
  });

  const errorLogsTransport = new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '30d',
    format: logFormat,
    level: 'error'
  });

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

  logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'daily-miracles', version: '1.0.0' },
    transports: [allLogsTransport, errorLogsTransport],
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log'),
        format: logFormat
      })
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'rejections.log'),
        format: logFormat
      })
    ],
    exitOnError: false
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    }));
  }

  accessLogger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [accessLogsTransport],
    exitOnError: false
  });

  logger.info('Logger initialized', {
    logDirectory: logDir,
    environment: process.env.NODE_ENV || 'development',
    logLevel: logger.level
  });
}

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

module.exports = {
  logger,
  accessLogger,
  requestLogger,
  ...logHelpers
};