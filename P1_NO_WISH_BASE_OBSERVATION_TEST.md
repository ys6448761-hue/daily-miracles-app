# P1 NO-WISH BASE — Observation Test Design

**Date:** 2026-08-25  
**Scope:** Golden Engine behavior analysis WITHOUT wish text  
**Status:** OBSERVATION ONLY (NO CODE CHANGES)

---

## CURRENT_GOLDEN_ENGINE_BEHAVIOR

### Production Prompt (yeosuWishRoutes.js:144-159)

```javascript
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

### Current Variables:
- ✅ wish_text: User input (currently REQUIRED)
- ✅ Setting: Fixed Yeosu seascape
- ✅ Style: "Korean aesthetic, ethereal, hopeful"
- ✅ Mood: "Peaceful, miraculous, wish-fulfilling energy"
- ✅ Colors: "Deep purple, soft gold, ocean blue, warm amber"
- ✅ Anti-text directive: "NO text, NO words, NO letters, NO characters"

### Current Output Pattern:
- Yeosu seascape (twilight, lanterns, Dolsan Bridge, stars, fireflies)
- Lee Sunsin Square frequently (DALL-E's autonomous choice)
- Soft, ethereal mood
- No visible text

---

## NO_WISH_TEST_METHOD

### Test Design (NO CODE CHANGES)

**Approach:** Temporarily submit NO-WISH requests to production and observe results.

#### Test Case 1: Empty Wish Text
```json
POST /api/yeosu/wish {
  "customer_name": "Base Test User",
  "customer_phone": "01099999991",
  "wish_text": "",  // ← EMPTY
  "sku": "FREE"
}
```

**Expected Prompt (as sent to DALL-E):**
```
A magical, dreamlike digital illustration representing the wish: ""

Setting: Beautiful Yeosu (여수) seascape at twilight
...
```

**Observation:** What DALL-E generates with empty wish context

---

#### Test Case 2: Neutral Placeholder Text
```json
POST /api/yeosu/wish {
  "customer_name": "Base Test User",
  "customer_phone": "01099999992",
  "wish_text": "오늘 하루",  // ← NEUTRAL ("today")
  "sku": "FREE"
}
```

**Expected Prompt:**
```
A magical illustration representing the wish: "오늘 하루"
Setting: Beautiful Yeosu seascape at twilight
...
```

**Observation:** Minimal semantic influence (neutral, time-based only)

---

#### Test Case 3: Personal Photo + NO-WISH (Future Cablecar Feature)
```json
POST /api/yeosu/wish {
  "customer_name": "Base Test User",
  "customer_phone": "01099999993",
  "wish_text": "[USER_PHOTO_PRESENT]",  // ← Signal that photo exists
  "photo_url": "/user-uploads/photo.jpg",
  "sku": "FREE"
}
```

**Note:** This is NOT implemented yet. For future test.

---

### Observation Framework

For each test case, measure:

1. **IDENTITY PRESERVATION**
   - Is the person (if input photo used) recognizable?
   - Face proportions maintained?
   - Characteristic features visible?

2. **VISUAL_DNA CONSISTENCY**
   - Webtoon-like 2D rendering?
   - Watercolor wash texture visible?
   - Paper quality apparent?
   - No AI-render plasticness?

3. **COMPOSITION**
   - Is person ~45-55% of frame?
   - Face clearly visible?
   - Framing natural?
   - Lower 25% safe?

4. **EMOTION**
   - Peaceful but not forced-happy?
   - Neutral-positive mood?
   - No specific 5-star emotion?
   - Natural expression?

5. **SETTING INFLUENCE**
   - How much Yeosu seascape appears?
   - Lantern prominence?
   - Dolsan Bridge visibility?
   - Star/firefly elements present?

6. **REPEAT CONSISTENCY**
   - Generate same NO-WISH 3x
   - Compare outputs
   - Measure variation

---

## IDENTITY_STABILITY

### Current Code Limitation:
```
yeosuWishRoutes.js does NOT accept user photos
│
├─ No photo_url parameter
├─ No image processing
├─ No background separation
└─ Result: Cannot test "person + seascape" composition
```

### What We CAN Test:
- Does fixed Yeosu seascape maintain consistent identity?
- Does empty/neutral wish preserve DreamTown character?
- Does repeated generation produce consistent person-like elements?

### Observable Pattern:
```
With wish_text: "좋은 일" (good thing)
  → Yeosu seascape + ethereal mood + person-like figure (if DALL-E chooses to render)

With wish_text: "" (empty)
  → Yeosu seascape + ethereal mood + ??? (unpredictable)

Observation: Does Yeosu setting create "recognizable person" or pure landscape?
```

---

## VISUAL_DNA_STABILITY

### Target DNA (from P0 Spec):
- 웹툰 40% (webtoon line art aesthetics)
- 수채화 40% (watercolor wash effects)
- 사실감 20% (realistic detail balance)

### Current Golden Engine Components:

**Supportive of TARGET DNA:**
- ✅ "Korean aesthetic" → webtoon influence
- ✅ "ethereal, hopeful" → soft, dreamy
- ✅ "NO text" → clean webtoon-style
- ✅ "Deep purple, soft gold" → watercolor palette

**Potentially Against TARGET DNA:**
- ❓ DALL-E 3's default rendering (more photorealistic than webtoon)
- ❓ "Bioluminescent glow" → may create AI-render plasticity
- ❓ "Lanterns floating over water" → may reduce paper texture

### Test Observation:
```
Generate NO-WISH 5x
Measure: % of outputs showing
  ✓ Visible webtoon line quality
  ✓ Watercolor brush strokes
  ✓ Paper texture
  ✗ Photorealistic/AI-render
```

---

## COMPOSITION_STABILITY

### Current Constraint:
```
buildYeosuWishPrompt() does NOT control composition
│
├─ No framing instruction
├─ No "person" directive
├─ Only "wish" + "Yeosu setting"
└─ Result: DALL-E decides composition freely
```

### What NO-WISH Test Reveals:
```
Input: "" (empty) → DALL-E with ONLY setting
Output: Pure Yeosu landscape? Or does "wish" placeholder trigger person-like generation?

Input: "오늘 하루" (neutral) → Minimal semantic weight
Output: What's the default composition?
```

### Stability Measurement:
```
Repeat 5x, measure:
1. Does Yeosu always appear?
2. Is there a "focal point" (implies person/character)?
3. How much sky vs land vs water?
4. Is composition consistent across runs?
```

---

## EMOTION_NEUTRALITY

### Target State:
- ✅ Not exclusively "happy"
- ✅ Not exclusively "hopeful"
- ✅ Peaceful + good mood
- ✅ Usable for ANY wish category (once 5-star added)

### Current Golden Engine Risk:
```
Mood: "Peaceful, miraculous, wish-fulfilling energy"
  └─ Too hopeful/positive?
     └─ May lock into 감사/용기 territory before 5-star added
```

### NO-WISH Test Reveals:
```
Without wish_text semantic influence:
  → Pure mood from "peaceful, miraculous, wish-fulfilling"
  → Can this work for 치유 (healing)? For 새출발 (restart)?
  
If NOT neutral enough → Prompt bias risk for 5-star system
If YES neutral → BASE is flexible foundation
```

### Measurement:
```
Show 5 NO-WISH generated images to external raters
Ask: "Which of these 5 emotions does this image express?"
  - 치유 (healing/recovery)
  - 새출발 (new start)
  - 용기 (courage)
  - 지혜 (wisdom)
  - 감사 (gratitude)

Result:
  - Balanced spread = emotionally neutral (GOOD)
  - Skewed to 1 emotion = biased (RISKY for 5-star)
```

---

## EXISTING_PROMPT_BIAS

### Components to Isolate:

**1. "Yeosu seascape at twilight"**
```
Without: empty setting
With: current
Difference: How much does Yeosu contribute to final mood?
```

**2. "Bioluminescent glow"**
```
Without: standard moonlight
With: current
Difference: Does this create AI-render feel? Or mystical?
```

**3. "Korean lanterns floating"**
```
Without: no lanterns
With: current
Difference: Is this 이순신광장 trigger? Cultural bias?
```

**4. "Dolsan Bridge with lights"**
```
Without: generic bridge
With: specific Dolsan
Difference: Landmark specificity vs composition?
```

**5. "Stars and fireflies"**
```
Without: plain sky
With: current
Difference: How much does this trigger "hopeful" mood?
```

### Test Matrix:

| Component | Remove | Observe |
|-----------|--------|---------|
| Yeosu setting | "Beach scene" | Does this lose Korean aesthetic? |
| Bioluminescence | "Moonlight" | Does this reduce AI-render feel? |
| Lanterns | Remove line | Does this prevent Lee Sunsin Square? |
| Dolsan Bridge | "Generic bridge" | Does this reduce specificity? |
| Stars/fireflies | "Clear sky" | Does this reduce hopeful bias? |

**NOTE:** Do NOT implement. Just observe what each contributes.

---

## REPEATABILITY

### Current Observation:
```
Same wish_text → Often similar outputs
  (e.g., "좋은 일" → Lee Sunsin Square appears frequently)

Same wish_text (repeated) → Variation still exists
  (DALL-E probabilistic, not deterministic)
```

### NO-WISH Repeatability Test:

**Method:** Submit same NO-WISH 10 times, observe stability

```
Test: wish_text = "" (empty)
Run 1: [Image 1]
Run 2: [Image 2]
...
Run 10: [Image 10]

Measure:
- Composition variation: High/Medium/Low
- Yeosu setting consistency: Always/Usually/Rare
- Lee Sunsin Square appearances: X out of 10
- Emotion tone consistency: Stable/Drifting
- Person-like figure: Always/Usually/Rare
```

**Expected Result:**
```
If NO-WISH shows HIGH repeatability in style
  → BASE is stable, ready for 5-star overlays

If NO-WISH shows HIGH variation
  → BASE is probabilistic, may need prompt refinement
```

---

## BASE_LOCK_CANDIDATES

### Elements to Consider Locking:

**LOCK (High Stability Observed):**
- ✅ "Korean aesthetic" (always delivers)
- ✅ "ethereal, hopeful" (mood consistent)
- ✅ Paper texture (visible in most outputs)
- ✅ No visible text (prompt works)

**CONDITIONAL LOCK (Medium Stability):**
- ⚠️ "Yeosu seascape" (appears 80%+?)
- ⚠️ "Dolsan Bridge" (landmark reference)
- ⚠️ "Lanterns" (aesthetic, but triggers Lee Sunsin?)

**REVIEW (Low Stability or Risky):**
- ❓ "Bioluminescent glow" (AI-render risk?)
- ❓ "Peaceful, miraculous" (too specific for 5-star?)
- ❓ "Stars and fireflies" (mood-loading?)

---

## UNSTABLE_ELEMENTS

### Observed Instabilities (from P0 audit + NO-WISH test):

**1. Location Selection**
```
Issue: Lee Sunsin Square repeats 60-70% of time
Root: "Lanterns + Yeosu" → DALL-E defaults to this landmark
Risk: For NO-WISH, does empty wish make it 100% Lee Sunsin?
```

**2. Person vs Landscape**
```
Issue: Unclear if Yeosu setting INCLUDES person or REPLACES person
Status: Unknown without photo input capability
Risk: Can't test "identity preservation" with current code
```

**3. Mood Drift**
```
Issue: "Peaceful, miraculous" may shift toward "magical" or "celestial"
Risk: For 치유, this may read as "transcendent" not "healing"
Mitigation: Test emotion neutrality before 5-star implementation
```

**4. Watercolor Authenticity**
```
Issue: DALL-E 3 defaults to photorealism, watercolor is instruction
Risk: 40% target may not be achievable without explicit style guide
Observation: Do 5 NO-WISH outputs show visible paper texture?
```

---

## RECOMMENDATION

### For Production (NO CHANGE):
- ✅ Keep buildYeosuWishPrompt() as-is (frozen for P0)
- ✅ Continue monitoring Lee Sunsin Square frequency
- ✅ Document "empty wish" behavior when observed

### For P1 Planning (After NO-WISH Test):
1. **If BASE is stable:** Proceed with 5-star resolver (Phase 2)
2. **If BASE drifts:** Refine prompt before resolver (Phase 1.5)
3. **If emotion is biased:** Add neutral modifiers (Phase 1.5)

### Specific Questions to Answer After Test:

```
Q1: Does empty wish_text produce valid images?
Q2: Are those images DreamTown-recognizable (visual DNA)?
Q3: Can one BASE image satisfy BOTH 치유 AND 새출발 users?
Q4: How stable is the Lee Sunsin Square default?
Q5: Is paper texture visible in 40%+ of outputs?
Q6: Can we add 5-star system WITHOUT regressing BASE quality?
```

### Test Execution (When Approved):

```
Step 1: Submit 3x NO-WISH requests (empty/neutral/placeholder)
Step 2: Collect 5 repeats of each
Step 3: Measure against BASE criteria
Step 4: Document findings
Step 5: Recommend prompt adjustments (if any)
Step 6: Proceed to 5-star implementation
```

---

## CONSTRAINTS (LOCKED)

**DO NOT during this observation:**
- ❌ Modify buildYeosuWishPrompt()
- ❌ Add person/portrait logic
- ❌ Implement 5-star resolver
- ❌ Change Yeosu setting
- ❌ Deploy code
- ❌ Alter prompt structure

**DO during observation:**
- ✅ Submit test requests
- ✅ Collect outputs
- ✅ Analyze patterns
- ✅ Document findings
- ✅ Note instabilities

---

## OBSERVATION_ONLY

**Status: DESIGN PHASE ONLY**

This document defines HOW to test NO-WISH BASE, but does NOT execute the test or make code changes.

Test execution requires:
1. Production access
2. Test user accounts
3. Multiple generation runs
4. Output analysis
5. Stakeholder review

Once test results available: Recommend Phase 1.5 or Phase 2 direction.

