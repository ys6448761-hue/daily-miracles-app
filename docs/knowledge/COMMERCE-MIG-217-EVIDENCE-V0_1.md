# PHX-COMMERCE-MIG-001 — Migration 217 Review Evidence

**Task ID:** PHX-COMMERCE-MIG-001  
**Date:** 2026-11-03  
**Status:** REVIEW_COMPLETE — Founder 승인 보고서 첨부  
**Migration File:** `database/migrations/217_flow_ticket_order_id.sql`

---

## A. Migration Review

### DB 엔진

| 항목 | 값 |
|------|-----|
| DB 엔진 | PostgreSQL (Supabase) |
| 연결 방식 | `DATABASE_URL` 환경변수 (Render → Supabase) |
| Migration 프레임워크 | 커스텀 Admin API + 직접 SQL 실행 방식 혼용 |
| Migration 적용 방법 | `POST /api/admin/run-migration { migration: "217" }` (server.js allowed 목록 추가 필요) 또는 Supabase 대시보드 SQL 편집기 직접 실행 |

### 실제 테이블 정의 (dt_flow_bookings 현재 상태)

**Source:** `database/migrations/208_flow_schema.sql` (staging, Production DB APPLIED 확인)

```
dt_flow_bookings
├─ id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
├─ inventory_id     UUID NOT NULL FK → dt_flow_inventory(id)
├─ hold_id          UUID FK → dt_flow_holds(id)
├─ sowon_id         UUID NOT NULL
├─ quantity         INTEGER NOT NULL DEFAULT 1 CHECK(>0)
├─ status           VARCHAR(20) NOT NULL DEFAULT 'confirmed'
├─ customer_name    VARCHAR(100)
├─ phone            VARCHAR(20)
├─ created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
└─ updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()

기존 인덱스:
├─ idx_dt_flow_bookings_inventory  ON(inventory_id, status)
├─ idx_dt_flow_bookings_sowon      ON(sowon_id, status)
└─ idx_dt_flow_bookings_hold       ON(hold_id)
```

**ticket_order_id 기존 존재 여부:** 없음 (0건 확인)  
**ticket_paid_at 기존 존재 여부:** 없음 (0건 확인)

### 기존 Migration 이력

| 번호 | 파일 | 위치 | 상태 |
|------|------|------|------|
| 207 | `207_travel_places_stay_time_v01.sql` | main | main에 존재 |
| 208 | `208_flow_schema.sql` | staging | Production APPLIED (memory 기준) |
| 209~216 | FLOW 관련 | staging | Production APPLIED (memory 기준) |
| 217 | `217_flow_ticket_order_id.sql` | 신규 작성 | PENDING Founder 승인 |

**주의:** main 브랜치 `database/migrations/` 폴더에는 208~216 없음. PR #140 병합 후 main에 포함됨.

### 필요한 Schema 변경

```sql
-- 추가 (신규, 멱등)
ALTER TABLE dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ticket_paid_at  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dt_flow_bookings_ticket_order
  ON dt_flow_bookings (ticket_order_id)
  WHERE ticket_order_id IS NOT NULL;
```

### 데이터 호환성 평가

| 항목 | 평가 | 근거 |
|------|------|------|
| 기존 Booking NULL 처리 | **안전** | NULL 허용 컬럼 추가 → 기존 행 ticket_order_id=NULL |
| consumeHold() INSERT SQL | **안전** | 명시적 컬럼 지정(`inventory_id, hold_id, ...`) — 새 컬럼 자동 NULL |
| RETURNING 절 | **안전** | 기존 RETURNING에 ticket_order_id 없음 — 영향 없음 |
| 복수 NULL 공존 | **안전** | PARTIAL UNIQUE(ticket_order_id) WHERE NOT NULL → NULL 중복 무제한 허용 |

### 인덱스 충돌 평가

- 기존 인덱스 이름: `idx_dt_flow_bookings_*`
- 신규 UNIQUE INDEX: `uq_dt_flow_bookings_ticket_order` (충돌 없음)
- `IF NOT EXISTS`: 재실행 시 오류 없음 (멱등)

### 운영 영향 및 복구 방안

| 항목 | 평가 |
|------|------|
| Lock 영향 | `ALTER TABLE ADD COLUMN NULL` — PostgreSQL 12+ 즉각 완료, 테이블 Lock 없음 |
| `CREATE UNIQUE INDEX` | 테이블 데이터 없는 경우(또는 소량): 즉각. 대량 기존 데이터 시 잠깐 Share Lock |
| DDL 트랜잭션 지원 | PostgreSQL: DDL 트랜잭션 지원 ✅ — 실패 시 자동 ROLLBACK |
| 배포 중 장애 복구 | Rollback SQL 준비: `DROP INDEX`, `DROP COLUMN` (주석으로 migration 파일에 포함) |
| 적용 후 API 배포 순서 | Migration 먼저 → server.js 배포 (역순 불가 — server.js가 ticket_order_id를 UPDATE 시도하면 컬럼 없어서 오류) |

---

## B. Migration Artifact

| 항목 | 값 |
|------|-----|
| 파일 경로 | `database/migrations/217_flow_ticket_order_id.sql` |
| 브랜치 | `docs/commerce-phase1-v01` (현재) → PR #140 병합 후 `main`에 포함 예정 |
| Commit Hash | 미생성 (이 문서 커밋 시 확정) |
| 적용 방법 A | Supabase 대시보드 SQL 편집기에서 SQL 직접 실행 (권장) |
| 적용 방법 B | `POST /api/admin/run-migration { migration: "217" }` — server.js allowed 목록에 "217" 추가 필요 |
| 배포 순서 | ① Migration 217 실행 → ② PR #140 병합 → ③ flowTicketRoutes.js 구현 → ④ Render 배포 |

**Rollback SQL:**
```sql
-- Rollback (Founder 명시 승인 없이 실행 금지)
DROP INDEX IF EXISTS uq_dt_flow_bookings_ticket_order;
ALTER TABLE dt_flow_bookings
  DROP COLUMN IF EXISTS ticket_order_id,
  DROP COLUMN IF EXISTS ticket_paid_at;
```

---

## C. Verification Evidence

**접근 제한:** Staging DB 직접 접근 불가. Production DB 직접 접근 불가.  
아래 테스트는 **코드 분석 기반 PASS/FAIL 판정**이며, 실제 DB 실행 결과가 아님을 명시.

| 테스트 | 결과 | 근거 |
|--------|------|------|
| T1. 기존 Booking 데이터 보존 | **PASS (코드 기반)** | ADD COLUMN NULL → 기존 행 변경 없음. DROP TABLE/TRUNCATE 없음 |
| T2. 기존 Booking 조회 정상 | **PASS (코드 기반)** | SELECT * 및 명시 컬럼 조회 모두 신규 컬럼 자동 포함 (NULL) |
| T3. 신규 Booking 생성 호환성 | **PASS (코드 기반)** | consumeHold() INSERT 명시 컬럼 목록 → 신규 컬럼 자동 NULL |
| T4. ticket_order_id=NULL 기존 데이터 공존 | **PASS (코드 기반)** | PARTIAL UNIQUE WHERE NOT NULL → NULL 중복 무제한 |
| T5. 서로 다른 ticket_order_id 저장 | **PASS (코드 기반)** | UNIQUE INDEX 미충돌 — 설계상 안전 |
| T6. 동일 ticket_order_id 중복 차단 | **PASS (코드 기반)** | `uq_dt_flow_bookings_ticket_order` UNIQUE 위반 → INSERT 실패 |
| T7. ticket_paid_at 저장·조회 | **PASS (코드 기반)** | TIMESTAMPTZ 표준 타입, NULL 허용 |
| T8. 트랜잭션 실패 복구 | **PASS (코드 기반)** | PostgreSQL DDL 트랜잭션 지원 → 실패 시 자동 ROLLBACK |
| T9. 재실행 안전성 | **PASS (코드 기반)** | `IF NOT EXISTS` 보장 |
| T10. 실제 DB 실행 테스트 | **NOT RUN** | Staging/Production DB 직접 접근 없음 — Founder 실행 필요 |

**NOT RUN 사유:** Staging DB 접근 권한 미보유 (Render/Supabase 자격증명 없음).

---

## D. 리스크 목록

| 리스크 | 수준 | 대응 |
|--------|------|------|
| PR #140 미병합 | **HIGH** | Migration은 독립 적용 가능 (dt_flow_bookings 이미 Production APPLIED). API 코드와 순서 분리 |
| Migration 217이 allowed 목록에 없음 | **MEDIUM** | server.js에 "217" 추가 필요 (또는 Supabase 직접 실행) |
| ticket_order_id UNIQUE만으로 API 멱등성 완전하지 않음 | **LOW** | 분리 항목 — flowTicketRoutes.js 구현 시 별도 검증 |
| ticket.6117.co.kr NicePay MID 미확인 | **MEDIUM** | 이 Migration과 무관. API 구현 단계에서 처리 |
| Production DB 중복 데이터 | **LOW** | ticket_order_id 컬럼 현재 없음 → 기존 데이터에 중복 없음. PARTIAL UNIQUE 안전 |
| DDL 테이블 Lock | **LOW** | `ADD COLUMN NULL` = PostgreSQL에서 즉각 (Lock 없음). UNIQUE INDEX = 소량 데이터 가정 시 즉각 |
| Rollback 필요 시 | 보통 | Rollback SQL 준비 완료. 단, flowTicketRoutes.js가 배포된 후 Rollback은 API 중단 유발 |

---

## E. PR #140 실제 병합 상태

**GitHub API 직접 확인:**

```json
{
  "state": "OPEN",
  "mergedAt": null,
  "mergeCommit": null
}
```

**판정:** PR #140 **OPEN — 미병합**. Founder 보고와 실제 GitHub 상태가 다름.  

이 Migration은 PR #140 병합 여부와 **독립적으로** 적용 가능:
- dt_flow_bookings는 Production DB에 이미 APPLIED (memory 기준)
- Migration 217은 dt_flow_bookings에 컬럼 추가만 수행
- PR #140 병합 전에도 Migration 217 적용 가능 (선행 또는 후행 모두 안전)

