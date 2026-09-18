---
code: CAND-EXP-003
title: Route Experience × Resource Architecture
status: Candidate
importance: Level 4
category: Experience / Framework
owner: DreamTown / Phoenix
created: 2026-09-17
promotion_path: Candidate → SSOT-EXP (only after second vertical slice validation)
related: CAND-EXP-001, CAND-OPS-002_Hotel_Hub_Travel_Operations_Architecture
---

> 본 문서는 기존 Constitution/SSOT/Manifesto를 대체하지 않는다.
> Kenny E2E_GREEN 이후의 지식을 반영한 Candidate 단계 문서이다.
> 실제 두 번째 vertical slice 검증 이전에는 SSOT로 승격하지 않는다.

---

# CAND-EXP-003 — Route Experience × Resource Architecture

## Core Definition

> "항로는 경험이고, 객실은 그 경험을 실현하는 자원이다.
> 소원이는 경험을 선택하고, 소담이는 소원이의 니즈와
> DreamTown 가용자원을 연결한다."

## Purpose

DreamTown이 호텔 객실 판매 플랫폼으로 변질되는 것을 방지하고,
호텔/객실/전망/가격이 늘어나더라도 별빛항로라는 경험의 정체성을 유지하기 위한 원칙을 정의한다.

## Background

Ramada Plaza Yeosu partner rate evidence showed that a single hotel contains multiple resource tiers:

- Superior / Mountain View
- Deluxe / Partial Ocean View
- Premier / Full Ocean View
- Special room types

Therefore DreamTown should not force all Sowoni into one Ocean View product,
nor expose the entire hotel inventory as a traditional OTA.

Different Sowoni have different needs:
- lower travel cost
- ocean-view experience
- family capacity
- better room when imminent availability appears

DreamTown should preserve one emotional Route while allowing different resource configurations underneath it.

---

## PRINCIPLE 1 — ROUTE ≠ ROOM

별빛항로 is the experience.

A specific hotel room is a resource used to realize that experience.

Do not define:
- "Ramada Superior Package"
- "Ramada Deluxe Package"

as the primary DreamTown experience.

Prefer: **별빛항로** with accommodation preference/experience variants.

---

## PRINCIPLE 2 — EXPERIENCE VARIANT

Initial accommodation-facing variants:

| Variant | Description |
|---|---|
| `CITY_VIEW_STARLIGHT_ROUTE` | Sowoni who prioritize affordability / local experiences over room view |
| `OCEAN_VIEW_STARLIGHT_ROUTE` | Sowoni who value seeing the Yeosu sea from the accommodation |

Both variants remain **EP01 / 별빛항로** — they are NOT separate emotional Routes.

They represent different accommodation preferences within the same Route.

Do not characterize CITY_VIEW as an inferior Route.

---

## PRINCIPLE 3 — RESOURCE ABSTRACTION BOUNDARY

Internal inventory must preserve the actual partner resource:

```
Partner: Ramada Plaza Yeosu
Room: Superior Double
View: Mountain
Capacity: 2
Partner rate: actual contracted rate
Availability: actual DreamTown allocation
```

But the Sowoni-facing experience does not need to expose every inventory dimension.

SODAM may match the underlying resource based on:
- Sowoni explicit preference
- party size
- stay date
- available inventory
- view preference
- partner conditions
- price
- resource release timing

**Do NOT infer a preference that the Sowoni did not express.**

---

## PRINCIPLE 4 — IDLE RESOURCE MODEL

Preserve this layered distinction:

| Layer | Definition |
|---|---|
| `POTENTIAL_IDLE_RESOURCE` | Market/partner capacity that may remain unused but has NOT been allocated to DreamTown |
| `DREAMTOWN_AVAILABLE_RESOURCE` | Resource explicitly made available to DreamTown by the partner |
| `PRE_ALLOCATED_RESOURCE` | Resource allocated to DreamTown in advance |
| `IMMINENT_IDLE_RESOURCE` | Resource still unused near service/expiration time and subsequently released to DreamTown |
| `HOSPITALITY_CONVERTED_RESOURCE` | DreamTown Available Resource whose actual use/delivery has been confirmed |

Never treat market vacancy as DreamTown-owned/controlled inventory.

---

## PRINCIPLE 5 — DYNAMIC HOSPITALITY OPPORTUNITY

Resource quality and price do not have to maintain a permanent hierarchy.

Example: If a partner releases unsold Full Ocean View rooms near the stay date,
SODAM may be able to connect an Ocean View resource to a Sowoni at unusually favorable conditions.

DreamTown's purpose:

> "Connect the most suitable available hospitality opportunity
> to the Sowoni at the right moment."

Not simply: "find cheapest room."

**Do not implement dynamic pricing from this Candidate.**

---

## PRINCIPLE 6 — PARTNER RATE EVIDENCE

Source evidence: 2026 Ramada Plaza Yeosu affiliated travel agency rate sheet.

Room hierarchy:
- Superior (Mountain View)
- Deluxe (Partial Ocean View)
- Premier (Full Ocean View)
- Special room types

Rate variation: Sun–Thu / Friday / Saturday / holiday/season

Cancellation policy (by proximity to stay):
- 30 days before: free cancellation
- 15 days before: 20%
- 7 days before: 50%
- 4 days before: 70%
- 3 days before through same day / no-show: 100%

**Do NOT convert this evidence into production pricing in this Candidate.**

---

## PRINCIPLE 7 — DATA SEPARATION

Keep these measurement layers distinct:

```
MARKET POTENTIAL
  → PARTNER RELEASE
      → DREAMTOWN AVAILABLE RESOURCE
          → SODAM CONNECTION
              → RESERVATION
                  → ACTUAL USE
                      → HOSPITALITY CONVERSION
```

This allows DreamTown to independently measure:
- "What existed" (market)
- "What partners entrusted to DreamTown" (partner release)
- "What DreamTown connected" (SODAM decision)
- "What was actually used" (hospitality conversion)

without mixing the numbers.

---

## Usage Examples

### Good

**Sowoni:** "숙소 비용은 조금 아끼고 여수에서 더 많은 경험을 하고 싶어요."
→ SODAM: CITY_VIEW_STARLIGHT_ROUTE → suitable partner → compatible room → actual available resource

**Sowoni:** "이번 여행에서는 방에서도 바다를 보고 싶어요."
→ SODAM: OCEAN_VIEW_STARLIGHT_ROUTE → partial/full ocean candidates → party/date/inventory matching

### Bad

- Display 13 hotel room types and ask the Sowoni to compare like an OTA.
- Automatically infer Ocean View because party_size=2.

---

## Applications

- SODAM decision model
- FLOW inventory
- 무여정 / 별빛항로
- Partner inventory onboarding
- Future hotel expansion
- Future resource matching
- DreamTown Plaza metrics
- Hospitality conversion analytics

---

## World / Phoenix / Originality

**WORLD:** Traditional OTA systems primarily expose inventory, room type, price, and availability for user comparison.

**PHOENIX LEARNING:** DreamTown still needs precise inventory and pricing internally. Operational precision must not be sacrificed for emotional simplicity.

**DREAMTOWN ORIGINALITY:** The Sowoni chooses the desired experience. SODAM connects suitable real-world resources underneath that experience.

DreamTown therefore separates:
- **Experience Layer** (what the Sowoni chooses)
- **Resource Layer** (what SODAM connects internally)

---

## Relation to Current Kenny Work

Do not modify the already verified Kenny vertical slice because this Candidate exists.

**Kenny E2E_GREEN remains confirmed.** (See: `memory/project_kenny_e2e_checkpoint.md`)

This Candidate informs future resource expansion (multi-room-type, Ramada onboarding, view preference matching) but does not invalidate the current FLOW implementation.

Current FLOW implementation uses a single resource type (KENNY_OCEAN_DBL) with party_size and KST-date matching. That is correct and complete for the verified slice.

---

## Promotion Target

Future SSOT candidate target: **SSOT-EXP — DreamTown Experience / Resource Architecture**

Promotion prerequisite: second vertical slice (different partner or different resource tier) successfully validated E2E.

**Do NOT promote now.**

---

## Project Impact: 95/100
## Knowledge Value: ★★★★★
## Origin

- Date: 2026-09-17
- Topic: Ramada room diversity → City View / Ocean View Starlight Route
- Trigger: Kenny E2E_GREEN + Ramada Plaza Yeosu partner rate evidence
- Creator: DreamTown / Phoenix
