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

// Root
app.get('/', (req, res) => {
  res.json({
    service: 'Daily Miracles MVP',
    version: '1.0.0',
    status: 'ready',
    endpoints: {
      health: '/api/health'
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
