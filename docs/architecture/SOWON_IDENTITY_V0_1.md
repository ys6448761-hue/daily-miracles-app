# SOWON_ID Core — Identity V0.1

**Date:** 2026-09-12  
**Status:** Commit 1A — Additive Foundation  
**Scope:** Identity resolution layer only (no authentication, no authorization)

---

## 1. Purpose & Core Principle

### SOWON_ID Definition

> **SOWON_ID = Relationship Continuity Identity**
>
> **WHO are we connected with?**

SOWON_ID is the persistent identifier that bridges multiple sessions, multiple devices, and multiple interactions to maintain a single continuous relationship.

It is NOT an authentication credential. It is NOT a permission grant. It is a relationship thread.

### Three Separations (Critical)

**Identity ≠ Authentication ≠ Authorization**

```
SOWON_ID
= Who are we connected with
= Additive to existing voyage_* structures

Authenticated Principal
= Have you proven you are that person
= Verified via middleware (JWT, session, SMS proof)

Authorization
= Do you own this resource / have this permission
= Checked after authentication + identity binding
```

Violating this separation creates security vulnerabilities.

---

## 2. Schema Design

### sowon_identity_map

**Purpose:** Root lifecycle of a SOWON_ID

| Field | Type | Notes |
|-------|------|-------|
| `sowon_id` | UUID PK | Single source of truth |
| `creation_source` | VARCHAR(50) | 'qr_entry', 'phone_auth', 'migration', etc |
| `is_anonymous` | BOOL | true until first VERIFIED identifier |
| `created_at` | TIMESTAMP | Identity birth |
| `first_verified_at` | TIMESTAMP NULL | When first VERIFIED binding occurred |
| `last_activity_at` | TIMESTAMP NULL | Last session / interaction |

**Constraints:** PK only, no FKs to voyage_* (additive only)

### sowon_identity_bindings

**Purpose:** Track which identifiers link to which SOWON_ID + conflict detection

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | Binding record |
| `sowon_id` | UUID FK | Which SOWON_ID this identifier binds to |
| `identifier_type` | VARCHAR(50) | 'session_key', 'phone', 'email', 'oauth', 'user_id', etc |
| `identifier_value` | VARCHAR(256) | PII: actual phone/email/etc |
| `binding_status` | VARCHAR(50) | VERIFIED \| USER_EXPLICIT \| UNVERIFIED |
| `verification_method` | VARCHAR(50) NULL | SMS \| EMAIL_CONFIRM \| OAUTH \| null |
| `verification_proof` | VARCHAR(512) NULL | Token/nonce/JWT for audit |
| `linked_at` | TIMESTAMP | When binding created |
| `first_verified_at` | TIMESTAMP NULL | When VERIFIED status set |
| `merge_candidate_resolution` | VARCHAR(50) NULL | ACCEPTED \| REJECTED \| PENDING_USER_CONFIRMATION |
| `merge_decision_at` | TIMESTAMP NULL | When resolution decided |

**Constraints:**
- `UNIQUE(identifier_type, identifier_value)` — no two SOWON_IDs can have same identifier
- `FK sowon_id` with ON DELETE CASCADE
- `CHECK binding_status IN ('VERIFIED', 'USER_EXPLICIT', 'UNVERIFIED')`

### Why Separate Tables?

Keeping identifiers in separate table allows:
- Extensibility for new identifier types (Discord ID, wallet address, etc)
- Cleaner schema evolution
- Flexible conflict tracking (merge_candidate_resolution)
- Audit trail per identifier

---

## 3. Identifier Classification

### VERIFIED

**Proof of Ownership:**
- SMS confirmation (user receives code, enters it)
- Email double-opt-in (user clicks link)
- OAuth provider token (provider authenticates user)
- Future: hardware wallet signature

**Trust Level:** High — can be used for authentication binding

**Behavior:**
- Can link identifier to SOWON_ID
- VERIFIED phone at SOWON_ID_A + attempt to link same phone to SOWON_ID_B = CONFLICT
- No auto-merge of histories

### USER_EXPLICIT

**User's Own Claim:**
- "My phone is 010-1234-5678"
- "My email is user@example.com"
- "I go by John"

**Trust Level:** Medium — user stated, not cryptographically verified

**Behavior:**
- Can link to SOWON_ID
- If same identifier exists as VERIFIED elsewhere = CONFLICT, ask user to confirm
- Never automatically promoted to VERIFIED
- Requires later SMS/email proof to become VERIFIED

### UNVERIFIED

**Untrusted Third-Party Claim:**
- "User A says phone belongs to User B"
- System deduction without user confirmation
- Legacy data without clear proof

**Trust Level:** Low — rejected for identity binding

**Behavior:**
- Does not create identity binding
- Belongs in logs/audit, not sowon_identity_bindings
- Requires manual investigation + decision before promotion

### INFERRED

**AI/System Extraction (Not in Identity Layer)**

Example:
- "User mentioned they work in Seoul" → inferred location
- "User's message pattern suggests evening availability" → inferred schedule

**Trust Level:** Very Low — belongs to MAEK (memory layer), not identity

**Behavior:**
- Never stored in sowon_identity_bindings
- Never used for authentication
- Belongs in SOWON_MAEK as "INFERRED" fact
- Can be promoted to USER_EXPLICIT only if user confirms ("Yes, that's right")

---

## 4. Critical Invariants

### ✓ Binding ≠ Merge

**Wrong way (forbidden):**
```javascript
// NEVER DO THIS
if (phone_is_VERIFIED_at_SOWON_A && phone_same_as_SOWON_B) {
  merge(SOWON_A, SOWON_B);  // ← WRONG
}
```

**Right way:**
```javascript
// DO THIS
if (phone_is_VERIFIED_at_SOWON_A && phone_same_as_SOWON_B) {
  record_merge_candidate(SOWON_B, {
    conflict_sowon_id: SOWON_A,
    conflict_binding_status: 'VERIFIED',
    resolution_needed: true
  });
  // Resolution decision = Commit 1B / later
}
```

**Why?** Phone number reuse, shared devices, legacy data collisions = must be human-reviewed before merging history.

### ✓ Zero Privilege from Identity

**Never:**
```javascript
if (req.sowon_id) {
  return allow();  // ← WRONG
}
```

**Always:**
```javascript
requireAuthenticated();
const sowon_id = resolvePrincipalSowonId();
const resource = loadResource(resource_id);
verifyOwnership(resource, sowon_id);
return allow();
```

SOWON_ID is "who are we connected with", not "are you authorized".

### ✓ USER_EXPLICIT Never Auto-Promoted to VERIFIED

**Never:**
```javascript
if (user_said_phone_twice) {
  upgrade(USER_EXPLICIT → VERIFIED);  // ← WRONG
}
```

**Always require cryptographic proof:**
```javascript
if (user_claims_phone) {
  send_sms_code(phone);
  if (user_enters_code_correctly) {
    upgrade(USER_EXPLICIT → VERIFIED);
  }
}
```

### ✓ No Authorization Logic in Commit 1A

Forbidden:
```javascript
isAdmin()
grantRole()
canAccess(resource)
authorizeBooking()
```

These belong to TRACK B + Commit 1B.

---

## 5. API Contract

### 7 Core Methods

```javascript
// 1. Create anonymous SOWON_ID (no identifiers yet)
createAnonymousSowon(creationSource: string)
→ {sowon_id, status: 'CREATED', is_anonymous: true}

// 2. Lookup existing SOWON_ID from identifier (never creates)
resolveSowonId(identifier: {type, value})
→ {sowon_id, status: 'FOUND', binding_status} | {sowon_id: null, status: 'NOT_FOUND'}

// 3. Link VERIFIED identifier (SMS/Email/OAuth proof required)
linkVerifiedIdentifier(sowon_id, identifier: {type, value, verification_method, verification_proof})
→ {sowon_id, status: 'VERIFIED'} | {error: 'IDENTITY_CONFLICT', conflict_sowon_id}

// 4. Link USER_EXPLICIT identifier (user's claim, not proof)
linkUserExplicitIdentifier(sowon_id, identifier: {type, value, context})
→ {sowon_id, status: 'CLAIMED', requires_verification: true}
  OR {merge_candidate_status: 'CONFLICT_DETECTED', conflict_sowon_id}

// 5. Check identifier availability (no conflicts)
isIdentifierAvailable(identifier: {type, value})
→ {available: true} | {available: false, conflict_sowon_id}

// 6. Get all identifiers linked to SOWON_ID (with PII masking)
getLinkedIdentifiers(sowon_id)
→ {sowon_id, is_anonymous, identifiers: [{type, value_masked, binding_status, ...}], created_at}

// 7. Record merge conflict resolution (does NOT merge yet)
resolveMergeCandidate(decision: {sowon_id_current, sowon_id_candidate, identifier, resolution})
→ {result: 'RECORDED', merge_candidate_resolution}
```

---

## 6. Safety Rules

### PII Masking

**Input:** "010-1234-5678"  
**Output:** "010-****-5678"

Service masks PII in all output to prevent accidental logging of sensitive data.

### Conflict Detection

**Never silently overwrite:**
- If phone already bound to SOWON_A, and user tries to link to SOWON_B
- Service returns conflict, not silent overwrite
- Conflict recorded for manual review

### Idempotency

**Multiple calls with same parameters return same result:**
```javascript
linkVerifiedIdentifier(sowon_id, phone)
→ first call: status = 'VERIFIED'
→ second call: status = 'ALREADY_LINKED' (same result, not error)
```

---

## 7. Non-Goals (Commit 1A Exclusions)

**Not in this commit:**
- ❌ Authentication enforcement (no middleware)
- ❌ Authorization checks (no permission logic)
- ❌ Cross-SOWON merge (no auto-merge, no merge operation)
- ❌ Route modifications (voyageRoutes.js untouched)
- ❌ MAEK implementation (separate layer)
- ❌ Admin remediation (separate TRACK B)
- ❌ PII encryption (separate infrastructure)

---

## 8. Integration Path to Commit 1B

### Commit 1A Output

✓ SOWON_ID creation works  
✓ Identity binding works  
✓ Conflict detection works  
✓ No authorization logic  
✓ No route changes

### Commit 1B Input

**Authentication middleware will:**
1. Verify authenticated request (JWT/session middleware)
2. Resolve authenticated principal → SOWON_ID via `resolveSowonId()`
3. Load resource
4. Verify resource.owner_sowon_id == req.sowon_id
5. ALLOW or 403 FORBIDDEN

**Commit 1B Output:**

✓ First write-back to voyage_wishes.owner_sowon_id  
✓ Cross-user isolation fixed (P0-1)  
✓ Booking ownership verified (P0-2)  
✓ Admin bypass removed (P0-3)

---

## 9. Future: Identity Verification Flow

**Phone SMS:**
```
User claims: 010-1234-5678
System sends SMS code
User enters code
linkVerifiedIdentifier(sowon_id, {type: 'phone', value: '010-1234-5678', method: 'SMS', proof: 'user_sms_token'})
binding_status = 'VERIFIED'
```

**Email:**
```
User claims: user@example.com
System sends confirmation link
User clicks link
linkVerifiedIdentifier(sowon_id, {type: 'email', value: 'user@example.com', method: 'EMAIL_CONFIRM', proof: 'email_token'})
```

**OAuth:**
```
User auth via Google/Apple/etc
OAuth provider returns identity
linkVerifiedIdentifier(sowon_id, {type: 'oauth_google', value: 'google_uid_123', method: 'OAUTH', proof: 'id_token'})
```

All detailed in future design documents.

---

## 10. Testing

**14 test cases cover:**
- ✓ Anonymous SOWON_ID creation uniqueness
- ✓ Identifier resolution
- ✓ VERIFIED identifier binding
- ✓ VERIFIED identifier conflict rejection
- ✓ USER_EXPLICIT identifier binding
- ✓ USER_EXPLICIT conflict detection
- ✓ Idempotency
- ✓ PII masking
- ✓ Merge candidate recording
- ✓ Zero authorization logic

All tests pass with mock database (no external dependencies).

---

## 11. Rollback

**Migration rollback is simple:**
```sql
DROP TABLE sowon_identity_bindings CASCADE;
DROP TABLE sowon_identity_map CASCADE;
```

**Reason:** Additive only, no existing schema modified.

Existing voyage_wishes, bookings, quotes, stars unchanged.

---

## 12. Key Decision: Why Not Auto-Merge?

**Question:** If VERIFIED phone at SOWON_A, and same phone appears at SOWON_B, why not auto-merge?

**Answer:**
1. **Phone reuse:** Legacy accounts, shared family phone, business line
2. **Device sharing:** Roommates, siblings, partner's device
3. **Service confusion:** User created account twice by mistake
4. **Fraud:** Bad actor trying to claim another's account

Auto-merge could:
- Lose user's separate contexts (work account vs personal)
- Merge incompatible history
- Create audit nightmare

Manual resolution preserves data integrity. Future Commit 1B will add UI to guide legitimate merges.

---

**Commit 1A Complete**

Next: Commit B1 (Authentication Boundary) in parallel.
