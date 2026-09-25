# YEOSU Relationship Knowledge — 하멜등대 → 여수해상케이블카 V0.1

**Relationship ID:** `hamel_lighthouse → cablecar`  
**P3 place_code:** `hamel_lighthouse`  
**P4 place_code:** `cablecar`  
**생성일:** 2026-09-25  
**생성 이유:** NOF-02 — Operational Validation Simulation에서 P3→P4 Relationship Knowledge 부재 확인  
**NOF-02 출처:** `docs/constitution/candidate/CAND-OPS-003_POST_SIMULATION_VALIDATION_DECISION_V0_1.md`  
**Framework:** CAND-OPS-003 V0.2 (Candidate / Approved 2026-09-25)  
**Status:** AUTHORING COMPLETE — NOF-02 Resolution Check 대기

---

## IMPORTANT — Document Scope

이 문서는 **두 Place 사이의 Relationship Knowledge**를 저장한다.

- P3 Place Knowledge 자체를 수정하거나 재작성하지 않는다
- P4 Place Knowledge 자체를 수정하거나 재작성하지 않는다
- 기존 Conflict Register / VERIFY_REQUIRED 항목을 이 문서로 닫지 않는다
- CAND-OPS-003 V0.2 Provenance + Two-Axis Rule 적용
- DB / schema / migration / runtime / production 변경 없음

---

## Architecture Constraint

- READ-ONLY Relationship Knowledge documentation
- `place_knowledge` migration 미적용
- VERIFY_REQUIRED 항목을 추론으로 채우지 않는다
- OPERATOR_INFERENCE 사용 시: 추론 문장 + 지지 Evidence + 신뢰도 + 미해소 대안 명시 필수
- Journey / Emotional Relationship ≠ Physical Route Navigation
  - Journey 관계는 Evidence로 저장 가능
  - Navigation 사실(거리/시간/경로)은 확인 없이 확정 금지

---

## 1. Place Independence — Critical

### P3 하멜등대 (hamel_lighthouse)

- 방파제 끝의 작은 빨간 등대
- 여수 원도심 해안 걷기 Journey의 도착점
- WE Core: 도착 → 멈춤 → 비움 → 돌아봄
- Founder Role: DreamTown 여정의 감정적 클라이맥스

### P4 여수해상케이블카 (cablecar)

- 바다 위를 이동하며 여수를 보는 경험 (View + Movement)
- Founder Role: 상승의 항로 — 삶과 거리두기 → 성찰 → 희망 → 귀환

### Entity 분리 (Critical)

```
하멜등대 ≠ 하멜전시관
```

이 문서에 등장하는 Route Evidence(E6, Founder Route #001)는 **하멜전시관 → 자산탑승장** 기준이다.  
하멜등대는 하멜전시관과 **동일 권역이지만 별도 Entity**다.  
하멜등대에서 자산탑승장까지의 직접 이동 정보는 현재 **VERIFY_REQUIRED**다.

**두 Place를 병합하거나 대체 관계로 처리하지 않는다.**

---

## 2. Authoring Evidence Source

이 문서가 사용한 Evidence:

| 문서 | 내용 |
|---|---|
| `YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` | P3 World Experience |
| `YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` | P3 Founder Review |
| `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` | P4 World Experience |
| `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` | P4 Founder Review |
| `YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md` | E6 하멜전시관→자산탑승장 (CAR, 참조값) |
| `YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` | Founder Route #001 Edge Coverage |

---

## 3. R1 — Spatial Relationship

### 3-1. 권역 구조 (Evidence-based)

P3(하멜등대)와 P4(자산탑승장)는 **여수 원도심 권역과 자산 권역** 사이에 위치한다.

Founder Route #001은 다음 순서를 따른다:

```
... → 천사벽화골목 → 하멜전시관 → 자산탑승장 → 케이블카왕복 → ...
```

출처: `YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` Section 6, Founder Route #001  
Provenance: `FOUNDER_LOCAL` (Access Point 선택 기준)

P3(하멜등대)는 하멜전시관과 **동일 하멜 권역**에 위치한다.  
따라서 P3 방문 후 P4(자산탑승장) 이동은 Founder Route 상 **하멜전시관 → 자산탑승장 구간과 동일 방향**이다.

Provenance: `OPERATOR_INFERENCE`  
추론 근거: 하멜등대 WE 문서 Section 8 Working Journey에서 하멜등대는 하멜/포차 권역에 위치; Founder Route에서 해당 권역 다음이 자산탑승장  
신뢰도: LOW — 하멜등대 좌표 미확정, 동일 권역 내 정확한 위치 관계 미검증  
미해소 대안: 하멜등대가 방파제 끝에 위치하여 실제 출발 지점이 하멜전시관보다 더 멀 수 있음

### 3-2. 이동 수단 및 시간 (Evidence + VERIFY_REQUIRED)

**CAR 이동:**

E6 참조값: 하멜전시관 → 자산탑승장 = 약 10분 (CAR)  
출처: `YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md` E6  
Source Rating: ROUTE_SOURCE_DERIVED LOW (trip.com 기반, 공식 미확인)

| 항목 | 값 | Provenance | Volatility |
|---|---|---|---|
| 하멜전시관→자산탑승장 (CAR) | 약 10분 (참조값) | ROUTE_SOURCE_DERIVED | VERIFY |
| 하멜등대→자산탑승장 (CAR) | VERIFY_REQUIRED | — | VERIFY |
| 하멜등대→자산탑승장 (도보) | VERIFY_REQUIRED | — | VERIFY |
| 하멜등대→자산탑승장 (버스) | VERIFY_REQUIRED | — | VERIFY |

**SOUL 행동:** 하멜등대에서 자산탑승장까지의 구체적 이동 시간을 고정값으로 안내하지 않는다.

### 3-3. 케이블카 Access Point 선택 원칙

Founder Local Evidence:

> 케이블카 Access Point = 오동도권 → 자산탑승장 / 돌산권 → 돌산공원탑승장 / 원도심 → 양쪽 후보

하멜 권역은 **원도심 권역에 해당** → 자산탑승장과 돌산공원탑승장 모두 후보.  
Founder Route #001은 하멜 권역에서 **자산탑승장을 선택**했다.

Provenance: `FOUNDER_LOCAL`  
Status: STABLE (Access Point 원칙) — 구체적 최적 선택은 방문 시점 조건에 따라 달라짐

---

## 4. R2 — Journey Relationship

### 4-1. DreamTown Journey 내 순서 (Evidence-based)

Founder Route #001 기준:

```
P3 하멜등대 권역 방문 → P4 자산탑승장(케이블카) 탑승
```

하멜등대를 먼저 방문하고 케이블카로 이동하는 방향이 Founder가 제시한 여정 방향과 일치한다.

Provenance: `FOUNDER_LOCAL` (Route #001 방향 일치)  
Volatility: STABLE

**단, 역순(케이블카 → 하멜등대)이 불가능하다는 근거는 없다.**  
여행자 상황에 따라 순서가 달라질 수 있으며 SOUL은 상황 기반으로 판단한다.

### 4-2. P3 이후 Journey 상태

P3 하멜등대 방문 후 여행자는:

| 상태 | Provenance |
|---|---|
| 도착·멈춤·비움을 경험한 상태 | WORLD_EXPERIENCE |
| 감정적 클라이맥스를 통과한 시점 | FOUNDER_INTENT |
| Physical Journey의 끝점에 있는 상태 | WORLD_EXPERIENCE |
| 돌아가기 전 마지막 지점 | WORLD_EXPERIENCE |
| 다시 이동을 시작해야 하는 전환점 | WORLD_EXPERIENCE |

P3에서 P4로의 이동은 **Walking Journey의 종료 → 차량·시설 이동으로의 전환**을 포함한다.

Provenance: `OPERATOR_INFERENCE`  
근거: WE 문서에서 P3는 도보 Journey의 끝이고 P4는 차량 또는 별도 이동으로 접근하는 시설  
신뢰도: MEDIUM — Route 자체는 미검증, 이동 모드 전환 구조는 Evidence 지지됨

---

## 5. R3 — Emotional / Experience Relationship

### 5-1. 두 Place의 감정 역할 비교

| Layer | P3 하멜등대 | P4 여수해상케이블카 |
|---|---|---|
| World Experience | 도착·멈춤·비움 | 상승·이동·탁트임·감탄 |
| Founder Intent | 세상을 내려놓음, 자신을 느낌, 혼자가 아님, 희망의 씨앗 | 삶과 거리두기, 성찰, 혼자가 아님, 살아갈 날의 희망, 삶으로 돌아감 |
| DreamTown Role | 감정적 클라이맥스, 슬픔의 끝 → 회복의 시작 | 전환 경험, 상승/희망/확장 |

Provenance: `WORLD_EXPERIENCE` / `FOUNDER_INTENT` / `DREAMTOWN`

### 5-2. 반복 Founder Themes (P3↔P4 공유)

두 Place에서 독립적으로 확인된 반복 Founder 철학:

| Theme | P3 | P4 | Status |
|---|---|---|---|
| 혼자가 아님 | ✓ | ✓ | REPEATED_FOUNDER_EVIDENCE |
| 작은 희망 | ✓ | ✓ | REPEATED_FOUNDER_EVIDENCE |
| 다시 나아감 | ✓ | ✓ | REPEATED_FOUNDER_EVIDENCE |
| 현실로 돌아감 | ✓ | ✓ | REPEATED_FOUNDER_EVIDENCE |
| 변화는 거창할 필요 없음 | 내포 | 명시 | REPEATED_FOUNDER_EVIDENCE |

출처: `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` Section 12  
Provenance: `FOUNDER_INTENT_SYNTHESIS`  
Status: REPEATED_FOUNDER_PHILOSOPHY_EVIDENCE — Manifesto/SSOT 승격 금지

### 5-3. P3→P4 감정 연속 가능성

Evidence에서 관찰되는 감정 흐름 가설:

```
P3: 멈춤 → 내려놓음 → 자신을 느낌
      ↓
(이동)
      ↓
P4: 상승 → 삶을 바라봄 → 성찰 → 혼자가 아님 → 희망 → 삶으로 돌아감
```

이 흐름은 두 Place가 각각 독립적으로 제공하는 경험이 감정적으로 연속될 **가능성**을 보여준다.

**중요:**
- "P3가 P4를 위한 준비 단계"라고 확정하지 않는다
- 두 Place를 하나의 통합된 경험으로 병합하지 않는다
- 각 Place의 경험은 독립적으로 성립한다

Provenance: `OPERATOR_INFERENCE`  
추론 근거: 각 Founder Review의 감정 구조 비교  
신뢰도: MEDIUM — 각 Layer 독립 생성 확인됨. 여행자 실제 경험 흐름 미검증  
미해소 대안: P3 → P4 순서 없이 P4만 방문해도 동일 경험 성립. P3가 반드시 P4의 전제가 아님.

### 5-4. 하멜등대에서 케이블카가 보인다 — Founder Authoring Evidence

Founder Authoring Observation (AUTHORING_OBSERVATION — production 적용 금지):

> "오늘 좀 지쳤으면 하멜등대까지 천천히 걸어가 봐. 꼭 뭘 해야 하는 건 아니야. 끝에 가서 바다도 보고, 케이블카 불빛도 보고 잠깐 쉬었다 와."

> "바다와 거북선대교, 밤하늘의 케이블카와 여수의 불빛 속에서 자신이 혼자가 아니라는 따뜻함을 느끼고..."

출처: `YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` Sections 7–8  
Provenance: `FOUNDER_INTENT`  
Volatility: STABLE

**Observation:** Founder 표현에서 하멜등대는 케이블카 불빛을 바라보는 장소로 묘사된다.  
이는 두 Place가 시각적으로 연결됨을 암시하지만, 실제 가시성은 `VERIFY_REQUIRED`.

**SOUL 행동:**
- 하멜등대에서 케이블카가 보인다는 사실을 확정된 정보로 안내하지 않는다
- 야간 케이블카 불빛이 하멜등대에서 보인다는 묘사는 Founder 감정 표현으로 다루되, 보장된 시각 경험으로 단정하지 않는다

---

## 6. R4 — Sequence Interpretation

### 6-1. Founder Route 기반 순서

Founder Route #001 기준 순서: **P3(하멜 권역) → P4(케이블카)**

이 순서는:
- 원도심 해안 도보 Journey 후 차량으로 자산탑승장 이동이라는 구조와 일치
- Founder가 제시한 당일 여정 흐름과 일치

Provenance: `FOUNDER_LOCAL`

### 6-2. 역순 가능성

역순(P4 → P3) 자체를 배제할 Evidence는 없다.

단, Founder 감정 Journey 관점에서:

| 순서 | 감정 흐름 |
|---|---|
| P3 → P4 | 멈춤/비움 → 상승/귀환 (Founder Route 기준 방향) |
| P4 → P3 | 상승/귀환 → 멈춤/비움 (역방향 — Experience Evidence 없음) |

P4 → P3 역순의 감정 경험에 대한 Founder/World Experience Evidence 없음.  
역순을 권하거나 배제하는 근거 모두 부재.

### 6-3. SOUL 판단 원칙

SOUL은 두 Place를 연이어 방문할지 여부를 여행자 상황 기반으로 판단한다:

- 시간 여유
- 이동 수단 (자동차 유무)
- 체력 / 동행자
- 날씨 (P3: 야외 해안 / P4: 강풍 시 운휴)
- 감정 상태

고정된 "P3+P4 조합 필수" 추천을 하지 않는다.

---

## 7. R5 — Traveler Situation Rules

### 7-1. P3→P4 연결을 고려할 상황

| 조건 | 판단 |
|---|---|
| 자동차가 있는 여행자 | P4 접근 현실적 |
| 야간/저녁 방문 | 하멜등대 야경 + 케이블카 야경 가능 시나리오 |
| 감정적 지지 중심 여정 | 두 Place 모두 Founder 철학 반복 — 연결 가치 높음 |
| 여수 당일치기 + 핵심 압축 | Founder Route #001에 포함 — 시간 계산 필요 |

### 7-2. P3→P4 연결을 피해야 할 상황

| 조건 | 판단 |
|---|---|
| 강풍/악천후 | P3(방파제 노출) + P4(강풍 운휴 가능) — 둘 다 조건부 |
| 자동차 없음 + 대중교통만 | 이동 경로 VERIFY_REQUIRED — 안내 보류 |
| 고소공포 있는 여행자 | P4 케이블카 권장 어려움 (Crystal 특히) |
| 시간 매우 부족 | 두 Place 연결 대신 하나 선택 권장 |
| P4 당일 운휴 | LIVE_CHECK 필수 — 사전 확인 권장 |

### 7-3. 날씨 조건

| 날씨 | P3 영향 | P4 영향 |
|---|---|---|
| 비 | 방파제 야외 — poor | 운행 유지 가능하나 시야 제한 |
| 강풍 | 방파제 위험 | 운휴 가능 (LIVE_CHECK) |
| 맑은 날 | 최적 | 최적 (시야 선명) |
| 야간 맑음 | 불빛 + 낭만 | 야경 경험 가능 |

Provenance: `OPERATOR_INFERENCE` (날씨 조합 분석)  
P3 날씨 기반: `YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` weather_notes  
P4 날씨 기반: `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` Section 15 CONFLICT-G 참조

---

## 8. R6 — Movement Boundary

### 8-1. 확인된 이동 사실

| 항목 | 값 | Provenance | Volatility |
|---|---|---|---|
| 하멜전시관→자산탑승장 (CAR) | 약 10분 (참조값) | ROUTE_SOURCE_DERIVED LOW | VERIFY |
| P4 접근 기준 Station | 자산탑승장 (하멜 권역 기준) | FOUNDER_LOCAL | STABLE |
| Founder Route 이동 수단 | CAR (개인 자유여행 기준) | FOUNDER_LOCAL | STABLE |
| P3 출발 지점 특성 | 방파제 끝 — 되돌아 나와야 함 | WORLD_EXPERIENCE | STABLE |

### 8-2. VERIFY_REQUIRED 이동 정보

| 항목 | 이유 |
|---|---|
| 하멜등대→자산탑승장 도보 시간 및 경로 | 공식 확인 없음 |
| 하멜등대→자산탑승장 도보 거리 | 공식 확인 없음 |
| 하멜등대→자산탑승장 (CAR) 정확한 시간 | E6는 하멜전시관 기준 — 하멜등대는 별도 확인 필요 |
| 버스로 P3→P4 이동 가능 여부 및 경로 | 검증 없음 |
| 택시 소요시간 | 검증 없음 |
| 도보 경로상 계단/경사 | 검증 없음 |
| Barrier-free 접근 여부 | 검증 없음 |
| P3 방파제에서 출발 지점까지 되돌아오는 도보 시간 | 검증 없음 |

### 8-3. Operator Inference — 이동 구조

**추론:** P3(하멜등대)는 방파제 끝에 위치하여, 자동차로 이동하려면 방파제를 걸어 되돌아온 후 차량에 탑승해야 한다.  
이로 인해 하멜전시관→자산탑승장 E6 참조값(10분)에 추가 시간이 소요될 수 있다.

Provenance: `OPERATOR_INFERENCE`  
지지 Evidence: P3 WE 문서 Section 3 (걷기→등대→방파제→도착→다시 돌아감 구조)  
신뢰도: LOW — 실제 방파제 길이 및 출발 지점까지 소요 시간 미확인  
미해소 대안: 방파제 입구에서 차량 대기 가능 여부 불명

---

## 9. SOUL Utility

### 9-1. SOUL이 Evidence로 말할 수 있는 것

| 내용 | Provenance |
|---|---|
| 하멜등대에서 케이블카까지 연결하는 여정이 가능하다 | FOUNDER_LOCAL (Founder Route #001) |
| 두 장소 모두 '혼자가 아니라는 감각'과 '작은 희망'이라는 공통 Founder 철학을 담고 있다 | FOUNDER_INTENT_SYNTHESIS |
| 하멜 권역에서 케이블카를 탄다면 자산탑승장 쪽이 Founder가 선택한 방향이다 | FOUNDER_LOCAL |
| 날씨와 이동 수단에 따라 두 장소 연결 여부를 판단해야 한다 | OPERATOR_INFERENCE |
| 두 장소를 이어 방문할 때 시간과 체력 여유를 고려해야 한다 | OPERATOR_INFERENCE |

### 9-2. SOUL이 말해서는 안 되는 것

| 금지 내용 | 이유 |
|---|---|
| "하멜등대에서 자산탑승장까지 도보로 N분 걸려요" | 도보 시간 VERIFY_REQUIRED |
| "하멜등대에서 케이블카까지 차로 10분이에요" | E6는 하멜전시관 기준, 하멜등대 미확인 |
| "하멜등대에서 케이블카가 잘 보여요" | 가시성 VERIFY_REQUIRED |
| "하멜등대에서 케이블카로 가는 버스가 있어요" | 버스 경로 VERIFY_REQUIRED |
| "두 장소를 함께 가면 꼭 이런 감정을 느껴요" | 개인 경험은 다를 수 있음 — 철학을 설교하지 않음 |
| "하멜등대를 먼저 가야 케이블카가 더 좋아요" | 순서 효과 미검증 |
| "케이블카 오늘 운영해요" | LIVE_CHECK 필수 |

### 9-3. SOUL Composition 예시 (AUTHORING OBSERVATION — production 적용 금지)

이 예시는 SOUL이 Evidence 기반으로 조합할 수 있는 방향을 보여주며, production template 아님.

> 예시: "시간이 있으면 하멜등대 다녀온 다음에 케이블카도 올라가 봐요. 하멜등대는 걸어서 끝까지 가서 잠깐 바다 보고 쉬다 오는 거고, 케이블카는 차로 이동해서 타야 해요. 두 군데 다 여수가 주는 뭔가 특별한 느낌이 있는 곳이에요."

Provenance: `AUTHORING_OBSERVATION`  
Status: NOT FOR PRODUCTION USE

---

## 10. VERIFY_REQUIRED 전체 목록 (이 Relationship 기준)

| 항목 | 현재 값 |
|---|---|
| 하멜등대 → 자산탑승장 도보 경로 및 시간 | 미확인 |
| 하멜등대 → 자산탑승장 (CAR) 시간 | 미확인 (E6는 하멜전시관 기준) |
| 하멜등대 → 자산탑승장 (버스) 가능 여부 및 경로 | 미확인 |
| 하멜등대에서 케이블카 시각적 가시성 | 미확인 |
| 방파제에서 차량 출발 지점까지 도보 시간 | 미확인 |
| 두 Place 연결 여행 시 현실적 총 소요 시간 | 미확인 |
| 대중교통으로 P3→P4 이동 옵션 | 미확인 |
| 돌산공원탑승장(P4 반대편) → P3 역방향 도보 가능성 | 미확인 |

---

## 11. NOF-03 Carry-Forward

NOF-03: P3 접근 방식 VERIFY_REQUIRED 미명시

이 Relationship Knowledge 문서에서도 동일 원칙을 적용한다:

- P3 하멜등대 자체 접근 방식 (휠체어/유모차)은 CONFLICT-A OPEN
- P3 야간 통제 여부는 VERIFY_REQUIRED
- P4 케이블카 접근성(wheelchair boarding 등)은 VERIFY_REQUIRED

SOUL은 접근성 관련 안내를 P3→P4 Relationship 컨텍스트에서도 확정하지 않는다.

---

## 12. Provenance Summary

| 영역 | Provenance Type | Volatility |
|---|---|---|
| P4 Access Point 원칙 (자산탑승장 선택) | FOUNDER_LOCAL | STABLE |
| P3→P4 Founder Route 순서 | FOUNDER_LOCAL | STABLE |
| E6 이동 시간 (하멜전시관 기준) | ROUTE_SOURCE_DERIVED LOW | VERIFY |
| P3 감정 구조 (도착/멈춤/비움) | WORLD_EXPERIENCE | STABLE |
| P4 감정 구조 (상승/성찰/희망) | FOUNDER_INTENT_SYNTHESIS | STABLE |
| 반복 Founder Themes (5개) | FOUNDER_INTENT_SYNTHESIS | STABLE |
| 감정 연속 가능성 | OPERATOR_INFERENCE | STABLE |
| P3 방파제 출발 구조 | WORLD_EXPERIENCE | STABLE |
| 날씨 조건 조합 | OPERATOR_INFERENCE | STABLE |
| 케이블카 가시성 | VERIFY_REQUIRED | VERIFY |
| 모든 도보/버스 이동 정보 | VERIFY_REQUIRED | VERIFY |
| 케이블카 당일 운행 여부 | LIVE_CHECK | LIVE |

---

## 13. NOF-02 Resolution Check

NOF-02: P3→P4 Route / Relationship Knowledge 부재

해소 조건 5가지 확인:

**A. SOUL이 P3/P4 관계를 설명할 수 있는 Knowledge가 작성되었는가?**

✓ YES — 이 문서에서 Journey Relationship, Emotional Relationship, Sequence, Situation Rules 모두 작성됨.

**B. 없는 Route Fact는 VERIFY_REQUIRED로 남아 있는가?**

✓ YES — 도보 시간, 도보 경로, 버스 옵션, 케이블카 가시성, 정확한 차량 시간 전부 VERIFY_REQUIRED로 명시됨.

**C. Journey Relationship과 Navigation Fact를 분리하여 작성했는가?**

✓ YES — R2/R3(Journey/Emotional)와 R6(Movement)를 분리. Movement는 VERIFY_REQUIRED 중심으로 작성.

**D. Founder/DreamTown 의미가 Fact로 승격되지 않았는가?**

✓ YES — Founder Intent, Founder Intent Synthesis, DreamTown Layer 모두 Original Provenance 유지. Official Fact 승격 없음.

**E. SOUL이 SCN-06 유형 질문("하멜등대 다음에 케이블카도 갈 수 있어?")에 hallucination 없이 답할 수 있는가?**

✓ YES — SOUL은 이제 다음을 Evidence 기반으로 말할 수 있다:
- 두 장소 연결 여정의 Founder Route 근거
- 자산탑승장이 하멜 권역에서 자연스러운 Access Point임
- 이동 수단(차량 권장)과 VERIFY_REQUIRED 항목 안내
- 두 Place 공통 Founder 철학 연결
- LIVE_CHECK 항목(케이블카 운행 여부) 사전 확인 권장

**NOF-02 AUTHORING GAP = RESOLVED** (조건 A~E 모두 충족)

---

## 14. Current Next Action — Relationship Knowledge

이 문서 완료 후 선택지:

**Case A: P3→P4 Physical Route Verification Decision**

실제 도보 경로, 버스 경로, 정확한 차량 이동 시간 등 Navigation Fact 검증.  
조건: Founder 또는 현지 운영 측 직접 확인 가능 시.  
우선순위: LOW (SOUL은 VERIFY_REQUIRED 안내로 현재 운영 가능)

**Case B: 다음 Place Knowledge 저장 (QUEUED 목록)**

오동도(odongdo), 향일암(hyangiram), 자산공원(jaisan_park) 등 QUEUED Place 순차 처리.  
조건: P3/P4 Relationship Knowledge 완료 후 즉시 진행 가능.  
우선순위: MEDIUM

**Case C: NOF-03 처리 — P3 Knowledge 업데이트**

P3 Knowledge에 VERIFY_REQUIRED 접근 방식 annotation 명시 추가.  
조건: P3 Knowledge 다음 수정 시 함께 처리.  
우선순위: LOW (NOF-03 BACKLOG/OBSERVE 상태 유지)

**권장 Next Action: Case B** — 다음 QUEUED Place Knowledge 진행

---

## 15. Framework Compliance Check

CAND-OPS-003 V0.2 기준:

| 규칙 | 준수 여부 |
|---|---|
| 모든 field에 Provenance Type 명시 | ✓ |
| Two-Axis (Provenance × Volatility) 분리 | ✓ |
| OPERATOR_INFERENCE 형식 (추론+Evidence+신뢰도+대안) | ✓ |
| FA-NI-01 회피 (numeric generalization 없음) | ✓ — 모든 숫자에 출처 + VERIFY |
| Journey ≠ Navigation 분리 | ✓ |
| Founder/DreamTown ≠ Official Fact | ✓ |
| Place Independence (P3 ≠ P4, 하멜등대 ≠ 하멜전시관) | ✓ |
| LIVE_CHECK 항목 고정 금지 | ✓ |
| production template 생성 금지 | ✓ |
| DB/migration 변경 없음 | ✓ |
