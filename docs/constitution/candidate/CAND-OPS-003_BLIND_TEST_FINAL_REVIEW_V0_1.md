# CAND-OPS-003 Blind Test — Final Review V0.1

**Date:** 2026-09-25
**Reviewer Role:** Independent Final Reviewer — did not participate in prior Research / Founder Review / Comparison / A/B Generation / Blind Evaluation / Unblinding
**Evidence Base:** Repository documents only
**Status:** FINAL REVIEW COMPLETE

---

## REVIEWER BOUNDARY

이 Review는 다음을 결정하지 않는다.

- Candidate Approved / SSOT Promotion / LOCKED
- Production Deployment / DB / Schema / Migration
- place_knowledge migration
- DreamTown Founder Philosophy Candidate 생성/승격

`CAND-OPS-003 = Candidate / Draft` 상태를 유지한다.

---

## PRIMARY REVIEW QUESTION

> `CAND-OPS-003 Place Knowledge Authoring Framework는 기존 네 장소에서 축적된 Evidence와 독립 Fifth Place Blind Test를 근거로 다음 Review 단계로 진행할 만큼 충분히 검증되었는가?`

---

## FINAL REVIEW DECISION

```
BLIND TEST PASS — CANDIDATE REVISION RECOMMENDED
```

근거 요약:
- Critical Failure (CF-A~G + CF-U1~U7): **0건**
- 15 Dimensions: 13 PASS / 2 PARTIAL / 0 FAIL
- SOUL Utility: 6개 시나리오 중 5개에서 Framework(B) Material Improvement / 1개 Trade-off / Regression 0
- 발견된 문제 (FA-01/02, MR-01/02, FA-NI-01)는 핵심 구조의 실패가 아니라 수정 가능한 Candidate-level Ambiguity/Missing Rule
- 단, 수정 없이 Promotion Review로 진행하기에는 Framework에 해소되지 않은 Ambiguity가 존재

---

## A. REPRODUCIBILITY

**판정: PASS**

Evidence:

금오도 비렁길 Blind Research는 기존 4개 Pilot 결과물, 기존 대화 transcript, Founder 감정적 정답 없이 수행되었다.

Blind Operator가 CAND-OPS-003만으로 재현한 것:

| 경계 | 재현 여부 |
|---|---|
| Official ≠ WE 분리 | 재현됨 (Dim 3 PASS) |
| DreamTown 언어 WE 미주입 | 재현됨 (Dim 5 PASS, Section 8 명시적 배제) |
| Stable / Live / Verify Required | 재현됨 (Dim 8 PASS) |
| Conflict 자동 해소 금지 | 재현됨 (3개 Conflict 등록) |
| Entity Boundary 분리 | 재현됨 (금오도 ≠ 비렁길 ≠ 코스 ≠ 마을) |
| Place / Route / Movement 구분 | 재현됨 (Dim 10 PASS, Evidence 기반으로 자연 도출) |
| Founder 의미 미추측 | 재현됨 (Founder Review 미수행으로 올바르게 중단) |
| 모름을 채우지 않음 | 재현됨 (Section 20 Unknowns, VERIFY_REQUIRED 등록) |

Handoff Clarity (Dim 15 PASS): 다음 담당자가 현재 상태를 명확히 파악할 수 있는 구조로 전달됨.

**결론:** 원 대화 없이 새로운 Operator가 Framework와 저장 문서만으로 Knowledge Authoring을 수행했다.

---

## B. BOUNDARY SAFETY

**판정: LARGELY PASS — 2 PARTIAL (Critical Failure 없음)**

Critical Failure Check (CF-A~G):

| CF | 판정 |
|---|---|
| CF-A WE → Official Fact 승격 | NOT TRIGGERED |
| CF-B Founder Intent → 여행자 사실 | NOT TRIGGERED |
| CF-C DreamTown 의미 → WE 결과 조작 | NOT TRIGGERED |
| CF-D Source Conflict 숨겨 단일 사실 확정 | NOT TRIGGERED |
| CF-E Live → Stable Fact 고정 | NOT TRIGGERED |
| CF-F 다른 Entity를 근거 없이 alias 처리 | NOT TRIGGERED |
| CF-G 원 대화 알아야만 Framework 사용 가능 | NOT TRIGGERED |

PARTIAL 발생:

- **Dimension 2 (Official boundary) — PARTIAL**: WE 출처 (오마이뉴스, brunch) 관찰이 Section 2 "Official/Factual Skeleton" 헤더 아래 포함. 출처 라벨은 보존되어 CF-A 미발생. 구조적 경계 불명확.
- **Dimension 6 (Provenance preservation) — PARTIAL**: "구조 상 판단" 항목에 CAND-OPS-003 공식 Provenance Type이 없음. OPERATOR_INFERENCE 임시 표기로 Correction 적용.

이 두 PARTIAL은 동일한 원인에서 발생한다: Framework가 (a) Official Layer에 허용되는 출처 유형을 명시하지 않고 (b) Operator 구조적 추론에 대한 Provenance Type을 정의하지 않았다. Operator Error이기도 하나 Framework Ambiguity/Missing Rule이 원인이다.

---

## C. STRUCTURAL FLEXIBILITY

**판정: PASS**

금오도 비렁길 구조:

```
Island (금오도) + Trail System (비렁길) + 5 Courses (Route)
+ 6 intermediate Villages (Place)
+ Ferry Access with live constraints (Movement Entry)
+ Physical trail as Movement Experience
```

기존 4개 Pilot과 비교:

| 장소 | 주요 구조 |
|---|---|
| 이순신광장 | Urban Plaza — Connection Knowledge |
| 종포해양공원 | Coastal Park — Entity Boundary, Stay |
| 하멜등대 | Destination Arrival — Founder/DreamTown separation |
| 여수해상케이블카 | Movement Experience + Situation Knowledge |
| **금오도 비렁길** | **Island + Long-distance Trail + Ferry/Live constraints + 5 Courses + 6 Villages** |

금오도는 기존 4개와 구조적으로 다른 가장 복잡한 사례였다. 9/9 Anti-Selection Bias Challenge 조건을 충족했다.

Framework가 깨지지 않은 근거:

- Route (5코스 선형) / Movement Experience (걷는 과정 자체) / Place (전망대 + 마을 체류 지점) 세 유형이 WE Evidence에서 자연 도출됨 — Framework가 답을 강제한 흔적 없음 (Dim 10)
- Entity hierarchy (Island > Trail System > Courses > Villages > Transport) 명확하게 분리됨
- Ferry Live constraints가 자연스럽게 Live/Stable 분류에 수용됨
- 5개 코스 선택 다양성 + 당일치기/1박 구조 차이가 Situation Knowledge (Dim 11)에 반영됨

---

## D. SOUL UTILITY

**판정: UTILITY EVIDENCE POSITIVE (단일 장소 / 6 Scenario / 단일 Operator / runtime 미사용 한계 있음)**

### 핵심 결과

| 항목 | 결과 |
|---|---|
| B (Framework) materially stronger | S1 / S2 / S3 / S4 / S6 — 5/6 |
| Trade-off | S5 (D10 B 우위, D12 B 약점) |
| Regression | 0건 |
| CF-U1~U7 | 0건 발생 |
| D10 Founder Intent Translation B PASS | S1 / S3 / S5 — 3/6 |
| D11 Philosophy Overexposure | 양쪽 전 시나리오 PASS |

### Framework Knowledge Layer별 기여

| Layer | 기여 내용 |
|---|---|
| Founder Intent | "않아도 돼요", "느긋하게", "충분히 만날 수 있어요" — 행동 번역 |
| Stable/Live/Verify Discipline | 자신의 정보 한계 명시, 이중 확인 소스 |
| Situation Knowledge | 동행자 이동 제약, 군중, 비 강도 구분, 상황 변수 체계 |
| World Experience | 실제 소요시간 초과, 미끄러움, 강풍, 두포 마을, 체력 소진 위험 |
| Place/Route/Movement | 코스명 구체화, 부분 코스 충분성 |
| DreamTown Comparison | 이번 테스트에서 직접 기여 관찰되지 않음 (배경 해석으로만 작동) |

### 한계 — 반드시 함께 고려

- 실제 SOUL 런타임 미사용 — 문서 기반 시뮬레이션
- 단일 장소 (금오도 비렁길 1개)
- 6개 시나리오 — 모든 여행자 유형 커버 불가
- 단일 Operator — A→B 순서 생성, 문체 학습 효과 가능성
- Framework 미완성 — FA-01/02/MR-01/02 OPEN

이번 결과를 "CAND-OPS-003이 모든 SOUL 답변을 개선한다"로 확대하지 않는다.

---

## E. ERROR DISCOVERY

**판정: Framework가 실제 약점을 발견했다 — 폐기 수준 아님**

Framework가 좋은 결과만 만든 것이 아니라 Blind Test가 실제 경계 약점을 발견했다.

### 기존 OPEN Findings (WE Review에서 발견)

- **FA-01**: Official Layer에서 허용되는 출처 범위 미정의
- **FA-02**: Operator 구조적 추론의 Provenance Type 부재
- **MR-01**: Official Layer 포함 가능 출처 유형 규정 없음
- **MR-02**: Structural Inference Provenance 규정 없음

이 4개 Finding은 Critical Failure를 일으키지 않았으나, 동일 조건에서 다른 Operator가 오류를 범할 가능성을 열어둔 채 Framework를 승격시키는 것은 적절하지 않다.

### Utility Test에서 새로 발견된 Finding

- **FA-NI-01**: WE Frictions 케이스 수치(예: 1코스 50% 초과)를 SOUL이 범용 범위("30~50%")로 변환할 위험. 케이스 단위 표현을 권장하는 가이드라인 부재.

이 Finding의 의미: Evidence 기반 Operator도 WE 수치를 synthesize할 때 과일반화할 수 있다. D12 PASS/FAIL 경계에서 발생하는 실제 리스크다.

이 문제들은 Candidate를 폐기해야 할 구조적 실패가 아니다. Framework의 명시적 규칙 부재로 인한 Ambiguity이며, 구체적 규칙 추가로 해소 가능하다.

---

## SPECIAL REVIEW — PROVENANCE ARCHITECTURE

### Official Source Boundary

**판정: AMBIGUOUS — Revision Required**

Framework Section 4 (Layer 1 Official): "official facility information / stable historical facts / officially confirmed rules"를 포함한다고 정의하나, WE 출처에서 나온 물리적으로 안정된 사실(예: 추락 경고판 설치 여부)을 Official Layer에 포함할 수 있는지 명시하지 않는다.

결과: OE-02 발생. Correction-02 필요. 다음 Operator도 동일 오류를 범할 가능성 있다.

### Structural Inference Provenance

**판정: MISSING RULE — Revision Required**

금오도처럼 구조가 복잡한 장소에서 Operator는 반드시 구조적 추론을 수행한다 ("절벽 트레일이므로 유모차 불가"). CAND-OPS-003의 Provenance Type 목록에 이를 표현할 Type이 없다.

OPERATOR_INFERENCE는 임시 표기로 사용되었으나 공식 Type이 아니다.

이 규칙 부재는 단순한 실수가 아니라 Framework가 예측하지 못한 사용 패턴이다.

### Stable ≠ Official — 두 축의 분리

**판정: CRITICAL INSIGHT — Revision Required**

CORRECTION-02 적용 과정에서 명확해진 원칙:

```
Stable / Live = Temporal Volatility Axis
Official / WE / Founder / ... = Provenance Axis
이 두 축은 독립적이다.
```

WE 출처 + STABLE 조합은 모순이 아니다: "현장에서 관찰된 물리적으로 안정된 사실"이다.

현재 Framework는 이 두 축을 충분히 명시적으로 분리하지 않는다. Operator가 "STABLE이면 Official이다"라고 오독할 구조가 존재한다.

### Numeric Generalization Risk

**판정: REAL RISK — Revision Required**

FA-NI-01: WE Frictions 케이스 수치(1코스 2hr→3hr, 종주 8.5hr→10hr)를 SOUL이 "30~50% 더 걸린다"는 범위로 변환했다.

분석:
- 50% 상한: 1코스 케이스에서 직접 지지됨
- 30% 하한: Evidence 없음. 두 케이스(50%, 17.6%) 사이 합성
- CF-U7 최종 NOT TRIGGERED ("경우도 자주 있어요" 헤지 + Evidence-based)
- D12 PARTIAL (PASS 아님)

Framework에 "WE에서 나온 수치 또는 범위를 SOUL이 일반화할 위험"을 제어하는 규칙이 없다. S5는 이 위험이 실제로 발생하는 경계 사례다.

---

## EXISTING REVIEW PLAN — PASS THRESHOLD 대조

Review Plan §8 Required for PASS:

| 기준 | 상태 |
|---|---|
| Critical Failure = 0 | ✓ (CF-A~G + CF-U1~U7 전체 0건) |
| Core provenance dimensions = PASS | ✓ (Dim 3/4/5/7 PASS) |
| Stable vs Live = PASS | ✓ (Dim 8 PASS) |
| Conflict handling = PASS | ✓ (Dim 7 PASS) |
| Entity boundary = PASS | ✓ (Dim 9 PASS) |
| Place / Route / Movement = PASS | ✓ (Dim 10 PASS) |
| SOUL Utility = PASS or PARTIAL with clearly identified non-Framework dependency | ✓ (5/6 Material Improvement, 1 Trade-off with FA-NI-01 identified) |
| New operator can complete workflow without original conversation | ✓ (Dim 1 PASS) |

PARTIAL 판정 해석 (Review Plan §8): "Framework 수정 필요 여부를 먼저 판단한다"

→ 판단: FA-01/FA-02/MR-01/MR-02/FA-NI-01 모두 Framework 수정으로 해소 가능한 Ambiguity이다. Core 구조 재설계는 불필요하다. Candidate 수정 후 다음 Review로 진행 가능하다.

---

## FINDING CLASSIFICATION

### Operator Error

**OE-01:** "구조 상 판단"을 Official Layer에 Provenance 표기 없이 배치
- Framework에 OPERATOR_INFERENCE 규칙은 없었으나, Section 9 Error Prevention #7 ("Interpretation → evidence")의 정신을 어긴 것.

**OE-02:** WE 출처 안전 관찰을 Official Section 헤더 아래 배치
- Framework Layer 1 정의가 허용 출처를 명시하지 않아 Operator 오류 발생. Framework Ambiguity에 의한 Operator Error.

### Framework Ambiguity

**FA-01:** Official Layer에서 허용되는 출처 범위 미정의
**FA-02:** Operator 구조적 추론 Provenance Type 부재
**FA-NI-01:** WE Frictions 수치 데이터의 SOUL 사용 가이드라인 부재 (Utility Test 신규 발견)

### Missing Framework Rule

**MR-01:** Official Layer 포함 가능 출처 유형 규정 없음 (FA-01의 구조적 원인)
**MR-02:** Structural Inference Provenance 규정 없음 (FA-02의 구조적 원인)
**MR-03:** Numeric/Quantitative Claim provenance 처리 규정 없음 (FA-NI-01의 구조적 원인) — 신규

### Research Limitation

**RL-01:** 1코스 정확한 거리 (5km vs 2.1km) — 현장 확인 없이 해소 불가 (OPEN)
**RL-02:** 3코스 탈출 경로 CONFLICT — 현장 확인 없이 해소 불가 (OPEN)
**RL-03:** 5코스 경험 Evidence 부족 (Section 20 기록)
**RL-04:** 여름 방문 Experience 부족 (Section 20 기록)

### Utility Limitation

- 실제 SOUL 런타임 미사용
- 단일 장소 (금오도 비렁길)
- 6개 시나리오
- 단일 Operator (A→B 생성 순서 효과 가능성)
- Live 정보 미반영

---

## REVISION REQUIREMENTS

Candidate 원문을 이번 작업에서 수정하지 않는다. 다음 Revision Requirements를 기록한다.

최소 수정 원칙: Blind Test를 통과한 구조는 재설계하지 않는다.

---

### RR-01 — Official Layer 출처 기준 명시

**Finding:** FA-01 / MR-01

**Risk:** Operator가 WE 출처 물리적 사실을 Official Layer에 포함. Downstream에서 Official 확인 사실로 오독 가능.

**Required Change:** Section 4 Layer 1 (Official) 정의에 추가:

```
Official Layer는 다음 출처에서만 채워진다:
- 정부/공공기관 공식 발행 정보
- 관리 주체 공식 안내
- 학술/법적으로 확인된 사실

물리적으로 안정적인 사실이라도 WE 출처(블로그, 기사, 후기)에서 나온 관찰은
World Experience Layer에 기록하고, Stable 분류를 별도 표기한다.

참고: Stable/Live는 시간적 휘발성 분류이며, Official/WE는 출처 유형 분류이다.
이 두 축은 독립적이다.
```

**Evidence:** OE-02, Dimension 2 PARTIAL, CORRECTION-02

---

### RR-02 — OPERATOR_INFERENCE Provenance Type 추가

**Finding:** FA-02 / MR-02

**Risk:** Operator 구조적 추론 항목이 공식 출처 사실과 동등한 위치에 기록됨. Downstream에서 신뢰도 판단 불가.

**Required Change:** Section 5 Provenance Principle에 추가:

```
OPERATOR_INFERENCE:
Operator가 알려진 구조적 사실에서 논리적으로 추론하였으나
외부 출처가 해당 결론을 직접 확인하지 않은 경우.

사용 예:
- "절벽 트레일 구조이므로 유모차 이동 불가" — 공식 확인 없는 구조적 판단
- 안전 특성에 대한 Operator 종합 판단

Note: OPERATOR_INFERENCE 항목은 나중에 공식 출처나 WE Evidence로
대체 또는 보완되어야 한다. 확정 사실로 사용하지 않는다.
```

**Evidence:** OE-01, Dimension 6 PARTIAL, CORRECTION-01

---

### RR-03 — Stable/Live 축과 Provenance 축 분리 원칙 명시

**Finding:** OE-02 근본 원인 / CORRECTION-02 발견

**Risk:** Operator가 "STABLE = Official로 간주해도 된다"고 오독할 구조 존재.

**Required Change:** Section 6 (Stable vs Live Principle)에 추가:

```
중요 원칙:

Stable/Live는 시간적 휘발성을 분류한다.
Official/WE/Founder/... 는 출처를 분류한다.

이 두 분류는 독립적이다.

유효한 조합:
- WE + STABLE: 현장 관찰된 물리적으로 안정된 사실 (예: 추락 경고판 설치, 미끄러운 경사)
- Official + LIVE: 공식 기관이 발행하나 수시로 변경되는 사실 (예: 운임)
- WE + LIVE: 현장 관찰된 변동 정보 (예: 성수기 여객선 매진 경험)
```

**Evidence:** CORRECTION-02 Layer Placement Note

---

### RR-04 — Numeric/Quantitative Claim 처리 가이드라인

**Finding:** FA-NI-01 (Utility Test 신규)

**Risk:** WE Frictions의 케이스별 수치 데이터를 SOUL이 범용 범위로 합성. Evidence 기반이나 문서화되지 않은 범위 생성.

**Required Change:** Section 9 (Error Prevention) 또는 Section 5 (Provenance Principle)에 추가:

```
수치/정량 데이터 처리 원칙:

WE Frictions에서 관찰된 수치 데이터를 사용할 때:
- 케이스 단위 표현 권장: "1코스에서 공식 2시간보다 1시간 더 걸렸다는 후기가 있다"
- 범위 합성 주의: 여러 케이스 수치를 "30~50%"처럼 범위로 합성 시
  Evidence가 그 범위를 직접 지지하는지 확인 필요
- 방향성 표현 안전: "실제로는 더 걸리는 경우가 많다" (범위 없이 방향만)
- 단일 케이스를 전체 코스에 일반화하지 않는다
```

**Evidence:** S5 Condition B "30~50%", Unblinding Section 3, D12 PARTIAL (B/S5)

---

## REMAINING LIMITATIONS

이번 Blind Test 완료 후에도 다음은 미해소 상태를 유지한다.

| 항목 | 성격 |
|---|---|
| SOUL Runtime 실제 연동 검증 | Utility Limitation |
| 여수 외 장소에서 Framework 적용 가능성 | 범위 미검증 |
| 2개 이상 독립 Operator Blind Test | 재현성 추가 검증 필요 |
| SSOT 범위와 Operations Guide 경계 | 아직 미결정 |
| RL-01/02/03/04 Research Gap | 현장 확인 없이 해소 불가 |
| DreamTown Philosophy Candidate ("자기 속도" 등) | HOLD 유지 |

---

## THREE PERSPECTIVES

### ① 세계는 어떻게 하는가

성숙한 Knowledge Architecture (Wikipedia 품질 기준, 저널리즘 팩트체킹 표준, 과학 데이터베이스)는 두 가지 축을 항상 독립적으로 관리한다: **출처(provenance)** 와 **안정성(volatility)**. "이 사실이 공식 출처에서 왔다"와 "이 사실이 시간이 지나도 바뀌지 않는다"는 서로 다른 질문이다. CAND-OPS-003는 이 방향으로 설계되어 있으나, Blind Test가 드러낸 것은 Framework 문서가 이 두 축을 충분히 명시적으로 분리하지 않았다는 점이다. 세계 표준은 두 축을 별도 스키마로 관리하며, 이 분리가 자동화와 품질 통제의 기반이 된다.

### ② Phoenix가 배워야 하는 것

Blind Test의 가장 중요한 운영 교훈은 두 가지다.

첫째, Operator는 반드시 추론한다. 어떤 문서도 완전하지 않으며, Operator는 빈 공간을 구조적 추론으로 채운다. Framework가 이 추론을 "없는 것"으로 취급하면 Operator는 임의로 표기하거나 표기하지 않는다. OPERATOR_INFERENCE라는 공식 Type을 만드는 것은 추론 자체를 막는 것이 아니라 추론을 가시화하고 관리 가능하게 만드는 것이다.

둘째, 숫자는 특히 위험하다. FA-NI-01이 보여준 것은 Evidence 기반의 숫자도 합성 과정에서 과일반화된다는 것이다. "더 걸린다"는 방향성과 "30~50% 더 걸린다"는 범위는 인식론적으로 다르다. Framework는 이 차이를 명시적으로 규정해야 한다.

### ③ 우리의 독창성

Official → World Experience → Founder → DreamTown → SOUL의 5-Layer 구조에서 이번 Blind Test가 실제로 검증한 고유 가치는 다음이다.

**Separation-first, Composition-at-use-time**이 SOUL 답변의 인식론적 정직성을 높인다는 것이 6개 시나리오에서 관찰되었다. B(Framework)는 "제가 확인할 수 없어서"라는 자신의 지식 한계를 더 명확하게 표현했다. 이것은 단순히 더 많은 정보를 가져서가 아니라, Knowledge가 출처와 함께 분리 저장되어 있어서 SOUL이 "이것은 LIVE이므로 내가 확인할 수 없다"고 판단할 수 있기 때문이다.

또한, Founder Intent가 직접 노출 없이 여행 행동 언어("않아도 돼요", "느긋하게")로 번역되는 패턴이 D10에서 반복 확인되었다. 이 번역은 Knowledge Layer 분리 없이는 불가능하다: Founder의 의미가 Official Fact나 WE Consensus와 섞이면 여행자에게 도달하는 메시지는 훨씬 덜 정확해진다.

과장하지 않는다: 이것은 단일 장소 / 6 시나리오 / 단일 Operator의 관찰이다. 그러나 방향은 옳다.

---

## CANDIDATE STATUS

```
CAND-OPS-003 = Candidate / Draft
변경 없음.

FA-01, FA-02, MR-01, MR-02: OPEN
FA-NI-01: OPEN (신규)
```

---

## SAVED FILE

`docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_FINAL_REVIEW_V0_1.md`

---

## PROJECT STATE

```
CAND-OPS-003 Blind Test = COMPLETE
Final Review Decision = BLIND TEST PASS — CANDIDATE REVISION RECOMMENDED
Candidate Status = Candidate / Draft (변경 없음)
```

---

## CURRENT NEXT ACTION

```
CAND-OPS-003 Candidate V0.2 Revision
```

수행 내용:
- RR-01: Official Layer 출처 기준 명시 (Section 4)
- RR-02: OPERATOR_INFERENCE Provenance Type 추가 (Section 5)
- RR-03: Stable/Live 축과 Provenance 축 분리 원칙 명시 (Section 6)
- RR-04: Numeric/Quantitative Claim 처리 가이드라인 추가 (Section 9 또는 Section 5)

수행하지 않는 것:
- Candidate 핵심 구조 재설계
- Blind Test를 통과한 Layer Architecture 변경
- DreamTown Philosophy Candidate 생성
- Approved / SSOT Promotion / LOCKED

---

## GIT

(commit 후 기재)
