---
title: RAMADA V23 Sites-Specific Dependencies
runtime: ChatGPT Sites (Cloudflare Workers)
document_date: 2026-08-29
---

# V23 Sites-Specific Dependencies & Configuration

## Runtime Environment

**Platform:** ChatGPT Sites (Cloudflare Workers)  
**Not:** Express.js, Next.js, or traditional Node.js server  
**Deployment:** Via ChatGPT Sites UI editor or API  
**Database Binding:** Cloudflare D1 (configured as "DB")

---

## Database Binding

### Cloudflare D1 Configuration
```wrangler.toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "ramada-v23"
database_id = "[REDACTED]"
```

### Connection Pattern (ChatGPT Sites)
```javascript
// V23 runtime context
export default {
  async fetch(request, env, ctx) {
    const db = env.DB;  // D1 binding
    const result = await db.prepare(
      'SELECT * FROM benefit_coupons WHERE status = ?'
    ).bind('ISSUED').all();
    return new Response(JSON.stringify(result));
  }
};
```

**NOT applicable to daily-miracles-mvp Express:**
- Different runtime (Workers vs Node.js)
- Different env binding mechanism
- Different error handling model

---

## API Endpoints (V23 Sites)

### Public Endpoints
```
POST   /api/coupons/issue
GET    /api/coupons
POST   /api/coupons/:coupon_id/redeem
```

### Admin Endpoints (Auth Required)
```
POST   /api/admin/coupons/create
GET    /api/admin/coupons
PATCH  /api/admin/coupons/:coupon_id
GET    /api/admin/audit
```

### Status Codes
- `200 OK` — Success
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing/invalid auth
- `404 Not Found` — Coupon not found
- `409 Conflict` — Duplicate coupon_id (idempotency)
- `500 Internal Server Error` — D1 unavailable

---

## Authentication (V23 Sites)

**Current Implementation:** Custom token-based (ChatGPT Sites specific)

**Token Format:** [DETAILS REDACTED — secure storage only]

**Admin Operations Require:**
- Valid auth token in header `Authorization: Bearer <token>`
- Token must have admin scope
- Token validation done in V23 middleware

**NOT compatible with:**
- daily-miracles-mvp JWT strategy
- sowon-dreamtown NextAuth
- OAuth2 standard flow

**Integration Note:**
If daily-miracles-mvp calls V23 endpoints, cross-domain auth must be established separately (Phase B decision).

---

## Frontend Framework (V23 Sites)

**Technology:** ChatGPT Sites UI Components  
**Not:** React, Vue, or standard web framework  
**Styling:** Sites default CSS + inline styles  
**Asset Storage:** Sites CDN (not R2 or S3)

### Key UI Components
- Button groups
- Form inputs
- Card layouts
- Admin dashboard view

### Static Assets
- Golden 9-Cut showcase images (non-dynamic)
- Logo and branding
- Partner icons
- Fallback images

---

## Environment Variables (V23)

**Managed via:** ChatGPT Sites project settings (not .env file)

### Known Variables
- `DB` — Cloudflare D1 binding (required)
- `ADMIN_AUTH_TOKEN` — Admin operations gate
- `LOG_LEVEL` — Debug/info/warn/error (if implemented)

### NOT Accessible
- `OPENAI_API_KEY` — Not in V23 scope
- `DATABASE_URL` — Not in ChatGPT Sites model
- `PAYMENT_TOKEN` — Separate system

---

## Logging & Monitoring (V23)

**Platform:** Cloudflare Workers analytics  
**Not:** Traditional application logs

### Available Metrics
- Request latency (Workers dashboard)
- Error rate (HTTP 5xx count)
- D1 query performance (D1 dashboard)
- CPU time (Cloudflare billing metric)

### Logging Strategy (Sites-specific)
- Console.log() → Cloudflare Real-time Logs
- No persistent file logs
- 24-hour retention (default)
- Streaming via `wrangler tail`

### Monitoring NOT Available
- Application-level performance traces
- Slow query logs (D1 basic)
- Custom metrics dashboard

---

## Error Handling Patterns (V23)

### Unrecoverable Errors
```javascript
// D1 connection timeout → return 500
// Invalid SQL query → return 500 + log
// Auth middleware failure → return 401
```

### Expected Error Responses
```json
{
  "error": "Coupon not found",
  "code": "COUPON_NOT_FOUND",
  "status": 404
}
```

### No Automatic Retry
- V23 does not implement client-side retry logic
- Consumers must implement exponential backoff
- D1 queries do not retry on transient failure

---

## Testing in V23

**Test Framework:** ChatGPT Sites test runner (if available)  
**Not:** Jest, Mocha, or standard Node.js frameworks

**Regression Tests (PUB-01 through ADM-08):**
- Manual HTTP testing via curl/Postman
- Not integrated into CI/CD
- Verification done pre-deployment

---

## Deployment (V23)

**Process:** ChatGPT Sites UI editor or API deploy  
**Not:** Git-based, Docker, or Render.com

**Deployment Steps:**
1. Edit code in Sites editor
2. Test in preview environment
3. Publish to production
4. Monitor via Cloudflare dashboard

**Rollback:** Revert to previous Sites version (date-based)

---

## Limitations & Constraints

### Cloudflare Workers Limits
- **Execution time:** 30 seconds max per request
- **Memory:** ~128MB (dynamic allocation)
- **Payload size:** 100MB max
- **Request/response:** ~25MB each

### D1 Limits
- **Query timeout:** 30s (Cloudflare limit)
- **Transaction size:** ~100MB
- **Concurrent connections:** ~10 per D1 instance
- **Backup size:** ~[REDACTED]

### Sites-Specific Constraints
- **No persistent state** (between requests)
- **No background jobs** (use external queue)
- **No WebSocket connections**
- **No direct filesystem access**

---

## Security Model (V23)

### Authentication
- Token-based admin gate
- No API key exposure in URLs
- Bearer token in Authorization header

### Data Protection
- D1 database encryption at rest (Cloudflare managed)
- HTTPS enforced (ChatGPT Sites default)
- No sensitive data in logs
- is_test flag isolates test coupons

### Audit Trail
- Admin operations logged (who, what, when)
- No automatic retention policy (manual export)
- No tamper-detection on historical logs

---

## Integration Blockers for Phase B

### If daily-miracles-mvp Calls V23 D1:
1. **Auth mechanism:** Must establish cross-domain token validation
2. **Error handling:** Express.js must catch D1 errors differently than Workers
3. **Rate limiting:** No built-in rate limiting in D1 (must add at Express layer)
4. **Monitoring:** Need to instrument D1 calls in Express separately

### If migrating D1 → PostgreSQL:
1. **Data export:** D1 dump → SQL transform → PG import
2. **Type mapping:** TEXT/DATETIME → proper PG types
3. **Validation:** All regression tests (PUB-01 through ADM-08) must pass
4. **Fallback:** Keep D1 snapshot for disaster recovery

### If Hybrid (Keep D1 Separate):
1. **Data consistency:** Coupon state must not diverge across systems
2. **Sync strategy:** Change Data Capture (CDC) or periodic audit
3. **Ownership model:** Which system is source of truth?

---

## Recommendations for Integration

### Short-term (Phase B)
- Keep V23 running as-is on ChatGPT Sites
- Do NOT modify V23 codebase until decision made
- Create read-only mirror if audit needed

### Medium-term (Phase 2+)
- Decide on database strategy (separate D1, migrate, hybrid)
- Establish API contract for daily-miracles-mvp integration
- Build adapter layer (if needed)
- Maintain regression test suite

### Long-term (Phase 3+)
- Consider unified authentication
- Evaluate multi-hotel extension
- Plan Storybook integration (if Phase 2 approved)

---

**Archive Date:** 2026-08-29  
**Sites Project ID:** appgprj_6a876b5c27b48191b492849fe1836d7a  
**Next Review:** Phase B Decision (Database Architecture)

---

## References

- **Cloudflare Workers Documentation:** https://developers.cloudflare.com/workers/
- **Cloudflare D1 Documentation:** https://developers.cloudflare.com/d1/
- **ChatGPT Sites:** [Internal documentation]
- **RAMADA V23 Handover:** RAMADA_PILOT_V23_HANDOVER.md (not in this archive)
