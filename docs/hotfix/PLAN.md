# PLAN — Vercel Serverless Crash Fix

## AIL References
- AIL-2026-0221-OPS-005 (initial detection)
- AIL-2026-0221-OPS-006 (hotfix branch + PR)
- AIL-2026-0221-OPS-007 (import-time side effect removal)
- AIL-2026-0221-OPS-008 (final logger/metrics hardening)
- AIL-2026-0221-OPS-009 (/healthz safe endpoint)

## What & Why
Vercel Serverless functions crash immediately on boot because multiple modules
execute `fs.mkdirSync()` at import time against the read-only `/var/task` filesystem.
This causes `ENOENT` → `process.exit(1)` → HTTP 500 on every request.

## Milestones
| # | Milestone | Status |
|---|-----------|--------|
| 1 | Logger: console-only in serverless | Done |
| 2 | Metrics: in-memory mode, no disk writes | Done |
| 3 | All mkdirSync: try-catch + serverless guard | Done |
| 4 | /healthz: never return 500 | Done |
| 5 | Vercel Preview verification | **Pending** |
| 6 | Production redeploy + Slack alert | Pending |

## Risks
| Risk | Mitigation |
|------|-----------|
| Metrics data loss on serverless | Accepted: serverless is stateless by design |
| /healthz masking real issues | `degraded` status + individual check details |
| logger import breaks existing consumers | All existing exports preserved |

---
*Created: 2026-02-22*
