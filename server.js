// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - FINAL (for Render)
// Robust routing + tolerant parsing + deep logging + diag
// ═══════════════════════════════════════════════════════════
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const analysisEngine = require("./services/analysisEngine");

const app = express();

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

// ---------- Body Parsing (관용) ----------
app.use(express.json({ limit: "2mb", type: ["application/json", "text/json", "application/*+json"] }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
// 일부 환경에서 content-type이 틀리면 문자열로 들어오므로 보정
app.use((req, _res, next) => {
  if (typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); } catch (_) { /* 무시 */ }
  }
  next();
});

// ---------- Static ----------
app.use(express.static(path.join(__dirname, "public")));

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
      db: db !== null
    }
  });
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
const PORT = process.env.PORT || 5000;
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
    "POST /api/analyze-relationship",
    "POST /api/create-story",
    "POST /api/story",
    "POST /api/story/generate",
    "POST /api/story/new",
    "POST /api/story/create",
    "GET  /api/story/latest",
    "GET  /"
  ].forEach(l => console.log("  - " + l));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
