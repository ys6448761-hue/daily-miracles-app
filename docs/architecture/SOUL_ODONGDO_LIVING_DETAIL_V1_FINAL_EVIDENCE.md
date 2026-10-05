# SOUL_ODONGDO_LIVING_DETAIL_V1_FINAL_EVIDENCE

**Status:** FOUNDER/LUMI APPROVED / CLOSED_CURRENT_PHASE  
**Date:** 2026-10-05  
**Approval:** Founder/Lumi Final Decision (pasted directive)  
**Commits:** `8ecaaae` (Odongdo V1 impl) → `06de524` (Essential Info curated + FAQ walking fix)

---

## 1. PRODUCT DEFINITION

"어느 크기로 경험하는 것이 좋은가?" (갈까 말까? 아님)  
3-stage experience model: 방파제 진입 → 섬 내부 → 귀환

---

## 2. IMPLEMENTED LAYERS

| 레이어 | 상태 | Commit |
|---|---|---|
| Place Hero Visual (odongdo.png) | CLOSED | `8ecaaae` |
| SOUL Discovery (4 variants) | CLOSED | `8ecaaae` |
| ESSENTIAL INFO curated | CLOSED | `06de524` |
| Experience: Camellia + Sea Discovery | CLOSED | `8ecaaae` |
| Context: Family Walk (parents/family) | CLOSED | `8ecaaae` |
| FOR ME (parents/family/vehicle) | CLOSED | `8ecaaae` |
| OdongdoJourneyFlow (3-stage) | CLOSED | `8ecaaae` |
| OdongdoNextJourney | CLOSED | `8ecaaae` |
| OdongdoQuestionDiscovery (6 questions) | CLOSED | `06de524` |

---

## 3. PROVENANCE / SAFETY FIX RECORD

### 3-1. ESSENTIAL INFO (06de524)

**Problem:** Generic PlaceBasicInfo V0.2 formatter exposed unverified DB fields for Odongdo.  
**Root Cause:** `_fmtAdmission` / `_fmtHours` / `_fmtDifficulty` generate values at runtime from DB;  
static bundle scan cannot detect dynamically formatted claims → Evidence Safety 0건 ≠ runtime safety.

**DB State at commit:**
- `admission_fee_json` = NULL in seed (no committed migration)
- `opening_hours_json` = NULL in seed (no committed migration)
- `physical_difficulty` = NULL in seed
- `avg_stay_minutes` = 120 (seed) — CONFLICT with Route Corpus R041 (30~60min estimate)

**Fix:** `isOdongdoView` gate → curated verified-only content:
- `FactRow label="환경" value="야외"` — Source: seed `indoor_outdoor='outdoor'`
- Advisory: "입장료·운영시간·주차는 방문 전 확인을 권장해요."

### 3-2. FAQ Walking Claim (06de524)

- Before: "방파제 길을 포함해 섬 전체를 도보로 돌아볼 수 있어요."
- After:  "방파제 길과 섬 안쪽을 도보로 돌아볼 수 있어요."
- Reason: "전체" = unverified total-island coverage claim. Removed without Phoenix verification.

---

## 4. ASSET INVENTORY

**Source:** `C:\DREAM TOWN\Assets\SOUL\Odongdo\`  
**Destination:** `dreamtown-frontend/public/images/soul/odongdo/`

| 파일 | Bytes | 상태 | 연결 |
|---|---|---|---|
| `experience-camellia.png` | 3,226,916 | WIRED | 항상 (Odongdo) |
| `experience-sea-discovery.png` | 3,239,381 | WIRED | 항상 (Odongdo) |
| `context-family-walk.png` | 2,537,270 | WIRED | parents/family only |
| `context-kids-fountain.png` | 3,264,276 | IMPORTED, NOT wired | E gap — no Phoenix fountain knowledge |
| `experience-bamboo-path.png` | 3,078,982 | IMPORTED, NOT wired | E gap — no Phoenix bamboo knowledge |

`Place_Hero\SOUL_ODONGDO_PLACE_HERO_V01.png` → `public/images/soul/place-hero/odongdo.png`  
(2,882,218 bytes, 200 OK)

**Wish_Scene:** EMPTY folder — no source asset. Wish Scene NOT implemented. Permanently deferred.

---

## 5. BUILD / EVIDENCE SAFETY

| 항목 | 결과 |
|---|---|
| 빌드 모듈 수 | **690** |
| 빌드 오류 | **0** |
| Bundle | `index-DKNHNqsP.js` (1,250.80 kB) |
| Evidence Safety 금지 표현 8종 | **0건** ✓ |
| Cable Car V1 regression | **0건** ✓ |
| Schema / Migration / DB / Seed | **0건** |

---

## 6. HOLD 목록 (이 Phase에서 해제하지 않음)

| 항목 | 상태 | 재개 조건 |
|---|---|---|
| Human Experience | HOLD | Mom-cafe Pilot Evidence 확보 후 별도 단계 |
| Bamboo knowledge | E gap | Phoenix Knowledge 확보 후 |
| Fountain knowledge | E gap | Phoenix Knowledge 확보 후 |
| avg_stay CONFLICT (120↔30~60min) | UNRESOLVED | 별도 Evidence 확보 후 |
| Opening hours / admission_fee | NULL / unverified | Official Eye 확인 후 |
| Wish Scene | NO_ASSET | Founder 자산 제공 후 |
| Travel Time Matrix | GOVERNANCE_HOLD | 별도 결정 |

---

## 7. CURRENT NEXT ACTION

`HYANGIRAM LIVING DETAIL V1 — FOUNDER/LUMI REVIEW`
