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
  if (!start_date) return null;
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
 * Build a deterministic MY ROUTE skeleton for N-night trips.
 *
 * @param {object} opts
 * @param {string|null} opts.start_date   ISO date e.g. '2026-10-17', or null for dateless route
 * @param {string|null} opts.hotel_code   'ramada' | 'kenny' | null
 * @param {string|null} opts.leisure_code 'cable' | null
 * @param {number} opts.guest_count
 * @param {Array}  opts.candidates        travelGuideService.places[] (may be empty)
 * @param {number} opts.nights            stay nights (default 1 → 1n2d)
 * @returns {object} route envelope
 *
 * When start_date is null: day.date = null, route_id = ROUTE-DATELESS-XXXX.
 * Frontend renders "N일차" labels instead of calendar dates.
 */
function buildSkeleton({ start_date, hotel_code, leisure_code, guest_count, candidates = [], nights = 1 }) {
  const totalDays = Math.max(2, nights + 1);
  const dayDate = (offset) => _makeDate(start_date, offset); // returns null when start_date is null

  // Eligible suggestions — deduplicate against LOCKED leisure items
  const eligible = candidates.filter(p => !_isDuplicateOfLocked(p, leisure_code));

  const days = [];

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const isFirst = dayNum === 1;
    const isLast  = dayNum === totalDays;
    const dateStr = dayDate(dayNum - 1);
    const items   = [];

    if (isFirst) {
      // Arrival marker
      items.push({
        day: dayNum, date: dateStr, sequence: 1,
        time_slot: 'arrival', time: null, type: 'arrival', name: '여수 도착',
        source: 'ROUTE_DEFAULT', selection_status: 'SUGGESTED', commerce_code: null, quotable: false,
      });

      // Day 1 suggestions (up to 2)
      eligible.slice(0, 2).forEach((p, i) => items.push({
        day: dayNum, date: dateStr, sequence: i + 2,
        time_slot: _isNightOriented(p) ? 'afternoon' : 'morning', time: null,
        type: p.type || 'attraction', name: p.name_ko,
        source: 'SOUL_RECOMMENDED', selection_status: 'SUGGESTED', commerce_code: null, quotable: false,
      }));

      // LOCKED: leisure (cable car) → afternoon
      if (leisure_code && COMMERCE_MAP[leisure_code]) {
        const lm = COMMERCE_MAP[leisure_code];
        items.push({
          day: dayNum, date: dateStr, sequence: 10,
          time_slot: 'afternoon', time: null, type: lm.type, name: lm.name,
          source: 'USER_SELECTED', selection_status: 'LOCKED', commerce_code: leisure_code, quotable: true,
        });
      }

      // LOCKED: hotel check-in → evening
      if (hotel_code && COMMERCE_MAP[hotel_code]) {
        const hm = COMMERCE_MAP[hotel_code];
        items.push({
          day: dayNum, date: dateStr, sequence: 99,
          time_slot: 'evening', time: null, type: hm.type, name: hm.name,
          source: 'USER_SELECTED', selection_status: 'LOCKED', commerce_code: hotel_code, quotable: true,
        });
      }
    } else if (isLast) {
      // LOCKED: hotel checkout → morning
      if (hotel_code && COMMERCE_MAP[hotel_code]) {
        items.push({
          day: dayNum, date: dateStr, sequence: 1,
          time_slot: 'morning', time: null, type: 'hotel',
          name: COMMERCE_MAP[hotel_code].name + ' 체크아웃',
          source: 'USER_SELECTED', selection_status: 'LOCKED', commerce_code: null, quotable: false,
        });
      }

      // Last-day suggestions (up to 2, drawn from second band of eligible)
      const startIdx = (dayNum - 1) * 2;
      eligible.slice(startIdx, startIdx + 2).forEach((p, i) => items.push({
        day: dayNum, date: dateStr, sequence: i + 2,
        time_slot: 'morning', time: null, type: p.type || 'attraction', name: p.name_ko,
        source: 'SOUL_RECOMMENDED', selection_status: 'SUGGESTED', commerce_code: null, quotable: false,
      }));

      // Departure marker
      items.push({
        day: dayNum, date: dateStr, sequence: 99,
        time_slot: 'departure', time: null, type: 'departure', name: '여행 마무리',
        source: 'ROUTE_DEFAULT', selection_status: 'SUGGESTED', commerce_code: null, quotable: false,
      });
    } else {
      // Middle days: suggestions only (2 per day from staggered band)
      const startIdx = (dayNum - 1) * 2;
      eligible.slice(startIdx, startIdx + 2).forEach((p, i) => items.push({
        day: dayNum, date: dateStr, sequence: i + 1,
        time_slot: _isNightOriented(p) ? 'afternoon' : 'morning', time: null,
        type: p.type || 'attraction', name: p.name_ko,
        source: 'SOUL_RECOMMENDED', selection_status: 'SUGGESTED', commerce_code: null, quotable: false,
      }));
    }

    items.sort((a, b) => a.sequence - b.sequence);
    days.push({ day: dayNum, date: dateStr, items });
  }

  return {
    route_id: start_date
      ? `ROUTE-${start_date.replace(/-/g, '')}-${_randomSuffix()}`
      : `ROUTE-DATELESS-${_randomSuffix()}`,
    stay_type: `${nights}n${totalDays}d`,
    start_date: start_date || null,
    end_date: dayDate(nights),
    party: { count: guest_count, type: 'couple' },
    days,
  };
}

module.exports = { buildSkeleton };
