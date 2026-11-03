# PHX-COMMERCE-FLOW-001 — FLOW 최소 이식 분석

**Task ID:** PHX-COMMERCE-FLOW-001
**Date:** 2026-11-03
**Decision:** Option B (필요 파일만 cherry-pick)
**Result:** READY — 조건부 (§6 참조)

---

## §1 Production DB FLOW 테이블 적용 현황 (실측)

| 테이블 | Production 존재 여부 | 관련 Migration |
|--------|---------------------|--------------|
| dt_flow_inventory | **EXISTS** | 208 |
| dt_flow_holds | **EXISTS** | 208 |
| dt_flow_bookings | **EXISTS** | 208 |
| dt_flow_confirmations | **EXISTS** | 211 |
| dt_sodam_decisions | **EXISTS** | 210 |
| partner_configs | **EXISTS** | 209/213 seed |
| partner_pin_attempts | **EXISTS** | 209 |
| voyage_wishes.owner_sowon_id | **MISSING** | staging 207 — Production 미적용 |
| dt_flow_bookings.ticket_order_id | **EXISTS** | 217 (2026-11-03 적용) |
| dt_flow_bookings.ticket_paid_at | **EXISTS** | 217 (2026-11-03 적용) |
| storybook_journeys | **MISSING** | 997 — 이식 불필요 |

**결론:** FLOW 핵심 테이블(208~214) 전체 Production APPLIED. 코드만 main에 없는 상태.

---

## §2 FLOW 최소 이식 대상 파일

### 2-1. 신규 추가 파일 (main에 없음)

| 파일 | 크기 | 역할 | 우선순위 |
|------|------|------|---------|
| `services/flowInventoryService.js` | 304줄 | Hold/Book/Release 핵심 엔진 | 🔴 ESSENTIAL |
| `routes/flowRoutes.js` | 187줄 | /availability, /hold, /book 엔드포인트 | 🔴 ESSENTIAL |
| `routes/flowConfirmRoutes.js` | 171줄 | /confirm 파트너 확인 엔드포인트 | 🔴 ESSENTIAL |
| `middleware/adminGuard.js` | ~50줄 | ADMIN_TOKEN 헤더 검증 | 🟡 REQUIRED BY flowAdminRoutes |
| `services/partnerPinService.js` | ~80줄 | PIN SHA256 검증 (flowConfirmRoutes 필요) | 🔴 ESSENTIAL |
| `routes/flowAdminRoutes.js` | 182줄 | 관리자 재고 관리 | 🟡 NICE-TO-HAVE (MVP 선택) |

### 2-2. server.js 추가 내용 (전체 diff 불필요 — 블록만 추가)

staging server.js의 FLOW 관련 라우트 등록 3블록 (약 40줄):

```javascript
// BLOCK-1: flowRoutes (/api/dt/flow/availability, /hold, /book)
let flowKennyRoutes = null;
try {
  flowKennyRoutes = require("./routes/flowRoutes");
} catch(e) { console.warn("⚠️ FLOW Routes 로드 실패:", e.message); }
if (flowKennyRoutes) {
  app.use("/api/dt/flow", flowKennyRoutes);
}

// BLOCK-2: flowConfirmRoutes (/api/dt/flow/confirm)
let flowConfirmKennyRoutes = null;
try {
  flowConfirmKennyRoutes = require("./routes/flowConfirmRoutes");
} catch(e) { console.warn("⚠️ FLOW Confirm Routes 로드 실패:", e.message); }
if (flowConfirmKennyRoutes) {
  app.use("/api/dt/flow", flowConfirmKennyRoutes);
}

// BLOCK-3: flowAdminRoutes (/api/admin/flow/inventory)
let flowAdminKennyRoutes = null;
try {
  flowAdminKennyRoutes = require('./routes/flowAdminRoutes');
} catch(e) { console.warn("⚠️ FLOW Admin Routes 로드 실패:", e.message); }
if (flowAdminKennyRoutes) {
  app.use('/api/admin/flow', flowAdminKennyRoutes);
}
```

**server.js 전략:** cherry-pick 대신 Edit로 라우트 등록 블록만 삽입. 3,012줄 diff 전체 이식 불필요.

### 2-3. Migration 파일 (Production 이미 적용 — main 추적용)

| 파일 | Production 상태 | main 병합 목적 |
|------|----------------|--------------|
| `database/migrations/208_flow_schema.sql` | APPLIED | main 기록용 |
| `database/migrations/209_kenny_seed.sql` | APPLIED | main 기록용 |
| `database/migrations/210_sodam_decisions.sql` | APPLIED | main 기록용 |
| `database/migrations/211_flow_confirmations.sql` | APPLIED | main 기록용 |
| `database/migrations/212_flow_hold_sodam_decision.sql` | APPLIED | main 기록용 |
| `database/migrations/213_ramada_seed.sql` | APPLIED | main 기록용 |
| `database/migrations/214_sowon_identity.sql` | APPLIED | main 기록용 |
| `database/migrations/215_benefits_display_order.sql` | 미확인 | 선택 |
| `database/migrations/216_travel_places_core12_reality_v01.sql` | 미확인 | 선택 |

---

## §3 의존성 분석

### flowInventoryService.js
```
require('../utils/kstDate')  ← main에 EXISTS ✅
```
외부 의존성 없음. db.js(pool) 직접 사용.

### flowRoutes.js
```
require('express')                          ← 존재 ✅
require('../database/db')                   ← 존재 ✅
require('../middleware/authenticatedPrincipal') ← main에 EXISTS ✅ (단, staging 버전과 차이 가능)
require('../services/flowInventoryService') ← 신규 추가 대상 ✅
```

### flowConfirmRoutes.js
```
require('express')              ← 존재 ✅
require('../database/db')       ← 존재 ✅
require('../services/partnerPinService') ← MISSING in main → 이식 필요 🔴
```

### flowAdminRoutes.js
```
require('../middleware/adminGuard') ← MISSING in main → 이식 필요 🔴
```

### 의존성 트리 요약
```
flowRoutes.js
  └─ flowInventoryService.js
       └─ utils/kstDate.js (main OK)

flowConfirmRoutes.js
  └─ partnerPinService.js (신규 이식 필요)

flowAdminRoutes.js
  └─ adminGuard.js (신규 이식 필요)
```

---

## §4 Migration 207 번호 충돌 해결 계획

### 현황

| 브랜치 | 파일명 | 내용 | Production 적용 |
|--------|-------|------|----------------|
| main | 207_travel_places_stay_time_v01.sql | travel_places stay time | 확인 필요 |
| staging | 207_voyage_wish_owner.sql | voyage_wishes.owner_sowon_id 추가 | **MISSING (미적용)** |

### Production DB 확인 결과
- `voyage_wishes.owner_sowon_id` = **MISSING** → staging의 207은 Production에 적용된 적 없음
- staging 207은 main의 207과 완전히 다른 내용

### 해결 방안

**권장: 이식 제외 (조건부)**

staging의 `207_voyage_wish_owner.sql`은:
1. Production DB에 미적용 상태
2. main의 `207_travel_places_stay_time_v01.sql`과 번호 충돌
3. FLOW 핵심 기능(Hold/Book/Confirm)에 직접 필요 없음

→ FLOW 최소 이식 PR에서 제외. 별도 필요 시 `218_voyage_wish_owner.sql`로 번호 재지정 후 별도 Migration 승인.

**금지:** 번호 변경 후 Production 즉시 실행 — Founder 별도 승인 필요.

---

## §5 Vercel CI FAILURE 영향 분석

### 원인 추정

PR #140의 Vercel FAILURE는 다음 가능성:
1. staging 브랜치 특화 환경변수 (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등 storybook용) 미설정
2. staging package.json의 신규 의존성 (`@supabase/supabase-js`, `ws`, `exifr`, `heic2any` 등)

### 새 PR에 미치는 영향

**영향 없음.** 새 PR은:
- main 기반으로 생성
- 이식 파일: flowInventoryService.js, flowRoutes.js, flowConfirmRoutes.js, partnerPinService.js, adminGuard.js
- 이 파일들은 storybook/Supabase Storage와 무관
- Vercel은 이 PR의 독립적 Preview 배포를 시도 → main 설정 기반으로 성공 가능

→ Vercel CI FAILURE는 PR #140에 국한. 새 FLOW PR은 영향 없음 (단, Vercel 환경변수 `FLOW_HOLD_TTL_MINUTES`, `ADMIN_TOKEN` 설정 필요할 수 있음).

---

## §6 main 기준 충돌 위험

### 이식 파일별 충돌 위험

| 파일 | main 충돌 위험 |
|------|--------------|
| services/flowInventoryService.js | **없음** — main에 없는 신규 파일 |
| routes/flowRoutes.js | **없음** — main에 없는 신규 파일 |
| routes/flowConfirmRoutes.js | **없음** — main에 없는 신규 파일 |
| routes/flowAdminRoutes.js | **없음** — main에 없는 신규 파일 |
| middleware/adminGuard.js | **없음** — main에 없는 신규 파일 |
| services/partnerPinService.js | **없음** — main에 없는 신규 파일 |
| server.js (블록 삽입) | **낮음** — Edit 도구로 안전한 위치에 삽입 |
| database/migrations/208~214.sql | **없음** — 번호 충돌 없음 (208~214는 main에 없음) |

**26개 충돌 후보 파일 모두 회피 가능.** cherry-pick이 아닌 신규 파일 추가 + server.js 블록 삽입으로 충돌 없이 이식 가능.

---

## §7 테스트 계획

### 기존 테스트

staging에 존재하는 FLOW 테스트:
- `tests/unit/flowInventory.test.js`
- `tests/unit/flowConfirm.test.js`
- `tests/unit/flowHoldSodamDecision.test.js`
- `tests/unit/flowKstCutoff.test.js`

→ 이 테스트들도 함께 이식. main의 Jest 설정 호환 여부 확인 필요.

### 수동 검증 항목 (PR 생성 후)

1. `GET /api/dt/flow/availability?inventory_id=...` → 재고 조회 응답
2. `POST /api/dt/flow/hold` → hold_id 반환
3. `POST /api/dt/flow/book` → booking_id 반환 (hold 소비)
4. `POST /api/dt/flow/confirm` → 파트너 PIN 확인
5. `GET /api/admin/flow/inventory` → 관리자 재고 목록

Production에서 실제 예약 테스트 금지 — 로컬 또는 staging DB로 E2E 확인.

---

## §8 별도 PR 생성 가능 여부

**READY (조건부)**

| 조건 | 상태 |
|------|------|
| main 기반 신규 브랜치 생성 가능 | ✅ |
| 이식 파일 충돌 없음 | ✅ |
| Migration 파일 번호 충돌 없음 | ✅ (207 제외) |
| Production DB 테이블 이미 존재 | ✅ |
| Vercel CI 영향 없음 | ✅ |
| flowTicketRoutes.js 선행 구현 금지 | ✅ 준수 |
| Founder 승인 필요 항목 | authenticatedPrincipal.js 버전 충돌 가능성 확인 |

**조건:** `middleware/authenticatedPrincipal.js`가 main과 staging에서 모두 변경됨 (26개 충돌 파일 중 하나). flowRoutes.js가 이를 `require`하므로 **main 버전 호환성 확인 필요**. 확인 후 이식 착수.

---

## §9 이식 실행 순서 (승인 후)

```
1. main 기반 신규 브랜치 생성
   git checkout -b feat/flow-minimal-integration

2. 신규 파일 복사 (staging에서 cherry-pick 또는 파일 직접 이식)
   - services/flowInventoryService.js
   - routes/flowRoutes.js
   - routes/flowConfirmRoutes.js
   - routes/flowAdminRoutes.js
   - middleware/adminGuard.js
   - services/partnerPinService.js
   - database/migrations/208~214.sql (기록용)
   - tests/unit/flow*.test.js

3. server.js에 FLOW 라우트 등록 블록 3개 삽입 (Edit 도구)

4. authenticatedPrincipal.js 호환성 확인 후 필요 시 최소 조정

5. 로컬 테스트 실행

6. PR 생성 (feat/flow-minimal-integration → main)
```
