# SOUL Runtime Reconnection V0.1 — Implementation Evidence
Date: 2026-10-01
Branch: staging/storybook-c7a
Status: IMPLEMENTED — build GREEN, no push, no production deploy

---

## Scope

Golden Question vertical slice: SoulCableCarPage ↔ /api/dt/travel/input/text

Governed by: SOUL_RECONNECTION_FOUNDER_DECISIONS_2026_10_01.md (D1/D2/D3)

---

## Changes Made

### File: dreamtown-frontend/src/pages/SoulCableCarPage.jsx

**PHASE 1 — Import**
- Added: `import { getOrEnsureGuestCredential } from '../api/dreamtown.js';`

**PHASE 2 — State + handleSubmit**
- Added 4 state variables: `sessionId`, `isLoading`, `soulMessage`, `soulResponse`
- Replaced sync `handleSubmit` with async version:
  - `parseContext(raw, travelerContext)` runs first (synchronous, zero-LLM — preserved)
  - `getOrEnsureGuestCredential()` called inline before fetch (call-before-action pattern)
  - POST `/api/dt/travel/input/text` with Bearer auth + `{ message: raw, session_id: sessionId }`
  - `data.session_id` → `sessionId` state for conversation continuity
  - `data.message_ko` → `soulMessage` (D1: separate slot from SOUL JUDGMENT)
  - Error → `soulMessage` ("never silent" principle)
  - `setInputValue('')` in `finally` block (raw question preservation during fetch)

**PHASE 3 — Loading state**
- Submit button: `disabled={isLoading}` + `{isLoading ? '확인 중…' : '전달'}`

**PHASE 4 — Living Detail Mapping (D2)**
- "여정 안내" Card: renders `soulMessage` after Question Composer, before Place Hero — separate from SOUL JUDGMENT card
- JOURNEY card: `soulResponse?.course?.blocks[]` appended below JourneyFlow if present
- COST card: renders if `soulResponse?.quote?.status === 'CALCULATED'` — after JOURNEY card
- `places[]` → HOLD (not displayed)
- `next_options[]` → HOLD (KEEP_SEPARATE from Quick Context)

---

## Acceptance Criteria Verification

| # | Criterion | Result |
|---|---|---|
| AC-01 | Build passes with zero errors | PASS — vite build 706 modules, 16.41s |
| AC-02 | parseContext still runs synchronously on submit | PASS — called before await |
| AC-03 | getOrEnsureGuestCredential called before fetch, not on mount | PASS — called inside handleSubmit try block |
| AC-04 | Raw question sent to API before inputValue cleared | PASS — setInputValue('') in finally |
| AC-05 | response.message_ko → soulMessage, NOT primaryDiscovery | PASS — D1 compliant, separate slot |
| AC-06 | SOUL JUDGMENT card unchanged (primaryDiscovery) | PASS — no modification to that card |
| AC-07 | Submit button disabled during loading | PASS — disabled={isLoading} |
| AC-08 | Error surfaced in soulMessage, not thrown | PASS — catch → setSoulMessage(err.message) |
| AC-09 | session_id maintained across turns | PASS — sessionId state + data.session_id update |
| AC-10 | course blocks rendered when present | PASS — soulResponse?.course?.blocks conditional |
| AC-11 | COST card shown only when CALCULATED | PASS — quote.status === 'CALCULATED' guard |
| AC-12 | places[] and next_options[] not displayed | PASS — HOLD as per D2 |

---

## HOLD (explicitly out of scope for V0.1)

- Phoenix docs/knowledge runtime import
- Place Knowledge migration
- Relationship/Travel Time Matrix connection
- Context Bridge / Yeouiju integration
- Journey Snapshot / 소원꿈터 integration
- places[] UI
- next_options[] UI
- DB/Schema migration

---

*Generated: 2026-10-01 / branch: staging/storybook-c7a / build: GREEN*
*No push. No production deploy.*
