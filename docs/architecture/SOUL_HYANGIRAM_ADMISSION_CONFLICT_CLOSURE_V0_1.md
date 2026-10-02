# SOUL Hyangiram Admission Conflict Closure V0.1

Date: 2026-10-02
Branch: staging/storybook-c7a
HEAD at closure: f7c635f
Mode: EVIDENCE / CANONICAL CORRECTION ONLY

---

## 1. Conflict Summary

Two canonical sources disagreed on hyangiram admission fee:

| Source | Claim | Date |
|---|---|---|
| `docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` §C | "향일암 (입장료 있음)" | 2026-07-02 (manifest creation) |
| `database/migrations/216_travel_places_core12_reality_v01.sql` | `admission_fee_json = {"adult": 0}` | 2026-09-22 (migration) |
| `docs/knowledge/YEOSU_2026_VERIFICATION_QUEUE_V0_1.md` Queue 2 | PENDING — admission_fee | 2026-07-02 |

---

## 2. Evidence for Resolution

### Primary: YEOSU_2026_VERIFICATION_BATCH_01.md [11]
- Entity: 향일암
- verdict: **CHANGED** (Legacy null → 현재 무료 확인)
- current_value: **입장료: 무료. 기존 문화재 관람료: 성인 2,500원, 학생 1,000원 → 폐지.**
- 관람시간: 04:00~19:00
- verified_at: 2026-09-20
- source_type: GOVERNMENT_PORTAL + OFFICIAL_NEWS
- source_url: https://www.yeosu.go.kr/tour/travel/10tour/hyangilam (여수시 공식) / https://www.nhanews.com/news/articleView.html?idxno=79326 (남해안신문 — 관람료 폐지 보도)

### Corroborating: SOUL_YEOSU_WAVE_4_READINESS_CHECK_V0_1.md
- "향일암 admission_fee | 무료 (입장료 폐지; 기존 성인 2,500원 → 0원) | ADMISSIBLE — OFFICIAL source (여수시 공식 + 남해안신문)"

### Corroborating: SOUL_YEOSU_PRE_WAVE_1_EXISTING_ASSET_SURVEY_V0_1.md
- "향일암 입장료 | 무료 | GOVERNMENT_PORTAL (yeosu.go.kr), verified 2026-09-20 | VERIFIED_OPERATIONAL_FACT"

### Note on migration 216 scope
`216_travel_places_core12_reality_v01.sql` was approved 2026-09-22 (Founder session).
It set `admission_fee_json = {"adult": 0}` for hyangiram, consistent with official verification.

---

## 3. Historical Context — Why "입장료 있음" Was Written

The entity manifest §C was written at manifest creation (2026-07-02).
At that time, Batch 01 verification had not yet occurred.
The statement "입장료 있음" reflected a prior legacy state:
- Hyangiram previously charged a cultural heritage viewing fee (문화재 관람료): 성인 2,500원, 학생 1,000원.
- This fee was abolished under a national cultural heritage policy change (documented in 남해안신문 보도).
- The manifest entry was written before this change was verified in the Phoenix canonical system.

The statement is STALE/INCORRECT relative to current verified state.
It is NOT a false record of prior state — it was accurate at the time but has been superseded.

---

## 4. Decision

**향일암 입장료 무료 확정.**

Canonical current value:
```
travel_places.admission_fee_json = {"adult": 0}
```

Effective date of free admission: prior to 2026-09-20 (official source; exact transition date noted as "추가 확인 권장" in Batch 01)

Trust level: GOVERNMENT_PORTAL + OFFICIAL_NEWS (HIGH)

---

## 5. Stale Evidence Disposition

| Document | Stale statement | Action |
|---|---|---|
| `docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` §C line 283 | "향일암 (입장료 있음)" | Annotated STALE/SUPERSEDED 2026-10-02. Historical text preserved with strikethrough. |
| `docs/research/SOUL_YEOSU_HUMAN_BLIND_TEST_EXECUTION_PACKAGE_EP_A_V0_1.md` line 880 | "성인 ₩2,000 기준 (VERIFY at freeze time)" | Annotated STALE/SUPERSEDED 2026-10-02. Was already marked SEMI_STABLE with VERIFY annotation. Historical text preserved with strikethrough. |
| `docs/knowledge/YEOSU_2026_VERIFICATION_QUEUE_V0_1.md` Queue 2 line 95 | PENDING admission_fee | Updated to VERIFIED_CLOSED. verified_value and verified_at filled from Batch 01 evidence. |
| `docs/architecture/SOUL_PLACE_BASIC_KNOWLEDGE_RUNTIME_TRACE_V0_1.md` | CONFLICTED classification / Q-A OPEN / FD-1 blocking | Updated to CLOSED 2026-10-02. |

---

## 6. Canonical Current Value

| Field | Value | Source | Trust |
|---|---|---|---|
| admission_fee_json | `{"adult": 0}` | migration 216 + Batch 01 verification | HIGH (GOVERNMENT_PORTAL) |
| "무료" means | General admission to 향일암 암자 | yeosu.go.kr | HIGH |

---

## 7. What "무료" Covers — and What It Does NOT Establish

**무료 COVERS:**
- General admission to 향일암 암자

**무료 does NOT establish or imply:**
- 주차 무료 (parking fee status — note: Batch 01 records "공영주차장 2시간 무료" but this is separate data)
- 템플스테이 프로그램 무료 (templestay program fees)
- 기타 사찰 체험 프로그램 무료 (other temple experience programs)
- 버스/교통 무료 (transport costs)
- 향일암 관련 모든 서비스 무료 (all services at or near hyangiram)

These remain independent fields requiring their own evidence.

---

## 8. Verification Queue Disposition

Queue 2 향일암 admission_fee row:
- Before: PENDING
- After: VERIFIED_CLOSED
- verified_value: 무료 (adult=0). 기존 성인 2,500원 → 문화재 관람료 폐지. travel_places 216에 반영됨.
- verified_at: 2026-09-20
- evidence: YEOSU_2026_VERIFICATION_BATCH_01.md [11]

Queue 2 향일암 opening_hours row:
- Status: PENDING (unchanged — out of scope for this closure task)
- Note: Batch 01 also recorded opening hours (04:00~19:00) — separate closure task if needed.

---

## 9. Files Modified in This Task

| File | Change type | Detail |
|---|---|---|
| `docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` | Annotation | §C "입장료 있음" superseded with STALE marker + closure reference |
| `docs/knowledge/YEOSU_2026_VERIFICATION_QUEUE_V0_1.md` | Status update | Queue 2 향일암 admission_fee: PENDING → VERIFIED_CLOSED |
| `docs/research/SOUL_YEOSU_HUMAN_BLIND_TEST_EXECUTION_PACKAGE_EP_A_V0_1.md` | Annotation | Line 880 "₩2,000 기준" superseded with STALE marker |
| `docs/architecture/SOUL_PLACE_BASIC_KNOWLEDGE_RUNTIME_TRACE_V0_1.md` | Status update | Conflict entry → RESOLVED; Q-A → CLOSED; FD-1 → CLOSED |
| `docs/architecture/SOUL_HYANGIRAM_ADMISSION_CONFLICT_CLOSURE_V0_1.md` | Created | This document |

**Not changed:**
- `database/migrations/` — no migration needed (216 already correct)
- `services/soyeowoolService.js` — no backend change
- `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` — JS falsy fix is a separate task
- Any runtime behavior — no change
- `database/seeds/001_travel_places.sql` — seed predates 216; 216 overrides correctly

---

## 10. Remaining Active Paid-Admission Claims — Post-Correction Validation

After corrections applied, remaining references to hyangiram admission:

| Document | Reference | Classification |
|---|---|---|
| `YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` §C | ~~입장료 있음~~ → STALE/SUPERSEDED annotation | HISTORICAL_RECORD |
| `YEOSU_HUMAN_BLIND_TEST_EXECUTION_PACKAGE_EP_A_V0_1.md` | ~~₩2,000 기준~~ → STALE/SUPERSEDED annotation | HISTORICAL_RECORD |
| `SOUL_YEOSU_LIGHT_HBT_V0_1_STIMULUS_FREEZE.md` | "입장료 및 버스 시간표는 방문 전 확인하시기 바랍니다." | HISTORICAL_RECORD — hedged, no fee value asserted. No correction needed. |
| `YEOSU_2026_VERIFICATION_BATCH_01.md` [11] | "기존 성인 2,500원 → 폐지" | HISTORICAL_RECORD — documents the fee history correctly. No correction needed. |
| `SOUL_YEOSU_WAVE_4_READINESS_CHECK_V0_1.md` | "기존 성인 2,500원 → 0원 | ADMISSIBLE" | HISTORICAL_RECORD — already correct. No correction needed. |

**ACTIVE_CONFLICT remaining: NONE.**

---

## 11. Unchanged Areas

Per task scope:
- 주차 (parking): not changed. Batch 01 records "공영주차장 2시간 무료" — separate field, separate evidence, separate decision.
- 운영시간 (opening hours): not changed. Batch 01 records 04:00~19:00 — separate verification item (Queue 2 row still PENDING).
- 보행 부담 (walking/accessibility): not changed. physical_difficulty='high' remains.
- 템플스테이: not changed.
- avg_stay_minutes: not changed (remains 90).
- 일출 timing: not changed.
- Any runtime/frontend behavior: not changed. JS falsy bug fix is a SEPARATE Presentation Gap task.

---

## 12. Next Action After Closure

**SOUL Place Basic Knowledge Preparation V0.1**
— Odongdo & Hyangiram Verification / Gap Fill Plan

Do NOT begin automatically. Wait for Founder GO.
