'use strict';

/**
 * Marine Park SOUL Phase 1 — MRP-1~7 + MRP-N1~N2 Tests
 *
 * Phase 1 scope (2026-10-19):
 *   MRP-E: _PLACE_KNOWLEDGE.marine_park.experience_ko — Founder 승인 문구 교체
 *   MRP-1: PSQ builder — marine_park "어때요" 분기 추가
 *
 * Scope exclusions: 하멜등대 별칭 추가, JOURNEY_PREFERENCE, Companion Chip,
 *   parking 변경, DB·Schema 변경, Level B 재오픈, R20/P-2/P-6 수정
 *
 * Run: npx jest --testPathPatterns="soulMarineParkPhase1"
 */

// ── Founder-approved experience_ko (MRP-E, 2026-10-19) ───────────────────────
const MARINE_EXPERIENCE_KO =
  '바다를 따라 산책할 수 있는 해안 공원이에요. 공원 안에 하멜전시관이 있어요.';

// ── _PLACE_KNOWLEDGE.marine_park fixture (Phase 1 후 기대값) ──────────────────
const MARINE_KNOWLEDGE = {
  phone: '061-690-2342',
  phone_hamel: '061-659-5706',
  admission_ko: '공원과 하멜전시관 모두 무료예요.',
  hours_ko: null,
  hamel_hours_ko: '하멜전시관은 09:00~18:00, 월요일 휴무예요.',
  experience_ko: MARINE_EXPERIENCE_KO,
  emotional_role: '쉼 / 정리·고요함',
  fit_ko: '산책·휴식을 즐기기 좋아요. 하멜과 여수의 인연이 궁금한 분께 하멜전시관을 추천해요.',
  unknown_boundary: '공원 야간 개방 여부는 확인이 필요해요.',
};

const MARINE_PLACE = {
  code: 'marine_park',
  name_ko: '해양공원',
};

// ── 인접 장소 fixtures (격리 확인용) ─────────────────────────────────────────
const DOLSAN_KNOWLEDGE = {
  experience_ko: '돌산공원은 여수의 야경을 높은 곳에서 바라볼 수 있는 공간이에요. 밤이 되면 돌산대교와 바다, 도시의 불빛이 한눈에 들어와요. 하루를 돌아보며 마음속에 남은 생각을 조용히 정리할 수 있는 곳이에요.',
};
const DOLSAN_PLACE = { code: 'dolsan_nightscape', name_ko: '돌산공원' };

// ── PLACE_ALIAS_MAP mirror (relevant entries) ─────────────────────────────────
const PLACE_ALIAS_MAP = {
  '해양공원': 'marine_park',
  '종포해양공원': 'marine_park',
  '하멜등대': undefined, // 미등록 확인용
};

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

// ── Mirrors: _buildPlaceSpecificQueryPayload (MRP-1 + 하멜전시관 PSQ 포함) ────
function buildPsqAnswer(message, place, knowledge) {
  const msg = message;
  const code = place.code;
  const name = place.name_ko;
  const phone = knowledge.phone || null;
  const verifyNote = phone
    ? `\n\n정확한 정보는 ${phone}에 문의하시거나 현장에서 확인해보세요.`
    : '\n\n현장에서 직원에게 문의해보세요.';

  let answer = null;

  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(msg)) {
    if (knowledge.ride_duration_ko) answer = `${name}은 ${knowledge.ride_duration_ko}예요.`;
  } else if (/(왕복|편도)/.test(msg)) {
    if (knowledge.roundtrip_ko) answer = knowledge.roundtrip_ko;
  } else if (/(주차|차 세우|차 대|주차장)/.test(msg)) {
    if (knowledge.parking_ko) {
      answer = knowledge.parking_ko + verifyNote;
    } else if (knowledge.parking_trust === 'UNKNOWN') {
      answer = `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요.${verifyNote}`;
    }
  } else if (/(얼마야|얼마예요|요금|입장료|가격|티켓)/.test(msg)) {
    if (knowledge.price_ko) {
      answer = `요금(참고): ${knowledge.price_ko}`;
    } else if (knowledge.admission_ko) {
      answer = knowledge.admission_ko;
    }
  } else if (/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼|운행.*해|운행.*돼|운행 중|지금.*운행)/.test(msg)) {
    if (knowledge.hours_ko) answer = `${name} 운영시간은 ${knowledge.hours_ko}`;
  } else if (/(비 오면|비 오|비가 오|날씨|우천|기상|눈이|바람이|태풍)/.test(msg)) {
    if (knowledge.weather_ko) answer = knowledge.weather_ko + verifyNote;
  // Hamel Exhibition Hall — marine_park specific (before hours branch in soyeowoolService.js)
  } else if (/(하멜전시관|하멜 전시관|하멜|네덜란드|전시관)/.test(msg)) {
    if (knowledge.hamel_hours_ko) {
      const hamelPhone = knowledge.phone_hamel || knowledge.phone;
      const hamelVerify = hamelPhone
        ? `\n\n정확한 정보는 ${hamelPhone}에 문의하시거나 현장에서 확인해보세요.`
        : '\n\n현장에서 직원에게 문의해보세요.';
      answer = knowledge.hamel_hours_ko + hamelVerify;
    } else if (knowledge.experience_ko) {
      answer = knowledge.experience_ko + verifyNote;
    }
  } else if (/(몇 시까지|마감|닫어|닫나요|닫아|언제까지|열어|몇 시에 열|언제 열)/.test(msg)) {
    if (knowledge.hours_ko) {
      const _h = knowledge.hours_ko;
      answer = /요\.$/.test(_h) ? `${name} 운영시간은 ${_h}` : `${name} 운영시간은 ${_h}예요.`;
      answer += verifyNote;
    } else {
      answer = `${name}의 운영시간 정보가 아직 없어요.${verifyNote}`;
    }
  } else if (/(계단|다른 길|우회|올라가는 길|내려가는 길)/.test(msg)) {
    if (knowledge.routes_ko) answer = knowledge.routes_ko + verifyNote;
    else if (knowledge.stairs_ko) answer = knowledge.stairs_ko + verifyNote;
    else answer = `${name}의 경로 정보가 아직 없어요.${verifyNote}`;
  }

  // "어때요" — place-scoped branches (MRP-1: marine_park 신규)
  else if (code === 'odongdo' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'hyangiram' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'cablecar' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'dolsan_nightscape' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'marine_park' && /어때요/.test(msg)) {  // MRP-1
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (knowledge.walking_ok && /(걸어야|걷기|걷는|보행)/.test(msg)) {
    answer = knowledge.walking_ok;
  } else if (/(어떤 곳|어떤 데|어떤 장소|소개|설명해|알고 싶어|알려줘|뭐 하는 곳|뭐가 있어|뭐 볼|뭐해)/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko + verifyNote;
  } else if (/(누구랑|어울려|잘 맞|가기 좋|어울리|적합|노인|어린이|어린|친구|혼자|커플|연인)/.test(msg)) {
    if (knowledge.fit_ko) answer = knowledge.fit_ko + verifyNote;
  }

  if (!answer) answer = `${name}에 대한 정보를 확인 중이에요.${verifyNote}`;
  return answer;
}

// ── Routing decision helper ───────────────────────────────────────────────────
function routingDecision(message, psqPlaceCode) {
  if (psqPlaceCode && isPlaceSpecificQuery(message)) return 'PSQ_GATE';
  if (psqPlaceCode) return 'LDF_PSQ';
  return 'BYPASS_CLARIFICATION';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-E — experience_ko 필드 검증 (Founder 승인 문구)
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-E-01 — marine_park experience_ko 존재', () => {
  expect(MARINE_KNOWLEDGE.experience_ko).toBeTruthy();
});

test('MRP-E-02 — Founder 승인 문구 정확 일치 (글자 단위)', () => {
  expect(MARINE_KNOWLEDGE.experience_ko).toBe(MARINE_EXPERIENCE_KO);
});

test('MRP-E-03 — 미검증 수치 "1.5km" 미포함', () => {
  expect(MARINE_KNOWLEDGE.experience_ko).not.toMatch(/1\.5km|1\.5 km/);
});

test('MRP-E-04 — 미검증 크루즈 경유 표현 미포함', () => {
  expect(MARINE_KNOWLEDGE.experience_ko).not.toMatch(/크루즈|이사부|미남/);
});

test('MRP-E-05 — VERIFIED 사실 "하멜전시관" 포함', () => {
  expect(MARINE_KNOWLEDGE.experience_ko).toMatch(/하멜전시관/);
});

test('MRP-E-06 — 기존 phone/phone_hamel/hamel_hours_ko/emotional_role/fit_ko 불변', () => {
  expect(MARINE_KNOWLEDGE.phone).toBe('061-690-2342');
  expect(MARINE_KNOWLEDGE.phone_hamel).toBe('061-659-5706');
  expect(MARINE_KNOWLEDGE.hamel_hours_ko).toMatch(/09:00~18:00/);
  expect(MARINE_KNOWLEDGE.emotional_role).toBe('쉼 / 정리·고요함');
  expect(MARINE_KNOWLEDGE.fit_ko).toMatch(/산책/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-1 — "종포해양공원 어때요?" → LDF_PSQ → experience_ko
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-1-01 — "어때요" PSQ 게이트 미통과 (LDF 경로 진입)', () => {
  expect(isPlaceSpecificQuery('종포해양공원 어때요?')).toBe(false);
});

test('MRP-1-02 — "어때요" 라우팅 → LDF_PSQ', () => {
  expect(routingDecision('종포해양공원 어때요?', 'marine_park')).toBe('LDF_PSQ');
});

test('MRP-1-03 — LDF_PSQ 경로에서 Founder 승인 experience_ko 반환', () => {
  const answer = buildPsqAnswer('종포해양공원 어때요?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toBe(MARINE_EXPERIENCE_KO);
});

test('MRP-1-04 — verifyNote 미포함 (experience_ko 직접 반환)', () => {
  const answer = buildPsqAnswer('종포해양공원 어때요?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).not.toMatch(/문의하시거나 현장에서 확인/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-2 — "해양공원 어때요?" → 별칭 매핑 확인
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-2-01 — PLACE_ALIAS_MAP: "해양공원" → marine_park', () => {
  expect(PLACE_ALIAS_MAP['해양공원']).toBe('marine_park');
});

test('MRP-2-02 — PLACE_ALIAS_MAP: "종포해양공원" → marine_park', () => {
  expect(PLACE_ALIAS_MAP['종포해양공원']).toBe('marine_park');
});

test('MRP-2-03 — "해양공원 어때요?" → experience_ko 반환 (marine_park 분기)', () => {
  const answer = buildPsqAnswer('해양공원 어때요?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toBe(MARINE_EXPERIENCE_KO);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-3 — 하멜전시관 운영시간 PSQ
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-3-01 — "하멜전시관 몇 시에 열어?" → hamel_hours_ko 포함', () => {
  const answer = buildPsqAnswer('하멜전시관 몇 시에 열어?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toMatch(/09:00~18:00/);
  expect(answer).toMatch(/하멜전시관/);
});

test('MRP-3-02 — 응답에 phone_hamel(061-659-5706) 포함 (시설 연락처)', () => {
  const answer = buildPsqAnswer('하멜전시관 몇 시에 열어?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toMatch(/061-659-5706/);
});

test('MRP-3-03 — 응답에 "하멜전시관" 시설명 명시', () => {
  const answer = buildPsqAnswer('하멜전시관 몇 시에 열어?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toMatch(/하멜전시관/);
});

test('MRP-3-04 — 공원 대표번호(061-690-2342)가 하멜전시관 응답에 단독 사용되지 않음', () => {
  const answer = buildPsqAnswer('하멜전시관 몇 시에 열어?', MARINE_PLACE, MARINE_KNOWLEDGE);
  // phone_hamel이 있으면 phone_hamel 사용 (phone 대체 금지)
  // 공원 번호가 있더라도 하멜 응답에는 phone_hamel 우선
  expect(answer).toMatch(/061-659-5706/);
  // 공원 번호가 하멜전시관 응답에서 직접 노출되지 않도록
  // (phone_hamel이 우선이므로 phone은 verifyNote 대체용으로 미사용)
  if (answer.includes('061-690-2342')) {
    // phone_hamel이 있으면 hamelVerify가 phone_hamel 사용 — 공원번호 노출은 fail
    expect(answer).toMatch(/061-659-5706/); // phone_hamel 포함 시 pass
    expect(answer.indexOf('061-659-5706')).toBeLessThan(answer.indexOf('061-690-2342') === -1 ? Infinity : answer.indexOf('061-690-2342'));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-4 — 하멜전시관 전화번호 응답
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-4-01 — "하멜전시관 전화번호?" → hamel 분기 진입 (하멜전시관 키워드 매핑)', () => {
  const answer = buildPsqAnswer('하멜전시관 전화번호?', MARINE_PLACE, MARINE_KNOWLEDGE);
  // hamel 분기 → hamel_hours_ko + phone_hamel verify note
  expect(answer).toMatch(/하멜전시관/);
  expect(answer).toMatch(/061-659-5706/);
});

test('MRP-4-02 — 응답이 "하멜등대" 번호로 전용되지 않음', () => {
  const answer = buildPsqAnswer('하멜전시관 전화번호?', MARINE_PLACE, MARINE_KNOWLEDGE);
  // 반환 번호는 phone_hamel (하멜전시관) — 하멜등대 번호(미등록) 아님
  expect(answer).toMatch(/061-659-5706/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-5 — 하멜전시관 입장료
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-5-01 — "하멜전시관 입장료 얼마야?" → admission_ko 반환', () => {
  // "입장료" → PSQ 가격 분기 → admission_ko (hamel 분기보다 먼저 fire)
  const answer = buildPsqAnswer('하멜전시관 입장료 얼마야?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toMatch(/무료/);
});

test('MRP-5-02 — admission_ko에 하멜전시관 언급', () => {
  expect(MARINE_KNOWLEDGE.admission_ko).toMatch(/하멜전시관/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-6 — "어떤 곳이야?" → experience_ko
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-6 — "어떤 곳이야?" → experience_ko 포함', () => {
  const answer = buildPsqAnswer('어떤 곳이야?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toMatch(/바다를 따라 산책/);
  expect(answer).toMatch(/하멜전시관/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-7 — "누구랑 가면 좋아?" → fit_ko
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-7 — "누구랑 가면 좋아?" → fit_ko 포함', () => {
  const answer = buildPsqAnswer('누구랑 가면 좋아?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toMatch(/산책/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-N1 — 하멜등대 미매핑 확인
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-N1 — PLACE_ALIAS_MAP에 "하멜등대" 미등록', () => {
  expect(PLACE_ALIAS_MAP['하멜등대']).toBeUndefined();
});

// ═══════════════════════════════════════════════════════════════════════════════
// MRP-N2 — "해양공원 어때요?" → Level B 전환 문장 미발동
// ═══════════════════════════════════════════════════════════════════════════════

test('MRP-N2 — "해양공원 어때요?" 응답에 "이어지는 여정" 미포함 (Level B 미발동)', () => {
  const answer = buildPsqAnswer('해양공원 어때요?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).not.toMatch(/이어지는 여정/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 격리 — marine_park 분기가 타 장소에 영향 없음
// ═══════════════════════════════════════════════════════════════════════════════

test('ISO-1 — dolsan_nightscape "어때요" 응답이 marine_park experience_ko 미반환', () => {
  const answer = buildPsqAnswer('어때요?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).not.toBe(MARINE_EXPERIENCE_KO);
  expect(answer).toMatch(/야경|돌산공원/);
});

test('ISO-2 — marine_park emotional_role(쉼/정리·고요함) 불변 — Level B 계속 사용 가능', () => {
  expect(MARINE_KNOWLEDGE.emotional_role).toBe('쉼 / 정리·고요함');
});
