# 🔐 PROJECT STATE — daily-miracles-mvp
**Last Updated:** 2026-09-05

## Purpose / Continuity

This document is the canonical Project State for current operational
judgment and handover.

It records:
- Confirmed state
- Current decision position
- Holds / blockers
- Resume conditions
- Exactly one Current Next Action

Do not re-investigate Confirmed/Decided items without new evidence.

`DREAMTOWN_STATUS.md` remains the DreamTown feature/phase handover
reference. It does not replace this Project State.

---

## 📍 DEPLOYMENT MAPPING — Confirmed Evidence

### [Production / Main Product]

**Render Service:** `daily-miracles-app`

**Role:** Main product / Production  
**GitHub Repository:** `ys6448761-hue/daily-miracles-app`  
**GitHub Branch:** `main`

**Verified Live Commit:** `cc577d2c45e5412b80a2a73d50264f960de44a0f`

**Production Domain:** `app.dailymiracles.kr`

**Render Status:** Live

**Deployment Method:** Auto-Deploy (confirmed in deployment history)

---

### [Storybook C7A Staging]

**Render Service:** `daily-miracles-app-1`

**Role:** C7A Storybook / 별빛항로 isolated staging  
**GitHub Repository:** `ys6448761-hue/daily-miracles-app`  
**GitHub Branch:** `staging/storybook-c7a`

**Verified Live Commit:** `21d86fbe3f9aecece82195e44b8e6297cdf27e6f`

**Staging URL:** `https://daily-miracles-app-1.onrender.com`

**Render Status:** Live

---

## 🔀 DEPLOYMENT BOUNDARY DECISION — Confirmed

**Deployment Mapping:**

| Main | → | Render Service | → | Target |
|------|---|---|---|---|
| `main` (cc577d2...) | → | `daily-miracles-app` | → | Production / `app.dailymiracles.kr` |
| `staging/storybook-c7a` (21d86fbe3f9aecece82195e44b8e6297cdf27e6f) | → | `daily-miracles-app-1` | → | C7A Storybook staging |

**Vercel PR Previews:** ⚠️ **SEPARATE INFRASTRUCTURE**  
- Vercel PR preview deployments are a distinct deployment integration
- Must NOT be treated as evidence that either Render Production or Render C7A staging is down
- PR preview build failures ≠ main branch or staging branch issues

---

## 🛡️ VERCEL PREVIEW — Evidence Classification

**Observed Fact:** Two failed PR preview deployments (PR #27)

**Root Cause:** `server.js` uncompressed function size = 886.27 MB (Vercel limit = 250 MB)

**Build Status:** ✅ Build completed successfully  
**Deployment Status:** ❌ Deployment failed (function size limit exceeded)

**Classification:**
- ✅ Separate Vercel Preview infrastructure/packaging issue
- ❌ NOT a Render Production outage
- ❌ NOT a Render C7A staging outage
- ❌ NOT evidence that the security patch broke runtime

**Implication:** Production (Render cc577d2...) remains UNAFFECTED.

---

## 🔐 PR #27 SAFETY STATE — Confirmed

**PR Title:** SECURITY FAIL CLOSED REQUEST LOGGING BACKPORT

**Status:** Closed with unmerged commits

**Security Branch:** `security/request-logging-backport`

**Security Backport Commit:** `acd92c74ac1674b345ebe53fe853ad6e81937f62`

**Confirmed State:**

✅ PR #27 was NOT merged into main  
✅ Production main remained at `cc577d2...` during investigation  
✅ No production rollback is required  
✅ Security backport branch is intentionally preserved  
✅ Production promotion remains HOLD until explicit new decision  

---

## ✅ Production Security Backport Review — Confirmed

**Review Date:** 2026-09-05

**Production Base:** `cc577d2c45e5412b80a2a73d50264f960de44a0f`

**Security Backport:**
- Branch: `security/request-logging-backport`
- Commit: `acd92c74ac1674b345ebe53fe853ad6e81937f62`

**Verdict:** ✅ **PASS — Safe Independent Security Backport**

**Confirmed Evidence:**
- ✅ Exactly 5 application files changed
- ✅ Diff stat: 7 insertions(+), 17 deletions(-)
- ✅ REQUEST_LOG is fail-closed (default "0")
- ✅ Request logging no longer dumps full headers/body
- ✅ Authorization/Cookie/full request payload/query-string credentials not introduced
- ✅ AuthToken, Signature, NextAppURL value logging removed
- ✅ Redirect behavior unchanged (uses `req.originalUrl` internally)
- ✅ Payment processing behavior unchanged
- ✅ No Storybook/C7A feature code included
- ✅ No DB/schema/migration/package/env/config changes
- ✅ No C7A commit dependency
- ✅ Backport based directly on confirmed Production main base
- ✅ No Production-specific runtime blocker identified

---

## 🔴 PR #28 Check Review — HOLD

**PR:** #28  
**Branch:** `security/request-logging-backport` → `main`

**Date:** 2026-09-05

**Check Results Summary:**
```
✅ PASS:    8 checks (docker-smoke ×4, AIL Gate ×3, Vercel Preview Comments ×1)
❌ FAIL:    3 checks (AIL Gate ×1, Vercel Production ×1, Vercel C7A ×1)
⏳ PENDING: 0 checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Merge State: BLOCKED (failed checks)
```

**Confirmed Failures:**
- ❌ **AIL Gate:** 1 failed instance, 3 passed instances (same commit)
- ❌ **Vercel – daily-miracles-app:** Deployment failed
- ❌ **Vercel – daily-miracles-app-21z3:** Deployment failed

**Root Cause Classification:**

**Vercel Failures:**
- Status: ⚠️ **UNDETERMINED** (logs require CLI authentication)
- Evidence: Accessible GitHub API data does not explicitly report server.js uncompressed size, 886.27 MB, or 250 MB limit
- Hypothesis: Same 886.27 MB function size issue as PR #27 is a strong hypothesis, not Confirmed Evidence
- **Important boundary:** Vercel preview checks are separate infrastructure from Render Production or Render C7A staging

**AIL Gate Failure:**
- Status: ⚠️ **UNDETERMINED** (logs not available)
- Pattern: 1 failure, 3 successes on same commit suggests flaky/infrastructure issue, not code defect
- Cannot confirm root cause without logs

**Security Patch Impact:**
- ✅ Docker-smoke tests pass (core functionality intact)
- ✅ No evidence that security patch caused any failures
- Failures appear to be pre-existing infrastructure/build issues

---

## 📋 C7A INVESTIGATION STATE — Preserved

**Investigation:** GET /api/dt/stars/:id HTTP 500 error  
**Root Cause:** PostgreSQL 42703 (undefined_column: wish_emotion)  
**Schema Version:** C7A max migration applied = 117 (wish_emotion requires migration 131)  
**Dependency Classification:** OPTIONAL ENRICHMENT (non-blocking, async, full NULL tolerance)

**Strategy-B Fallback Queries:** ✅ Normalized  
**Diagnostic Instrumentation:** ✅ Cleaned up  
**Security Logging:** ✅ Hardened (fail-closed REQUEST_LOG default)

**Status:** C7A 별빛항로 Storybook isolated staging working correctly at commit `21d86fbe3f9aecece82195e44b8e6297cdf27e6f`.

---

## 🎯 CURRENT NEXT ACTION

**Single explicit action:**

> Investigate the single failed AIL Gate on PR #28 using existing read-only GitHub evidence, without rerunning checks or changing infrastructure.

**Context:** PR #28 is blocked by check failures: 1 AIL Gate failure (3 passes), 2 Vercel failures (root cause UNDETERMINED). The AIL Gate flaky pattern (1 fail, 3 pass) requires investigation to determine whether it is a transient CI issue or a real code defect blocking this security backport.

---

## ✅ VALIDATION CHECKLIST

- ✅ No application code modified
- ✅ No Render/Vercel settings changed
- ✅ No deployments executed
- ✅ main branch untouched (cc577d2...)
- ✅ PR #27 remains closed
- ✅ security/request-logging-backport branch preserved
- ✅ Deployment mapping documented with evidence
- ✅ Vercel vs Render distinction clarified
- ✅ C7A state preserved
- ✅ Current Next Action specified (single action)

---

**Status: READY FOR REVIEW**

This Project State captures confirmed deployment mapping evidence as of 2026-09-05. Production promotion remains HOLD. Resume only from the Current Next Action above; do not reopen or recreate a Production PR until the preserved security-only backport has been reviewed against the confirmed deployment mapping.
