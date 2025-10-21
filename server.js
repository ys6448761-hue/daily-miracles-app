// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - FINAL (for Render)
// Robust routing + tolerant parsing + deep logging + diag
// ═══════════════════════════════════════════════════════════
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

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
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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

    // (오케스트레이터 비활성화 상태) – 목업 응답
    const result = {
      success: true,
      redirectUrl: "/daily-miracles-result.html#latest",
      story: { summary: `분석 완료: ${wish}`, input: data },
      images: [],
      executionTime: 0,
      workflowId: "mock-" + Date.now()
    };

    global.latestStore.story = result;
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
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl });
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
