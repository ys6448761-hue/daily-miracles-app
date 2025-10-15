// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Server
// Aurora 5 Orchestrator 통합 버전
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// ⚡ Aurora 5 Orchestrator
const orchestrator = require('./orchestrator');

// 📄 Roadmap Routes
const roadmapRoutes = require('./src/routes/roadmap/roadmapRoutes');

const app = express();

// ═══════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));
app.use('/pdfs', express.static('generated-pdfs'));

// ═══════════════════════════════════════════════════════════
// Orchestrator State
// ═══════════════════════════════════════════════════════════

let isOrchReady = false;

async function initializeOrchestrator() {
  try {
    console.log('🚀 Aurora 5 Orchestrator 초기화 중...');

    await orchestrator.initialize();
    isOrchReady = true;

    console.log('✅ Orchestrator 준비 완료!');

    // Health check
    try {
      const health = await orchestrator.checkHealth();
      console.log('💓 시스템 상태:', health.status);
    } catch (e) {
      console.log('⚠️  헬스체크 스킵:', e.message);
    }

  } catch (error) {
    console.error('❌ Orchestrator 초기화 실패:', error.message);
    console.error('Stack:', error.stack);
    isOrchReady = false;
  }
}

// ═══════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════

// Health Check
app.get('/api/health', async (req, res) => {
  if (!isOrchReady) {
    return res.status(503).json({ 
      status: 'initializing',
      message: 'Orchestrator is still initializing...' 
    });
  }
  
  try {
    const health = await orchestrator.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  if (!isOrchReady) {
    return res.status(503).json({
      status: 'initializing'
    });
  }

  try {
    const health = await orchestrator.checkHealth();
    const metrics = await orchestrator.getMetrics();

    res.json({
      health: health,
      metrics: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// Story Routes
// ═══════════════════════════════════════════════════════════

app.post('/api/story/create', async (req, res) => {
  if (!isOrchReady) {
    return res.status(503).json({ 
      error: 'Server is still initializing' 
    });
  }
  
  try {
    const { userInput } = req.body;
    
    // Input validation
    if (!userInput || !userInput.wish) {
      return res.status(400).json({ 
        error: 'Missing required field: wish' 
      });
    }
    
    console.log('📖 스토리 생성 요청:', userInput.wish);
    
    // ⚡ Execute workflow via Orchestrator
    const result = await orchestrator.execute('create-story', {
      input: userInput
    });
    
    console.log('✅ 스토리 생성 완료:', result.workflowId);
    
    res.json({
      success: true,
      story: result.story,
      images: result.images,
      executionTime: result.executionTime,
      workflowId: result.workflowId
    });
    
  } catch (error) {
    console.error('❌ 스토리 생성 실패:', error);
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      retries: error.retries || 0
    });
  }
});

// Story Progress (실시간 진행 상황)
app.get('/api/story/progress/:workflowId', async (req, res) => {
  if (!isOrchReady) {
    return res.status(503).json({ 
      error: 'Server is still initializing' 
    });
  }
  
  try {
    const { workflowId } = req.params;
    
    // Get progress from orchestrator
    const progress = orchestrator.getWorkflowProgress(workflowId);
    
    res.json(progress);
    
  } catch (error) {
    res.status(404).json({ 
      error: 'Workflow not found' 
    });
  }
});

// ═══════════════════════════════════════════════════════════
// Miracle Index Routes
// ═══════════════════════════════════════════════════════════

app.post('/api/miracle/calculate', async (req, res) => {
  if (!isOrchReady) {
    return res.status(503).json({ 
      error: 'Server is still initializing' 
    });
  }
  
  try {
    const { activityData } = req.body;
    
    console.log('✨ 기적지수 계산 요청');
    
    // ⚡ Execute workflow via Orchestrator
    const result = await orchestrator.execute('calculate-miracle', {
      activityData: activityData
    });
    
    console.log('✅ 기적지수 계산 완료:', result.miracleIndex);
    
    res.json({
      success: true,
      miracleIndex: result.miracleIndex,
      predictions: result.predictions,
      executionTime: result.executionTime
    });
    
  } catch (error) {
    console.error('❌ 기적지수 계산 실패:', error);
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ═══════════════════════════════════════════════════════════
// Roadmap Routes
// ═══════════════════════════════════════════════════════════

app.use('/api/roadmap', roadmapRoutes);

// ═══════════════════════════════════════════════════════════
// Problem Analysis Routes
// ═══════════════════════════════════════════════════════════

app.post('/api/problem/analyze', async (req, res) => {
  if (!isOrchReady) {
    return res.status(503).json({ 
      error: 'Server is still initializing' 
    });
  }
  
  try {
    const { problemInput } = req.body;
    
    console.log('🔍 문제 분석 요청');
    
    // ⚡ Execute workflow via Orchestrator
    const result = await orchestrator.execute('analyze-problem', {
      input: problemInput
    });
    
    console.log('✅ 문제 분석 완료');
    
    res.json({
      success: true,
      analysis: result.analysis,
      solutions: result.solutions,
      executionTime: result.executionTime
    });
    
  } catch (error) {
    console.error('❌ 문제 분석 실패:', error);
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ═══════════════════════════════════════════════════════════
// Fallback Routes
// ═══════════════════════════════════════════════════════════

// Root - Roadmap Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'roadmap.html'));
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    service: 'Daily Miracles MVP',
    version: '1.0.0',
    status: isOrchReady ? 'ready' : 'initializing',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      story: '/api/story/create',
      miracle: '/api/miracle/calculate',
      problem: '/api/problem/analyze',
      roadmap: '/api/roadmap/generate',
      roadmapTest: '/api/roadmap/test/samples'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ═══════════════════════════════════════════════════════════
// Server Start
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌟 Daily Miracles MVP Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // ⚡ Initialize Orchestrator
  await initializeOrchestrator();

  if (!isOrchReady) {
    console.log('⚠️ Orchestrator 초기화 실패 - 서버는 계속 실행됩니다');
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Server ready! Aurora 5 activated! ⚡');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// ═══════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════

async function gracefulShutdown(signal) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🛑 ${signal} 신호 수신`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (isOrchReady) {
    console.log('⚡ Orchestrator 종료 중...');
    await orchestrator.shutdown();
    console.log('✅ Orchestrator 종료 완료');
  }
  
  console.log('👋 서버 종료 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ═══════════════════════════════════════════════════════════
// Export (for testing)
// ═══════════════════════════════════════════════════════════

module.exports = app;