# DreamTown CRITICAL Security Remediation Plan V0.1

**Date:** 2026-09-12  
**Authority:** Security Archaeology Audit + DreamTown Leadership Decision  
**Effective:** Immediate

---

## 📜 DreamTown Security Constitution

### 제1조: 소유권 원칙

**DreamTown은 소원이의 삶을 소유하지 않는다.**

우리는 소원이가 맡긴 이야기를 보호할 책임만을 위임받는다.

### 제2조: 최소 필요 원칙

**도움을 위해 필요하지 않은 정보는 보지 않는다.**

- 볼 수 있다고 해서 보지 않고
- 알고 있다고 해서 말하지 않으며
- 할 수 있다고 해서 실행하지 않는다

---

## 우선순위 재배열 (P0 ~ P2)

### P0 — 즉시 차단 대상 (0~24시간)

**4개 Critical 취약점. 이것이 닫히기 전까지 신규 기능 배포 금지.**

#### P0-1: Cross-User Isolation 부재
```
현상:     ID를 알면 다른 소원이 데이터 접근 가능 (4개 endpoint)
영향:     Privacy violation, personal narrative exposure
차단:     GET /api/stars/:id, /voyage/wish/:id, /storybook/orders/:id, POST /booking
목표:     모든 개인 데이터 조회에 Authentication + Owner verification 필수

구조:
  Authentication
      ↓
  CURRENT_SOWON_ID 확인
      ↓
  REQUESTED_RESOURCE 소유권 확인
      ↓
  ALLOW / DENY (403)

Release Gate:
  [ ] User A → User B의 star_id → 403
  [ ] User A → User B의 wish_id → 403
  [ ] User A → User B의 storybook → 403
  [ ] Cross-user leakage 0건
```

#### P0-2: Booking Owner Verification 없음
```
현상:     User A가 User B의 wish를 이용해 예약 생성 가능
영향:     Fraudulent booking, unauthorized transaction
해결:     POST /api/voyage/booking에 wish owner check 추가

구조:
  AUTHENTICATION
      ↓
  WISH_OWNER_CHECK (req.user === wish.owner_sowon_id)
      ↓
  CURRENT_STATE_CHECK (wish still valid?)
      ↓
  RESOURCE_AVAILABILITY (final check)
      ↓
  PRICE_VALIDATION (server-verified)
      ↓
  USER_CONFIRMATION
      ↓
  BOOKING_CREATE

원칙:
  - Client input을 신뢰하지 않음
  - 가격, 상품, 상태 모두 server-verified
  - SOYEOWOOL도 동일 gate를 통과

Release Gate:
  [ ] Booking always requires wish ownership
  [ ] Price server-verified (not client)
  [ ] SOYEOWOOL booking also requires auth
```

#### P0-3: Admin Bypass (?admin=true) 즉시 제거
```
현상:     Query parameter로 관리자 권한 우회 가능
영향:     Unauthorized admin action
해결:     Client input 무시, server-side role check 필수

구조:
  Authentication (JWT/Session)
      ↓
  Server-side Identity (sowon_id, role)
      ↓
  Role / Permission (role == 'admin'?)
      ↓
  Admin Policy (scope == 'quote:approve'?)
      ↓
  ALLOW / DENY + AUDIT

원칙:
  - ?admin=true는 있어도 영향 없음
  - Admin 권한은 DB/JWT에서만
  - 관리자 요청은 더 강한 감사 log

Release Gate:
  [ ] ?admin=true 무시됨
  [ ] Admin 권한은 server-side role만
  [ ] Admin action audit 100%
```

#### P0-4: Overbooking 가능 (예약 전 최종 재검증)
```
현상:     Recommendation 시 '있음'이었는데 booking 시 '없을 수 있음'
영향:     Hotel partnership breach, customer complaint, payment without room
해결:     예약 직전 final availability recheck 필수

구조:
  Recommendation (14:00: 2실 available)
      ↓ user selection
      ↓
  🔐 FINAL AVAILABILITY RECHECK (14:05: 1실 remaining?)
      ↓
  HOLD (temporary reservation for 5min)
      ↓
  BOOKING_CONFIRM

원칙:
  - FLOW 전체 설계는 나중에
  - 하지만 거래 직전 재검증은 P0
  - "Available" → "Hold" → "Book" 단계 필요

Release Gate:
  [ ] Booking 전 availability recheck 실행
  [ ] Overbooking 0건
  [ ] Hold timeout mechanism 테스트
```

---

### P1 — 1주 내 해결 (24h~1week)

#### P1-1: Immutable Audit Trail
```
현상:     Admin/sensitive access 기록 없음. 사고 시 누가 무엇을 했는지 불명
영향:     Insider threat 미탐지, regulatory violation
해결:     Append-only audit log 구현

기록 대상:
  - 개인 서사 (journey_logs, wish_text, promises)
  - 관리자 조회 (any admin action)
  - 예약 변경 (booking modify/cancel)
  - 환불 (refund trigger)
  - Partner 가격 조회 (cost_price access)
  - Secret 관련 (key rotation, access)
  - Aurora 연구 (data access for research)
  - 소여울맥 장기정보 (access MAEK)

기록 구조:
  actor: sowon_id / admin_id
  action: READ / WRITE / DELETE / EXECUTE
  resource: table_name or MAEK field
  scope: specific_column or permission
  purpose: business reason
  result: ALLOW / DENY
  timestamp: ISO 8601
  source: ip / service
  severity: NORMAL / HIGH / CRITICAL

원칙:
  - 감사 대상자는 자신의 로그를 지울 수 없음
  - Append-only 강제 (delete금지)
  - Separate from application logs
  - 장기 retention (최소 2년)

Release Gate:
  [ ] Audit table 별도 분리
  [ ] 민감 action 100% 기록
  [ ] Admin log delete 불가 보장
  [ ] Audit log integrity test
```

#### P1-2: Secrets 코드·개발자·LLM으로부터 분리
```
현상:     .env plaintext on local machine (또는 Git history, backup)
영향:     Device/repo 침해 → full system compromise
해결:     Secret vault + credential rotation

분류:
  L6-SEC-001: DATABASE_URL
  L6-SEC-002: NICEPAY_MERCHANT_KEY
  L6-SEC-003: OPENAI_API_KEY
  L6-SEC-004: SMS_API_KEY
  L6-SEC-005: SUPABASE_KEY
  L6-SEC-006: CLOUDFLARE_TOKEN
  L6-SEC-007: RENDER_API_TOKEN
  L6-SEC-008: JWT_SECRET
  L6-SEC-009: WEBHOOK_SECRET
  L6-SEC-010: Other credentials

원칙:
  - Git에 없음
  - LLM context에 없음
  - Log에 없음
  - 문서에 값 없음
  - 최소 scope (per-service ideal)
  - Service별 분리 (one leak ≠ all)
  - Rotation 가능

Target Design:
  Application
      ↓ (no credential)
  Trust Broker
      ↓ (request: "I need DB access for SELECT")
  Secret Vault
      ↓ (returns only needed credential)
  Service execution

Release Gate:
  [ ] .env 평문 제거 (vault migration)
  [ ] LLM context secret 0건
  [ ] Log에 secret 0건
  [ ] Service 간 credential 분리
  [ ] Secret rotation 가능성 확인
```

---

### P2 — 2~4주 내 설계 (구조적)

#### P2: Monolithic Blast Radius 줄이기
```
현상:     한 key = 모든 서비스 = 모든 데이터 (monolithic architecture)
영향:     One compromise → total system failure
목표:     Vault-based compartmentalization

설계 (장기):
  IDENTITY_VAULT (sowon_id, session, access_key)
      ↓ Trust Broker
  MAEK_VAULT (journey context, promises, opens)
      ↓ Trust Broker
  COMMERCE_VAULT (bookings, payments, quotes)
      ↓ Trust Broker
  PARTNER_VAULT (rates, allocations, settlements)
      ↓ Trust Broker
  SECURITY_VAULT (audit log, incident response)
      ↓ Trust Broker
  AURORA_VAULT (approved nutrient only, no raw data)

원칙:
  - 한 금고 열려도 도시 전체 열리지 않음
  - SOYEOWOOL도 모든 credential을 가지지 않음
  - SOYEOWOOL → Trust Broker: "need MAEK OPEN_THREAD"
  - Trust Broker → SOYEOWOOL: minimal context returned

Release Gate:
  [ ] Vault boundaries 정의됨
  [ ] Trust Broker interface design 완료
  [ ] Service 간 credential 독립적
  [ ] Incident: one service breach ≠ all
```

---

## Aurora3/5 구현 선행조건

**Aurora3/5 개발을 시작하기 전에 반드시 다음을 보장해야 한다:**

```
RAW_MAEK_ACCESS = PROHIBITED (구조적 보장)

Aurora가 요청 가능한 것:
  "SW-123의 인생을 줘"         ❌ DENIED
  
Aurora가 요청 가능해야 할 것:
  "관계 회복 소원에서 작은 행동과 결과의 
   비식별 패턴을 연구할 데이터셋을 요청"  ✓ ALLOWED (with gate)

Pipeline:
  Personal World (raw MAEK)
      │
      X ← direct access prohibited
      │
  Privacy / Consent Gate
      ├─ User opted in?
      ├─ Data sensitivity high?
      └─ Purpose legitimate?
      ↓
  De-identification Service
      ├─ Remove personal identifiers
      ├─ Generalize specifics
      └─ Add noise if needed
      ↓
  Research Workspace
      (sanitized dataset only)
      ↓
  Aurora3 / Aurora5
      (analysis on de-identified data)
      ↓
  Safety / Quality Gate
      ├─ No re-identification risk?
      ├─ Bias checking?
      └─ Consent still valid?
      ↓
  Approved Nutrient
      (safe for publication / feedback)
```

---

## 보안팀 구성 (BUILD vs SHIELD)

### 두 개의 독립적인 Track

```
BUILD TRACK
└─ "어떻게 더 좋은 기능을 만들 것인가?"
   ├─ Product owner
   ├─ Engineering team
   └─ QA (feature testing)

SHIELD TRACK (독립적, 배포 권한 있음)
└─ "이 기능이 사람·파트너·DreamTown을 해칠 가능성은 없는가?"
   ├─ Security architect
   ├─ Compliance officer
   ├─ Security QA (attack testing)
   └─ Audit trail reviewer
```

### SHIELD의 권한

- Release VETO (배포 중단 권한)
- Security gate define (위험 기준 정의)
- Critical remediation prioritize (보안 우선순위 결정)
- Post-deploy verification (배포 후 검증)

**원칙:** Product/Sales가 SHIELD decision을 override하지 않는다.

**예시:**
```
Engineering: "SOYEOWOOL MVP 완성했습니다."
SHIELD: "Cross-user Critical Test FAIL → Release NO"
→ 배포 불가 (override 불가)
```

---

## Security Release Gate (11개)

**Kenny SOYEOWOOL Pilot 전에 모두 PASS 필수.**

| Gate | 기준 | Status |
|------|------|--------|
| 1. Cross-user isolation | Critical 0건 | [ ] |
| 2. Admin bypass | 0건 | [ ] |
| 3. Unauthorized write | 0건 | [ ] |
| 4. Booking ownership | 100% verified | [ ] |
| 5. Availability final check | 필수 실행 | [ ] |
| 6. Secret in response/log | 0건 노출 | [ ] |
| 7. PII cross-user leak | 0건 | [ ] |
| 8. Partner confidential leak | 0건 | [ ] |
| 9. Security secret to LLM | 0건 | [ ] |
| 10. Audit coverage | 민감 action 100% | [ ] |
| 11. Kill switch | 테스트 PASS | [ ] |

**모두 PASS 전까지 SOYEOWOOL은 실제 고객 데이터 접근 금지.**

---

## Timeline

### Phase 0: Containment (0~24h)

```
[ ] P0-1: Cross-user isolation (4 endpoint auth + owner verify)
[ ] P0-2: Booking owner verification
[ ] P0-3: Admin bypass ?admin=true 제거
[ ] Danger endpoint 임시 차단 검토
[ ] Rollback plan 준비
```

### Phase 1: Transaction Integrity (24h~72h)

```
[ ] P0-4: Availability final recheck
[ ] Payment webhook idempotency 검증 + fix
[ ] Benefit duplicate redemption check
[ ] Admin authorization regression
```

### Phase 2: Visibility (1 week)

```
[ ] P1-1: Immutable audit trail 구현
[ ] Secret monitoring setup
[ ] Secret inventory 완료
[ ] PII logging 제거
```

### Phase 3: Isolation (2~4 weeks)

```
[ ] Vault boundaries 정의
[ ] Service credentials 분리
[ ] Trust Broker 설계 시작
[ ] SOYEOWOOL security gate 정의
[ ] Kill switch 구현
```

### Phase 4: Future (month 2~3)

```
[ ] Aurora Nutrient gate 설계
[ ] Red team 100+ scenarios
[ ] Crypto agility
[ ] PQC roadmap
[ ] External security audit
```

---

## 최종 원칙

### DreamTown은 약속의 시스템이다

```
소원이: "내 삶을 기억해달라"
DreamTown: "함께 기억하겠습니다"

이 약속이 있으려면:
  ✓ 더 많은 데이터 = 더 큰 보호의무
  ✓ 신뢰를 위임받은 = 신뢰를 지킬 책임
  ✗ 신뢰를 받은 = 신뢰를 활용할 권리 (X)
```

### 보안은 feature가 아니라 기초다

```
개발팀의 질문: "어떤 기능을 넣을까?"
보안팀의 질문: "이미 가진 신뢰를 지킬까?"

신뢰 > 기능
```

---

## Sign-Off

**이 Plan을 수용하고 실행함을 확인한다.**

- DreamTown Leadership: ✓ (사용자 승인)
- Security Audit Team: ✓ (완료)
- Engineering Lead: (구현 시 확인)
- SHIELD Team Lead: (구성 시 확인)

**Effective Date:** 2026-09-12 (Immediate)

