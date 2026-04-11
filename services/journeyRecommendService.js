/**
 * journeyRecommendService.js — 여정 추천 엔진 v1
 *
 * 규칙 기반 (복잡한 ML/A-B 없음):
 *  date_type + wish_text 키워드 + people_type → route_type 결정
 *  → dt_products WHERE city_code + route_type + is_active ORDER BY display_order LIMIT 1
 *
 * SSOT: 추천은 항상 1개만 메인 강조
 */

'use strict';

const db = require('../database/db');

// ── 키워드 → route_type 맵 ──────────────────────────────────────────────
const KEYWORD_MAP = [
  { words: ['쉬고', '쉬어', '쉬다', '편해', '편히', '힐링', '정리', '여유', '휴식', '느긋', '천천히'], type: 'flow' },
  { words: ['특별', '기억', '데이트', '축하', '기념', '낭만', '감성', '설레', '야경', '밤바다'],       type: 'expand' },
  { words: ['도전', '용기', '해보고', '시도', '새로운', '모험', '처음', '용감'],                       type: 'resonance' },
  // '가족' 제외 → people_type=family가 expand로 이미 처리. wish_text '가족'은 miracle이 아닌 일반 묘사어
  { words: ['기적', '소중', '행복', '사랑', '최고', '최선', '완벽', '프리미엄', '완성'],               type: 'miracle' },
];

// ── date_type → route_type 우선순위 ────────────────────────────────────
const DATE_PRIORITY = {
  today:     'flow',
  this_week: 'flow',
  weekend:   'expand',
  custom:    'expand',
};

// ── people_type → route_type 보정 ──────────────────────────────────────
// solo, couple → 그대로 / family, friends, group → expand 선호
const GROUP_BOOST = new Set(['family', 'friends', 'group']);

/**
 * wish_text 기반 route_type 결정 (null이면 키워드 미매칭)
 */
function detectRouteTypeFromText(wishText) {
  if (!wishText) return null;
  const lower = wishText.toLowerCase();
  for (const { words, type } of KEYWORD_MAP) {
    if (words.some(w => lower.includes(w))) return type;
  }
  return null;
}

/**
 * 컨텍스트 기반 route_type 결정
 * 우선순위: wish_text 키워드 > date_type > people_type
 */
function deriveRouteType({ wishText, dateType, peopleType }) {
  const fromText = detectRouteTypeFromText(wishText);
  const fromDate = DATE_PRIORITY[dateType] ?? 'flow';

  // 그룹/가족 → expand 선호 (단, 키워드 매칭이 없을 때만)
  const groupBoost = GROUP_BOOST.has(peopleType) && !fromText ? 'expand' : null;

  return fromText ?? groupBoost ?? fromDate;
}

/**
 * 추천 여정 1개 조회
 * @param {Object} params
 * @param {string} params.wishId
 * @param {string} params.contextId
 * @returns {Promise<{product, routeType, reason}>}
 */
async function recommend({ wishId, contextId }) {
  // 소원 + 컨텍스트 조인 조회
  const { rows: [row] } = await db.query(
    `SELECT w.wish_text, c.city_code, c.date_type, c.people_type
     FROM wishes w
     JOIN journey_contexts c ON c.id = $2 AND c.wish_id = w.id
     WHERE w.id = $1`,
    [wishId, contextId]
  );

  if (!row) throw Object.assign(new Error('wish 또는 context 없음'), { status: 400 });

  const routeType = deriveRouteType({
    wishText:   row.wish_text,
    dateType:   row.date_type,
    peopleType: row.people_type,
  });

  // route_type 우선 검색, 없으면 같은 city_code에서 아무거나 1개
  let product = await fetchTopProduct(row.city_code, routeType);
  if (!product) product = await fetchTopProduct(row.city_code, null);
  if (!product) throw Object.assign(new Error(`${row.city_code} 지역 활성 상품 없음`), { status: 404 });

  const reason = buildReason({ routeType, dateType: row.date_type, peopleType: row.people_type });

  return { product, routeType, reason };
}

async function fetchTopProduct(cityCode, routeType) {
  const params = [cityCode];
  const extra  = routeType ? `AND route_type = $${params.push(routeType)}` : '';
  const { rows: [p] } = await db.query(
    `SELECT id, product_code, city_code, route_type, title, price AS base_price,
            tag, benefit_types, display_order
     FROM dt_products
     WHERE city_code = $1 AND is_active = true ${extra}
     ORDER BY display_order ASC
     LIMIT 1`,
    params
  );
  return p ?? null;
}

function buildReason({ routeType, dateType, peopleType }) {
  const map = {
    flow:      '지금 상태에 가장 잘 맞는 여유로운 여정이에요',
    expand:    '특별한 기억을 만들기 좋은 감성 여정이에요',
    resonance: '새로운 도전을 응원하는 여정이에요',
    miracle:   '소중한 순간을 완성해 줄 프리미엄 여정이에요',
  };
  return map[routeType] ?? '지금 상태에 가장 잘 맞는 여정이에요';
}

module.exports = { recommend, deriveRouteType };
