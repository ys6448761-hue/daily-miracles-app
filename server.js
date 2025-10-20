// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Server (Render-safe)
// ═══════════════════════════════════════════════════════════

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ───────────────────────────────────────────────────────────
// Optional Orchestrator (안전 가드)
// ───────────────────────────────────────────────────────────
// ORCHESTRATOR_ENABLED=true 일 때만 로드 시도 (기본 false)
const ORCHESTRATOR_ENABLED = String(process.env.ORCHESTRATOR_ENABLED || 'false') === 'true';

let orchestrator = null;
let isOrchReady = false;

// ───────────────────────────────────────────────────────────
// Memory Storage for Latest Results (DB 없이 최근 결과 임시 저장)
// ───────────────────────────────────────────────────────────
const latestStore = {
  story: null,
  miracle: null,
  problem: null
};

async function safeLoadOrchestrator() {
  if (!ORCHESTRATOR_ENABLED) {
    console.log('⚠️ Orchestrator 비활성화(ORCHESTRATOR_ENABLED=false).');
    return;
  }
  try {
    console.log('🚀 Orchestrator 모듈 로드 시도…');
    orchestrator = require('./orchestrator');
    console.log('✅ Orchestrator 모듈 로드 성공. 초기화 시도…');
    await orchestrator.initialize?.();
    isOrchReady = true;
    console.log('✅ Orchestrator 준비 완료!');
  } catch (err) {
    console.error('❌ Orchestrator 로드/초기화 실패:', err?.message || err);
    orchestrator = null;
    isOrchReady = false;
  }
}

// ───────────────────────────────────────────────────────────
// Middleware
// ───────────────────────────────────────────────────────────
// CORS Configuration (환경변수 기반)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static (있으면 사용)
app.use(express.static(path.join(__dirname, 'public')));

// ───────────────────────────────────────────────────────────
// Health / Root
// ───────────────────────────────────────────────────────────
// Render 헬스체크가 200을 기대할 수 있으므로 상태에 상관없이 200으로 응답
app.get('/api/health', async (req, res) => {
  const status = orchestrator && isOrchReady ? 'ok' : (ORCHESTRATOR_ENABLED ? 'initializing' : 'standby');
  const payload = { status };
  try {
    if (orchestrator && orchestrator.checkHealth) {
      payload.details = await orchestrator.checkHealth();
    }
  } catch (e) {
    payload.details = { error: e?.message };
  }
  res.status(200).json(payload);
});

app.get('/', (req, res) => {
  res.json({
    service: 'Daily Miracles MVP',
    version: '1.0.0',
    status: orchestrator && isOrchReady ? 'ready' : (ORCHESTRATOR_ENABLED ? 'initializing' : 'standby'),
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      story: '/api/story/create',
      miracle: '/api/miracle/calculate',
      problem: '/api/problem/analyze'
    }
  });
});

// ───────────────────────────────────────────────────────────
// Dashboard (orchestrator 사용시만)
// ───────────────────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  if (!orchestrator || !isOrchReady) {
    return res.status(200).json({ status: ORCHESTRATOR_ENABLED ? 'initializing' : 'standby' });
  }
  try {
    const health = await orchestrator.checkHealth?.();
    const context = orchestrator.context?.getFullContext?.();
    res.json({ health, context, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

// ───────────────────────────────────────────────────────────
// Story API
// ───────────────────────────────────────────────────────────
app.post('/api/story/create', async (req, res) => {
  if (!orchestrator || !isOrchReady) {
    return res.status(200).json({ error: 'orchestrator_not_ready' });
  }
  try {
    const { userInput } = req.body || {};
    if (!userInput || !userInput.wish) {
      return res.status(400).json({ error: 'Missing required field: wish' });
    }
    const result = await orchestrator.execute('create-story', { input: userInput });

    // 최근 결과 저장 (메모리)
    latestStore.story = {
      at: new Date().toISOString(),
      input: userInput,
      result: result
    };

    res.json({
      success: true,
      redirectUrl: '/daily-miracles-result.html#latest',
      story: result.story,
      images: result.images,
      executionTime: result.executionTime,
      workflowId: result.workflowId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message, retries: err?.retries || 0 });
  }
});

app.get('/api/story/progress/:workflowId', async (req, res) => {
  if (!orchestrator || !isOrchReady) {
    return res.status(200).json({ error: 'orchestrator_not_ready' });
  }
  try {
    const progress = orchestrator.getWorkflowProgress(req.params.workflowId);
    res.json(progress);
  } catch {
    res.status(404).json({ error: 'Workflow not found' });
  }
});

// ───────────────────────────────────────────────────────────
// Miracle Index
// ───────────────────────────────────────────────────────────
app.post('/api/miracle/calculate', async (req, res) => {
  if (!orchestrator || !isOrchReady) {
    return res.status(200).json({ error: 'orchestrator_not_ready' });
  }
  try {
    const { activityData } = req.body || {};
    const result = await orchestrator.execute('calculate-miracle', { activityData });

    // 최근 결과 저장 (메모리)
    latestStore.miracle = {
      at: new Date().toISOString(),
      input: activityData,
      result: result
    };

    res.json({
      success: true,
      redirectUrl: '/daily-miracles-result.html#latest',
      miracleIndex: result.miracleIndex,
      predictions: result.predictions,
      executionTime: result.executionTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ───────────────────────────────────────────────────────────
// Problem Analysis
// ───────────────────────────────────────────────────────────
app.post('/api/problem/analyze', async (req, res) => {
  if (!orchestrator || !isOrchReady) {
    return res.status(200).json({ error: 'orchestrator_not_ready' });
  }
  try {
    const { problemInput } = req.body || {};
    const result = await orchestrator.execute('analyze-problem', { input: problemInput });

    // 최근 결과 저장 (메모리)
    latestStore.problem = {
      at: new Date().toISOString(),
      input: problemInput,
      result: result
    };

    res.json({
      success: true,
      redirectUrl: '/daily-miracles-result.html#latest',
      analysis: result.analysis,
      solutions: result.solutions,
      executionTime: result.executionTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ───────────────────────────────────────────────────────────
// Latest Results Retrieval API (결과 조회)
// ───────────────────────────────────────────────────────────
app.get('/api/story/latest', (req, res) => {
  if (!latestStore.story) {
    return res.status(404).json({ error: 'no_story', message: 'No recent story found' });
  }
  res.json(latestStore.story);
});

app.get('/api/miracle/latest', (req, res) => {
  if (!latestStore.miracle) {
    return res.status(404).json({ error: 'no_miracle', message: 'No recent miracle calculation found' });
  }
  res.json(latestStore.miracle);
});

app.get('/api/problem/latest', (req, res) => {
  if (!latestStore.problem) {
    return res.status(404).json({ error: 'no_problem', message: 'No recent problem analysis found' });
  }
  res.json(latestStore.problem);
});

// ───────────────────────────────────────────────────────────
// Compatibility Alias Routes (프론트엔드 호환용 별칭)
// ───────────────────────────────────────────────────────────
// 기존 구현이 /api/story/create 라면, 프론트가 /api/create-story 호출 시 연결
app.post('/api/create-story', (req, res, next) => {
  req.url = '/api/story/create';
  next('route');
});

// 관계/문제 분석 호환: 프론트가 /api/relationship/analyze 또는 /api/relation/analyze 를 호출할 때
app.post(['/api/relationship/analyze', '/api/relation/analyze'], (req, res, next) => {
  // 실제 구현이 /api/problem/analyze 인 케이스를 기본으로 연결
  req.url = '/api/problem/analyze';
  next('route');
});

// 기적지수 계산 호환: /api/miracle/calc 등 변형이 들어오면 /api/miracle/calculate 로 연결
app.post(['/api/miracle/calc', '/api/miracle/run'], (req, res, next) => {
  req.url = '/api/miracle/calculate';
  next('route');
});

// ───────────────────────────────────────────────────────────
// 404 & Error
// ───────────────────────────────────────────────────────────
app.use((req, res) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err?.message : undefined
  });
});

// ───────────────────────────────────────────────────────────
// Start
// ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌟 Daily Miracles MVP Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await safeLoadOrchestrator();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Server ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// ───────────────────────────────────────────────────────────
// Graceful Shutdown
// ───────────────────────────────────────────────────────────
async function gracefulShutdown(signal) {
  console.log(`\n🛑 ${signal} received`);
  if (orchestrator && isOrchReady && orchestrator.shutdown) {
    console.log('⚡ Orchestrator shutting down…');
    await orchestrator.shutdown();
    console.log('✅ Orchestrator shutdown complete');
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
