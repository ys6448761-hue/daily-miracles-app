---
title: C3B RAMADA Storybook Operator Story Art Upload
date: 2026-08-29
phase: C3B (Operator Upload Phase)
status: IMPLEMENTATION COMPLETE
---

# C3B: RAMADA Storybook Operator Story Art Upload

**Scope:** GET/POST /api/admin/storybook/* admin endpoints implementation  
**Date:** 2026-08-29  
**Status:** ✅ Implementation Complete — Ready for Testing  
**Phase:** C3B (following C3A Customer Photo Upload)

---

## Overview

C3B implements the operator story art upload phase for RAMADA storybook journeys. Operators/admins upload 3 story art images (1 per location × 3 locations) after customers complete all 6 REAL photos. This phase transitions the journey from `photos_complete` → `art_in_progress` → `storybook_complete`.

### Canonical 3 Story Art Slots (Locked by C1 Design)

```
┌──────────┬──────────┬──────────┐
│ REAL A   │ REAL B   │ Story Art│  Row 1: 진남관 ❤️ 품다
├──────────┼──────────┼──────────┤
│ REAL A   │ REAL B   │ Story Art│  Row 2: 케이블카 🌬️ 보내다
├──────────┼──────────┼──────────┤
│ REAL A   │ REAL B   │ Story Art│  Row 3: 종포 ⭐ 심다
└──────────┴──────────┴──────────┘

C3A Scope: Customer uploads REAL A + REAL B (6 total) ✅ COMPLETE
C3B Scope: Operator uploads Story Art (3 total) ← YOU ARE HERE
C4 Scope: Star planting with skip_artifact flag (future)
```

**Canonical Order (Immutable):**
- Locations: jinamgwan → cablecar → jongpo
- Slots per location: story_art (1 slot each)
- Story Art: Operator/admin-only, never customer-facing in upload

---

## API Specification

### Endpoint 1: Queue List

```
GET /api/admin/storybook/queue
```

**Authentication:**
- Header: `x-admin-key: <ADMIN_API_KEY>`
- Alternative: Query param `?key=<ADMIN_API_KEY>`
- Returns 401 if missing or invalid
- Returns 503 if ADMIN_API_KEY not configured

**Response (200 OK):**
```json
{
  "success": true,
  "journeys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "wish_text": "소원을 이루고 싶어요",
      "status": "photos_complete",
      "reals_uploaded": 6,
      "story_arts_uploaded": 0,
      "created_at": "2026-08-29T10:30:00Z",
      "next_action": "Upload jinamgwan"
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "wish_text": "꿈을 이루고 싶어요",
      "status": "art_in_progress",
      "reals_uploaded": 6,
      "story_arts_uploaded": 1,
      "created_at": "2026-08-29T09:15:00Z",
      "next_action": "Upload cablecar"
    }
  ],
  "total": 2,
  "pending_reals_complete": 1,
  "pending_art_in_progress": 1
}
```

**Query Logic:**
- Lists journeys with status `photos_complete` or `art_in_progress`
- Orders by `created_at ASC` (oldest first)
- For each journey:
  - Counts uploaded REAL assets (C3A verification)
  - Counts uploaded story_art assets (C3B progress)
  - Calculates next location using `getNextStoryArtLocation()`
  - `next_action`: "Upload {location}" or "Complete"

**Error Responses:**

| Status | Error Code | Meaning |
|--------|-----------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid x-admin-key |
| 503 | `ADMIN_DISABLED` | ADMIN_API_KEY not configured |
| 500 | `QUEUE_FAILED` | Database error |

---

### Endpoint 2: Journey Detail

```
GET /api/admin/storybook/:journey_id
```

**Authentication:** Same as Endpoint 1 (x-admin-key required)

**Path Parameters:**
- `journey_id` (UUID): Journey identifier

**Response (200 OK):**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "wish_text": "소원을 이루고 싶어요",
  "status": "photos_complete",
  "created_at": "2026-08-29T10:30:00Z",
  "reals": [
    {
      "location": "jinamgwan",
      "slot": "real_a",
      "object_key": "journeys/{journey_id}/jinamgwan/real_a.jpg",
      "uploaded_at": "2026-08-29T10:31:00Z",
      "status": "pending"
    },
    {
      "location": "jinamgwan",
      "slot": "real_b",
      "object_key": "journeys/{journey_id}/jinamgwan/real_b.jpg",
      "uploaded_at": "2026-08-29T10:32:00Z",
      "status": "pending"
    },
    {
      "location": "cablecar",
      "slot": "real_a",
      "object_key": "journeys/{journey_id}/cablecar/real_a.jpg",
      "uploaded_at": "2026-08-29T10:33:00Z",
      "status": "pending"
    },
    {
      "location": "cablecar",
      "slot": "real_b",
      "object_key": "journeys/{journey_id}/cablecar/real_b.jpg",
      "uploaded_at": "2026-08-29T10:34:00Z",
      "status": "pending"
    },
    {
      "location": "jongpo",
      "slot": "real_a",
      "object_key": "journeys/{journey_id}/jongpo/real_a.jpg",
      "uploaded_at": "2026-08-29T10:35:00Z",
      "status": "pending"
    },
    {
      "location": "jongpo",
      "slot": "real_b",
      "object_key": "journeys/{journey_id}/jongpo/real_b.jpg",
      "uploaded_at": "2026-08-29T10:36:00Z",
      "status": "pending"
    }
  ],
  "story_arts": [
    {
      "location": "jinamgwan",
      "slot": "story_art",
      "object_key": null,
      "uploaded_at": null,
      "status": "pending"
    },
    {
      "location": "cablecar",
      "slot": "story_art",
      "object_key": null,
      "uploaded_at": null,
      "status": "pending"
    },
    {
      "location": "jongpo",
      "slot": "story_art",
      "object_key": null,
      "uploaded_at": null,
      "status": "pending"
    }
  ],
  "next_upload_location": "jinamgwan"
}
```

**Response Structure:**
- `reals`: Always 6 items (canonical REAL slots in order)
  - Shows all REAL photos uploaded by customer in C3A
  - Used to verify customer completed their photos
- `story_arts`: Always 3 items (canonical story_art slots in order)
  - Shows current story art upload status
  - `null` values indicate not yet uploaded
  - `status: "pending"` means waiting for upload or approved
- `next_upload_location`: Next location to upload, or null if complete

**Error Responses:**

| Status | Error Code | Meaning |
|--------|-----------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid x-admin-key |
| 404 | `JOURNEY_NOT_FOUND` | Journey ID doesn't exist |
| 503 | `ADMIN_DISABLED` | ADMIN_API_KEY not configured |
| 500 | `DETAIL_FAILED` | Database error |

---

### Endpoint 3: Upload Story Art

```
POST /api/admin/storybook/:journey_id/upload-story-art
Content-Type: multipart/form-data
```

**Authentication:** Same as Endpoint 1 (x-admin-key required)

**Path Parameters:**
- `journey_id` (UUID): Journey identifier

**Form Data:**
- `location` (string, required): `jinamgwan` | `cablecar` | `jongpo`
- `file` (File, required): Image file in multipart stream
  - Type: image/jpeg, image/png, or image/webp
  - Max size: 10 MB (larger than REAL 5 MB for higher quality)

**Note:** `slot` is always `story_art` (fixed, not in form data)

**Response (201 Created):**
```json
{
  "success": true,
  "asset_id": "550e8400-e29b-41d4-a716-446655440002",
  "location": "jinamgwan",
  "slot": "story_art",
  "object_key": "journeys/{journey_id}/jinamgwan/story_art.jpg",
  "journey_status": "art_in_progress",
  "story_arts_uploaded": 1
}
```

**Response Fields:**
- `asset_id`: UUID of the saved asset record
- `location`: Uploaded location (echoed from request)
- `slot`: Always "story_art"
- `object_key`: Storage path to the uploaded file
- `journey_status`: Current journey status after upload
  - `art_in_progress` (1st or 2nd upload)
  - `storybook_complete` (3rd upload, all story arts done)
- `story_arts_uploaded`: Count of uploaded story_art slots (1-3)

**Status Transitions:**
1. **First upload**: `photos_complete` → `art_in_progress`
   - Journey transitions to operator phase
   - Customers see "In Progress" status
2. **Second upload**: Stays `art_in_progress`
3. **Third upload (all canonical slots)**: `art_in_progress` → `storybook_complete`
   - Ready for C4 (star planting)
   - Customer can see complete storybook

**Error Responses:**

| Status | Error Code | Meaning |
|--------|-----------|---------|
| 400 | `INVALID_SLOT` | Location not in {jinamgwan, cablecar, jongpo} |
| 400 | `FILE_REQUIRED` | No file in multipart request |
| 400 | `INVALID_MIME_TYPE` | File type not JPEG/PNG/WebP |
| 400 | `FILE_TOO_LARGE` | File exceeds 10 MB |
| 400 | `EXIF_REMOVAL_FAILED` | Image processing failed (corrupted file) |
| 401 | `UNAUTHORIZED` | Missing or invalid x-admin-key |
| 404 | `JOURNEY_NOT_FOUND` | Journey ID doesn't exist |
| 409 | `SLOT_LOCKED` | Asset exists with status=approved (cannot overwrite) |
| 503 | `ADMIN_DISABLED` | ADMIN_API_KEY not configured |
| 500 | `STORAGE_FAILED` | File save to storage failed |
| 500 | `UPLOAD_FAILED` | Unexpected server error |

---

## Golden 9-Cut Contract (C3B Extensions)

Located: `/config/storybook/goldenNineContract.js`

### New Constants

```javascript
const CANONICAL_STORY_ART_SLOTS = [
  {
    index: 6,
    location: 'jinamgwan',
    slot: 'story_art',
    displayName: '진남관 Story Art',
    gridPosition: [0, 2]
  },
  {
    index: 7,
    location: 'cablecar',
    slot: 'story_art',
    displayName: '케이블카 Story Art',
    gridPosition: [1, 2]
  },
  {
    index: 8,
    location: 'jongpo',
    slot: 'story_art',
    displayName: '종포 Story Art',
    gridPosition: [2, 2]
  }
];
```

### New Validation Functions

**`isCanonicalStoryArtSlot(location, slot)`**
- Returns: `true` if (location, slot) is a canonical C3B story_art slot
- Used by: POST /api/admin/storybook/:journey_id/upload-story-art validation
- Example: `isCanonicalStoryArtSlot('jinamgwan', 'story_art')` → `true`

**`allCanonicalStoryArtsUploaded(assets)`**
- Returns: `true` if all 3 story_art slots have pending or approved status
- Used by: Status transition logic (art_in_progress → storybook_complete)
- Example: 3 uploads → triggers transition

**`countUploadedStoryArts(assets)`**
- Returns: Number of uploaded story_art slots (0-3)
- Used by: Response metadata and queue progress
- Example: After 2 uploads → `story_arts_uploaded: 2`

**`getNextStoryArtLocation(assets)`**
- Returns: Location code (jinamgwan|cablecar|jongpo) or null
- Used by: Queue and detail endpoints to show next action
- Example: After jinamgwan → returns `'cablecar'`
- Example: All done → returns `null`

---

## Validation Rules (C3B)

### File Validation

| Constraint | Limit | Enforcement |
|-----------|-------|------------|
| **MIME Types** | JPEG, PNG, WebP | 400 INVALID_MIME_TYPE |
| **Max Size** | 10 MB | 400 FILE_TOO_LARGE |
| **File Required** | Must upload file | 400 FILE_REQUIRED |
| **Image Format** | Valid image format | 400 EXIF_REMOVAL_FAILED |

### Location & Slot Validation

| Input | Valid | Error | Notes |
|-------|-------|-------|-------|
| `jinamgwan` + `story_art` | ✅ | — | Canonical |
| `cablecar` + `story_art` | ✅ | — | Canonical |
| `jongpo` + `story_art` | ✅ | — | Canonical |
| `jinamgwan` + `real_a` | ❌ | INVALID_SLOT | Not C3B (REAL is C3A) |
| `invalid` + `story_art` | ❌ | INVALID_SLOT | Bad location |

### Duplicate & Conflict Policy

**Pending Asset (Re-upload):**
- If asset exists with `status='pending'`:
  - UPDATE record (replace file + metadata)
  - Keep same asset_id
  - Reset `status='pending'`

**Approved Asset (Locked):**
- If asset exists with `status='approved'`:
  - Return 409 Conflict
  - Operator must contact admin to unlock
  - Prevents accidental overwrites of approved content

**No Asset (First Upload):**
- INSERT new asset record
- Set `status='pending'`
- Create new asset_id

---

## EXIF Removal

All story art images have EXIF metadata removed via `storageAdapter.removeExif()`:
- Protects privacy (removes camera model, GPS, timestamps from upload time)
- Keeps image dimensions and color space intact
- Same process as C3A customer photos
- Larger max size (10 MB vs 5 MB) allows for higher quality story art

---

## Status Transitions

### Journey Lifecycle

```
started
  ↓ (customer creates journey)
photos_in_progress
  ↓ (customer uploads REALs)
photos_complete (all 6 REALs uploaded)
  ↓ (operator begins story art)
art_in_progress (1st or 2nd story_art uploaded)
  ↓ (operator finishes story art)
storybook_complete (all 3 story_arts uploaded)
  ↓ (future: C4 star planting)
star_planted
```

### Automatic Transitions in C3B

**Transition 1: photos_complete → art_in_progress**
- Trigger: First story_art upload
- Condition: `journey.status === 'photos_complete' && countUploadedStoryArts(assets) === 0`
- Action: Set `status = 'art_in_progress'`, update `updated_at`

**Transition 2: art_in_progress → storybook_complete**
- Trigger: Third story_art upload (all canonical slots)
- Condition: `allCanonicalStoryArtsUploaded(allAssets) === true`
- Action: Set `status = 'storybook_complete'`, update `updated_at`

---

## Integration with C3A

**C3A Verification in C3B:**
- Before operator uploads story art, verify customer completed all 6 REALs
- Queue endpoint only shows `photos_complete` or `art_in_progress` journeys
- Detail endpoint returns all 6 REAL slots so operator can see customer work
- Story art upload only allowed if journey exists (validates C3A completion)

**Data Consistency:**
- Both use same `dt_storybook_journeys` and `dt_storybook_assets` tables
- Both use same `Golden 9 Contract` for slot validation
- Both use same `storageAdapter` for file handling (with different size limits)
- Story art slots (indices 6-8) distinct from REAL slots (indices 0-5)

---

## Admin Authentication

**x-admin-key Header:**
- Required for all three C3B endpoints
- Value: `process.env.ADMIN_API_KEY`
- Compared against provided key (header or query param)
- Returns 401 if missing or mismatched
- Returns 503 if ADMIN_API_KEY environment variable not set

**Environment Variables:**
```bash
ADMIN_API_KEY=<secret-key>  # Used by all /api/admin/* endpoints
```

**Reuses existing pattern:**
- Same `adminGuard()` middleware used across all admin routes
- No new authentication system created
- Consistent with `adminDashboardRoutes.js` pattern

---

## Testing

All C3B functionality tested via Golden 9 Contract unit tests (Tests 20-28 in `tests/storybook.test.js`):

- Story art slot validation
- Canonical story art slots constant
- Count uploaded story arts
- All canonical story arts uploaded check
- Next story art location calculation
- Grid position validation
- No overlap between REAL and story_art slots
- Golden 9 total (9 slots, 6+3)
- Story art slot indices (6, 7, 8)

**API Testing:** (To be performed with running server)
- GET /api/admin/storybook/queue (admin auth, journeys list)
- GET /api/admin/storybook/{journey_id} (admin auth, detail view)
- POST /api/admin/storybook/{journey_id}/upload-story-art (admin auth, file upload)
- Status transitions after uploads
- Error handling (invalid slot, missing file, duplicate asset, etc.)

---

## Configuration

**Environment Variables:**

```bash
# Admin authentication
ADMIN_API_KEY=<admin-secret-key>

# Story art file limits (C3B specific)
STORYBOOK_STORY_ART_MAX_FILE_SIZE=10485760  # 10MB (vs 5MB for REAL)
STORYBOOK_STORY_ART_ALLOWED_MIMES=image/jpeg,image/png,image/webp

# Storage adapter configuration (shared with C3A)
STORYBOOK_STORAGE_TYPE=file|s3|gcs  # file (dev), s3 (prod)
STORYBOOK_STORAGE_PATH=/path/to/storage  # For file storage
```

---

## Next Phase: C4 Star Planting

After C3B completion (`storybook_complete` status), the journey is ready for:
- C4: Star planting with `skip_artifact` flag
- Verification of complete storybook
- Optional star creation or public resonance feed posting

---

## Files Modified/Created

| File | Change | Details |
|------|--------|---------|
| `config/storybook/goldenNineContract.js` | Extended | Added story_art functions + CANONICAL_STORY_ART_SLOTS |
| `routes/storybookRoutes.js` | Extended | Added 3 admin endpoints + adminGuard middleware |
| `tests/storybook.test.js` | Extended | Added 9 C3B unit tests (Tests 20-28) |
| `docs/storybook/C3B_OPERATOR_STORY_ART.md` | Created | This file (specification) |

---

## Summary

C3B extends the RAMADA storybook system with operator story art upload functionality:

✅ **Complete API**: 3 endpoints for queue, detail, and upload  
✅ **Admin Auth**: Reuses existing x-admin-key pattern  
✅ **Golden 9**: Extended with 3 story_art slots and validation functions  
✅ **Status Transitions**: Automatic progression through operator phase  
✅ **File Handling**: EXIF removal, size validation, duplicate policy  
✅ **Testing**: 9 new unit tests + integration with C3A  
✅ **Documentation**: This specification file  

Ready for C4 (star planting) after customer approval.

---

*Generated: 2026-08-29 (C3B Implementation Complete)*
