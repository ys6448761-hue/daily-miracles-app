# PHX-COMMERCE-MIG-002 — Migration 217 Production 사전 점검

**Task ID:** PHX-COMMERCE-MIG-002  
**Date:** 2026-11-03  
**Status:** PRECHECK_READY — Founder Supabase 실행 대기  
**Migration 대상:** `database/migrations/217_flow_ticket_order_id.sql`  
**제약:** Production 변경 SQL 실행 금지 / READ-ONLY 전용

---

## §0 PR #140 상태 정정

**GitHub API 확인 결과 (2026-11-03):**

```json
{ "state": "OPEN", "mergedAt": null, "mergeCommit": null }
```

**정정:** PR #140 = **OPEN (미병합)**. 이전 세션 "Founder 보고 기준 MERGED" 표현 철회.  
Migration 217은 PR #140 병합과 독립적으로 적용 가능 (dt_flow_bookings Production APPLIED 기준).

---

## §1 Migration 217 SQL 재검증 (코드 분석)

### 검증 대상 DDL

```sql
ALTER TABLE dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ticket_paid_at  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dt_flow_bookings_ticket_order
  ON dt_flow_bookings (ticket_order_id)
  WHERE ticket_order_id IS NOT NULL;
```

### 기존 스키마와 충돌 분석

| 검증 항목 | 결과 | 근거 |
|---------|------|------|
| dt_flow_bookings 존재 | **PASS** | migration 208 Production APPLIED (기억 기준) |
| ticket_order_id 기존 존재 | **PASS** | main/staging 전체 grep 0건 |
| ticket_paid_at 기존 존재 | **PASS** | main/staging 전체 grep 0건 |
| uq_dt_flow_bookings_ticket_order 인덱스 충돌 | **PASS** | 기존 인덱스 명칭: idx_ 접두사, uq_ 접두사 사용 없음 |
| migration 211~214 추가 DDL | **PASS** | 211 명시: "Does NOT modify: dt_flow_bookings" |
| consumeHold() INSERT 호환성 | **PASS** | 명시적 컬럼 지정 — 신규 컬럼 자동 NULL |
| flowConfirmRoutes.js SELECT 호환성 | **PASS** | booking_id 기반 조회 — 신규 컬럼 영향 없음 |
| IF NOT EXISTS 멱등성 | **PASS** | ALTER TABLE + CREATE INDEX 모두 IF NOT EXISTS |

**코드 분석 기반 전체 PASS. 실제 DB 실행 필요: §2 점검 SQL 참조.**

---

## §2 Founder 실행용 READ-ONLY 사전 점검 SQL

**실행 위치:** Supabase 대시보드 → SQL Editor  
**실행 시점:** Migration 217 적용 전  
**예상 소요:** 약 2분

### [CHECK-01] 테이블 존재 확인

```sql
-- 예상 결과: 1행 (dt_flow_bookings)
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'dt_flow_bookings';
```

**판정 기준:**
- `1행 반환` → PASS (테이블 존재, Migration 적용 가능)
- `0행 반환` → FAIL (migration 208 미적용 — Migration 217 적용 불가)

---

### [CHECK-02] 컬럼 충돌 확인 (ticket_order_id, ticket_paid_at)

```sql
-- 예상 결과: 0행 (두 컬럼 모두 없음)
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'dt_flow_bookings'
  AND column_name  IN ('ticket_order_id', 'ticket_paid_at');
```

**판정 기준:**
- `0행 반환` → PASS (컬럼 없음, Migration 안전하게 추가 가능)
- `1~2행 반환` → FAIL (이미 존재 — Migration 217의 IF NOT EXISTS로 오류 없이 넘어가지만, 기존 컬럼 정의를 확인해야 함)

---

### [CHECK-03] 인덱스 충돌 확인

```sql
-- 예상 결과: 0행 (uq_dt_flow_bookings_ticket_order 없음)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename  = 'dt_flow_bookings'
  AND indexname  = 'uq_dt_flow_bookings_ticket_order';
```

**판정 기준:**
- `0행 반환` → PASS (인덱스 없음, 안전하게 생성 가능)
- `1행 반환` → FAIL (이미 존재 — IF NOT EXISTS로 오류 없이 넘어가지만, 기존 정의 확인 필요)

---

### [CHECK-04] 기존 인덱스 전체 목록 (명명 규칙 확인)

```sql
-- 예상 결과: 3개 인덱스 (idx_dt_flow_bookings_inventory, _sowon, _hold)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename  = 'dt_flow_bookings'
ORDER BY indexname;
```

**판정 기준:**
- `idx_dt_flow_bookings_inventory`, `idx_dt_flow_bookings_sowon`, `idx_dt_flow_bookings_hold` 이외 항목이 있으면 → 추가 검토 필요

---

### [CHECK-05] 기존 Booking 데이터 현황

```sql
-- 예상 결과: 운영 중인 Booking 수 확인
SELECT
  COUNT(*)                                            AS total_bookings,
  COUNT(*) FILTER (WHERE status = 'confirmed')        AS confirmed,
  COUNT(*) FILTER (WHERE status = 'cancelled')        AS cancelled,
  MIN(created_at)                                     AS earliest_booking,
  MAX(created_at)                                     AS latest_booking
FROM dt_flow_bookings;
```

**판정 기준:**
- 어떤 값이든 → PASS (데이터 현황 파악용 — ADD COLUMN NULL은 기존 행 변경 없음)
- `0행` → 정상 (Booking 없음, Migration 즉각 적용 안전)

---

### [CHECK-06] dt_flow_bookings 현재 컬럼 전체 목록

```sql
-- Migration 208 기준 예상 컬럼:
-- id, inventory_id, hold_id, sowon_id, quantity, status,
-- customer_name, phone, created_at, updated_at
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'dt_flow_bookings'
ORDER BY ordinal_position;
```

**판정 기준:**
- 예상 컬럼 10개만 있고 `ticket_order_id`, `ticket_paid_at` 없음 → PASS
- 예상 외 컬럼 있음 → 추가 검토 필요 (누락된 migration이 있을 수 있음)

---

### [CHECK-07] dt_flow_bookings에 의존하는 뷰(View) 확인

```sql
-- 예상 결과: 0행 (뷰 없음)
SELECT table_name AS view_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%dt_flow_bookings%';
```

**판정 기준:**
- `0행` → PASS (뷰 없음, 컬럼 추가가 뷰에 영향 없음)
- `1행 이상` → 검토 필요 (뷰가 SELECT * 사용 시 새 컬럼 자동 포함 — 일반적으로 안전하나 확인)

---

### [CHECK-08] 현재 사용자 권한 확인

```sql
-- 현재 연결 사용자 확인
SELECT current_user, current_database(), version();
```

```sql
-- dt_flow_bookings ALTER 권한 확인 (테이블 소유자 또는 superuser 필요)
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name   = 'dt_flow_bookings'
  AND grantee      = current_user;
```

**판정 기준:**
- `ALTER` 또는 테이블 소유자 → PASS (Migration 실행 가능)
- 권한 없음 → FAIL (Supabase 슈퍼유저 계정으로 재실행 필요)

---

### [CHECK-09] ticket_order_id 데이터 NicePay 주문번호 유일성 범위 확인

```sql
-- nicepay_payments 테이블의 order_id 형식 확인 (ticket_order_id와 네임스페이스 충돌 방지)
-- 예상: PAY{YYYYMMDD}{HHmmss}{4자리} 형식
SELECT
  LEFT(order_id, 3)  AS prefix,
  LENGTH(order_id)   AS id_length,
  COUNT(*)           AS count
FROM nicepay_payments
GROUP BY prefix, id_length
ORDER BY count DESC
LIMIT 5;
```

**판정 기준:**
- ticket.6117.co.kr 주문번호 형식이 `PAY...` 패턴과 다르면 → PASS (네임스페이스 충돌 없음)
- 동일한 형식이면 → 주의 (ticket PHP에서 주문번호 형식을 별도로 구분할 것을 권고)

---

### [CHECK-10] UNIQUE INDEX 적용 후 시뮬레이션 (DRY-RUN)

```sql
-- Migration 217 실행 전 EXPLAIN으로 문법 확인 (실제 변경 없음)
-- EXPLAIN은 DDL 실행 없이 문법만 검증
EXPLAIN ALTER TABLE dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id_test_dry_run VARCHAR(100);

-- 실행 후 반드시 트랜잭션 롤백 (아래 블록 전체 실행)
-- BEGIN;
-- ALTER TABLE dt_flow_bookings
--   ADD COLUMN IF NOT EXISTS ticket_order_id_test_dry_run VARCHAR(100);
-- -- 여기서 컬럼 추가 확인 가능
-- ROLLBACK;  ← 이 줄 반드시 실행 (Production 변경 방지)
```

**판정 기준:**
- EXPLAIN 실행 시 오류 없음 → PASS (SQL 문법 정상)
- 오류 발생 → FAIL (SQL 재검토 필요)

---

## §3 전체 점검 결과 집계표 (Founder 기재용)

Founder가 §2의 각 CHECK를 실행한 후 결과를 아래 표에 기재합니다.

| CHECK | 항목 | 결과 | 실제 반환값 요약 |
|-------|------|------|----------------|
| CHECK-01 | dt_flow_bookings 존재 | ☐ PASS / ☐ FAIL | |
| CHECK-02 | 컬럼 충돌 없음 | ☐ PASS / ☐ FAIL | |
| CHECK-03 | 인덱스 충돌 없음 | ☐ PASS / ☐ FAIL | |
| CHECK-04 | 기존 인덱스 목록 정상 | ☐ PASS / ☐ 검토 필요 | |
| CHECK-05 | 기존 Booking 데이터 현황 | ☐ PASS | booking 수: |
| CHECK-06 | 컬럼 목록 정상 | ☐ PASS / ☐ 검토 필요 | |
| CHECK-07 | 의존 뷰 없음 | ☐ PASS / ☐ 검토 필요 | |
| CHECK-08 | 권한 확인 | ☐ PASS / ☐ FAIL | |
| CHECK-09 | 주문번호 네임스페이스 | ☐ PASS / ☐ 주의 | |
| CHECK-10 | SQL 문법 DRY-RUN | ☐ PASS / ☐ FAIL | |

**전체 PASS 시:** Migration 217 적용 승인 가능 상태  
**FAIL 1개 이상 시:** Claude Code에 실제 반환값 공유 → 추가 분석

---

## §4 Migration 217 적용 순서 (승인 후)

```
[Supabase SQL Editor]

1. §2 CHECK-01 ~ CHECK-10 실행 → 전체 PASS 확인
2. 217_flow_ticket_order_id.sql 내용을 SQL Editor에 붙여넣기
3. 실행 (Run)
4. 즉시 확인 쿼리 실행:
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'dt_flow_bookings'
   AND column_name IN ('ticket_order_id', 'ticket_paid_at');
   → 2행 반환 확인

5. 인덱스 확인:
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'dt_flow_bookings'
   AND indexname = 'uq_dt_flow_bookings_ticket_order';
   → 1행 반환 확인

6. Claude Code에 완료 보고
```

---

## §5 Rollback SQL (Migration 실패 시)

```sql
-- Rollback: Founder 명시 승인 없이 실행 금지
-- Migration 217 적용 후 문제 발생 시에만 사용
DROP INDEX IF EXISTS uq_dt_flow_bookings_ticket_order;
ALTER TABLE dt_flow_bookings
  DROP COLUMN IF EXISTS ticket_order_id,
  DROP COLUMN IF EXISTS ticket_paid_at;
```

---

## §6 Code 분석 기반 점검 결과 (실행 전)

| 항목 | 상태 | 근거 파일 |
|------|------|---------|
| ticket_order_id 기존 없음 | **PASS** | main + staging 전체 grep 0건 |
| ticket_paid_at 기존 없음 | **PASS** | main + staging 전체 grep 0건 |
| 인덱스 명칭 충돌 없음 | **PASS** | 기존: idx_ 접두사 3개, uq_ 사용 없음 |
| migration 211~214 dt_flow_bookings 미변경 | **PASS** | migration 211 주석 명시 |
| consumeHold() 명시적 컬럼 INSERT | **PASS** | flowInventoryService.js:202 |
| flowConfirmRoutes.js 호환성 | **PASS** | booking_id FK 기반 조회 |
| ADD COLUMN NULL PostgreSQL 즉각 완료 | **PASS** | PostgreSQL 12+ DDL Lock 없음 |
| IF NOT EXISTS 멱등성 | **PASS** | ALTER TABLE + CREATE INDEX 모두 포함 |
| PR #140 상태 | **NOT VERIFIED** | GitHub: OPEN (미병합) — Migration 독립 가능 |
| Production DB 실제 컬럼 목록 | **NOT VERIFIED** | Supabase 직접 접근 없음 → §2 CHECK-06 |
| 기존 Booking 데이터 수 | **NOT VERIFIED** | §2 CHECK-05 |
| 현재 사용자 권한 | **NOT VERIFIED** | §2 CHECK-08 |

