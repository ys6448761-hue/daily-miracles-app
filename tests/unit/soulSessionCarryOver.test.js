'use strict';

/**
 * Session Carry-Over Bug — Regression Tests
 *
 * 재현 조건: 무여정 메인에서 '차량으로' 클릭 후 '다시 물어보기' → '여행코스' 클릭 시
 * has_car: true가 세션에서 유입되어 '자차로 이동하기 좋은 곳' 응답이 잘못 반환됨.
 *
 * Fix: MuyojeongHomePage.jsx handleReset()에 setSessionId(null) 추가.
 *
 * Tests:
 *   SC-1: stored profile has_car → 새 컨텍스트로 주입됨 (버그 조건 확인)
 *   SC-2: stored profile null → has_car 주입 없음 (수정 후 기대 동작)
 *   SC-3: 현재 턴 USER_EXPLICIT가 session stored보다 우선
 *   SC-4: _generateSoulMessage — has_car=true + PARTIAL + no place → 자차 응답 (버그 분기)
 *   SC-5: _generateSoulMessage — has_car=null + PARTIAL + no place → 시간 질문 (기대 동작)
 *   SC-6: '여행코스를 짜줘.' → _isJourneyPlanningIntent 매칭 확인
 *
 * Run: npx jest --testPathPatterns="soulSessionCarryOver"
 */

// ── Mirror: _applyPersistedTravelerProfile (has_car 관련 부분) ────────────────
// soyeowoolService.js line 744~773
function applyPersistedTravelerProfile(soulContext, storedProfile) {
  if (!storedProfile) return soulContext;
  const prov = soulContext._provenance || {};
  const merged = { ...soulContext };
  const mergedProv = { ...prov };

  // has_car: stored profile 값을 USER_EXPLICIT이 없을 때만 주입
  if (prov.has_car !== 'USER_EXPLICIT' && storedProfile.has_car != null) {
    merged.has_car = storedProfile.has_car;
    mergedProv.has_car = 'USER_EXPLICIT';
  }

  merged._provenance = mergedProv;
  return merged;
}

// ── Mirror: _generateSoulMessage — PARTIAL 분기 has_car 조건 ─────────────────
// soyeowoolService.js line 1722~1733
const SITUATION_LINE = '지금 상황에 맞는 곳을 찾아볼게요.';

function generatePartialMessage(soulContext, currentPlaceCode = null) {
  const pt = soulContext.people_type || null;

  if (!currentPlaceCode) {
    if (pt === 'family_elderly') return '부모님과 함께 여행이시군요.\n부모님과 함께 둘러볼 만한 곳을 골라봤어요.';
    if (pt === 'family_with_kids') return '아이들과 함께 여행이시군요.\n아이와 함께 즐길 수 있는 곳을 골라봤어요.';
    // SC-4 버그 분기: has_car=true → 자차 응답
    if (soulContext.has_car === true) return `${SITUATION_LINE}\n자차로 이동하기 좋은 곳을 골라봤어요.`;
  }

  // SC-5 기대 동작: 시간 질문
  return `${SITUATION_LINE}\n가볼 만한 곳을 골라봤어요.\n시간이 얼마나 남으셨어요?`;
}

// ── Mirror: _isJourneyPlanningIntent ─────────────────────────────────────────
// soyeowoolService.js line 1063~1072
function isJourneyPlanningIntent(message) {
  if (!message) return false;
  if (/\d박\s*\d일|\d박/.test(message)) return true;
  if (/(일정|코스|여행|계획|동선).*(짜줘|짜주세요|만들어줘|만들어주세요|세워줘|구성해줘)/.test(message)) return true;
  if (/(짜줘|짜주세요|만들어줘|만들어주세요).*(일정|코스|여행|동선)/.test(message)) return true;
  if (/(일정|코스|여행 계획|동선).*(알려줘|알려주세요|보여줘|보여주세요|알고 싶|궁금해|부탁해)/.test(message)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────

test('SC-1 — stored profile has_car=true → 새 soulContext로 주입 (버그 조건 재현)', () => {
  const soulContext = { people_type: null, has_car: null, _provenance: {} };
  const storedProfile = { has_car: true };

  const enriched = applyPersistedTravelerProfile(soulContext, storedProfile);

  expect(enriched.has_car).toBe(true);
  expect(enriched._provenance.has_car).toBe('USER_EXPLICIT');
});

test('SC-2 — stored profile null → has_car 주입 없음 (세션 초기화 후 기대 동작)', () => {
  const soulContext = { people_type: null, has_car: null, _provenance: {} };

  const enriched = applyPersistedTravelerProfile(soulContext, null);

  expect(enriched.has_car).toBeNull();
  expect(enriched._provenance.has_car).toBeUndefined();
});

test('SC-3 — 현재 턴 USER_EXPLICIT has_car=false가 stored has_car=true보다 우선', () => {
  const soulContext = {
    people_type: null,
    has_car: false,
    _provenance: { has_car: 'USER_EXPLICIT' },
  };
  const storedProfile = { has_car: true };

  const enriched = applyPersistedTravelerProfile(soulContext, storedProfile);

  // 현재 턴 USER_EXPLICIT → 세션 stored 무시
  expect(enriched.has_car).toBe(false);
});

test('SC-4 — has_car=true + PARTIAL + no place → 자차 응답 반환 (버그 분기)', () => {
  const soulContext = { has_car: true, people_type: null };
  const msg = generatePartialMessage(soulContext, null);

  expect(msg).toBe('지금 상황에 맞는 곳을 찾아볼게요.\n자차로 이동하기 좋은 곳을 골라봤어요.');
});

test('SC-5 — has_car=null + PARTIAL + no place → 시간 질문 반환 (기대 동작)', () => {
  const soulContext = { has_car: null, people_type: null };
  const msg = generatePartialMessage(soulContext, null);

  expect(msg).toContain('시간이 얼마나 남으셨어요?');
  expect(msg).not.toContain('자차로');
});

test('SC-5b — has_car=false + PARTIAL + no place → 시간 질문 반환', () => {
  const soulContext = { has_car: false, people_type: null };
  const msg = generatePartialMessage(soulContext, null);

  expect(msg).toContain('시간이 얼마나 남으셨어요?');
  expect(msg).not.toContain('자차로');
});

test('SC-6 — "여수 여행코스를 짜줘." → _isJourneyPlanningIntent = true', () => {
  expect(isJourneyPlanningIntent('여수 여행코스를 짜줘.')).toBe(true);
});

test('SC-6b — "여행코스" 칩 query → _isJourneyPlanningIntent 매칭', () => {
  // MuyojeongHomePage SUGGESTION_CHIPS 여행코스 칩의 실제 query
  expect(isJourneyPlanningIntent('여수 여행코스를 짜줘.')).toBe(true);
});

test('SC-7 — has_car=true가 자차 분기에서 시간 질문을 억제함 (억제 확인)', () => {
  const soulContext = { has_car: true, people_type: null };
  const msg = generatePartialMessage(soulContext, null);

  // 자차 분기는 early return → 시간 질문 없음
  expect(msg).not.toContain('시간이 얼마나 남으셨어요?');
});
