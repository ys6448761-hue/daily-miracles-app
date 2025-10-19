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
app.use(cors());
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
    res.json({
      success: true,
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
    res.json({
      success: true,
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
    res.json({
      success: true,
      analysis: result.analysis,
      solutions: result.solutions,
      executionTime: result.executionTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ───────────────────────────────────────────────────────────
// 404 & Error
// ───────────────────────────────────────────────────────────
app.use((req, res) => {
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
