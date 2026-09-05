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

## 🔍 PR #28 AIL Gate Investigation — Confirmed

**Failed Workflow:**
- Workflow: `AIL Gate` (`.github/workflows/ail-gate.yml`)
- Run ID: 33941348249
- Job ID: 101239271758

**Failed Step:**
```
Step 7: "Check AIL Section in PR Body"
Location: lines 56-107 of ail-gate.yml
```

**Exact Failure:**
```
❌ AIL Gate 실패

PR 본문에 [AIL] 섹션이 없습니다.

필수 조건:
1. [AIL] 섹션 또는 ```ail 코드블록 포함
2. Source ID (Issue # 또는 외부 티켓) 명시

(Translation: PR body is missing required [AIL] section)
```

**Workflow Requirement:**
- PR body must contain `[AIL]` section, `AIL:` marker, or ` ```ail ` code block
- PR body must include a Source ID (Issue number, external ticket, or explicit "Source ID")

**Classification:**
✅ **CONFIRMED PR GOVERNANCE / METADATA VALIDATION FAILURE**

**Evidence:**

- ✅ Failed step is PR body validation logic (not code execution)
- ✅ Failure occurs before any security patch code evaluation
- ✅ All prior steps (checkout, setup-node, install, AIL gate script, docs-check) passed
- ✅ 3 other AIL Gate runs on the same commit passed successfully
- ✅ Security patch code unchanged; failure is not code-caused
- ✅ Failure is governance requirement (documentation metadata), not infrastructure error

**Why 3 Pass / 1 Fails on Same Commit:**

- Temporal gap: 3 successful runs at 01:18-01:50 UTC; failed run at 03:15 UTC (~1.5 hour gap)
- Hypothesis: PR body was edited between runs (adding/removing [AIL] section) OR GitHub metadata sync race
- **Confirmed:** This difference remains UNDETERMINED without direct evidence of PR state changes
- **Not confirmed:** Calling earlier passes "flaky" would mischaracterize a governance rule validation

---

## ✅ PR #28 AIL Gate Resolution — VERIFIED

**PR:** #28  
**Branch:** `security/request-logging-backport` → `main`

**Resolution Applied:**
PR #28 body was updated with workflow-compatible AIL metadata:
- Section header: `## [AIL] Security-Only Production Backport`
- Source ID: `Production security audit — fail-closed logging hardening`

**Automatic Validation Run (triggered by PR body edit):**
- Run ID: 91993530793
- Job ID: 101250116240
- Head SHA: acd92c74ac1674b345ebe53fe853ad6e81937f62
- Status: COMPLETED
- Conclusion: ✅ **SUCCESS**
- Duration: 32 seconds (2026-09-05 04:42:19Z → 04:42:51Z)

**Confirmed Resolution:**
- ✅ AIL metadata validation now passes
- ✅ Previous AIL Gate failure root cause is resolved
- ✅ No security backport code change was required
- ✅ Security backport head SHA remained unchanged
- ✅ AIL Gate is no longer a blocker for PR #28

**Remaining Blockers:**
- ❌ Vercel failures: 2 (status UNDETERMINED)
- 🔴 AIL Gate: RESOLVED

---

## ✅ PR #28 Merge Requirement Review — VERIFIED

**PR:** #28  
**Branch:** `security/request-logging-backport` → `main`

**Date:** 2026-09-05

**Applicable Main Branch Protection:**
- Required status checks: ENABLED (strict mode)
- Required check contexts:
  - `AIL Gate`
- Enforce admins: false
- GitHub repository rulesets: None

**Required-Check Classification:**

| Check | Required? | Latest Status | Conclusion |
|-------|-----------|---|---|
| **AIL Gate** | **YES** ✅ | SUCCESS (run 91993530793, 04:42:51Z) | **Required gate satisfied** |
| docker-smoke | NO | SUCCESS (4/4 runs) | Non-required |
| Vercel Preview Comments | NO | SUCCESS | Non-required |
| Vercel – daily-miracles-app | **NO** | FAILURE | **Not a required blocker** |
| Vercel – daily-miracles-app-21z3 | **NO** | FAILURE | **Not a required blocker** |

**Critical Evidence:**

- ✅ Required status checks contexts = `["AIL Gate"]` only
- ✅ Vercel checks absent from `required_status_checks.contexts`
- ✅ No GitHub repository rulesets apply to main
- ✅ Latest required check (AIL Gate) = SUCCESS
- ✅ PR #28 merge state = MERGEABLE

**Verified Classification:**

```
CLASSIFICATION: VERCEL CHECKS ARE NOT REQUIRED MERGE BLOCKERS
```

**Important Boundaries:**
- ✅ Distinguish: Vercel failed check ≠ required failed check
- ✅ Vercel root cause remains UNDETERMINED (preview infrastructure)
- ✅ Vercel previews are separate from Render Production/C7A
- ✅ No PR deployment has occurred

---

## 🚀 PR #28 Production Promotion Decision — GO

**Date:** 2026-09-05  
**Decision:** ✅ **GO — APPROVED FOR CONTROLLED PRODUCTION PROMOTION**

**Approved Target:**
- PR: #28
- Branch: `security/request-logging-backport` → `main`
- Head SHA: `acd92c74ac1674b345ebe53fe853ad6e81937f62`

**Confirmed Basis:**

**1. Patch Scope:**
- ✅ Exactly 5 intended files
- ✅ 7 insertions / 17 deletions
- ✅ Security logging hardening only
- ✅ No Storybook/C7A feature code
- ✅ No DB/schema/migration changes
- ✅ No package/dependency changes
- ✅ No environment/config changes

**2. Security Intent:**
- ✅ REQUEST_LOG fail-closed (default "0")
- ✅ Full request header/body dumps removed
- ✅ Credential-bearing logging removed (AuthToken, Signature, NextAppURL, full body)
- ✅ Pathname-only logging where applicable
- ✅ Request/payment/redirect behavior unchanged apart from logging

**3. Baseline & Dependencies:**
- ✅ Semantic backport based directly on Production main: cc577d2c45e5412b80a2a73d50264f960de44a0f
- ✅ No C7A Storybook dependency
- ✅ No C7A staging-schema dependency
- ✅ No hidden migration dependency identified

**4. Required Gates:**
- ✅ AIL Gate (only required check): SUCCESS (run 91993530793, 04:42:51Z)
- ✅ Vercel checks: NOT required merge blockers
- ✅ docker-smoke: Not required, observed SUCCESS
- ✅ Repository rulesets: None found

**5. Deployment Boundary:**
- ✅ Render Production (daily-miracles-app): Isolated on main branch
- ✅ Render C7A staging (daily-miracles-app-1): Remains on staging/storybook-c7a
- ✅ Vercel failures: Separate preview/integration infrastructure (root cause UNDETERMINED)

**Safety Conditions for Controlled Promotion:**

```
✅ Merge ONLY PR #28
✅ No admin bypass or "Merge without waiting"
✅ AIL Gate must still be SUCCESS immediately before merge
✅ PR head must still be: acd92c74ac1674b345ebe53fe853ad6e81937f62
✅ PR scope must still be approved 5-file security-only diff
✅ No additional commits may have entered the PR
✅ No C7A branch/schema changes
```

**Post-Promotion Verification (Do NOT assume merge commit SHA):**

GitHub merge strategy may create a different merge commit. Instead verify:
- ✅ PR #28 reached MERGED state
- ✅ Resulting main commit contains approved PR #28 semantic patch
- ✅ Render Production deploys expected main commit
- ✅ Production reaches Live/healthy state
- ✅ One already-known safe public Production runtime request succeeds
- ✅ REQUEST_LOG remains fail-closed (without reading/exposing secrets)
- ✅ No sensitive request/header/body credential logging appears
- ✅ C7A staging branch/service remains unchanged

**Constraints:**
- Do NOT expose: Authorization, Cookie, AuthToken, Signature, NextAppURL values, DATABASE_URL, service-role keys, signed URL tokens, or other credentials

---

## ✅ PR #28 Controlled Merge — COMPLETED

**Date:** 2026-09-05  
**Merge Status:** MERGED

**Merge Evidence:**
- PR #28 state: MERGED
- MergedAt: 2026-09-05T07:32:16Z
- MergedBy: ys6448761-hue
- Merge commit SHA: `14e1ec7a83e57d9e3f815f7f43bafa5f4a738348`
- origin/main: `14e1ec7a83e57d9e3f815f7f43bafa5f4a738348`
- Approved head SHA (acd92c74) included: ✅

---

## 🔄 PR #28 Post-Merge Production Verification — HOLD

**Date:** 2026-09-05  
**Status:** PARTIAL / UNDETERMINED

**Confirmed Verification Results:**

| Result | Status | Evidence |
|--------|--------|----------|
| Merge commit deployed to main | ✅ CONFIRMED | origin/main = 14e1ec7a83e57d9e3f815f7f43bafa5f4a738348 |
| Production endpoint responding | ✅ CONFIRMED | https://app.dailymiracles.kr/health = HTTP 200 OK |
| Code: REQUEST_LOG fail-closed | ✅ CONFIRMED | Merged server.js line 1358: `REQUEST_LOG \|\| "0"` |
| Code: Sensitive logging removed | ✅ CONFIRMED | No full body/header/credential dumps in merged code |
| C7A staging isolated | ✅ CONFIRMED | origin/staging/storybook-c7a = 21d86fbe3f9aecece82195e44b8e6297cdf27e6f |

**Unconfirmed / Awaiting Direct Verification:**

| Item | Status | Reason |
|------|--------|--------|
| Render deployed commit SHA | ⏳ UNDETERMINED | Auto-deploy + main SHA is NOT direct Render deployment evidence |
| Production REQUEST_LOG runtime state | ⏳ UNDETERMINED | Code default "0" does NOT prove Production env has not set REQUEST_LOG=1 |
| Production log safety | ⏳ UNDETERMINED | Code inspection confirms unsafe code removed, but direct Production log evidence not yet collected |

**Classification: HOLD — PRODUCTION VERIFICATION INCOMPLETE**

**Reason:** Code-level security (fail-closed default, logging statements removed) is verified. Application runtime (endpoint responding 200 OK) is verified. But direct Render deployment evidence (exact deployed commit SHA) and runtime logging state (REQUEST_LOG env value, actual Production logs) have not yet been directly verified.

---

## ✅ PR #28 Render Direct Verification — VERIFIED COMPLETE

**Date:** 2026-09-05  
**Classification:** A. PRODUCTION PROMOTION VERIFIED

**Direct Production Evidence Collected:**

**1. Render Deployment Status:**
- Service: `daily-miracles-app`
- Status: **LIVE**
- Deployed commit SHA: `14e1ec7a83e57d9e3f815f7f43bafa5f4a738348`
- Deployment corresponds to: PR #28 merged security backport (acd92c74)
- Verification: ✅ Expected commit deployed and live

**2. Runtime REQUEST_LOG State:**
- Render Environment Variable: `REQUEST_LOG` = **ABSENT**
- Application code fallback: `process.env.REQUEST_LOG || "0"`
- Runtime behavior: Request logging **disabled by default**
- Verification: ✅ Fail-closed behavior active in Production

**3. Production Log Safety:**
- Inspection scope: Recent Production logs after deployment
- Unsafe patterns checked:
  - ❌ Full request headers dumps: NOT observed
  - ❌ Full request body dumps: NOT observed
  - ❌ Authorization header values: NOT observed
  - ❌ Cookie values: NOT observed
  - ❌ AuthToken values: NOT observed
  - ❌ Signature values: NOT observed
  - ❌ NextAppURL values: NOT observed
- Classification: **SAFE — NO SENSITIVE REQUEST LOGGING OBSERVED**
- Verification: ✅ Production logs free of sensitive request/header/body/credential patterns

**4. Public Runtime Health:**
- Endpoint: `https://app.dailymiracles.kr/health`
- Status: **HTTP 200 OK**
- Response: `ok`
- Application serving: **Normally**
- Verification: ✅ Production application responding correctly

**5. C7A Isolation Preserved:**
- Branch: `origin/staging/storybook-c7a`
- Commit: `21d86fbe3f9aecece82195e44b8e6297cdf27e6f` (unchanged)
- C7A deployment: Not affected by PR #28 promotion
- Verification: ✅ C7A staging fully isolated

**Final Promotion Status:**
- ✅ PR #28 merged to main
- ✅ Security-only backport live in Production
- ✅ Production runtime healthy
- ✅ REQUEST_LOG fail-closed behavior active
- ✅ Sensitive request logging not observed
- ✅ C7A isolation preserved

**Previous Hold Status:** RESOLVED
- PR #28 Render Direct Verification — ACCESS HOLD is CLOSED
- Direct Render access became available
- All undetermined items now verified

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

> Review the remaining non-blocking optional DreamTown endpoint debt (/logs, /resonance-people, /similar) and select the next single item to investigate, without changing Production or C7A staging.

**Context:** PR #28 security promotion complete and verified live in Production. Fail-closed request logging active. No sensitive credentials logged. C7A isolated. Next work: identify highest-priority optional endpoint investigation from remaining DreamTown debt items, read-only scope, no implementation in this task.

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
