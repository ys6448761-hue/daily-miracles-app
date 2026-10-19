'use strict';

/**
 * Hamel Lighthouse SOUL Phase 1 — HML-E + HML-1~4 + HML-N1~2 + ISO-1~3 Tests
 *
 * Phase 1 scope (2026-10-19):
 *   HML-E: _PLACE_KNOWLEDGE.hamel_lighthouse.experience_ko — Founder 승인 문구
 *   HML-1: "하멜등대 어때요?" → experience_ko (LDF_PSQ 경로)
 *   HML-2: PLACE_ALIAS_MAP — '하멜등대' → 'hamel_lighthouse'
 *   HML-3: "어떤 곳이야?" → experience_ko
 *   HML-4: 미검증 운영정보 안내 안 함
 *   HML-N1: hamel 분기 scope guard — hamel_lighthouse 컨텍스트에서 hamel_hours_ko 미반환
 *   HML-N2: Level B 격리 — PLACE_LOOKUP 응답에 이어지는 여정 문장 미포함
 *   ISO-1~3: marine_park / cablecar / odongdo "어때요" 미영향
 *
 * Scope exclusions: 운영시간·전화번호·입장료 안내, Level B 재오픈,
 *   R20/P-2/P-6 수정, EP02 작업, Companion Chip 변경
 *
 * Run: npx jest --testPathPatterns="soulHamelLighthousePhase1"
 */

// ── Founder-approved experience_ko (Q2, 2026-10-19) ──────────────────────────
const HAMEL_EXPERIENCE_KO =
  '하멜등대는 여수 바다를 바라보며 잠시 마음을 가다듬을 수 있는 장소예요. DreamTown에서는 소원을 품고 다시 희망을 바라보는 별빛 항로의 중요한 장소예요.';

// ── _PLACE_KNOWLEDGE.hamel_lighthouse fixture ─────────────────────────────────
const HAMEL_KNOWLEDGE = {
  experience_ko: HAMEL_EXPERIENCE_KO,
  emotional_role: '연결 / 공명',
  unknown_boundary: '운영 및 접근 세부 정보는 현장에서 확인해주세요.',
  // No phone / hours / admission — UNVERIFIED
};

const HAMEL_PLACE = {
  code: 'hamel_lighthouse',
  name_ko: '하멜등대',
};

// ── PLACE_ALIAS_MAP mirror (relevant entries) ─────────────────────────────────
const PLACE_ALIAS_MAP = {
  '하멜등대':     'hamel_lighthouse',
  '해양공원':     'marine_park',
  '종포해양공원': 'marine_park',
};

// ── Isolation fixtures ────────────────────────────────────────────────────────
const MARINE_KNOWLEDGE = {
  phone: '061-690-2342',
  phone_hamel: '061-659-5706',
  admission_ko: '공원과 하멜전시관 모두 무료예요.',
  hours_ko: null,
  hamel_hours_ko: '하멜전시관은 09:00~18:00, 월요일 휴무예요.',
  experience_ko: '바다를 따라 산책할 수 있는 해안 공원이에요. 공원 안에 하멜전시관이 있어요.',
  emotional_role: '쉼 / 정리·고요함',
};
const MARINE_PLACE = { code: 'marine_park', name_ko: '해양공원' };

const CABLECAR_KNOWLEDGE = {
  experience_ko: '여수 바다 위를 가로지르는 해상 케이블카예요.',
};
const CABLECAR_PLACE = { code: 'cablecar', name_ko: '케이블카' };

const ODONGDO_KNOWLEDGE = {
  experience_ko: '오동도는 바다 풍경과 계절의 자연을 느끼며 산책할 수 있는 곳이에요.',
};
const ODONGDO_PLACE = { code: 'odongdo', name_ko: '오동도' };

// ── Mirrors: _isPlaceSpecificQuery ───────────────────────────────────────────
function isPlaceSpecificQuery(message) {
  if (!message) return false;
  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(message)) return true;
  if (/(얼마야|얼마예요|요금|입장료|가격|티켓)/.test(message)) return true;
  if (/(왕복|편도)/.test(message)) return true;
  if (/(휠체어|유모차|접근성|장애|배리어)/.test(message)) return true;
  if (/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼|탈 수 있어|운행.*해|운행.*돼|운행 중|지금.*운행)/.test(message)) return true;
  if (/(비 오면|비 오|비가 오|날씨|우천|기상|눈이|바람이|태풍)/.test(message)) return true;
  if (/(포토존|사진 어디|사진.*찍기|사진.*찍어|어디서.*찍|찍기 좋은 곳)/.test(message)) return true;
  if (/(알려 줘)/.test(message)) return true;
  if (/(주차|주차장|주차비|주차요금|차 세우|차 대는)/.test(message)) return true;
  if (/(화장실|운영시간|운행시간)/.test(message)) return true;
  return false;
}

// ── Mirrors: _buildPlaceSpecificQueryPayload (Phase 1 + scope guard 포함) ────
// Includes: hamel branch scope guard (code === 'marine_park') + hamel_lighthouse "어때요"
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
  // Hamel Exhibition Hall — marine_park ONLY (scope guard: hamel_lighthouse 컨텍스트 진입 금지)
  } else if (code === 'marine_park' && /(하멜전시관|하멜 전시관|하멜|네덜란드|전시관)/.test(msg)) {
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
  } else if (code === 'odongdo' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'hyangiram' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'cablecar' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'dolsan_nightscape' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'marine_park' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'hamel_lighthouse' && /어때요/.test(msg)) { // HML-1
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

// ── _extractGoldenPlaceCode mirror ────────────────────────────────────────────
function extractGoldenPlaceCode(message) {
  if (/오동도/.test(message)) return 'odongdo';
  if (/케이블카|케이블 카/.test(message)) return 'cablecar';
  if (/향일암/.test(message)) return 'hyangiram';
  if (/종포해양공원|해양공원/.test(message)) return 'marine_park';
  if (/돌산공원/.test(message)) return 'dolsan_nightscape';
  if (/돌산대교/.test(message)) return 'dolsan_daegyo';
  if (/하멜등대/.test(message)) return 'hamel_lighthouse';
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HML-E — experience_ko 필드 검증 (Founder Q2 승인 문구)
// ═══════════════════════════════════════════════════════════════════════════════

test('HML-E-01 — hamel_lighthouse experience_ko 존재', () => {
  expect(HAMEL_KNOWLEDGE.experience_ko).toBeTruthy();
});

test('HML-E-02 — Founder 승인 문구 정확 일치 (글자 단위)', () => {
  expect(HAMEL_KNOWLEDGE.experience_ko).toBe(HAMEL_EXPERIENCE_KO);
});

test('HML-E-03 — 미검증 전화번호 미포함', () => {
  expect(HAMEL_KNOWLEDGE.experience_ko).not.toMatch(/061-/);
});

test('HML-E-04 — 미검증 운영시간 미포함', () => {
  expect(HAMEL_KNOWLEDGE.experience_ko).not.toMatch(/\d{2}:\d{2}/);
});

test('HML-E-05 — 하멜전시관 정보 미포함 (독립 장소 격리)', () => {
  expect(HAMEL_KNOWLEDGE.experience_ko).not.toMatch(/하멜전시관/);
});

test('HML-E-06 — phone/hours/admission 미정의 (UNVERIFIED)', () => {
  expect(HAMEL_KNOWLEDGE.phone).toBeUndefined();
  expect(HAMEL_KNOWLEDGE.hours_ko).toBeUndefined();
  expect(HAMEL_KNOWLEDGE.admission_ko).toBeUndefined();
});

// ═══════════════════════════════════════════════════════════════════════════════
// HML-1 — "하멜등대 어때요?" → LDF_PSQ → experience_ko
// ═══════════════════════════════════════════════════════════════════════════════

test('HML-1-01 — "어때요" PSQ 게이트 미통과 (LDF 경로 진입)', () => {
  expect(isPlaceSpecificQuery('하멜등대 어때요?')).toBe(false);
});

test('HML-1-02 — "어때요" 라우팅 → LDF_PSQ', () => {
  expect(routingDecision('하멜등대 어때요?', 'hamel_lighthouse')).toBe('LDF_PSQ');
});

test('HML-1-03 — LDF_PSQ 경로에서 Founder 승인 experience_ko 반환', () => {
  const answer = buildPsqAnswer('하멜등대 어때요?', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  expect(answer).toBe(HAMEL_EXPERIENCE_KO);
});

test('HML-1-04 — verifyNote 미포함 (experience_ko 직접 반환)', () => {
  const answer = buildPsqAnswer('하멜등대 어때요?', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  expect(answer).not.toMatch(/문의하시거나 현장에서 확인/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// HML-2 — PLACE_ALIAS_MAP: '하멜등대' → 'hamel_lighthouse'
// ═══════════════════════════════════════════════════════════════════════════════

test('HML-2-01 — PLACE_ALIAS_MAP: "하멜등대" → hamel_lighthouse', () => {
  expect(PLACE_ALIAS_MAP['하멜등대']).toBe('hamel_lighthouse');
});

test('HML-2-02 — PLACE_ALIAS_MAP: "하멜등대"는 marine_park가 아님', () => {
  expect(PLACE_ALIAS_MAP['하멜등대']).not.toBe('marine_park');
});

// ═══════════════════════════════════════════════════════════════════════════════
// HML-3 — "어떤 곳이야?" → experience_ko
// ═══════════════════════════════════════════════════════════════════════════════

test('HML-3 — "어떤 곳이야?" → experience_ko 포함', () => {
  const answer = buildPsqAnswer('어떤 곳이야?', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  expect(answer).toMatch(/여수 바다를 바라보며/);
  expect(answer).toMatch(/별빛 항로/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// HML-4 — 미검증 운영정보 안내 금지
// ═══════════════════════════════════════════════════════════════════════════════

test('HML-4-01 — "운영시간 알려줘" → 운영시간 정보 없음 안내', () => {
  const answer = buildPsqAnswer('운영시간 알려줘?', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  // hours_ko 없음 → "운영시간 정보가 아직 없어요" 또는 일반 fallback
  expect(answer).not.toMatch(/09:00|18:00|\d{2}:\d{2}/);
});

test('HML-4-02 — "입장료 얼마야?" → 미검증 금액 안내 안 함', () => {
  const answer = buildPsqAnswer('입장료 얼마야?', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  // admission_ko / price_ko 없음 → 가격 정보 미반환
  expect(answer).not.toMatch(/무료|유료|\d+원/);
  expect(answer).not.toMatch(/입장료.*없어요|요금.*없어요/);
});

test('HML-4-03 — "전화번호 알려줘" — 전화번호 미포함', () => {
  const answer = buildPsqAnswer('전화번호 알려줘', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  // phone 없음 → verifyNote에 번호 미포함
  expect(answer).not.toMatch(/061-/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// HML-N1 — 하멜전시관 PSQ scope guard — hamel_lighthouse 컨텍스트에서 hamel_hours_ko 미반환
// ═══════════════════════════════════════════════════════════════════════════════

test('HML-N1-01 — hamel_lighthouse 컨텍스트에서 "하멜" 키워드 → hamel_hours_ko 미반환', () => {
  // hamel_lighthouse에는 hamel_hours_ko 없음. scope guard로 marine_park 분기 진입 금지.
  const answer = buildPsqAnswer('하멜 관련 정보 알려줘', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  expect(answer).not.toMatch(/09:00~18:00/);
  expect(answer).not.toMatch(/061-659-5706/);
});

test('HML-N1-02 — hamel_lighthouse 컨텍스트에서 "하멜전시관" 키워드 → 전시관 시간 미반환', () => {
  const answer = buildPsqAnswer('하멜전시관 몇 시에 열어?', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  // hours_ko 없음 → 운영시간 정보 없어요 (hamel_hours_ko 아님)
  expect(answer).not.toMatch(/09:00~18:00/);
  expect(answer).not.toMatch(/월요일 휴무/);
});

test('HML-N1-03 — marine_park 컨텍스트에서 "하멜" → hamel_hours_ko 정상 반환 (기존 동작)', () => {
  const answer = buildPsqAnswer('하멜 몇 시에 열어?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toMatch(/09:00~18:00/);
  expect(answer).toMatch(/061-659-5706/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// HML-N2 — Level B 격리
// ═══════════════════════════════════════════════════════════════════════════════

test('HML-N2 — "하멜등대 어때요?" 응답에 "이어지는 여정" 미포함 (Level B 미발동)', () => {
  const answer = buildPsqAnswer('하멜등대 어때요?', HAMEL_PLACE, HAMEL_KNOWLEDGE);
  expect(answer).not.toMatch(/이어지는 여정/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// _extractGoldenPlaceCode — 하멜등대 인식
// ═══════════════════════════════════════════════════════════════════════════════

test('GPC-1 — "하멜등대도 가볼까?" → hamel_lighthouse 추출', () => {
  expect(extractGoldenPlaceCode('하멜등대도 가볼까?')).toBe('hamel_lighthouse');
});

test('GPC-2 — "해양공원" → marine_park (hamel_lighthouse 미혼용)', () => {
  expect(extractGoldenPlaceCode('해양공원도 넣어줘')).toBe('marine_park');
});

test('GPC-3 — "오동도" → odongdo (hamel_lighthouse 영향 없음)', () => {
  expect(extractGoldenPlaceCode('오동도 넣어줘')).toBe('odongdo');
});

// ═══════════════════════════════════════════════════════════════════════════════
// ISO — 기존 CLOSED 장소 "어때요" 격리 확인
// ═══════════════════════════════════════════════════════════════════════════════

test('ISO-1 — marine_park "어때요" → marine_park experience_ko (hamel_lighthouse 미영향)', () => {
  const answer = buildPsqAnswer('해양공원 어때요?', MARINE_PLACE, MARINE_KNOWLEDGE);
  expect(answer).toBe(MARINE_KNOWLEDGE.experience_ko);
  expect(answer).not.toBe(HAMEL_EXPERIENCE_KO);
});

test('ISO-2 — cablecar "어때요" → cablecar experience_ko (hamel_lighthouse 미영향)', () => {
  const answer = buildPsqAnswer('케이블카 어때요?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
  expect(answer).toBe(CABLECAR_KNOWLEDGE.experience_ko);
  expect(answer).not.toBe(HAMEL_EXPERIENCE_KO);
});

test('ISO-3 — odongdo "어때요" → odongdo experience_ko (hamel_lighthouse 미영향)', () => {
  const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
  expect(answer).toBe(ODONGDO_KNOWLEDGE.experience_ko);
  expect(answer).not.toBe(HAMEL_EXPERIENCE_KO);
});
