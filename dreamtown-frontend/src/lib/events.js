/**
 * events.js — DreamTown 이벤트 로거
 *
 * 1. console.info (즉시, 동기)
 * 2. POST /api/dt/events (비동기, 논블로킹 — 실패해도 UX 무관)
 *
 * SSOT: docs/ssot/core/DreamTown_Event_SSOT.md
 */

const ENDPOINT = '/api/dt/events';

/**
 * @param {string} event  — wish_start | scene_view | emotion_select | coupon_open | conversion_action
 * @param {object} params — SSOT 정의 params
 */
export function logEvent(event, params = {}) {
  const payload = { event, ...params, ts: new Date().toISOString() };

  // 1) 콘솔 (즉시)
  console.info('[DT Event]', JSON.stringify(payload));

  // 2) 서버 (논블로킹)
  fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  }).catch(() => {
    // silent — 이벤트 수집 실패가 UX에 영향 없어야 함
  });
}
