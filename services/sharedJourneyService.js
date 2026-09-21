/**
 * Shared Journey Service — V0.2
 * Extracts 5 Shared Journey signals from user message (single-session, no DB).
 *
 * Signals: WANT / EXPERIENCE_RELATIONSHIP / REPEAT_INTENT / COMPANION_VOICE / VOICE_PROVENANCE
 *
 * Key invariant: EXPERIENCED ≠ EXCLUDE.
 * Key invariant: companion_voices preserved per-individual — never compressed.
 * Key invariant: PII relationship labels (MOTHER/FATHER) not exported — anonymized as COMPANION_A/B.
 */

'use strict';

const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICE_TYPE = {
  COMPANION_DIRECT:      'COMPANION_DIRECT',
  COMPANION_VIA_PRIMARY: 'COMPANION_VIA_PRIMARY',
  PRIMARY_INFERENCE:     'PRIMARY_INFERENCE'
};

const VOICE_PRIORITY = {
  COMPANION_DIRECT:      1,
  COMPANION_VIA_PRIMARY: 2,
  PRIMARY_INFERENCE:     3
};

function _emptyJourney() {
  return {
    want:             [],
    experienced:      [],
    repeat_intent:    null,
    companion_voices: [],
    voice_provenance: null
  };
}

function _resolveVoiceType(raw) {
  if (raw === VOICE_TYPE.COMPANION_DIRECT)      return VOICE_TYPE.COMPANION_DIRECT;
  if (raw === VOICE_TYPE.PRIMARY_INFERENCE)     return VOICE_TYPE.PRIMARY_INFERENCE;
  if (raw === VOICE_TYPE.COMPANION_VIA_PRIMARY) return VOICE_TYPE.COMPANION_VIA_PRIMARY;
  return VOICE_TYPE.COMPANION_VIA_PRIMARY; // safe default
}

function _deriveVoiceProvenance(voices) {
  if (!voices.length) return null;
  const sorted = voices
    .map(v => v.voice_type)
    .sort((a, b) => (VOICE_PRIORITY[a] || 99) - (VOICE_PRIORITY[b] || 99));
  return sorted[0];
}

function _normalize(raw) {
  const want = Array.isArray(raw.want)
    ? raw.want.map(w => ({
        place_hint:   w.place_hint   || null,
        specificity:  w.specificity  || 'EXPLICIT'
      }))
    : [];

  // EXPERIENCED ≠ EXCLUDE: experienced items are NEVER added to exclude lists
  const experienced = Array.isArray(raw.experienced)
    ? raw.experienced.map(e => ({
        place_hint: e.place_hint || null,
        sentiment:  e.sentiment  || 'NEUTRAL'
      }))
    : [];

  const repeat_intent =
    raw.repeat_intent && raw.repeat_intent.wanted === true
      ? {
          wanted:     true,
          conditions: Array.isArray(raw.repeat_intent.conditions)
            ? raw.repeat_intent.conditions
            : []
        }
      : null;

  // Anonymize companion relationships; preserve per-individual voices
  const companion_voices = Array.isArray(raw.companion_voices)
    ? raw.companion_voices.map((cv, i) => ({
        companion_label: `COMPANION_${String.fromCharCode(65 + i)}`, // A, B, C …
        voice_type:      _resolveVoiceType(cv.voice_type),
        desire:          cv.desire        || null,
        mobility_hint:   cv.mobility_hint || null
      }))
    : [];

  const voice_provenance = _deriveVoiceProvenance(companion_voices);

  return { want, experienced, repeat_intent, companion_voices, voice_provenance };
}

function _systemPrompt() {
  return `당신은 여행자 발화에서 Shared Journey 신호를 추출하는 전문가입니다.

다음 5가지 신호를 JSON으로 추출하세요.

중요 원칙 (위반 시 오답):
- experienced(이미 해본 것)는 절대 제외 목록이 아님. 재방문 의향은 repeat_intent로 별도 표현.
- 동행자 욕구는 개인별로 보존. "family_elderly" 하나로 압축 금지.
- 동행자 발화 구분:
  * "엄마가 ~하고 싶대/하고 싶다고 해" → COMPANION_VIA_PRIMARY (동행자가 직접 말한 것을 주 여행자가 전달)
  * "엄마는 아마 ~좋아할 것 같아" → PRIMARY_INFERENCE (주 여행자의 추정)
  * "(동행자가) 직접 표현한 경우" → COMPANION_DIRECT
- 동행자 관계명(엄마/아빠/부모님)은 추출하지 않음. voice_type으로만 구분.
- 이동 부담 신호("많이 못 걷는", "걷기 힘든", "체력이 약한") → mobility_hint: "low_walking"

JSON 형식:
{
  "want": [{ "place_hint": "string or null", "specificity": "EXPLICIT" }],
  "experienced": [{ "place_hint": "string or null", "sentiment": "NEUTRAL|POSITIVE|NEGATIVE" }],
  "repeat_intent": { "wanted": true, "conditions": ["night","morning", etc] } or null,
  "companion_voices": [
    {
      "voice_type": "COMPANION_DIRECT" | "COMPANION_VIA_PRIMARY" | "PRIMARY_INFERENCE",
      "desire": "구체적 욕구 설명",
      "mobility_hint": "low_walking" or null
    }
  ]
}

신호가 없는 경우 빈 배열 또는 null로 응답. 엄격한 JSON만 응답.`;
}

/**
 * Extract Shared Journey signals from a user message.
 * Never throws — returns _emptyJourney() on any error.
 * @param {string} message
 * @returns {Promise<SharedJourneyContext>}
 */
async function extractSharedJourney(message) {
  if (!message || !message.trim()) return _emptyJourney();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: _systemPrompt() },
        { role: 'user',   content: message }
      ],
      temperature: 0.3,
      max_tokens:  600,
      response_format: { type: 'json_object' }
    });

    const raw = JSON.parse(completion.choices[0].message.content);
    return _normalize(raw);
  } catch (err) {
    console.error('[SHARED_JOURNEY_EXTRACT_ERROR]', { message: err.message });
    return _emptyJourney();
  }
}

module.exports = { extractSharedJourney, VOICE_TYPE };
