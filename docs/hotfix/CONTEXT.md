# CONTEXT — Vercel Serverless Crash Fix

## Current State
- PR #18: `hotfix/vercel-fs-crash` → `main` (3 commits, 7 files)
- Code verified locally with `VERCEL=1` — all modules load without crash
- Awaiting Vercel Preview deployment for live verification

## Constraints
- Vercel `/var/task` is read-only; only `/tmp` is writable
- `process.env.VERCEL` is auto-set by Vercel runtime
- `process.env.NOW_REGION` is also set in some Vercel environments
- `winston-daily-rotate-file` requires writable directory at construction time

## API Contracts Preserved
| Export | Module | Status |
|--------|--------|--------|
| `{ logger, accessLogger, requestLogger, info, warn, error, debug, database, openai, story, isServerless }` | config/logger.js | Preserved |
| `{ recordWishInbox, getMetrics, saveMetrics, ... }` | services/metricsService.js | Preserved |
| `GET /healthz` → always 200 | server.js | Changed (was 503/500) |

## Decisions
| Decision | Rationale |
|----------|-----------|
| Console-only logging on serverless | `/tmp` logs would be lost anyway on cold start |
| `METRICS_PERSIST` flag instead of env var | Auto-detection; no manual config needed |
| /healthz always 200 | Vercel/uptime monitors shouldn't false-alarm on degraded services |
| Preserve stabilityService check inside /healthz | Backwards compat; just won't 503 if missing |

---
*Created: 2026-02-22*
