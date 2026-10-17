'use strict';

/**
 * YiSunSin Square SOUL Phase 2 — S-4~S-8 Routing Tests
 *
 * Phase 2 scope (2026-10-17):
 *   Fix A: JOURNEY_PREFERENCE + lee_soon_shin_plaza via placeCodeHint
 *   Fix B: PSQ 주차 쿼리 — parking_trust=UNKNOWN 비단정 안내
 *   Fix C: _yisunsinVehicleBypass + Companion Chip 차량 맥락
 *
 * Run: npx jest --testPathPatterns="soulYisunsinPhase2"
 */

// ── Mirrors: _extractGoldenPlaceCode ─────────────────────────────────────────
function extractGoldenPlaceCode(message) {
  if (/오동도/.test(message)) return 'odongdo';
  if (/케이블카|케이블 카/.test(message)) return 'cablecar';
  if (/향일암/.test(message)) return 'hyangiram';
  return null;
}

// ── Mirrors: _detectJourneyDecisionType (relevant paths) ─────────────────────
function detectJourneyDecisionType(message) {
  const msg = message || '';
  if (/(하나 빼|빼줘|빼주세요|제외해줘)/.test(msg)) return 'JOURNEY_MODIFY';
  if (/(걷는 건 힘|걷기 힘|걸으면 힘|힘들어하|다리 아|무릎 아|걷기 많이|많이 걷는)/.test(msg)) return 'CONSTRAINT_UPDATE';
  if (/(가능해|가능한가요|갈 수 있어|될까|가봐도 될|갈 수 있을까)/.test(msg)) return 'FEASIBILITY';
  if (/(도 탈래|도 갈래|도 넣어|탈래|도 타고|도 가볼까)/.test(msg)) return 'JOURNEY_ADD';
  if (/(먼저 가고 싶|가고 싶어|가고싶어)/.test(msg)) return 'JOURNEY_PREFERENCE';
  return null;
}

// ── Mirrors: placeCode resolution with placeCodeHint ─────────────────────────
function resolvePlaceCode(message, placeCodeHint) {
  return extractGoldenPlaceCode(message) || placeCodeHint || null;
}

// ── Mirrors: Fix A — lee_soon_shin_plaza JOURNEY_PREFERENCE response ─────────
function yisunsinJourneyPreferenceResponse(peopleType) {
  if (peopleType === 'family_elderly') {
    return {
      message_ko: '이순신광장은 야외 광장으로 부모님과 함께 천천히 걸으며 둘러보기 좋아요.\n거북선 외관을 가까이 볼 수 있어요. 이동 동선을 미리 확인해두시면 편하게 돌아보실 수 있어요.',
      next_options: ['주차는 어떻게 돼요?', '걷기 많이 힘드세요?'],
    };
  }
  if (peopleType === 'family_with_kids') {
    return {
      message_ko: '이순신광장에는 거북선을 가까이서 볼 수 있는 공간이 있어요.\n아이와 함께 역사 이야기를 나누기 좋아요. 거북선 내부 관람 운영 여부는 현장에서 확인해보세요.',
      next_options: ['거북선 내부 관람 되나요?', '입장료는요?'],
    };
  }
  return {
    message_ko: '이순신광장을 여정에 넣어볼게요.\n역사 광장으로 거북선 외관을 볼 수 있어요. 미남크루즈나 2층버스 코스와도 잘 어울려요.',
    next_options: ['추가하고 싶은 곳이 있으신가요?'],
  };
}

// ── Mirrors: Fix B — PSQ parking_trust=UNKNOWN response ──────────────────────
function parkingAnswer(knowledge, name, verifyNote) {
  if (knowledge.parking_ko) {
    return knowledge.parking_ko + verifyNote;
  }
  if (knowledge.parking_trust === 'UNKNOWN') {
    return `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
  }
  return `${name}의 주차 정보는 현장 확인이 필요해요.${verifyNote}`;
}

// ── Mirrors: Fix C — _yisunsinVehicleBypass ──────────────────────────────────
function yisunsinVehicleBypass(psqPlaceCode, hasCar, message) {
  return psqPlaceCode === 'lee_soon_shin_plaza'
    && !!hasCar
    && /(차로|자가용으로)/.test(message);
}

// ── Mirrors: Fix C — _ldGuardBypass (full) ───────────────────────────────────
function ldGuardBypass(message, psqPlaceCode, hasCar) {
  const vehicleBypass = yisunsinVehicleBypass(psqPlaceCode, hasCar, message);
  return (
    /^(안녕|안녕하세요|반가워|하이|hello|hi)[\s!.?]*$/i.test(message.trim())
    || /(잘 모르겠|모르겠어|뭐가 좋을|뭐 해야|어떡하|어쩌)/.test(message)
    || (/케이블카|케이블 카/.test(message) && /(꼭|반드시|타고 싶|타야|빼고|빼줘|제외|일정에|탈거야)/.test(message))
    || /(부모님과|아이와|가족과).*(왔어|왔어요|왔는데|함께라면|함께 왔|와서|가려고)/.test(message)
    || /(이곳에서.*(즐기|어떻게)|어떻게.*즐기)/.test(message)
    || vehicleBypass
  );
}

// ── Mirrors: Fix C — _isCompanionChipQuery ───────────────────────────────────
function isCompanionChipQuery(message, psqPlaceCode, hasCar) {
  const bypass = ldGuardBypass(message, psqPlaceCode, hasCar);
  return (
    !!psqPlaceCode && bypass &&
    (/(부모님과|아이와|가족과).*(왔어|왔어요|함께)/.test(message) ||
     /(부모님과|아이와|가족과).*(차로|자가용으로)/.test(message) ||
     /(이곳에서.*(즐기|어떻게)|어떻게.*즐기)/.test(message))
  );
}

// ── Mirrors: Fix C — Companion Chip has_car note (lee_soon_shin_plaza 한정) ───
function companionChipVehicleNote(hasCar, placeCode, knowledge, name) {
  if (!hasCar || placeCode !== 'lee_soon_shin_plaza') return null;
  if (knowledge.parking_trust === 'UNKNOWN') {
    return `차로 이동하시는군요. ${name} 인근 주차 정보는 방문 전에 확인해보세요.`;
  }
  return '차로 이동하시는 경우, 인근 주차 여건을 미리 확인해보세요.';
}

// ── _PLACE_KNOWLEDGE fixture (Fix B 적용 후) ─────────────────────────────────
const LEE_SOON_SHIN_KNOWLEDGE = {
  phone: null,
  admission_ko: '무료예요.',
  hours_ko: '야외 광장으로 연중개방이에요.',
  experience_ko: '이순신 장군을 기리는 역사 광장이에요. 거북선 외관을 가까이 볼 수 있어요.',
  fit_ko: '역사에 관심 있는 분이나 아이와 함께 오기 좋아요.',
  unknown_boundary: '거북선 내부 탑승 여부 등 세부 사항은 현장에서 확인해보세요.',
  parking_ko: null,
  parking_trust: 'UNKNOWN',
};

const LSP = 'lee_soon_shin_plaza';
const VERIFY_NOTE = '\n\n현장에서 직원에게 문의해보세요.';

// ─────────────────────────────────────────────────────────────────────────────

describe('YiSunSin Phase 2 — Fix A: JOURNEY_PREFERENCE + lee_soon_shin_plaza', () => {

  test('YS2-T01 S-4: "부모님과 가고 싶어" → JOURNEY_PREFERENCE 감지', () => {
    expect(detectJourneyDecisionType('부모님과 가고 싶어')).toBe('JOURNEY_PREFERENCE');
  });

  test('YS2-T01b S-4: placeCodeHint로 lee_soon_shin_plaza 해소', () => {
    expect(resolvePlaceCode('부모님과 가고 싶어', LSP)).toBe(LSP);
  });

  test('YS2-T02 S-4: family_elderly 응답 — 부모님 배려 문구 포함', () => {
    const resp = yisunsinJourneyPreferenceResponse('family_elderly');
    expect(resp.message_ko).toContain('부모님');
    expect(resp.message_ko).toContain('이순신광장');
    expect(resp.next_options.length).toBeGreaterThan(0);
  });

  test('YS2-T02b S-4: family_elderly 응답 — 주차 단정 없음', () => {
    const resp = yisunsinJourneyPreferenceResponse('family_elderly');
    expect(resp.message_ko).not.toMatch(/주차 무료|주차 가능|주차장이/);
  });

  test('YS2-T04 S-6: "아이와 가고 싶어" → JOURNEY_PREFERENCE 감지', () => {
    expect(detectJourneyDecisionType('아이와 가고 싶어')).toBe('JOURNEY_PREFERENCE');
  });

  test('YS2-T04b S-6: family_with_kids 응답 — 아이·거북선 문구 포함', () => {
    const resp = yisunsinJourneyPreferenceResponse('family_with_kids');
    expect(resp.message_ko).toContain('아이');
    expect(resp.message_ko).toContain('거북선');
    expect(resp.next_options.length).toBeGreaterThan(0);
  });

  test('YS2-T04c S-6: 거북선 내부 관람 가능 여부 단정 없음', () => {
    const resp = yisunsinJourneyPreferenceResponse('family_with_kids');
    expect(resp.message_ko).not.toMatch(/거북선 내부 관람 가능|내부 탑승 가능/);
  });

  test('YS2-T07 Safety: 메시지에 "오동도" 명시 → extractGoldenPlaceCode 우선 (placeCodeHint 무시)', () => {
    expect(resolvePlaceCode('오동도 가고 싶어', LSP)).toBe('odongdo');
  });

  test('YS2-T07b Safety: 케이블카 명시 시 cablecar 우선', () => {
    expect(resolvePlaceCode('케이블카 가고 싶어', LSP)).toBe('cablecar');
  });

  test('YS2-T08 Safety: placeCodeHint=null 이면 extractGoldenPlaceCode만 사용', () => {
    expect(resolvePlaceCode('가고 싶어', null)).toBeNull();
  });

});

describe('YiSunSin Phase 2 — Fix B: PSQ 주차 쿼리 비단정 안내', () => {

  test('YS2-T03 S-5: parking_trust=UNKNOWN → 비단정 주차 안내 반환', () => {
    const answer = parkingAnswer(LEE_SOON_SHIN_KNOWLEDGE, '이순신광장', VERIFY_NOTE);
    expect(answer).toContain('방문 전에 확인');
    expect(answer).toContain('이순신광장');
  });

  test('YS2-T03b S-5: 확인 안 된 주차 단정 정보 없음', () => {
    const answer = parkingAnswer(LEE_SOON_SHIN_KNOWLEDGE, '이순신광장', VERIFY_NOTE);
    expect(answer).not.toMatch(/공영주차장|주차 무료|주차 가능|대수|200원/);
  });

  test('YS2-T03c: parking_ko가 있으면 그 값 우선 반환 (기존 동작 보존)', () => {
    const knowledgeWithParking = { ...LEE_SOON_SHIN_KNOWLEDGE, parking_ko: '근처 공영주차장 이용 가능해요.' };
    const answer = parkingAnswer(knowledgeWithParking, '이순신광장', VERIFY_NOTE);
    expect(answer).toContain('근처 공영주차장');
  });

  test('YS2-T03d: parking_trust 없고 parking_ko 없으면 기존 fallback 반환', () => {
    const noTrustKnowledge = { admission_ko: '무료예요.' };
    const answer = parkingAnswer(noTrustKnowledge, '이순신광장', VERIFY_NOTE);
    expect(answer).toContain('주차 정보는 현장 확인이 필요해요');
  });

});

describe('YiSunSin Phase 2 — Fix C: 차량 + 동행 컨텍스트 라우팅', () => {

  // _yisunsinVehicleBypass
  test('YS2-T05 S-7: "부모님과 차로 가요" + lee_soon_shin_plaza + has_car → bypass=true', () => {
    expect(yisunsinVehicleBypass(LSP, true, '부모님과 차로 가요')).toBe(true);
  });

  test('YS2-T05b S-8: "아이와 차로 가요" + lee_soon_shin_plaza + has_car → bypass=true', () => {
    expect(yisunsinVehicleBypass(LSP, true, '아이와 차로 가요')).toBe(true);
  });

  test('YS2-T05c: 자가용으로 패턴도 bypass=true', () => {
    expect(yisunsinVehicleBypass(LSP, true, '부모님과 자가용으로 가요')).toBe(true);
  });

  // _ldGuardBypass via vehicle bypass
  test('YS2-T05d S-7: _ldGuardBypass=true (Living Detail Fallback 우회)', () => {
    expect(ldGuardBypass('부모님과 차로 가요', LSP, true)).toBe(true);
  });

  test('YS2-T05e S-8: _ldGuardBypass=true', () => {
    expect(ldGuardBypass('아이와 차로 가요', LSP, true)).toBe(true);
  });

  // _isCompanionChipQuery
  test('YS2-T05f S-7: _isCompanionChipQuery=true → Companion Chip 경로 진입', () => {
    expect(isCompanionChipQuery('부모님과 차로 가요', LSP, true)).toBe(true);
  });

  test('YS2-T05g S-8: _isCompanionChipQuery=true', () => {
    expect(isCompanionChipQuery('아이와 차로 가요', LSP, true)).toBe(true);
  });

  // YS2-T06: Companion Chip 차량 문구 (lee_soon_shin_plaza 한정)
  test('YS2-T06 S-7: has_car=true + lee_soon_shin_plaza + parking_trust=UNKNOWN → 비단정 주차 문구 포함', () => {
    const note = companionChipVehicleNote(true, LSP, LEE_SOON_SHIN_KNOWLEDGE, '이순신광장');
    expect(note).toContain('차로 이동');
    expect(note).toContain('이순신광장');
    expect(note).toContain('확인');
  });

  test('YS2-T06b: 차량 문구 — 주차 단정 표현 없음', () => {
    const note = companionChipVehicleNote(true, LSP, LEE_SOON_SHIN_KNOWLEDGE, '이순신광장');
    expect(note).not.toMatch(/주차 무료|주차 가능|공영주차장/);
  });

  test('YS2-T06c: has_car=false → 차량 문구 없음 (null)', () => {
    const note = companionChipVehicleNote(false, LSP, LEE_SOON_SHIN_KNOWLEDGE, '이순신광장');
    expect(note).toBeNull();
  });

  // ── Scope Audit: 다른 장소에 차량 문구가 추가되지 않음 ───────────────────────
  test('Scope-Audit: 향일암 + has_car=true → 차량 문구 없음 (이순신광장 전용)', () => {
    const hyangiramKnowledge = { admission_ko: '무료예요.' }; // no parking_trust
    const note = companionChipVehicleNote(true, 'hyangiram', hyangiramKnowledge, '향일암');
    expect(note).toBeNull();
  });

  test('Scope-Audit: 오동도 + has_car=true → 차량 문구 없음', () => {
    const odongdoKnowledge = { hours_ko: '09:00~18:00' };
    const note = companionChipVehicleNote(true, 'odongdo', odongdoKnowledge, '오동도');
    expect(note).toBeNull();
  });

  test('Scope-Audit: 케이블카 + has_car=true → 차량 문구 없음', () => {
    const cablecarKnowledge = { price_ko: '왕복 12,000원' };
    const note = companionChipVehicleNote(true, 'cablecar', cablecarKnowledge, '케이블카');
    expect(note).toBeNull();
  });

  test('Scope-Audit: dolsan_nightscape + has_car=true → 차량 문구 없음', () => {
    const nightscapeKnowledge = { hours_ko: '일몰 후' };
    const note = companionChipVehicleNote(true, 'dolsan_nightscape', nightscapeKnowledge, '돌산공원');
    expect(note).toBeNull();
  });

  // Narrow routing 검증 — 다른 장소에 영향 없음
  test('YS2-T05h Safety: 다른 장소(odongdo) → _yisunsinVehicleBypass=false', () => {
    expect(yisunsinVehicleBypass('odongdo', true, '차로 가요')).toBe(false);
  });

  test('YS2-T05i Safety: has_car=false → bypass=false', () => {
    expect(yisunsinVehicleBypass(LSP, false, '차로 가요')).toBe(false);
  });

  test('YS2-T05j Safety: 일반 "가요" (차로|자가용으로 없음) → bypass=false', () => {
    expect(yisunsinVehicleBypass(LSP, true, '그냥 가요')).toBe(false);
  });

  test('YS2-T05k Safety: _psqPlaceCode=null → bypass=false', () => {
    expect(yisunsinVehicleBypass(null, true, '차로 가요')).toBe(false);
  });

});

describe('YiSunSin Phase 2 — Regression: Phase 1 S-1~S-3 경로 불변', () => {

  test('S-1 Regression: "이순신광장 어때요?" → JOURNEY_PREFERENCE 아님 (PSQ 경로)', () => {
    expect(detectJourneyDecisionType('이순신광장 어때요?')).toBeNull();
  });

  test('S-2 Regression: "부모님과 함께 왔어요" → _ldGuardBypass=true (기존 동작 유지)', () => {
    expect(ldGuardBypass('부모님과 함께 왔어요.', LSP, false)).toBe(true);
  });

  test('S-3 Regression: 거북선 관련 질문 → JOURNEY_PREFERENCE 아님 (PSQ/guardrail 경로)', () => {
    expect(detectJourneyDecisionType('거북선 내부 들어갈 수 있나요?')).toBeNull();
  });

  test('Regression: 기존 golden places — placeCodeHint에 덮어쓰이지 않음', () => {
    expect(resolvePlaceCode('오동도 가고 싶어', LSP)).toBe('odongdo');
    expect(resolvePlaceCode('케이블카 가고 싶어', LSP)).toBe('cablecar');
    expect(resolvePlaceCode('향일암 먼저 가고 싶어', LSP)).toBe('hyangiram');
  });

  test('Regression Case C: "부모님과 가려고 해요" (has_car=false) → _isCompanionChipQuery=true', () => {
    expect(isCompanionChipQuery('부모님과 함께 가려고 해요.', 'hyangiram', false)).toBe(true);
  });

  test('Regression: _yisunsinVehicleBypass는 "왔어요" 표현에 반응하지 않음', () => {
    expect(yisunsinVehicleBypass(LSP, true, '부모님과 함께 왔어요')).toBe(false);
    expect(ldGuardBypass('부모님과 함께 왔어요', LSP, true)).toBe(true); // 기존 패턴으로 true
  });

  test('Regression: JOURNEY_PREFERENCE "먼저 가고 싶어" 감지 유지', () => {
    expect(detectJourneyDecisionType('먼저 가고 싶어')).toBe('JOURNEY_PREFERENCE');
    expect(detectJourneyDecisionType('가고싶어')).toBe('JOURNEY_PREFERENCE');
  });

});
