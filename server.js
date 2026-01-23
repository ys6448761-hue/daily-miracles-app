// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - FINAL (for Render)
// Robust routing + tolerant parsing + deep logging + diag
// ═══════════════════════════════════════════════════════════
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");  // PR-3: gzip 압축
const path = require("path");
const analysisEngine = require("./services/analysisEngine");

// ═══════════════════════════════════════════════════════════
// 환경변수 검증 (서버 시작 전 필수 체크)
// ═══════════════════════════════════════════════════════════
let envValidator = null;
let exportPipelineStatus = null;
try {
  envValidator = require("./utils/envValidator");
  const validationResult = envValidator.validateEnv({ failFast: false });

  // 오류가 있으면 가이드 출력
  if (!validationResult.isValid) {
    envValidator.printEnvGuide();
  }

  // Export Pipeline 설정 상태 출력
  exportPipelineStatus = envValidator.printExportStatus();
} catch (error) {
  console.warn("⚠️ 환경변수 검증기 로드 실패:", error.message);
}

const app = express();

// 메트릭스 서비스 로딩
let metricsService = null;
try {
  metricsService = require("./services/metricsService");
  console.log("✅ 메트릭스 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ 메트릭스 서비스 로드 실패:", error.message);
}

// Ops Agent 서비스 로딩
let opsAgentService = null;
try {
  opsAgentService = require("./services/opsAgentService");
  console.log("✅ Ops Agent 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Ops Agent 서비스 로드 실패:", error.message);
}

// Admin 인증 미들웨어 로딩
let verifyAdmin = null;
try {
  const authMiddleware = require("./aurora5/middleware/auth");
  verifyAdmin = authMiddleware.verifyAdmin;
  console.log("✅ Admin 인증 미들웨어 로드 성공");
} catch (error) {
  console.warn("⚠️ Admin 인증 미들웨어 로드 실패:", error.message);
  // Fallback: 기본 검증 함수
  verifyAdmin = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'] || req.query.key;
    const expectedKey = process.env.ADMIN_API_KEY;

    if (expectedKey && adminKey !== expectedKey) {
      return res.status(401).json({ success: false, error: 'Admin authentication required' });
    }
    next();
  };
}

// Airtable 서비스 로딩
let airtableService = null;
try {
  airtableService = require("./services/airtableService");
  console.log("✅ Airtable 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Airtable 서비스 로드 실패:", error.message);
}

// Slack Bot 서비스 로딩
let slackBotService = null;
try {
  slackBotService = require("./services/slackBotService");
  console.log("✅ Slack Bot 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Slack Bot 서비스 로드 실패:", error.message);
}

// 빌드 정보 (디버깅용)
const BUILD_INFO = {
  commit: process.env.GIT_SHA || process.env.RENDER_GIT_COMMIT || 'unknown',
  deployedAt: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
  version: 'v3.1-metrics'
};

// 인증 라우터 로딩
let authRoutes = null;
try {
  authRoutes = require("./routes/authRoutes");
  console.log("✅ 인증 라우터 로드 성공");
} catch (error) {
  console.error("❌ 인증 라우터 로드 실패:", error.message);
}

// 여수 라우터 로딩 (에러 처리)
let yeosuRoutes = null;
try {
  yeosuRoutes = require("./routes/yeosuRoutes");
  console.log("✅ 여수 라우터 로드 성공");
} catch (error) {
  console.error("❌ 여수 라우터 로드 실패:", error.message);
}
// 소원항해 라우터 로딩
let wishVoyageRoutes = null;
try {
  wishVoyageRoutes = require("./routes/wishVoyageRoutes");
  console.log("✅ 소원항해 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원항해 라우터 로드 실패:", error.message);
}
// 문제 해결 라우터 로딩
let problemRoutes = null;
try {
  problemRoutes = require("./routes/problemRoutes");
  console.log("✅ 문제 해결 라우터 로드 성공");
} catch (error) {
  console.error("❌ 문제 해결 라우터 로드 실패:", error.message);
}

// MVP 1차 폼 (간편 접수) 라우터 로딩
let inquiryRoutes = null;
try {
  inquiryRoutes = require("./routes/inquiryRoutes");
  console.log("✅ 간편 접수 라우터 로드 성공");
} catch (error) {
  console.error("❌ 간편 접수 라우터 로드 실패:", error.message);
}

// 소원실현 폼 라우터 로딩
let wishRoutes = null;
try {
  wishRoutes = require("./routes/wishRoutes");
  console.log("✅ 소원실현 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원실현 라우터 로드 실패:", error.message);
  console.error("❌ 스택 트레이스:", error.stack);
}

// Wish Intake 7문항 라우터 로딩 (P0-02)
let wishIntakeRoutes = null;
try {
  wishIntakeRoutes = require("./routes/wishIntakeRoutes");
  console.log("✅ Wish Intake 라우터 로드 성공");
} catch (error) {
  console.error("❌ Wish Intake 라우터 로드 실패:", error.message);
}

// 소원그림 생성 라우터 로딩
let wishImageRoutes = null;
try {
  wishImageRoutes = require("./routes/wishImageRoutes");
  console.log("✅ 소원그림 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원그림 라우터 로드 실패:", error.message);
}

// 메시지 발송 진단 라우터 로딩
let notifyRoutes = null;
try {
  notifyRoutes = require("./routes/notifyRoutes");
  console.log("✅ 메시지 진단 라우터 로드 성공");
} catch (error) {
  console.error("❌ 메시지 진단 라우터 로드 실패:", error.message);
}

// Aurora5 자동화 엔진 라우터 로딩
let aurora5Routes = null;
try {
  aurora5Routes = require("./aurora5/routes/aurora5Routes");
  console.log("✅ Aurora5 라우터 로드 성공");
} catch (error) {
  console.error("❌ Aurora5 라우터 로드 실패:", error.message);
}

// 토론 자동화 라우터 로딩
let debateRoutes = null;
try {
  debateRoutes = require("./routes/debateRoutes");
  console.log("✅ 토론 자동화 라우터 로드 성공");
} catch (error) {
  console.error("❌ 토론 자동화 라우터 로드 실패:", error.message);
}

// 웹훅 라우터 로딩
let webhookRoutes = null;
try {
  webhookRoutes = require("./routes/webhookRoutes");
  console.log("✅ 웹훅 라우터 로드 성공");
} catch (error) {
  console.error("❌ 웹훅 라우터 로드 실패:", error.message);
}

// 여정 파이프라인 라우터 로딩
let journeyRoutes = null;
try {
  journeyRoutes = require("./routes/journeyRoutes");
  console.log("✅ 여정 파이프라인 라우터 로드 성공");
} catch (error) {
  console.error("❌ 여정 파이프라인 라우터 로드 실패:", error.message);
}

// Aurora 5 에이전트 라우터 로딩
let agentRoutes = null;
try {
  agentRoutes = require("./routes/agentRoutes");
  console.log("✅ Aurora 5 에이전트 라우터 로드 성공");
} catch (error) {
  console.error("❌ Aurora 5 에이전트 라우터 로드 실패:", error.message);
}

// 배치 처리 라우터 로딩
let batchRoutes = null;
try {
  batchRoutes = require("./routes/batchRoutes");
  console.log("✅ 배치 처리 라우터 로드 성공");
} catch (error) {
  console.error("❌ 배치 처리 라우터 로드 실패:", error.message);
}

// 스토리북 E2E Commerce 라우터 로딩
let storybookRoutes = null;
try {
  storybookRoutes = require("./routes/storybookRoutes");
  console.log("✅ 스토리북 라우터 로드 성공");
} catch (error) {
  console.error("❌ 스토리북 라우터 로드 실패:", error.message);
}

// 여수 소원항해 견적 시스템 v2.0 라우터 로딩
let quoteRoutes = null;
try {
  quoteRoutes = require("./routes/quoteRoutes");
  console.log("✅ 견적 시스템 라우터 로드 성공");
} catch (error) {
  console.error("❌ 견적 시스템 라우터 로드 실패:", error.message);
}

// 4인 이하 자동 일정 생성 라우터 로딩
let itineraryRoutes = null;
try {
  itineraryRoutes = require("./routes/itineraryRoutes");
  console.log("✅ 일정 생성 라우터 로드 성공");
} catch (error) {
  console.error("❌ 일정 생성 라우터 로드 실패:", error.message);
}

// Wix 자유여행 견적 요청 라우터 로딩
let quoteRequestRoutes = null;
try {
  quoteRequestRoutes = require("./routes/quoteRequestRoutes");
  console.log("✅ Wix 견적 요청 라우터 로드 성공");
} catch (error) {
  console.error("❌ Wix 견적 요청 라우터 로드 실패:", error.message);
}

// 단축 링크 라우터 로딩 (/r/{token})
let shortLinkRoutes = null;
try {
  shortLinkRoutes = require("./routes/shortLinkRoutes");
  console.log("✅ 단축 링크 라우터 로드 성공");
} catch (error) {
  console.error("❌ 단축 링크 라우터 로드 실패:", error.message);
}

// 운영 시스템 라우터 로딩 (헬스체크, 비상알림)
let opsRoutes = null;
try {
  opsRoutes = require("./routes/opsRoutes");
  console.log("✅ 운영 시스템 라우터 로드 성공");
} catch (error) {
  console.error("❌ 운영 시스템 라우터 로드 실패:", error.message);
}

// Entitlement 미들웨어 로딩 (Trial 권한 검증)
let entitlementMiddleware = null;
try {
  entitlementMiddleware = require("./middleware/entitlement");
  console.log("✅ Entitlement 미들웨어 로드 성공");
} catch (error) {
  console.error("❌ Entitlement 미들웨어 로드 실패:", error.message);
}

// 30일 프로그램 결제 라우터 로딩
let programRoutes = null;
try {
  programRoutes = require("./routes/programRoutes");
  console.log("✅ 30일 프로그램 라우터 로드 성공");
} catch (error) {
  console.error("❌ 30일 프로그램 라우터 로드 실패:", error.message);
}

// 여수 소원빌기 체험 라우터 로딩
let yeosuWishRoutes = null;
try {
  yeosuWishRoutes = require("./routes/yeosuWishRoutes");
  console.log("✅ 여수 소원빌기 라우터 로드 성공");
} catch (error) {
  console.error("❌ 여수 소원빌기 라우터 로드 실패:", error.message);
}

// RepoPulse 라우터 로딩
let repoPulseRoutes = null;
try {
  repoPulseRoutes = require("./routes/repoPulseRoutes");
  console.log("✅ RepoPulse 라우터 로드 성공");
} catch (error) {
  console.error("❌ RepoPulse 라우터 로드 실패:", error.message);
}

// Chat Log 라우터 로딩
let chatLogRoutes = null;
try {
  chatLogRoutes = require("./routes/chatLogRoutes");
  console.log("✅ Chat Log 라우터 로드 성공");
} catch (error) {
  console.error("❌ Chat Log 라우터 로드 실패:", error.message);
}

// RAW Process 라우터 로딩
let rawProcessRoutes = null;
try {
  rawProcessRoutes = require("./routes/rawProcessRoutes");
  console.log("✅ RAW Process 라우터 로드 성공");
} catch (error) {
  console.error("❌ RAW Process 라우터 로드 실패:", error.message);
}

// Drive→GitHub Sync 라우터 로딩
let driveGitHubSyncRoutes = null;
try {
  driveGitHubSyncRoutes = require("./routes/driveGitHubSyncRoutes");
  console.log("✅ Drive→GitHub Sync 라우터 로드 성공");
} catch (error) {
  console.error("❌ Drive→GitHub Sync 라우터 로드 실패:", error.message);
}

// DB 모듈 (선택적 로딩)
let db = null;
try {
  db = require("./database/db");
} catch (error) {
  console.error("⚠️ DB 모듈 로드 실패:", error.message);
}

// ---------- CORS (관용 + 화이트리스트 + 프리플라이트) ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // curl/postman/서버사이드 호출
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        if (process.env.REQUEST_LOG) console.log(`✅ CORS allowed: ${origin}`);
        return cb(null, true);
      }
      // 디버깅 단계에선 허용(프로덕션시 false로 바꿔도 됨)
      console.warn(`⚠️  CORS not in whitelist: ${origin} (TEMP allowing)`);
      return cb(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type"]
  })
);

// 모든 프리플라이트를 즉시 OK
app.options("*", (req, res) => res.sendStatus(204));

// ═══════════════════════════════════════════════════════════════════════════
// onrender.com → app.dailymiracles.kr 리다이렉트 (HTML 페이지만)
// API 요청은 하위 호환성을 위해 리다이렉트하지 않음
// ═══════════════════════════════════════════════════════════════════════════
const NEW_DOMAIN = 'https://app.dailymiracles.kr';
const OLD_DOMAINS = ['daily-miracles-app.onrender.com', 'daily-miracles-mvp.onrender.com'];

app.use((req, res, next) => {
  const host = req.get('host') || '';

  // 구 도메인에서 접근한 경우
  if (OLD_DOMAINS.some(old => host.includes(old))) {
    // API 요청은 리다이렉트하지 않음 (하위 호환성)
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
      return next();
    }

    // HTML 페이지 요청은 새 도메인으로 리다이렉트
    const newUrl = `${NEW_DOMAIN}${req.originalUrl}`;
    console.log(`🔄 Redirect: ${host}${req.originalUrl} → ${newUrl}`);
    return res.redirect(301, newUrl);
  }

  next();
});

// PR-3: gzip 압축 미들웨어 (JSON 응답 60-70% 크기 감소)
app.use(compression({
  level: 6,  // 압축 레벨 (1-9, 6이 균형점)
  threshold: 1024,  // 1KB 이상만 압축
  filter: (req, res) => {
    // 기본 필터 사용 (text/*, application/json 등 압축)
    if (req.headers['x-no-compression']) {
      return false;  // 클라이언트가 압축 거부 시
    }
    return compression.filter(req, res);
  }
}));

// ---------- Body Parsing (관용) ----------
// Slack 서명 검증용 rawBody 저장 (verify 콜백)
app.use(express.json({
  limit: "2mb",
  type: ["application/json", "text/json", "application/*+json"],
  verify: (req, _res, buf) => {
    // /api/slack/events 경로에서만 rawBody 저장 (서명 검증용)
    if (req.originalUrl === '/api/slack/events' || req.url === '/api/slack/events') {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
// 일부 환경에서 content-type이 틀리면 문자열로 들어오므로 보정
app.use((req, _res, next) => {
  if (typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); } catch (_) { /* 무시 */ }
  }
  next();
});

// ---------- Static ----------
// PR-5: Cache-Control 헤더 추가 (브라우저 캐싱 활성화)
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: '1d',           // 정적 파일 1일 캐싱
  etag: true,             // ETag 활성화 (조건부 요청)
  lastModified: true,     // Last-Modified 헤더
  setHeaders: (res, filePath) => {
    // 파일 타입별 캐시 전략
    if (filePath.endsWith('.html')) {
      // HTML은 짧게 캐싱 (콘텐츠 변경 가능)
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (filePath.match(/\.(js|css)$/)) {
      // JS/CSS는 1일 캐싱
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    } else if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) {
      // 이미지는 7일 캐싱
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (filePath.match(/\.(woff|woff2|ttf|eot)$/)) {
      // 폰트는 30일 캐싱
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
  }
}));

// ---------- Clean URL Routes (확장자 없이 접근) ----------
app.get("/quote", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "quote.html"));
});

app.get("/program", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program.html"));
});

app.get("/program/success", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program-success.html"));
});

app.get("/program/fail", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program-fail.html"));
});

app.get("/program/messages", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program-messages.html"));
});

// ---------- Request Logging (가시화) ----------
if (String(process.env.REQUEST_LOG || "1") === "1") {
  app.use((req, _res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
    if (req.method !== "GET") {
      try {
        console.log(`  headers: ${JSON.stringify(req.headers)}`);
        console.log(`  body   : ${JSON.stringify(req.body)}`);
      } catch { /* ignore */ }
    }
    next();
  });
}

// ---------- In-memory latest store ----------
global.latestStore = global.latestStore || { story: null };

// ---------- Health ----------
app.get("/api/health", async (_req, res) => {
  let dbStatus = "DB 모듈 없음";
  if (db) {
    try {
      await db.query('SELECT 1');
      dbStatus = "연결됨";
    } catch (error) {
      dbStatus = "연결 실패";
      console.error("DB 연결 오류:", error);
    }
  }
  res.json({
    success: true,
    message: "여수 기적여행 API 서버가 정상 작동 중입니다",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: "v3.0-debug",
    modules: {
      yeosuRoutes: yeosuRoutes !== null,
      db: db !== null,
      metrics: metricsService !== null
    }
  });
});

// ---------- Metrics API (관제탑) ----------
app.get("/api/metrics", (_req, res) => {
  if (!metricsService) {
    return res.status(503).json({
      success: false,
      error: "metrics_unavailable",
      message: "메트릭스 서비스가 로드되지 않았습니다"
    });
  }
  res.json({
    success: true,
    metrics: metricsService.getMetrics(),
    build: BUILD_INFO
  });
});

app.get("/api/metrics/report", (_req, res) => {
  if (!metricsService) {
    return res.status(503).json({
      success: false,
      error: "metrics_unavailable"
    });
  }
  res.type('text/plain').send(metricsService.generateDailyReport());
});

// ---------- Metrics Snapshot (Airtable 저장 + 이상 감지) ----------
app.post("/api/metrics/snapshot", async (_req, res) => {
  if (!metricsService) {
    return res.status(503).json({
      success: false,
      error: "metrics_unavailable"
    });
  }

  try {
    const metrics = metricsService.getMetrics();
    const report = metricsService.generateDailyReport();

    let airtableResult = { skipped: true, reason: 'service_not_loaded' };
    let alerts = [];

    if (airtableService) {
      // 1. Daily Health 스냅샷 저장
      airtableResult = await airtableService.saveDailySnapshot(metrics, report);

      // 2. 이상 감지 및 알림 발송
      alerts = await airtableService.checkAndAlert(metrics);
    }

    // 3. 메트릭스 파일 저장
    metricsService.saveMetrics();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        date: metrics.date,
        wishes_total: metrics.wishes.total,
        alimtalk_sent: metrics.alimtalk.sent,
        red: metrics.trafficLight.red
      },
      airtable: airtableResult,
      alerts: alerts.length,
      alertDetails: alerts
    });
  } catch (error) {
    console.error("💥 Snapshot 저장 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Ops Agent: Full Health Check (DEC-006) ----------
app.get("/api/admin/health/full", verifyAdmin, async (_req, res) => {
  if (!opsAgentService) {
    return res.status(503).json({
      success: false,
      error: "ops_agent_unavailable",
      message: "Ops Agent 서비스가 로드되지 않았습니다"
    });
  }

  try {
    const healthResult = await opsAgentService.runFullHealthCheck(db);
    res.json({
      success: true,
      ...healthResult
    });
  } catch (error) {
    console.error("💥 Ops Agent 헬스체크 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Ops Agent: Slack Report ----------
app.get("/api/admin/health/slack", verifyAdmin, async (_req, res) => {
  if (!opsAgentService) {
    return res.status(503).json({
      success: false,
      error: "ops_agent_unavailable"
    });
  }

  try {
    const healthResult = await opsAgentService.runFullHealthCheck(db);
    const slackReport = opsAgentService.generateSlackReport(healthResult);
    res.type('text/plain').send(slackReport);
  } catch (error) {
    console.error("💥 Slack 보고서 생성 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Slack Events API (Aurora5 Bot) ----------
// 전역 express.json()에서 rawBody 저장됨 (verify 콜백)
app.post("/api/slack/events", async (req, res) => {
  if (!slackBotService) {
    return res.status(503).json({
      success: false,
      error: "slack_bot_unavailable"
    });
  }

  try {
    // req.body는 이미 파싱됨 (전역 express.json)
    // req.rawBody는 verify 콜백에서 저장됨 (Buffer)
    const { type, challenge, event } = req.body;

    console.log(`📥 Slack 요청 수신: type=${type}, event_type=${event?.type || 'N/A'}, rawBody=${req.rawBody ? 'OK' : 'MISSING'}`);

    // 1. URL Verification (Slack 앱 설정 시 필요) - 서명 검증 전에 처리
    if (type === 'url_verification') {
      console.log('✅ Slack URL verification (challenge 응답)');
      return res.json({ challenge });
    }

    // 2. 서명 검증 (rawBody 기반)
    if (!req.rawBody) {
      console.warn('❌ rawBody 없음 - 서명 검증 불가');
      return res.status(400).json({ error: 'Missing raw body' });
    }

    if (!slackBotService.verifySlackSignature(req.rawBody, req.headers)) {
      console.warn('❌ Slack 서명 검증 실패 - 401 반환');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Slack 서명 검증 통과');

    // 3. 이벤트 처리 (비동기로 응답 후 처리)
    res.status(200).send('OK'); // Slack은 3초 내 응답 필요

    if (type === 'event_callback' && event) {
      console.log(`🔔 이벤트 콜백 처리 시작: ${event.type}`);

      // 채널 정보 조회
      const channelInfo = await slackBotService.getChannelInfo(event.channel);
      console.log(`📍 채널 정보 조회 결과:`, channelInfo ? channelInfo.name : 'null');

      // 이벤트 처리 (headers 전달 - rate-limit/retry 체크용)
      const result = await slackBotService.handleSlackEvent(event, channelInfo, req.headers);
      console.log('🤖 Slack 이벤트 처리 결과:', JSON.stringify(result));
    } else {
      console.log(`⚠️ 처리하지 않는 이벤트: type=${type}`);
    }

  } catch (error) {
    console.error("💥 Slack 이벤트 처리 실패:", error.message, error.stack);
    // 이미 응답을 보냈으면 로깅만, 아니면 에러 응답
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});

// ---------- Funnel Report API (퍼널 일일 리포트) ----------
let funnelReport = null;
try {
  funnelReport = require('./scripts/ops/funnel-daily-report');
} catch (error) {
  console.warn('⚠️ Funnel report 모듈 로드 실패:', error.message);
}

app.post("/api/ops/funnel-report", async (req, res) => {
  if (!funnelReport) {
    return res.status(503).json({
      success: false,
      error: "funnel_report_unavailable",
      message: "퍼널 리포트 모듈이 로드되지 않았습니다"
    });
  }

  try {
    const { date, range, format, env } = req.body || {};

    const options = {
      date: date || null,
      range: range || 1,
      env: env || 'prod'  // 기본값: prod (테스트 이벤트 제외)
    };

    console.log(`📊 퍼널 리포트 생성 요청: ${JSON.stringify(options)}`);
    const result = await funnelReport.generateFunnelReport(options);

    // 알람 추출
    const alerts = result.funnel
      .filter(f => f.status === 'ALERT')
      .map(f => ({
        metric: f.name,
        rate: f.rate,
        threshold: f.threshold?.floor,
        alerts: f.alerts
      }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dateFrom: result.dateFrom,
      dateTo: result.dateTo,
      env: result.env,
      oneLine: result.oneLine,
      data: result.data,
      funnel: result.funnel,
      integrity: result.integrity?.overall || null,
      alerts: alerts.length,
      alertDetails: alerts,
      format: format === 'markdown' ? result.markdown : undefined
    });

    console.log(`✅ 퍼널 리포트 생성 완료 [${result.env}]: ${result.oneLine}`);
  } catch (error) {
    console.error("💥 퍼널 리포트 생성 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/ops/funnel-report", async (req, res) => {
  if (!funnelReport) {
    return res.status(503).json({
      success: false,
      error: "funnel_report_unavailable"
    });
  }

  try {
    const { date, range, env } = req.query;

    const options = {
      date: date || null,
      range: parseInt(range, 10) || 1,
      env: env || 'prod'  // 기본값: prod (테스트 이벤트 제외)
    };

    const result = await funnelReport.generateFunnelReport(options);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dateFrom: result.dateFrom,
      dateTo: result.dateTo,
      env: result.env,
      oneLine: result.oneLine,
      data: result.data,
      funnel: result.funnel,
      integrity: result.integrity?.overall || null
    });
  } catch (error) {
    console.error("💥 퍼널 리포트 조회 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Diag (서버가 실제로 받은 것 그대로 보여줌) ----------
app.all("/diag/echo", (req, res) => {
  res.json({
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    body: req.body,
    ts: new Date().toISOString()
  });
});

// ---------- Debug: 파일 시스템 확인 ----------
app.get("/diag/files", (req, res) => {
  const fs = require("fs");
  const path = require("path");

  try {
    const diagnostics = {
      cwd: process.cwd(),
      __dirname,
      yeosuRoutesLoaded: yeosuRoutes !== null,
      dbLoaded: db !== null,
      files: {
        routesDir: fs.existsSync(path.join(__dirname, "routes")),
        yeosuRoutesFile: fs.existsSync(path.join(__dirname, "routes", "yeosuRoutes.js")),
        databaseDir: fs.existsSync(path.join(__dirname, "database")),
        dbFile: fs.existsSync(path.join(__dirname, "database", "db.js"))
      }
    };

    if (fs.existsSync(path.join(__dirname, "routes"))) {
      diagnostics.routesContents = fs.readdirSync(path.join(__dirname, "routes"));
    }

    if (fs.existsSync(path.join(__dirname, "database"))) {
      diagnostics.databaseContents = fs.readdirSync(path.join(__dirname, "database"));
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// ---------- 인증 API Routes ----------
if (authRoutes) {
  app.use("/api/auth", authRoutes);
  console.log("✅ 인증 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 인증 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여수 기적여행 API Routes ----------
if (yeosuRoutes) {
  app.use("/api", yeosuRoutes);
  console.log("✅ 여수 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 여수 API 라우터 로드 실패 - 라우트 미등록");
}
// ---------- 소원항해 지수 API Routes ----------
if (wishVoyageRoutes) {
  app.use("/api/wish-voyage", wishVoyageRoutes);
  console.log("✅ 소원항해 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 소원항해 API 라우터 로드 실패 - 라우트 미등록");
}
// ---------- 문제 해결 API Routes ----------
if (problemRoutes) {
  app.use("/api/problem", problemRoutes);
  console.log("✅ 문제 해결 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 문제 해결 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- MVP 1차 폼 (간편 접수) API Routes ----------
if (inquiryRoutes) {
  app.use("/api/inquiry", inquiryRoutes);
  console.log("✅ 간편 접수 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 간편 접수 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 소원실현 폼 API Routes ----------
if (wishRoutes) {
  app.use("/api/wishes", wishRoutes);
  console.log("✅ 소원실현 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 소원실현 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Wish Intake 7문항 API Routes (P0-02) ----------
if (wishIntakeRoutes) {
  app.use("/api/wish-intake", wishIntakeRoutes);
  console.log("✅ Wish Intake API 라우터 등록 완료");
} else {
  console.warn("⚠️ Wish Intake API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 소원그림 생성 API Routes ----------
if (wishImageRoutes) {
  app.use("/api/wish-image", wishImageRoutes);
  console.log("✅ 소원그림 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 소원그림 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 메시지 발송 진단 API Routes ----------
if (notifyRoutes) {
  app.use("/api/notify", notifyRoutes);
  console.log("✅ 메시지 진단 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 메시지 진단 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Aurora5 자동화 엔진 API Routes ----------
if (aurora5Routes) {
  app.use("/", aurora5Routes); // 루트에 마운트 (webhooks, api, jobs, admin 포함)
  console.log("✅ Aurora5 API 라우터 등록 완료");
} else {
  console.warn("⚠️ Aurora5 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 토론 자동화 API Routes ----------
if (debateRoutes) {
  app.use("/api/debate", debateRoutes);
  console.log("✅ 토론 자동화 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 토론 자동화 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 웹훅 Routes ----------
if (webhookRoutes) {
  app.use("/webhooks", webhookRoutes);
  console.log("✅ 웹훅 라우터 등록 완료");
} else {
  console.warn("⚠️ 웹훅 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여정 파이프라인 Routes ----------
if (journeyRoutes) {
  app.use("/api/journey", journeyRoutes);
  console.log("✅ 여정 파이프라인 라우터 등록 완료");
} else {
  console.warn("⚠️ 여정 파이프라인 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Aurora 5 에이전트 Routes ----------
if (agentRoutes) {
  app.use("/api/agents", agentRoutes);
  console.log("✅ Aurora 5 에이전트 라우터 등록 완료");
} else {
  console.warn("⚠️ Aurora 5 에이전트 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 배치 처리 Routes ----------
if (batchRoutes) {
  app.use("/api/batch", batchRoutes);
  console.log("✅ 배치 처리 라우터 등록 완료");
} else {
  console.warn("⚠️ 배치 처리 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 스토리북 E2E Commerce Routes ----------
if (storybookRoutes) {
  app.use("/api/storybook", storybookRoutes);
  console.log("✅ 스토리북 라우터 등록 완료");
} else {
  console.warn("⚠️ 스토리북 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여수 소원항해 견적 시스템 v2.0 Routes ----------
if (quoteRoutes) {
  app.use("/api/v2/quote", quoteRoutes);
  console.log("✅ 견적 시스템 라우터 등록 완료 (/api/v2/quote)");
} else {
  console.warn("⚠️ 견적 시스템 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 4인 이하 자동 일정 생성 Routes ----------
if (itineraryRoutes) {
  app.use("/api/v2/itinerary", itineraryRoutes);
  console.log("✅ 일정 생성 라우터 등록 완료 (/api/v2/itinerary)");
} else {
  console.warn("⚠️ 일정 생성 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Wix 자유여행 견적 요청 Routes ----------
if (quoteRequestRoutes) {
  app.use("/api/quote", quoteRequestRoutes);
  console.log("✅ Wix 견적 요청 라우터 등록 완료 (/api/quote/request)");
} else {
  console.warn("⚠️ Wix 견적 요청 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 단축 링크 Routes (/r/{token}) ----------
if (shortLinkRoutes) {
  app.use("/r", shortLinkRoutes);
  console.log("✅ 단축 링크 라우터 등록 완료 (/r/:token)");
} else {
  console.warn("⚠️ 단축 링크 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 운영 시스템 Routes (/ops, /api/ops) ----------
if (opsRoutes) {
  app.use("/ops", opsRoutes);
  app.use("/api/ops", opsRoutes);  // P0: API 경로도 지원
  console.log("✅ 운영 시스템 라우터 등록 완료 (/ops/health, /api/ops/report/daily)");
} else {
  console.warn("⚠️ 운영 시스템 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 30일 프로그램 결제 Routes (/api/program) ----------
if (programRoutes) {
  app.use("/api/program", programRoutes);
  console.log("✅ 30일 프로그램 라우터 등록 완료 (/api/program)");
} else {
  console.warn("⚠️ 30일 프로그램 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여수 소원빌기 체험 Routes (/api/yeosu/wish) ----------
if (yeosuWishRoutes) {
  app.use("/api/yeosu/wish", yeosuWishRoutes);
  console.log("✅ 여수 소원빌기 라우터 등록 완료 (/api/yeosu/wish)");
} else {
  console.warn("⚠️ 여수 소원빌기 라우터 로드 실패 - 라우트 미등록");
}

// ---------- RepoPulse Routes (/api/repopulse) ----------
if (repoPulseRoutes) {
  app.use("/api/repopulse", repoPulseRoutes);
  console.log("✅ RepoPulse 라우터 등록 완료 (/api/repopulse/github, /api/repopulse/render)");
} else {
  console.warn("⚠️ RepoPulse 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Chat Log Routes (/api/chat-log) ----------
if (chatLogRoutes) {
  app.use("/api/chat-log", chatLogRoutes);
  console.log("✅ Chat Log 라우터 등록 완료 (/api/chat-log/save)");
} else {
  console.warn("⚠️ Chat Log 라우터 로드 실패 - 라우트 미등록");
}

// ---------- RAW Process Routes (/api/raw) ----------
if (rawProcessRoutes) {
  app.use("/api/raw", rawProcessRoutes);
  console.log("✅ RAW Process 라우터 등록 완료 (/api/raw/process, /api/raw/health)");
} else {
  console.warn("⚠️ RAW Process 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Drive→GitHub Sync Routes (/api/sync) ----------
if (driveGitHubSyncRoutes) {
  app.use("/api/sync", driveGitHubSyncRoutes);
  console.log("✅ Drive→GitHub Sync 라우터 등록 완료 (/api/sync/run, /api/sync/health, /api/sync/status)");
} else {
  console.warn("⚠️ Drive→GitHub Sync 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Entitlement 보호 라우트 (/api/daily-messages, /api/roadmap) ----------
// P0 요구사항: Trial 또는 Paid 권한이 있어야만 접근 가능
if (entitlementMiddleware) {
  const { requireEntitlement } = entitlementMiddleware;

  // /api/daily-messages - 응원 메시지 조회 (Trial 권한 필요)
  app.get("/api/daily-messages", requireEntitlement('trial'), async (req, res) => {
    try {
      // TODO: 실제 응원 메시지 조회 로직 구현
      res.json({
        success: true,
        user: req.user,
        messages: [
          { day: 1, morning: "오늘도 좋은 하루 되세요!", evening: "오늘 하루도 수고했어요." }
        ],
        message: "응원 메시지 API (개발 중)"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // /api/roadmap - 30일 로드맵 조회 (Trial 권한 필요)
  app.get("/api/roadmap", requireEntitlement('trial'), async (req, res) => {
    try {
      // TODO: 실제 로드맵 조회 로직 구현
      res.json({
        success: true,
        user: req.user,
        roadmap: {
          totalDays: 30,
          currentDay: 1,
          milestones: []
        },
        message: "로드맵 API (개발 중)"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log("✅ Entitlement 보호 라우터 등록 완료 (/api/daily-messages, /api/roadmap)");
} else {
  console.warn("⚠️ Entitlement 미들웨어 로드 실패 - 보호 라우트 미등록");
}

// ---------- Tolerant extractor ----------
function extractUserInput(body) {
  const wrapper = body && typeof body === "object" ? body : {};
  const data = wrapper.userInput && typeof wrapper.userInput === "object" ? wrapper.userInput : wrapper;

  const wish =
    data.wish ??
    data.concern ??
    data.problem ??
    data.goal ??
    data.desire ??
    data.target ??
    data.message ??
    null;

  return { data, wish };
}

// ---------- Core handler (analyze/create 공용) ----------
async function coreAnalyzeHandler(req, res) {
  const startTime = Date.now();

  try {
    const { data, wish } = extractUserInput(req.body);

    if (!wish) {
      return res.status(400).json({
        error: "Missing required field: wish",
        hint:
          "본문 예시 1) { userInput: { wish: '관계를 개선하고 싶어요' } }\n" +
          "본문 예시 2) { concern: '요즘 대화가 자주 어긋나요' }",
        received: req.body
      });
    }

    console.log("🎯 analyze called via:", req.path);
    console.log("📥 wish:", wish);
    console.log("🔍 Starting analysis engine...");

    // ✅ 실제 분석 엔진 호출
    const userProfile = analysisEngine.analyzeUserProfile(data);
    console.log("✅ User profile analyzed - miracleIndex:", userProfile.miracleIndex);

    const counterpartyProfile = analysisEngine.generateCounterpartyProfile(req.body);
    console.log("✅ Counterparty profile:", counterpartyProfile ? "generated" : "skipped (no counterparty)");

    const relationshipAnalysis = counterpartyProfile
      ? analysisEngine.analyzeRelationship(userProfile, counterpartyProfile)
      : null;
    console.log("✅ Relationship analysis:", relationshipAnalysis ? "completed" : "skipped");

    const consulting8Steps = analysisEngine.generate8StepsConsulting(userProfile, relationshipAnalysis);
    console.log("✅ 8-step consulting generated");

    const actionPlan = analysisEngine.generateActionPlan(userProfile);
    console.log("✅ 4-week action plan generated");

    const warningSignals = relationshipAnalysis
      ? analysisEngine.detectWarningSignals(relationshipAnalysis)
      : [];
    console.log("✅ Warning signals detected:", warningSignals.length);

    const executionTime = Date.now() - startTime;

    const result = {
      success: true,
      redirectUrl: "/daily-miracles-result.html#latest",
      story: {
        summary: `${userProfile.name}님의 분석이 완료되었습니다`,
        input: data,
        userProfile,
        counterpartyProfile,
        relationshipAnalysis,
        consulting8Steps,
        actionPlan,
        warningSignals
      },
      images: [],
      executionTime,
      workflowId: "analysis-" + Date.now()
    };

    global.latestStore.story = result;
    console.log(`✅ Analysis completed in ${executionTime}ms`);

    return res.status(200).json(result);
  } catch (err) {
    console.error("💥 coreAnalyzeHandler error:", err);
    return res.status(500).json({ error: "internal_error", message: err.message });
  }
}

// ---------- Alias Registrar (슬래시 변형까지 일괄 등록) ----------
function registerAliases(paths, handler) {
  paths.forEach(p => {
    const variants = new Set([p, p.endsWith("/") ? p.slice(0, -1) : p + "/"]);
    variants.forEach(v => app.post(v, handler));
  });
}

// ---------- Register all analyze/create aliases ----------
registerAliases(
  [
    "/api/daily-miracles/analyze",   // ★ 프론트 기본
    "/api/relationship/analyze",
    "/api/analyze-relationship",
    "/api/create-story",
    "/api/story",
    "/api/story/generate",
    "/api/story/new",
    "/api/story/create"              // 과거 공식 라우트까지 통합 (중복 제거 요망)
  ],
  coreAnalyzeHandler
);

// ---------- Latest result for result page ----------
app.get("/api/story/latest", (_req, res) => {
  if (global.latestStore?.story) return res.json(global.latestStore.story);
  return res.status(404).json({ error: "no_latest_story" });
});

// ---------- Feedback System ----------
const fs = require("fs");
const FEEDBACK_FILE = path.join(__dirname, "feedback.json");

// 피드백 저장
app.post("/api/feedback", (req, res) => {
  try {
    const feedback = {
      timestamp: new Date().toISOString(),
      satisfaction: req.body.satisfaction || null,
      helpful: req.body.helpful || [],
      improvements: req.body.improvements || "",
      accuracy: req.body.accuracy || null,
      suggestions: req.body.suggestions || "",
      recommendation: req.body.recommendation || null,
      contact: req.body.contact || "",
      userAgent: req.headers['user-agent'] || ""
    };

    console.log("📝 Feedback received:", JSON.stringify(feedback, null, 2));

    // 기존 피드백 로드 (없으면 빈 배열)
    let feedbacks = [];
    if (fs.existsSync(FEEDBACK_FILE)) {
      const content = fs.readFileSync(FEEDBACK_FILE, "utf-8");
      feedbacks = JSON.parse(content);
    }

    // 새 피드백 추가
    feedbacks.push(feedback);

    // 파일에 저장
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), "utf-8");

    console.log(`✅ Feedback saved (total: ${feedbacks.length})`);

    return res.status(200).json({
      success: true,
      message: "소중한 피드백 감사합니다!",
      totalFeedbacks: feedbacks.length
    });
  } catch (err) {
    console.error("💥 Feedback save error:", err);
    return res.status(500).json({ error: "Failed to save feedback", message: err.message });
  }
});

// 피드백 조회 (관리자용)
app.get("/api/feedback", (req, res) => {
  try {
    if (!fs.existsSync(FEEDBACK_FILE)) {
      return res.json({ feedbacks: [], count: 0 });
    }

    const content = fs.readFileSync(FEEDBACK_FILE, "utf-8");
    const feedbacks = JSON.parse(content);

    // 통계 생성
    const stats = {
      count: feedbacks.length,
      avgSatisfaction: feedbacks.filter(f => f.satisfaction).length > 0
        ? (feedbacks.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / feedbacks.filter(f => f.satisfaction).length).toFixed(1)
        : 0,
      avgAccuracy: feedbacks.filter(f => f.accuracy).length > 0
        ? (feedbacks.reduce((sum, f) => sum + (f.accuracy || 0), 0) / feedbacks.filter(f => f.accuracy).length).toFixed(1)
        : 0,
      avgRecommendation: feedbacks.filter(f => f.recommendation).length > 0
        ? (feedbacks.reduce((sum, f) => sum + (f.recommendation || 0), 0) / feedbacks.filter(f => f.recommendation).length).toFixed(1)
        : 0
    };

    return res.json({ feedbacks, stats });
  } catch (err) {
    console.error("💥 Feedback load error:", err);
    return res.status(500).json({ error: "Failed to load feedback", message: err.message });
  }
});

// ---------- Root ----------
app.get("/", (_req, res) => {
  res.json({
    service: "Daily Miracles MVP",
    status: "ok",
    endpoints: {
      health: "/api/health",
      diag: "/diag/echo",
      analyze: "/api/daily-miracles/analyze",
      latest: "/api/story/latest"
    }
  });
});

// ---------- 404 & Error ----------
app.use((req, res) => {
  console.warn(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "route_not_found",
    message: "요청하신 API 경로를 찾을 수 없습니다",
    path: req.originalUrl
  });
});

app.use((err, _req, res, _next) => {
  console.error("💥 Unhandled Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// ---------- Start ----------
const PORT = process.env.PORT || 5100;
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌟 Daily Miracles MVP Server (FINAL)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 ALLOWED_ORIGINS: ${allowedOrigins.join(", ") || "(none→allow all in dev)"}`);
  console.log("📋 Registered Routes:");
  [
    "GET  /api/health",
    "ALL  /diag/echo",
    "POST /api/daily-miracles/analyze",
    "POST /api/relationship/analyze",
    "GET  /api/story/latest",
    "GET  /api/inquiry/form           (1차 폼 질문 조회)",
    "POST /api/inquiry/submit         (1차 폼 접수)",
    "GET  /api/inquiry/:inquiryId     (접수 상태 조회)",
    "GET  /api/inquiry/list/all       (전체 목록 - 관리자)",
    "GET  /"
  ].forEach(l => console.log("  - " + l));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
