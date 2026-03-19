# Technical Implementation Log: Growth Film & Viral Loop (Referral Injection)
**Date:** 2026-03-03
**Feature Context:** AIL-105-P0 (Growth Film) & Viral Loop Optimization

## 1. Overview
This document serves as the SSOT (Single Source of Truth) for the architectural decisions and implementation details regarding two core features built to enhance user retention and acquisition (viral loop) in the Daily Miracles MVP.

### Features
1. **Growth Film (7-Day Journey Completion Reward)**
2. **Referral Link Injection (Viral Loop Optimization)**

---

## 2. Viral Loop: Referral Code Injection
### Problem
The sharing UX (KakaoTalk, Link Copy) from the `daily-miracles-result.html` page was hardcoded to the base URL (`https://dailymiracles.kr/questions.html`), stripping out any user-specific tracking. Consequently, the 300P referral reward system built into the backend (`referralRoutes.js`) could not be triggered.

### Solution
Injected the user's unique referral code (`refCode`) into the frontend share generation pipeline.

- **Component:** `public/daily-miracles-result.html`
  - Fetches the user's `refCode` via `GET /api/referral/my-code` by passing the `trial_id` stored in `localStorage`.
  - Passes the retrieved `refCode` inside the data payload sent to `ShareCardGenerator`.
- **Component:** `public/js/shareCardGenerator.js`
  - `showShareModal(data)` reads `data.refCode`.
  - Dynamically constructs the sharing URL: `https://dailymiracles.kr/questions.html?ref=${refCode}`.
  - Updates Kakao SDK `mobileWebUrl`/`webUrl` and the clipboard `copy` functionality to use this tracked URL.

---

## 3. Growth Film: Architecture & Implementation (AIL-105-P0)
### Concept
Create a highly visual, premium "film reel" (1080x1920 PNG) summarizing a user's 7-day challenge completion to encourage social media sharing (e.g., Instagram Stories).

### Database Schema (Migration 025_wish_challenges.sql)
1. **`wish_challenges`**: Master table tracking overall 7-day status (`start_date`, `status: ONGOING/COMPLETED`).
2. **`wish_challenge_days`**: Daily log storing specific actions (`day_number`, `action_type`, `image_filename`).
3. **`wish_challenge_cheers`**: Tracks anonymous/registered "cheers" from others viewing the film, ensuring idempotency.

### Backend Routes (`routes/challengeRoutes.js`)
- `GET /film`: Parallel data fetching (Promise.all) to construct a localized, 7-day visual timeline payload.
- `POST /checkin`: Upserts daily logs. Automatically transitions challenge status to `COMPLETED` when Day 7 is submitted.
- `POST /cheer`: Implements `ON CONFLICT DO NOTHING` for idempotent cheer recording.

### Frontend Generation (`public/js/growthFilmCollage.js`)
- **Canvas Rendering**: Generates a 1080x1920 output using a dark/purple gradient base.
- **2x2 Grid Layout**: Placed images from Day 1, 3, 5, and 7 using a custom `_roundRect()` fallback polyfill for older browser support.
- **Dynamic Overlays**: Uses CSS-only color-wash, light-on, and sparkle-on effects before rasterizing to Canvas.
- **Fallback**: If `.toBlob()` or PNG generation fails (e.g., memory limits on mobile), gracefully degrades.

---

## 4. Operational Notes & Future Guidelines
1. **Migration Execution:** The `025_wish_challenges.sql` migration relies on the production `DATABASE_URL`. Due to rendering environment separation, ensure this `.sql` script is executed manually or via Render dashboard if local environment variables are out-of-sync.
2. **Report Scheduler:** `reportScheduler.init(db)` must be actively running in `server.js` loop to ensure offline cron-like tasks related to challenge timeouts or notifications execute correctly.

_This document generated during active session analysis to preserve context for future development loops._
