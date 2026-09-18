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

      const extracted = await this._extractWithGPT4(message);

      if (!extracted) {
        return { error: '죄송합니다. 다시 물어봐주세요.' };
      }

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
        emotion_tags:           mapSource(src.emotion_tags)
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
        _source:                parsed._source || {}
      };
    } catch (error) {
      console.error('[GPT4_EXTRACTION_ERROR]', { message: error.message });
      return null;
    }
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
  "time_available_minutes": 숫자 또는 null (언급한 시간을 분으로, 언급 없으면 null),
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
    "emotion_tags": "explicit" | "inferred" | "unknown"
  }
}

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
