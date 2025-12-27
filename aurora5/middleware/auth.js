/**
 * Aurora5 - 인증 미들웨어
 * API Key 및 Cron Secret 검증
 *
 * @version 1.0
 */

/**
 * Wix Webhook API Key 검증
 * 헤더: X-API-KEY
 */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.WIX_WEBHOOK_API_KEY;

  if (!expectedKey) {
    console.warn('⚠️ WIX_WEBHOOK_API_KEY not configured');
    return next(); // 개발 환경에서는 통과
  }

  if (!apiKey) {
    console.warn('❌ Missing X-API-KEY header');
    return res.status(401).json({
      success: false,
      error: 'Missing API Key',
      hint: 'Include X-API-KEY header'
    });
  }

  if (apiKey !== expectedKey) {
    console.warn('❌ Invalid API Key');
    return res.status(403).json({
      success: false,
      error: 'Invalid API Key'
    });
  }

  next();
}

/**
 * Cron Job Secret 검증
 * 헤더: X-CRON-SECRET 또는 쿼리: ?key=xxx
 */
function verifyCronSecret(req, res, next) {
  const cronSecret = req.headers['x-cron-secret'] || req.query.key;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn('⚠️ CRON_SECRET not configured');
    return next(); // 개발 환경에서는 통과
  }

  if (!cronSecret) {
    console.warn('❌ Missing Cron Secret');
    return res.status(401).json({
      success: false,
      error: 'Missing Cron Secret',
      hint: 'Include X-CRON-SECRET header or ?key= query'
    });
  }

  if (cronSecret !== expectedSecret) {
    console.warn('❌ Invalid Cron Secret');
    return res.status(403).json({
      success: false,
      error: 'Invalid Cron Secret'
    });
  }

  next();
}

/**
 * Admin 접근 검증 (Basic Auth 또는 API Key)
 */
function verifyAdmin(req, res, next) {
  // 1. API Key 방식
  const apiKey = req.headers['x-admin-key'];
  const expectedAdminKey = process.env.ADMIN_API_KEY;

  if (expectedAdminKey && apiKey === expectedAdminKey) {
    return next();
  }

  // 2. Basic Auth 방식
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');

    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    const expectedPass = process.env.ADMIN_PASSWORD;

    if (expectedPass && username === expectedUser && password === expectedPass) {
      return next();
    }
  }

  // 개발 환경에서는 통과
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Admin auth skipped (dev mode)');
    return next();
  }

  console.warn('❌ Admin access denied');
  res.status(401).json({
    success: false,
    error: 'Admin authentication required'
  });
}

/**
 * 요청 로깅 미들웨어
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const emoji = status >= 400 ? '❌' : '✅';
    console.log(`${emoji} ${method} ${originalUrl} → ${status} (${duration}ms)`);
  });

  next();
}

module.exports = {
  verifyApiKey,
  verifyCronSecret,
  verifyAdmin,
  requestLogger
};
