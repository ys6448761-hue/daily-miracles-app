'use strict';

// PHX-SOUL-QA-001 H1 — Direct Response.
// 인사, 감사, 공감, 일반 상식 질문에만 기존 LLM 호출 방식으로 1회 직접 답한다.
// 여행자 조건 추출(contextExtractionService)을 호출하지 않는다.
// 장소, 혜택, 운영 정보, 가격, 일정 관련 질문은 절대 이 경로로 보내지 않는다.

const OpenAI = require('openai').OpenAI;

// 이 중 하나라도 있으면 Direct 대상이 아니다 (DreamTown 사실 또는 여행 조건과 연결된 질문).
const TRAVEL_FACT_WORDS = /(여수|오동도|케이블카|하멜|향일암|돌산|이순신|카페|맛집|혜택|소원패스|할인|쿠폰|일정|코스|추천|운영|시간|가격|요금|주차|예약|숙박|호텔|라마다|케니|날씨|교통|버스|택시|도보|걸어|관람|얼마|몇|어디|언제|지금|운행|입장|체류|매장|식당)/;
// 여행 조건(동행, 인원)이 포함되면 조건 추출 경로가 필요하므로 Direct 대상이 아니다.
const COMPANION_WORDS = /(아이|자녀|부모님|어머니|아버지|가족|친구|혼자|커플|남편|아내|애들|손주|성인)/;
const GREET = /(좋은 아침|좋은 저녁|좋은 밤|안녕|반가워|고마워|감사|수고|잘 자)/;
const EMO = /(지쳐|지쳤|쉬고 싶|힘들|마음이|우울|위로|외로|슬퍼|속상)/;
const GENERAL_Q = /(이 뭐야|이란 뭐|어떤 음식|무엇이야|뭐야\?|어떤 거야|뭐예요\?|무엇인가요)/;

// classifyDirect: 순수 규칙 분류 (LLM 호출 없음). aliasCount는 장소 alias 개수.
function classifyDirect(message, aliasCount) {
  const m = String(message || '');
  if (!m.trim()) return false;
  if (aliasCount > 0) return false;
  if (TRAVEL_FACT_WORDS.test(m)) return false;
  if (COMPANION_WORDS.test(m)) return false;
  return GREET.test(m) || EMO.test(m) || GENERAL_Q.test(m);
}

const SYSTEM_PROMPT = [
  '당신은 따뜻한 여행 동행 도우미 "소울"입니다.',
  '인사, 공감, 일반 상식에 짧고 자연스럽게 답하세요. 3문장 이내.',
  '여수의 구체적인 장소 정보, 운영시간, 가격, 혜택, 실시간 상황은 말하지 마세요.',
  '확실하지 않은 사실은 단정하지 마세요.',
].join('\n');

// generateDirectReply: 기존 LLM 방식과 동일(OpenAI chat completions, gpt-4o-mini).
// 실패하면 null을 반환하여 기존 흐름으로 되돌린다. 예외를 던지지 않는다.
async function generateDirectReply(message) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: String(message) },
      ],
    });
    const text = r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content;
    return text ? String(text).trim() : null;
  } catch (err) {
    console.error('[SOUL_DIRECT_ERROR]', err && err.message);
    return null;
  }
}

module.exports = { classifyDirect, generateDirectReply };
