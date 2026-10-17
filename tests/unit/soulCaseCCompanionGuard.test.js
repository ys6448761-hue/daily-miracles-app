/**
 * Case C Companion Guard — Regression Tests
 *
 * Root Cause (2026-10-17): "부모님과 함께 가려고 해요"가 _ldGuardBypass 미매칭 →
 * Living Detail Fallback 경로 진입 → next_options: [] 반환
 *
 * Fix: /(부모님과|아이와|가족과).*(왔어|왔어요|왔는데|함께라면|함께 왔|와서|가려고)/ 에 가려고 추가
 */

// ── _ldGuardBypass 정규식 추출 (서비스 의존 없이 단위 테스트) ────────────────
function ldGuardBypass(message) {
  return (
    /^(안녕|안녕하세요|반가워|하이|hello|hi)[\s!.?]*$/i.test(message.trim())
    || /(잘 모르겠|모르겠어|뭐가 좋을|뭐 해야|어떡하|어쩌)/.test(message)
    || (/케이블카|케이블 카/.test(message) && /(꼭|반드시|타고 싶|타야|빼고|빼줘|제외|일정에|탈거야)/.test(message))
    || /(부모님과|아이와|가족과).*(왔어|왔어요|왔는데|함께라면|함께 왔|와서|가려고)/.test(message)
    || /(이곳에서.*(즐기|어떻게)|어떻게.*즐기)/.test(message)
  );
}

describe('SOUL Case C — _ldGuardBypass Companion Guard', () => {

  // ── T-01: 버그 수정 케이스 ────────────────────────────────────────────
  test('T-01 향일암 + 가려고 → bypass=true (Companion Response 경로)', () => {
    expect(ldGuardBypass('부모님과 함께 가려고 해요.')).toBe(true);
  });

  test('T-01b 아이와 가려고 → bypass=true', () => {
    expect(ldGuardBypass('아이와 함께 가려고 하는데요.')).toBe(true);
  });

  test('T-01c 가족과 가려고 → bypass=true', () => {
    expect(ldGuardBypass('가족과 가려고 합니다.')).toBe(true);
  });

  // ── T-02: 기존 방문 완료 표현 — 동작 유지 ─────────────────────────────
  test('T-02a 부모님과 함께 왔어요 → bypass=true (기존 동작 유지)', () => {
    expect(ldGuardBypass('부모님과 함께 왔어요.')).toBe(true);
  });

  test('T-02b 부모님과 왔는데 → bypass=true', () => {
    expect(ldGuardBypass('부모님과 왔는데 어떻게 즐기면 좋을까요?')).toBe(true);
  });

  test('T-02c 아이와 와서 → bypass=true', () => {
    expect(ldGuardBypass('아이와 와서 구경하고 싶어요.')).toBe(true);
  });

  // ── T-03: Living Detail Fallback 유지 — bypass=false 기대 ─────────────
  test('T-03a 일반 장소 정보 질문(주차) → bypass=false', () => {
    expect(ldGuardBypass('주차 가능해요?')).toBe(false);
  });

  test('T-03b 요금 질문 → bypass=false', () => {
    expect(ldGuardBypass('입장료가 얼마예요?')).toBe(false);
  });

  test('T-03c 운영시간 질문 → bypass=false', () => {
    expect(ldGuardBypass('지금 운영 중인가요?')).toBe(false);
  });

  // ── T-04: Discovery 요청 — DISCOVERY_OVERRIDES 매칭 확인 ──────────────
  // _ldGuardBypass는 Companion Guard 만 담당; DISCOVERY_OVERRIDES는 별도 gate에서 처리됨
  // 이 테스트는 companion guard가 discovery 메시지에 오작동하지 않는지 확인
  test('T-04 여수 어디 갈까 → bypass=false (Discovery gate가 별도 처리)', () => {
    expect(ldGuardBypass('여수 어디 갈까요?')).toBe(false);
  });

  // ── T-05: PR #57 코스 요청 — companion guard와 무관 ──────────────────
  test('T-05 코스 요청 → bypass=false (PR #57 guard 별도 처리)', () => {
    expect(ldGuardBypass('향일암 포함해서 여수 코스 짜줘.')).toBe(false);
  });

  // ── T-06: mobility_constraint 케이스 — bypass=true면 Companion path 진입 후
  //          _generateSoulMessage에서 mobility_constraint 확인하여 분기
  test('T-06 걷기 힘드신가요 발화 — 이미 constraint 있는 경우 companion 경로 유지', () => {
    // "가려고"가 없으니 이 문장은 companion guard로 bypass되지 않음 (정상)
    expect(ldGuardBypass('걷기가 좀 힘든데 어떻게 할까요?')).toBe(false);
  });

  // ── T-07: 접근성 질문 조건 확인 보조 ─────────────────────────────────
  // _buildResultEnvelope 조건: status=PARTIAL + family_elderly + hyangiram + !mobility_constraint
  test('T-07 부모님과 가려고 표현 bypass=true, 접근성 질문 조건 경로 유입 확인', () => {
    // bypass=true → Companion Chip 경로 또는 TG 경로 → PARTIAL + family_elderly + hyangiram 조건 충족 시 질문 생성
    expect(ldGuardBypass('부모님과 함께 향일암 가려고요.')).toBe(true);
  });

});

// ── Root Cause 2 — Companion Chip Response next_options 조건 ────────────────
// Fix (2026-10-17): _isCompanionChipQuery 경로에서도 접근성 질문을 반환하도록 수정.
// 조건: family_elderly + physical_difficulty='high' + !mobility_constraint

function ccAccessibilityQ(soulContext, place) {
  return (
    soulContext.people_type === 'family_elderly' &&
    place.physical_difficulty === 'high' &&
    !soulContext.mobility_constraint
  ) ? ['걷기 많이 힘드신가요?'] : [];
}

describe('SOUL Case C Root Cause 2 — Companion Chip next_options', () => {

  const hyangiram = { code: 'hyangiram', physical_difficulty: 'high' };
  const dolsanBridge = { code: 'dolsan_bridge', physical_difficulty: 'low' };

  // ── RC2-T01: 핵심 케이스 — 접근성 질문 생성 ───────────────────────────────
  test('RC2-T01 향일암 + family_elderly + 제약 없음 → 접근성 질문 포함', () => {
    const ctx = { people_type: 'family_elderly', mobility_constraint: null };
    expect(ccAccessibilityQ(ctx, hyangiram)).toEqual(['걷기 많이 힘드신가요?']);
  });

  // ── RC2-T02: 보행 제약 이미 제공 → 질문 반복 없음 ──────────────────────────
  test('RC2-T02 mobility_constraint 있음 → 질문 없음', () => {
    const ctx = { people_type: 'family_elderly', mobility_constraint: 'low_walking' };
    expect(ccAccessibilityQ(ctx, hyangiram)).toEqual([]);
  });

  // ── RC2-T03: 고령 동행자 아닌 경우 → 질문 없음 ──────────────────────────────
  test('RC2-T03 people_type=family_with_kids → 질문 없음', () => {
    const ctx = { people_type: 'family_with_kids', mobility_constraint: null };
    expect(ccAccessibilityQ(ctx, hyangiram)).toEqual([]);
  });

  test('RC2-T04 people_type=solo → 질문 없음', () => {
    const ctx = { people_type: 'solo', mobility_constraint: null };
    expect(ccAccessibilityQ(ctx, hyangiram)).toEqual([]);
  });

  // ── RC2-T05: 접근성 질문 대상이 아닌 장소 → 질문 없음 ──────────────────────
  test('RC2-T05 physical_difficulty!=high 장소 → 질문 없음', () => {
    const ctx = { people_type: 'family_elderly', mobility_constraint: null };
    expect(ccAccessibilityQ(ctx, dolsanBridge)).toEqual([]);
  });

  test('RC2-T06 physical_difficulty 미정의 장소 → 질문 없음', () => {
    const ctx = { people_type: 'family_elderly', mobility_constraint: null };
    expect(ccAccessibilityQ(ctx, { code: 'yisunsin', physical_difficulty: undefined })).toEqual([]);
  });

  // ── RC2-T07: mobility_constraint falsy 값 구분 ───────────────────────────────
  test('RC2-T07 mobility_constraint=undefined → 질문 포함 (null과 동일 처리)', () => {
    const ctx = { people_type: 'family_elderly', mobility_constraint: undefined };
    expect(ccAccessibilityQ(ctx, hyangiram)).toEqual(['걷기 많이 힘드신가요?']);
  });

  test('RC2-T08 mobility_constraint=false → 질문 포함', () => {
    const ctx = { people_type: 'family_elderly', mobility_constraint: false };
    expect(ccAccessibilityQ(ctx, hyangiram)).toEqual(['걷기 많이 힘드신가요?']);
  });

});
