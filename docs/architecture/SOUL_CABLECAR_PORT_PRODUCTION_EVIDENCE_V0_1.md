# SOUL CableCar Port Production Evidence V0.1

**Status:** PRODUCTION_PROMOTION_PENDING  
**Branch:** `integration/soul-cablecar-port-v0-1`  
**Port from:** `origin/staging/storybook-c7a` @ `37031ec`  
**Port onto:** `main` @ `1e030bf`  
**Date:** 2026-10-03

---

## Task Classification

| Task | Classification | Approval |
|---|---|---|
| Port SoulCableCarPage.jsx (9 elements) | CONNECT | IMPLEMENTATION_GO |
| Create guestCredentialUtil.js (identity layer) | CONNECT | IMPLEMENTATION_GO |
| Wire Gap B: chip → explicit_context (UI-001) | EXTEND | IMPLEMENTATION_GO |
| Connect PlaceBasicInfo V0.2 formatter logic | CONNECT | IMPLEMENTATION_GO |

Product Contract Preflight result: **TASK_ALIGNED + TASK_EXTENDS_CONTRACT**

---

## Files Changed

| File | Action | Notes |
|---|---|---|
| `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` | CREATED | Full port from staging. Gap B wired. |
| `dreamtown-frontend/src/api/guestCredentialUtil.js` | CREATED | Ported from staging. JWT bootstrap + dedup. |
| `dreamtown-frontend/src/api/dreamtown.js` | MODIFIED | Added re-export of guestCredentialUtil functions. |
| `dreamtown-frontend/src/App.jsx` | MODIFIED | Added `/soul/cable-car` route. |

---

## Build Verification

```
✓ 690 modules transformed.
✓ built in 14.01s
0 errors. 0 regressions in module count vs. baseline.
```

Chunk size warning (>500 kB) is pre-existing, not caused by this port.

---

## Test Matrix Results

### A. Pre-existing test baseline (NOT regressions)
- `travelInputHotelIdValidation.test.js` — T-HIV07 timeout pre-existing. 7 failed / 12 passed (unchanged).
- `trust-guard-principles.test.js` — OpenAI constructor at module-load fails without key. Pre-existing.

### B. Port scope (manual verification — build-confirmed)
| Item | Status |
|---|---|
| A. Build passes (690 modules, 0 errors) | PASS |
| B. `/soul/cable-car` route registered in App.jsx | PASS |
| C. `guestCredentialUtil.js` created with correct exports | PASS |
| D. `dreamtown.js` re-exports `getOrEnsureGuestCredential` | PASS |
| E. Gap B: explicit_context sent on submit (not on chip-select) | IMPLEMENTED — code verified |
| F. chip does NOT auto-submit | IMPLEMENTED — no side-effect on chip click |
| G. has_car: boolean (not string) | IMPLEMENTED — `explicit_context.has_car = true` |
| H. family_elderly mapping: `companion === 'parents'` → `people_type = 'family_elderly'` | IMPLEMENTED |
| I. family_with_kids mapping: `companion === 'family'` → `people_type = 'family_with_kids'` | IMPLEMENTED |
| J. place_code NOT sent from chips (text-driven wins) | IMPLEMENTED — no place_code in explicit_context |
| K. PlaceBasicInfo V0.2 logic (null-tolerant, 6 fields, parking V0.2) | IMPLEMENTED inline via FactRow |
| L. Hero image: cablecar only, odongdo/hyangiram → gradient fallback | IMPLEMENTED — PLACE_HERO_MAP |
| M. Journey suppressed for non-cablecar PLACE_LOOKUP | IMPLEMENTED — existing staging logic preserved |
| N. Human Experience Layer: NOT IMPLEMENTED (as required) | CONFIRMED — no social proof elements |
| O. "내 여정에 담기": disabled (no pretend-to-work backend) | IMPLEMENTED — disabled button |
| P. Backward compat: session_id maintained (existing sessions reuse) | IMPLEMENTED — localStorage key unchanged |
| Q. D2: page deepens/reorganizes, does NOT replace on new chip | IMPLEMENTED — no page replace on chip |

---

## Gap B Wire Contract Verification

```js
// In handleSubmit — Gap B explicit_context wiring
const explicit_context = {};
if (updated.hasVehicle) explicit_context.has_car = true;
if (updated.companion === 'parents')  explicit_context.people_type = 'family_elderly';
else if (updated.companion === 'family') explicit_context.people_type = 'family_with_kids';
// place_code intentionally NOT sent from chips — text-driven place recognition takes precedence

body: JSON.stringify({
  message: raw,
  session_id: sessionId,
  explicit_context: Object.keys(explicit_context).length > 0 ? explicit_context : undefined,
}),
```

Backend sanitization at `routes/travelInputRoutes.js → _sanitizeExplicitContext`:
- `place_code`: regex validated (NOT sent from chips — safe)
- `people_type`: enum set validated (`family_elderly`, `family_with_kids` in set)
- `has_car`: boolean coerced
- Unknown keys: silently dropped

---

## Scope Prohibitions Verified

| Prohibition | Status |
|---|---|
| NO new Product Vision | CONFIRMED |
| NO Contract rewrite | CONFIRMED |
| NO Human Experience Layer | CONFIRMED |
| NO new knowledge research | CONFIRMED |
| NO DB writes / migration / schema | CONFIRMED — zero migrations |
| NO place_knowledge | CONFIRMED |
| NO Travel Time Matrix | CONFIRMED |
| NO new memory architecture | CONFIRMED |
| NO Production data mutation | CONFIRMED |

---

## Production Promotion Status

Branch: `integration/soul-cablecar-port-v0-1`  
Promotion gate: **READY FOR REVIEW**

Required before promotion to main:
- [ ] Founder review of this Evidence
- [ ] Merge to main
- [ ] Render deployment verification
- [ ] Live URL `/soul/cable-car` 200 OK

---

## Architecture References

- Product Contract: `docs/product/SOUL_PRODUCT_VISION_V0_1.md`
- D2 Decision: `docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md`
- UI-001: `docs/architecture/SOUL_PLACE_IDENTITY_VISUAL_ROUTING_AUDIT_V0_1.md` (§ UI-001)
- Backend contract: `routes/travelInputRoutes.js → _sanitizeExplicitContext`
- Identity bootstrap: `routes/identityRoutes.js → POST /api/dt/identity/bootstrap`
