# CAND-OPS-003 — Operational Validation Scope Review V0.1

**Date:** 2026-09-25  
**Reviewer Role:** Independent Scope Reviewer — did not participate in Framework authoring, Blind Test design/execution, Promotion Review, or Scope design  
**Evidence Base:** Repository documents only (CAND-OPS-003_V0_2, FOUNDER_APPROVAL_V0_1, PROMOTION_REVIEW_V0_1, POST_APPROVAL_OPERATIONAL_VALIDATION_SCOPE_V0_1, CONSTITUTION_GOVERNANCE.md)  
**Prior Commit Reviewed:** `94f82ab` (Post-Approval Operational Validation Scope)  
**Candidate Status At Review:** Candidate / Approved  
**Status:** SCOPE REVIEW COMPLETE

---

## REVIEWER BOUNDARY

이 Review는 다음을 수행한다:

- Scope 문서만으로 새로운 Operator가 공정하고 재현 가능하게 Operational Validation을 실행할 수 있는지 판단
- OV-01~OV-08 Testability 검증
- Validation Set / Scenario Family / Success Criteria / Critical Failure 설계 검토
- Dependency 분류 타당성 검토
- Simulation vs Runtime 경계 명확성 검토
- Anti-Bias / Independence 구조 검토
- Evidence Capture 완결성 검토
- Governance (OGQ-001) 처리 적절성 검토

이 Review는 다음을 수행하지 않는다:

- Operational Validation 실행
- Framework 재설계 또는 재검증
- Runtime 구현 / Production 배포 / DB 변경
- 신규 장소 Research
- LOCKED / Constitution 승격 판단
- Candidate/Approved 상태 변경

---

## 1. PRIMARY REVIEW QUESTION ASSESSMENT

> `이 Scope만으로 새로운 Operator가 기존 대화 없이 Operational Validation을 공정하고 재현 가능하게 실행하고, PASS/FAIL을 사전에 정의된 기준으로 판정할 수 있는가?`

**판정: 조건부 YES — MINOR REVISION 필요**

핵심 구조 (OV-01~08 정의, CF 목록, Dependency 분류, 경계 설정, Governance 처리)는 충분하다.

다만 다음 두 영역에서 새로운 Operator가 공정한 판정에 어려움을 겪을 수 있다:

1. **Utility 기준 (Section 7.4)**: "충족"의 threshold가 정의되지 않아 사후 결과를 보고 기준을 정하는 구조가 될 위험이 있다.
2. **VD-04 독립성 정의**: "독립 Evaluator"가 Blind vs Non-blind 중 어느 방식으로 평가해야 하는지 명시되지 않았다.

이 두 항목에 대한 최소 명확화가 실행 전에 이루어지면 공정하고 재현 가능한 실행이 가능하다.

---

## 2. SCOPE BOUNDARY REVIEW

각 경계가 유지되는지 확인한다.

| 경계 항목 | 확인 위치 | 판정 |
|---|---|---|
| Approved Framework 재설계 금지 | Section 2.2 "이미 Approved된 Framework 구조 — 재검증하지 않음" | MAINTAINED |
| 신규 장소 Research 금지 | Section 2.2 / Section 13 "신규 장소 Research: NO" | MAINTAINED |
| Production validation 주장 금지 | Section 13 "Production 배포: NO" | MAINTAINED |
| Runtime 구현 자동 승인 금지 | Section 4 Note "DEPENDENCY ≠ 구현 승인" | MAINTAINED |
| DB/Schema/Migration 요구 금지 | VD-08/09 NOT REQUIRED / Section 13 | MAINTAINED |
| place_knowledge migration HOLD 해제 금지 | Section 13 "place_knowledge migration: NO" | MAINTAINED |
| LOCKED / Constitution 승격 자동 연결 금지 | Section 10.4 / Section 13 "LOCKED 승격: NO" / "Constitution 승격: NO" | MAINTAINED |

**판정: PASS**

모든 경계가 명시적으로 유지된다. 특히 Section 13의 "Explicitly Out of Scope" 목록이 상세하고 명확하다.

---

## 3. OV-01~OV-08 TESTABILITY REVIEW

### OV-01 Provenance Preservation

**판정: TESTABLE**

7개 Provenance Type 구분, 합산 금지, OPERATOR_INFERENCE 명시 요건이 구체적이다.
Baseline (Dim 3/4/5/6)이 명시되어 있어 비교 기준이 존재한다.
Document-based simulation에서 SOUL 응답 내 Provenance 구분 여부를 평가할 수 있다.

### OV-02 Volatility Handling

**판정: TESTABLE**

STABLE ≠ OFFICIAL 원칙, LIVE 항목 처리 방식, VERIFY_REQUIRED 안내 요건이 명확하다.
Baseline (Dim 8, RR-03)이 명시된다.
Simulation에서 "여객선 오늘 뜨나요?"에 대해 SOUL이 "현재 확인이 필요합니다"로 응답하는지 평가 가능하다.

단, 실제 Live 데이터 fetching 동작은 Simulation에서 검증 불가능하다. 이는 Section 6.3에서 인정되었으며 Scope 범위 밖이다. Simulation 범위 내에서 TESTABLE.

### OV-03 Contextual Composition

**판정: TESTABLE**

상황 변수 선택적 사용 요건, 불필요한 정보 억제 요건이 명확하다.
Baseline (Dim 11)이 명시된다.
"중요: 모든 변수를 항상 요구하는 것이 아니다" 주석이 평가 오해를 방지한다.

### OV-04 Founder Intent Translation

**판정: TESTABLE**

철학 직접 설명 vs 행동 언어 번역의 대비가 명확하다.
"않아도 돼요", "느긋하게" 패턴이 구체적 기준으로 제시된다.
CF-U3 기준 재적용이 명시된다.
Baseline (S1/S2/S3 결과)이 있다.

### OV-05 DreamTown Boundary

**판정: TESTABLE**

"회복 = 누구나 회복된다"로 변환 금지 요건이 구체적 예시로 제시된다.
Background interpretation layer 유지 요건이 명확하다.
CF-U4 기준 재적용이 명시된다.
Baseline (Dim 5, CF-U4)이 명시된다.

### OV-06 Conflict / Uncertainty Preservation

**판정: TESTABLE**

금오도 비렁길 Conflict Register (코스 거리 / 탈출 경로 / 수치 출처)가 구체적 대상으로 명시된다.
VERIFY_REQUIRED 처리 요건이 명확하다.
CF-D (Conflict 숨겨 단일사실 확정) 기준이 Baseline으로 존재한다.

### OV-07 Numeric Generalization

**판정: TESTABLE**

RR-04의 4단계 처리 원칙 재적용 요건이 명확하다.
S5 Regression Case (FA-NI-01이 발생했던 "30~50%")가 구체적 재발 확인 대상으로 명시된다.
Bad/Better 예시 (Section 11)가 평가 기준으로 재사용 가능하다.

### OV-08 Entity / Place / Route / Movement Integrity

**판정: PARTIALLY TESTABLE**

구체적 alias 쌍이 명시된다 (종포 ≠ 여수해양공원, 하멜등대 ≠ 하멜전시관, 금오도 비렁길 진입 ≠ Route 구간 ≠ 코스).

**부족한 것:**

"새 Research는 하지 않는다. 기존 Pilot 5개 장소에서 충분히 확인 가능하다"라고 명시하나, 어느 Place Knowledge 문서가 Validation에 입력으로 제공될지 명시되지 않았다. OV-08은 entity 구분 정보가 어느 Knowledge 문서에 위치하는지를 Executor가 알아야 테스트 가능하다.

이는 VD-01 (Knowledge 주입 방식)에 의존하므로, VD-01이 확정될 때 "어느 파일의 어느 Section" 형태로 보충되면 TESTABLE이 된다.

**보완 방향:** VD-01 확정 시 OV-08 검증에 사용할 Knowledge 문서 경로 (예: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_MARINE_PARK_V0_1.md`) 목록을 명시한다. Scope 자체는 PARTIALLY TESTABLE 수준이며 Revision으로 TESTABLE로 전환 가능하다.

---

## 4. VALIDATION SET REVIEW

### 구조적 다양성 확인

| # | Place | 구조적 특성 | 주요 OV 기여 |
|---|---|---|---|
| P1 | 이순신광장 | Connection, Multi-Purpose, 접근성 높음 | OV-03, OV-04, OV-05 |
| P2 | 종포해양공원 | Stay, Entity 혼동 위험 (vs 여수해양공원) | OV-08, OV-01 |
| P3 | 하멜등대 | Destination/Transition, VERIFY_REQUIRED 다수 | OV-06, OV-04, OV-05 |
| P4 | 여수해상케이블카 | Place+Movement, Founder Intent 밀도 높음 | OV-04, OV-05, OV-08 |
| P5 | 금오도 비렁길 | Route+Movement+Live Constraint, Island Entry | OV-02, OV-06, OV-07, OV-08 |

5개 장소가 서로 다른 구조적 특성을 대표하며 OV-01~OV-08을 분산하여 커버한다. 단일 장소에 과도하게 집중된 설계가 아니다.

### 잠재적 편향 확인

P1~P4는 Framework 개발 단계에서 사용된 장소이다. 그러나 Operational Validation의 질문은 "Framework 구조가 옳은가?"가 아니라 "SOUL이 Framework를 적용하여 응답하는가?"이므로 이전에 사용된 장소도 검증 대상이 될 수 있다.

P5 (금오도)는 이미 Blind Test 대상이었다. 이번 Operational Validation에서 동일 장소를 다시 사용하는 것은 완전히 독립적인 새로운 검증이 아니다. 그러나 Scope는 이 한계를 인정하고 있으며 ("기존 Pilot Evidence를 최대한 재사용한다"), 여섯 번째 장소 추가를 금지한 것은 Scope 안정성 유지에 적합한 결정이다.

**판정: Candidate/Approved 수준의 검증에 적합. 단일 장소 한계 명시 전제.**

---

## 5. SCENARIO FAMILY REVIEW

### SF-01~SF-08 vs OV-01~OV-08 Coverage 매핑

| OV | 담당 SF |
|---|---|
| OV-01 Provenance | SF-01, SF-03, SF-05 |
| OV-02 Volatility | SF-03 |
| OV-03 Contextual Composition | SF-01, SF-02, SF-08 |
| OV-04 Founder Intent | SF-02, SF-04, SF-08 |
| OV-05 DreamTown | SF-02, SF-04, SF-08 |
| OV-06 Conflict/Uncertainty | SF-03, SF-05 |
| OV-07 Numeric | SF-01, SF-05 |
| OV-08 Entity/Route | SF-06, SF-07 |

### 위험 요소 확인

**Happy-path only 위험:** SF-04 (Emotional/Solo), SF-08 (Open Recommendation)은 Framework 강점을 보여주기 유리한 구조다. 그러나 SF-03 (Live — 오늘 날씨/여객선 운항), SF-05 (Expectation Gap — "만만하게 보지 마라"), SF-07 (Ambiguous Entity)이 명시적 역방향 테스트로 설계되어 균형을 잡는다.

**Founder-friendly prompts only 위험:** SF-04가 Founder Philosophy와 친화적인 방향으로 설계될 가능성이 있다. 그러나 CF-OV-03/04가 Critical Failure로 정의되어 있어 잘못된 응답이 발생하면 FAIL로 귀결된다.

**Live/Verify 회피 위험:** SF-03이 Live 시나리오를 명시적으로 다룬다. SOUL이 실제 데이터 없이 "현재 확인이 필요합니다"로 처리하는지를 검증할 수 있다.

**Conflict 회피 위험:** SF-05가 Expectation Gap을 다루나, 두 출처가 **서로 충돌하는 경우** (예: 출처 A는 "1코스 2시간", 출처 B는 "1코스 3시간")를 명시적으로 요구하는 시나리오가 SF-05나 SF-03 내에 포함된다는 보장이 없다.

**Numeric generalization 회피 위험:** SF-05가 "금오도 소요시간 기대 격차" 시나리오를 적합 장소로 포함한다. S5 Regression Case 재현이 목표이므로 비교적 명시적이다.

**Entity ambiguity 회피 위험:** SF-07이 직접 대상이다. 문제없다.

### 핵심 발견 — Missing Test Rule

Scope는 8개 Scenario Family를 정의하나, **각 SF에서 최소 어떤 조건의 시나리오가 포함되어야 하는지**를 명시하지 않는다.

예: SF-03의 "Live Information" 시나리오에서 반드시 "현재 데이터 없이 질문받는 상황"이 포함되어야 한다는 조건이 없다. Executor가 SOUL에게 현재 날씨/운항 정보를 미리 제공한 후 질문하면 CF-OV-01을 자연스럽게 피할 수 있다.

**권고:** 각 SF에 대해 "최소 1개의 정보 부재(incomplete information) 조건 시나리오 포함"과 같은 최소 테스트 조건을 추가한다. 새로운 Scenario Family가 아니라 기존 SF 내 조건 강화로 처리 가능하다.

---

## 6. SUCCESS CRITERIA REVIEW

### 7.1 Critical Failure = 0

**판정: 명확. 변경 불필요.**

8개 CF 코드가 OV와 명시적으로 연결되며, 발생 즉시 FAIL 판정이 된다. 이분법적이고 사전 정의되어 있다.

### 7.2 Provenance Boundary

**판정: 명확. 변경 불필요.**

3개 원칙 (OFFICIAL ≠ WE ≠ FOUNDER ≠ DREAMTOWN / STABLE ≠ OFFICIAL / OPERATOR_INFERENCE 명시)이 V0.2 정본과 일치한다.

### 7.3 Live / Verify

**판정: 명확. 변경 불필요.**

허용 처리 방식 3가지가 명시되고 CF-OV-01과의 연결이 명확하다.

### 7.4 Utility — 핵심 문제 영역

**판정: REVISION REQUIRED (Minor)**

Section 7.4의 6개 Utility 기준은 바람직한 특성을 기술하나, 각 기준의 PASS/PARTIAL/FAIL 판정 방법과 전체 Utility "충족" 여부를 결정하는 threshold가 정의되지 않았다.

**구체적 문제:**
- "상황 적합성", "행동 가능성", "Founder Intent 번역" 각각이 PARTIAL인 경우 전체가 "충족"인가 "PARTIAL 충족"인가?
- 6개 중 몇 개가 PASS면 "충족"인가?
- 어느 항목이 필수(위반 시 FAIL)이고 어느 항목이 보완적(PARTIAL 허용)인가?

**위험:** 사후 결과를 보고 threshold를 정하는 구조가 될 수 있다. 이는 Section 7의 "사후 결과를 보고 이 기준을 바꾸지 않는다" 원칙에 위배된다.

**최소 보완 방향:**

기존 Blind Test Utility Protocol (CF-U1~U7 + Dim 1~15)에서 운영 환경에 적합한 최소 threshold를 재사용한다.

예시 (제안):

```
Critical Utility (모두 PASS 필수):
  - Knowledge Limitation 표현: 모르는 것은 모른다고 표현 → 위반 시 CF-OV-01 또는 CF-OV-08 연결
  - Verification 안내: Live 항목은 확인 방법 또는 주의 안내 → 위반 시 CF-OV-01 연결

Core Utility (최소 3/4 PASS 필요):
  - 상황 적합성
  - 행동 가능성
  - Companion/Energy 고려 (해당 시나리오에 변수가 있을 때만 평가)
  - Founder Intent 번역 (OV-04 시나리오에서만 평가)

판정:
  PASS: Critical 모두 PASS + Core 3/4 이상 PASS
  PASS WITH LIMITATIONS: Critical 모두 PASS + Core 2/4 PASS + 한계 명시
  FAIL: Critical 1개라도 FAIL (CF 연동) 또는 Core 1/4 이하 PASS
```

이것은 Framework 재설계가 아니라 기존 7.4 항목에 threshold를 추가하는 최소 변경이다.

### 7.5 Overall Judgement

**판정: 7.4 보완 후 명확해짐.**

현재 "Utility 기준 충족"이 추상적이어서 PASS vs PASS WITH LIMITATIONS 경계가 불명확하다. 7.4 보완이 이루어지면 전체 판정 체계가 완성된다.

---

## 7. CRITICAL FAILURE REVIEW

### CF-OV-01~CF-OV-08 vs 최소 위험 포착 확인

| 위험 | CF 코드 | 포착 여부 |
|---|---|---|
| hallucinated live fact | CF-OV-01 | ✓ |
| unsafe recommendation | CF-OV-02 | ✓ |
| Founder Intent → factual guarantee | CF-OV-03 | ✓ |
| DreamTown meaning → traveler fact | CF-OV-04 | ✓ |
| entity conflation | CF-OV-05 | ✓ |
| unsupported numeric generalization | CF-OV-06 | ✓ |
| impossible route | CF-OV-07 | ✓ |
| silent conflict resolution | CF-OV-08 | ✓ |

**모든 8개 최소 위험 포착됨.**

### 중복/모호성 확인

CF-OV-07 (Impossible Route Combination) vs CF-OV-02 (Unsafe Movement Recommendation): 논리적으로 겹칠 수 있다 (불가능한 경로 = 안전하지 않은 추천의 극단). 그러나 두 항목이 동시에 발생하면 FAIL 강도가 높아지는 것이므로 허용 가능하다. 판정 모호성으로 이어지지 않는다.

CF-OV-01 (Live 정보 Hallucination)의 변형: VERIFY_REQUIRED 항목 (낚시 허용 여부 등 "불확실"하나 "휘발" 이슈가 아닌 경우)을 확정값으로 제시하면 CF-OV-08 (Conflict Silent Resolution)로 처리된다. 이 매핑이 OV-06 검증 포인트에서 명시되어 있어 적절하다.

**판정: Critical Failure 목록은 충분하고 상호 간 판정 모호성이 없다.**

---

## 8. DEPENDENCY REVIEW

### VD-01: Framework Knowledge 주입 (REQUIRED)

Document-based simulation이 허용되는 것은 적절하다. 그러나 REQUIRED Dependency로 분류하면서 "현재 document-based simulation으로 대체 가능"이라는 문장은 해당 Dependency가 사실상 자동 충족된다는 의미가 된다.

**핵심 질문: Document-based simulation이 "Operational Validation"이라는 명칭에 충분한가, 아니면 이것은 아직 "Operational Simulation Validation"으로 구분해야 하는가?**

판단:

Scope의 목적 (Section 1)은 "Framework Knowledge의 운영 보존 검증"이며, "Runtime 구현 없이 수행 가능한 첫 번째 운영 단계 검증"으로 정의한 것이 일관성이 있다. Document-based simulation은 Scope의 목적에 맞다.

그러나 외부 독립 Reviewer가 이 문서를 처음 읽을 때 "Operational Validation"을 Production/Runtime 환경에서의 검증으로 오해할 가능성이 있다. Scope의 Section 1 또는 제목에 "Document-Based Simulation 허용 범위" 명시를 권고한다.

**결론:** 분류는 적절. 단, 명칭 오해 방지를 위한 명시 보완 권고 (Non-blocking).

**추가 확인 필요:** VD-01이 확정되면 "어느 Place Knowledge 문서를 Validation 입력으로 사용하는가"의 목록이 필요하다. 이것이 없으면 OV-08 테스트에서 Executor 간 차이가 발생한다. (Dependency Gap — OV-08 PARTIAL TESTABLE의 원인)

### VD-03: Provenance Metadata 유지 구조 (REQUIRED)

각 Knowledge 항목에 Provenance + Volatility 메타데이터가 부착된 상태로 SOUL에 제공되어야 한다는 조건이다.

**중요한 미확인 사항:**

V0.1 기반으로 작성된 기존 Place Knowledge 문서 (P1~P4)가 V0.2 Provenance Type 표 (OPERATOR_INFERENCE 포함, Two-Axis Model) 형식을 따르는지 확인되지 않았다. V0.2가 추가된 시점 이전에 작성된 문서라면 OPERATOR_INFERENCE 레이블이 없거나 STABLE/LIVE 두 축이 분리 표기되지 않을 수 있다.

이 경우 VD-03 충족 선언 없이 Validation을 시작하면 Knowledge 입력 자체가 V0.2 기준을 만족하지 못해 평가 결과가 무효화될 위험이 있다.

**판정:** VD-03는 Validation 실행 전에 대상 Knowledge 문서의 Provenance 표기 방식을 실제로 확인해야 한다. Document 목록 확정 → Provenance 표기 검수 → 미비 시 최소 annotation 추가 단계가 필요하다. 이것은 현재 Scope에 명시되지 않은 **Dependency Gap**이다.

### VD-04: 독립 Evaluator (REQUIRED)

**현재 Scope의 한계:**

"응답 생성자와 평가자가 동일하지 않아야 함"이 원칙이나, 다음이 정의되지 않았다:

1. Blind vs Non-blind: Evaluator가 Framework Knowledge가 사용된 Condition B 응답임을 알고 평가하는가, 모르고 평가하는가?
   - Blind Test에서는 Blind Package를 통해 Evaluator가 어느 조건인지 모르고 평가했다. 이것이 Bias를 방지하는 핵심이었다.
   - Operational Validation에서 Non-blind 평가는 Evaluator가 "Framework Knowledge를 사용한 응답"이라는 정보를 가지고 평가하게 되며, Framework에 친화적인 해석을 할 가능성이 있다.
   
2. "독립"의 정의: 다른 AI 세션, 다른 AI 모델, 다른 인간, 다른 역할 컨텍스트 중 어느 수준이 요구되는가?

**판정:** VD-04는 "독립 Evaluator 확보"를 명시하나 독립성 정의가 불충분하다. 이는 Anti-Bias 원칙을 실현하기에 중요하다. **Scope Ambiguity.**

**최소 보완:** Evaluator가 최소한 "SOUL이 Framework Knowledge를 사용했다는 정보 없이" 평가하거나, 아니면 Non-blind 평가임을 Evidence에 명시하고 그 한계를 기록하는 방식 중 하나를 선택하여 명시한다.

### VD-02, VD-05, VD-06 (OPTIONAL)

OPTIONAL 분류 적절. 각각의 대체 처리 방법이 정의되어 있다.

VD-07 (Test 환경 — REQUIRED): "document-based simulation = 최소 충족"으로 자동 만족 처리. VD-01과 동일한 구조적 성격. 분류 일관성은 있으나 두 항목이 사실상 하나의 조건을 표현한다.

VD-08, VD-09, VD-10 (NOT REQUIRED): 적절하고 Scope 경계와 일관된다.

---

## 9. SIMULATION VS RUNTIME BOUNDARY

현재 Scope는 이 경계를 여러 Section에 분산하여 언급한다 (Section 6.2, 6.3, 13). 단일 명시 구역이 없어 새로운 Operator가 경계를 파악하기 위해 문서 전체를 읽어야 한다.

### Simulation으로 검증 가능한 것 (이 Scope의 범위)

- Provenance reasoning (OFFICIAL vs WE 구분)
- Stable/Live judgment (SOUL이 "확인 필요" 표현을 사용하는가)
- Founder Intent 번역 (철학 vs 행동 언어)
- DreamTown Boundary (배경 vs 사실 주장)
- Conflict 보존 (VERIFY_REQUIRED 유지 vs 임의 해소)
- Numeric generalization 방지 (범위 vs 방향 표현)
- Contextual Composition (상황 관련 Knowledge 선택)

### Runtime에서만 충분히 검증 가능한 것 (이 Scope 범위 밖)

- Metadata propagation (Retrieval 시 Provenance 태그 보존)
- 검색 동작 (관련 Knowledge 자동 Surface)
- Live 정보 실제 Fetching/연동
- 로그/Trace (Knowledge 사용 이력 자동 기록)
- Production 지연/실패 동작

**판정:** 경계 자체는 Scope 내에 포함되어 있으나 명시적 요약 Section이 없다. 새로운 Operator를 위해 경계를 한 곳에서 명시하도록 권고한다. **(Non-blocking Recommendation)**

Scope의 명칭 "Operational Validation"은 이 경계를 고려할 때 "Operational Simulation Validation (Phase 1)"으로 부기하는 것이 오해를 방지할 수 있다. 단, 현재 명칭이 Scope 내부에서 일관되게 사용되고 있어 Revision 비용 대비 효과는 낮다.

---

## 10. GOVERNANCE REVIEW

### OGQ-001: "Minimum 3 independent validations" 해석

Scope는 이 질문을 열린 상태로 유지하며 임의 해석하지 않는다:

- Section 10.3에서 정확히 불확실한 내용을 기술한다 (무엇이 "independent"인가 / 무엇이 "validation"인가)
- "이번 Scope에서 임의로 해석하지 않는다" 명시
- "Constitution 승격 전 Governance 정본 명확화 필요" 명시
- 이번 Operational Validation을 1 validation count로 자동 인정하지 않는다

이 처리는 적절하다. Governance 불확실성이 Scope 자체를 Block하지 않는다.

**판정: OPEN GOVERNANCE QUESTION 유지 — 적절.**

---

## 11. ANTI-BIAS / INDEPENDENCE REVIEW

### 역할 분리 현황

| 역할 | 현재 정의 |
|---|---|
| Scenario Designer | Scope 설계자 (이 Scope 문서) |
| Response Generator | SOUL (CAND-OPS-003 Framework Knowledge 적용) |
| Evaluator | VD-04: "독립 Evaluator" — 구체화 필요 |

### 독립성 구조 갭

**Scope Designer = Framework Author가 아닌가?**

이 Scope 문서의 Author는 "Scope Designer — does not execute validation; defines boundary, success criteria, evidence structure"로 명시된다. 그러나 Scope Designer가 Framework Author와 같은 사람(또는 AI 세션)이라면, Scenario 설계 시 Framework 강점이 드러나는 방향으로 의도치 않게 편향될 수 있다.

현재 이 독립성 문제가 명시되거나 완화 방법이 제시되지 않았다.

**Evaluator Blind 구조 부재:**

Blind Test에서 Evaluator는 Blind Package를 통해 어느 응답이 Condition A인지 B인지 모르고 평가했다. Operational Validation에서 이에 상응하는 Blind 구조가 정의되지 않았다. Evaluator가 "이것은 Framework Knowledge 적용 응답"이라고 알고 평가하면, Framework 친화적인 해석의 가능성이 존재한다.

**판정: Scope Ambiguity + Missing Test Rule**

최소 보완:
1. VD-04에서 "독립 Evaluator"의 의미를 명시한다: (a) Blind 평가 (Evaluator가 Condition 구분 정보 없이 평가) 또는 (b) Non-blind 평가 (Evaluator가 Framework 사용을 알고 평가하나, 이 한계를 Evidence에 명시)
2. Scenario Designer와 Framework Author가 동일 세션일 경우, 이 한계를 Evidence Capture에 기록하도록 명시한다.

---

## 12. EVIDENCE CAPTURE REVIEW

### 최소 Evidence 필드 확인

| 요구 필드 | Scope 8.1 필드 | 충족 |
|---|---|---|
| scenario | Scenario Family | ✓ |
| input context | Input Context | ✓ |
| knowledge supplied | Knowledge Used (Provenance 포함) | ✓ |
| provenance | Knowledge Used 내 포함 | ✓ |
| volatility | Volatility Class | ✓ |
| generated response | Generated Response | ✓ |
| verification behavior | Verification Behavior | ✓ |
| evaluation | Evaluation (OV별 PASS/PARTIAL/FAIL) | ✓ |
| critical failure | Critical Failure | ✓ |
| reviewer | Reviewer | ✓ |
| result | Result | ✓ |
| limitations | Limitation | ✓ |

모든 최소 필드가 포함된다.

### 원본 응답 보존 확인

"Generated Response"와 "Evaluation"이 별도 필드로 분리되어 있어 원본 응답과 평가 결과가 분리 보존된다. 적절하다.

### 갭 — Comparison Evidence

Section 6.1에서 "Condition A (Baseline) vs Condition B (Framework)" 비교를 원칙으로 제시하나, Section 8.1의 Evidence 필드에 Condition A 응답을 별도 기록하는 항목이 없다.

Runtime Comparison이 OPTIONAL (VD-02)이므로 비교 실행 여부가 불확실하다. 그러나 비교를 실행할 경우, Condition A 응답과 비교 판정을 Evidence에 기록하지 않으면 이후 독립 Reviewer가 "실제로 Framework가 개선을 보였는가"를 재검증할 수 없다.

**판정: Non-blocking Recommendation — 비교를 실행할 경우 Condition A 응답 필드를 Evidence에 추가한다.**

---

## 13. FINDINGS CLASSIFICATION

### Scope Ambiguity

| ID | 항목 | 영향 |
|---|---|---|
| SA-01 | Utility 기준 (Section 7.4)에 PASS 판정 threshold 미정의 | PASS vs PASS WITH LIMITATIONS 경계 불명확 — 사후 기준 변경 위험 |
| SA-02 | VD-04 "독립 Evaluator"의 Blind vs Non-blind 정의 미명시 | Anti-Bias 원칙 실현 방법 불명확 |

### Missing Test Rule

| ID | 항목 | 영향 |
|---|---|---|
| MTR-01 | Scenario Family별 최소 조건 미정의 (예: SF-03은 정보 부재 조건 필수) | Executor가 Easy scenario를 선택하여 CF 회피 가능 |
| MTR-02 | Evaluator가 Scenario Designer의 Framework 친화적 편향을 상쇄하는 구조 미정의 | Independence 구조 약화 |

### Dependency Gap

| ID | 항목 | 영향 |
|---|---|---|
| DG-01 | VD-01 확정 시 "어느 Knowledge 문서를 입력으로 사용하는가" 목록 미명시 | OV-08 PARTIALLY TESTABLE의 직접 원인 |
| DG-02 | VD-03 충족을 위해 기존 Place Knowledge 문서의 V0.2 Provenance 표기 검수 미명시 | V0.1 기반 문서 사용 시 Validation 입력 자체가 기준 미충족 가능 |

### Governance Question

| ID | 항목 |
|---|---|
| GQ-01 | OGQ-001: "Minimum 3 independent validations" — OPEN 유지 적절. 이번 Validation을 자동으로 1 count로 인정하지 않는 처리 적절. |

### Non-blocking Recommendation

| ID | 항목 |
|---|---|
| NR-01 | Scope 또는 Section 1에 Simulation vs Runtime 경계를 단일 구역으로 명시한다 |
| NR-02 | Evidence Capture (Section 8.1)에 Comparison 실행 시 Condition A 응답 필드를 추가한다 |
| NR-03 | Scope 또는 Section 1에 "Document-Based Simulation이 이번 OV의 최소 허용 실행 방식임"을 명시한다 (명칭 오해 방지) |

---

## 14. SCOPE REVIEW DECISION

```
OPERATIONAL VALIDATION SCOPE PASS WITH MINOR REVISION
```

**근거:**

핵심 구조는 충분하다:
- 경계 (Section 2, 13) 명확
- OV-01~OV-08 설계 품질 — 7/8 TESTABLE, 1/8 PARTIALLY TESTABLE (VD-01 확정 시 해소)
- Critical Failure 8개 전체 적절 설계
- Dependency 분류 (REQUIRED/OPTIONAL/NOT REQUIRED) 타당
- Governance 처리 (OGQ-001 OPEN 유지) 적절
- Evidence Capture 최소 필드 완비

실행 전 최소 명확화가 필요한 항목:
- **SA-01**: Utility 기준 threshold (Blocking 위험 — 사후 기준 변경 방지 필수)
- **SA-02 / MTR-02**: VD-04 독립성 정의 (PASS 판정 공정성)
- **MTR-01**: Scenario Family 최소 조건 (CF 회피 가능성 차단)
- **DG-01**: Knowledge 문서 입력 목록 (OV-08 testability)
- **DG-02**: 기존 문서 Provenance 검수 절차 (Validation 입력 품질 보장)

이 항목들은 Framework 구조를 재설계하지 않고 Scope 내 명확화 수준에서 처리 가능하다.

---

## 15. COMPLETION REPORT

### Scope Review Decision

```
OPERATIONAL VALIDATION SCOPE PASS WITH MINOR REVISION
```

### Scope Boundary

PASS — 7개 경계 항목 전체 유지 확인됨.

### OV-01~OV-08 Testability

| OV | 판정 |
|---|---|
| OV-01 Provenance Preservation | TESTABLE |
| OV-02 Volatility Handling | TESTABLE (Simulation 범위 내) |
| OV-03 Contextual Composition | TESTABLE |
| OV-04 Founder Intent Translation | TESTABLE |
| OV-05 DreamTown Boundary | TESTABLE |
| OV-06 Conflict / Uncertainty Preservation | TESTABLE |
| OV-07 Numeric Generalization | TESTABLE |
| OV-08 Entity / Place / Route / Movement Integrity | PARTIALLY TESTABLE (VD-01 Knowledge 문서 목록 확정 후 TESTABLE로 전환 가능) |

### Validation Set

P1~P5가 서로 다른 구조적 특성 (Connection / Stay / Destination / Place+Movement / Route+Movement+Live)을 대표하며 OV-01~OV-08을 분산 커버한다. P1~P4가 Framework 개발에도 사용된 장소라는 한계는 Scope가 인정하고 있다. Candidate/Approved 수준에서 적절하다.

### Scenario Families

SF-01~SF-08이 OV-01~OV-08 전체를 커버한다. SF-03/05/07이 역방향 테스트로 설계되어 Happy-path 편향을 완화한다. 그러나 각 SF 내 최소 조건 미정의로 Executor의 Easy scenario 선택 가능성이 존재한다 (MTR-01).

### Success Criteria

CF = 0 (명확) / Provenance Boundary (명확) / Live-Verify (명확) / **Utility (REVISION REQUIRED — threshold 미정의, SA-01)**

### Critical Failures

CF-OV-01~CF-OV-08이 최소 8개 위험을 모두 포착한다. 상호 판정 모호성 없음. 설계 품질 충분.

### Dependency Review

**VD-01:** Document-based simulation 허용 — 적절. Knowledge 문서 목록 확정 필요 (DG-01).

**VD-03:** Provenance Metadata — REQUIRED 분류 적절. 기존 Knowledge 문서 V0.2 기준 검수 절차 미명시 (DG-02).

**VD-04:** 독립 Evaluator — REQUIRED 분류 적절. Blind vs Non-blind 정의 미명시 (SA-02).

**OPTIONAL (VD-02/05/06):** 분류 적절. 대체 처리 방법 명시됨.

**NOT REQUIRED (VD-08/09/10):** 적절. Scope 경계와 일관됨.

### Simulation vs Runtime Boundary

Simulation 검증 가능: Provenance reasoning / Stable-Live judgment / Founder 번역 / DreamTown boundary / Conflict 보존 / Numeric generalization 방지 / Contextual Composition

Runtime 전용: Metadata propagation / 검색 동작 / Live data fetching / Logging / Production 동작

경계 자체는 Scope 내에 포함되나 단일 구역 명시 없음 (NR-01).

### Anti-Bias / Independence

역할 분리 (Designer / Generator / Evaluator) 구조 있음. Evaluator Blind/Non-blind 정의 없음 (SA-02). Scenario Designer와 Framework Author의 동일 세션 가능성에 대한 완화 방법 미명시 (MTR-02).

### Governance

**OGQ-001:** OPEN 유지 적절. 이번 Operational Validation을 1 count로 자동 인정하지 않는 처리 적절. LOCKED / Constitution 판단 없음.

### Findings

**Scope Ambiguity:** SA-01 (Utility threshold), SA-02 (VD-04 Blind/Non-blind)  
**Missing Test Rule:** MTR-01 (SF 최소 조건), MTR-02 (Evaluator bias 완화)  
**Dependency Gap:** DG-01 (Knowledge 문서 목록), DG-02 (V0.2 Provenance 검수)  
**Governance Question:** GQ-01 (OGQ-001 OPEN 유지 — 적절)  
**Non-blocking Recommendation:** NR-01 (Simulation 경계 단일 구역), NR-02 (Comparison Evidence 필드), NR-03 (Document-based simulation 명칭 명시)

### Candidate Status

```
CAND-OPS-003 = Candidate / Approved (변경 없음)
```

### Saved File

```
docs/constitution/candidate/CAND-OPS-003_OPERATIONAL_VALIDATION_SCOPE_REVIEW_V0_1.md
```

### Project State

```
CAND-OPS-003 Candidate Status: Candidate / Approved (유지)
Founder Approval: COMPLETE (46c473e)
Promotion Review: PASS / READY (ac388c0)
Post-Approval Operational Validation Scope: SAVED / READY WITH DEPENDENCIES (94f82ab)
Operational Validation Scope Review: PASS WITH MINOR REVISION (이 문서)
```

### Current Next Action

```
CAND-OPS-003 Operational Validation Scope Minor Revision
```

수행 내용:
1. **SA-01**: Section 7.4 Utility 기준에 PASS/PASS WITH LIMITATIONS threshold 추가 (기존 Blind Test Utility Protocol Dim 재사용)
2. **SA-02**: VD-04에 Evaluator Blind vs Non-blind 정의 추가
3. **MTR-01**: 각 SF에 최소 테스트 조건 추가 (정보 부재 조건 등)
4. **DG-01**: VD-01 확정 시 OV-08 검증용 Knowledge 문서 경로 목록 추가
5. **DG-02**: VD-03 충족을 위한 기존 문서 V0.2 Provenance 검수 절차 명시
6. NR-01~03 반영 (선택)

Framework 구조 재설계 없음. Scope 내 명확화 수준 변경만 필요.

Operational Validation을 자동 실행하지 않는다.

---

### Git

(commit 후 기재)
