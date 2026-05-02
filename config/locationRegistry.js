'use strict';
/**
 * locationRegistry.js — 별공방 장소 레지스트리 SSOT
 *
 * ── 코드 명명 규칙 (origin_location 값은 절대 변경 금지) ──────────
 *
 *  기본             global_default_workshop
 *  국내 MVP         {city}_{descriptor}_{venue_type}
 *    yeosu_cablecar_workshop
 *    yeosu_lattoa_cafe
 *  전국 확장        {city}_{district}_{venue_type}{seq}
 *    busan_gwanganri_cafe01
 *  글로벌 확장      {country}_{city}_{venue_type}{seq}
 *    jp_tokyo_cafe01
 *
 * ── 필드 설명 ──────────────────────────────────────────────────
 *  code         stars.origin_location 저장값 — 불변
 *  display_name 운영판·UI 표시명
 *  name_ko      한국어 표시명 (= display_name)
 *  region       광역자치단체
 *  partner      제휴 업체명
 *  type         venue 타입 (landmark / cafe / resort / default)
 *  stage        운영 단계 (workshop / retail / global)
 *  status       운영 상태 (pending / testing / running / closed)
 *  aliases      구 코드·하이픈 표기 등 — code 로 자동 해소
 * ────────────────────────────────────────────────────────────────
 */

const REGISTRY = [
  {
    code:         'global_default_workshop',
    display_name: '기본 별공방',
    name_ko:      '기본 별공방',
    city:         null,
    region:       null,
    country_code: 'KR',
    type:         'default',
    venue_type:   'default',
    partner:      null,
    stage:        'workshop',
    status:       'running',
    emoji:        '✦',
    aliases:      ['global', 'default'],
  },
  {
    code:         'yeosu_cablecar_workshop',
    display_name: '여수 해상 케이블카',
    name_ko:      '여수 해상 케이블카',
    city:         '여수',
    region:       '전남',
    country_code: 'KR',
    type:         'landmark',
    venue_type:   'landmark',
    partner:      '여수 해상 케이블카',
    stage:        'workshop',
    status:       'testing',
    emoji:        '🚡',
    aliases:      ['yeosu_cablecar', 'yeosu-cablecar', 'cablecar'],
  },
  {
    code:         'yeosu_lattoa_cafe',
    display_name: '라또아 카페',
    name_ko:      '라또아 카페',
    city:         '여수',
    region:       '전남',
    country_code: 'KR',
    type:         'cafe',
    venue_type:   'cafe',
    partner:      '라또아',
    stage:        'workshop',
    status:       'testing',
    emoji:        '☕',
    aliases:      ['lattoa_cafe', 'lattoa', 'lattoa-cafe'],
  },
  {
    code:         'forestland',
    display_name: '더 포레스트랜드',
    name_ko:      '더 포레스트랜드',
    city:         null,
    region:       null,
    country_code: 'KR',
    type:         'resort',
    venue_type:   'resort',
    partner:      '더 포레스트랜드',
    stage:        'workshop',
    status:       'pending',
    emoji:        '🌿',
    aliases:      [],
  },
  {
    code:         'paransi',
    display_name: '파란시',
    name_ko:      '파란시',
    city:         null,
    region:       null,
    country_code: 'KR',
    type:         'cafe',
    venue_type:   'cafe',
    partner:      '파란시',
    stage:        'workshop',
    status:       'pending',
    emoji:        '🌊',
    aliases:      [],
  },
];

// ── 빠른 조회 맵 ─────────────────────────────────────────────────
const _BY_CODE   = Object.fromEntries(REGISTRY.map(l => [l.code, l]));
const _ALIAS_MAP = Object.fromEntries(
  REGISTRY.flatMap(l => l.aliases.map(a => [a, l.code]))
);

/**
 * code → 표준 location 객체 (alias 자동 해소)
 * 없으면 null 반환
 */
function resolve(code) {
  const canonical = _ALIAS_MAP[code] ?? code;
  return _BY_CODE[canonical] ?? null;
}

/**
 * code → stars.origin_location 저장값
 * alias(yeosu_cablecar) → canonical(yeosu_cablecar_workshop)
 */
function getKpiCode(code) {
  return _ALIAS_MAP[code] ?? code;
}

/**
 * status가 testing 또는 running인 장소 목록
 */
function getActiveLocations() {
  return REGISTRY.filter(l => l.status === 'testing' || l.status === 'running');
}

module.exports = { REGISTRY, resolve, getKpiCode, getActiveLocations };
