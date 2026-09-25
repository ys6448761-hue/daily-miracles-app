# YEOSU Relationship Knowledge — 하멜등대 → 여수해상케이블카 V0.1

**Relationship ID:** `hamel_lighthouse → cablecar`  
**P3 place_code:** `hamel_lighthouse`  
**P4 place_code:** `cablecar`  
**생성일:** 2026-09-25  
**최종 수정:** 2026-09-25 (Founder Local FL-01~04 반영 — Conditional Branch 구조로 개정)  
**생성 이유:** NOF-02 — Operational Validation Simulation에서 P3→P4 Relationship Knowledge 부재 확인  
**Framework:** CAND-OPS-003 V0.2 (Candidate / Approved 2026-09-25)  
**NOF-02 상태:** NOF-02A RESOLVED / NOF-02B OPEN (상세: Section 25)

---

## IMPORTANT — Document Scope

이 문서는 두 Place 사이의 **Conditional Relationship Knowledge**를 저장한다.

- P3/P4 Place Knowledge 자체를 수정하거나 재작성하지 않는다
- 기존 Conflict Register / VERIFY_REQUIRED 항목은 이 문서로 닫지 않는다
- CAND-OPS-003 V0.2 Provenance + Two-Axis Rule 적용
- DB / schema / migration / runtime / production 변경 없음
- Web Research 없음 — Repository Evidence First

---

## Architecture Constraint

- READ-ONLY Relationship Knowledge documentation
- `place_knowledge` migration 미적용
- VERIFY_REQUIRED 항목을 추론으로 채우지 않는다
- OPERATOR_INFERENCE: 추론 문장 + 지지 Evidence + 신뢰도 + 미해소 대안 필수
- **Experience Relationship ≠ Physical Navigation**
  - Journey / 감정 관계 = Evidence로 작성 가능
  - 거리 / 이동 시간 / 정확한 경로 = 확인 없이 확정 금지

---

## 1. Purpose

이 문서의 목적:

SOUL이 여행자로부터 "하멜등대 다음에 케이블카도 갈 수 있어?" 또는 "두 곳을 이어서 방문하려면 어떻게 해야 해?" 같은 질문을 받았을 때, hallucination 없이 Evidence 기반으로 답할 수 있도록 두 Place 사이의 관계 Knowledge를 제공한다.

이 문서는 단일 경로("A에서 B로 가는 법")를 정의하지 않는다.  
대신 여행자 상황에 따라 달라지는 **Conditional Branch 구조**를 기록한다.

---

## 2. Trigger / NOF-02

NOF-02: P3→P4 Route / Relationship Knowledge 부재

CAND-OPS-003 Operational Validation Simulation SCN-06 유형 질문에서 SOUL이 P3/P4 관계를 설명할 Knowledge가 부재함이 확인되었다.

출처: `docs/constitution/candidate/CAND-OPS-003_POST_SIMULATION_VALIDATION_DECISION_V0_1.md`

NOF-02 분리:

| ID | 내용 | 상태 |
|---|---|---|
| NOF-02A | Relationship Authoring Gap | RESOLVED (이 문서) |
| NOF-02B | Physical Route Verification | OPEN / VERIFY_REQUIRED |

상세: Section 25.

---

## 3. Entities

### P3 — 하멜등대 (hamel_lighthouse)

| 속성 | 값 |
|---|---|
| 유형 | 방파제 끝 야외 등대 |
| 위치 | 여수 원도심 해안 권역 끝점 |
| 위상 | 도보 Journey의 도착점 |
| travel_places | 미등록 |

### P4 — 여수해상케이블카 (cablecar)

| 속성 | 값 |
|---|---|
| 유형 | 이동형 전망 시설 |
| 구조 | 자산 탑승장 ↔ 돌산 탑승장 (양방향) |
| travel_places | 등록됨 |

### P4 하위 Entity (탑승장)

| 명칭 | 현재 사용 근거 | 공식 확인 상태 |
|---|---|---|
| 자산탑승장 | Travel Matrix CSV, Founder Route Evidence | PARTIALLY_VERIFIED (실용 표기 유지) |
| 돌산공원탑승장 | Travel Matrix CSV | PARTIALLY_VERIFIED (실용 표기 유지) |

**RB-01 결과 (2026-09-25) — PARTIALLY_VERIFIED:**

자산 측 브랜드명: **해야정류장** (나무위키 + oh-my-post.com 2개 소스 일치)  
돌산 측 브랜드명: **놀아정류장** (나무위키 + oh-my-post.com 2개 소스 일치)  
OFFICIAL_PRIMARY(yeosucablecar.com): SSL 오류로 직접 접근 불가 — RC-01 OPEN 유지  
공식 확인 경로: 전화 061-664-7301 또는 공식 사이트 SSL 복구 후 확인

**명칭 혼용 현황 (PARTIALLY_VERIFIED 상태):**

`자산역`, `자산정류장`, `해야정류장`, `자산공원` — 자산 측. 브랜드명은 "해야"로 수렴 (미확정)  
`돌산역`, `돌산정류장`, `놀아정류장` — 돌산 측. 브랜드명은 "놀아"로 수렴 (미확정)

**실용 표기 방침:** OFFICIAL_PRIMARY 미확인 상태에서 문서 내 실용 표기는 "자산탑승장" / "돌산공원탑승장" 유지. "해야정류장" / "놀아정류장"으로의 전환은 RC-01 완료 후.

Provenance: WORLD_EXPERIENCE (Cable Car WE Review Section 16-17)

### Entity 분리 (Critical)

```
하멜등대 ≠ 하멜전시관
```

이 문서에 등장하는 Route Evidence(E6, Founder Route #001)는 **하멜전시관 → 자산탑승장** 기준이다.  
하멜등대는 하멜전시관과 동일 권역이지만 별도 Entity이며,  
하멜등대에서 출발하는 직접 이동 정보는 **VERIFY_REQUIRED**다.

---

## 4. Existing Evidence (Repository)

이 문서 작성에 사용된 Repository Evidence:

| 문서 | 관련 섹션 | 핵심 내용 |
|---|---|---|
| `YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` | Sections 3,6,7,8 | P3 WE Experience Pattern |
| `YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` | Sections 2,3,4,6 | P3 Founder Intent |
| `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` | Sections 2,5,11,13 | P4 WE + Situation |
| `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` | Sections 3,4,12 | P4 Founder Intent |
| `YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md` | Lines 218-225, E6 | Round-trip/One-way, 단체 구조, E6 참조값 |
| `YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` | Sections 5,6, Lines 229-232 | 개인/단체 이용 방식, Matrix Coverage |

---

## 5. New Founder Local Evidence (FL-01~04)

### FL-01 — Two Boarding Options

**Founder Local:**  
하멜등대에서 여수해상케이블카 이용을 이어갈 때 최소 두 개의 탑승 선택이 존재한다.

- 자산공원 측 탑승장 (자산 side)
- 돌산 측 탑승장 (돌산 side)

**Evidence Comparison:**

| 항목 | Repository Evidence | 판정 |
|---|---|---|
| 자산/돌산 양쪽 탑승장 존재 | Travel Matrix: 자산탑승장↔돌산공원탑승장 CSV 확인 | SUPPORTED |
| 하멜 권역 → 자산 access 선택 | Founder Route Evidence Line 253: 원도심→양쪽 후보 | PARTIALLY SUPPORTED |
| 공식 명칭 | 복수 명칭 혼용 — VERIFY_REQUIRED | VERIFY_REQUIRED |

**상태: PARTIALLY SUPPORTED**

Provenance: `FOUNDER_LOCAL`  
Volatility: STABLE (두 탑승장 존재 구조) / VERIFY (공식 명칭, 운영 현황)

---

### FL-02 — One-way / Round-trip

**Founder Local:**  
케이블카 이용에는 편도와 왕복 선택이 존재하며, 실제 여행 운영 방식과 관계될 수 있다.

**Evidence Comparison:**

| 항목 | Repository Evidence | 판정 |
|---|---|---|
| 편도/왕복 선택 존재 | Cable Car WE Section 5: "왕복 또는 편도 선택" 반복 행동 | SUPPORTED |
| 왕복 탑승시간 | ~25~30분 (탑승만) UNVERIFIED_SECONDARY | PARTIALLY SUPPORTED |
| 편도 요금 vs 왕복 요금 | 비공식 참고값 존재 (CONFLICT 상태) | VERIFY_REQUIRED |
| 현재 판매/운영 조건 | LIVE_CHECK 필요 | LIVE |

**상태: SUPPORTED** (선택 존재 자체) / VERIFY (구체 조건)

Provenance: `WORLD_EXPERIENCE` (선택 반복 행동) + `FOUNDER_LOCAL`  
Volatility: STABLE (선택 구조) / LIVE (요금·운영 조건)

---

### FL-03 — Group Pattern

**Founder Local Observation:**  
단체 여행은 편도를 선택하는 경우가 있다.

이유 후보:
- 차량 운영 (승객 케이블카 이동 / 버스 별도 도로 이동 후 반대편 탑승장 합류)
- 일정 관리
- 한쪽 하차 후 반대쪽 픽업 가능한 여행 운영 구조

**Evidence Comparison:**

| 항목 | Repository Evidence | 판정 |
|---|---|---|
| 단체 편도 + Passenger≠Vehicle 구조 | Founder Route Evidence Lines 220-225: "단체 케이블카 편도 운영 시 승객은 케이블카, 버스는 별도 도로 이동 후 돌산탑승장 합류" | PARTIALLY SUPPORTED |
| 단체 편도 "선호" (Universal Rule) | 직접 Evidence 없음 | NOT SUPPORTED |
| Travel Matrix 기록 | "단체 (5인+) ONE_WAY 가능 — Passenger Route ≠ Vehicle Route 분기 가능" | PARTIALLY SUPPORTED |

**상태: PARTIALLY SUPPORTED** (운영 구조 가능성) / NOT SUPPORTED (Universal Rule로서)

**금지:** `단체 = 편도 규칙`으로 일반화하지 않는다.

Provenance: `FOUNDER_LOCAL`  
Volatility: STABLE (구조 가능성) / VERIFY (실제 운영 정책 현황)

---

### FL-04 — Individual / Private Car Pattern

**Founder Local Observation:**  
개인 여행자, 특히 자차 여행자는 왕복을 선호하는 경우가 있다.

이유 후보:
- 차량이 출발 탑승장 측에 주차되어 있음
- 차량 회수 필요
- 원래 이동 지점으로 복귀 필요

**Evidence Comparison:**

| 항목 | Repository Evidence | 판정 |
|---|---|---|
| 개인 자차 → 왕복 패턴 | Founder Route #001: ROUND_TRIP (자산→돌산→자산), Traveler: INDIVIDUAL_FREE_TRAVEL | SUPPORTED |
| 이유 (차량 동일 Route) | Travel Matrix Line 229: "개인 자유여행 (1~4인) ROUND_TRIP — Traveler + Vehicle 동일 Route" | SUPPORTED |
| "선호" (Universal Rule) | Founder Route #001은 하나의 사례 | PARTIALLY SUPPORTED |

**상태: SUPPORTED** (개인 자차 + 왕복 구조 Evidence 있음) / 주의: 단일 사례

**금지:** `개인 = 왕복 규칙`으로 일반화하지 않는다.

Provenance: `FOUNDER_LOCAL` + `WORLD_EXPERIENCE` (Cable Car WE available time → round-trip vs one-way)  
Volatility: STABLE (구조 논리)

---

## 6. Place Independence

| 원칙 | 내용 |
|---|---|
| P3 독립 | 하멜등대는 단독으로 방문 가능 |
| P4 독립 | 케이블카는 단독으로 방문 가능 |
| 병합 금지 | 두 Place를 하나의 통합 경험으로 재정의하지 않는다 |
| 하멜등대 ≠ 하멜전시관 | Route Evidence E6는 하멜전시관 기준 |

---

## 7. Experience Relationship

### 7-1. 두 Place 감정 역할 비교

| Layer | P3 하멜등대 | P4 여수해상케이블카 |
|---|---|---|
| World Experience | 도착·멈춤·비움·돌아봄 | 상승·이동·탁트임·감탄 |
| Founder Intent | 세상을 내려놓음, 자신을 느낌, 혼자가 아님, 희망의 씨앗, 다시 걸어감 | 삶과 거리두기, 성찰, 혼자가 아님, 살아갈 날의 희망, 삶으로 돌아감 |
| DreamTown | 감정적 클라이맥스, 슬픔의 끝→회복의 시작 | 전환 경험, 상승/희망/확장 |

Provenance: `WORLD_EXPERIENCE` / `FOUNDER_INTENT` / `DREAMTOWN`

### 7-2. 반복 Founder Themes (P3↔P4 공유)

두 Place에서 독립 생성된 반복 Founder 철학:

| Theme | P3 | P4 |
|---|---|---|
| 혼자가 아님 | ✓ | ✓ |
| 작은 희망 | ✓ | ✓ |
| 다시 나아감 | ✓ | ✓ |
| 현실로 돌아감 | ✓ | ✓ |
| 변화는 거창할 필요 없음 | 내포 | 명시 |

출처: `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` Section 12  
Provenance: `FOUNDER_INTENT_SYNTHESIS`  
Status: REPEATED_FOUNDER_PHILOSOPHY_EVIDENCE — Manifesto/SSOT 승격 금지

### 7-3. Experience Hypothesis 평가

> **Hypothesis:** 하멜등대의 도착·멈춤 경험과 케이블카의 상승·시야 확장 경험은 독립적인 Place Experience이지만, Journey에서는 "멈춘 뒤 다시 넓게 바라보는" 연속 경험으로 조합될 수 있다.

**판정: PARTIALLY SUPPORTED**

지지 Evidence:
- 두 Place에서 독립 확인된 반복 Founder 철학 (5개 Theme)
- Founder Intent Synthesis에서 P3의 "멈춤/비움"과 P4의 "상승/성찰"이 감정적으로 연속될 가능성 관찰됨

지지되지 않는 부분:
- "멈춘 뒤 다시 넓게 바라보는" 흐름이 실제 여행자 경험에서 연속적으로 일어난다는 직접 Evidence 없음
- P3가 P4의 감정적 전제라는 주장을 뒷받침하는 Evidence 없음
- DreamTown 의미만으로 SUPPORTED 처리하지 않는다

**SOUL 행동:** 이 연속 경험을 보장된 사실로 안내하지 않는다. 감정적 조합 가능성을 조심스럽게 표현할 수 있다.

---

## 8. Conditional Branch Structure

P3→P4 이동은 단일 경로가 아닌 여행자 상황에 따른 Branch 구조를 가진다.

```
하멜등대 방문 후
│
├─ Branch A: 자산 측 탑승장에서 탑승
│   ├─ 왕복 (자산→돌산→자산)    ← 개인 자차 주요 패턴
│   └─ 편도 (자산→돌산)         ← 조건부
│
└─ Branch B: 돌산 측 탑승장에서 탑승
    ├─ 왕복 (돌산→자산→돌산)
    └─ 편도 (돌산→자산)         ← 조건부
```

중요:
- 이 Branch 구조는 **Working Observation** 단계다
- 어느 Branch가 더 좋다는 Evidence 없음
- Traveler Situation이 Branch 선택을 결정한다

Provenance: `OPERATOR_INFERENCE`  
지지 Evidence: FL-01~04 + Repository Evidence 복수 Source  
신뢰도: MEDIUM (구조 존재) / LOW (Branch 간 비교)  
미해소 대안: 단일 탑승장에서만 탑승 가능한 제약이 있을 수 있음 (VERIFY_REQUIRED)

---

## 9. Branch A — Jasan-side

### 9-1. Entity

| 명칭 | 상태 |
|---|---|
| 자산탑승장 | Travel Matrix/Founder Route Evidence에서 사용 — 공식 명칭 VERIFY_REQUIRED |
| 자산역 / 자산정류장 / 해야정류장 / 자산공원 | 관계 VERIFY_REQUIRED |

Provenance: `WORLD_EXPERIENCE` (Cable Car WE Section 16-17)

### 9-2. Existing Evidence

| 항목 | 값 | Provenance | Volatility |
|---|---|---|---|
| 하멜 권역 기준 Access Point | 자산탑승장 선택 (Founder Route #001) | FOUNDER_LOCAL | STABLE |
| 원도심 권역 → 자산 선택 | "원도심→양쪽 후보" (Founder Local) | FOUNDER_LOCAL | STABLE |
| 하멜전시관→자산탑승장 (CAR) | 약 10분 (참조값, E6 ROUTE_SOURCE_DERIVED LOW) | ROUTE_SOURCE_DERIVED | VERIFY |

### 9-3. Movement Knowledge

```
하멜등대
  → (방파제 끝에서 입구까지 도보로 되돌아옴)
  → [이동 수단 선택]
    - CAR: 하멜전시관 권역 기준 약 10분 (VERIFY — 하멜등대 직접값 아님)
    - 도보: VERIFY_REQUIRED
    - 버스: VERIFY_REQUIRED
  → 자산탑승장
```

### 9-4. Branch A 특징

Founder Route #001 기준 이 경로가 표준 개인 자차 이용 방향.  
돌산공원을 방문 후 자산탑승장으로 되돌아오는 왕복 구조가 Founder 개인 여행 패턴과 일치.

Volatility: STABLE (구조) / VERIFY (이동 시간) / LIVE (운행 현황)

---

## 10. Branch B — Dolsan-side

### 10-1. Entity

| 명칭 | 상태 |
|---|---|
| 돌산공원탑승장 | Travel Matrix CSV에서 사용 — 공식 명칭 VERIFY_REQUIRED |
| 돌산역 / 돌산정류장 / 놀아정류장 / 돌산공원 | 관계 VERIFY_REQUIRED |

Provenance: `WORLD_EXPERIENCE` (Cable Car WE Section 16-17)

### 10-2. Existing Evidence

| 항목 | 값 | Provenance | Volatility |
|---|---|---|---|
| 돌산 측 탑승장 존재 | Travel Matrix CSV 확인 | WORLD_EXPERIENCE | STABLE |
| 하멜→돌산 접근 방법 | VERIFY_REQUIRED (도보/차량/버스 미확인) | — | VERIFY |
| 하멜등대→돌산탑승장 이동 시간 | VERIFY_REQUIRED | — | VERIFY |

### 10-3. Movement Knowledge

하멜등대 → 돌산공원탑승장 이동:

- 모든 이동 방법 VERIFY_REQUIRED (도보/버스/택시/차량)
- 이동 시간 VERIFY_REQUIRED

### 10-4. Branch B 특징

돌산 측에서 탑승하면 자산 방향으로 이동하게 되므로 원도심 권역으로 귀환하는 구조.  
단체 편도 운영(FL-03) 시 버스가 자산 측에서 돌산 측으로 이동하는 반대 방향 구조와 다름.

Branch B Evidence가 Branch A보다 현저히 적음 — 추가 검증 필요.

Volatility: STABLE (탑승장 존재) / VERIFY (이동 방법·시간) / LIVE (운행 현황)

---

## 11. One-way / Round-trip Relationship

### 11-1. 선택 구조

| 선택 | 구조 | 영향 요소 |
|---|---|---|
| 왕복 | 출발 탑승장으로 돌아옴 | 차량 위치, 다음 일정, 체류시간 |
| 편도 | 반대편 탑승장에서 하차 | 차량 이동 계획, 합류 지점, 다음 목적지 |

Provenance: `WORLD_EXPERIENCE` + `FOUNDER_LOCAL`  
Volatility: STABLE (선택 구조) / VERIFY (현재 판매 조건) / LIVE (요금)

### 11-2. 요금 (참고값 — 사용 주의)

| 유형 | 비공식 참고값 | 상태 |
|---|---|---|
| 일반 캐빈 왕복 | 약 17,000원 | UNVERIFIED_SECONDARY (블로그) |
| 크리스탈 캐빈 왕복 | 약 24,000원 | UNVERIFIED_SECONDARY (블로그) |
| 일반 캐빈 편도 | 약 14,000원 | UNVERIFIED_SECONDARY (나무위키) — CONFLICT 상태 |
| 크리스탈 캐빈 편도 | 약 19,000원 | UNVERIFIED_SECONDARY (나무위키) — CONFLICT 상태 |

**SOUL 행동:** 요금을 확정값으로 안내하지 않는다. 반드시 LIVE_CHECK 안내.

공식 확인 번호: 061-664-7301 (VERIFY_REQUIRED)

Provenance: `WORLD_EXPERIENCE` (비공식 복수 Source)  
Volatility: LIVE

### 11-3. 탑승 소요시간 (참고값)

| 항목 | 참고값 | 상태 |
|---|---|---|
| 편도 탑승시간 | 약 12~15분 | UNVERIFIED_SECONDARY (CONFLICT: 나무위키 10분 vs 블로그 12~13분) |
| 왕복 탑승시간 | 약 25~30분 (탑승만, 돌산공원 체류 별도) | UNVERIFIED_SECONDARY |

Provenance: `WORLD_EXPERIENCE`  
Volatility: VERIFY

---

## 12. Individual / Group Pattern

### 12-1. 개인 / 자차 패턴

| 패턴 | Evidence | 강도 |
|---|---|---|
| 왕복 경향 | Founder Route #001 (INDIVIDUAL_FREE_TRAVEL = ROUND_TRIP) + Travel Matrix ("Traveler + Vehicle 동일 Route") | SUPPORTED — 단일 구체 사례 |
| 이유: 차량 위치 | Travel Matrix "개인 자유여행: ROUND_TRIP — 차량이 출발 탑승장에 있음" | SUPPORTED |

**주의:** 개인 = 왕복 Universal Rule이 아니다.  
차량이 없는 개인, 다음 목적지가 돌산 권역인 경우 등 예외 가능.

Provenance: `FOUNDER_LOCAL` + Travel Matrix  
Volatility: STABLE

### 12-2. 단체 패턴

| 패턴 | Evidence | 강도 |
|---|---|---|
| 편도 가능성 | Founder Route Evidence Lines 220-225: "단체(5인+) ONE_WAY 가능 — Passenger≠Vehicle" | PARTIALLY SUPPORTED |
| 구조: 승객↔버스 분리 | "승객 케이블카 이동 / 버스 별도 도로 이동 후 돌산탑승장 합류" | PARTIALLY SUPPORTED |

**주의:** 단체 = 편도 Universal Rule이 아니다.  
이 구조는 단체 운영 전용이며 개인 자유여행에는 해당 없음.  
단체 규모 threshold(5인+)는 Quote Engine groupThreshold=5와 자동 통합 금지.

Provenance: `FOUNDER_LOCAL` + Travel Matrix  
Volatility: STABLE (구조) / VERIFY (현재 실제 운영 정책)

---

## 13. Traveler Condition Matrix

SOUL이 P3→P4 연결 여부 및 Branch 선택 판단에 사용할 수 있는 조건들:

| 조건 | 관련 판단 | Evidence 상태 |
|---|---|---|
| 이동 수단 (자차/대중교통/없음) | Branch 접근 가능성, 왕복/편도 | SUPPORTED |
| 차량 현재 위치 | 왕복/편도 선택 | SUPPORTED (Founder Route #001) |
| 개인/단체 여부 | 왕복/편도 패턴, 버스 합류 구조 | PARTIALLY SUPPORTED |
| 다음 목적지 권역 | Branch 선택 방향 | OPERATOR_INFERENCE |
| 남은 일정 시간 | 왕복/편도 + 돌산공원 체류 | SUPPORTED (Cable Car WE) |
| 케이블카 당일 운행 여부 | 전제 조건 | LIVE_CHECK |
| 날씨 / 강풍 | P3 야외 위험 / P4 운휴 가능 | OPERATOR_INFERENCE |
| 고소공포 | P4 선택 자체 | SUPPORTED (Cable Car WE) |
| 동행자 구성 | Crystal vs 일반 Cabin 선택 | SUPPORTED (Cable Car WE) |
| 체력 / 남은 에너지 | 추가 방문 판단 | VERIFY |
| 짐 보관 여부 | 이동 용이성 | VERIFY |

---

## 14. Decision Value Matrix

각 조건이 P3→P4 연결과 Branch 선택에서 갖는 Decision Value:

| 조건 | Decision Value | 이유 |
|---|---|---|
| 이동 수단 | HIGH | 접근 가능성 자체를 결정 |
| 케이블카 당일 운행 여부 | HIGH | 미운행 시 전체 플랜 변경 |
| 고소공포 여부 | HIGH | P4 선택 자체 |
| 차량 위치 | HIGH | 왕복/편도 구조 결정 |
| 남은 일정 시간 | HIGH | 왕복 가능 여부 |
| 날씨 (강풍) | HIGH | P3 위험 + P4 운휴 |
| 개인/단체 여부 | MEDIUM | 왕복/편도 패턴 참고 |
| 다음 목적지 | MEDIUM | Branch 방향 참고 |
| 동행자 구성 | MEDIUM | Cabin 선택 |
| 체력 | MEDIUM | 추가 방문 판단 |
| 요금 민감도 | MEDIUM | 편도 vs 왕복 비용 |
| 짐 보관 | LOW | 운영상 편의 |

**SOUL은 결과를 바꿀 가능성이 높은 HIGH 조건부터 확인한다.**  
모든 조건을 순차적으로 질문하지 않는다.

---

## 15. Movement / Navigation Boundary

확인된 사실과 미확인 항목을 명확히 분리한다.

### 15-1. 확인된 이동 관련 사실

| 항목 | 값 | Provenance | Volatility |
|---|---|---|---|
| 하멜전시관→자산탑승장 (CAR) 참조값 | 약 10분 | ROUTE_SOURCE_DERIVED LOW (trip.com) | VERIFY |
| 자산 Access Point 선택 원칙 | 오동도권→자산 / 돌산권→돌산 / 원도심→양쪽 후보 | FOUNDER_LOCAL | STABLE |
| 케이블카 편도 탑승 소요 | 약 12~15분 | UNVERIFIED_SECONDARY (CONFLICT) | VERIFY |
| 자산↔돌산 거리 | 약 1.5km (비공식 참고값) | UNVERIFIED_SECONDARY | VERIFY |
| P3 방파제 출발 구조 | 방파제 끝 도착 후 입구로 되돌아와야 함 | WORLD_EXPERIENCE | STABLE |

### 15-2. VERIFY_REQUIRED 전체 목록

| 항목 |
|---|
| 하멜등대→자산탑승장 도보 경로 및 시간 |
| 하멜등대→자산탑승장 (CAR) 직접 시간 (E6는 하멜전시관 기준) |
| 하멜등대→자산탑승장 버스 가능 여부 및 경로 |
| 하멜등대→돌산공원탑승장 모든 이동 방법 및 시간 |
| 방파제에서 차량 출발 지점까지 도보 추가 시간 |
| 자산탑승장 공식 명칭 |
| 돌산공원탑승장 공식 명칭 |
| 케이블카에서 하멜등대 시각적 가시성 |
| 두 Place 연결 총 소요 시간 |
| 현재 편도/왕복 판매 조건 |
| 현재 운영시간 공식 확인 |
| 단체 편도 운영 현재 정책 |

---

## 16. Provenance Matrix

| 영역 | Provenance Type |
|---|---|
| 자산/돌산 두 탑승장 존재 | WORLD_EXPERIENCE |
| 하멜 권역→자산탑승장 Access Point | FOUNDER_LOCAL |
| 개인 자차 → 왕복 패턴 | FOUNDER_LOCAL + WORLD_EXPERIENCE |
| 단체 편도 운영 구조 | FOUNDER_LOCAL |
| P3 도착/멈춤/비움 | WORLD_EXPERIENCE |
| P4 상승/성찰/희망 | FOUNDER_INTENT_SYNTHESIS |
| 5개 반복 Founder Theme | FOUNDER_INTENT_SYNTHESIS |
| 감정 연속 가능성 | OPERATOR_INFERENCE |
| Branch 구조 | OPERATOR_INFERENCE |
| E6 이동 시간 (하멜전시관 기준) | ROUTE_SOURCE_DERIVED LOW |
| 요금 참고값 | WORLD_EXPERIENCE UNVERIFIED_SECONDARY |
| 케이블카 운행 현황 | LIVE_CHECK |

---

## 17. Stable / Live / Verify Matrix

| 항목 | Volatility |
|---|---|
| 자산/돌산 양 탑승장 존재 | STABLE |
| 개인 자차 왕복 패턴 | STABLE |
| 단체 편도 운영 구조 가능성 | STABLE |
| 편도/왕복 선택 구조 | STABLE |
| P3/P4 감정 구조 | STABLE |
| Branch 구조 논리 | STABLE |
| 탑승장 공식 명칭 | VERIFY |
| E6 이동 시간 | VERIFY |
| 편도 탑승 소요시간 | VERIFY |
| 거리 (1.5km) | VERIFY |
| 현재 요금 | LIVE |
| 케이블카 당일 운행 여부 | LIVE |
| 현재 운영시간 | LIVE |
| 실시간 대기 | LIVE |

---

## 18. OPERATOR_INFERENCE

### OI-01 — P3→P4 Branch 구조

**추론:** 하멜등대 방문 후 케이블카 이용은 자산탑승장 또는 돌산공원탑승장 두 Branch 중 선택 가능하며, 선택은 여행자 상황(차량 위치, 일정, 다음 목적지)에 따라 달라진다.

지지 Evidence: FL-01 + Travel Matrix 자산↔돌산 양방향 구조 + Founder Route 원도심→양쪽 후보 원칙  
신뢰도: MEDIUM — 두 탑승장 존재 확인됨. 하멜등대에서의 실제 접근 방법 미검증.  
미해소 대안: 특정 조건에서 한쪽 탑승장만 현실적으로 접근 가능할 수 있음.

### OI-02 — 감정 연속 가능성

**추론:** P3(멈춤/비움) 경험과 P4(상승/성찰) 경험은 Journey에서 감정적으로 연속될 수 있다.

지지 Evidence: 두 Place의 반복 Founder Theme 5개 + 각 Founder Emotional Journey 구조  
신뢰도: MEDIUM — 각 Layer 독립 생성 확인됨. 여행자 실제 연속 경험 미검증.  
미해소 대안: P4만 방문해도 동일 Founder 경험 성립. P3가 P4의 전제가 아님.

### OI-03 — P3 방파제 출발 추가 시간

**추론:** 하멜등대는 방파제 끝에 위치하므로, 차량 이동을 위해 방파제 입구까지 도보로 되돌아오는 시간이 E6 참조값(하멜전시관→자산탑승장 10분)에 추가될 수 있다.

지지 Evidence: P3 WE Section 3 (걷기→등대→방파제→도착→다시 돌아가는 구조)  
신뢰도: LOW — 방파제 길이, 실제 출발 지점까지 소요시간 미확인.  
미해소 대안: 방파제 입구 근처에 차량 대기 가능한 구조인지 불명.

---

## 19. Conflict / Uncertainty

| 항목 | 내용 |
|---|---|
| 요금 CONFLICT | 편도/왕복 요금 구분 출처 간 불일치 — LIVE_CHECK 필수 |
| 탑승소요시간 CONFLICT | 나무위키 10분 vs 블로그 12~13분 — VERIFY_REQUIRED |
| 하멜등대 vs 하멜전시관 | Route Evidence는 하멜전시관 기준 — 직접 전환 불가 |
| 단체 편도 현재 운영 정책 | Founder 관찰 기반, 현재 정책 VERIFY_REQUIRED |
| 공식 탑승장 명칭 | 복수 명칭 혼용 — VERIFY_REQUIRED |
| 케이블카 강풍 운휴 기준 | 정확한 기준 미확인 — LIVE_CHECK |

---

## 20. SOUL Composition Guidance

### 20-1. SOUL이 Evidence로 말할 수 있는 것

| 내용 | Provenance |
|---|---|
| 하멜등대에서 케이블카를 이어 방문하는 여정이 가능하다 | FOUNDER_LOCAL (Route #001) |
| 자산 측과 돌산 측 두 탑승장이 있다 | WORLD_EXPERIENCE |
| 자차 여행자는 자산탑승장에서 왕복하는 경우가 많다 | FOUNDER_LOCAL |
| 케이블카 이용에는 편도와 왕복 선택이 있다 | WORLD_EXPERIENCE |
| 두 장소 모두 '혼자가 아님'과 '작은 희망'의 공통 Founder 철학을 담고 있다 | FOUNDER_INTENT_SYNTHESIS |
| 이동 수단, 차량 위치, 남은 시간에 따라 선택이 달라진다 | OPERATOR_INFERENCE |
| 케이블카 당일 운행 여부는 사전 확인이 필요하다 | LIVE_CHECK |

### 20-2. SOUL이 말해서는 안 되는 것

| 금지 내용 | 이유 |
|---|---|
| "하멜등대에서 자산탑승장까지 N분 걸려요" | 도보·차량 시간 VERIFY_REQUIRED |
| "차로 10분이면 가요" | E6는 하멜전시관 기준, 하멜등대 직접값 아님 |
| "두 장소를 함께 가면 이런 감정을 느끼게 됩니다" | 감정 경험 보장 금지 |
| "단체 여행이면 편도가 더 좋아요" | Universal Rule이 아님 |
| "개인이면 왕복을 하세요" | Universal Rule이 아님 |
| "요금은 N원이에요" | LIVE — 사전 확인 필요 |
| "오늘 운행해요" | LIVE_CHECK 필수 |
| "케이블카에서 하멜등대가 보여요" | 가시성 VERIFY_REQUIRED |

---

## 21. Good Answer Patterns

SCN-06 유형 질문에 대한 Evidence 기반 Good Answer 패턴 (AUTHORING_OBSERVATION — production 적용 금지):

**Pattern A — 이동 수단 확인 후 안내:**

> "자차로 오셨으면 하멜등대 다녀오신 다음에 차 타고 자산탑승장으로 이동해서 케이블카 탈 수 있어요. 두 곳 다 여수에서 기억에 남는 경험이에요. 오늘 운행하는지는 가기 전에 한 번 확인해 보시는 게 좋을 것 같아요."

**Pattern B — 시간 제약 있을 때:**

> "시간이 넉넉하면 충분히 두 곳 다 갈 수 있어요. 하멜등대 다녀오고 이동하면 케이블카까지 꽤 걸릴 수 있으니까, 오늘 일정 여유를 보면서 결정하면 좋을 것 같아요."

**Pattern C — 이동 수단 없을 때:**

> "대중교통으로 이동하시면 두 곳을 이어서 가는 방법은 조금 복잡할 수 있어서, 정확한 이동 방법은 따로 확인해 보시는 게 안전해요."

---

## 22. Bad Answer Patterns

**BAD-01:** "하멜등대에서 케이블카까지 차로 10분 가면 돼요."  
→ E6는 하멜전시관 기준. 하멜등대→자산탑승장 직접값 없음.

**BAD-02:** "단체 여행이시면 편도로 타고 버스가 돌산에서 기다리는 방식이 편해요."  
→ 현재 정책 VERIFY_REQUIRED. Universal Rule 아님.

**BAD-03:** "하멜등대에서 케이블카 불빛이 잘 보여요, 두 곳이 서로 연결된 느낌이에요."  
→ 가시성 VERIFY_REQUIRED. Founder 표현을 사실로 확정하지 않는다.

**BAD-04:** "두 곳을 이어서 가면 '멈춤과 상승'이라는 DreamTown 여정의 핵심을 경험하게 되어요."  
→ Founder 철학을 설교하지 않는다. DreamTown → Traveler Fact 승격 금지.

---

## 23. Verification Backlog

| 항목 | 우선순위 | 확인 방법 |
|---|---|---|
| 케이블카 공식 요금 (편도/왕복) | HIGH | 061-664-7301 또는 공식 홈페이지 |
| 케이블카 공식 운영시간 | HIGH | 위 동일 |
| 자산탑승장 공식 명칭 | MEDIUM → **PARTIALLY_VERIFIED (RB-01 2026-09-25)** | 브랜드명 "해야정류장" 2개 소스 일치. RC-01 최종 확인: 061-664-7301 |
| 돌산탑승장 공식 명칭 | MEDIUM → **PARTIALLY_VERIFIED (RB-01 2026-09-25)** | 브랜드명 "놀아정류장" 2개 소스 일치. RC-01 최종 확인: 061-664-7301 |
| 하멜등대→자산탑승장 이동 시간 | MEDIUM | 지도 앱 또는 Founder 현장 확인 |
| 단체 편도 현재 운영 정책 | MEDIUM | 케이블카 측 직접 확인 |
| 탑승 소요시간 (편도 공식) | MEDIUM | 위 동일 |
| 방파제 길이 / 출발 지점 도보 시간 | LOW | 현장 확인 |
| 케이블카에서 하멜등대 가시성 | LOW | 현장 확인 |

---

## 24. Cross-Place Pattern Observation

Founder는 다른 장소에서도 두 개 이상의 선택지가 여행자 상황에 따라 달라지는 경우가 있다고 전달했다.

이 문서에서 발견된 Working Pattern:

```
현재 장소
  → 복수 옵션 (탑승장 선택)
  → 여행자 조건 (차량/일정/그룹)
  → 선택 (왕복/편도 + Branch)
  → 다음 경험
```

**Status:** `CROSS-PLACE PATTERN — OBSERVE ONLY`

| 항목 | 상태 |
|---|---|
| 이 문서에서 관찰됨 | YES |
| 다른 장소에서 반복 확인 | UNKNOWN |
| Candidate 생성 | NO |
| Framework 변경 | NO |
| CAND-OPS-003 수정 | NO |

향후 다른 장소 Authoring에서 유사 구조가 반복되는지 관찰한다.

---

## 25. NOF-02 Resolution Status

### NOF-02A — Relationship Authoring Gap

Resolution Conditions 확인:

| 조건 | 상태 |
|---|---|
| A: Branch structure captured | ✓ — 자산/돌산 Branch, 왕복/편도 구조 기록 |
| B: Traveler conditions captured | ✓ — Condition Matrix + Decision Value Matrix |
| C: Experience vs Navigation separated | ✓ — Section 7 vs Section 15 분리 |
| D: Provenance preserved | ✓ — 모든 항목 Provenance + Volatility 명시 |
| E: SOUL can avoid single-route assumption | ✓ — Bad Answer Patterns 포함 |
| F: Hallucination guardrail exists | ✓ — Section 20-2, Section 22 |

**NOF-02A: RESOLVED**

### NOF-02B — Physical Route Verification

| 항목 | 상태 |
|---|---|
| 하멜등대→자산탑승장 정확한 이동 시간 및 경로 | OPEN / VERIFY_REQUIRED (RB-03 필요) |
| 하멜등대→돌산탑승장 이동 방법 | OPEN / VERIFY_REQUIRED |
| 공식 요금 (편도/왕복) | PARTIALLY_VERIFIED — 블로그 2개 소스. LIVE_CHECK 유지. |
| 공식 탑승장 명칭 | PARTIALLY_VERIFIED — 해야/놀아 브랜드명 2개 소스. RC-01 OPEN. |
| 편도/왕복 자유 선택 여부 | **PARTIALLY_VERIFIED (RB-02 2026-09-25)** — 제약 없음 확인 |
| 단체 편도 현재 정책 | OPEN / VERIFY_REQUIRED (단체 할인 존재하나 편도 강제 여부 미확인) |

**RC 상태:**
- RC-01 (명칭): PARTIALLY_COMPLETE — RB-01 완료, 전화 확인 필요
- RC-02 (물리적 접근): OPEN — RB-03 Field Confirmation 필요
- RC-03 (편도/왕복): PARTIALLY_COMPLETE — RB-02 완료
- RC-04, RC-05: COMPLETE

**NOF-02B: OPEN / RB-01+RB-02 COMPLETE / RB-03 PENDING**

Research Files:
- RB-01: `docs/research/YEOSU_CABLE_CAR_ENTITY_IDENTITY_OFFICIAL_RESEARCH_RB01_V0_1.md`
- RB-02: `docs/research/YEOSU_CABLE_CAR_ONE_WAY_ROUNDTRIP_RESEARCH_RB02_V0_1.md`

---

## 26. Limitations

| 한계 | 내용 |
|---|---|
| 하멜등대 좌표 미확정 | 정확한 위치 기반 이동 계산 불가 |
| Route Evidence가 하멜전시관 기준 | E6 참조값을 하멜등대에 직접 적용 불가 |
| Branch B Evidence 빈약 | 돌산 측 접근 방법 거의 없음 |
| 가시성 미확인 | 상호 조망 가능성 불확정 |
| 단체 운영 정책 현재 상태 | Founder 관찰 기반, 정책 변경 가능 |
| 감정 연속성 미검증 | 두 Place를 실제로 이어 방문한 여행자 데이터 없음 |

---

## NOF-03 Carry-Forward

NOF-03: P3 접근 방식 VERIFY_REQUIRED 미명시

- P3 하멜등대 자체 접근성(wheelchair/유모차)은 CONFLICT-A OPEN 유지
- P3 야간 통제 여부 VERIFY_REQUIRED 유지
- P4 케이블카 접근성 VERIFY_REQUIRED 유지

SOUL은 접근성 관련 안내를 P3→P4 Relationship 컨텍스트에서도 확정하지 않는다.

NOF-03 상태: **BACKLOG / OBSERVE** — P3 Knowledge 다음 수정 시 처리.
