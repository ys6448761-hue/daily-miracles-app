# SOUL Practitioner Review Package V0.2
## Living Detail Page — Cable Car Golden Place

**Prepared for:** External practitioner review  
**Date:** 2026-10-04  
**Status:** REVIEW_PACKAGE_READY  
**Implementation reference:** `integration/soul-cablecar-port-v0-1` @ `b237386` (SoulCableCarPage @ 0503ed8 lineage)

---

> **To the practitioner:**
> This review has two phases. Please complete Phase A independently before reading Phase B.
> Your unanchored judgment is more valuable than confirming our current taxonomy.

---

## PRODUCT INTENT

### The Central Question

Can this experience become a travel detail page that feels like a friend who knows Yeosu exceptionally well?

That friend doesn't read you a Wikipedia article.  
They know the place. They know what actually matters for your situation.  
They tell you what you need, in the order you need it — and know when to stop talking.

### The Intended Behavior

A traveler searches or asks about a Yeosu place:

```
User question or search
    ↓
Sufficient place / basic trust information
    ↓
Explicit traveler context (when useful)
    ↓
Information relevant to that situation — selected, not dumped
    ↓
SOUL gives contextual judgment
    ↓
Place connects to practical journey
    ↓
Deeper explanation available when useful
    ↓
Verified local / human / traveler experience may enrich the answer
    ↓
Appropriate next action
```

### The Critical Principle

**The page does NOT expose every piece of knowledge it holds.**

SOUL may be prepared with deep knowledge.  
But it should select, suppress, prioritize, and compose only what matters for the current:

- place
- question / traveler intent
- traveler context (has car / traveling with parents / children / sunset timing)
- journey relationship (where else they're going)

**Personalization should make the page clearer, not merely longer.**

---

## PHASE A — BLIND PRODUCT REVIEW

*Complete this phase before looking at any current UI.*

---

### A1. First Viewport

**A traveler searches "여수해상케이블카" and lands on this page.**

What do they need immediately — before scrolling, before typing anything?

What should be present?  
What should be absent?  
What would make them trust this is worth continuing?

---

### A2. SOUL's Proactive Knowledge

**What should SOUL proactively know or tell without being asked?**

Things the traveler would never think to ask but would immediately appreciate:

- About the place itself
- About common traveler situations (first time / return / family / couple)
- About things that often go wrong
- About timing, access, practical flow

What makes these proactive facts feel like inside knowledge rather than generic copy?

---

### A3. Context-Triggered Content

**What should appear ONLY after traveler context is known?**

For example: is there information that belongs on the page for some travelers but not others?

Information that shouldn't appear by default but should surface when context reveals it?

What context signals trigger these changes?

---

### A4. Suppression

**What information should be hidden unless relevant?**

Is there content that would distract or overwhelm most travelers but be critical for some?

When should it appear? When should it never appear?

---

### A5. Context-Adaptive Behavior

**How should the page change when the traveler reveals context?**

For each context signal below, describe:
- What becomes MORE prominent
- What becomes LESS prominent
- What should disappear entirely
- What new information should appear

Context signals to consider:

| Context | Your expectation |
|---|---|
| `has_car = true` | |
| Traveling with parents / elderly | |
| Traveling with children | |
| "일몰을 보고 싶어요" (wants sunset) | |
| Another-place intention (e.g., Odongdo) | |

---

### A6. Place-to-Journey Connection

**How should a place page turn into an actual journey?**

At what point does "I want to visit this place" become "here's how my trip flows"?

What information supports that transition?  
What information gets in the way?

---

### A7. Cost / Time / Parking / Difficulty

**Where should these belong?**

Should they appear by default or on demand?  
Should they always appear in the same format or adapt to context?  
What's the right level of detail for each?

---

### A8. Progressive Disclosure

**What should be progressively revealed rather than shown immediately?**

What is the right trigger — scroll / tap / explicit request / accumulated context?

What would make a traveler want to go deeper?  
What would make them feel overwhelmed?

---

### A9. The "와, 이것까지 알아?" Moment

**At what exact moment should the traveler feel: "Wow, it knows this too?"**

Describe the moment:
- What the traveler was wondering or doing just before
- What SOUL surfaced
- Why it surprised them
- Why it couldn't have come from a generic travel guide

What knowledge would create that feeling for:

- A first-time visitor
- A parent traveling with elderly parents
- Someone with a car who wants to combine two places
- Someone asking about sunset timing

---

### A10. Structure from Scratch

**If you were designing this page from scratch — with no constraints — what structure would you recommend?**

You do not have to match any existing taxonomy.  
You do not have to choose a specific number of modules.

What would be the spine of the page?  
What would be optional?  
What would only appear conditionally?

---

## PHASE B — CURRENT UI REVIEW

*Read this only after completing Phase A independently.*

---

### Current Implementation Overview

The current page (`/soul/cable-car`) is built around these visible experience areas. Each is listed in current render order.

| # | Experience Area | Description |
|---|---|---|
| 1 | Question Composer | Text input for natural language questions. Quick-context chips (자차 / 오동도 / 부모님). |
| 2 | SOUL Message | SOUL's response to the question. Backend-generated. Context-aware. |
| 3 | Place Hero | Place name, subtitle, mood tag, hero image. |
| 4 | Essential Information | Basic trust facts: 탑승 구조 / 소요시간 / 요금 / 운영시간 / 주차. |
| 5 | "나에게 중요한 것" | Personalized note based on traveler context (appears only when context known). |
| 6 | SOUL Section | SOUL's active judgment for the place. "소의한 것 / 알아두면 좋은 것". |
| 7 | Journey | Visual journey flow + SOUL's journey reasoning. |
| 8 | Cost | Quote if a cost calculation exists. |
| 9 | "더 알고 싶을 때" | Expandable disclosure: Crystal Cabin details, Odongdo route, phone. |

**Context-responsive states:**
- Chip: 자차 → JourneyFlow shows car icon; "나에게 중요한 것" shows parking note
- Chip: 오동도 → JourneyFlow shows Odongdo arc; "나에게 중요한 것" shows 5-min walk note; SOUL references Odongdo direction
- Chip: 부모님 → "나에게 중요한 것" shows cabin selection note; SOUL references crystal cabin

**Save / "내 여정에 담기":** present but disabled (소원꿈터 integration deferred).

---

### Phase B Evaluation Matrix

For each experience area, evaluate using:

`KEEP` / `CONNECT` / `MODIFY` / `MOVE` / `MERGE` / `REMOVE` / `ADD` / `UNCERTAIN`

| Experience Area | Verdict | Why? | Which traveler decision does it support? | When should it appear? | Always or conditional? | Context trigger? | Essential or optional? | Generic or distinctly SOUL? |
|---|---|---|---|---|---|---|---|---|
| Question Composer | | | | | | | | |
| SOUL Message | | | | | | | | |
| Place Hero | | | | | | | | |
| Essential Information | | | | | | | | |
| "나에게 중요한 것" | | | | | | | | |
| SOUL Section (judgment) | | | | | | | | |
| Journey | | | | | | | | |
| Cost | | | | | | | | |
| "더 알고 싶을 때" | | | | | | | | |
| Save / 내 여정에 담기 | | | | | | | | |

---

### Context-Adaptive Review (Phase B)

The current implementation changes content text when context chips are selected.  
**But page composition — the order, presence, and structure of modules — does not currently change.**

The intended behavior is deeper:

```
SHOW — surface when context makes it relevant
HIDE — suppress when context makes it irrelevant
PRIORITIZE — move to top when context makes it critical
REORDER — shift position based on traveler situation
COMPOSE — assemble a different answer from available knowledge
```

**Practitioner question:**

> If the traveler says: "차가 있어요. 오동도도 갈 거예요."  
> What should become MORE prominent?  
> What should become LESS prominent?  
> What should disappear?

Repeat your answer for:

| Context | More prominent | Less prominent | Should disappear |
|---|---|---|---|
| `차가 있어요, 오동도도 갈 거예요` | | | |
| `부모님과 함께예요` | | | |
| `아이와 함께예요` | | | |
| `일몰을 보고 싶어요` | | | |

---

## HUMAN EXPERIENCE REVIEW

*These are future concepts — not currently implemented features.*

---

### Three Potential Human Experience Layers

**Concept A — Yeosu Field / Operator / Local Know-how**  
Knowledge from people who operate or live in Yeosu: practical truths that don't appear in official sources. Example: which cablecar station is better for sunset timing. Which time slot avoids queues on weekends.

**Concept B — Yeosu Family / Parent Community Experience**  
Aggregated practical experience from families who've made this trip. Example: which cabin for strollers. Whether elderly parents found the approach manageable.

**Concept C — Actual Sowon-i Traveler Experiences**  
Real past traveler experiences from people who have used this service before.

**The intended pipeline (not yet built):**
```
Actual experience collected
    → anonymized / organized
    → repeated friction or insight identified
    → factual claims verified when required
    → becomes Phoenix Knowledge
    → SOUL selects only what's relevant to the current traveler
```

**These should NOT become a generic review feed.**

---

### Human Experience Practitioner Questions

For each of the three concepts above:

1. Which of these genuinely improves traveler decisions?

2. Where should each type appear on the page?

3. When should it remain hidden?

4. What would make it feel **trustworthy** rather than promotional?

5. What would make it feel like **advertising** or **generic reviews**?

6. Which traveler situations benefit most from human experience?

7. What should **never** be generalized from anecdotal experience (i.e., what requires official verification)?

8. At what moment should SOUL surface human experience vs. operational facts?

---

## REALITY AUDIT DISCLOSURE

*Provide context after Phase A and B are complete.*

The current implementation has been audited against the intended product experience. Verified findings:

| Dimension | Maturity |
|---|---|
| UI Structure | 70–75% |
| Knowledge Preparation | 35–45% |
| Runtime Connection | 30–40% |
| End-to-End Product Experience | 25–35% |

**What this means:**

- The visible UI surface is substantially built. Most intended module areas exist.
- The current visible personalization (JourneyFlow, "나에게 중요한 것", SOUL judgment text for cablecar) is driven by **local hardcoded state** — not dynamically retrieved from a knowledge base at runtime.
- **Hyangiram Judgment V0.1** is a real example of Phoenix runtime knowledge: for elderly travelers + suitability query, the system knows about the two route options (stairs 10 min / flat 15 min), requires a proactive ASK rather than guessing.
- **Cable Car Judgment V0.1** does not yet have an equivalent backend knowledge-driven path.
- The Human Experience runtime pipeline does not yet exist.
- Save / "내 여정에 담기" is deferred (connects to 소원꿈터, not yet integrated).

---

## PRACTITIONER FINAL OUTPUT

Please complete each section:

---

### A. KEEP

*What is already right and should be protected?*

---

### B. CONNECT

*What already exists in UI / knowledge / backend but needs connection?*

---

### C. CREATE

*What is genuinely missing?*

---

### D. WOW MOMENT

*The 3 strongest opportunities for "와, 이것까지 알아?"*

1.
2.
3.

---

### E. FIRST PRIORITY

*If only ONE improvement could be made before launch, what should it be and why?*

---

### F. GOLDEN PLACE TEST

*What would make Yeosu Marine Cable Car a convincing Golden Place for SOUL?*

What would a traveler who experienced this page tell someone else?  
What would they say SOUL knew that they didn't expect?  
What would make the page feel like SOUL — and not a travel app?

---

---

# INTERNAL APPENDIX (Founder / Lumi Only)

*Not shown to practitioner.*

---

## Comparison Table Template

After practitioner review is returned, fill this table:

| Topic | Practitioner Recommendation | Current UI Status | Reality Audit | Existing Phoenix Capability | Implementation Implication |
|---|---|---|---|---|---|
| First viewport content | | | | | |
| Proactive SOUL knowledge | | | | | |
| Context-triggered content | | | | | |
| Suppression mechanism | | | | | |
| has_car behavior | | | | | |
| Parents/elderly behavior | | | | | |
| Children behavior | | | | | |
| Sunset intent behavior | | | | | |
| Place-to-journey connection | | | | | |
| Cost / time / parking placement | | | | | |
| Progressive disclosure trigger | | | | | |
| WOW moment #1 | | | | | |
| WOW moment #2 | | | | | |
| WOW moment #3 | | | | | |
| Human Experience Concept A | | | | | |
| Human Experience Concept B | | | | | |
| Human Experience Concept C | | | | | |
| Module composition mechanism | | | | | |
| KEEP items | | | | | |
| CONNECT items | | | | | |
| CREATE items | | | | | |
| First Priority | | | | | |
| Golden Place test criteria | | | | | |

**Implementation Classification:** KEEP / CONNECT_EXISTING / MINIMAL_CODE / KNOWLEDGE_STRUCTURING / NEW_KNOWLEDGE / NEW_PRODUCT_CAPABILITY

---

## Known Technical Constraints (Internal Reference)

*Practitioner is not asked to solve these. Internal reference only.*

| Constraint | Status |
|---|---|
| ESSENTIAL_INFO field name drift (operating_hours vs opening_hours_json) | CONFIRMED — two parsing paths |
| Basic Info auto-propagation risk (PlaceBasicInfo changes won't auto-apply to SoulCableCarPage) | CONFIRMED |
| explicit_context.place_code | SAFE_RESTRICTION — chip does not send place_code; text alias detection wins |
| Save / "내 여정에 담기" | DEFERRED — "소원꿈터 연결 예정" |
| Human Experience runtime | TRUE_GAP |
| Experience → Phoenix pipeline | GENUINELY_MISSING |
| 0503ed8 Promotion | HOLD — awaits Founder taxonomy confirmation + this practitioner review |
| Module SHOW/HIDE/REORDER | NOT_IMPLEMENTED — current: hardcoded JSX conditionals only |
| Travel Time Matrix | GOVERNANCE_HOLD |

---

## Screenshot Reference (Implementation States)

The following states of SoulCableCarPage @ 0503ed8 should be captured for practitioner reference:

| State | Route / Action | Key visible elements |
|---|---|---|
| A. Initial | `/soul/cable-car` (no chips, no message) | Question Composer, Place Hero, Essential Info, SOUL section (STATE0) |
| B. Question entered | Type "케이블카 운영시간 알려줘", submit | SOUL_MESSAGE (backend), STATE0 content |
| C. Chip: 자차 | Select 🚗 chip | JourneyFlow with car icon, "나에게 중요한 것" parking note |
| D. Chip: 오동도 | Select 🌿 chip | JourneyFlow with Odongdo arc, FOR_ME walk note, SOUL odongdo reference |
| E. Chip: 부모님 | Select 👴 chip | FOR_ME cabin note, SOUL crystal cabin reference |
| F. has_car + odongdo combined | Select both 🚗 + 🌿 | Combined JourneyFlow, FOR_ME odongdo note |
| G. DEPTH expanded | Click "더 알고 싶을 때" | Crystal Cabin details, odongdo route paragraph, phone |
| H. Bottom CTA | Scroll to bottom | "내 여정에 담기" disabled button |

*Screenshots are to be captured from the running local dev server (`localhost:5100/soul/cable-car`) and placed in `public/founder-review/soul-cablecar-v02/` per repository convention.*

---

*End of Internal Appendix*
