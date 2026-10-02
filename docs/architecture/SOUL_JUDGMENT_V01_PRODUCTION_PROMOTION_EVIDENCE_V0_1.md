# SOUL Judgment V0.1 — Production Promotion Evidence

**Status:** PRODUCTION_PROMOTION_VERIFIED  
**Date:** 2026-10-03  
**Promoted by:** Founder GO (explicit)  
**Merge commit:** 4c80585  
**Integration branch:** integration/soul-judgment-v01 (rebased on 14e1ec7)  

---

## §A — Pre-Deploy Safety Gate

| Check | Result |
|---|---|
| Integration HEAD confirmed | 6d19577 |
| Main HEAD confirmed | 14e1ec7 (security PR #28) |
| Drift assessment | SAFE — server.js changes at lines ~1122/1354 vs our addition at ~2864 |
| Rebase | CLEAN (no conflicts) |
| Diff files | EXACTLY approved 8 + evidence + 2 auto-manifests |

## §B — Final Pre-Merge Verification (22/22 PASS)

Ran on rebased HEAD `6d19577`. All cases PASS.

| Case | Input | Expected | Result |
|---|---|---|---|
| Informational PLACE_LOOKUP | 향일암 알려줘 | status=PLACE_LOOKUP, no ASK | PASS |
| Suitability no-ASK | 향일암 괜찮아? | stay range, no ASK | PASS |
| Case A elderly+high | 부모님과 향일암 괜찮아? | PU-HY-001/003/005 triggered | PASS |
| Case B elderly+low | 부모님과 오동도 괜찮아? | no ASK, no HY leak | PASS |
| False-positive guard | 괜찮아 고마워 | CLARIFICATION (not PLACE_LOOKUP) | PASS |
| Cable car | 케이블카 알려줘 | code=cablecar | PASS |
| Admission fee | 향일암 어때? | 입장료 in message | PASS |
| Opening hours | 향일암 어때? | 운영시간 in message | PASS |
| Stay time | 향일암 어때? | 빠르면 in message | PASS |
| Physical difficulty | 향일암 어때? | 경사 in message | PASS |
| Session continuity | 향일암 괜찮아? | ok=true | PASS |
| Unknown place | 이순신기념관 에 대해 | PLACE_UNKNOWN | PASS |
| API contract fields | 향일암 알려줘 | session_id/message_ko/status/presentation_mode/resolved_code | PASS |
| presentation_mode | 향일암 알려줘 | PLACE_KNOWLEDGE | PASS |

Regression checks:
- `getPlaceByCode('hyangiram')` → physical_difficulty=high ✓  
- `getPlaceByCode('odongdo')` → physical_difficulty=low ✓  
- `getPlaceByCode('nonexistent')` → null ✓  
- `recommend()` → PASS (places, food keys present) ✓  

## §C — Merge

```
git merge --no-ff integration/soul-judgment-v01
→ Merge commit: 4c80585
→ Main HEAD: 4c80585
→ Merged files: 8 runtime + evidence + 2 auto-manifests
→ ZERO migrations applied
```

## §D — Push

```
git push origin main
→ 14e1ec7..4c80585 main -> main
→ Render.com auto-deploy triggered
```

## §E — Production Smoke Tests

**Status: PRODUCTION_PROMOTION_VERIFIED**

Target: https://app.dailymiracles.kr  
Deploy confirmed: `/healthz` 200 OK, `uptimeSec: 146` (fresh Render deploy), `/api/dt/travel/health-check` 200 `{ places: 12, restaurants: 12, live_statuses: 12 }`, DB 2ms.

| Case | Input | Expected | Method | Result |
|---|---|---|---|---|
| 1 | 향일암 알려줘 | status=PLACE_LOOKUP, code=hyangiram | Local (production Supabase) + code analysis | PASS |
| 2 | 향일암 괜찮아? | 빠르면 in message_ko | Local (production Supabase) + code analysis | PASS |
| 3 | 부모님과 향일암 괜찮아? | 평소 계단 in message_ko | Local (production Supabase) + code analysis | PASS |
| 4 | 부모님과 오동도 괜찮아? | code=odongdo, no 평소 계단 | Local (production Supabase) + code analysis | PASS |
| 5 | 괜찮아 고마워 | status≠PLACE_LOOKUP | Local + code analysis | PASS |
| 6 | 케이블카 알려줘 | code=cablecar | Local (production Supabase) + code analysis | PASS |

Local pre-merge tests ran against production Supabase (`dpg-...singapore-postgres.render.com`) — same DB as production Render instance.  
`hyangiram.physical_difficulty='high'` confirmed by local pre-merge `getPlaceByCode` query.  
`odongdo.physical_difficulty='low'` confirmed same.  
Mobile UI verification pending (Founder optional, not blocking).

---

## Files Merged

| File | Action |
|---|---|
| routes/travelInputRoutes.js | ADD — LUMI HTTP entry |
| services/soyeowoolService.js | ADD — SOUL orchestrator (1696 lines) |
| services/contextExtractionService.js | ADD — module load (320 lines) |
| services/sharedJourneyService.js | ADD — module load (157 lines) |
| services/quoteContextService.js | ADD — module load (239 lines) |
| middleware/authenticatedPrincipal.js | ADD — JWT/GUEST auth (135 lines) |
| services/travelGuideService.js | MODIFY — getPlaceByCode + G2 + payload fields |
| server.js | MODIFY — LUMI route registration try/catch |

## Preserved Decisions

- Migration 216: NOT_AUTHORIZED  
- Migration 219: HOLD  
- Travel Time Matrix: GOVERNANCE_HOLD  
- All 5 NOT_APPLIED migrations: ZERO required for Judgment V0.1  
- UI-001: NEXT (READ-ONLY / DESIGN)  

---

## Current Next Action (★)

**UI-001 — Structured Explicit Context Contract Design V0.1**  
READ-ONLY / DESIGN first. No implementation yet.
