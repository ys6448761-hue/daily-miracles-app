'use strict';
/**
 * Quote Context Service — MY ROUTE → MY QUOTE minimum bridge
 *
 * Responsibility: extract quotable context from SOUL/user message,
 * determine quoteability, and map to quoteEngine.calculateQuote() input.
 *
 * Invariants:
 *   - NEVER generates or invents prices
 *   - NEVER modifies contextExtractionService or travelGuideService
 *   - prices come exclusively from quoteEngine / quotePriceData
 *   - COST never leaks to caller (sanitizeForCustomer called by soyeowoolService)
 */

const MVP_HOTELS = {
  '라마다': 'ramada',
  '라마다호텔': 'ramada',
  'ramada': 'ramada',
  '케니': 'kenny',
  '케니호텔': 'kenny',
  'kenny': 'kenny'
};

const COMPLEX_PATTERNS = [
  '1인1실', '2인1실', '3인1실', '4인1실',
  '혼합', '오션뷰', 'ocean view', '조식', '세미나', '세미나실',
  'city view', 'half ocean', 'full ocean', '풀오션', '하프오션',
  '복수 객실', '복수객실'
];

// ─── Date extraction ──────────────────────────────────────────────────────────

/**
 * Extract travel date from user message.
 * Supports: "10월 17일", "10/17", "2026-10-17", "10월17일"
 * Returns YYYY-MM-DD or null.
 */
function _extractDate(message) {
  if (!message) return null;
  const year = new Date().getFullYear(); // default to current year

  // ISO format first
  const isoMatch = message.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Korean: "10월 17일" or "10월17일"
  const koMatch = message.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (koMatch) {
    const [, m, d] = koMatch;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Slash: "10/17"
  const slashMatch = message.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const [, m, d] = slashMatch;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

// ─── Hotel extraction ─────────────────────────────────────────────────────────

function _extractHotelCode(message) {
  if (!message) return null;
  const lower = message.replace(/\s+/g, '').toLowerCase();
  for (const [key, code] of Object.entries(MVP_HOTELS)) {
    if (lower.includes(key.toLowerCase())) return code;
  }
  return null;
}

// ─── Leisure extraction ───────────────────────────────────────────────────────

const NEGATION_PATTERNS = /빼줘|빼고|제외|없이|말고|뺄게|빼겠|빼자|제외하고/;

function _extractLeisure(message) {
  if (!message) return null;
  if (/케이블카/.test(message)) {
    // Negation guard: "케이블카는 빼줘" → no cable
    if (NEGATION_PATTERNS.test(message)) return null;
    return 'cable';
  }
  return null;
}

// ─── Guest count extraction ───────────────────────────────────────────────────

/**
 * Extract guest count from domainContext (group_size) or message patterns.
 * Returns integer or null.
 */
function _extractGuestCount(message, domainContext) {
  // Prefer domainContext.group_size if present
  if (domainContext && domainContext.group_size && domainContext.group_size >= 1) {
    return domainContext.group_size;
  }

  if (!message) return null;

  // Korean patterns: "2명", "둘이", "두명", "혼자"
  const numMatch = message.match(/(\d+)명/);
  if (numMatch) return parseInt(numMatch[1], 10);

  if (/혼자/.test(message)) return 1;
  if (/둘이|두명|2명/.test(message)) return 2;
  if (/셋이|세명|3명/.test(message)) return 3;
  if (/넷이|네명|4명/.test(message)) return 4;

  // couple implied
  if (/여자친구|남자친구|부부|커플|남편|아내|와이프/.test(message)) return 2;

  return null;
}

// ─── Cable car type ───────────────────────────────────────────────────────────

function _resolveCableCarType(guestCount, message) {
  if (!guestCount) return undefined;
  // Group (5+) with explicit one-way or just group_oneway default
  if (guestCount >= 5) {
    return 'group_oneway';
  }
  // Individual: check for explicit one-way vs round-trip
  // Default individual = round-trip (existing pricing)
  return undefined; // undefined = use default (weekend/weekday) pricing
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract quote context from message + domainContext.
 * Never throws — returns partial context on any error.
 */
function extractQuoteContext(message, domainContext) {
  try {
    const guestCount = _extractGuestCount(message, domainContext);
    const hotelCode  = _extractHotelCode(message);
    const leisure    = _extractLeisure(message);
    const travelDate = _extractDate(message);
    const cableCarType = leisure === 'cable' ? _resolveCableCarType(guestCount, message) : undefined;

    return {
      travel_date: travelDate,
      guest_count: guestCount,
      hotel_code:  hotelCode,
      leisure:     leisure,
      cable_car_type: cableCarType,
      region: 'yeosu'
    };
  } catch (err) {
    console.error('[QUOTE_CONTEXT_EXTRACT_ERROR]', err.message);
    return { travel_date: null, guest_count: null, hotel_code: null, leisure: null, region: 'yeosu' };
  }
}

/**
 * Returns true if a quote can be auto-calculated.
 * Requires: hotel_code (MVP) + travel_date + guest_count
 */
function isQuotable(quoteCtx) {
  if (!quoteCtx) return false;
  const { hotel_code, travel_date, guest_count } = quoteCtx;
  return !!(
    hotel_code &&
    ['ramada', 'kenny'].includes(hotel_code) &&
    travel_date &&
    guest_count && guest_count >= 1
  );
}

/**
 * Returns { complex: boolean, reason: string }
 * Complex = group hotel (5+인 with hotel) OR complex room/view/meal conditions
 */
function isComplexGroupHotel(quoteCtx, message) {
  if (!quoteCtx || !quoteCtx.hotel_code) {
    return { complex: false, reason: null };
  }

  const guestCount = quoteCtx.guest_count || 0;

  // Any 5+ person hotel booking → human confirmation required
  // (hotel pricing only exists for ≤4인 per room, multi-room needs confirmation)
  if (guestCount >= 5) {
    // Check for explicit complex room patterns
    const hasComplexPattern = message && COMPLEX_PATTERNS.some(p => message.includes(p));
    const reason = hasComplexPattern
      ? `단체 숙박(${guestCount}명) + 복합 객실 조건`
      : `단체 숙박 ${guestCount}명 — 객실 구성 확인 필요`;
    return { complex: true, reason };
  }

  // Individual: check complex patterns even for ≤4 people
  if (message) {
    const hasComplex = COMPLEX_PATTERNS.some(p => message.includes(p));
    if (hasComplex) {
      return { complex: true, reason: '특수 객실/조건 확인 필요' };
    }
  }

  return { complex: false, reason: null };
}

/**
 * Map QuoteContext to quoteEngine.calculateQuote() input.
 */
function buildQuoteInput(quoteCtx) {
  const input = {
    guestCount:   quoteCtx.guest_count,
    hotel:        quoteCtx.hotel_code,
    leisure:      quoteCtx.leisure || null,
    travelDate:   quoteCtx.travel_date,
    region:       quoteCtx.region || 'yeosu',
    hasWishVoyage: false
  };

  if (quoteCtx.cable_car_type) {
    input.cableCarType = quoteCtx.cable_car_type;
  }

  return input;
}

module.exports = {
  extractQuoteContext,
  isQuotable,
  isComplexGroupHotel,
  buildQuoteInput,
  // Exported for testing
  _extractDate,
  _extractHotelCode,
  _extractLeisure,
  _extractGuestCount
};
