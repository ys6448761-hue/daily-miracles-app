# Journey Composer V0 — Mobile UI Preview

## Visual Layout

### 180 Minutes (반나절) Course — Mobile Display

```
┌─────────────────────────────────────┐
│  오늘의 여수 추천                      │
├─────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 📋 여행 코스 구성               │ │
│  │ 180분 코스  ⭐ 여유 있음      │ │
│  │                                │ │
│  │ 📍 케이블카                    │ │
│  │    40분 체류                   │ │
│  │                                │ │
│  │ ↓                              │ │
│  │ 이동 (시간 미정)              │ │
│  │ 약 10-30분                     │ │
│  │                                │ │
│  │ 📍 향일암                      │ │
│  │    30분 체류                   │ │
│  │    ⚠️ total_required_time_    │ │
│  │       unverified              │ │
│  │                                │ │
│  │ 🍽️ 점심                       │ │
│  │    약 60분                     │ │
│  │    모이핀 | 카페하루           │ │
│  │                                │ │
│  │ ☕ 카페 휴식                   │ │
│  │    약 30분                     │ │
│  │    모이핀 | 카페하루           │ │
│  │                                │ │
│  │ ┌──────────────────────────┐  │ │
│  │ │ 선택 장소 | 2곳          │  │ │
│  │ │ 체류 시간 | 70분         │  │ │
│  │ │ 총 예상  | 140-180분     │  │ │
│  │ └──────────────────────────┘  │ │
│  └────────────────────────────────┘ │
│                                      │
│  🌟 가볼 곳                          │
│  ┌────────────────────────────────┐ │
│  │ 📌 케이블카                    │ │
│  │    40분 체류                   │ │
│  │    여수의 야경을 즐기기 좋음   │ │
│  │    [지도] [길찾기]             │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 📌 향일암                      │ │
│  │    30분 체류                   │ │
│  │    일출의 명소                 │ │
│  │    [지도] [길찾기]             │ │
│  └────────────────────────────────┘ │
│                                      │
│  [다시 추천 받기] [별빛항로로]      │
└─────────────────────────────────────┘
```

### 480 Minutes (하루) Course — Mobile Display

```
┌─────────────────────────────────────┐
│  오늘의 여수 추천                      │
├─────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 📋 여행 코스 구성               │ │
│  │ 480분 코스  🎯 딱 맞음        │ │
│  │                                │ │
│  │ 📍 케이블카                    │ │
│  │    40분 체류                   │ │
│  │                                │ │
│  │ ↓                              │ │
│  │ 이동 (시간 미정)              │ │
│  │ 약 10-30분                     │ │
│  │                                │ │
│  │ 📍 향일암                      │ │
│  │    30분 체류                   │ │
│  │                                │ │
│  │ ↓                              │ │
│  │ 이동 (시간 미정)              │ │
│  │ 약 10-30분                     │ │
│  │                                │ │
│  │ 📍 자산공원                    │ │
│  │    50분 체류                   │ │
│  │                                │ │
│  │ 🍽️ 점심                       │ │
│  │    약 60분                     │ │
│  │    모이핀 | 카페하루           │ │
│  │                                │ │
│  │ ☕ 카페 휴식                   │ │
│  │    약 30분                     │ │
│  │    모이핀 | 카페하루           │ │
│  │                                │ │
│  │ ┌──────────────────────────┐  │ │
│  │ │ 선택 장소 | 3곳          │  │ │
│  │ │ 체류 시간 | 120분        │  │ │
│  │ │ 총 예상  | 210-270분     │  │ │
│  │ └──────────────────────────┘  │ │
│  │ "🎯 딱 맞음" — 480분 코스에    │ │
│  │ 적합하게 구성됨                │ │
│  └────────────────────────────────┘ │
│                                      │
│  🌟 가볼 곳                          │
│  ┌────────────────────────────────┐ │
│  │ 📌 케이블카                    │ │
│  │    ...                         │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 📌 향일암                      │ │
│  │    ...                         │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 📌 자산공원                    │ │
│  │    ...                         │ │
│  └────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

---

## Color & Icon Reference

### Block Type Styling

| Type | Icon | Color | Status |
|------|------|-------|--------|
| Place | 📍 | Gold (#FFD76A) | Primary |
| Travel | ↓ | Green (rgba(100,200,150)) | Secondary |
| Meal | 🍽️ | Orange (rgba(255,150,100)) | Secondary |
| Cafe | ☕ | Blue (rgba(120,180,200)) | Secondary |

### Fit Status Indicator

| Status | Icon | Color | Message |
|--------|------|-------|---------|
| fits_comfortably | ⭐ | Green | "여유 있음" |
| fits_tight | 🎯 | Orange | "딱 맞음" |

---

## Responsive Behavior

### Mobile (375px)
- Horizontal layout: Icon | Content
- Blocks stack vertically with gaps
- Summary grid: 3 columns (선택 장소 | 체류 시간 | 총 예상)
- Warnings display inline with text

### Tablet (768px)
- Same layout with larger fonts
- More padding
- Better spacing

### Desktop (1024px)
- Could be displayed side-by-side with map
- Larger visual hierarchy

---

## Accessibility Features

1. **Semantic HTML Structure**
   - Section with proper heading hierarchy
   - Semantic role for timeline

2. **Color Contrast**
   - Text: rgba(255, 255, 255, 0.95) on dark background ✅
   - Accent: #FFD76A on dark background ✅

3. **Icon + Text Labels**
   - Not relying on icons alone
   - Every icon has accompanying text

4. **Warning Display**
   - ⚠️ prefix for easy scanning
   - Contextual placement near affected block

---

## Interaction Points

### On Mobile
1. **Course Block** (tappable)
   - Tap place → Scroll to place detail below
   - Tap restaurant → Show full menu (future)
   - Tap cafe → Show location (future)

2. **Fit Status**
   - Hover/tap to show time breakdown explanation

3. **Summary**
   - Shows at-a-glance trip duration expectations

### Analytics Events
- `course_view` — User sees course display
- `course_block_interaction` — User taps place/meal/cafe
- `course_export` — User shares course (future)

---

## Comparison: Before vs After

### BEFORE (Current)
```
🌟 가볼 곳
  케이블카, 향일암, 자산공원

🍽️ 먹을 곳
  음식점들...

☕ 쉬어갈 곳
  카페들...
```

**User questions:**
- 이 3개를 다 가야 하나?
- 언제 먹어?
- 얼마나 걸려?

### AFTER (Journey Composer V0)
```
📋 여행 코스 구성 (180분)
  📍 케이블카 (40분)
  ↓ 이동 (10-30분)
  📍 향일암 (30분)
  🍽️ 점심 (60분)
  ☕ 카페 (30분)
```

**User answers:**
- ✅ 이 2개가 딱 맞음 (반나절용)
- ✅ 두 번째 장소 후에 점심
- ✅ 총 140-180분이면 끝남

---

## Browser Testing Checklist

Before production deployment, verify:

- [ ] Chrome Mobile (375px)
- [ ] Safari Mobile (375px)
- [ ] Android WebView
- [ ] Firefox Mobile (375px)
- [ ] Landscape orientation (480px width)
- [ ] Touch interactions responsive
- [ ] Text readable (font size ≥ 14px)
- [ ] Colors accessible (WCAG AA contrast)
- [ ] No layout shifts on course load
- [ ] Icons render correctly
- [ ] Warnings visible and clear

---

## Performance Metrics

**Target Metrics for Course Display:**
- Course component render time: < 50ms
- Course blocks animation: 60fps
- Total page load with course: < 3s (mobile 4G)

---

## Localization (Korean Only, V0)

Terms used:
- 여행 코스 구성 (journey course composition)
- 체류 (stay/dwell)
- 이동 (movement/transition)
- 점심 (lunch)
- 카페 휴식 (cafe break)
- 여유 있음 (comfortable)
- 딱 맞음 (just right/tight fit)

For future i18n, extract to i18n/ko.json

---

**UI Status:** ✅ Component implemented and styled  
**Ready for mobile testing:** ✅ Yes  
**Status:** ⏸️ Paused before production deployment
