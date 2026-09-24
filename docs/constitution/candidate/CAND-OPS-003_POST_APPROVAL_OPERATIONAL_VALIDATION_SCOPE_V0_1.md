# CAND-OPS-003 — Post-Approval Operational Validation Scope V0.1

**Candidate:** CAND-OPS-003  
**Status:** Candidate / Approved  
**Date:** 2026-09-25  
**Basis:** Founder Approval `46c473e` / Promotion Review `ac388c0`  
**Author Role:** Scope Designer — does not execute validation; defines boundary, success criteria, evidence structure

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
Operational Validation (이 Scope)
```

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

---

## 3. Validation Objectives

### OV-01 Provenance Preservation

**질문:** Authoring 단계의 Provenance가 실제 SOUL 답변 생성 과정까지 보존되는가?

**검증 포인트:**

- SOUL이 OFFICIAL, WORLD_EXPERIENCE, FOUNDER_LOCAL, FOUNDER_INTENT, DREAMTOWN, OPERATOR_INFERENCE, VERIFY_REQUIRED를 서로 다른 신뢰 수준으로 다루는가
- 서로 다른 Provenance의 Knowledge를 하나의 확정 사실로 합치지 않는가
- OPERATOR_INFERENCE 표현이 추론임을 명시하는가

**Baseline Regresion Check:** Blind Test Dim 3 (WE boundary) / Dim 4 (Founder boundary) / Dim 5 (DreamTown boundary) / Dim 6 (Provenance) — 모두 PASS 또는 RESOLVED. 운영 환경에서도 동일 기준으로 평가.

---

### OV-02 Volatility Handling

**질문:** Provenance × Volatility Two-Axis Model이 실제 운영에서도 유지되는가?

**검증 포인트:**

- `STABLE ≠ OFFICIAL` 원칙이 답변 생성에 반영되는가
- Official 정보라도 LIVE일 수 있음을 시스템이 인식하는가
- LIVE 항목(여객선 운항, 날씨, 행사)을 확인 없이 현재 사실로 말하지 않는가
- VERIFY_REQUIRED 항목에 대해 verification 필요성을 안내하는가

**Baseline:** Blind Test Dim 8 (Stable vs Live): PASS. RR-03 Two-Axis Model: V0.2에서 적용됨.

---

### OV-03 Contextual Composition

**질문:** SOUL이 Knowledge를 그대로 나열하지 않고 여행자의 현재 상황에 맞게 조합하는가?

**검증 포인트:**

- 상황 변수(현재 장소, 시간, 동행자, 에너지, 날씨, 이동 가능성, 여행자 의도) 중 실제 답변에 필요한 변수만 사용하는가
- 필요 없는 Knowledge를 무조건 열거하지 않는가
- 상황에 맞지 않는 정보를 억제하는가

**중요:** 모든 변수를 항상 요구하는 것이 아니다. 답변에 실제로 필요한 변수만 사용하는지를 본다.

**Baseline:** Blind Test Dim 11 (Situation Knowledge): PASS.

---

### OV-04 Founder Intent Translation

**질문:** Founder Intent가 철학 설명으로 노출되는 것이 아니라 여행자의 행동 선택에 자연스럽게 번역되는가?

**검증 포인트:**

- Founder Philosophy 직접 설명이 아니라 "지금 할 수 있는 경험/행동"으로 표현되는가
- Blind Test Dim 10 개선 ("않아도 돼요", "느긋하게") 패턴이 운영에서도 나타나는가
- Founder Intent를 Operational Fact로 전환하지 않는가 (CF-U3 기준 재적용)

**Baseline:** S1/S2/S3에서 Founder Intent Translation PASS (5 Material Improvement 중 핵심 기여).

---

### OV-05 DreamTown Boundary

**질문:** DreamTown emotional meaning이 실제 여행자의 경험 사실처럼 변환되지 않는가?

**검증 포인트:**

- DreamTown에서 어떤 장소가 "회복"을 의미한다고 해서 "이 장소에 가면 누구나 회복된다"로 말하지 않는가
- DreamTown meaning은 background interpretation layer로 유지되는가
- DreamTown → Factual Guarantee 전환 (CF-U4 기준)이 운영에서도 발생하지 않는가

**Baseline:** Blind Test Dim 5 (DreamTown boundary): PASS. CF-U4: Not triggered.

---

### OV-06 Conflict / Uncertainty Preservation

**질문:** 충돌하는 Evidence가 있을 때 SOUL이 임의로 하나를 Truth로 선택하지 않는가?

**검증 포인트:**

- Conflict Register에 등록된 충돌(코스 거리 / 탈출 경로 / 수치 출처)이 운영 답변에서도 보존되는가
- uncertainty, verification, source boundary, current information check로 처리하는가
- VERIFY_REQUIRED 항목에 임의 확정값을 사용하지 않는가

**Baseline:** Blind Test Dim 7 (Conflict handling): PASS. CF-D (Conflict 숨겨 단일사실 확정): Not triggered.

---

### OV-07 Numeric Generalization

**질문:** V0.2 RR-04가 실제 SOUL 답변에서도 작동하는가?

**검증 포인트:**

- Case-level numeric이 universal range로 과일반화되지 않는가
- OPERATOR_INFERENCE 레이블 없이 합성 범위를 제시하지 않는가
- 방향 표현("더 걸린다")과 범위 표현("30~50% 더 걸린다")의 차이를 구분하는가

**Regression Case:** S5 시나리오 유형 (금오도 소요시간 기대 격차) — FA-NI-01이 발생했던 상황. 운영 환경에서 동일 패턴 재발 여부 확인.

**Baseline:** RR-04 Error 9 추가 / Section 9 4단계 Numeric Processing Principle 추가 / Section 11 Bad/Better 예시.

---

### OV-08 Entity / Place / Route / Movement Integrity

**질문:** SOUL이 다음을 잘못 합치지 않는가?

- Place ↔ Route
- Movement Experience ↔ Place
- Intermediate Place ↔ Destination Place
- Similarly named Entity

**검증 포인트:**

- 종포해양공원 ≠ 여수해양공원 (alias 금지) — 기존 Boundary Case 재확인
- 하멜등대 ≠ 하멜전시관 — 기존 Boundary Case 재확인
- 금오도 비렁길 진입 ≠ 금오도 비렁길 Route 구간 ≠ 금오도 비렁길 코스
- 케이블카 탑승 ↔ 케이블카 이동 경험 ↔ 케이블카 하차 후 장소

새 Research는 하지 않는다. 기존 Pilot 5개 장소에서 충분히 확인 가능하다.

**Baseline:** Blind Test Dim 9 (Entity boundary): PASS. Dim 10 (Place / Route / Movement): PASS.

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
| P5 | 금오도 비렁길 | (island route) | Route + Movement + Live Constraint — 여객선, 5코스, 귀항 시간 압박 |

### 4.2 검증 장소 선택 원칙

모든 장소를 모든 Scenario에 사용하지 않는다.  
각 Scenario가 해당 OV를 가장 효과적으로 검증할 수 있는 장소를 선택한다.  
중요한 것은 Framework의 서로 다른 구조적 특성이 검증되는 것이다.

---

## 5. Scenario Families

최소 다음 Scenario Family를 설계한다.  
이것은 Scenario Family 정의이며 실제 테스트를 지금 실행하지 않는다.

### SF-01 Time Constraint

시간이 부족한 여행자.  
주요 검증: OV-01 (Provenance), OV-03 (Contextual Composition), OV-07 (Numeric)  
적합 장소: P2 (종포), P4 (케이블카), P5 (금오도)

### SF-02 Low Energy / Companion

체력 또는 동행자 제약 (유아, 노인, 비활동적 동반자).  
주요 검증: OV-03, OV-04 (Founder Intent), OV-05 (DreamTown)  
적합 장소: P1 (이순신광장), P2 (종포), P5 (금오도)

### SF-03 Live Information

운항/운영/날씨/행사처럼 현재 확인이 필요한 질문.  
주요 검증: OV-02 (Volatility), OV-06 (Conflict/Uncertainty)  
적합 장소: P5 (금오도 — 여객선 운항), P4 (케이블카 — 날씨/풍속)

### SF-04 Emotional / Solo

혼자 여행하며 조용한 경험을 원하는 상황.  
주요 검증: OV-04, OV-05 (DreamTown Background)  
적합 장소: P3 (하멜등대), P5 (금오도)

### SF-05 Expectation Gap

"가볍게 갈 수 있지?" 같은 오해 가능성.  
주요 검증: OV-07 (Numeric), OV-06 (Conflict)  
적합 장소: P5 (금오도 — "만만하게 보지 마라"), P3 (하멜등대)

### SF-06 Route Question

A에서 B까지 어떻게 이어지는지.  
주요 검증: OV-08 (Entity/Place/Route), OV-02 (Volatility)  
적합 장소: P3→P4 연결 / P4→P5 연결 / P5 코스 내 이동

### SF-07 Ambiguous Entity

비슷한 장소명을 혼동할 수 있는 질문.  
주요 검증: OV-08  
적합 장소: P2 (종포 vs 여수해양공원), P3 (하멜등대 vs 하멜전시관)

### SF-08 Open Recommendation

"지금 어디 가면 좋을까?" 같은 개방형 추천.  
주요 검증: OV-03 (Contextual Composition), OV-04, OV-05  
적합 장소: 상황에 따라 P1~P5 중 선택

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

현재 SOUL Runtime은 Framework Knowledge가 **직접 주입된 상태가 아니다**.

따라서:
- Condition A (Baseline) = 현재 Runtime 상태
- Condition B (Framework) = Framework Knowledge를 명시적으로 제공하는 조건

이 비교가 Runtime 구현 없이 가능한지는 Validation Dependency (VD-02) 참조.

### 6.3 Comparison이 지원되지 않을 경우

Runtime Architecture가 이 비교를 지원하지 않는다면 억지로 구현하지 않는다.

이 경우:
- Blind Test A/B 방식의 **문서 기반 시뮬레이션**으로 대체
- "Runtime Comparison Dependency" 상태로 기록

현재 Architecture에서 Production을 가정하지 않는다.

---

## 7. Success Criteria

Operational Validation을 PASS로 판단하기 위한 기준. 사후 결과를 보고 이 기준을 바꾸지 않는다.

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

### 7.4 Utility

Framework 적용 답변이 실제 사용자 상황에서 의미 있는 Utility를 보여야 한다.

최소 기준:

| 항목 | 기준 |
|---|---|
| 상황 적합성 | 여행자 상황과 무관한 정보를 열거하지 않음 |
| 행동 가능성 | 실제 행동 선택에 도움이 되는 정보 포함 |
| Knowledge Limitation 표현 | 모르는 것은 모른다고 표현 |
| Verification 안내 | Live 항목은 확인 방법 또는 주의 안내 포함 |
| Companion / Energy 고려 | 동행자/체력 변수가 있을 때 답변에 반영 |
| Founder Intent 번역 | 철학이 행동 언어로 자연스럽게 나타남 |

### 7.5 Overall Judgement

| 결과 | 조건 |
|---|---|
| PASS | CF 0건 + Provenance Boundary 유지 + Live/Verify 적절 처리 + Utility 기준 충족 |
| PASS WITH LIMITATIONS | CF 0건 + 일부 Utility 항목 PARTIAL + 한계 명시적으로 기록 |
| FAIL | CF 1건 이상 발생 |

---

## 8. Evidence Capture

Operational Validation 결과가 추후 LOCKED 검토 Evidence가 될 수 있도록 표준 저장 구조를 정의한다.

### 8.1 Minimum Evidence Fields (시나리오별)

```
Test ID:           OV-[번호]-[날짜]
Scenario Family:   SF-01~08 중 해당
Place(s):          P1~P5 중 해당
Validation Objectives: OV-01~08 중 해당
Input Context:     여행자 상황 (시간/동행자/에너지/의도 등)
Knowledge Used:    사용된 Knowledge 항목 (Provenance 포함)
Volatility Class:  STABLE / LIVE / VERIFY 분류
Generated Response: 실제 SOUL 답변
Verification Behavior: Live/Verify 항목 처리 방식
Critical Failure:  해당 CF 코드 또는 NONE
Evaluation:        OV별 PASS / PARTIAL / FAIL
Reviewer:          독립 Reviewer 역할 명시
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

## 9. Validation Dependencies

각 Dependency를 REQUIRED / OPTIONAL / NOT REQUIRED로 분류한다.  
**Dependency 정의 ≠ 구현 승인.**

| ID | Dependency | 분류 | 설명 |
|---|---|---|---|
| VD-01 | Framework Knowledge 주입 (Read-Only) | **REQUIRED** | SOUL이 CAND-OPS-003 V0.2 Knowledge를 입력으로 받을 수 있어야 함. 현재 document-based simulation으로 대체 가능. |
| VD-02 | Runtime Comparison 환경 | OPTIONAL | Condition A(Baseline) vs Condition B(Framework) 비교를 위한 환경. 미지원 시 문서 기반 시뮬레이션으로 대체. |
| VD-03 | Provenance Metadata 유지 구조 | **REQUIRED** | 각 Knowledge 항목에 Provenance + Volatility 메타데이터가 부착된 상태로 SOUL에 제공되어야 함. |
| VD-04 | 독립 Evaluator | **REQUIRED** | 응답 생성자와 평가자가 동일하지 않아야 함. Anti-bias 원칙 유지. |
| VD-05 | Live 정보 검증 경로 | OPTIONAL | 여객선 운항/날씨 등 LIVE 항목의 실제 검증 경로. 운영 시 필요. 부재 시 "확인 필요" 표현으로 대체. |
| VD-06 | Logging / Trace | OPTIONAL | SOUL 답변 생성 과정의 Knowledge 사용 이력. 미지원 시 Evidence Capture에 수동 기록. |
| VD-07 | Test 환경 (Staging or Simulation) | **REQUIRED** | Production이 아닌 안전한 환경. 현재 document-based simulation = 최소 충족. |
| VD-08 | place_knowledge Migration | NOT REQUIRED | 이번 Operational Validation은 migration 없이 수행 가능. |
| VD-09 | DB Schema 변경 | NOT REQUIRED | 이번 Scope에서 요구하지 않음. |
| VD-10 | Production Deployment | NOT REQUIRED | 이번 Scope에서 요구하지 않음. |

---

## 10. Governance / Minimum Validation Interpretation

### 10.1 Governance 정본

`CONSTITUTION_GOVERNANCE.md` Promotion Criteria 예시:

```
Candidate → Constitution

Requires:
- MVP Validation Complete
- Minimum 3 independent validations
- No critical contradiction
- Team approval
```

### 10.2 Validation 단계 구분

| Validation 단계 | 내용 | Count 포함 가능성 |
|---|---|---|
| Candidate Authoring Validation | 기존 4개 Pilot + Geumodo Blind Test | 방향 증거 — Governance count 해석에 따름 |
| Operational Validation | 이 Scope에서 정의하는 단계 | 독립 검증으로 count 가능성 있음 |
| Production Validation | Runtime 실제 연동 후 | 독립 검증으로 count 가능성 높음 |
| Constitution Governance count | "Minimum 3 independent validations" | 공식 count 기준 정의되지 않음 |

### 10.3 OPEN GOVERNANCE QUESTION

```
OGQ-001: "Minimum 3 independent validations"의 정확한 기준이 정의되지 않았다.

- 무엇이 "independent"인가?
  - 다른 Operator? 다른 Place? 다른 Environment?
- 무엇이 "validation"으로 count되는가?
  - Authoring Pilot? Blind Test? Operational Test?
- Authoring 4개 Pilot + Geumodo Blind Test가 count에 포함되는가?

이번 Scope에서 임의로 해석하지 않는다.
Constitution 승격 전 Governance 정본 명확화 필요.
```

### 10.4 현재 명확한 것

- Candidate/Approved는 이미 달성되었다.
- LOCKED는 별도 Gate를 필요로 한다.
- Constitution 승격은 LOCKED 이후 별도 Governance Gate다.
- 이번 Operational Validation 결과가 LOCKED 검토 Evidence로 활용될 수 있다.
- "3 validations" 충족 여부는 Constitution 승격 시 판단한다.

---

## 11. Execution Readiness

### 11.1 판정

```
READY WITH DEPENDENCIES
```

### 11.2 근거

| 항목 | 상태 |
|---|---|
| Framework V0.2 (Candidate/Approved) | READY |
| 5개 Place Knowledge (4 Pilot + Geumodo) | READY — document-based |
| Scope 정의 (이 문서) | READY |
| 독립 Evaluator 확보 | DEPENDENCY (VD-04) |
| Knowledge 주입 방식 확정 | DEPENDENCY (VD-01, VD-03) |
| Runtime Comparison | OPTIONAL DEPENDENCY (VD-02) |
| Live 정보 검증 경로 | OPTIONAL (VD-05) |

### 11.3 REQUIRED Dependencies 충족 조건

다음 세 항목이 확정되면 Operational Validation 실행 가능:

1. VD-01: Knowledge 주입 방식 — document-based simulation 또는 Runtime 주입
2. VD-03: Provenance Metadata 포함 방식 확정
3. VD-04: 독립 Evaluator 역할 지정

---

## 12. Risks / Open Questions

| 항목 | 성격 | 완화 방향 |
|---|---|---|
| VD-01/03 미충족 시 Evidence 품질 저하 | 중간 | Document-based simulation으로 최소 충족 가능 |
| 독립 Evaluator 확보 어려움 | 알 수 없음 | Aurora5 / Founder / 별도 Reviewer 역할 검토 |
| Runtime 비교 미지원 시 Comparison Evidence 없음 | 낮음 — Blind Test A/B 방식 대체 가능 | Comparison Dependency로 기록 |
| OGQ-001 미해소 상태로 Constitution 승격 시도 위험 | 주의 — 이 Scope 범위 밖 | Candidate/Approved 유지; Constitution Gate 별도 |
| RL-01/02/03/04 Research Gap 미해소 | OPEN — 현장 확인 불가 | VERIFY_REQUIRED 처리 유지; 운영 중 해소 가능 |
| Single Operator 효과 | 구조적 가능성 | Post-Validation: 두 번째 독립 Operator 검증 |

---

## 13. Explicitly Out of Scope

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
```

---

## 14. Recommended Next Action

```
CAND-OPS-003 Operational Validation Scope Review
```

이 Scope 문서를 검토한 후:

1. Scope 적절성 확인 (OV-01~OV-08, Scenario Family, Success Criteria)
2. VD-01 / VD-03 / VD-04 확정 — Validation 실행 가능 여부 판단
3. Validation 실행 계획 (Operator, Evaluator, 일정)
4. OGQ-001 Governance 명확화 시점 결정 (Constitution 승격 전 필수)

---

## 15. Appendix — Framework Boundary Summary

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
