# SOUL Legacy Journey Presentation Restoration V0.1 — Implementation Evidence
Date: 2026-10-01
Branch: staging/storybook-c7a
Status: IMPLEMENTED / VERIFIED (API/Runtime Verification)
Scope: course.blocks[] → client payload → existing CourseDisplay restoration

---

## 1. Problem Statement

Journey Composer V0 (`travelGuideService._composeJourney()`) generates a rich
`course.blocks[]` structure on every journey-planning request.
`soyeowoolService._buildClientPayload()` extracted only `tgResult.places` —
`tgResult.course` was silently dropped. Client received `course: undefined`.
Existing `CourseDisplay.jsx` was never rendered in `SoulCableCarPage.jsx`.

---

## 2. Implementation

### Changed Files (2)

| File | Change |
|---|---|
| `services/soyeowoolService.js` | `_buildClientPayload()` return에 `course: (tgResult && tgResult.course) \|\| null` 1줄 추가 (line 982) |
| `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` | `CourseDisplay` import + course-first / route.days[] fallback 렌더링 (~5줄) |

**diff: +6 lines. DB migration: NONE. New components: NONE. CourseDisplay: UNCHANGED.**

### soyeowoolService.js — _buildClientPayload() return

```javascript
route: routeSkeleton || null,
// JOURNEY COMPOSER V0: rich course blocks (place/transition/meal/cafe)
// Previously dropped here — restored as additive field. null when not generated.
course: (tgResult && tgResult.course) || null
```

### SoulCableCarPage.jsx — Journey Card render

```jsx
import CourseDisplay from '../components/TravelGuide/CourseDisplay.jsx';

{/* course-first: prevents double Journey exposure. */}
{soulResponse?.course?.blocks?.length > 0 ? (
  <div className="mt-4 border-t border-white border-opacity-10 pt-4">
    <CourseDisplay course={soulResponse.course} />
  </div>
) : soulResponse?.route?.days?.length > 0 && (
  /* Fallback: route skeleton (LOCKED items) when course not available */
  <div className="mt-4 space-y-2 border-t border-white border-opacity-10 pt-4">
    {soulResponse.route.days.flatMap(d => d.items || []).map((item, i) => (
      <div key={i} className="flex gap-3 items-start">
        <span className="text-xs text-white opacity-30 mt-0.5 shrink-0 w-12">{item.time_slot || ''}</span>
        <div>
          <p className={`text-sm leading-snug ${item.selection_status === 'LOCKED' ? 'text-star-gold' : 'text-white'}`}>
            {item.name}
          </p>
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 3. Verification Results (API/Runtime Verification)

### Golden Question

**Input:** "10월 17일 라마다에서 출발해서 여수해상케이블카 타려고 해. 일정하고 비용 알려줘."

**API Response:**
```
STATUS: 200
HAS COURSE: True
BLOCKS: 4
  [place] 케이블카 stay=45
  [travel_transition] (이동)
  [place] 자산공원 stay=30
  [cafe] (카페)
SUMMARY: fit=travel_time_unverified stops=2
MESSAGE_KO: "관광·식사·휴식 기준으로 구성했어요. 장소 간 이동시간은 현재 확인 중입니다."
HAS ROUTE: True days=2
HAS QUOTE: False (guest_count 없음 → clarification 경로 — 정상)
```

### Origin Preservation Regression (330a54b)

Route에 라마다 호텔 숙박 노드 absent:
```
DAY 1: [arrival] 여수 도착 / [primary] 자산공원 / [leisure] 여수 해상케이블카
DAY 2: [departure] 여행 마무리
```
"라마다에서 출발" → departure_origin = ramada, hotel_lodging = null → skeleton hotel_code = null → lodging 노드 없음 ✓

### A/B/C/D Semantic Role: 4/4 PASS

### Full Test Suite
- Failed suites: 33 / Failed tests: 55 / Passed: 526
- Baseline (330a54b) 동일 — 신규 regression: 0

### Build: PASS (706 modules)

### course / route 이중 노출 방지
course-first 조건: `course.blocks.length > 0` → CourseDisplay 렌더 → route.days[] 렌더 미실행 ✓

---

## 4. What This Change Does NOT Solve

| Item | Status |
|---|---|
| `departure_origin` → Journey Composer | SEMANTIC_GAP / OPEN |
| `departure_origin` → SOUL message | PRESENTATION_GAP / OPEN |
| `travel_transition.estimated_duration_range` | GOVERNANCE_HOLD (Travel Time Matrix) |
| `block.reason` → CourseDisplay | CONNECT_LATER |
| "에서 자고" LODGING_SUFFIX 미매칭 | COVERAGE_GAP |
| Journey Quality Overall | PARTIAL — course 렌더 복구됨, 개인화/Travel Time 미해결 |

---

## 5. Current Next Action (exactly 1)

**Origin-aware Journey Judgment Connection V0.1 —
`departure_origin` → existing Journey Composer/domainContext
READ-ONLY scope verification**

NOT YET IMPLEMENTED. Scope verification required before implementation.

---

## 6. Evidence References

- `services/travelGuideService.js` line 173: `_composeJourney()` call
- `services/travelGuideService.js` line 250: `course: journeyComposition.course` in tgResult
- `services/soyeowoolService.js` line 982: `course: (tgResult && tgResult.course) || null`
- `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` line 16: CourseDisplay import
- `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` line 527–547: course-first render
- Prior scope doc: `docs/architecture/SOUL_LEGACY_JOURNEY_PRESENTATION_RESTORATION_SCOPE_V0_1.md`
- Origin Preservation evidence: `docs/architecture/SOUL_GOLDEN_QUESTION_ORIGIN_PRESERVATION_IMPL_V0_1.md`
