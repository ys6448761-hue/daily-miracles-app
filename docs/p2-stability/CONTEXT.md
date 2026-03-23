# CONTEXT — P2.2 requestId + errorHandler + Wiring

## Current State
- All P2.2 components are LIVE on branch `feat/p1-ssot-8mode`
- 29/29 tests passing (`tests/middleware/errorHandler.test.js`)
- No regressions detected in existing functionality

## Architecture

### Middleware Chain Order (server.js)
```
CORS (line 608)
  → Compression (line 658)
  → Body Parsing (lines 672-682)
  → Request ID (line 693)         ← assigns req.requestId
  → Stability Tracking (line 697)
  → Static Files (line 702)
  → Route Handlers (lines 1275-1482)
  → 404 Handler (line 2078)
  → Global Error Handler (line 2079) ← catches all errors
```

### Error Classification (8 types)
| Error Class | Condition | HTTP Status |
|-------------|-----------|-------------|
| Validation | CastError / ValidationError | 400 |
| DB | DatabaseError / SQLITE_* codes | 500 |
| OpenAI/External | OpenAIError / status 4xx | 5xx |
| RateLimit | ServiceLimitError / statusCode 429 | 429 |
| System | ENOENT / EACCES / EMFILE / ECONNRESET / ETIMEDOUT | 500 |
| Unknown | Anything else | 500 |

### Response Format
**Dev mode:** Full stack, error_class, request_id, field/resource details
**Prod mode:** Korean user-friendly message, error_class, request_id (no stack)

### Slack Alert Flow
```
500-level error detected
  → alertCooldown.check(key, severity)
  → If allowed: fire-and-forget Slack message
  → If suppressed: log suppression, skip
```

## File Map
| File | Lines | Role |
|------|-------|------|
| `middleware/requestId.js` | 14 | UUID assignment |
| `middleware/errorHandler.js` | 305 | Classification + response + Slack alerts |
| `middleware/alertCooldown.js` | 91 | Cooldown gate (3-tier) |
| `utils/errors.js` | — | AppError class hierarchy |
| `server.js:134-137` | 4 | Slack sender init |
| `server.js:693` | 1 | requestId wiring |
| `server.js:2078-2079` | 2 | 404 + errorHandler wiring |
| `tests/middleware/errorHandler.test.js` | 246 | 29 test cases |

## Decisions
| Decision | Rationale |
|----------|-----------|
| Lazy Slack sender injection | Avoids circular dependency (errorHandler ← slackHeartbeatService) |
| Fire-and-forget alerts | Never blocks HTTP response to user |
| 3-tier cooldown (5m/2m/10m) | Balances alert speed vs noise: critical=fast, degraded=slow |
| requestId honors X-Request-ID header | Supports reverse proxy / load balancer request tracing |

## P2.1 vs P2.2 Boundary
| Layer | Handler | Location | On Error |
|-------|---------|----------|----------|
| Process-level | uncaughtException | server.js:2150 | Slack + exit(1) |
| Process-level | unhandledRejection | server.js:2155 | Slack + log (no exit) |
| Request-level | globalErrorHandler | middleware/errorHandler.js | Classify + respond + Slack |
| Request-level | notFoundHandler | middleware/errorHandler.js | 404 → globalErrorHandler |

No duplication between P2.1 and P2.2.

---

## P2.2 Post-Hardening (2026-02-22)

### Added
- `req.log` — per-request child logger (Winston `.child({ requestId })`) with tolerant loading
- `requestLogger` mounted in server.js — privacy-safe structured access log with requestId
- `alertCooldown` memory cap — MAX 10,000 entries + O(n) emergency purge at 75% + 1s burst guard
- `_purge()` observability — logs purgedCount + remainingSize + durationMs
- `res._errorClass` — set once per error in globalErrorHandler for requestLogger consumption

### Middleware Chain (updated)
```
Request ID (line 713)         ← assigns req.requestId + req.log
  → Request Lifecycle Logger  ← structured access log (privacy-safe)
  → Stability Tracking
  → Static Files
  → Routes
  → 404 Handler
  → Error Handler             ← sets res._errorClass
```

### Privacy Policy (requestLogger)
Logs ONLY: `method`, `originalUrl`, `statusCode`, `durationMs`, `requestId`, `headersSent`, `error_class`.
**Never logs**: request/response bodies, cookies, authorization headers, user-agent, IP, or any PII.

### Test Coverage
- 29 original tests (`errorHandler.test.js`)
- 45 post-hardening tests (`p22-post-hardening.test.js`)

---

## P2.3-1 req.log Migration (2026-02-22)

### Scope
Migrated 3 routes from `console.*` to `req.log` (structured, per-request Winston child logger with requestId).
Fixed critical PII leaks in wishRoutes.js.

### Routes Migrated
| Route | console → req.log | PII Fixes |
|-------|-------------------|-----------|
| `routes/videoJobRoutes.js` | 1 (+ 1 new info) | None |
| `routes/wuRoutes.js` | 6 | None |
| `routes/wishRoutes.js` | 21 | Phone, name, birthdate removed from logs |

### Pattern
```javascript
const log = req.log || console;        // In POST handler
(req.log || console).error(...)        // In individual handlers
```

### PII Fixes (CRITICAL)
| Before | After |
|--------|-------|
| `rawPhone: rawPhone` (full phone!) | `reason: 'invalid_length', length: N` |
| `normalizedPhone: normalizedPhone` | Removed entirely |
| `New wish: ${name} (${gem})` | `signal, gem, wantMessage` only |
| `${wishId} → ${birthdate}` | `wishId` only |

### Test Coverage
- 111 migration tests (`p23-reqlog-migration.test.js`)
- 29+45 existing tests (P2.2) — no regressions

---

## P2.3-2a Settlement req.log Migration (2026-02-22)

### Scope
Migrated `settlementRoutes.js` (15 console calls → 14 req.log + 1 module-level kept).
Added financial redaction helpers to prevent monetary/identity exposure in logs.

### Redaction Helpers
```javascript
redactId(id)           // 'evt_123456789' → '…456789' (last 6 only)
bucketAmount(amount)   // 4500 → '1k-9k' (bucketed, not exact)
```

### Routes Migrated
| Route | console → req.log | Redaction |
|-------|-------------------|-----------|
| `routes/settlementRoutes.js` | 14 | redactId + bucketAmount in checkInvariant |

### Financial Safety
- **Forbidden keys verified absent**: token, authorization, card, account, signature, bank, secret, password, credential, buyer_user_id, creator_root_id, referrer_id
- **Error objects**: only `error.message` logged, never raw error with stack
- **Monetary amounts**: bucketed (0-9, 10-49, 50-99, 100-999, 1k-9k, 10k+)
- **Event IDs**: last 6 chars only via `redactId()`

### Test Coverage
- 111 total migration tests (50 P2.3-1 + 61 P2.3-2a)
- Full P2 suite: 29 + 45 + 111 = 185/185

### Remaining
- `routes/wishImageRoutes.js` — 18 console calls (future PR)

---
*Updated: 2026-02-22 (P2.3-2a Settlement req.log Migration)*
