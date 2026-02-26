# Workflow — Daily Miracles Development

## Working Cycle (Every PR)

```
Step 0) Create/Update external memory docs: PLAN.md, CONTEXT.md, CHECKLIST.md
Step 1) Implement one unit of work (small PR)
Step 2) Run preflight checks + tests
Step 3) Write engineering report
Step 4) Cross-review + fix
Step 5) Finalize + merge
```

## P2 Stability Execution Order

| Phase | Task | Status |
|-------|------|--------|
| P2.1 | Crash → Slack handlers | Done |
| P2.2 | requestId + errorHandler + wiring + tests | **Done** (29 + 45 post-hardening tests) |
| P2.3 | /healthz Stability Score | Done (safe endpoint) |
| P2.x | Vercel serverless crash fix | **PR #18 in review** |

## Deploy Gates

Before pushing to production:
1. `OPENAI_API_KEY` exists in env
2. `wishImageRoutes` mounted in `server.js`
3. Fallback images exist at `public/images/fallback/`
4. `/healthz` returns 200
5. Render deploy + health check confirmed

## Git Rules

- Feature branches: `feat/*`, `hotfix/*`, `fix/*`
- Meaningful commit prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `deploy:`
- Never commit `.env`, secrets, credentials
- After push: confirm deploy + health check

---
*Last updated: 2026-02-22*
