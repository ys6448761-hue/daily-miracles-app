# SOUL Travel Intelligence
# Blind MVP Test Execution Package V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** ef9e301
**Status:** EXECUTION PACKAGE V0.1 — APPROVED / PERSISTED / NOT YET EXECUTED

**Package Verdict:** `EP-A — EXECUTION PACKAGE READY FOR PERSISTENCE`
**Independent Review:** `EP-A — CONFIRMED`
**Canonical Design Base:** `docs/research/SOUL_TRAVEL_INTELLIGENCE_BLIND_MVP_TEST_DESIGN_V0_1.md`
**Design Verdict (basis):** `BTD-A — CONFIRMED`

**CANONICAL STIMULI MODIFIED: NO**

This package operationalizes BTD-A.
It does not supersede or rewrite BTD-A.

**Post-Dry-Run Procedural Corrections Applied (2026-09-27):**
`OI-201 — Participant Card Preparation Rule added to §E`
`OI-202 — Physical Round-2 Separation Rule added to §G + Preflight item 7`
`OI-203 — Response Form A-Q/B-Q explicit labeling added to §F`
`OI-204 — "이게 실제 앱인가요?" added to §H facilitator script table`

Dry Run Verdict: `DR-B — CONFIRMED / PASS WITH PROCEDURAL CORRECTIONS`
Canonical stimuli: UNCHANGED / Randomization: UNCHANGED / Evaluation constructs: UNCHANGED

---

## A. Package Overview

### Components

| 구성 요소 | 형식 | 참여자 노출 |
|---|---|---|
| A. 참여자 시나리오 카드 | S1–S7 각 2버전 (α/β) | 예 — 내부 레이블 없음 |
| B. 랜덤화 시트 | 4개 프로파일 × 3인 (12인 기준) | 아니오 — 진행자 전용 |
| C. 참여자 응답 폼 | 시나리오별 독립 폼 | 예 |
| D. Founder/Lumi 관찰 시트 | 분리 문서 | 아니오 — 관찰자 전용 |
| E. 진행자 스크립트 | 표준화 안내 문구 | 아니오 |
| F. 원시 데이터 스키마 | 빈 템플릿 | 아니오 |
| G. Preflight 체크리스트 | 실행 전 확인 목록 | 아니오 |

### A/B 일관성 규칙

Layer 2 시나리오(S2/S4/S7)에서 Round 1에 SOUL=A이면 Round 2도 SOUL=A.
랜덤화 프로파일이 시나리오 전체에 걸쳐 조건 정체성을 고정한다.

---

## B. 랜덤화 프로파일

`PROVISIONAL MVP POSITION COUNTERBALANCE`

*(통계적 균형 보증이 아님. 참여자 수준 위치 혼동 감소 목적.)*

### 설계 원칙

- 7개 시나리오 중 SOUL=A 4개 또는 3개 배정 (4/3 또는 3/4 분할)
- 각 시나리오별로 4개 프로파일 중 정확히 2개가 SOUL=A, 2개가 SOUL=B
- 집계 SOUL=A/B: 14/28 = 50%
- Layer 2 시나리오(S2/S4/S7): R1과 R2의 조건이 프로파일 내에서 동일
- S6이 항상 동일한 위치에 오지 않도록 시나리오 순서 분산
- 첫 번째 시나리오에서 SOUL=A 먼저 등장: P2/P4 (2개 프로파일)
- 첫 번째 시나리오에서 Baseline=A 먼저 등장: P1/P3 (2개 프로파일)

### 프로파일 배정표

| 시나리오 | Layer | P1 | P2 | P3 | P4 |
|---|---|---|---|---|---|
| S1 | L1 | SOUL=**A** | SOUL=B | SOUL=**A** | SOUL=B |
| S2 | L2 | SOUL=B | SOUL=**A** | SOUL=**A** | SOUL=B |
| S3 | L1 | SOUL=**A** | SOUL=B | SOUL=B | SOUL=**A** |
| S4 | L2 | SOUL=B | SOUL=**A** | SOUL=**A** | SOUL=B |
| S5 | L1 | SOUL=B | SOUL=**A** | SOUL=**A** | SOUL=B |
| S6 | L1 | SOUL=**A** | SOUL=B | SOUL=B | SOUL=**A** |
| S7 | L2 | SOUL=**A** | SOUL=B | SOUL=B | SOUL=**A** |
| **SOUL=A 합계** | | **4** | **3** | **4** | **3** |
| **SOUL=B 합계** | | **3** | **4** | **3** | **4** |
| **분할** | | **4/3** | **3/4** | **4/3** | **3/4** |

### 시나리오 제시 순서

| 항목 | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| **L1 순서** | S5→S1→S3→S6 | S5→S6→S3→S1 | S3→S6→S1→S5 | S6→S3→S5→S1 |
| **L2 순서** | S2→S4→S7 | S4→S7→S2 | S7→S2→S4 | S4→S2→S7 |
| **L1 첫 시나리오** | S5 (SOUL=B) → Baseline=A 먼저 | S5 (SOUL=A) → SOUL=A 먼저 | S3 (SOUL=B) → Baseline=A 먼저 | S6 (SOUL=A) → SOUL=A 먼저 |
| **S6 위치 (L1 내)** | 4번째 | 2번째 | 2번째 | 1번째 |

### 시나리오별 균형 확인

| 시나리오 | P1 | P2 | P3 | P4 | SOUL=A | SOUL=B |
|---|---|---|---|---|---|---|
| S1 | A | B | A | B | 2 | 2 |
| S2 | B | A | A | B | 2 | 2 |
| S3 | A | B | B | A | 2 | 2 |
| S4 | B | A | A | B | 2 | 2 |
| S5 | B | A | A | B | 2 | 2 |
| S6 | A | B | B | A | 2 | 2 |
| S7 | A | B | B | A | 2 | 2 |

### Layer 2 정체성 일관성

| 시나리오 | P1 R1/R2 | P2 R1/R2 | P3 R1/R2 | P4 R1/R2 |
|---|---|---|---|---|
| S2 | B/B | A/A | A/A | B/B |
| S4 | B/B | A/A | A/A | B/B |
| S7 | A/A | B/B | B/B | A/A |

### 참여자 배정표 (12인 기준)

| 참여자 ID | 프로파일 |
|---|---|
| P-001 | P1 |
| P-002 | P2 |
| P-003 | P3 |
| P-004 | P4 |
| P-005 | P1 |
| P-006 | P2 |
| P-007 | P3 |
| P-008 | P4 |
| P-009 | P1 (3인 운영 시) |
| P-010 | P2 (3인 운영 시) |
| P-011 | P3 (3인 운영 시) |
| P-012 | P4 (3인 운영 시) |

배정 방식: 참여자 등록 순서대로 P-001→P-012 순번 부여. 순번이 확정되면 프로파일 자동 결정. 배정표는 진행자 전용.

---

## C. 조건 수준 증거 규칙

```
CONDITION-LEVEL EVIDENCE SOURCE OF TRUTH

Primary source:
  → Scenario-level Forced Choice + 6 independent Likert ratings (per scenario, per response)
  → A/B condition decoded post-collection via randomization sheet
  → A_Condition / B_Condition columns in raw data schema enable internal decoding

Layer 2 additional:
  → R1 Forced Choice
  → R2 Forced Choice
  → Continue_Willingness
  → Question_Value
  → Preference_Shift

Final cross-scenario questions (BQ1–BQ8):
  → QUALITATIVE / BEHAVIOR-LEVEL CONTEXT ONLY
  → NOT direct SOUL-vs-Baseline condition preference
  → NOT condition-level comparison evidence
  → NOT composite score inputs
  → Analysis use: behavioral style reception, not condition attribution
```

---

## D. 참여자 소개

*(참여자에게 낭독)*

> 안녕하세요, 참여해주셔서 감사합니다.
>
> 이 테스트에서는 여수 여행 중인 사람이 여행 도우미에게 질문하는 상황을 보여드릴 거예요. 각 상황마다 두 가지 서로 다른 응답—Response A와 Response B—이 제시됩니다.
>
> 지금 실제로 여수 여행 중이라고 상상하면서, 각 응답이 얼마나 도움이 될 것 같은지 느끼는 그대로 평가해주시면 됩니다.
>
> 어느 쪽이 더 낫다는 정답은 없습니다. 솔직한 반응이 가장 중요합니다.
>
> 전체 시간은 약 20~30분 정도 됩니다. 중간에 궁금하신 게 있으면 편하게 말씀해주세요.

미공개: SOUL / Phoenix / DreamTown / 증거 체계 / 어느 응답이 더 좋을 것으로 예상되는지 / 응답 생성 방식.

---

## E. 참여자 시나리오 카드 S1–S7

각 시나리오는 Version α (SOUL=Response A, Baseline=Response B)와 Version β (Baseline=Response A, SOUL=Response B) 두 버전으로 존재한다. 진행자가 랜덤화 시트에 따라 해당 참여자에게 적절한 버전을 배포한다. 카드 뒷면에 진행자 전용으로 α/β 표기.

*아래에서 [α: X] / [β: X]는 진행자 참조용이며 카드 인쇄에서 제외한다.*

---

### §E 진행자 카드 준비 규칙 (OI-201 — Post-Dry-Run Procedural Correction)

```
PARTICIPANT CARD PREPARATION RULE

α / β 는 진행자 전용 준비 레이블이다.
[α:] / [β:] 주석은 참여자 배포 자료에 절대 포함되지 않는다.

참여자 카드 인쇄 방법:
  1. 각 시나리오별로 α버전 카드와 β버전 카드를 별도 물리적 카드로 준비한다.
  2. 해당 참여자의 프로파일에 따라 올바른 버전을 선택한다.
  3. 인쇄 전 [α:] / [β:] 레이블을 모두 제거한다.
  4. 참여자 카드에 표시되는 항목:
       - 상황 (Situation)
       - 질문 (Question)
       - Response A
       - Response B
  5. SOUL / Baseline / α / β / 내부 레이블은 참여자 카드에 표시하지 않는다.
```

---

### 시나리오 1 카드 (Layer 1)

**[상황]**
당신은 지금 여수 여행 중입니다. 자가용을 가지고 왔고, 하멜등대 인근에 있습니다. 케이블카에 가보고 싶어서 여행 도우미에게 물어봤습니다.

**[질문]** "하멜등대에서 케이블카 탑승장까지 얼마나 걸려요?"

---

**Response A**

[α: SOUL] 하멜등대에서 케이블카 자산 쪽 탑승장(해야정류장)은 차로 2분 거리예요 — 바로 옆이라 걸어가도 5~10분이면 돼요. 돌산 쪽 탑승장은 차로 5~10분 정도 더 걸려요. 운영 시간이랑 요금은 방문 전에 한 번 확인해 보시는 게 좋아요.

[β: Baseline] 여수해상케이블카는 하멜등대에서 차로 약 5~10분 거리에 위치해 있습니다. 자산 탑승장(해야정류장)과 돌산 탑승장(놀아정류장) 두 곳에서 탑승할 수 있으며, 편도와 왕복권을 모두 구매할 수 있습니다. 운영 시간은 평일과 주말이 다르므로 방문 전 공식 홈페이지에서 확인하시기 바랍니다.

**Response B**

[α: Baseline] 여수해상케이블카는 하멜등대에서 차로 약 5~10분 거리에 위치해 있습니다. 자산 탑승장(해야정류장)과 돌산 탑승장(놀아정류장) 두 곳에서 탑승할 수 있으며, 편도와 왕복권을 모두 구매할 수 있습니다. 운영 시간은 평일과 주말이 다르므로 방문 전 공식 홈페이지에서 확인하시기 바랍니다.

[β: SOUL] 하멜등대에서 케이블카 자산 쪽 탑승장(해야정류장)은 차로 2분 거리예요 — 바로 옆이라 걸어가도 5~10분이면 돼요. 돌산 쪽 탑승장은 차로 5~10분 정도 더 걸려요. 운영 시간이랑 요금은 방문 전에 한 번 확인해 보시는 게 좋아요.

---

### 시나리오 2 카드 (Layer 2)

**[상황]**
당신은 지금 여수에서 혼자 여행 중입니다. 케이블카 탑승장 근처에 있고, 편도로 탈지 왕복으로 탈지 고민하고 있습니다.

**[질문]** "케이블카 편도로 탈까요 왕복으로 탈까요?"

**— Round 1 —**

**Response A (Round 1)**

[α: SOUL] 지금 정보만으로는 편도랑 왕복 중 어느 쪽이 더 맞을지 정하기 어려워요. 지금 자산 쪽(해야정류장)에서 타실 예정이에요, 돌산 쪽(놀아정류장)에서 타실 예정이에요?

[β: Baseline] 여수해상케이블카는 편도와 왕복 두 가지 방식으로 이용할 수 있습니다. 편도는 한쪽 탑승장에서 타서 반대편으로 내려오는 방식이고, 왕복은 출발한 탑승장으로 다시 돌아오는 방식입니다. 어느 쪽이 편리한지는 이후 이동 계획에 따라 달라질 수 있어요. 어느 쪽 탑승장에서 타실 예정인지 알면 좀 더 맥락에 맞게 설명드릴 수 있습니다.

**Response B (Round 1)**

[α: Baseline] 여수해상케이블카는 편도와 왕복 두 가지 방식으로 이용할 수 있습니다. 편도는 한쪽 탑승장에서 타서 반대편으로 내려오는 방식이고, 왕복은 출발한 탑승장으로 다시 돌아오는 방식입니다. 어느 쪽이 편리한지는 이후 이동 계획에 따라 달라질 수 있어요. 어느 쪽 탑승장에서 타실 예정인지 알면 좀 더 맥락에 맞게 설명드릴 수 있습니다.

[β: SOUL] 지금 정보만으로는 편도랑 왕복 중 어느 쪽이 더 맞을지 정하기 어려워요. 지금 자산 쪽(해야정류장)에서 타실 예정이에요, 돌산 쪽(놀아정류장)에서 타실 예정이에요?

*(→ Round 1 평가 완료 후 시뮬레이션 업데이트 카드 제시)*

**[새로운 상황 카드]** 여행자가 말했습니다: *"자산 쪽에 있어요."*
*(두 응답 모두 이 정보를 받았다고 가정합니다)*

**— Round 2 —**

**Response A (Round 2)**

[α: SOUL] 자산 쪽이시군요. 케이블카 다음에 계획이 있으세요? 어디로 이동하실 건지 알면 같이 생각해볼 수 있어요.

[β: Baseline] 자산 쪽(해야정류장)에서 타시는군요. 자산에서 탑승해 올라가면 여수 바다와 돌산도 쪽 풍경이 펼쳐져요. 왕복으로 타시면 자산 탑승장으로 다시 내려오고, 편도로 타시면 돌산 탑승장(놀아정류장)으로 내려오게 됩니다.

**Response B (Round 2)**

[α: Baseline] 자산 쪽(해야정류장)에서 타시는군요. 자산에서 탑승해 올라가면 여수 바다와 돌산도 쪽 풍경이 펼쳐져요. 왕복으로 타시면 자산 탑승장으로 다시 내려오고, 편도로 타시면 돌산 탑승장(놀아정류장)으로 내려오게 됩니다.

[β: SOUL] 자산 쪽이시군요. 케이블카 다음에 계획이 있으세요? 어디로 이동하실 건지 알면 같이 생각해볼 수 있어요.

---

### 시나리오 3 카드 (Layer 1)

**[상황]**
당신은 지금 아이들과 함께 이순신광장에 있습니다. 아이들이 좋아할 만한 다음 장소를 찾고 있습니다.

**[질문]** "여기 있는데 아이들 좋아할 만한 데 어디 가면 좋을까요?"

---

**Response A**

[α: SOUL] 이순신광장은 탁 트인 항구 광장이라 아이들이 뛰어다니기 편한 편이에요. 다음에 어디 갈지는 여수 아이들 코스를 제가 아직 자세히 모르는 곳들이 많아서요. 아이들이 몇 살 정도예요?

[β: Baseline] 여수에서 아이들과 가볼 만한 곳으로는 여수 아쿠아플라넷이 있어요. 아쿠아리움으로 다양한 해양 생물을 볼 수 있어요. 오동도는 섬 안에 산책로가 있고, 엑스포공원도 넓은 야외 공간이 있습니다.

**Response B**

[α: Baseline] 여수에서 아이들과 가볼 만한 곳으로는 여수 아쿠아플라넷이 있어요. 아쿠아리움으로 다양한 해양 생물을 볼 수 있어요. 오동도는 섬 안에 산책로가 있고, 엑스포공원도 넓은 야외 공간이 있습니다.

[β: SOUL] 이순신광장은 탁 트인 항구 광장이라 아이들이 뛰어다니기 편한 편이에요. 다음에 어디 갈지는 여수 아이들 코스를 제가 아직 자세히 모르는 곳들이 많아서요. 아이들이 몇 살 정도예요?

---

### 시나리오 4 카드 (Layer 2)

**[상황]**
당신은 오후 4~5시쯤 여수 여행 중입니다. 오늘 많이 걸어서 너무 지쳤고, 가볍게 즐길 수 있는 곳을 찾고 있습니다.

**[질문]** "너무 지쳤는데 그냥 가볍게 갈 수 있는 데 없을까요?"

**— Round 1 —**

**Response A (Round 1)**

[α: SOUL] 많이 지치셨나 봐요. 지금 어디쯤 계세요? 가까운 데부터 같이 볼게요.

[β: Baseline] 지치셨군요. 가볍게 즐길 수 있는 곳으로 이순신광장을 추천드려요. 걸어서 여수 항구 분위기를 느낄 수 있고, 체력 소모가 적어요. 아니면 케이블카도 앉아서 이동하는 코스라 체력 부담이 적습니다. 낭만포차거리에서 저녁 일찍 드시는 것도 좋아요.

**Response B (Round 1)**

[α: Baseline] 지치셨군요. 가볍게 즐길 수 있는 곳으로 이순신광장을 추천드려요. 걸어서 여수 항구 분위기를 느낄 수 있고, 체력 소모가 적어요. 아니면 케이블카도 앉아서 이동하는 코스라 체력 부담이 적습니다. 낭만포차거리에서 저녁 일찍 드시는 것도 좋아요.

[β: SOUL] 많이 지치셨나 봐요. 지금 어디쯤 계세요? 가까운 데부터 같이 볼게요.

*(→ Round 1 평가 완료 후 시뮬레이션 업데이트 카드 제시)*

**[새로운 상황 카드]** 여행자가 말했습니다: *"이순신광장 근처에 있어요."*
*(두 응답 모두 이 정보를 받았다고 가정합니다)*

**— Round 2 —**

**Response A (Round 2)**

[α: SOUL] 이순신광장이면 항구 바로 앞이에요. 탁 트인 광장이라 그냥 바다를 바라보며 쉬기 좋은 곳이에요. 지금 조금 걷는 건 괜찮으세요, 아니면 그냥 앉아서 쉬고 싶으세요?

[β: Baseline] 이순신광장 근처에 계시군요. 이순신광장은 여수 항구 중심부에 위치해 있어 바다를 바라보며 여유롭게 쉬기에 좋은 곳이에요. 이충무공 동상도 볼 수 있어요. 너무 지치셨으면 광장 안에서 잠깐 앉아 쉬어가시는 것도 좋아요.

**Response B (Round 2)**

[α: Baseline] 이순신광장 근처에 계시군요. 이순신광장은 여수 항구 중심부에 위치해 있어 바다를 바라보며 여유롭게 쉬기에 좋은 곳이에요. 이충무공 동상도 볼 수 있어요. 너무 지치셨으면 광장 안에서 잠깐 앉아 쉬어가시는 것도 좋아요.

[β: SOUL] 이순신광장이면 항구 바로 앞이에요. 탁 트인 광장이라 그냥 바다를 바라보며 쉬기 좋은 곳이에요. 지금 조금 걷는 건 괜찮으세요, 아니면 그냥 앉아서 쉬고 싶으세요?

---

### 시나리오 5 카드 (Layer 1)

**[상황]**
오늘 날씨가 좋지 않습니다. 비가 내리거나 바람이 강하게 불고 있습니다. 케이블카에 가볼 계획이 있습니다.

**[질문]** "오늘 날씨가 이런데 케이블카 운행해요?"

---

**Response A**

[α: SOUL] 기상에 따라 운행이 멈추는 경우가 있어서 오늘 운행 중인지는 제가 지금 확인이 안 돼요. 가시기 전에 공식 채널로 먼저 확인해 보시는 게 좋아요.

[β: Baseline] 여수해상케이블카는 기상 악화 시 운행이 중단될 수 있습니다. 특히 강풍이나 폭우 시 안전을 위해 운행을 멈추는 경우가 있습니다. 오늘 날씨 상황에 따른 운행 여부는 운영사에 직접 확인하시는 것이 가장 정확합니다.

**Response B**

[α: Baseline] 여수해상케이블카는 기상 악화 시 운행이 중단될 수 있습니다. 특히 강풍이나 폭우 시 안전을 위해 운행을 멈추는 경우가 있습니다. 오늘 날씨 상황에 따른 운행 여부는 운영사에 직접 확인하시는 것이 가장 정확합니다.

[β: SOUL] 기상에 따라 운행이 멈추는 경우가 있어서 오늘 운행 중인지는 제가 지금 확인이 안 돼요. 가시기 전에 공식 채널로 먼저 확인해 보시는 게 좋아요.

---

### 시나리오 6 카드 (Layer 1)

**[상황]**
당신은 패키지 여행으로 여수에 왔습니다. 케이블카 탑승장(돌산 쪽)에서 곧 케이블카를 타게 됩니다. 탑승하기 직전입니다.

**[질문]** "케이블카 어떤 경험이에요?"

---

**Response A**

[α: SOUL] 올라가는 동안 여수 바다가 발아래로 펼쳐지는데, 딱히 뭔가를 해야 하는 시간이 아니라 그냥 바라보기만 해도 충분한 것 같아요. 짧은 시간인데 일상이랑 잠깐 거리를 두는 느낌이 있어요. 내려올 때쯤엔 조금 가벼워진 느낌이 들 수도 있어요.

[β: Baseline] 여수해상케이블카는 돌산과 자산을 연결하는 케이블카로, 여수 앞바다를 한눈에 내려다볼 수 있습니다. 수면에서 상당한 높이까지 올라가며, 왕복과 편도 모두 이용 가능합니다. 맑은 날에는 멀리까지 조망이 가능하고, 탑승 시간은 짧습니다.

**Response B**

[α: Baseline] 여수해상케이블카는 돌산과 자산을 연결하는 케이블카로, 여수 앞바다를 한눈에 내려다볼 수 있습니다. 수면에서 상당한 높이까지 올라가며, 왕복과 편도 모두 이용 가능합니다. 맑은 날에는 멀리까지 조망이 가능하고, 탑승 시간은 짧습니다.

[β: SOUL] 올라가는 동안 여수 바다가 발아래로 펼쳐지는데, 딱히 뭔가를 해야 하는 시간이 아니라 그냥 바라보기만 해도 충분한 것 같아요. 짧은 시간인데 일상이랑 잠깐 거리를 두는 느낌이 있어요. 내려올 때쯤엔 조금 가벼워진 느낌이 들 수도 있어요.

---

**[S6 누출 확인 — 평가 완료 후 제시]**

두 응답이 서로 다른 종류의 여행 도우미가 작성한 것처럼 느껴졌나요?
□ 예 &ensp;□ 아니오 &ensp;□ 잘 모르겠다

*(예인 경우)* 어떤 차이가 느껴졌나요? \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

S6 스타일 누출은 사전 승인된 test limitation이다. 제거 대상이 아니다.
결과 분석 시 "어느 스타일이 더 나은가"와 "스타일 차이를 인식했는가"를 분리 기록한다.

---

### 시나리오 7 카드 (Layer 2)

**[상황]**
향일암에 가보려고 했는데 사정이 생겨서 갈 수 없게 됐습니다.

**[질문]** "향일암이 안 되는데 어디로 가면 좋을까요?"

**— Round 1 —**

**Response A (Round 1)**

[α: SOUL] 아쉬우셨겠어요. 지금 어디쯤 계세요?

[β: Baseline] 향일암이 안 되셨군요. 여수에는 다른 명소들이 많아요. 오동도, 이순신광장, 케이블카 등 다양한 선택지가 있으니 이동 편의에 맞게 고려해 보세요. 시간이 있으시면 낭만포차거리에서 저녁 식사도 추천합니다.

**Response B (Round 1)**

[α: Baseline] 향일암이 안 되셨군요. 여수에는 다른 명소들이 많아요. 오동도, 이순신광장, 케이블카 등 다양한 선택지가 있으니 이동 편의에 맞게 고려해 보세요. 시간이 있으시면 낭만포차거리에서 저녁 식사도 추천합니다.

[β: SOUL] 아쉬우셨겠어요. 지금 어디쯤 계세요?

*(→ Round 1 평가 완료 후 시뮬레이션 업데이트 카드 제시)*

**[새로운 상황 카드]** 여행자가 말했습니다: *"향일암 근처인데 차가 있어요."*
*(두 응답 모두 이 정보를 받았다고 가정합니다)*

**— Round 2 —**

**Response A (Round 2)**

[α: SOUL] 차가 있으시군요. 오늘 남은 시간이 어떻게 되세요?

[β: Baseline] 차가 있으시군요. 여수에는 오동도, 이순신광장, 케이블카 등 다양한 곳이 있어요. 남은 시간에 따라 이동 계획을 잡으시면 좋을 것 같습니다.

**Response B (Round 2)**

[α: Baseline] 차가 있으시군요. 여수에는 오동도, 이순신광장, 케이블카 등 다양한 곳이 있어요. 남은 시간에 따라 이동 계획을 잡으시면 좋을 것 같습니다.

[β: SOUL] 차가 있으시군요. 오늘 남은 시간이 어떻게 되세요?

---

## F. 참여자 응답 폼

### 기본 척도

```
1 = 전혀 그렇지 않다
2 = 그렇지 않은 편이다
3 = 보통이다
4 = 그런 편이다
5 = 매우 그렇다
```

---

### Layer 1 응답 폼 (S1 / S3 / S5 / S6 공통)

**시나리오 ___ [진행자 기입]**

**Response A 평가**

Q1. 이 답변이 내 지금 여행 상황을 이해하고 있는 것 같았다.
1□ 2□ 3□ 4□ 5□

Q2. 이 답변을 받고 다음에 뭘 할지 정하기 쉬워졌다.
1□ 2□ 3□ 4□ 5□

Q3. 실제 여행에서 이 답변을 믿고 참고할 수 있을 것 같다.
1□ 2□ 3□ 4□ 5□

Q4. 정보를 검색하는 느낌보다는 여수를 아는 친구에게 물어본 느낌이었다.
1□ 2□ 3□ 4□ 5□

Q5. 이 응답이 자연스러운 대화처럼 느껴졌다.
1□ 2□ 3□ 4□ 5□

Q6. 실제 여행 중이라면 이 답변을 참고해 다음 행동을 해볼 것 같다.
1□ 2□ 3□ 4□ 5□

**Response B 평가** (OI-203 — Post-Dry-Run Procedural Correction)

물리적 폼 인쇄 시 반드시 명시적 섹션 헤더와 독립 번호를 사용한다:

**Response B 평가** — B-Q1~B-Q6 (A 평가와 혼동 방지를 위한 독립 번호 체계)

**Forced Choice**
지금 실제로 여수 여행 중이라면 어느 답변을 더 받고 싶으세요?
□ Response A &ensp;□ Response B &ensp;□ 둘 다 비슷함 &ensp;□ 둘 다 받고 싶지 않음

**이유** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**행동별 추가 질문**

S3 전용: 정보를 지어내지 않고 아는 범위만 솔직하게 말한 응답이 있다면, 그 솔직함이 도움이 되었나요?
1 (방해됐다)□ 2□ 3□ 4□ 5 (도움이 됐다)□

S5 전용: "지금 확인이 안 된다"고 말하고 직접 확인을 권한 응답이 있다면, 그런 방식이 신뢰를 높였나요, 낮췄나요?
1 (많이 낮아짐)□ 2□ 3 (변화 없음)□ 4□ 5 (높아짐)□

S6 전용 (평가 완료 후): 두 응답이 서로 다른 종류의 여행 도우미가 작성한 것처럼 느껴졌나요?
□ 예 □ 아니오 □ 잘 모르겠다
*(예인 경우)* 어떤 차이가 느껴졌나요? \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

### Layer 2 응답 폼 (S2 / S4 / S7 공통)

**시나리오 ___ (다중 라운드) [진행자 기입]**

#### PART 1 — Round 1 평가

**Response A (Round 1) 평가** — A-Q1~A-Q6 (명시적 A-Q 번호 사용)
**Response B (Round 1) 평가** — B-Q1~B-Q6 (명시적 B-Q 번호 사용, OI-203)

**Round 1 즉각 선호**
Round 1 응답만 보았을 때, 어느 쪽이 더 즉각적으로 도움이 됐나요?
□ Response A &ensp;□ Response B &ensp;□ 둘 다 비슷함 &ensp;□ 둘 다 받고 싶지 않음

**대화 의향**
두 응답 중 당신에게 무언가를 물어본 응답이 있다면, 그 질문에 답하고 대화를 이어가고 싶으셨나요?
1□ 2□ 3□ 4□ 5□

그 질문이 왜 물어보는지 이해가 됐나요?
1□ 2□ 3□ 4□ 5□

*(진행자: 여기서 멈추고 시뮬레이션 업데이트 카드를 제시한다. Round 2는 업데이트 제시 전에 보여주지 않는다.)*

#### PART 2 — Round 2 평가

**Response A (Round 2) 평가** — A-Q1~A-Q6 (동일 6개 항목, 명시적 A-Q 번호 사용)
**Response B (Round 2) 평가** — B-Q1~B-Q6 (동일 6개 항목, 명시적 B-Q 번호 사용)

**Round 2 Forced Choice**
새로운 상황 업데이트 이후, 어느 응답을 더 받고 싶었나요?
□ Response A &ensp;□ Response B &ensp;□ 둘 다 비슷함 &ensp;□ 둘 다 받고 싶지 않음

**선호 변화**
Round 1과 비교했을 때 선호가 달라졌나요?
□ 예, A쪽으로 &ensp;□ 예, B쪽으로 &ensp;□ 아니오, 비슷함

*(예인 경우)* 무엇이 달라진 것 같았나요? \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**질문 가치**
Round 1에서 물어봤던 질문에 답했을 때, Round 2 응답이 더 유용해졌다고 느껴지셨나요?
1□ 2□ 3□ 4□ 5□

**이유** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

### 최종 교차 질문 폼 (BQ1–BQ8)

`BQ1–BQ8 = QUALITATIVE / BEHAVIOR-LEVEL CONTEXT`
`NOT direct SOUL-vs-Baseline condition preference`

*(모든 시나리오 완료 후)*

**BQ1.** 여행 도우미가 바로 추천하지 않고 먼저 상황을 물어보는 방식은 전반적으로 어땠나요?
□ 도움이 됐다, 다음 대화가 더 유용해졌다
□ 처음엔 불편했지만 이해는 됐다
□ 바로 답해줬으면 좋겠다
□ 잘 모르겠다

**BQ2.** 확인할 수 없는 내용을 추측하지 않고 직접 확인을 권하는 방식은 전반적으로 어땠나요?
□ 신뢰가 높아졌다
□ 불편했지만 이해한다
□ 차라리 대략적으로라도 알려줬으면 좋겠다
□ 잘 모르겠다

**BQ3.** 장소 정보뿐 아니라 그 장소에서 느낄 수 있는 경험까지 이야기해주는 방식은 어땠나요?
□ 여행이 더 기대됐다
□ 필요 이상으로 감성적이라 느껴졌다
□ 딱히 영향이 없었다
□ 잘 모르겠다

**BQ4.** 추가 질문 없이 바로 여러 선택지를 제시하는 방식은 전반적으로 어땠나요?
□ 빠르고 편했다
□ 내 상황과 안 맞는 답인 것 같아 아쉬웠다
□ 상황에 따라 달랐다
□ 잘 모르겠다

**BQ5.** 실제 여행에서는 어떤 방식이 가장 좋을 것 같나요?
□ 바로 선택지를 알려주는 방식
□ 필요한 상황을 먼저 물어보는 방식
□ 상황에 따라 둘을 섞는 방식
□ 잘 모르겠다

**BQ6.** 되묻는 질문이 있는 경우, 어떻게 느끼셨나요?
□ 도움이 됐다, 다음 대화가 더 유용해졌다
□ 답하기 귀찮았지만 이해는 됐다
□ 그냥 바로 답해줬으면 좋겠다
□ 잘 모르겠다

**BQ7.** "모르는 걸 지어내지 않고 솔직하게 말하는 방식"은 어떻게 느껴지셨나요?
□ 신뢰가 높아졌다
□ 불편했지만 이해한다
□ 차라리 추천해줬으면 좋겠다
□ 잘 모르겠다

**BQ8.** (자유) 오늘 경험하신 다양한 응답 방식 중 기억에 남는 점이 있으면 자유롭게 적어주세요.
\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## G. Layer 2 운영 흐름

*(진행자 전용. 참여자 미노출.)*

```
LAYER 2 SCENARIO FLOW

Step 1  [배포] 여행자 상황 + 질문 + Round 1 Response A / Round 1 Response B
Step 2  [수집] 참여자가 Layer 2 폼 PART 1 완성 (Q1~Q6 × 2 + 즉각 선호 + 대화 의향)
Step 3  ★ STOP — Round 2 카드를 아직 배포하지 않는다
Step 4  [배포] 시뮬레이션 업데이트 카드
        → 대사: "새로운 정보가 생겼어요. 두 도우미 모두 이 내용을 받았다고 가정하고,
                 각각 어떻게 답했는지 볼게요."
Step 5  [배포] Round 2 Response A / Round 2 Response B
        → Round 1 응답 카드는 참여자가 여전히 볼 수 있도록 유지
Step 6  [수집] 참여자가 Layer 2 폼 PART 2 완성 (Q1~Q6 × 2 + Forced Choice + 선호 변화 + 질문 가치 + 이유)
```

A/B 정체성 일관성: Round 1에서 SOUL이 Response A인 시나리오는 Round 2에서도 SOUL이 Response A. 랜덤화 시트 프로파일이 이를 보장. 진행자가 Round 2 카드 배포 시 프로파일 재확인 필수.

### §G Layer 2 물리적 카드 분리 규칙 (OI-202 — Post-Dry-Run Procedural Correction)

```
ROUND 2 PHYSICAL SEPARATION RULE

Layer 2 시나리오(S2 / S4 / S7)에서:
Round 2 카드는 Round 1 카드와 물리적으로 분리된 상태로 준비한다.

허용 방법:
  - 별도 봉인 또는 레이블이 붙은 진행자 전용 봉투 (시나리오별 1개)
  또는
  - 물리적으로 분리된 진행자 전용 카드 묶음

참여자는 Round 1 평가 완료 전까지 Round 2 카드를 볼 수 없어야 한다.
Preflight 항목 7번에서 물리적 분리 상태를 확인한다.
```

---

## H. 진행자 스크립트

### 시작 전 안내 (낭독)

> "안녕하세요. 오늘 참여해주셔서 감사합니다.
>
> 이 테스트에서는 여수 여행 중인 사람이 여행 도우미에게 질문하는 상황을 보여드릴 거예요. 각 상황에서 두 가지 응답—Response A와 Response B—을 보시고, 실제 여행 중이라면 어떤 느낌인지 솔직하게 평가해주시면 됩니다.
>
> 어느 응답이 더 낫다는 정답은 없어요. 느끼신 그대로 말씀해주시는 게 가장 좋아요."

### Layer 2 업데이트 제시 시

> "새로운 상황이 생겼어요. 여행자가 추가 정보를 말했다고 가정합니다. 두 도우미 모두 이 내용을 받았어요. 각각 어떻게 답했는지 볼게요."

### 참여자 질문 대응

| 질문 | 표준 응답 |
|---|---|
| "어느 답변이 맞는 거예요?" | "정답을 찾는 테스트라기보다 실제 여행 중 어떤 답변이 더 도움이 되는지 느낀 그대로 말씀해주시면 됩니다." |
| "이 도우미가 왜 그런 질문을 한 건가요?" | "느끼신 그대로 평가해주시면 됩니다. 저는 응답이 어떤 의도로 만들어졌는지는 설명하지 않아요." |
| "어느 쪽이 더 좋은 AI예요?" | "두 가지 모두 그냥 다른 방식으로 설계된 도우미예요. 어느 게 더 낫다는 답은 오늘 여러분이 알려주시는 거예요." |
| "이게 실제 사용 가능한 앱인가요?" / "어디서 사용할 수 있어요?" | "오늘은 응답 방식에 대한 피드백을 수집하는 자리예요. 서비스 출시 관련 내용은 오늘 범위 밖이에요." *(이 이상 설명 금지 — 개발 현황 / 출시 일정 / SOUL / Phoenix / DreamTown 언급 금지)* |

### 진행자 금지 행동

SOUL / Phoenix / DreamTown 이름 언급 / 어느 응답이 더 정확하다고 암시 / 어느 응답이 더 낫다고 예상되는지 유도 / 참여자의 낮은 평가에 반응 / ASK 응답의 의도 설명 / 조건 정체성 암시

---

## I. Founder / Lumi 관찰 시트

`관찰 노트 = 정성적 증거 / NOT TRUTH`
`진행자 해석이 참여자 응답을 대체하지 않는다`

### 관찰자 블라인딩 프로토콜

```
OBSERVER BLINDING PROTOCOL

[권장 방식]
관찰자는 Response A 또는 Response B 반응만 기록한다.
SOUL/Baseline 조건 정체성을 기록하지 않는다.
조건 디코딩은 데이터 수집 완료 후 랜덤화 시트를 참조해 수행한다.

[운영상 불가피한 경우]
Observer_Condition_Aware = YES 로 기록한다.
해당 참여자의 행동 관찰을 분석 시 상승된 주의로 처리한다.
이는 차단 조건이 아니다 — 기록 의무만 부과한다.

[기록 형식]
  시나리오 ID + Round + Response A 또는 B + 관찰 내용
  → 조건 레이블 없이 A/B 레이블로만 기록
```

---

**참여자 ID:** \_\_ &ensp;**프로파일:** \_\_ &ensp;**날짜:** \_\_ &ensp;**관찰자:** \_\_ &ensp;**Observer_Condition_Aware:** YES / NO

**시나리오별 관찰 기록표**

| 시나리오 | 끝까지 읽었나 | 다시 읽었나 | 망설임 시점 | 즉각 반응 | 기억에 남는 발화 | 기타 |
|---|---|---|---|---|---|---|
| S1 | | | | | | |
| S2-R1 | | | | | | |
| S2-R2 | | | | | | |
| S3 | | | | | | |
| S4-R1 | | | | | | |
| S4-R2 | | | | | | |
| S5 | | | | | | |
| S6 | | | | | | |
| S7-R1 | | | | | | |
| S7-R2 | | | | | | |

**ASK 응답 반응 (S2/S4/S7)**

| 시나리오 | 짜증 신호 | 납득 신호 | 흥미 신호 | 기타 |
|---|---|---|---|---|
| S2 | | | | |
| S4 | | | | |
| S7 | | | | |

**신호 코드:** FU=상황이해 신호 / AF=ASK 마찰 신호 / TR=신뢰 신호 / OV=감성 과잉 신호 / SH=응답 짧음 신호 / WH=왜 물어봄 신호 / VC=자발적 맥락 공유

**전체 세션 관찰 메모** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## J. 원시 데이터 스키마 (빈 템플릿)

참여자 데이터 없음. 구조만 정의.

### 배경 정보 테이블

| Participant_ID | Travel_Frequency | Yeosu_Experience | AI_App_Usage | Companion_Type | Group_A | Group_B | Group_C | Profile |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

### 시나리오별 응답 테이블

| Participant_ID | Scenario_ID | Layer | Round | A_Condition | B_Condition | A_Q1 | A_Q2 | A_Q3 | A_Q4 | A_Q5 | A_Q6 | B_Q1 | B_Q2 | B_Q3 | B_Q4 | B_Q5 | B_Q6 | Forced_Choice | Qualitative_Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | | | | | | | |

*(A_Condition, B_Condition: SOUL / Baseline — 내부 기록용 / A_Q1=Felt Understanding / A_Q2=Decision Ease / A_Q3=Trust / A_Q4=Companion Feel / A_Q5=Naturalness / A_Q6=Action Willingness)*
*(Forced_Choice: A / B / BOTH_SIMILAR / NEITHER)*

### Layer 2 추가 컬럼 테이블

| Participant_ID | Scenario_ID | R1_Forced_Choice | Continue_Willingness | Question_Understood | R2_Forced_Choice | Preference_Shift | Preference_Shift_Direction | Question_Value | Qualitative_Reason_R2 |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

### 행동별 추가 컬럼 테이블

| Participant_ID | Scenario_ID | Behavior_Question_Type | Behavior_Score | Behavior_Note |
|---|---|---|---|---|
| | | | | |

*(Behavior_Question_Type: ASK_Continue / ASK_WhyUnderstood / LIVE_VERIFY_Trust / INSUFFICIENT_Helpfulness)*

### S6 누출 관찰 테이블

| Participant_ID | S6_StyleDiff_Detected | S6_StyleDiff_Description |
|---|---|---|
| | | |

### 최종 교차 질문 테이블 (BQ1–BQ8)

| Participant_ID | BQ1_FollowupStyle | BQ2_HonestyStyle | BQ3_ExperienceFraming | BQ4_ImmediateRec | BQ5_PreferredBalance | BQ6_FollowupFeel | BQ7_HonestyFeel | BQ8_FreeComment |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

`NO COMPOSITE SCORE. 6개 항목 독립 분석.`

### 관찰자 메모 테이블

| Participant_ID | Scenario_ID | Round | A_or_B | Signal_Code | Verbatim_Phrase | Observer_Note | Observer_Condition_Aware |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

---

## K. 참여자 개인정보 필드

**수집 허용:** 참여자 ID (익명) / 여행 빈도 / 여수 방문 경험 / AI 앱 사용 경험 / 여행 동반자 유형

**수집 금지:** 실명 / 전화번호 / 정확한 주소 / 계정 식별자 / 사진 또는 영상 녹화

**보관:** 익명 ID만 기록. Participant_ID ↔ 실제 인물 매핑은 Founder 전용 보관.

---

## L. Preflight 체크리스트 (V0.2)

```
FACILITATOR PREFLIGHT CHECKLIST

□ 1. 승인된 자극 확인
     → 시나리오 카드가 BTD-A 최종본과 일치하는가?
     → 구버전 자극이 혼입되지 않았는가?

□ 2. 버전 준비 상태
     → 각 참여자의 프로파일(P1~P4)이 사전에 배정되었는가?
     → 배정표에 따라 α / β 버전 카드가 올바르게 준비되었는가?

□ 3. A/B 배정 정확성
     → 랜덤화 시트에서 해당 참여자의 각 시나리오 A/B 배정을 확인했는가?

□ 4. Layer 2 정체성 일관성
     → S2 / S4 / S7 각각에서 Round 1과 Round 2의 조건 배정이 동일한가?
     → Round 2 카드가 Round 1과 같은 프로파일 버전인가?

□ 5. 업데이트 동일성
     → S2 업데이트: "자산 쪽에 있어요." — A/B 동일 제시 준비 완료
     → S4 업데이트: "이순신광장 근처에 있어요." — A/B 동일 제시 준비 완료
     → S7 업데이트: "향일암 근처인데 차가 있어요." — A/B 동일 제시 준비 완료

□ 6. 조건 정체성 누출 방지
     → 카드에 SOUL / Baseline / Phoenix / DreamTown / SSOT / ANSWER / ASK /
        LIVE_VERIFY / INSUFFICIENT 등 내부 레이블이 인쇄되지 않았는가?
     → 진행자 내부 메모가 참여자 시야에 노출되지 않는가?

□ 7. Round 2 은닉 (OI-202 — Post-Dry-Run Procedural Correction)
     → Layer 2에서 Round 2 카드는 Round 1 평가 완료 전까지 물리적으로 분리되어 있는가?
     → S2 / S4 / S7 각각의 R2 카드가 별도 봉투 또는 물리적으로 분리된 카드 묶음으로 준비되어 있는가?

□ 8. 응답 폼 상태
     → 모든 폼이 빈 상태인가?
     → 사전 기재된 답변이 없는가?

□ 9. 관찰자 시트 분리
     → Founder/Lumi 관찰 시트가 참여자 폼과 물리적으로 분리되어 있는가?

□ 10. 임계값 / 판정 기준 은닉
       → 참여자가 볼 수 있는 위치에 BT-A/B/C/D 또는 PROVISIONAL 임계값이
          인쇄되어 있지 않은가?

□ 11. 진행자 중립성 확인
       → 어느 쪽이 더 잘 설계됐다는 기대를 참여자에게 표현하지 않는다
       → 참여자의 평가에 표정이나 말로 반응하지 않는다

□ 12. 배경 정보 폼 준비
       → Group A/B/C 분류 질문이 포함된 배경 폼이 준비되어 있는가?

□ 13. 참여자 수준 위치 혼합 배정 확인
       → 해당 참여자 프로파일에서 SOUL=A와 SOUL=B가 모두 포함되어 있는가?
       → 7개 시나리오 중 3개 이상이 SOUL=A, 3개 이상이 SOUL=B로 배정되어 있는가?
       → P1: 4A/3B ✓ / P2: 3A/4B ✓ / P3: 4A/3B ✓ / P4: 3A/4B ✓

PREFLIGHT RESULT: □ PASS (13/13)  □ BLOCKED (항목 기재: ___)
```

---

## M. Known Operational Risks

| 위험 | 가능성 | 영향 | 완화 방법 |
|---|---|---|---|
| 버전 혼용 (α/β 혼입) | 중간 | 높음 | Preflight 체크 2, 3번 + 카드 뒷면 진행자 표기 |
| Round 2 조기 노출 | 중간 | 높음 | Preflight 체크 7번 + Layer 2 흐름 Step 3 명시 |
| S6 스타일 누출 | 높음 | 중간 | 사전 승인된 측정 대상 / 별도 컬럼 기록 |
| 진행자 기대 누출 | 낮음~중간 | 높음 | 스크립트 준수 / 표정 반응 금지 명시 |
| Layer 2 정체성 불일치 | 낮음 | 높음 | Preflight 체크 4번 |
| 업데이트 비대칭 제시 | 낮음 | 높음 | Layer 2 흐름 Step 4 + Preflight 체크 5번 |
| 참여자 연구 목적 추측 | 중간 | 중간 | 소개문 중립 표현 + 진행자 스크립트 대응 |
| 복합 점수 계산 오류 | 낮음 | 중간 | 스키마에 NO COMPOSITE 명시 / 6개 컬럼 독립 |
| 8인 미만 운영 | 낮음 | 중간 | PROVISIONAL 임계값 기준 / 미달 시 신뢰도 별도 기재 |
| 참여자 수준 위치 혼동 | 낮음~중간 | 중간 | Preflight 체크 13번 — 프로파일 내 혼합 배정 확인 |

---

## N. Dry Run 규칙

`FACILITATOR DRY RUN = NON-EVIDENTIARY`

Dry run으로 검증 가능: 카드 배포 순서 / 프로파일 배정 흐름 / 폼 기입 흐름 / Round 2 은닉/공개 타이밍 / 진행자 스크립트 낭독

Dry run으로 생성 불가:
- Participant Evidence
- 테스트 결과
- BT-A/B/C/D 판정
- "실제 사용자 검증" 표현

Dry run 결과물 전체에 명기:
```
DRY RUN / NON-EVIDENTIARY
```

Dry run은 이 패키지에서 수행하지 않는다.

---

## O. Three-Perspective Review

### World

패키지는 진행자가 연구 설계를 재해석하지 않아도 운영 가능하다. Preflight 13항목이 가장 흔한 오류(버전 혼용, Round 2 조기 노출, 누출 표현)를 사전에 차단한다. Layer 2 업데이트 흐름이 단계별로 명시되어 있어 시뮬레이션 조건의 비대칭 적용 위험을 줄인다. 각 참여자 프로파일이 SOUL=A와 SOUL=B를 모두 포함하여 단일 참여자의 위치 편향이 결과 전체에 영향을 미치지 않는다.

### Phoenix

모든 자극은 persisted BTD-A 설계에서 직접 추출되었다. 재구성 없음. 내부 레이블(SOUL/Baseline/ASK/LIVE_VERIFY)은 진행자 랜덤화 시트 및 내부 데이터 스키마에만 기록된다. S6 스타일 누출은 설계 단계에서 measurement target으로 승인된 사항이며 이번 패키지에서 제거하지 않았다. 응답 폼의 6개 차원이 composite score 없이 독립 기록된다. BQ1-BQ8 교차 질문은 조건 수준 비교 근거로 사용되지 않고 행동 수준 맥락으로만 기능한다.

### Originality

소개문이 "정답은 없다"를 명시한다. Forced Choice에 "둘 다 받고 싶지 않음" 옵션이 있어 부정적 결과가 표현될 수 있다. BQ1-BQ5가 SOUL 스타일과 Baseline 스타일 모두에 대한 중립적 피드백 공간을 제공한다. 관찰자 시트가 참여자 폼과 분리되어 있어 관찰자 해석이 응답 데이터를 오염시키지 않는다.

---

## P. Governance

| 항목 | 상태 |
|---|---|
| Candidate Generated | NO |
| New Research RQ | NO |
| Architecture Changed | NO |
| New place authoring | NO |
| place_knowledge migration | NOT APPROVED / HOLD |
| Travel Grammar | NOT CONCLUDED |
| DreamTown Founder Philosophy Candidate | HOLD |
| DB / Schema / Runtime / Production | NO CHANGE |
| Participant Evidence | NONE |
| Blind MVP Test | NOT YET EXECUTED |
| BT Verdict | NOT ASSIGNED |
| Canonical Stimuli Modified | NO |

---

## Q. Current Next Action

`Conduct Facilitator Dry Run V0.1 of the approved Blind MVP Test Execution Package as NON-EVIDENTIARY process verification only, checking profile assignment, card handling, Layer 2 Round-2 conceal/reveal timing, response-form flow, observer-blinding feasibility, and facilitator script — without recruiting real participants, generating Participant Evidence, or assigning any BT verdict.`

---

*SOUL Travel Intelligence Blind MVP Test Execution Package V0.1*
*Date: 2026-09-26 / Base: ef9e301*
*Package Verdict: EP-A — CONFIRMED*
*Blind MVP Test: NOT YET EXECUTED / BT Verdict: NOT ASSIGNED*
*Canonical Stimuli: FROZEN / UNCHANGED*
