# DREAMTOWN-TIME-BUDGET-V0_1-CANDIDATE
# DreamTown Travel Buffer V0.1 — 초안

생성일: 2026-10-25
최종 갱신: 2026-10-25 (hamel_lighthouse Founder Decision 반영 / jaisan_park DB VERIFIED)
상태: CANDIDATE (DB 반영 전 — 별도 Founder 승인 필요)
근거:
  - Founder Decision — DreamTown Travel Buffer V0.1 (2026-10-25)
  - Founder Decision — Hamel Lighthouse Stay Time V0.1 (2026-10-25)
작성자: Claude Code (Antigravity)

---

## 거버넌스

- 기존 Evidence 원본 보존: EA~EF / F-1~F-4 변경 없음
- NAVER_MEASURED와 운영 정책값 명확히 구분
- CAR GOVERNANCE_HOLD: 유지 (`_estimateTravelTime()` V0 Stub)
- Runtime / Production 변경 금지
- 이 문서는 Candidate 단계 — DB/코드 반영은 별도 Founder 승인 후

---

## 1. Travel Buffer 정책 V0.1

### Founder 확정 원칙 (2026-10-25)

| 구간 유형 | 예시 | 버퍼 |
|----------|------|------|
| 향일암 장거리 이동 — 편도 | 하멜→향일암 / 향일암→자산공원 | +10분 |
| 향일암 왕복 | 편도 2회 합산 | +20분 |
| 가까운 이동 구간 | 도심 내 이동 | +5~10분 |

### V0.1 계산 구간 규칙

| CAR 측정 시간 | 버퍼 |
|--------------|------|
| 10분 이하 | +5분 |
| 11~20분 | +10분 |
| 21분 이상 | +10분 |

> 실질 규칙: CAR ≤10분 → +5분 / CAR ≥11분 → +10분

---

## 2. P1~P4 이동시간 (Production 8h 코스 기준)

**Founder 제공 측정값 (2026-10-25)**  
Source: FOUNDER_PROVIDED / Evidence Grade: NAVER_MEASURED (Candidate)  
Runtime Connected: NO / GOVERNANCE_HOLD 유지

| Edge | From | To | CAR 측정 | Buffer (V0.1) | 운영 합계 | Source |
|------|------|----|----------|---------------|----------|--------|
| P1 | `cablecar` (자산탑승장) | `hamel_lighthouse` (하멜등대) | **2분** | +5분 | **7분** | FOUNDER_PROVIDED / NAVER_MEASURED |
| P2 | `hamel_lighthouse` (하멜등대) | `hyangiram` (향일암) | **35분** | +10분 | **45분** | FOUNDER_PROVIDED / NAVER_MEASURED |
| P3 | `hyangiram` (향일암) | `jaisan_park` (자산공원) | **35분** | +10분 | **45분** | FOUNDER_PROVIDED / NAVER_MEASURED |
| P4 | `jaisan_park` (자산공원) | `lee_soon_shin_plaza` (이순신광장) | **4분** | +5분 | **9분** | FOUNDER_PROVIDED / NAVER_MEASURED |

**합계:**
| 항목 | 값 |
|------|-----|
| CAR 측정 합계 | 2+35+35+4 = **76분** |
| 이동 예비 합계 | 5+10+10+5 = **30분** |
| 이동 운영시간 합계 | 7+45+45+9 = **106분** |

> **주의:** P1~P4는 기존 H1~H4 예측 목록을 Production 실제 코스로 재정의한 값.  
> 기존 H3 (hyangiram→lee_soon_shin_plaza) / H4 (lee_soon_shin_plaza→odongdo)는 Production과 불일치 → 대체됨.

---

## 3. 관광지별 체류시간표 V0.1 Candidate

### 3-1. DB 현재값 vs Candidate 비교

| place_code | name_ko | DB avg_stay_minutes | V0.1 Candidate | 결정 상태 | 변경 근거 |
|-----------|---------|---------------------|----------------|---------|---------|
| `cablecar` | 케이블카 | 45분 | 45분 | DB 유지 | 변경 없음 — 왕복 탑승 기준 |
| `hamel_lighthouse` | 하멜등대 | **null** (DATA_GAP) | **30분** | **FOUNDER_APPROVED** | Hamel Stay Time V0.1 결정 (2026-10-25) — DB null 유지, 코드 Candidate |
| `hyangiram` | 향일암 | 90분 | **120분** | CANDIDATE | 개인여행: 여행사기준 100분 + 여유 20분 — DB 변경 승인 별도 |
| `jaisan_park` | 자산공원 | **30분** ✅ DB VERIFIED | 30분 | DB 확인 완료 | Seed `001_travel_places.sql` 직접 확인 — 역산값 정확 |
| `lee_soon_shin_plaza` | 이순신광장 | 45분 | 45분 | DB 유지 | 변경 없음 |
| `odongdo` | 오동도 | 120분 | 120분 | DB 유지 | 변경 없음 |
| `marine_park` | 해양공원 | 75분 | 75분 | DB 유지 | 변경 없음 |
| `dolsan_daegyo` | 돌산대교 | 30분 | 30분 | DB 유지 | 변경 없음 |
| `dolsan_nightscape` | 돌산 야경 | 45분 | 45분 | DB 유지 | 변경 없음 |

> **jaisan_park 확인 완료:** `database/seeds/001_travel_places.sql` 106행 — `'outdoor', 30,` → avg_stay_minutes=**30분** DB VERIFIED  
> 역산값(30분)과 일치. 추가 확인 불필요.

> **jaisan_park 포함 조건 (코드 확인):** `services/travelGuideService.js:40-43`  
> `context.entry_point.includes('RAMADA')` 시에만 제외. DreamTown SOUL(일반) 진입에서는 **포함됨**. Production 8h 코스에 등장한 이유 확인.

### 3-2. hamel_lighthouse Founder 결정 (2026-10-25)

| 항목 | 값 | 결정 상태 |
|------|-----|---------|
| **total_stay_minutes** | **30분** | **FOUNDER_APPROVED** |
| decision_source | FOUNDER_APPROVED | 확정 |
| 여행사 기본 체류시간 | UNVERIFIED | 미확인 — 총 30분에 포함 여부 불명 |
| 개인 여유 +15분 구성 | PENDING_VALIDATION | 15분이 어디서 오는지 미확정 |
| **총 30분에 +15분 중복 가산 금지** | — | 이 문서에서 중복 미적용 |
| DB avg_stay_minutes | **null 유지** | DB 변경 승인 없음 |
| 코드 반영 상태 | PENDING | _estimateTravelTime / _buildJourneyBlocks 별도 구현 |

### 3-3. hyangiram 체류시간 세부 내역

| 항목 | 시간 | 근거 |
|------|------|------|
| 여행사 운영 기준 | 100분 | Founder 확정 (2026-10-25) |
| 개인여행 여유 | +20분 | Founder 확정 (2026-10-25) |
| **개인여행 체류 합계** | **120분** | V0.1 Candidate |
| 현재 DB avg_stay_minutes | 90분 | LEGACY |
| DB 변경 필요 여부 | YES (90→120) | Founder 별도 승인 필요 |

---

## 4. 향일암 왕복 운영시간 전체

| 구성 | 시간 | 산출 |
|------|------|------|
| 왕복 CAR 이동 | 70분 | P2(35) + P3(35) |
| 왕복 이동 예비 | 20분 | P2 buffer(10) + P3 buffer(10) |
| 향일암 체류 (V0.1 Candidate) | 120분 | 3-3 기준 |
| **향일암 왕복 총 운영시간** | **210분** | 70+20+120 |

---

## 5. 8h 코스 전체 시간 구조 (V0.1 Candidate 기준)

**코스:** 케이블카 → 하멜등대 → 향일암 → 자산공원 → 이순신광장  
**기준:** 개인여행 / CAR / Travel Buffer V0.1 적용

| 구성 | 시간 | 근거 | 상태 |
|------|------|------|------|
| 케이블카 체류 | 45분 | DB avg_stay_minutes | DB VERIFIED |
| P1 이동 운영 | 7분 | CAR 2분 + buffer 5분 | NAVER_MEASURED |
| 하멜등대 체류 | **30분** | Founder Decision 2026-10-25 | **FOUNDER_APPROVED** (DB=null) |
| P2 이동 운영 | 45분 | CAR 35분 + buffer 10분 | NAVER_MEASURED |
| 향일암 체류 | 120분 | 여행사100 + 여유20 | CANDIDATE (DB=90분) |
| P3 이동 운영 | 45분 | CAR 35분 + buffer 10분 | NAVER_MEASURED |
| 자산공원 체류 | 30분 | DB avg_stay_minutes | **DB VERIFIED** (Seed 확인) |
| P4 이동 운영 | 9분 | CAR 4분 + buffer 5분 | NAVER_MEASURED |
| 이순신광장 체류 | 45분 | DB avg_stay_minutes | DB VERIFIED |
| **합계** | **376분 (약 6h 16분)** | 식사·카페 미포함 | — |

> **계산 확정:** jaisan_park DB VERIFIED(30분) 확인 완료 → 376분은 조건부 아닌 **확정값**.  
> 480분(8h) 대비 여유 104분 — 식사(60분) + 카페(30분) + 기타 여유(14분) 수용 가능.  
> "이동시간 확인 중" 표시: 현재 GOVERNANCE_HOLD 유지 중. Travel Time UI V0.1 구현 후 숫자 전환 예정.

---

## 6. DB 반영 대기 항목 (Founder 별도 승인 필요)

| place_code | 항목 | 현재 DB | Candidate | 우선순위 | 상태 |
|-----------|------|---------|-----------|---------|------|
| `hamel_lighthouse` | avg_stay_minutes | null | **30분** | HIGH | **FOUNDER_APPROVED** — DB 반영 승인 별도 |
| `hyangiram` | avg_stay_minutes | 90분 | 120분 | MEDIUM | CANDIDATE — 승인 대기 |
| `jaisan_park` | avg_stay_minutes | 30분 | 30분 | — | DB VERIFIED — 변경 불필요 |
| P1~P4 | _buildJourneyBlocks 연결 | null (V0) | 운영값 | HIGH | 구현 계획 승인 (Travel Time UI V0.1) |

---

## 7. 열린 질문 (Founder 결정 필요)

| 항목 | 질문 | 현재 상태 |
|------|------|---------|
| jaisan_park avg_stay_minutes | DB 실제값 확인 | **RESOLVED — DB VERIFIED 30분** (Seed 직접 확인) |
| hamel_lighthouse DB 반영 | avg_stay_minutes null → 30분 변경 승인 | **결정 확인됨 (30분 FOUNDER_APPROVED)** — DB 변경 승인 별도 |
| hyangiram DB 반영 | 90→120분 변경 승인 여부 | PENDING |
| hamel_lighthouse 여행사 기본 체류시간 | 총 30분 내 여행사 기준 및 +15분 구성 | PENDING_VALIDATION |
| Buffer 정책 적용 범위 | P1~P4 외 EA~EF에도 적용 여부 | 미결 |

---

*생성: 2026-10-25 / Claude Code (Antigravity)*  
*DB / 코드 / Runtime / Production 변경 없음. Candidate 초안 전용.*  
*SSOT 승격 전 Founder Review 필수.*
