# CHECKLIST — P2.2 requestId + errorHandler + Wiring

## Definition of Done

### Code Gates
- [x] `middleware/requestId.js` — UUID via crypto.randomUUID()
- [x] `middleware/requestId.js` — honors incoming X-Request-ID header
- [x] `middleware/requestId.js` — sets X-Request-Id response header
- [x] `middleware/errorHandler.js` — 8-class error classification
- [x] `middleware/errorHandler.js` — dev mode: full stack + request_id
- [x] `middleware/errorHandler.js` — prod mode: Korean messages + request_id (no stack)
- [x] `middleware/errorHandler.js` — Slack alert for 500-level (fire-and-forget)
- [x] `middleware/errorHandler.js` — headersSent guard (no double-send)
- [x] `middleware/alertCooldown.js` — 3-tier cooldown (5m/2m/10m)
- [x] `middleware/alertCooldown.js` — auto-purge stale entries (10 min cycle)
- [x] `server.js` — requestId loaded BEFORE all routes
- [x] `server.js` — notFoundHandler registered AFTER all routes
- [x] `server.js` — globalErrorHandler registered LAST
- [x] `server.js` — Slack sender initialized conditionally
- [x] No duplicate process handlers (P2.1 intact, not duplicated)

### Test Cases (29/29 PASS)
- [x] RequestId: generates UUID when no header
- [x] RequestId: honors X-Request-ID header
- [x] Error classification: ValidationError → 400
- [x] Error classification: DatabaseError → 500
- [x] Error classification: OpenAIError → 5xx
- [x] Error classification: ServiceLimitError → 429
- [x] Error classification: System error → 500
- [x] Error classification: Plain Error → Unknown
- [x] Error classification: SQLite → DB
- [x] Error classification: CastError → Validation
- [x] Slack alert: 500-level triggers alert
- [x] Slack alert: 400-level does NOT trigger
- [x] Slack alert: cooldown suppresses repeat
- [x] Response: Dev mode includes stack
- [x] Response: Prod mode hides stack
- [x] Response: headersSent guard works
- [x] 404 handler: creates AppError with path
- [x] ... (+ 12 more edge cases)

### Verification Commands
```bash
# Run P2.2 tests
npx jest tests/middleware/errorHandler.test.js --no-coverage

# Verify requestId wiring in server.js
grep -n "requestId" server.js

# Verify error handler wiring
grep -n "globalErrorHandler\|notFoundHandler" server.js
```

## Rollback
If issues found:
1. Remove `app.use(requestIdMiddleware)` from server.js (line 693)
2. Remove `app.use(notFoundHandler)` + `app.use(globalErrorHandler)` (lines 2078-2079)
3. Routes revert to inline try/catch error handling

---

## P2.2 Post-Hardening (requestId propagation + memory safety)

### Code Gates
- [x] `middleware/requestId.js` — creates `req.log` child logger with requestId
- [x] `config/logger.js` — requestLogger includes requestId, originalUrl, durationMs, error_class
- [x] `middleware/errorHandler.js` — sets `res._errorClass` once per error + requestId in log meta
- [x] `middleware/alertCooldown.js` — MAX_COOLDOWN_ENTRIES cap (10,000)
- [x] `middleware/alertCooldown.js` — emergency purge at 75% threshold with 1s burst guard
- [x] `middleware/alertCooldown.js` — `_purge()` logs purgedCount + remainingSize + durationMs
- [x] `server.js` — requestLogger mounted AFTER requestId, BEFORE routes
- [x] No P2.1 crash handlers duplicated
- [x] No new Slack alert paths added

### Observability Gates
- [x] `/healthz` returns `X-Request-Id` response header
- [x] 404 responses include `request_id` in JSON body
- [x] 500 responses include `request_id` in JSON body
- [x] **No sensitive data in logs** — requestLogger logs only: method, originalUrl, statusCode, durationMs, requestId, headersSent, error_class. No request/response bodies, cookies, authorization headers, or PII.

### Post-Hardening Tests (45/45 PASS)
- [x] req.log created with requestId metadata
- [x] req.log.info/error/warn work without throwing
- [x] requestLogger includes requestId in 200/404/500 logs
- [x] durationMs is a non-negative finite number
- [x] 404 logs include meaningful originalUrl
- [x] End-to-end: X-Request-Id in response header
- [x] End-to-end: request_id in 404/500 response body
- [x] End-to-end: requestId in Slack alert payload
- [x] MAX_COOLDOWN_ENTRIES exported = 10,000
- [x] Emergency purge fires at MAX, reduces to 75%
- [x] Emergency purge burst guard (1s cooldown)
- [x] Regular purge removes stale entries, preserves fresh
- [x] Regression: 404/500 behavior unchanged

### Verification Commands
```bash
# Original P2.2 tests
node tests/middleware/errorHandler.test.js          # 29/29

# Post-hardening tests
node tests/middleware/p22-post-hardening.test.js     # 45/45

# Combined
npm run test:p2
```

---

## P2.3-1 req.log Migration (console → req.log + PII fix)

### Code Gates — PR 1: videoJobRoutes + wuRoutes
- [x] `routes/videoJobRoutes.js` — module-level console.log/error kept (no req context)
- [x] `routes/videoJobRoutes.js` — background exec error uses `bgLog.error` (captured before detach)
- [x] `routes/videoJobRoutes.js` — job creation `log.info` added for traceability
- [x] `routes/videoJobRoutes.js` — `req.log || console` fallback pattern
- [x] `routes/wuRoutes.js` — module-level console.log/error/warn kept (no req context)
- [x] `routes/wuRoutes.js` — 6 catch blocks migrated to `(req.log || console).error`
- [x] `routes/wuRoutes.js` — structured action tags: start, get, answer, complete, abandon, getProfile
- [x] `routes/wuRoutes.js` — zero request-scoped console calls remain

### Code Gates — PR 2: wishRoutes (PII fix)
- [x] `routes/wishRoutes.js` — module-level console.log/warn kept (2 calls)
- [x] `routes/wishRoutes.js` — 21 request-scoped log calls migrated to `req.log`
- [x] `routes/wishRoutes.js` — `const log = req.log || console` at POST handler top
- [x] `routes/wishRoutes.js` — `(req.log || console)` fallback in GET/other handlers
- [x] **PII FIX**: phone_rejected logs length only (no phone value)
- [x] **PII FIX**: phone_validated logs rawLen/normalizedLen only
- [x] **PII FIX**: wish_received, ack_generated — no name in logs
- [x] **PII FIX**: daily_limit — no name in logs
- [x] **PII FIX**: birthdate_saved — no birthdate value in logs
- [x] **PII FIX**: All 18 structured log tags present

### Migration Tests (50/50 PASS)
- [x] videoJobRoutes: req.log || console fallback
- [x] videoJobRoutes: structured background error log
- [x] videoJobRoutes: job creation info log
- [x] wuRoutes: 6 structured error tags with actions
- [x] wuRoutes: 6 fallback patterns
- [x] wuRoutes: zero request-scoped console calls
- [x] wishRoutes: 21 log lines found
- [x] wishRoutes: no phone value in logs
- [x] wishRoutes: no name in logs
- [x] wishRoutes: no birthdate value in logs
- [x] wishRoutes: all 18 tags present
- [x] wishRoutes: critical PII fix — rawPhone/normalizedPhone removed
- [x] Fallback: req.log=undefined does not crash
- [x] Fallback: req.log spy receives correct calls
- [x] Module-level: 2+3+2 console calls preserved

### Verification Commands
```bash
# P2.3 migration tests
node tests/middleware/p23-reqlog-migration.test.js    # 111/111

# Full P2 suite (P2.2 + P2.3)
npm run test:p2                                       # 29+45+111 = 185/185
```

---

## P2.3-2a Settlement req.log Migration (financial redaction)

### Code Gates
- [x] `routes/settlementRoutes.js` — `redactId(id)` helper: shows last 6 chars only
- [x] `routes/settlementRoutes.js` — `bucketAmount(amount)` helper: 0-9/10-49/50-99/100-999/1k-9k/10k+
- [x] `routes/settlementRoutes.js` — module-level console.log kept (1 init call)
- [x] `routes/settlementRoutes.js` — 13 catch blocks migrated to `(req.log || console).error`
- [x] `routes/settlementRoutes.js` — `checkInvariant()` accepts `log` param, uses redactId + bucketAmount
- [x] `routes/settlementRoutes.js` — all 14 structured log tags present
- [x] `routes/settlementRoutes.js` — error logging uses `error.message` only (no stack)

### Financial Safety Gates
- [x] **Settlement logs are redacted + req.log enforced**
- [x] No `token`, `authorization`, `card`, `account`, `signature` in log calls
- [x] No `bank`, `secret`, `password`, `credential` in log calls
- [x] No `buyer_user_id`, `creator_root_id`, `referrer_id` in log calls
- [x] Event IDs redacted via `redactId()` — last 6 chars only
- [x] Monetary amounts bucketed via `bucketAmount()` — no exact figures
- [x] Error responses unchanged: `{ success: false, error: 'server_error' }`

### Settlement Migration Tests (61/61 PASS)
- [x] redactId: 8 cases (null, empty, short, exact 6, 7+, long, numeric)
- [x] bucketAmount: 16 cases (negative, 0-9, 10-49, 50-99, 100-999, 1k-9k, 10k+, null/undefined)
- [x] 14 structured log tags present
- [x] 12 forbidden sensitive keys verified absent from log calls
- [x] No raw error objects in log calls
- [x] 13 catch-block fallback patterns
- [x] checkInvariant uses log || console fallback
- [x] 1 module-level console.log preserved
- [x] checkInvariant uses redactId + bucketAmount
- [x] Error response bodies unchanged

### Verification Commands
```bash
# P2.3 migration tests (includes settlement)
node tests/middleware/p23-reqlog-migration.test.js    # 111/111

# Full P2 suite
npm run test:p2                                       # 29+45+111 = 185/185
```

### Remaining Routes (future PRs)
- [ ] `routes/wishImageRoutes.js` — 18 console calls, API error exposure

---
*Updated: 2026-02-22 (P2.3-2a Settlement req.log Migration)*
