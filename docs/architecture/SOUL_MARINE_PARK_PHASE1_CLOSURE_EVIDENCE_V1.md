# SOUL 종포해양공원 Phase 1 Minimal — Closure Evidence V1

**Status:** CLOSED — DEPLOYED_AND_VERIFIED  
**Date:** 2026-10-19  
**Place Code:** `marine_park`  
**Emotional Role:** 쉼 / 정리·고요함  
**Production SHA:** `11fac2c21e2393128100f24e59579a42ff52cb64`  
**Deploy ID:** `dep-dbapag61egvs73bjo1l0`  
**Production LIVE:** 2026-10-19 13:00 KST

---

## 1. Purpose / Scope

종포해양공원(`marine_park`) SOUL Phase 1 Minimal 구현의 Closure Evidence 기록.

**Phase 1 Minimal 범위:**
- MRP-1: `_PLACE_KNOWLEDGE.marine_park.experience_ko` — Founder 승인 문구 교체
- MRP-2: `_buildPlaceSpecificQueryPayload` 내 `marine_park` 전용 "어때요" LDF 분기
- MRP-3: 하멜전시관 PSQ 분기(`hamel_hours_ko`) — hours 분기 앞으로 이동 (routing fix)

**Phase 1 제외:**
- JOURNEY_PREFERENCE marine_park 분기
- Companion Chip 동작 변경
- parking 변경
- 하멜등대 별칭 추가 (독립 장소 후보)
- DB · Schema · 환경변수 변경

---

## 2. Founder Decisions

| 결정 항목 | 내용 | 날짜 |
|---|---|---|
| Q1 (experience_ko 문구) | 미검증 수치(1.5km·크루즈 경유) 제거, VERIFIED 하멜전시관 위치 유지 | 2026-10-19 |
| Q2 (하멜등대 별칭) | marine_park 별칭에 추가하지 않음 — 독립 장소 후보로 분리 | 2026-10-19 |
| Q3 (하멜전시관 PSQ) | Phase 1에 포함 — 시설명 명시, phone_hamel(061-659-5706) 사용 | 2026-10-19 |
| Scope Audit (`WITHIN_INTENT_BUT_SCOPE_EXPANDED`) | hamel 분기 위치 이동을 Q3 이행에 필수적인 구조 변경으로 수용 | 2026-10-19 |
| Implementation 승인 | MRP-1~3 구현 + PR #86 | 2026-10-19 |
| Squash Merge 승인 | AIL Gate / docker-smoke / Verify Manifest PASS 확인 후 | 2026-10-19 |
| Production Deploy 승인 | Render `srv-d3kt93b3fgac73a3nt1g` + SHA `11fac2c` | 2026-10-19 |
| Runtime QA 승인 | QA-1~QA-10 Production QA | 2026-10-19 |
| Closure Documentation 승인 | Evidence 문서 + Project State + Docs-only PR | 2026-10-19 |

---

## 3. SSOT Alignment

| 항목 | 내용 |
|---|---|
| 감정 역할 | 쉼 / 정리·고요함 |
| 핵심 경험 | 바다를 따라 산책할 수 있는 해안 공원, 하멜전시관 위치 안내 |
| PSQ 라우팅 | hamel_hours_ko / admission_ko / fit_ko (데이터 존재) |
| 격리 원칙 | marine_park 분기 타 장소 오염 없음 |

**Founder 승인 `experience_ko` (확정 원문):**

> 바다를 따라 산책할 수 있는 해안 공원이에요. 공원 안에 하멜전시관이 있어요.

**교체 전 값 (미검증 수치 포함):**

> 1.5km 산책로가 있는 해안 공원이에요. 공원 안에 하멜전시관이 있어요. 미남크루즈와 이사부크루즈 코스도 이곳을 지나가요.

---

## 4. Implementation Evidence

### MRP-1 — `_PLACE_KNOWLEDGE.marine_park.experience_ko`

`services/soyeowoolService.js` line 295 (approx.):

```js
// Before
experience_ko: '1.5km 산책로가 있는 해안 공원이에요. 공원 안에 하멜전시관이 있어요. 미남크루즈와 이사부크루즈 코스도 이곳을 지나가요.',

// After (Founder 2026-10-19 확정)
experience_ko: '바다를 따라 산책할 수 있는 해안 공원이에요. 공원 안에 하멜전시관이 있어요.',
```

### MRP-2 — `marine_park` "어때요" LDF 분기

`services/soyeowoolService.js` lines 1316–1319 (approx.):

```js
// Marine Park "어때요" — marine_park-scoped (MRP-1)
else if (code === 'marine_park' && /어때요/.test(msg)) {
  if (knowledge.experience_ko) answer = knowledge.experience_ko;
}
```

### MRP-3 — 하멜전시관 PSQ 분기 위치 이동 (hours 분기 앞으로)

**이동 전 위치:** stairs 분기(계단/우회) 이후 (~line 1293)  
**이동 후 위치:** photo zone 블록 직후, hours 분기 이전 (~line 1254)

```js
// Hamel Exhibition Hall — marine_park specific.
// Must precede the general hours branch: when hours_ko is null (marine_park), the hours else-clause
// would shadow hamel_hours_ko responses for queries containing "열어" etc.
else if (/(하멜전시관|하멜 전시관|하멜|네덜란드|전시관)/.test(msg)) {
  if (knowledge.hamel_hours_ko) {
    const hamelPhone = knowledge.phone_hamel || knowledge.phone;
    const hamelVerify = hamelPhone
      ? `\n\n정확한 정보는 ${hamelPhone}에 문의하시거나 현장에서 확인해보세요.`
      : '\n\n현장에서 직원에게 문의해보세요.';
    answer = knowledge.hamel_hours_ko + hamelVerify;
  } else if (knowledge.experience_ko) {
    answer = knowledge.experience_ko + verifyNote;
  }
}
```

**이동 이유:** `marine_park`의 `hours_ko: null`로 인해, "열어" 키워드 포함 메시지가 hours 분기 else-절에 선점되어 `hamel_hours_ko` 응답에 도달 불가. Q3(하멜전시관 PSQ 포함) 이행을 위해 구조적으로 필수.

**Scope Audit 판정:** `WITHIN_INTENT_BUT_SCOPE_EXPANDED` — 코드 내용(조건·응답 형식) 동일, 위치만 변경. 회귀 114/114 PASS 확인. Founder 수용.

**하멜전시관 vs 하멜등대 구분:**
- `phone_hamel: '061-659-5706'` → 하멜전시관(종포해양공원 내) 전화번호
- 하멜등대는 `PLACE_ALIAS_MAP` 미등록, marine_park 별칭 아님, 독립 장소 후보
- QA-8 확인: "하멜등대 어때요?" → CLARIFICATION (marine_park 오매핑 없음)

---

## 5. CI / Guardian Evidence

### 단위 테스트 — 27/27 PASS (신규)

**파일:** `tests/unit/soulMarineParkPhase1.test.js`

| 그룹 | 건수 | 검증 내용 |
|---|---|---|
| MRP-E (experience_ko 검증) | 6 | Founder 문구 정확 일치·미검증 수치 없음·하멜전시관 포함 |
| MRP-1 (종포해양공원 어때요) | 4 | LDF_PSQ 경로·experience_ko 반환·verifyNote 미포함 |
| MRP-2 (해양공원 별칭) | 3 | 별칭 매핑·동일 응답 |
| MRP-3 (하멜전시관 운영시간) | 4 | hamel_hours_ko + phone_hamel 반환·hours fallback 미도달 |
| MRP-4 (하멜전시관 전화번호) | 2 | phone_hamel 존재 |
| MRP-5 (하멜전시관 입장료) | 2 | admission_ko (price 분기 우선) |
| MRP-6 (어떤 곳이야) | 1 | experience_ko |
| MRP-7 (누구랑 가면 좋아) | 1 | fit_ko |
| MRP-N1 (하멜등대 미매핑) | 1 | PLACE_ALIAS_MAP['하멜등대'] === undefined |
| MRP-N2 (Level B 격리) | 1 | JOURNEY_ADD 감정 연결 문구 미노출 |
| ISO-1~2 (격리) | 2 | dolsan_nightscape "어때요" 미오염·emotional_role 불변 |
| **합계** | **27** | **PASS** |

### 회귀 테스트 — 114/114 PASS

| 파일 | 건수 | 결과 |
|---|---|---|
| soulCablecarPhase1.test.js | 52 | PASS |
| soulDolsanParkPhase1.test.js | 33 | PASS |
| soulDolsanBridgePhase1.test.js | 15 | PASS |
| soulLevelBEmotionalContinuity.test.js | 14 | PASS |

**합계: 141/141 PASS**

### CI Gate (PR #86 pre-merge)

| Gate | 결과 | 시간 |
|---|---|---|
| AIL Gate | PASS | 53s |
| Verify Manifest & Index | PASS | 24s |
| docker-smoke | PASS | 30s |
| Vercel deployments | FAIL (pre-existing, Render.com 운영과 무관) | — |

---

## 6. Production Deploy Evidence

| 항목 | 내용 |
|---|---|
| Render Service | `srv-d3kt93b3fgac73a3nt1g` |
| Production URL | https://app.dailymiracles.kr |
| 배포 SHA | `11fac2c21e2393128100f24e59579a42ff52cb64` |
| Deploy ID | `dep-dbapag61egvs73bjo1l0` |
| Deploy 완료 시각 | 2026-10-19 13:00 KST |
| 승인 SHA 일치 | ✓ (11fac2c = Squash Merge SHA) |

---

## 7. Production Runtime QA Matrix

**실행 시각:** 2026-10-19 (Production LIVE 13:00 이후)  
**스크립트:** `tmp/qa_marine_park_phase1.js`  
**최종 분류:** 10/10 PASS / 0 ADVISORY / 0 신규 회귀

| ID | 입력 | place_code | Production Decision | 결과 |
|---|---|---|---|---|
| QA-1 | "종포해양공원 어때요?" | marine_park | PLACE_LOOKUP | **PASS** — Founder 승인 experience_ko 정확 반환 ✓ |
| QA-2 | "해양공원 어때요?" | marine_park | PLACE_LOOKUP | **PASS** — 별칭 매핑 정상 ✓ |
| QA-3 | "하멜전시관 몇 시에 열어?" | marine_park | PLACE_SPECIFIC_QUERY | **PASS** — 09:00~18:00, 월요일 휴무, phone_hamel 반환 ✓ |
| QA-4 | "하멜전시관 전화번호?" | marine_park | PLACE_SPECIFIC_QUERY | **PASS** — 061-659-5706 포함 ✓ |
| QA-5 | "하멜전시관 무료야?" | marine_park | PLACE_SPECIFIC_QUERY | **PASS** — 무료 안내 ✓ |
| QA-6 | "어떤 곳이야?" | marine_park | PLACE_LOOKUP | **PASS** — experience_ko 포함 ✓ |
| QA-7 | "누구랑 가면 좋아?" | marine_park | PLACE_SPECIFIC_QUERY | **PASS** — fit_ko 반환 ✓ |
| QA-8 | "하멜등대 어때요?" | (none) | **CLARIFICATION** | **PASS** — marine_park 오매핑 없음 ✓ |
| QA-9 | "종포해양공원 어때요?" | marine_park | PLACE_LOOKUP | **PASS** — "이어지는 여정" 문구 없음 (Level B 격리) ✓ |
| QA-10 | "케이블카 어때요?" (회귀) | cablecar | PLACE_LOOKUP | **PASS** — 케이블카 experience_ko 정상 반환 ✓ |

**QA-8 실제 응답:**
> 여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요.

decision: `CLARIFICATION` — "하멜등대"가 PLACE_ALIAS_MAP에 미등록되어 장소 인식 없이 명확화 요청. marine_park로 잘못 연결되지 않음 확인.

---

## 8. Unresolved Pre-existing Issues (미접촉)

| 항목 | 분류 | 상태 |
|---|---|---|
| R20: dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY | PRE-EXISTING FAIL | UNRESOLVED |
| P-2: "돌산공원 주차 어때?" → PLACE_LOOKUP (parking_ko 미도달) | PRE-EXISTING ADVISORY | UNRESOLVED |
| P-6: 케이블카 weather_ko PSQ 미매칭 (Issue #76) | PRE-EXISTING ADVISORY | UNRESOLVED |

이번 PR #86에서 위 항목은 미접촉. 신규 회귀 없음.

---

## 9. Non-Goals / Explicit Exclusions

| 항목 | 이유 |
|---|---|
| 하멜등대 별칭 추가 | Q2 결정 — 독립 장소 후보 분리 |
| JOURNEY_PREFERENCE marine_park | Phase 1 범위 외 |
| Companion Chip 변경 | Phase 1 범위 외 |
| parking 변경 | Phase 1 범위 외 |
| R20 / P-2 / P-6 수정 | PRE-EXISTING, 별도 결정 필요 |
| DB · Schema · 환경변수 변경 | 미승인 |
| Level B 재오픈 | CLOSED 유지 |

---

## 10. Closure Recommendation

**CLOSED — DEPLOYED_AND_VERIFIED**

- QA-1~10 10/10 PASS
- experience_ko Founder 승인 문구 정확 반영
- 하멜전시관 PSQ 정상 라우팅 (09:00~18:00, phone_hamel 061-659-5706)
- 하멜등대 marine_park 오매핑 없음 (QA-8 CLARIFICATION 확인)
- Level B 격리 유지
- 신규 회귀 0건
- R20 / P-2 / P-6: PRE-EXISTING, 미해결 상태 유지

---

## 11. Open Follow-ups

| 항목 | 분류 | 우선순위 |
|---|---|---|
| 하멜등대 독립 장소 Phase 1 | 신규 후보 | Founder 다음 장소 결정 |
| R20 dolsan_daegyo `_extractGoldenPlaceCode` 개선 | PRE-EXISTING FAIL | Founder 결정 필요 |
| P-2 parking_ko PSQ 라우팅 ("별칭+어때?" guard) | PRE-EXISTING ADVISORY | Founder 결정 필요 |
| P-6 weather_ko PSQ 미매칭 (케이블카, Issue #76) | PRE-EXISTING ADVISORY | Founder 결정 필요 |
| marine_park JOURNEY_PREFERENCE 분기 | Phase 2 후보 | Founder 결정 필요 |

---

## 12. Evidence References

| 항목 | 경로 / SHA |
|---|---|
| Code PR | https://github.com/ys6448761-hue/daily-miracles-app/pull/86 |
| Squash Merge SHA | `11fac2c21e2393128100f24e59579a42ff52cb64` |
| Deploy ID | `dep-dbapag61egvs73bjo1l0` |
| 단위 테스트 | `tests/unit/soulMarineParkPhase1.test.js` |
| QA 스크립트 | `tmp/qa_marine_park_phase1.js` |
| Dolsan Park Phase 1 Evidence | `docs/architecture/SOUL_DOLSAN_PARK_PHASE1_CLOSURE_EVIDENCE_V1.md` |
| Dolsan Bridge Phase 1 Evidence | `docs/architecture/SOUL_DOLSAN_BRIDGE_PHASE1_CLOSURE_EVIDENCE_V1.md` |
| Level B Closure Evidence | `docs/architecture/SOUL_LEVEL_B_EMOTIONAL_CONTINUITY_CLOSURE_EVIDENCE_V1.md` |
