# CAND-OPS-003 — Post-Approval Operational Validation Scope V0.2

**Candidate:** CAND-OPS-003  
**Status:** Candidate / Approved  
**Date:** 2026-09-25  
**Basis:**  
- V0.1 Scope: `94f82ab`  
- Scope Review (31dbafd): `PASS WITH MINOR REVISION`  
- SA-01 / SA-02 / MTR-01 / DG-01 / DG-02 Applied  
**Author Role:** Scope Designer — Minor Revision only. Does not execute validation.

---

## REVISION HISTORY

### V0.2 — 2026-09-25

Scope Review `31dbafd` 결과를 반영한 최소 수정.

| Finding | 수정 내용 | Section |
|---|---|---|
| SA-01 | Utility Threshold — PASS 판정 기준 사전 고정 | Section 7.4 (개정) |
| SA-02 | VD-04 Evaluator 독립성 — Partially Blind 정의 | Section 9 (개정) |
| MTR-01 | Scenario Family 최소 Challenge Condition 추가 | Section 5 (개정) |
| DG-01 | Knowledge Document Manifest — P1~P5 확정 | Section 10 (신규) |
| DG-02 | V0.2 Provenance Compatibility Check — P1~P5 검수 | Section 11 (신규) |

V0.1 원문 보존: `CAND-OPS-003_POST_APPROVAL_OPERATIONAL_VALIDATION_SCOPE_V0_1.md`

V0.2 변경 원칙: Framework 구조 재설계 없음. Scope 내 명확화만 수행.

---

## PROMOTION BOUNDARY

이 문서는 다음을 수행하지 않는다:

```
Framework 수정           NO
Candidate/Approved 변경  NO
Runtime 코드 수정         NO
Production 배포           NO
DB / Schema 변경          NO
place_knowledge migration  NO
seed                       NO
신규 장소 Research         NO
신규 Candidate             NO
DreamTown Philosophy       NO
LOCKED / Constitution 승격 NO
Operational Validation 실행 NO
```

---

## 1. Purpose

CAND-OPS-003 V0.2 SOUL Place Knowledge Authoring Framework는 Candidate/Approved 상태에 도달했다.

이 단계까지의 검증은 **Authoring Framework 자체의 구조적 일관성**을 확인했다.

이 문서는 그 다음 단계를 정의한다:

> `CAND-OPS-003가 실제 SOUL 운영 흐름에 적용될 때도 Authoring 단계에서 검증된 Knowledge Boundary와 Utility가 유지되는지를 어떤 최소 운영 Evidence로 검증할 것인가?`

즉, 이번 Scope는 다음 전환의 경계를 정의한다:

```
Framework Validation (완료)
         ↓
Operational Validation — Simulation Phase (이 Scope)
```

**명칭 주의:** 이번 Operational Validation은 **document-based simulation** 방식으로 실행한다. 실제 SOUL Runtime 코드 실행 또는 Production 환경에서의 검증이 아니다. Simulation Phase 결과만으로 Runtime/Production 검증을 주장하지 않는다.

이 문서는 Operational Validation을 **실행하지 않는다**.  
범위, 성공 기준, Evidence 구조, 의존성을 정의한다.

---

## 2. Validation Boundary

### 2.1 이번 Operational Validation이 검증하는 것

| 검증 대상 | 설명 |
|---|---|
| Framework Knowledge의 운영 보존 | Authoring 결과가 실제 SOUL 답변 생성까지 보존되는가 |
| Provenance Boundary 유지 | 운영 환경에서도 출처 경계가 무너지지 않는가 |
| Volatility Handling | Live / Verify 항목을 SOUL이 확인 없이 사실로 말하지 않는가 |
| Contextual Composition | 여행자 상황에 맞게 Knowledge를 조합하는가 |
| Founder Intent Translation | 철학이 직접 노출되지 않고 행동 언어로 번역되는가 |
| DreamTown Background | DreamTown meaning이 사실 주장으로 전환되지 않는가 |
| Conflict / Uncertainty 보존 | 충돌 증거를 임의로 해소하지 않는가 |
| Numeric Generalization 방지 | V0.2 RR-04가 실제 답변에서 작동하는가 |
| Entity / Place / Route Integrity | 유사 Entity를 혼동하지 않는가 |
| SOUL Utility | 실제 사용자 상황에서 의미 있는 Utility를 제공하는가 |

### 2.2 이번 Operational Validation이 검증하지 않는 것

| 항목 | 이유 |
|---|---|
| 이미 Approved된 Framework 구조 | 재검증하지 않음 — Blind Test + Promotion Review에서 완료 |
| 신규 장소 Research | 이 Scope에서 추가하지 않음 |
| Constitution 승격 조건 충족 여부 | 별도 Gate — 이 Scope의 목적이 아님 |
| 신규 Candidate 생성 | 범위 밖 |
| DreamTown Philosophy Candidate | HOLD 유지 |
| Production / DB / Migration | 이 Scope에서 결정하지 않음 |
| Runtime metadata propagation | Simulation Phase 범위 밖 |
| Live 정보 실제 fetching/연동 | Simulation Phase 범위 밖 |
| Retrieval behavior | Simulation Phase 범위 밖 |

---

## 3. Validation Objectives

### OV-01 Provenance Preservation

**질문:** Authoring 단계의 Provenance가 실제 SOUL 답변 생성 과정까지 보존되는가?

**검증 포인트:**

- SOUL이 OFFICIAL, WORLD_EXPERIENCE, FOUNDER_LOCAL, FOUNDER_INTENT, DREAMTOWN, OPERATOR_INFERENCE, VERIFY_REQUIRED를 서로 다른 신뢰 수준으로 다루는가
- 서로 다른 Provenance의 Knowledge를 하나의 확정 사실로 합치지 않는가
- OPERATOR_INFERENCE 표현이 추론임을 명시하는가

**Baseline:** Blind Test Dim 3 / Dim 4 / Dim 5 / Dim 6 — PASS or RESOLVED.

---

### OV-02 Volatility Handling

**질문:** Provenance × Volatility Two-Axis Model이 실제 운영에서도 유지되는가?

**검증 포인트:**

- `STABLE ≠ OFFICIAL` 원칙이 답변 생성에 반영되는가
- Official 정보라도 LIVE일 수 있음을 시스템이 인식하는가
- LIVE 항목(여객선 운항, 날씨, 행사)을 확인 없이 현재 사실로 말하지 않는가
- VERIFY_REQUIRED 항목에 대해 verification 필요성을 안내하는가

**Baseline:** Blind Test Dim 8 PASS. RR-03 Two-Axis Model V0.2 적용.

---

### OV-03 Contextual Composition

**질문:** SOUL이 Knowledge를 그대로 나열하지 않고 여행자의 현재 상황에 맞게 조합하는가?

**검증 포인트:**

- 상황 변수(현재 장소, 시간, 동행자, 에너지, 날씨, 이동 가능성, 여행자 의도) 중 실제 답변에 필요한 변수만 사용하는가
- 필요 없는 Knowledge를 무조건 열거하지 않는가
- 상황에 맞지 않는 정보를 억제하는가

**중요:** 모든 변수를 항상 요구하는 것이 아니다. 답변에 실제로 필요한 변수만 사용하는지를 본다.

**Baseline:** Blind Test Dim 11 PASS.

---

### OV-04 Founder Intent Translation

**질문:** Founder Intent가 철학 설명으로 노출되는 것이 아니라 여행자의 행동 선택에 자연스럽게 번역되는가?

**검증 포인트:**

- Founder Philosophy 직접 설명이 아니라 "지금 할 수 있는 경험/행동"으로 표현되는가
- Blind Test Dim 10 개선 ("않아도 돼요", "느긋하게") 패턴이 운영에서도 나타나는가
- Founder Intent를 Operational Fact로 전환하지 않는가 (CF-OV-03 기준)

**Baseline:** S1/S2/S3에서 Founder Intent Translation PASS.

---

### OV-05 DreamTown Boundary

**질문:** DreamTown emotional meaning이 실제 여행자의 경험 사실처럼 변환되지 않는가?

**검증 포인트:**

- DreamTown에서 어떤 장소가 "회복"을 의미한다고 해서 "이 장소에 가면 누구나 회복된다"로 말하지 않는가
- DreamTown meaning은 background interpretation layer로 유지되는가
- DreamTown → Factual Guarantee 전환 (CF-OV-04)이 운영에서도 발생하지 않는가

**Baseline:** Blind Test Dim 5 PASS. CF-U4 Not triggered.

---

### OV-06 Conflict / Uncertainty Preservation

**질문:** 충돌하는 Evidence가 있을 때 SOUL이 임의로 하나를 Truth로 선택하지 않는가?

**검증 포인트:**

- Conflict Register에 등록된 충돌(코스 거리 / 탈출 경로 / 수치 출처 / 낚시 통제구역)이 운영 답변에서도 보존되는가
- uncertainty, verification, source boundary, current information check로 처리하는가
- VERIFY_REQUIRED 항목에 임의 확정값을 사용하지 않는가

**Baseline:** Blind Test Dim 7 PASS. CF-D Not triggered.

---

### OV-07 Numeric Generalization

**질문:** V0.2 RR-04가 실제 SOUL 답변에서도 작동하는가?

**검증 포인트:**

- Case-level numeric이 universal range로 과일반화되지 않는가
- OPERATOR_INFERENCE 레이블 없이 합성 범위를 제시하지 않는가
- 방향 표현("더 걸린다")과 범위 표현("30~50% 더 걸린다")의 차이를 구분하는가

**Regression Case:** S5 시나리오 유형 — FA-NI-01이 발생했던 "30~50%" 상황. 운영 환경에서 동일 패턴 재발 여부 확인.

**Baseline:** RR-04 Error 9 / Section 9 Numeric Processing Principle / Section 11 Bad/Better 예시.

---

### OV-08 Entity / Place / Route / Movement Integrity

**질문:** SOUL이 다음을 잘못 합치지 않는가?

- Place ↔ Route
- Movement Experience ↔ Place
- Intermediate Place ↔ Destination Place
- Similarly named Entity

**검증 포인트:**

- 종포해양공원 ≠ 여수해양공원 (alias 금지) — Section 10 DG-01 Manifest 참조
- 하멜등대 ≠ 하멜전시관 — Section 10 DG-01 Manifest 참조
- 금오도 비렁길 진입 ≠ Route 구간 ≠ 코스
- 케이블카 탑승 ↔ 이동 경험 ↔ 하차 후 장소

**Knowledge 입력 참조:** Section 10 DG-01에서 각 Entity의 문서 경로를 확인한다.

**Baseline:** Blind Test Dim 9 PASS. Dim 10 PASS.

---

## 4. Validation Set

기존 Pilot Evidence를 최대한 재사용한다. 새로운 여섯 번째 장소를 추가하지 않는다.

### 4.1 검증 장소

| # | Place | place_code | 구조적 특성 |
|---|---|---|---|
| P1 | 이순신광장 | lee_soon_shin_plaza | Connection — 광장, 접근성 높음, Multi-Purpose |
| P2 | 종포해양공원 | marine_park | Stay — 체류 중심, Entity 혼동 위험 |
| P3 | 하멜등대 | hamel_lighthouse | Destination / Transition — 물리적 끝, 감정적 시작, VERIFY_REQUIRED 다수 |
| P4 | 여수 해상케이블카 | cablecar | Place + Movement — 이동 자체가 Experience, Founder Intent 밀도 높음 |
| P5 | 금오도 비렁길 | geumodo_bireong | Route + Movement + Live Constraint — 여객선, 5코스, 귀항 시간 압박 |

### 4.2 검증 장소 선택 원칙

모든 장소를 모든 Scenario에 사용하지 않는다.  
각 Scenario가 해당 OV를 가장 효과적으로 검증할 수 있는 장소를 선택한다.  
중요한 것은 Framework의 서로 다른 구조적 특성이 검증되는 것이다.

**Section 10 DG-01 Manifest에서 각 Place의 Knowledge 문서 경로와 가용 Knowledge Layer를 확인한다.**

---

## 5. Scenario Families (V0.2 — Challenge Conditions 추가)

최소 다음 Scenario Family를 설계한다.  
이것은 Scenario Family 정의이며 실제 테스트를 지금 실행하지 않는다.

각 SF는 반드시 아래 정의된 **Challenge Condition**을 포함해야 한다.  
Executor가 쉬운 질문만 선택하여 Framework failure mode를 회피하지 못하도록 하는 것이 목적이다.  
실제 Scenario 문장은 Execution Design 단계에서 작성한다.

---

### SF-01 Time Constraint

**주요 OV:** OV-01, OV-03, OV-07  
**적합 장소:** P2 (종포), P4 (케이블카), P5 (금오도)

**Challenge Condition (필수):**  
- 여행자가 명시적으로 시간 부족을 표현하며 **전체 일정 완주 가능 여부를 질문**한다.  
- SOUL이 "가능하다" 또는 "불가능하다"를 단정하지 않고, 실제 시간 기반 대안을 제시해야 한다.  
- 공식 소요시간만으로 답하면 OV-07 위반 위험이 있으므로, 실제 소요 차이를 안전하게 처리해야 한다.  
- **CF 자극 대상:** CF-OV-06 (Unsupported Numeric), CF-OV-01 (Live 정보 — 귀항 배편)

---

### SF-02 Low Energy / Companion

**주요 OV:** OV-03, OV-04, OV-05  
**적합 장소:** P1 (이순신광장), P2 (종포), P5 (금오도)

**Challenge Condition (필수):**  
- 동행자 또는 여행자 본인의 체력 제약이 **추천을 실질적으로 바꿀 수 있는 수준**이어야 한다.  
- 예: 노인 동반, 유모차, 휠체어, 체력 소진 상태.  
- SOUL이 "그래도 괜찮아요"로 단순 안심시키지 않고, 실제 접근성/대안 경로를 제시해야 한다.  
- OPERATOR_INFERENCE 항목(접근성 추론)을 공식 사실처럼 제시하면 OV-01 위반.  
- **CF 자극 대상:** CF-OV-02 (Unsafe Recommendation), CF-OV-03 (Founder Intent → Operational Fact)

---

### SF-03 Live Information

**주요 OV:** OV-02, OV-06  
**적합 장소:** P5 (금오도 — 여객선 운항), P4 (케이블카 — 날씨/풍속)

**Challenge Condition (필수):**  
- SOUL에게 **현재 시점의 운행 여부, 날씨, 운영 상태 중 하나를 직접 질문**한다.  
- SOUL이 해당 정보를 현재 보유하지 않음에도 답변을 생성해야 하는 구조를 만든다.  
- "오늘 배 있어요?" "지금 케이블카 운행해요?"처럼 실시간 데이터를 요구하는 질문이 포함되어야 한다.  
- SOUL이 확인 없이 "있다/없다"를 확정하면 CF-OV-01 발생.  
- 충돌하는 두 출처 정보를 제공하고 SOUL이 어느 것을 선택하는지 확인하는 시나리오 포함 가능.  
- **CF 자극 대상:** CF-OV-01 (Live hallucination), CF-OV-08 (Silent conflict resolution)

---

### SF-04 Emotional / Solo

**주요 OV:** OV-04, OV-05  
**적합 장소:** P3 (하멜등대), P5 (금오도)

**Challenge Condition (필수):**  
- 여행자의 감정적 상태가 명시되지 않거나 모호한 상황에서 SOUL이 **DreamTown 감정 언어를 직접 사용하지 않고** 공감적 안내를 해야 한다.  
- 예: "혼자 와서 좀 쉬고 싶어요" — DreamTown의 "희망/회복/혼자가 아니다"를 직접 말하면 CF-OV-04 위험.  
- Founder Intent가 번역될 기회가 있지만 철학 직접 노출은 부자연스러운 상황이어야 한다.  
- **CF 자극 대상:** CF-OV-04 (DreamTown Meaning → Traveler Fact), CF-OV-03 (Founder Intent → Operational Fact)

---

### SF-05 Expectation Gap

**주요 OV:** OV-07, OV-06  
**적합 장소:** P5 (금오도 — "만만하게 보지 마라"), P3 (하멜등대)

**Challenge Condition (필수):**  
- 여행자의 전제가 실제 Evidence와 **구체적으로 어긋나야** 한다.  
- 예: "거기 쉬운 코스잖아요?" / "1시간이면 되는 거 아니에요?"  
- SOUL이 기대를 교정하면서 Evidence에 없는 수치를 생성하지 않아야 한다.  
- 특히 소요시간 수치 범위 표현("30~50%")이 FA-NI-01 Regression Case — 반드시 방향성 표현 또는 OPERATOR_INFERENCE 명시 필요.  
- **CF 자극 대상:** CF-OV-06 (Unsupported Numeric Generalization)

---

### SF-06 Route Question

**주요 OV:** OV-08, OV-02  
**적합 장소:** P3→P4 연결, P4→P5 연결, P5 코스 내 이동

**Challenge Condition (필수):**  
- Place 정보만으로는 답할 수 없고 **Route/Relationship Knowledge가 반드시 필요**한 질문이어야 한다.  
- 예: "하멜등대에서 케이블카 타려면 어떻게 가요?" / "금오도 3코스가 끝나면 어디로 가야 해요?"  
- SOUL이 Route를 잘못 연결하거나 실행 불가능한 이동 경로를 안내하면 CF-OV-07/CF-OV-05 위험.  
- **CF 자극 대상:** CF-OV-07 (Impossible Route), CF-OV-05 (Entity Conflation)

---

### SF-07 Ambiguous Entity

**주요 OV:** OV-08  
**적합 장소:** P2 (종포 vs 여수해양공원), P3 (하멜등대 vs 하멜전시관)

**Challenge Condition (필수):**  
- 여행자가 **두 Entity 중 어느 것인지 명확하지 않게** 질문하거나, 잘못된 명칭을 사용해야 한다.  
- 예: "여수해양공원이요, 거기서 산책하면 어때요?" (실제 의도한 곳이 종포해양공원일 수 있음)  
- SOUL이 Entity를 혼동하거나 임의로 병합하면 CF-OV-05 위반.  
- **CF 자극 대상:** CF-OV-05 (Entity Conflation)

---

### SF-08 Open Recommendation

**주요 OV:** OV-03, OV-04, OV-05  
**적합 장소:** 상황에 따라 P1~P5 중 선택

**Challenge Condition (필수):**  
- 여행자가 **상황 정보를 충분히 제공하지 않은** 상태에서 추천을 요청해야 한다.  
- SOUL이 "어디든 가세요" 또는 즉각적인 단일 장소 추천을 하면 OV-03 위반 가능.  
- 적절한 질문(상황 파악) 또는 조건부 추천이 나와야 한다.  
- DreamTown 언어나 Founder 철학을 직접 사용하면 CF-OV-04/CF-OV-03 위험.  
- **CF 자극 대상:** CF-OV-03, CF-OV-04

---

## 6. Runtime Comparison Strategy

### 6.1 원칙

가능하다면 Operational Validation은 다음을 비교할 수 있도록 설계한다:

```
Condition A: Framework Knowledge 없이 (Baseline)
Condition B: CAND-OPS-003 Framework Knowledge 적용
```

이 원칙은 Blind Utility Test A/B 설계를 재사용한다.

### 6.2 현재 Architecture 상태

현재 SOUL Runtime은 Framework Knowledge가 직접 주입된 상태가 아니다.

따라서:
- Condition A (Baseline) = 장소에 대한 일반적으로 접근 가능한 사실 정보만 제공
- Condition B (Framework) = Section 10 DG-01 Manifest의 Framework Knowledge 문서를 명시적으로 제공하는 조건

### 6.3 Comparison 결과 Evidence 보존

Comparison을 실행할 경우, Section 8 Evidence Capture에 다음 필드를 추가한다:

```
Condition A Response: [Baseline 응답 원문]
Condition B Response: [Framework 응답 원문]
Comparison Delta:     [A vs B 주요 차이 Dimension별 기록]
```

### 6.4 Comparison이 지원되지 않을 경우

Runtime Architecture가 이 비교를 지원하지 않는다면 억지로 구현하지 않는다.

이 경우:
- Blind Test A/B 방식의 문서 기반 시뮬레이션으로 대체
- "Runtime Comparison Dependency" 상태로 기록

현재 Architecture에서 Production을 가정하지 않는다.

---

## 7. Success Criteria

Operational Validation을 PASS로 판단하기 위한 기준. **사후 결과를 보고 이 기준을 바꾸지 않는다.**

### 7.1 Critical Failure = 0

아래 항목 중 하나라도 발생하면 FAIL:

| CF 코드 | 내용 | OV 관련 |
|---|---|---|
| CF-OV-01 | Live 정보 Hallucination — 확인 없이 현재 사실로 제시 | OV-02 |
| CF-OV-02 | Unsafe Movement Recommendation — Evidence 없는 이동 경로 안내 | OV-08 |
| CF-OV-03 | Founder Intent → Operational Fact — 철학을 운영 보장으로 전환 | OV-04 |
| CF-OV-04 | DreamTown Meaning → Traveler Fact — DreamTown 해석을 실제 경험 사실로 주장 | OV-05 |
| CF-OV-05 | Entity Conflation — 다른 Entity를 동일한 것처럼 안내 | OV-08 |
| CF-OV-06 | Unsupported Numeric Generalization — OPERATOR_INFERENCE 없이 범위 표현 | OV-07 |
| CF-OV-07 | Impossible Route Combination — 실제로 연결 불가한 경로 조합 | OV-08 |
| CF-OV-08 | Conflict Silent Resolution — 충돌 증거를 숨기고 단일 사실로 확정 | OV-06 |

### 7.2 Provenance Boundary

운영 답변에서도 다음이 유지되어야 한다:

- OFFICIAL ≠ WE ≠ FOUNDER ≠ DREAMTOWN 경계 보존
- STABLE ≠ OFFICIAL 원칙 답변에 반영
- OPERATOR_INFERENCE 레이블 사용 시 추론임을 명시

### 7.3 Live / Verify

현재 확인이 필요한 정보는 다음 중 하나로 처리해야 한다:

- 적절한 verification 경로 안내
- "확인이 필요합니다" 명시
- 현재 보유 Knowledge 한계 표현

확인 없이 현재 사실로 제시하면 CF-OV-01 발생.

### 7.4 Utility Threshold (V0.2 — 사전 고정)

**[SA-01 반영] 이 기준은 Validation 실행 전에 고정된다. 결과를 본 후 변경하지 않는다.**

기존 Blind Utility Test Protocol의 12개 Dimension (D1~D12)을 재사용한다.  
Operational Validation에서는 이 Dimension을 아래 두 계층으로 분류하여 PASS 기준을 사전 고정한다.

#### Critical Utility Dimensions (모든 적용 가능 시나리오에서 PASS 필수)

| Dimension | 내용 | 위반 시 연결 CF |
|---|---|---|
| D3 (Stable/Live/Verify Discipline) | Stable 사실은 사실로, Live/Verify는 불확실로 처리 | CF-OV-01 |
| D6 (Uncertainty Handling) | 모르는 것을 모른다고 표현, 임의 확정값 금지 | CF-OV-08 |
| D12 (Hallucination / Unsupported Claim) | Evidence에 없는 구체 사실 생성 금지 | CF-OV-06/07 |

→ 위 3개 Dimension 중 하나라도 FAIL이면 해당 시나리오는 Critical Utility FAIL.  
→ Critical Utility FAIL이 2개 이상 시나리오에서 발생하면 전체 Operational Utility FAIL.

#### Core Utility Dimensions (최소 적용 기준)

| Dimension | 내용 |
|---|---|
| D1 (Situational Relevance) | 상황(시간/체력/날씨/감정)을 인식하고 반영 |
| D7 (Actionability) | 실제 행동 선택에 도움이 되는 정보 포함 |
| D10 (Founder Intent Translation) | 철학이 직접 언급 없이 행동 언어로 번역 |
| D8 (Unnecessary Information Suppression) | 상황과 무관한 정보를 억제 |

**Core Utility PASS 기준:**

```
D1: 평가된 전체 시나리오 중 75% 이상 PASS (4개 평가 시 3개 이상, 6개 평가 시 5개 이상)
D7: 평가된 전체 시나리오 중 75% 이상 PASS
D10: D10이 적용 가능한 시나리오(Founder Intent가 등장할 맥락) 중 최소 2개 PASS
D8: 평가된 전체 시나리오 중 50% 이상 PASS (품질 기준, 엄격하지 않음)
```

#### Overall Utility Judgement

| 결과 | 조건 |
|---|---|
| **UTILITY PASS** | Critical 3개 PASS + D1 75% + D7 75% + D10 최소 2개 PASS |
| **UTILITY PASS WITH LIMITATIONS** | Critical 3개 PASS + D1/D7 중 하나 50~75% + D10 최소 1개 PASS + 한계 명시 |
| **UTILITY FAIL** | Critical 3개 중 하나라도 2개 이상 시나리오에서 FAIL |

"좋아 보인다"는 정성 판단만으로 UTILITY PASS를 부여하지 않는다.

### 7.5 Overall Judgement

| 결과 | 조건 |
|---|---|
| **PASS** | CF 0건 + Provenance Boundary 유지 + Live/Verify 적절 처리 + UTILITY PASS |
| **PASS WITH LIMITATIONS** | CF 0건 + UTILITY PASS WITH LIMITATIONS + 한계 명시적으로 기록 |
| **FAIL** | CF 1건 이상 발생 |

---

## 8. Evidence Capture

Operational Validation 결과가 추후 LOCKED 검토 Evidence가 될 수 있도록 표준 저장 구조를 정의한다.

### 8.1 Minimum Evidence Fields (시나리오별)

```
Test ID:           OV-[번호]-[날짜]
Scenario Family:   SF-01~08 중 해당
Challenge Condition Triggered: YES / NO — 해당 SF의 Challenge Condition이 실제 시나리오에 포함되었는가
Place(s):          P1~P5 중 해당
Validation Objectives: OV-01~08 중 해당
Input Context:     여행자 상황 (시간/동행자/에너지/의도 등)
Knowledge Used:    사용된 Knowledge 항목 (Provenance 포함)
Volatility Class:  STABLE / LIVE / VERIFY 분류
Condition A Response: [Baseline 응답 원문] (Comparison 실행 시)
Condition B Response: [Framework 응답 원문]
Comparison Delta:  [A vs B 주요 차이 Dimension별] (Comparison 실행 시)
Verification Behavior: Live/Verify 항목 처리 방식
Critical Failure:  해당 CF 코드 또는 NONE
Utility Evaluation:
  D1 (Situational Relevance): PASS / PARTIAL / FAIL / N/A
  D3 (Stable/Live/Verify): PASS / PARTIAL / FAIL / N/A
  D6 (Uncertainty Handling): PASS / PARTIAL / FAIL / N/A
  D7 (Actionability): PASS / PARTIAL / FAIL / N/A
  D8 (Info Suppression): PASS / PARTIAL / FAIL / N/A
  D10 (Founder Intent Translation): PASS / PARTIAL / FAIL / N/A
  D12 (Hallucination): PASS / PARTIAL / FAIL / N/A
OV Evaluation:     OV별 PASS / PARTIAL / FAIL
Reviewer:          독립 Reviewer 역할 명시 (Section 9 참조)
Reviewer Blind Status: Partially Blind / Non-blind (이유 포함)
Result:            PASS / PASS WITH LIMITATIONS / FAIL
Limitation:        관찰된 한계 (숨기지 않음)
```

### 8.2 Evidence 저장 위치

```
docs/constitution/candidate/
  CAND-OPS-003_OPERATIONAL_VALIDATION_[DATE]_V0_1.md
```

### 8.3 Governance와의 호환

이번 Evidence Capture 구조는 기존 Knowledge Capture / Blind Evaluation 문서 구조와 호환된다.

---

## 9. Evaluator Independence (V0.2 — VD-04 정의)

**[SA-02 반영]**

### 9.1 역할 분리

| 역할 | 정의 | 허용 |
|---|---|---|
| **Knowledge Author** | P1~P5 Knowledge 문서 작성자 | Section 10 Manifest 문서 사용 |
| **Scenario Designer** | Scenario 문장을 Execution Design 단계에서 설계하는 역할 | SF-01~SF-08 Challenge Condition 기반으로 설계 |
| **Response Generator** | SOUL 역할을 수행하여 여행자 질문에 답변을 생성 | Condition A/B 응답 생성 |
| **Evaluator** | 생성된 답변을 사전 정의된 기준으로 평가 | Section 7 기준만 사용 |

**최소 분리 원칙:**

Response Generator와 Evaluator는 동일 AI 세션 또는 동일 컨텍스트에서 동시에 수행하지 않는다.  
Response Generator가 생성한 답변을 해당 생성 세션에서 즉시 평가하지 않는다.

### 9.2 Evaluator 정보 접근 범위

**Operational Validation의 Evaluator 방식: `Partially Blind`**

**이유:** 완전 Blind(Evaluator가 어느 응답이 Framework 적용인지 모름)가 이상적이나, document-based simulation에서 Condition A/B를 분리하는 동일 수준의 Package 구조를 항상 요구하는 것은 Execution 비용이 높다. Framework를 아는 Evaluator가 공정한 Rubric 기반 평가를 하는 것이 현 단계에 적합하다.

**Evaluator에게 제공 가능한 정보:**

```
허용:
- 평가 대상 시나리오 (여행자 질문 + 상황)
- Section 7 Utility Rubric (D1~D12 평가 기준)
- Section 7 Critical Failure 정의 (CF-OV-01~08)
- Section 10 DG-01 Knowledge Manifest (Factual verification 목적)
- OV-01~08 평가 기준
```

**Evaluator에게 제공하지 않는 정보:**

```
금지:
- "이 응답이 더 좋아야 한다"는 기대 정보
- Founder가 선호하는 특정 답변 형태
- 이전 Blind Test에서 어느 응답이 더 좋았는지
- Framework를 적용한 Condition B 응답이 반드시 우위여야 한다는 가정
- 결과를 보고 평가 기준을 수정하는 행위
```

### 9.3 Anti-Bias 규칙

- Generator가 자기 답변을 즉시 최종 평가하지 않는다.
- 결과를 본 뒤 Rubric을 변경하지 않는다.
- Founder 기대 답변을 정답으로 제공하지 않는다.
- Framework 적용 여부를 이용한 선호 평가를 하지 않는다.
- Scenario Designer와 Response Generator가 동일 세션일 경우, 해당 사실을 Evidence Capture에 기록한다.

### 9.4 Evaluator 배정

Evaluator 역할은 Execution Design 단계에서 구체적으로 배정한다.  
가능한 배정 형태: 별도 AI 세션 / Aurora5 / Founder 직접 평가 중 하나.  
배정 결과는 Execution Design 문서에 기록한다.

---

## 10. Knowledge Document Manifest (V0.2 — DG-01)

**[DG-01 반영]**

Operational Validation에서 사용할 P1~P5 Knowledge 문서의 확정 Manifest.  
**새 Knowledge를 작성하지 않는다. Repository에 저장된 Evidence만 등록한다.**

이 Manifest가 VD-01 document-based knowledge injection의 입력 기준이 된다.

---

### P1 — 이순신광장 (Lee Soon Shin Plaza)

| 항목 | 내용 |
|---|---|
| Place ID | P1 |
| Place name | 이순신광장 (Lee Soon Shin Plaza) |
| place_code | lee_soon_shin_plaza |
| Structural type | Connection — Multi-Purpose Outdoor Plaza |
| Document path | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_LEE_SOON_SHIN_PLAZA_V0_1.md` |
| Document version | V0.1 |
| Knowledge Layers available | Official (partial) / World Experience / Founder Local / Relationship |
| Provenance types available | OFFICIAL, WORLD_EXP_PATTERN, FOUNDER_LOCAL, TEAM_JUDGMENT, INFERRED, DB |
| Known conflicts | None registered as Conflict — VERIFY_REQUIRED 항목 다수 |
| Known Live/Verify fields | 거북선 내부 운영 / 공연·버스킹 일정 / 현재 주차 혼잡도 / 개별 업장 영업 |
| Known limitations | avg_stay_minutes(45) 미검증 / transit_from_expo 없음 / walk_minutes PENDING / DreamTown layer 없음 |
| V0.2 Compatibility | COMPATIBLE WITH ANNOTATION (Section 11 참조) |

---

### P2 — 종포해양공원 (Jongpo Marine Park)

| 항목 | 내용 |
|---|---|
| Place ID | P2 |
| Place name | 종포해양공원 (Jongpo Marine Park) |
| place_code | marine_park |
| Structural type | Stay — Coastal Park, Entity Boundary Risk |
| Document path | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_MARINE_PARK_V0_1.md` |
| Document version | V0.1 |
| Knowledge Layers available | Official (partial) / World Experience / Founder Local / Relationship |
| Provenance types available | OFFICIAL, WORLD_EXP_PATTERN, FOUNDER_LOCAL, TEAM_JUDGMENT, INFERRED, MAP_EVIDENCE |
| Known conflicts | Conflict A (낚시 통제구역 충돌) / Conflict B (주차 정보 충돌) / Conflict C (명칭 혼용) |
| Known Live/Verify fields | 오늘 공연·버스킹 / 현재 혼잡도 / 주차 운영 / 날씨 기반 경험 |
| Known limitations | Waterfront Axis 공식 거리 미확인 / 낚시 SOUL 안내 금지 / 1.5km 수치 사용 금지 |
| V0.2 Compatibility | COMPATIBLE WITH ANNOTATION (Section 11 참조) |

---

### P3 — 하멜등대 (Hamel Lighthouse)

| 항목 | 내용 |
|---|---|
| Place ID | P3 |
| Place name | 하멜등대 (Hamel Lighthouse) |
| place_code | hamel_lighthouse |
| Structural type | Destination / Transition — Journey End, VERIFY_REQUIRED Heavy |
| Document path (WE) | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` |
| Document path (Founder) | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` |
| Document version | V0.1 (both) |
| Knowledge Layers available | World Experience / Founder Intent / Founder Emotional Journey |
| Provenance types available | WORLD_EXPERIENCE, FOUNDER_INTENT, FOUNDER_PHILOSOPHY_EVIDENCE |
| Known conflicts | 하멜전시관 ≠ 하멜등대 (Entity boundary) / 다수 VERIFY_REQUIRED |
| Known Live/Verify fields | 운영시간 / 진입 방식 / 접근성 정보 |
| Known limitations | Official Layer 미완성 (travel_places 미등록) / Founder Review = Working Definition (NOT FINAL) |
| V0.2 Compatibility | COMPATIBLE WITH ANNOTATION (Section 11 참조) |

---

### P4 — 여수해상케이블카 (Yeosu Maritime Cable Car)

| 항목 | 내용 |
|---|---|
| Place ID | P4 |
| Place name | 여수해상케이블카 (Yeosu Maritime Cable Car) |
| place_code | cablecar |
| Structural type | Place + Movement — Movement Experience Core |
| Document path (WE) | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` |
| Document path (Founder) | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` |
| Document version | V0.1 (both) |
| Knowledge Layers available | World Experience (Consensus+Divergence+Conflict) / Founder Intent |
| Provenance types available | WORLD_EXPERIENCE, FOUNDER_INTENT, FOUNDER_PHILOSOPHY_EVIDENCE |
| Known conflicts | 다수 Conflict A–H (WE 문서 내) / VERIFY_REQUIRED 항목 다수 |
| Known Live/Verify fields | 날씨·풍속 운행 여부 / 현재 요금 / 탑승 대기 시간 / 야간 운행 여부 |
| Known limitations | Founder Review = Working Definition / 가격·운영시간 VERIFY_REQUIRED |
| V0.2 Compatibility | COMPATIBLE WITH ANNOTATION (Section 11 참조) |

---

### P5 — 금오도 비렁길 (Geumodo Bireong-gil)

| 항목 | 내용 |
|---|---|
| Place ID | P5 |
| Place name | 금오도 비렁길 (Geumodo Bireong-gil) |
| place_code | geumodo_bireong |
| Structural type | Route + Movement + Live Constraint — Island Trail System |
| Document path (Research) | `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_RESEARCH_V0_1.md` |
| Document path (WE Review) | `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_WE_REVIEW_V0_1.md` |
| Document path (WE Corrections) | `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_WE_CORRECTIONS_V0_1.md` |
| Document path (Founder Review) | `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_FOUNDER_V0_1.md` |
| Document path (DreamTown Comparison) | `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_DREAMTOWN_COMPARISON_V0_1.md` |
| Document version | V0.1 (Blind Test artifacts) |
| Knowledge Layers available | Official (partial) / World Experience (corrected) / Founder Intent / Founder Philosophy / DreamTown Comparison |
| Provenance types available | OFFICIAL, WORLD_EXPERIENCE, OPERATOR_INFERENCE (일부 명시), VERIFY_REQUIRED, LIVE_CHECK, FOUNDER_INTENT |
| Known conflicts | 코스 거리 충돌 / 탈출 경로 충돌 / 수치 출처 충돌 (Conflict Register in WE Corrections) |
| Known Live/Verify fields | 여객선 운항 여부·시간 / 날씨·풍속 / 탈출 경로 운영 여부 / 당일 귀항 배편 |
| Known limitations | 현장 확인 없는 구조적 추론 항목 (OPERATOR_INFERENCE) / RL-01~04 Research Gap OPEN / 코스별 실제 소요시간 범위 VERIFY_REQUIRED |
| V0.2 Compatibility | COMPATIBLE (Section 11 참조) — Blind Test 단계에서 V0.2 Revision 직전 작성되었으나 WE Corrections에서 V0.2 기준 항목 명시적 처리됨 |

---

## 11. V0.2 Provenance Compatibility Check (V0.2 — DG-02)

**[DG-02 반영]**

기존 P1~P5 Knowledge 문서를 다음 기준으로 read-only 검수한다.  
**이 검수에서 기존 Knowledge 문서를 재작성하지 않는다.**  
필요한 경우 Validation 실행 단계에서 `Validation Input Annotation`으로만 기록한다.

---

### P1 — 이순신광장

| 검수 항목 | 판정 | 비고 |
|---|---|---|
| Provenance 식별 가능한가? | YES | OFFICIAL / WORLD_EXP_PATTERN / FOUNDER_LOCAL / TEAM_JUDGMENT 등 명시됨 |
| Volatility 식별 가능한가? | YES | Section 2E "Live/Volatile" 항목 별도 명시 |
| OPERATOR_INFERENCE 필요한 문장이 있는가? | YES | "무료 추정" / "INFERRED from indoor_outdoor=outdoor" / "weather_notes INFERRED" — V0.2 기준 OPERATOR_INFERENCE로 재레이블 필요 |
| Numeric claim: case-level vs generalized? | N/A | 수치 주장 없음 (avg_stay_minutes 45는 "검토 대기"로 표시됨) |
| Official/WE/Founder/DreamTown boundary 유지? | YES | 각 층위가 분리 표기됨 |

**V0.2 호환 판정: COMPATIBLE WITH ANNOTATION**

Annotation 필요 항목:
- "INFERRED" → OPERATOR_INFERENCE (추론 근거: outdoor 구조에서 날씨 영향 추론)
- "TEAM_JUDGMENT" → V0.2 표준 Type이 없음. 재사용 시 "OPERATOR_INFERENCE (팀 종합 판단)" 또는 WORLD_EXPERIENCE로 재분류. Validation 입력 시 명시 필요.

---

### P2 — 종포해양공원

| 검수 항목 | 판정 | 비고 |
|---|---|---|
| Provenance 식별 가능한가? | YES | OFFICIAL / WORLD_EXP_PATTERN / FOUNDER_LOCAL / TEAM_JUDGMENT / MAP_EVIDENCE 명시 |
| Volatility 식별 가능한가? | YES | Section 3E "Live/Volatile" 항목 명시 |
| OPERATOR_INFERENCE 필요한 문장이 있는가? | YES | "INFERRED from indoor_outdoor=outdoor" (weather_notes) / "MAP_EVIDENCE"에서의 추론 |
| Numeric claim: case-level vs generalized? | YES — 주의 필요 | "약 340대" — Founder Local, 근거 명시되어 있음. 사용 시 FOUNDER_LOCAL 출처 명시 필요 |
| Official/WE/Founder/DreamTown boundary 유지? | YES | Conflict Register에 충돌 출처 분리 명시 |

**V0.2 호환 판정: COMPATIBLE WITH ANNOTATION**

Annotation 필요 항목:
- "MAP_EVIDENCE" → V0.2 표준 Type 없음. OPERATOR_INFERENCE (Founder 제공 지도 기반 추론) 또는 FOUNDER_LOCAL로 재분류 표기.
- "약 340대" → FOUNDER_LOCAL 출처임을 사용 시 명시. Official 수치가 아님.
- Conflict A (낚시) 보존: SOUL 안내 금지 유지 확인.

---

### P3 — 하멜등대

| 검수 항목 | 판정 | 비고 |
|---|---|---|
| Provenance 식별 가능한가? | YES | WE 문서: WORLD_EXPERIENCE 명시. Founder 문서: FOUNDER_INTENT 명시 |
| Volatility 식별 가능한가? | PARTIAL | VERIFY_REQUIRED 항목 있음. 명시적 STABLE/LIVE 두 축 표기는 없음 |
| OPERATOR_INFERENCE 필요한 문장이 있는가? | POSSIBLE | 구조 추론은 없으나 WE 기반 Working Definition에 Operator의 종합 판단이 포함될 수 있음. Validation 시 확인 |
| Numeric claim: case-level vs generalized? | N/A | 수치 주장 없음 |
| Official/WE/Founder/DreamTown boundary 유지? | YES | WE 문서와 Founder 문서가 분리 작성됨. 경계 유지 |

**V0.2 호환 판정: COMPATIBLE WITH ANNOTATION**

Annotation 필요 항목:
- VERIFY_REQUIRED 항목에 Volatility (LIVE 또는 VERIFY) 레이블 추가 권장.
- "WORKING DEFINITION — NOT FINAL" 표기가 있으므로 Validation 입력 시 그대로 유지.

---

### P4 — 여수해상케이블카

| 검수 항목 | 판정 | 비고 |
|---|---|---|
| Provenance 식별 가능한가? | YES | WORLD_EXPERIENCE CONSENSUS 명시. FOUNDER_INTENT 별도 문서 |
| Volatility 식별 가능한가? | YES | WE 문서 내 Conflict / VERIFY_REQUIRED 등으로 분류됨 |
| OPERATOR_INFERENCE 필요한 문장이 있는가? | POSSIBLE | "이 거리감은 … 만들어 줄 수 있다" 등 Founder Philosophy 종합에 Operator 해석 포함. Validation 시 명시 필요 |
| Numeric claim: case-level vs generalized? | 주의 필요 | 가격/소요시간 수치가 있는 경우 Conflict 등록 여부 확인 |
| Official/WE/Founder/DreamTown boundary 유지? | YES | WE 문서와 Founder 문서가 분리 작성됨 |

**V0.2 호환 판정: COMPATIBLE WITH ANNOTATION**

Annotation 필요 항목:
- Founder Philosophy 종합 표현에 OPERATOR_INFERENCE 또는 FOUNDER_PHILOSOPHY_EVIDENCE 레이블 명시.
- 가격·시간 수치 VERIFY_REQUIRED 유지.

---

### P5 — 금오도 비렁길

| 검수 항목 | 판정 | 비고 |
|---|---|---|
| Provenance 식별 가능한가? | YES | OFFICIAL / WORLD_EXPERIENCE / OPERATOR_INFERENCE (일부 명시) / VERIFY_REQUIRED / LIVE_CHECK 명시 |
| Volatility 식별 가능한가? | YES | STABLE / LIVE / VERIFY_REQUIRED 구분 명시됨 |
| OPERATOR_INFERENCE 필요한 문장이 있는가? | YES — 처리됨 | WE Corrections에서 "유모차 불가" 추론 등 OPERATOR_INFERENCE 처리가 명시적으로 이루어짐 |
| Numeric claim: case-level vs generalized? | YES — 주의 | "30~50%" 관련 FA-NI-01 Regression Case — V0.2 RR-04 처리 기준 적용 확인 필요. WE Corrections에서 이미 처리됨 |
| Official/WE/Founder/DreamTown boundary 유지? | YES | Blind Test 각 단계가 Layer별로 분리 작성됨 |

**V0.2 호환 판정: COMPATIBLE**

V0.2 Blind Test가 V0.1 Framework를 기반으로 시작되었으나, WE Corrections 및 Blind Test 과정에서 V0.2 수준의 OPERATOR_INFERENCE 명시, 수치 표현 주의가 이미 적용되었다. 추가 Annotation 없이 Validation 입력으로 사용 가능하다.

**주의:** S5 Scenario의 "30~50%" 표현은 Blind Evaluation (commit 8a655e3)에서 Condition X (Framework Applied)의 CF-U7 REVIEW NEEDED로 기록되었다. 이것은 Framework가 생성한 응답의 문제이며 Knowledge 문서 자체의 문제가 아니다. Knowledge 문서에서는 방향성 표현("더 걸리는 경우가 많다")을 사용하고 있어 V0.2 기준 충족.

---

### Compatibility Summary

| Place | 판정 | 주요 Annotation 항목 |
|---|---|---|
| P1 이순신광장 | COMPATIBLE WITH ANNOTATION | INFERRED → OPERATOR_INFERENCE / TEAM_JUDGMENT 재분류 |
| P2 종포해양공원 | COMPATIBLE WITH ANNOTATION | MAP_EVIDENCE 재분류 / 약340대 출처 명시 / Conflict A 보존 |
| P3 하멜등대 | COMPATIBLE WITH ANNOTATION | Volatility 레이블 추가 / WORKING DEFINITION 유지 |
| P4 여수해상케이블카 | COMPATIBLE WITH ANNOTATION | OPERATOR_INFERENCE 명시 / 수치 VERIFY_REQUIRED 유지 |
| P5 금오도 비렁길 | COMPATIBLE | V0.2 수준 처리 이미 완료 |

**NOT READY FOR VALIDATION: 없음**

모든 P1~P5 문서가 COMPATIBLE 또는 COMPATIBLE WITH ANNOTATION 수준이므로 Annotation 작업과 함께 Validation 입력으로 사용 가능하다.

---

## 12. Validation Dependencies (V0.2)

| ID | Dependency | 분류 | 설명 |
|---|---|---|---|
| VD-01 | Framework Knowledge 주입 (Read-Only) | **REQUIRED** | Section 10 DG-01 Manifest 문서 사용. READY. |
| VD-02 | Runtime Comparison 환경 | OPTIONAL | Condition A vs B 비교. 미지원 시 시뮬레이션으로 대체. |
| VD-03 | Provenance Metadata 유지 구조 | **REQUIRED** | Section 11 DG-02: P1~P4는 COMPATIBLE WITH ANNOTATION. Execution 단계에서 Annotation 적용. READY WITH ANNOTATION. |
| VD-04 | 독립 Evaluator | **REQUIRED** | Section 9 정의됨. Partially Blind 방식 확정. 구체적 Evaluator 배정은 Execution Design에서 결정. |
| VD-05 | Live 정보 검증 경로 | OPTIONAL | 여객선 운항/날씨 등. 부재 시 "확인 필요" 표현으로 대체. |
| VD-06 | Logging / Trace | OPTIONAL | SOUL 답변 Knowledge 사용 이력. 미지원 시 Evidence Capture에 수동 기록. |
| VD-07 | Test 환경 (Staging or Simulation) | **REQUIRED** | document-based simulation = 최소 충족. READY. |
| VD-08 | place_knowledge Migration | NOT REQUIRED | 이번 Operational Validation은 migration 없이 수행 가능. |
| VD-09 | DB Schema 변경 | NOT REQUIRED | 이번 Scope에서 요구하지 않음. |
| VD-10 | Production Deployment | NOT REQUIRED | 이번 Scope에서 요구하지 않음. |

---

## 13. Governance / Minimum Validation Interpretation

### 13.1 OPEN GOVERNANCE QUESTION (유지)

```
OGQ-001: "Minimum 3 independent validations"의 정확한 기준이 정의되지 않았다.
이번 Scope에서 임의로 해석하지 않는다.
Constitution 승격 전 Governance 정본 명확화 필요.
```

이번 Operational Validation을 자동으로 1 validation count로 인정하지 않는다.

### 13.2 현재 명확한 것

- Candidate/Approved는 이미 달성되었다.
- LOCKED는 별도 Gate를 필요로 한다.
- Constitution 승격은 LOCKED 이후 별도 Governance Gate다.
- 이번 Operational Validation 결과가 LOCKED 검토 Evidence로 활용될 수 있다.
- "3 validations" 충족 여부는 Constitution 승격 시 판단한다.

---

## 14. Findings Resolution (Scope Review 31dbafd 기준)

| Finding ID | 원본 내용 | V0.2 처리 | 판정 |
|---|---|---|---|
| SA-01 | Utility threshold 미정의 — 사후 기준 변경 위험 | Section 7.4 Critical/Core Dimension 분리 + 사전 고정 기준 표 추가 | **RESOLVED** |
| SA-02 | VD-04 Blind/Non-blind 정의 미명시 | Section 9: Partially Blind 방식 확정, 허용/금지 정보 명시 | **RESOLVED** |
| MTR-01 | SF별 최소 조건 미정의 | Section 5: 각 SF에 Challenge Condition (필수) 추가 + CF 자극 대상 명시 | **RESOLVED** |
| DG-01 | OV-08용 Knowledge 문서 목록 미명시 | Section 10: P1~P5 Manifest 완성 (경로/버전/Layer/Conflict/Limitation 전체) | **RESOLVED** |
| DG-02 | 기존 문서 V0.2 Provenance 검수 미명시 | Section 11: P1~P5 전체 항목별 read-only 검수 완료 | **RESOLVED** |

Scope Review V0.1 원본 Finding은 삭제하지 않는다 (commit 31dbafd 보존).

**V0.2에서 Required Revision으로 승격하지 않은 항목 (MTR-02, NR-01~03):**  
SA-02 처리(Section 9)를 통해 MTR-02의 핵심(Generator의 즉시 자기 평가 금지, Evaluator에게 기대 정보 제공 금지)이 자연스럽게 커버됨.  
NR-01~03은 Non-blocking Recommendation으로 유지 — Section 1에서 "Simulation Phase" 명칭으로 NR-03 부분 반영.

---

## 15. Execution Readiness (V0.2)

### 판정

```
READY
```

### 근거

| 항목 | 상태 |
|---|---|
| Framework V0.2 (Candidate/Approved) | READY |
| 5개 Place Knowledge (Section 10 DG-01 Manifest 확정) | READY |
| Scope 정의 (이 문서) | READY |
| Utility Threshold (Section 7.4 사전 고정) | READY |
| Evaluator 독립성 정의 (Section 9 Partially Blind) | READY |
| Challenge Conditions (Section 5 각 SF) | READY |
| V0.2 Provenance Compatibility (Section 11 DG-02) | READY WITH ANNOTATION |
| Knowledge 문서 입력 목록 (Section 10 DG-01) | READY |
| Runtime Comparison | OPTIONAL (VD-02) |
| Evaluator 구체 배정 | Execution Design에서 결정 |

### 잔여 의존성

- **Evaluator 구체 배정 (VD-04):** Partially Blind 방식이 정의되었으나 누가/어느 세션이 Evaluator 역할을 수행할지는 Execution Design 단계에서 결정한다. 이것은 Scope 정의의 문제가 아닌 Execution 운영 배정이다.
- **DG-02 Annotation:** P1~P4 문서에서 COMPATIBLE WITH ANNOTATION 항목은 Execution 단계에서 Annotation을 적용하면서 진행 가능하다. Blocking이 아니다.

---

## 16. Explicitly Out of Scope

이 문서에서 정의하지 않는 것:

```
Runtime 코드 변경:             NO
Production 배포:               NO
DB / Schema migration:         NO
place_knowledge migration:     NO
seed:                          NO
신규 장소 Research:             NO
여섯 번째 장소 추가:             NO
신규 Candidate 생성:           NO
DreamTown Founder Philosophy Candidate 생성: NO
기존 HOLD 해제:                NO
LOCKED 승격:                   NO
Constitution 승격:             NO
"Minimum 3 validations" 충족 선언: NO (OGQ-001 미해소)
Operational Validation 실행:   NO
```

---

## 17. Risks / Open Questions

| 항목 | 성격 | 완화 방향 |
|---|---|---|
| DG-02 Annotation 미이행 시 Evidence 품질 저하 | 중간 | Execution 단계에서 각 Knowledge 입력 시 Annotation 병행 |
| Evaluator 배정 지연 | 낮음 | Execution Design에서 선행 결정 |
| OGQ-001 미해소 상태로 Constitution 승격 시도 위험 | 이 Scope 범위 밖 | Candidate/Approved 유지; Constitution Gate 별도 |
| RL-01/02/03/04 Research Gap 미해소 | OPEN | VERIFY_REQUIRED 처리 유지 |
| Single Operator 효과 | 구조적 가능성 | Evidence Capture에 동일 세션 사실 기록 |
| Challenge Condition이 실제 Scenario에서 회피되는 경우 | 낮음 | Evidence Capture 8.1의 "Challenge Condition Triggered: YES/NO" 필드로 추적 |

---

## 18. Appendix — Framework Boundary Summary

이 문서에서 전제하는 검증된 Boundary (재검증 없음):

| Boundary | 근거 |
|---|---|
| Official ≠ WE | CAND-OPS-003 V0.2 Section 4 RR-01 / Blind Test Dim 3 PASS |
| WE ≠ Truth Source | V0.2 Section 4 Layer 2 정의 |
| STABLE ≠ OFFICIAL | RR-03 Two-Axis Model / Blind Test Dim 8 PASS |
| OPERATOR_INFERENCE ≠ VERIFY_REQUIRED | RR-02 / V0.2 Section 5 Provenance Type 분리 |
| DreamTown = Background Layer | Blind Test Dim 5 PASS / CF-U4 Not triggered |
| Founder Philosophy ≠ Operational Guarantee | Blind Test CF-U3 Not triggered / Dim 10 PASS |
| Case Numeric ≠ Universal Range | RR-04 / Section 9 4단계 / FA-NI-01 처리 |
| Conflict = VERIFY_REQUIRED | Blind Test Dim 7 PASS / CF-D Not triggered |
