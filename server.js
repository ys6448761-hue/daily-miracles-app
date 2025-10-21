// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Server (Production-Ready, Clean)
// ═══════════════════════════════════════════════════════════
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ═══════════════════════════════════════════════════════════
// 1. Orchestrator: 환경변수로 on/off
// ═══════════════════════════════════════════════════════════
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
// 2. CORS (환경변수 ALLOWED_ORIGINS="https://a.com,https://b.com")
// ═══════════════════════════════════════════════════════════
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [
      'https://daily-miracles-app.onrender.com',
      'http://localhost:3000',
      'http://localhost:5000'
    ];

app.use(cors({
  origin(origin, cb) {
    // Origin이 없는 경우 (curl, Postman, 서버간 요청 등)
    if (!origin) {
      return cb(null, true);
    }

    // Whitelist 체크
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed: ${origin}`);
      return cb(null, true);
    }

    // 디버깅: whitelist에 없어도 허용 (프로덕션에서는 cb(null, false)로 변경 권장)
    console.warn(`⚠️  CORS origin not in whitelist (but allowing): ${origin}`);
    return cb(null, true); // ← 디버깅 목적으로 임시 허용
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ═══════════════════════════════════════════════════════════
// 3. Body Parsing & Static Files
// ═══════════════════════════════════════════════════════════
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════
// 4. 요청 로깅 미들웨어 (ENABLE_REQUEST_LOG=true로 활성화)
// ═══════════════════════════════════════════════════════════
const ENABLE_REQUEST_LOG = String(process.env.ENABLE_REQUEST_LOG || 'true') === 'true';

if (ENABLE_REQUEST_LOG) {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
    console.log(`  Origin: ${req.get('origin') || 'N/A'}`);
    console.log(`  Content-Type: ${req.get('content-type') || 'N/A'}`);
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log(`  Body keys: ${Object.keys(req.body || {}).join(', ') || '(empty)'}`);
    }
    next();
  });
}

// ═══════════════════════════════════════════════════════════
// 5. In-memory Latest Store (결과 페이지 조회용)
// ═══════════════════════════════════════════════════════════
global.latestStore = { story: null };

// ═══════════════════════════════════════════════════════════
// 6. API Routes - Health & Dashboard
// ═══════════════════════════════════════════════════════════

// Health Check (항상 200 보장)
app.get('/api/health', async (req, res) => {
  const base = {
    status: ORCHESTRATOR_ENABLED ? 'initializing' : 'standby',
    timestamp: new Date().toISOString()
  };

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

// Dashboard (Optional)
app.get('/api/dashboard', async (req, res) => {
  if (!(ORCHESTRATOR_ENABLED && orchestrator)) {
    return res.json({ status: 'standby', message: 'Orchestrator disabled' });
  }
  try {
    const health = await orchestrator.checkHealth?.();
    const context = orchestrator.context?.getFullContext?.();
    res.json({ health, context, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 7. Story 생성 핸들러 (단일 정의)
// ═══════════════════════════════════════════════════════════
async function createStoryHandler(req, res) {
  console.log(`🎯 createStoryHandler called via: ${req.method} ${req.path}`);

  try {
    // 입력 파싱: req.body.userInput 또는 req.body 직접
    const userInput = req.body?.userInput || req.body;
    console.log('📥 Received userInput:', JSON.stringify(userInput, null, 2));

    // 필수 필드 검증
    if (!userInput || !userInput.wish) {
      console.warn('⚠️  Missing required field: wish');
      return res.status(400).json({
        error: 'Missing required field: wish',
        received: userInput
      });
    }

    // Orchestrator가 활성화된 경우 실제 워크플로 호출
    if (ORCHESTRATOR_ENABLED && orchestrator?.execute) {
      console.log('🚀 Executing orchestrator workflow...');
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

      console.log('✅ Story created successfully via orchestrator');
      return res.json({
        success: true,
        redirectUrl: '/daily-miracles-result.html#latest',
        ...global.latestStore.story,
      });
    }

    // Orchestrator 비활성화일 때는 Mock으로 성공 처리
    console.log('📦 Orchestrator disabled - returning mock response');
    global.latestStore.story = {
      success: true,
      story: {
        summary: 'Mock story (orchestrator disabled)',
        fullStory: `이것은 "${userInput.wish}"에 대한 테스트 스토리입니다.`,
        userInput
      },
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
    console.error('❌ createStoryHandler error:', e);
    return res.status(500).json({
      error: 'story_creation_failed',
      message: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}

// ═══════════════════════════════════════════════════════════
// 8. Story 생성 라우트 (공식 + 별칭)
// ═══════════════════════════════════════════════════════════

// 공식 엔드포인트
app.post('/api/story/create', createStoryHandler);

// 별칭 엔드포인트 (프론트가 어디로 보내든 모두 처리)
app.post('/api/daily-miracles/analyze', createStoryHandler);      // ← 문제의 핵심 경로
app.post('/api/relationship/analyze', createStoryHandler);
app.post('/api/analyze-relationship', createStoryHandler);
app.post('/api/create-story', createStoryHandler);
app.post('/api/story', createStoryHandler);
app.post('/api/story/generate', createStoryHandler);
app.post('/api/story/new', createStoryHandler);

// ═══════════════════════════════════════════════════════════
// 9. 결과 조회 라우트
// ═══════════════════════════════════════════════════════════

// 최신 결과 조회 (결과 페이지)
app.get('/api/story/latest', (req, res) => {
  try {
    if (!global.latestStore?.story) {
      return res.status(404).json({
        error: 'no_latest_story',
        message: 'No story has been created yet'
      });
    }
    res.json(global.latestStore.story);
  } catch (e) {
    console.error('❌ /api/story/latest error:', e);
    res.status(500).json({ error: 'result_fetch_failed', message: e.message });
  }
});

// 별칭 조회 (307 리다이렉트)
app.get('/api/latest-result', (req, res) => {
  res.redirect(307, '/api/story/latest');
});

app.get('/api/story/results/latest', (req, res) => {
  res.redirect(307, '/api/story/latest');
});

// ═══════════════════════════════════════════════════════════
// 10. 루트 경로 (옵션: 리다이렉트 또는 정보 표시)
// ═══════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  // 옵션 1: /daily-miracles.html로 리다이렉트 (주석 해제하여 사용)
  // return res.redirect(302, '/daily-miracles.html');

  // 옵션 2: API 정보 표시 (현재 설정)
  res.json({
    service: 'Daily Miracles MVP',
    version: '1.0.0',
    status: ORCHESTRATOR_ENABLED ? 'active' : 'standby',
    message: '11페이지 개인 스토리북 생성 서비스',
    frontendUrl: '/daily-miracles.html',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      createStory: '/api/story/create',
      analyze: '/api/daily-miracles/analyze',
      latest: '/api/story/latest',
    }
  });
});

// ═══════════════════════════════════════════════════════════
// 11. 404 & 에러 핸들러 (항상 마지막에 위치)
// ═══════════════════════════════════════════════════════════

// 404 Not Found (등록되지 않은 모든 경로)
app.use((req, res) => {
  console.warn(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/story/create',
      'POST /api/daily-miracles/analyze',
      'GET /api/story/latest'
    ]
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ═══════════════════════════════════════════════════════════
// 12. 서버 시작
// ═══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌟 Daily Miracles MVP Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 ALLOWED_ORIGINS: ${allowedOrigins.join(', ')}`);
  console.log(`📊 Request Logging: ${ENABLE_REQUEST_LOG ? 'enabled' : 'disabled'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Registered Routes:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/dashboard');
  console.log('  POST /api/story/create (공식)');
  console.log('  POST /api/daily-miracles/analyze ← 별칭 (핵심!)');
  console.log('  POST /api/relationship/analyze ← 별칭');
  console.log('  POST /api/analyze-relationship ← 별칭');
  console.log('  POST /api/create-story ← 별칭');
  console.log('  POST /api/story ← 별칭');
  console.log('  POST /api/story/generate ← 별칭');
  console.log('  POST /api/story/new ← 별칭');
  console.log('  GET  /api/story/latest');
  console.log('  GET  /api/latest-result (→ 307 redirect)');
  console.log('  GET  /api/story/results/latest (→ 307 redirect)');
  console.log('  GET  /');
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
    console.log('📦 Mock responses will be used for all story creation requests.');
  }

  console.log('\n✅ Server ready!\n');
});

module.exports = app;
