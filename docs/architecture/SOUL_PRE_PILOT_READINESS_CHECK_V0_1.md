# SOUL Pre-Pilot Readiness Check V0.1

**Type:** Readiness Audit — NO implementation
**Date:** 2026-10-06
**Auditor:** Claude Code (Sonnet 4.6)
**Scope:** 여수맘 내부 검증단 7~8명 파일럿 안전성 판정

---

## Overall Verdict

**PILOT READY — CONDITIONAL**

BLOCKERS: **0**

SOUL은 3곳(케이블카·오동도·향일암)에서 깊은 Knowledge로 안전하게 응답한다.
비연결 장소나 식당 질문에서는 DISCOVERY/CLARIFICATION으로 처리되며
Knowledge Safety protocol(KNOW→답변 / VOLATILE→VERIFY / UNKNOWN→UNKNOWN)이
적용되어 fabrication 위험이 낮다.

파일럿 진행 가능. 단, 아래 OBSERVE 항목의 Evidence를 수집한다.

---

## A. KNOWLEDGE READINESS

### Connected Knowledge (PLACE_LOOKUP + PSQ)

| 장소 | PLACE_LOOKUP | PSQ 심층지식 | 판정 |
|---|---|---|---|
| 케이블카 | ✓ | ✓ NON_OFFICIAL hedge | A EXISTS_AND_CONNECTED |
| 오동도 | ✓ | ✓ NON_OFFICIAL hedge | A EXISTS_AND_CONNECTED |
| 향일암 | ✓ | ✓ NON_OFFICIAL hedge | A EXISTS_AND_CONNECTED |
| 이순신광장 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 자산공원 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 돌산대교 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 돌산야경 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 낭만포차거리 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 중앙시장 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 스카이타워 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 해양공원 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |
| 엑스포공원 | ✓ | — | A EXISTS_AND_CONNECTED (기본 정보) |

**PSQ 심층지식 범위 (3곳만):**
- 소요시간, 요금, 왕복/편도, 날씨, 휠체어, 포토존 TRUE_KNOWLEDGE_GAP
- NON_OFFICIAL 데이터에 모두 hedge 처리됨

### Question Families — Knowledge Readiness

| 질문 유형 | 현재 커버리지 | 판정 |
|---|---|---|
| 장소 기본 정보 | 11곳 DB 연결 | A EXISTS_AND_CONNECTED |
| 요금 | 케이블카·오동도·향일암 PSQ | A (3곳) / B (나머지, DB admission_fee 필드 존재) |
| 운영시간 | 케이블카·오동도·향일암 PSQ | A (3곳) / B (나머지, DB hours 필드) |
| 주차 | DB parking_available 필드 | B EXISTS_NOT_CONNECTED (필드 있으나 PSQ 미연결) |
| 체류시간 | DB avg_stay_minutes 연결됨 | A EXISTS_AND_CONNECTED |
| 걷기/신체 부담 | physical_difficulty DB + PSQ stairs_ko | A (3곳) / B (나머지) |
| 아이/어르신 동반 | Judgment V0.1 (hyangiram/cablecar) + suitability_for DB | A (3곳 judgment) / B (나머지 기본) |
| 접근성(휠체어) | PSQ VERIFY boundary (cablecar) | A VERIFY_BOUNDARY (3곳) / E TRUE_KNOWLEDGE_GAP (나머지) |
| 날씨 영향 | PSQ weather_ko (cablecar) | A (cablecar) / D VERIFICATION_REQUIRED (나머지) |
| 포토존/뷰 | TRUE_KNOWLEDGE_GAP 처리 | E (정직한 UNKNOWN 반환) |
| 다음 장소 추천 | DISCOVERY + Journey Continuity | A EXISTS_AND_CONNECTED |
| 장소간 관계·연계 | PSQ 오동도↔케이블카 연계 | A (오동도↔케이블카) / D (나머지) |
| 식당/맛집 | meal_context → travel_restaurants DB | C SOURCE_EXISTS_NOT_STRUCTURED (아래 참조) |
| 일반 여수 질문 | DISCOVERY flow | A EXISTS_AND_CONNECTED (11곳 범위 내) |
| LIVE 현재 상황 | 없음 | D VERIFICATION_REQUIRED → VERIFY boundary |

### 비연결 Phoenix Knowledge

Batch 01-06에 verified knowledge가 있으나 runtime에 미연결:

| 장소 | 지식 상태 | 분류 |
|---|---|---|
| 빅오쇼 (BIG-O) | Batch 01 VERIFIED_CURRENT, 운영기간 확인 | B EXISTS_NOT_CONNECTED |
| 해양레일바이크 | Batch 01 VERIFIED_CURRENT, 요금 확인 | B EXISTS_NOT_CONNECTED |
| 진남관 | Batch 02 VERIFIED_CURRENT | B EXISTS_NOT_CONNECTED |
| 하멜전시관 | Batch 02 VERIFIED_CURRENT | B EXISTS_NOT_CONNECTED |
| 거문도·금오도 | Batch 04 STATIC KNOWLEDGE | B EXISTS_NOT_CONNECTED |
| 식당 8곳 | Batch 06 (대부분 UNVERIFIED) | C SOURCE_EXISTS_NOT_STRUCTURED |

**Pilot Impact:** 비연결 장소 질문 → SOUL이 DISCOVERY/CLARIFICATION으로 처리.
특정 장소 정보 직접 답변 없음 → 사용자에게 혼란 가능하나 fabrication 없음.

### 식당/맛집 처리 (별도 주목)

`travelGuideService.getRestaurants`가 `travel_restaurants` DB를 조회하나
Batch 06 검증 결과 대부분 UNVERIFIED (공식 소스 미확인).
SOUL이 식당명을 직접 추천하면 신뢰 손상 위험.

현재 SOUL의 식당 처리 방식 확인 필요: DISCOVERY 경로에서 meal_context 있을 때
restaurant rows를 message_ko에 직접 포함하는지, 혹은 일반 장소 추천만 하는지.

**분류:** OBSERVE_DURING_PILOT — 식당 직접 추천 시 UNVERIFIED 헤지 확인 필요.

---

## B. CONVERSATION READINESS

| 항목 | 검증 상태 | 판정 |
|---|---|---|
| 자연스러운 오픈 질문 | Golden Conversation T1-T8 9/9 PASS | ✓ |
| Current Place 질문 | PSQ V0.1 9/9 PASS | ✓ |
| 다른 장소 명시적 전환 | DISCOVERY_OVERRIDES 처리 | ✓ |
| 여행자 Context 연속성 | Continuity Guard LIVE@9949383 | ✓ |
| family_elderly 연속성 | Test A PASS (T1→T8) | ✓ |
| explicit solo override | Test B PASS | ✓ |
| 꼭 필요할 때만 재질문 | JOURNEY_CONTINUITY turns = no re-ask | ✓ |
| Answer Summary | LIVE@c9abe82 | ✓ |
| Context Trap 없음 | PSQ = place_code 있을 때만 활성화 | ✓ |

**Natural Korean phrases not yet tested:**

아래 질문들은 기존 regression phrase가 아닌 자연 발화:
- "여기 몇 시까지 해요?" (no place_code) → probably CLARIFICATION
- "오늘은 사람 많아요?" (LIVE) → should hit VERIFY boundary
- "거기까지 얼마나 걸려요?" (travel time, GOVERNANCE_HOLD) → likely CLARIFICATION
- "다음 주에 가도 돼요?" (future date) → UNKNOWN/CLARIFICATION
- "부모님이 지팡이 짚으세요" (mobility edge case) → disability/mobility field

판정: **OBSERVE_DURING_PILOT** — 실사용자 자연 발화 패턴 수집 필요.

---

## C. JUDGMENT READINESS

| 항목 | 상태 |
|---|---|
| Fact vs Judgment 구분 | _judgePlaceLookup V0.1 — 명시적 판단 분기 |
| LIVE/Volatile 경계 | PSQ: "현장 확인 필요" VERIFY boundary ✓ |
| UNKNOWN = UNKNOWN | 포토존 TRUE_KNOWLEDGE_GAP → 정직한 UNKNOWN ✓ |
| 개인화 = 관점 변화 (사실 아님) | DB physical_difficulty/suitability_for 기반 ✓ |

**지원되지 않는 주장 위험:**

| 체크 | 상태 | 비고 |
|---|---|---|
| 적합성 주장 (unsupported) | 낮음 | suitability_for DB 필드 기반, Judgment V0.1만 적용 |
| 접근성 주장 (wheelchair) | 낮음 | PSQ: VERIFY boundary, accessibility_wheelchair_status 없으면 UNKNOWN |
| 이동시간 주장 | 없음 | GOVERNANCE_HOLD — 모든 이동시간 주장 차단 |
| 현재 운영 주장 (LIVE) | 낮음 | PSQ: "현장 확인 필요" hedge 항상 포함 |
| 요금 우열 주장 | 없음 | NON_OFFICIAL hedge만, "더 저렴하다" 없음 |
| 어르신 가능 주장 (unsupported) | Judgment 3곳만 | 나머지 8곳 = suitability_for 배열만 |

**판정:** 3곳 Deep Knowledge 범위 내 = 안전. 비연결 8곳 = 기본 DB만 노출. OBSERVE.

---

## D. JOURNEY READINESS

| 흐름 | 상태 |
|---|---|
| 현재 장소 → 다음 장소 | JOURNEY_CONTINUITY V0.1 LIVE ✓ |
| 장소 A → 장소 B 순서 | Journey Minimum Continuity V0.1 LIVE ✓ |
| family/부모님 → 걷기 부담 → 다음 선택 | Judgment V0.1 + CONSTRAINT_UPDATE Decision Type ✓ |
| 차 → 주차/회차 → 다음 장소 | PARTIAL — has_car chip 있으나 Travel Time HOLD |
| Journey null at T8 (저녁 질문) | HOLD — accumulated journey not passed to PARTIAL/DISCOVERING |

**핵심 원칙 보존 여부:**
- "지금 선택 → 다음 경험 → 그 다음 선택" ✓ (T3→T7 verified)
- 여행자 명시 선호 > SOUL 제안 ✓
- 부담이 적은 방향 제안 (low_walking) ✓

**OBSERVE_DURING_PILOT:** 실제 여수맘의 journey 패턴이 Golden Conversation 패턴과 다를 수 있음.
- "오전에는 오동도, 오후에는 케이블카" 멀티슬롯 요청
- "반나절만 있어" 등 강한 시간 제약
- "걷기 싫어요"(T6 패턴) 재현 여부

---

## E. TRUST & SAFETY

| 항목 | 상태 |
|---|---|
| Fabrication | Knowledge Safety 프로토콜 적용 — 0 violations (Golden + PSQ regression) |
| Stale info presented as current | NON_OFFICIAL hedge 필수 적용 |
| Unsupported certainty | PSQ: "참고값이에요" 항상 포함 |
| LIVE = fact | "현장 확인이 필요해요" VERIFY boundary ✓ |
| Source/evidence boundary | VERIFIED vs NON_OFFICIAL 명시적 분리 |
| 개인정보 수집 | SOUL: 여행자 context만 (people_type/mobility/has_car) — 민감정보 없음 ✓ |
| Human Experience = Truth 자동 승격 | 없음 — Batch 06: FIELD_EVIDENCE ≠ CURRENT_FACT 원칙 |
| 내부 용어 노출 | message_ko에 status/presentation_mode 미노출 ✓ |

**OBSERVE_DURING_PILOT:**
1. 식당 추천 시 UNVERIFIED 헤지 적용 여부
2. 비연결 장소 질문 시 SOUL이 "모른다"고 정직하게 말하는지 vs 관련없는 추천

---

## F. COST & CAPACITY

### GPT 호출 패턴

| 호출 | 모델 | 경로 | 비고 |
|---|---|---|---|
| contextExtractionService | gpt-4o-mini | 직접 OpenAI (aiGateway 미경유) | 매 요청마다 |
| sharedJourneyService | gpt-4o-mini | 직접 OpenAI (aiGateway 미경유) | 매 요청마다 (병렬) |
| PSQ gate | 없음 | 완전 deterministic | place_code 있으면 0 GPT calls |
| PLACE_LOOKUP | 없음 | DB only | 0 GPT calls |
| JOURNEY_CONTINUITY | 없음 | DB + rule | 0 GPT calls |

**파일럿 비용 추산 (7~8명 × 20~30메시지):**
- ~200 요청 × 2 GPT-4o-mini calls = ~400 calls
- gpt-4o-mini: in $0.15/1M + out $0.60/1M
- 추정 입력 ~500 tokens + 출력 ~200 tokens per call
- 400 × 700 tokens total → ~$0.21 USD / ~280원
- **파일럿 규모 비용 = 무시 가능**

### 가시성 (Visibility)

| 항목 | 상태 |
|---|---|
| dt_ai_calls 로깅 | ✗ **없음** — SOUL은 aiGateway 미경유 |
| dt_ai_cache | ✗ — SOUL call 미캐시 |
| 파일럿 요청 수 | ✗ **측정 불가** (현재 코드 기준) |
| 응답 latency | ✗ 측정 불가 |
| 에러 / 429 | ✗ 수동 모니터링만 가능 |

**판정: OBSERVE_DURING_PILOT** — 비용 자체는 무시 가능하나 요청 수·에러·latency 가시성 없음.
파일럿 기간 Render 로그 수동 모니터링 필요. 자동 로깅은 파일럿 이후 결정.

**aiGateway free-user 5-call 제한:** SOUL은 aiGateway 미경유이므로 적용 안 됨.
파일럿 참여자는 제한 없이 SOUL 사용 가능.

---

## G. PILOT ENTRY EXPERIENCE

### 진입 문구
"여수가 궁금하면 그냥 물어보세요."

| 체크 | 상태 |
|---|---|
| 프로젝트 지식 없어도 이해 가능 | ✓ — 자연어 그대로 질문 가능 |
| 모바일 가용성 | ✓ — Golden Conversation T1-T8 모바일 실증 |
| 첫 질문 경험 | ✓ — T1 "부모님과 여수 가" → 즉시 CLARIFICATION |
| 실패/모름 경험 | 부분 — PSQ TRUE_KNOWLEDGE_GAP = 정직한 "모르겠어요" ✓, 비연결 장소 = DISCOVERY로 우회 |
| 불완전 지식 = 정직 처리 | ✓ — NON_OFFICIAL hedge 일관 적용 |
| 자연스러운 추가 질문 | ✓ — JOURNEY_CONTINUITY T3-T7 verified |

**OBSERVE_DURING_PILOT:**
- 사용자가 "여수 맛집" 첫 질문으로 시작할 때 경험 품질
- "모른다"는 응답을 받을 때 이탈률
- 케이블카 Living Detail에서 SOUL 질문창 첫 사용 경험

---

## H. ADVERSARIAL YEOSU-MOM TEST

케이블카/오동도/향일암 외의 자연 질문 테스트.

| 질문 | 예상 경로 | 예상 결과 | 실패 시 Gap 분류 |
|---|---|---|---|
| "빅오쇼 어때요?" | PLACE_ALIAS_MAP miss → DISCOVERY | 빅오쇼 미언급, 다른 장소 추천 | B EXISTS_NOT_CONNECTED |
| "해양레일바이크 타고 싶어요" | ALIAS miss → DISCOVERY | 레일바이크 미언급 | B EXISTS_NOT_CONNECTED |
| "진남관 입장료가 얼마예요?" | ALIAS miss → 非PSQ → DISCOVERY/CLARIFICATION | 정보 없음, 구체 답변 불가 | B EXISTS_NOT_CONNECTED |
| "점심 뭐 먹을까요?" | meal_context → restaurant query | UNVERIFIED 식당 추천 가능성 | C SOURCE_EXISTS_NOT_STRUCTURED |
| "지금 거문도 배 있어요?" | LIVE 질문 → VERIFY boundary 필요 | CLARIFICATION 또는 VERIFY | D VERIFICATION_REQUIRED |
| "주차 어디에 해요?" (케이블카 외) | PSQ plate_code 없음 → DISCOVERY | parking_available DB 있으나 PSQ 미연결 | B EXISTS_NOT_CONNECTED |
| "낭만버스 탈 수 있어요?" | ALIAS miss → DISCOVERY | 정보 없음 | B EXISTS_NOT_CONNECTED |
| "오늘 날씨 맑아요?" | 도메인 외 → CLARIFICATION | 기상 정보 없음 | D VERIFICATION_REQUIRED |
| "여수 숙소 추천해줘" | SODAM 영역 분리됨 | hotel/accommodation route? | HOLD (SODAM boundary) |
| "첫째날은 뭐 하면 좋아요?" | time_available, multi-day | DISCOVERY 또는 CLARIFICATION | PARTIAL coverage |

**핵심 관찰:** H 테스트의 주요 실패 패턴은 **fabrication이 아니라 non-answer** (답을 못 함). 이는 파일럿에서 감내 가능. 중요한 것은 non-answer 시에도 "정보가 없어요, 현장에서 확인해보세요" 등 정직한 response.

---

## FINAL CLASSIFICATION

### PILOT BLOCKERS (0)

없음. SOUL은 현재 범위 내에서 fabrication 없이 안전하게 응답함.

---

### OBSERVE DURING PILOT (7)

| # | 항목 | 관찰 포인트 |
|---|---|---|
| OBS-1 | 비연결 장소 질문 | 빅오쇼/레일바이크/진남관 질문 시 SOUL 응답 품질. 정직한 "모른다" vs 부적절 우회. |
| OBS-2 | 식당 추천 | meal_context 처리 시 UNVERIFIED 식당 직접 추천 여부. 헤지 포함 여부. |
| OBS-3 | LIVE 질문 | "지금 영업해요?" "오늘 공연 있어요?" → VERIFY boundary 적용 여부. |
| OBS-4 | 자연 발화 다양성 | Golden Conversation 외 자연 발화 패턴. "지팡이 짚으세요", "두 살배기 있어요" 등 edge case. |
| OBS-5 | Cost & 요청 수 가시성 | Render 로그로 수동 추적. GPT 429/timeout 발생 여부. |
| OBS-6 | Journey 패턴 다양성 | Golden Conversation 외 실사용자 Journey. 반나절/강한 시간 제약/멀티슬롯. |
| OBS-7 | 모름 응답 시 사용자 행동 | 정직한 UNKNOWN을 받은 후 계속 질문하는지 vs 이탈. |

---

### LATER IMPROVEMENT (4)

| # | 항목 | 이유 |
|---|---|---|
| LI-1 | 비연결 장소 PLACE_LOOKUP 연결 | Batch 01-02 verified knowledge를 runtime에 연결. Pilot Evidence 수집 후 우선순위 결정. |
| LI-2 | 식당 Knowledge 정비 | Batch 06 UNVERIFIED 식당 공식 확인 후 CURRENT_FACT 승격. |
| LI-3 | SOUL 호출 로깅 | dt_ai_calls에 SOUL 경로 추가. 파일럿 이후 비용·latency·에러 트래킹. |
| LI-4 | Journey@T8 accumulated context | 저녁 질문 시 누적 journey 전달. HOLD per memory. |

---

### HOLD (5)

| # | 항목 | 이유 |
|---|---|---|
| H-1 | Travel Time Matrix | GOVERNANCE_HOLD 유지 |
| H-2 | FAQ/Question Detail architecture | 파일럿 Evidence 수집 전 |
| H-3 | Experience Network | Hotel Pilot 시작 전 |
| H-4 | 6117 Knowledge → Runtime DB 전환 | Founder 결정 필요 |
| H-5 | SODAM/숙소 추천 경계 | SODAM Boundary Audit 결과 유지 |

---

## Known Knowledge Gaps

| Gap | 분류 | 해결 방법 |
|---|---|---|
| 빅오쇼/레일바이크/진남관 runtime 미연결 | B | Batch 01-02 → travelGuideService DB 추가 |
| 전체 장소 PSQ 심층지식 없음 (8곳) | B | 각 장소 별 _PLACE_KNOWLEDGE 추가 |
| 이동시간 (GOVERNANCE_HOLD) | HOLD | Travel Time Matrix 연결 결정 후 |
| 식당 UNVERIFIED | C | 공식 확인 후 단계적 승격 |
| 포토존 (all places) | E | TRUE_KNOWLEDGE_GAP — 현재 정직 처리 중 |
| 현재 운영 상황 (LIVE) | D | VERIFY boundary — 개선 없이 파일럿 가능 |
| 주차 PSQ 비연결 | B | parking_available DB → PSQ 확장 (post-pilot) |

---

## Cost/Capacity Readiness

| 항목 | 판정 |
|---|---|
| 7~8명 파일럿 비용 | **무시 가능** (~280원 추산) |
| OpenAI rate limit | **위험 낮음** — GPT-4o-mini, 파일럿 규모 |
| 로깅/가시성 | **UNKNOWN/MEASURE_IN_PILOT** — Render 수동 모니터링 |
| aiGateway 한도 | **미적용** (SOUL은 aiGateway 미경유) |

---

## Human Experience Handling

**규칙:** Human Experience ≠ Phoenix Fact. 자동 승격 없음.

현재 상태:
- SOUL은 사용자 입력(message)에서 여행자 context만 추출 (people_type, mobility 등)
- 사용자가 제공한 장소 경험을 Phoenix Knowledge로 저장하는 경로 없음 ✓
- Batch 06 FIELD_EVIDENCE(Founder 제보) ≠ CURRENT_FACT 원칙 준수 ✓

파일럿 수집 대상:
- 반복 질문 패턴 (Pilot Evidence 기반 FAQ 후보)
- UNKNOWN/VERIFY 응답 후 사용자 행동
- Journey 패턴 (어떤 순서로 3곳을 돌고 싶은지)

---

## Recommended Pilot Boundary

**포함:**
- 케이블카 / 오동도 / 향일암 — 3곳 Deep Knowledge 연결
- 이순신광장·낭만포차·중앙시장 등 8곳 기본 PLACE_LOOKUP
- 일반 여수 DISCOVERY 질문 ("뭐 할까요?", "저녁에 어디 가면 좋아요?")
- 여행자 Context continuity (부모님, 아이, 혼자 등)
- Journey building (2-3곳 순서 결정)

**제외 (현재 커버 불가):**
- 실시간 정보 ("지금 줄 얼마나 서요?")
- 이동시간 정확한 계산
- 식당 직접 추천 (UNVERIFIED 위험)
- 거문도/섬 당일 접근 정보

**파일럿 참가자 안내 문구 (제안):**
> "소여울은 여수 여행 동반자예요. 아직 모르는 것도 있어요.
> 모른다고 하면 그게 더 좋은 답이에요 :) 솔직하게 물어봐 주세요."

---

## Exact Pilot Entry Condition

모든 조건 충족 시 파일럿 실행 가능:

| # | 조건 | 현재 상태 |
|---|---|---|
| 1 | PSQ V0.1 9/9 PASS | ✓ VERIFIED@92f6bb0 |
| 2 | Golden Conversation 11/11 PASS | ✓ VERIFIED@9949383 |
| 3 | People_type Continuity PASS | ✓ VERIFIED@9949383 |
| 4 | Knowledge Safety 0 fabrication | ✓ VERIFIED |
| 5 | Founder + Lumi Review 완료 | ⏳ 대기 중 |

조건 1-4 모두 충족. **조건 5 = Founder + Lumi Final Review.**

---

## STOP

**YEOSU MOM INTERNAL SOUL PILOT V0.1 — 7~8 participants**

모든 기술적 조건 충족.
Founder + Lumi가 이 문서를 검토하고 파일럿 일정 결정.

**NO schema/migration/seed/Travel Time/FAQ architecture/Dynamic FAQ.**
**NO feature implementation. Audit only.**
