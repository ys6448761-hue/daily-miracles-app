'use strict';

// PHX-SOUL-QA-001 H2 — Knowledge Fast Path 분류기 (규칙 기반, LLM 호출 없음).
// 공식 혜택 문의와 실시간 운행 문의를 조건 추출 이전에 확정 응답으로 처리한다.
// 두 경우 모두 검증된 사실이 없으므로, 확인되지 않았다는 사실 자체를 답한다.

const BENEFIT_RE = /(혜택|소원패스|할인|쿠폰)/;
const PLAN_RE = /(일정|코스|반나절|하루|\d박|1박|2박|여행 짜|만들어)/;
const LIVE_RE = /(지금|현재|실시간).{0,6}(운행|운영|열었|영업|탈 수)|운행.{0,4}(하고|중|해)/;

// placeCount: 메시지의 장소 alias 개수.
// 반환: 'BENEFIT' | 'LIVE' | null
function classifyFastPath(message, placeCount) {
  const m = String(message || '');
  if (!m.trim()) return null;
  if (BENEFIT_RE.test(m) && !PLAN_RE.test(m)) return 'BENEFIT';
  if (LIVE_RE.test(m) && placeCount === 1) return 'LIVE';
  return null;
}

module.exports = { classifyFastPath };
