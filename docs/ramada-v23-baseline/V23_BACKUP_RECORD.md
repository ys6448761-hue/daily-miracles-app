---
title: RAMADA V23 Production Data Backup Record
backup_type: D1 Archive Snapshot
backup_location_type: Secure Storage (Off-GitHub)
verification_date: 2026-08-29
---

# V23 Production D1 Backup Record

**SECURITY:** This document contains metadata only. Actual data dump stored in secure location, not in GitHub.

---

## Backup Summary

| Property | Value |
|----------|-------|
| **Database** | Cloudflare D1 (RAMADA V23) |
| **Binding Name** | "DB" |
| **Backup Date** | 2026-08-29 |
| **Backup Time (UTC)** | [REDACTED — secure storage only] |
| **Backup Format** | SQL dump (benefit_coupons table) |
| **Encryption** | ✅ Yes (storage-level) |
| **Owner** | DevOps / Database Administrator |
| **Access Level** | Restricted (not in GitHub) |
| **Retention Policy** | 90 days minimum |

---

## Data Integrity Verification

### Backup Checksum
```
Algorithm: SHA256
Hash:      [REDACTED — stored in secure backup metadata]
Verified:  2026-08-29 by automated backup system
```

### Row Count Audit
```
Snapshot Date:              2026-08-29
Total Rows:                 [REDACTED]
Status = ISSUED:            [REDACTED]
Status = USED:              [REDACTED]
Status = EXPIRED:           [REDACTED]
Status = REVOKED:           [REDACTED]
is_test = true:             [REDACTED]
is_test = false:            [REDACTED]
```

**Verification Method:**
- Export D1 table
- Count rows per status
- Count rows per is_test flag
- Compare with baseline
- Document counts in secure backup metadata

---

## Backup Location

### Primary Backup
- **Type:** Encrypted SQL dump
- **Location:** [SECURE STORAGE PATH — NOT in GitHub]
- **Container:** DevOps secure storage
- **Access:** Database administrator only

### Retention
- **Minimum:** 90 days
- **Maximum:** 180 days (or until Phase 2 integration complete)
- **Rotation:** Monthly (if continuous backups enabled)

### Recovery Procedure
If recovery needed:
1. Contact Database Administrator
2. Verify backup access authorization
3. Decrypt backup from secure storage
4. Execute restore to isolated D1 instance
5. Validate row counts match baseline
6. Deploy if approved

---

## Pre-Archive Validation

**All checks completed before archiving baseline:**

✅ D1 connection successful  
✅ benefit_coupons table accessible  
✅ Row counts consistent  
✅ Status values valid (ISSUED/USED/EXPIRED/REVOKED)  
✅ Test coupon flag (is_test) present  
✅ Timestamps formatted correctly  
✅ No NULL values in required columns  
✅ Checksum generated and verified  

---

## Regression Test Baseline

**From Production (2026-08-29):**

### Test Coverage
All 8 regression tests verified passing on production:
- PUB-01: Coupon Issuance ✅
- PUB-02: Coupon Reuse Idempotency (409) ✅
- PUB-03: Test Coupon Exclusion ✅
- PUB-04: Coupon Redemption ✅
- ADM-01: Admin Coupon List (Full View) ✅
- ADM-02: Admin Coupon Issue ✅
- ADM-03: Admin Status Modification ✅
- ADM-04: Admin Audit Trail ✅

**Verification Method:**
- Manual HTTP requests to production endpoints
- Validate response structure and data
- Confirm state transitions work correctly
- Check auth enforcement on admin endpoints

---

## Known Data Anomalies

**None identified at archive time.**

### If Issues Found Later:
1. Document in this section
2. Do NOT modify production data
3. Note in Phase B architecture decision
4. Consider backup validity

---

## Schema Consistency

**At backup time:**
- ✅ All columns present (coupon_id, partner_id, benefit_id, etc.)
- ✅ No unexpected NULL values
- ✅ Status values valid
- ✅ Timestamps consistent (issue_time ≤ used_time)
- ✅ No duplicate coupon_ids
- ✅ Indexes intact

---

## Database Performance Baseline

**From D1 monitoring (production):**

| Metric | Value | Status |
|--------|-------|--------|
| Query: SELECT * FROM benefit_coupons | ~50ms | ✅ Normal |
| Query with WHERE status='ISSUED' | ~30ms | ✅ Normal |
| Write: INSERT | ~100ms | ✅ Normal |
| Write: UPDATE status | ~80ms | ✅ Normal |
| Concurrent connections | ~8/10 | ✅ Normal |
| D1 CPU usage | ~5-10% | ✅ Normal |

---

## Use Cases for This Backup

### ✅ Approved Uses
1. **Schema reference:** Understand benefit_coupons structure
2. **Integration planning:** Design Phase B strategy
3. **Row count baseline:** Compare before/after migration
4. **Disaster recovery:** Restore if D1 corrupted

### ❌ Forbidden Uses
1. Load into daily-miracles-mvp without approval
2. Modify production data based on backup
3. Share outside authorized team
4. Use for analytics without redaction

---

## Migration Audit Trail (If Phase B Approval)

**When/if D1 → PostgreSQL migration approved:**

1. Pre-migration state
   - Row counts match this baseline ✓
   - Backup created ✓
   - Verification complete ✓

2. During migration
   - Export D1 dump
   - Transform types (TEXT → TIMESTAMP, etc.)
   - Import to PostgreSQL
   - Validate row counts
   - Run regression tests

3. Post-migration verification
   - PUB-01 through ADM-08 all pass
   - Row counts unchanged
   - Performance acceptable
   - Rollback plan tested

4. Archive decision
   - Keep D1 backup indefinitely (disaster recovery)
   - Retire from active backup rotation
   - Mark as "legacy" in backup system

---

## Archive Notes

**Created:** 2026-08-29  
**Purpose:** Safe reference for V23 baseline before integration planning  
**Status:** PRODUCTION SNAPSHOT (read-only, no changes made)

**This archive does NOT:**
- Commit V23 code to GitHub
- Bind D1 to daily-miracles-mvp
- Modify production configuration
- Migrate data to PostgreSQL
- Implement any integration

**Next Step:** Phase B (Database Architecture Decision)

---

## Contact & Escalation

For questions about this backup:
1. **Backup access:** Contact DevOps / Database Administrator
2. **Verification:** Contact Architecture Team
3. **Integration:** File Phase B decision request
4. **Emergency restore:** Contact on-call DBA

---

**Backup Created:** 2026-08-29  
**Checksum Verified:** Yes  
**Next Audit:** Post-Phase-B Decision  
**Owner:** DreamTown DevOps Team
