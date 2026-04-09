/**
 * journeyLogRoutes.js — 별들의 속삭임 로그
 *
 * POST /api/dt/journey-logs
 *   journey_id  : UUID (클라이언트 생성 세션 ID)
 *   growth_text : TEXT (스쳐간 생각, 짧은 문장)
 *   context_tag : TEXT optional (morning_commute | before_sleep | moving | alone)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { generateSignals } = require('../services/galaxySignalService');
const flow    = require('../services/dreamtownFlowService');

router.post('/', async (req, res) => {
  try {
    const { journey_id, growth_text, context_tag, emotion } = req.body;

    if (!journey_id || !growth_text || !growth_text.trim()) {
      return res.status(400).json({ error: 'journey_id and growth_text are required' });
    }

    const result = await db.query(
      `INSERT INTO journey_logs (journey_id, growth_text, context_tag)
       VALUES ($1, $2, $3)
       RETURNING id, journey_id, growth_text, context_tag, created_at`,
      [journey_id, growth_text.trim(), context_tag || null]
    );

    const entry = result.rows[0];

    // Galaxy Signal 생성 — fire-and-forget (응답 지연 없음)
    generateSignals(journey_id, growth_text.trim(), context_tag || null);

    // ── flow 계측 (growth) — fire-and-forget ──────────────────
    Promise.resolve().then(async () => {
      try {
        // 이번 journey_id의 총 로그 수 확인 (day1/day7 판정용)
        const cntRes = await db.query(
          'SELECT COUNT(*) AS cnt, MIN(created_at) AS first_at FROM journey_logs WHERE journey_id = $1',
          [journey_id]
        );
        const cnt     = parseInt(cntRes.rows[0]?.cnt, 10) || 1;
        const firstAt = cntRes.rows[0]?.first_at;

        // growth/log_entry — 모든 기록
        await flow.log({ userId: journey_id, stage: 'growth', action: 'log_entry',
          value: { emotion: emotion || null, context_tag: context_tag || null }, refId: journey_id });

        // growth/day1_start — 첫 번째 기록
        if (cnt === 1) {
          await flow.log({ userId: journey_id, stage: 'growth', action: 'day1_start',
            value: { journey_id }, refId: journey_id });
        }

        // growth/day7_complete — 첫 기록일로부터 7일 이상 + 아직 완료 기록 없음
        if (firstAt) {
          const daysSince = (Date.now() - new Date(firstAt).getTime()) / 86400000;
          if (daysSince >= 7) {
            const alreadyDone = await db.query(
              `SELECT 1 FROM dreamtown_flow
               WHERE user_id = $1 AND stage = 'growth' AND action = 'day7_complete' LIMIT 1`,
              [journey_id]
            );
            if (alreadyDone.rowCount === 0) {
              await flow.log({ userId: journey_id, stage: 'growth', action: 'day7_complete',
                value: { total_logs: cnt }, refId: journey_id });
            }
          }
        }
      } catch (e) {
        console.warn('flow log failed (growth)', e.message);
      }
    });

    res.json({ log: entry });

  } catch (err) {
    console.error('[journeyLog] POST error:', err);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

module.exports = router;
