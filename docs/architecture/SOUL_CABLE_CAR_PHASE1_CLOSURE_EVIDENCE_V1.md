# SOUL Cable Car Phase 1 Minimal — Closure Evidence V1

**Status:** CLOSED — DEPLOYED_AND_VERIFIED  
**Date:** 2026-10-18  
**Production SHA:** `f446328491aebd037ed40229c55d229bf9c81b43`  
**Deploy ID:** `dep-dba2njfavr4c73fu5rc0`  
**Production LIVE:** 2026-10-18 11:18 KST

---

## Founder Authorization

| 결정 항목 | 내용 | 날짜 |
|---|---|---|
| C-1 (experience_ko 문구) | 승인 문구 정확 적용 | 2026-10-18 |
| C-5 (Phase 1 Minimal 범위) | JOURNEY_PREFERENCE / Companion Chip / parking_trust 제외 | 2026-10-18 |
| Implementation 승인 | C1a + C2a 구현 + PR #74 | 2026-10-18 |
| Production Deploy 승인 | Render `srv-d3kt93b3fgac73a3nt1g` | 2026-10-18 |
| Closure 승인 | PR 생성 + Guardian 검토 | 2026-10-18 |

---

## 변경 내용

### C1a — `_PLACE_KNOWLEDGE.cablecar.experience_ko`

`services/soyeowoolService.js` 내 `_PLACE_KNOWLEDGE.cablecar`에 추가:

```js
experience_ko: '여수 바다 위를 가로지르는 해상 케이블카예요. 바다와 섬, 항구를 높은 곳에서 바라보며 잠시 시야를 넓힐 수 있어요. 익숙한 풍경도 조금 다른 눈으로 바라보게 되는 시간이 될 수 있어요.',
```

### C2a — `_buildPlaceSpecificQueryPayload` cablecar "어때요" 분기

```js
// Cablecar "어때요" — cablecar-scoped (CBL-1)
else if (code === 'cablecar' && /어때요/.test(msg)) {
  if (knowledge.experience_ko) answer = knowledge.experience_ko;
}
```

---

## 단위 테스트 결과 — 52/52 PASS

**파일:** `tests/unit/soulCablecarPhase1.test.js`

| 그룹 | 건수 | 검증 내용 |
|---|---|---|
| C1a (experience_ko 검증) | 7 | 존재·Founder 문구 정확 일치·사실 단정 없음·NON_OFFICIAL 유지 |
| CBL-1 ("어때요" LDF_PSQ 경로) | 6 | experience_ko 반환·verifyNote 미포함 |
| CBL-2 ("꼭 타고 싶어" 우회) | 4 | ldGuardBypass → BYPASS_CLARIFICATION |
| CBL-3 ("빼줘" 우회) | 4 | ldGuardBypass → BYPASS_CLARIFICATION |
| CBL-4 ("얼마야" PSQ) | 5 | price_ko NON_OFFICIAL |
| CBL-5 ("몇 시까지" LDF_PSQ) | 5 | hours_ko NON_OFFICIAL |
| CBL-6 ("날씨 어때" PSQ) | 5 | weather_ko |
| CBL-7 (이순신광장 격리) | 3 | 타 장소 오염 없음 |
| CBL-8 (오동도 격리) | 3 | 타 장소 오염 없음 |
| CBL-9 (향일암 격리) | 3 | 타 장소 오염 없음 |
| GV-01~GV-07 (Guardian 검증) | 7 | Founder 문구 정확·7종 금지어 0건·CLARIFICATION 보호 |
| **합계** | **52** | **PASS** |

---

## 회귀 테스트 결과 — 183/183 PASS

| 파일 | 건수 | 결과 |
|---|---|---|
| soulHyangiramPhase1.test.js | 66 | PASS |
| soulOdongdoPhase1.test.js | 57 | PASS |
| soulYisunsinPhase2.test.js | 39 | PASS |
| soulCaseCCompanionGuard.test.js | 21 | PASS |

---

## Production Runtime QA — 8/9 PASS, 1 ADVISORY

**실행 시각:** 2026-10-18 (Production LIVE 11:18 KST 이후)  
**스크립트:** `tmp/qa_cablecar_phase1.js`

| 시나리오 | 입력 | Production Decision | 결과 |
|---|---|---|---|
| P-1 | "케이블카 어때요?" (cablecar) | PLACE_LOOKUP | **PASS** — experience_ko 포함 ✓ |
| P-2 | "케이블카 꼭 타고 싶어" (cablecar) | CLARIFICATION | **PASS** — 인원·날짜 안내 |
| P-3 | "케이블카 빼줘" (cablecar) | CLARIFICATION | **PASS** — "케이블카 없이 일정" |
| P-4 | "케이블카 얼마야?" (cablecar) | PLACE_SPECIFIC_QUERY | **PASS** — price_ko NON_OFFICIAL + 공식 확인 안내 |
| P-5 | "케이블카 몇 시까지?" (cablecar) | PLACE_SPECIFIC_QUERY | **PASS** — "09:30~21:30" NON_OFFICIAL |
| P-6 | "케이블카 날씨 어때?" (cablecar) | PLACE_LOOKUP | **ADVISORY** — weather_ko 미노출 (Issue #76) |
| P-7 | "오동도 어때요?" (odongdo) | PLACE_LOOKUP | **PASS** — 격리 확인 ✓ |
| P-8 | "향일암 어때요?" (hyangiram) | PLACE_LOOKUP | **PASS** — 격리 확인 ✓ |
| P-9 | "이순신광장 어때요?" (lee_soon_shin_plaza) | PLACE_LOOKUP | **PASS** — 격리 확인 ✓ |

### P-6 ADVISORY 상세

- "날씨 어때?"가 PSQ 게이트를 통과하지 않아 `weather_ko` 미반환
- Phase 1 Minimal 변경(C1a/C2a) 이전부터 존재하는 라우팅 특성 — 회귀 아님
- Founder Decision: Phase 1 Closure에서 ADVISORY로 유지, 별도 Issue #76 등록
- **Issue:** https://github.com/ys6448761-hue/daily-miracles-app/issues/76

---

## Guardian Verification

| 항목 | 판정 |
|---|---|
| Founder 승인 문구 정확 일치 | PASS (GV-01) |
| 기존 CLARIFICATION 동작 보호 | PASS (CBL-2/CBL-3) |
| price_ko / hours_ko NON_OFFICIAL 정책 유지 | PASS (CBL-4/CBL-5) |
| 타 장소 응답 오염 없음 | PASS (P-7/P-8/P-9) |
| JOURNEY_PREFERENCE / Companion Chip 미접촉 | PASS — 코드 접촉 없음 |
| DB / Schema / 환경변수 변경 없음 | PASS |
| 7종 금지어 0건 | PASS (GV-05) |
| API 계약 변경 없음 | PASS |

---

## PR 및 커밋 이력

| PR | 제목 | SHA | 상태 |
|---|---|---|---|
| #74 | feat(soul): cablecar phase 1 minimal | `7951fd0` | MERGED |
| #75 | docs: cablecar phase 1 MERGED | `f446328` (squash) | MERGED |

---

## Phase 2 후보 (Founder Decision 필요)

- JOURNEY_PREFERENCE cablecar 분기 (family_elderly / kids_ok / young_adults)
- Companion Chip walking 안내 (승선 시 안전 고려)
- parking_trust UNKNOWN → 근처 주차 정보 연결
- weather_ko PSQ 게이트 연결 (Issue #76)
