# SOUL 하멜등대 Phase 1 Minimal — Closure Evidence V1

**Status:** CLOSED — DEPLOYED_AND_VERIFIED  
**Date:** 2026-10-19  
**Place Code:** `hamel_lighthouse`  
**Emotional Role:** 연결 / 공명  
**Production SHA:** `8c4c07fcf2e5735d9a9abe87dca5bda7b785c9e6`  
**Deploy ID:** `dep-dbaqqkfbtjjs73886i9g`  
**Production LIVE:** 2026-10-19 14:43 KST

---

## 1. Purpose / Scope

하멜등대(`hamel_lighthouse`) SOUL Phase 1 Minimal 구현의 Closure Evidence 기록.

**Phase 1 Minimal 범위:**
- HML-1: `PLACE_ALIAS_MAP['하멜등대'] = 'hamel_lighthouse'` — 독립 place_code 등록
- HML-2: `_PLACE_KNOWLEDGE.hamel_lighthouse` — experience_ko + emotional_role + unknown_boundary
- HML-3: `_buildPlaceSpecificQueryPayload` 내 `hamel_lighthouse` 전용 "어때요" LDF 분기 (HML-1)
- HML-4: hamel_lighthouse scope guard — marine_park 분기 조건에 `code === 'marine_park'` 추가
- HML-5: `_CONV_GOLDEN_KO['hamel_lighthouse'] = '하멜등대'` — 다중 턴 컨텍스트
- HML-6: `_extractGoldenPlaceCode` — "하멜등대" 키워드 → `hamel_lighthouse` 반환
- HML-7: Production DB — `travel_places` 테이블 `hamel_lighthouse` 행 등록 (id=15)
- HML-8: `database/seeds/001_travel_places.sql` — STANDALONE Seed 행 추가

**Phase 1 제외:**
- JOURNEY_PREFERENCE hamel_lighthouse 분기
- Companion Chip 변경
- parking / weather / hours / admission 정보 (미검증)
- Level B emotional continuity 확장
- EP02 달빛 항로
- R20 / P-2 / P-6 수정

---

## 2. Founder Decisions

| 결정 항목 | 내용 | 날짜 |
|---|---|---|
| Q1 (독립 place_code) | `hamel_lighthouse`를 `marine_park` 별칭이 아닌 독립 장소로 등록 | 2026-10-19 |
| Q2 (experience_ko 문구) | 하멜등대 공식 문구 Founder 직접 승인 (아래 참조) | 2026-10-19 |
| Q3 (운영 정보 격리) | 하멜전시관(061-659-5706, 09:00~18:00, 월요일 휴무)을 하멜등대 정보로 복사 금지 | 2026-10-19 |
| Q4 (미검증 정보 금지) | 전화번호·운영시간·입장료 사실값 생성·안내 금지 | 2026-10-19 |
| Q5 (공식 좌표 출처) | 여수지방해양수산청 공식(yeosu.mof.go.kr) — lat=34.73644, lng=127.74710 VERIFIED | 2026-10-19 |
| Seed Evidence | zone_code=NULL (W-4 star zone 미등록), trust_level=VERIFIED | 2026-10-19 |
| Implementation 승인 | HML-1~8 구현 + PR #88 | 2026-10-19 |
| Squash Merge 승인 | AIL Gate / docker-smoke PASS 확인 후 | 2026-10-19 |
| Production DB INSERT 승인 | id=15 단일 행 INSERT + COMMIT (14/14 필드 Seed 일치) | 2026-10-19 |
| Production Deploy 승인 | Render `srv-d3kt93b3fgac73a3nt1g` + SHA `8c4c07f` | 2026-10-19 |
| Runtime QA 승인 | QA-1~QA-10 Production QA | 2026-10-19 |
| Closure Documentation 승인 | Evidence 문서 + Project State + Docs-only PR | 2026-10-19 |

---

## 3. SSOT Alignment

| 항목 | 내용 |
|---|---|
| emotion_primary | `connection` — 하멜등대 = 연결 (여정 정리, 감정 공명, 별 연결, 별천지) |
| emotion_tags | `['resonance', 'memory', 'wish']` |
| 핵심 경험 | 여수 바다를 바라보며 마음을 가다듬고, 소원을 품고 희망을 바라보는 별빛 항로의 중요한 장소 |
| PSQ 라우팅 | 미검증 정보 미포함 — 운영시간·전화번호·입장료 PSQ 무응답 |
| 격리 원칙 | 하멜전시관 PSQ가 hamel_lighthouse 컨텍스트에 노출되지 않음 (scope guard) |
| 독립성 | PLACE_ALIAS_MAP에서 marine_park와 완전 분리 |

**Founder 승인 `experience_ko` (확정 원문, Q2 2026-10-19):**

> 하멜등대는 여수 바다를 바라보며 잠시 마음을 가다듬을 수 있는 장소예요. DreamTown에서는 소원을 품고 다시 희망을 바라보는 별빛 항로의 중요한 장소예요.

---

## 4. Implementation Evidence

### HML-1 — `PLACE_ALIAS_MAP`

`services/soyeowoolService.js` (PLACE_ALIAS_MAP section):

```js
'하멜등대': 'hamel_lighthouse',
```

### HML-2 — `_PLACE_KNOWLEDGE.hamel_lighthouse`

`services/soyeowoolService.js` (after dolsan_daegyo block):

```js
// ── hamel_lighthouse — Phase 1 Minimal (2026-10-19) ─────────────────────────
// Operational info (phone/hours/admission) UNVERIFIED — not included.
// experience_ko: Founder-approved Q2 text (2026-10-19).
hamel_lighthouse: {
  experience_ko: '하멜등대는 여수 바다를 바라보며 잠시 마음을 가다듬을 수 있는 장소예요. DreamTown에서는 소원을 품고 다시 희망을 바라보는 별빛 항로의 중요한 장소예요.',
  emotional_role: '연결 / 공명',
  unknown_boundary: '운영 및 접근 세부 정보는 현장에서 확인해주세요.',
},
```

### HML-3 — "어때요" LDF 분기 (HML-1 scope)

`services/soyeowoolService.js` (after marine_park "어때요" branch):

```js
// Hamel Lighthouse "어때요" — hamel_lighthouse-scoped (HML-1)
else if (code === 'hamel_lighthouse' && /어때요/.test(msg)) {
  if (knowledge.experience_ko) answer = knowledge.experience_ko;
}
```

### HML-4 — Hamel branch scope guard

`services/soyeowoolService.js` (marine_park PSQ branch condition):

```js
// scope guard: hamel_lighthouse is an independent place; its context must not enter this branch.
else if (code === 'marine_park' && /(하멜전시관|하멜 전시관|하멜|네덜란드|전시관)/.test(msg)) {
```

**변경 이유:** 기존 조건에 `code === 'marine_park'` 추가. hamel_lighthouse 컨텍스트에서 "하멜" 키워드가 하멜전시관 PSQ 분기에 진입하는 것을 방지.

### HML-5 — `_CONV_GOLDEN_KO`

```js
hamel_lighthouse: '하멜등대',
```

### HML-6 — `_extractGoldenPlaceCode`

```js
if (/하멜등대/.test(message)) return 'hamel_lighthouse';
```

### HML-7 — Production DB INSERT

| 필드 | 값 |
|---|---|
| id | 15 |
| code | hamel_lighthouse |
| zone_code | NULL |
| country_code | KR |
| city_code | YEOSU |
| name_ko | 하멜등대 |
| name_en | Hamel Lighthouse |
| address | 전라남도 여수시 종화동 458-7 |
| lat | 34.73644 |
| lng | 127.74710 |
| indoor_outdoor | outdoor |
| avg_stay_minutes | NULL |
| suitable_for | NULL |
| weather_suitable | NULL |
| emotion_primary | connection |
| emotion_tags | {resonance,memory,wish} |
| origin_seed_id | NULL |
| trust_level | VERIFIED |

**Source:** 여수지방해양수산청 공식 (yeosu.mof.go.kr) — lat/lng VERIFIED 2026-10-19

### HML-8 — Seed SQL (`database/seeds/001_travel_places.sql`)

```sql
-- STANDALONE (1/1) — 별도 star_zone 없음, 원도심 권역
-- Evidence: 여수지방해양수산청 공식 (yeosu.mof.go.kr) — lat/lng VERIFIED 2026-10-19
('hamel_lighthouse', NULL, 'KR', 'YEOSU',
 '하멜등대', 'Hamel Lighthouse', '전라남도 여수시 종화동 458-7', 34.7364400, 127.7471000,
 'outdoor', NULL,
 NULL,
 NULL,
 'connection', ARRAY['resonance', 'memory', 'wish']::text[],
 NULL, 'VERIFIED');
```

---

## 5. CI / Guardian Evidence

### 단위 테스트 — 26/26 PASS (신규)

**파일:** `tests/unit/soulHamelLighthousePhase1.test.js`

| 그룹 | 건수 | 검증 내용 |
|---|---|---|
| HML-E (experience_ko 검증) | 6 | Founder Q2 문구 정확 일치·전화번호/운영시간/입장료 미포함·하멜전시관 미언급 |
| HML-1 ("하멜등대 어때요?") | 4 | LDF_PSQ 경로·experience_ko 반환·verifyNote 미포함 |
| HML-2 (PLACE_ALIAS_MAP) | 2 | `'하멜등대'` → `hamel_lighthouse` (not marine_park) |
| HML-3 ("어떤 곳이야?") | 1 | experience_ko 반환 |
| HML-4 (미검증 정보 미노출) | 3 | 전화번호·운영시간·입장료 사실값 미생성 |
| HML-N1 (scope guard) | 3 | hamel_lighthouse 컨텍스트 → hamel_hours_ko 미노출 / marine_park "하멜" → hamel_hours_ko 정상 |
| HML-N2 (Level B 격리) | 1 | "이어지는 여정" 문장 미노출 |
| GPC-1~3 (_extractGoldenPlaceCode) | 3 | "하멜등대" → hamel_lighthouse |
| ISO-1~3 (격리) | 3 | marine_park / cablecar / odongdo "어때요" 미오염 |
| **합계** | **26** | **PASS** |

### 회귀 테스트 — 295/295 PASS

| 파일 | 건수 | 결과 |
|---|---|---|
| soulMarineParkPhase1.test.js | 27 | PASS |
| soulCablecarPhase1.test.js | 52 | PASS |
| soulDolsanParkPhase1.test.js | 33 | PASS |
| soulDolsanBridgePhase1.test.js | 15 | PASS |
| soulLevelBEmotionalContinuity.test.js | 14 | PASS |
| soulHyangiramPhase1.test.js | 66 | PASS |
| soulOdongdoPhase1.test.js | 57 | PASS |
| soulYisunsinPhase2.test.js | 31 | PASS (일부 파일 명 변동) |

**합계: 321/321 PASS (신규 26 + 회귀 295)**

### CI Gate (PR #88 pre-merge)

| Gate | 결과 | 비고 |
|---|---|---|
| AIL Gate | PASS | `[AIL]` 섹션 + ` ```ail ``` ` 블록 포함 |
| docker-smoke | PASS | — |
| Vercel deployments | FAIL (pre-existing) | Render.com 운영과 무관 |

---

## 6. Production Deploy Evidence

| 항목 | 내용 |
|---|---|
| Render Service | `srv-d3kt93b3fgac73a3nt1g` |
| Production URL | https://app.dailymiracles.kr |
| Code PR #88 Squash Merge SHA | `8c4c07fcf2e5735d9a9abe87dca5bda7b785c9e6` |
| Deploy ID | `dep-dbaqqkfbtjjs73886i9g` |
| Deploy 완료 시각 | 2026-10-19 14:43 KST |
| 승인 SHA 일치 | ✓ (8c4c07f = Squash Merge SHA) |
| Production DB id=15 | COMMITTED (VERIFIED 2026-10-19) |

---

## 7. Production Runtime QA Matrix

**실행 시각:** 2026-10-19 (Production LIVE 14:43 이후)  
**스크립트:** `tmp/qa_hamel_lighthouse_phase1.js`  
**최종 분류:** 10/10 PASS / 0 ADVISORY / 0 신규 회귀

| ID | 입력 | place_code | Production Decision | 결과 |
|---|---|---|---|---|
| QA-1 | "하멜등대 어때요?" | hamel_lighthouse | PLACE_LOOKUP | **PASS** — "여수 바다를 바라보며" + "별빛 항로" 포함 ✓ |
| QA-2 | "하멜등대 어떤 곳이야?" | hamel_lighthouse | PLACE_LOOKUP | **PASS** — experience_ko 반환 ✓ |
| QA-3 | "하멜등대 전화번호 알려줘" | hamel_lighthouse | PLACE_LOOKUP | **PASS** — 미검증 번호 생성 없음 ✓ |
| QA-4 | "하멜등대 운영시간 알려줘" | hamel_lighthouse | PLACE_LOOKUP | **PASS** — 미검증 시간 생성 없음 ✓ |
| QA-5 | "하멜등대 입장료 얼마야?" | hamel_lighthouse | PLACE_SPECIFIC_QUERY | **PASS** — "요금 정보를 정확하게 알고 있지 않아요" ✓ |
| QA-6 | "하멜전시관 몇 시에 열어?" | marine_park | PLACE_SPECIFIC_QUERY | **PASS** — 09:00~18:00 / 월요일 휴무 유지 ✓ |
| QA-7 | "하멜전시관 전화번호" | marine_park | PLACE_SPECIFIC_QUERY | **PASS** — 061-659-5706 유지 ✓ |
| QA-8 | "종포해양공원 어때요?" | marine_park | PLACE_LOOKUP | **PASS** — marine_park experience_ko 기존 동작 유지 ✓ |
| QA-9 | "케이블카 어때요?" | cablecar | PLACE_LOOKUP | **PASS** — cablecar experience_ko 기존 동작 유지 ✓ |
| QA-10 | "하멜등대 어때요?" (Level B) | hamel_lighthouse | PLACE_LOOKUP | **PASS** — "이어지는 여정" 미노출 ✓ |

**격리 확인:**
- QA-3/4/5: 하멜등대 컨텍스트에서 하멜전시관 운영정보(전화/시간) 미노출
- QA-6/7: marine_park 컨텍스트에서 하멜전시관 기존 PSQ 정상 동작 유지
- QA-10: Level B 확장 없음 — hamel_lighthouse는 QUALITY_CONFIRMED_FINAL 5개 장소에 미포함

---

## 8. Unresolved Pre-existing Issues (미접촉)

| 항목 | 분류 | 상태 |
|---|---|---|
| R20: dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY | PRE-EXISTING FAIL | UNRESOLVED |
| P-2: "돌산공원 주차 어때?" → PLACE_LOOKUP (parking_ko 미도달) | PRE-EXISTING ADVISORY | UNRESOLVED |
| P-6: 케이블카 weather_ko PSQ 미매칭 (Issue #76) | PRE-EXISTING ADVISORY | UNRESOLVED |

이번 PR #88에서 위 항목은 미접촉. 신규 회귀 없음.

---

## 9. Non-Goals / Explicit Exclusions

| 항목 | 이유 |
|---|---|
| 하멜등대 운영시간·전화번호·입장료 | 미검증 — 사실값 생성 금지 |
| 하멜전시관 정보 → 하멜등대 전용 응답 복사 | Q3 결정 — 별도 시설, 격리 필수 |
| JOURNEY_PREFERENCE hamel_lighthouse | Phase 1 범위 외 |
| Companion Chip 변경 | Phase 1 범위 외 |
| Level B emotional continuity 확장 | CLOSED — QUALITY_CONFIRMED_FINAL 유지 |
| EP02 달빛 항로 | Founder 결정 보류 |
| R20 / P-2 / P-6 수정 | PRE-EXISTING, 별도 결정 필요 |
| DB · Schema · 환경변수 변경 | 미승인 |

---

## 10. Closure Recommendation

**CLOSED — DEPLOYED_AND_VERIFIED**

- QA-1~10 10/10 PASS
- experience_ko Founder 승인 문구(Q2) 정확 반영
- 미검증 운영 정보(전화/시간/입장료) 미노출 확인
- 하멜전시관 PSQ 기존 동작 유지 (marine_park 격리)
- Level B 격리 유지 (QUALITY_CONFIRMED_FINAL 5개 장소 불변)
- 신규 회귀 0건
- Production DB id=15 COMMITTED / lat·lng 여수지방해양수산청 공식 확인
- R20 / P-2 / P-6: PRE-EXISTING, 미해결 상태 유지

---

## 11. Open Follow-ups

| 항목 | 분류 | 우선순위 |
|---|---|---|
| 여수 SOUL Phase 1 9·10번째 장소 결정 | 신규 후보 | Founder 다음 장소 결정 (8/10 완료) |
| hamel_lighthouse star zone 등록 (W-4 후보) | 별 클러스터 | 별도 거버넌스 결정 필요 |
| R20 dolsan_daegyo JOURNEY_CONTINUITY | PRE-EXISTING FAIL | Founder 결정 필요 |
| P-2 parking_ko PSQ 라우팅 | PRE-EXISTING ADVISORY | Founder 결정 필요 |
| P-6 weather_ko PSQ 미매칭 (Issue #76) | PRE-EXISTING ADVISORY | Founder 결정 필요 |
| EP02 달빛 항로 | 보류 | Founder 결정 필요 |

---

## 12. Evidence References

| 항목 | 경로 / SHA |
|---|---|
| Code PR | PR #88 |
| Squash Merge SHA | `8c4c07fcf2e5735d9a9abe87dca5bda7b785c9e6` |
| Deploy ID | `dep-dbaqqkfbtjjs73886i9g` |
| 단위 테스트 | `tests/unit/soulHamelLighthousePhase1.test.js` |
| QA 스크립트 | `tmp/qa_hamel_lighthouse_phase1.js` |
| Seed SQL | `database/seeds/001_travel_places.sql` |
| Marine Park Phase 1 Evidence | `docs/architecture/SOUL_MARINE_PARK_PHASE1_CLOSURE_EVIDENCE_V1.md` |
| Dolsan Bridge Phase 1 Evidence | `docs/architecture/SOUL_DOLSAN_BRIDGE_PHASE1_CLOSURE_EVIDENCE_V1.md` |
| Dolsan Park Phase 1 Evidence | `docs/architecture/SOUL_DOLSAN_PARK_PHASE1_CLOSURE_EVIDENCE_V1.md` |
| Level B Closure Evidence | `docs/architecture/SOUL_LEVEL_B_EMOTIONAL_CONTINUITY_CLOSURE_EVIDENCE_V1.md` |
| 좌표 출처 | 여수지방해양수산청 공식 (yeosu.mof.go.kr), 2026-10-19 VERIFIED |
