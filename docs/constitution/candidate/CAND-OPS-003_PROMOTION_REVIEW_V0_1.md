# CAND-OPS-003 — Promotion Review V0.1

**Date:** 2026-09-25
**Reviewer Role:** Independent Promotion Reviewer — did not participate in Authoring / Blind Research / Blind Evaluation / Final Review / V0.2 Revision / Revision Review
**Evidence Base:** Repository documents only
**Prior Commit Reviewed:** `85da43e` (V0.2 Revision Review PASS)
**Status:** PROMOTION REVIEW COMPLETE

---

## REVIEWER BOUNDARY

이 Review는 다음을 수행한다:

- Repository Evidence와 기존 Governance만으로 Promotion 여부 판단
- Evidence Chain 무결성 검증
- 허용 Lifecycle 상태 확인 후 정확한 상태명 사용

이 Review는 다음을 수행하지 않는다:

- 기존 Blind Test / Founder Review / Comparison / Utility / Final Review / Revision 재수행
- 새로운 Research 또는 새로운 Framework 평가
- DB / Schema / Migration / Runtime / Production 변경
- DreamTown Founder Philosophy Candidate 생성 또는 기존 HOLD 해제
- `place_knowledge` migration / seed
- Governance에 정의되지 않은 상태로 직접 변경

---

## 1. GOVERNANCE LIFECYCLE VERIFICATION

### 1.1 Repository Governance 정본

`docs/constitution/CONSTITUTION_GOVERNANCE.md` (Active)

정의된 Lifecycle:

```
Research
  ↓
Candidate
  ↓
Constitution
```

`Candidate → Constitution` 요구사항 (Governance 예시):
- MVP Validation Complete
- Minimum 3 independent validations
- No critical contradiction
- Team approval (owner: 대표(푸르미르) / Aurora5 / Claude Code)

### 1.2 CAND-OPS-003 자체 정의 Lifecycle

`CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework_V0_2.md` Section 메타데이터:

```
Lifecycle: Idea → Draft → Review → Approved → LOCKED
```

현재 상태: **Draft** (최종 Revision Review 이후에도 "Candidate / Draft" 유지됨)

### 1.3 Review Plan 정의 Promotion Path

`CAND-OPS-003_REVIEW_PLAN_V0_1.md` Section 12:

```
Candidate / Draft
  → Review
  → Review Evidence
  → Promotion Decision
  → Approved
  → eventually LOCKED
```

### 1.4 Lifecycle 해석

두 Lifecycle은 상충하지 않는다.

Governance의 "Candidate" 단계는 Draft → Review → Approved → LOCKED의 내부 단계를 포함한다. "Constitution" 승격은 Candidate/Approved 이후, 여러 환경 반복 검증 후 별도 Governance Gate를 통과해야 한다.

**따라서 이번 Promotion Review의 질문은:**

> `CAND-OPS-003 Candidate/Draft → Candidate/Approved 이동이 현재 Evidence로 지지되는가?`

"Constitution" 승격 또는 "LOCKED" 처리는 이번 Review 범위 밖이다.

---

## 2. EVIDENCE CHAIN INTEGRITY

아래 연결이 끊기지 않았는지 검증한다. 재수행 없이 문서 존재 및 상태 확인만 수행한다.

| 단계 | 문서 | 상태 |
|---|---|---|
| 기존 4개 Place Pilot | V0.1 Candidate Section 2 Background 기술 | 기록됨 |
| Candidate V0.1 | `CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework.md` | 존재 확인 |
| Review Plan | `CAND-OPS-003_REVIEW_PLAN_V0_1.md` | 존재 확인 / Status: SAVED/READY |
| Fifth Place Selection | `CAND-OPS-003_BLIND_TEST_FIFTH_PLACE_SELECTION.md` | 존재 확인 / 금오도 비렁길 선정 |
| Blind Research | `CAND-OPS-003_BLIND_TEST_GEUMODO_RESEARCH_V0_1.md` | 존재 확인 |
| WE Review | `CAND-OPS-003_BLIND_TEST_GEUMODO_WE_REVIEW_V0_1.md` | 존재 확인 |
| WE Corrections | `CAND-OPS-003_BLIND_TEST_GEUMODO_WE_CORRECTIONS_V0_1.md` | 존재 확인 |
| Founder Review | `CAND-OPS-003_BLIND_TEST_GEUMODO_FOUNDER_V0_1.md` | 존재 확인 |
| DreamTown Comparison | `CAND-OPS-003_BLIND_TEST_GEUMODO_DREAMTOWN_COMPARISON_V0_1.md` | 존재 확인 |
| SOUL Utility Protocol | `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_PROTOCOL_V0_1.md` | 존재 확인 |
| A/B Execution | `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_AB_EXECUTION_V0_1.md` | 존재 확인 |
| Blind Package | `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_BLIND_PACKAGE_V0_1.md` | 존재 확인 |
| Blind Evaluation | `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_BLIND_EVALUATION_V0_1.md` | 존재 확인 / commit 8a655e3 고정 |
| Unblinding | `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_UNBLINDING_V0_1.md` | 존재 확인 / UNBLINDING COMPLETE |
| Final Review | `CAND-OPS-003_BLIND_TEST_FINAL_REVIEW_V0_1.md` | 존재 확인 / commit 8777065 |
| Candidate V0.2 | `CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework_V0_2.md` | 존재 확인 / commit e5aab3f |
| V0.2 Revision Review | `CAND-OPS-003_V0_2_REVISION_REVIEW_V0_1.md` | 존재 확인 / PASS / commit 85da43e |

**Chain 상태: INTACT**

각 단계의 Decision이 다음 단계의 입력으로 사용되었다:
- Review Plan이 Blind Test 기준을 고정 → Blind Research가 그 기준 하에 수행됨
- WE Review 발견 (FA-01/02, MR-01/02) → Final Review에 반영됨
- Utility Test 신규 발견 (FA-NI-01/MR-03) → Final Review에 포함됨
- Final Review RR-01~04 → V0.2 Revision에 반영됨
- V0.2 Revision Review가 각 RR을 독립 검증 → 모두 RESOLVED 확인

사후적으로 Evidence가 덮어쓰이거나 삭제된 흔적 없음:
- V0.1 원문 별도 보존 확인
- 과거 오류 (FA-NI-01의 "30~50%" 사례)가 Section 9에서 직접 Evidence로 인용됨 — 재작성 없음
- Blind Evaluation commit 8a655e3 고정 확인됨

---

## 3. PROMOTION CRITERIA

### A. Reproducibility

**판정: PASS**

Final Review 결론:

> 원 대화 없이 새로운 Operator가 Framework와 저장 문서만으로 Knowledge Authoring을 수행했다.

8개 재현 항목 (Official ≠ WE 분리 / DreamTown 미주입 / Stable-Live-Verify / Conflict 자동해소 금지 / Entity Boundary / Place-Route-Movement / Founder 미추측 / 모름 채우지 않음) 전체 재현됨.

Dim 1 (Framework usability without conversation): **PASS**
Dim 15 (Handoff clarity): **PASS**

### B. Provenance Discipline

**판정: PASS**

V0.2 이후:
- Official Layer 허용/불허 출처 유형 명시 (RR-01 / FA-01 RESOLVED)
- OPERATOR_INFERENCE 공식 Provenance Type 추가 (RR-02 / FA-02 RESOLVED)
- Stable ≠ Official 원칙 Two-Axis Model로 명시 (RR-03)
- Provenance Type 표: OFFICIAL / WORLD_EXPERIENCE / FOUNDER_LOCAL / FOUNDER_INTENT / DREAMTOWN / OPERATOR_INFERENCE / VERIFY_REQUIRED / LIVE_CHECK — 독립 열거형으로 분리됨

Blind Test Dim 3 (WE boundary): **PASS**
Blind Test Dim 4 (Founder boundary): **PASS**
Blind Test Dim 5 (DreamTown boundary): **PASS**
Blind Test Dim 6 (Provenance preservation): V0.2에서 PARTIAL → RESOLVED (OPERATOR_INFERENCE 공식화)

### C. Stable / Live / Verify Discipline

**판정: PASS**

Dim 8 (Stable vs Live): **PASS** (Blind Test 원판정)

V0.2 RR-03: Provenance 축(출처)과 Volatility 축(휘발성) 독립 Two-Axis Model 추가.
Four valid combinations (OFFICIAL×STABLE / OFFICIAL×LIVE / WE×STABLE / WE×LIVE) 예시 표 포함.

### D. Conflict Preservation

**판정: PASS**

Dim 7 (Conflict handling): **PASS**

Blind Research에서 3개 Conflict 등록 (코스 거리 충돌 / 탈출 경로 충돌 / 수치 출처 충돌).
자동 해소 없이 VERIFY_REQUIRED / LIVE_CHECK 분리 유지됨. CF-D (Conflict 숨겨 단일사실 확정): NOT TRIGGERED.

RL-01/02 Research Gap은 OPEN으로 이월됨 — 충돌을 숨기지 않음.

### E. Structural Flexibility

**판정: PASS**

금오도 비렁길 구조 (Island + Trail System + 5 Courses + 6 Villages + Ferry Movement Entry) = 기존 4개 Pilot 대비 가장 복잡한 구조.
Anti-Selection Bias Challenge: 9/9 조건 충족.

Framework가 Island / Route / Place / Movement Entry 4개 유형을 강제 없이 자연 도출.
Dim 9 (Entity boundary): **PASS**
Dim 10 (Place / Route / Movement): **PASS**
Dim 11 (Situation Knowledge): **PASS**

### F. SOUL Utility

**판정: UTILITY EVIDENCE POSITIVE (한계 함께 보존)**

핵심 결과:

| 항목 | 결과 |
|---|---|
| Material Improvement (Framework > Baseline) | 5/6 |
| Trade-off | 1/6 (S5 — D10 B 우위, D12 B 약점) |
| Regression (Framework < Baseline) | 0 |
| Critical Failure (CF-U1~U7) | 0 |

FA-NI-01 (Numeric Generalization Risk) → V0.2 RR-04에서 처리 기준 4단계 추가. S5 구체 예시 (Bad/Better) Section 11에 포함.

보존해야 할 한계:
- 단일 장소 (금오도 비렁길 1개)
- 6개 시나리오 (모든 여행자 유형 커버 불가)
- 단일 Operator (A→B 생성 순서 효과 가능성)
- 실제 SOUL Runtime 미사용 — 문서 기반 시뮬레이션
- Live 정보 미반영

이 결과를 "CAND-OPS-003이 모든 SOUL 답변을 개선한다"로 확대 해석하지 않는다.

### G. Error Discovery and Correction

**판정: PASS**

Blind Test가 실제 Framework 약점 5개를 발견했다 (FA-01 / FA-02 / FA-NI-01 / MR-01 / MR-02 / MR-03).
이 중 어느 것도 Critical Failure를 유발하지 않았으나, 다음 Operator에서 동일 오류가 발생할 구조적 가능성이 있었다.

V0.2 Revision에서 RR-01~04 모두 반영.
V0.2 Revision Review에서 6개 Finding 전체 독립 검증 후 RESOLVED 확인.
최소 수정 원칙 준수 — 핵심 구조 재설계 없이 추가(additive)로만 수정.
Regression 없음.

---

## 4. REMAINING LIMITATIONS — BLOCKING / NON-BLOCKING

| 한계 | 판정 | 이유 |
|---|---|---|
| Single blind fifth place | **NON-BLOCKING** | Candidate/Approved 단계에서 단일 Blind Place는 허용 가능한 첫 번째 검증. Constitution 승격 전 추가 검증 가능. |
| Six utility scenarios | **NON-BLOCKING** | 방향 증거로 충분. 더 많은 시나리오는 Post-Promotion Operational Validation에서 확인. |
| Single operator | **NON-BLOCKING** | 구조적 재현 위험이 없다는 것이 Dim 1 PASS로 확인됨. 추가 Operator 검증은 Post-Promotion 과제. |
| Runtime not tested | **NON-BLOCKING** | Candidate/Approved는 Runtime 검증을 요구하지 않는다. Runtime 연동은 Constitution 승격 또는 별도 운영 단계에서 수행. |
| Production not tested | **NON-BLOCKING** | 동상. Production은 Candidate 단계 범위 밖. |
| Live information integration not tested | **NON-BLOCKING** | Framework가 LIVE 분류를 설계적으로 분리하고 있어 통합 경로는 구조적으로 준비됨. 실제 연동은 Post-Promotion. |
| Broader Yeosu scale not tested | **NON-BLOCKING** | 5개 장소(4+1 Blind)로 구조적 반복 패턴 확인됨. 스케일 검증은 Post-Promotion Operational Evidence. |
| RL-01/02/03/04 Research Gap | **NON-BLOCKING** | 장소별 현장 확인 필요 갭이며 Framework 구조 문제가 아님. OPEN으로 이월 적절. |
| 2개 이상 독립 Operator Blind Test | **NON-BLOCKING** | Governance 예시 기준(Minimum 3 validations)은 Constitution 승격 요건. Candidate/Approved 단계는 이 요건 이전 단계. |
| DreamTown Philosophy HOLD | **NON-BLOCKING** | HOLD 상태 유지가 곧 Blocking이 아님. 별도 흐름으로 관리됨. |

**BLOCKING 항목: 0건**

---

## 5. GOVERNANCE BOUNDARY — Candidate vs Production

이번 Evidence는 다음을 증명한다:
- Framework가 독립 Operator에 의해 재현 가능하다.
- SOUL Utility에서 의미 있는 Material Improvement를 보였다.
- 핵심 Provenance Boundary가 Critical Failure 없이 유지되었다.

이번 Evidence는 다음을 증명하지 않는다:
- Runtime/Production에서의 검증
- 실제 여행자 인터뷰 기반 효과성 검증
- 여수 외 지역에서의 적용 가능성
- 다수 독립 Operator 재현성

이 두 집합을 동일시하지 않는다.

---

## 6. PROMOTION DECISION

```
PROMOTION READY WITH CONDITIONS
```

**근거:**

Evidence Chain: INTACT
Critical Failure: 0
Blocking Limitation: 0
Promotion Criteria A~G: 전체 PASS (한계 함께 보존)

**Conditions:**

1. **Founder(대표 푸르미르) 공식 승인 필요** — Governance 정본이 "Team approval"을 Promotion 요건으로 명시하고 있다. 이 Review는 독립 Reviewer 판정이며, 상태 변경 권한은 Founder/Team에 있다.

2. **상태 변경 범위: `Candidate/Draft → Candidate/Approved`** — "Constitution" 또는 "LOCKED"가 아님. Governance의 Candidate → Constitution 승격은 별도 Gate를 통과해야 한다.

3. **남은 한계 사항 Post-Promotion Operational Validation으로 이관** — Runtime 연동, 추가 Operator 검증, 더 많은 Yeosu 장소 적용은 Approved 이후 운영 Evidence로 확인한다.

---

## 7. IF PROMOTION IS APPROVED

상태 변경이 Founder로부터 승인되면:

V0.2 파일 메타데이터 업데이트:
```
Status: Candidate / Approved
Lifecycle: Idea → Draft → Review → **Approved** → LOCKED
```

이 Reviewer는 직접 상태를 변경하지 않는다.

---

## 8. THREE PERSPECTIVES

### World

Knowledge Architecture 표준 관점에서, Provenance와 Volatility의 두 축 독립 관리는 성숙한 Knowledge System의 필수 요소다. CAND-OPS-003은 V0.2에서 이 분리를 명시적으로 Two-Axis Model로 정의했다. 단일 장소 / 단일 Operator의 한계는 있으나, Blind Test가 Framework 구조적 일관성을 검증했다는 점에서 초기 Candidate 수준의 성숙도에 도달했다.

### Phoenix

이번 Pilot에서 확인된 가장 중요한 운영 원칙:

첫째, Framework가 추론을 금지하면 추론은 보이지 않게 된다. OPERATOR_INFERENCE를 공식 Type으로 만드는 것은 추론을 허용하는 것이 아니라 추론을 가시화하고 관리 가능하게 만드는 것이다.

둘째, Evidence 기반 숫자도 합성 과정에서 과일반화된다. 방향성("더 걸린다")과 범위("30~50% 더 걸린다")는 인식론적으로 다르다. Framework는 이 차이를 명시해야 한다. (RR-04 반영 완료)

셋째, Blind Test 실패는 Framework 실패가 아니다. FA-01/02/NI-01 발견은 Candidate를 폐기해야 할 이유가 아니라, SSOT 승격 전에 발견한 수정 가능한 Ambiguity였다.

### Originality

`Official → World Experience → Founder → DreamTown → SOUL` 5-Layer 구조와 Separation-first / Composition-at-use-time 원칙에서 이번 Evidence로 확인된 독창적 가치:

- SOUL이 자신의 지식 한계를 출처 분리 때문에 더 정직하게 표현할 수 있었다 ("제가 확인할 수 없어서"). 이것은 정보량의 차이가 아니라 Knowledge가 출처와 함께 분리 저장되어 있기 때문이다.
- Founder Intent가 직접 노출 없이 여행 행동 언어로 번역되는 패턴 ("않아도 돼요", "느긋하게")이 3/6 시나리오에서 관찰됐다. Layer 분리 없이는 이 번역이 불가능하다.

과장하지 않는다: 단일 장소 / 6 시나리오 / 단일 Operator의 관찰이다. 방향은 옳다.

---

## 9. REMAINING RISKS

| 위험 | 성격 | 완화 방향 |
|---|---|---|
| 다음 Operator가 V0.2 추가 규칙을 이해하지 못할 가능성 | 낮음 — Section 11 예시가 Bad/Better 비교로 충분히 설명됨 | Post-Promotion: 두 번째 Operator Blind Test |
| Runtime 연동 시 Provenance 보존 구현 어려움 | 알 수 없음 — 미검증 | Post-Promotion: SOUL Utility Runtime Validation |
| RL-01/02 Research Gap이 SOUL 응답 오류로 이어질 가능성 | 낮음 — VERIFY_REQUIRED로 명시적 처리됨 | 현장 확인 후 해소 |
| Single Operator 효과 (A→B 순서 학습) | 구조적 가능성 존재 — 단, Blind Evaluation은 별도 Reviewer가 수행 | 추가 Operator 검증 |
| Governance "Minimum 3 validations" 미충족 상태로 Constitution 승격 시도 위험 | 이번 Review 범위 밖이나, 주의 필요 | Candidate/Approved 유지; Constitution 승격은 별도 Gate |

---

## 10. CANDIDATE / REVIEW STATUS

```
CAND-OPS-003 = Candidate / Draft (이 Review에서 변경하지 않음)

Promotion Review Decision: PROMOTION READY WITH CONDITIONS

Status 변경 권한: Founder(대표 푸르미르) 공식 승인 후 실행
변경 목표 상태: Candidate / Approved

OPEN (Post-Promotion Operational Validation 대상):
- SOUL Runtime 실제 연동 검증
- 두 번째 독립 Operator Blind Test
- 더 많은 Yeosu 장소 Framework 적용
- RL-01/02/03/04 Research Gap 현장 확인
- SSOT 범위와 Operations Guide 경계 결정

HOLD (변경 없음):
- DreamTown Founder Philosophy Candidate
- place_knowledge migration / seed
- production deployment
```

---

## 11. SAVED FILE

`docs/constitution/candidate/CAND-OPS-003_PROMOTION_REVIEW_V0_1.md`

---

## 12. PROJECT STATE

```
CAND-OPS-003 Blind Test = COMPLETE
V0.2 Revision = APPLIED (e5aab3f)
V0.2 Revision Review = PASS (85da43e)
Promotion Review = PASS / READY
Promotion Review Decision = PROMOTION READY WITH CONDITIONS
Candidate Status = Candidate / Draft (변경 대기 — Founder 승인 필요)
```

---

## 13. CURRENT NEXT ACTION

```
CAND-OPS-003 Approval Decision
```

수행 주체: Founder (대표 푸르미르)

수행 내용:
- Promotion Review 결과 확인
- `Candidate/Draft → Candidate/Approved` 상태 변경 승인 또는 보류
- 승인 시: V0.2 메타데이터 Status 업데이트

자동으로 다음 작업을 실행하지 않는다.

---

## 14. GIT

(commit 후 기재)
