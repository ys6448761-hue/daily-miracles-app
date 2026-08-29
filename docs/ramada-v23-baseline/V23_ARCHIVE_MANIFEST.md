---
title: RAMADA Pilot V23 Archive Manifest
date_archived: 2026-08-29
source_system: ChatGPT Sites (Internal Control)
production_status: ACTIVE (DO NOT MODIFY WITHOUT APPROVAL)
---

# RAMADA Pilot V23 — Baseline Archive Manifest

## Archive Purpose
Preserve production baseline of RAMADA Pilot V23 (ChatGPT Sites runtime) for safe reference and future integration planning with DreamTown Core systems (daily-miracles-mvp, sowon-dreamtown).

**IMPORTANT:** This archive does NOT represent a GitHub commit baseline. V23 source exists in ChatGPT Sites internal source control only.

---

## V23 Production Identity

| Property | Value |
|----------|-------|
| **System** | RAMADA Pilot V23 (ChatGPT Sites) |
| **Production URL** | https://ramada-yeosu-starlight-route.sejinlee.chatgpt.site/ |
| **Sites Project ID** | appgprj_6a876b5c27b48191b492849fe1836d7a |
| **Internal Commit Hash** | 4f8ccb37d58cda12731920eaf63b26d8508925ab |
| **Database** | Cloudflare D1 (NOT PostgreSQL) |
| **D1 Binding Name** | "DB" (per app configuration) |
| **Runtime** | ChatGPT Sites (Cloudflare Workers) |
| **Status** | ✅ PRODUCTION ACTIVE |
| **Archive Created** | 2026-08-29 |

---

## Archive Contents

### ✅ Preserved (Metadata Only)
- [V23_SCHEMA_REFERENCE.md](./V23_SCHEMA_REFERENCE.md) — benefit_coupons table structure
- [V23_PRODUCTION_BASELINE.md](./V23_PRODUCTION_BASELINE.md) — Functional baseline, regression specs
- [V23_DEPENDENCIES.md](./V23_DEPENDENCIES.md) — Sites-specific libraries, config
- [V23_BACKUP_RECORD.md](./V23_BACKUP_RECORD.md) — D1 data audit, checksum, row counts

### ❌ NOT Preserved (Security)
- Production coupon data dump
- Customer PII/phone numbers
- Payment tokens/secrets
- API keys or private config
- Live database snapshots
- Authentication credentials

---

## Production Data Backup Status

**D1 Database Backup Location:** [SECURE LOCATION — not in GitHub]
- **Format:** SQL dump (benefit_coupons table only)
- **Encryption:** ✅ Yes (storage-level)
- **Verification:** Checksum + row count in V23_BACKUP_RECORD.md
- **Owner:** DevOps / DB Administrator
- **Retention:** 90 days minimum

---

## Key Findings (From Integration Assessment)

### V23 Database Isolation
- ✅ benefit_coupons table exists ONLY in Cloudflare D1
- ❌ NOT present in daily-miracles-mvp PostgreSQL
- ❌ NOT present in sowon-dreamtown PostgreSQL
- **Implication:** Cross-database binding required for integration

### V23 Feature Status
- ✅ Coupon management (409 reuse blocking, test coupon exclusion)
- ✅ Admin dashboard
- ❌ Customer Storybook (Phase 2 future work, not included in V23)
- ✅ 9-Cut Static showcase (Golden example assets only)

### Regression Test Baseline
- **Test Suite:** PUB-01 through ADM-08 (8 critical paths)
- **Status:** All pass on production
- **Scope:** Coupon issuance, redemption, admin operations
- See [V23_PRODUCTION_BASELINE.md](./V23_PRODUCTION_BASELINE.md) for details

---

## Integration Notes for Future ACTION 2

### Decision Required (Not Made in Phase A)
1. **Database strategy:** Keep D1 separate, migrate to PostgreSQL, or hybrid adapter?
2. **Coupon ownership:** V23 standalone, or unified with daily-miracles-mvp payment system?
3. **Star model convergence:** Merge DtStar (sowon) ↔ dt_stars (daily-miracles) ?

### Dependencies to Resolve
- Cloudflare D1 client library integration
- Cross-database fallback logic
- Regression test harness (PUB-01 through ADM-08 must remain passing)

---

## Archive Governance

**This archive is REFERENCE ONLY:**
- ✅ Read-only for integration planning
- ✅ Use for schema design decisions
- ❌ DO NOT import data without explicit approval
- ❌ DO NOT bind D1 without decision from Phase B (Database Architecture)
- ❌ DO NOT modify production V23 without separate authorization

**Next Review Date:** 2026-09-15 (or upon start of Phase B)

**Owner:** DreamTown Architecture Team  
**Last Updated:** 2026-08-29

---
