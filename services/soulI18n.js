'use strict';

/**
 * SOUL i18n — English message generation from structured SOUL response payload.
 *
 * Design: Generates message_en from structured data (status, places, understood_context)
 * rather than translating message_ko text. soyeowoolService.js and travelGuideService.js
 * are untouched — Korean data is preserved as-is.
 *
 * PHX-KENNY-010 (2026-11-08)
 */

// ── English place names by place_code ────────────────────────────────────────
const PLACE_NAME_EN = {
  cablecar:              'Yeosu Cable Car',
  odongdo:               'Odongdo Island',
  hyangiram:             'Hyangiram Hermitage',
  dolsan_nightscape:     'Dolsan Park',
  dolsan_daegyo:         'Dolsan Bridge',
  lee_soon_shin_plaza:   'Yi Sun-sin Square',
  hamel_lighthouse:      'Hamel Lighthouse',
  marine_park:           'Jongpo Marine Park',
  jaisan_park:           'Jaisan Park',
  romantic_pojangmacha:  'Romantic Pojangmacha Street',
  sky_tower:             'Sky Tower',
  yeosu_expo_park:       'Expo Park',
  jungang_market:        'Jungang Market',
};

// ── English course/travel block strings ──────────────────────────────────────
const COURSE_EN = {
  stay:            (min) => `${min} min stay`,
  travel:          '↓ Transfer',
  travelVerified:  (min) => `about ${min} min`,
  travelRange:     (min, max) => `about ${min}–${max} min`,
  travelUnknown:   null,
  meal:            'Meal',
  mealLunch:       'Lunch',
  cafe:            'Café break',
  footerUnknown:   'Some transfer times are still being verified.',
  footerFit:       'Fits comfortably within your available time.',
  footerBudget:    'May run slightly over your selected time.',
  footerTbd:       'Course assembled based on activity time — transfers being verified.',
};

// ── Companion line ────────────────────────────────────────────────────────────
function _companionEn(people_type) {
  switch (people_type) {
    case 'family_elderly':  return 'Traveling with your parents';
    case 'family_with_kids': return 'Traveling with kids';
    case 'couple':          return 'Traveling as a couple';
    case 'group':           return 'Traveling with your group';
    default:                return null;
  }
}

// ── Time label ────────────────────────────────────────────────────────────────
function _timeEn(minutes) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
  return `${m} minutes`;
}

// ── Place names list ──────────────────────────────────────────────────────────
function _placeNamesEn(places) {
  return (places || [])
    .map(p => PLACE_NAME_EN[p.place_code] || p.name_ko)
    .filter(Boolean);
}

// ── Main generator ────────────────────────────────────────────────────────────
/**
 * Generate message_en from a SOUL response payload.
 * Returns null if the status/mode has no meaningful English equivalent.
 *
 * @param {object} payload - soulResult.payload from handleTravelRequest
 * @returns {string|null}
 */
function generateMessageEn(payload) {
  if (!payload) return null;

  const {
    status,
    presentation_mode,
    places = [],
    resolved_code,
    understood_context = {},
  } = payload;

  const pt          = understood_context.people_type;
  const timeMinutes = understood_context.time_available_minutes;
  const companion   = _companionEn(pt);
  const timeStr     = _timeEn(timeMinutes);

  // ── Situation line ──────────────────────────────────────────────────────────
  let situation = null;
  if (companion && timeStr) {
    situation = `${companion} — you have about ${timeStr} in Yeosu.`;
  } else if (companion) {
    situation = `${companion}.`;
  } else if (timeStr) {
    situation = `You have about ${timeStr} in Yeosu.`;
  }

  // ── Status-specific message ─────────────────────────────────────────────────
  switch (status) {

    case 'CITY_UNSUPPORTED':
      return "I'm not yet able to guide you in that area.\nI can help you explore Yeosu — would you like similar recommendations there?";

    case 'MULTI_CITY_PARTIAL':
      return "I can help you plan the Yeosu portion of your trip.\nSuncheon and Gwangyang aren't available yet — shall we start with Yeosu?";

    case 'CITY_AMBIGUOUS':
      return "Which city would you like to explore first?\nCurrently I can guide you around Yeosu.";

    case 'PLACE_CONTEXT_REQUIRED':
      return "Could you let me know which place you're asking about?\nFor example: \"Odongdo [keyword]\" or \"Cable Car [keyword]\"";

    case 'NO_RESULT':
      return [
        situation,
        "I couldn't find places matching your criteria. Try adjusting your time or preferences.",
      ].filter(Boolean).join('\n');

    case 'PLACE_LOOKUP': {
      const placeName = PLACE_NAME_EN[resolved_code] || null;
      return placeName
        ? `Here's what I know about ${placeName}.`
        : "Here's what I found.";
    }

    case 'JOURNEY_CONTINUITY':
      return "Continuing your Yeosu journey.";

    case 'CLARIFICATION':
      return [
        situation,
        "Could you tell me a bit more?\nWhat kind of experience are you looking for in Yeosu?",
      ].filter(Boolean).join('\n');

    default: {
      // DISCOVERING, PARTIAL, ROUTE_READY, QUOTE_READY, etc.
      const names = _placeNamesEn(places);

      if (status === 'PARTIAL' || presentation_mode === 'PARTIAL') {
        const rec = names.length > 0
          ? `Here are some places that may suit you: ${names.join(', ')}.`
          : "Here are some places that might suit your situation.";
        return [situation, rec].filter(Boolean).join('\n');
      }

      // DISCOVERING or general
      const rec = names.length > 0
        ? `Recommended in Yeosu: ${names.join(', ')}.`
        : "Here are some recommendations for Yeosu.";
      return [situation, rec].filter(Boolean).join('\n');
    }
  }
}

module.exports = { generateMessageEn, PLACE_NAME_EN, COURSE_EN };
