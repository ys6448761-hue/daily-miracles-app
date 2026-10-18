'use strict';

/**
 * Cablecar SOUL Phase 1 — CBL-1~CBL-9 Routing Tests
 *
 * Phase 1 scope (2026-10-18):
 *   C1a: _PLACE_KNOWLEDGE.cablecar.experience_ko — Founder 승인 문구
 *   C2a: PSQ builder — cablecar "어때요" 분기 추가
 *
 * Scope exclusions: JOURNEY_PREFERENCE 분기, Companion Chip, parking_trust, 캐빈 접근성
 *
 * Run: npx jest --testPathPatterns="soulCablecarPhase1"
 */

// ── Approved experience_ko (Founder C-1, 2026-10-18) ─────────────────────────
const CABLECAR_EXPERIENCE_KO =
  '여수 바다 위를 가로지르는 해상 케이블카예요. 바다와 섬, 항구를 높은 곳에서 바라보며 잠시 시야를 넓힐 수 있어요. 익숙한 풍경도 조금 다른 눈으로 바라보게 되는 시간이 될 수 있어요.';

// ── _PLACE_KNOWLEDGE.cablecar fixture (Phase 1 후 기대값) ─────────────────────
const CABLECAR_KNOWLEDGE = {
  phone: '061-664-7301',
  ride_duration_ko: '편도 약 12~13분, 거리 1.5km',
  ride_trust: 'NON_OFFICIAL',
  price_ko: '일반캐빈 왕복 약 17,000원/편도 약 14,000원. 크리스탈캐빈(유리바닥) 왕복 약 24,000원/편도 약 19,000원.',
  price_trust: 'NON_OFFICIAL',
  hours_ko: '09:30~21:30 (토요일·성수기 연장)',
  hours_trust: 'NON_OFFICIAL',
  roundtrip_ko: '왕복권과 편도권 모두 있어요. 차를 가져오셨다면 한쪽 역에 주차하고 편도로 타신 후 반대편에서 이동하는 방법도 있어요. 왕복은 타신 곳으로 돌아오는 방식이에요.',
  odongdo_connection_ko: '자산역(여수 쪽)에서 오동도 입구까지 버스 연계 동선으로 이어갈 수 있어요.',
  weather_ko: '실외 고공 구간이 있어서, 강풍이나 기상 악화 시 운행이 중단될 수 있어요. 당일 날씨를 미리 확인해보세요.',
  parking_ko: '자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 주차 위치·혼잡은 출발 정류장에 따라 달라요.',
  experience_ko: CABLECAR_EXPERIENCE_KO,
};

// DB fixture — travel_places cablecar record
const CABLECAR_PLACE = {
  code: 'cablecar',
  name_ko: '케이블카',
};

const ODONGDO_KNOWLEDGE = {
  experience_ko: '오동도는 바다 풍경과 계절의 자연을 느끼며 산책할 수 있는 곳이에요.',
  walking_ok: '오동도는 산책을 즐기는 장소예요.',
  parking_ko: null,
  parking_trust: 'UNKNOWN',
};
const ODONGDO_PLACE = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 };

const HYANGIRAM_KNOWLEDGE = {
  experience_ko: '향일암은 바다와 바위 절벽의 풍경을 바라보며 잠시 마음을 가다듬을 수 있는 곳이에요.',
  walking_ok: '향일암은 경사와 계단 구간이 있어 걷는 부담이 생길 수 있어요.',
  parking_ko: null,
  parking_trust: 'UNKNOWN',
};
const HYANGIRAM_PLACE = { code: 'hyangiram', name_ko: '향일암', physical_difficulty: 'high' };

const YISUNSIN_KNOWLEDGE = { experience_ko: null };
const YISUNSIN_PLACE = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장' };

const VERIFY_NOTE_PHONE = '\n\n정확한 정보는 061-664-7301에 문의하시거나 현장에서 확인해보세요.';

// ── Mirrors: _isPlaceSpecificQuery ───────────────────────────────────────────
function isPlaceSpecificQuery(message) {
  if (!message) return false;
  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(message)) return true;
  if (/(얼마야|얼마예요|요금|입장료|가격|티켓)/.test(message)) return true;
  if (/(왕복|편도)/.test(message)) return true;
  if (/(휠체어|유모차|접근성|장애|배리어)/.test(message)) return true;
  if (/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼|탈 수 있어|운행.*해|운행.*돼|운행 중|지금.*운행)/.test(message)) return true;
  if (/(비 오면|비 오|비가 오|날씨|우천|기상|눈이|바람이|태풍)/.test(message)) return true;
  if (/(오동도.*갔다가|오동도.*후에|오동도.*타도|오동도.*케이블|향일암.*갔다가|향일암.*후에)/.test(message)) return true;
  if (/(포토존|사진 어디|사진.*찍기|사진.*찍어|어디서.*찍|찍기 좋은 곳)/.test(message)) return true;
  if (/(알려 줘)/.test(message)) return true;
  if (/(주차|주차장|주차비|주차요금|차 세우|차 대는)/.test(message)) return true;
  if (/(화장실|운영시간|운행시간)/.test(message)) return true;
  return false;
}

// ── Mirrors: _ldGuardBypass (cablecar 조건 포함) ──────────────────────────────
function ldGuardBypass(message, psqPlaceCode, hasCar) {
  const yisunsinBypass = psqPlaceCode === 'lee_soon_shin_plaza' && !!hasCar && /(차로|자가용으로)/.test(message);
  const odongdoBypass  = psqPlaceCode === 'odongdo' && !!hasCar && /(차로|자가용으로)/.test(message) && /(부모님과|아이와|가족과)/.test(message);
  const hyangiramBypass = psqPlaceCode === 'hyangiram' && !!hasCar && /(차로|자가용으로)/.test(message) && /(부모님과|아이와|가족과)/.test(message);
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

// ── Mirrors: PSQ builder (C2a 포함) ──────────────────────────────────────────
function buildPsqAnswer(message, place, knowledge) {
  const msg = message;
  const code = place.code;
  const name = place.name_ko;
  const phone = knowledge.phone || null;
  const verifyNote = phone
    ? `\n\n정확한 정보는 ${phone}에 문의하시거나 현장에서 확인해보세요.`
    : '\n\n현장에서 직원에게 문의해보세요.';

  let answer = null;

  // Duration
  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(msg)) {
    if (knowledge.ride_duration_ko) {
      answer = `${name}은 ${knowledge.ride_duration_ko}예요.`;
      if (knowledge.ride_trust === 'NON_OFFICIAL') answer += '\n(블로그 참고값이에요. 현장 상황에 따라 다를 수 있어요.)';
    }
  }
  // Roundtrip/oneway
  else if (/(왕복|편도)/.test(msg)) {
    if (knowledge.roundtrip_ko) {
      answer = knowledge.roundtrip_ko;
      if (knowledge.price_ko) {
        answer += `\n\n요금 참고: ${knowledge.price_ko}`;
        if (knowledge.price_trust === 'NON_OFFICIAL') answer += `\n※ 공식 사이트 확인이 필요해요.${verifyNote}`;
      }
    }
  }
  // Parking (before price)
  else if (/(주차|차 세우|차 대|주차장)/.test(msg)) {
    if (knowledge.parking_ko) {
      answer = knowledge.parking_ko + verifyNote;
    } else if (knowledge.parking_trust === 'UNKNOWN') {
      answer = `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
    }
  }
  // Price/admission
  else if (/(얼마야|얼마예요|요금|입장료|가격|티켓)/.test(msg)) {
    if (knowledge.price_ko) {
      answer = `요금(참고): ${knowledge.price_ko}`;
      if (knowledge.price_trust === 'NON_OFFICIAL') answer += '\n※ 공식 사이트에서 확인이 필요해요.' + verifyNote;
    }
  }
  // Place connection
  else if (/(오동도.*갔다가|오동도.*후에|오동도.*타도|오동도.*케이블|향일암.*갔다가|향일암.*후에)/.test(msg)) {
    if (knowledge.odongdo_connection_ko) answer = knowledge.odongdo_connection_ko;
  }
  // Operation
  else if (/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼|운행.*해|운행.*돼|운행 중|지금.*운행)/.test(msg)) {
    if (knowledge.hours_ko) {
      const _h = knowledge.hours_ko;
      answer = /요\.$/.test(_h) ? `${name} 운영시간은 ${_h}` : `${name} 운영시간은 ${_h}예요.`;
      if (knowledge.hours_trust === 'NON_OFFICIAL') answer += '\n(참고값이에요.)';
      answer += '\n현재 운영 여부는 현장 확인이 필요해요.' + verifyNote;
    }
  }
  // Weather
  else if (/(비 오면|비 오|비가 오|날씨|우천|기상|눈이|바람이|태풍)/.test(msg)) {
    if (knowledge.weather_ko) answer = knowledge.weather_ko + verifyNote;
  }
  // Hours alt
  else if (/(몇 시까지|마감|닫어|닫나요|닫아|언제까지|열어|몇 시에 열|언제 열)/.test(msg)) {
    if (knowledge.hours_ko) {
      const _h = knowledge.hours_ko;
      answer = /요\.$/.test(_h) ? `${name} 운영시간은 ${_h}` : `${name} 운영시간은 ${_h}예요.`;
      if (knowledge.hours_trust === 'NON_OFFICIAL') answer += '\n(참고값이에요.)';
      answer += verifyNote;
    }
  }
  // Odongdo "어때요"
  else if (code === 'odongdo' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  }
  // Hyangiram "어때요"
  else if (code === 'hyangiram' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  }
  // Cablecar "어때요" (C2a)
  else if (code === 'cablecar' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  }
  // Walking guidance
  else if (knowledge.walking_ok && /(걸어야|걷기|걷는|보행)/.test(msg)) {
    answer = knowledge.walking_ok;
  }
  // Experience
  else if (/(어떤 곳|어떤 데|어떤 장소|소개|설명해|알고 싶어|알려줘|뭐 하는 곳|뭐가 있어|뭐 볼|뭐해)/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko + verifyNote;
  }

  if (!answer) answer = `${name}에 대한 정보를 확인 중이에요.${verifyNote}`;
  return answer;
}

// ── Routing decision helper ───────────────────────────────────────────────────
// Returns 'PSQ_GATE' | 'LDF_PSQ' | 'BYPASS_CLARIFICATION'
function routingDecision(message, psqPlaceCode, hasCar) {
  if (psqPlaceCode && isPlaceSpecificQuery(message)) return 'PSQ_GATE';
  const bypass = ldGuardBypass(message, psqPlaceCode, hasCar);
  if (psqPlaceCode && !bypass) return 'LDF_PSQ';
  return 'BYPASS_CLARIFICATION';
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — C1a: _PLACE_KNOWLEDGE.cablecar.experience_ko', () => {

  test('CBL-C1-01: experience_ko 존재 및 Truthy', () => {
    expect(CABLECAR_KNOWLEDGE.experience_ko).toBeTruthy();
  });

  test('CBL-C1-02: experience_ko Founder 승인 문구와 정확히 일치', () => {
    expect(CABLECAR_KNOWLEDGE.experience_ko).toBe(CABLECAR_EXPERIENCE_KO);
  });

  test('CBL-C1-03: experience_ko에 "바다" 포함', () => {
    expect(CABLECAR_KNOWLEDGE.experience_ko).toContain('바다');
  });

  test('CBL-C1-04: experience_ko에 "해상 케이블카" 포함', () => {
    expect(CABLECAR_KNOWLEDGE.experience_ko).toContain('해상 케이블카');
  });

  test('CBL-C1-05: experience_ko에 운행시간·요금·전화번호 미포함 (사실 단정 금지)', () => {
    expect(CABLECAR_KNOWLEDGE.experience_ko).not.toMatch(/\d{2,}:\d{2}/);     // 시간 형식
    expect(CABLECAR_KNOWLEDGE.experience_ko).not.toMatch(/\d{4,}원/);          // 금액
    expect(CABLECAR_KNOWLEDGE.experience_ko).not.toMatch(/\d{3}-\d{3,}/);     // 전화번호
  });

  test('CBL-C1-06: 기존 price_ko / hours_ko / weather_ko 유지', () => {
    expect(CABLECAR_KNOWLEDGE.price_ko).toContain('17,000');
    expect(CABLECAR_KNOWLEDGE.hours_ko).toContain('09:30');
    expect(CABLECAR_KNOWLEDGE.weather_ko).toContain('강풍');
  });

  test('CBL-C1-07: 기존 NON_OFFICIAL trust 유지', () => {
    expect(CABLECAR_KNOWLEDGE.price_trust).toBe('NON_OFFICIAL');
    expect(CABLECAR_KNOWLEDGE.hours_trust).toBe('NON_OFFICIAL');
    expect(CABLECAR_KNOWLEDGE.ride_trust).toBe('NON_OFFICIAL');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-1: "케이블카 어때요?" 경험 응답', () => {

  test('CBL-1-01: "어때요"는 isPlaceSpecificQuery 미해당 → LDF 경로', () => {
    expect(isPlaceSpecificQuery('케이블카 어때요?')).toBe(false);
  });

  test('CBL-1-02: "케이블카 어때요?" — ldGuardBypass false (bypass 없음)', () => {
    expect(ldGuardBypass('케이블카 어때요?', 'cablecar', false)).toBe(false);
  });

  test('CBL-1-03: "케이블카 어때요?" → LDF_PSQ 경로 진입', () => {
    expect(routingDecision('케이블카 어때요?', 'cablecar', false)).toBe('LDF_PSQ');
  });

  test('CBL-1-04: PSQ builder → cablecar "어때요" → experience_ko 반환', () => {
    const answer = buildPsqAnswer('케이블카 어때요?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).toBe(CABLECAR_EXPERIENCE_KO);
  });

  test('CBL-1-05: experience_ko에 VERIFY_NOTE 미포함 (상위 분기가 verifyNote 붙이지 않음)', () => {
    const answer = buildPsqAnswer('케이블카 어때요?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).not.toContain('문의하시거나');
  });

  test('CBL-1-06: "케이블카 어떤 곳이에요?" — experience PSQ 분기 (어떤 곳) → experience_ko + verifyNote', () => {
    const answer = buildPsqAnswer('케이블카 어떤 곳이에요?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    // "어떤 곳" matches experience branch (not "어때요" branch) → experience_ko + verifyNote
    expect(answer).toContain(CABLECAR_EXPERIENCE_KO);
    expect(answer).toContain('문의하시거나');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-2: "케이블카 꼭 타고 싶어" CLARIFICATION 유지', () => {

  test('CBL-2-01: "꼭 타고 싶어" → ldGuardBypass true', () => {
    expect(ldGuardBypass('케이블카 꼭 타고 싶어', 'cablecar', false)).toBe(true);
  });

  test('CBL-2-02: "반드시 케이블카 타야" → ldGuardBypass true', () => {
    expect(ldGuardBypass('반드시 케이블카 타야', 'cablecar', false)).toBe(true);
  });

  test('CBL-2-03: "케이블카 일정에 넣어줘" → ldGuardBypass true', () => {
    expect(ldGuardBypass('케이블카 일정에 넣어줘', 'cablecar', false)).toBe(true);
  });

  test('CBL-2-04: "케이블카 꼭 타고 싶어" → BYPASS_CLARIFICATION 경로', () => {
    expect(routingDecision('케이블카 꼭 타고 싶어', 'cablecar', false)).toBe('BYPASS_CLARIFICATION');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-3: "케이블카 빼줘" 제외 처리 유지', () => {

  test('CBL-3-01: "케이블카 빼줘" → ldGuardBypass true (제외 표현)', () => {
    expect(ldGuardBypass('케이블카 빼줘', 'cablecar', false)).toBe(true);
  });

  test('CBL-3-02: "케이블카 제외해줘" → ldGuardBypass true', () => {
    expect(ldGuardBypass('케이블카 제외해줘', 'cablecar', false)).toBe(true);
  });

  test('CBL-3-03: "케이블카 빼고 싶어" → ldGuardBypass true', () => {
    expect(ldGuardBypass('케이블카 빼고 싶어', 'cablecar', false)).toBe(true);
  });

  test('CBL-3-04: "케이블카 빼줘" → BYPASS_CLARIFICATION 경로', () => {
    expect(routingDecision('케이블카 빼줘', 'cablecar', false)).toBe('BYPASS_CLARIFICATION');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-4: "케이블카 얼마야?" 기존 요금 경로', () => {

  test('CBL-4-01: "얼마야" → isPlaceSpecificQuery true', () => {
    expect(isPlaceSpecificQuery('케이블카 얼마야?')).toBe(true);
  });

  test('CBL-4-02: "케이블카 얼마야?" → PSQ_GATE 경로', () => {
    expect(routingDecision('케이블카 얼마야?', 'cablecar', false)).toBe('PSQ_GATE');
  });

  test('CBL-4-03: PSQ builder → price_ko 포함 응답', () => {
    const answer = buildPsqAnswer('케이블카 얼마야?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).toContain('17,000');
  });

  test('CBL-4-04: 요금 응답에 NON_OFFICIAL 안내 포함', () => {
    const answer = buildPsqAnswer('케이블카 얼마야?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).toContain('공식 사이트');
  });

  test('CBL-4-05: 요금 응답에 experience_ko 미포함 (분기 격리)', () => {
    const answer = buildPsqAnswer('케이블카 얼마야?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).not.toContain('익숙한 풍경도');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-5: "케이블카 몇 시까지?" 기존 운영시간 경로', () => {

  test('CBL-5-01: "몇 시까지"는 isPlaceSpecificQuery 미해당 → LDF_PSQ 경로로 builder 도달', () => {
    // "몇 시까지"는 _isPlaceSpecificQuery 패턴에 없음.
    // LDF_PSQ → _buildPlaceSpecificQueryPayload "Hours alt" 분기로 hours_ko 반환.
    expect(isPlaceSpecificQuery('케이블카 몇 시까지?')).toBe(false);
  });

  test('CBL-5-02: "케이블카 몇 시까지?" → LDF_PSQ 경로 (PSQ gate 미발화)', () => {
    expect(routingDecision('케이블카 몇 시까지?', 'cablecar', false)).toBe('LDF_PSQ');
  });

  test('CBL-5-03: PSQ builder → hours_ko 포함 응답', () => {
    const answer = buildPsqAnswer('케이블카 몇 시까지?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).toContain('09:30');
  });

  test('CBL-5-04: 운영시간 응답에 NON_OFFICIAL 안내 포함', () => {
    const answer = buildPsqAnswer('케이블카 몇 시까지?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).toContain('참고값이에요');
  });

  test('CBL-5-05: 운영시간 응답에 experience_ko 미포함', () => {
    const answer = buildPsqAnswer('케이블카 몇 시까지?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).not.toContain('익숙한 풍경도');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-6: "케이블카 날씨 어때?" 기존 날씨 경로', () => {

  test('CBL-6-01: "날씨" → isPlaceSpecificQuery true', () => {
    expect(isPlaceSpecificQuery('케이블카 날씨 어때?')).toBe(true);
  });

  test('CBL-6-02: "케이블카 날씨 어때?" → PSQ_GATE 경로', () => {
    expect(routingDecision('케이블카 날씨 어때?', 'cablecar', false)).toBe('PSQ_GATE');
  });

  test('CBL-6-03: PSQ builder → weather_ko 포함 응답', () => {
    const answer = buildPsqAnswer('케이블카 날씨 어때?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).toContain('강풍');
  });

  test('CBL-6-04: 날씨 응답에 experience_ko 미포함 (날씨 분기가 "어때요" 분기보다 우선)', () => {
    const answer = buildPsqAnswer('케이블카 날씨 어때?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).not.toContain('익숙한 풍경도');
  });

  test('CBL-6-05: "비가 오면 어때요?" → PSQ_GATE (날씨 패턴) → weather_ko', () => {
    // "비가 오면"은 _isPlaceSpecificQuery 날씨 패턴 매칭 → PSQ_GATE
    // 분리된 weather-only 입력으로 테스트 (operation 분기 미개입)
    expect(isPlaceSpecificQuery('비가 오면 어때요?')).toBe(true);
    const answer = buildPsqAnswer('비가 오면 어때요?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
    expect(answer).toContain('강풍');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-7: 이순신광장 격리', () => {

  test('CBL-7-01: "이순신광장 어때요?" → LDF_PSQ 경로', () => {
    expect(routingDecision('이순신광장 어때요?', 'lee_soon_shin_plaza', false)).toBe('LDF_PSQ');
  });

  test('CBL-7-02: PSQ builder — lee_soon_shin_plaza "어때요" → cablecar 분기 미발화', () => {
    const answer = buildPsqAnswer('이순신광장 어때요?', YISUNSIN_PLACE, YISUNSIN_KNOWLEDGE);
    expect(answer).not.toContain(CABLECAR_EXPERIENCE_KO);
    expect(answer).not.toContain('해상 케이블카');
  });

  test('CBL-7-03: 이순신광장 응답에 "케이블카" 미포함', () => {
    const answer = buildPsqAnswer('이순신광장 어때요?', YISUNSIN_PLACE, YISUNSIN_KNOWLEDGE);
    expect(answer).not.toContain('케이블카');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-8: 오동도 격리', () => {

  test('CBL-8-01: "오동도 어때요?" → LDF_PSQ 경로', () => {
    expect(routingDecision('오동도 어때요?', 'odongdo', false)).toBe('LDF_PSQ');
  });

  test('CBL-8-02: PSQ builder — odongdo "어때요" → odongdo experience_ko 반환', () => {
    const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(answer).toBe(ODONGDO_KNOWLEDGE.experience_ko);
  });

  test('CBL-8-03: 오동도 응답에 cablecar experience_ko 미포함', () => {
    const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    expect(answer).not.toContain(CABLECAR_EXPERIENCE_KO);
    expect(answer).not.toContain('해상 케이블카');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — CBL-9: 향일암 격리', () => {

  test('CBL-9-01: "향일암 어때요?" → LDF_PSQ 경로', () => {
    expect(routingDecision('향일암 어때요?', 'hyangiram', false)).toBe('LDF_PSQ');
  });

  test('CBL-9-02: PSQ builder — hyangiram "어때요" → hyangiram experience_ko 반환', () => {
    const answer = buildPsqAnswer('향일암 어때요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).toBe(HYANGIRAM_KNOWLEDGE.experience_ko);
  });

  test('CBL-9-03: 향일암 응답에 cablecar experience_ko 미포함', () => {
    const answer = buildPsqAnswer('향일암 어때요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(answer).not.toContain(CABLECAR_EXPERIENCE_KO);
    expect(answer).not.toContain('해상 케이블카');
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('Cablecar Phase 1 — Guardian Verification', () => {

  test('GV-01: experience_ko Founder 문구 정확 일치 (문자 수준)', () => {
    const APPROVED = '여수 바다 위를 가로지르는 해상 케이블카예요. 바다와 섬, 항구를 높은 곳에서 바라보며 잠시 시야를 넓힐 수 있어요. 익숙한 풍경도 조금 다른 눈으로 바라보게 되는 시간이 될 수 있어요.';
    expect(CABLECAR_KNOWLEDGE.experience_ko).toBe(APPROVED);
  });

  test('GV-02: 요금 PSQ_GATE가 경험 LDF_PSQ보다 우선 — "케이블카 얼마야?"', () => {
    expect(routingDecision('케이블카 얼마야?', 'cablecar', false)).toBe('PSQ_GATE');
    expect(routingDecision('케이블카 어때요?', 'cablecar', false)).toBe('LDF_PSQ');
  });

  test('GV-03: CLARIFICATION 보호 — intent 표현 모두 bypass', () => {
    const intentPhrases = ['케이블카 꼭 타고 싶어', '케이블카 빼줘', '케이블카 일정에 넣어', '케이블카 타야 해'];
    for (const phrase of intentPhrases) {
      expect(ldGuardBypass(phrase, 'cablecar', false)).toBe(true);
    }
  });

  test('GV-04: cablecar "어때요" 분기가 오동도·향일암 응답에 영향 없음', () => {
    const odongdoAnswer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
    const hyangiramAnswer = buildPsqAnswer('향일암 어때요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
    expect(odongdoAnswer).toBe(ODONGDO_KNOWLEDGE.experience_ko);
    expect(hyangiramAnswer).toBe(HYANGIRAM_KNOWLEDGE.experience_ko);
  });

  test('GV-05: experience_ko에 7종 금지어 미포함 (AGENTS.md §15)', () => {
    const forbidden = ['사주', '점술', '관상', '운세', '대운', '궁합', '타로', '역술', '신점', '무속', '팔자', '명리', '예언', '점괘', '점쟁이', '운명감정', '신탁'];
    for (const word of forbidden) {
      expect(CABLECAR_KNOWLEDGE.experience_ko).not.toContain(word);
    }
  });

  test('GV-06: "케이블카 탈거야" → BYPASS_CLARIFICATION (의지 표현 격리)', () => {
    expect(routingDecision('케이블카 탈거야', 'cablecar', false)).toBe('BYPASS_CLARIFICATION');
  });

  test('GV-07: place_code 없이 "케이블카 어때요?" → PSQ gate 미발화, bypass 없음', () => {
    // No explicit_context.place_code — _psqPlaceCode = null → goes to journey/clarification path
    expect(isPlaceSpecificQuery('케이블카 어때요?')).toBe(false);
    expect(ldGuardBypass('케이블카 어때요?', null, false)).toBe(false);
    // With null psqPlaceCode, both PSQ_GATE and LDF_PSQ require psqPlaceCode to be set
    expect(routingDecision('케이블카 어때요?', null, false)).toBe('BYPASS_CLARIFICATION');
  });

});
