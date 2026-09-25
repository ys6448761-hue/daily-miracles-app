# CAND-OPS-003 — Post-Simulation Validation Decision V0.1

**Phase:** Post-Simulation Validation Decision  
**Date:** 2026-09-25  
**Basis:**
- `CAND-OPS-003_OPERATIONAL_VALIDATION_RESULT_REVIEW_V0_1.md` (commit ba83e4a)
- `CAND-OPS-003_OPERATIONAL_VALIDATION_INDEPENDENT_EVALUATION_V0_1.md` (commit aa1728a)
- `CAND-OPS-003_OPERATIONAL_VALIDATION_EXECUTION_DESIGN_V0_1.md` (commit 11e8db3)
- `CAND-OPS-003_POST_APPROVAL_OPERATIONAL_VALIDATION_SCOPE_V0_2.md` (commit 92176e1)
- Latest Project State (SOUL_PLACE_KNOWLEDGE_AUTHORING_STATE_2026_09_24.md)

---

## DECISION BOUNDARY

이 문서는 결정을 기록한다.

실행하지 않는 것:
- NOF-02 Relationship Knowledge 작성
- NOF-03 annotation 수정
- Runtime Validation 실행
- 추가 Simulation 실행
- Framework 수정
- Runtime 코드 변경
- 신규 Scenario / 장소 작성
- Web Research
- DB / migration / seed

---

## Confirmed Prior State

| 항목 | 상태 |
|---|---|
| Simulation Phase | CLOSED |
| Simulation Result | PASS WITH FINDINGS |
| CF-OV-01~08 | 0 triggered |
| OV-01~OV-08 | ALL PASS |
| NOF-01 | RESOLVED (남면사무소 번호 Knowledge Package 확인) |
| NOF-02 | NON-BLOCKING / Authoring Backlog |
| NOF-03 | NON-BLOCKING / Knowledge Annotation Improvement |
| CAND-OPS-003 Status | Candidate / Approved |
| Runtime Validation | NOT PERFORMED |
| Production Validation | NOT PERFORMED |

---

## NOF-02 Classification

**Finding:** SCN-06 P3 하멜등대 → P4 케이블카 Route/Relationship Knowledge 부재

### Framework Defect: NO

Framework는 Route Knowledge를 별도 Knowledge 도메인으로 설계했다. 응답에서 SOUL이 Route Knowledge 부재를 인정하고 대안(지도 참조)을 제시한 것은 OV-08 Expected Boundary Behavior에 정확히 부합한다. Framework가 잘못 설계된 결과가 아니다.

### Knowledge Coverage Gap: YES

P3→P4 Relationship Knowledge 문서가 존재하지 않는다. 이것이 발생 원인이다.

### Runtime Validation Blocker: NO

Runtime Validation이 현재 가능하지 않다(place_knowledge migration 미생성, Retrieval 코드 미구현). Runtime이 가능한 시점에서 이 Knowledge가 없으면 Simulation과 동일한 행동이 나타난다 — 알 수 없다고 인정하고 지도 참조를 권고. 이는 허용 가능한 Fallback이며 Runtime을 차단하지 않는다.

### Operational Risk: MEDIUM

실제 운영에서 여행자가 장소 간 이동 경로를 묻는 것은 반복적 패턴이다. Route Knowledge 없이 SOUL은 지리적 추론에 의존하게 된다. 안전 위험은 없지만 경험 품질의 구조적 상한선이 낮아진다.

### Recommended Timing: BACKLOG / OBSERVE

Runtime Validation이 DEFER 결정되었으므로 "BEFORE RUNTIME"은 현재 시제에서 의미가 없다. 다음 Place Knowledge Authoring Pass에서 Relationship Knowledge 유형으로 처리한다. 단, 다음 Place Knowledge Authoring이 시작될 때 첫 번째 우선순위 항목으로 배치한다.

### Decision: `BACKLOG / OBSERVE`

**근거:** Runtime이 DEFER이고, SOUL은 이 Knowledge 없이도 올바른 Fallback 행동을 보였다. 추가 Authoring Pass의 우선순위 1번으로 지정하되 지금 당장 작성을 시작하지 않는다.

---

## NOF-03 Classification

**Finding:** SCN-04 P3 하멜등대 접근 방식 VERIFY_REQUIRED 미명시

### Framework Defect: NO

Framework는 VERIFY_REQUIRED 처리 원칙을 명확히 정의한다. SOUL은 Knowledge에 없는 접근 정보를 정확히 Hedge 처리했다("것 같은데, 제가 확실하게 드릴 수 있는 정보가 아니라서요"). Hedge 행동 자체는 Framework대로 작동했다.

### Annotation Gap: YES

기존 P3 Knowledge Package에 "접근 방식: VERIFY_REQUIRED — 방파제 공공 공간 추정되나 공식 확인 없음" 명시 없음.

### Runtime Validation Blocker: NO

현재 Hedge 행동이 CF-OV-01을 회피했으며 안전하다. Annotation이 있으면 더 강한 처리가 가능하나 없어도 허용 가능한 수준이다.

### Operational Risk: LOW

Hedge 문장이 여행자에게 충분한 경고를 제공한다. 접근 방식에 대한 잘못된 단정이 없다.

### Recommended Timing: BACKLOG / OBSERVE

Routine Knowledge maintenance pass에서 처리 가능. 긴급하지 않다.

### Decision: `BACKLOG / OBSERVE`

**근거:** 기존 SOUL 행동이 올바른 방향으로 처리되었다. P3 Knowledge 문서의 다음 수정 시 annotation을 추가하는 것으로 충분하다.

---

## Runtime Validation Value Test

### RV-01: 현재 가장 큰 미검증 위험은 Runtime에서만 관찰 가능한가?

**YES**

Simulation에서 검증된 영역(Provenance reasoning, Stable/Live/Verify handling, Uncertainty preservation, Founder Intent translation, DreamTown boundary, Numeric guardrail, Entity/Route integrity, Contextual composition)은 모두 document-level behavior다.

아직 검증되지 않은 영역(Retrieval knowledge selection precision/recall, Provenance metadata propagation through code layers, Volatility metadata propagation, Live verification integration, Fallback behavior when retrieval fails, Logging/observability, Latency/failure behavior)은 Runtime에서만 관찰 가능하다.

### RV-02: Document Simulation을 반복해도 이 위험을 검증할 수 없는가?

**YES**

추가 Document Simulation은 Knowledge 문서가 주어졌을 때의 reasoning behavior만 반복 검증한다. Retrieval이 올바른 문서를 선택하는지, Provenance 라벨이 코드 레이어를 통과하는지, Live 정보를 실제로 구분하는 런타임 메커니즘이 있는지는 Document Simulation으로 알 수 없다.

### RV-03: 실제 Retrieval / Metadata / Live Verification 경로가 Runtime Validation 가능한 상태인가?

**NO**

현재 상태:
- `place_knowledge` migration: 미생성 (LOCKED)
- `travel_places.category` 컬럼 추가: BLOCKED
- Runtime 코드 변경: LOCKED
- PLACE_SUFFIX_RE `등대` 추가: BLOCKED
- Knowledge Retrieval 코드: 미구현
- SOUL ↔ place_knowledge 연결: 미구현

Runtime Validation을 수행하려면 Engineering Phase가 먼저 필요하다. 이것은 이번 Simulation 결과가 만드는 것이 아니라 별도의 제품/아키텍처 결정으로 진행된다.

### RV-04: NOF-02/03을 먼저 처리하지 않으면 Runtime 결과가 왜곡되는가?

**PARTIAL**

NOF-02 (Route Knowledge 부재)가 없으면 Runtime Validation이 Route 관련 시나리오에서 불완전한 Coverage로 진행된다. 결과가 "왜곡"되지는 않지만 Testing 범위가 좁아진다. NOF-03 (Annotation 미명시)의 영향은 미미하다.

그러나 Runtime 자체가 현재 구현되지 않았으므로 이 질문은 현재 시점에서 실행적 의미가 없다.

### RV-05: Runtime Validation 결과가 실제 다음 Architecture / Operations Decision에 영향을 줄 수 있는가?

**YES**

Runtime이 구현되고 검증된다면 그 결과는:
- place_knowledge migration 진행 여부
- Retrieval Architecture 적합성
- Provenance metadata propagation 구현 확인
- SOUL Integration 범위 결정

에 직접적 영향을 준다. Evidence 가치는 크다.

### Runtime Validation Final Decision: `RUNTIME VALIDATION — DEFER`

**이유:**

1. **기술 선결 조건 없음:** place_knowledge migration, Retrieval 코드, SOUL 연결 코드가 모두 미구현이다. Runtime Validation을 위한 Infrastructure 자체가 없다.

2. **현재 Stage에서 불필요:** Candidate/Approved는 Framework와 Knowledge Authoring 단계다. Runtime은 별도 Engineering Phase 결정이 있을 때 진행된다.

3. **Simulation Evidence로 충분:** 현재 Stage(Candidate/Approved)에서 필요한 Evidence — Framework Knowledge가 document-based injection 조건에서 Boundary와 Utility를 유지한다 — 는 이미 확보되었다.

4. **Pilot Operator Rule:** 운영보다 설계를 우선하지 않는다. Runtime Validation은 실제 운영 통합이 결정된 다음 단계다.

**Prerequisites for future Runtime Validation (별도 Engineering Gate):**
- place_knowledge migration 생성 + Knowledge 데이터 적재
- Retrieval / Injection 코드 구현
- SOUL Runtime Integration 구현
- 위 항목들은 Runtime Validation Scope 정의 전에 Engineering Phase Decision이 필요하다

---

## Additional Operational Evidence Value Test

### AS-01: 현재 Simulation에서 아직 검증되지 않은 document-level Framework behavior가 있는가?

**NO**

8개 시나리오가 OV-01~08, CF-OV-01~08, P1~P5, SF-01~08을 전부 커버했다. FA-NI-01 Regression Case 검증됨. DreamTown/Founder 고위험 시나리오(SCN-04, SCN-08) 검증됨. Entity Conflation 고위험 시나리오(SCN-07) 검증됨. 미검증 document-level behavior가 없다.

### AS-02: 추가 장소가 기존 5개와 구조적으로 다른 새로운 challenge를 제공하는가?

**NO (현재)**

대기 중인 7개 장소(오동도, 향일암, 자산공원, 돌산공원, 낭만포차거리, 중앙시장, 스카이타워/엑스포공원)의 Knowledge 문서가 아직 작성되지 않았다. 작성 없이 Simulation 입력이 될 수 없다. 장소 추가는 Simulation보다 Authoring을 먼저 요구한다.

### AS-03: 추가 Scenario가 기존 8개와 다른 새로운 failure mode를 검증하는가?

**NO (현재)**

8개 시나리오가 핵심 failure mode를 충분히 자극했다. 새로운 failure mode 후보(복합 DreamTown+Founder 동시 노출, 다중 Entity 충돌, Multi-hop Route Query)가 있지만 이는 엣지 케이스이며 Framework의 핵심 Boundary 검증을 추가로 요구하지 않는다. 새로운 Place Knowledge가 작성된 이후 해당 Place 특성에 맞는 Scenario를 설계하는 것이 적합하다.

### AS-04: 추가 Simulation이 Runtime Evidence를 대신할 수 있는가?

**NO**

Retrieval behavior, Metadata propagation, Live verification integration은 Document Simulation으로 대체할 수 없다.

### AS-05: 추가 Simulation의 예상 Evidence Gain이 비용보다 큰가?

**NO**

현재 Evidence Base(5 Places, 8 Scenarios, 0 CF, OV ALL PASS)는 Candidate/Approved 단계에 충분하다. Runtime이 DEFER이므로 "Runtime 준비를 위한 추가 Simulation"도 필요 없다. 반복 Simulation은 새로운 불확실성을 줄이지 않는다.

### Additional Simulation Decision: `NO ADDITIONAL SIMULATION NOW`

**이유:** 현재 Evidence Base가 단계에 충분하다. 추가 Simulation은 신규 Place Knowledge 작성 또는 신규 Framework behavior 추가가 있을 때 자연스럽게 뒤따른다.

---

## OGQ-001 Governance

**Status:** OPEN

**Blocking current operations?** NO

이번 Simulation은 Candidate/Approved 단계의 Operational Validation이다. OGQ-001의 "Minimum 3 independent validations" 조건은 Constitution 승격 Gate의 요건이지 Operational Validation 수행 자체의 조건이 아니다. 이번 결과가 그 카운트에 포함되는지 여부는 별도 Governance 해석 없이 결정할 수 없다.

이번 Simulation을 자동으로 "1/3 validation"으로 계산하지 않는다.

**Resolution Target:** Governance / Constitution Review Stage — LOCKED 검토 진입 시점에서 별도 Governance Gate를 통해 해결한다.

**Separate from Operational Validation?** YES — 운영 검증과 Governance 승격 조건을 섞지 않는다.

---

## Framework Revision Decision

| 판단 기준 | 결과 |
|---|---|
| Critical Failure 발생 | NO — 0건 |
| OV Failure 발생 | NO — OV-01~08 ALL PASS |
| Provenance model defect | NO — OFFICIAL/WE/FOUNDER/DREAMTOWN 경계 유지 확인됨 |
| Two-Axis model defect | NO — STABLE/LIVE/VERIFY 운영에서 작동 확인됨 |
| Numeric guardrail defect | NO — FA-NI-01 regression case NOT repeated |
| Founder/DreamTown boundary defect | NO — SCN-04/08 모두 Clean |
| NOF-02가 Framework defect인가 | NO — Knowledge Coverage Gap |
| NOF-03가 Framework defect인가 | NO — Annotation Gap |

### Decision: `NO FRAMEWORK REVISION REQUIRED`

Candidate/Approved 상태 유지. V0.3 작성 없음. Approval 취소 없음.

---

## Decision Matrix

| Item | Classification | Decision | Blocking? | Timing |
|---|---|---|---|---|
| NOF-02 (P3→P4 Route Knowledge) | Knowledge Coverage Gap | BACKLOG / OBSERVE | NO | 다음 Authoring Pass 우선순위 1번 |
| NOF-03 (P3 접근 VERIFY_REQUIRED 미명시) | Annotation Gap | BACKLOG / OBSERVE | NO | P3 Knowledge 다음 수정 시 |
| Runtime Validation | Evidence Gap (Technical Prerequisites Absent) | DEFER | NO | Engineering Phase 결정 후 |
| Additional Simulation | No new uncertainty to resolve | NO ADDITIONAL SIMULATION NOW | NO | 신규 Place Knowledge 작성 완료 후 재검토 |
| OGQ-001 | Governance Open Question | OPEN | NO | Constitution Review Stage |
| Framework Revision | No Evidence for defect | NO REVISION REQUIRED | NO | — |

---

## Three Perspectives

### World

성숙한 Knowledge System에서는 document-based simulation이 필요하지만 충분하지 않은 검증 단계다. 다음 필요한 Evidence 유형은 **Runtime Retrieval Behavior**다:

- **Retrieval precision/recall:** SOUL이 관련 Knowledge 문서를 올바르게 선택하는가
- **Provenance metadata propagation:** 코드 레이어를 통과하면서 source_type, confidence, do_not_promote 라벨이 보존되는가
- **Volatility metadata propagation:** STABLE/LIVE/VERIFY 구분이 Runtime에서도 인식되는가
- **Live verification routing:** LIVE 항목이 확인 경로로 올바르게 라우팅되는가
- **Fallback behavior:** Knowledge 없을 때 SOUL이 무엇을 하는가

이 Evidence들은 Document Simulation으로 대체할 수 없으며 Engineering 구현 후 별도 Validation Pass가 필요하다. 현재 Stage에서 이를 강제할 이유는 없다 — Architecture가 준비되면 자연스럽게 다음 Gate가 된다.

### Phoenix

현재 가장 작은 비용으로 가장 큰 불확실성을 줄이는 행동은 **P3→P4 Relationship Knowledge Authoring**이다.

Simulation이 노출한 구조적 공백은 Route/Relationship Knowledge 부재다. 이것은 실제 여행자가 반복적으로 겪을 상황(장소 이동 경로 질문)이며, Knowledge 작성으로 직접 해결 가능하다. Runtime Infrastructure 구현을 기다릴 필요 없이 시작할 수 있다.

추가 Simulation, Runtime Validation Scope 설계, Framework 문서화는 현재 시점에서 새로운 Evidence를 제공하지 않는다. 실제 Knowledge Authoring이 Product에 가장 가까운 다음 단계다.

### Our Originality

`Separation-first → Composition-at-use-time` 방식이 Simulation에서 확인한 것:

**작동하는 영역:** Knowledge가 올바르게 작성되고 Annotated된 곳에서 Boundary violations가 자연스럽게 방지된다. SCN-04/08에서 DreamTown 층위가 분리되어 있었기 때문에 SOUL이 감정 맥락에서 WE 패턴만으로 답할 수 있었다. SCN-03에서 Conflict가 Provenance로 분리되어 있었기 때문에 SOUL이 충돌을 명시할 수 있었다.

**한계:** Composition이 일어날 때 필요한 Knowledge 유형이 없으면(SCN-06, P3→P4 Route), Separation 구조가 있어도 SOUL이 구조적 추론에 의존한다. **Knowledge Authoring의 완성도가 Composition 품질의 상한선이다.**

이것은 설계 실패가 아니라 설계의 전제다: 분리 구조가 효과를 내려면 분리된 Knowledge가 실제로 존재해야 한다. 다음 행동은 이 전제를 강화하는 것 — Relationship Knowledge 작성.

---

## Decision Status

```
POST-SIMULATION DECISION COMPLETE WITH OPEN GOVERNANCE QUESTION
```

모든 운영 결정(NOF-02, NOF-03, Runtime, Additional Simulation, Framework)이 현재 Evidence로 결정 가능했다. OGQ-001은 별도 Governance Question으로 유지된다.

---

## Explicitly Not Executed

- Operational Validation Result Review 재실행: NO
- Independent Evaluation 재실행: NO
- Raw Response 재생성: NO
- NOF-01 재검증: NO (RESOLVED 확인만)
- NOF-02 Route Knowledge 작성: NO (DECISION ONLY)
- NOF-03 annotation 수정: NO (DECISION ONLY)
- Runtime Validation 실행: NO
- Runtime 코드 변경: NO
- Production 배포: NO
- 추가 Simulation 실행: NO
- 신규 Scenario 생성: NO
- 신규 Place 선정: NO
- 신규 Place Research: NO
- Web Research: NO
- DB / schema / migration / seed: NO
- Candidate V0.3 작성: NO
- Candidate Status 변경: NO
- LOCKED: NO
- Constitution 승격: NO
- OGQ-001 임의 해석: NO
- DreamTown Founder Philosophy Candidate 생성: NO
