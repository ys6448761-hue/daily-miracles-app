# Authenticated Principal Boundary V0.1

**Date:** 2026-09-13  
**Status:** COMMIT B1 Complete  
**Integration:** Ready for Commit B2 (Resource Ownership)

---

## 1. Purpose

Establish authentication boundary for DreamTown protected routes.

**Two credential types** are recognized:

```
USER
  ↓ Existing JWT from authRoutes.js
  ↓ Email/password login
  ↓ roles may be present

GUEST
  ↓ Server-issued signed token
  ↓ Kenny QR entry (no login required)
  ↓ roles always = []
```

Both normalize to **req.principal** structure.

---

## 2. Critical Invariants

### Authentication ≠ Authorization

This middleware enforces **authentication boundary only**:

```
✅ Verifies credential signature
✅ Checks expiry
✅ Normalizes to req.principal
❌ Does NOT check resource ownership
❌ Does NOT check permission/role (except for empty GUEST roles)
❌ Does NOT grant privilege from client-supplied params (?admin=true)
```

### No Client-Controlled Identity

**Forbidden:**
```
body.user_id
query.user_id
body.sowon_id
?admin=true
body.roles
```

**Reason:** Client input cannot determine principal. Only server-signed credentials are authoritative.

### GUEST ≠ Public

Guest credentials are server-issued and rate-limited by TTL. They are NOT public access.

```
GUEST
  ≠ Unauthenticated
  ≠ Public
  = Authenticated as "Guest" type
    (verified server-issued credential)
```

---

## 3. Dual Credential Model

### USER (Existing JWT)

**Source:** `authRoutes.js` signup/login  
**Signing:** `jwt.sign({userId, email}, JWT_SECRET, {expiresIn: '7d'})`  
**Verification:** `jwt.verify(token, JWT_SECRET)`  
**Algorithm:** HS256 (default)  
**TTL:** 7 days (configurable via JWT_EXPIRES_IN env)

**Payload:**
```json
{
  "userId": "string",
  "email": "string@example.com"
}
```

### GUEST (Server-Issued)

**Source:** Kenny QR bootstrap (`POST /api/cablecar/enter`)  
**Signing:** `jwt.sign({sub, principal_type: 'GUEST', iat, exp, jti}, GUEST_JWT_SECRET)`  
**Verification:** `jwt.verify(token, GUEST_JWT_SECRET)`  
**Algorithm:** HS256  
**TTL:** 24 hours (configurable via GUEST_TOKEN_TTL env)

**Payload:**
```json
{
  "sub": "principal_id",
  "principal_type": "GUEST",
  "iat": 1234567890,
  "exp": 1234567890,
  "jti": "unique_guest_id"
}
```

**Constraints:**
- No `admin` field
- No `roles` field (roles: [] always)
- No client-supplied privilege
- No sowon_id ownership assertion

---

## 4. Principal Contract

Both credentials normalize to:

```typescript
req.principal = {
  principal_id: string,
  principal_type: 'USER' | 'GUEST',
  authentication_method: 'JWT' | 'SIGNED_GUEST_TOKEN',
  authenticated_at: number (milliseconds),
  roles: string[]  // empty for GUEST, may contain entries for USER
}
```

**Usage:**
```javascript
if (req.principal?.principal_type === 'GUEST') {
  // Handle guest-specific logic
}

if (req.principal?.roles?.includes('ADMIN')) {
  // ONLY for USER; GUEST roles always []
}

// Never trust identity from body/query:
const user_id = req.principal.principal_id;  // ✅ Correct
const user_id = req.body.user_id;              // ❌ Wrong
```

---

## 5. Middleware Contract

### requireAuthenticatedPrincipal()

**Location:** `middleware/authenticatedPrincipal.js`

**Behavior:**
```javascript
app.use('/api/protected-route', requireAuthenticatedPrincipal, routeHandler);
```

**On success:**
```
401 UNAUTHORIZED → next() NOT called
```

**On success:**
```
req.principal ← normalized
next() → route handler
```

**Error codes:**
- `AUTHENTICATION_REQUIRED` — No credential
- `INVALID_CREDENTIAL` — Signature mismatch
- `AUTH_EXPIRED` — Token expired

---

## 6. Guest Bootstrap

### Special Exception: QR Entry

`POST /api/cablecar/enter` is the **only** endpoint that can issue GUEST credentials without prior authentication.

```javascript
router.post('/api/cablecar/enter', async (req, res) => {
  // 1. Check: existing credential?
  let principal_id = null;

  if (req.headers.authorization) {
    // Authenticate if provided
    // req.principal set by middleware
    principal_id = req.principal.principal_id;
  } else {
    // New guest: issue credential server-side
    const sowonService = require('./services/sowonIdentityService');
    const guest = require('./services/guestCredentialService');

    const sowon = await sowonService.createAnonymousSowon('qr_entry');
    const cred = await guest.issueGuestCredential(sowon.sowon_id);

    return res.status(201).json({
      token: cred.token,
      sowon_id: cred.sowon_id,
      principal_id: cred.guest_principal_id,
      expires_in: cred.expires_in
    });
  }

  // 2. Proceed with QR entry flow
  // ...
});
```

**All other protected routes:**
```javascript
app.use(requireAuthenticatedPrincipal);  // 401 if no credential
```

---

## 7. SOWON_ID Integration (Non-Blocking)

After successful authentication, optional SOWON_ID resolution:

```javascript
app.use('/api', requireAuthenticatedPrincipal, async (req, res, next) => {
  if (req.principal) {
    try {
      const sowonService = require('./services/sowonIdentityService');
      const resolution = await sowonService.resolveSowonId({
        type: 'principal_id',
        value: req.principal.principal_id
      });
      req.sowon_id = resolution.sowon_id;  // May be null if not in system
    } catch (err) {
      // Non-blocking: continue even if SOWON_ID lookup fails
      console.warn('SOWON_ID resolution failed:', err);
    }
  }
  next();
});
```

**Key:** SOWON_ID lookup does NOT block authentication.

```
req.principal exists     ← Authentication success
req.sowon_id = null     ← OK (new user not yet in SOWON_ID system)
```

---

## 8. Error Semantics

**401 UNAUTHORIZED**
- Missing credential
- Invalid signature
- Expired token
- Tampered token
- No authenticated principal

**403 FORBIDDEN** (Note: NOT in B1 middleware)
- Authenticated but insufficient permission
- Authenticated but resource owned by someone else
- Implemented in Commit B2 (requireResourceOwner)

**400 Bad Request**
- Malformed credential format (e.g., missing Bearer prefix)

---

## 9. Security Invariants (Verified)

- ✅ **USER JWT server-verified:** jwt.verify() with JWT_SECRET
- ✅ **GUEST token server-signed:** jwt.sign() + verify()
- ✅ **Guest ≠ public:** Must have token to authenticate
- ✅ **roles=[] for Guest:** No privilege escalation path
- ✅ **No client-controlled principal:** Query/body params ignored
- ✅ **No dev bypass:** NODE_ENV check removed; auth enforced everywhere
- ✅ **SOWON_ID ≠ credential:** Separate layer (non-blocking)
- ✅ **Authentication ≠ authorization:** No ownership checks here

---

## 10. Non-Goals (Commit B1 Scope)

**Not implemented in this commit:**
- ❌ Resource ownership verification (Commit B2)
- ❌ Admin role enforcement (Commit B3)
- ❌ Cross-SOWON identity merge
- ❌ Session-based auth (token-only)
- ❌ OAuth/social login (future)
- ❌ 2FA/MFA (future)

---

## 11. Integration Boundary: Commit 1B

After Commit B2 (Resource Ownership) is complete:

```
Request
  ↓
requireAuthenticatedPrincipal (B1)
  ↓
req.principal = {type: USER|GUEST, roles: [], ...}
  ↓
(optional) resolvePrincipalSowonId (TRACK A integration)
  ↓
req.sowon_id = linked_or_null
  ↓
requireResourceOwner (B2)
  ↓
Check: resource.owner_sowon_id == req.sowon_id
  ↓
ALLOW / 403 FORBIDDEN
```

---

## 12. Files Changed

- `middleware/authenticatedPrincipal.js` — Main middleware
- `services/guestCredentialService.js` — Guest token issuer
- `tests/unit/authenticatedPrincipal.test.js` — 18+ tests
- `docs/architecture/AUTHENTICATED_PRINCIPAL_V0_1.md` — This file

---

## 13. Test Coverage

**18 test cases:**
1. USER JWT authentication
2. GUEST token authentication
3. No credential → 401
4. body.user_id ignored
5. query.user_id ignored
6. body.sowon_id ignored
7. Guest token issuance
8. Guest ↔ SOWON_ID mapping
9. Returning guest (same token)
10. Guest roles empty
11. ?admin=true ignored
12. Tampered token → 401
13. Expired token → 401
14. GUEST A + client body.user_id B → remains A
15. Client-supplied sowon_id ignored
16. USER JWT (new user) without SOWON_ID
17. Guest revocation
18. Commit 1A regression

**All passing.**

---

## 14. Next Steps

**COMMIT B2 — Resource Ownership Enforcement**

Will implement:
- `requireResourceOwner()` middleware
- Wish ownership verification
- Booking ownership verification
- 403 FORBIDDEN on ownership mismatch
- Integration with SOWON_ID (read-only)

---

**COMMIT B1: Authenticated Principal Boundary — COMPLETE ✅**
