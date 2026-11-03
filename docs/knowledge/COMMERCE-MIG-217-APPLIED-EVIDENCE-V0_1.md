# PHX-COMMERCE-MIG-003 — Migration 217 Applied Evidence

**Task ID:** PHX-COMMERCE-MIG-003
**Date:** 2026-11-03 (KST 13:45 ~ 14:00 기준)
**Status:** APPLIED — VERIFIED
**Founder Authorization:** APPROVED 2026-11-03

---

## 실행 환경

| 항목 | 값 |
|------|-----|
| Production DB | Render PostgreSQL |
| Service | yeosu-miracle-db |
| Database | yeosu_miracle_travel |
| Host | dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com |
| PostgreSQL Version | 17.9 |
| 실행 User | yeosu_user |
| WAL Archiving | ON / wal_level=replica (PITR 가능) |

---

## 사전 검증 (PRECHECK)

| 항목 | 결과 |
|------|------|
| DB = yeosu_miracle_travel | CONFIRMED |
| dt_flow_bookings 존재 | PASS |
| ticket_order_id 기존 없음 | PASS |
| ticket_paid_at 기존 없음 | PASS |
| uq_dt_flow_bookings_ticket_order 기존 없음 | PASS |
| 기존 Booking 수 (사전) | 2행 (confirmed×2) |
| 기존 Booking ID (사전, 마스킹) | 998083fb-****, 1da0e185-**** |
| Rollback SQL 존재 | VERIFIED (migration 파일 내 주석) |
| WAL 복구 기준점 LSN | 1A7/CA0002F0 (2026-11-03T04:44:53Z) |

---

## Migration 실행

### 실행 SQL (승인 범위와 일치)

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id VARCHAR(100);

ALTER TABLE public.dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_paid_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dt_flow_bookings_ticket_order
  ON public.dt_flow_bookings (ticket_order_id)
  WHERE ticket_order_id IS NOT NULL;

COMMIT;
```

| DDL | 결과 |
|-----|------|
| ADD COLUMN ticket_order_id | OK |
| ADD COLUMN ticket_paid_at | OK |
| CREATE UNIQUE INDEX | OK |
| TRANSACTION | COMMITTED |

---

## 사후 검증 (POSTCHECK)

### A. 신규 컬럼

| 컬럼 | 타입 | Nullable | 결과 |
|------|------|---------|------|
| ticket_order_id | character varying(100) | YES | **PASS** |
| ticket_paid_at | timestamp with time zone | YES | **PASS** |

### B. UNIQUE INDEX

```
CREATE UNIQUE INDEX uq_dt_flow_bookings_ticket_order
ON public.dt_flow_bookings USING btree (ticket_order_id)
WHERE (ticket_order_id IS NOT NULL)
```

| 항목 | 결과 |
|------|------|
| 인덱스 존재 | **PASS** |
| PARTIAL WHERE NOT NULL | **PASS** |
| UNIQUE | BTREE (PostgreSQL UNIQUE INDEX는 기본 UNIQUE) |

### C. 기존 Booking 무결성

| 항목 | 사전 | 사후 | 결과 |
|------|------|------|------|
| 행 수 | 2 | 2 | **PASS** |
| 998083fb-**** | confirmed | confirmed | **보존** |
| 1da0e185-**** | confirmed | confirmed | **보존** |
| ticket_order_id (기존 행) | (컬럼 없음) | NULL | **PASS** |
| ticket_paid_at (기존 행) | (컬럼 없음) | NULL | **PASS** |

### D. 전체 인덱스 (사후)

| 인덱스 | 상태 |
|--------|------|
| dt_flow_bookings_pkey | 기존 유지 |
| idx_dt_flow_bookings_hold | 기존 유지 |
| idx_dt_flow_bookings_inventory | 기존 유지 |
| idx_dt_flow_bookings_sowon | 기존 유지 |
| uq_dt_flow_bookings_ticket_order | **신규 생성** |

---

## Rollback SQL (별도 Founder 승인 전 실행 금지)

```sql
DROP INDEX IF EXISTS uq_dt_flow_bookings_ticket_order;
ALTER TABLE dt_flow_bookings
  DROP COLUMN IF EXISTS ticket_order_id,
  DROP COLUMN IF EXISTS ticket_paid_at;
```

---

## 최종 결과

| 항목 | 값 |
|------|-----|
| PRECHECK | PASS |
| EXECUTION | APPLIED |
| TRANSACTION | COMMITTED |
| POSTCHECK | PASS |
| FINAL STATUS | **SUCCESS** |
| EVIDENCE FILE | docs/knowledge/COMMERCE-MIG-217-APPLIED-EVIDENCE-V0_1.md |
