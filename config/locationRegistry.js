'use strict';
/**
 * locationRegistry.js — 별공방 장소 레지스트리 SSOT
 *
 * ── 코드 명명 규칙 (origin_location 값은 절대 변경 금지) ──────────
 *
 *  국내 MVP    {descriptor}_{venue_type}
 *    yeosu_cablecar
 *    lattoa_cafe
 *
 *  전국 확장   {city}_{district}_{venue_type}{seq}
 *    busan_gwanganri_cafe01
 *    seoul_hongdae_studio01
 *
 *  글로벌 확장 {country}_{city}_{district}_{venue_type}{seq}
 *    jp_tokyo_shibuya_cafe01
 *    us_la_santamonica_hotel01
 *
 * ── 필드 설명 ──────────────────────────────────────────────────
 *  code         stars.origin_location 저장값 — 불변
 *  name_ko      한국어 표시명
 *  city/region  도시·광역자치단체
 *  country_code ISO 3166-1 alpha-2
 *  venue_type   cafe / landmark / studio / hotel / resort / popup
 *  status       pending / testing / running / closed
 *  aliases      구 코드·하이픈 표기 등 (code 로 자동 해소됨)
 * ────────────────────────────────────────────────────────────────
 */

const REGISTRY = [
  {
    code:         'global',
    name_ko:      '기본 별공방',
    city:         null,
    region:       null,
    country_code: 'KR',
    venue_type:   'default',
    status:       'running',
    emoji:        '✦',
    aliases:      ['default'],
  },
  {
    code:         'yeosu_cablecar',
    name_ko:      '여수 해상 케이블카',
    city:         '여수',
    region:       '전남',
    country_code: 'KR',
    venue_type:   'landmark',
    status:       'testing',
    emoji:        '🚡',
    aliases:      ['yeosu-cablecar'],
  },
  {
    code:         'lattoa_cafe',
    name_ko:      '라또아 카페',
    city:         '여수',
    region:       '전남',
    country_code: 'KR',
    venue_type:   'cafe',
    status:       'testing',
    emoji:        '☕',
    aliases:      ['lattoa'],
  },
  {
    code:         'forestland',
    name_ko:      '더 포레스트랜드',
    city:         null,
    region:       null,
    country_code: 'KR',
    venue_type:   'resort',
    status:       'pending',
    emoji:        '🌿',
    aliases:      [],
  },
  {
    code:         'paransi',
    name_ko:      '파란시',
    city:         null,
    region:       null,
    country_code: 'KR',
    venue_type:   'cafe',
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
 * alias(yeosu-cablecar) → canonical(yeosu_cablecar)
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
