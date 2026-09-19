'use strict';

/**
 * contextExtractionProvenance.test.js — SOYEOWOOL D2 Provenance Tagging (8 tests)
 *
 * T-CP01: USER_EXPLICIT — time directly stated
 * T-CP02: USER_EXPLICIT — car explicitly denied ("차 없어요")
 * T-CP03: AI_INFERENCE — emotion inferred from mood context
 * T-CP04: UNKNOWN — has_car when not mentioned (no auto-upgrade)
 * T-CP05: UNKNOWN — no promotion to USER_EXPLICIT for code-defaulted fields
 * T-CP06: Mixed — one explicit, one inferred, one unknown in same context
 * T-CP07: Backward compat — all TravelGuideContext fields present alongside _provenance
 * T-CP08: has_car false behavior preserved when UNKNOWN (context.has_car defaults to true)
 */

// ── Mock openai BEFORE requiring the service ──────────────────────────────────
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

// uuid is deterministic in tests
jest.mock('uuid', () => ({ v4: () => 'test-session-uuid' }));

// ── Imports ───────────────────────────────────────────────────────────────────
const svc = require('../../services/contextExtractionService');

// ── Helpers ───────────────────────────────────────────────────────────────────
function gptResponse(data) {
  return {
    choices: [{
      message: {
        content: JSON.stringify(data)
      }
    }]
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('contextExtractionProvenance — SOYEOWOOL D2', () => {

  afterEach(() => {
    mockCreate.mockReset();
  });

  // ── T-CP01: Explicit time mention ────────────────────────────────────────────
  test('T-CP01: time_available_minutes = USER_EXPLICIT when user states duration', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: 180,
      people_type: 'couple',
      has_kids: false,
      has_elderly: false,
      disability: null,
      meal_context: 'lunch',
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'explicit',  // "오늘 3시간 있어요"
        people_type:            'explicit',
        has_kids:               'inferred',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'explicit',  // "점심 먹고 싶어요"
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('오늘 3시간 있어요. 둘이서 점심 먹고 싶어요.');

    expect(ctx._provenance).toBeDefined();
    expect(ctx._provenance.time_available_minutes).toBe('USER_EXPLICIT');
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.meal_context).toBe('USER_EXPLICIT');
    expect(ctx.time_available_minutes).toBe(180);
  });

  // ── T-CP02: Explicit car denial ──────────────────────────────────────────────
  test('T-CP02: has_car = USER_EXPLICIT when user explicitly denies car', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: 'couple',
      has_kids: false,
      has_elderly: false,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: false,  // "차는 없어요"
      mobility_type: 'bus',
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'explicit',
        has_kids:               'inferred',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'explicit',   // directly stated
        mobility_type:          'inferred',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('둘이서 가요. 차는 없어요.');

    expect(ctx._provenance.has_car).toBe('USER_EXPLICIT');
    expect(ctx.has_car).toBe(false);  // false preserved
  });

  // ── T-CP03: AI_INFERENCE for emotion ─────────────────────────────────────────
  test('T-CP03: emotion_primary = AI_INFERENCE when inferred from mood context', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: 'solo',
      has_kids: null,
      has_elderly: null,
      disability: null,
      meal_context: null,
      emotion_primary: 'healing',  // inferred from "지쳐서 쉬고 싶어요"
      emotion_tags: ['rest', 'quiet'],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'inferred',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'inferred',  // not directly stated
        emotion_tags:           'inferred'
      }
    }));

    const ctx = await svc.parseUserMessage('요즘 너무 지쳐서 쉬고 싶어요.');

    expect(ctx._provenance.emotion_primary).toBe('AI_INFERENCE');
    expect(ctx._provenance.emotion_tags).toBe('AI_INFERENCE');
    expect(ctx.wish_context.emotion_primary).toBe('healing');
  });

  // ── T-CP04: UNKNOWN when has_car not mentioned ───────────────────────────────
  test('T-CP04: has_car = UNKNOWN when user says nothing about car', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: 120,
      people_type: 'family_with_kids',
      has_kids: true,
      has_elderly: false,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,   // not mentioned
      mobility_type: null,
      _source: {
        time_available_minutes: 'explicit',
        people_type:            'explicit',
        has_kids:               'explicit',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',   // no mention
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('아이들과 2시간 여행 가요.');

    expect(ctx._provenance.has_car).toBe('UNKNOWN');
    // Backward compat: has_car defaults to true when not mentioned
    expect(ctx.has_car).toBe(true);
  });

  // ── T-CP05: Code-default NOT promoted to USER_EXPLICIT ───────────────────────
  test('T-CP05: fields defaulted by code are UNKNOWN, not USER_EXPLICIT', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,    // GPT found no mention → code will default to 120
      people_type: null,               // GPT found no mention → code will default to 'solo'
      has_kids: null,
      has_elderly: null,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'unknown',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('여수 가고 싶어요.');

    // Code applied defaults — must NOT be USER_EXPLICIT
    expect(ctx._provenance.time_available_minutes).toBe('UNKNOWN');
    expect(ctx._provenance.people_type).toBe('UNKNOWN');
    expect(ctx._provenance.has_car).toBe('UNKNOWN');

    // But values are still filled (backward compat for travelGuideService)
    expect(ctx.time_available_minutes).toBe(120);
    expect(ctx.people_type).toBe('solo');
    expect(ctx.has_car).toBe(true);
  });

  // ── T-CP06: Mixed provenance in one context ──────────────────────────────────
  test('T-CP06: mixed provenance — explicit + inferred + unknown coexist', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: 240,
      people_type: 'family_with_kids',
      has_kids: true,
      has_elderly: false,
      disability: null,
      meal_context: 'dinner',
      emotion_primary: 'joy',
      emotion_tags: ['family'],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'explicit',   // "4시간"
        people_type:            'explicit',   // "가족"
        has_kids:               'explicit',   // "아이들"
        has_elderly:            'inferred',   // implied from "가족"
        disability:             'unknown',
        meal_context:           'explicit',   // "저녁"
        has_car:                'unknown',    // not mentioned
        mobility_type:          'unknown',
        emotion_primary:        'inferred',   // from family travel context
        emotion_tags:           'inferred'
      }
    }));

    const ctx = await svc.parseUserMessage('가족들과 4시간 여수 저녁 여행이에요. 아이들 있어요.');

    expect(ctx._provenance.time_available_minutes).toBe('USER_EXPLICIT');
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_kids).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_elderly).toBe('AI_INFERENCE');
    expect(ctx._provenance.disability).toBe('UNKNOWN');
    expect(ctx._provenance.has_car).toBe('UNKNOWN');
    expect(ctx._provenance.emotion_primary).toBe('AI_INFERENCE');
  });

  // ── T-CP07: Backward compat — all TravelGuideContext fields present ───────────
  test('T-CP07: all TravelGuideContext fields present alongside _provenance', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: 180,
      people_type: 'couple',
      has_kids: false,
      has_elderly: false,
      disability: null,
      meal_context: 'none',
      emotion_primary: null,
      emotion_tags: [],
      has_car: true,
      mobility_type: 'car',
      _source: {
        time_available_minutes: 'explicit',
        people_type:            'explicit',
        has_kids:               'inferred',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'explicit',
        mobility_type:          'explicit',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('차로 3시간 커플 여행.');

    // All original TravelGuideContext fields must still be present
    expect(ctx.session_id).toBeDefined();
    expect(ctx.entry_point).toBeNull();
    expect(ctx.user_mode).toBe('DEFAULT');
    expect(ctx.country_code).toBe('KR');
    expect(ctx.city_code).toBe('YEOSU');
    expect(typeof ctx.time_available_minutes).toBe('number');
    expect(ctx.people_type).toBeDefined();
    expect(ctx.companion_constraints).toBeDefined();
    expect(ctx.companion_constraints.has_kids).toBeDefined();
    expect(ctx.companion_constraints.has_elderly).toBeDefined();
    expect(ctx.meal_context).toBeDefined();
    expect(typeof ctx.has_car).toBe('boolean');
    expect(ctx.mobility_type).toBeDefined();
    expect(Array.isArray(ctx.exclude_place_ids)).toBe(true);
    expect(Array.isArray(ctx.must_visit_place_ids)).toBe(true);

    // _provenance is additive
    expect(ctx._provenance).toBeDefined();
    expect(Object.keys(ctx._provenance)).toHaveLength(10);
  });

  // ── T-CG01: guard corrects wrong GPT classification — parents phrase ──────────
  test('T-CG01: "부모님과 왔는데 3시간 정도 남았어" — GPT returns family_with_kids → guard corrects to family_elderly', async () => {
    // GPT returned the WRONG category (actual production failure pattern)
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: 180,
      people_type: 'family_with_kids', // WRONG — guard must correct
      has_kids: false,
      has_elderly: false,              // WRONG — guard must correct
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'explicit',
        people_type:            'explicit',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('부모님과 왔는데 3시간 정도 남았어');

    expect(ctx.people_type).toBe('family_elderly');
    expect(ctx.companion_constraints.has_elderly).toBe(true);
    expect(ctx.time_available_minutes).toBe(180);              // GPT time preserved
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_elderly).toBe('USER_EXPLICIT');
    expect(ctx._provenance.time_available_minutes).toBe('USER_EXPLICIT');
  });

  // ── T-CG02: guard corrects null GPT output — parents phrase ──────────────────
  test('T-CG02: "부모님과 왔는데 3시간 정도 남았어" — GPT returns null → guard sets family_elderly', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: 180,
      people_type: null,   // NULL — guard must set
      has_kids: null,
      has_elderly: null,   // NULL — guard must set
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'explicit',
        people_type:            'unknown',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('부모님과 왔는데 3시간 정도 남았어');

    expect(ctx.people_type).toBe('family_elderly');
    expect(ctx.companion_constraints.has_elderly).toBe(true);
    expect(ctx.time_available_minutes).toBe(180);
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_elderly).toBe('USER_EXPLICIT');
  });

  // ── T-CG03: guard corrects solo GPT output — kids phrase ─────────────────────
  test('T-CG03: "아이랑 여수 왔어요" — GPT returns solo/false → guard corrects to family_with_kids', async () => {
    // Mirrors the actual Scenario B production failure
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: 'solo',   // WRONG — actual production failure value
      has_kids: false,        // WRONG
      has_elderly: false,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'explicit',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('아이랑 여수 왔어요');

    expect(ctx.people_type).toBe('family_with_kids');
    expect(ctx.companion_constraints.has_kids).toBe(true);
    expect(ctx.companion_constraints.has_elderly).toBe(false);
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_kids).toBe('USER_EXPLICIT');
  });

  // ── T-CG04: guard corrects null GPT output — kids phrase ─────────────────────
  test('T-CG04: "아이랑 여수 왔어요" — GPT returns null → guard sets family_with_kids', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: null,   // NULL — guard must set
      has_kids: null,      // NULL — guard must set
      has_elderly: null,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'unknown',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('아이랑 여수 왔어요');

    expect(ctx.people_type).toBe('family_with_kids');
    expect(ctx.companion_constraints.has_kids).toBe(true);
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_kids).toBe('USER_EXPLICIT');
  });

  // ── T-CG05: guard corrects null — friends phrase ──────────────────────────────
  test('T-CG05: "친구랑 여수 왔어요" — GPT returns null → guard sets group', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: null,
      has_kids: null,
      has_elderly: null,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'unknown',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('친구랑 여수 왔어요');

    expect(ctx.people_type).toBe('group');
    expect(ctx.companion_constraints.has_kids).toBe(false);
    expect(ctx.companion_constraints.has_elderly).toBe(false);
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
  });

  // ── T-CG06: guard corrects null — solo phrase ─────────────────────────────────
  test('T-CG06: "혼자 여수 왔어요" — GPT returns null → guard sets solo', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: null,
      has_kids: null,
      has_elderly: null,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'unknown',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('혼자 여수 왔어요');

    expect(ctx.people_type).toBe('solo');
    expect(ctx.companion_constraints.has_kids).toBe(false);
    expect(ctx.companion_constraints.has_elderly).toBe(false);
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
  });

  // ── T-CG07: mixed elderly + kids — PHASE_1_MIXED_COMPANION_LIMITATION ─────────
  test('T-CG07: "부모님이랑 아이랑 왔어요" — elderly wins people_type, both flags set (PHASE_1_MIXED_COMPANION_LIMITATION)', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: null,
      has_kids: null,
      has_elderly: null,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'unknown',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('부모님이랑 아이랑 왔어요');

    // Elderly wins people_type (single-category contract limitation)
    expect(ctx.people_type).toBe('family_elderly');
    // Both companion booleans must be true — companion_constraints is independent
    expect(ctx.companion_constraints.has_elderly).toBe(true);
    expect(ctx.companion_constraints.has_kids).toBe(true);
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_elderly).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_kids).toBe('USER_EXPLICIT');
  });

  // ── T-CG08: guard silent — no recognized phrase, GPT output preserved ─────────
  test('T-CG08: "여수 여행 어디 갈까요" — no companion phrase → guard silent, GPT output preserved', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: 'couple',   // GPT inferred — guard must NOT touch this
      has_kids: false,
      has_elderly: false,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'inferred',  // GPT inferred, not explicit
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('여수 여행 어디 갈까요');

    // Guard is silent — GPT's couple must survive unchanged
    expect(ctx.people_type).toBe('couple');
    expect(ctx._provenance.people_type).toBe('AI_INFERENCE');  // GPT 'inferred' maps to AI_INFERENCE
  });

  // ── T-CG09: guard silent — phrase present, GPT already correct ───────────────
  test('T-CG09: "아이랑 여수 왔어요" — GPT already correct → values preserved, provenance from guard (USER_EXPLICIT)', async () => {
    // GPT happens to return the right answer — guard still fires (phrase present)
    // Result must be identical to what guard would set
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: null,
      people_type: 'family_with_kids',
      has_kids: true,
      has_elderly: false,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,
      mobility_type: null,
      _source: {
        time_available_minutes: 'unknown',
        people_type:            'explicit',
        has_kids:               'explicit',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('아이랑 여수 왔어요');

    expect(ctx.people_type).toBe('family_with_kids');
    expect(ctx.companion_constraints.has_kids).toBe(true);
    expect(ctx.companion_constraints.has_elderly).toBe(false);
    // Guard sets 'explicit' — same as GPT marked; USER_EXPLICIT either way
    expect(ctx._provenance.people_type).toBe('USER_EXPLICIT');
    expect(ctx._provenance.has_kids).toBe('USER_EXPLICIT');
  });

  // ── T-CP08: has_car null → context.has_car=true (backward compat) ────────────
  test('T-CP08: has_car=null from GPT → context.has_car=true (backward compat default)', async () => {
    mockCreate.mockResolvedValue(gptResponse({
      time_available_minutes: 120,
      people_type: 'solo',
      has_kids: null,
      has_elderly: null,
      disability: null,
      meal_context: null,
      emotion_primary: null,
      emotion_tags: [],
      has_car: null,   // GPT: not mentioned
      mobility_type: null,
      _source: {
        time_available_minutes: 'explicit',
        people_type:            'explicit',
        has_kids:               'unknown',
        has_elderly:            'unknown',
        disability:             'unknown',
        meal_context:           'unknown',
        has_car:                'unknown',
        mobility_type:          'unknown',
        emotion_primary:        'unknown',
        emotion_tags:           'unknown'
      }
    }));

    const ctx = await svc.parseUserMessage('2시간 혼자 여수 여행.');

    // has_car null → true (existing default preserved for travelGuideService)
    expect(ctx.has_car).toBe(true);
    // BUT provenance must reflect UNKNOWN — not USER_EXPLICIT
    expect(ctx._provenance.has_car).toBe('UNKNOWN');
  });

});
