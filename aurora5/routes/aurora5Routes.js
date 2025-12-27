/**
 * Aurora5 - API Routes (v2)
 * 자동화 엔진 엔드포인트
 *
 * @version 2.0
 *
 * 엔드포인트:
 * POST /webhooks/wix/inbox-created (Wix 인입) - X-API-KEY 검증
 * POST /api/magic/generate (토큰 생성)
 * GET  /api/results/:token (결과 조회)
 * POST /jobs/daily-9am (매일 발송) - X-CRON-SECRET 검증
 * GET  /admin/queue?date=YYYY-MM-DD (발송 예정)
 * GET  /admin/stats?date=YYYY-MM-DD (현황)
 * GET  /admin/failures?date=YYYY-MM-DD (실패 목록)
 * POST /admin/resend (재발송)
 */

const express = require('express');
const router = express.Router();

// 미들웨어
const { verifyApiKey, verifyCronSecret, verifyAdmin, requestLogger } = require('../middleware/auth');

// 서비스 로딩
const inboxService = require('../services/inboxService');
const analysisService = require('../services/analysisService');
const magicLinkService = require('../services/magicLinkService');
const kakaoService = require('../services/kakaoService');
const dashboardService = require('../services/dashboardService');
const { runDailyJob, processNewInboxes, runFullScheduler } = require('../jobs/schedulerJob');

// DB
const db = require('../../database/db');

// 요청 로깅
router.use(requestLogger);

// ═══════════════════════════════════════════════════════════
// 1. Webhook: Wix 폼 인입 (X-API-KEY 검증)
// ═══════════════════════════════════════════════════════════

/**
 * POST /webhooks/wix/inbox-created
 * Wix 폼 제출 시 호출
 *
 * Headers: X-API-KEY: {WIX_WEBHOOK_API_KEY}
 * Body: { sourceId, type, payload }
 *
 * 멱등성: sourceId가 이미 존재하면 기존 데이터 반환
 */
router.post('/webhooks/wix/inbox-created', verifyApiKey, async (req, res) => {
  console.log('📥 Wix webhook received');

  try {
    const payload = req.body;

    // Wix 페이로드 구조 처리
    const formData = payload.data || payload.formData || payload;
    const sourceId = payload.sourceId || payload.formId || payload.submissionId || null;
    const type = formData.type || payload.type || 'wish';

    // 멱등성 체크: sourceId가 이미 존재하는지 확인
    if (sourceId) {
      const existing = await db.query(
        'SELECT id, status FROM mvp_inbox WHERE source = $1 AND source_id = $2',
        ['wix', sourceId]
      );

      if (existing.rows.length > 0) {
        console.log(`⚠️ Duplicate sourceId: ${sourceId}, returning existing inbox`);
        return res.status(200).json({
          success: true,
          message: 'Already exists (idempotent)',
          data: {
            inboxId: existing.rows[0].id,
            status: existing.rows[0].status,
            duplicate: true
          }
        });
      }
    }

    // Inbox 생성
    const inbox = await inboxService.createInbox({
      source: 'wix',
      sourceId,
      type,
      payload: formData
    });

    res.status(201).json({
      success: true,
      message: 'Inbox created',
      data: {
        inboxId: inbox.id,
        status: inbox.status,
        duplicate: false
      }
    });

    // 비동기로 즉시 처리 시작
    setImmediate(async () => {
      try {
        await processNewInboxes();
      } catch (e) {
        console.error('Background process error:', e);
      }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 2. Magic Link 생성
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/magic/generate
 * 수동으로 매직 링크 생성
 */
router.post('/api/magic/generate', async (req, res) => {
  try {
    const { inboxId, expiryDays } = req.body;

    if (!inboxId) {
      return res.status(400).json({
        success: false,
        error: 'inboxId is required'
      });
    }

    // Inbox 조회
    const inbox = await inboxService.getInboxById(inboxId);
    if (!inbox) {
      return res.status(404).json({
        success: false,
        error: 'Inbox not found'
      });
    }

    const payloadNorm = typeof inbox.payload_norm === 'string'
      ? JSON.parse(inbox.payload_norm)
      : inbox.payload_norm;

    // 분석 생성
    const analysis = await analysisService.generateMissionAnalysis(payloadNorm);
    const analysisText = analysisService.analysisToText(analysis, payloadNorm.nickname);

    // 매직 링크 생성
    const result = await magicLinkService.createResult({
      inboxId,
      analysisJson: analysis,
      analysisText,
      expiryDays: expiryDays || 30
    });

    res.status(201).json({
      success: true,
      data: {
        token: result.token,
        url: result.url,
        expiresAt: result.expires_at
      }
    });

  } catch (error) {
    console.error('❌ Magic link generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 3. 결과 조회 (개인 페이지)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/results/:token
 * 매직 링크로 결과 조회
 */
router.get('/api/results/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await magicLinkService.getResultByToken(token);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '결과를 찾을 수 없습니다.',
        hint: '링크가 만료되었거나 잘못된 주소입니다.'
      });
    }

    if (result.expired) {
      return res.status(410).json({
        success: false,
        error: '링크가 만료되었습니다.',
        expiredAt: result.expiresAt
      });
    }

    res.json({
      success: true,
      data: {
        nickname: result.nickname,
        type: result.type,
        analysis: result.analysis,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt
      }
    });

  } catch (error) {
    console.error('❌ Result fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 4. 스케줄러 트리거 (X-CRON-SECRET 검증)
// ═══════════════════════════════════════════════════════════

/**
 * POST /jobs/daily-9am
 * 매일 발송 작업 수동/자동 트리거
 *
 * Headers: X-CRON-SECRET: {CRON_SECRET}
 */
router.post('/jobs/daily-9am', verifyCronSecret, async (req, res) => {
  console.log('🕘 Daily job triggered via API');

  try {
    const stats = await runFullScheduler();

    res.json({
      success: true,
      message: 'Daily job completed',
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Daily job error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 5. Admin: 발송 예정 목록
// ═══════════════════════════════════════════════════════════

/**
 * GET /admin/queue?date=YYYY-MM-DD
 * 특정 날짜 발송 예정 목록
 */
router.get('/admin/queue', verifyAdmin, async (req, res) => {
  try {
    const { date } = req.query;

    let query = `
      SELECT
        t.id as trial_id,
        t.phone,
        t.last_day_sent + 1 as next_day,
        t.next_send_at,
        t.ref_code,
        r.token,
        i.payload_norm->>'nickname' as nickname,
        i.payload_norm->>'wish' as wish_summary
      FROM trials t
      JOIN mvp_results r ON r.token = t.token
      JOIN mvp_inbox i ON i.id = t.inbox_id
      WHERE t.active = TRUE AND t.last_day_sent < 7
    `;

    const params = [];

    if (date) {
      query += ` AND DATE(t.next_send_at AT TIME ZONE 'Asia/Seoul') = $1`;
      params.push(date);
    } else {
      query += ` AND t.next_send_at <= NOW() + INTERVAL '1 day'`;
    }

    query += ` ORDER BY t.next_send_at`;

    const result = await db.query(query, params);

    const queue = result.rows.map(t => ({
      trialId: t.trial_id,
      phone: t.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      nickname: t.nickname || '익명',
      nextDay: t.next_day,
      nextSendAt: t.next_send_at,
      refCode: t.ref_code,
      token: t.token?.substring(0, 8) + '...'
    }));

    res.json({
      success: true,
      data: {
        date: date || 'today',
        total: queue.length,
        queue
      }
    });

  } catch (error) {
    console.error('❌ Queue fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 6. Admin: 통계
// ═══════════════════════════════════════════════════════════

/**
 * GET /admin/stats?date=YYYY-MM-DD
 * 전체 현황 통계
 */
router.get('/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const { date } = req.query;

    // Inbox 통계
    const inboxStats = await inboxService.getStats();

    // 발송 통계 (날짜별)
    let sendStatsQuery = `
      SELECT
        DATE(created_at AT TIME ZONE 'Asia/Seoul') as send_date,
        day,
        status,
        COUNT(*) as count
      FROM send_log
    `;

    if (date) {
      sendStatsQuery += ` WHERE DATE(created_at AT TIME ZONE 'Asia/Seoul') = '${date}'`;
    } else {
      sendStatsQuery += ` WHERE created_at >= NOW() - INTERVAL '7 days'`;
    }

    sendStatsQuery += ` GROUP BY DATE(created_at AT TIME ZONE 'Asia/Seoul'), day, status ORDER BY send_date DESC, day`;

    const sendStatsResult = await db.query(sendStatsQuery);

    // 완주율
    const completionStats = await dashboardService.getCompletionStats();

    // Solapi 잔액 (선택)
    let balance = null;
    try {
      balance = await kakaoService.getBalance();
    } catch (e) {
      // ignore
    }

    res.json({
      success: true,
      data: {
        date: date || 'last 7 days',
        inbox: inboxStats,
        send: sendStatsResult.rows,
        completion: completionStats,
        balance,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Stats fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 7. Admin: 실패 목록
// ═══════════════════════════════════════════════════════════

/**
 * GET /admin/failures?date=YYYY-MM-DD
 * 발송 실패 목록
 */
router.get('/admin/failures', verifyAdmin, async (req, res) => {
  try {
    const { date, limit = 50 } = req.query;

    let query = `
      SELECT
        s.id as log_id,
        s.trial_id,
        s.day,
        s.template_code,
        s.to_address,
        s.error,
        s.created_at,
        t.phone,
        i.payload_norm->>'nickname' as nickname
      FROM send_log s
      JOIN trials t ON t.id = s.trial_id
      JOIN mvp_inbox i ON i.id = t.inbox_id
      WHERE s.status = 'FAILED'
    `;

    const params = [];

    if (date) {
      query += ` AND DATE(s.created_at AT TIME ZONE 'Asia/Seoul') = $1`;
      params.push(date);
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        date: date || 'all',
        total: result.rows.length,
        failures: result.rows.map(f => ({
          logId: f.log_id,
          trialId: f.trial_id,
          day: f.day,
          nickname: f.nickname || '익명',
          phone: f.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
          error: f.error,
          createdAt: f.created_at
        }))
      }
    });

  } catch (error) {
    console.error('❌ Failures fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 8. Admin: 재발송
// ═══════════════════════════════════════════════════════════

/**
 * POST /admin/resend
 * 특정 Trial 재발송
 *
 * Body: { trialId, day }
 */
router.post('/admin/resend', verifyAdmin, async (req, res) => {
  try {
    const { trialId, day } = req.body;

    if (!trialId) {
      return res.status(400).json({
        success: false,
        error: 'trialId is required'
      });
    }

    // Trial 조회
    const trialResult = await db.query(`
      SELECT t.*, r.analysis_json, i.payload_norm
      FROM trials t
      JOIN mvp_results r ON r.token = t.token
      JOIN mvp_inbox i ON i.id = t.inbox_id
      WHERE t.id = $1
    `, [trialId]);

    if (trialResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trial not found'
      });
    }

    const trial = trialResult.rows[0];
    const targetDay = day || trial.last_day_sent + 1;

    const analysis = typeof trial.analysis_json === 'string'
      ? JSON.parse(trial.analysis_json)
      : trial.analysis_json;

    const nickname = trial.payload_norm?.nickname || '익명';
    const magicUrl = magicLinkService.buildMagicUrl(trial.token);
    const mission = analysis.missions?.[targetDay - 1];

    if (!mission) {
      return res.status(400).json({
        success: false,
        error: `No mission for Day ${targetDay}`
      });
    }

    // 메시지 생성 및 발송
    const message = kakaoService.buildDayMessage(nickname, targetDay, mission, magicUrl);

    await kakaoService.sendKakaoAlimtalk({
      to: trial.phone,
      templateCode: message.templateCode,
      variables: message.variables,
      trialId: trial.id,
      day: targetDay
    });

    res.json({
      success: true,
      message: `Resent Day ${targetDay} to Trial #${trialId}`,
      data: {
        trialId,
        day: targetDay,
        phone: trial.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      }
    });

  } catch (error) {
    console.error('❌ Resend error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 9. Admin: 전체 대시보드
// ═══════════════════════════════════════════════════════════

/**
 * GET /admin/dashboard
 * 전체 대시보드 데이터 (한 번에)
 */
router.get('/admin/dashboard', verifyAdmin, async (req, res) => {
  try {
    const dashboard = await dashboardService.getFullDashboard();

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('❌ Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
