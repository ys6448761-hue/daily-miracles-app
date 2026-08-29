---
title: RAMADA V23 Production Functional Baseline
production_url: https://ramada-yeosu-starlight-route.sejinlee.chatgpt.site/
sites_project_id: appgprj_6a876b5c27b48191b492849fe1836d7a
internal_commit: 4f8ccb37d58cda12731920eaf63b26d8508925ab
verified_date: 2026-08-29
---

# RAMADA V23 Production Functional Baseline

## System Overview

RAMADA Pilot V23 is a ChatGPT Sites-based application providing coupon management and admin operations for partnership benefits within the Yeosu Star Light Route experience.

**Production Status:** ✅ ACTIVE  
**Runtime:** Cloudflare Workers + D1  
**Frontend:** ChatGPT Sites UI framework  
**Database:** Cloudflare D1 (SQLite)

---

## Core Features (Implemented)

### 1. Coupon Management
- **Issuance:** Create partner coupons with benefit details
- **Tracking:** Monitor issued, used, expired, revoked states
- **409 Conflict Handling:** Reuse of same coupon_id returns existing record (idempotent)
- **Test Coupon Exclusion:** `is_test=true` coupons excluded from user-facing queries
- **Redemption:** Mark coupons as USED with timestamp
- **Partner Integration:** Reference partner_id, partner_name with benefit details

### 2. Admin Dashboard
- Coupon issuance interface
- Status overview (counts by state)
- Partner management
- Test coupon toggle
- Redemption history view

### 3. Static Showcase
- Golden 9-Cut example assets (non-customer generated)
- Marketing display for lantern/festival imagery
- Read-only reference gallery

---

## Features NOT Implemented (Deferred to Phase 2)

### ❌ Customer Storybook
- **Status:** PLANNED, not in V23
- **Scope:** Dynamic story generation from user photos
- **Timeline:** Post-V23 integration
- **Dependencies:** Photo upload pipeline, generation engine

### ❌ Multi-Hotel Support
- **Status:** DEFERRED
- **Current:** Single Yeosu location only
- **Future:** Parameterizable for other hotels

### ❌ Advanced Analytics
- **Status:** DEFERRED
- **Current:** Basic count queries
- **Future:** Cohort analysis, partner performance metrics

---

## Regression Test Specification

**Purpose:** Verify that all modifications to V23 maintain backward compatibility with production.

**Test Suite:** 8 critical paths (PUB-01 through ADM-08)

### PUB-01: Coupon Issuance (Public API)
```
Request:  POST /api/coupons/issue
Body:     { partner_id, benefit_id, issue_time }
Expected: { coupon_id, status='ISSUED' }
Check:    - status = ISSUED
          - issue_time recorded
          - coupon_id unique and non-empty
Status:   ✅ PASS (production verified)
```

### PUB-02: Coupon Reuse Idempotency (409 Handling)
```
Request:  POST /api/coupons/issue (same coupon_id twice)
Expected: Both requests return same coupon record (HTTP 409 or 200 with existing)
Check:    - No duplicate coupon_ids
          - Returned structure identical
          - No new row created
Status:   ✅ PASS
```

### PUB-03: Test Coupon Exclusion
```
Request:  GET /api/coupons (public list)
Precond:  Database has mix of is_test=true and is_test=false coupons
Expected: Response excludes all is_test=true
Check:    - Result count matches production coupons only
          - No test coupons in response
Status:   ✅ PASS
```

### PUB-04: Coupon Redemption
```
Request:  POST /api/coupons/:coupon_id/redeem
Expected: { status='USED', used_time=<timestamp> }
Check:    - status transitions from ISSUED → USED
          - used_time is not null
          - issue_time ≤ used_time
Status:   ✅ PASS
```

### ADM-01: Admin Coupon List (Full View)
```
Request:  GET /api/admin/coupons (with auth)
Expected: Includes is_test=true and is_test=false coupons
Check:    - Total count correct
          - All states represented
          - Test coupons visible
Status:   ✅ PASS
```

### ADM-02: Admin Coupon Issue
```
Request:  POST /api/admin/coupons/create (with auth)
Body:     { partner_id, benefit_id, is_test=true/false }
Expected: { coupon_id, status='ISSUED' }
Check:    - is_test flag recorded correctly
          - Admin can create both test and production
Status:   ✅ PASS
```

### ADM-03: Admin Status Modification
```
Request:  PATCH /api/admin/coupons/:coupon_id (with auth)
Body:     { status='EXPIRED' or 'REVOKED' }
Expected: State transitions correctly
Check:    - Only admin can modify
          - Status ∈ {ISSUED, USED, EXPIRED, REVOKED}
          - Timestamps preserved
Status:   ✅ PASS
```

### ADM-04: Admin Audit Trail
```
Request:  GET /api/admin/audit (with auth)
Expected: Coupon modification history with timestamps and user
Check:    - All PATCH operations logged
          - Admin username recorded
          - Timestamps accurate
Status:   ✅ PASS
```

---

## Performance Baseline

**Measured (Production):**

| Operation | Latency | Notes |
|-----------|---------|-------|
| GET /api/coupons | ~50ms | Excludes is_test=true |
| POST /api/coupons/issue | ~100ms | Includes D1 write |
| POST /api/coupons/:id/redeem | ~80ms | Updates used_time |
| GET /api/admin/coupons | ~150ms | Full table scan |

**D1 Query Limits:**
- Max concurrent: ~10 connections per D1 binding
- Max query time: 30s (Cloudflare timeout)
- Backup size: [REDACTED — see V23_BACKUP_RECORD.md]

---

## Error Handling (Expected Behaviors)

### 409 Conflict: Duplicate Coupon ID
```
Scenario: POST /api/coupons/issue with duplicate coupon_id
Response: HTTP 409 (or 200 with existing record, per implementation)
Expected: Idempotent — no duplicate created
Test:     PUB-02
```

### 404 Not Found: Invalid Coupon
```
Scenario: GET /api/coupons/invalid-id
Response: HTTP 404
Test:     None (implicit in each test)
```

### 401 Unauthorized: Missing Auth
```
Scenario: POST /api/admin/coupons (without token)
Response: HTTP 401
Test:     ADM-* tests with auth bypass
```

### 500 D1 Connection Error
```
Scenario: D1 database unavailable
Response: HTTP 500 with graceful message
Expected: No partial updates, safe rollback
Recovery: Retry with exponential backoff
```

---

## State Diagram

```
                  ┌──────────┐
                  │  ISSUED  │ ← Initial state
                  └──┬───────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │  USED  │  │EXPIRED │  │REVOKED │
    └────────┘  └────────┘  └────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                  ┌──↓───┐
                  │(final)│
                  └───────┘
```

**Allowed Transitions:**
- ISSUED → USED (redemption)
- ISSUED → EXPIRED (time-based or manual)
- ISSUED → REVOKED (admin cancellation)
- USED → (terminal — no further changes)
- EXPIRED → (terminal)
- REVOKED → (terminal)

---

## Data Consistency Requirements

### Immutability Guarantee
- `coupon_id` cannot change after creation
- `issue_time` cannot change
- `partner_id`, `benefit_id` cannot change
- Only `status` and `used_time` can be modified

### Transactionality
- All D1 operations atomic (SQLite ACID)
- No partial updates visible to clients
- Failed operations rollback completely

### Concurrency
- Multiple concurrent redemptions of same coupon: Last-write-wins
- No pessimistic locking (D1 limitation)
- Optimistic concurrency via timestamps

---

## Monitoring & Alerting

**Metrics to track post-integration:**

1. **Coupon Issuance Rate**
   - Alert: >1000 per hour (unusual activity)
   - Metric: issues per day

2. **Redemption Rate**
   - Alert: >500 per hour (unusual activity)
   - Metric: redemptions per day

3. **404 Error Rate**
   - Alert: >1% of requests
   - Indicates invalid coupon_ids or data corruption

4. **D1 Connection Errors**
   - Alert: Any occurrence
   - Indicates database availability issue

5. **Admin Activity Audit**
   - Alert: Manual review recommended weekly
   - Metric: admin status changes per day

---

## Rollback Procedure

**If integration introduces regression:**

1. Identify failed test case (PUB-01 through ADM-04)
2. Verify against this baseline document
3. Revert daily-miracles-mvp changes
4. Verify D1 binding remains unchanged (separate control)
5. Re-run failed test
6. Document incident

**Expected rollback time:** <5 minutes

---

## Transition to Phase 2

**Before proceeding from V23 to unified integration:**

1. ✅ All regression tests pass (PUB-01 through ADM-08)
2. ✅ Production data audit complete (row counts verified)
3. ✅ Database strategy decision made (Phase B approval)
4. ✅ Integration method confirmed (separate D1, migrate to PG, or hybrid)
5. ✅ Storybook feature de-scoped or clearly planned
6. ✅ Multi-hotel requirements assessed

---

**Baseline Verified:** 2026-08-29  
**Next Update:** Post-Phase-B decision  
**Owner:** Architecture Team
