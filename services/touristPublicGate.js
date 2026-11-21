'use strict';
/**
 * §105 — 관광지 고객 추천 공개 허용 판단 (코드 수준 명시 허용 목록).
 *
 * - LEGACY_APPROVED_BASELINE: 2026-11-21 시점 Seed 001 의 13개 place_code 를 고정한 목록.
 *   기존 고객 추천 동작을 보존하기 위한 "Legacy Approved Baseline" 이며, 기존 공개 승인 문서가 있었다는 뜻이 아니다.
 * - DB 를 동적으로 읽어 자동 승인하지 않는다. 신규 Seed 행은 이 목록에 자동 포함되지 않는다.
 * - trust_level (데이터 검증 등급) 은 공개 승인 값으로 쓰지 않는다.
 * - customer_public === false 는 목록에 있어도 항상 비공개 (명시적 차단).
 * - 이 모듈은 DB·네트워크 접근이 없다 (순수 함수).
 */

const LEGACY_APPROVED_BASELINE = Object.freeze([
  'cablecar',
  'dolsan_daegyo',
  'dolsan_nightscape',
  'hamel_lighthouse',
  'hyangiram',
  'jaisan_park',
  'jungang_market', // 기존 추천 제외 정책 (2026-10-15) 은 travelGuideService 에서 그대로 적용된다.
  'lee_soon_shin_plaza',
  'marine_park',
  'odongdo',
  'romantic_pojangmacha',
  'sky_tower',
  'yeosu_expo_park',
]);

const _ALLOWED = new Set(LEGACY_APPROVED_BASELINE);

/** 고객 추천에 노출해도 되는 장소인지 (명시 허용 목록 + 명시 차단 없음). */
function isCustomerPublicPlace(place) {
  if (!place || typeof place.code !== 'string') return false;
  if (place.customer_public === false) return false;
  return _ALLOWED.has(place.code);
}

/** 추천 후보 배열에서 허용 장소만 남긴다. 입력 배열을 바꾸지 않는다. */
function filterCustomerPublic(places) {
  return (Array.isArray(places) ? places : []).filter(isCustomerPublicPlace);
}

module.exports = { LEGACY_APPROVED_BASELINE, isCustomerPublicPlace, filterCustomerPublic };
