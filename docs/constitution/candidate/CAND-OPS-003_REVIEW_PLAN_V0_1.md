# CAND-OPS-003 — SOUL Place Knowledge Authoring Framework Review Plan V0.1

**Candidate:** CAND-OPS-003  
**Review Plan Version:** V0.1  
**Status:** SAVED / READY  
**생성일:** 2026-09-24  
**선행 문서:** `docs/constitution/candidate/CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework.md`

---

## CRITICAL NOTE — Review Protocol Purpose

이 문서는 Candidate를 승인하기 위한 것이 아니다.

> **결과를 보기 전에 검증 방법과 PASS/FAIL 기준을 먼저 고정한다.**

Review Plan 저장 이후:
- 다섯 번째 장소 실제 Research 시작하지 않음
- Candidate 수정하지 않음
- Candidate Approved 처리하지 않음
- SSOT 승격하지 않음

---

## 1. Primary Review Question

> **Can a new operator who does not know the original conversations use CAND-OPS-003 to author a fifth Yeosu place while preserving the same knowledge boundaries and producing knowledge usable by SOUL?**

한국어:

> 기존 대화를 모르는 새로운 담당자가 CAND-OPS-003만으로 다섯 번째 여수 장소를 작성해도, 동일한 Knowledge Boundary와 SOUL 활용 가능성을 재현할 수 있는가?

이 질문이 Review의 중심이다.

---

## 2. What Is Being Tested

"좋아 보임"을 검증하는 것이 아니다. 다음을 검증한다.

| Test | 내용 |
|---|---|
| Test A — Reproducibility | Framework가 원 작성자 없이 재현 가능한가? |
| Test B — Provenance Discipline | 서로 다른 Knowledge Layer를 섞지 않는가? |
| Test C — Uncertainty Handling | 모르는 것과 충돌하는 것을 VERIFY/LIVE로 남길 수 있는가? |
| Test D — Structural Flexibility | 새 장소의 특성이 기존 네 장소와 달라도 Framework가 작동하는가? |
| Test E — SOUL Utility | 작성된 Knowledge가 실제 상황형 여행 질문에 사용 가능한가? |

---

## 3. Blind Test Principle

5번째 장소 작업자 조건:

- 기존 Pilot 대화에 참여하지 않은 AI 또는 사람
- 기존 네 장소 작성 과정을 모르는 담당자

### Blind Operator에게 허용하는 것 (ALLOWED)

1. `CAND-OPS-003` 전체 문서
2. 필요한 공식 DreamTown SSOT 최소 범위
3. 조사 대상 장소명
4. Research 수행에 필요한 일반적인 검색/조사 도구
5. Review Protocol에서 허용한 source access

### Blind Operator에게 제공하지 않는 것 (NOT PROVIDED)

- 이순신광장 / 종포해양공원 / 하멜등대 / 케이블카 Pilot 결과
- 기존 네 장소의 Founder Review
- 기존 대화 transcript
- 이번 실험에서 기대하는 정답
- Founder의 해당 장소 감정적 의미
- DreamTown의 해당 장소 감정적 정답을 World Experience 단계에 주입하는 자료

목적: `Framework 자체의 전달력`을 검증.

---

## 4. Fifth Place Selection Criteria

장소는 Review Plan 저장 이후 선정한다.

### Required

- 여수의 실제 장소
- 여행자가 실제 방문할 가능성이 있음
- Official information 존재
- World Experience 자료 확보 가능
- Route/Relationship 요소 존재 가능
- 일부 Live/Volatile 정보가 존재
- SOUL이 실제로 추천/설명할 가능성이 있음

### Preferred

기존 네 장소와 완전히 동일한 유형보다 새로운 Challenge가 있는 장소.

예:
- 자연 장소 / 섬
- 산책/트레킹 장소
- 시장
- 역사 장소
- 이동과 체류가 함께 있는 장소
- 시간/날씨 영향이 큰 장소

### Avoid

- Evidence가 거의 없는 장소
- 사실상 단일 상업시설
- 기존 Pilot 장소의 단순 alias
- 이미 작성된 네 장소와 지나치게 동일한 사례

### Anti-Selection Bias Rule

Framework가 잘 작동할 것 같은 장소만 선택하지 않는다.

다음 중 2개 이상을 포함하는 장소를 우선한다:
- conflicting traveler reports
- changing operating information
- ambiguous entity relationship
- accessibility issue
- weather dependence
- companion dependence
- route dependence
- day/night difference
- strong expectation vs actual experience gap

목적: Framework를 성공시키는 것이 아니라 `실패할 수 있는 조건에서 검증`.

---

## 5. Test Phases

### Phase 1 — Official / Factual Skeleton

Blind Operator에게 Official Layer를 먼저 작성하게 한다.

평가:
- identity / factual skeleton
- stable facts
- current operational facts separation
- source provenance
- uncertainty

PASS: Official source가 말하지 않은 경험/감정을 Official Fact로 작성하지 않음.

---

### Phase 2 — World Experience

Founder/DreamTown 의미를 제공하지 않은 상태에서 World Experience Research를 수행한다.

Research question:

> 사람들이 이 장소에 "가는 것"을 넘어 실제로 무엇을 경험하는가?

확인:
- behavior / sequence / emotion / friction / disappointment
- companion difference / time difference / weather difference
- relationship with nearby places

Important: `World Experience = Knowledge Input` — NOT Truth Source

---

### Phase 3 — Conflict Detection

Blind Operator가 충돌을 스스로 발견하는지 본다.

충돌 발견 시 요구 행동:

```
DO NOT RECONCILE SILENTLY
→ conflicting claims 기록
→ source provenance 기록
→ VERIFY_REQUIRED / LIVE_CHECK 분리
```

PASS: 불확실한 사실을 자신 있게 하나의 정답으로 만들지 않음.

---

### Phase 4 — Entity Boundary

장소와 주변 장소/시설/Route의 관계 확인.

평가:
- alias 여부 / nearby 여부 / contained-in 여부
- route relationship / independent place 여부

PASS: "가깝다"는 이유만으로 같은 Entity로 병합하지 않음.

---

### Phase 5 — Place / Route / Movement

Blind Operator가 다음을 구별할 수 있는지:

| 유형 | 내용 |
|---|---|
| Place | 장소 자체의 경험 |
| Route / Relationship | 다른 장소와의 연결 |
| Movement Experience | 이동 과정 자체가 경험이 되는 경우 |

모든 장소에 Movement Experience가 있다고 강제하지 않는다.

PASS: 새 장소의 실제 특성에 맞는 구조를 선택.

---

### Phase 6 — Stable vs Live

Knowledge를 Stable vs Live/Volatile로 구분.

| Stable 예시 | Live 예시 |
|---|---|
| 장소 정체성 | 오늘 운영시간 |
| 반복 경험 | 현재 가격 |
| 공간 특성 | 날씨 / 폐쇄 / 행사 |

PASS: 현재 확인이 필요한 정보를 영구 지식처럼 저장하지 않음.

---

### Phase 7 — Founder Review

World Experience Review 완료 후에만 Founder Review 수행.

Founder에게 World Experience 결론을 정답처럼 설명하지 않는다.

Core question:

> 대표님은 왜 소원이에게 이 장소를 경험하게 하고 싶으셨나요?

Founder 결과는 `FOUNDER_LOCAL / FOUNDER_INTENT / FOUNDER_PHILOSOPHY_EVIDENCE`로 구분.

---

### Phase 8 — DreamTown Comparison

Founder Review 이후에만 기존 DreamTown SSOT와 비교.

평가:
- independent convergence / divergence / possible continuity / conflict

금지:
- `World Experience proves DreamTown`
- `Founder proves traveler consensus`

---

### Phase 9 — SOUL Utility Test

완성된 Place Knowledge를 사용하여 최소 5개 Situation Question 테스트.

서로 다른 조건 포함 필수:

| Category | Example |
|---|---|
| A. Energy | "지금 너무 피곤한데 여기 가도 괜찮아?" |
| B. Companion | "부모님과 같이 왔는데 많이 걷기 힘들어." |
| C. Weather | "비가 오기 시작했는데 지금 가도 돼?" |
| D. Time | "한 시간밖에 없는데 여기를 넣을까?" |
| E. Desire | "사람 많은 데 싫고 조용히 있고 싶어." |

실제 질문은 선택된 장소에 맞게 작성.

평가: SOUL이 단순 장소 설명을 반복하지 않고 `Place + Route + Situation + Live`를 필요한 만큼 조합 가능한가?

---

## 6. Evaluation Rubric

점수 경쟁 없음. 각 항목을 판정한다:

`PASS / PARTIAL / FAIL / NOT APPLICABLE`

| # | Dimension |
|---|---|
| 1 | Framework usability without conversation |
| 2 | Official boundary |
| 3 | World Experience boundary |
| 4 | Founder boundary |
| 5 | DreamTown boundary |
| 6 | Provenance preservation |
| 7 | Conflict handling |
| 8 | Stable vs Live |
| 9 | Entity boundary |
| 10 | Place / Route / Movement distinction |
| 11 | Situation Knowledge |
| 12 | SOUL utility |
| 13 | Over-research / unnecessary complexity |
| 14 | Missing critical knowledge |
| 15 | Handoff clarity |

---

## 7. Critical Failure Conditions

다음 중 하나라도 발생하면 자동 승격 금지.

| Critical Fail | 내용 |
|---|---|
| A | World Experience → Official Fact 승격 |
| B | Founder Intent → 일반 여행자 사실로 기록 |
| C | DreamTown 감정 의미 → World Experience 결과로 조작 |
| D | 명확한 Source Conflict를 숨기고 하나의 사실로 확정 |
| E | Live information → Stable Fact로 고정 |
| F | 서로 다른 Place Entity를 근거 없이 alias 처리 |
| G | 원 대화를 알아야만 Framework를 사용할 수 있음 |

Critical Fail 발생 시: `Candidate → REVISE` — SSOT 승격 금지.

---

## 8. PASS Threshold

### Required for PASS

- Critical Failure = 0
- Core provenance dimensions = PASS
- Stable vs Live = PASS
- Conflict handling = PASS
- Entity boundary = PASS or N/A
- Place / Route / Movement = PASS or justified N/A
- SOUL Utility = PASS or PARTIAL with clearly identified non-Framework dependency
- new operator can complete workflow without original conversation

PARTIAL이 다수 발생하면 단순 숫자로 PASS시키지 않는다.  
Framework 수정 필요 여부를 먼저 판단한다.

---

## 9. Review Bias Controls

다음을 금지한다:

- 결과를 본 뒤 PASS 기준 완화
- Founder가 Blind Research 중간에 정답 제공
- Lumi가 기존 Pilot 답안을 전달
- 기존 네 장소 문서를 예시 답안으로 제공
- DreamTown 감정을 World Experience 검색어에 삽입
- 실패 항목을 "의도는 맞았다"로 PASS 처리

Review는 Candidate를 보호하기 위한 것이 아니라 검증하기 위한 것이다.

---

## 10. Failure Is Valuable Evidence

> **Blind Test 실패는 프로젝트 실패가 아니라 Candidate를 SSOT로 만들기 전에 발견한 성공적인 Evidence다.**

실패 시:
1. failure 기록
2. root cause 분리 (Framework 문제 vs Operator 문제)
3. Candidate 수정 여부 결정
4. 필요하면 재시험

결과를 맞추기 위해 Evidence를 삭제하지 않는다.

---

## 11. Review Artifacts (Required)

Blind Test 완료 시 최소 다음 Evidence를 남긴다:

1. Blind Operator Input Package
2. Fifth Place Official Review
3. Fifth Place World Experience Review
4. Conflict / Verification Register
5. Founder Review
6. DreamTown Comparison
7. SOUL Utility Test (최소 5개 질문)
8. Evaluation Matrix (15개 dimension)
9. Review Decision: PASS / REVISE / HOLD

---

## 12. Promotion Boundary

Blind Test PASS는 자동 SSOT 승격이 아니다.

```
Candidate / Draft
  → Review
  → Review Evidence
  → Promotion Decision
  → Approved
  → eventually LOCKED
```

단계를 건너뛰지 않는다.

---

## 13. DreamTown Philosophy Boundary

DreamTown Founder Philosophy remains: `HOLD / NOT A CANDIDATE`

Blind Test에서 추가 Philosophy Evidence가 나오면:  
→ Evidence로만 기록  
→ CAND-OPS-003 Review 중 Philosophy Candidate 생성 금지

---

## 14. Open Items at Plan Save Time

### Open
- fifth place selection
- Blind Operator selection
- actual test execution
- review result

### Hold
- Candidate approval / LOCKED / SSOT promotion
- DreamTown Philosophy Candidate
- runtime implementation / schema / migration
