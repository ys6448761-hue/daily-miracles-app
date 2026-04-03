/**
 * dtOrchestrator.js
 * Aurora5 이벤트 기반 오케스트레이터 — 진입점
 *
 * 흐름:
 *   emitEvent() → dt_orchestrator_events INSERT
 *   processEvent() → decisionEngine → agentRunner × N → decisions 기록
 */

const db = require('../../../database/db');
const { decide } = require('./decisionEngine');
const agentRunner = require('./agentRunner');
const { makeLogger } = require('../../../utils/logger');

const log = makeLogger('dtOrchestrator');
const MAX_ATTEMPTS = 3;

// ── 이벤트 발행 (API에서 호출) ────────────────────────────────
async function emitEvent(starId, eventType, payload = {}) {
  const result = await db.query(
    `INSERT INTO dt_orchestrator_events (star_id, event_type, payload)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [starId, eventType, JSON.stringify(payload)]
  );
  const eventId = result.rows[0].id;
  log.info(`이벤트 발행 [${eventType}]`, { star_id: starId, event_id: eventId });
  return eventId;
}

// ── 이벤트 처리 (Worker에서 호출) ────────────────────────────
async function processEvent(eventId) {
  // processing으로 원자적 전환
  const evResult = await db.query(
    `UPDATE dt_orchestrator_events
     SET status='processing', attempts=attempts+1
     WHERE id=$1 AND status='pending'
     RETURNING id, star_id, event_type, payload, attempts`,
    [eventId]
  );
  if (evResult.rows.length === 0) return null;  // 이미 처리 중 또는 완료

  const ev = evResult.rows[0];
  const payload = ev.payload || {};

  try {
    // Decision Engine 판단
    const decisions = decide(ev.event_type, payload);

    if (decisions.length === 0) {
      await _markDone(eventId, ev.star_id, [], '에이전트 없음');
      return;
    }

    // Decision 기록
    await db.query(
      `INSERT INTO dt_orchestrator_decisions
         (star_id, event_id, decision_summary, selected_agents, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        ev.star_id, eventId,
        `${ev.event_type} → ${decisions.map(d => d.agentName).join(', ')}`,
        decisions.map(d => d.agentName),
        `Rule matched: ${ev.event_type}`,
      ]
    );

    // 에이전트 순차 실행 (의존 관계 있는 경우를 위해 순차 처리)
    for (const { agentName, input } of decisions) {
      try {
        await agentRunner.run(ev.star_id, agentName, { ...input, star_id: ev.star_id }, eventId);
      } catch (agentErr) {
        // 개별 에이전트 실패는 이벤트 전체를 실패시키지 않음
        log.warn(`에이전트 실패 (계속 진행)`, { agent: agentName, error: agentErr.message });
      }
    }

    await _markDone(eventId, ev.star_id, decisions.map(d => d.agentName));

  } catch (err) {
    const isFinal = ev.attempts >= MAX_ATTEMPTS;
    await db.query(
      `UPDATE dt_orchestrator_events
       SET status=$1, error_msg=$2
       WHERE id=$3`,
      [isFinal ? 'failed' : 'pending', err.message, eventId]
    );
    log.error(`이벤트 처리 실패 (final=${isFinal})`, { event_id: eventId, error: err.message });
  }
}

async function _markDone(eventId, starId, agents, reason = '') {
  await db.query(
    `UPDATE dt_orchestrator_events
     SET status='done', handled_at=NOW()
     WHERE id=$1`,
    [eventId]
  );
  log.info(`이벤트 처리 완료`, { event_id: eventId, agents });
}

module.exports = { emitEvent, processEvent };
