# Basic Information — Production Data Conflict Resolution V0.1

**Status:** PRODUCTION_DATA_PRESENT_NO_RECOVERY_NEEDED  
**Date:** 2026-10-03  
**Mode:** STRICT READ-ONLY / EVIDENCE RECONCILIATION  
**HEAD at task start:** 2f79f05  
**Error source:** SOUL_BASIC_INFO_CONNECTION_TRACE_V0_1.md (2f79f05)

---

## A. Conflict Statement

The Basic Info Connection Trace (T3, commit 2f79f05) reported the following for production:

| Field | Place | T3 Claimed | Prior Evidence |
|---|---|---|---|
| admission_fee_json | hyangiram | NULL | Migration 218 execution record: {"adult":0} |
| opening_hours_json | hyangiram | NULL | Migration 218 execution record: {"summary":"04:00~19:00"} |
| physical_difficulty | hyangiram | NULL | Migration 218 post-apply verification: 'high' |
| admission_fee_json | odongdo | NULL | Migration 218 execution record: {"adult":0} |
| opening_hours_json | odongdo | NULL | Migration 218 execution record: {"summary":"24시간 연중무휴"} |
| physical_difficulty | odongdo | NULL | Migration 217 execution record: 'low' |

T3 Judgment consequence (wrongly concluded): PU-HY-003 (elderly ASK) would not fire because physical_difficulty=NULL.

---

## B. Evidence Sources Consulted (Read-Only)

| Source | Path | Method |
|---|---|---|
| Seed file — main branch | `database/seeds/001_travel_places.sql` | Read (working tree) |
| Seed file — staging branch | `database/seeds/001_travel_places.sql` | git show staging/storybook-c7a |
| Migration 216 | `database/migrations/216_travel_places_core12_reality_v01.sql` | git show staging/storybook-c7a |
| Migration 217 preflight+execution record | `docs/architecture/SOUL_MIGRATION_217_PREFLIGHT_AND_EXECUTION_RECORD_V0_1.md` | git show staging/storybook-c7a |
| Migration 218 execution record | `docs/architecture/SOUL_MIGRATION_218_EXECUTION_RECORD_V0_1.md` | git show staging/storybook-c7a |
| Place Basic Knowledge Audit | `docs/architecture/SOUL_PLACE_BASIC_KNOWLEDGE_RECOVERY_CONNECTION_AUDIT_V0_1.md` | git show staging/storybook-c7a |

No DB writes. No migrations executed. No external research.

---

## C. Root Cause — ENVIRONMENT_MISMATCH

T3 read `database/seeds/001_travel_places.sql` from the **main branch working tree**.

The staging branch (`staging/storybook-c7a`) has a different version of this file that includes:

```sql
UPDATE travel_places SET physical_difficulty = 'high' WHERE code = 'hyangiram';
```

This UPDATE is **absent on main**. T3 inspected the main-branch seed and concluded physical_difficulty was never set.

Additionally, T3 did not account for migrations applied directly to the production Render DB from the staging branch:

| Migration | Applied to Production | Content |
|---|---|---|
| 216 (`216_travel_places_core12_reality_v01.sql`) | YES (via staging, ~2026-09-22 Founder session) | admission_fee_json={'adult':0} for hyangiram, odongdo, and 7 others. Cablecar explicitly left NULL. |
| 217 (`15cd648`) | YES (2026-10-02 13:55) | hyangiram: opening_hours_json={'summary':'04:00~19:00'}, parking_info='공영주차장 2시간 무료'. odongdo: physical_difficulty='low', opening_hours_json={'summary':'24시간 연중무휴'} |
| 218 (`f2f069e`) | YES (2026-10-02, after 217) | hyangiram+odongdo: admission_fee_json={'adult':0} — idempotent no-op (already set by 216), but confirmed by post-apply full verification. |

T3 inspected only main-branch local files (seed 001, migrations 200-206). All migrations 207-218 are staging-branch-only and were applied to production externally. T3 had no view of this.

---

## D. Field-by-Field Verdict

### hyangiram

| Field | T3 Claimed | Actual Production Value | Source | Verdict |
|---|---|---|---|---|
| `admission_fee_json` | NULL | `{"adult":0}` | Migration 216 (staging, applied ~Sep 22) | PRIOR_EVIDENCE_CORRECT_CURRENT_DATA_PRESENT |
| `opening_hours_json` | NULL | `{"summary":"04:00~19:00"}` | Migration 217 (2026-10-02) | PRIOR_EVIDENCE_CORRECT_CURRENT_DATA_PRESENT |
| `parking_info` | NULL | `공영주차장 2시간 무료` | Migration 217 (2026-10-02) | PRIOR_EVIDENCE_CORRECT_CURRENT_DATA_PRESENT |
| `physical_difficulty` | NULL | `'high'` | Staging seed UPDATE (applied to production) | PRIOR_EVIDENCE_CORRECT_CURRENT_DATA_PRESENT |
| `avg_stay_minutes` | 90 | 90 | Seed 001 INSERT (on both branches) | T3_CORRECT |
| `indoor_outdoor` | outdoor | outdoor | Seed 001 INSERT | T3_CORRECT |
| `address` | 돌산읍 향일암로 1 | 돌산읍 향일암로 1 | Seed 001 INSERT | T3_CORRECT |

### odongdo

| Field | T3 Claimed | Actual Production Value | Source | Verdict |
|---|---|---|---|---|
| `admission_fee_json` | NULL | `{"adult":0}` | Migration 216 | PRIOR_EVIDENCE_CORRECT_CURRENT_DATA_PRESENT |
| `opening_hours_json` | NULL | `{"summary":"24시간 연중무휴"}` | Migration 217 | PRIOR_EVIDENCE_CORRECT_CURRENT_DATA_PRESENT |
| `physical_difficulty` | NULL | `'low'` | Migration 217 | PRIOR_EVIDENCE_CORRECT_CURRENT_DATA_PRESENT |
| `parking_info` | NULL | NULL | Migration 218 post-apply confirmed null | T3_CORRECT |
| `avg_stay_minutes` | 120 | 120 | Seed 001 INSERT | T3_CORRECT |

### cablecar

| Field | T3 Claimed | Actual Production Value | Source | Verdict |
|---|---|---|---|---|
| `admission_fee_json` | NULL | NULL | Migration 216: explicit COMMENT "cablecar: PAID — leave null" | T3_CORRECT |
| `opening_hours_json` | NULL | NULL | No migration set this | T3_CORRECT |
| `physical_difficulty` | NULL | NULL | No migration set this; staging seed UPDATE is hyangiram-only | T3_CORRECT |
| `parking_info` | NULL | NULL | No migration set this | T3_CORRECT |
| `avg_stay_minutes` | 60 | 60 | Seed 001 INSERT | T3_CORRECT |

---

## E. Judgment V0.1 Consequence — PU-HY-003

T3 concluded: "hyangiram.physical_difficulty=NULL in production → PU-HY-003 elderly ASK never fires."

**Correction:** hyangiram.physical_difficulty='high' IS present in production (staging seed UPDATE applied). Therefore:

```javascript
_judgePlaceLookup(hyangiram, people_type='family_elderly')
  → isHighDifficulty = (physical_difficulty === 'high') → TRUE
  → askRequired = true  // PU-HY-003 fires correctly
```

PU-HY-003 is working as designed. No code fix needed. No data recovery needed.

---

## F. Corrected Basic Info Data Availability (Production Actual)

| Field | hyangiram | odongdo | cablecar |
|---|---|---|---|
| `avg_stay_minutes` | 90 ✓ | 120 ✓ | 60 ✓ |
| `indoor_outdoor` | outdoor ✓ | outdoor ✓ | outdoor ✓ |
| `address` | 돌산읍 향일암로 1 ✓ | (seeded) ✓ | 오동도로 61-11 ✓ |
| `admission_fee_json` | {"adult":0} ✓ | {"adult":0} ✓ | NULL |
| `opening_hours_json` | {"summary":"04:00~19:00"} ✓ | {"summary":"24시간 연중무휴"} ✓ | NULL |
| `parking_info` | 공영주차장 2시간 무료 ✓ | NULL | NULL |
| `physical_difficulty` | 'high' ✓ | 'low' ✓ | NULL |

All non-NULL fields are already delivered in the PLACE_LOOKUP response (`places[0]` from `SELECT *`). No backend change needed.

**Backend-ready for Basic Info UI:** admission, hours, parking, difficulty — all available for hyangiram and odongdo immediately. Cablecar: only always-seeded fields (avg_stay, indoor_outdoor, address).

---

## G. Correction to SOUL_BASIC_INFO_CONNECTION_TRACE_V0_1.md

The following section of the T3 trace (commit 2f79f05) is incorrect:

> **DB data state:**
> - NULL (all 3 places): admission_fee_json, opening_hours_json, physical_difficulty, parking_info, description_short
> - Verified-but-not-in-DB (hyangiram only): admission=무료, hours=04:00~19:00, physical_difficulty=high

**Corrected:**
- NULL (all 3 places): description_short only
- NULL (cablecar only): admission_fee_json, opening_hours_json, parking_info, physical_difficulty
- Already in production DB (hyangiram): admission_fee_json={"adult":0}, opening_hours_json={"summary":"04:00~19:00"}, parking_info=공영주차장 2시간 무료, physical_difficulty='high'
- Already in production DB (odongdo): admission_fee_json={"adult":0}, opening_hours_json={"summary":"24시간 연중무휴"}, physical_difficulty='low'

The T3 trace section "CRITICAL: hyangiram physical_difficulty=NULL in production → PU-HY-003 elderly ASK never fires" is **retracted**. PU-HY-003 fires correctly.

The T3 decision (BASIC_INFO_CONNECTION_READY) and recommended approach (Option A: read from places[0]) remain **valid and unchanged**.

---

## H. Next Action Consequence

The corrected production DB state makes the Basic Info UI connection **even simpler** — more fields are immediately renderable without any data task:

**Immediate (no data task needed):**
- hyangiram: admission (무료), hours (04:00~19:00), parking (공영주차장 2시간 무료), physical_difficulty (경사와 계단)
- odongdo: admission (무료), hours (24시간 연중무휴), physical_difficulty (낮음/누구나)

**Still needs data task (separate Founder GO):**
- cablecar: admission, hours, parking, physical_difficulty
- All 3 places: description_short

The implementation scope from T3 is updated: the "DB data" task is no longer the critical path. Only cablecar and description_short remain as data gaps. UI component implementation can start immediately from places[0].

---

## I. Decision

**PRODUCTION_DATA_PRESENT_NO_RECOVERY_NEEDED**

- Conflict cause: ENVIRONMENT_MISMATCH — T3 read main-branch files; staging-branch seed+migrations were applied to production.
- No data is missing from production that was expected to be there.
- No migration needed to recover any field.
- No DB writes performed in this task.
- PU-HY-003 is functioning correctly.

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | Task mode | STRICT READ-ONLY / EVIDENCE RECONCILIATION |
| 2 | HEAD at start | 2f79f05 |
| 3 | DB writes executed | ZERO |
| 4 | Migrations executed | ZERO |
| 5 | External research | NONE |
| 6 | Conflict source | T3 read main-branch files; staging-branch seed+migrations 216-218 applied to production |
| 7 | Root cause classification | ENVIRONMENT_MISMATCH |
| 8 | hyangiram admission_fee_json | PRODUCTION_DATA_PRESENT {"adult":0} — set by migration 216 |
| 9 | hyangiram opening_hours_json | PRODUCTION_DATA_PRESENT {"summary":"04:00~19:00"} — set by migration 217 |
| 10 | hyangiram parking_info | PRODUCTION_DATA_PRESENT 공영주차장 2시간 무료 — set by migration 217 |
| 11 | hyangiram physical_difficulty | PRODUCTION_DATA_PRESENT 'high' — set by staging seed UPDATE (applied to production) |
| 12 | odongdo admission_fee_json | PRODUCTION_DATA_PRESENT {"adult":0} — set by migration 216 |
| 13 | odongdo opening_hours_json | PRODUCTION_DATA_PRESENT {"summary":"24시간 연중무휴"} — set by migration 217 |
| 14 | odongdo physical_difficulty | PRODUCTION_DATA_PRESENT 'low' — set by migration 217 |
| 15 | cablecar admission_fee_json | NULL — correct (deliberate, migration 216 comment confirmed) |
| 16 | cablecar opening_hours_json | NULL — correct |
| 17 | cablecar physical_difficulty | NULL — correct |
| 18 | PU-HY-003 status | FIRES CORRECTLY — physical_difficulty='high' confirmed in production |
| 19 | T3 trace corrections | Field matrix corrected (§G). Decision (BASIC_INFO_CONNECTION_READY) and Option A unchanged. |
| 20 | Data recovery needed | NONE |
| 21 | Implementation unblocked by correction | YES — more fields immediately renderable than T3 assumed |
| 22 | T3 trace document | `docs/architecture/SOUL_BASIC_INFO_CONNECTION_TRACE_V0_1.md` (2f79f05) — marked superseded by §G |
| 23 | Decision | **PRODUCTION_DATA_PRESENT_NO_RECOVERY_NEEDED** |
| 24 | Current Next Action | **Basic Information UI Connection V0.1 Implementation — Founder GO Gate** |
