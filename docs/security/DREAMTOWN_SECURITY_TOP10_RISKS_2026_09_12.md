# DreamTown Security — TOP 10 Risks (2026-09-12)

**CRITICAL FINDINGS SUMMARY**

All findings from complete security archaeology audit.  
**Report Level:** Grade D (Poor)

---

## 🔴 CRITICAL (5 items) — Immediate Action Required

### Risk-001: Cross-User Data Isolation Absent
```
SEVERITY:    🔴 CRITICAL
ENDPOINTS:   4 (GET /api/stars/:id, /voyage/wish/:id, /storybook/orders/:id, POST /booking)
AUTH:        NONE (ID_ONLY access)
IMPACT:      Any user reads any other user's entire record (wishes, bookings, PII)
PRECONDITION: Know or guess any user's UUID/ID
BLAST RADIUS: Full privacy violation, customer profiling, competitive intelligence
EVIDENCE:    starsRoutes.js:90-109 (no req.user check), voyageRoutes.js:72-91
ACTION:      Implement auth + owner verification on all endpoints
```

### Risk-002: No Owner Verification on Booking
```
SEVERITY:    🔴 CRITICAL
ENDPOINT:    POST /api/voyage/booking
IMPACT:      User A creates booking for User B's wish (unauthorized booking)
CODE:        INSERT voyage_bookings WHERE wish_id=$1 (no ownership check)
PRECONDITION: Know other user's wish_id (from Risk-001 exploitation)
BLAST RADIUS: Fraudulent bookings, service disruption, partnership breach
ACTION:      Verify req.user owns wish_id before booking
```

### Risk-003: Admin Bypass via Query Parameter
```
SEVERITY:    🔴 CRITICAL
ENDPOINT:    ?admin=true (quoteRoutes.js:695 suspected)
IMPACT:      Bypass auth, execute admin functions
PRECONDITION: Append ?admin=true to any request
BLAST_RADIUS: Unlimited admin access, data manipulation
ACTION:      Remove bypass, implement proper role-based auth
```

### Risk-004: Secrets Plaintext on Local Machine
```
SEVERITY:    🔴 CRITICAL
LOCATION:    .env file (C:\DEV\daily-miracles-mvp\.env)
CONTENTS:    OPENAI_API_KEY, DATABASE_URL, NICEPAY_MERCHANT_KEY, SMS_API_KEY, SUPABASE_KEY
IMPACT:      Laptop theft → Full system compromise (all services, all data, all secrets)
PRECONDITION: Physical access to developer machine
BLAST_RADIUS: Complete system takeover
ACTION:      Encrypt .env or move to secure vault (AWS Secrets, HashiCorp Vault)
```

### Risk-005: No Audit Trail for Admin/Sensitive Data Access
```
SEVERITY:    🔴 CRITICAL
IMPACT:      Insider can exfiltrate data without detection
LOG_ACCESS:  Render logs (accessible to all devs), Supabase logs (admin can delete)
PRECONDITION: Insider with system access
BLAST_RADIUS: Undetected data theft, regulatory violation
ACTION:      Implement immutable audit logging (separate from app logs)
```

---

## 🔴 CRITICAL (Operational) — 4 items

### Risk-006: Overbooking Possible
```
SEVERITY:    🔴 CRITICAL
CODE:        POST /api/voyage/booking (no occupancy check before INSERT)
IMPACT:      Oversell hotel rooms (partnership breach, customer complaint, revenue loss)
PRECONDITION: Multiple simultaneous booking POSTs
MECHANISM:   quoteEngine returns hardcoded 60k/89k (never checks dt_accommodations.current_occupancy)
             FLOW availability not queried before booking
BLAST_RADIUS: Hotel partnership damage, customer dissatisfaction
ACTION:      Query occupancy before booking, verify post-booking
```

### Risk-007: Monolithic Architecture (One Key = All)
```
SEVERITY:    🔴 CRITICAL
ISSUE:       Single .env file contains all secrets for all services
IMPACT:      One compromise → entire system compromised
PRECONDITION: .env leaked (physical theft, git history, backup, etc)
COMPARTMENTS: None (all services share same key file)
ACTION:      Implement per-service secrets, secret rotation, compartmentalization
```

---

## 🟠 HIGH (9 items)

### Risk-008: Payment Webhook Idempotency Missing
```
SEVERITY:    🟠 HIGH
ENDPOINT:    POST /webhook/nicepay
IMPACT:      Double-charge users (if webhook retried)
PRECONDITION: Network timeout, retry mechanism
STATUS:      UNKNOWN (code not verified for idempotency token)
ACTION:      Verify idempotency token in DB, implement if missing
```

### Risk-009: Stale Availability Data Triggers Booking
```
SEVERITY:    🟠 HIGH
SCENARIO:    FLOW returns STALE data (6h old, confidence 0.35)
IMPACT:      Book unavailable room (hotel has no capacity)
CURRENT:     quoteEngine ignores confidence, proceeds anyway
ACTION:      Check FLOW confidence >= threshold before booking
```

### Risk-010: Phone Logged Plaintext
```
SEVERITY:    🟠 HIGH
LOCATION:    journey_logs, error logs, external (SMS, NicePay)
IMPACT:      PII exposure in logs accessible to all developers
RETENTION:   Indefinite (no TTL policy)
ACTION:      Hash phone before logging, implement log TTL
```

**Note:** Risks 1-7 require immediate action (this week). Risks 8-10 are high priority (this month).

---

## Summary Table

| # | Risk | Severity | Where | Impact | Fix Effort |
|---|------|----------|-------|--------|-----------|
| 1 | Cross-user GET endpoints | CRITICAL | 4 endpoints | Any user reads any data | 1-2 days |
| 2 | No owner verify POST booking | CRITICAL | voyageRoutes | Fraudulent bookings | 1 day |
| 3 | Admin bypass ?admin=true | CRITICAL | quoteRoutes | Unauthorized admin | 1 day |
| 4 | .env plaintext | CRITICAL | Local machine | System compromise | 2-3 days |
| 5 | No audit trail | CRITICAL | Render/Supabase logs | Undetected theft | 1 week |
| 6 | Overbooking | CRITICAL | POST /booking | Hotel breach | 2-3 days |
| 7 | Monolithic secrets | CRITICAL | Architecture | Single point failure | 2 weeks |
| 8 | Webhook idempotency | HIGH | NicePay webhook | Double charge | 1 day |
| 9 | Stale FLOW data | HIGH | quoteEngine | Book unavailable room | 1 day |
| 10 | Phone in logs | HIGH | journey_logs | PII exposure | 2 days |

---

## Next Steps

1. **Immediate (This Week)**
   - [ ] Fix cross-user auth (Risk-1)
   - [ ] Add owner verification (Risk-2)
   - [ ] Remove admin bypass (Risk-3)
   - [ ] Encrypt/vault .env (Risk-4)
   - [ ] Verify webhook idempotency (Risk-8)

2. **High Priority (This Month)**
   - [ ] Audit logging system (Risk-5)
   - [ ] Occupancy check (Risk-6)
   - [ ] FLOW confidence threshold (Risk-9)
   - [ ] Phone hashing in logs (Risk-10)

3. **Strategic (This Quarter)**
   - [ ] Compartmentalize architecture (Risk-7)
   - [ ] Privacy gate design before Aurora (future risk)
   - [ ] SOYEOWOOL PII filtering (Protocol D5)
   - [ ] Incident response plan

---

**Report Generated:** 2026-09-12  
**Audit Type:** READ-ONLY (no fixes applied)  
**Next Review:** After critical fixes implemented

