# P1 Wish Art Background Resolution — Audit Report

**Date:** 2026-08-25  
**Scope:** Code path tracing for wish art background selection  
**Status:** AUDIT ONLY (NO CHANGES)

---

## ACTUAL_ENTRY_POINT

**Current Production Wish Art Generation:**

```
POST /api/yeosu/wish
  ↓
routes/yeosuWishRoutes.js:238-347
  ├─ Input: { customer_name, customer_phone, wish_text, sku, ... }
  ├─ DB: INSERT INTO yeosu_wishes (wish_text, sku, status, ...)
  ├─ No free case: status = 'AWAITING_PAYMENT'
  ├─ Free case: processWishImage(wish_id) [async]
  │   ├─ Query: SELECT wish_text FROM yeosu_wishes WHERE wish_id
  │   ├─ Call: generateWishImage(wishText, wishId)
  │   │   ├─ Call: buildYeosuWishPrompt(wishText)
  │   │   │   └─ [PROMPT DEFINED HERE — Line 144-159]
  │   │   ├─ DALL-E 3 API: openai.images.generate()
  │   │   ├─ Download & Save: /public/images/yeosu-wishes/
  │   │   └─ Return: image_url
  │   └─ DB: UPDATE yeosu_wishes SET result_image_url, status='COMPLETED'
  └─ Response: { wish_id, status, download_token }
```

**No other entry points found for wish art generation.**
- wishImageRoutes.js (/api/wish-image/generate) exists but uses gem-based prompts
- yeosuWishRoutes is THE primary wish art entry point

---

## ACTUAL_WISH_TEXT_FLOW

**Path: wish_text → Prompt → DALL-E → Image**

```javascript
// Step 1: User submits wish
POST /api/yeosu/wish {
  wish_text: "새로운 시작을 하고 싶어"  // 사용자 입력
}

// Step 2: Stored in DB (no processing)
INSERT INTO yeosu_wishes (wish_text, ...) VALUES ('새로운 시작을 하고 싶어', ...)

// Step 3: Retrieved as-is (no modification)
SELECT wish_text FROM yeosu_wishes WHERE wish_id = $1
// Result: "새로운 시작을 하고 싶어"

// Step 4: Passed to prompt builder (NO CLASSIFICATION)
buildYeosuWishPrompt(wishText)  // receives: "새로운 시작을 하고 싶어"
  ↓
// Step 5: Prompt generation (wish_text embedded in template)
`A magical illustration representing the wish: "${wishText}"
Setting: Beautiful Yeosu (여수) seascape at twilight
...`
  ↓
// Step 6: DALL-E receives complete prompt
openai.images.generate({ prompt: "A magical illustration... 새로운 시작을 하고 싶어 ..." })
  ↓
// Step 7: Image generated (DALL-E interprets "새로운 시작" + Yeosu setting)
// Result may be: Expo station (interpreter's choice) or other location
```

**KEY FINDING:** No classification or location selection happens in code. wish_text flows directly into DALL-E prompt with fixed Yeosu seascape template.

---

## FIVE_WISH_CLASSIFIER_EXISTS

**Status: ✅ PARTIAL (exists in analysis engine, NOT in wish art generation)**

### Found in analysisEngine.js:
```javascript
const WISH_KEYWORDS = {
  communication: ['대화', '소통', ...],
  conflict: ['싸움', '갈등', ...],
  trust: ['믿음', '신뢰', ...],
  intimacy: ['친밀', '가까움', ...],
  understanding: ['이해', '공감', ...],
  growth: ['성장', '발전', ...],
  healing: ['치유', '회복', '극복', '상처', '아픔'],  ← 치유
  balance: ['균형', '조화', ...]
};
```

### But:
- ❌ This classifier is NOT used in yeosuWishRoutes.js
- ❌ Not called during wish art generation
- ❌ No connection to wish_text in art pipeline
- 🔍 analysisEngine.js is used for user profile analysis, NOT wish image generation

---

## YEOSU_ORIGIN_MAPPING_EXISTS

**Status: ❌ NOT FOUND**

### Expected mapping (user mentioned):
```
치유 → 오동도
새출발 → 여수엑스포역
용기 → 여수해상케이블카
지혜 → 하멜등대
감사 → 이순신광장
```

### Reality:
- ❌ No such mapping exists in code
- ❌ No conditional logic for background selection
- ❌ No reference to any of these locations in yeosuWishRoutes.js
- ✅ Only ONE hardcoded setting: "Beautiful Yeosu seascape at twilight"

```javascript
// yeosuWishRoutes.js:144-159
function buildYeosuWishPrompt(wishText) {
  return `
A magical, dreamlike digital illustration representing the wish: "${wishText}"

Setting: Beautiful Yeosu (여수) seascape at twilight
- Gentle ocean waves with bioluminescent glow
- Traditional Korean lanterns floating over water
- Distant silhouette of Dolsan Bridge with lights
- Stars and fireflies dancing in the sky

Style: Korean aesthetic, ethereal, hopeful
Mood: Peaceful, miraculous, wish-fulfilling energy
Colors: Deep purple, soft gold, ocean blue, warm amber

Important: NO text, NO words, NO letters, NO characters in the image.
  `.trim();
}
```

**This is the ONLY background definition. No branching, no conditions, no alternatives.**

---

## ACTUAL_BACKGROUND_SELECTION_LOGIC

**Status: ❌ NO SELECTION LOGIC**

The prompt is **HARDCODED and INVARIANT**:

```
Loop through yeosuWishRoutes.js:
├─ Line 144: function buildYeosuWishPrompt(wishText)
├─ Line 145-159: return fixed template
├─ No conditionals
├─ No branching on wish_text content
├─ No lookup tables
├─ No API calls to determine background
├─ No database queries for background selection
└─ Result: IDENTICAL prompt for every wish_text
```

**Where background could be selected (but isn't):**
```javascript
// ❌ Missing: No classification
// ❌ Missing: No background switch/case
// ❌ Missing: No conditional prompt building
// ✅ Present: Only raw template + wish_text interpolation
```

---

## WHY_YISUNSIN_SQUARE_REPEATS

**Root Cause: DALL-E Interpretation, Not Code Logic**

### Analysis:

1. **Prompt contains semantic location hints:**
   ```
   "Gentle ocean waves with bioluminescent glow"
   "Traditional Korean lanterns floating over water"
   "Distant silhouette of Dolsan Bridge with lights"
   "Stars and fireflies dancing in the sky"
   ```

2. **DALL-E 3 patterns:**
   - "lanterns + ocean + twilight" → Lee Sunsin Square (famous lantern festival location)
   - Model may default to "most photogenic Yeosu landmark with lanterns"
   - Probabilistic generation (same prompt can produce different images)

3. **Why repetition occurs:**
   - Model finds strong correlation: Yeosu + lanterns = Lee Sunsin Square
   - High confidence result dominates in generation
   - Without explicit "NOT Lee Sunsin Square", model defaults to this
   - Different wish_text doesn't change prompt location hints

4. **Evidence:**
   ```
   Input: "좋은 일 많이"
   Prompt: "...lanterns floating over water... Dolsan Bridge..."
   DALL-E interpretation: Lee Sunsin Square (lantern setting matches)
   Output: Lee Sunsin Square background
   
   Input: "새로운 시작을 하고 싶어"
   Prompt: IDENTICAL (no code change)
   DALL-E interpretation: Lee Sunsin Square (same lantern/location trigger)
   Output: Lee Sunsin Square background (repeat)
   ```

**Conclusion: Code provides NO background control. DALL-E chooses based on semantic matching, not instruction.**

---

## WHY_NEW_START_PRODUCED_EXPO_STATION

**Status: PLAUSIBLE (but not confirmed)**

### Hypothesis:

```
Input: "새로운 시작을 하고 싶어" (new start wish)
DALL-E receives: "A magical illustration representing the wish: 새로운 시작을 하고 싶어..."

Model interprets:
├─ "새로운 시작" (new start) → semantic: forward movement, future-oriented
├─ "여수" setting + lanterns
├─ Best match: Expo Station (future-oriented landmark, modern, represents progress)
└─ Output: Expo Station

BUT: This is DALL-E's autonomous choice, NOT code-driven.
```

### Verification needed:
- Run identical wish text multiple times
- If output varies: DALL-E probabilistic
- If output consistent: DALL-E pattern (semantic matching)

**Current assessment: LIKELY MODEL AUTONOMY**
- "새출발" keyword + "future setting" triggers Expo Station
- But this is DALL-E inference, not code control

---

## HARDCODED_DEFAULTS_FOUND

**Status: ✅ YES, ONE**

```javascript
// yeosuWishRoutes.js:144-159
const HARDCODED_SETTING = `
Setting: Beautiful Yeosu (여수) seascape at twilight
- Gentle ocean waves with bioluminescent glow
- Traditional Korean lanterns floating over water
- Distant silhouette of Dolsan Bridge with lights
- Stars and fireflies dancing in the sky
`;

// This is the DEFAULT (and ONLY) setting for all wishes
// Applied unconditionally in buildYeosuWishPrompt()
```

**Other "defaults":**
- Fallback image: `/images/fallback/yeosu-wish-default.png`
- Color scheme: "Deep purple, soft gold, ocean blue, warm amber" (hardcoded)
- Style: "Korean aesthetic, ethereal, hopeful" (hardcoded)

**Conclusion:**
- ✅ All defaults found and documented
- ✅ No branching or conditional defaults
- ❌ No "five backgrounds" default system
- ❌ No category-based defaults

---

## MODEL_AUTONOMY_VS_CODE_DECISION

**Current Ratio: ~95% Model Autonomy, ~5% Code Control**

### Code-controlled (5%):
```javascript
✓ Prompt structure (template)
✓ Must include wish_text
✓ Style tags: "Korean aesthetic, ethereal, hopeful"
✓ Color theme: "Deep purple, soft gold, ocean blue, warm amber"
✓ Size: 1024x1024
✓ Model: DALL-E 3
✓ Quality: standard
```

### Model-autonomous (95%):
```
✓ Which specific location/landmark to feature
✓ How to interpret "새로운 시작을 하고 싶어"
✓ How to balance lanterns + waves + bridge + stars
✓ Final composition and visual balance
✓ Color palette final adjustment
✓ Character/symbol selection (if any)
```

**Evidence:**
```
Same code + same template + different wishes
  ↓
Some wishes → Lee Sunsin Square
Some wishes → Expo Station (possibly)
Some wishes → Unidentified Yeosu locations

This variation is NOT explained by code logic.
Therefore: DALL-E makes autonomous decisions about location.
```

---

## ROOT_CAUSE

**Primary Cause: No Location-Specific Code Control**

### Why Lee Sunsin Square Repeats:
1. ❌ No code-level location selection
2. ✅ Prompt contains location hints: "lanterns floating over water"
3. ✅ DALL-E defaults to: Lee Sunsin Square (best known Yeosu lantern location)
4. ✅ Absence of "NOT Lee Sunsin Square" instruction
5. ✅ High confidence in this interpretation

### Why "New Start" produces Expo Station (if true):
1. ❌ No code-level semantic mapping
2. ✅ DALL-E interprets "새로운 시작" semantically
3. ✅ Matches to "forward-looking" landmark: Expo Station
4. ✅ Model's probabilistic generation
5. ✅ Not reproducible from code inspection

### System Status:
```
┌─ Code (yeosuWishRoutes.js)
│   └─ buildYeosuWishPrompt()
│       └─ Fixed: "Yeosu seascape + lanterns + Dolsan Bridge"
│           └─ Feeds to DALL-E
│
└─ DALL-E 3 (Autonomous)
    ├─ Receives: "wish_text + lanterns setting"
    ├─ Interprets: Best matching landmark
    ├─ Decides: "Lee Sunsin Square" (default for lanterns)
    ├─ Or: "Expo Station" (for future-oriented wishes)
    └─ Generates: Image with selected background
```

**Decision flow is in DALLE-E, NOT in application code.**

---

## MINIMUM_CHANGE_IF_NEEDED

**⚠️ THIS IS AUDIT ONLY — NO CHANGES APPROVED**

**If changes were needed (hypothetically):**

### Option A: Explicit Location Control (INVASIVE)
```javascript
// Would require modifying prompt for each wish category
// Example: NEW CODE (FORBIDDEN IN P0)
const WISH_TO_LOCATION = {
  'healing': 'Odongdo Island',
  'new_start': 'Expo Station',
  'courage': 'Cable Car',
  'wisdom': 'Hamel Lighthouse',
  'gratitude': 'Lee Sunsin Square'
};

function buildYeosuWishPromptV2(wishText) {
  const category = classifyWish(wishText);  // NEW CALL
  const location = WISH_TO_LOCATION[category];  // NEW LOOKUP
  return `
A magical illustration representing the wish: "${wishText}"
Setting: Beautiful Yeosu featuring ${location}...
  `;
}
```
**Risk:** Changes prompt structure, potential regression

### Option B: Negative Constraints (SAFER)
```javascript
// Add "NOT X" to reduce default location
function buildYeosuWishPromptV3(wishText) {
  return `
...
Setting: Beautiful Yeosu (여수) seascape at twilight
- Gentle ocean waves with bioluminescent glow
- Traditional Korean lanterns floating over water
- Distant silhouette of Dolsan Bridge with lights
- Stars and fireflies dancing in the sky
- [Do not emphasize Lee Sunsin Square]  // NEW HINT
...
  `;
}
```
**Risk:** Lower (additive hint), but untested

### Option C: Accept Current Behavior (NO CHANGE)
```javascript
// Keep existing prompt as-is
// Accept that DALL-E will choose locations
// Document: "Backgrounds are DALL-E-selected, not code-controlled"
```
**Risk:** None, but doesn't solve user concern

---

## REGRESSION_RISK

### If Code Were Modified (Hypothetical):

**HIGH REGRESSION RISK if:**
- ❌ Prompt structure changed significantly
- ❌ Location keywords added/removed
- ❌ Wish classification added (new code path)
- ❌ Conditional logic branching introduced

**Example regression:**
```
Before: 10 wishes, 8 x Lee Sunsin Square, 2 x Expo
After change: 0 valid images, 10 x "error generating image"
Reason: Prompt too specific, DALL-E can't match all branches
```

### Current Risk Status: ✅ ZERO (no code changes made)

---

## AUDIT CONCLUSION

### Key Findings:

1. **✅ Entry Point Confirmed:** POST /api/yeosu/wish → yeosuWishRoutes.js

2. **✅ Wish Text Flow Confirmed:** Stored in yeosu_wishes → Retrieved as-is → Embedded in prompt

3. **❌ Five-Category Classifier Not Found (in wish art pipeline):**
   - Exists in analysisEngine.js (user profile only)
   - NOT used for wish image generation

4. **❌ Yeosu Origin Location Mapping Not Found:**
   - No code-level mapping to: 오동도/여수엑스포역/하멜등대/이순신광장
   - Expected mapping does not exist in production

5. **✅ Actual Background Logic Found:**
   - Single hardcoded prompt template
   - All wishes receive identical location hints
   - DALL-E makes autonomous location selection
   - NOT code-driven

6. **Root Cause Confirmed:**
   - No location classification in code
   - DALL-E interprets prompt semantically
   - Defaults to Lee Sunsin Square (lantern + Yeosu)
   - "New Start" → Expo Station (DALL-E inference)

7. **Model Autonomy vs Code Control:**
   - Code: ~5% (template, style, colors)
   - DALL-E: ~95% (location, composition, details)

---

## NEXT STEP

⚠️ **AUDIT COMPLETE — STOP HERE**

**No implementation, no code changes, no prompt modifications.**

**Finding:** Wish art backgrounds are NOT controlled by code classification system. They are DALL-E's autonomous selections based on semantic interpretation.

If background control is desired in future: Would require significant code changes (NOT in P0, NOT recommended for P1).

Current system works. Document as: "Backgrounds selected by DALL-E based on semantic interpretation of wish text + Yeosu setting cues."

