'use strict';

/**
 * expoStarService.js — 별 생성 시 한정 여부 자동 판별
 *
 * 별 생성 경로(dreamtownRoutes, dtFunnelRoutes, starService)에서
 * 호출하면 star_rarity + source_event 를 자동으로 결정해 반환.
 *
 * 확장 방법: ISLAND_EXPO_2026 블록과 동일 패턴으로 새 이벤트 추가.
 */

const { ISLAND_EXPO_2026 } = require('../config/expoConfig');

/**
 * 현재 시각 기준으로 별의 희소성 메타를 결정한다.
 * @returns {{ star_rarity: string, source_event: string }}
 */
function determineStarMeta() {
  const now  = new Date();
  const expo = ISLAND_EXPO_2026;

  const isExpo = now >= new Date(expo.START) && now <= new Date(expo.END);

  if (isExpo) {
    return {
      star_rarity:  expo.STAR_RARITY,   // 'limited'
      source_event: expo.EVENT_CODE,    // 'island_expo_2026'
    };
  }

  return {
    star_rarity:  'standard',
    source_event: 'standard',
  };
}

module.exports = { determineStarMeta };
