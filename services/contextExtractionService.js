/**
 * Context Extraction Service
 * Parses natural language input to TravelGuideContext
 * Used by LUMI travel system (text-first UI)
 */

const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// SOYEOWOOL D2 provenance levels
const PROVENANCE = {
  USER_EXPLICIT: 'USER_EXPLICIT', // User directly stated this value
  AI_INFERENCE:  'AI_INFERENCE',  // Model inferred from context, not stated
  UNKNOWN:       'UNKNOWN'        // No basis found; value may be a code default
};

function mapSource(src) {
  if (src === 'explicit') return PROVENANCE.USER_EXPLICIT;
  if (src === 'inferred') return PROVENANCE.AI_INFERENCE;
  return PROVENANCE.UNKNOWN;
}

class ContextExtractionService {
  /**
   * Parse user message and extract travel context
   * @param {string} message - User's natural language input
   * @returns {Promise<TravelGuideContext | {error: string}>}
   */
  async parseUserMessage(message) {
    try {
      // Validate input
      if (!message || !message.trim()) {
        return { error: '질문을 입력해주세요.' };
      }

      if (message.trim().length < 5) {
        return { error: '좀 더 자세히 말씀해주세요.' };
      }

      const rawExtracted = await this._extractWithGPT4(message);

      if (!rawExtracted) {
        return { error: '죄송합니다. 다시 물어봐주세요.' };
      }

      // Deterministic guard: correct explicit Korean companion phrases before defaults
      const extracted = this._applyExplicitCompanionGuard(message, rawExtracted);

      // Build _provenance from GPT _source (D2 compliance)
      const src = extracted._source || {};
      const _provenance = {
        time_available_minutes: mapSource(src.time_available_minutes),
        people_type:            mapSource(src.people_type),
        has_kids:               mapSource(src.has_kids),
        has_elderly:            mapSource(src.has_elderly),
        disability:             mapSource(src.disability),
        meal_context:           mapSource(src.meal_context),
        has_car:                mapSource(src.has_car),
        mobility_type:          mapSource(src.mobility_type),
        emotion_primary:        mapSource(src.emotion_primary),
        emotion_tags:           mapSource(src.emotion_tags),
        time_of_day:            mapSource(src.time_of_day),
        preference_type:        mapSource(src.preference_type),
        budget_constraint:      mapSource(src.budget_constraint),
        group_size:             mapSource(src.group_size),
        requested_count:        mapSource(src.requested_count),
        mobility_constraint:    mapSource(src.mobility_constraint)
      };

      // Build TravelGuideContext — existing fields UNCHANGED
      const context = {
        session_id: uuidv4(),
        entry_point: null,
        user_mode: 'DEFAULT',
        country_code: 'KR',
        city_code: 'YEOSU',
        time_available_minutes: extracted.time_available_minutes ?? 120,
        people_type: extracted.people_type ?? 'solo',
        companion_constraints: {
          has_kids:    extracted.has_kids ?? false,
          kids_age:    extracted.kids_age,
          has_elderly: extracted.has_elderly ?? false,
          disability:  extracted.disability
        },
        meal_context: extracted.meal_context ?? 'none',
        has_car: extracted.has_car !== false, // null→true (backward-compat default)
        mobility_type: extracted.mobility_type ?? 'mixed',
        wish_context: this._buildWishContext(extracted),
        exclude_place_ids: [],
        must_visit_place_ids: [],
        // Phase 2 additive fields
        time_of_day:          extracted.time_of_day ?? null,
        preference_type:      extracted.preference_type ?? null,
        budget_constraint:    extracted.budget_constraint ?? null,
        group_size:           extracted.group_size ?? null,
        requested_count:      extracted.requested_count ?? null,
        mobility_constraint:  extracted.mobility_constraint ?? null,
        _provenance // additive — does not replace any existing field
      };

      return context;
    } catch (error) {
      console.error('[CONTEXT_EXTRACTION_ERROR]', {
        message: error.message,
        stack: error.stack
      });
      return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
    }
  }

  /**
   * Call GPT-4o-mini to extract context fields
   * Returns raw nullable values + _source provenance map (no code defaults applied here)
   * @private
   */
  async _extractWithGPT4(message) {
    try {
      const prompt = this._buildPrompt(message);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 자연어로 된 여행 계획을 구조화된 데이터로 변환하는 전문가입니다. 항상 JSON 형식으로 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 700,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      const parsed = JSON.parse(responseText);

      // Return raw values (nullable) so parseUserMessage can track provenance accurately
      return {
        time_available_minutes: parsed.time_available_minutes ?? null,
        people_type:            parsed.people_type ?? null,
        has_kids:               typeof parsed.has_kids === 'boolean' ? parsed.has_kids : null,
        kids_age:               parsed.kids_age ?? undefined,
        has_elderly:            typeof parsed.has_elderly === 'boolean' ? parsed.has_elderly : null,
        disability:             parsed.disability ?? undefined,
        meal_context:           parsed.meal_context ?? null,
        emotion_primary:        parsed.emotion_primary ?? undefined,
        emotion_tags:           Array.isArray(parsed.emotion_tags) ? parsed.emotion_tags : [],
        has_car:                typeof parsed.has_car === 'boolean' ? parsed.has_car : null,
        mobility_type:          parsed.mobility_type ?? null,
        time_of_day:            parsed.time_of_day ?? null,
        preference_type:        parsed.preference_type ?? null,
        budget_constraint:      parsed.budget_constraint ?? null,
        group_size:             typeof parsed.group_size === 'number' ? parsed.group_size : null,
        requested_count:        typeof parsed.requested_count === 'number' ? parsed.requested_count : null,
        mobility_constraint:    parsed.mobility_constraint ?? null,
        _source:                parsed._source || {}
      };
    } catch (error) {
      console.error('[GPT4_EXTRACTION_ERROR]', { message: error.message });
      return null;
    }
  }

  /**
   * Deterministic guard for explicit Korean companion phrases.
   * Overrides GPT people_type/companion booleans when the raw user message
   * contains an unambiguous phrase from the approved explicit list.
   * Guard is SILENT (returns extracted unchanged) when no known phrase found.
   * @private
   */
  _applyExplicitCompanionGuard(message, extracted) {
    const ELDERLY  = ['부모님과', '부모님이랑', '어머니와', '엄마랑', '아버지와', '아빠랑'];
    const KIDS     = ['아이랑', '아이와', '아이들과', '아이들이랑', '자녀와', '자녀랑', '애기랑', '아기랑'];
    const FRIENDS  = ['친구랑', '친구와', '친구들과'];
    const SOLO     = ['혼자', '혼자서'];
    const COUPLE   = ['둘이서', '커플', '남자친구', '여자친구', '남편', '아내', '와이프'];

    const hasElderly = ELDERLY.some(p => message.includes(p));
    const hasKids    = KIDS.some(p => message.includes(p));
    const hasFriends = FRIENDS.some(p => message.includes(p));
    const isSolo     = SOLO.some(p => message.includes(p));
    const isCouple   = COUPLE.some(p => message.includes(p));

    if (!hasElderly && !hasKids && !hasFriends && !isSolo && !isCouple) {
      return extracted; // guard silent — no recognized explicit phrase
    }

    const result = Object.assign({}, extracted);
    const source = Object.assign({}, extracted._source || {});

    if (hasElderly) {
      // PHASE_1_MIXED_COMPANION_LIMITATION: elderly wins people_type when both present
      result.people_type = 'family_elderly';
      result.has_elderly = true;
      source.people_type = 'explicit';
      source.has_elderly = 'explicit';
      if (hasKids) {
        result.has_kids = true;
        source.has_kids = 'explicit';
      }
    } else if (hasKids) {
      result.people_type = 'family_with_kids';
      result.has_kids = true;
      source.people_type = 'explicit';
      source.has_kids = 'explicit';
    } else if (hasFriends) {
      result.people_type = 'group';
      source.people_type = 'explicit';
    } else if (isSolo) {
      result.people_type = 'solo';
      source.people_type = 'explicit';
    } else if (isCouple) {
      result.people_type = 'couple';
      source.people_type = 'explicit';
    }

    result._source = source;
    return result;
  }

  /**
   * Build GPT-4o-mini prompt with _source provenance classification
   * @private
   */
  _buildPrompt(message) {
    return `사용자의 여행 질문을 분석하고 다음을 추출해주세요:

사용자 질문: "${message}"

다음 필드를 JSON으로 응답해주세요:
{
  "time_available_minutes": 숫자 또는 null (언급한 시간을 분으로. "두 시간"=120, "반나절"=180, "1박2일"=null(숙박포함이므로 미적용). 언급 없으면 null),
  "people_type": "solo" | "couple" | "family_with_kids" | "family_elderly" | "group" | null,
  "has_kids": true/false/null,
  "kids_age": 숫자 또는 null,
  "has_elderly": true/false/null,
  "disability": "wheelchair" | "visual" | "hearing" | null,
  "meal_context": "breakfast" | "lunch" | "dinner" | "snack" | "none" | null,
  "emotion_primary": "healing" | "joy" | "inspiration" | "reflection" | null,
  "emotion_tags": ["태그1"] (없으면 []),
  "has_car": true/false/null (언급 없으면 null),
  "mobility_type": "walk" | "bus" | "car" | "mixed" | null,
  "time_of_day": "morning" | "afternoon" | "evening" | "night" | null ("밤", "저녁", "야간" 등 언급 시 추출. 언급 없으면 null),
  "preference_type": "photo" | "food" | "relaxation" | "history" | "nature" | "shopping" | null (핵심 선호가 명확할 때만),
  "budget_constraint": "free" | "low" | "normal" | null ("무료", "공짜", "돈 없는", "저렴", "싸게" 등. 언급 없으면 null),
  "group_size": 숫자 또는 null (명확한 인원수 언급 시. "12명"=12, "우리 둘"=2. 언급 없으면 null),
  "requested_count": 숫자 또는 null (사용자가 결과 개수를 명시한 경우만. "세 군데"=3, "두 곳"=2, "다섯 개"=5. 추론하지 말고 명시적 언급만. 언급 없으면 null),
  "mobility_constraint": "low_walking" | null ("많이 안 걷는", "걷기 힘든", "편한 코스", "체력이 약한", "이동 부담 없는" 등 명시적 보행 부담 감소 요청 시. 추론 말고 명시적 언급만. 언급 없으면 null),
  "_source": {
    "time_available_minutes": "explicit" | "inferred" | "unknown",
    "people_type": "explicit" | "inferred" | "unknown",
    "has_kids": "explicit" | "inferred" | "unknown",
    "has_elderly": "explicit" | "inferred" | "unknown",
    "disability": "explicit" | "inferred" | "unknown",
    "meal_context": "explicit" | "inferred" | "unknown",
    "has_car": "explicit" | "inferred" | "unknown",
    "mobility_type": "explicit" | "inferred" | "unknown",
    "emotion_primary": "explicit" | "inferred" | "unknown",
    "emotion_tags": "explicit" | "inferred" | "unknown",
    "time_of_day": "explicit" | "inferred" | "unknown",
    "preference_type": "explicit" | "inferred" | "unknown",
    "budget_constraint": "explicit" | "inferred" | "unknown",
    "group_size": "explicit" | "inferred" | "unknown",
    "requested_count": "explicit" | "inferred" | "unknown",
    "mobility_constraint": "explicit" | "inferred" | "unknown"
  }
}

한국어 동반자 표현 → people_type 매핑 (엄격히 적용):
- "부모님과", "부모님이랑", "어머니와", "엄마랑", "아버지와", "아빠랑" → people_type: "family_elderly", has_elderly: true
- "아이랑", "아이와", "아이들과", "아이들이랑", "자녀와", "자녀랑", "애기랑", "아기랑" → people_type: "family_with_kids", has_kids: true
- "친구랑", "친구와", "친구들과", "친구 X명" → people_type: "group"
- "혼자", "혼자서" → people_type: "solo"
- "둘이서", "커플", "남자친구", "여자친구", "남편", "아내" → people_type: "couple"

_source 분류 기준:
- "explicit": 사용자가 해당 값을 직접 말한 경우
- "inferred": 직접 말하지 않았지만 문맥으로 합리적으로 추론 가능한 경우
- "unknown": 직접 근거도 없고 안전하게 추론할 수도 없는 경우

엄격한 JSON 형식으로만 응답하세요.`;
  }

  /**
   * Build wish context from extracted emotion
   * @private
   */
  _buildWishContext(extractedData) {
    const tags = extractedData.emotion_tags || [];
    if (!extractedData.emotion_primary && tags.length === 0) {
      return undefined;
    }

    return {
      emotion_primary: extractedData.emotion_primary,
      emotion_tags:    tags
    };
  }
}

module.exports = new ContextExtractionService();
