---
title: C7A — Staging Infrastructure Validation
phase: C7A
date: 2026-08-30
status: READY FOR TESTING
---

# C7A: Staging Infrastructure Validation

**Phase:** C7A (Supabase Storage Staging Test, NOT Production)  
**Date:** 2026-08-30  
**Status:** ✅ READY FOR EXECUTION  
**Scope:** Supabase Storage (storybook-assets bucket) + Full synthetic journey lifecycle test  
**Deliverables:** Infrastructure setup + Lifecycle tests + Evidence report

---

## Purpose

C7A validates the production storage bridge (C6) in a **staging environment ONLY** — not production. This is critical to:

1. **Verify Supabase Storage integration** works with real (staging) bucket
2. **Test EXIF removal** (privacy)
3. **Test signed URL security** (15-min expiry, unauthorized access denied)
4. **Test safe replacement** (old photo survives if DB fails)
5. **Validate Golden 9** renders with Supabase Storage assets
6. **Generate lifecycle evidence** for production go/no-go decision

**NOT in C7A:**
- ❌ Production Supabase Storage bucket
- ❌ Production DB
- ❌ Real customer data
- ❌ Production deployment
- ❌ RAMADA V23 changes

---

## Infrastructure Setup

### Supabase Storage Bucket

**Location:** Supabase dashboard → Storage

**Setup:**
1. Navigate to Supabase dashboard → dreamtown-storybook-staging project
2. Go to **Storage** section
3. Create bucket named `storybook-assets` (if not already created)
4. Set bucket to **Private** (no public access)
5. No RLS policies needed (backend uses service role key, which bypasses RLS)

**Result:**
```
Bucket:           storybook-assets
Project:          dreamtown-storybook-staging
Access Level:     PRIVATE ✅
Service Role:     Full permissions (RLS bypassed) ✅
Signed URLs:      15-min expiry, backend-only ✅
```

**Configuration Applied:**
- ✅ Private bucket (no public enumeration, no direct URLs)
- ✅ Service role key backend-only (no anon key exposure)
- ✅ No RLS policies (service role has full access)
- ✅ Signed URLs generated server-side, 15-min TTL
- ✅ EXIF removal before upload (privacy enforced)

### Environment Variables

**File:** `.env.staging`

**Key Settings:**
```bash
NODE_ENV=staging
STORAGE_TYPE=supabase

# Supabase Project
SUPABASE_URL=https://[staging-project-id].supabase.co

# Service Role Key (Backend-Only)
# ⚠️ MUST be in Render environment secrets, NOT in git or .env files
SUPABASE_SERVICE_ROLE_KEY=[from-supabase-service-role-secret]

# Storage Bucket (Private)
SUPABASE_STORAGE_BUCKET=storybook-assets

# Signed URL TTL (15 minutes)
SIGNED_URL_TTL_SECONDS=900
```

**Credentials:**
- ✅ Service role key in Render environment secrets ONLY
- ✅ Never expose in logs, git, .env files, or screenshots
- ✅ Backend-only: Not used by client code
- ✅ Automatic: No RLS policy configuration needed

---

## Staging Deployment

### 1. Configure Render (Staging)

**Environment Variables (set in Render dashboard):**
```
NODE_ENV=staging
STORAGE_TYPE=supabase
SUPABASE_URL=https://[staging-project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[from-supabase-service-role-secret]
SUPABASE_STORAGE_BUCKET=storybook-assets
SIGNED_URL_TTL_SECONDS=900
DATABASE_URL=[staging-supabase-connection-string]
```

**⚠️ Render Secrets (Mark as Sensitive):**
- `SUPABASE_SERVICE_ROLE_KEY` — Never expose in logs or output

### 2. Deploy to Staging

```bash
git push origin main:staging
# Render automatically deploys with env vars

# Or verify Render is configured:
# Render dashboard → Settings → Environment → verify SERVICE_ROLE_KEY is set
```

### 3. Verify Deployment

```bash
curl https://storybook-staging.dailymiracles.kr/health
# Expected: 200 OK, { "status": "ok", "storage": "supabase", ... }
```

---

## Full Synthetic Journey Lifecycle (C7A Test)

**Test:** `tests/c7a-staging-lifecycle.test.js`

**Run:**
```bash
NODE_ENV=staging npm test -- c7a-staging-lifecycle.test.js
```

### Journey Flow (10 Phases)

#### Phase 1: Create Journey
```
POST /api/storybook/start
├─ No input required
└─ Returns: journey_id, restore_token, session_id (cookie)

Expected:
- 201 Created
- Set-Cookie: dt_storybook_session_id
- Body: { journey_id, restore_token, restore_url }
```

#### Phase 2: REAL Photo Uploads (6)
```
POST /api/storybook/:journey_id/upload × 6
├─ Payload: location, slot, photo (multipart)
├─ Processing:
│  ├─ MIME validation (image/jpeg|png|webp)
│  ├─ Size check (≤5MB)
│  ├─ EXIF removal (sharp.withMetadata(false))
│  ├─ S3 save (private, ACL: private)
│  └─ DB INSERT dt_storybook_assets
└─ Status transition: photos_in_progress → photos_complete

Canonical Slots:
  jinamgwan: real_a, real_b
  cablecar: real_a, real_b
  jongpo: real_a, real_b

Expected:
- Each: 201 Created
- object_key in S3: storybook/journeys/{id}/jinamgwan/real_a.jpg
- DB asset with object_key (no signed_url)
- After 6: journey.status = photos_complete
```

#### Phase 3: Story Art Uploads (3)
```
POST /api/admin/storybook/:journey_id/upload-story-art × 3
├─ Auth: x-admin-key header
├─ Payload: location, story_art file
├─ Processing: EXIF removal, S3 save, DB INSERT
└─ Status transition: art_in_progress → storybook_complete

Canonical Slots:
  jinamgwan: story_art
  cablecar: story_art
  jongpo: story_art

Expected:
- Each: 201 Created
- After 3: journey.status = storybook_complete
```

#### Phase 4: Golden 9 Signed URLs
```
GET /api/storybook/my-journey
├─ Auth: session_id cookie
└─ Response: journey + 9 assets with signed_url

Expected:
- 200 OK
- Assets: 9 total (6 REAL + 3 Story Art)
- Each asset: { object_key, signed_url, mime_type, ... }
- signed_url pattern (Supabase Storage):
  https://<project-id>.supabase.co/storage/v1/object/sign/<bucket>/<path>?token=<jwt>&expires=900&...
- URL expires after 900 seconds (15 min)
- Backend-generated with service role key (no client exposure)
```

#### Phase 5: Security - Unauthorized Access
```
GET /api/storybook/my-journey
├─ Cookie: fake_session (different journey)
└─ Expected: 401 Unauthorized (or 404 if journey not found)

Test Verifies:
- ✅ Session cookie required
- ✅ Cross-journey access blocked
- ✅ No asset leakage to unauthorized users
```

#### Phase 6: Plant Star
```
POST /api/storybook/:journey_id/plant-star
├─ Auth: session_id cookie
├─ Preconditions: storybook_complete + 9 assets
└─ Processing:
  ├─ Create dt_wishes
  ├─ Create dt_star_seeds
  ├─ Create dt_stars (skip_artifact=true)
  └─ UPDATE dt_storybook_journeys: status=star_planted, star_id

Expected:
- 201 Created
- Body: { star_id, journey_status: "star_planted" }
- No dt_artifact_jobs created (skip_artifact enforced)
- Storybook star ≠ regular star (no DALL-E job)
```

#### Phase 7: Restore Journey
```
GET /api/storybook/restore?token=<restore_token>
├─ No cookie needed (restore_token is the secret)
├─ Processing:
│  ├─ Hash token: SHA256(token)
│  ├─ Lookup: dt_storybook_journeys WHERE restore_token_hash = ...
│  └─ Create new session
└─ Returns: journey_id, status, session_id (new cookie)

Expected:
- 200 OK
- Set-Cookie: dt_storybook_session_id (new session)
- Body: { journey_id, status: "star_planted", ... }
- New session can access same journey
```

#### Phase 8: Golden 9 After Restore
```
GET /api/storybook/my-journey
├─ Auth: new session_id (from restore)
└─ Expected: Same journey, same 9 assets, same status

Verifies:
- ✅ Star planted is preserved
- ✅ Assets still retrievable (S3)
- ✅ Signed URLs still generated
```

#### Phase 9: Safe Replacement
```
Create new journey, upload REAL, then re-upload same slot
├─ Original: /storybook/journeys/{id}/jinamgwan/real_a.jpg
├─ Replacement: /storybook/journeys/{id}/jinamgwan/real_a.jpg
├─ S3 behavior: Overwrite OR versioning
└─ DB: Update object_key to new version

Verifies:
- ✅ Re-upload succeeds
- ✅ Old version kept (S3 versioning)
- ✅ Safe rollback if DB fails
```

#### Phase 10: Evidence Report
```
Generate: c7a-evidence-report.json
├─ Timestamp: Test execution time
├─ Environment: NODE_ENV, STORAGE_TYPE, S3 bucket
├─ Journey: ID, status, star_id
├─ Assets: All 9 with object_keys
└─ Lifecycle: All 10 phases logged

Saved to: ./c7a-evidence-report.json
```

---

## Security & Privacy Verification

### C7A Verification Checklist

**Storage Privacy:**
- [ ] Supabase bucket is PRIVATE (no public access)
- [ ] No public URLs ever returned (always signed)
- [ ] Service role key backend-only (no client exposure)
- [ ] No RLS policies needed (service role bypasses them)
- [ ] Bucket accessible only via signed URLs or service role

**Credential Security:**
- [ ] SUPABASE_SERVICE_ROLE_KEY NOT in .env.staging
- [ ] SUPABASE_SERVICE_ROLE_KEY NOT in git/logs
- [ ] SUPABASE_SERVICE_ROLE_KEY ONLY in Render environment secrets
- [ ] Marked as Sensitive in Render dashboard (redact from logs)
- [ ] No other keys (anon key) used for backend operations

**EXIF Removal:**
- [ ] Photos uploaded have EXIF/GPS (synthetic tests)
- [ ] Backend removes EXIF before S3 save
- [ ] Verify with `exiftool` on downloaded object
  ```bash
  # Get signed URL from GET /api/storybook/my-journey
  curl "<signed_url>" > /tmp/photo.jpg
  exiftool /tmp/photo.jpg | grep -i "gps\|exif"
  # Expected: No GPS, no EXIF metadata
  ```

**Signed URL Security:**
- [ ] URLs include expires parameter (900 seconds = 15 min)
- [ ] URLs include JWT token (Supabase signing)
- [ ] Unauthorized sessions cannot generate URLs
- [ ] Different journey sessions get different signed URLs
- [ ] Signed URLs expire after 15 minutes (tested with old URLs)

**Authorization:**
- [ ] Session cookie required (POST /start → get cookie)
- [ ] Different session → different journey → 401/404
- [ ] Cross-journey asset access fails
- [ ] Restore token (from journey) can create new session

---

## Evidence Artifacts

### Generated During C7A Test

1. **c7a-evidence-report.json**
   - Complete journey metadata
   - All 10 phases logged with timestamps
   - Asset keys + sizes
   - Environment configuration

2. **Test Output (stdout)**
   - 10 test cases pass/fail
   - Detailed phase logs
   - Error details (if any)

3. **Cloud Logs** (Render staging)
   - Request logs (POST /upload, GET /my-journey, etc.)
   - Storage adapter logs (S3 operations)
   - DB transaction logs

### Proof of Execution

To verify C7A was completed:

1. **Check evidence file:**
   ```bash
   cat c7a-evidence-report.json | jq '.lifecycle | length'
   # Expected: 10 (all phases completed)
   ```

2. **Check test results:**
   ```bash
   npm test -- c7a-staging-lifecycle.test.js
   # Expected: 10 tests passing
   ```

3. **Check staging logs:**
   ```bash
   # Render dashboard → Staging app → Logs
   # Expected: POST /upload, S3 save, GET /my-journey, signed URLs
   ```

4. **Verify S3 objects:**
   ```bash
   aws s3 ls s3://storybook-assets-staging/storybook/journeys/ --recursive
   # Expected: 9 objects (6 REAL + 3 Story Art)
   ```

---

## Failure Scenarios & Rollback

### If C7A Fails

**Scenario 1: Supabase Upload Fails**
```
Symptom: 500 error in POST /upload
Action:
  1. Check SUPABASE_SERVICE_ROLE_KEY in Render environment secrets
  2. Check SUPABASE_URL is correct (dreamtown-storybook-staging)
  3. Check bucket exists and is PRIVATE
  4. Check @supabase/supabase-js installed (v2.38.0+)
Rollback: No data loss (DB not updated if Supabase upload fails)
```

**Scenario 2: Signed URL Generation Fails**
```
Symptom: signed_url is null in GET /my-journey
Action:
  1. Check SUPABASE_SERVICE_ROLE_KEY is valid
  2. Check bucket is accessible (not deleted)
  3. Check SIGNED_URL_TTL_SECONDS is set
  4. Check @supabase/supabase-js version
Rollback: No data loss (URLs are generated per-request, no side effects)
```

**Scenario 3: EXIF Removal Fails**
```
Symptom: EXIF metadata still in object
Action:
  1. Verify sharp version installed
  2. Check image format (JPEG vs PNG)
  3. Check sharp.withMetadata(false) called before toBuffer()
Rollback: Re-upload (replacement pattern)
```

**Scenario 4: Session Unauthorized**
```
Symptom: 401 in GET /my-journey
Action:
  1. Check session cookie set (POST /start)
  2. Check cookie name correct (dt_storybook_session_id)
  3. Check DB session_id matches
Rollback: Re-create session (POST /start)
```

---

## Next: Production Go/No-Go Decision

**After C7A completes**, separate approval required for C7B (Production).

**Go Criteria (All must pass):**
- [ ] All 10 C7A phases pass
- [ ] Golden 9 renders with real Supabase Storage assets
- [ ] Signed URLs expire correctly (15 min)
- [ ] Unauthorized access blocked
- [ ] EXIF removed (exiftool verification)
- [ ] Safe replacement works (re-upload)
- [ ] No production data exposed
- [ ] Staging logs clean (no errors)
- [ ] C2-C6 regressions still pass
- [ ] Service role key never exposed in logs

**No-Go Criteria (Any failure):**
- [ ] Supabase service role key permission errors
- [ ] EXIF removal fails
- [ ] Signed URL expiry wrong
- [ ] Authorization bypass possible
- [ ] Data loss risk in replacement
- [ ] Service role key exposed in logs/git
- [ ] Production bucket created by accident

**Decision:** User reviews C7A evidence, approves or rejects C7B.

---

## Files Created / Updated

| File | Purpose | Status |
|------|---------|--------|
| `services/storybook/storageAdapter.js` | SupabaseStorageAdapter (service role) | ✅ Updated |
| `.env.staging` | Staging config (Supabase) | ✅ Updated |
| `.env.example` | Documentation (no secrets) | ✅ Updated |
| `tests/c7a-staging-lifecycle.test.js` | Full lifecycle tests | Ready |
| `docs/storybook/C7A_STAGING_VALIDATION.md` | This doc (Supabase) | ✅ Updated |

---

**C7A Status: READY FOR TESTING**  
**Next:** Execute C7A on staging (separate session)  
**Then:** Review evidence, decide C7B (Production)

