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
