---
title: RAMADA Storybook Project State (Phase C7A Ready)
date: 2026-08-30
status: STAGING VALIDATION READY
---

# RAMADA Storybook Project State

**Date:** 2026-08-30  
**Phase:** C6 Complete → C7A Ready  
**Overall Status:** ✅ Storage Bridge Complete, Staging Validation Prepared

---

## Confirmed Architecture

### Core Decision
- **DreamTown Core:** daily-miracles-mvp (Express + Supabase)
- **Storybook V1:** Separate aggregate system (dt_storybook_journeys + dt_storybook_assets)
- **Star Connection:** Late binding (customer chooses to plant star)
- **Artifact Generation:** skip_artifact=true (no new images for Storybook)

---

## Decided (Locked, No Changes)

✅ **Journey Status:** 5 states (started → photos_in_progress → photos_complete → art_in_progress → storybook_complete → star_planted)

✅ **Assets:** Separate table dt_storybook_assets (not JSONB blob)
- UNIQUE (journey_id, location, slot)
- Separate uploaded_by, uploaded_at per asset
- status: pending | approved | rejected

✅ **Restore:** Private token hash only
- restore_token = crypto.randomBytes(32)
- restore_token_hash = SHA256(token), DB stores hash only
- No email/SMS (V1)
- Cookie-based session after restore

✅ **Star Planting:** Reuse existing dt_stars creation flow
- Add skip_artifact=true parameter
- No new dt_artifact_jobs for Storybook stars
- dtOrchestratorWorker unchanged

✅ **Operator:** Minimal (3 routes)
- GET /api/admin/storybook/queue
- GET /api/admin/storybook/:journey_id
- POST /api/admin/storybook/:journey_id/upload-story-art
- No approval/rejection workflow

✅ **Golden 9-Cut:** Dynamic 3×3 grid
- Canonical order: jinamgwan | cablecar | jongpo
- Each row: REAL A | REAL B | Story Art
- No composite image generation (V2+)

✅ **Storage (CRITICAL):**
- Local filesystem: development/test only
- Production Pilot: REQUIRES R2/S3 (private, signed URLs, EXIF removal, authorization)
- Storage adapter pattern (local → R2 migration path)

---

## Open Questions (Not Blocking C2)

❓ **AI Story Art (V2+):**
- How to auto-generate Story Art from REAL photos?
- Storybook-specific prompt needed?
- Cost/latency acceptable?

❓ **Public Sharing (V2+):**
- public_share_token field defined, not used in V1
- Future: share Golden 9-Cut with family?

❓ **Photo Approval Workflow (V2+):**
- Currently: upload → auto-complete
- V2: admin review → approve/reject?

❓ **Multi-hotel Support (V3+):**
- Currently: yeosu only
- source_hotel field ready for expansion

---

## Implementation Blocked By

🚫 **BLOCK 1: R2/S3 Setup (Production Pilot)**
- Cannot deploy with Render ephemeral filesystem
- Must configure private R2/S3 bucket before Pilot
- EXIF removal logic must be ready

🚫 **BLOCK 2: artifact skip_artifact Flag**
- dreamtownRoutes.js must accept skip_artifact parameter
- starService.createStar must check flag
- NOT critical for C2 (C3 requirement)

---

## Phase C2 Scope (Next)

### ✅ Approved for C2: Journey Foundation

**Implementation Target:** Development/Test Environment

**Routes:**
1. POST /api/storybook/start
   - Input: (none, session auto-created)
   - Output: { journey_id, restore_url, session_id }
   - Action: Create dt_storybook_journeys record

2. GET /api/storybook/restore?token={token}
   - Input: token (from restore_url)
   - Output: { journey_id, status, restored: true }
   - Action: Verify token hash, create new session

3. GET /api/storybook/my-journey
   - Input: Cookie (dt_storybook_session_id required)
   - Output: { id, wish_text, status, assets: [] }
   - Action: Fetch journey + assets for current session

**Database:**
- No migrations executed (schema prepared only)
- sessionService extended (restore token logic)
- Local storage adapter (development only)

**Testing:**
- Unit tests: token hash/verify
- Integration tests: POST start → GET restore → GET my-journey
- No production deployment

**NOT in C2:**
- ❌ Asset upload
- ❌ Story Art operator route
- ❌ Star planting
- ❌ Operator UI
- ❌ Golden 9 UI
- ❌ Production storage
- ❌ Migration execution
- ❌ V23 changes

---

## Phase C3 Scope (After C2)

### Asset Upload + Operator API

```
1. POST /api/storybook/:journey_id/upload
   - Customer uploads REAL photos (6 total)
   - Auto-update status: photos_in_progress → photos_complete

2. GET /api/admin/storybook/queue
   - Admin sees journeys ready for Story Art

3. POST /api/admin/storybook/:journey_id/upload-story-art
   - Operator uploads Story Art (3 total)
   - Auto-update status: art_in_progress → storybook_complete
```

---

## Phase C4 Scope (After C3)

### Star Integration + skip_artifact

```
1. Modify dreamtownRoutes.js POST /api/dt/stars/create
   - Add ?skip_artifact=true parameter
   - Check flag before creating dt_artifact_jobs

2. POST /api/storybook/:journey_id/plant-star
   - Call star creation with skip_artifact=true
   - Update journey: star_id, status='star_planted'
```

---

## Phase C5 Scope (After C4) — COMPLETE ✅

### Customer Golden 9 Storybook View

**Components Implemented:**
1. ✅ GoldenNineCut.jsx (3×3 canonical grid, mobile-first)
2. ✅ StorybookView.jsx (main container, authorization, status rendering)
3. ✅ PlantStarButton.jsx (star planting CTA, idempotency)

**Features:**
- ✅ Canonical 3×3 grid: jinamgwan → cablecar → jongpo (locked order)
- ✅ Canonical slots: real_a → real_b → story_art (locked order)
- ✅ Mobile-first responsive (480px / 768px / 1025px breakpoints)
- ✅ Authorization-enforced (session cookie required)
- ✅ No cross-journey access
- ✅ Private by default (no public sharing in C5)
- ✅ Star planting integration with C4 endpoint
- ✅ Idempotency guaranteed (no duplicate stars on retry)

**Tests:** 18/18 PASSING (0 failures, 2 regressions pass)

---

## Phase C6 Scope (After C5) — COMPLETE ✅

### Production Storage Bridge (AWS S3)

**Provider Choice:** AWS S3 (standard for Render.com + Express.js apps)

**Implementations:**
1. ✅ StorageAdapter factory pattern (local vs S3)
2. ✅ LocalStorageAdapter (dev/test, NODE_ENV enforced)
3. ✅ S3StorageAdapter (staging/production, signed URLs)
4. ✅ EXIF removal integration (privacy)
5. ✅ Signed URL generation (15-min default TTL)
6. ✅ Safe replacement pattern (new → DB → cleanup)
7. ✅ Authorization enforcement (session-gated access)

**Features:**
- ✅ Private S3 bucket (no public URLs)
- ✅ Signed URLs with time-limited expiry
- ✅ EXIF metadata removal before storage
- ✅ Journey authorization required for URL generation
- ✅ Safe replacement (old photo survives until new confirmed)
- ✅ Storage failure rollback (orphaned objects safe)
- ✅ Configuration-based provider selection
- ✅ No production deployment (staging-ready)

**Tests:** 16/16 PASSING (0 failures, 3 regressions pass)

**Files Modified:**
- `services/storybook/storageAdapter.js` (+246 lines, factory + S3)
- `.env.example` (+34 lines, S3 configuration)
- `tests/storybook-c6.test.js` (405 lines, lifecycle tests)
- `docs/storybook/C6_PRODUCTION_STORAGE_BRIDGE.md` (specification)

---

## Phase C7A Scope (After C6) — READY ✅

### Staging Infrastructure Validation (NOT Production)

**Environment:** Staging S3 bucket + staging DB + staging deployment

**Deliverables:**
1. ✅ S3 bucket provisioning script (infrastructure/staging/s3-bucket-setup.sh)
2. ✅ Staging environment configuration (.env.staging)
3. ✅ Full synthetic journey lifecycle test (tests/c7a-staging-lifecycle.test.js)
4. ✅ Documentation (docs/storybook/C7A_STAGING_VALIDATION.md)

**Test Coverage (10 phases):**
1. Create journey (POST /api/storybook/start)
2. REAL photo uploads × 6 (POST /api/storybook/:id/upload)
3. Story Art uploads × 3 (POST /api/admin/storybook/:id/upload-story-art)
4. Golden 9 with signed URLs (GET /api/storybook/my-journey)
5. Security: Unauthorized access blocked
6. Plant star (POST /api/storybook/:id/plant-star)
7. Restore journey (GET /api/storybook/restore?token=...)
8. Golden 9 after restore (GET /api/storybook/my-journey)
9. Safe replacement (re-upload same slot)
10. Evidence report generation

**Verification:**
- ✅ EXIF removal (privacy)
- ✅ Signed URL TTL (15 min expiry)
- ✅ Unauthorized access denied
- ✅ Safe replacement (old photo survives)
- ✅ Golden 9 renders with S3 assets
- ✅ All C2-C6 regressions pass

**Important:** C7A is staging-only. No production changes. Go/No-Go decision after C7A.

---

## Phase C7B Scope (After C7A Approval)

### Production Migration & Pilot Launch (Separate Approval)

```
C7B: ONLY if C7A passes all verification criteria
    Deploy storage bridge to production
    Launch RAMADA pilot with real customer data
    Monitor production storage (EXIF, signed URLs, security)
```

**Blocked until:** C7A evidence reviewed + production approval given

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| C1_STORYBOOK_V1_SIMPLIFIED.md | Design specification | ✅ COMPLETE |
| V23_ARCHIVE_MANIFEST.md | V23 baseline (Phase A) | ✅ COMPLETE |
| V23_SCHEMA_REFERENCE.md | V23 benefit_coupons schema | ✅ COMPLETE |
| V23_PRODUCTION_BASELINE.md | V23 regression tests | ✅ COMPLETE |
| V23_DEPENDENCIES.md | V23 infrastructure | ✅ COMPLETE |
| V23_BACKUP_RECORD.md | V23 data backup metadata | ✅ COMPLETE |

---

## Completion Status

### Phases Complete

| Phase | Scope | Status | Tests |
|-------|-------|--------|-------|
| **C2** | Journey Foundation | ✅ COMPLETE | 19 passing |
| **C3A** | Customer REAL Photo Upload | ✅ COMPLETE | 65 passing |
| **C3B** | Operator Story Art Upload | ✅ COMPLETE | 9 passing |
| **C4** | Star Planting (skip_artifact) | ✅ COMPLETE | 12 passing |
| **C5** | Customer Golden 9 View | ✅ COMPLETE | 18 passing |
| **C6** | Production Storage Bridge (S3) | ✅ COMPLETE | 16 passing |
| **Contract** | Golden 9 Validation | ✅ COMPLETE | 7 passing |
| **TOTAL** | End-to-end Storybook V1 + Storage | ✅ 146 tests passing | 0 failures |

---

## Next Action (C7A)

### ✅ Staging Infrastructure Validation (READY)

**Scope (Staging Only, NOT Production):**
1. ✅ S3 staging bucket setup script
2. ✅ .env.staging configuration
3. ✅ Full synthetic lifecycle test (10 phases)
4. ✅ Evidence report generation

**Execution (separate session):**
```bash
# Step 1: Provision staging S3 bucket
bash infrastructure/staging/s3-bucket-setup.sh

# Step 2: Configure Render staging environment
# Add to .env on Render staging:
NODE_ENV=staging
STORAGE_TYPE=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=storybook-assets-staging

# Step 3: Deploy to staging
git push origin main:staging

# Step 4: Run full lifecycle test
NODE_ENV=staging npm test -- c7a-staging-lifecycle.test.js

# Step 5: Verify evidence
cat c7a-evidence-report.json
```

**Timeline:** 1 day (staging testing)

**Environment:** Staging S3 bucket (private) + staging DB

**Blockers:** None (all infrastructure prepared)

**Decision Point:** After C7A completes
- ✅ All 10 phases pass → Proceed to C7B (Production approval)
- ❌ Any failure → Fix + re-test (no production until C7A green)

**Report Upon Completion (C7A Evidence):**
- c7a-evidence-report.json (10 phases logged)
- Test results (10/10 passing)
- Storage upload/retrieve/replace/delete evidence
- Security verification (EXIF removed, unauthorized blocked, TTL verified)
- Golden 9 mobile screenshots
- Production untouched confirmation

---

**Phase C6: ✅ COMPLETE** (Production-ready code, not yet deployed)  
**Phase C7A: ✅ READY** (Staging validation prepared)  
**Test Status:** 146/146 PASSING across C2-C6 (+ 10 C7A tests ready)  
**Storage Bridge:** Code complete, infrastructure prepared, staging validation script ready  
**Next Action:** Execute C7A in staging (separate session), then decide C7B (Production)  
**Target:** RAMADA Pilot V1 live after C7A passes + C7B approval
