/**
 * expoConfig.js — 이벤트 한정 별 설정
 *
 * 개막일·폐막일은 확정 후 여기만 수정. 코드 수정 없음.
 * 다음 이벤트 추가 시 블록 하나만 추가.
 *
 * @example
 *   const { ISLAND_EXPO_2026 } = require('./expoConfig');
 *   const meta = determineStarMeta(); // → { star_rarity, source_event }
 */

'use strict';

const ISLAND_EXPO_2026 = {
  // ⚠️ 개막일·폐막일 미확정 — 확정 후 아래 날짜만 수정
  START:       '2026-07-25T00:00:00+09:00',   // placeholder
  END:         '2026-10-25T23:59:59+09:00',   // placeholder
  EVENT_CODE:  'island_expo_2026',
  STAR_RARITY: 'limited',
  BADGE_TEXT:  '2026 세계섬박람회 탄생',
};

// 향후 이벤트 블록 예시 — 활성화 시 exports에 추가하면 됨
// const SUNCHEONMAN_2027 = {
//   START:       '2027-04-01T00:00:00+09:00',
//   END:         '2027-06-30T23:59:59+09:00',
//   EVENT_CODE:  'suncheonman_2027',
//   STAR_RARITY: 'limited',
//   BADGE_TEXT:  '순천만 국가정원 탄생',
// };

module.exports = { ISLAND_EXPO_2026 };
