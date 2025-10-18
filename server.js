// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// Daily Miracles MVP - Simple Server (No Orchestrator)
// Orchestrator ?�이 직접 workflow ?�행
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ?�메???�비??로드
const { sendWelcomeEmail } = require('./services/emailService');
const { startScheduler } = require('./services/emailScheduler');

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// Middleware
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));
app.use('/pdfs', express.static('generated-pdfs'));

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// Mock Context Manager (간단 버전)
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

class SimpleContext {
  constructor(initialData = {}) {
    this.id = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.data = new Map();

    // 초기 ?�이???�??
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

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// Workflow ?�행 ?�수
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

async function executeDailyMiraclesWorkflow(input) {
  const startTime = Date.now();

  // Lazy load workflow (?�버 ?�작 ??로드?��? ?�음)
  const dailyMiraclesWorkflow = require('./orchestrator/workflows/dailyMiraclesWorkflow');

  // Context ?�성
  const context = new SimpleContext({ input });

  console.log('?? Daily Miracles ?�크?�로???�작:', input.user?.name);

  // �??�계 ?�차 ?�행
  for (let i = 0; i < dailyMiraclesWorkflow.steps.length; i++) {
    const step = dailyMiraclesWorkflow.steps[i];

    console.log(`   [${i + 1}/${dailyMiraclesWorkflow.steps.length}] ${step.name}...`);

    try {
      const result = await step.handler(context);
      await context.set(step.name, result);
    } catch (error) {
      console.error(`   ???�계 ?�패: ${step.name}`, error.message);
      throw error;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`???�크?�로???�료 (${duration}ms)`);

  // 최종 결과 가?�오�?
  const finalResult = await context.get('finalize-result');

  return {
    ...finalResult,
    executionTime: duration,
    workflowId: context.id
  };
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// API Routes
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

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
    console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
    console.log('??Daily Miracles 분석 ?�청');
    console.log(`   ?�용?? ${user.name}`);
    console.log(`   관�? ${responses.q6}`);
    console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');

    // Workflow ?�행
    const result = await executeDailyMiraclesWorkflow({
      user,
      responses,
      counterparty
    });

    console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
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
    console.error('??Daily Miracles 분석 ?�패:', error);
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
        error: '?�수 ?�보�?모두 ?�력?�주?�요.'
      });
    }

    // ?�메???�식 검�?
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '?�바�??�메???�식???�닙?�다.'
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
    console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
    console.log('?�� 베�? ?�스???�청');
    console.log(`   ?�름: ${application.name}`);
    console.log(`   ?�메?? ${application.email}`);
    console.log(`   ?�줄?�개: ${application.introduction || '(?�음)'}`);
    console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
    console.log('');

    // TODO: ?�제 배포 ???�이?�베?�스???�??
    // ?�재???�일 ?�스?�에 로깅
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

    // ?�영 ?�메??발송 (비동�? ?�패?�도 ?�청?� ?�료)
    sendWelcomeEmail(application.email, application.name)
      .then(result => {
        if (result.success) {
          console.log(`?�� ?�영 ?�메??발송 ?�공: ${application.email}`);
        }
      })
      .catch(err => {
        console.error(`???�영 ?�메??발송 ?�패:`, err.message);
      });

    res.json({
      success: true,
      message: '베�? ?�스???�청???�료?�었?�니??',
      applicationId: `BETA-${Date.now()}`
    });

  } catch (error) {
    console.error('??베�? ?�청 처리 ?�패:', error);

    res.status(500).json({
      success: false,
      error: '?�청 처리 �??�류가 발생?�습?�다. ?�시 ???�시 ?�도?�주?�요.'
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
        error: '?�수 ?�보�?모두 ?�력?�주?�요.'
      });
    }

    // 만족??범위 검�?
    if (satisfaction < 1 || satisfaction > 10) {
      return res.status(400).json({
        success: false,
        error: '만족?�는 1-10 ?�이??값이?�야 ?�니??'
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
    console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
    console.log('?�� ?�감 ?�드�??�출');
    console.log(`   ?�름: ${feedback.name}`);
    console.log(`   만족?? ${feedback.satisfaction}/10`);
    console.log(`   추천: ${feedback.recommend === 'yes' ? '?? : '?�니??}`);
    console.log(`   초�? ?�향: ${feedback.inviteWillingness}`);
    console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
    console.log('');

    // TODO: ?�제 배포 ???�이?�베?�스???�??
    // ?�재???�일 ?�스?�에 로깅
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

    // TODO: 카카?�톡 ?�동 발송 (Task 3)
    // 만족?��? 8???�상?�고 추천 ?�향???�는 경우 ?�별 메시지 발송

    res.json({
      success: true,
      message: '?�감???�달?�주?�서 감사?�니??',
      feedbackId: `FEEDBACK-${Date.now()}`
    });

  } catch (error) {
    console.error('???�드�??�출 ?�패:', error);

    res.status(500).json({
      success: false,
      error: '?�출 �??�류가 발생?�습?�다. ?�시 ???�시 ?�도?�주?�요.'
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
  console.error('?�� Unhandled Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// Server Start
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('');
  console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
  console.log('?�� Daily Miracles Simple Server');
  console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
  console.log(`?�� Port: ${PORT}`);
  console.log(`?�� URL: http://localhost:${PORT}`);
  console.log(`?�� Test: http://localhost:${PORT}/daily-miracles`);
  console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
  console.log('');
  console.log('??Server ready! (No Orchestrator)');
  console.log('');

  // ?�메???��?줄러 ?�작
  if (process.env.SENDGRID_API_KEY) {
    startScheduler();
    console.log('?�� ?�메???��?줄러 ?�성??);
  } else {
    console.log('?�️  SENDGRID_API_KEY가 ?�정?��? ?�아 ?�메??기능??비활?�화?�었?�니??');
  }
});

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// Graceful Shutdown
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

function gracefulShutdown(signal) {
  console.log('');
  console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
  console.log(`?�� ${signal} ?�호 ?�신`);
  console.log('?�� ?�버 종료');
  console.log('?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━');
  console.log('');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// Export (for testing)
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

module.exports = app;
