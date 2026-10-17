'use strict';

/**
 * Hyangiram SOUL Phase 1 — H-1~H-7 Routing Tests
 *
 * Phase 1 scope (2026-10-18):
 *   C1: _PLACE_KNOWLEDGE.hyangiram — experience_ko / fit_ko / walking_ok / parking_trust=UNKNOWN
 *   C2: PSQ builder — hyangiram "어때요" / walking_ok / vehicle-UNKNOWN branches
 *   C3: _handleJourneyDecision — hyangiram family_elderly / family_with_kids responses
 *   C4: _hyangiramVehicleBypass (companion required) + _ldGuardBypass extension
 *   C5: Companion Chip — vehicle note / family_with_kids high-difficulty branch
 *
 * Run: npx jest --testPathPatterns="soulHyangiramPhase1"
 */

// ── _PLACE_KNOWLEDGE.hyangiram fixture (Phase 1 기대값) ───────────────────────
const HYANGIRAM_KNOWLEDGE = {
  phone: null,
  admission_ko: '무료',
  hours_ko: '04:00~19:00',
  hours_trust: 'NON_OFFICIAL',
  stairs_ko: '경내 계단 구간이 있어요. 거동이 불편하신 분은 주의가 필요해요.',
  routes_ko: '두 경로로 오를 수 있어요. 한 쪽은 가파른 편이고 (약 10분), 다른 쪽은 상대적으로 완만해요 (약 15분). 완만한 길도 계단이 없지는 않아요. 올라온 길 또는 다른 경로로 내려갈 수 있어요.',
  experience_ko: '향일암은 바다와 바위 절벽의 풍경을 바라보며 잠시 마음을 가다듬을 수 있는 곳이에요. 경사와 계단이 있는 장소이니, 풍경을 즐기는 마음과 함께 자신의 이동 여건도 살펴보세요.',
  fit_ko: '조용한 풍경과 사찰의 분위기를 느끼고 싶은 분께 어울려요. 부모님이나 아이와 함께라면 계단과 경사 구간을 고려해 무리하지 않는 방문 계획을 세워보세요.',
  walking_ok: '향일암은 경사와 계단 구간이 있어 걷는 부담이 생길 수 있어요. 이동에 어려움이 있다면 방문 전 접근 경로를 확인하고, 무리하지 않는 계획을 세워보세요.',
  parking_ko: null,
  parking_trust: 'UNKNOWN',
};

// DB fixture — 001_travel_places.sql + apply_hyangiram_difficulty
const HYANGIRAM_PLACE = {
  code: 'hyangiram',
  name_ko: '향일암',
  venue_type: 'outdoor',
  avg_stay_minutes: 90,
  suitable_for: ['family', 'elderly', 'kids_ok', 'pilgrimage'],
  physical_difficulty: 'high',
  accessibility_stroller: false,
};

const VERIFY_NOTE_NULL_PHONE = '\n\n현장에서 직원에게 문의해보세요.';

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
function buildPsqAnswer(message, place, knowledge) {
  const msg = message;
  const code = place.code;
  const name = place.name_ko;
  const verifyNote = VERIFY_NOTE_NULL_PHONE;

  // Duration
  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(msg)) {
    if (place.avg_stay_minutes) return `${name} 평균 관람 시간은 약 ${place.avg_stay_minutes}분이에요.`;
  }
  // Parking keyword (주차)
  if (/(주차|차 세우|차 대|주차장)/.test(msg)) {
    if (knowledge.parking_ko) return knowledge.parking_ko + verifyNote;
    if (knowledge.parking_trust === 'UNKNOWN') {
      return `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
    }
    return `${name}의 주차 정보는 현장 확인이 필요해요.${verifyNote}`;
  }
  // Hours
  if (/(운영|영업|문 여|오픈|몇 시|몇시|닫|마감)/.test(msg)) {
    if (knowledge.hours_ko) return knowledge.hours_ko + verifyNote;
  }
  // Admission
  if (/(입장료|무료|요금|얼마)/.test(msg)) {
    if (knowledge.admission_ko) return knowledge.admission_ko + verifyNote;
  }
  // Stairs / route
  if (/(계단|다른 길|우회|올라가는 길|내려가는 길)/.test(msg)) {
    if (knowledge.routes_ko) return knowledge.routes_ko + verifyNote;
    if (knowledge.stairs_ko) return knowledge.stairs_ko + verifyNote;
  }
  // Odongdo "어때요"
  if (code === 'odongdo' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) return knowledge.experience_ko;
  }
  // Hyangiram "어때요" (C2a)
  if (code === 'hyangiram' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) return knowledge.experience_ko;
  }
  // Walking (C2b — fires when walking_ok present)
  if (knowledge.walking_ok && /(걸어야|걷기|걷는|보행)/.test(msg)) {
    return knowledge.walking_ok;
  }
  // Odongdo vehicle (C2c)
  if (code === 'odongdo' && /(차로|자가용으로)/.test(msg)) {
    return `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
  }
  // Hyangiram vehicle (C2c)
  if (code === 'hyangiram' && /(차로|자가용으로)/.test(msg)) {
    return `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
  }
  // Experience
  if (/(어떤 곳|어떤 데|어떤 장소|소개|설명해|알고 싶어|알려줘|뭐 하는 곳|뭐가 있어|뭐 볼|뭐해)/.test(msg)) {
    if (knowledge.experience_ko) return knowledge.experience_ko + verifyNote;
  }
  return `${name}에 대한 정보를 확인 중이에요.${verifyNote}`;
}

// ── Mirrors: _hyangiramVehicleBypass (C4) ────────────────────────────────────
function hyangiramVehicleBypass(psqPlaceCode, hasCar, message) {
  return psqPlaceCode === 'hyangiram'
    && !!hasCar
    && /(차로|자가용으로)/.test(message)
    && /(부모님과|아이와|가족과)/.test(message);
}

// ── Mirrors: _ldGuardBypass (updated with C4) ─────────────────────────────────
function ldGuardBypass(message, psqPlaceCode, hasCar) {
  const yisunsinBypass = psqPlaceCode === 'lee_soon_shin_plaza' && !!hasCar && /(차로|자가용으로)/.test(message);
  const odongdoBypass  = psqPlaceCode === 'odongdo' && !!hasCar && /(차로|자가용으로)/.test(message) && /(부모님과|아이와|가족과)/.test(message);
  const hyangiramBypass = hyangiramVehicleBypass(psqPlaceCode, hasCar, message);
  return (
    /^(안녕|안녕하세요|반가워|하이|hello|hi)[\s!.?]*$/i.test(message.trim())
    || /(잘 모르겠|모르겠어|뭐가 좋을|뭐 해야|어떡하|어쩌)/.test(message)
    || (/케이블카|케이블 카/.test(message) && /(꼭|반드시|타고 싶|타야|빼고|빼줘|제외|일정에|탈거야)/.test(message))
    || /(부모님과|아이와|가족과).*(왔어|왔어요|왔는데|함께라면|함께 왔|와서|가려고)/.test(message)
    || /(이곳에서.*(즐기|어떻게)|어떻게.*즐기)/.test(message)
    || yisunsinBypass
    || odongdoBypass
    || hyangiramBypass
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

// ── Mirrors: Companion Chip vehicle note (C5) ─────────────────────────────────
function companionChipVehicleNote(hasCar, placeCode, knowledge, name) {
  if (!hasCar || (placeCode !== 'lee_soon_shin_plaza' && placeCode !== 'odongdo' && placeCode !== 'hyangiram')) return null;
  if (knowledge.parking_trust === 'UNKNOWN') {
    return `차로 이동하시는군요. ${name} 인근 주차 정보는 방문 전에 확인해보세요.`;
  }
  return '차로 이동하시는 경우, 인근 주차 여건을 미리 확인해보세요.';
}

// ── Mirrors: Companion Chip family_elderly note ───────────────────────────────
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

// ── Mirrors: Companion Chip family_with_kids note ─────────────────────────────
function companionChipKidsNote(place) {
  if (place.accessibility_stroller) return '유모차 접근이 가능해요.';
  if (place.code === 'hyangiram' && place.physical_difficulty === 'high') {
    return '경사와 계단이 있어요. 아이와 함께라면 이동 여건을 미리 살펴보세요.';
  }
  if (Array.isArray(place.suitable_for) && place.suitable_for.includes('kids_ok')) {
    const isOutdoor = place.venue_type === 'outdoor';
    const stayMin = place.avg_stay_minutes;
    if (isOutdoor && stayMin) return `야외 장소라 아이와 자유롭게 둘러보기 좋아요. 보통 약 ${stayMin}분 정도 머물러요.`;
    if (isOutdoor) return '야외 장소라 아이와 자유롭게 둘러보기 좋아요.';
    if (stayMin) return `보통 약 ${stayMin}분 정도 머물러요.`;
  }
  return null;
}

// ── Mirrors: _ccAccessibilityQ ───────────────────────────────────────────────
function ccAccessibilityQ(peopleType, physicalDifficulty, mobilityConstraint) {
  return peopleType === 'family_elderly' && physicalDifficulty === 'high' && !mobilityConstraint
    ? ['걷기 많이 힘드신가요?']
    : [];
}

// ── Mirrors: JOURNEY_PREFERENCE hyangiram response (C3) ──────────────────────
function hyangiramJourneyPreferenceResponse(peopleType) {
  const ko = '향일암';
  if (peopleType === 'family_elderly') {
    return {
      message_ko: `${ko}를 여정에 넣을게요.\n계단과 경사가 있는 장소예요. 이동에 어려운 부분이 있으세요?`,
      next_options: ['걷기 많이 힘드신가요?'],
    };
  }
  if (peopleType === 'family_with_kids') {
    return {
      message_ko: `${ko}를 여정에 넣을게요.\n경사와 계단이 있어요. 아이와 함께라면 이동 여건을 미리 살펴보세요.`,
      next_options: ['걱정되는 부분 있어요?', '넣어줘'],
    };
  }
  return {
    message_ko: `${ko}를 첫 번째 장소로 넣을게요.\n추가하고 싶은 곳이 있으신가요?`,
    next_options: ['케이블카도 탈래', '향일암까지 가능해?'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — C1: _PLACE_KNOWLEDGE.hyangiram fields', () => {

  test('HP1-C1-01: experience_ko 존재 및 핵심 요소 포함', () => {
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).toBeTruthy();
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).toContain('바다');
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).toContain('경사와 계단');
  });

  test('HP1-C1-02: fit_ko 존재 및 부모님·아이 맥락 포함', () => {
    expect(HYANGIRAM_KNOWLEDGE.fit_ko).toBeTruthy();
    expect(HYANGIRAM_KNOWLEDGE.fit_ko).toContain('부모님이나 아이');
    expect(HYANGIRAM_KNOWLEDGE.fit_ko).toContain('계단과 경사');
  });

  test('HP1-C1-03: walking_ok 존재 및 경사·계단 언급', () => {
    expect(HYANGIRAM_KNOWLEDGE.walking_ok).toBeTruthy();
    expect(HYANGIRAM_KNOWLEDGE.walking_ok).toContain('경사와 계단');
  });

  test('HP1-C1-04: walking_ok에 수치 단정 없음 (10분/15분 미포함)', () => {
    expect(HYANGIRAM_KNOWLEDGE.walking_ok).not.toMatch(/\d+분/);
  });

  test('HP1-C1-05: parking_ko null (미검증 주차 정보 미노출)', () => {
    expect(HYANGIRAM_KNOWLEDGE.parking_ko).toBeNull();
  });

  test('HP1-C1-06: parking_trust UNKNOWN', () => {
    expect(HYANGIRAM_KNOWLEDGE.parking_trust).toBe('UNKNOWN');
  });

  test('HP1-C1-07: experience_ko에 "공영주차장" 미포함 (F-3 보호)', () => {
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).not.toContain('공영주차장');
  });

  test('HP1-C1-08: experience_ko에 계단 수 단정 없음', () => {
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).not.toMatch(/\d+개.*계단|계단.*\d+개/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — H-1: "향일암 어때요?" PSQ builder', () => {

  test('HP1-H1-01: 향일암 어때요? → experience_ko 반환', () => {
    const answer = buildPsqAnswer('향일암 어때요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).toBe(HYANGIRAM_KNOWLEDGE.experience_ko);
  });

  test('HP1-H1-02: experience_ko에 보행 부담 안내 포함', () => {
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).toContain('경사와 계단');
  });

  test('HP1-H1-03: 격리 — 오동도 "어때요"는 hyangiram 분기 미사용', () => {
    const ODONGDO_KNOWLEDGE = { experience_ko: '오동도 experience', walking_ok: null, parking_trust: 'UNKNOWN', parking_ko: null };
    const ODONGDO_PLACE = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 };
    const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(answer).toBe(ODONGDO_KNOWLEDGE.experience_ko);
  });

  test('HP1-H1-04: 격리 — 향일암 분기가 odongdo "어때요"에 응답하지 않음', () => {
    const ODONGDO_KNOWLEDGE = { experience_ko: '오동도 experience', walking_ok: null, parking_trust: 'UNKNOWN', parking_ko: null };
    const ODONGDO_PLACE = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 };
    const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(answer).not.toContain('향일암');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — H-2: 부모님 JOURNEY_PREFERENCE', () => {

  test('HP1-H2-01: "부모님과 함께 가고 싶어요." → JOURNEY_PREFERENCE 분류', () => {
    expect(detectJourneyDecisionType('부모님과 함께 가고 싶어요.')).toBe('JOURNEY_PREFERENCE');
  });

  test('HP1-H2-02: family_elderly → 계단 경고 포함 응답', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_elderly');
    expect(resp.message_ko).toContain('계단과 경사');
  });

  test('HP1-H2-03: family_elderly → next_options: 걷기 질문 포함', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_elderly');
    expect(resp.next_options).toContain('걷기 많이 힘드신가요?');
  });

  test('HP1-H2-04: family_elderly → "괜찮아요" 미포함 (F-5 비승인)', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_elderly');
    expect(resp.next_options).not.toContain('괜찮아요');
  });

  test('HP1-H2-05: family_elderly → 향일암 여정 포함 메시지', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_elderly');
    expect(resp.message_ko).toContain('향일암');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — H-3: 아이 JOURNEY_PREFERENCE', () => {

  test('HP1-H3-01: "아이와 가고 싶어요." → JOURNEY_PREFERENCE 분류', () => {
    expect(detectJourneyDecisionType('아이와 가고 싶어요.')).toBe('JOURNEY_PREFERENCE');
  });

  test('HP1-H3-02: family_with_kids → 경사·계단 안내 포함', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_with_kids');
    expect(resp.message_ko).toContain('경사와 계단');
  });

  test('HP1-H3-03: family_with_kids → 이동 여건 안내 포함', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_with_kids');
    expect(resp.message_ko).toContain('이동 여건');
  });

  test('HP1-H3-04: family_with_kids → next_options 비어있지 않음', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_with_kids');
    expect(resp.next_options.length).toBeGreaterThan(0);
  });

  test('HP1-H3-05: family_with_kids → "야외 장소라 아이와 자유롭게" 미포함 (high difficulty)', () => {
    const resp = hyangiramJourneyPreferenceResponse('family_with_kids');
    expect(resp.message_ko).not.toContain('야외 장소라 아이와 자유롭게');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — H-4: "많이 걸어야 하나요?" walking_ok', () => {

  test('HP1-H4-01: "많이 걸어야 하나요?" → walking_ok 반환', () => {
    const answer = buildPsqAnswer('많이 걸어야 하나요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).toBe(HYANGIRAM_KNOWLEDGE.walking_ok);
  });

  test('HP1-H4-02: walking_ok → 경사·계단 언급', () => {
    const answer = buildPsqAnswer('걷기 힘드나요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).toContain('경사와 계단');
  });

  test('HP1-H4-03: walking_ok 응답에 수치 단정 없음', () => {
    const answer = buildPsqAnswer('많이 걸어야 하나요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).not.toMatch(/\d+분.*걸|걸.*\d+분/);
  });

  test('HP1-H4-04: "쉽게 오를 수 있어요" 표현 미포함 (Guardrail)', () => {
    const answer = buildPsqAnswer('많이 걸어야 하나요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).not.toContain('쉽게 오를');
  });

  test('HP1-H4-05: H-4가 PSQ builder walking_ok 분기에 도달하는 조건 확인', () => {
    // walking_ok 필드가 정의되어 있고 걸어야 패턴 매칭
    expect(HYANGIRAM_KNOWLEDGE.walking_ok).toBeTruthy();
    expect(/(걸어야|걷기|걷는|보행)/.test('많이 걸어야 하나요?')).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — H-5: "차로 가려고 하는데요." (no companion)', () => {

  test('HP1-H5-01: 동반자 없는 차량 쿼리 → _ldGuardBypass=false', () => {
    const bypass = ldGuardBypass('차로 가려고 하는데요.', 'hyangiram', true);
    expect(bypass).toBe(false);
  });

  test('HP1-H5-02: 차로 가려고 → hyangiram vehicle 분기 → 주차 UNKNOWN 안내', () => {
    const answer = buildPsqAnswer('차로 가려고 하는데요.', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).toContain('주차 정보는 방문 전에 확인');
  });

  test('HP1-H5-03: 주차 정보 답변에 미검증 요금 미포함 (F-3)', () => {
    const answer = buildPsqAnswer('차로 가려고 하는데요.', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).not.toContain('공영주차장');
    expect(answer).not.toContain('2시간 무료');
  });

  test('HP1-H5-04: 격리 — 오동도 차로 쿼리는 hyangiram 분기 미사용', () => {
    const ODONGDO_PLACE = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 };
    const ODONGDO_KNOWLEDGE = { experience_ko: null, walking_ok: null, parking_ko: null, parking_trust: 'UNKNOWN' };
    const answer = buildPsqAnswer('차로 가려고 하는데요.', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(answer).toContain('오동도');
    expect(answer).not.toContain('향일암');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — H-6: "부모님과 차로 가요." (family_elderly + has_car)', () => {

  test('HP1-H6-01: _hyangiramVehicleBypass=true (부모님과 + 차로 + hyangiram)', () => {
    expect(hyangiramVehicleBypass('hyangiram', true, '부모님과 차로 가요.')).toBe(true);
  });

  test('HP1-H6-02: _ldGuardBypass=true via hyangiramVehicleBypass', () => {
    expect(ldGuardBypass('부모님과 차로 가요.', 'hyangiram', true)).toBe(true);
  });

  test('HP1-H6-03: _isCompanionChipQuery=true', () => {
    expect(isCompanionChipQuery('부모님과 차로 가요.', 'hyangiram', true)).toBe(true);
  });

  test('HP1-H6-04: Companion Chip elderly note → 경사나 계단 안내 (high difficulty)', () => {
    const note = companionChipElderlyNote(HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(note).toContain('경사나 계단이 있어요');
  });

  test('HP1-H6-05: Companion Chip vehicle note → 주차 UNKNOWN 안내', () => {
    const note = companionChipVehicleNote(true, 'hyangiram', HYANGIRAM_KNOWLEDGE, '향일암');
    expect(note).toContain('주차 정보는 방문 전에 확인');
  });

  test('HP1-H6-06: _ccAccessibilityQ → 걷기 질문 노출 (family_elderly + high + !mobility)', () => {
    const q = ccAccessibilityQ('family_elderly', 'high', false);
    expect(q).toContain('걷기 많이 힘드신가요?');
  });

  test('HP1-H6-07: _ccAccessibilityQ → 이미 알고 있으면 미노출', () => {
    const q = ccAccessibilityQ('family_elderly', 'high', true); // mobility_constraint=true
    expect(q).toHaveLength(0);
  });

  test('HP1-H6-08: 격리 — odongdo에서는 hyangiramVehicleBypass 미작동', () => {
    expect(hyangiramVehicleBypass('odongdo', true, '부모님과 차로 가요.')).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — H-7: "아이와 차로 가요." (family_with_kids + has_car)', () => {

  test('HP1-H7-01: _hyangiramVehicleBypass=true (아이와 + 차로 + hyangiram)', () => {
    expect(hyangiramVehicleBypass('hyangiram', true, '아이와 차로 가요.')).toBe(true);
  });

  test('HP1-H7-02: _ldGuardBypass=true via hyangiramVehicleBypass', () => {
    expect(ldGuardBypass('아이와 차로 가요.', 'hyangiram', true)).toBe(true);
  });

  test('HP1-H7-03: _isCompanionChipQuery=true', () => {
    expect(isCompanionChipQuery('아이와 차로 가요.', 'hyangiram', true)).toBe(true);
  });

  test('HP1-H7-04: Companion Chip kids note → 경사·계단 안내 (hyangiram high difficulty)', () => {
    const note = companionChipKidsNote(HYANGIRAM_PLACE);
    expect(note).toContain('경사와 계단');
    expect(note).toContain('이동 여건');
  });

  test('HP1-H7-05: Companion Chip kids note → "야외 장소라 아이와 자유롭게" 미포함', () => {
    const note = companionChipKidsNote(HYANGIRAM_PLACE);
    expect(note).not.toContain('야외 장소라 아이와 자유롭게');
  });

  test('HP1-H7-06: Companion Chip vehicle note → 주차 UNKNOWN 안내', () => {
    const note = companionChipVehicleNote(true, 'hyangiram', HYANGIRAM_KNOWLEDGE, '향일암');
    expect(note).toContain('주차 정보는 방문 전에 확인');
  });

  test('HP1-H7-07: 격리 — 동반자 없는 "차로 가려고"에서는 hyangiramVehicleBypass 미작동', () => {
    expect(hyangiramVehicleBypass('hyangiram', true, '차로 가려고 하는데요.')).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — Case C 보호 (회귀)', () => {

  test('HP1-CC-01: "부모님과 함께 가려고 해요." → _ldGuardBypass=true (가려고 매칭)', () => {
    expect(ldGuardBypass('부모님과 함께 가려고 해요.', 'hyangiram', false)).toBe(true);
  });

  test('HP1-CC-02: Case C는 JOURNEY_PREFERENCE 경로 아님 (가고 싶어 미매칭)', () => {
    expect(detectJourneyDecisionType('부모님과 함께 가려고 해요.')).toBeNull();
  });

  test('HP1-CC-03: _isCompanionChipQuery=true for Case C 패턴', () => {
    expect(isCompanionChipQuery('부모님과 함께 가려고 해요.', 'hyangiram', false)).toBe(true);
  });

  test('HP1-CC-04: Companion Chip elderly → 경사나 계단 안내 (high difficulty)', () => {
    const note = companionChipElderlyNote(HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(note).toBe('경사나 계단이 있어요. 이동 동선을 미리 확인해보세요.');
  });

  test('HP1-CC-05: _ccAccessibilityQ → 걷기 질문 노출', () => {
    const q = ccAccessibilityQ('family_elderly', 'high', false);
    expect(q).toEqual(['걷기 많이 힘드신가요?']);
  });

  test('HP1-CC-06: Case C 패턴 "가려고"가 여전히 _ldGuardBypass 트리거', () => {
    const regex = /(부모님과|아이와|가족과).*(왔어|왔어요|왔는데|함께라면|함께 왔|와서|가려고)/;
    expect(regex.test('부모님과 함께 가려고 해요.')).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — Place Isolation (격리)', () => {

  test('HP1-ISO-01: 오동도 vehicle bypass가 hyangiram에서 미작동', () => {
    const odongdoBypass = 'hyangiram' === 'odongdo'
      && true
      && /(차로|자가용으로)/.test('부모님과 차로 가요.')
      && /(부모님과|아이와|가족과)/.test('부모님과 차로 가요.');
    expect(odongdoBypass).toBe(false);
  });

  test('HP1-ISO-02: hyangiram vehicle bypass가 odongdo에서 미작동', () => {
    expect(hyangiramVehicleBypass('odongdo', true, '부모님과 차로 가요.')).toBe(false);
  });

  test('HP1-ISO-03: hyangiram vehicle bypass가 lee_soon_shin_plaza에서 미작동', () => {
    expect(hyangiramVehicleBypass('lee_soon_shin_plaza', true, '부모님과 차로 가요.')).toBe(false);
  });

  test('HP1-ISO-04: hyangiram "어때요" PSQ → odongdo에 응답 안 함', () => {
    const ODONGDO_PLACE = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 };
    const ODONGDO_KNOWLEDGE = { experience_ko: '오동도 exp', walking_ok: '오동도 walking' };
    const answer = buildPsqAnswer('어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    // odongdo uses odongdo branch, not hyangiram
    expect(answer).toBe(ODONGDO_KNOWLEDGE.experience_ko);
  });

  test('HP1-ISO-05: Companion Chip vehicle note — hyangiram 추가 후 odongdo 동작 불변', () => {
    const ODONGDO_KNOWLEDGE_LOCAL = { parking_trust: 'UNKNOWN' };
    const note = companionChipVehicleNote(true, 'odongdo', ODONGDO_KNOWLEDGE_LOCAL, '오동도');
    expect(note).toContain('오동도 인근 주차 정보');
  });

  test('HP1-ISO-06: _extractGoldenPlaceCode — 향일암 → hyangiram', () => {
    expect(extractGoldenPlaceCode('향일암 어때요?')).toBe('hyangiram');
  });

  test('HP1-ISO-07: _extractGoldenPlaceCode — 오동도 → odongdo (불변)', () => {
    expect(extractGoldenPlaceCode('오동도 어때요?')).toBe('odongdo');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hyangiram Phase 1 — Guardrails', () => {

  test('HP1-GR-01: experience_ko에 "쉽게 오를 수 있어요" 미포함', () => {
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).not.toContain('쉽게 오를');
  });

  test('HP1-GR-02: experience_ko에 계단 수 수치 미포함', () => {
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).not.toMatch(/\d+개.*계단|계단.*\d+개/);
  });

  test('HP1-GR-03: walking_ok에 "10분" "15분" 수치 미포함 (NON_OFFICIAL)', () => {
    expect(HYANGIRAM_KNOWLEDGE.walking_ok).not.toContain('10분');
    expect(HYANGIRAM_KNOWLEDGE.walking_ok).not.toContain('15분');
  });

  test('HP1-GR-04: parking_ko null — 미검증 주차 정보 미노출', () => {
    expect(HYANGIRAM_KNOWLEDGE.parking_ko).toBeNull();
  });

  test('HP1-GR-05: H-7 kids Companion Chip에 "아이와 자유롭게" 미포함 (high difficulty)', () => {
    const note = companionChipKidsNote(HYANGIRAM_PLACE);
    expect(note).not.toContain('아이와 자유롭게');
  });

  test('HP1-GR-06: fit_ko에 사찰 운영 사항 단정 없음', () => {
    expect(HYANGIRAM_KNOWLEDGE.fit_ko).not.toMatch(/\d+시.*~.*\d+시/);
  });

  test('HP1-GR-07: experience_ko에 일출 시간 특정 없음', () => {
    expect(HYANGIRAM_KNOWLEDGE.experience_ko).not.toMatch(/일출.*\d+시|\d+시.*일출/);
  });

});
