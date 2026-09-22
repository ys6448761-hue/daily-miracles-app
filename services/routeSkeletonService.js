'use strict';
// Route skeleton — pure function, no IO, no DB, no GPT.
// Assembles deterministic LOCKED items + converts tgResult.places[] to SUGGESTED.
// LOCKED items are always present regardless of AI availability.
// Do NOT add DB calls or GPT calls here.

const COMMERCE_MAP = {
  ramada: { name: '라마다 호텔 여수', type: 'hotel' },
  kenny:  { name: '켄싱턴 호텔 여수', type: 'hotel' },
  cable:  { name: '여수 해상케이블카', type: 'leisure' },
};

const LEISURE_DEDUP_KEYWORDS = ['케이블카'];
const CABLE_PLACE_CODES = ['cable', 'cablecar', 'CABLE', 'CABLECAR'];

function _makeDate(start_date, dayOffset) {
  const d = new Date(start_date);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

function _randomSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function _isDuplicateOfLocked(candidate, leisure_code) {
  if (!candidate.name_ko) return false;
  if (LEISURE_DEDUP_KEYWORDS.some(kw => candidate.name_ko.includes(kw))) return true;
  if (leisure_code && CABLE_PLACE_CODES.includes(candidate.place_code)) return true;
  return false;
}

// Detect night/evening-oriented places using existing metadata only.
// Uses emotion_tags (night_view) and name_ko pattern — no hardcoded place names.
function _isNightOriented(candidate) {
  const tags = candidate.emotion_tags || [];
  if (tags.some(t => ['night_view', '야경', '야간', 'night'].includes(t))) return true;
  if (/야경|야간|밤/u.test(candidate.name_ko || '')) return true;
  return false;
}

/**
 * Build a deterministic MY ROUTE skeleton.
 *
 * @param {object} opts
 * @param {string} opts.start_date     ISO date e.g. '2026-10-17'
 * @param {string|null} opts.hotel_code   'ramada' | 'kenny' | null
 * @param {string|null} opts.leisure_code 'cable' | null
 * @param {number} opts.guest_count
 * @param {Array}  opts.candidates     travelGuideService.places[] (may be empty)
 * @returns {object} route envelope
 */
function buildSkeleton({ start_date, hotel_code, leisure_code, guest_count, candidates = [] }) {
  const day1Date = _makeDate(start_date, 0);
  const day2Date = _makeDate(start_date, 1);

  // ── SUGGESTED items from travelGuideService (DB-backed, no hardcoded names) ──
  const eligible = candidates.filter(p => !_isDuplicateOfLocked(p, leisure_code));

  // Day 1: first 2 eligible, Day 2: next 2
  // Night-oriented places (야경/night_view) go to afternoon, not morning.
  const day1Suggestions = eligible.slice(0, 2).map((p, i) => ({
    day: 1,
    date: day1Date,
    sequence: i + 2,        // sequence 2, 3 (after arrival at 1)
    time_slot: _isNightOriented(p) ? 'afternoon' : 'morning',
    time: null,
    type: p.type || 'attraction',
    name: p.name_ko,
    source: 'SOUL_RECOMMENDED',
    selection_status: 'SUGGESTED',
    commerce_code: null,
    quotable: false
  }));

  const day2Suggestions = eligible.slice(2, 4).map((p, i) => ({
    day: 2,
    date: day2Date,
    sequence: i + 2,        // sequence 2, 3 (after checkout at 1)
    time_slot: 'morning',
    time: null,
    type: p.type || 'attraction',
    name: p.name_ko,
    source: 'SOUL_RECOMMENDED',
    selection_status: 'SUGGESTED',
    commerce_code: null,
    quotable: false
  }));

  // ── Day 1 items ──────────────────────────────────────────────────────────────

  // Arrival marker — always first
  const arrivalMarker = {
    day: 1,
    date: day1Date,
    sequence: 1,
    time_slot: 'arrival',
    time: null,
    type: 'arrival',
    name: '여수 도착',
    source: 'ROUTE_DEFAULT',
    selection_status: 'SUGGESTED',
    commerce_code: null,
    quotable: false
  };

  const day1Items = [arrivalMarker, ...day1Suggestions];

  // LOCKED: leisure (cable car) → afternoon
  if (leisure_code && COMMERCE_MAP[leisure_code]) {
    const lm = COMMERCE_MAP[leisure_code];
    day1Items.push({
      day: 1,
      date: day1Date,
      sequence: 10,
      time_slot: 'afternoon',
      time: null,
      type: lm.type,
      name: lm.name,
      source: 'USER_SELECTED',
      selection_status: 'LOCKED',
      commerce_code: leisure_code,
      quotable: true
    });
  }

  // LOCKED: hotel check-in → evening, sequence 99
  // time = null — no verified source for exact check-in time
  if (hotel_code && COMMERCE_MAP[hotel_code]) {
    const hm = COMMERCE_MAP[hotel_code];
    day1Items.push({
      day: 1,
      date: day1Date,
      sequence: 99,
      time_slot: 'evening',
      time: null,   // Founder correction: null until verified from hotel data
      type: hm.type,
      name: hm.name,
      source: 'USER_SELECTED',
      selection_status: 'LOCKED',
      commerce_code: hotel_code,
      quotable: true
    });
  }

  // ── Day 2 items ──────────────────────────────────────────────────────────────

  // LOCKED: hotel checkout marker → morning, sequence 1
  // time = null — no verified source for exact checkout time
  const day2Items = [];

  if (hotel_code && COMMERCE_MAP[hotel_code]) {
    day2Items.push({
      day: 2,
      date: day2Date,
      sequence: 1,
      time_slot: 'morning',
      time: null,   // Founder correction: null until verified from hotel data
      type: 'hotel',
      name: COMMERCE_MAP[hotel_code].name + ' 체크아웃',
      source: 'USER_SELECTED',
      selection_status: 'LOCKED',
      commerce_code: null,
      quotable: false
    });
  }

  day2Items.push(...day2Suggestions);

  // Departure marker — always last
  day2Items.push({
    day: 2,
    date: day2Date,
    sequence: 99,
    time_slot: 'departure',
    time: null,
    type: 'departure',
    name: '여행 마무리',
    source: 'ROUTE_DEFAULT',
    selection_status: 'SUGGESTED',
    commerce_code: null,
    quotable: false
  });

  // Sort each day by sequence
  day1Items.sort((a, b) => a.sequence - b.sequence);
  day2Items.sort((a, b) => a.sequence - b.sequence);

  return {
    route_id: `ROUTE-${start_date.replace(/-/g, '')}-${_randomSuffix()}`,
    stay_type: '1n2d',
    start_date,
    end_date: day2Date,
    party: { count: guest_count, type: 'couple' },
    days: [
      { day: 1, date: day1Date, items: day1Items },
      { day: 2, date: day2Date, items: day2Items }
    ]
  };
}

module.exports = { buildSkeleton };
