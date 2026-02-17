# Crash & Error Alert Response Runbook

> Last updated: 2026-02-17

## 1. Alert Types

| Alert | Source | Severity | Exit? |
|-------|--------|----------|-------|
| `Uncaught Exception` | `process.on('uncaughtException')` in server.js | 🔴 Critical | Yes (exit 1, Render auto-restarts) |
| `Unhandled Rejection` | `process.on('unhandledRejection')` in server.js | 🟠 Warning | No |
| `Server Error: [class]` | Express globalErrorHandler (500) | 🔴 Error | No |

## 2. Triage by Error Class

| Error Class | Meaning | First Action |
|-------------|---------|-------------|
| DB | SQLite/PostgreSQL constraint/busy/corrupt | `node jobs/dbHealthCheck.js` or check Render DB dashboard |
| Validation | Bad input reached server | Check caller — likely client bug |
| OpenAI/External | OpenAI API down/rate-limited | Check https://status.openai.com |
| RateLimit | 429 from external service | Wait or check quota |
| System | ENOENT/EACCES/ETIMEDOUT | Check disk/network on Render |
| Unknown | Unclassified programming error | Read stack trace, check recent deploy |

## 3. Immediate Response (< 5 min)

1. **Check Slack alert** for: error_class, route, request_id, stack trace
2. **Check Render logs**: Dashboard > Service > Logs, filter by request ID
3. **Check health endpoint**: `curl https://app.dailymiracles.kr/api/health`
4. **If server crashed** (Uncaught Exception):
   - Render auto-restarts the process
   - Verify recovery: `curl https://app.dailymiracles.kr/api/ready`
   - If stuck in crash loop: trigger rollback (see render-rollback.md)

## 4. Investigation

```bash
# Check DB health
node jobs/dbHealthCheck.js

# Check Render service logs (use request ID from alert)
# Render Dashboard > Logs > search for request_id
```

## 5. Escalation

| Condition | Action |
|-----------|--------|
| 3+ same alerts in 10 min | Check for systemic issue, consider rollback |
| DB CORRUPT alert | Immediate rollback + DB restore (see db-backup-restore.md) |
| OpenAI 500 persists > 15 min | Enable fallback responses if available |
| Unknown crash on new deploy | Rollback immediately (see render-rollback.md) |

## 6. Post-Incident

1. Slack #ops 채널에 장애 보고
2. 원인 분석 (Render Logs + request_id 기반)
3. 수정 PR 생성
4. `.claude/logs/`에 인시던트 로그 기록
