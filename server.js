// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// Daily Miracles MVP - Simple Server (No Orchestrator)
// Orchestrator ?†ì´ ì§ì ‘ workflow ?¤í–‰
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ?´ë©”???œë¹„??ë¡œë“œ
const { sendWelcomeEmail } = require('./services/emailService');
const { startScheduler } = require('./services/emailScheduler');

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// Middleware
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));
app.use('/pdfs', express.static('generated-pdfs'));

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// Mock Context Manager (ê°„ë‹¨ ë²„ì „)
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

class SimpleContext {
  constructor(initialData = {}) {
    this.id = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.data = new Map();

    // ì´ˆê¸° ?°ì´???€??
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

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// Workflow ?¤í–‰ ?¨ìˆ˜
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

async function executeDailyMiraclesWorkflow(input) {
  const startTime = Date.now();

  // Lazy load workflow (?œë²„ ?œì‘ ??ë¡œë“œ?˜ì? ?ŠìŒ)
  const dailyMiraclesWorkflow = require('./orchestrator/workflows/dailyMiraclesWorkflow');

  // Context ?ì„±
  const context = new SimpleContext({ input });

  console.log('?? Daily Miracles ?Œí¬?Œë¡œ???œì‘:', input.user?.name);

  // ê°??¨ê³„ ?œì°¨ ?¤í–‰
  for (let i = 0; i < dailyMiraclesWorkflow.steps.length; i++) {
    const step = dailyMiraclesWorkflow.steps[i];

    console.log(`   [${i + 1}/${dailyMiraclesWorkflow.steps.length}] ${step.name}...`);

    try {
      const result = await step.handler(context);
      await context.set(step.name, result);
    } catch (error) {
      console.error(`   ???¨ê³„ ?¤íŒ¨: ${step.name}`, error.message);
      throw error;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`???Œí¬?Œë¡œ???„ë£Œ (${duration}ms)`);

  // ìµœì¢… ê²°ê³¼ ê°€?¸ì˜¤ê¸?
  const finalResult = await context.get('finalize-result');

  return {
    ...finalResult,
    executionTime: duration,
    workflowId: context.id
  };
}

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// API Routes
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

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
    console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
    console.log('??Daily Miracles ë¶„ì„ ?”ì²­');
    console.log(`   ?¬ìš©?? ${user.name}`);
    console.log(`   ê´€ê³? ${responses.q6}`);
    console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');

    // Workflow ?¤í–‰
    const result = await executeDailyMiraclesWorkflow({
      user,
      responses,
      counterparty
    });

    console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
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
    console.error('??Daily Miracles ë¶„ì„ ?¤íŒ¨:', error);
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
        error: '?„ìˆ˜ ?•ë³´ë¥?ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”.'
      });
    }

    // ?´ë©”???•ì‹ ê²€ì¦?
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '?¬ë°”ë¥??´ë©”???•ì‹???„ë‹™?ˆë‹¤.'
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
    console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
    console.log('?‰ ë² í? ?ŒìŠ¤??? ì²­');
    console.log(`   ?´ë¦„: ${application.name}`);
    console.log(`   ?´ë©”?? ${application.email}`);
    console.log(`   ?œì¤„?Œê°œ: ${application.introduction || '(?†ìŒ)'}`);
    console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
    console.log('');

    // TODO: ?¤ì œ ë°°í¬ ???°ì´?°ë² ?´ìŠ¤???€??
    // ?„ì¬???Œì¼ ?œìŠ¤?œì— ë¡œê¹…
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

    // ?˜ì˜ ?´ë©”??ë°œì†¡ (ë¹„ë™ê¸? ?¤íŒ¨?´ë„ ? ì²­?€ ?„ë£Œ)
    sendWelcomeEmail(application.email, application.name)
      .then(result => {
        if (result.success) {
          console.log(`?“§ ?˜ì˜ ?´ë©”??ë°œì†¡ ?±ê³µ: ${application.email}`);
        }
      })
      .catch(err => {
        console.error(`???˜ì˜ ?´ë©”??ë°œì†¡ ?¤íŒ¨:`, err.message);
      });

    res.json({
      success: true,
      message: 'ë² í? ?ŒìŠ¤??? ì²­???„ë£Œ?˜ì—ˆ?µë‹ˆ??',
      applicationId: `BETA-${Date.now()}`
    });

  } catch (error) {
    console.error('??ë² í? ? ì²­ ì²˜ë¦¬ ?¤íŒ¨:', error);

    res.status(500).json({
      success: false,
      error: '? ì²­ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.'
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
        error: '?„ìˆ˜ ?•ë³´ë¥?ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”.'
      });
    }

    // ë§Œì¡±??ë²”ìœ„ ê²€ì¦?
    if (satisfaction < 1 || satisfaction > 10) {
      return res.status(400).json({
        success: false,
        error: 'ë§Œì¡±?„ëŠ” 1-10 ?¬ì´??ê°’ì´?´ì•¼ ?©ë‹ˆ??'
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
    console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
    console.log('?’¬ ?Œê° ?¼ë“œë°??œì¶œ');
    console.log(`   ?´ë¦„: ${feedback.name}`);
    console.log(`   ë§Œì¡±?? ${feedback.satisfaction}/10`);
    console.log(`   ì¶”ì²œ: ${feedback.recommend === 'yes' ? '?? : '?„ë‹ˆ??}`);
    console.log(`   ì´ˆë? ?˜í–¥: ${feedback.inviteWillingness}`);
    console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
    console.log('');

    // TODO: ?¤ì œ ë°°í¬ ???°ì´?°ë² ?´ìŠ¤???€??
    // ?„ì¬???Œì¼ ?œìŠ¤?œì— ë¡œê¹…
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

    // TODO: ì¹´ì¹´?¤í†¡ ?ë™ ë°œì†¡ (Task 3)
    // ë§Œì¡±?„ê? 8???´ìƒ?´ê³  ì¶”ì²œ ?˜í–¥???ˆëŠ” ê²½ìš° ?¹ë³„ ë©”ì‹œì§€ ë°œì†¡

    res.json({
      success: true,
      message: '?Œê°???„ë‹¬?´ì£¼?”ì„œ ê°ì‚¬?©ë‹ˆ??',
      feedbackId: `FEEDBACK-${Date.now()}`
    });

  } catch (error) {
    console.error('???¼ë“œë°??œì¶œ ?¤íŒ¨:', error);

    res.status(500).json({
      success: false,
      error: '?œì¶œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.'
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
  console.error('?’¥ Unhandled Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// Server Start
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('');
  console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
  console.log('?ŒŸ Daily Miracles Simple Server');
  console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
  console.log(`?“¡ Port: ${PORT}`);
  console.log(`?Œ URL: http://localhost:${PORT}`);
  console.log(`?“ Test: http://localhost:${PORT}/daily-miracles`);
  console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
  console.log('');
  console.log('??Server ready! (No Orchestrator)');
  console.log('');

  // ?´ë©”???¤ì?ì¤„ëŸ¬ ?œì‘
  if (process.env.SENDGRID_API_KEY) {
    startScheduler();
    console.log('?“§ ?´ë©”???¤ì?ì¤„ëŸ¬ ?œì„±??);
  } else {
    console.log('? ï¸  SENDGRID_API_KEYê°€ ?¤ì •?˜ì? ?Šì•„ ?´ë©”??ê¸°ëŠ¥??ë¹„í™œ?±í™”?˜ì—ˆ?µë‹ˆ??');
  }
});

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// Graceful Shutdown
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

function gracefulShutdown(signal) {
  console.log('');
  console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
  console.log(`?›‘ ${signal} ? í˜¸ ?˜ì‹ `);
  console.log('?‘‹ ?œë²„ ì¢…ë£Œ');
  console.log('?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”');
  console.log('');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??
// Export (for testing)
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??

module.exports = app;
