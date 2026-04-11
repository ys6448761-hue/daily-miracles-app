/**
 * requestId.js — 단일 노출 흐름 추적용 request ID 생성
 *
 * 한 번의 카드 노출(eligible → shown → rendered)을 묶어
 * 운영에서 한 쿼리로 흐름 추적 가능하게 한다.
 *
 * 사용:
 *   const reqId = newRequestId();
 *   logEvent('recall_shown', { request_id: reqId, ... });
 *   logEvent('recall_rendered', { request_id: reqId, ... });
 */

export function newRequestId() {
  return crypto.randomUUID();
}
