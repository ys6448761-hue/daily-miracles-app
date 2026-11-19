'use strict';

// PHX-SOUL-QA-001 Hybrid V1 feature flag.
// 기본값: 비활성. SOUL_HYBRID_V1=1 일 때만 H1~H3 경로가 켜진다.
// 비활성 상태에서는 기존 응답 방식(7463d18)과 동일해야 한다.
function isHybridV1Enabled() {
  return process.env.SOUL_HYBRID_V1 === '1';
}

module.exports = { isHybridV1Enabled };
