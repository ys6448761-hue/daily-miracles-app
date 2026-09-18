# VOYAGE + FLOW + RAMADA V23 시스템 통합 조사 보고서

**조사일:** 2026-09-12  
**범위:** 코드·DB·API·세션·식별자·추천·가격·재고 로직 (수정 없음)  
**상태:** READ-ONLY 분석 / 기결정사항 유지  

---

## 목차
1. [시스템 인벤토리](#1-시스템-인벤토리)
2. [현재 연결 상태](#2-현재-연결-상태)
3. [데이터 중복 분석](#3-데이터-중복-분석)
4. [책임 범위 맵](#4-책임-범위-맵)
5. [통합 제안](#5-dreamtown-orchestrator를-통한-최소-통합-구조)
6. [위험 평가](#6-위험-평가)

---

## 1. 시스템 인벤토리

### 1.1 VOYAGE 시스템 (여정 예약)

#### 코드 위치
- **Route:** `routes/voyageRoutes.js` (403줄)
- **Admin Route:** `routes/voyageAdminRoutes.js` (미확인)
- **Star Route:** `routes/starVoyageRoutes.js` (124줄)
- **Frontend:** `dreamtown-frontend/src/pages/Voyage*.jsx` (VoyageLanding, VoyageBooking, VoyageStatus 등)

#### 데이터베이스 (PostgreSQL/Supabase)

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `voyage_wishes` | 항해 소원 원장 | id (UUID), session_key, wish_text, status, star_id, created_at |
| `voyage_bookings` | 예약+결제 | id, wish_id (FK), customer_name, phone, booking_date, session, amount, pg_order_id, paid_at |
| `voyages` | 케이블카 Star 항해 | id, star_id (FK), type, status, phone_number, pg_order_id |
| `dt_voyage_logs` | 항해 로그 | (마이그레이션 037) |
| `dt_voyage_schedule` | 항해 스케줄 | (마이그레이션 043) |

**상태값 (voyage_wishes):**
- draft_created → booking_pending → booking_confirmed → boarding_checked_in → voyage_in_progress → voyage_completed → star_created

**금액 로직:**
- 주중(월-금): 60,000원
- 주말(토-일): 89,000원

#### API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/voyage/wish` | 소원 생성 (비로그인, session_key 생성) |
| GET | `/api/voyage/wish/:id` | 소원+예약 조회 |
| POST | `/api/voyage/booking` | 예약 생성 |
| POST | `/api/voyage/payment/checkout` | 결제 요청 (NicePay) |
| POST | `/api/voyage/payment/confirm` | 결제 확인 |
| GET | `/api/voyage/:wish_id/status` | 항해 상태 화면 데이터 |
| POST | `/api/voyage/:wish_id/reflection` | 회고 저장 (lighter/clearer/braver) |
| POST | `/api/voyage/:wish_id/star` | 별 생성 (challenge 은하) |

**세션 식별 방식:**
- Header: `x-session-key`
- Cookie: `dt_session`
- Body: `session_key`
- Fallback: `crypto.randomUUID()` 생성

**사용자 식별:**
- 비로그인 세션 기반 (phone + booking_date + session 조합)
- 결제 후 phone 기록

#### 파트너/호텔 식별
- **하드코딩 상태:** 현재 Yeosu 1개 location만 지원
- **가격:** 위도(booking_date)만 고려, 호텔별 다른 가격 없음
- **추천 로직:** 없음 (FIT only, 그룹 대상 없음)

---

### 1.2 FLOW 시스템 (이벤트 로그 + KPI)

#### 코드 위치
- **Migration:** `database/migrations/091_dreamtown_flow.sql`, `094_dreamtown_flow_add_stages.sql`
- **Service:** `services/` (로깅 담당 서비스 - 명시적 통합 부재)
- **References in server.js:** **0개** (드라마틱한 발견)

#### 데이터베이스

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `dreamtown_flow` | 전체 흐름 이벤트 로그 | user_id, stage, action, value (JSONB), ref_id, session_id, created_at |

**Stage 열거값 (Migration 094까지):**
- wish, star, growth, resonance, impact, connection, experiment, recommendation

**KPI 집계 뷰:**
```sql
dreamtown_kpi_7d
  - wish_count
  - star_count
  - star_creation_rate (%)
  - growth_day1_count
  - growth_day7_count
  - growth_persist_rate (%)
  - resonance_user_count
  - total_active_users
  - resonance_rate (%)
```

#### 현재 상태

| 찾은 것 | 결과 |
|--------|------|
| server.js에서 dreamtown_flow 참조 | 0개 |
| voyage 이벤트 로깅 호출 | 없음 |
| flow 초기화 코드 | 없음 |
| flow 조회/분석 엔드포인트 | 없음 |

**결론:** dreamtown_flow는 **설계상만 존재하고 실제로는 통합되지 않음**.

---

### 1.3 RAMADA V23 시스템 (쿠폰/혜택 관리)

#### 런타임 환경
- **플랫폼:** ChatGPT Sites (Cloudflare Workers + D1)
- **URL:** https://ramada-yeosu-starlight-route.sejinlee.chatgpt.site/
- **Database:** Cloudflare D1 (SQLite)
- **Internal Commit:** 4f8ccb37d58cda12731920eaf63b26d8508925ab

#### 데이터베이스 (D1/SQLite)

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `benefit_coupons` | 혜택 쿠폰 | coupon_id, partner_id, partner_name, benefit_id, status, is_test, issue_time, used_time, expired_at |

**Status 열거값:**
- ISSUED → USED / EXPIRED / REVOKED

#### API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/coupons/issue` | 쿠폰 발급 |
| GET | `/api/coupons` | 쿠폰 목록 (is_test=false만) |
| POST | `/api/coupons/:id/redeem` | 쿠폰 사용 |
| GET | `/api/admin/coupons` | 관리자 전체 목록 (is_test 포함) |
| POST | `/api/admin/coupons/create` | 관리자 쿠폰 생성 |
| PATCH | `/api/admin/coupons/:id` | 상태 변경 |
| GET | `/api/admin/audit` | 감사 로그 |

#### 현재 상태

| 항목 | 상태 |
|-----|------|
| daily-miracles-mvp와 통합 | ❌ 없음 |
| sowon-dreamtown과 통합 | ❌ 없음 |
| Voyage와 연결 | ❌ 없음 |
| Customer Storybook 구현 | ❌ Phase 2 후연 |
| 다중 호텔 지원 | ❌ Yeosu만 |

---

## 2. 현재 연결 상태

### 2.1 VOYAGE → FLOW 연결

```
예상 흐름:
voyage_wishes (생성) 
  → dreamtown_flow.stage='voyage', action='wish_created'
voyage_bookings (예약 확정)
  → dreamtown_flow.stage='voyage', action='booking_confirmed'
voyage (결제 완료)
  → dreamtown_flow.stage='voyage', action='payment_confirmed'
  → /api/voyage/:wish_id/star (별 생성)
  → dreamtown_flow.stage='star', action='voyage_star_created'

실제:
[연결 없음] dreamtown_flow는 로깅 대상이 아님
```

### 2.2 VOYAGE → RAMADA V23 연결

```
예상 흐름 (Phase 2):
voyage_bookings (booking_confirmed 후)
  → benefit_coupons (쿠폰 자동 발급)
  → 여행객에게 쿠폰 배포
  
현재:
[연결 없음] V23는 ChatGPT Sites에서만 실행, API 연결 없음
```

### 2.3 Voyage 내부 연결

✅ **동작:**
- voyage_wishes.session_key 생성 → 예약 추적
- voyage_bookings.wish_id (FK) → 역추적
- NicePay 결제 → voyage_bookings.pg_order_id 기록
- 결제 확인 후 voyages 테이블 생성
- 별 생성 (voyage_wishes.star_id ← dt_stars.id)

⚠️ **미흡:**
- dreamtown_flow에 voyage 이벤트 기록 없음
- Voyage 통계/분석 뷰 없음
- Voyage-specific KPI 없음

---

## 3. 데이터 중복 분석

### 3.1 사용자 식별자 충돌

| 시스템 | 사용자 식별 방식 | 저장소 | 유효 범위 |
|--------|-----------------|-------|----------|
| Voyage | session_key (UUID) | voyage_wishes.session_key | 예약 추적 |
| Voyage | phone | voyage_bookings.phone | 예약 완료 후 |
| DreamTown Core (dt_stars) | user_id (TEXT) | dt_stars.user_id | 로그인 사용자 |
| FLOW | user_id (TEXT) | dreamtown_flow.user_id | 이벤트 추적용 |

**문제:**
- Voyage는 비로그인 session_key 기반
- DreamTown Core는 user_id 기반
- 별 생성 시 voyage_wishes.star_id ← dt_stars.id 저장되지만, **user_id 매핑 없음**
- 결과: Voyage 별이 dt_stars에 도입되어도 FLOW에서 추적 불가 (user_id 부재)

### 3.2 별(Star) 데이터 중복 위험

| 항목 | daily-miracles `dt_stars` | Voyage별 | 설명 |
|-----|---------------------------|---------|------|
| PK | id (UUID) | voyages.star_id (FK) | 각자 독립 |
| 생성 경로 | `/api/dt/stars/create` | `/api/voyage/:wish_id/star` | 분기 |
| Galaxy | galaxy_id (은하 4+1종) | challenge 고정 | Voyage는 북은하만 |
| 연계 | wish_id 참조 없음 | voyage_wishes.star_id | 단방향만 연결 |

**현재 상태:** 분리된 별 저장소 (충돌 없음)

**통합 시 위험:** Voyage 별과 Core 별을 동일 테이블에 저장할 경우, 생성 경로 다중화 + 통계 혼재

### 3.3 결제 정보 이중 기록

| 필드 | voyage_bookings | voyages | nicepay_payments |
|-----|-----------------|---------|------------------|
| order_id | pg_order_id | pg_order_id | order_id (PK) |
| 결제상태 | status | status | status (PAID/FAILED/...) |
| 결제 시간 | paid_at | - | paid_at |

**현재:** 세 테이블이 각각 결제 정보 기록
- voyage_bookings: 예약 + 결제 결합
- voyages: 케이블카 별 항해 + 결제
- nicepay_payments: 결제 원장 (SSOT)

**위험:** pg_order_id 일치하지 않을 경우 reconciliation 불가

---

## 4. 책임 범위 맵

### 4.1 현재 책임 경계 (READ-ONLY 관점)

```
┌─ Voyage 시스템 (routes/voyageRoutes.js) ────────┐
│                                                  │
│  • 소원 입력 (비로그인)                           │
│  • 예약 생성 (고객명, 전화, 날짜)                 │
│  • 결제 요청/확인 (NicePay)                       │
│  • 별 생성 (challenge 은하)                      │
│  • 회고 저장 (reflection)                        │
│                                                  │
│  DB 소유: voyage_wishes, voyage_bookings, voyages
│  식별자: session_key (여정 추적 핵심)            │
└──────────────────────────────────────────────────┘

┌─ FLOW 시스템 (migrations/091, 094) ───────────┐
│                                                │
│  [설계상] 전체 DreamTown 이벤트 로그             │
│  [실제] 미통합 상태                            │
│                                                │
│  DB 소유: dreamtown_flow (SSOT로 선언됨)       │
│  실행: 없음 (server.js에 0개 호출)             │
└────────────────────────────────────────────────┘

┌─ RAMADA V23 (Cloudflare D1) ─────────────────┐
│                                              │
│  • 쿠폰 발급/추적                            │
│  • 파트너 혜택 관리                          │
│  • 관리자 오버사이트                         │
│                                              │
│  DB 소유: benefit_coupons (D1 SQLite)       │
│  통합: 없음 (별도 런타임)                    │
└──────────────────────────────────────────────┘
```

### 4.2 소유권 충돌 없음 (긍정적 발견)

| 책임 | 소유자 | 근거 |
|-----|--------|------|
| 항해 예약 | Voyage | voyage_bookings 테이블 전담 |
| 항해 별 생성 | Voyage | voyages 테이블 전담 |
| 이벤트 로그 | FLOW (명시) | dreamtown_flow 테이블 정의 |
| 쿠폰 관리 | RAMADA V23 | benefit_coupons (D1) 전담 |
| 결제 원장 | NicePay | nicepay_payments (SSOT) |

---

## 5. DreamTown Orchestrator를 통한 최소 통합 구조

### 5.1 핵심 원칙

**"기존 기능 보존 + 명시적 계약만 추가"**

1. **Voyage 변경 없음:** voyage_wishes, voyage_bookings, voyages 구조 유지
2. **FLOW 실제 통합:** 이벤트 로깅만 추가 (데이터 구조 변경 없음)
3. **RAMADA V23 분리:** ChatGPT Sites → Express 마이그레이션은 별도 Phase
4. **Orchestrator 역할:** 단계별 이벤트 흐름만 조율 (상태 변경 감지 + 로깅)

### 5.2 제안 구조: Event-Driven 아키텍처

```
┌─ Voyage Routes (기존) ─────────────┐
│                                    │
│  POST /api/voyage/booking          │
│    → voyage_bookings (INSERT)      │
│    → [NEW] emit('booking_created') │
│                                    │
│  POST /api/voyage/:id/payment...   │
│    → voyage_bookings UPDATE        │
│    → [NEW] emit('payment_confirmed')
│                                    │
│  POST /api/voyage/:id/star         │
│    → dt_stars (INSERT)             │
│    → voyages (INSERT)              │
│    → [NEW] emit('voyage_complete') │
└────────────────────────────────────┘
                ↓ (event publish)
     ┌──────────────────────────┐
     │ DreamTown Orchestrator    │
     │ (dtOrchestrator)          │
     │                           │
     │ • Event listener (3개)    │
     │ • FLOW writer (3개 call)  │
     └──────────────────────────┘
                ↓ (insert)
     ┌──────────────────────────┐
     │ dreamtown_flow           │
     │ (이벤트 로그 저장)         │
     └──────────────────────────┘

Phase 2 (미래):
     FLOW → RAMADA V23
     (쿠폰 자동 발급 워크플로우)
```

### 5.3 최소 구현: 3개 이벤트 리스너

#### 이벤트 1: booking_created
```javascript
// Voyage → Orchestrator
{
  event: 'voyage.booking_created',
  voyage_wish_id: UUID,
  session_key: string,
  customer_name: string,
  phone: string,
  timestamp: ISO8601
}

// Orchestrator → FLOW
INSERT INTO dreamtown_flow (user_id, stage, action, value, ref_id)
VALUES (
  phone,                    // user_id (잠시적)
  'voyage',                 // stage
  'booking_created',        // action
  {wish_id, session_key},   // value (JSONB)
  voyage_wish_id            // ref_id
)
```

#### 이벤트 2: payment_confirmed
```javascript
// Voyage → Orchestrator
{
  event: 'voyage.payment_confirmed',
  voyage_wish_id: UUID,
  pg_order_id: string,
  amount: number,
  timestamp: ISO8601
}

// Orchestrator → FLOW
INSERT INTO dreamtown_flow
VALUES (phone, 'voyage', 'payment_confirmed', {order_id, amount}, voyage_wish_id)
```

#### 이벤트 3: voyage_completed
```javascript
// Voyage → Orchestrator
{
  event: 'voyage.completed',
  voyage_wish_id: UUID,
  star_id: UUID,           // dt_stars.id
  timestamp: ISO8601
}

// Orchestrator → FLOW
INSERT INTO dreamtown_flow
VALUES (phone, 'voyage', 'star_created', {star_id}, voyage_wish_id)

// [Future] Phase 2
// RAMADA V23 coupon auto-issue
// POST https://ramada-v23.../api/admin/coupons/create
// {phone, benefit_tier: 'voyage', voyage_wish_id}
```

### 5.4 식별자 매핑 전략 (Phase 2)

현재 **Voyage는 비로그인 session_key 기반이므로**, user_id 통합은 불가능:

```
현재 상태:
  voyage_wishes.session_key (UUID) → 임시 추적
  voyage_bookings.phone (결제 후) → 영구 식별

Phase 1 (권장):
  FLOW에서 phone을 user_id로 사용 (매우 임시)
  "voyage별 사용자 = phone 기반"

Phase 2 (미래):
  앱 로그인 기능 추가 시
  voyage_wishes.user_id 컬럼 추가
  voyage_bookings.user_id 추가
  → 그때 FLOW와 완전 통합 가능

지금은 추가 마이그레이션 불필요
```

### 5.5 권장되지 않는 접근 방식

❌ **voyage_bookings.user_id 추가** (현재)
- Voyage는 비로그인 세션 기반
- 앱 로그인 없이 user_id를 채울 수 없음
- 데이터 무결성 위험

❌ **FLOW와 voyage 테이블 병합**
- Voyage는 예약/결제 도메인
- FLOW는 이벤트 로그 도메인
- 책임 분리 원칙 위배

❌ **D1을 Express로 마이그레이션** (현재)
- Phase B 미결정
- RAMADA V23 이미 production
- 높은 리스크

---

## 6. 위험 평가

### 6.1 기술 위험

| 위험 | 수준 | 원인 | 대응 |
|-----|-----|------|------|
| voyage_bookings pk_order_id 불일치 | 🟡 MED | nicepay_payments와 키 매칭 안 됨 | Phase 1에서 reconciliation 쿼리 추가 |
| FLOW user_id=phone (임시) | 🟡 MED | 비로그인 기반 시스템 | Phase 2에서 user_id 컬럼 추가 |
| voyages.star_id로 tracking 불완전 | 🟢 LOW | 별 생성 연계만 하고 history는 별도 | dt_stars에 voyage_id 역참조 컬럼 고려 |
| RAMADA V23 API 미정의 | 🔴 HIGH | Cloudflare Workers 커스텀 | Phase 2 결정 전까지 영향 없음 |

### 6.2 데이터 무결성

| 검증 항목 | 현재 | 조치 |
|---------|-----|------|
| voyage_bookings.wish_id (FK) | ✅ | 유지 |
| voyages.star_id (FK) | ⚠️ 약함 | 인덱스 추가 고려 |
| pg_order_id 추적 | ⚠️ | 쿼리 테스트 필요 |
| FLOW 이벤트 순서 | N/A | Orchestrator에서 보장 |

### 6.3 운영 위험

| 위험 | 현상 | 대응 |
|-----|-----|------|
| Voyage 통계 부재 | KPI 추적 안 됨 | Phase 1: FLOW 로깅만 해도 개선 |
| 결제 reconciliation 복잡 | 수동 감사 필요 | Phase 2: 자동 검증 스크립트 |
| 비로그인 세션 tracking 한계 | 사용자 추적 불가 | 앱 로그인 기능 우선순위 조정 |

---

## 7. 구현 타임라인 제안

### Phase 1 (1주): FLOW 기본 통합
```
□ orchestrator/flowWriter.js 신규
□ routes/voyageRoutes.js에 3개 emit() 추가 (변경 최소화)
□ Orchestrator listener 등록
□ FLOW 로깅 테스트 쿼리
□ 문제 시 롤백 용이한 구조
```

**목표:** Voyage 이벤트가 dreamtown_flow에 기록되는 증명

### Phase 2 (TBD): RAMADA V23 연결
```
□ V23 API 확정 (POST /api/coupons/issue)
□ Phase B 데이터베이스 아키텍처 결정
□ Voyage → Coupon 워크플로우 설계
□ 결제 확정 후 자동 쿠폰 발급
```

**의존성:** RAMADA V23 마이그레이션 결정 필요

### Phase 3 (미래): 사용자 식별자 통합
```
□ Voyage 앱 로그인 기능
□ voyage_wishes.user_id 마이그레이션
□ FLOW ← → Voyage 완전 추적
```

---

## 부록: 검증 체크리스트

**현재 상태 확인:**
- [ ] voyage_wishes 테이블 조회 (행 수)
- [ ] voyage_bookings.pg_order_id → nicepay_payments 추적
- [ ] Voyage 별 생성 시 dt_stars.id 기록 확인
- [ ] dreamtown_flow 쿼리 실행 (현재 행 수)
- [ ] RAMADA V23 benefit_coupons 테이블 구조 확인

**Phase 1 구현 후:**
- [ ] Voyage 예약 생성 → dreamtown_flow INSERT 확인
- [ ] FLOW 쿼리로 voyage 예약 이벤트 조회 가능
- [ ] 별 생성 후 flow.ref_id = dt_stars.id 일치 확인
- [ ] Rollback 가능 (원래 코드로 복원)

**Phase 2 준비:**
- [ ] RAMADA V23 Phase B 결정 
- [ ] benefit_coupons 스키마 최종 확정
- [ ] API 계약서 작성

---

**문서 작성:** Claude Code (READ-ONLY 분석)  
**승인 대기:** 아키텍처 리뷰 및 Phase 1 고시
