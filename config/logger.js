const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ── serverless 감지 ──
const isServerless =
  !!process.env.VERCEL ||
  !!process.env.NOW_REGION ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// ── 안전한 디렉토리 결정 ──
const baseDir = isServerless
  ? path.join(os.tmpdir(), 'daily-miracles')
  : process.cwd();
const logDir = path.join(baseDir, 'logs');

// ── 디렉토리 생성은 "안전하게" (절대 throw 금지) ──
function ensureDirSafe(dir) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (e) {
    console.warn('[logger] failed to ensure log dir; falling back to console-only', {
      dir,
      code: e && e.code,
      message: e && e.message,
    });
    return false;
  }
}

// ── 커스텀 로그 포맷 ──
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// ── 콘솔용 포맷 (개발/서버리스) ──
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0) log += `\n${JSON.stringify(meta, null, 2)}`;
    return log;
  })
);

// ── Transport 구성 ──
const transports = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || (isServerless ? 'info' : 'debug'),
    format: consoleFormat,
  }),
];

// 로컬/VM 환경에서만 파일 로깅 허용 (serverless면 진입 금지)
if (!isServerless) {
  const ok = ensureDirSafe(logDir);
  if (ok) {
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: process.env.LOG_LEVEL || 'info',
        format: logFormat,
      })
    );
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'daily-miracles', version: '1.0.0' },
  transports,
  exitOnError: false,
});

// ── HTTP 접근 로그 (console 기반, accessLogger 대체) ──
const accessLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: consoleFormat })],
  exitOnError: false,
});

// ── Express 미들웨어 ──
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method, url: req.url, statusCode: res.statusCode,
      contentLength: res.get('content-length') || 0,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      duration: `${duration}ms`,
    };
    if (res.statusCode >= 400) {
      accessLogger.warn('HTTP Error', logData);
    } else {
      accessLogger.info('HTTP Request', logData);
    }
  });
  next();
};

// ── 로그 헬퍼 (기존 destructured import 호환) ──
const logHelpers = {
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, error = null, meta = {}) => {
    const logMeta = { ...meta };
    if (error instanceof Error) {
      logMeta.error = { name: error.name, message: error.message, stack: error.stack, code: error.code };
    } else if (error) {
      logMeta.error = error;
    }
    logger.error(message, logMeta);
  },
  debug: (message, meta = {}) => logger.debug(message, meta),
  database: (action, details = {}) => logger.info(`Database ${action}`, { category: 'database', ...details }),
  openai: (action, details = {}) => logger.info(`OpenAI ${action}`, { category: 'openai', ...details }),
  story: (action, storyId, details = {}) => logger.info(`Story ${action}`, { category: 'story', storyId, ...details }),
};

module.exports = {
  logger,
  accessLogger,
  requestLogger,
  isServerless,
  ...logHelpers,
};
