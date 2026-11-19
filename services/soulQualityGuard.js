'use strict';

// PHX-SOUL-QA-001 H3 — Response Quality Guard.
// SUCCESS 상태를 신뢰하지 않고, 응답 직전에 내용을 점검한다.
// 문제가 발견되면 검증된 사실 기반 대체 답변으로 교체한다. 응답을 새로 생성하지 않는다.
// 한계: 질문과의 관련성 판정은 규칙 수준이므로 이 가드가 관련성을 보장하지 않는다.

const GENERIC_LINES = [
  '지금 상황에 맞는 곳을 찾아볼게요.',
  '장소 사이 이동시간은 아직 확인되지 않아 계산에 넣지 않았어요.',
  '여행이시군요.',
  '일행과 함께',
  '아이와 함께',
  '둘이 함께',
];

// 승인 근거가 없는 혜택·제휴 주장 패턴 (허용 목록에 있는 파트너 혜택은 현재 없음)
const UNVERIFIED_BENEFIT_CLAIM = /(아메리카노\s*\d*\s*잔|음료\s*1\s*병|무료\s*(음료|커피)|제휴\s*(업체|카페|파트너|매장)|할인\s*혜택(이|을|은)\s*(받|적용|제공))/;
// 요청하지 않은 일정 구조 (1일차, 2일차, Day 1 등)
const DAY_STRUCTURE = /(\d+\s*일차|Day\s*\d)/i;
const SCHEDULE_REQUEST = /(\d\s*박|일정|코스|일차|며칠|여행 계획)/;
// 시각 표현 (오전·오후 n시, n시 m분, hh:mm). 소요 "분" 단위는 DB 값을 쓰므로 검사하지 않는다.
// "2시간"처럼 "시간"으로 끝나는 소요 표현은 시각이 아니므로 제외한다 (시(?!간)).
const CLOCK_TOKEN = /(오전|오후)?\s*\d{1,2}\s*시(?!간)(\s*\d{1,2}\s*분)?|\d{1,2}:\d{2}/g;

// 무료 여부 주장 (검증된 지식에 '무료'가 없으면 미검증)
const FREE_CLAIM = /(무료\s*(로\s*)?(이용|입장|관람|즐길|들어|탈|방문)|무료(입니다|예요|이에요|다)|입장료\s*(는\s*)?없)/;
// 지역 전체 일반화 ("여수에는 ~ 많다" 류)
const REGION_GENERALIZATION = /여수(에는|에서는|에는요|는)?\s*[^.。!?]{0,16}?(많아요|많습니다|많다|많이 있|다양해요|다양합니다|흔해요|흔합니다)/;
// 금액 표현 (원, ₩)
const PRICE_TOKEN = /₩\s*\d[\d,]*|\d[\d,]*\s*원/g;

function stripGeneric(text) {
  let t = String(text || '');
  for (const g of GENERIC_LINES) t = t.split(g).join('');
  return t.replace(/[\s.,·•\n]/g, '');
}

// inspectPayload: 문제 목록을 반환한다 (빈 배열이면 통과).
// deps.knowledgeText: 검증된 지식 본문(JSON 문자열). 시각 표현이 여기에 없으면 미검증으로 본다.
function inspectPayload(payload, message, deps) {
  const reasons = [];
  const text = String((payload && payload.message_ko) || '');
  const hasPlaces = Array.isArray(payload && payload.places) && payload.places.length > 0;

  if (!hasPlaces && stripGeneric(text).length < 12) reasons.push('EMPTY');
  if (UNVERIFIED_BENEFIT_CLAIM.test(text)) reasons.push('UNVERIFIED_BENEFIT_CLAIM');
  if (DAY_STRUCTURE.test(text) && !SCHEDULE_REQUEST.test(String(message || ''))) reasons.push('UNREQUESTED_DAY_STRUCTURE');

  const clocks = text.match(CLOCK_TOKEN) || [];
  const corpus = String((deps && deps.knowledgeText) || '');
  const unverifiedClock = clocks.some(c => !corpus.includes(c.replace(/\s+/g, '')) && !corpus.includes(c.trim()));
  if (unverifiedClock) reasons.push('UNVERIFIED_CLOCK_TIME');

  if (FREE_CLAIM.test(text) && !corpus.includes('무료')) reasons.push('UNVERIFIED_FREE_CLAIM');
  if (REGION_GENERALIZATION.test(text)) reasons.push('UNVERIFIED_REGION_GENERALIZATION');
  const prices = text.match(PRICE_TOKEN) || [];
  const unverifiedPrice = prices.some(p => {
    const digits = p.replace(/[^\d]/g, '');
    return !corpus.replace(/[^\d]/g, '').includes(digits);
  });
  if (unverifiedPrice) reasons.push('UNVERIFIED_PRICE');

  return reasons;
}

// guardPayload: 문제가 있으면 검증된 사실 기반 대체 답변으로 교체한다.
// 대체 답변이 없으면 확인되지 않았다는 사실을 답한다 (재질문으로 되돌리지 않는다).
function guardPayload(payload, message, deps) {
  const reasons = inspectPayload(payload, message, deps);
  if (reasons.length === 0) return payload;

  const fact = deps && deps.buildFactFallback ? deps.buildFactFallback(message) : null;
  const honest = '이 질문에 대해 지금 확인된 정보를 찾지 못했어요. 장소 이름을 알려주시면 확인된 정보로 답해 드릴게요.';
  const replacement = reasons.includes('UNVERIFIED_BENEFIT_CLAIM')
    ? '확인된 공식 혜택 정보를 찾지 못했어요. 혜택 여부는 소원패스 공식 안내나 현장에서 확인해 주세요.'
    : (reasons.some(r => r === 'UNVERIFIED_FREE_CLAIM' || r === 'UNVERIFIED_PRICE' || r === 'UNVERIFIED_REGION_GENERALIZATION')
      ? (fact ? `${fact} 무료 여부, 요금, 지역 전체에 대한 내용은 확인된 정보가 없어 답하지 않았어요.` : honest)
      : (fact ? `${fact} 그 밖의 세부 정보는 확인되지 않았어요.` : honest));

  return {
    ...payload,
    message_ko: replacement,
    places: [],
    status: payload && payload.status === 'DIRECT_RESPONSE' ? 'DIRECT_RESPONSE' : 'GUARDED_FALLBACK',
  };
}

module.exports = { inspectPayload, guardPayload };
