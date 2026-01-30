# Sora Video Master Playbook

> **SSOT (Single Source of Truth)** for all Sora video generation
> Last updated: 2025-01-30

---

## MANDATORY RULES (Must Include in Every Prompt)

### 1. NO TEXT ON SCREEN

```
CRITICAL CONSTRAINTS:
- NO subtitles
- NO captions
- NO closed-captions
- NO readable on-screen text of any kind
- NO text overlays
- NO title cards with readable text
```

### 2. PHONE UI RULES

```
If phone screen appears:
- Use ONLY abstract, unreadable glyphs
- NO readable UI elements
- NO recognizable app interfaces
- Blur or abstract any text that might appear
```

### 3. MASCOT STYLE (FIXED)

```
Mascot style (NEVER deviate):
- flat 2D illustration
- hand-drawn watercolor aesthetic
- soft, warm colors
- NOT 3D
- NOT Pixar/Disney style
- NOT plush/stuffed toy
- NOT realistic
- NOT clay/plasticine
```

### 4. LOGO HANDLING

```
Logo rules:
- NEVER bake logo into video
- Leave clean negative space for logo overlay (post-production)
- Unit 4 specifically: "leave clean negative space in corner for logo overlay"
- Logo will be added in post-editing
```

---

## PROMPT TEMPLATE

```
[Scene description here]

CRITICAL CONSTRAINTS:
- NO subtitles, NO captions, NO closed-captions
- NO readable on-screen text (including UI)
- Phone screens show ONLY abstract unreadable glyphs
- Mascot: flat 2D hand-drawn watercolor style (NOT 3D, NOT Pixar, NOT plush)
- Leave clean negative space for logo overlay (do not bake logo)

Style: [cinematic/warm/soft lighting/etc.]
Duration: [X seconds]
```

---

## COMMON MISTAKES TO AVOID

| Mistake | Correct Approach |
|---------|------------------|
| [alarm ringing] text appears | Remove bracketed descriptions from prompt |
| 3D mascot generated | Explicitly state "flat 2D hand-drawn watercolor" |
| Readable phone UI | Specify "abstract unreadable glyphs only" |
| Logo burned into video | "Leave clean negative space for logo overlay" |
| Subtitles appear | Add "NO subtitles/captions" to constraints |

---

## UNIT-SPECIFIC NOTES

### Unit 1-2 (Problem/Pain)
- Focus on emotion, not text
- Any alarm/notification sounds should be implied visually, not with text

### Unit 3 (Solution Introduction)
- Mascot appearance must be 2D watercolor
- Phone screen abstractions only

### Unit 4 (Resolution/CTA)
- **Must** leave negative space for logo
- No ending text cards
- Emotional closure through visuals only

---

## QUALITY CHECKLIST

Before submitting Sora prompt:

- [ ] "NO subtitles/captions" explicitly stated?
- [ ] "NO readable text" explicitly stated?
- [ ] Phone UI described as "abstract glyphs"?
- [ ] Mascot described as "flat 2D hand-drawn watercolor"?
- [ ] Anti-3D keywords included (NOT 3D, NOT Pixar)?
- [ ] Logo space instruction for Unit 4?
- [ ] No bracketed sound descriptions like [alarm ringing]?

---

## REVISION HISTORY

| Date | Change | Author |
|------|--------|--------|
| 2025-01-30 | Initial playbook creation | Code |

---

*This playbook is the authoritative source for Sora video generation rules.*
*Any deviation requires explicit approval and playbook update.*
