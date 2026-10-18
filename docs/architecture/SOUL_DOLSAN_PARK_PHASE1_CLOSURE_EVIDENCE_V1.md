# SOUL Dolsan Park Phase 1 Minimal — Closure Evidence V1

**Status:** CLOSED — DEPLOYED_AND_VERIFIED  
**Date:** 2026-10-18  
**Place Code:** `dolsan_nightscape`  
**Emotional Role:** 여운 · 다짐 · 마무리  
**Production SHA:** `deec9225213c7a6fe553304992031350168a3893`  
**Deploy ID:** `dep-dba4gg2jnfac73eb1ke0`  
**Production LIVE:** 2026-10-18 13:19 KST

---

## 1. Purpose / Scope

돌산공원(`dolsan_nightscape`) SOUL Phase 1 Minimal 구현의 Closure Evidence 기록.

**Phase 1 Minimal 범위:**
- E1a: `_PLACE_KNOWLEDGE.dolsan_nightscape.experience_ko` — Founder 승인 문구 반영
- E2a: `_buildPlaceSpecificQueryPayload` 내 `dolsan_nightscape` 전용 "어때요" LDF 분기(DNP-1)

**Phase 1 제외 (Founder D-2 Option A):**
- JOURNEY_PREFERENCE dolsan_nightscape 분기
- Companion Chip 동작 변경
- parking_trust 변경
- dolsan_daegyo / hamel 관련 변경
- DB · Schema · 환경변수 변경

---

## 2. Founder Decisions

| 결정 항목 | 내용 | 날짜 |
|---|---|---|
| D-1 (experience_ko 문구) | Founder 직접 작성 문구 승인 | 2026-10-18 |
| D-2 (Phase 범위) | Option A — Minimal | 2026-10-18 |
| Implementation 승인 | E1a + E2a 구현 + PR #78 | 2026-10-18 |
| Squash Merge 승인 | G-1~G-4 조건부 (PRE-MERGE GATE) | 2026-10-18 |
| Production Deploy 승인 | Render `srv-d3kt93b3fgac73a3nt1g` + SHA `deec9225` | 2026-10-18 |
| Runtime QA 승인 | P-1~P-9 Production QA | 2026-10-18 |
| Closure Documentation 승인 | Evidence 문서 + Project State + PR | 2026-10-18 |

---

## 3. SSOT Alignment

| 항목 | 내용 |
|---|---|
| 감정 역할 | 여운 · 다짐 · 마무리 |
| 핵심 경험 | 여수 야경을 높은 곳에서 조용히 바라보며 하루를 마무리하는 공간 |
| 낮/밤 분기 | 없음 (Phase 1 Minimal — 단일 경험 문구) |
| PSQ 라우팅 보조 | hours_ko / fit_ko / parking_ko (데이터 존재) |
| 격리 원칙 | dolsan_nightscape 분기 타 장소 오염 없음 |

**Founder 승인 `experience_ko` (정확 원문):**

> 돌산공원은 여수의 야경을 높은 곳에서 바라볼 수 있는 공간이에요. 밤이 되면 돌산대교와 바다, 도시의 불빛이 한눈에 들어와요. 하루를 돌아보며 마음속에 남은 생각을 조용히 정리할 수 있는 곳이에요.

---

## 4. Implementation Evidence

### E1a — `_PLACE_KNOWLEDGE.dolsan_nightscape.experience_ko`

`services/soyeowoolService.js` line 282:

```js
experience_ko: '돌산공원은 여수의 야경을 높은 곳에서 바라볼 수 있는 공간이에요. 밤이 되면 돌산대교와 바다, 도시의 불빛이 한눈에 들어와요. 하루를 돌아보며 마음속에 남은 생각을 조용히 정리할 수 있는 곳이에요.',
```

이전 값: `'여수 야경을 보기 가장 좋은 곳 중 하나예요. 돌산대교·이순신광장·장군도를 한눈에 볼 수 있어요. 반려동물도 함께 갈 수 있어요.'`

### E2a — `_buildPlaceSpecificQueryPayload` dolsan_nightscape "어때요" 분기 (DNP-1)

`services/soyeowoolService.js` lines 1304–1307:

```js
// Dolsan Park "어때요" — dolsan_nightscape-scoped (DNP-1)
else if (code === 'dolsan_nightscape' && /어때요/.test(msg)) {
  if (knowledge.experience_ko) answer = knowledge.experience_ko;
}
```

**변경 범위:** +6 / -1 lines (2 hunk only)  
**미접촉 항목:** `_detectPlaceLookupIntent`, PSQ gate, MEDIUM_LOOKUP, JOURNEY_PREFERENCE, Companion Chip, parking_trust, dolsan_daegyo

---

## 5. CI / Guardian Evidence

### 단위 테스트 — 33/33 PASS

**파일:** `tests/unit/soulDolsanParkPhase1.test.js`

| 그룹 | 건수 | 검증 내용 |
|---|---|---|
| E1a (experience_ko 검증) | 5 | 존재·Founder 문구 정확 일치·단정 없음·마무리 키워드·필드 불변 |
| DNP-1 ("어때요" LDF_PSQ 경로) | 6 | experience_ko 반환·verifyNote 미포함·정확 일치 |
| DNP-2/3 (place code 격리) | 2 | 타 place code "어때요" 미오염 |
| DNP-4 (주차 PSQ 라우팅) | 3 | parking_ko PSQ PASS·verifyNote 포함 |
| DNP-5 (운영시간 LDF_PSQ) | 3 | hours_ko PASS |
| DNP-6 (적합성 PSQ 라우팅) | 1 | fit_ko PSQ |
| DNP-7/8 (비-경험 의도) | 2 | "가고 싶어"/"빼줘" → experience_ko 미반환 |
| DNP-9~12 (타 장소 격리) | 4 | cablecar/odongdo/hyangiram/lee_soon_shin_plaza 오염 없음 |
| GV-01~07 (Guardian 검증) | 7 | Founder 문구 정확·7종 금지어 0건·보호 |
| **합계** | **33** | **PASS** |

### 회귀 테스트 — 235/235 PASS

| 파일 | 건수 | 결과 |
|---|---|---|
| soulCablecarPhase1.test.js | 52 | PASS |
| soulHyangiramPhase1.test.js | 66 | PASS |
| soulOdongdoPhase1.test.js | 57 | PASS |
| soulYisunsinPhase2.test.js | 39 | PASS |
| soulCaseCCompanionGuard.test.js | 21 | PASS |

### CI Gate (PR #78 pre-merge)

| Gate | 결과 | 시간 |
|---|---|---|
| AIL Gate | PASS | 35s |
| docker-smoke | PASS | 32s |
| Vercel Preview | PASS | — |

---

## 6. Production Deploy Evidence

| 항목 | 내용 |
|---|---|
| Render Service | `srv-d3kt93b3fgac73a3nt1g` |
| Production URL | https://app.dailymiracles.kr |
| 배포 전 LIVE SHA | `f446328491aebd037ed40229c55d229bf9c81b43` (Cablecar Phase 1) |
| 배포 SHA | `deec9225213c7a6fe553304992031350168a3893` |
| Deploy ID | `dep-dba4gg2jnfac73eb1ke0` |
| Deploy 상태 | Live |
| Deploy 완료 시각 | 2026-10-18 13:19 KST |
| started_at 확인 | `2026-10-18T04:19:44.536Z` (=KST 13:19) — Founder Evidence 일치 |

---

## 7. Production Runtime QA Matrix

**실행 시각:** 2026-10-18 13:24 KST (Production LIVE 13:19 이후)  
**스크립트:** `tmp/qa_dolsan_park_phase1.js`  
**최종 분류:** 10 PASS / 1 ADVISORY / 0 신규 회귀

| ID | 입력 | place_code | Production Decision | 결과 |
|---|---|---|---|---|
| P-1 | "돌산공원 어때요?" | dolsan_nightscape | PLACE_LOOKUP | **PASS** — Founder 승인 experience_ko 정확 반환 ✓ |
| P-2 | "돌산공원 주차 어때?" | dolsan_nightscape | PLACE_LOOKUP | **ADVISORY (PRE-EXISTING)** — parking_ko 미반환 (§8 참조) |
| P-3 | "돌산공원 몇 시까지?" | dolsan_nightscape | PLACE_SPECIFIC_QUERY | **PASS** — `연중개방 (24시간)` 반환 |
| P-4 | "돌산공원 누구랑 가면 좋아?" | dolsan_nightscape | PLACE_SPECIFIC_QUERY | **PASS** — fit_ko 응답 유지 |
| P-5 | "돌산공원 가고 싶어" | dolsan_nightscape | JOURNEY_CONTINUITY | **PASS** — experience_ko 미포함 |
| P-6 | "돌산공원 빼줘" | dolsan_nightscape | PLACE_SPECIFIC_QUERY | **PASS** — experience_ko 미포함 |
| P-7 | "케이블카 어때요?" | cablecar | PLACE_LOOKUP | **PASS** — Cablecar experience_ko 불변 ✓ |
| P-8a | "오동도 어때요?" | odongdo | PLACE_LOOKUP | **PASS** — Odongdo 격리 ✓ |
| P-8b | "향일암 어때요?" | hyangiram | PLACE_LOOKUP | **PASS** — Hyangiram 격리 ✓ |
| P-8c | "이순신광장 어때요?" | lee_soon_shin_plaza | PLACE_LOOKUP | **PASS** — YiSunSin 격리 ✓ |
| P-9 | "돌산대교 걸어서 건너갈 수 있어?" | dolsan_nightscape | JOURNEY_CONTINUITY | **PASS — BASELINE UNCHANGED** (§9 참조) |

---

## 8. P-2 PRE-EXISTING ADVISORY

### Observed

`"돌산공원 주차 어때?"` → `PLACE_LOOKUP`, 경험 문구 반환, 주차 정보 미노출.

### Data

`_PLACE_KNOWLEDGE.dolsan_nightscape.parking_ko` **존재** (`soyeowoolService.js:280`):

```js
parking_ko: '공영주차장이 있어요. 최초 1시간 무료, 이후 10분당 200원이에요. 방문 전 현장 안내판을 확인해보세요.',
```

데이터 부재 아님. 라우팅 미도달이 원인.

### Root Cause

라우팅 경로 (`soyeowoolService.js:2154` → `2171` → `2203`):

```
"돌산공원 주차 어때?"
  ↓
_detectPlaceLookupIntent() [line 2154]
  → 별칭 "돌산공원" 발견 (PLACE_ALIAS_MAP)
  → afterAlias = " 주차 어때?"
  → MEDIUM_LOOKUP /어때\??/ 일치 → isPlaceLookup: true
  ↓
PSQ guard [line 2158]: if (!placeLookup.isPlaceLookup && ...) → FALSE (무시)
  ↓
if (placeLookup.isPlaceLookup) [line 2171] → TRUE
  → _buildPlaceLookupClientPayload 반환 → PLACE_LOOKUP
  → parking_ko PSQ 게이트 [line 2551] 미도달
```

"별칭+어때?" 조합이 PLACE_LOOKUP을 PSQ보다 먼저 트리거함.

### Baseline

PR #78 이전(`HEAD~1`) 코드 확인:
- `MEDIUM_LOOKUP = /알려줘|알려주세요|어때\??|...` — 동일 존재
- `'돌산공원': 'dolsan_nightscape'` — 동일 존재

`"돌산공원 주차 어때?"` PLACE_LOOKUP 라우팅은 PR #78 이전에도 동일하게 발생.

### Classification

`PRE-EXISTING / ADVISORY / UNRESOLVED`

PR #78 기인 신규 회귀: **없음**

### Open

- 수정 미완료 — Phase 1 Closure 범위 외
- Issue 생성 여부: Founder 후속 결정 필요
- Phase 2 후보: "별칭+어때? 조합" PSQ guard 개선

---

## 9. P-9 R20 PRE-EXISTING FAIL

- 질문: `"돌산대교 걸어서 건너갈 수 있어?"`
- Production Decision: `JOURNEY_CONTINUITY`
- 예상 라우팅: `dolsan_daegyo` PSQ
- 원인: `_extractGoldenPlaceCode`가 `dolsan_daegyo`를 인식하지 못해 여정 처리로 분기
- PR #78에서 `dolsan_daegyo` 라우팅 코드 변경 없음
- Baseline: PR #78 이전과 동일한 `JOURNEY_CONTINUITY` 패턴 유지
- Classification: `PRE-EXISTING FAIL`
- 이번 Phase 1 신규 회귀: 없음
- 미해결 상태 유지

P-2 Advisory와 R20은 서로 다른 별개의 기존 문제.

---

## 10. Non-Goals / Explicit Exclusions

Phase 1 Minimal 승인 범위에 포함되지 않으며, 이 Closure에서 해결된 것으로 기록하지 않음:

| 항목 | 이유 |
|---|---|
| JOURNEY_PREFERENCE dolsan_nightscape | D-2 Option A 범위 외 |
| Companion Chip 변경 | D-2 Option A 범위 외 |
| parking_trust 변경 | D-2 Option A 범위 외 |
| dolsan_daegyo / hamel 변경 | 명시 금지 |
| P-2 parking_ko PSQ 라우팅 수정 | PRE-EXISTING, Phase 2 후보 |
| R20 dolsan_daegyo 라우팅 수정 | PRE-EXISTING, 별도 결정 필요 |
| DB · Schema · 환경변수 변경 | 미승인 |

---

## 11. Closure Recommendation

**CLOSED — DEPLOYED_AND_VERIFIED (P-2 ADVISORY TRACKED)**

- P-1 핵심 기능 Production 정상 반환 확인
- E1a / E2a 구현 완료, Founder 승인 문구 정확 반영
- 신규 회귀 0건
- P-2 / R20: PRE-EXISTING 확인, 미해결 상태 기록 유지
- Production 배포 완료, Runtime QA 완료

Phase 2 진입 조건: Founder 다음 장소 확장 우선순위 결정 또는 P-2 / R20 수정 별도 승인.

---

## 12. Open Follow-ups

| 항목 | 분류 | 우선순위 |
|---|---|---|
| P-2 parking_ko PSQ 라우팅 개선 ("별칭+어때?" guard) | ADVISORY / Phase 2 후보 | Founder 결정 필요 |
| R20 dolsan_daegyo `_extractGoldenPlaceCode` 개선 | PRE-EXISTING FAIL | Founder 결정 필요 |
| dolsan_nightscape JOURNEY_PREFERENCE 분기 | Phase 2 후보 | Founder 결정 필요 |
| Companion Chip 야경 포인트 맥락 개선 | Phase 2 후보 | Founder 결정 필요 |
| parking_ko PSQ 라우팅 활성화 | Phase 2 후보 | Founder 결정 필요 |

---

## 13. Evidence References

| 항목 | 경로 / SHA |
|---|---|
| Code PR | https://github.com/ys6448761-hue/daily-miracles-app/pull/78 |
| Squash Merge SHA | `deec9225213c7a6fe553304992031350168a3893` |
| Deploy ID | `dep-dba4gg2jnfac73eb1ke0` |
| 단위 테스트 | `tests/unit/soulDolsanParkPhase1.test.js` |
| QA 스크립트 | `tmp/qa_dolsan_park_phase1.js` |
| Cablecar Phase 1 Evidence | `docs/architecture/SOUL_CABLE_CAR_PHASE1_CLOSURE_EVIDENCE_V1.md` |
| Cable Car Issue #76 | https://github.com/ys6448761-hue/daily-miracles-app/issues/76 |
