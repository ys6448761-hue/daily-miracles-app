# Sora Video Master Playbook

> **SSOT (Single Source of Truth)** for all Sora video generation
> Last updated: 2025-01-30

---

## VIDEO SIZE & ASPECT RATIO (Must Specify)

### Platform-Specific Sizes

| Platform | Aspect Ratio | Resolution | Use Case |
|----------|--------------|------------|----------|
| **Instagram Reels** | 9:16 (vertical) | 1080x1920 | 30초 홍보영상 기본 |
| **YouTube Shorts** | 9:16 (vertical) | 1080x1920 | 숏폼 콘텐츠 |
| **Instagram Feed** | 1:1 (square) | 1080x1080 | 피드 게시물 |
| **YouTube Standard** | 16:9 (horizontal) | 1920x1080 | 긴 영상 |
| **TikTok** | 9:16 (vertical) | 1080x1920 | 틱톡 업로드 |

### Default for 30-Second Promo Videos

```
ALWAYS specify in prompt:
- Aspect ratio: 9:16 (vertical/portrait)
- Resolution: 1080x1920
- Duration: 30 seconds (or specific unit duration)
```

### Prompt Example for Size

```
[Scene description]

Technical specs:
- Aspect ratio: 9:16 (vertical)
- Resolution: 1080x1920
- Duration: 8 seconds
```

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

TECHNICAL SPECS:
- Aspect ratio: 9:16 (vertical)
- Resolution: 1080x1920
- Duration: [X seconds]

CRITICAL CONSTRAINTS:
- NO subtitles, NO captions, NO closed-captions
- NO readable on-screen text (including UI)
- Phone screens show ONLY abstract unreadable glyphs
- Mascot: flat 2D hand-drawn watercolor style (NOT 3D, NOT Pixar, NOT plush)
- Leave clean negative space for logo overlay (do not bake logo)

Style: [cinematic/warm/soft lighting/etc.]
```

---

## COMMON MISTAKES TO AVOID

| Mistake | Correct Approach |
|---------|------------------|
| **Wrong aspect ratio** | Always specify "9:16 vertical" for Reels/Shorts |
| **Size not specified** | Include "1080x1920" resolution in prompt |
| [alarm ringing] text appears | Remove bracketed descriptions from prompt |
| 3D mascot generated | Explicitly state "flat 2D hand-drawn watercolor (NOT 3D, NOT Pixar)" |
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

### Technical Specs
- [ ] Aspect ratio specified? (9:16 for Reels/Shorts)
- [ ] Resolution specified? (1080x1920)
- [ ] Duration specified? (per unit or total)

### Text & UI
- [ ] "NO subtitles/captions" explicitly stated?
- [ ] "NO readable text" explicitly stated?
- [ ] Phone UI described as "abstract glyphs"?
- [ ] No bracketed sound descriptions like [alarm ringing]?

### Mascot Style
- [ ] Mascot described as "flat 2D hand-drawn watercolor"?
- [ ] Anti-3D keywords included (NOT 3D, NOT Pixar, NOT plush)?

### Logo
- [ ] Logo space instruction for Unit 4?
- [ ] "Leave clean negative space" specified?

---

## REVISION HISTORY

| Date | Change | Author |
|------|--------|--------|
| 2025-01-30 | Initial playbook creation | Code |
| 2025-01-30 | Added video size & aspect ratio rules (9:16, 1080x1920) | Code |

---

*This playbook is the authoritative source for Sora video generation rules.*
*Any deviation requires explicit approval and playbook update.*
