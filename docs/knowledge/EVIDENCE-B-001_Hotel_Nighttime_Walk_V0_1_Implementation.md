# EVIDENCE-B-001 — Hotel-to-Starlight Nighttime Walk SOUL V0.1 구현 Evidence

생성일: 2026-10-24
상태: LOCAL_IMPL_COMPLETE — 로컬 구현 및 테스트 완료 / PR/Merge/Deploy 미승인
근거: Founder Approval — Phase B Local Implementation V0.1 (2026-10-24)

---

## 실제 변경 파일 및 함수

| 파일 | 위치 | 변경 내용 | 분류 |
|------|------|-----------|------|
| `services/quoteContextService.js` | 줄 15 `MVP_HOTELS` | 신라스테이 여수 alias 2개 추가 | EXTEND |
| `services/soyeowoolService.js` | 줄 1543 `_HOTEL_CODE_TO_KO` | `shinra_stay_yeosu: '신라스테이 여수'` 추가 | EXTEND |
| `services/soyeowoolService.js` | 줄 ~1620 신규 | `_isNighttimeWalkQuery` 함수 추가 | NEW |
| `services/soyeowoolService.js` | 줄 ~1637 신규 | `_buildNighttimeWalkPayload` 함수 추가 | NEW |
| `services/soyeowoolService.js` | nonDiscovery 블록 내 | `_isNighttimeWalkQuery` 게이트 삽입 (줄 ~2921) | NEW |

DB / Schema 변경: 없음
기존 8개 장소 코드 변경: 없음

---

## 실제 생성 응답

### NW-01: 대표 질문 (호텔명 있음 — 신라스테이)

**입력:** "신라스테이 여수에 묵는데 차를 호텔에 두고 여수 밤바다를 즐길 수 있을까요?"

**실제 응답:**
```
신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요.
이순신광장 해안을 따라 종포해양공원, 하멜등대까지
천천히 걸으며 여수 밤바다를 즐길 수 있어요.
종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.
돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
```

### NW-02: 호텔명 없는 질문 (D1: 호텔명 불필요)

**입력:** "밤바다를 즐길 수 있을까요?"

**실제 응답:**
```
이순신광장 해안을 따라 종포해양공원, 하멜등대까지
천천히 걸으며 여수 밤바다를 즐길 수 있어요.
종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.
돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
```

### NW-REG-05: 차량 접근 질문 → `_isNighttimeWalkQuery` 미발동

**입력:** "차로 가기 좋은 밤바다 코스"

**결과:** `_isNighttimeWalkQuery = false` → 기존 경로 유지 (nighttime walk 미발동)

---

## 테스트 결과 종합

### 호텔 인식 독립 테스트 (HA)

| ID | 입력 | 결과 | PASS |
|----|------|------|------|
| HA-01 | "신라스테이 여수에 묵는데" → `shinra_stay_yeosu` | PASS | ✓ |
| HA-02 | "신라스테이여수 체크인" → `shinra_stay_yeosu` | PASS | ✓ |
| HA-03 | "라마다 호텔 예약" → `ramada` (기존 유지) | PASS | ✓ |
| HA-04 | "소노캄 여수에 묵는데" → `null` (D3: 미등록) | PASS | ✓ |
| HA-05 | `isQuotable(shinra_stay_yeosu)` → `false` | PASS | ✓ |

**HA: 5/5 PASS**

### 신규 기능 테스트 (NW)

| ID | 입력 | `_isNighttimeWalkQuery` | PASS |
|----|------|------------------------|------|
| NW-01 | "신라스테이...밤바다를 즐길 수 있을까요?" | true | ✓ |
| NW-02 | "밤바다를 즐길 수 있을까요?" | true | ✓ |
| NW-03 | "밤바다 산책할 수 있어요?" | true | ✓ |
| NW-04 | "소노캄에 묵는데 밤바다를 즐길 수 있을까요?" | true (범용 응답) | ✓ |
| NW-05 | "밤바다 걷고 싶어요" | true | ✓ |

**NW 응답 검증:**
- NW-01: 26분 + 이순신광장 + 하멜등대 ✓
- NW-02: 이순신광장 + 하멜등대 O / 26분 X (호텔 미인식) ✓
- NW-03: 이순신광장 + 종포해양공원 ✓
- NW-04: 이순신광장 O / 26분 X (소노캄 미등록) ✓

**NW: 5/5 PASS**

### 미검증 항목 미포함 검증 (NW-SAFE)

| ID | 검증 항목 | 결과 |
|----|-----------|------|
| NW-SAFE-01 | "1.2km" (UNVERIFIED) | 미포함 ✓ |
| NW-SAFE-02 | "안전", "위험" (야간 안전성) | 미포함 ✓ |
| NW-SAFE-03 | "주차 가능", "주차요금" | 미포함 ✓ |
| NW-SAFE-04 | "별빛혜택", "노래방", "오락실" | 미포함 ✓ |
| NW-SAFE-05 | 역방향 복귀 수치 | 미포함 ✓ |

**NW-SAFE: 5/5 PASS**

### 회귀 테스트 (NW-REG)

| ID | 입력 | `_isNighttimeWalkQuery` | PASS |
|----|------|------------------------|------|
| NW-REG-01 | "라마다 3명 10월 26일" | false ✓ | ✓ |
| NW-REG-02 | "케이블카 타고 싶어" | false ✓ | ✓ |
| NW-REG-03 | "밤바다가 예뻐요?" | false ✓ | ✓ |
| NW-REG-04 | "밤바다 야경 추천해줘" | false ✓ | ✓ |
| NW-REG-05 | "차로 가기 좋은 밤바다 코스" | false ✓ (isCarAccess) | ✓ |
| NW-REG-06 | "이순신광장 어때요?" | false ✓ | ✓ |
| NW-REG-07 | "하멜등대 가고 싶어" | false ✓ | ✓ |

**NW-REG: 7/7 PASS**

### 전체 soul.test.js 회귀 (NW-REG-FULL)

```
Tests: 487 passed, 1 failed (R20 PRE-EXISTING)
Test Suites: 21 passed, 1 failed (soul-broad-place-r1-r24.test.js)
Time: 25.123s
```

**R20 PRE-EXISTING FAIL (UNRESOLVED):**
- dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY
- Phase B 변경과 무관한 기존 미해결 항목
- MEMORY.md에 기록됨

**신규 회귀: 0건**
**NW-REG-FULL: 487/488 PASS (1 PRE-EXISTING)**

---

## 테스트 합계

| 시리즈 | 결과 |
|--------|------|
| HA (호텔 인식) | 5/5 PASS |
| NW (신규 기능) | 5/5 PASS |
| NW-SAFE (미검증 항목) | 5/5 PASS |
| NW-REG (패턴 회귀) | 7/7 PASS |
| NW-REG-FULL (전체 회귀) | 487/488 PASS (1 PRE-EXISTING) |
| **합계** | **509/510 PASS** |

---

## 기존 호텔 기능 회귀 여부

| 항목 | 상태 |
|------|------|
| `MVP_HOTELS` ramada/kenny 기존 동작 | 유지 (HA-03 PASS) |
| `isQuotable(['ramada','kenny'])` 조건 | 유지 (HA-05 PASS) |
| 신라스테이 자동 견적 발행 | 없음 (isQuotable false 확인) |
| 기존 soul 회귀 | 0건 신규 |

---

## Git 변경 상태

변경 파일 (미commit):
- `services/quoteContextService.js` (Modified)
- `services/soyeowoolService.js` (Modified)

PR 생성: 미실행
Merge: 미실행
Production Deploy: 미실행

---

## 남은 위험 및 미검증 항목

| 항목 | 상태 |
|------|------|
| SSOT-ROUTE-003 1.2km 실측 | UNVERIFIED — 응답에 미포함 (D2 반영) |
| 호텔 복귀 이동시간 | 미검증 — 응답에 미포함 |
| 야간 안전성 | 미검증 — 응답에 미포함 |
| 호텔 주차 조건 | 미검증 — 응답에 미포함 |
| 별빛혜택 | PENDING_VERIFICATION — 응답에 미포함 |
| R20 dolsan_daegyo PRE-EXISTING | UNRESOLVED (Phase B 무관) |
| PR #111 Production Deploy | NOT DEPLOYED |

---

## Last Review

2026-10-24 — Phase B V0.1 로컬 구현 완료
509/510 PASS. 신규 회귀 0건.
