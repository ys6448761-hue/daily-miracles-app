/**
 * readSavedStar — localStorage에서 dt_active_star_id를 읽는 단일 진입점
 *
 * 공개 경로(PUBLIC_ROUTES)에서는 null 반환 — 별 자동 복귀 전역 차단
 */

const PUBLIC_ROUTES = ['/dreamtown'];

export function readSavedStar() {
  if (PUBLIC_ROUTES.includes(window.location.pathname)) return null;
  return localStorage.getItem('dt_active_star_id');
}
