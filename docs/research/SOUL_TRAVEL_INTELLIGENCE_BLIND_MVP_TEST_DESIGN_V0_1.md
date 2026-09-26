# SOUL Travel Intelligence
# Blind MVP Test Design V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 08fa0cd
**Status:** BLIND MVP TEST DESIGN V0.1 — APPROVED / NOT YET EXECUTED

**Design Verdict:** `BTD-A — BLIND MVP TEST DESIGN READY FOR PERSISTENCE`
**Independent Review:** `BTD-A — CONFIRMED`
**RP Verdict (basis):** `RP-A — CONFIRMED / READY FOR BLIND MVP TEST DESIGN`

---

## A. Test Objective

> `Does SOUL's evidence-bounded, journey-aware response behavior create a meaningfully better travel-companion experience for users than a capable conventional travel-assistant response?`

This test does NOT assume SOUL is better.

It must be capable of showing:
- SOUL advantage
- no meaningful difference
- Baseline advantage
- mixed results by behavior type

---

## B. Test Hypotheses

**H1:** SOUL의 증거 기반 응답은 여행자가 느끼는 상황 이해도(Felt Understanding)와 신뢰도(Trust)에서 일반 여행 AI 응답보다 높은 평가를 받을 것이다.

**H2:** SOUL의 ASK 동작은 참여자가 처음에 다소 불편하게 느낄 수 있으나, 다음 라운드에서 실질적인 판단 개선을 경험한 후 Action Willingness가 증가할 것이다.

**H3:** SOUL의 LIVE_VERIFY 동작은 Baseline의 추측성 확신 응답보다 Trust를 높이거나 같은 수준으로 유지할 것이다.

**H4:** SOUL의 INSUFFICIENT 동작은 즉각 유용성(Decision Ease)을 일시적으로 낮추더라도, Trust와 Companion Feel에서 우위를 보일 것이다.

**H5-NULL:** 정보 밀도 및 즉각 완결 응답 선호로 인해 Baseline이 일부 시나리오에서 Action Willingness에서 SOUL보다 높게 평가될 수 있다.

---

## C. Evidence Boundaries

All SOUL responses observe the following frozen boundaries:

| Boundary | Status |
|---|---|
| OA-C | DESCRIPTIVE ONLY |
| OA-C → recommendation rule | NOT CONVERTED |
| vehicle → visit type | NOT ESTABLISHED |
| next destination → direction | NOT ESTABLISHED |
| boarding station → visit type | NOT ESTABLISHED |
| Travel Time Matrix | NOT USED |
| DreamTown emotional knowledge | EXPERIENCE FRAMING ONLY |
| World Experience | NOT TRUTH SOURCE |

---

## D. Blind-Test Principles

- Model identity hidden from all participants
- Neutral labels: `Response A` / `Response B`
- A/B order randomized per scenario
- Scenario order randomized where practical
- Baseline = capable conventional travel assistant (no strawman)
- No assumption SOUL should win
- S6 style leakage recorded as test limitation (see §L)

---

## E. Participant Design

### Group A — REQUIRED

한국에서 최근 1년 이내에 독립 여행(패키지 제외) 경험자.

`MVP 운영 샘플 목표: 8~12명`
*(PROVISIONAL MVP OPERATIONAL DECISION THRESHOLD — 통계적으로 검증된 표본 크기 아님. MVP 방향성 판단 목적.)*

### Group B — PREFERRED

여수 여행을 계획 중이거나 관심 있는 사람. Group A와 중복 허용. 별도 구분 기록.

### Group C — OPTIONAL

실제 여수 여행 경험자. 2~3명. 관찰 데이터 보정용.

**Participant diversity:** 모바일 사용자 포함 / 여행 동반자 유형 다양화 (혼자 / 커플 / 가족) / 여행 앱 또는 검색 서비스 실제 사용 경험 필수.

---

## F. Test Structure

### Layer 1 — Single-Turn Blind Comparison

시나리오: S1 / S3 / S5 / S6

참여자에게: 여행자 상황 + 질문 + Response A + Response B 제시 → 단일 응답만으로 평가.

### Layer 2 — Multi-Turn Judgment Recovery

시나리오: S2 / S4 / S7

**Equal Opportunity Rule (mandatory):**

Round 1: A/B 모두 응답
→ 동일 시뮬레이션 여행자 상태 업데이트를 두 조건에 동일하게 제공
→ Round 2: A/B 모두 응답
→ 참여자가 Round 2를 blindly 평가

목적: `conventional assistant after same new information` vs `SOUL after same new information` — one-turn vs two-turn 비교가 아님.

---

## G. Scenario Set

| # | 시나리오 | Layer | SOUL Expected Behavior |
|---|---|---|---|
| S1 | 하멜등대 → 케이블카 물리적 접근 | L1 | ANSWER + LIVE_VERIFY |
| S2 | 케이블카 편도/왕복 (상태 불충분) | L2 | ASK → ASK |
| S3 | 이순신광장 + 아이 동반 | L1 | ANSWER + INSUFFICIENT + ASK |
| S4 | 피로한 여행자 (위치 미확인) | L2 | ASK → ANSWER + ASK |
| S5 | 케이블카 기상 운행 여부 | L1 | LIVE_VERIFY |
| S6 | 패키지 케이블카 경험 | L1 | ANSWER (EXPERIENCE FRAMING) |
| S7 | 향일암 계획 변경 | L2 | ASK → ASK |

---

## H. Final Stimuli

All stimuli reflect final BTD-A approved version.
Superseded versions are not active test stimuli.

---

### S1 — 하멜등대 → 케이블카 물리적 접근

**여행자 상황:** 여수 여행 중. 하멜등대 인근. 자가용. 케이블카 관심 명시.

**여행자 질문:** "하멜등대에서 케이블카 탑승장까지 얼마나 걸려요?"

---

**Response [SOUL] — ANSWER + LIVE_VERIFY**

> 하멜등대에서 케이블카 자산 쪽 탑승장(해야정류장)은 차로 2분 거리예요 — 바로 옆이라 걸어가도 5~10분이면 돼요. 돌산 쪽 탑승장은 차로 5~10분 정도 더 걸려요.
>
> 운영 시간이랑 요금은 방문 전에 한 번 확인해 보시는 게 좋아요.

**Response [Baseline]**

> 여수해상케이블카는 하멜등대에서 차로 약 5~10분 거리에 위치해 있습니다. 자산 탑승장(해야정류장)과 돌산 탑승장(놀아정류장) 두 곳에서 탑승할 수 있으며, 편도와 왕복권을 모두 구매할 수 있습니다. 운영 시간은 평일과 주말이 다르므로 방문 전 공식 홈페이지에서 확인하시기 바랍니다.

---

### S2 — 케이블카 편도/왕복 (Multi-Turn)

**여행자 상황:** 개인 여행자. 케이블카 탑승장 근처. 탑승장 불명.

**여행자 질문:** "케이블카 편도로 탈까요 왕복으로 탈까요?"

---

**Round 1 Response [SOUL] — ASK**

> 지금 정보만으로는 편도랑 왕복 중 어느 쪽이 더 맞을지 정하기 어려워요. 지금 자산 쪽(해야정류장)에서 타실 예정이에요, 돌산 쪽(놀아정류장)에서 타실 예정이에요?

*(탑승장 = INPUT. 탑승장→visit type 결정 규칙 없음.)*

**Round 1 Response [Baseline]**

> 여수해상케이블카는 편도와 왕복 두 가지 방식으로 이용할 수 있습니다. 편도는 한쪽 탑승장에서 타서 반대편으로 내려오는 방식이고, 왕복은 출발한 탑승장으로 다시 돌아오는 방식입니다. 어느 쪽이 편리한지는 이후 이동 계획에 따라 달라질 수 있어요. 어느 쪽 탑승장에서 타실 예정인지 알면 좀 더 맥락에 맞게 설명드릴 수 있습니다.

---

**시뮬레이션 업데이트 (A/B 동일):** `"자산 쪽에 있어요."`

---

**Round 2 Response [SOUL] — ASK**

> 자산 쪽이시군요. 케이블카 다음에 계획이 있으세요? 어디로 이동하실 건지 알면 같이 생각해볼 수 있어요.

*(next destination = INPUT. 결정 규칙 주장 없음.)*

**Round 2 Response [Baseline]**

> 자산 쪽(해야정류장)에서 타시는군요. 자산에서 탑승해 올라가면 여수 바다와 돌산도 쪽 풍경이 펼쳐져요. 왕복으로 타시면 자산 탑승장으로 다시 내려오고, 편도로 타시면 돌산 탑승장(놀아정류장)으로 내려오게 됩니다.

*(구조적 사실만. vehicle→roundtrip 관계 없음.)*

---

### S3 — 이순신광장 + 아이 동반

**여행자 상황:** 가족. 아이 동반. 이순신광장 방문 중.

**여행자 질문:** "여기 있는데 아이들 좋아할 만한 데 어디 가면 좋을까요?"

---

**Response [SOUL] — ANSWER (광장) + INSUFFICIENT (아동 특화 순위) + ASK**

> 이순신광장은 탁 트인 항구 광장이라 아이들이 뛰어다니기 편한 편이에요.
>
> 다음에 어디 갈지는 여수 아이들 코스를 제가 아직 자세히 모르는 곳들이 많아서요. 아이들이 몇 살 정도예요?

**Response [Baseline]**

> 여수에서 아이들과 가볼 만한 곳으로는 여수 아쿠아플라넷이 있어요. 아쿠아리움으로 다양한 해양 생물을 볼 수 있어요. 오동도는 섬 안에 산책로가 있고, 엑스포공원도 넓은 야외 공간이 있습니다.

*(근접성 주장 없음. 인기/순위 주장 없음. 서술적 정보만.)*

---

### S4 — 피로한 여행자 (Multi-Turn)

**여행자 상황:** 오후 4~5시. 피로 호소. 위치 미확인.

**여행자 질문:** "너무 지쳤는데 그냥 가볍게 갈 수 있는 데 없을까요?"

---

**Round 1 Response [SOUL] — ASK**

> 많이 지치셨나 봐요. 지금 어디쯤 계세요? 가까운 데부터 같이 볼게요.

**Round 1 Response [Baseline]**

> 지치셨군요. 가볍게 즐길 수 있는 곳으로 이순신광장을 추천드려요. 걸어서 여수 항구 분위기를 느낄 수 있고, 체력 소모가 적어요. 아니면 케이블카도 앉아서 이동하는 코스라 체력 부담이 적습니다. 낭만포차거리에서 저녁 일찍 드시는 것도 좋아요.

---

**시뮬레이션 업데이트 (A/B 동일):** `"이순신광장 근처에 있어요."`

---

**Round 2 Response [SOUL] — ANSWER + ASK**

> 이순신광장이면 항구 바로 앞이에요. 탁 트인 광장이라 그냥 바다를 바라보며 쉬기 좋은 곳이에요. 지금 조금 걷는 건 괜찮으세요, 아니면 그냥 앉아서 쉬고 싶으세요?

**Round 2 Response [Baseline]**

> 이순신광장 근처에 계시군요. 이순신광장은 여수 항구 중심부에 위치해 있어 바다를 바라보며 여유롭게 쉬기에 좋은 곳이에요. 이충무공 동상도 볼 수 있어요. 너무 지치셨으면 광장 안에서 잠깐 앉아 쉬어가시는 것도 좋아요.

*(카페 근접 / 낭만포차거리 근접 주장 없음.)*

---

### S5 — 케이블카 기상 운행 여부

**여행자 상황:** 비 또는 강풍. 케이블카 방문 예정.

**여행자 질문:** "오늘 날씨가 이런데 케이블카 운행해요?"

---

**Response [SOUL] — LIVE_VERIFY**

> 기상에 따라 운행이 멈추는 경우가 있어서 오늘 운행 중인지는 제가 지금 확인이 안 돼요. 가시기 전에 공식 채널로 먼저 확인해 보시는 게 좋아요.

**Response [Baseline]**

> 여수해상케이블카는 기상 악화 시 운행이 중단될 수 있습니다. 특히 강풍이나 폭우 시 안전을 위해 운행을 멈추는 경우가 있습니다. 오늘 날씨 상황에 따른 운행 여부는 운영사에 직접 확인하시는 것이 가장 정확합니다.

*(기상 운행 빈도 추측 없음.)*

---

### S6 — 패키지 케이블카 경험

**여행자 상황:** 패키지 단체. 돌산탑승장(놀아정류장) 탑승 직전. 다음 코스: 오동도.

**여행자 질문:** "케이블카 어떤 경험이에요?"

---

**Response [SOUL] — ANSWER (EXPERIENCE FRAMING)**

> 올라가는 동안 여수 바다가 발아래로 펼쳐지는데, 딱히 뭔가를 해야 하는 시간이 아니라 그냥 바라보기만 해도 충분한 것 같아요. 짧은 시간인데 일상이랑 잠깐 거리를 두는 느낌이 있어요. 내려올 때쯤엔 조금 가벼워진 느낌이 들 수도 있어요.

*(Experience Framing — Founder approved. 빈도/집단 주장 없음.)*

**Response [Baseline]**

> 여수해상케이블카는 돌산과 자산을 연결하는 케이블카로, 여수 앞바다를 한눈에 내려다볼 수 있습니다. 수면에서 상당한 높이까지 올라가며, 왕복과 편도 모두 이용 가능합니다. 맑은 날에는 멀리까지 조망이 가능하고, 탑승 시간은 짧습니다.

*(Baseline에 SOUL 경험 언어 추가 금지. 스타일 차이 보존 — 측정 대상.)*

---

### S7 — 향일암 계획 변경 (Multi-Turn)

**여행자 상황:** 향일암 방문 불가.

**여행자 질문:** "향일암이 안 되는데 어디로 가면 좋을까요?"

---

**Round 1 Response [SOUL] — ASK**

> 아쉬우셨겠어요. 지금 어디쯤 계세요?

**Round 1 Response [Baseline]**

> 향일암이 안 되셨군요. 여수에는 다른 명소들이 많아요. 오동도, 이순신광장, 케이블카 등 다양한 선택지가 있으니 이동 편의에 맞게 고려해 보세요. 시간이 있으시면 낭만포차거리에서 저녁 식사도 추천합니다.

*(최상급/근접성 주장 없음.)*

---

**시뮬레이션 업데이트 (A/B 동일):** `"향일암 근처인데 차가 있어요."`

---

**Round 2 Response [SOUL] — ASK**

> 차가 있으시군요. 오늘 남은 시간이 어떻게 되세요?

*(Travel Time Matrix 미사용. 방향 유도 없음.)*

**Round 2 Response [Baseline]**

> 차가 있으시군요. 여수에는 오동도, 이순신광장, 케이블카 등 다양한 곳이 있어요. 남은 시간에 따라 이동 계획을 잡으시면 좋을 것 같습니다.

*(이동 시간 수치 없음. F-02 CLOSED.)*

---

## I. Evaluation Rubric

### 구조화 평가 (5점 Likert — 응답별 독립 평가)

| 항목 | 질문 |
|---|---|
| Felt Understanding | "이 답변이 내 현재 여행 상황을 이해하고 있다고 느껴진다" |
| Decision Ease | "이 답변을 받고 다음 행동을 정하기 쉬워졌다" |
| Trust | "여행 중 이 답변을 실제로 참고할 수 있다고 믿는다" |
| Companion Feel | "관광 정보 검색보다 여수를 아는 여행 친구처럼 느껴진다" |
| Naturalness | "이 답변(또는 질문)이 자연스러운 대화처럼 느껴진다" |
| Action Willingness | "실제 여행 중이라면 이 답변을 따라 다음 행동을 해볼 의향이 있다" |

복합 점수 계산하지 않음. 항목별 독립 분석.

### Forced Choice

`"지금 실제로 여수 여행 중이라면 어느 답변을 더 받고 싶으세요?"`

- Response A / Response B / 둘 다 비슷함 / 둘 다 받고 싶지 않음

### Qualitative

`"왜 그렇게 느끼셨나요?"`

Optional: `"도움이 됐던 표현이나 불편했던 부분이 있다면 알려주세요."`

---

## J. Behavior-Specific Questions

내부 레이블(ANSWER/ASK/LIVE_VERIFY/INSUFFICIENT) 참여자 미노출.

**ASK 시나리오 (S2, S4, S7):**

`"이 답변이 여러분에게 무언가를 물어봤다면, 그 질문에 답하고 대화를 이어가고 싶으셨나요?"` (1~5)

`"그 질문이 왜 물어보는지 이해가 됐나요?"` (1~5)

**LIVE_VERIFY (S5):**

`"'지금 확인이 안 된다'고 말하고 확인을 권한 답변이 있다면, 그것이 신뢰를 높였나요, 낮췄나요?"` (1=많이 낮아짐 / 3=변화 없음 / 5=높아짐)

**INSUFFICIENT (S3):**

`"정보를 지어내지 않고 아는 범위만 말한 답변이 있다면, 그 솔직함이 도움이 되었나요?"` (1=방해됐다 / 5=도움이 됐다)

---

## K. Layer 2 Measurement Design

S2 / S4 / S7 각 시나리오에서 5개 측정값 독립 수집. 평균 합산 금지.

| 측정 | 항목 |
|---|---|
| 1. Round-1 Immediate Preference | Round 1만 보고 더 즉각 도움이 됐던 응답 선택 + Likert 6항목 |
| 2. Willingness to Continue | 질문에 답하고 대화 이어가고 싶은지 (1~5) + 이해됐는지 (1~5) |
| 3. Round-2 Preference | 동일 업데이트 후 Round 2 Likert 6항목 + Forced Choice |
| 4. Preference Shift | Round 1 → Round 2 선호 변화 여부 (예/아니오/비슷함) + 자유 응답 |
| 5. Question Value | "첫 질문에 답했을 때 두 번째 응답이 더 유용해졌나?" (1~5) |

선호 변화를 인과 관계로 해석하지 않음. MVP 행동 증거로 기록.

---

## L. Success / Mixed / Failure Criteria

*(PROVISIONAL MVP OPERATIONAL DECISION THRESHOLD — 통계적 유의성 기준 아님. 사전 선언된 MVP 운영 의사결정 기준. 8~12명 샘플에서 방향성 판단 목적.)*

### Evidence of Candidate Differentiation (BT-A 방향)

복수 조건 충족 시: *(PROVISIONAL)*

- S1 SOUL Trust 또는 Felt Understanding 평균 ≥ 4.0/5, Baseline 대비 ≥ 0.5점 차
- S5 SOUL Trust 평균 ≥ 3.0/5
- S6 SOUL Companion Feel 평균 ≥ Baseline
- ASK 시나리오 "대화를 이어가고 싶다" ≥ 3.5/5
- Forced Choice SOUL 선택 비율 ≥ 50% (둘 다 비슷함 제외 후)
- Layer 2 "첫 질문이 의미 있었다" ≥ 3.5/5

### Mixed Result (BT-B 방향)

- ANSWER 시나리오 SOUL 우위, ASK/INSUFFICIENT 중립 또는 열세
- Trust ↑, Decision Ease ↓ 공존 패턴

### Failure Signal (BT-C / BT-D 방향) *(PROVISIONAL)*

- S1 SOUL Trust < Baseline Trust
- S5 LIVE_VERIFY Trust 평균 < 3.0/5
- "대화를 이어가고 싶다" < 2.5/5
- "둘 다 받고 싶지 않음" 비율 > 15% (복수 시나리오)
- Layer 2 "첫 질문이 의미 없었다" 다수

트레이드오프(예: Trust↑ + Action Willingness↓)는 평균화하지 않고 그대로 보존.

---

## M. Participant Test Flow

### 사전 안내

> 이 테스트는 여행 중 AI 도움말에 대한 여러분의 솔직한 경험을 이해하기 위한 것입니다. 두 가지 서로 다른 AI 응답을 비교할 것입니다. 어느 것이 더 나은지 정답은 없습니다. 지금 실제로 여행 중이라고 상상하며 여러분이 느끼는 그대로 답해주세요. 참여 시간은 약 20~30분입니다.

미공개: 어느 응답이 더 좋을 것으로 예상되는지 / Phoenix / SOUL / 증거 체계 / 응답 생성 방식.

### 진행 흐름

1. **[3분] 배경 정보** — 여행 빈도 / 여수 경험 / AI 서비스 사용 / 동반자 유형

2. **[5~7분/시나리오] Layer 1** — S1 → S3 → S5 → S6 (순서 일부 변동 가능)
   - 상황 카드 제시 → A/B 응답 → 6개 Likert → Forced Choice → 자유 응답 → 행동별 질문

3. **[7~10분/시나리오] Layer 2** — S2 → S4 → S7
   - Round 1 제시 → 평가 → 시뮬레이션 업데이트 제시 → Round 2 제시 → 5개 측정 + Layer 2 질문

4. **[5분] 최종 교차 시나리오 질문**

5. **[선택] 마무리 추가 코멘트**

---

## N. Final Cross-Scenario Questions

1. `전반적으로 어느 응답 스타일이 여행 중 더 편하게 느껴지셨나요?` (A스타일 / B스타일 / 비슷함)
2. `어느 쪽 응답이 더 믿을 만하다고 느끼셨나요?` (A / B / 비슷함)
3. `어느 쪽이 나의 현재 상황을 더 잘 이해한다고 느껴지셨나요?` (A / B / 비슷함)
4. `되묻는 질문이 있는 경우, 어떻게 느끼셨나요?`
   - 도움이 됐다, 그 다음 대화가 더 유용해졌다 / 답하기 귀찮았지만 이해는 됐다 / 그냥 바로 답해줬으면 좋겠다 / 잘 모르겠다
5. `"모르는 것을 지어내지 않고 솔직하게 말하는 방식"은 어떻게 느껴지셨나요?`
   - 신뢰가 높아졌다 / 불편했지만 이해한다 / 차라리 추천해줬으면 좋겠다 / 잘 모르겠다
6. `실제 여수 여행에서 다시 사용하고 싶은 스타일은 어느 쪽인가요?` (A / B / 둘 다 / 모르겠다)
7. `(자유) 오늘 경험하신 두 가지 응답 스타일 중 기억에 남는 점이 있으면 자유롭게 적어주세요.`

---

## O. Founder/Lumi Observation Sheet

참여자 미노출. 관찰자 독립 기록.

| 관찰 항목 | 기록 방식 |
|---|---|
| 응답을 끝까지 읽는가? | 예/아니오 / 어디서 멈추는가 |
| 망설임 | 평가 전 긴 멈춤 발생 시점 |
| 즉각 반응 표현 | 소리 / 표정 / 짧은 독백 |
| ASK 응답 반응 | 짜증 / 납득 / 흥미 |
| Layer 2 R2 반응 | 납득 / 실망 / 유용 표현 |
| 응답을 다시 읽는가? | 예/아니오 |
| 자발적 맥락 설명 | 예 + 내용 요약 |

**관찰 문구 예시 (들리면 기록):**
- `"이게 더 나를 아는 것 같아"` → Companion Feel / Felt Understanding 신호
- `"그냥 바로 알려주면 안 돼?"` → ASK friction 신호
- `"이건 믿을 만하다"` → Trust 신호
- `"말이 너무 감성적이다"` → S6 framing 과잉 신호
- `"이건 너무 짧다"` → 응답 길이 부족 신호
- `"왜 이걸 물어봐?"` → ASK 필요성 불명확 신호

관찰 노트는 정성적 증거. 해석 없이 기록.

---

## P. Knowledge-Gap Classification

사후 분석 시 SOUL 열세 원인 분류 기준:

| 분류 | 정의 |
|---|---|
| KNOWLEDGE COVERAGE GAP | 승인 장소 지식 부재로 응답 불가 |
| RESPONSE / JUDGMENT GAP | 충분한 증거에도 응답 설계가 경험을 낮춤 |
| TECHNICAL INTEGRATION GAP | 라이브 데이터 미연결로 LIVE_VERIFY 필요 |
| INTERACTION DESIGN GAP | ASK 행동에 대한 사용자 저항 |

이 분류를 결과 분석 단계에서 적용. 사전에 예단하지 않음. 병합하지 않음.

---

## Q. Post-Test Decision Framework

테스트 결과 분석 후 아래 네 가지 중 하나를 선택. 현재 미배정.

### BT-A
`PROCEED — CANDIDATE DIFFERENTIATION OBSERVED`

### BT-B
`PROCEED WITH TARGETED CORRECTIONS`

### BT-C
`HOLD — DISTINCTIVENESS NOT YET VALUABLE TO USERS`

### BT-D
`RETHINK — CORE JUDGMENT EXPERIENCE UNDERPERFORMS BASELINE`

**Blind MVP Test: NOT YET EXECUTED**
**BT 판정: NOT ASSIGNED**

---

## R. Leakage Audit (Limitations)

| Scenario | Leakage Risk | Treatment |
|---|---|---|
| S1 | LOW | 없음 |
| S2 | MEDIUM | 무작위화 + 중립 프레이밍 |
| S3 | MEDIUM | 무작위화 + 중립 프레이밍 |
| S4 | MEDIUM | 무작위화 + 중립 프레이밍 |
| S5 | LOW-MEDIUM | 없음 |
| S6 | HIGH→MEDIUM | 무작위화 강화 (Baseline 경험 언어 추가 금지) |
| S7 | MEDIUM | 무작위화 + 중립 프레이밍 |

**S6 Test Limitation:**
경험 서술 언어의 문체 차이로 일부 참여자가 응답 스타일을 구분할 수 있다. 이것은 measurement target이며 제거 대상이 아니다. 분석 시 "어느 스타일이 더 나은가"와 "어느 쪽이 다른 AI인가를 알았는가"를 분리 기록.

Blind = 모델 정체 숨김. 응답 스타일 동일화가 아님.

---

## S. Stimulus Quality Flags

| 플래그 | 항목 | 상태 |
|---|---|---|
| F-01 | S3 Baseline 아쿠아플라넷 근접성 | CLOSED BY NEUTRALIZATION |
| F-02 | S7 Baseline R2 이동 시간 수치 | CLOSED BY NEUTRALIZATION |

**외부 검증 의존성 (테스트 실행 전): 0건**

---

## T. Governance

| 항목 | 상태 |
|---|---|
| Candidate Generated | NO |
| New Research RQ | NO |
| Architecture Changed | NO |
| place_knowledge migration | NOT APPROVED / HOLD |
| New place authoring | NO |
| Travel Grammar | NOT CONCLUDED |
| DreamTown Founder Philosophy Candidate | HOLD |
| DB / Schema / Runtime / Production | NO CHANGE |
| Participant Evidence | NONE YET |
| Blind MVP Test | NOT YET EXECUTED |
| BT Verdict | NOT ASSIGNED |

---

## U. Current Next Action

`Prepare SOUL Travel Intelligence Blind MVP Test Execution Package V0.1 from the approved Blind MVP Test Design, including participant-facing test materials, randomized A/B presentation sheets, response forms, and Founder/Lumi observation sheet — without executing the test or collecting participant data.`

---

*SOUL Travel Intelligence Blind MVP Test Design V0.1 — 2026-09-26*
*Base: 08fa0cd / Verdict: BTD-A / Independent Review: BTD-A CONFIRMED*
*Test NOT yet executed. BT verdict NOT yet assigned.*
