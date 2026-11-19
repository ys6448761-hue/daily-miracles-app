'use strict';

// PHX-SOUL-QA-001 Adaptive General Advice (Hybrid V1, 기본 비활성).
// 규칙이 처리하지 못한 "장소 없음·사실 민감어 없음·맥락 참조 없음" 질문에 한해
// LLM을 1회 호출하여 분류와 일반 답변을 함께 받는다. 장소 사실, 요금, 운영, 혜택, 실시간 정보는 답하지 않는다.
// 외부 전송: 질문 원문 한 줄만. 대화 기록, 세션, 토큰, 식별자는 보내지 않는다.

const OpenAI = require('openai').OpenAI;
const { sanitizeForExternal } = require('./soulPrivacyGuard');

const ROUTES = ['GENERAL_ANSWER', 'NEED_PLACE', 'VERIFIED_FACT', 'REALTIME', 'RECOMMEND'];

// 개인정보 패턴 (전화번호, 이메일, 주민번호 형태, 예약·주문 번호, 토큰 형태). 하나라도 있으면 LLM 경로를 열지 않는다.
const PII_PATTERNS = [
  /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/,
  /0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/,
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  /\d{6}[-\s]?\d{7}/,
  /(예약|주문|결제)\s*(번호|코드|ID)\s*[:：]?\s*[A-Za-z0-9-]{4,}/i,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
];

// 사실 민감어: 있으면 기존 경로(검증된 지식, 엔진)로 보낸다.
const FACT_SENSITIVE = /(무료|공짜|요금|가격|얼마|입장료|할인|혜택|소원패스|운영|영업|휴무|주차|시간|몇 시|날씨|지금|오늘|현재|실시간|운행|예약|카페|맛집|추천|일정|코스)/;
// 맥락 의존 표현: 이전 대화나 특정 대상을 가리키므로 단독 LLM 답변을 금지한다.
const CONTEXT_DEPENDENT = /(아까|방금|이전|앞서|조금 전|그곳|그 곳|거기|다른 곳|물었던|이거|저거|그거)/;

function containsPII(message) {
  return PII_PATTERNS.some(p => p.test(String(message || '')));
}

// eligibleForAdaptive: 규칙 분류 이후에 호출된다. 장소 alias 개수를 받는다.
function eligibleForAdaptive(message, aliasCount) {
  const m = String(message || '').trim();
  if (!m || m.length > 200) return false;
  if (aliasCount > 0) return false;
  if (FACT_SENSITIVE.test(m)) return false;
  if (CONTEXT_DEPENDENT.test(m)) return false;
  if (containsPII(m)) return false;
  return true;
}

const SYSTEM_PROMPT = [
  '당신은 여수 여행 도우미 "소울"입니다. 고객 메시지를 읽고 JSON 한 줄만 출력하세요.',
  '형식: {"route":"ROUTE","answer":"답변 또는 빈 문자열"}',
  'ROUTE 값:',
  '- GENERAL_ANSWER: 특정 장소, 요금, 운영, 혜택, 실시간 정보 없이 일반 여행 준비나 일상 대화로 답할 수 있음',
  '- NEED_PLACE: 특정 장소의 정보가 필요하지만 장소가 메시지에 없음',
  '- VERIFIED_FACT: 특정 장소의 검증된 사실(운영, 요금, 혜택, 체류 시간 등)이 필요함',
  '- REALTIME: 현재 날씨, 실시간 운행, 오늘의 상황처럼 실시간 정보가 필요함',
  '- RECOMMEND: 맞춤 추천이나 여행 일정 구성이 필요함',
  'GENERAL_ANSWER일 때만 answer에 한국어 3문장 이내로 답하세요.',
  'answer에는 요금, 무료 여부, 운영 시간, 혜택, 특정 장소나 지역 전체에 대한 평가를 쓰지 마세요.',
  '그 외 route에서는 answer를 빈 문자열로 두세요.',
].join('\n');

// adaptiveGeneralAnswer: 한 번의 LLM 호출로 route와 answer를 받는다.
// 실패, 형식 오류, 허용되지 않은 route면 null을 반환하여 기존 흐름으로 돌린다. 예외를 던지지 않는다.
async function adaptiveGeneralAnswer(message) {
  // PHX-SOUL-QA-001 §29: 개인정보는 제거한 뒤 핵심 질문만 전달한다. 제거 후에도 식별자가 남으면 호출하지 않는다.
  const _privacy = sanitizeForExternal(message);
  if (_privacy.blocked) return null;
  const safe = _privacy.text;
  if (!eligibleForAdaptive(safe, 0) || containsPII(safe)) return null;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 260,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: safe },
      ],
    });
    const raw = r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content;
    const parsed = JSON.parse(String(raw || '{}'));
    const route = ROUTES.includes(parsed.route) ? parsed.route : null;
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : '';
    if (route !== 'GENERAL_ANSWER' || !answer) return { route, answer: null };
    return { route, answer };
  } catch (err) {
    console.error('[SOUL_ADAPTIVE_ERROR]', err && err.message);
    return null;
  }
}

module.exports = { eligibleForAdaptive, containsPII, adaptiveGeneralAnswer, ROUTES };
