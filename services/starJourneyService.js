'use strict';

/**
 * starJourneyService.js — Star Journey 방문 동선 기록 + 별자리 달성 시스템
 *
 * recordVisitAndCheck(userId, partnerId, starId?)
 *   → 방문 기록 → 달성 체크 → 달성 시 쿠폰 발급 + 알림
 */

const crypto = require('crypto');
const db     = require('../database/db');

let sendSensSMS = null;
try { ({ sendSensSMS } = require('./messageProvider')); } catch (_) {}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 달성 조건 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ACHIEVEMENTS = {
  healing_constellation: {
    name:      '치유 별자리 달성',
    badge:     '🌿',
    galaxy:    'healing',
    reward:    '치유 은하 파트너 10% 할인 쿠폰',
    couponGalaxy: 'healing',
    discountPct: 10,
    validDays:   30,
    condition: (visits) => {
      const ids = [...new Set(
        visits.filter(v => v.galaxy_type === 'healing').map(v => v.partner_id)
      )];
      return ids.length >= 2;
    },
  },
  relationship_constellation: {
    name:      '관계 별자리 달성',
    badge:     '💫',
    galaxy:    'relationship',
    reward:    '관계 은하 파트너 10% 할인 쿠폰',
    couponGalaxy: 'relationship',
    discountPct: 10,
    validDays:   30,
    condition: (visits) => {
      const ids = [...new Set(
        visits.filter(v => v.galaxy_type === 'relationship').map(v => v.partner_id)
      )];
      return ids.length >= 2;
    },
  },
  challenge_constellation: {
    name:      '도전 별자리 달성',
    badge:     '⚡',
    galaxy:    'challenge',
    reward:    '도전 은하 파트너 10% 할인 쿠폰',
    couponGalaxy: 'challenge',
    discountPct: 10,
    validDays:   30,
    condition: (visits) => {
      const ids = [...new Set(
        visits.filter(v => v.galaxy_type === 'challenge').map(v => v.partner_id)
      )];
      return ids.length >= 2;
    },
  },
  growth_constellation: {
    name:      '성장 별자리 달성',
    badge:     '🌱',
    galaxy:    'growth',
    reward:    '성장 은하 파트너 10% 할인 쿠폰',
    couponGalaxy: 'growth',
    discountPct: 10,
    validDays:   30,
    condition: (visits) => {
      const ids = [...new Set(
        visits.filter(v => v.galaxy_type === 'growth').map(v => v.partner_id)
      )];
      return ids.length >= 2;
    },
  },
  island_expo_5spot: {
    name:      '2026 섬박람회 전설의 별',
    badge:     '✦',
    galaxy:    null,
    reward:    '2026 섬박람회 전설의 별 뱃지 영구 등재',
    couponGalaxy: null,       // 특별 배지만, 쿠폰 없음
    discountPct: 0,
    validDays:   0,
    condition: (visits) => {
      const ids = [...new Set(
        visits.filter(v => v.source_event === 'island_expo_2026').map(v => v.partner_id)
      )];
      return ids.length >= 5;
    },
  },
  yeosu_flagship_tour: {
    name:      '여수 Flagship 완주',
    badge:     '🌟',
    galaxy:    null,
    reward:    '여수 Flagship 파트너 VIP 쿠폰',
    couponGalaxy: null,       // 전 은하 사용
    discountPct: 15,
    validDays:   60,
    condition: (visits) => {
      const ids = [...new Set(
        visits.filter(v => v.partner_tier === 'flagship').map(v => v.partner_id)
      )];
      return ids.length >= 3;
    },
  },
  korea_explorer: {
    name:      '한국 별자리 탐험가',
    badge:     '🗺️',
    galaxy:    null,
    reward:    '전국 파트너 특별 혜택',
    couponGalaxy: null,
    discountPct: 10,
    validDays:   90,
    condition: (visits) => {
      const regions = [...new Set(visits.map(v => v.region_code))];
      return regions.length >= 3;
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 내부 헬퍼
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getPartnerInfo(partnerId) {
  const r = await db.query(`
    SELECT pa.login_id AS partner_id,
           pa.galaxy_type,
           pa.partner_tier,
           COALESCE(pa.region_code, 'KR_YEOSU') AS region_code
    FROM   partner_accounts pa
    WHERE  pa.login_id = $1
    LIMIT 1
  `, [partnerId]);
  return r.rows[0] || null;
}

async function getUserVisits(userId) {
  const r = await db.query(
    `SELECT partner_id, galaxy_type, partner_tier, region_code, source_event
     FROM   partner_visits
     WHERE  user_id = $1`,
    [userId]
  );
  return r.rows;
}

async function checkAlreadyAchieved(userId, achievementType) {
  const r = await db.query(
    `SELECT 1 FROM constellation_achievements
     WHERE user_id = $1 AND achievement_type = $2 LIMIT 1`,
    [userId, achievementType]
  );
  return r.rows.length > 0;
}

async function saveAchievement(userId, achType, ach) {
  await db.query(
    `INSERT INTO constellation_achievements
       (user_id, achievement_type, achievement_name, badge_emoji)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, achievement_type) DO NOTHING`,
    [userId, achType, ach.name, ach.badge]
  );
}

function generateCouponCode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase(); // 10자리
}

async function issueCoupon(userId, achType, ach) {
  if (!ach.discountPct || ach.discountPct === 0) return null;
  const code    = generateCouponCode();
  const expires = new Date(Date.now() + ach.validDays * 86400 * 1000);
  await db.query(
    `INSERT INTO journey_coupons
       (coupon_code, user_id, achievement_type, galaxy_type, discount_pct, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [code, userId, achType, ach.couponGalaxy, ach.discountPct, expires]
  );
  return code;
}

async function notifyUser(userId, achievements) {
  if (!sendSensSMS) return;
  try {
    const r = await db.query(
      `SELECT phone FROM dt_stars WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const phone = r.rows[0]?.phone;
    if (!phone) return;

    const lines = achievements.map(a => `${a.badge} ${a.name}`).join('\n');
    const text  = `[하루하루의 기적] 🌟 별자리 달성!\n${lines}\n파트너 혜택을 확인해보세요 ✨`;
    await sendSensSMS(phone, text);
  } catch (_) {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * QR 스캔 시 호출 — 방문 기록 + 달성 체크
 */
async function recordVisitAndCheck(userId, partnerId, starId = null) {
  const partner = await getPartnerInfo(partnerId);
  if (!partner) throw Object.assign(new Error('파트너를 찾을 수 없어요'), { status: 404 });

  // 1. 방문 기록 (중복 허용 — 재방문도 기록)
  await db.query(
    `INSERT INTO partner_visits
       (user_id, partner_id, galaxy_type, partner_tier, region_code, source_event, star_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      userId,
      partner.partner_id,
      partner.galaxy_type,
      partner.partner_tier,
      partner.region_code,
      'standard',   // source_event: expo 기간엔 expoStarService에서 덮어씀
      starId,
    ]
  );

  // 2. 전체 방문 기록 조회
  const visits = await getUserVisits(userId);

  // 3. 달성 체크 + 쿠폰 발급
  const newAchievements = [];
  for (const [key, ach] of Object.entries(ACHIEVEMENTS)) {
    const alreadyDone = await checkAlreadyAchieved(userId, key);
    if (!alreadyDone && ach.condition(visits)) {
      await saveAchievement(userId, key, ach);
      const couponCode = await issueCoupon(userId, key, ach);
      newAchievements.push({ ...ach, type: key, couponCode });
    }
  }

  // 4. 달성 알림 SMS
  if (newAchievements.length > 0) {
    await notifyUser(userId, newAchievements);
  }

  return {
    partner,
    totalVisits:     visits.length,
    uniquePartners:  [...new Set(visits.map(v => v.partner_id))].length,
    newAchievements,
  };
}

/**
 * 유저 여정 현황 조회
 */
async function getJourneySummary(userId) {
  const visits = await getUserVisits(userId);

  const r = await db.query(
    `SELECT achievement_type, achievement_name, badge_emoji, achieved_at
     FROM   constellation_achievements
     WHERE  user_id = $1
     ORDER  BY achieved_at DESC`,
    [userId]
  );

  const coupons = await db.query(
    `SELECT coupon_code, achievement_type, galaxy_type, discount_pct,
            expires_at, redeemed_at
     FROM   journey_coupons
     WHERE  user_id = $1 AND expires_at > NOW()
     ORDER  BY issued_at DESC`,
    [userId]
  );

  // 은하별 방문 집계
  const byGalaxy = {};
  for (const v of visits) {
    if (!byGalaxy[v.galaxy_type]) byGalaxy[v.galaxy_type] = new Set();
    byGalaxy[v.galaxy_type].add(v.partner_id);
  }

  const galaxyProgress = Object.entries(byGalaxy).map(([g, ids]) => ({
    galaxy_type:    g,
    unique_partners: ids.size,
    constellation:  ids.size >= 2,
  }));

  return {
    totalVisits:      visits.length,
    uniquePartners:   [...new Set(visits.map(v => v.partner_id))].length,
    galaxyProgress,
    achievements:     r.rows,
    activeCoupons:    coupons.rows.filter(c => !c.redeemed_at),
  };
}

/**
 * 쿠폰 발급 (수동 — 이미 달성한 항목 재발급)
 */
async function issueCouponManual(userId, achievementType) {
  const ach = ACHIEVEMENTS[achievementType];
  if (!ach) throw Object.assign(new Error('알 수 없는 달성 타입'), { status: 400 });
  const alreadyDone = await checkAlreadyAchieved(userId, achievementType);
  if (!alreadyDone) throw Object.assign(new Error('아직 달성하지 않은 항목이에요'), { status: 400 });
  const code = await issueCoupon(userId, achievementType, ach);
  return { couponCode: code, discountPct: ach.discountPct };
}

/**
 * 쿠폰 사용 처리 (파트너 어드민에서 호출)
 */
async function redeemCoupon(couponCode, partnerId) {
  const r = await db.query(
    `SELECT * FROM journey_coupons WHERE coupon_code = $1 LIMIT 1`,
    [couponCode]
  );
  const coupon = r.rows[0];
  if (!coupon)                      throw Object.assign(new Error('쿠폰을 찾을 수 없어요'), { status: 404 });
  if (coupon.redeemed_at)           throw Object.assign(new Error('이미 사용된 쿠폰이에요'), { status: 409 });
  if (new Date(coupon.expires_at) < new Date()) throw Object.assign(new Error('기간이 만료된 쿠폰이에요'), { status: 410 });

  // 은하 제한 체크
  if (coupon.galaxy_type) {
    const partnerR = await db.query(
      `SELECT galaxy_type FROM partner_accounts WHERE login_id = $1 LIMIT 1`,
      [partnerId]
    );
    const partnerGalaxy = partnerR.rows[0]?.galaxy_type;
    if (partnerGalaxy && partnerGalaxy !== coupon.galaxy_type) {
      throw Object.assign(new Error(`이 쿠폰은 ${coupon.galaxy_type} 은하 파트너에서만 사용 가능해요`), { status: 403 });
    }
  }

  await db.query(
    `UPDATE journey_coupons
     SET redeemed_at = NOW(), redeemed_by = $2
     WHERE coupon_code = $1`,
    [couponCode, partnerId]
  );

  return { discountPct: coupon.discount_pct, galaxyType: coupon.galaxy_type };
}

module.exports = {
  ACHIEVEMENTS,
  recordVisitAndCheck,
  getJourneySummary,
  issueCouponManual,
  redeemCoupon,
};
