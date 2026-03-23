# CHECKLIST — Vercel Serverless Crash Fix

## Definition of Done

### Code Gates
- [x] `config/logger.js` — no import-time mkdirSync
- [x] `config/logger.js` — isServerless detects VERCEL + NOW_REGION + AWS_LAMBDA
- [x] `config/logger.js` — console-only in serverless, DailyRotateFile in normal
- [x] `config/logger.js` — ensureDirSafe() never throws
- [x] `services/metricsService.js` — METRICS_PERSIST=false in serverless
- [x] `services/metricsService.js` — loadMetrics() skipped in serverless
- [x] `services/metricsService.js` — setInterval(saveMetrics) skipped in serverless
- [x] `services/reports/ceoWeeklyReport.js` — top-level mkdir guarded
- [x] `services/eventLogger.js` — ensureDirectory() guarded
- [x] `services/certificateService.js` — mkdirSync try-caught
- [x] `services/postcardService.js` — mkdirSync try-caught
- [x] `server.js /healthz` — never returns 500/503
- [x] `/var/task` string — 0 occurrences in *.js
- [x] All existing module exports preserved (backward compat)

### Test Cases
- [x] `VERCEL=1 node -e "require('./config/logger')"` → Console transport only
- [x] `VERCEL=1 node -e "require('./services/metricsService')"` → in-memory mode
- [x] Normal mode (no VERCEL) → file transports still work
- [x] `git diff --name-only origin/main...HEAD` → only 7 hotfix files

### Verification (Vercel Preview)
- [ ] `GET /healthz` → HTTP 200
- [ ] Response JSON contains `"status": "ok"` or `"status": "degraded"`
- [ ] Runtime Logs: `ENOENT` — 0 occurrences
- [ ] Runtime Logs: `/var/task` — 0 occurrences
- [ ] Runtime Logs: `process exited` — 0 occurrences

### Production Rollout
- [ ] Merge PR #18 to main
- [ ] Production redeploy
- [ ] `/healthz` → 200
- [ ] Slack alert received

## Rollback
If Preview fails:
1. Check Runtime Logs for specific module name causing crash
2. Add serverless guard to that module
3. Push fix to `hotfix/vercel-fs-crash`
4. Re-verify

---
*Created: 2026-02-22*
