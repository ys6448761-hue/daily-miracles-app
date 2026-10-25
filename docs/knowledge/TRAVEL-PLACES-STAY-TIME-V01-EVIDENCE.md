# TRAVEL-PLACES-STAY-TIME-V01-EVIDENCE
## DreamTown — avg_stay_minutes DB 업데이트 V0.1 Evidence

작성일: 2026-10-25  
작성자: Claude Code (Antigravity)  
근거: Founder Decision — DreamTown Stay Time DB Update Approved (2026-10-25)

---

## 1. 승인 내역

| place_code | 변경 전 | 변경 후 | 결정 상태 | Founder 근거 |
|-----------|---------|---------|---------|-----------|
| hamel_lighthouse | NULL (DATA_GAP) | **30분** | FOUNDER_APPROVED | 총 체류시간 30분 확정 |
| hyangiram | 90분 (LEGACY) | **120분** | FOUNDER_APPROVED | 여행사 기준 100분 + 개인 자유시간 20분 |
| jaisan_park | 30분 | 변경 없음 | DB VERIFIED | — |

비고:
- hyangiram 120분 내에 주차장↔사찰 도보·관람·복귀 포함
- hamel 30분 내 세부 구성(여행사 기준/+15분 등) 미검증으로 유지
- Production DB 직접 실행 아님 — 배포 별도 승인 필요

---

## 2. 변경 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `database/migrations/207_travel_places_stay_time_v01.sql` | 신규 — idempotent UPDATE + 전후 검증 DO 블록 |
| `database/seeds/001_travel_places.sql` | hamel: NULL→30 / hyangiram: 90→120 |
| `services/travelGuideService.js` | stayUnknown guard 추가 (PR #120 동일 내용 통합) |
| `tests/soul/soulTravelTimeDisplay.test.js` | T-16~T-18 (stayUnknown guard) + T-19~T-24 (post-migration 예산) 추가 |

---

## 3. Migration 안전성

### 재실행 안전성 (Idempotent)
- hamel UPDATE: `WHERE avg_stay_minutes IS NULL` — 이미 30이면 skip
- hyangiram UPDATE: `WHERE avg_stay_minutes = 90` — 이미 120이면 skip
- 트랜잭션 내 DO 블록으로 사전·사후 검증

### 롤백 방안
```sql
BEGIN;
UPDATE travel_places SET avg_stay_minutes = NULL WHERE code = 'hamel_lighthouse';
UPDATE travel_places SET avg_stay_minutes = 90   WHERE code = 'hyangiram';
COMMIT;
```
*Migration 파일 내 주석으로 보존됨*

---

## 4. fitStatus 검증 — 이동·체류시간 구분

> **정정 (2026-10-25 Guardian HOLD 반영):** 아래 §4/§5-3은 Guardian HOLD 이전 초안 기준으로 작성되었음.
> 실제 코드(`travelGuideService.js` PR #121)는 3-way fitStatus로 수정됨. 5h = `budget_exceeded`.

### stayUnknown guard + 3-way fitStatus (travelGuideService.js — PR #121 최종)
```js
const travelUnknown = travelTransitionBlocks.some(b => b.status !== 'verified');
const stayUnknown   = selectedPlaces.some(p => p.avg_stay_minutes == null);
const budgetExceeded = !travelUnknown && !stayUnknown && totalKnownMinutes > timeMinutes;

const fitStatus = (travelUnknown || stayUnknown)
  ? 'travel_time_unverified'
  : budgetExceeded
    ? 'budget_exceeded'
    : 'fits_comfortably';
```

### 코스별 fitStatus 전환 (Migration 207 적용 후 — PR #121 3-way 기준)

| 코스 | travelUnknown | stayUnknown | totalKnownMinutes | timeMinutes | fitStatus |
|------|--------------|------------|-------------------|-------------|-----------|
| 2h | FALSE (P1 VERIFIED) | FALSE (hamel=30) | 82 | 120 | **fits_comfortably** ✅ |
| 5h | FALSE (P1,P2 VERIFIED) | FALSE (hamel=30, hyangiram=120) | 307 | 300 | **budget_exceeded** ✅ |
| 8h | FALSE (P1~P4 VERIFIED) | FALSE (모든 장소 값 있음) | 436 | 480 | **fits_comfortably** ✅ |

*검증(travel/stay 완전성)과 예산 판단(budget)은 독립적으로 처리 — 3-way 분기*

---

## 5. 2h/5h/8h 시간 예산 재계산 (Post-migration)

### 5-1. 장소별 체류시간 (Migration 207 기준)

| place_code | avg_stay_minutes | 상태 |
|-----------|-----------------|------|
| cablecar | 45분 | DB VERIFIED (변경 없음) |
| hamel_lighthouse | **30분** | FOUNDER_APPROVED (null→30) |
| hyangiram | **120분** | FOUNDER_APPROVED (90→120) |
| jaisan_park | 30분 | DB VERIFIED (변경 없음) |
| lee_soon_shin_plaza | 45분 | DB VERIFIED (변경 없음) |

### 5-2. 8h 코스 시간 예산

| 구성 | 시간 | 근거 |
|------|------|------|
| 케이블카 체류 | 45분 | DB VERIFIED |
| P1 이동 | 7분 | NAVER_MEASURED (VERIFIED_TRAVEL_EDGES) |
| 하멜등대 체류 | **30분** | FOUNDER_APPROVED |
| P2 이동 | 45분 | NAVER_MEASURED |
| 향일암 체류 | **120분** | FOUNDER_APPROVED |
| P3 이동 | 45분 | NAVER_MEASURED |
| 자산공원 체류 | 30분 | DB VERIFIED |
| P4 이동 | 9분 | NAVER_MEASURED |
| 이순신광장 체류 | 45분 | DB VERIFIED |
| 식사 | 60분 | 시스템 고정값 |
| **합계** | **436분** | |
| 여유 | 480 - 436 = **44분** | |
| 판정 | **fits_comfortably** | 480분 기준 |

### 5-3. 5h 코스 시간 예산

| 구성 | 시간 |
|------|------|
| 케이블카(45) + P1(7) + 하멜(30) + P2(45) + 향일암(120) | 247분 |
| 식사 60분 | |
| **합계** | **307분** |
| 5h 슬롯 | timeMinutes = **300분** |
| 판정 | **budget_exceeded** (307 > 300) ✅ |

> **정정:** 초안은 "270~360분 범위, fits_comfortably"로 기록되었으나, PR #121 Guardian HOLD에서
> `timeMinutes=300`(5h 슬롯 하드값) 기준 307 > 300 → `budget_exceeded`로 확정됨.
> 테스트 T-25가 이 동작을 regression으로 보호 중.

### 5-4. 2h 코스 시간 예산

| 구성 | 시간 |
|------|------|
| 케이블카(45) + P1(7) + 하멜(30) | 82분 |
| 식사 없음 (2h 슬롯) | |
| **합계** | **82분** |
| 2h 슬롯 기준 | 120분 |
| 판정 | **fits_comfortably** (82 < 120) |

---

## 6. 테스트 결과

| 파일 | 신규/회귀 | PASS | FAIL |
|------|---------|------|------|
| soulTravelTimeDisplay.test.js | 신규 T-16~T-24 (9개) + 기존 T-1~T-15 (26개) | **35/35** | 0 |
| soulCoursePlanningFullDay.test.js | 회귀 | 21/21 | 0 |
| 전체 suite (soul/) | 회귀 | 201/202 | **R20 PRE-EXISTING** |

R20 PRE-EXISTING: `dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY` — 이 PR과 무관, 기존 미해결 항목

---

## 7. PR 계획

| 항목 | 내용 |
|------|------|
| 브랜치 | `feat/travel-places-stay-time-v01` |
| 베이스 | `main` |
| PR 제목 | `feat(travel): avg_stay_minutes DB update V0.1 — hamel=30, hyangiram=120 (Founder Decision 2026-10-25)` |
| 포함 | migration 207 + seed 갱신 + stayUnknown guard + T-16~T-24 |
| 주의 | Production DB 배포: 별도 Founder 승인 필요 |
| PR #120 관계 | stayUnknown guard 동일 코드 포함 — PR #120 supersede 또는 conflict resolve 필요 |

---

## 8. Migration 직전 Production DB 사전 값 (실행 전 보존 기록)

조회 시각: **2026-10-25 (KST)** — Migration 207 실행 전 라이브 조회 결과

| place_code | avg_stay_minutes | updated_at (UTC) |
|-----------|-----------------|------------------|
| hamel_lighthouse | **NULL** | 2026-10-18T20:29:27.308Z |
| hyangiram | **90** | 2026-10-01T20:54:47.219Z |

상태:
- hamel_lighthouse = NULL ✅ → Migration 207 `WHERE IS NULL` 조건 매칭 (UPDATE 1 예상)
- hyangiram = 90 ✅ → Migration 207 `WHERE = 90` 조건 매칭 (UPDATE 1 예상)

롤백 기준값 (실행 취소 시 복구 목표):
```sql
BEGIN;
UPDATE travel_places SET avg_stay_minutes = NULL WHERE code = 'hamel_lighthouse';
UPDATE travel_places SET avg_stay_minutes = 90   WHERE code = 'hyangiram';
COMMIT;
```

Migration 207 실행 상태: **EXECUTION_HOLD — Founder 승인 대기 중**

---

## 9. Production DB Identity Verification (2026-10-25)

**발단**: Founder Supabase Dashboard에서 `dreamtown-storybook-staging` 프로젝트 확인 (PAUSED / FREE / Branch: PRODUCTION 레이블)

### 조사 결과

**로컬 `.env` DATABASE_URL 연결 대상 분석** (민감정보 제외):

| 항목 | 값 |
|------|---|
| DB Provider | **RENDER_POSTGRES** |
| Host domain | `singapore-postgres.render.com` |
| Instance prefix | `dpg-` (Render 관리 PostgreSQL 패턴) |
| Region | Singapore (ap-southeast-1) |

### 판정

| 항목 | 결론 |
|------|------|
| Production DB | **Render PostgreSQL** (Render 관리형) |
| Supabase `dreamtown-storybook-staging` | **별개 프로젝트** — Production DB 아님 |
| 이전 hamel/hyangiram 라이브 조회 | **Render PostgreSQL 대상** ✅ (값 신뢰 유지) |
| hamel=NULL / hyangiram=90 | **실제 Production 값** 확인됨 |

### 영향: Migration 207 실행 경로 변경 필요

기존 권고 경로 A (Supabase SQL Editor)는 **INVALID** — Production DB가 Render PostgreSQL이므로 Supabase SQL Editor에서 실행해도 Production에 반영되지 않음.

**유효한 실행 경로 (Founder 결정 필요)**:

| 경로 | 방법 | 사전 조건 |
|------|------|---------|
| B | `scripts/run-migration-207.js` 로컬 실행 (DATABASE_URL → Render PostgreSQL) | 스크립트 신규 PR |
| C | `server.js` admin allowlist에 `"207"` 추가 → `/api/admin/run-migration` | 코드 PR 필요 |
| D | Render Dashboard → Shell 탭 → `node` 직접 실행 | Render 접근 권한 필요 |

기존 스크립트 패턴 참조: `scripts/run-migration-069-070.js` (동일 구조, DATABASE_URL → pg Pool → SQL 파일 실행)

### Render PostgreSQL 백업 상태

코드에서 Render DB 플랜 티어 직접 확인 불가.

Founder 액션 필요: Render Dashboard → `daily-miracles-app` 서비스의 연결된 PostgreSQL DB → `Backups` 탭 확인.
- Render Free tier: 일별 자동 백업 1일 보관
- Render Standard: 7일 보관

---

*작성: 2026-10-25 / Claude Code (Antigravity)*  
*Production DB 변경 아님. Migration 준비 전용.*
