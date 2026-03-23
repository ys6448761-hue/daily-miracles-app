# PLAN — P2.2 requestId + errorHandler + Wiring

## What & Why
Standardize error handling across all Express routes with:
- Unique request IDs for tracing
- Centralized error classification (8 types)
- Consistent error response format (dev vs prod)
- Slack alerting with cooldown for 500-level errors

This eliminates scattered try/catch patterns and enables end-to-end request tracing.

## Milestones
| # | Milestone | Status |
|---|-----------|--------|
| 1 | `middleware/requestId.js` — UUID per request | Done |
| 2 | `middleware/errorHandler.js` — centralized classification + response | Done |
| 3 | `middleware/alertCooldown.js` — Slack alert fatigue prevention | Done |
| 4 | `server.js` wiring — requestId BEFORE routes, errorHandler LAST | Done |
| 5 | Tests — 29/29 PASS | Done |

## Risks
| Risk | Mitigation |
|------|-----------|
| Duplicate Slack alerts (P2.1 crash handlers vs P2.2 error handler) | P2.1 handles process-level crashes (exit), P2.2 handles request-level errors (no exit). No overlap. |
| Alert storm on cascading failures | alertCooldown.js — 5min/2min/10min tiers per (errorClass, route, statusCode) |
| requestId collision | crypto.randomUUID() — UUIDv4, negligible collision probability |

---
*Created: 2026-02-22*
