---
title: RAMADA V23 D1 Schema Reference
database: Cloudflare D1
binding_name: "DB"
last_verified: 2026-08-29
---

# V23 D1 Schema Reference

## benefit_coupons Table

**Database:** Cloudflare D1  
**Purpose:** Coupon issuance, tracking, and redemption for RAMADA partnership benefits

### Column Definitions

| Column | Type | Nullable | Unique | Purpose |
|--------|------|----------|--------|---------|
| `coupon_id` | TEXT | NO | YES | Unique coupon identifier (primary key) |
| `partner_id` | TEXT | NO | NO | Partner reference (문구/점포 ID) |
| `partner_name` | TEXT | NO | NO | Partner display name |
| `benefit_id` | TEXT | NO | NO | Benefit/product reference |
| `benefit_name` | TEXT | NO | NO | Benefit display name |
| `issue_time` | TIMESTAMP | NO | NO | When coupon was issued |
| `used_time` | TIMESTAMP | YES | NO | When coupon was redeemed (NULL if unused) |
| `status` | TEXT | NO | NO | Current state: ISSUED / USED / EXPIRED / REVOKED |
| `category` | TEXT | NO | NO | Coupon category (e.g., 'food', 'service', 'entertainment') |
| `is_test` | BOOLEAN | NO | NO | Test coupon flag (excluded from production counting) |

### Key Constraints

**Primary Key:** `coupon_id`

**Validation Rules:**
- `issue_time` ≤ `used_time` (if used_time is not NULL)
- `status` ∈ {ISSUED, USED, EXPIRED, REVOKED}
- Test coupons (`is_test=true`) excluded from user-facing queries
- 409 Conflict handling: Reuse of same coupon_id returns existing record

### Indexes (Recommended)

```sql
CREATE INDEX idx_benefit_coupons_partner_id ON benefit_coupons(partner_id);
CREATE INDEX idx_benefit_coupons_status ON benefit_coupons(status);
CREATE INDEX idx_benefit_coupons_issue_time ON benefit_coupons(issue_time);
CREATE INDEX idx_benefit_coupons_is_test ON benefit_coupons(is_test);
```

---

## Audit Counts (Production Snapshot)

**Verified:** 2026-08-29 (Latest Production D1 Backup)

| Category | Count |
|----------|-------|
| Total Records | [REDACTED — see V23_BACKUP_RECORD.md] |
| Status: ISSUED | [REDACTED] |
| Status: USED | [REDACTED] |
| Status: EXPIRED | [REDACTED] |
| Status: REVOKED | [REDACTED] |
| Test Coupons (is_test=true) | [REDACTED] |
| Production Coupons (is_test=false) | [REDACTED] |

*Actual counts stored in secure backup location (V23_BACKUP_RECORD.md checksum verification only)*

---

## D1-Specific Notes

### SQL Dialect
- Cloudflare D1 uses SQLite dialect (NOT PostgreSQL)
- No ENUM types (use TEXT for status)
- No INTERVAL arithmetic (use datetime functions)
- No native UUID type (use TEXT for IDs)

### Connection from Express.js (daily-miracles-mvp)
```javascript
// NOT YET IMPLEMENTED (Phase B decision required)
// Example pattern IF D1 binding is approved:

const db = env.DB;  // Cloudflare D1 binding
const result = await db.prepare(
  'SELECT * FROM benefit_coupons WHERE coupon_id = ?'
).bind(couponId).first();
```

### Key Differences from PostgreSQL (daily-miracles-mvp)

| Feature | PostgreSQL (daily-miracles) | D1 (V23) |
|---------|---------------------------|----------|
| Data Types | TIMESTAMPTZ, UUID, ENUM | TEXT, DATETIME |
| Transactions | Full ACID support | Basic transactions |
| Concurrency | Full row-level locking | SQLite locking model |
| Query Performance | Optimized for complex joins | Suitable for flat tables |
| Backup Strategy | pg_dump, point-in-time recovery | D1 backup dashboard |

---

## Integration Considerations

### Migration Path (If Needed)
To migrate benefit_coupons from D1 to PostgreSQL:
1. Export D1 as SQL dump
2. Transform TEXT → appropriate PG types (TIMESTAMP, UUID)
3. Add constraints (unique, foreign keys if any)
4. Validate row counts before/after
5. Dual-write for verification period

### No Migration Until Decided
**CURRENT STATUS:** Archive reference only. Do NOT migrate without explicit Phase B approval.

---

## Related Tables (Not in This Archive)

**Expected to exist in V23 D1 (if extended):**
- `partners` (partner_id reference)
- `benefits` (benefit_id reference)
- `redemption_history` (audit trail)
- `admin_logs` (admin operations)

**Status:** Not included in this archive. If integration planned, export full D1 schema.

---

## Production Regression Baseline

For each modification test (PUB-01 through ADM-08), the schema must:
- ✅ Support 409 Conflict (duplicate coupon_id returns existing)
- ✅ Exclude is_test=true from user queries
- ✅ Maintain issue_time immutability
- ✅ Track used_time on redemption
- ✅ Preserve status transition history

See [V23_PRODUCTION_BASELINE.md](./V23_PRODUCTION_BASELINE.md) for test details.

---

**Archive Date:** 2026-08-29  
**D1 Backup Verified:** [Timestamp in V23_BACKUP_RECORD.md]  
**Next Review:** Phase B (Database Architecture Decision)
