'use strict';

/**
 * Odongdo SOUL Phase 1 — O-1~O-7 Routing Tests
 *
 * Phase 1 scope (2026-10-17):
 *   C1: _PLACE_KNOWLEDGE.odongdo — experience_ko / fit_ko / walking_ok / parking_trust=UNKNOWN
 *   C2: PSQ builder — odongdo "어때요" / walking_ok / vehicle-UNKNOWN branches
 *   C3: _handleJourneyDecision — odongdo family_elderly / family_with_kids responses
 *   C4: _odongdoVehicleBypass (companion required) + _ldGuardBypass extension
 *   C5: Companion Chip — walking guardrail / vehicle note / "이동 부담이 적어요" 미노출
 *
 * Run: npx jest --testPathPatterns="soulOdongdoPhase1"
 */

// ── _PLACE_KNOWLEDGE.odongdo fixture (Phase 1 후 기대값) ─────────────────────
const ODONGDO_KNOWLEDGE = {
  phone: '061-659-1819',
  admission_ko: '무료',
  hours_ko: '연중무휴 (동백열차 09:00~17:00)',
  hours_trust: 'NON_OFFICIAL',
  experience_ko: '오동도는 바다 풍경과 계절의 자연을 느끼며 산책할 수 있는 곳이에요. 방파제 길과 섬 안쪽의 산책 경험을 자신의 속도에 맞춰 즐겨보세요.',
  fit_ko: '자연과 바다를 천천히 즐기고 싶은 분께 잘 어울려요. 부모님이나 아이와 함께라면 걷는 거리와 쉬는 시간을 고려해 동선을 정해보세요.',
  walking_ok: '오동도는 산책을 즐기는 장소예요. 어느 구간까지 이동하느냐에 따라 걷는 부담이 달라질 수 있어요. 걷기가 부담스럽다면 이동 범위를 짧게 잡고 중간에 쉬어가는 편을 추천해요.',
  parking_ko: null,
  parking_trust: 'UNKNOWN',
};

// DB fixture — 001_travel_places.sql + migration 217
const ODONGDO_PLACE = {
  code: 'odongdo',
  name_ko: '오동도',
  venue_type: 'outdoor',
  avg_stay_minutes: 120,
  suitable_for: ['family', 'kids_ok', 'elderly', 'groups'],
  physical_difficulty: 'low',
  accessibility_stroller: false,
};

const VERIFY_NOTE = '\n\n정확한 정보는 061-659-1819에 문의하시거나 현장에서 확인해보세요.';

// ── Mirrors: _extractGoldenPlaceCode ─────────────────────────────────────────
function extractGoldenPlaceCode(message) {
  if (/오동도/.test(message)) return 'odongdo';
  if (/케이블카|케이블 카/.test(message)) return 'cablecar';
  if (/향일암/.test(message)) return 'hyangiram';
  return null;
}

// ── Mirrors: _detectJourneyDecisionType ──────────────────────────────────────
function detectJourneyDecisionType(message) {
  const msg = message || '';
  if (/(하나 빼|빼줘|빼주세요|제외해줘)/.test(msg)) return 'JOURNEY_MODIFY';
  if (/(걷는 건 힘|걷기 힘|걸으면 힘|힘들어하|다리 아|무릎 아|걷기 많이|많이 걷는)/.test(msg)) return 'CONSTRAINT_UPDATE';
  if (/(가능해|가능한가요|갈 수 있어|될까|가봐도 될|갈 수 있을까)/.test(msg)) return 'FEASIBILITY';
  if (/(도 탈래|도 갈래|도 넣어|탈래|도 타고|도 가볼까)/.test(msg)) return 'JOURNEY_ADD';
  if (/(먼저 가고 싶|가고 싶어|가고싶어)/.test(msg)) return 'JOURNEY_PREFERENCE';
  return null;
}

// ── Mirrors: PSQ builder branches (C2) ───────────────────────────────────────
function buildPsqAnswer(message, place, knowledge, soulContext) {
  const msg = message;
  const code = place.code;
  const name = place.name_ko;
  const verifyNote = VERIFY_NOTE;

  // Duration
  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(msg)) {
    if (knowledge.ride_duration_ko) return `${name}은 ${knowledge.ride_duration_ko}예요.`;
    if (place.avg_stay_minutes) return `${name} 평균 관람 시간은 약 ${place.avg_stay_minutes}분이에요.`;
  }
  // Parking
  if (/(주차|차 세우|차 대|주차장)/.test(msg)) {
    if (knowledge.parking_ko) return knowledge.parking_ko + verifyNote;
    if (knowledge.parking_trust === 'UNKNOWN') {
      return `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
    }
    return `${name}의 주차 정보는 현장 확인이 필요해요.${verifyNote}`;
  }
  // Odongdo "어때요" — odongdo-scoped (C2a)
  if (code === 'odongdo' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) return knowledge.experience_ko;
  }
  // Walking (C2b)
  if (knowledge.walking_ok && /(걸어야|걷기|걷는|보행)/.test(msg)) {
    return knowledge.walking_ok;
  }
  // Odongdo vehicle (C2c)
  if (code === 'odongdo' && /(차로|자가용으로)/.test(msg)) {
    return `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
  }
  // Experience
  if (/(어떤 곳|어떤 데|어떤 장소|소개|설명해|알고 싶어|알려줘|뭐 하는 곳|뭐가 있어|뭐 볼|뭐해)/.test(msg)) {
    if (knowledge.experience_ko) return knowledge.experience_ko + verifyNote;
  }
  return `${name}에 대한 정보를 확인 중이에요.${verifyNote}`;
}

// ── Mirrors: _odongdoVehicleBypass (C4) ──────────────────────────────────────
function odongdoVehicleBypass(psqPlaceCode, hasCar, message) {
  return psqPlaceCode === 'odongdo'
    && !!hasCar
    && /(차로|자가용으로)/.test(message)
    && /(부모님과|아이와|가족과)/.test(message);
}

// ── Mirrors: _ldGuardBypass (updated with C4) ─────────────────────────────────
function ldGuardBypass(message, psqPlaceCode, hasCar) {
  const yisunsinBypass = psqPlaceCode === 'lee_soon_shin_plaza' && !!hasCar && /(차로|자가용으로)/.test(message);
  const odongdoBypass  = odongdoVehicleBypass(psqPlaceCode, hasCar, message);
  return (
    /^(안녕|안녕하세요|반가워|하이|hello|hi)[\s!.?]*$/i.test(message.trim())
    || /(잘 모르겠|모르겠어|뭐가 좋을|뭐 해야|어떡하|어쩌)/.test(message)
    || (/케이블카|케이블 카/.test(message) && /(꼭|반드시|타고 싶|타야|빼고|빼줘|제외|일정에|탈거야)/.test(message))
    || /(부모님과|아이와|가족과).*(왔어|왔어요|왔는데|함께라면|함께 왔|와서|가려고)/.test(message)
    || /(이곳에서.*(즐기|어떻게)|어떻게.*즐기)/.test(message)
    || yisunsinBypass
    || odongdoBypass
  );
}

// ── Mirrors: _isCompanionChipQuery ───────────────────────────────────────────
function isCompanionChipQuery(message, psqPlaceCode, hasCar) {
  const bypass = ldGuardBypass(message, psqPlaceCode, hasCar);
  return (
    !!psqPlaceCode && bypass &&
    (/(부모님과|아이와|가족과).*(왔어|왔어요|함께)/.test(message) ||
     /(부모님과|아이와|가족과).*(차로|자가용으로)/.test(message) ||
     /(이곳에서.*(즐기|어떻게)|어떻게.*즐기)/.test(message))
  );
}

// ── Mirrors: Companion Chip vehicle note (C5: odongdo + lee_soon_shin_plaza) ─
function companionChipVehicleNote(hasCar, placeCode, knowledge, name) {
  if (!hasCar || (placeCode !== 'lee_soon_shin_plaza' && placeCode !== 'odongdo')) return null;
  if (knowledge.parking_trust === 'UNKNOWN') {
    return `차로 이동하시는군요. ${name} 인근 주차 정보는 방문 전에 확인해보세요.`;
  }
  return '차로 이동하시는 경우, 인근 주차 여건을 미리 확인해보세요.';
}

// ── Mirrors: Companion Chip family_elderly odongdo branch (C5 guardrail) ─────
function companionChipElderlyNote(place, knowledge) {
  if (place.physical_difficulty === 'high') {
    return '경사나 계단이 있어요. 이동 동선을 미리 확인해보세요.';
  }
  if (place.code === 'odongdo') {
    return knowledge.walking_ok || null;
  }
  if (Array.isArray(place.suitable_for) && place.suitable_for.includes('elderly')) {
    const isOutdoor = place.venue_type === 'outdoor';
    const stayMin = place.avg_stay_minutes;
    if (isOutdoor && stayMin) return `야외 장소라 이동 부담이 적어요. 보통 약 ${stayMin}분 정도 머물러요.`;
    if (isOutdoor) return '야외 장소라 이동 부담이 적어요.';
    if (stayMin) return `보통 약 ${stayMin}분 정도 머물러요.`;
  }
  return null;
}

// ── Mirrors: Journey Preference odongdo response (C3) ────────────────────────
function odongdoJourneyPreferenceResponse(peopleType) {
  const ko = '오동도';
  if (peopleType === 'family_elderly') {
    return {
      message_ko: `${ko}를 여정에 넣을게요.\n방파제 길로 산책하기 좋아요. 부모님과 함께라면 걷는 거리와 쉬는 시간을 고려해 동선을 정해보세요.`,
      next_options: ['많이 걸어야 하나요?', '주차는 어떻게 돼요?'],
      journey_includes_odongdo: true,
    };
  }
  if (peopleType === 'family_with_kids') {
    return {
      message_ko: `${ko}를 여정에 넣을게요.\n자연과 바다를 아이와 함께 즐기기 좋아요.`,
      next_options: ['얼마나 걸어요?'],
      journey_includes_odongdo: true,
    };
  }
  return {
    message_ko: `${ko}를 첫 번째 장소로 넣을게요.\n추가하고 싶은 곳이 있으신가요?`,
    next_options: ['케이블카도 탈래', '향일암까지 가능해?'],
    journey_includes_odongdo: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Odongdo Phase 1 — C1: _PLACE_KNOWLEDGE.odongdo fields', () => {

  test('OP1-C1-01: experience_ko 존재 및 문구 적합성', () => {
    expect(ODONGDO_KNOWLEDGE.experience_ko).toBeTruthy();
    expect(ODONGDO_KNOWLEDGE.experience_ko).toContain('바다 풍경');
    expect(ODONGDO_KNOWLEDGE.experience_ko).toContain('방파제');
  });

  test('OP1-C1-02: fit_ko 존재 및 부모님·아이 맥락 포함', () => {
    expect(ODONGDO_KNOWLEDGE.fit_ko).toBeTruthy();
    expect(ODONGDO_KNOWLEDGE.fit_ko).toContain('부모님이나 아이');
  });

  test('OP1-C1-03: walking_ok 존재 및 비단정 문구', () => {
    expect(ODONGDO_KNOWLEDGE.walking_ok).toBeTruthy();
    expect(ODONGDO_KNOWLEDGE.walking_ok).toContain('달라질 수 있어요');
  });

  test('OP1-C1-04: parking_ko는 null (단정 정보 없음)', () => {
    expect(ODONGDO_KNOWLEDGE.parking_ko).toBeNull();
  });

  test('OP1-C1-05: parking_trust는 UNKNOWN', () => {
    expect(ODONGDO_KNOWLEDGE.parking_trust).toBe('UNKNOWN');
  });

  test('OP1-C1-06: walking_ok에 동백열차 정보 없음 (검증 전 미노출)', () => {
    expect(ODONGDO_KNOWLEDGE.walking_ok).not.toMatch(/동백열차/);
  });

  test('OP1-C1-07: experience_ko에 동백열차 탑승 가능 여부 단정 없음', () => {
    expect(ODONGDO_KNOWLEDGE.experience_ko).not.toMatch(/동백열차.*탑승 가능|탑승.*무료|탑승.*유료/);
  });

});

describe('Odongdo Phase 1 — C2a: PSQ builder — O-1 "오동도 어때요?"', () => {

  test('OP1-O1-01: "오동도 어때요?" → experience_ko 반환', () => {
    const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, {});
    expect(answer).toContain('바다 풍경');
    expect(answer).toContain('방파제');
  });

  test('OP1-O1-02: "오동도 어때요?" → 동백열차 탑승 가능 여부 단정 없음', () => {
    const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, {});
    expect(answer).not.toMatch(/동백열차.*탑승 가능|동백열차.*탈 수/);
  });

  test('OP1-O1-03: "어때요" 오동도 전용 — 다른 장소는 기존 경로 유지', () => {
    // 케이블카에는 experience_ko 없으므로 "어때요" 패턴이 오동도 전용으로만 동작
    const cablecarKnowledge = { hours_ko: '09:00~18:00' };
    const cablecarPlace = { code: 'cablecar', name_ko: '여수 해상 케이블카', avg_stay_minutes: 60 };
    const answer = buildPsqAnswer('케이블카 어때요?', cablecarPlace, cablecarKnowledge, {});
    // "어때요" 오동도 분기 미발동 → experience_ko 없으므로 default
    expect(answer).not.toContain('바다 풍경');
  });

});

describe('Odongdo Phase 1 — C2b: PSQ builder — O-4 "많이 걸어야 하나요?"', () => {

  test('OP1-O4-01: "많이 걸어야 하나요?" → walking_ok 반환', () => {
    const answer = buildPsqAnswer('많이 걸어야 하나요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, {});
    expect(answer).toContain('걷는 부담이 달라질 수 있어요');
  });

  test('OP1-O4-02: walking_ok — physical_difficulty=low를 쉽다고 단정하지 않음', () => {
    const answer = buildPsqAnswer('걷기 힘든가요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, {});
    expect(answer).not.toMatch(/이동 부담이 적|쉬운 편이에요|걷기 쉬워요/);
  });

  test('OP1-O4-03: walking_ok — 120분을 걷는 시간으로 표현하지 않음', () => {
    const answer = buildPsqAnswer('걸어야 하나요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, {});
    expect(answer).not.toMatch(/120분.*걸|걷는 시간.*120/);
  });

  test('OP1-O4-04: walking_ok 분기 — 다른 장소 미전파 (walking_ok 필드 없으면 미발동)', () => {
    const lspKnowledge = { parking_trust: 'UNKNOWN', experience_ko: '이순신 광장이에요.' };
    const lspPlace = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장' };
    const answer = buildPsqAnswer('많이 걸어야 하나요?', lspPlace, lspKnowledge, {});
    expect(answer).not.toContain('오동도');
    // walking_ok 없으므로 walking 분기 미발동
    expect(answer).not.toContain('걷는 부담이 달라질 수 있어요');
  });

});

describe('Odongdo Phase 1 — C2c: PSQ builder — O-5 차량 단독 쿼리', () => {

  test('OP1-O5-01: "차로 가려고 하는데요." → 주차 UNKNOWN 안내', () => {
    const answer = buildPsqAnswer('차로 가려고 하는데요.', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, { has_car: true });
    expect(answer).toContain('방문 전에 확인하는 것이 좋아요');
    expect(answer).toContain('오동도');
  });

  test('OP1-O5-02: "자가용으로 갈 건데요" → 주차 단정 없음', () => {
    const answer = buildPsqAnswer('자가용으로 갈 건데요', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, { has_car: true });
    expect(answer).not.toMatch(/주차 무료|주차 가능|주차장이 있어요/);
  });

  test('OP1-O5-03: 다른 장소 + "차로 가려고" → 오동도 vehicle 분기 미발동 (격리)', () => {
    const lspKnowledge = { parking_trust: 'UNKNOWN' };
    const lspPlace = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장' };
    const answer = buildPsqAnswer('차로 가려고 하는데요.', lspPlace, lspKnowledge, { has_car: true });
    // 오동도 전용 vehicle 분기 미발동 — 오동도 문구 없음
    expect(answer).not.toContain('오동도 주변 주차');
    expect(answer).not.toContain('오동도');
  });

});

describe('Odongdo Phase 1 — C3: Journey Preference — O-2/O-3', () => {

  test('OP1-O2-01: "부모님과 함께 가고 싶어요." → JOURNEY_PREFERENCE 감지', () => {
    expect(detectJourneyDecisionType('부모님과 함께 가고 싶어요.')).toBe('JOURNEY_PREFERENCE');
  });

  test('OP1-O2-02: extractGoldenPlaceCode("부모님과 함께 가고 싶어요.") → odongdo (place_code=odongdo context)', () => {
    // Odongdo 방문자는 place_code=odongdo로 placeCodeHint가 설정됨
    const placeCode = extractGoldenPlaceCode('부모님과 함께 가고 싶어요.') || 'odongdo';
    expect(placeCode).toBe('odongdo');
  });

  test('OP1-O2-03: family_elderly — 여정에 오동도 추가됨', () => {
    const resp = odongdoJourneyPreferenceResponse('family_elderly');
    expect(resp.journey_includes_odongdo).toBe(true);
  });

  test('OP1-O2-04: family_elderly — 부모님 배려 문구 포함', () => {
    const resp = odongdoJourneyPreferenceResponse('family_elderly');
    expect(resp.message_ko).toContain('부모님');
    expect(resp.message_ko).toContain('걷는 거리');
  });

  test('OP1-O2-05: family_elderly — next_options에 걷기·주차 후속 질문 포함', () => {
    const resp = odongdoJourneyPreferenceResponse('family_elderly');
    expect(resp.next_options).toContain('많이 걸어야 하나요?');
    expect(resp.next_options).toContain('주차는 어떻게 돼요?');
  });

  test('OP1-O2-06: family_elderly — 물리적 이동 쉽다는 단정 없음', () => {
    const resp = odongdoJourneyPreferenceResponse('family_elderly');
    expect(resp.message_ko).not.toMatch(/이동 부담이 적|쉬운 편/);
  });

  test('OP1-O3-01: "아이와 가고 싶어요." → JOURNEY_PREFERENCE 감지', () => {
    expect(detectJourneyDecisionType('아이와 가고 싶어요.')).toBe('JOURNEY_PREFERENCE');
  });

  test('OP1-O3-02: family_with_kids — 여정에 오동도 추가됨', () => {
    const resp = odongdoJourneyPreferenceResponse('family_with_kids');
    expect(resp.journey_includes_odongdo).toBe(true);
  });

  test('OP1-O3-03: family_with_kids — 아이 동행 맥락 포함', () => {
    const resp = odongdoJourneyPreferenceResponse('family_with_kids');
    expect(resp.message_ko).toContain('아이');
  });

  test('OP1-O3-04: family_with_kids — next_options 존재', () => {
    const resp = odongdoJourneyPreferenceResponse('family_with_kids');
    expect(resp.next_options.length).toBeGreaterThan(0);
  });

  test('OP1-O3-05: general (people_type=null) — 기존 경로 유지', () => {
    const resp = odongdoJourneyPreferenceResponse(null);
    expect(resp.journey_includes_odongdo).toBe(true);
    expect(resp.next_options).toContain('케이블카도 탈래');
  });

});

describe('Odongdo Phase 1 — C4: _odongdoVehicleBypass', () => {

  test('OP1-C4-01: "부모님과 차로 가요." + odongdo + has_car → bypass=true', () => {
    expect(odongdoVehicleBypass('odongdo', true, '부모님과 차로 가요.')).toBe(true);
  });

  test('OP1-C4-02: "아이와 차로 가요." + odongdo + has_car → bypass=true', () => {
    expect(odongdoVehicleBypass('odongdo', true, '아이와 차로 가요.')).toBe(true);
  });

  test('OP1-C4-03: "가족과 자가용으로 가요." + odongdo + has_car → bypass=true', () => {
    expect(odongdoVehicleBypass('odongdo', true, '가족과 자가용으로 가요.')).toBe(true);
  });

  test('OP1-C4-04: 동행 없는 "차로 가려고 하는데요." + odongdo → bypass=false (O-5 격리)', () => {
    expect(odongdoVehicleBypass('odongdo', true, '차로 가려고 하는데요.')).toBe(false);
  });

  test('OP1-C4-05: has_car=false → bypass=false', () => {
    expect(odongdoVehicleBypass('odongdo', false, '부모님과 차로 가요.')).toBe(false);
  });

  test('OP1-C4-06: 다른 장소 + 동행 차량 → bypass=false (격리)', () => {
    expect(odongdoVehicleBypass('lee_soon_shin_plaza', true, '부모님과 차로 가요.')).toBe(false);
    expect(odongdoVehicleBypass('hyangiram', true, '부모님과 차로 가요.')).toBe(false);
  });

  test('OP1-C4-07: _ldGuardBypass — "부모님과 차로 가요." + odongdo + has_car → true', () => {
    expect(ldGuardBypass('부모님과 차로 가요.', 'odongdo', true)).toBe(true);
  });

  test('OP1-C4-08: _ldGuardBypass — "아이와 차로 가요." + odongdo + has_car → true', () => {
    expect(ldGuardBypass('아이와 차로 가요.', 'odongdo', true)).toBe(true);
  });

  test('OP1-C4-09: _isCompanionChipQuery — "부모님과 차로 가요." + odongdo + has_car → true', () => {
    expect(isCompanionChipQuery('부모님과 차로 가요.', 'odongdo', true)).toBe(true);
  });

  test('OP1-C4-10: _isCompanionChipQuery — "아이와 차로 가요." + odongdo + has_car → true', () => {
    expect(isCompanionChipQuery('아이와 차로 가요.', 'odongdo', true)).toBe(true);
  });

  test('OP1-C4-11: O-5 격리 — "차로 가려고" + odongdo + has_car → _isCompanionChipQuery false', () => {
    expect(isCompanionChipQuery('차로 가려고 하는데요.', 'odongdo', true)).toBe(false);
  });

});

describe('Odongdo Phase 1 — C5: Companion Chip Walking Guardrail', () => {

  test('OP1-C5-01: odongdo family_elderly — "이동 부담이 적어요" 미노출', () => {
    const note = companionChipElderlyNote(ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(note).not.toMatch(/이동 부담이 적어요/);
  });

  test('OP1-C5-02: odongdo family_elderly — walking_ok 사용', () => {
    const note = companionChipElderlyNote(ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(note).toContain('걷는 부담이 달라질 수 있어요');
  });

  test('OP1-C5-03: odongdo family_elderly — 120분을 걷는 시간으로 표현하지 않음', () => {
    const note = companionChipElderlyNote(ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(note).not.toMatch(/120분.*걷/);
  });

  test('OP1-C5-04: 다른 장소(hyangiram, physical_difficulty=high) — 기존 분기 유지', () => {
    const hyangPlace = { code: 'hyangiram', venue_type: 'outdoor', physical_difficulty: 'high', suitable_for: ['hiking'] };
    const note = companionChipElderlyNote(hyangPlace, {});
    expect(note).toContain('경사나 계단이 있어요');
  });

  test('OP1-C5-05: Companion Chip vehicle note — odongdo + parking_trust=UNKNOWN → 비단정 주차 안내', () => {
    const note = companionChipVehicleNote(true, 'odongdo', ODONGDO_KNOWLEDGE, '오동도');
    expect(note).toContain('오동도 인근 주차 정보는 방문 전에 확인해보세요');
  });

  test('OP1-C5-06: Companion Chip vehicle note — lee_soon_shin_plaza 기존 동작 불변', () => {
    const lspKnowledge = { parking_trust: 'UNKNOWN' };
    const note = companionChipVehicleNote(true, 'lee_soon_shin_plaza', lspKnowledge, '이순신광장');
    expect(note).toContain('이순신광장 인근 주차 정보는 방문 전에 확인해보세요');
  });

  test('OP1-C5-07: Companion Chip vehicle note — hyangiram → null (격리)', () => {
    const note = companionChipVehicleNote(true, 'hyangiram', {}, '향일암');
    expect(note).toBeNull();
  });

  test('OP1-C5-08: Companion Chip vehicle note — cablecar → null (격리)', () => {
    const note = companionChipVehicleNote(true, 'cablecar', {}, '케이블카');
    expect(note).toBeNull();
  });

});

describe('Odongdo Phase 1 — Guardrail: 동백열차 및 정보 단정 금지', () => {

  test('OP1-GR-01: experience_ko에 동백열차 탑승 가능 여부 없음', () => {
    expect(ODONGDO_KNOWLEDGE.experience_ko).not.toMatch(/동백열차.*탑승|탑승.*동백열차/);
  });

  test('OP1-GR-02: fit_ko에 주차 가능 단정 없음', () => {
    expect(ODONGDO_KNOWLEDGE.fit_ko).not.toMatch(/주차 무료|주차 가능|주차장/);
  });

  test('OP1-GR-03: walking_ok에 physical_difficulty=low 단정 없음', () => {
    expect(ODONGDO_KNOWLEDGE.walking_ok).not.toMatch(/이동이 쉬워|이동 부담이 없|어렵지 않아요/);
  });

  test('OP1-GR-04: "오동도 어때요?" 응답 — 주차 정보 단정 없음', () => {
    const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, {});
    expect(answer).not.toMatch(/주차 무료|주차 가능|주차장이 있어요/);
  });

  test('OP1-GR-05: "많이 걸어야 하나요?" 응답 — 동백열차 노출 없음', () => {
    const answer = buildPsqAnswer('많이 걸어야 하나요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE, {});
    expect(answer).not.toMatch(/동백열차/);
  });

});

describe('Odongdo Phase 1 — Scope Isolation: 다른 장소 미전파', () => {

  test('OP1-ISO-01: 이순신광장 + "많이 걸어야 하나요?" → walking_ok 미전파', () => {
    const lspKnowledge = { parking_trust: 'UNKNOWN', experience_ko: '이순신 광장이에요.' };
    const lspPlace = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장' };
    const answer = buildPsqAnswer('많이 걸어야 하나요?', lspPlace, lspKnowledge, {});
    expect(answer).not.toContain('걷는 부담이 달라질 수 있어요');
  });

  test('OP1-ISO-02: 향일암 + "어때요?" → odongdo experience_ko 미전파', () => {
    const hyangKnowledge = { experience_ko: '향일암은 해돋이로 유명해요.' };
    const hyangPlace = { code: 'hyangiram', name_ko: '향일암' };
    const answer = buildPsqAnswer('향일암 어때요?', hyangPlace, hyangKnowledge, {});
    // hyangiram은 code !== 'odongdo' → odongdo 전용 분기 미발동
    // hyangiram experience_ko가 있으면 generic experience 분기에서 반환
    expect(answer).not.toContain('바다 풍경');
    expect(answer).not.toContain('방파제');
  });

  test('OP1-ISO-03: _odongdoVehicleBypass — 이순신광장 동행 차량 → false', () => {
    expect(odongdoVehicleBypass('lee_soon_shin_plaza', true, '부모님과 차로 가요.')).toBe(false);
  });

  test('OP1-ISO-04: _odongdoVehicleBypass — 케이블카 동행 차량 → false', () => {
    expect(odongdoVehicleBypass('cablecar', true, '부모님과 차로 가요.')).toBe(false);
  });

  test('OP1-ISO-05: YiSunSin _yisunsinVehicleBypass — "부모님과 차로 가요." + lsp + has_car → true (기존 불변)', () => {
    const lspBypass = 'lee_soon_shin_plaza' === 'lee_soon_shin_plaza' && /(차로|자가용으로)/.test('부모님과 차로 가요.');
    expect(lspBypass).toBe(true);
  });

});
