// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Simple Server (No Orchestrator)
// Orchestrator 없이 직접 workflow 실행
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 이메일 서비스 로드
const { sendWelcomeEmail } = require('./services/emailService');
const { startScheduler } = require('./services/emailScheduler');

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
// Mock Context Manager (간단 버전)
// ═══════════════════════════════════════════════════════════

class SimpleContext {
  constructor(initialData = {}) {
    this.id = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.data = new Map();

    // 초기 데이터 저장
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        this.data.set(key, value);
      });
    }
  }

  async get(key) {
    if (!this.data.has(key)) {
      throw new Error(`Context key not found: ${key}`);
    }
    return this.data.get(key);
  }

  async set(key, value) {
    this.data.set(key, value);
  }

  has(key) {
    return this.data.has(key);
  }
}

// ═══════════════════════════════════════════════════════════
// Workflow 실행 함수
// ═══════════════════════════════════════════════════════════

async function executeDailyMiraclesWorkflow(input) {
  const startTime = Date.now();

  // Lazy load workflow (서버 시작 시 로드하지 않음)
  const dailyMiraclesWorkflow = require('./orchestrator/workflows/dailyMiraclesWorkflow');

  // Context 생성
  const context = new SimpleContext({ input });

  console.log('🚀 Daily Miracles 워크플로우 시작:', input.user?.name);

  // 각 단계 순차 실행
  for (let i = 0; i < dailyMiraclesWorkflow.steps.length; i++) {
    const step = dailyMiraclesWorkflow.steps[i];

    console.log(`   [${i + 1}/${dailyMiraclesWorkflow.steps.length}] ${step.name}...`);

    try {
      const result = await step.handler(context);
      await context.set(step.name, result);
    } catch (error) {
      console.error(`   ❌ 단계 실패: ${step.name}`, error.message);
      throw error;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`✅ 워크플로우 완료 (${duration}ms)`);

  // 최종 결과 가져오기
  const finalResult = await context.get('finalize-result');

  return {
    ...finalResult,
    executionTime: duration,
    workflowId: context.id
  };
}

// ═══════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Daily Miracles Simple Server',
    timestamp: new Date().toISOString()
  });
});

// Daily Miracles Analysis
app.post('/api/daily-miracles/analyze', async (req, res) => {
  try {
    const { user, responses, counterparty } = req.body;

    // Input validation
    if (!user || !user.name || !user.birth || !user.concern) {
      return res.status(400).json({
        success: false,
        error: 'Missing required user information'
      });
    }

    if (!responses || !responses.q1 || !responses.q2 || !responses.q3 ||
        !responses.q4 || !responses.q5 || !responses.q6) {
      return res.status(400).json({
        success: false,
        error: 'Missing required responses'
      });
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Daily Miracles 분석 요청');
    console.log(`   사용자: ${user.name}`);
    console.log(`   관계: ${responses.q6}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Workflow 실행
    const result = await executeDailyMiraclesWorkflow({
      user,
      responses,
      counterparty
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    res.json({
      success: true,
      data: {
        userProfile: result.userProfile,
        counterpartyProfile: result.counterpartyProfile,
        relationshipAnalysis: result.relationshipAnalysis,
        consulting: result.consulting,
        actionPlan: result.actionPlan
      },
      executionTime: result.executionTime,
      workflowId: result.workflowId
    });

  } catch (error) {
    console.error('❌ Daily Miracles 분석 실패:', error);
    console.error(error.stack);

    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
});

// Root - Roadmap Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'roadmap.html'));
});

// Daily Miracles Page
app.get('/daily-miracles', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'daily-miracles.html'));
});

// Beta Signup Page
app.get('/beta', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'beta.html'));
});

// Feedback Page
app.get('/feedback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'feedback.html'));
});

// Beta Application API
app.post('/api/beta/apply', async (req, res) => {
  try {
    const { name, email, introduction } = req.body;

    // Input validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: '필수 정보를 모두 입력해주세요.'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '올바른 이메일 형식이 아닙니다.'
      });
    }

    const application = {
      name: name.trim(),
      email: email.trim(),
      introduction: introduction?.trim() || '',
      submittedAt: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress
    };

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 베타 테스터 신청');
    console.log(`   이름: ${application.name}`);
    console.log(`   이메일: ${application.email}`);
    console.log(`   한줄소개: ${application.introduction || '(없음)'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // TODO: 실제 배포 시 데이터베이스에 저장
    // 현재는 파일 시스템에 로깅
    const fs = require('fs');
    const logPath = path.join(__dirname, 'beta-applications.json');

    let applications = [];
    if (fs.existsSync(logPath)) {
      try {
        applications = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (err) {
        console.error('Failed to read existing applications:', err);
      }
    }

    applications.push(application);
    fs.writeFileSync(logPath, JSON.stringify(applications, null, 2));

    // 환영 이메일 발송 (비동기, 실패해도 신청은 완료)
    sendWelcomeEmail(application.email, application.name)
      .then(result => {
        if (result.success) {
          console.log(`📧 환영 이메일 발송 성공: ${application.email}`);
        }
      })
      .catch(err => {
        console.error(`❌ 환영 이메일 발송 실패:`, err.message);
      });

    res.json({
      success: true,
      message: '베타 테스터 신청이 완료되었습니다.',
      applicationId: `BETA-${Date.now()}`
    });

  } catch (error) {
    console.error('❌ 베타 신청 처리 실패:', error);

    res.status(500).json({
      success: false,
      error: '신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

// Feedback Submission API
app.post('/api/feedback/submit', async (req, res) => {
  try {
    const { name, satisfaction, goodPoints, badPoints, recommend, inviteWillingness } = req.body;

    // Input validation
    if (!name || !satisfaction || !goodPoints || !recommend) {
      return res.status(400).json({
        success: false,
        error: '필수 정보를 모두 입력해주세요.'
      });
    }

    // 만족도 범위 검증
    if (satisfaction < 1 || satisfaction > 10) {
      return res.status(400).json({
        success: false,
        error: '만족도는 1-10 사이의 값이어야 합니다.'
      });
    }

    const feedback = {
      name: name.trim(),
      satisfaction: parseInt(satisfaction),
      goodPoints: goodPoints.trim(),
      badPoints: badPoints?.trim() || '',
      recommend: recommend,
      inviteWillingness: inviteWillingness || 'not_selected',
      submittedAt: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress
    };

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 소감 피드백 제출');
    console.log(`   이름: ${feedback.name}`);
    console.log(`   만족도: ${feedback.satisfaction}/10`);
    console.log(`   추천: ${feedback.recommend === 'yes' ? '예' : '아니오'}`);
    console.log(`   초대 의향: ${feedback.inviteWillingness}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // TODO: 실제 배포 시 데이터베이스에 저장
    // 현재는 파일 시스템에 로깅
    const fs = require('fs');
    const logPath = path.join(__dirname, 'feedback-submissions.json');

    let feedbacks = [];
    if (fs.existsSync(logPath)) {
      try {
        feedbacks = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (err) {
        console.error('Failed to read existing feedbacks:', err);
      }
    }

    feedbacks.push(feedback);
    fs.writeFileSync(logPath, JSON.stringify(feedbacks, null, 2));

    // TODO: 카카오톡 자동 발송 (Task 3)
    // 만족도가 8점 이상이고 추천 의향이 있는 경우 특별 메시지 발송

    res.json({
      success: true,
      message: '소감을 전달해주셔서 감사합니다!',
      feedbackId: `FEEDBACK-${Date.now()}`
    });

  } catch (error) {
    console.error('❌ 피드백 제출 실패:', error);

    res.status(500).json({
      success: false,
      error: '제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    service: 'Daily Miracles Simple Server',
    version: '1.0.0-simple',
    status: 'ready',
    endpoints: {
      health: '/api/health',
      dailyMiracles: '/api/daily-miracles/analyze'
    },
    note: 'Simplified server without Orchestrator for testing'
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

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌟 Daily Miracles Simple Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📝 Test: http://localhost:${PORT}/daily-miracles`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ Server ready! (No Orchestrator)');
  console.log('');

  // 이메일 스케줄러 시작
  if (process.env.SENDGRID_API_KEY) {
    startScheduler();
    console.log('📧 이메일 스케줄러 활성화');
  } else {
    console.log('⚠️  SENDGRID_API_KEY가 설정되지 않아 이메일 기능이 비활성화되었습니다.');
  }
});

// ═══════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════

function gracefulShutdown(signal) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🛑 ${signal} 신호 수신`);
  console.log('👋 서버 종료');
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
