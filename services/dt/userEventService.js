'use strict';

const db  = require('../../database/db');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('userEventService');

// ── 이벤트 타입 SSOT ─────────────────────────────────────────────
const EVENTS = {
  STAR_PAGE_VIEW:     'star_page_view',
  PHASE_EXPOSED:      'phase_exposed',
  ACTION_CLICKED:     'action_clicked',
  QUESTION_SHOWN:     'question_shown',
  QUESTION_ANSWERED:  'question_answered',
  REVISIT_DETECTED:   'revisit_detected',
  // Day 8 전환 이벤트
  DAY8_EXPOSED:       'day8_exposed',
  CONTINUE_CLICKED:   'continue_clicked',
  LITE_SELECTED:      'lite_selected',
  PAUSE_SELECTED:     'pause_selected',
  // 결제 이벤트
  PAYMENT_REQUESTED:  'payment_requested',
  PAYMENT_SUCCESS:    'payment_success',
  PAYMENT_FAILED:     'payment_failed',
  // 공명 퍼널
  RESONANCE_CLICK:    'resonance_click',
  RESONANCE_CREATED:  'resonance_created',
  RESONANCE_FAILED:   'resonance_failed',
  // 공명 완료 후 퍼널
  SIMILAR_STARS_SHOWN: 'similar_stars_shown',
  SIMILAR_STAR_CLICK:  'similar_star_click',
  RESONANCE_CTA_CLICK: 'resonance_cta_click',
  // 공유 유입 퍼널
  SHARE_LINK_OPENED:       'share_link_opened',
  INVITE_RESONANCE_STARTED:'invite_resonance_started',
  INVITE_CTA_CLICKED:      'invite_cta_clicked',
};

const ALLOWED = new Set(Object.values(EVENTS));

// ── 저장 ─────────────────────────────────────────────────────────
async function logEvent({ userId, eventType, metadata = {} }) {
  if (!ALLOWED.has(eventType)) {
    log.warn('허용되지 않은 이벤트 타입', { eventType });
    return;
  }
  try {
    await db.query(
      `INSERT INTO user_events (user_id, event_type, metadata)
       VALUES ($1, $2, $3::jsonb)`,
      [userId ?? null, eventType, JSON.stringify(metadata)]
    );
  } catch (err) {
    log.warn('user_event 저장 실패 (계속)', { err: err.message });
  }
}

// ── 재방문 감지 (24h 기준) ────────────────────────────────────────
async function detectRevisit(userId) {
  if (!userId) return false;
  try {
    const { rows } = await db.query(
      `SELECT 1 FROM user_events
       WHERE user_id = $1
         AND event_type = $2
         AND created_at >= NOW() - INTERVAL '24 hours'
         AND created_at < NOW() - INTERVAL '1 minute'
       LIMIT 1`,
      [userId, EVENTS.STAR_PAGE_VIEW]
    );
    return rows.length > 0;
  } catch { return false; }
}

module.exports = { EVENTS, logEvent, detectRevisit };
