/**
 * gtag.js — GA4 이벤트 안전 래퍼
 *
 * 규칙:
 * - window.gtag 미존재 시 무음 처리 (초기화 전 / 광고차단 / 개발환경)
 * - 이벤트 이름은 이 파일이 SSOT — 절대 분산 금지
 * - key 기준 추적: direction은 semantic key(calm/release/clarity/courage)로 변환
 *
 * 퍼널:
 *   intro_view → intro_cta_click
 *   → galaxy_view → galaxy_select
 *   → day_feeling_select → day_change_select
 *   → postcard_view → share_click
 */

// direction → GA4 semantic key (GALAXY_OPTIONS SSOT와 일치)
const DIRECTION_SEMANTIC = {
  north: 'courage',
  east:  'clarity',
  west:  'calm',
  south: 'release',
};

function send(eventName, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, params);
}

// ── Intro ──────────────────────────────────────────────
export function gaIntroView({ screenVariant } = {}) {
  send('intro_view', { screen_variant: screenVariant });
}

export function gaIntroCTAClick({ screenVariant, ctaText } = {}) {
  send('intro_cta_click', {
    screen_variant: screenVariant,
    cta_text: ctaText,
  });
}

// ── Galaxy ─────────────────────────────────────────────
export function gaGalaxyView() {
  send('galaxy_view');
}

export function gaGalaxySelect({ direction } = {}) {
  send('galaxy_select', {
    choice: DIRECTION_SEMANTIC[direction] ?? direction,
    direction,
  });
}

// ── Day ────────────────────────────────────────────────
export function gaDayFeelingSelect({ feeling, direction } = {}) {
  send('day_feeling_select', {
    feeling,
    choice: DIRECTION_SEMANTIC[direction] ?? direction,
  });
}

export function gaDayChangeSelect({ change, direction } = {}) {
  send('day_change_select', {
    change,
    choice: DIRECTION_SEMANTIC[direction] ?? direction,
  });
}

// ── Postcard ───────────────────────────────────────────
export function gaPostcardView({ direction } = {}) {
  send('postcard_view', {
    tone: DIRECTION_SEMANTIC[direction] ?? direction,
  });
}

// ── Share ──────────────────────────────────────────────
export function gaShareClick({ direction, method } = {}) {
  send('share_click', {
    tone:   DIRECTION_SEMANTIC[direction] ?? direction,
    method: method ?? 'native_share',
  });
}

export function gaSaveClick({ direction } = {}) {
  send('save_click', {
    tone: DIRECTION_SEMANTIC[direction] ?? direction,
  });
}

// ── DreamTown KPI 이벤트 (SSOT: 이 파일에만 정의) ──────────────
// 퍼널: star_created → growth_logged → resonance_created/received
//        → impact_created → milestone_day7

/**
 * 1. 별 생성 완료
 * KPI: 별 생성률 = star_created / wish 입력
 */
export function gaStarCreated({ gemType, galaxyType } = {}) {
  send('star_created', { gem_type: gemType, galaxy_type: galaxyType });
}

/**
 * 2. 성장 기록 1회
 * KPI: 첫 성장 기록률 = growth_logged ≥1 / star_created
 */
export function gaGrowthLogged({ starId } = {}) {
  send('growth_logged', { star_id: starId });
}

/**
 * 3. 공명 남김 (타인의 별에 공명 저장)
 * KPI: 공명 발생률
 * star_id 포함: 어느 별이 공명을 유발했는지 추적
 */
export function gaResonanceCreated({ starId, resonanceType } = {}) {
  send('resonance_created', { star_id: starId, resonance_type: resonanceType });
}

/**
 * 4. 공명 받음 (내 별에 공명이 1개 이상 생긴 시점)
 * KPI: North Star — 공명 받은 별의 비율
 * 중복 방지: sessionStorage 플래그 사용
 */
export function gaResonanceReceived({ starId } = {}) {
  const key = `dt_ga_res_recv_${starId}`;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;
  send('resonance_received', { star_id: starId });
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, '1');
}

/**
 * 5. 나눔 생성 (공명 누적 → impact 트리거)
 * KPI: 연결 깊이 측정
 * star_id 포함: 어느 별에서 나눔이 생성됐는지 추적
 */
export function gaImpactCreated({ starId, impactType } = {}) {
  send('impact_created', { star_id: starId, impact_type: impactType });
}

/**
 * 6. Day 7 도달 (별 생성 후 7일 내 재방문)
 * KPI: Day 7 재방문율 = milestone_day7 / star_created
 * 중복 방지: sessionStorage 플래그 사용
 */
export function gaMilestoneDay7({ starId } = {}) {
  const key = `dt_ga_day7_${starId}`;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;
  send('milestone_day7', { star_id: starId });
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, '1');
}
