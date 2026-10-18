# SOUL Dolsan Bridge Phase 1 Minimal — Closure Evidence V1

**Status:** CLOSED — DEPLOYED_AND_VERIFIED (R20 PRE-EXISTING FAIL TRACKED)
**Date:** 2026-10-18
**Place Code:** `dolsan_daegyo`
**Emotional Role:** 흐름 · 전환
**Production SHA:** `3fb07234701c6ae4cbae004b6ac916610d40d0df`
**Deploy ID:** `dep-dba6jpvbtjjs73e0b5fg`
**Production LIVE:** 2026-10-18 15:43 KST

---

## 1. Purpose / Scope

돌산대교(`dolsan_daegyo`) SOUL Phase 1 Minimal 구현의 Closure Evidence 기록.

**Phase 1 Minimal 범위 (Option A-1):**
- DB-1: `_PLACE_KNOWLEDGE.dolsan_daegyo.experience_ko` — Founder 승인 문구 반영
- 기존 PLACE_LOOKUP 경로 재사용 (`_buildPlaceLookupMessage` — lines 495-497 preference 활용)
- 신규 테스트 파일: `tests/soul/soulDolsanBridgePhase1.test.js`

**Phase 1 제외 (Founder Decision):**
- LDF 분기 신규 추가
- PSQ 라우팅 변경
- JOURNEY_PREFERENCE 처리
- R20 수정 (`_extractGoldenPlaceCode` dolsan_daegyo 미인식)
- Companion Chip / parking_trust 변경
- DB · Schema · 환경변수 변경

---

## 2. Founder Authorization

| 결정 항목 | 내용 | 날짜 |
|---|---|---|
| Discovery 승인 | 읽기 전용 Discovery | 2026-10-18 |
| experience_ko 문구 | Founder 직접 작성 문구 승인 | 2026-10-18 |
| Phase 범위 | Option A-1 Minimal | 2026-10-18 |
| Implementation 승인 | DB-1 (experience_ko) + 테스트 + PR OPEN | 2026-10-18 |
| Squash Merge 승인 | G-1~G-5 조건부 (PRE-MERGE GATE) | 2026-10-18 |
| Production Deploy 승인 | Render `srv-d3kt93b3fgac73a3nt1g` + SHA `3fb07234` | 2026-10-18 |
| Runtime QA 승인 | P-1~P-3 + ISO-1~5 + A-1~4 + R20 | 2026-10-18 |
| Closure Documentation 승인 | Evidence 문서 + Project State + Docs-only PR | 2026-10-18 |

---

## 3. SSOT Alignment

| 항목 | 내용 |
|---|---|
| 감정 역할 | 흐름 · 전환 |
| 핵심 경험 | 여수 시내와 돌산도를 잇는 다리, 한쪽에서 다른 쪽으로 이어지는 흐름과 전환의 공간 |
| LDF 분기 | 없음 (Phase 1 Minimal — PLACE_LOOKUP 경로만 사용) |
| PSQ 라우팅 보조 | fit_ko / unknown_boundary (데이터 존재) |
| 격리 원칙 | dolsan_daegyo 변경이 타 장소 오염 없음 (ISO-1~5 PASS) |

**Founder 승인 `experience_ko` (정확 원문):**

> 돌산대교는 여수 시내와 돌산도를 이어주는 다리예요. 밤이 되면 다리 위의 불빛과 바다가 어우러져 여수의 풍경을 조금 다르게 느낄 수 있어요. 한쪽에서 다른 쪽으로 이어지는 길을 바라보며, 마음도 천천히 다음 순간으로 넘어가는 시간을 가져보세요.

---

## 4. Implementation Evidence

### DB-1 — `_PLACE_KNOWLEDGE.dolsan_daegyo.experience_ko`

`services/soyeowoolService.js` line 300:

```js
experience_ko: '돌산대교는 여수 시내와 돌산도를 이어주는 다리예요. 밤이 되면 다리 위의 불빛과 바다가 어우러져 여수의 풍경을 조금 다르게 느낄 수 있어요. 한쪽에서 다른 쪽으로 이어지는 길을 바라보며, 마음도 천천히 다음 순간으로 넘어가는 시간을 가져보세요.',
```

이전 값: `'여수 시내와 돌산도를 잇는 다리예요. 케이블카 돌산역(놀아) 가까이에 있어요. 돌산공원에서 야경으로 보기 좋아요. 미남크루즈와 이사부크루즈 코스에서도 볼 수 있어요.'`

**변경 이유:** 이전 값에 미검증 표현 `(놀아)` 포함, Founder 직접 작성 경험 문구로 교체.

### PLACE_LOOKUP 경로 동작

`_buildPlaceLookupMessage` (line 483):
- lines 495-497: `_PLACE_KNOWLEDGE[code].experience_ko` 존재 시 우선 사용 (기존 로직, 변경 없음)
- P-1 (alias+어때요): MEDIUM_LOOKUP → PLACE_LOOKUP → experience_ko 반환
- P-2 (context-only 어때요): EXPLICIT_CONTEXT promotion (lines 2158-2169) → PLACE_LOOKUP → experience_ko 반환

---

## 5. Code PR / Merge Evidence

| 항목 | 값 |
|---|---|
| PR URL | https://github.com/ys6448761-hue/daily-miracles-app/pull/81 |
| PR Title | feat(soul): dolsan bridge phase1 minimal experience copy |
| PR State | MERGED |
| Merge Method | Squash |
| PR HEAD SHA | `fadb77a069fe7f3555dccd9467c33645974a908e` |
| Merge Commit SHA | `3fb07234701c6ae4cbae004b6ac916610d40d0df` |
| Merge Timestamp | 2026-10-18T06:26:14Z (KST 15:26:13) |
| Changed Files | `services/soyeowoolService.js` (+1 / -1) · `tests/soul/soulDolsanBridgePhase1.test.js` (+285) |

---

## 6. CI Gate Evidence

| Gate | 결과 | Run ID |
|---|---|---|
| AIL Gate | PASS | `39102238461` (HEAD `fadb77a`) |
| docker-smoke | PASS | `39102077630` (HEAD `fadb77a`) |
| Vercel | PRE-EXISTING FAIL (non-blocking) | — |
| 신규 Phase 1 테스트 | 15/15 PASS | local + CI |
| Manifest & Index | 0 errors · 3 pre-existing warnings | — |
| Regression | 신규 회귀 0건 | — |

---

## 7. Render Production Evidence

| 항목 | 값 |
|---|---|
| Service ID | `srv-d3kt93b3fgac73a3nt1g` |
| Deploy ID | `dep-dba6jpvbtjjs73e0b5fg` |
| Actual Live SHA | `3fb07234701c6ae4cbae004b6ac916610d40d0df` |
| Deploy Status | LIVE |
| Deploy Time | 2026-10-18 15:43 KST |
| Production URL | https://app.dailymiracles.kr |
| Endpoint Health | HTTP 201 Bootstrap 정상 |

---

## 8. Production Runtime QA Evidence

**QA Script:** `tmp/qa_dolsan_bridge_phase1.js`
**Executed:** 2026-10-18 KST (session)
**Bootstrap sowon_id:** `2e36cb73-9f2f-4bb4-8961-b58ebdd5fe28`

| Case | 입력 | Context | 실제 decision | 결과 |
|---|---|---|---|---|
| P-1 | 돌산대교 어때요? | dolsan_daegyo | PLACE_LOOKUP | **PASS** — Founder experience_ko 포함, "놀아" 없음 |
| P-2 | 어때요? | dolsan_daegyo | PLACE_LOOKUP | **PASS** — context-only 경로, experience_ko 동일 반환 |
| P-3 | 돌산대교는 어떤 곳이야? | dolsan_daegyo | PLACE_LOOKUP | **PASS** — "돌산도" 포함, R19 조건 충족 |
| ISO-1 | 돌산공원 어때요? | dolsan_nightscape | PLACE_LOOKUP | **PASS** — 기존 문구 유지, dolsan_daegyo 오염 없음 |
| ISO-2 | 케이블카 어때요? | cablecar | PLACE_LOOKUP | **PASS** — cablecar 고유 응답 유지 |
| ISO-3 | 오동도 어때요? | odongdo | PLACE_LOOKUP | **PASS** — odongdo 고유 응답 유지 |
| ISO-4 | 향일암 어때요? | hyangiram | PLACE_LOOKUP | **PASS** — hyangiram 고유 응답 유지 |
| ISO-5 | 이순신광장 어때요? | lee_soon_shin_plaza | PLACE_LOOKUP | **PASS** — 이순신광장 고유 응답 유지 |
| A-1 | 돌산대교 누구랑 가면 좋아? | dolsan_daegyo | PLACE_SPECIFIC_QUERY | **PASS** — fit_ko 응답: "야경 감상 동선에 포함돼요. 크루즈에서도 볼 수 있어요." |
| A-2 | 돌산대교 다음에 어디 가면 좋을까? | dolsan_daegyo | PARTIAL | **PASS** — Journey 경로 정상, experience_ko 미혼입 |
| A-3 | 돌산대교 입장료 얼마야? | dolsan_daegyo | PLACE_SPECIFIC_QUERY | **PASS** — admission null → honest fallback ("요금 정보를 정확하게 알고 있지 않아요") |
| A-4 | 향일암 어때? | dolsan_daegyo | PLACE_LOOKUP | **PASS** — 향일암 문맥 전환 정상 |
| R20 | 돌산대교 걸어서 건너갈 수 있어? | dolsan_daegyo | JOURNEY_CONTINUITY | **PRE-EXISTING FAIL** — 기존 Baseline 동일 라우팅, 신규 위험 응답 없음 |

**Total: 13/13 PASS (R20 별도 기록)**
**신규 Production 회귀: 0건**

---

## 9. Known Pre-existing Issues

### R20 — PRE-EXISTING FAIL / UNRESOLVED

- **입력:** "돌산대교 걸어서 건너갈 수 있어?"
- **실제 routing:** JOURNEY_CONTINUITY (예상: PLACE_SPECIFIC_QUERY)
- **원인:** `_isPlaceSpecificQuery` "건너" 미매칭 → `_detectJourneyDecisionType` → `_extractGoldenPlaceCode` dolsan_daegyo 미인식
- **Phase 1 제외:** Founder 결정 — Phase 1 범위 밖
- **Phase 2 후보:** `_extractGoldenPlaceCode` dolsan_daegyo 인식 추가

---

## 10. Governance Compliance

| 항목 | 상태 |
|---|---|
| 변경 파일 수 | 2 (승인 범위 일치) |
| 코드 변경 | `experience_ko` 문자열 1건 교체만 |
| 신규 LDF 분기 | 없음 |
| 라우팅 변경 | 없음 |
| DB / Schema / Environment | 변경 없음 |
| 다른 장소 경험 문구 | 변경 없음 |
| R20 수정 | NOT PERFORMED |
| GitHub Issue 생성 | NONE |
| SSOT 변경 | NONE |
| 기존 CLOSED 항목 상태 변경 | NONE |

---

## 11. Closure Verdict

**`CLOSED — DEPLOYED_AND_VERIFIED (R20 PRE-EXISTING FAIL TRACKED)`**

이 판정은 Production 기능 검증에 대한 결론이다.

Closure 문서 PR은 별도 Founder Squash Merge 승인 후 반영된다.

---

## 12. Handover

- **다음 단계:** Closure Docs-only PR Squash Merge → DREAMTOWN_STATUS.md 최종 반영
- **R20 Phase 2 후보:** `_extractGoldenPlaceCode` dolsan_daegyo 인식 + PSQ 응답 개선
- **Dolsan Bridge Phase 2:** explicit_context.place_code 기반 JOURNEY_PREFERENCE 처리 (Founder 별도 승인 필요)
