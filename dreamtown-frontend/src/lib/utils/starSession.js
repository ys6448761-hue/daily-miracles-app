/**
 * starSession.js — localStorage star ID 단일 진입점
 *
 * 키 정책:
 *  - 공식 키: dt_active_star_id
 *  - 레거시: dt_star_id (제거 예정 — migrateStarId()로 1회 전환)
 *
 * 공개 경로(/dreamtown, ?entry=invite)에서는 null 반환 — 자동 복귀 전역 차단
 */

const PUBLIC_ROUTES = ['/dreamtown'];
const ACTIVE_KEY  = 'dt_active_star_id';
const LEGACY_KEY  = 'dt_star_id';

/**
 * 앱 시작 시 1회 실행 — 레거시 키를 공식 키로 이전
 */
export function migrateStarId() {
  if (typeof window === 'undefined') return;
  const current = localStorage.getItem(ACTIVE_KEY);
  const legacy  = localStorage.getItem(LEGACY_KEY);
  if (!current && legacy) {
    localStorage.setItem(ACTIVE_KEY, legacy);
  }
}

/**
 * star ID 읽기 단일 진입점
 * - 공개 경로: 항상 null
 * - 그 외: dt_active_star_id → fallback dt_star_id (마이그레이션 과도기)
 */
export function readSavedStar() {
  if (typeof window === 'undefined') return null;
  const pathname   = window.location.pathname;
  const isInvite   = new URLSearchParams(window.location.search).get('entry') === 'invite';
  const isPublic   = PUBLIC_ROUTES.includes(pathname) || isInvite;
  if (isPublic) return null;
  return localStorage.getItem(ACTIVE_KEY) || localStorage.getItem(LEGACY_KEY) || null;
}

/**
 * star ID 쓰기 단일 진입점 — 항상 dt_active_star_id에 저장
 */
export function saveStarId(starId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_KEY, starId);
}

/**
 * star ID 삭제 (두 키 모두)
 */
export function clearStarId() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
