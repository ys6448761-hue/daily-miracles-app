/**
 * locationAliases.js — DreamTown 별공방 location alias → canonical SSOT (frontend mirror)
 *
 *   - Server SSOT: config/locationRegistry.js (Node)
 *   - 본 파일은 frontend에서 canonical URL을 만들기 위한 mirror
 *   - canonical은 stars.origin_location / dt_stars.origin_place / KPI 집계의 단일 키
 *   - 새 alias/canonical 추가 시 server registry와 동기화 필수
 */

const CANONICALS = [
  'global_default_workshop',
  'yeosu_cablecar_workshop',
  'yeosu_lattoa_cafe',
  'forestland',
  'paransi',
];

const ALIAS_MAP = {
  // global_default_workshop
  global:                  'global_default_workshop',
  default:                 'global_default_workshop',
  global_default:          'global_default_workshop',

  // yeosu_cablecar_workshop
  yeosu_cablecar:          'yeosu_cablecar_workshop',
  'yeosu-cablecar':        'yeosu_cablecar_workshop',
  cablecar:                'yeosu_cablecar_workshop',

  // yeosu_lattoa_cafe
  lattoa_cafe:             'yeosu_lattoa_cafe',
  lattoa:                  'yeosu_lattoa_cafe',
  'lattoa-cafe':           'yeosu_lattoa_cafe',
};

export function getCanonicalLocation(code) {
  if (!code) return null;
  if (CANONICALS.includes(code)) return code;
  return ALIAS_MAP[code] || code;
}

export function resolveLocationAlias(code) {
  return getCanonicalLocation(code);
}

export function getEntryUrl(code) {
  const canonical = getCanonicalLocation(code);
  if (!canonical || canonical === 'global_default_workshop') return '/entry';
  return `/entry?loc=${encodeURIComponent(canonical)}`;
}

export const CANONICAL_LOCATIONS = CANONICALS;
export default { getCanonicalLocation, resolveLocationAlias, getEntryUrl, CANONICAL_LOCATIONS };
