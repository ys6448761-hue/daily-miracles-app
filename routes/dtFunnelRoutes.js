/**
 * dtFunnelRoutes.js — DreamTown 핵심 퍼널
 *
 * POST /api/dt/funnel/wish            소원 생성 (dt_wishes 재사용)
 * POST /api/dt/funnel/context         날짜/인원 컨텍스트 저장
 * POST /api/dt/funnel/recommendation  추천 생성 (wish + context → 상품 2개)
 * POST /api/dt/funnel/star            CTA 클릭 → 별 생성 (dt_stars 재사용)
 * POST /api/dt/funnel/event           로그 이벤트 기록
 *
 * 추천 정책 우선순위:
 *   1. people_type (family → family 항로)
 *   2. date_type  (today/this_week → weekday 선호)
 *   3. wish 키워드 (힐링/데이트/도전 등)
 *   4. fallback   → weekday 항로
 */

'use strict';

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const db      = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtFunnel');

// ── 추천 카탈로그 (v1 하드코딩, 항로별 최대 2개) ──────────────────────
const PRODUCTS = {
  weekday: [
    { product_id: 'wp_cable_cruise', title: '케이블카 + 유람선', price: 25000, tag: 'best',
      benefit_types: ['cablecar', 'cruise'] },
    { product_id: 'wp_aqua',         title: '아쿠아플라넷',        price: 32000, tag: null,
      benefit_types: ['aqua'] },
  ],
  starlit: [
    { product_id: 'sp_fireworks_bundle', title: '불꽃유람선 + 요트', price: 60000, tag: 'best',
      benefit_types: ['fireworks_cruise', 'yacht'] },
    { product_id: 'sp_fireworks_cruise', title: '불꽃유람선',        price: 35000, tag: null,
      benefit_types: ['fireworks_cruise'] },
  ],
  family: [
    { product_id: 'fp_aqua_cable',  title: '아쿠아플라넷 + 케이블카', price: 44000, tag: 'best',
      benefit_types: ['aqua', 'cablecar'] },
    { product_id: 'fp_yeosu3pass',  title: '여수3합 패스',           price: 15000, tag: 'popular',
      benefit_types: ['yeosu3pass'] },
  ],
  challenge: [
    { product_id: 'cp_yacht',           title: '요트 체험',  price: 35000, tag: 'best',
      benefit_types: ['yacht'] },
    { product_id: 'cp_fireworks_yacht', title: '불꽃요트',   price: 55000, tag: null,
      benefit_types: ['fireworks_yacht'] },
  ],
};

const ROUTE_GALAXY = {
  weekday:   'healing',
  starlit:   'relation',
  family:    'healing',
  challenge: 'challenge',
};

const ROUTE_LABEL = {
  weekday:   '주중 항로',
  starlit:   '별빛 항로',
  family:    '패밀리 항로',
  challenge: '도전 항로',
};

// 소원 키워드 → 항로 매핑
const KEYWORD_RULES = [
  { words: ['쉬', '편', '힐링', '회복', '조용', '느긋', '혼자'],         route: 'weekday'   },
  { words: ['특별', '기억', '데이트', '연인', '낭만', '설레', '로맨'],    route: 'starlit'   },
  { words: ['가족', '아이', '어린이', '부모', '아들', '딸', '자녀'],      route: 'family'    },
  { words: ['도전', '용기', '새로운', '성장', '배움', '짜릿', '모험'],    route: 'challenge' },
];

// ── 추천 로직 ─────────────────────────────────────────────────────────
function recommend(wishText = '', dateType = '', peopleType = '') {
  // 1. people_type 강제 분기
  if (peopleType === 'family') return 'family';
  if (peopleType === 'solo')   return dateType === 'today' || dateType === 'this_week'
    ? 'weekday' : 'challenge';

  // 2. 키워드 분석 (첫 매칭 사용)
  const lower = wishText.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.words.some(w => lower.includes(w))) return rule.route;
  }

  // 3. date_type 분기
  if (dateType === 'today' || dateType === 'this_week') return 'weekday';
  if (peopleType === 'couple') return 'starlit';

  // 4. fallback
  return 'weekday';
}

// ── POST /wish ────────────────────────────────────────────────────────
// Body: { wish_text, gem_type }
router.post('/wish', async (req, res) => {
  const { wish_text, gem_type } = req.body ?? {};
  if (!wish_text?.trim()) return res.status(400).json({ error: 'wish_text 필요' });

  const GEM_GALAXY = {
    ruby: 'challenge', sapphire: 'growth', emerald: 'healing',
    diamond: 'miracle', citrine: 'relation',
  };
  const galaxy_code = GEM_GALAXY[gem_type] ?? 'healing';

  try {
    // dt_wishes 실제 스키마: wish_text, gem_type, status
    // galaxy_code 컬럼 없음 → gem_type으로 역산하여 응답에만 포함
    const { rows: [row] } = await db.query(
      `INSERT INTO dt_wishes (wish_text, gem_type, status)
       VALUES ($1, $2, 'submitted')
       RETURNING id, wish_text, gem_type, status, created_at`,
      [wish_text.trim(), gem_type ?? null]
    );

    res.status(201).json({ ok: true, wish_id: row.id, galaxy_code, ...row });
  } catch (err) {
    log.error('wish 생성 실패', { err: err.message });
    res.status(500).json({ error: '소원 저장에 실패했습니다' });
  }
});

// ── POST /context ─────────────────────────────────────────────────────
// Body: { wish_id, date_type, people_type }
router.post('/context', async (req, res) => {
  const { wish_id, date_type, people_type } = req.body ?? {};
  if (!date_type || !people_type) {
    return res.status(400).json({ error: 'date_type, people_type 필요' });
  }

  try {
    const { rows: [row] } = await db.query(
      `INSERT INTO dt_funnel_contexts (wish_id, date_type, people_type)
       VALUES ($1, $2, $3)
       RETURNING id, wish_id, date_type, people_type`,
      [wish_id ?? null, date_type, people_type]
    );
    res.status(201).json({ ok: true, context_id: row.id, ...row });
  } catch (err) {
    log.error('context 생성 실패', { err: err.message });
    res.status(500).json({ error: '컨텍스트 저장에 실패했습니다' });
  }
});

// ── POST /recommendation ──────────────────────────────────────────────
// Body: { wish_id, context_id }
router.post('/recommendation', async (req, res) => {
  const { wish_id, context_id } = req.body ?? {};

  try {
    // wish 텍스트 조회 (없으면 빈 문자열로 fallback)
    let wishText = '', gemType = '', galaxyCode = '';
    if (wish_id) {
      const wr = await db.query(
        `SELECT wish_text, gem_type FROM dt_wishes WHERE id = $1 LIMIT 1`,
        [wish_id]
      ).catch(() => ({ rows: [] }));
      if (wr.rows[0]) {
        wishText = wr.rows[0].wish_text ?? '';
        gemType  = wr.rows[0].gem_type  ?? '';
        // galaxy_code는 gem_type으로 역산
        const GEM_GALAXY2 = { ruby:'challenge', sapphire:'growth', emerald:'healing', diamond:'miracle', citrine:'relation' };
        galaxyCode = GEM_GALAXY2[gemType] ?? '';
      }
    }

    // context 조회
    let dateType = '', peopleType = '';
    if (context_id) {
      const cr = await db.query(
        `SELECT date_type, people_type FROM dt_funnel_contexts WHERE id = $1 LIMIT 1`,
        [context_id]
      ).catch(() => ({ rows: [] }));
      if (cr.rows[0]) {
        dateType   = cr.rows[0].date_type   ?? '';
        peopleType = cr.rows[0].people_type ?? '';
      }
    }

    // gem_type → 항로 힌트 보완
    const GEM_ROUTE_HINT = {
      ruby: 'challenge', sapphire: 'weekday', emerald: 'weekday',
      diamond: 'starlit', citrine: 'starlit',
    };
    const gemHint = GEM_ROUTE_HINT[gemType] ?? '';

    // 추천 결정 (키워드 + context가 없으면 gemHint fallback)
    let routeCode = recommend(wishText, dateType, peopleType);
    if (routeCode === 'weekday' && gemHint && gemHint !== 'weekday') {
      // gem 힌트가 더 강한 신호면 반영
      routeCode = gemHint;
    }

    const products = PRODUCTS[routeCode] ?? PRODUCTS.weekday;

    // view_recommendation 이벤트 기록
    db.query(
      `INSERT INTO dt_funnel_events (wish_id, context_id, event_name, route_code)
       VALUES ($1, $2, 'view_recommendation', $3)`,
      [wish_id ?? null, context_id ?? null, routeCode]
    ).catch(() => {});

    log.info('추천 생성', { wish_id, routeCode, peopleType, dateType });

    res.json({
      ok: true,
      recommended_route: routeCode,
      route_label:       ROUTE_LABEL[routeCode] ?? routeCode,
      galaxy_code:       ROUTE_GALAXY[routeCode] ?? galaxyCode,
      recommended_products: products,
    });

  } catch (err) {
    log.error('recommendation 실패', { err: err.message });
    res.status(500).json({ error: '추천 생성에 실패했습니다' });
  }
});

// ── POST /star — CTA 클릭 → 별 생성 ────────────────────────────────
// Body: { wish_id, product_id, route_code?, context_id? }
router.post('/star', async (req, res) => {
  const { wish_id, product_id, route_code, context_id } = req.body ?? {};
  if (!wish_id) return res.status(400).json({ error: 'wish_id 필요' });

  try {
    // wish 조회 → galaxy_code 확보
    let galaxyCode = 'healing', gemType = null, wishText = '';
    const wr = await db.query(
      `SELECT wish_text, gem_type FROM dt_wishes WHERE id = $1`,
      [wish_id]
    ).catch(() => ({ rows: [] }));
    if (wr.rows[0]) {
      const GEM_GALAXY2 = { ruby:'challenge', sapphire:'growth', emerald:'healing', diamond:'miracle', citrine:'relation' };
      gemType    = wr.rows[0].gem_type;
      galaxyCode = GEM_GALAXY2[gemType] ?? 'healing';
      wishText   = wr.rows[0].wish_text ?? '';
    }

    // route_code → galaxy_code 보완
    if (route_code && ROUTE_GALAXY[route_code]) {
      galaxyCode = ROUTE_GALAXY[route_code];
    }

    // click_cta + create_star 이벤트 기록
    db.query(
      `INSERT INTO dt_funnel_events (wish_id, context_id, event_name, route_code, product_id)
       VALUES ($1, $2, 'click_cta', $3, $4)`,
      [wish_id, context_id ?? null, route_code ?? null, product_id ?? null]
    ).catch(() => {});

    // dt_stars 생성
    // 별 이름: 소원 첫 단어 + 랜덤 접미사 (간단 v1)
    const starSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const starName   = `${wishText.slice(0, 4) || '소원'}의 별 ${starSuffix}`;

    // dt_stars 컬럼: galaxy_id(UUID FK, nullable), emotion_tag(varchar) 사용
    // galaxy_code는 emotion_tag에 기록 (galaxy_id는 별도 galaxies 테이블 FK라 null 처리)
    const { rows: [star] } = await db.query(
      `INSERT INTO dt_stars
         (wish_id, star_name, star_stage, emotion_tag)
       VALUES ($1, $2, 'day1', $3)
       RETURNING id, star_name, star_stage, emotion_tag, created_at`,
      [wish_id, starName, galaxyCode]
    );

    // wish 상태 → converted_to_star
    db.query(
      `UPDATE dt_wishes SET status = 'converted_to_star', updated_at = NOW() WHERE id = $1`,
      [wish_id]
    ).catch(() => {});

    // create_star 이벤트
    db.query(
      `INSERT INTO dt_funnel_events (wish_id, context_id, event_name, route_code, product_id)
       VALUES ($1, $2, 'create_star', $3, $4)`,
      [wish_id, context_id ?? null, route_code ?? null, product_id ?? null]
    ).catch(() => {});

    log.info('별 생성', { wish_id, star_id: star.id, galaxyCode });

    res.status(201).json({
      ok:          true,
      star_id:     star.id,
      star_name:   star.star_name,
      galaxy_type: star.emotion_tag,   // emotion_tag에 galaxy_code 기록
      gem_type:    gemType,
      created_at:  star.created_at,
    });

  } catch (err) {
    log.error('star 생성 실패', { err: err.message });
    res.status(500).json({ error: '별 생성에 실패했습니다' });
  }
});

// ── POST /event ───────────────────────────────────────────────────────
// Body: { wish_id, context_id?, event_name, route_code?, product_id? }
router.post('/event', async (req, res) => {
  const { wish_id, context_id, event_name, route_code, product_id } = req.body ?? {};
  const ALLOWED = ['view_recommendation', 'click_cta', 'create_star'];
  if (!ALLOWED.includes(event_name)) {
    return res.status(400).json({ error: `허용되지 않은 event_name: ${event_name}` });
  }
  try {
    await db.query(
      `INSERT INTO dt_funnel_events
         (wish_id, context_id, event_name, route_code, product_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [wish_id ?? null, context_id ?? null, event_name, route_code ?? null, product_id ?? null]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '이벤트 저장 실패' });
  }
});

module.exports = router;
