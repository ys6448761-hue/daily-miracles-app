// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Server (Clean, Render-safe)
// ═══════════════════════════════════════════════════════════
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Orchestrator: 환경변수로 on/off
const ORCHESTRATOR_ENABLED = String(process.env.ORCHESTRATOR_ENABLED || 'false') === 'true';
let orchestrator = null;
if (ORCHESTRATOR_ENABLED) {
  try {
    orchestrator = require('./orchestrator');
  } catch (e) {
    console.warn('⚠️  orchestrator 모듈을 불러오지 못했습니다. 비활성화 모드로 전환합니다.');
  }
}

// ═══════════════════════════════════════════════════════════
// CORS (환경변수 ALLOWED_ORIGINS="https://a.com,https://b.com")
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin(origin, cb) {
    if (!origin) {
      // curl/postman/서버간 요청 허용
      return cb(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed: ${origin}`);
      return cb(null, true);
    }
    // 와일드카드: 개발 중에는 모든 origin 허용 (프로덕션에서는 제거 권장)
    console.warn(`⚠️  CORS origin not in whitelist: ${origin}`);
    return cb(null, true); // ← 임시로 모든 origin 허용 (디버깅용)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing & static
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════
// 🔍 요청 로깅 미들웨어 (Render 디버깅용)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log(`  Origin: ${req.get('origin') || 'N/A'}`);
  console.log(`  Content-Type: ${req.get('content-type') || 'N/A'}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`  Body keys: ${Object.keys(req.body || {}).join(', ') || 'empty'}`);
  }
  next();
});

// ═══════════════════════════════════════════════════════════
// In-memory latest store (결과 페이지 조회용)
global.latestStore = { story: null };

// ═══════════════════════════════════════════════════════════
// Health (항상 200 보장)
app.get('/api/health', async (req, res) => {
  const base = { status: ORCHESTRATOR_ENABLED ? 'initializing' : 'standby', timestamp: new Date().toISOString() };

  if (ORCHESTRATOR_ENABLED && orchestrator && orchestrator.checkHealth) {
    try {
      const h = await orchestrator.checkHealth();
      return res.json({ ...base, status: 'ok', details: h });
    } catch (e) {
      return res.json({ ...base, status: 'error', details: { message: e.message } });
    }
  }
  res.json(base);
});

// Optional 대시보드
app.get('/api/dashboard', async (req, res) => {
  if (!(ORCHESTRATOR_ENABLED && orchestrator)) return res.json({ status: 'standby' });
  try {
    const health = await orchestrator.checkHealth?.();
    const context = orchestrator.context?.getFullContext?.();
    res.json({ health, context, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ═══════════════════════════════════════════════════════════
// Story 생성 실제 핸들러 (유일한 정의)
async function createStoryHandler(req, res) {
  console.log('🎯 createStoryHandler called via:', req.path);
  try {
    const userInput = req.body?.userInput || req.body; // 폼/JS 양쪽 호환
    console.log('📥 Received userInput:', JSON.stringify(userInput, null, 2));

    if (!userInput || !userInput.wish) {
      console.warn('⚠️  Missing wish field in request');
      return res.status(400).json({ error: 'Missing required field: wish' });
    }

    // Orchestrator가 활성화된 경우 실제 워크플로 호출
    if (ORCHESTRATOR_ENABLED && orchestrator?.execute) {
      const result = await orchestrator.execute('create-story', { input: userInput });

      // 최신 결과 저장 (결과 페이지가 /api/story/latest 로 읽어감)
      global.latestStore.story = {
        success: true,
        story: result.story,
        images: result.images,
        executionTime: result.executionTime,
        workflowId: result.workflowId,
        userInput,
      };

      return res.json({
        success: true,
        redirectUrl: '/daily-miracles-result.html#latest',
        ...global.latestStore.story,
      });
    }

    // Orchestrator 비활성화일 때는 목업으로 성공 처리
    global.latestStore.story = {
      success: true,
      story: { summary: 'Mock story (orchestrator disabled)', userInput },
      images: [],
      executionTime: 0,
      workflowId: 'mock-' + Date.now(),
      userInput,
    };

    return res.json({
      success: true,
      redirectUrl: '/daily-miracles-result.html#latest',
      ...global.latestStore.story,
    });
  } catch (e) {
    console.error('❌ createStoryHandler:', e);
    return res.status(500).json({ error: 'story_creation_failed', message: e.message });
  }
}

// 공식 경로
app.post('/api/story/create', createStoryHandler);

// ✅ 별칭 경로(프론트가 어디로 보내든 여기로 집결)
app.post(
  [
    '/api/create-story',
    '/api/relationship/analyze',
    '/api/analyze-relationship',
    '/api/story',
    '/api/story/generate',
    '/api/story/new',
    '/api/daily-miracles/analyze' // ← 로그에 찍히던 경로 (중요)
  ],
  createStoryHandler
);

// 최신 결과 조회 (결과 페이지)
app.get('/api/story/latest', (req, res) => {
  try {
    if (!global.latestStore?.story) return res.status(404).json({ error: 'no_latest_story' });
    res.json(global.latestStore.story);
  } catch (e) {
    console.error('❌ /api/story/latest:', e);
    res.status(500).json({ error: 'result_fetch_failed' });
  }
});

// 별칭 조회
app.get('/api/latest-result', (req, res) => res.redirect(307, '/api/story/latest'));
app.get('/api/story/results/latest', (req, res) => res.redirect(307, '/api/story/latest'));

// (옵션) 다른 API들 — 필요 시 그대로 유지
// app.post('/api/miracle/calculate', ...);
// app.post('/api/problem/analyze', ...);

// 루트
app.get('/', (req, res) => {
  res.json({
    service: 'Daily Miracles MVP',
    version: '1.0.0',
    status: ORCHESTRATOR_ENABLED ? 'initializing' : 'standby',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      create: '/api/story/create',
      latest: '/api/story/latest',
    }
  });
});

// ═══════════════════════════════════════════════════════════
// 404 & 에러 핸들러 (항상 마지막에)
app.use((req, res) => {
  console.warn(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    hint: 'Available endpoints: /api/health, /api/story/create, /api/daily-miracles/analyze, /api/story/latest'
  });
});

app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ═══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌟 Daily Miracles MVP Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 ALLOWED_ORIGINS: ${allowedOrigins.join(', ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Registered Routes:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/dashboard');
  console.log('  POST /api/story/create');
  console.log('  POST /api/daily-miracles/analyze ← 별칭');
  console.log('  POST /api/create-story ← 별칭');
  console.log('  POST /api/relationship/analyze ← 별칭');
  console.log('  POST /api/analyze-relationship ← 별칭');
  console.log('  POST /api/story ← 별칭');
  console.log('  POST /api/story/generate ← 별칭');
  console.log('  POST /api/story/new ← 별칭');
  console.log('  GET  /api/story/latest');
  console.log('  GET  /api/latest-result');
  console.log('  GET  /api/story/results/latest');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (ORCHESTRATOR_ENABLED && orchestrator?.initialize) {
    try {
      console.log('🚀 Orchestrator initializing…');
      await orchestrator.initialize();
      console.log('✅ Orchestrator ready!');
    } catch (e) {
      console.error('❌ Orchestrator init failed:', e.message);
    }
  } else {
    console.log('⚠️  Orchestrator disabled (ORCHESTRATOR_ENABLED=false).');
  }
});

module.exports = app;
