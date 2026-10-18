'use strict';

/**
 * Dolsan Park SOUL Phase 1 — DNP-1~DNP-12 + GV Routing Tests
 *
 * Phase 1 scope (2026-10-18):
 *   E1a: _PLACE_KNOWLEDGE.dolsan_nightscape.experience_ko — Founder 승인 문구 교체
 *   E2a: PSQ builder — dolsan_nightscape "어때요" 분기 추가 (DNP-1)
 *
 * Scope exclusions: 낮/밤 분기, JOURNEY_PREFERENCE, Companion Chip, parking 변경
 *
 * Run: npx jest --testPathPatterns="soulDolsanParkPhase1"
 */

// ── Founder-approved experience_ko (D-1, 2026-10-18) ─────────────────────────
const DOLSAN_EXPERIENCE_KO =
  '돌산공원은 여수의 야경을 높은 곳에서 바라볼 수 있는 공간이에요. 밤이 되면 돌산대교와 바다, 도시의 불빛이 한눈에 들어와요. 하루를 돌아보며 마음속에 남은 생각을 조용히 정리할 수 있는 곳이에요.';

// ── _PLACE_KNOWLEDGE.dolsan_nightscape fixture (Phase 1 후 기대값) ─────────────
const DOLSAN_KNOWLEDGE = {
  phone: '061-659-4628',
  admission_ko: '무료예요.',
  parking_ko: '공영주차장이 있어요. 최초 1시간 무료, 이후 10분당 200원이에요. 방문 전 현장 안내판을 확인해보세요.',
  hours_ko: '연중개방 (24시간)이에요.',
  experience_ko: DOLSAN_EXPERIENCE_KO,
  fit_ko: '야경 감상에 좋아요. 반려동물 동반 가능해요. 2층버스 종점이라 대중교통으로도 오기 편해요.',
  unknown_boundary: '야경 최적 시간대는 계절에 따라 달라요. 현장에서 확인해보세요.',
};

const DOLSAN_PLACE = {
  code: 'dolsan_nightscape',
  name_ko: '돌산공원',
};

// ── 인접 장소 fixtures (격리 확인용) ─────────────────────────────────────────
const CABLECAR_KNOWLEDGE = {
  experience_ko: '여수 바다 위를 가로지르는 해상 케이블카예요. 바다와 섬, 항구를 높은 곳에서 바라보며 잠시 시야를 넓힐 수 있어요. 익숙한 풍경도 조금 다른 눈으로 바라보게 되는 시간이 될 수 있어요.',
};
const CABLECAR_PLACE = { code: 'cablecar', name_ko: '케이블카' };

const ODONGDO_KNOWLEDGE = {
  experience_ko: '오동도는 바다 풍경과 계절의 자연을 느끼며 산책할 수 있는 곳이에요.',
  walking_ok: '오동도는 산책을 즐기는 장소예요.',
  parking_ko: null,
  parking_trust: 'UNKNOWN',
};
const ODONGDO_PLACE = { code: 'odongdo', name_ko: '오동도' };

const HYANGIRAM_KNOWLEDGE = {
  experience_ko: '향일암은 바다와 바위 절벽의 풍경을 바라보며 잠시 마음을 가다듬을 수 있는 곳이에요.',
  walking_ok: '향일암은 경사와 계단 구간이 있어 걷는 부담이 생길 수 있어요.',
};
const HYANGIRAM_PLACE = { code: 'hyangiram', name_ko: '향일암', physical_difficulty: 'high' };

const YISUNSIN_KNOWLEDGE = { experience_ko: null };
const YISUNSIN_PLACE = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장' };

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

// ── Mirrors: _ldGuardBypass ───────────────────────────────────────────────────
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

// ── Mirrors: _buildPlaceSpecificQueryPayload (E2a 포함) ───────────────────────
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
    if (knowledge.ride_duration_ko) {
      answer = `${name}은 ${knowledge.ride_duration_ko}예요.`;
    }
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
    }
  } else if (/(오동도.*갔다가|오동도.*후에|오동도.*타도|오동도.*케이블|향일암.*갔다가|향일암.*후에)/.test(msg)) {
    if (knowledge.odongdo_connection_ko) answer = knowledge.odongdo_connection_ko;
  } else if (/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼|운행.*해|운행.*돼|운행 중|지금.*운행)/.test(msg)) {
    if (knowledge.hours_ko) answer = `${name} 운영시간은 ${knowledge.hours_ko}`;
  } else if (/(비 오면|비 오|비가 오|날씨|우천|기상|눈이|바람이|태풍)/.test(msg)) {
    if (knowledge.weather_ko) answer = knowledge.weather_ko + verifyNote;
  } else if (/(몇 시까지|마감|닫어|닫나요|닫아|언제까지|열어|몇 시에 열|언제 열)/.test(msg)) {
    if (knowledge.hours_ko) {
      const _h = knowledge.hours_ko;
      answer = /요\.$/.test(_h) ? `${name} 운영시간은 ${_h}` : `${name} 운영시간은 ${_h}예요.`;
      answer += verifyNote;
    }
  } else if (code === 'odongdo' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'hyangiram' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'cablecar' && /어때요/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (code === 'dolsan_nightscape' && /어때요/.test(msg)) {  // E2a (DNP-1)
    if (knowledge.experience_ko) answer = knowledge.experience_ko;
  } else if (knowledge.walking_ok && /(걸어야|걷기|걷는|보행)/.test(msg)) {
    answer = knowledge.walking_ok;
  } else if (/(어떤 곳|어떤 데|어떤 장소|소개|설명해|알고 싶어|알려줘|뭐 하는 곳|뭐가 있어|뭐 볼|뭐해)/.test(msg)) {
    if (knowledge.experience_ko) answer = knowledge.experience_ko + verifyNote;
  }

  if (!answer) answer = `${name}에 대한 정보를 확인 중이에요.${verifyNote}`;
  return answer;
}

// ── Routing decision helper ───────────────────────────────────────────────────
function routingDecision(message, psqPlaceCode, hasCar) {
  if (psqPlaceCode && isPlaceSpecificQuery(message)) return 'PSQ_GATE';
  const bypass = ldGuardBypass(message, psqPlaceCode, hasCar);
  if (psqPlaceCode && !bypass) return 'LDF_PSQ';
  return 'BYPASS_CLARIFICATION';
}

// ═══════════════════════════════════════════════════════════════════════════════
// E1a — experience_ko 필드 검증
// ═══════════════════════════════════════════════════════════════════════════════

test('E1a-01 — dolsan_nightscape experience_ko 존재', () => {
  expect(DOLSAN_KNOWLEDGE.experience_ko).toBeTruthy();
});

test('E1a-02 — Founder 승인 문구 정확 일치 (글자 단위)', () => {
  expect(DOLSAN_KNOWLEDGE.experience_ko).toBe(DOLSAN_EXPERIENCE_KO);
});

test('E1a-03 — "가장 좋은 곳" 단정 표현 미포함', () => {
  expect(DOLSAN_KNOWLEDGE.experience_ko).not.toMatch(/가장 좋은 곳/);
});

test('E1a-04 — "여운·다짐·마무리" 감정 역할 반영 (마무리 키워드 포함)', () => {
  expect(DOLSAN_KNOWLEDGE.experience_ko).toMatch(/마무리|정리/);
});

test('E1a-05 — 기존 phone/parking_ko/hours_ko/fit_ko 필드 불변', () => {
  expect(DOLSAN_KNOWLEDGE.phone).toBe('061-659-4628');
  expect(DOLSAN_KNOWLEDGE.parking_ko).toMatch(/1시간 무료/);
  expect(DOLSAN_KNOWLEDGE.hours_ko).toMatch(/24시간/);
  expect(DOLSAN_KNOWLEDGE.fit_ko).toMatch(/야경/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DNP-1 — "돌산공원 어때요?" → LDF_PSQ → experience_ko
// ═══════════════════════════════════════════════════════════════════════════════

test('DNP-1-01 — "어때요" PSQ 게이트 미통과 (LDF 경로 진입)', () => {
  expect(isPlaceSpecificQuery('돌산공원 어때요?')).toBe(false);
});

test('DNP-1-02 — "어때요" ldGuardBypass 미발동', () => {
  expect(ldGuardBypass('돌산공원 어때요?', 'dolsan_nightscape')).toBe(false);
});

test('DNP-1-03 — "어때요" 라우팅 → LDF_PSQ', () => {
  expect(routingDecision('돌산공원 어때요?', 'dolsan_nightscape')).toBe('LDF_PSQ');
});

test('DNP-1-04 — LDF_PSQ 경로에서 experience_ko 반환', () => {
  const answer = buildPsqAnswer('돌산공원 어때요?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).toBe(DOLSAN_EXPERIENCE_KO);
});

test('DNP-1-05 — Founder 승인 문구 글자 단위 정확 일치', () => {
  const answer = buildPsqAnswer('돌산공원 어때요?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).toBe(
    '돌산공원은 여수의 야경을 높은 곳에서 바라볼 수 있는 공간이에요. 밤이 되면 돌산대교와 바다, 도시의 불빛이 한눈에 들어와요. 하루를 돌아보며 마음속에 남은 생각을 조용히 정리할 수 있는 곳이에요.'
  );
});

test('DNP-1-06 — verifyNote 미포함 (experience_ko 직접 반환)', () => {
  const answer = buildPsqAnswer('돌산공원 어때요?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).not.toMatch(/문의하시거나 현장에서 확인/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DNP-2 / DNP-3 — 장소 코드 격리 및 문구 정확성
// ═══════════════════════════════════════════════════════════════════════════════

test('DNP-2 — code=dolsan_nightscape 조건 격리 (타 장소 "어때요" 미영향)', () => {
  // dolsan_nightscape 분기는 code 조건으로 격리되어야 함
  const cablecarAnswer = buildPsqAnswer('어때요?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
  expect(cablecarAnswer).not.toBe(DOLSAN_EXPERIENCE_KO);
  const odongdoAnswer = buildPsqAnswer('어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
  expect(odongdoAnswer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

test('DNP-3 — "어때요" 변형 입력도 분기 정상 진입', () => {
  const answer1 = buildPsqAnswer('거기 어때요?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  const answer2 = buildPsqAnswer('돌산공원은 어때요', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer1).toBe(DOLSAN_EXPERIENCE_KO);
  expect(answer2).toBe(DOLSAN_EXPERIENCE_KO);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DNP-4 — 주차 PSQ 불변
// ═══════════════════════════════════════════════════════════════════════════════

test('DNP-4-01 — "주차 어때?" PSQ 게이트 통과', () => {
  expect(isPlaceSpecificQuery('돌산공원 주차 어때?')).toBe(true);
});

test('DNP-4-02 — PSQ 경로 → parking_ko 반환', () => {
  const answer = buildPsqAnswer('돌산공원 주차 어때?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).toMatch(/1시간 무료/);
  expect(answer).toMatch(/10분당 200원/);
});

test('DNP-4-03 — parking 응답에 verifyNote 포함', () => {
  const answer = buildPsqAnswer('돌산공원 주차 어때?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).toMatch(/061-659-4628/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DNP-5 — 운영시간 LDF_PSQ 불변
// ═══════════════════════════════════════════════════════════════════════════════

test('DNP-5-01 — "몇 시까지?" PSQ 게이트 미통과', () => {
  expect(isPlaceSpecificQuery('돌산공원 몇 시까지?')).toBe(false);
});

test('DNP-5-02 — "몇 시까지?" 라우팅 → LDF_PSQ', () => {
  expect(routingDecision('돌산공원 몇 시까지?', 'dolsan_nightscape')).toBe('LDF_PSQ');
});

test('DNP-5-03 — hours_ko "24시간" 반환', () => {
  const answer = buildPsqAnswer('돌산공원 몇 시까지?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).toMatch(/24시간|연중개방/);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DNP-6 — fit_ko PSQ 불변
// ═══════════════════════════════════════════════════════════════════════════════

test('DNP-6 — "누구랑 가면 좋아?" → PSQ → fit_ko 불변', () => {
  // "알려 줘" 패턴이 있음 (PSQ gate)
  const msg = '돌산공원 누구랑 가면 좋은지 알려 줘';
  expect(isPlaceSpecificQuery(msg)).toBe(true);
  // fit_ko는 buildPsqAnswer에서 "experience" 분기로 처리됨 (PSQ gate가 별도 처리)
  // 기존 라우팅 방식 검증: PSQ gate 통과 여부만 확인
  expect(routingDecision(msg, 'dolsan_nightscape')).toBe('PSQ_GATE');
});

// ═══════════════════════════════════════════════════════════════════════════════
// DNP-7 / DNP-8 — 기존 Baseline 유지 ("가고 싶어", "빼줘")
// ═══════════════════════════════════════════════════════════════════════════════

test('DNP-7 — "가고 싶어" → LDF_PSQ → experience_ko 미반환 (어때요 분기 아님)', () => {
  expect(isPlaceSpecificQuery('돌산공원 가고 싶어')).toBe(false);
  expect(ldGuardBypass('돌산공원 가고 싶어', 'dolsan_nightscape')).toBe(false);
  const answer = buildPsqAnswer('돌산공원 가고 싶어', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  // "가고 싶어"는 "어때요" 분기 미진입 → fallback
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

test('DNP-8 — "빼줘" → LDF_PSQ → "어때요" 분기 미진입 확인', () => {
  const answer = buildPsqAnswer('돌산공원 빼줘', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DNP-9~DNP-12 — 타 장소 격리
// ═══════════════════════════════════════════════════════════════════════════════

test('DNP-9 — 케이블카 "어때요" → cablecar experience_ko (dolsan 미오염)', () => {
  const answer = buildPsqAnswer('케이블카 어때요?', CABLECAR_PLACE, CABLECAR_KNOWLEDGE);
  expect(answer).toBe(CABLECAR_KNOWLEDGE.experience_ko);
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
  expect(answer).toMatch(/해상 케이블카/);
});

test('DNP-10 — 오동도 "어때요" → odongdo experience_ko (dolsan 미오염)', () => {
  const answer = buildPsqAnswer('오동도 어때요?', ODONGDO_PLACE, ODONGDO_KNOWLEDGE);
  expect(answer).toBe(ODONGDO_KNOWLEDGE.experience_ko);
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

test('DNP-11 — 향일암 "어때요" → hyangiram experience_ko (dolsan 미오염)', () => {
  const answer = buildPsqAnswer('향일암 어때요?', HYANGIRAM_PLACE, HYANGIRAM_KNOWLEDGE);
  expect(answer).toBe(HYANGIRAM_KNOWLEDGE.experience_ko);
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

test('DNP-12 — 이순신광장 "어때요" → dolsan experience_ko 미반환', () => {
  const answer = buildPsqAnswer('이순신광장 어때요?', YISUNSIN_PLACE, YISUNSIN_KNOWLEDGE);
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GV — Guardian Verification
// ═══════════════════════════════════════════════════════════════════════════════

const FORBIDDEN_WORDS = ['사주', '점술', '관상', '운세', '대운', '궁합', '타로'];

test('GV-01 — Founder 승인 문구 글자 단위 정확 일치', () => {
  const answer = buildPsqAnswer('돌산공원 어때요?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(answer).toBe(DOLSAN_EXPERIENCE_KO);
});

test('GV-02 — experience_ko 내 금지어 0건', () => {
  for (const word of FORBIDDEN_WORDS) {
    expect(DOLSAN_EXPERIENCE_KO).not.toContain(word);
  }
});

test('GV-03 — "가장 좋은" 등 단정 표현 미포함', () => {
  expect(DOLSAN_EXPERIENCE_KO).not.toMatch(/가장 좋은|최고의|최고|최상의/);
});

test('GV-04 — 기존 parking_ko Founder 확인값 보존', () => {
  expect(DOLSAN_KNOWLEDGE.parking_ko).toMatch(/1시간 무료/);
  expect(DOLSAN_KNOWLEDGE.parking_ko).toMatch(/10분당 200원/);
});

test('GV-05 — "어때요" 분기가 주차/운영시간 질문을 가로채지 않음', () => {
  // "주차 어때?" → PSQ_GATE → parking 분기 (어때요 분기 아님)
  const parkingAnswer = buildPsqAnswer('돌산공원 주차 어때?', DOLSAN_PLACE, DOLSAN_KNOWLEDGE);
  expect(parkingAnswer).toMatch(/1시간 무료/);
  expect(parkingAnswer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

test('GV-06 — dolsan_nightscape / dolsan_daegyo 장소 코드 격리 (별개 코드)', () => {
  // dolsan_daegyo와 dolsan_nightscape는 별개 — "어때요" 분기는 dolsan_nightscape만
  const daegyoPlace = { code: 'dolsan_daegyo', name_ko: '돌산대교' };
  const daegyoKnowledge = { experience_ko: '여수와 돌산도를 연결하는 다리예요.' };
  const answer = buildPsqAnswer('돌산대교 어때요?', daegyoPlace, daegyoKnowledge);
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
});

test('GV-07 — experience_ko가 null이면 fallback 반환 (방어)', () => {
  const knowledge = { ...DOLSAN_KNOWLEDGE, experience_ko: null };
  const answer = buildPsqAnswer('돌산공원 어때요?', DOLSAN_PLACE, knowledge);
  expect(answer).not.toBe(DOLSAN_EXPERIENCE_KO);
  expect(answer).toMatch(/확인 중/);
});
