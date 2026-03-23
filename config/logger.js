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

// ─────────────────────────────────────────────────────────────
// In-process request stats ring buffer
// AIL-2026-0301-OPS-ERR-REPORT-002
// - 최대 50,000 엔트리 또는 24h 이내의 요청만 보관
// - errorRateMonitor.js 가 getRecentStats(5min) 으로 소비
// - reportScheduler.js 가 getDailyStats(24h) 으로 소비
// ─────────────────────────────────────────────────────────────

const _REQUEST_BUFFER = [];
const _BUFFER_MAX_ENTRIES = 50_000;
const _BUFFER_MAX_AGE_MS  = 24 * 60 * 60 * 1000; // 24h

function _pushToBuffer(entry) {
  _REQUEST_BUFFER.push(entry);
  if (_REQUEST_BUFFER.length > _BUFFER_MAX_ENTRIES) {
    _REQUEST_BUFFER.shift();
  }
}

function _pruneBuffer() {
  const cutoff = Date.now() - _BUFFER_MAX_AGE_MS;
  while (_REQUEST_BUFFER.length > 0 && _REQUEST_BUFFER[0].ts < cutoff) {
    _REQUEST_BUFFER.shift();
  }
}

function _aggregateWindow(entries) {
  const total = entries.length;
  const errorEntries = entries.filter(e => e.isError);
  const errorRate = total > 0 ? errorEntries.length / total : 0;

  const byClass = {};
  const byEndpoint = {};
  for (const e of errorEntries) {
    const cls = e.error_class || `HTTP${e.statusCode}`;
    byClass[cls] = (byClass[cls] || 0) + 1;
    const ep = `${e.method} ${e.url}`;
    byEndpoint[ep] = (byEndpoint[ep] || 0) + 1;
  }

  const topClassEntry  = Object.entries(byClass).sort((a, b) => b[1] - a[1])[0]    || null;
  const topEndpointEntry = Object.entries(byEndpoint).sort((a, b) => b[1] - a[1])[0] || null;
  const recentRequestIds = errorEntries.slice(-5).map(e => e.requestId).filter(Boolean);

  return {
    total,
    errors: errorEntries.length,
    errorRate,
    byClass,
    topErrorClass:  topClassEntry    ? { class: topClassEntry[0],    count: topClassEntry[1]    } : null,
    topEndpoint:    topEndpointEntry ? { endpoint: topEndpointEntry[0], count: topEndpointEntry[1] } : null,
    recentRequestIds,
  };
}

/**
 * 최근 windowMs 동안의 HTTP 요청 통계를 반환한다.
 * @param {number} windowMs - 집계 윈도우 (ms). 기본 5분.
 * @returns {{ total, errors, errorRate, byClass, topErrorClass, topEndpoint, recentRequestIds, windowFrom, windowTo }}
 */
function getRecentStats(windowMs = 5 * 60 * 1000) {
  _pruneBuffer();
  const cutoff = Date.now() - windowMs;
  const window = _REQUEST_BUFFER.filter(e => e.ts >= cutoff);
  return {
    ..._aggregateWindow(window),
    windowFrom: new Date(cutoff).toISOString(),
    windowTo:   new Date().toISOString(),
    windowMs,
  };
}

/**
 * 최근 hours 시간 동안의 HTTP 요청 통계를 반환한다.
 * @param {number} hours - 집계 기간 (시간). 기본 24시간.
 */
function getDailyStats(hours = 24) {
  return getRecentStats(hours * 60 * 60 * 1000);
}

// ── Express 미들웨어 ──
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const isError = res.statusCode >= 400 || !!res._errorClass;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      requestId: req.requestId || null,
      headersSent: res.headersSent,
      error_class: res._errorClass || null,
    };
    if (isError) {
      accessLogger.warn('HTTP Error', logData);
    } else {
      accessLogger.info('HTTP Request', logData);
    }
    // In-process ring buffer (AIL-2026-0301-OPS-ERR-REPORT-002)
    _pushToBuffer({
      ts:          Date.now(),
      method:      logData.method,
      url:         logData.url,
      statusCode:  logData.statusCode,
      error_class: logData.error_class,
      requestId:   logData.requestId,
      isError,
    });
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
  // Stats buffer (AIL-2026-0301-OPS-ERR-REPORT-002)
  getRecentStats,
  getDailyStats,
  ...logHelpers,
};
