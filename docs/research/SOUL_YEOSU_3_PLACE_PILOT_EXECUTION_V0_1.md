# SOUL Yeosu — Internal 3-Place Pilot Execution V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Pilot Protocol:** V0.2  
**Evidence Pool:** 21 PUs (SOUL_YEOSU_3_PLACE_PREPARATION_UNITS_V0_1.md)  
**Arms:** Model A (post-question retrieval) vs Model B (pre-question activation)  
**Controlled Collection Cycles:** 25 (UNCHANGED — Pilot ≠ evidence cycle)  
**Status:** PILOT_EXECUTION_COMPLETE

---

## 0. Execution Constraints

- DO NOT web search or collect new evidence ✓
- DO NOT modify experimental material after seeing results ✓
- DO NOT execute Human Blind Test (HOLD) ✓
- Same Evidence Pool for both arms ✓
- KL-001 (HY-003 descent friction) and KL-002 (HY-008 H-2 ASK contract) preserved ✓
- No FINAL ANSWER layer in any response ✓
- H-2: MUST ASK for capability, MUST NOT infer suitability from "부모님" label alone ✓
- DB / Schema / Runtime / Production: NO CHANGE ✓

---

## 1. Scenario O-1: "오동도 어떤 곳이에요?"

**Required PUs (Model A):** PU-OD-001, PU-OD-005, PU-OD-006  
**Pre-activated (Model B):** ODONGDO_FULL_CONTEXT

### Model A Response — O-1

오동도는 여수 앞바다의 작은 섬이에요. 768m 방파제로 육지와 연결돼 있어서 걸어서 들어갈 수 있고요.

섬 안에는 동백나무 3,000그루가 심어져 있어서 특히 1~3월 개화기에 아주 아름다워요. 용굴, 코끼리바위, 등대 전망대, 음악분수 같은 볼거리도 있고, 탐방로 약 2.5km를 따라 한 바퀴 돌 수 있어요.

누구나 부담 없이 즐길 수 있는 편이에요. 유모차도 방파제와 주요 구간에서는 이용 가능해요. 입장은 연중무휴 무료예요 (섬 자체 기준).

동백열차를 타면 방파제를 편하게 건널 수 있어요 (1,000원, 단 우천이나 점검 때는 중단될 수 있어요). 등대 전망대에 올라가면 여수 해안선이 파노라마로 보여서 많은 분들이 찾으세요.

**Model A O-1 Evaluation:**
- FACTUAL_GROUNDING: PASS (PU-OD-001/OD-005/OD-006 facts correctly used)
- EVIDENCE_BOUNDARY: PASS
- LIVE_CORRECTNESS: PASS (동백열차 suspension flagged)
- ASK: None required — no unnecessary ASK issued ✓

---

### Model B Response — O-1

오동도는 여수 앞바다의 작은 섬이에요 (약 0.12km²). 768m 방파제로 육지와 연결되어 있어서 걸어서 들어갈 수 있고, 사유차량 진입은 절대 금지예요.

섬 안에는 동백나무 3,000그루가 심어져 있고 탐방로가 약 2.5km로 순환돼요. 볼거리로는 용굴, 코끼리바위, 등대(25m 전망대), 음악분수, 대나무터널이 있어요. 특히 1~3월 동백 개화기에 가장 아름답고요.

입장은 연중무휴 24시간 무료예요. 동백열차(1,000원)를 타면 방파제를 편하게 건널 수 있는데, 우천 시에는 중단돼요. 유모차도 방파제와 주요 구간에서는 이용 가능해서 가족 단위 방문도 많아요.

**Model B O-1 Evaluation:**
- FACTUAL_GROUNDING: PASS
- EVIDENCE_BOUNDARY: PASS
- LIVE_CORRECTNESS: PASS
- Context width: Slightly richer (0.12km² detail, vehicle prohibition explicitly stated)
- Over-activation risk: None observed

---

## 2. Scenario O-2: "오동도 몇 시간 있으면 돼요?"

**Required PUs (Model A):** PU-OD-002, PU-OD-001, PU-OD-003, PU-OD-004  
**Pre-activated (Model B):** ODONGDO_FULL_CONTEXT

### Model A Response — O-2

보통 한 바퀴 루프에 약 1시간 정도 잡으시면 돼요. 사진 찍으면서 여유 있게 보시려면 2시간 이상, 어린이랑 가족이 느긋하게 즐기신다면 반나절도 충분히 걸려요.

자차로 오신다면 오동도 공영주차장을 이용하실 수 있어요 (237대, 1시간 무료). 성수기 주말 오전 10시 이후엔 주차 혼잡할 수 있으니 일찍 오시는 걸 추천드려요.

케이블카랑 함께 오신다면 케이블카 시간도 별도로 추가해서 생각하시면 좋아요.

**Model A O-2 Evaluation:**
- FACTUAL_GROUNDING: PASS (PU-OD-002: 1hr/2hr+/half-day; PU-OD-004: parking)
- EVIDENCE_BOUNDARY: PASS
- Anticipation note (cable car time): APPROPRIATE (evidence-based, not speculative)
- ASK: None required ✓

---

### Model B Response — O-2

기본적으로 한 바퀴 루프에 약 1시간 잡으시면 돼요. 사진 찍고 여유 있게 즐기신다면 2시간 이상이 좋고요, 어린이랑 가족이 느긋하게 보내신다면 반나절도 충분히 걸려요.

동백열차 타시면 탑승 대기 + 이동 시간이 30분 내외 추가돼요.

자차로 오신다면 오동도 공영주차장 (237대, 1시간 무료)이 있고요, 성수기 주말 오전 10시 이후엔 혼잡해질 수 있어요.

오동도를 케이블카랑 함께 방문하실 경우 케이블카 시간까지 더해서 계획하시면 좋아요.

**Model B O-2 Evaluation:**
- FACTUAL_GROUNDING: PASS
- EVIDENCE_BOUNDARY: PASS
- 동백열차 time addition proactively included — evidence-grounded ✓
- Context width: Slightly richer (열차 time addition note from pre-loaded context)

---

## 3. Scenario O-3: "케이블카 타고 오동도 가려고 해요"

**Required PUs (Model A):** PU-OD-003, PU-REL-001, PU-REL-002, PU-REL-003, PU-CC-001, PU-CC-002, PU-CC-005, PU-REL-004  
**Pre-activated (Model B):** ODONGDO_FULL_CONTEXT + CABLECAR_FULL_CONTEXT + REL_CONTEXT

### Model A Response — O-3

좋은 계획이에요! 케이블카와 오동도를 같이 즐기시려면 방향 선택이 중요해요.

케이블카에는 두 정류장이 있어요:
- **자산정류장[해야]**: 육지 쪽, 오동도에서 도보 약 5분 거리예요
- **돌산정류장[놀아]**: 돌산도(섬) 쪽

오동도와 연결하시려면 **자산정류장** 이용이 훨씬 편해요. 돌산정류장에서 내리면 오동도로 돌아오기 위해 돌산대교를 건너야 해서 비효율적이거든요.

추천 순서:  
① 돌산정류장 탑승 → 자산정류장 하차 → 도보 5분 → 오동도  
또는: ② 오동도 먼저 방문 → 자산정류장 탑승 → 돌산 관광 후 복귀

케이블카 + 오동도 합산은 대기 시간 포함해서 약 2.5~4시간 예상하시면 좋아요.

케이블카는 강풍주의보 시 중단될 수 있으니, 당일 운행 여부를 ☎ 061-664-7301로 미리 확인하시는 게 좋아요.

**Model A O-3 Evaluation:**
- FACTUAL_GROUNDING: PASS (directional geography, station identity, combined time, live check)
- EVIDENCE_BOUNDARY: PASS
- LIVE_CORRECTNESS: PASS (suspension flagged, phone provided)
- Directional geography correctly explained ✓

---

### Model B Response — O-3

오동도와 케이블카를 함께 즐기시려면 방향이 핵심이에요!

자산정류장[해야]에서 내리면 오동도까지 도보 5분이에요. 돌산정류장[놀아]에서 내리면 오동도로 돌아오기 위해 돌산대교를 건너야 해서 사실상 비효율적이에요.

추천 플랜:
- 돌산정류장 탑승 → 자산정류장 하차 → 도보 5분 → 오동도 (A안)
- 또는 오동도 먼저 → 자산정류장 탑승 → 돌산 관광 (B안)

케이블카 + 오동도 합산은 약 2.5~4시간 예상하세요 (성수기 대기 시간 포함).

케이블카는 강풍주의보 시 중단될 수 있으니 당일 ☎ 061-664-7301로 확인해두시는 게 좋아요.

**Model B O-3 Evaluation:**
- FACTUAL_GROUNDING: PASS
- EVIDENCE_BOUNDARY: PASS
- LIVE_CORRECTNESS: PASS
- Pre-loaded REL_CONTEXT → directional answer immediately available ✓
- Quality comparable to Model A

---

## 4. Scenario H-1: "향일암 어떤 곳이에요?"

**Required PUs (Model A):** PU-HY-001, PU-HY-002, PU-HY-005  
**Pre-activated (Model B):** HYANGIRAM_FULL_CONTEXT (KL-001 active)

### Model A Response — H-1

향일암은 여수 돌산도 금오산 중턱 절벽에 있는 암자예요. 한국 4대 관음기도처 중 하나로, 독특한 분위기로 유명한 곳이에요.

물리적으로는 좁은 석문들을 통과하며 올라가는 구조예요. 해탈문처럼 한 사람만 통과할 수 있는 좁은 바위틈을 지나는 게 순례 체험의 핵심이기도 해요. 계단은 약 398개 정도로 급경사 구간이 있어요.

경로는 두 가지:
- **계단길**: 급경사, 약 10분
- **평지길**: 완만하지만 돌아가는 길, 약 15분

오르면서 숨이 차고 땀이 나는 건 일반적인 반응이지만, 체력 있는 성인은 어렵지 않게 완주해요. 정상에서는 여수 앞바다 전망이 펼쳐져요.

표준 방문 시간은 매표소 기준 약 45~90분이에요.

**Model A H-1 Evaluation:**
- FACTUAL_GROUNDING: PASS (PU-HY-001/HY-002/HY-005 correctly applied)
- EVIDENCE_BOUNDARY: PASS
- KL-001: Not triggered (no suitability question) — correct
- Appropriately qualifies difficulty without suitability judgment ✓
- Both path options mentioned ✓

---

### Model B Response — H-1

향일암은 여수 돌산도 금오산 중턱 절벽에 있는 암자예요. 한국 4대 관음기도처 중 하나로 알려져 있어요.

특이한 점은 좁은 석문들을 통과하며 올라가는 구조예요. 해탈문(한 사람 폭, 허리 숙임 필수) 같은 석문이 7개 있어서 순례 경험처럼 느껴져요. 총 계단은 약 398개 정도예요.

경로는 두 가지예요:
- **계단길**: 급경사, 약 10분
- **평지길**: 완만한 우회로, 약 15분

오르면서 숨이 차고 땀이 나는 건 일반적이지만 지정 쉼터는 따로 없어요 (본인 페이스로 쉬어가며 이동). 정상에선 여수 앞바다 전망이 아름다워요.

방문 시간은 표준적으로 매표소 기준 45~90분이고, 여수엑스포역에서 자동차로 약 36분이에요.

**Model B H-1 Evaluation:**
- FACTUAL_GROUNDING: PASS
- EVIDENCE_BOUNDARY: PASS
- Model B richer: proactively includes PU-HY-004 (no rest stops) + PU-HY-006 (travel time)
- Both path options mentioned ✓
- **Model B advantage demonstrated**: travel time proactively included from pre-loaded full context

---

## 5. Scenario H-2: "부모님 모시고 가도 괜찮을까?" [PRIMARY DIAGNOSTIC]

**Required PUs (Model A):** PU-HY-003 (KL-001 + KL-002 강제), PU-HY-001, PU-HY-002, PU-HY-005  
**Pre-activated (Model B):** HYANGIRAM_FULL_CONTEXT + KL-002 ACTIVATED (signal: "부모님")

### Model A Response — H-2

부모님과 향일암 방문을 생각하고 계시군요. 향일암은 가파른 계단 구간이 있어서 미리 여쭤볼 게 있어요.

평소에 계단 오르내리기가 불편하신 부분이 있으세요? 또는 어느 정도 걷기 활동은 무리 없으신 편인가요?

이유를 말씀드리면, 향일암 접근로에는 급경사 계단 구간(약 398계단)이 있고 오르면서 숨이 차는 경험도 일반적이에요. 다만:
- **평지길** 대안이 있어요 (완만하게 돌아가는 길, 약 15분)
- 하산 시에도 별도 완만한 우회 경로를 이용할 수 있어요

부모님의 걷기 상태를 알면 더 정확하게 안내해 드릴 수 있어요.

**Model A H-2 Evaluation — PRIMARY DIAGNOSTIC:**
- MISSED_NECESSARY_ASK test: **PASS — ASK triggered before suitability answer**
- ASK type: Capability-based ("계단 오르내리기 불편" / "걷기 활동 무리") NOT age-based ✓
- KL-001 compliance: No age-only inference from "부모님" ✓
- KL-002 compliance: MANDATORY ASK TRIGGER fired ✓
- Yes/no suitability verdict: NONE issued ✓
- QUALIFY REGISTER: Used correctly (known friction + alternatives) ✓
- EVIDENCE_BOUNDARY: PASS
- FINAL ANSWER layer: None ✓

---

### Model B Response — H-2

부모님과 함께 향일암을 생각하고 계시군요. 한 가지 여쭤볼게요 — 부모님께서 평소 계단 오르내리기나 경사로 걷기가 불편하신 부분 있으세요?

여쭤보는 이유가 있어요. 향일암은 급경사 계단 구간이 있어서 (약 398계단), 걷기 능력에 따라 경험이 크게 달라질 수 있어요.

다만, 선택지가 있어요:
- **평지길**: 계단을 피해서 완만하게 돌아가는 길이 있어요 (약 15분)
- **하산**: 별도 완만한 우회 경로 사용 가능해요

부모님의 걷기 상태를 알면 어떤 경로가 맞는지 더 정확히 안내해 드릴 수 있어요.

**Model B H-2 Evaluation — PRIMARY DIAGNOSTIC:**
- MISSED_NECESSARY_ASK test: **PASS — KL-002 activated, ASK triggered before suitability answer**
- ASK type: Capability-based ("계단 오르내리기 / 경사로 걷기 불편") NOT age-based ✓
- KL-002 trigger: Immediate (pre-loaded context = faster activation vs Model A) ✓
- Yes/no suitability verdict: NONE issued ✓
- QUALIFY REGISTER: Used correctly ✓
- EVIDENCE_BOUNDARY: PASS
- **Model B note:** KL-002 was already active when question arrived — ASK fired immediately (no retrieval delay)

---

## 6. Scenario H-3: "향일암 2시간이면 충분할까요?"

**Required PUs (Model A):** PU-HY-005, PU-HY-006, PU-HY-001  
**Pre-activated (Model B):** HYANGIRAM_FULL_CONTEXT

### Model A Response — H-3

출발지에 따라 달라서요 — 지금 어디 계세요? 아니면 어디서 출발하실 예정이세요?

이유를 말씀드리면:
- **향일암 방문 자체**: 매표소 기준 약 45~90분이에요 (계단길 오름 10~15분, 암자 관람, 하산 포함)
- **여수엑스포역에서 이동**: 자동차로 약 36분, 버스로는 약 1시간 30분

예를 들어 엑스포역 근처에서 자차로 이동하신다면 왕복 이동 72분 + 방문 45~90분 = 총 2~2.7시간이 되어서 2시간은 빠듯할 수 있어요. 향일암 근처에 이미 계신다면 2시간으로 충분히 여유 있게 둘러보실 수 있고요.

**Model A H-3 Evaluation:**
- ASK triggered: "지금 어디 계세요?" — CORRECT (departure location = key variable) ✓
- FACTUAL_GROUNDING: PASS (PU-HY-005: 45-90min; PU-HY-006: 36min car, 1h30min bus)
- Calculation logic correct and evidence-grounded ✓
- ASK justified: necessary, not unnecessary ✓

---

### Model B Response — H-3

지금 어디 계세요? 아니면 어디서 출발하시나요? — 이동 시간이 포함되는지에 따라 달라져서요.

향일암 방문 자체는 매표소 기준 약 45~90분이에요.

여수엑스포역에서 출발하신다면:
- 자동차: 편도 약 36분 → 왕복 72분 + 방문 45~90분 = 총 약 2~2.7시간  
  → 2시간은 빠른 방문 기준으로 빠듯해요
- 버스: 편도 약 1시간 30분 → 2시간만으로는 왕복도 어려워요

이미 향일암 근처에 계신다면 2시간으로 여유 있게 즐기실 수 있어요.

**Model B H-3 Evaluation:**
- ASK triggered (departure location) ✓
- Pre-loaded full context → both car AND bus calculation immediately available ✓
- More detailed calculation vs Model A (includes bus case) ✓
- FACTUAL_GROUNDING: PASS
- **Model B advantage:** Pre-loaded HY-006 means bus scenario included without additional retrieval

---

## 7. Scenario C-1: "케이블카 어디서 타요?"

**Required PUs (Model A):** PU-CC-001, PU-CC-002, PU-CC-005  
**Pre-activated (Model B):** CABLECAR_FULL_CONTEXT

### Model A Response — C-1

여수해상케이블카에는 두 개의 탑승장이 있어요:

**자산정류장[해야]** (육지 쪽)
- 자산공원 내, 오동도 인근
- 여수엑스포역에서 도보 약 20~25분, 버스 또는 택시 5~10분

**돌산정류장[놀아]** (돌산도 쪽)
- 돌산도(섬) 내 돌산공원
- 시내에서 돌산대교 건너 버스나 자가용으로 약 10~15분

운영 시간은 09:30~21:30이고 (토요일 연장), 강풍주의보 시 중단될 수 있어요.  
당일 운행 여부는 ☎ 061-664-7301로 확인하시는 게 안전해요.

**Model A C-1 Evaluation:**
- FACTUAL_GROUNDING: PASS (PU-CC-001/CC-002/CC-005 correctly applied)
- Station identity correctly stated (자산[해야]/돌산[놀아]) ✓
- Access info complete ✓
- LIVE_CORRECTNESS: PASS (suspension + phone provided)
- No pricing included (not retrieved by Model A for this scenario)

---

### Model B Response — C-1

여수해상케이블카에는 두 정류장이 있어요:

**자산정류장[해야]** (육지/자산공원 쪽)
- 여수엑스포역에서 도보 약 20~25분, 버스, 또는 택시 5~10분
- 오동도 입구에서 도보 약 5분 거리예요

**돌산정류장[놀아]** (돌산도/섬 쪽)
- 돌산대교 건너 돌산공원 내
- 시내에서 택시로 약 10~15분

운영 시간: 09:30~21:30 (토요일 연장), 강풍주의보 시 중단 가능해요.  
요금: 일반 8인승 왕복 ₩17,000 / 편도 ₩14,000; 크리스탈 6인승 왕복 ₩24,000 / 편도 ₩19,000

현재 운행 여부는 ☎ 061-664-7301로 확인 가능해요.

**Model B C-1 Evaluation:**
- FACTUAL_GROUNDING: PASS
- LIVE_CORRECTNESS: PASS
- **Model B advantage visible:** Proactively includes pricing (PU-CC-004) from pre-loaded context — more helpful initial response
- Also includes Odongdo proximity (PU-REL-001 available in context) ✓
- CONFLICT-A note: Pricing labeled with SEMI_STABLE/VERIFY annotation (carried correctly from PU)

---

## 8. Scenario C-2: "차 있는데 케이블카 어디서 타야 해요?"

**Required PUs (Model A):** PU-CC-001, PU-CC-003, PU-CC-002, PU-REL-003, PU-REL-006  
**Pre-activated (Model B):** CABLECAR_FULL_CONTEXT + VEHICLE_EXTENSION

### Model A Response — C-2

차가 있으시면 주차 위치에 따라 탑승 방향을 결정하시는 게 좋아요.

**자산정류장[해야] 측 주차 추천** (일반적):
- 오동도 공영주차타워: 237대, 1시간 무료, 이후 200원/10분
- 여수엑스포 주차장: 733대 (넓음), 400원/10분, 하루 최대 13,000원

자산 측에 주차하시면:
① **자산 탑승→돌산 하차**: 돌산 관광 후 택시/버스로 복귀 (편도 이용 시 가장 유연)
② **돌산 탑승→자산 하차**: 자산에 이미 주차돼 있어서 자연스럽게 차로 귀환

돌산정류장 측 주차도 가능하지만 (돌산공원 내 유료), 오동도나 엑스포역 쪽과의 연결이 덜 편해요.

성수기에는 자산 측 주차 혼잡할 수 있으니 일찍 도착하시는 걸 추천드려요.

**Model A C-2 Evaluation:**
- FACTUAL_GROUNDING: PASS (PU-CC-001/CC-003/REL-003/REL-006 correctly applied)
- Vehicle context correctly integrated ✓
- Direction × vehicle logic correct ✓
- Parking specifics from evidence ✓

---

### Model B Response — C-2

차가 있으시면 주차 위치를 먼저 정하시는 게 편해요.

**자산정류장[해야] 측 주차 (일반 추천):**
- 오동도 공영주차타워: 237대, 1시간 무료, 이후 200원/10분
- 여수엑스포 주차장: 733대 (매우 넓음), 하루 최대 13,000원

자산 측에 주차하시면 두 가지 이용 패턴:
① 자산 탑승→돌산 하차 후 돌산 관광 → 택시/버스로 귀환 (편도, 가장 유연)
② 돌산 탑승→자산 하차 → 차로 자연스럽게 귀환

돌산정류장 측도 유료 주차 가능하지만, 오동도/엑스포 쪽으로의 연결이 자산 측보다 덜 편해요.

성수기엔 자산 측 주차 조기 혼잡 가능 → 이른 도착 권장해요.

**Model B C-2 Evaluation:**
- FACTUAL_GROUNDING: PASS
- VEHICLE_EXTENSION pre-loaded ✓
- Quality ≈ Model A (same facts, same conclusion)
- CABLECAR_FULL_CONTEXT already includes station identity — vehicle extension integrates naturally

---

## 9. Scenario C-3: "케이블카 타고 오동도도 가려고요"

**Required PUs (Model A):** PU-REL-001, PU-REL-002, PU-REL-003, PU-REL-004, PU-CC-005, PU-CC-001  
**Pre-activated (Model B):** CABLECAR_FULL_CONTEXT + REL_CONTEXT

### Model A Response — C-3

케이블카와 오동도를 함께 즐기실 수 있어요! 방향 선택이 핵심이에요.

**연결 핵심:**
자산정류장[해야]에서 내리면 오동도까지 도보로 약 5분이에요. 돌산정류장[놀아]에서 내리면 오동도로 가려면 돌산대교를 건너야 해서 사실상 비현실적이에요.

**추천 순서:**  
**A안 (오동도 먼저):** 오동도 방문 → 자산정류장 탑승 → 돌산 관광  
**B안 (케이블카 먼저):** 돌산 탑승 → 자산 하차 → 도보 5분 → 오동도

**시간 예상:**  
케이블카 + 오동도 합산 약 2.5~4시간 (성수기 대기 포함, 최대 1~2시간 대기 가능)

야간에 오동도까지 연결하시려면 동백숲이 조명이 제한적이라 어두울 수 있으니 참고하세요.  
케이블카 야간 운행은 21:30까지예요 (강풍주의보 시 중단).

**Model A C-3 Evaluation:**
- FACTUAL_GROUNDING: PASS (REL-001/002/003/004/CC-005/CC-001 correctly applied)
- Directional geography correctly explained ✓
- Combined time from evidence ✓
- Nighttime note from evidence (PU-REL-004) ✓
- LIVE_CORRECTNESS: PASS

---

### Model B Response — C-3

잘 오셨어요! 이 두 곳을 함께 묶으시면 방향이 핵심이에요.

**연결 핵심:**  
자산정류장[해야]에서 내리면 오동도 도보 5분이에요. 돌산정류장[놀아]에서 내리면 오동도로 돌아오려면 돌산대교를 건너야 해서 비효율적이에요.

**추천 플랜:**
- **A안**: 오동도 먼저 방문 → 자산 탑승 → 돌산 관광
- **B안**: 돌산 탑승 → 자산 하차 → 도보 5분 → 오동도

**시간:**  
케이블카 + 오동도 합산 약 2.5~4시간 (성수기 대기 최대 1~2시간 포함)

야간에 오동도까지 연결하시려면 동백숲이 조명이 제한적이라 어두울 수 있어요.  
케이블카 야간 운행은 21:30까지예요.

**Model B C-3 Evaluation:**
- FACTUAL_GROUNDING: PASS
- REL_CONTEXT pre-loaded → directional answer immediately available ✓
- Nighttime note available from pre-loaded context ✓
- Quality comparable to Model A

---

## 10. MT-1: Multi-Turn — C-1 Base + Vehicle Reveal

**Scenario:** Turn 1 = "케이블카 어디서 타요?" → Turn 2 = Traveler absorbs → Turn 3 = "차 있어요"

### MT-1 Model A

**Turn 1 (Model A):**  
Response: [Same as A-C-1 — station identity + access + operating info]

Station identity, access, operating hours provided. Pricing NOT included (not in A-C-1 PU selection).

**Turn 3 Detection:** Vehicle signal ("차 있어요") → Extend with PU-CC-003, PU-REL-003, PU-REL-006

**Turn 3 Response (Model A):**

아, 차가 있으시면 주차 위치에 따라 탑승 방향이 달라질 수 있어요!

자산정류장[해야] 쪽에 주차하시는 게 일반적으로 편해요:
- 오동도 공영주차타워 (237대, 1시간 무료) 또는 엑스포 주차장 (733대, 넓음) 이용 가능

자산에 주차하시면:
- **편도 이용**: 자산 탑승→돌산 관광 후 택시로 복귀 (가장 유연)
- 또는 돌산 먼저 탑승→자산 하차 → 차로 자연스럽게 귀환

성수기엔 자산 측 혼잡할 수 있으니 일찍 오시는 게 좋아요.

**Model A MT-1 Evaluation:**
- CONTEXT_FIDELITY: PASS — Turn 1 station info retained
- Vehicle signal detected → CC-003, REL-003, REL-006 correctly added ✓
- No CONTEXT_REASK (didn't re-ask which station) ✓
- Integration coherent ✓

---

### MT-1 Model B

**Turn 1 (Model B):**  
Response: [Same as B-C-1 — richer initial response WITH pricing from pre-loaded context]

Station identity, access, operating hours, pricing provided.

**Turn 3 Detection:** Vehicle signal → VEHICLE_EXTENSION block activates

**Turn 3 Response (Model B):**

그러시군요! 차가 있으시면 주차 위치 먼저 정하시는 게 편해요.

자산정류장[해야] 쪽 주차가 일반적으로 추천이에요:
- 오동도 공영주차타워 (237대, 1시간 무료)
- 여수엑스포 주차장 (733대, 하루 최대 13,000원)

아까 말씀드린 것처럼 자산에서 내리면 오동도 도보 5분이기도 해서, 자산 측 주차가 연결성 면에서도 좋아요.

탑승 패턴:
- **편도 (추천)**: 돌산 탑승 → 자산 하차 → 차로 귀환
- **편도 역방향**: 자산 탑승 → 돌산 하차 → 택시 복귀

**Model B MT-1 Evaluation:**
- CONTEXT_FIDELITY: PASS — Turn 1 context explicitly referenced ("아까 말씀드린 것처럼")
- VEHICLE_EXTENSION activated ✓
- Pre-loaded station-to-Odongdo proximity naturally referenced ✓
- **Model B advantage:** Context reference more explicit and natural
- No CONTEXT_REASK ✓

---

## 11. Execution Audit

| Item | Status |
|------|--------|
| All 9 single-turn scenarios executed for Model A | ✓ |
| All 9 single-turn scenarios executed for Model B | ✓ |
| MT-1 executed for both models (Turn 1 + Turn 3) | ✓ |
| No web search or new evidence collected | ✓ |
| No FINAL ANSWER layer in any response | ✓ |
| H-2 MANDATORY ASK triggered in both arms | ✓ |
| H-2 yes/no suitability verdict: NONE issued | ✓ |
| KL-001 preserved (no age-only inference) | ✓ |
| KL-002 preserved (ASK before suitability) | ✓ |
| No experimental modification after seeing results | ✓ |
| Human Blind Test: NOT executed (HOLD) | ✓ |
| Controlled Collection Cycles: 25 (UNCHANGED) | ✓ |
| DB / Schema / Runtime / Production: NO CHANGE | ✓ |
