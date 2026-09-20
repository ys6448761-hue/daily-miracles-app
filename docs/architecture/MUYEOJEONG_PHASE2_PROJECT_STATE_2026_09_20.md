# MUYEOJEONG Phase 2 — Project State Snapshot
# 2026-09-20

**Branch:** staging/storybook-c7a  
**Last Commit:** 4bec10f  
**Status:** Phase 2 G1/G2 COMPLETE — NO PUSH / NO DEPLOY

---

## Phase 2 Completion Evidence

### Commit

```
4bec10f feat(muyeojeong): Phase 2 G1/G2 — explicit count + low-walking trust [GATE GREEN]
003107f feat(muyeojeong): ENTRY V1 — hotel-ready entrance screen [GATE GREEN]
```

### T1-T6 Regression

| Test | Input | Status | Result |
|---|---|---|---|
| T1 | 지금 두 시간 붕 떴는데 뭐 하지? | SUCCESS / 2 places | PASS |
| T2 | 밤인데 숙소 들어가긴 아쉬워 | PARTIAL / time_of_day=night | PASS |
| T3 (G1) | 사진 잘 나오는 곳 세 군데만 | PARTIAL / requested_count=3 | PASS |
| T4 (G2) | 부모님과 많이 안 걷는 코스는? | PARTIAL / 향일암 excluded | PASS |
| T5 | 돈 많이 안 쓰고 오늘 놀 수 있어? | PARTIAL / no false fee claim | PASS |
| T6 | 친구 12명, 1박2일 비용은? | GROUP_CONSULTATION_REQUIRED | PASS |

### Build

```
✓ 38 modules, 169kB JS / 39kB CSS — GREEN
```

---

## G1 — Explicit Count

**Problem:** Algorithm ignored user-stated count ("세 군데만").  
**Fix:** `requested_count` extracted by GPT, overrides `targetStops` formula in `_composeJourney`. Clamped to [1, 5].  
**Files:** `contextExtractionService.js`, `travelGuideService.js`, `soyeowoolService.js`

---

## G2 — Low-Walking Suitability

**Problem discovered:** `suitable_for=['elderly']` ≠ `suitable for low-mobility travelers`. Hyangiram passed all filters despite steep stone steps.

**Two-rule fix:**

| Rule | Condition | Action |
|---|---|---|
| RULE 1 | `mobility_constraint='low_walking'` AND `physical_difficulty='high'` | EXCLUDE |
| RULE 2 | `mobility_constraint='low_walking'` AND `physical_difficulty=null` | WARN (`walking_burden_unknown`) |

No place-name-specific logic. Rule applied via data field only.

**Authorized data change:**

```sql
UPDATE travel_places SET physical_difficulty = 'high' WHERE code = 'hyangiram';
-- Founder operational evidence 2026-09-20
-- suitable_for=['elderly'] preserved — elderly suitability ≠ low-mobility suitability
```

Recorded in: `database/seeds/001_travel_places.sql` (reproducible after DB recreation).

**Files:** `contextExtractionService.js`, `travelGuideService.js`, `soyeowoolService.js`, `LumiTravelPage.jsx`, `lumi-travel.css`

---

## Trust Guardrails (Phase 2, all active)

| Claim | Data condition | Behavior |
|---|---|---|
| Free entry | `admission_fee_json=null` | No claim made |
| Currently open | `live_status_required=true`, no live feed | Verification notice only |
| Low-walking suitable | `physical_difficulty=null` | Warning, not assertion |
| Low-walking suitable | `physical_difficulty='high'` | Excluded from results |

---

## Experience Network / Live Travel State

**Status: HOLD**

Resume condition #1 (Phase 2 accuracy validation): **MET**  
Resume conditions #2–#6: **OPEN**

Reference: `docs/architecture/FIELD_KNOWLEDGE_COLLECTION_FORM_V0_1_2026_09_20.md`

---

## Field Knowledge Collection Form

**Status:** Prepared for Google Forms Pilot — NOT YET DEPLOYED

Pilot required before resuming Experience Network implementation.

**Pre-deployment checklist:**
- Privacy/consent wording
- Pilot participant selection (Yeosu guides, interpreters, local operators)
- Response collection/review process
- Evidence Review owner assignment

---

## Remaining Data Gaps (no schema migration needed)

| Field | Current state | Path to resolution |
|---|---|---|
| `physical_difficulty` | null for 11/12 places (향일암 now 'high') | Data UPDATE from operational knowledge per place |
| `admission_fee_json` | null for all 12 | Official source update |
| `opening_hours_json` | null for all 12 | Official source update |
| `live_status_required=true` | No live feed connected | Live Travel State Pilot (HOLD) |

---

## Deployment Gate

| Action | Status |
|---|---|
| Commit 4bec10f | DONE |
| Push to origin | **NOT DONE — awaiting Founder authorization** |
| Deploy staging | **NOT DONE — awaiting Founder authorization** |
| Deploy production | **PROHIBITED** |

---

## Current Next Action

Prepare Field Knowledge Collection Form V0.1 for real Google Forms Pilot.
