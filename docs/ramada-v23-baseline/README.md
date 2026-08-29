# RAMADA Pilot V23 — Baseline Archive

**Archive Created:** 2026-08-29  
**Status:** REFERENCE ONLY (No production changes)  
**Next Phase:** Phase B (Database Architecture Decision)

---

## Purpose

This archive preserves the production baseline of RAMADA Pilot V23 (ChatGPT Sites runtime) for safe reference and future integration planning with DreamTown Core systems (daily-miracles-mvp, sowon-dreamtown).

**CRITICAL:** This archive does NOT represent:
- ❌ A GitHub commit baseline (V23 exists only in ChatGPT Sites internal control)
- ❌ Code to be merged or deployed
- ❌ An approved integration plan
- ❌ A database migration (production V23 remains unchanged)

**This archive IS:**
- ✅ Metadata documentation
- ✅ Schema reference
- ✅ Functional specification
- ✅ Dependencies and constraints
- ✅ Production baseline snapshot

---

## Archive Structure

### 1. [V23_ARCHIVE_MANIFEST.md](./V23_ARCHIVE_MANIFEST.md)
**Main entry point.** System overview, production identity, archive contents, and governance.

**Read this first** if you're new to V23.

### 2. [V23_SCHEMA_REFERENCE.md](./V23_SCHEMA_REFERENCE.md)
**Database schema documentation.** benefit_coupons table structure, column definitions, constraints, and audit counts (metadata only, not data dump).

**Reference this for:** Schema design, migration planning, type mapping decisions.

### 3. [V23_PRODUCTION_BASELINE.md](./V23_PRODUCTION_BASELINE.md)
**Functional specification and regression tests.** 8 critical paths (PUB-01 through ADM-08), feature status, performance baseline, error handling.

**Reference this for:** Feature scope, integration acceptance criteria, rollback procedures.

### 4. [V23_DEPENDENCIES.md](./V23_DEPENDENCIES.md)
**Sites-specific runtime constraints.** Cloudflare Workers, D1 binding configuration, API endpoints, authentication, logging, deployment model.

**Reference this for:** Understanding why V23 cannot simply be ported to Express.js, integration blockers, hybrid architecture options.

### 5. [V23_BACKUP_RECORD.md](./V23_BACKUP_RECORD.md)
**Data integrity and backup metadata.** Checksum verification, row count audit, retention policy, recovery procedure.

**Actual production data dump:** Stored in secure location (not GitHub). This file contains verification metadata only.

---

## Key Findings (Summary)

### V23 Database Isolation ⚠️
- ✅ benefit_coupons table exists ONLY in Cloudflare D1
- ❌ NOT in daily-miracles-mvp PostgreSQL
- ❌ NOT in sowon-dreamtown PostgreSQL
- **Implication:** Integration requires cross-database binding decision

### V23 Runtime Constraints ⚠️
- ✅ ChatGPT Sites / Cloudflare Workers runtime
- ❌ NOT Node.js / Express.js
- ❌ NOT Next.js
- **Implication:** Code cannot be directly ported to existing DreamTown repos

### Feature Status ✅
- ✅ Coupon management (409 idempotency, test coupon exclusion)
- ✅ Admin dashboard
- ✅ Static showcase (9-Cut Golden examples only)
- ❌ Customer Storybook (deferred to Phase 2)

---

## What NOT to Do

🚫 **DO NOT:**
- Import data from V23_BACKUP_RECORD.md metadata without approval
- Migrate D1 to PostgreSQL without Phase B decision
- Create GitHub branch from V23 internal commit (it doesn't exist in GitHub)
- Add D1 binding to daily-miracles-mvp without decision
- Implement Storybook feature based on V23 (not included)
- Assume "baseline" means ready for immediate integration

---

## What TO DO Next

### ✅ Phase A Complete (Current)
1. Archive metadata preserved in GitHub
2. Production V23 unchanged
3. Regression baseline documented (PUB-01 through ADM-08)
4. Backup location verified (secure, not in GitHub)

### ⏳ Phase B Required
**Database Architecture Decision:**
- **Option 1:** Keep D1 separate (Cloudflare-native, requires API adapter)
- **Option 2:** Migrate to PostgreSQL (unified, requires data export + validation)
- **Option 3:** Hybrid (dual-DB, requires sync strategy)

**This decision unblocks:**
- D1 binding in daily-miracles-mvp (or not)
- Migration timeline and rollback
- Integration test harness

### ⏳ Phase C Required
**Core Architecture Verification:**
1. Confirm post.wishId scope (references daily-miracles dt_wishes or sowon DtWish?)
2. Validate star model strategy (dt_stars vs DtStar convergence?)
3. Clarify promise_records vs star_promises status (which is SSOT?)

---

## Integration Decision Matrix

| Decision | Implication | Phase B Choice |
|----------|-------------|----------------|
| Keep V23 D1 separate | API adapter needed, separate backups | Option 1 |
| Migrate D1 → PostgreSQL | Large data migration, new schema, new testing | Option 2 |
| Hybrid (D1 + PG) | Complex consistency logic, monitoring required | Option 3 |

**No decision yet.** This archive is input to Phase B decision-making.

---

## How to Use This Archive

### For Integration Planning
1. Read V23_ARCHIVE_MANIFEST.md (overview)
2. Study V23_SCHEMA_REFERENCE.md (schema design)
3. Review V23_DEPENDENCIES.md (constraints)
4. Reference V23_PRODUCTION_BASELINE.md (acceptance criteria)
5. Propose Phase B strategy

### For Data Validation (Post-Migration)
1. Access V23_BACKUP_RECORD.md checksum
2. Compare pre-migration row counts
3. Verify all regression tests (PUB-01 through ADM-08) pass
4. Compare post-migration row counts
5. Sign off on migration

### For Disaster Recovery
1. Retrieve backup from secure location (DevOps)
2. Restore to isolated D1 instance
3. Validate against V23_BACKUP_RECORD.md row counts
4. Test regression suite
5. Proceed with recovery (if needed)

---

## Production Status

**V23 IS STILL RUNNING IN PRODUCTION:**
- ✅ https://ramada-yeosu-starlight-route.sejinlee.chatgpt.site/
- ✅ All regression tests passing
- ✅ Production data unchanged
- ✅ No integration changes applied

**This archive does not change that.** It only creates a preserved baseline for future reference.

---

## Questions This Archive Answers

| Question | Answer | Reference |
|----------|--------|-----------|
| What is V23 and where does it run? | ChatGPT Sites, Cloudflare D1 | V23_ARCHIVE_MANIFEST.md |
| What is the benefit_coupons schema? | Table structure, columns, constraints | V23_SCHEMA_REFERENCE.md |
| How does V23 work (features)? | Coupon issuance, tracking, admin ops | V23_PRODUCTION_BASELINE.md |
| What are the regression tests? | PUB-01 through ADM-08 (8 paths) | V23_PRODUCTION_BASELINE.md |
| Can we just port V23 to Express? | No — runtime, auth, DB different | V23_DEPENDENCIES.md |
| How much production data exists? | Row counts in secure backup metadata | V23_BACKUP_RECORD.md |
| Is V23 integrated with daily-miracles yet? | No — Phase B decision pending | V23_ARCHIVE_MANIFEST.md |

---

## Questions This Archive DOES NOT Answer

❓ **Phase B (Requires Separate Decision):**
- Should we migrate D1 to PostgreSQL?
- Should we keep D1 separate with an adapter?
- What's the integration timeline?

❓ **Phase C (Requires Separate Audit):**
- Do sowon DtStar and daily-miracles dt_stars need to converge?
- What does post.wishId reference?
- Is promise_records the source of truth?

---

## Governance

**This archive is READ-ONLY:**
- ✅ Reference for planning
- ✅ Input to architecture decisions
- ❌ NOT approval to implement
- ❌ NOT approval to migrate data
- ❌ NOT approval to change production

**Next step requires explicit user approval** for Phase B (Database Architecture Decision).

---

## Contact & Questions

- **Archive contents:** DreamTown Architecture Team
- **Production data access:** DevOps / Database Administrator
- **Integration planning:** Architecture Decision Phase B
- **Regression tests:** QA Team (for Phase 2+)

---

**Archive Date:** 2026-08-29  
**Status:** PHASE A COMPLETE ✅  
**Next:** PHASE B DECISION (Database Architecture) ⏳

