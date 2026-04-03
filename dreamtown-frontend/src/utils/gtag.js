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
 * 6. 첫 항해 시작 (별 생성 직후 → Day 진입)
 * KPI: 첫 항해 시작률 = first_voyage_start / star_created
 */
export function gaFirstVoyageStart({ starId, galaxyCode, direction } = {}) {
  send('first_voyage_start', {
    star_id:     starId,
    galaxy_code: galaxyCode,
    direction,
    choice: DIRECTION_SEMANTIC[direction] ?? direction,
  });
}

// ── DreamTown 루프 퍼널 (SSOT) ────────────────────────────────────────
// 퍼널 단계:
//   resonance_click → resonance_success → resonance_cta_click
//   → similar_star_click (반복 루프)
//   → wish_input_start → wish_create_submit
//   → dt_share_click → dt_share_success
//
// 공통 파라미터 규약:
//   star_id   — 대상 별 ID
//   is_invite — ?entry=invite 유입 여부 (boolean)
//   method    — 공유 방법: 'kakao' | 'native' | 'clipboard'

/**
 * 공명 버튼 클릭 (API 호출 직전)
 * 측정: 공명 의향률 = resonance_click / star_detail_view
 */
export function gaResonanceClick({ starId, type, isInvite = false } = {}) {
  send('resonance_click', { star_id: starId, resonance_type: type, is_invite: isInvite });
}

/**
 * 공명 API 성공 (낙관적 업데이트 후 서버 확인 완료)
 * 측정: 공명 완료율 = resonance_success / resonance_click
 */
export function gaResonanceSuccess({ starId, type, isInvite = false } = {}) {
  send('resonance_success', { star_id: starId, resonance_type: type, is_invite: isInvite });
}

/**
 * 공명 후 CTA 클릭 ("나도 별 만들기" / "내 별 보러 가기")
 * 측정: 전환율 = resonance_cta_click / resonance_success
 */
export function gaResonanceCTAClick({ starId, ctaType, isInvite = false, hasMyStarId = false } = {}) {
  send('resonance_cta_click', { star_id: starId, cta_type: ctaType, is_invite: isInvite, has_my_star_id: hasMyStarId });
}

/**
 * 유사 별 클릭 (공명 후 추천 목록 → 다음 별)
 * 측정: 루프 반복률 = similar_star_click / resonance_success
 */
export function gaSimilarStarClick({ fromStarId, toStarId, position } = {}) {
  send('similar_star_click', { from_star_id: fromStarId, to_star_id: toStarId, position });
}

/**
 * 소원 입력 시작 (INITIAL_TEXT 이탈 첫 감지, 1회만 발화)
 * 측정: 입력 시작율 = wish_input_start / wish_screen_view
 */
export function gaWishInputStart({ isInvite = false, trigger = 'manual' } = {}) {
  send('wish_input_start', { is_invite: isInvite, trigger });
}

/**
 * 소원 작성 제출 ("별 만들기" CTA 클릭)
 * 측정: 제출율 = wish_create_submit / wish_input_start
 */
export function gaWishCreateSubmit({ isInvite = false, wishLength = 0 } = {}) {
  send('wish_create_submit', { is_invite: isInvite, wish_length: wishLength });
}

/**
 * 공유 버튼 클릭 (StarBirth 화면)
 * 측정: 공유 의향률 = dt_share_click / star_created
 */
export function gaDtShareClick({ starId, location = 'star_birth' } = {}) {
  send('dt_share_click', { star_id: starId, location });
}

/**
 * 공유 완료 (Kakao sendDefault 성공 / navigator.share 성공 / clipboard 복사)
 * 측정: 공유 완료율 = dt_share_success / dt_share_click
 */
export function gaDtShareSuccess({ starId, method = 'kakao' } = {}) {
  send('dt_share_success', { star_id: starId, method });
}

/**
 * 유사 별 없음 → 광장 fallback 클릭
 * 측정: 공명 후 이탈 방향 분석 (similar_star 미노출 시 광장 이동율)
 */
export function gaSquareFallbackClick({ starId, isInvite = false, hasMyStarId = false } = {}) {
  send('square_fallback_click', { star_id: starId, is_invite: isInvite, has_my_star_id: hasMyStarId });
}

/**
 * 유사 별 섹션 노출 시 결과 0개 (API 응답 후 빈 상태)
 * 측정: similar_star API 실효율 — 빈 결과 비율이 높으면 추천 품질 개선 필요
 */
export function gaSimularStarsEmptyView({ starId, isInvite = false, hasMyStarId = false } = {}) {
  send('similar_stars_empty_view', { star_id: starId, is_invite: isInvite, has_my_star_id: hasMyStarId });
}

/**
 * 7. Day 7 도달 (별 생성 후 7일 내 재방문)
 * KPI: Day 7 재방문율 = milestone_day7 / star_created
 * 중복 방지: sessionStorage 플래그 사용
 */
export function gaMilestoneDay7({ starId } = {}) {
  const key = `dt_ga_day7_${starId}`;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;
  send('milestone_day7', { star_id: starId });
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, '1');
}
