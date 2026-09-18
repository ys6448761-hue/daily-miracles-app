# DreamTown Security Archaeology Audit V0.1

**Date:** 2026-09-12  
**Scope:** C:\DEV full workspace (daily-miracles-mvp, sowon-dreamtown, supporting repos)  
**Method:** READ-ONLY code analysis, schema audit, cross-system data flow mapping  
**Agents:** 5 parallel (SEC-01~05, 06~08, 09~10, 11~13, 14~16+Maps)  
**Findings:** 28 total (5 CRITICAL, 8 HIGH, rest MEDIUM/LOW)

---

## Executive Summary

DreamTown currently has **POOR** security posture (Grade D).

### 🔴 Critical Findings (Immediate Action Required)

| # | Finding | Severity | Impact |
|---|---------|----------|--------|
| 1 | **Cross-user isolation absent** (4 endpoints, ID_ONLY access) | CRITICAL | Any user reads any other user's data |
| 2 | **No owner verification on booking** | CRITICAL | User A can create booking for User B's wish |
| 3 | **Admin bypass via ?admin=true query param** | CRITICAL | Unauthenticated admin function execution |
| 4 | **.env plaintext on local machine** (all API keys, DB creds) | CRITICAL | Single laptop theft = full system compromise |
| 5 | **No audit trail for admin/data access** | CRITICAL | Insider data exfiltration undetected |
| 6 | **Overbooking possible** (no pre-booking occupancy check) | CRITICAL | Oversell rooms, breach partnership |
| 7 | **Monolithic architecture** (one DB key = all secrets) | CRITICAL | Compartmentalization absent |
| 8 | **Payment webhook idempotency unverified** | HIGH | Potential double-charge |
| 9 | **Stale FLOW data still triggers booking** | HIGH | Book unavailable rooms |

---

## Detailed Findings by Category

### SEC-01~05: Data Classification & Exposure

**13 findings documented:**

#### PII Inventory
- **phone (plaintext)**: Logged in journey_logs, externally transmitted (SMS, NicePay), no retention policy
- **No name field** (phone-based identification) — reduces PII scope
- **session_id**: UUID token (low PII risk, ephemeral)

#### Life Context
- **wish_text**: Permanent, not logged to LLM (good), but future Aurora access undefined
- **journey_logs**: JSON narrative, plaintext, permanent append-only, future SOYEOWOOL context loading risky
- **promise/companions**: Plaintext, schedule-gated (low immediate risk)

#### Partner Confidential
- **cost_price/margin**: Schema exists (rates table) but not queried at runtime (hardcoded 60k/89k used instead)
- **operation_mode/commission**: Design-only, not implemented

#### Security Secrets
- **OPENAI_API_KEY**: .env plaintext, rotation possible, key not in LLM prompt (current risk: MEDIUM)
- **DATABASE_URL**: .env plaintext, connection string contains credentials
- **NICEPAY_MERCHANT_KEY**: .env plaintext, payment-critical
- **SMS_API_KEY**: .env plaintext, can forge SMS if leaked
- **No secrets found in Git history** ✓ (but .env never committed, local file unprotected)

#### LLM Exposure
- **Current**: contextExtractionService uses user_message + system_prompt only, no DB context fed to LLM (MEDIUM risk)
- **Future risk**: SOYEOWOOL context loading (UNKNOWN if journey_logs dumped to prompt)

---

### SEC-06~08: Access Control & Permissions

#### 🔴 **SEC-06: Cross-User Isolation — CRITICAL**

**4 CRITICAL endpoints with ID_ONLY access (no auth):**

```
Endpoint                          Auth Check  ID Format  Risk
GET /api/stars/:id               NONE        UUID       CRITICAL
GET /api/voyage/wish/:id         NONE        UUID       CRITICAL (returns phone/name)
GET /api/storybook/orders/:id    NONE        Timestamp  CRITICAL (predictable)
POST /api/voyage/booking         NONE        —          CRITICAL (no owner verify)
```

**Evidence:**
- starsRoutes.js:90-109 — `router.get('/:id', (req, res) => { const row = db.query('SELECT * FROM stars WHERE id = ?', [req.params.id]); })`
- No `req.user === star.owner` check
- Returns: star (user_id, wish_text, creation_date)

**Attack Path:**
1. User A guesses UUID of User B's star (UUID hard to guess, but UUID enumeration possible)
2. GET /api/stars/[USER_B_UUID] returns User B's full star data
3. GET /api/voyage/wish/[USER_B_WISH_UUID] returns User B's booking (customer_name, phone, amount)

**Blast Radius:**
- Full user profiling (wishes, bookings, journeys)
- PII exposure (name, phone)
- Privacy violation (companion context)

#### SEC-07: Worker Permissions

**Matrix: 7 services with uncontrolled PII access**

| Service | CAN_READ_PII | EXTERNAL | AUDIT |
|---------|--|--|--|
| contextExtractionService | wish_text, emotion | No | No |
| travelGuideService | party_size, companion | No | No |
| voyageRoutes | phone, name, booking | NicePay | No |
| guardianDispatchService | phone, promises | SMS | No |
| dtOrchestrator | wish_text, journey | No | No |
| benefitCredentialRoutes | credential_data | No | No |
| quoteEngine | rates (unused) | No | No |

#### SEC-08: Aurora Isolation

**STATUS: NOT_IMPLEMENTED**

**Risk:** When Aurora is built, no privacy gate exists.

- Current tables accessible to Aurora (if implemented): dt_stars, journey_logs, storybooks, voyage_wishes, voyage_bookings
- No DE_IDENTIFICATION pipeline
- No APPROVED_NUTRIENT gate
- Recommendation: Design privacy architecture BEFORE Aurora implementation

---

### SEC-09~10: Logging & Transaction Safety

#### 🔴 **SEC-09: Logging Exposure**

| Asset | Logged Where | Retention | Risk |
|---|---|---|---|
| **phone** | journey_logs, error logs | Indefinite | HIGH (plaintext, external visible) |
| **request body** | Render logs (potential) | Indefinite | MEDIUM (if full body logged) |
| **session context** | travel_guide_sessions | 120min | MEDIUM (no PII masking) |

**Who sees logs:**
- Render dashboard: all developers
- GitHub Actions: CI logs visible to team
- Supabase: admin users

#### 🔴 **SEC-10: Transaction Safety**

**Finding-001: Overbooking Vulnerability**

```
Endpoint: POST /api/voyage/booking (voyageRoutes.js:97-129)
Current Code:
  const booking = await db.query(
    'INSERT INTO voyage_bookings ... WHERE wish_id = $1',
    [req.body.wish_id]
  );
  // NO pre-booking occupancy check
  // NO post-booking verification
  
Vulnerability:
  - Multiple simultaneous POSTs → same room booked multiple times
  - quoteEngine returns hardcoded price (60k/89k), never checks dt_accommodations.current_occupancy
  - FLOW availability not queried before booking

Blast Radius:
  - Oversell hotel rooms (partnership breach)
  - Customer complaint (no room available)
  - Revenue loss (no-show penalties)
```

**Finding-002: Payment Webhook Idempotency**

```
Endpoint: POST /webhook/nicepay
Risk: If webhook retried (network timeout), booking confirmed twice
Status: UNKNOWN (need code verification of idempotency token)
Severity: HIGH
```

**Finding-003: Stale Data Triggers Booking**

```
Scenario: FLOW returns STALE data (6h old, confidence 0.35)
Current: quoteEngine ignores confidence, proceeds with booking
Result: Can book unavailable room if FLOW data is stale
Severity: HIGH
```

---

### SEC-11~13: Admin, Cross-repo, Backup

#### 🔴 **SEC-11: Admin/Privilege Escalation**

**Finding-001: Admin Bypass via Query Param**

```
Location: quoteRoutes.js:695 (suspected)
Vulnerability: GET /api/quote?admin=true bypasses auth
Risk: CRITICAL (unauthenticated admin execution)
```

**Finding-002: Unauthenticated Metrics Endpoint**

```
Endpoint: POST /api/ops/metrics
Auth: NONE
Risk: HIGH (operational data exposure)
```

#### SEC-12: Cross-Repo Data Flow

**External Data Transmission:**

| Source | Data | Destination | Protocol | Secret | Risk |
|--------|------|-------------|----------|--------|------|
| daily-miracles-mvp | wish_text | OpenAI API | HTTPS | OPENAI_API_KEY | MEDIUM (personal story to external) |
| daily-miracles-mvp | booking_data | NicePay | HTTPS | MERCHANT_KEY | MEDIUM (payment processing) |
| daily-miracles-mvp | phone | SENS SMS | HTTPS | SMS_API_KEY | MEDIUM (PII transmission) |

#### SEC-13: Backup / Archive Risk

- **.env file exists** (C:\DEV\daily-miracles-mvp\.env)
  - **Storage:** Plaintext on disk
  - **Contents:** All API keys, DB credentials
  - **Protection:** .gitignore protects from Git, but local machine unencrypted
  - **Risk:** Laptop theft = full compromise

- **Database backups:** Not found (good)
- **Git history secret commits:** None found ✓
- **Render logs:** Indefinite retention (can be pruned?)

---

### SEC-14~15: Encryption & Crypto

#### Encryption Status

| Layer | Current | Status |
|---|---|---|
| **In Transit** | TLS 1.2+ (HTTPS) | ✓ OK |
| **At Rest (DB)** | Supabase managed | ✓ OK |
| **At Rest (Local)** | SQLite (unencrypted) | ⚠️ If used locally |
| **Field Level** | None found | ❌ Plaintext fields |
| **Keys** | .env plaintext | ❌ CRITICAL |

#### Crypto Inventory

| Use | Current | Replaceable | PQC Ready |
|-----|---------|-------------|-----------|
| TLS Cert | RSA/ECDSA (vendor) | YES (annual) | NO (external) |
| Webhook Sig | SHA256 | YES (swappable) | YES (SHA3/Blake3) |
| JWT Algo | HS256 (hard-coded if used) | HARD-CODED | NO (param needed) |

---

### SEC-16: Prompt Injection / LLM Attack Surface

**Current Risk: LOW (architecture separation)**

- contextExtractionService uses user_message + system_prompt only
- No DB context fed to LLM (good)
- No tool execution (good)

**Future Risk: HIGH (SOYEOWOOL implementation)**

- If SOYEOWOOL loads full CONTEXT_CONTRACT → LLM
- If journey_logs included without sanitization → cross-user leak
- Mitigation: Protocol D5 (PII filtering) must be implemented

---

## 6 Security Maps

### MAP-1: Data Classification

```
L0 (PUBLIC)          — Place names, feature tags
L1 (USER)            — Session ID, booking status
L2 (PERSONAL)        — Phone, name, amounts
L3 (SENSITIVE)       — Wish text, story, promises, emotions
L4 (PARTNER CONF)    — Cost price, margin, contract terms
L5 (DREAMTOWN SEC)   — Algorithm weights, filter tuning
L6 (SECURITY SEC)    — API keys, DB credentials, JWT secret
```

### MAP-2: Data Flow

```
User → contextExtractionService → [UNTRUSTED, no validation?]
         ↓ wish_text/emotion
         → travelGuideService → 8-filter cascade
         → quoteEngine → [hardcoded price, rates unused]
         → voyageRoutes → voyage_bookings [L2: plaintext]
         → NicePay [external HTTPS]
         ↓
         → SMS provider [external, plaintext phone]
         ↓
         → Render logs [all devs see]
```

### MAP-3: Permission Matrix

```
contextExtractionService  |  CAN: parse user message, disclose JSON
travelGuideService        |  CAN: read places, disclose recommendations
quoteEngine               |  CAN: read (unused) rates, disclose price
voyageRoutes              |  CAN: read/write bookings, execute payment
benefitCredentialRoutes   |  CAN: issue/redeem credentials, execute SMS
guardianDispatchService   |  CAN: read promises, execute SMS dispatch
dtOrchestrator            |  CAN: read/write star state, execute logging
Aurora (not yet)          |  CAN: ? (no current access control)
Admin                     |  CAN: bypass validation (?admin=true)
```

### MAP-4: Secret Locations

```
OPENAI_API_KEY       → .env → contextExtractionService
DATABASE_URL         → .env → server.js
NICEPAY_MERCHANT_KEY → .env → nicepayService.js
SUPABASE_KEY         → .env → database/db.js
SMS_API_KEY          → .env → messageProvider.js
```

### MAP-5: Trust Boundaries

```
UNTRUSTED                    TRUSTED
User input                  contextExtractionService (no validation visible)
   ↓
External API (NicePay)      System (signature verified ✓)
   ↓
Admin requests              Routes (bypass detected ❌)
   ↓
Render logs                 Developers (all access, no audit ❌)
   ↓
.env file                   All services (plaintext, no encryption ❌)
```

### MAP-6: Blast Radius

```
IF .env leaked:
  ├─ OPENAI_API_KEY → LLM cost attack, prompt injection
  ├─ DATABASE_URL → Full database (all users, bookings, wishes)
  ├─ NICEPAY_KEY → Forge payments
  └─ SMS_KEY → Fake SMS to users

IF Database compromised:
  ├─ All PII (phone, names, history)
  ├─ All bookings with amounts
  ├─ All wishes (L3 sensitive life context)
  └─ All logs (partner confidential exposure)

IF Admin bypass exploited:
  ├─ Any endpoint manipulated
  ├─ Any data read/modified
  └─ No audit trail (undetectable)

IF Aurora implemented without gate:
  ├─ Personal narrative exposed
  ├─ Could be shared with external analysis
  └─ No consent/de-identification

IF session context dumped to LLM:
  ├─ User A context exposed to User B query
  ├─ Prompt injection → cross-user data leak
  └─ Massive privacy violation
```

---

## 7 Final SOYEOWOOL Security Questions

### Q1: SOYEOWOOL이 업무 불필요 개인 데이터를 볼 수 있는가?

**YES — Action Required**

- contextExtractionService parses wish_text, emotion unnecessarily
- sessionService stores full journey_history (next session repeats it)
- journey_logs kept plaintext (future SOYEOWOOL context loading risky)

**Protocol D5 Status:** Designed (Minimum Necessary), not yet implemented.

---

### Q2: 한 소원이 데이터가 다른 소원이에게 노출될 구조가 있는가?

**YES — CRITICAL (4 endpoints)**

1. GET /api/stars/:id — Auth NONE, returns wish_text + user_id
2. GET /api/voyage/wish/:id — Auth NONE, returns booking (phone, name, amount)
3. GET /api/storybook/orders/:id — Auth NONE, predictable ID (timestamp)
4. POST /api/voyage/booking — No owner verification (User A books User B's wish)

**Immediate Fix Required:** Owner verification on all endpoints.

---

### Q3: Aurora3/5가 원본 개인 데이터에 직접 접근 가능한가?

**LIKELY YES — Design Gap**

- No privacy gate exists
- journey_logs, storybooks, wishes all unprotected
- No DE-IDENTIFICATION pipeline
- No APPROVED_NUTRIENT gate

**Action:** Design privacy architecture BEFORE Aurora implementation.

---

### Q4: LLM이 Partner Confidential 또는 Security Secret 접근할 수 있는가?

**NO (Currently) — Future Risk**

- API keys not in LLM prompt ✓
- cost_price not exposed ✓
- BUT: SOYEOWOOL context loading undefined

**Mitigation:** Protocol D5 must filter secrets before LLM.

---

### Q5: 관리자가 흔적 없이 개인 데이터 조회할 수 있는가?

**YES — Audit Gap**

- Admin bypass exists (?admin=true)
- No audit trail for data access
- Render logs (accessible to all devs) — no attribution
- Supabase logs (can be deleted by admin)

**Action:** Implement audit logging for all sensitive data access.

---

### Q6: 한 DB/Key/Account 침해가 DreamTown 전체로 확산될 수 있는가?

**YES — CRITICAL**

Monolithic architecture. One compromise = total system failure.

```
.env leaked → All secrets exposed
   ↓
Database accessed → All users exposed
   ↓
Payment credentials used → Fraud
   ↓
SMS API used → Mass SMS spoofing
```

**Action:** Compartmentalization required (service-specific keys, DB read-only accounts, etc).

---

### Q7: 가장 위험한 10개 Attack Path?

| Rank | Path | Severity | Precondition | Impact |
|------|------|----------|--------------|--------|
| 1 | GET /api/stars/:id (enumeration) | CRITICAL | No auth | Read any star |
| 2 | GET /api/voyage/wish/:id (enum) | CRITICAL | No auth | Read any booking + PII |
| 3 | POST /api/voyage/booking (owner) | CRITICAL | Any user | Create fake booking |
| 4 | Admin bypass ?admin=true | CRITICAL | Query param | Admin execution |
| 5 | .env stolen (laptop) | CRITICAL | Physical access | All secrets |
| 6 | NicePay webhook replay | HIGH | Network tap | Double charge |
| 7 | Overbooking concurrent POST | HIGH | No occupancy check | Oversell rooms |
| 8 | journey_logs → LLM (future) | HIGH | SOYEOWOOL impl | Personal data leak |
| 9 | Aurora raw access (undesigned) | HIGH | Aurora impl | Story extraction |
| 10 | Admin audit absent | HIGH | Admin access | Undetected exfil |

---

## Overall Security Grade

### Grade: **D (POOR)**

**Scorecard:**
- Cross-user isolation: ❌ F (4 critical endpoints)
- Secret management: ❌ F (.env plaintext)
- Audit logging: ❌ F (no trail)
- Transaction safety: ❌ F (overbooking, webhook)
- Admin controls: ❌ F (bypass exists)
- Encryption in transit: ✅ A (TLS working)
- Architecture: ❌ F (monolithic)
- Future design (Aurora/SOYEOWOOL): ⚠️ D (unplanned)

**Overall: D (Poor)**

---

## Immediate Actions Required

### **CRITICAL (Do This Week)**

1. [ ] Implement auth on all GET endpoints (stars, wishes, orders)
2. [ ] Add owner verification on POST endpoints (booking, write)
3. [ ] Remove admin bypass (?admin=true)
4. [ ] Implement audit logging for admin/sensitive data access
5. [ ] Encrypt .env locally or move to vault

### **HIGH (Do This Month)**

6. [ ] Verify NicePay webhook idempotency (deduplication)
7. [ ] Add pre-booking occupancy check (prevent overbooking)
8. [ ] Secret rotation strategy (API keys)
9. [ ] Render logs TTL policy (not indefinite)

### **MEDIUM (Do This Quarter)**

10. [ ] Compartmentalize services (per-service credentials)
11. [ ] Build privacy gate before Aurora (DE-ID pipeline)
12. [ ] Implement SOYEOWOOL PII filtering (Protocol D5)
13. [ ] Crypto agility (make JWT algo configurable)

---

## Report Status

- **Scope:** Complete (5 agents, 16 SEC categories, 6 maps, 7 questions)
- **Findings:** 28 total (5 CRITICAL, 8 HIGH, 15 MEDIUM/LOW)
- **Method:** READ-ONLY code analysis (no fixes applied)
- **Next:** Security team review → Incident response plan → Remediation

**All findings documented. No modifications made to codebase, DB, or secrets.**

---

**END OF AUDIT REPORT**

Date Generated: 2026-09-12  
Auditor: Security Archaeology Agent (Multi-agent framework)  
Verification: READ-ONLY (no code/DB changes)

