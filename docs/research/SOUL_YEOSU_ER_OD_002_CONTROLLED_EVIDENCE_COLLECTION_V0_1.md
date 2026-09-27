# SOUL Yeosu — ER-OD-002 Controlled Evidence Collection V0.1

**ER:** OD-002  
**Title:** Odongdo Visitor Experience Patterns  
**Wave:** 4 (Priority P1)  
**Collection Cycle:** 16  
**Date:** 2026-09-28  
**Collector:** SOUL Research Pipeline  
**Status:** VERIFIED_FOR_PREPARATION  

---

## 1. Canonical Contract (from Matrix V0.1, lines 202–223)

| Field | Value |
|-------|-------|
| ER ID | OD-002 |
| Title | Odongdo Visitor Experience Patterns |
| Scenarios | O-1, O-2 (context) |
| Required Judgment | ANSWER — visitor experience / time expectation |
| Category | EXPERIENCE_VALUE |
| Evidence Needed | What travelers value at Odongdo; how long a typical visit takes; what physical scope the visit requires |
| Primary Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability | STABLE |
| Live Trigger | None |
| Confidence Target | Pattern-level across multiple visitor accounts |
| Negative/Exception Knowledge | NO |
| Dependency | OD-001 ✓ VERIFIED_FOR_PREPARATION |
| Stop Condition | EXPERIENCE_PATTERN_SUFFICIENT |
| Downstream | REL-003 (also needs REL-001 ✓ REL-002 ✓ CC-005 ✓) |

---

## 2. Pre-Collection Reuse Check

### 2.1 OD-001 Artifact Review

OD-001 collected WE accounts describing the inside-island trail character and named features. Duration data was explicitly deferred:

- **EI-OD-001-A** (kidsfuninseoul.wordpress.com): "Half-day visit duration noted (scope indicator only — OD-002 deferred)"
- **OD-001 Scope Boundary (line 84–87):** "Recommended visit duration patterns" and "Time-value assessments ('worth 2 hours', 'enough for half-day')" marked OUT OF SCOPE for OD-001; deferred to OD-002.

→ **EI-OD-001-A deferred duration content is now admissible for OD-002.** The WE source (kidsfuninseoul) already collected and corroborated — no re-collection needed; scope-tagged and reused here as EI-OD-002-A.

### 2.2 Route Corpus Review

Route Corpus V0.1 contains two independent traveler itinerary entries allocating time at Odongdo:

- **R028** (structured tour bus, FULL_DAY, MORNING): 오동도 — **60분** source_stay_time
- **R040** (뚜벅이 1박2일, Day 2): 오동도 — **30~60분 소요**

→ Both entries are traveler planning data (WORLD_EXPERIENCE proxy). Admissible as WE pattern evidence. Reused as **EI-OD-002-D** without re-collection.

### 2.3 OD-003 Artifact Review

OD-003 = physical access structure (causeway, Dongbaek Train). No visitor experience pattern or duration content. Not reusable for OD-002.

### 2.4 BATCH Files Review

BATCH 01/02 = operational facts (hours, fees, is_operational). No visitor experience pattern data. Not reusable.

### 2.5 Residual Gap After Reuse Freeze

| Gap Dimension | Coverage from Reuse | Collection Needed |
|---------------|--------------------|--------------------|
| Visit duration — baseline | Partial (half-day EI-OD-001-A; 60min R028; 30-60min R040) | Corroboration from direct WE needed |
| Visit duration — recommended range | None | YES — web collection |
| Value drivers (what travelers prize) | Partial (trail character, named features in OD-001) | Duration-value link needed |
| Physical scope experience | Good (2.5km / 0.12 km² from OD-001) | Corroboration |
| Seasonal experience variation | None | YES — web collection |
| FOUNDER secondary | None yet | SECONDARY — collect if gap remains |

---

## 3. WE Evidence Collection

### Collection Target
Direct WE accounts for: visit duration, what travelers find valuable, physical scope experience, seasonal patterns.

### Source Queries Executed
1. `오동도 여수 방문 소요시간 추천 코스 여행 후기 2024 2025` — Korean search
2. `오동도 여수 관람시간 얼마나 걸려 소요시간 1시간 2시간 후기` — Korean duration-specific
3. `Odongdo Yeosu visitor experience review how long visit worth it highlights 2024 2025` — English

### Sources Retrieved
- travelpang.kr (Korean travel guide, 2025)
- searchingkorea.com (Korea travel guide, 2025)
- kr.trip.com Moments (traveler accounts, 2026 data)
- TripAdvisor aggregated synthesis via search (multiple visitor reviews)
- thisis-southkorea.com (travel discovery, 2025)

---

## 4. Evidence Items

### EI-OD-002-A — Reused WE: Family Visitor Account (OD-001-A Source)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-OD-002-A |
| Reused From | OD-001 EI-OD-001-A (kidsfuninseoul.wordpress.com deferred duration content) |
| Source Role | WORLD_EXPERIENCE |
| Source Locator | https://kidsfuninseoul.wordpress.com/fun-trips-out-of-town/long-week-end-getaway/yeosu-odongdo-island/ |
| Reliability | HIGH — first-person family group account (5+ children) |
| Raw Claim | Half-day visit duration (noted in OD-001 as scope indicator, deferred to OD-002 for duration-value analysis) |
| Normalized Claim | A family group including 5+ children found a half-day duration appropriate for Odongdo — trails are family-accessible with sufficient variety (named landmarks, ascent/descent via staircases, bamboo groves, camellia forest) to fill half-day without feeling rushed |
| Duration Contribution | Half-day (≥2 hours including approach + island circuit) |
| Value Contribution | Family-accessible trail variety; named features sustain engagement across age groups |
| Claim Type | EXPERIENCE_PATTERN |
| Stability | STABLE |
| Corroboration | EI-OD-002-B, EI-OD-002-C (convergent on 1-2 hour island circuit) |

---

### EI-OD-002-B — Trip.com Traveler Moments 2026

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-OD-002-B |
| Source Role | WORLD_EXPERIENCE |
| Source Locator | https://kr.trip.com/moments/poi-odong-island-10547976/ |
| Reliability | HIGH — aggregated traveler moment accounts, 2026 data |
| Raw Claim (KR) | "한 바퀴는 대체로 1시간 내외로 충분하다" (one complete loop takes roughly one hour); wooden deck walking course described as therapeutic; forest passages opening to expansive natural vistas; Dragon Cave (용굴), Wind Valley (바람골), fountain plaza cited as must-visit photo spots; "푸른 파도가 치는 넓은 바다가 거대하게 펼쳐져 셔터를 누르는 순간 매 시간이 소중하고 깊이 있는 기록으로" |
| Normalized Claim | (1) One full circuit of Odongdo takes approximately 1 hour; (2) the wooden-deck forest trail is the primary experiential value — dense forest canopy opens suddenly to expansive ocean views; (3) specific named spots (Dragon Cave, Wind Valley, Musical Fountain Plaza) are the highlight anchors visitors recommend; (4) camellia season (March) considered peak visual experience |
| Duration Contribution | ~1 hour for one complete island loop |
| Value Contribution | Trail immersion → ocean revelation structure; named feature anchors; seasonal visual peak |
| Claim Type | EXPERIENCE_PATTERN |
| Stability | STABLE |
| Corroboration | EI-OD-002-A (half-day family); EI-OD-002-C (1-2 hours recommended); EI-OD-002-D (60min R028) |

---

### EI-OD-002-C — English Visitor Review Synthesis (TripAdvisor / Travel Guides)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-OD-002-C |
| Source Role | WORLD_EXPERIENCE |
| Source Locators | https://www.tripadvisor.com/Attraction_Review-g1074108-d2190771-Reviews-Odongdo (aggregated); https://searchingkorea.com/국내-여행-가이드/408; https://www.thisis-southkorea.com/2025/08/discover%20yeosu%20odongdo.html |
| Reliability | MEDIUM-HIGH — multiple independent English-language visitor sources; pattern consistent |
| Raw Claim | "You can spend 1-2 hours going around the island"; "1-2시간 정도의 시간을 넉넉하게 잡는 것이 좋으며, 사진 촬영과 휴식을 함께하면서 여유있게 즐기려면 2시간 이상을 할애하는 것을 권장합니다"; lighthouse viewpoint singled out for panoramic views across Yeosu coastline and Hallyeohaesang National Park; "walks are clean, well-built, and interesting, with well-marked signs to different views and clean bathrooms"; "a perfect starting point for Yeosu travel" |
| Normalized Claim | (1) Standard recommended visit duration: 1-2 hours on-island; for photo/relaxation visit: 2+ hours; (2) lighthouse observation deck (25m) is specifically called out as a viewpoint anchor — panoramic view of Yeosu coastline and islands; (3) trail infrastructure is high-quality, well-marked, accessible — reduces friction and increases visitor confidence; (4) Odongdo is positioned as a natural starting point for Yeosu itineraries |
| Duration Contribution | 1-2 hours (standard); 2+ hours (unhurried with photography) |
| Value Contribution | Lighthouse panoramic view; infrastructure quality; itinerary-anchor role |
| Claim Type | EXPERIENCE_PATTERN |
| Stability | STABLE |
| Corroboration | EI-OD-002-B (1 hour loop); EI-OD-002-A (half-day family) |

---

### EI-OD-002-D — Route Corpus WE Data: Traveler Itinerary Duration Patterns

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-OD-002-D |
| Source Role | WORLD_EXPERIENCE (traveler itinerary planning data) |
| Source Locator | docs/knowledge/YEOSU_ROUTE_CORPUS_V0_1.md (R028 line 90; R040 line 373) |
| Reliability | MEDIUM — traveler-planned itineraries; planned time ≠ actual time, but reflects traveler expectation pattern |
| Raw Claim | R028 (structured tour bus, MORNING): 오동도 source_stay_time = 60분; R040 (뚜벅이 독립여행, Day 2): 오동도 source_note = "30~60분 소요" |
| Normalized Claim | (1) Structured tour operators allocate 60 minutes at Odongdo — consistent with one-loop estimate; (2) independent travelers planning minimalist itineraries allocate 30-60 minutes — suggests the island can satisfy on 30 minutes but 60 is the standard; (3) both patterns support the lower bound being approximately 30-60 minutes for a purposeful visit |
| Duration Contribution | 30-60 min (minimum purposeful); 60 min (structured tour standard) |
| Value Contribution | Confirms 60 min as a recognized planning unit; 30 min = minimum for walk-through |
| Claim Type | EXPERIENCE_PATTERN |
| Stability | STABLE |
| Corroboration | EI-OD-002-B (1 hour), EI-OD-002-C (1-2 hours) |

---

## 5. Convergence Analysis

### 5.1 Duration Pattern Convergence

| Source | Duration Claim | Visit Type |
|--------|---------------|------------|
| EI-OD-002-A (kidsfuninseoul WE family) | Half-day (≥2 hours total) | Thorough family visit |
| EI-OD-002-B (Trip.com traveler accounts) | ~1 hour per loop | Standard circuit |
| EI-OD-002-C (TripAdvisor/guides aggregate) | 1-2 hours standard; 2+ hours with photography | Varied types |
| EI-OD-002-D Route Corpus R028 | 60 minutes | Tour bus structured |
| EI-OD-002-D Route Corpus R040 | 30-60 minutes | Independent minimalist |

**Convergent Pattern:**
- Minimum purposeful visit: **30-60 minutes** (island circuit only; Dongbaek Train approach)
- Standard thorough visit: **1-2 hours on-island** + 30 min approach time = **1.5-2.5 hours total**
- Unhurried (photography + rest): **2+ hours on-island**
- Combined Odongdo + Cable Car: **half-day** (3-4 hours total)

### 5.2 Value Driver Pattern Convergence

| Value Driver | Sources Confirming |
|-------------|-------------------|
| Forest trail immersion (2.5km canopy walk) | EI-OD-002-B, EI-OD-002-C, EI-OD-001-A (OD-001 reuse) |
| Ocean panorama revelation (forest → cliff) | EI-OD-002-B, EI-OD-002-C, travelpang.kr |
| Lighthouse viewpoint (25m, panoramic) | EI-OD-002-C, searchingkorea.com, Trip.com |
| Camellia season (Jan-March, 3,000 trees) | EI-OD-002-B, EI-OD-002-C, EI-OD-001-B (OD-001 corroboration) |
| Named features (Dragon Cave, Bamboo Tunnel, Musical Fountain) | EI-OD-002-B (Dragon Cave/Wind Valley), EI-OD-001-E (OFFICIAL) |
| Accessible/family-friendly character | EI-OD-002-A (5+ children), EI-OD-002-C (well-marked, clean) |
| Itinerary-anchor role (starting point for Yeosu) | EI-OD-002-C, EI-OD-002-D (R028 first stop, MORNING) |

### 5.3 Physical Scope Pattern

- Island: ~0.12 km² — compact, complete exploration in single visit
- Trail: ~2.5km forest trail loop — sequentially encounters all named features
- Approach: 1.2km breakwater (15-min walk each way) OR Dongbaek Train (saves 30 min total)
- Elevation: staircases + ascent/descent; not demanding (children 5+ capable per EI-OD-002-A)
- Scope framing: "compact but complete" — size creates intimacy, not deprivation

---

## 6. FOUNDER Secondary Assessment

**FOUNDER secondary role** — No direct Founder field account currently in repository for OD-002 scope (visit duration / value patterns).

The scale and trail infrastructure facts from OD-001 (EI-OD-001-E OFFICIAL) and the WE pattern (EI-OD-002-A through D) establish a sufficiently robust pattern for preparation purposes. FOUNDER secondary is not required to meet stop condition.

**FOUNDER gap:** If Founder has personal Odongdo visit experience (duration lived, value felt, seasonal context), that evidence would strengthen the SOUL synthesis layer at response time — particularly for seasonal recommendations (camellia bloom timing). Filed as open FOUNDER secondary gap but not blocking.

---

## 7. Stop Condition Evaluation

**Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT**

Criterion: A recognizable pattern across ≥3 independent WE accounts sharing the same experience dimension.

| Check | Status |
|-------|--------|
| ≥3 independent WE accounts | ✓ — 4 distinct sources: EI-OD-002-A (WP blog), EI-OD-002-B (Trip.com), EI-OD-002-C (TA/guides), EI-OD-002-D (Route Corpus) |
| Duration dimension convergent | ✓ — 1-hour loop / 1-2 hour thorough / 30-60 min minimum — consistent across all 4 sources |
| Value dimension convergent | ✓ — forest trail + lighthouse + camellia season + named features confirmed across ≥3 sources |
| Scope dimension convergent | ✓ — compact island, 2.5km trail, accessible, single-visit completable — confirmed across ≥3 sources |
| Conflicting claims | None identified — range (30 min to half-day) is explained by visit type, not conflict |
| Negative/exception knowledge required | NO (canonical contract) |

**EXPERIENCE_PATTERN_SUFFICIENT: MET**

---

## 8. Synthesis: Prepared Experience Pattern for SOUL

### OD-002 Prepared Pattern (SOUL Authoring Use)

**What Odongdo delivers:**
Odongdo is a compact, walkable island (~0.12 km²) where the primary value is forest trail immersion — a 2.5km loop through bamboo groves and camellia forest, punctuated by named geological features (Dragon Cave, Seal Rock, Bamboo Tunnel), that opens repeatedly to coastal cliff views and culminates at a 25m lighthouse with panoramic views over Yeosu's island-dotted sea.

**How long visitors actually spend:**
- Purposeful (one full loop, Dongbaek Train approach): **60 minutes on-island** + minimal transit
- Standard thorough visit: **1.5-2 hours total** (approach + one loop + lighthouse)
- Unhurried (photography, rest, seasonal peak): **2+ hours total**
- Combined with Cable Car: **half-day** natural pairing

**What visitors value most:**
1. Forest trail immersion — canopy shade in summer heat; sensory contrast (botanical scent, sea breeze)
2. Ocean revelation moments — trail breaks to cliff views create photographic highlight points
3. Lighthouse viewpoint — elevated perspective across Hallyeohaesang islands
4. Camellia season (January–March) — transformative; 3,000 trees; peak bloom February–March
5. Accessibility — family-friendly, well-marked, manageable even with young children
6. Compact completeness — visitors feel they've "seen the island" without exhaustion

**SOUL answer guidance:**
- For O-1 (time budget question): 60 min minimum if pressed; 1.5-2 hours for proper visit
- For O-2 (what to expect): Forest trail → named features → lighthouse → cliff views; camellia bonus Jan-March
- Physical scope is NOT demanding — appropriate for families, casual walkers; NOT a challenge hike

---

## 9. Collection Result

| Field | Value |
|-------|-------|
| Stop Condition | EXPERIENCE_PATTERN_SUFFICIENT |
| Stop Condition Met | YES |
| Final Status | VERIFIED_FOR_PREPARATION |
| WE Sources Collected | 4 independent accounts (EI-OD-002-A through D) |
| FOUNDER Secondary | Not collected (not required for stop condition; gap noted) |
| Downstream Effect | REL-003 dependency OD-002 now SATISFIED → REL-003 = READY_FOR_COLLECTION |
| Stability Class | STABLE (no live trigger; no volatile pricing/hours in scope) |
| Recommended Refresh | 24+ months (structural experience pattern; seasonal timing stable) |

---

## 10. Admissibility Table

| Evidence Item | Reuse Scope |
|--------------|-------------|
| EI-OD-002-A (family WE, duration) | OD-002 + any Odongdo visitor experience ERs |
| EI-OD-002-B (Trip.com WE, loop time + features) | OD-002 + OD-005 (suitability context) + REL-003 |
| EI-OD-002-C (TA/guides, 1-2hr + lighthouse) | OD-002 + OD-005 + REL-003 |
| EI-OD-002-D (Route Corpus, 60min/30-60min) | OD-002 + REL-003 + time-budget ERs |

---

*STOP — ER-OD-002 collection complete. Do not execute any other Wave 4 ER without separate authorization.*
