---
title: RAMADA Storybook V1 — Simplified Design (C1 Final Approved)
date: 2026-08-29
phase: C1 (Conditional Approval with Corrections Applied)
status: READY FOR C2 IMPLEMENTATION
---

# RAMADA Storybook V1 — Simplified Design

**Date:** 2026-08-29  
**Phase:** C1 (Design Complete, Ready for Phase C2)  
**Scope:** Minimal viable first iteration (5-10 RAMADA pilot customers)  
**Status:** ✅ APPROVED with corrections

---

## APPROVED DECISIONS (C1)

### ✅ Journey Status Model (Simplified)

```
started 
  → photos_in_progress
  → photos_complete
  → art_in_progress
  → storybook_complete
  → star_planted
```

**Exclusions:**
- ❌ Photo approval/rejection workflow
- ❌ Separate status for each photo slot
- ❌ Admin decision queue

---

### ✅ Schema: dt_storybook_journeys + dt_storybook_assets

**Table 1: dt_storybook_journeys**
```sql
CREATE TABLE dt_storybook_journeys (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            VARCHAR(255) NOT NULL UNIQUE,
  restore_token_hash    VARCHAR(255),  -- SHA256, no plaintext
  wish_text             TEXT NOT NULL,
  source_hotel          VARCHAR(50) DEFAULT 'yeosu',
  status                VARCHAR(30) NOT NULL DEFAULT 'started',
  operator_notes        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  star_planted_at       TIMESTAMPTZ,
  star_id               UUID,  -- FK to dt_stars, nullable
  is_private            BOOLEAN DEFAULT true,
  deletion_requested_at TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ
);
```

**Table 2: dt_storybook_assets**
```sql
CREATE TABLE dt_storybook_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id        UUID NOT NULL REFERENCES dt_storybook_journeys(id) ON DELETE CASCADE,
  location          VARCHAR(20) NOT NULL,  -- jinamgwan | cablecar | jongpo
  slot              VARCHAR(20) NOT NULL,  -- real_a | real_b | story_art
  object_key        VARCHAR(500) NOT NULL,
  mime_type         VARCHAR(50) NOT NULL,
  byte_size         INT NOT NULL,
  uploaded_by       VARCHAR(255),
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            VARCHAR(20) DEFAULT 'pending',
  rejection_reason  TEXT,
  
  UNIQUE (journey_id, location, slot),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT location_valid CHECK (location IN ('jinamgwan', 'cablecar', 'jongpo')),
  CONSTRAINT slot_valid CHECK (slot IN ('real_a', 'real_b', 'story_art'))
);
```

**No JSONB metadata blob** — separate table provides better query performance & audit trail.

---

### ✅ Private Restore (Token Hash Only)

**Design:**
```
1. POST /api/storybook/start
   → restore_token = crypto.randomBytes(32).toString('hex')
   → restore_token_hash = SHA256(restore_token)
   → DB: save hash only
   → Response: restore_url with token (customer keeps it)

2. GET /api/storybook/restore?token={restore_token}
   → Hash & match against DB
   → Create new session if match
   → Set HttpOnly cookie
   
3. GET /api/storybook/my-journey
   → Cookie required (journey_id alone → 401)
```

**Exclusions (V1):**
- ❌ Email input/SMS sending
- ❌ Email-based restore
- ❌ "Reset password" flow
- ❌ Account registration

---

### ✅ Star Planting (No New Artifact Generation)

**Design:**
```
dt_storybook_journeys (completed)
  + wish_text
  + REAL 6 photos
  + Story Art 3
  
POST /api/storybook/:journey_id/plant-star?skip_artifact=true
  ↓
INSERT INTO dt_wishes (wish_text, user_id=NULL, sku='storybook_v1')
  ↓
INSERT INTO dt_star_seeds
  ↓
INSERT INTO dt_stars (star_stage='day1')
  ↓
[SKIP] dt_artifact_jobs creation (skip_artifact=true)
  ↓
UPDATE dt_storybook_journeys SET star_id, status='star_planted'
  ↓
Result: Star is created, but NO new WishArt image generated
```

**Why:** Storybook's Golden 9-Cut IS the visual representation. No second image needed.

---

### ✅ Operator Workflow (Minimal)

**Three routes only:**

```
1. GET /api/admin/storybook/queue
   → journeys where status='photos_complete'

2. GET /api/admin/storybook/:journey_id
   → Display REAL 6 + wish_text

3. POST /api/admin/storybook/:journey_id/upload-story-art
   → Accept story_art for each location
   → Auto-update status when all 3 complete
```

**Exclusions (V1):**
- ❌ Photo approval/rejection UI
- ❌ Admin statistics
- ❌ Role-based permissions
- ❌ Audit dashboard

---

### ✅ Golden 9-Cut Rendering (Dynamic, Corrected Order)

**APPROVED Layout: REAL A | REAL B | Story Art (each row)**

```
┌──────────┬──────────┬──────────┐
│ 진남관   | 진남관   | 진남관   │
│ REAL A   | REAL B   | Story Art│  Row 1: jinamgwan ❤️ 품다
├──────────┼──────────┼──────────┤
│ 케이블카 | 케이블카 | 케이블카 │
│ REAL A   | REAL B   | Story Art│  Row 2: cablecar 🌬️ 보내다
├──────────┼──────────┼──────────┤
│ 종포     | 종포     | 종포     │
│ REAL A   | REAL B   | Story Art│  Row 3: jongpo ⭐ 심다
└──────────┴──────────┴──────────┘
```

**Canonical Order Locked:**
- Row position = location order (jinamgwan → cablecar → jongpo)
- Column position = slot order (real_a → real_b → story_art)
- Story Art at **position 3** (third column), NOT first

**Implementation:**
```javascript
const locations = ['jinamgwan', 'cablecar', 'jongpo'];
const slots = ['real_a', 'real_b', 'story_art'];

<div className="grid grid-cols-3 gap-4">
  {locations.map(loc => (
    slots.map(slot => (
      <img key={`${loc}-${slot}`} 
           src={getSignedUrl(journey.id, loc, slot)} />
    ))
  ))}
</div>
```

---

## 🚨 STORAGE RULE (Corrected)

### ❌ Local Filesystem: Development/Test Only

```
/public/images/storybook/journeys/{id}/...
└─ Acceptable: Local development, unit tests
└─ NOT acceptable: Production pilot, customer data
└─ Problem: Render ephemeral filesystem (lost at redeploy)
```

### ✅ Production Pilot REQUIRES: Private Durable Object Storage

**Must satisfy:**
1. ✅ Private bucket/object (no public enumeration)
2. ✅ Authenticated access (signed URL or credential-based)
3. ✅ Short-lived URLs (15 minutes expiry minimum)
4. ✅ EXIF removal (before storage)
5. ✅ MIME/size validation (before upload)
6. ✅ Journey authorization (only owner access)
7. ✅ Deletion capability (GDPR compliance)

**Recommended (Production):**
- Cloudflare R2 (low cost, Render-native)
- AWS S3 (standard, proven)

**NOT acceptable:**
- ❌ Render ephemeral /public
- ❌ Public URLs without expiry
- ❌ Customer photos on static file server

### Implementation

```javascript
// services/storageAdapter.js

class StorageAdapter {
  async saveFile(buffer, objectKey, mimeType, context) {
    if (process.env.STORAGE_TYPE === 'local') {
      // Development only
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Local storage not permitted in production');
      }
      // ... local save logic
    }
    
    if (process.env.STORAGE_TYPE === 'r2') {
      // Production: R2
      return await this.saveToR2(buffer, objectKey);
    }
    
    throw new Error(`STORAGE_TYPE not configured`);
  }

  async removeExif(buffer) {
    return await sharp(buffer)
      .withMetadata(false)
      .toBuffer();
  }

  async getSignedUrl(objectKey, expirySeconds = 900) {
    // V1 local: plain URL (no expiry)
    // V2 R2: R2 presigned URL (15-min expiry)
    if (process.env.STORAGE_TYPE === 'local') {
      return `/images/storybook/${objectKey}`;
    }
    
    if (process.env.STORAGE_TYPE === 'r2') {
      return this.r2Client.presignedUrl(objectKey, expirySeconds);
    }
  }
}
```

---

## EXCLUSIONS (V1)

```
❌ AI Story Art automation
❌ SNS auto-share
❌ Public gallery
❌ Email/SMS restore
❌ Multi-hotel UI
❌ Coupon integration
❌ V23 D1 migration
❌ Legacy cleanup
❌ Full core refactor
❌ Photo approval workflow
❌ Role-based admin
❌ Composite image generation
```

---

## NEXT PHASE: C2 Implementation

### ✅ Approved for C2: Journey Foundation Only

**Scope (Single Phase):**
1. dt_storybook_journeys table (no migration, design only)
2. dt_storybook_assets table (no migration, design only)
3. Private restore token/hash logic
4. POST /api/storybook/start
5. GET /api/storybook/restore?token=...
6. GET /api/storybook/my-journey

**Environment:** Development/Test only (local storage)

**NOT in C2:**
- ❌ Production migration
- ❌ RAMADA V23 changes
- ❌ Customer photo upload
- ❌ Star planting
- ❌ Artifact skip logic
- ❌ Operator UI
- ❌ Golden 9 UI
- ❌ Production deployment

### After C2 Approval

```
C2 → Journey Foundation (dev/test)
  ↓
C3 → Asset Upload + Operator API (dev/test)
  ↓
C4 → Star Integration + skip_artifact (dev/test)
  ↓
C5 → Frontend (React) + Golden 9 UI (dev/test)
  ↓
C6 → Production Storage Bridge (R2/S3 setup)
  ↓
C7 → Production Migration + Pilot Launch
```

---

**Status:** ✅ READY FOR C2 PHASE  
**Approval Date:** 2026-08-29  
**Next:** C2 Journey Foundation Implementation (dev/test environment)
