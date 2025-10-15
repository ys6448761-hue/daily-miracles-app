// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Simple Server (Orchestrator 없음)
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ═══════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ═══════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 1. Problem Analyze
app.post('/api/problem/analyze', (req, res) => {
  res.json({
    success: true,
    analysis: { category: '생활습관', severity: 'medium' },
    solutions: ['해결책 1', '해결책 2', '해결책 3'],
    executionTime: 1500
  });
});

// 2. Story Create
app.post('/api/story/create', (req, res) => {
  res.json({
    success: true,
    story: { title: '30일 기적 이야기', pages: [{page: 1, content: 'test'}] },
    images: ['/img1.jpg'],
    workflowId: 'mock-123'
  });
});

// 3. Miracle Calculate
app.post('/api/miracle/calculate', (req, res) => {
  res.json({
    success: true,
    miracleIndex: 78,
    predictions: [{category: '7일후', prediction: 'test', probability: 85}],
    executionTime: 2500
  });
});

// 4. Result Page
app.get('/result.html', (req, res) => {
  res.send('<html><body><h1>Result Page</h1><p>공유 버튼</p></body></html>');
});

// Root
app.get('/', (req, res) => {
  res.json({
    service: 'Daily Miracles MVP - Mock Test Server',
    version: '1.0.0-mock',
    status: 'ready',
    endpoints: {
      health: '/api/health',
      problemAnalyze: '/api/problem/analyze',
      storyCreate: '/api/story/create',
      miracleCalculate: '/api/miracle/calculate',
      resultPage: '/result.html'
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
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ═══════════════════════════════════════════════════════════
// Server Start
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌟 Daily Miracles MVP Server (Simple Mode)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ Server ready!');
  console.log('');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 서버 종료');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 서버 종료');
  process.exit(0);
});

module.exports = app;
