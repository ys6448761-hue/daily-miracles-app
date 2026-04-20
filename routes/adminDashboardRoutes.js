'use strict';

/**
 * adminDashboardRoutes.js — 운영 관제 대시보드 API
 * Base path: /api/admin/dashboard
 *
 * GET /status  → 5개 카드 데이터 일괄 반환
 */

const express   = require('express');
const router    = express.Router();
const errorFeed = require('../services/errorFeed');

const db = require('../database/db');

const SERVER_START = new Date().toISOString();

// ── 인증 가드 ─────────────────────────────────────────────────────
function adminGuard(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!process.env.ADMIN_API_KEY) return next();            // 로컬: 무조건 통과
  if (key === process.env.ADMIN_API_KEY) return next();
  return res.status(401).json({ success: false, error: '관리자 인증 필요 (?key=...)' });
}

// ── Render API 호출 (선택적 — 환경변수 없으면 스킵) ──────────────
async function fetchRenderDeploys() {
  const apiKey    = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!apiKey || !serviceId) return null;

  try {
    const r = await fetch(
      `https://api.render.com/v1/services/${serviceId}/deploys?limit=5`,
      { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) return { error: `Render API ${r.status}` };
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

// ── Promise 플로우 통계 (최근 1시간) ─────────────────────────────
async function fetchFlowStats() {
  try {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const [created, opened, withPhoto] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS n FROM promise_records WHERE created_at >= $1`,
        [oneHourAgo]
      ),
      db.query(
        `SELECT COUNT(*) AS n FROM promise_records WHERE opened_at >= $1`,
        [oneHourAgo]
      ),
      db.query(
        `SELECT COUNT(*) AS n FROM promise_records WHERE created_at >= $1 AND photo_url IS NOT NULL`,
        [oneHourAgo]
      ),
    ]);
    const toN = r => parseInt(r.rows?.[0]?.n ?? r.rows?.[0]?.count ?? 0, 10);
    return {
      created1h:   toN(created),
      opened1h:    toN(opened),
      withPhoto1h: toN(withPhoto),
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ── GET /status ────────────────────────────────────────────────────
router.get('/status', adminGuard, async (req, res) => {
  const [deployData, flowStats] = await Promise.all([
    fetchRenderDeploys(),
    fetchFlowStats(),
  ]);

  // 1. Health
  let health;
  {
    const t0 = Date.now();
    try {
      await db.query('SELECT 1');
      health = { db: 'ok', dbMs: Date.now() - t0, checkedAt: new Date().toISOString() };
    } catch (e) {
      health = { db: 'error', error: e.message, dbMs: Date.now() - t0, checkedAt: new Date().toISOString() };
    }
  }

  // 2. Deploy
  const deploy = {
    commit:      process.env.RENDER_GIT_COMMIT  || 'local',
    branch:      process.env.RENDER_GIT_BRANCH  || null,
    service:     process.env.RENDER_SERVICE_NAME || null,
    serverStart: SERVER_START,
    uptimeSec:   Math.floor(process.uptime()),
    renderApi:   deployData,
  };

  // 3. Errors feed
  const errors = errorFeed.get(20);

  // 4. Alert 상태
  const alerts = {
    slackConfigured: !!(process.env.OPS_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL),
    renderApiConfigured: !!(process.env.RENDER_API_KEY && process.env.RENDER_SERVICE_ID),
    recentErrors500: errors.filter(e => e.status >= 500).length,
  };

  res.json({
    ok:        health.db === 'ok',
    ts:        new Date().toISOString(),
    health,
    deploy,
    errors,
    flowStats,
    alerts,
  });
});

// ══════════════════════════════════════════════════════════════════
// Journey 운영 통제실 — 6개 엔드포인트
// ══════════════════════════════════════════════════════════════════

async function safeQuery(sql, params = []) {
  try { return (await db.query(sql, params)).rows; } catch { return []; }
}

// ── GET /overview ─────────────────────────────────────────────────
router.get('/overview', adminGuard, async (_req, res) => {
  const [newWishes, events, growthEntries, riskRows] = await Promise.all([
    safeQuery(`SELECT COUNT(*) AS n FROM dt_wishes WHERE created_at >= CURRENT_DATE`),
    safeQuery(`SELECT
        COUNT(*) FILTER (WHERE event_type='action_clicked')    AS action_clicked,
        COUNT(*) FILTER (WHERE event_type='star_page_view')    AS page_views,
        COUNT(*) FILTER (WHERE event_type='question_shown')    AS q_shown,
        COUNT(*) FILTER (WHERE event_type='question_answered') AS q_answered,
        COUNT(*) FILTER (WHERE event_type='revisit_detected')  AS revisits,
        COUNT(*) FILTER (WHERE event_type='resonance_click')   AS resonance_click,
        COUNT(*) FILTER (WHERE event_type='resonance_created') AS resonance_created
       FROM user_events WHERE created_at >= NOW() - INTERVAL '24 hours'`),
    safeQuery(`SELECT COUNT(*) AS n FROM star_timeline_summary WHERE current_phase='성장' AND updated_at >= CURRENT_DATE`),
    safeQuery(`SELECT user_id FROM star_daily_logs
               WHERE state IN ('ANXIETY','BLOCKED') AND log_date >= CURRENT_DATE - 3
               GROUP BY user_id HAVING COUNT(*)>=3`),
  ]);

  const ev   = events[0] || {};
  const views = Number(ev.page_views) || 0;

  res.json({
    success: true,
    today: {
      new_wishes:           Number(newWishes[0]?.n) || 0,
      red_count:            riskRows.length,
      action_click_rate:    views ? +((Number(ev.action_clicked)/views)*100).toFixed(1) : 0,
      question_answer_rate: Number(ev.q_shown) ? +((Number(ev.q_answered)/Number(ev.q_shown))*100).toFixed(1) : 0,
      revisit_rate:         views ? +((Number(ev.revisits)/views)*100).toFixed(1) : 0,
      growth_entries:       Number(growthEntries[0]?.n) || 0,
      resonance_click:      Number(ev.resonance_click)   || 0,
      resonance_created:    Number(ev.resonance_created) || 0,
      resonance_conv_rate:  Number(ev.resonance_click) ? +((Number(ev.resonance_created)/Number(ev.resonance_click))*100).toFixed(1) : 0,
    },
    ts: new Date().toISOString(),
  });
});

// ── GET /risk-users ───────────────────────────────────────────────
router.get('/risk-users', adminGuard, async (req, res) => {
  const type = req.query.type || 'all';

  const [stagnant, dropoff] = await Promise.all([
    safeQuery(`SELECT user_id, state AS latest_state, COUNT(*) AS streak, MAX(log_date) AS last_date
               FROM star_daily_logs
               WHERE state IN ('ANXIETY','BLOCKED') AND log_date >= CURRENT_DATE - 7
               GROUP BY user_id, state HAVING COUNT(*) >= 3
               ORDER BY streak DESC LIMIT 20`),
    safeQuery(`SELECT user_id, MAX(created_at) AS last_seen
               FROM user_events
               WHERE event_type='star_page_view'
                 AND created_at BETWEEN CURRENT_DATE - 7 AND CURRENT_DATE - 1
                 AND user_id NOT IN (
                   SELECT DISTINCT user_id FROM user_events
                   WHERE event_type='action_clicked' AND created_at >= CURRENT_DATE - 7
                 )
               GROUP BY user_id ORDER BY last_seen DESC LIMIT 20`),
  ]);

  const fmt = (r, reason) => ({
    user_id:            r.user_id,
    latest_state:       r.latest_state || '-',
    risk_reason:        reason,
    recommended_action: reason === '3일 이상 정체' ? '공감 메시지 발송' : '재방문 유도 알림',
  });

  const result = {
    stagnant: stagnant.map(r => fmt(r, '3일 이상 정체')),
    dropoff:  dropoff.map(r => fmt(r, '행동 없음')),
    total:    stagnant.length + dropoff.length,
  };

  if (type === 'stagnant') return res.json({ success: true, users: result.stagnant });
  if (type === 'dropoff')  return res.json({ success: true, users: result.dropoff });
  res.json({ success: true, ...result });
});

// ── GET /stars ────────────────────────────────────────────────────
router.get('/stars', adminGuard, async (_req, res) => {
  const [phaseDist, stagnant, transitions] = await Promise.all([
    safeQuery(`SELECT current_phase, COUNT(*) AS n FROM star_timeline_summary GROUP BY current_phase ORDER BY n DESC`),
    safeQuery(`SELECT COUNT(DISTINCT user_id) AS n FROM star_daily_logs WHERE state IN ('BLOCKED','SEARCHING') AND log_date >= CURRENT_DATE - 3`),
    safeQuery(`SELECT current_phase, COUNT(*) AS n FROM star_timeline_summary WHERE current_phase IN ('회복','전환','성장') GROUP BY current_phase`),
  ]);

  const dist = {};
  phaseDist.forEach(r => { dist[r.current_phase] = Number(r.n); });
  const transMap = {};
  transitions.forEach(r => { transMap[r.current_phase] = Number(r.n); });

  res.json({ success: true, stars: {
    phase_distribution: dist,
    stagnant_count:  Number(stagnant[0]?.n) || 0,
    recovery_count:  transMap['회복'] || 0,
    transition_count:transMap['전환'] || 0,
    growth_count:    transMap['성장'] || 0,
  }});
});

// ── GET /places ───────────────────────────────────────────────────
router.get('/places', adminGuard, async (_req, res) => {
  const [topSpots, unstableSpots, recoverySpots] = await Promise.all([
    safeQuery(`SELECT ls.spot_type, COUNT(*) AS n FROM life_spot_logs lsl JOIN life_spots ls ON lsl.spot_id=ls.id GROUP BY ls.spot_type ORDER BY n DESC LIMIT 5`),
    safeQuery(`SELECT ls.spot_name, lsl.state, COUNT(*) AS n FROM life_spot_logs lsl JOIN life_spots ls ON lsl.spot_id=ls.id WHERE lsl.state IN ('ANXIETY','BLOCKED','SEARCHING') GROUP BY ls.spot_name, lsl.state ORDER BY n DESC LIMIT 5`),
    safeQuery(`SELECT ls.spot_name, lsl.state, COUNT(*) AS n FROM life_spot_logs lsl JOIN life_spots ls ON lsl.spot_id=ls.id WHERE lsl.state IN ('RECOVERY','GROWTH','TRANSITION') GROUP BY ls.spot_name, lsl.state ORDER BY n DESC LIMIT 5`),
  ]);

  res.json({ success: true, places: {
    top_spots:      topSpots.map(r => ({ spot_type: r.spot_type, count: Number(r.n) })),
    unstable_spots: unstableSpots.map(r => ({ spot_name: r.spot_name, state: r.state, count: Number(r.n) })),
    recovery_spots: recoverySpots.map(r => ({ spot_name: r.spot_name, state: r.state, count: Number(r.n) })),
  }});
});

// ── GET /content ──────────────────────────────────────────────────
router.get('/content', adminGuard, async (_req, res) => {
  const [questionStats, actionStats] = await Promise.all([
    safeQuery(`SELECT metadata->>'type' AS question_type,
        COUNT(*) FILTER (WHERE event_type='question_shown')    AS shown,
        COUNT(*) FILTER (WHERE event_type='question_answered') AS answered
       FROM user_events
       WHERE event_type IN ('question_shown','question_answered') AND created_at >= CURRENT_DATE - 7
       GROUP BY metadata->>'type'`),
    safeQuery(`SELECT metadata->>'phase' AS phase,
        COUNT(*) FILTER (WHERE event_type='action_clicked') AS clicked,
        COUNT(*) FILTER (WHERE event_type='star_page_view') AS views
       FROM user_events
       WHERE event_type IN ('action_clicked','star_page_view') AND created_at >= CURRENT_DATE - 7
       GROUP BY metadata->>'phase'`),
  ]);

  res.json({ success: true, content: {
    question_performance: questionStats.map(r => ({
      question_type: r.question_type || 'unknown',
      shown:         Number(r.shown),
      answered:      Number(r.answered),
      answer_rate:   Number(r.shown) ? +((Number(r.answered)/Number(r.shown))*100).toFixed(1) : 0,
    })),
    action_performance: actionStats.map(r => ({
      phase:      r.phase || 'unknown',
      views:      Number(r.views),
      clicked:    Number(r.clicked),
      click_rate: Number(r.views) ? +((Number(r.clicked)/Number(r.views))*100).toFixed(1) : 0,
    })),
  }});
});

// ── GET /operations ───────────────────────────────────────────────
router.get('/operations', adminGuard, async (_req, res) => {
  const [evCnt, logCnt, sumCnt] = await Promise.all([
    safeQuery(`SELECT COUNT(*) AS n FROM user_events WHERE created_at >= CURRENT_DATE`),
    safeQuery(`SELECT COUNT(*) AS n FROM star_daily_logs WHERE created_at >= CURRENT_DATE`),
    safeQuery(`SELECT COUNT(*) AS n FROM star_timeline_summary WHERE updated_at >= CURRENT_DATE`),
  ]);

  res.json({ success: true, operations: {
    events_today:        Number(evCnt[0]?.n)  || 0,
    daily_logs_today:    Number(logCnt[0]?.n) || 0,
    summaries_refreshed: Number(sumCnt[0]?.n) || 0,
    db_status:           db ? 'ok' : 'disconnected',
    last_updated_at:     new Date().toISOString(),
  }});
});

module.exports = router;
