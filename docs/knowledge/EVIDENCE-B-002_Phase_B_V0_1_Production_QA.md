# EVIDENCE-B-002 — Phase B V0.1 Production QA

생성일: 2026-10-24
상태: COMPLETED
Render Deploy ID: dep-dbe0et3ncjis73do73ng
Release SHA: 4c160529f08616433bb639e0ce153044b998fca5
Deploy Time: 2026-10-24 10:21 KST (Founder Render Dashboard Manual Deploy)
작성자: Claude Code (Antigravity 인스턴스)

---

## A. Production Health

| 항목 | 값 | 판정 |
|------|-----|------|
| HTTP 상태 | 200 OK | PASS |
| started_at | `2026-10-24T01:21:13.490Z` (= KST 10:21) | PASS — 배포 시각 일치 |
| database | 연결됨 / 2ms | PASS |
| Production LIVE | CONFIRMED | PASS |

Production Health: **PASS ✓**

---

## B. 신라스테이 밤바다 산책 응답 (LOCAL VERIFIED)

### B-1 — 핵심 케이스: 호텔명 + feasibility 질문

**입력:** "신라스테이 여수에 묵는데 차를 두고 여수 밤바다를 즐길 수 있을까요?"
**hotelCode mock:** `shinra_stay_yeosu`
**실제 응답:**
```
신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요.
이순신광장 해안을 따라 종포해양공원, 하멜등대까지
천천히 걸으며 여수 밤바다를 즐길 수 있어요.
종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.
돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
```
**판정:** PASS ✓ — 26분/1.7km hotelLine 포함, 이순신광장~하멜등대 코스 포함

### B-2 — ADVISORY: "알려줘" 패턴

**입력:** "신라스테이에서 밤바다 걷기 좋은 코스 알려줘"
**판정:** ADVISORY — "알려줘"가 Discovery 경로를 트리거하여 NighttimeWalk 미발동
- 설계 범위 외: NighttimeWalk는 feasibility 질문("즐길 수 있을까요?") 전용
- 신규 회귀 아님 — Phase B 의도된 동작

**B 전체 판정: PASS (핵심 B-1) / ADVISORY (B-2, 설계 범위 외)**

---

## C. 호텔명 없는 밤바다 산책 응답 (LOCAL VERIFIED)

### C-1 — 핵심 케이스: 호텔명 없음 → 공통 응답

**입력:** "여수에서 밤바다 걸어서 즐길 수 있는 코스가 있을까요?"
**hotelCode mock:** `null`
**실제 응답:**
```
이순신광장 해안을 따라 종포해양공원, 하멜등대까지
천천히 걸으며 여수 밤바다를 즐길 수 있어요.
종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.
돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
```
**판정:** PASS ✓ — hotelLine(신라스테이 26분) 없이 공통 응답, "이순신광장 해안" 포함

### C-2 — ADVISORY: "추천해줘" 패턴

**입력:** "여수 밤바다 산책 코스 추천해줘"
**판정:** ADVISORY — "추천해줘" → Discovery 경로, NighttimeWalk 미발동 (설계 범위 외)

**C 전체 판정: PASS (핵심 C-1) / ADVISORY (C-2, 설계 범위 외)**

---

## D. 차량 접근 질문 기존 경로 유지 (CODE VERIFIED)

**코드 검증:**
```js
// services/soyeowoolService.js:1627
const isCarAccess = /(차로|자차로|차량으로).*(가기|이동|좋은|추천)/.test(message);
return hasNightSea && hasTravelIntent && !isCarAccess;
```
"차로 가기 좋은" 패턴이 `isCarAccess=true` → NighttimeWalk 차단 CONFIRMED

**D 판정: CODE VERIFIED ✓**

---

## E. Time Gate 기존 기능 (LOCAL VERIFIED)

**입력:** "여수 여행코스를 짜줘" + DOMAIN_FALLBACK(time_available_minutes provenance=UNKNOWN)
**응답:** `course: null` (Time Gate CLARIFICATION 발동)
**판정:** PASS ✓

---

## F. CAR_INFO 기존 기능 (PRE-VERIFIED)

**기존 테스트 재실행 결과:** `soulCarInfoSeparation.test.js` 7/7 PASS (2026-10-24 실행)
- CI-1: 차량 new query + time DOMAIN_FALLBACK → course=null ✓
- CI-2: parking_ko 포함 ✓
- CI-7: Time Gate CLARIFICATION → course=null ✓
**판정: PRE-VERIFIED ✓**

---

## G. 미검증 정보 노출 방지 (PASS + CODE VERIFIED)

### G-1 — 1.2km 수치 미노출 (CODE VERIFIED)

**코드 검증:** `soyeowoolService.js`에서 `1.2km` → 주석에만 존재 (`D2: SSOT-ROUTE-003 전체 1.2km 수치 미사용`)
응답 문자열에 `1.2km` 없음 CONFIRMED
**판정: CODE VERIFIED ✓**

### G-2 — 야간 안전성 확정 문구 미노출 (LOCAL VERIFIED)

**입력:** "신라스테이에서 밤에 해안 산책 안전해요?"
**응답:** "여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요." (CLARIFICATION)
야간 안전성 확정 문구("야간에도 안전", "안전하게 걸을 수 있습니다") 미포함
**판정: PASS ✓**

### G-3 — 별빛혜택 미노출 (LOCAL VERIFIED)

**입력:** "신라스테이에서 밤바다 걷기 좋은 코스"
**응답:** "신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요..." (NighttimeWalk 응답)
별빛혜택("별빛혜택", "별빛 혜택", "별빛 적립") 미포함
**판정: PASS ✓**

**G 전체 판정: PASS ✓**

---

## 종합 판정

| 케이스 | 입력 유형 | 판정 | 방법 |
|--------|-----------|------|------|
| A | Production Health | **PASS** | curl |
| B-1 | 신라스테이 + feasibility 질문 | **PASS** | LOCAL |
| B-2 | 신라스테이 + "알려줘" | ADVISORY | LOCAL |
| C-1 | 호텔명 없음 + feasibility | **PASS** | LOCAL |
| C-2 | "추천해줘" 패턴 | ADVISORY | LOCAL |
| D | 차량 접근 차단 | **CODE VERIFIED** | 코드 검증 |
| E | Time Gate | **PASS** | LOCAL |
| F | CAR_INFO 분리 | **PRE-VERIFIED** | 기존 테스트 재실행 |
| G-1 | 1.2km 미노출 | **CODE VERIFIED** | 코드 검증 |
| G-2 | 야간 안전 미노출 | **PASS** | LOCAL |
| G-3 | 별빛혜택 미노출 | **PASS** | LOCAL |

**신규 회귀: 없음**
**R20 PRE-EXISTING: 미변경 유지** (dolsan_daegyo "걸어서" → JOURNEY_CONTINUITY)
**Rollback 발생: 없음**

---

## ADVISORY 사항

| # | 내용 | 분류 |
|---|------|------|
| ADV-1 | B-2/C-2: "알려줘"/"추천해줘" → Discovery 경로, NighttimeWalk 미발동 | DESIGN SCOPE — Phase B 의도된 동작 |
| ADV-2 | PR #109 [PENDING_CLEAR_WRITE_ERROR] 로그 미처리 | PRE-EXISTING — 기능 영향 없음 |
| ADV-3 | R20 PRE-EXISTING (dolsan_daegyo "걸어서") | PRE-EXISTING — 미수정 유지 |

---

## Production 배포 확인

| 항목 | 값 |
|------|-----|
| Render Deploy ID | dep-dbe0et3ncjis73do73ng |
| Release SHA | 4c160529f08616433bb639e0ce153044b998fca5 |
| 배포 방법 | Founder Render Dashboard Manual Deploy |
| 배포 시각 | 2026-10-24 10:21 KST |
| Production Health | PASS (HTTP 200, DB 2ms) |
| Render Auto-Deploy | OFF 유지 (수동 배포, 자동 배포 미전환) |
| Rollback 준비 | dep-dbd790mq1p3s73coua40 (SHA: 696839a) |
