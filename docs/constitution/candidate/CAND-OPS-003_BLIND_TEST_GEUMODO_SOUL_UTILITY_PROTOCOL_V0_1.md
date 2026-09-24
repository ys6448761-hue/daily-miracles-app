# CAND-OPS-003 Blind Test — 금오도 비렁길 SOUL Utility Test Protocol V0.1

**Date:** 2026-09-25
**Prerequisite:** Geumodo DreamTown Comparison SAVED / GREEN (f8080a6)
**Status:** PROTOCOL SAVED / READY — A/B Execution NOT YET STARTED

---

## 1. Test Question

**CAND-OPS-003 방식으로 작성된 Place Knowledge가 실제 SOUL의 여행자 응답 품질을 개선하는가?**

이번 Test는:
- Framework가 Knowledge를 잘 정리하는지 재검증하는 것이 아님
- 실제 사용자 상황에서 Knowledge가 유용하게 조합되는지를 검증함

이번 Test가 금오도 비렁길에 대한 실제 SOUL Utility Evidence를 처음 생성한다.

---

## 2. A/B Conditions

### Condition A — Baseline

SOUL이 사용할 수 있는 정보:
- 금오도 비렁길의 일반적인 factual/travel information

SOUL이 사용할 수 없는 정보 (제공하지 않음):
- CAND-OPS-003 World Experience synthesis
- Founder Intent (4 signals, Emotional Journey, Founder Core Identity)
- DreamTown Comparison (Alignment/Extension/Tension)
- Situation Knowledge synthesis

### Condition B — Framework Knowledge

SOUL이 사용할 수 있는 정보:
- CAND-OPS-003 Blind Test에서 현재까지 생성된 승인된 Test Artifacts 전체

조건 B 사용 원칙:
- Founder Philosophy나 DreamTown Philosophy를 사용자에게 직접 설명하는 것이 목적이 아님
- Knowledge를 사용자의 현재 상황에 자연스럽게 번역해야 함

---

## 3. Anti-Bias Controls

| 항목 | 규칙 |
|---|---|
| 익명화 | 응답에 A/B 조건 식별자 포함하지 않음. 평가 전까지 레이블 숨김 |
| 응답 길이 | 두 조건 응답의 목표 길이를 동일하게 지정 |
| 말투/형식 | 동일한 SOUL 페르소나, 동일한 응답 형식 적용 |
| System instruction | Condition B에만 더 친절하거나 더 긴 instruction 제공 금지 |
| 시나리오 선택 | Candidate에 유리한 질문만 선택하지 않음 — 6개 시나리오 모두 실행 |
| 정보 비대칭 방지 | Condition A에 의도적으로 불충분한 정보를 주지 않음 — Baseline은 일반적으로 접근 가능한 정보 수준 |

---

## 4. Traveler Scenario Set

총 6개 시나리오. 순서 변경 없이 모두 실행한다.

---

### Scenario 1 — Time Constraint

**Traveler Prompt:**
> 오후에 금오도 비렁길 가려고 하는데 오늘 저녁 배 타고 나와야 해요. 전부 다 걸을 수 있을까요?

**검증 대상:**
- Live/Stable boundary 인식
- 귀항 시간 압박 인식
- 과도한 완주 추천 방지
- 확인되지 않은 배편 시간을 사실처럼 생성하지 않는지

---

### Scenario 2 — Low Energy / Companion

**Traveler Prompt:**
> 부모님이랑 같이 왔는데 두 분 다 오래 걷기 힘드세요. 비렁길 괜찮을까요?

**검증 대상:**
- 체력/동행자 인식
- 코스 선택 안내 (전체 vs 부분)
- 접근성 정보 처리
- OPERATOR_INFERENCE 항목(유모차/어린이)과 WORLD_EXPERIENCE 안전 항목의 구분

---

### Scenario 3 — Solo / Emotional

**Traveler Prompt:**
> 저 혼자 왔어요. 조용히 천천히 걷고 싶은데 비렁길 어때요?

**검증 대상:**
- Founder Intent(자기 속도/천천히도 도착)가 설교 없이 여행 행동으로 번역되는가
- "혼자가 아니다", "희망", "성찰" 등 직접 철학 언어 사용 여부
- 조용한 구간 vs 성수기 군중 정보 인식

---

### Scenario 4 — Weather

**Traveler Prompt:**
> 오늘 날씨가 좀 흐리고 비 올 수도 있다는데 비렁길 가도 될까요?

**검증 대상:**
- Weather/Live Knowledge와 안전 불확실성 처리
- WE에서 확인된 강풍/미끄러짐 위험 정보 활용
- "비 와도 괜찮다"는 근거 없는 안심 생성 금지
- Live 날씨는 확인 필요하다는 사실 인식

---

### Scenario 5 — Expectation Gap

**Traveler Prompt:**
> 비렁길 그냥 가볍게 산책하는 곳 아니야? 부담 없이 걸을 수 있는 거잖아요?

**검증 대상:**
- WE의 난이도/소요시간/Movement Experience 활용
- "만만하게 보지 마라" 패턴의 자연스러운 번역
- 공식 소요시간과 실제 소요시간 차이 처리
- 과도한 경고로 여행 의욕 꺾지 않기 (균형)

---

### Scenario 6 — Open Recommendation

**Traveler Prompt:**
> 금오도 비렁길 나한테 갈 만한 곳이야?

*(사용자 조건 미제공. 나이, 체력, 동행자, 시간, 날씨 정보 없음)*

**검증 대상:**
- SOUL이 부족한 상황정보를 인식하는가
- 필요한 질문을 하는가, 또는 조건부 추천을 하는가
- 무조건적 추천 / 무조건적 비추천 모두 회피
- Entity/Route를 잘못 결합하여 실행 불가능한 안내를 생성하지 않는가

---

## 5. Evaluation Dimensions

숫자 총점이나 Winner를 미리 산정하지 않는다.

각 시나리오의 각 응답(A, B)을 아래 12개 차원으로 평가한다.

| # | Dimension | 설명 |
|---|---|---|
| D1 | Situational Relevance | 사용자의 실제 상황(시간/체력/날씨/감정)을 인식하고 반영했는가 |
| D2 | Operational Safety | 위험 정보를 적절히 전달했는가. 근거 없는 안심 또는 과도한 경고가 없는가 |
| D3 | Stable / Live / Verify Discipline | Stable 사실은 사실로, Live/Verify 항목은 불확실로 처리했는가 |
| D4 | Place / Route / Movement Understanding | 금오도를 Route + Movement Experience 복합 구조로 인식했는가 |
| D5 | Companion / Energy Awareness | 동행자/체력 맥락을 자연스럽게 반영했는가 |
| D6 | Uncertainty Handling | 모르는 것을 모른다고 했는가. 불확실한 항목에 임의 값을 생성하지 않았는가 |
| D7 | Actionability | 사용자가 실제로 행동할 수 있는 정보를 제공했는가 |
| D8 | Unnecessary Information Suppression | 이 상황에서 필요하지 않은 정보를 줄였는가 |
| D9 | Naturalness | 자연스러운 대화 흐름인가. 정보 나열식이 아닌가 |
| D10 | Founder Intent Translation | Founder Philosophy가 직접 언급 없이 여행 행동으로 번역되었는가 |
| D11 | Philosophy Overexposure | "자기 속도/희망/회복/성찰/DreamTown" 등을 과도하게 직접 사용했는가 (FAIL이 좋음) |
| D12 | Hallucination / Unsupported Claim | CAND-OPS-003 Evidence에 없는 사실을 생성했는가 |

**평가 형식 (각 Dimension):**

```
판정: PASS / PARTIAL / FAIL / NOT APPLICABLE
Evidence: 응답에서 판정 근거가 된 구체적 문장 또는 부재
Judgment: 판정 이유
```

---

## 6. Critical Failure Conditions

답변 생성 전에 고정한다. 아래 중 하나라도 해당하면 해당 응답은 Critical Failure.

| CF | 조건 |
|---|---|
| CF-U1 | 확인되지 않은 배편/운항시간을 사실처럼 생성 (예: "오후 5시 배가 있습니다") |
| CF-U2 | 위험한 상황(비/강풍/체력 부족)에서 근거 없는 이동 추천 |
| CF-U3 | Founder Philosophy를 Operational Fact로 변환 (예: "천천히 걸어도 배를 탈 수 있어요") |
| CF-U4 | DreamTown 의미를 실제 여행자 경험인 것처럼 주장 (예: "비렁길은 DreamTown 감정 회복 장소입니다") |
| CF-U5 | Entity/Route를 잘못 결합하여 실행 불가능한 안내 생성 (예: 비렁길 전 구간을 3시간 내 완주 가능이라고 안내) |
| CF-U6 | Baseline(A)과 Framework(B) 조건에 불공정한 정보 또는 instruction 제공 |
| CF-U7 | CAND-OPS-003 Evidence에 없는 구체 수치(거리/시간/가격)를 확정 사실로 생성 |

---

## 7. Founder Intent Rule

Condition B 평가 기준:

다음 표현을 직접 많이 사용한다고 좋은 응답으로 평가하지 않는다.

```
자기 속도 / 희망 / 회복 / 성찰 / 혼자가 아니다 / DreamTown
```

평가 기준: **실제 여행 행동으로 번역**되는지.

예시 (정답 문장이 아닌 방향 예시):
> "오늘 전부 걸으려고 하지 말고 돌아올 배 시간부터 보고 한 구간만 천천히 걸어도 괜찮아."

이 예시 문장을 복제하도록 요구하지 않는다. 방향을 보는 것이다.

D10 (Founder Intent Translation) PASS 조건:
- Founder Philosophy가 여행 행동 조언으로 자연스럽게 나타남
- "자기 속도" 등 표현 직접 인용 없이도 그 의미가 실천적으로 구현됨

D11 (Philosophy Overexposure) PASS 조건:
- 위 열거된 표현이 과도하게 등장하지 않음
- FAIL = 과도하게 직접 사용함 (역설적으로 D11 FAIL이 문제)

---

## 8. Live Knowledge Rule

현재 배 시간, 날씨, 운항 여부, 폐쇄 여부 등 실제 최신 정보가 필요한 항목:

- 값을 추측하지 않는다
- 확인이 필요하다는 사실을 인식하고 전달한다

이번 Protocol 설계 단계에서는 실제 Web Research를 하지 않는다.

A/B 실행 단계에서도 Live 항목을 Web Research로 채우지 않는다.

SOUL이 "확인이 필요합니다"라고 정확히 인식하는 것 자체가 Utility Evidence다.

---

## 9. Response Generation Rules

A/B 실행 단계에 적용할 규칙:

| 규칙 | 내용 |
|---|---|
| 응답 언어 | 한국어 |
| 응답 형식 | 두 조건 동일 (자유 대화형 또는 동일 형식) |
| 응답 길이 | 두 조건 동일 목표 (예: 150~200자 / 각 시나리오에서 동일하게 지정) |
| 페르소나 | 동일한 SOUL 페르소나 |
| System instruction | 두 조건에 동일한 instruction 적용. B에만 추가 instruction 금지 |
| 생성 순서 | A 먼저 생성 후 B 생성 (역순 불가) |

---

## 10. Evaluation Procedure

1. A/B 응답 생성 (다음 단계: A/B Execution)
2. 응답 레이블 임시 숨김 (익명화)
3. 각 시나리오 × 각 응답 × 12 Dimension 평가
4. Critical Failure 체크
5. 레이블 복원 후 A/B 결과 비교
6. Dimension별 차이 기록
7. 최종 Utility Judgment 작성

평가는 Utility Test Report 파일에 기록한다 (`CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_REPORT_V0_1.md`).

---

## 11. PASS / FAIL Interpretation Boundary

**전체 Framework PASS 기준:**

```
Critical Failure = 0건
AND
Condition B가 Condition A 대비 3개 이상 Dimension에서 PASS→PARTIAL 또는 PARTIAL→FAIL 개선
AND
D10 (Founder Intent Translation) = PASS (최소 2개 시나리오에서)
```

**부분 개선 (PARTIAL UTILITY):**

```
Critical Failure = 0건
AND
개선이 일부 Dimension에서만 확인됨
AND
D12 (Hallucination) = PASS for both conditions
```

**FAIL:**

```
Critical Failure 1건 이상
OR
Condition B가 Condition A 대비 일관된 개선을 보이지 않음
OR
D12 = FAIL (어느 조건이든)
```

숫자 점수를 산정하지 않는다. Evidence와 Judgment 기반 판정.

---

## 12. Known Limitations

| 항목 | 내용 |
|---|---|
| 실제 SOUL 런타임 미사용 | 이번 Test는 문서 기반 시뮬레이션. 실제 SOUL 코드 실행 결과가 아님 |
| Live 정보 미반영 | 배편/날씨/운항 여부는 실제 데이터 없이 테스트 |
| 단일 Operator | A/B 모두 동일한 Operator가 생성 — 독립성 제한 |
| 시나리오 커버리지 | 6개 시나리오가 모든 여행자 유형을 커버하지 않음 |
| Framework 미완성 | FA-01/FA-02/MR-01/MR-02 OPEN 상태 — 일부 provenance 구분이 완전하지 않음 |
| 금오도 SSOT 미등록 | 금오도는 DreamTown 공식 SSOT 미등록 장소 — Utility Test 결과가 SSOT 등록 근거가 되지 않음 |

---

## 13. Previous Dimension 12 Handling

기존 Geumodo WE Review (`CAND-OPS-003_BLIND_TEST_GEUMODO_WE_REVIEW_V0_1.md`)에서:

```
Dimension 12: SOUL utility = PASS
```

판정이 기록되었다.

**명시:**

이 판정은 실제 SOUL Utility Test를 실행한 결과가 아니다.

당시 판정은 Authoring-level utility observation이다:

```
"Knowledge가 SOUL에서 사용 가능한 형태로 작성되었는가"를 평가한 것
```

이번 Protocol이 실행하는 A/B Test와 동일하지 않다.

이번 Test가 실제 Utility Evidence를 처음 생성한다.

기존 WE Review의 Dimension 12 판정을 이번 Test 결과로 사용하지 않는다.

---

## 14. Restrictions (Protocol 단계)

```
New Research       = NO
Web Research       = NO
A/B Response Gen   = NO (다음 단계에서 실행)
Utility Evaluation = NO (다음 단계에서 실행)
Candidate mod      = NO
Candidate Approval = NO
DreamTown Candidate= NO
SSOT Promotion     = NO
DB/Schema/Migration= NO
Runtime/Production = NO
```

---

## 15. Status

```
Protocol Status: SAVED / READY
A/B Execution:  NOT STARTED
Evaluation:     NOT STARTED

Current Next Action: CAND-OPS-003 Blind Test — Geumodo SOUL Utility A/B Execution
```
