/**
 * kpiEventEmitter.js — DreamTown 서버 사이드 KPI 이벤트 SSOT
 *
 * 목적: resonance/impact/연결 이벤트를 dt_kpi_events 테이블에 영속 로그
 *
 * 규칙:
 * - 이 파일이 eventName ENUM SSOT — 절대 분산 금지
 * - emit은 항상 fire-and-forget (.catch(() => {})) — 비즈니스 로직 차단 금지
 * - 모든 필드 null-safe (누락 필드는 NULL 저장, 에러 아님)
 *
 * 이벤트 목록 (KPI SSOT):
 *   resonance_created    — 공명 저장 완료
 *   impact_created       — 나눔 트리거 (impact 행 upsert 직후)
 *   resonance_received   — 별 최초 공명 수신 (total_count 1 도달 시)
 *   connection_completed — TODO: 유사 별 클릭 → 연결 완료 (stub)
 */

const db = require('../database/db');

/**
 * emitKpiEvent({ eventName, userId, starId, wishId, visibility, safetyBand, source, extra })
 *
 * @param {object} params
 * @param {string} params.eventName   — 이벤트 이름 (SSOT 이 파일의 상수 사용 권장)
 * @param {string} [params.userId]    — 이벤트 주체 (anonymous_token 포함)
 * @param {string} [params.starId]    — 관련 별 UUID
 * @param {string} [params.wishId]    — 관련 소원 UUID
 * @param {string} [params.visibility] — 'public' | 'hidden'
 * @param {string} [params.safetyBand] — 'GREEN' | 'YELLOW'
 * @param {string} [params.source]    — emit 지점 식별자
 * @param {object} [params.extra]     — 이벤트별 추가 데이터
 * @returns {Promise<void>}           — 에러 시 warn 로그만 (non-fatal)
 */
async function emitKpiEvent({
  eventName,
  userId    = null,
  starId    = null,
  wishId    = null,
  visibility = null,
  safetyBand = null,
  source    = null,
  extra     = null,
} = {}) {
  try {
    await db.query(
      `INSERT INTO dt_kpi_events
         (event_name, user_id, star_id, wish_id, visibility, safety_band, source, extra)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        eventName,
        userId,
        starId,
        wishId,
        visibility,
        safetyBand,
        source,
        extra ? JSON.stringify(extra) : null,
      ]
    );
    console.log(`[KpiEvent] ${eventName} | star=${starId} | src=${source}`);
  } catch (err) {
    console.warn('[KpiEventEmitter] emit 실패 (non-fatal):', err.message);
  }
}

// ── 이벤트 이름 상수 (SSOT) ─────────────────────────────────────────
const KPI_EVENTS = {
  RESONANCE_CREATED:    'resonance_created',
  IMPACT_CREATED:       'impact_created',
  RESONANCE_RECEIVED:   'resonance_received',
  CONNECTION_COMPLETED: 'connection_completed', // TODO: 실제 emit 지점 미연결
};

module.exports = { emitKpiEvent, KPI_EVENTS };
