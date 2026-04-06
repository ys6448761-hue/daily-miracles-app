'use strict';

/**
 * starLocationService.js
 *
 * wish_id 기반 결정론적 별 위치 할당 서비스.
 *
 * 절대 규칙:
 *   ❌ 랜덤 사용 금지
 *   ❌ AI 호출 금지
 *   ❌ 시간 기반 값 금지
 *   ✅ 오직 wish_id 기반 결정
 *
 * 보장:
 *   동일 wish_id → 항상 동일 zone / slot / 좌표
 *   slot 충돌 → linear probing (UNIQUE(zone_code, slot_number) 준수)
 *   zone 추가 시 기존 별 위치 불변 (ON CONFLICT star_id DO NOTHING)
 */

const crypto = require('crypto');

/**
 * wish_id (UUID) → uint32 해시
 * MD5 앞 8자리 hex → base-16 정수
 * @param {string} wishId
 * @returns {number} 0 이상 정수
 */
function hashFunction(input) {
  return parseInt(
    crypto.createHash('md5').update(input).digest('hex').substring(0, 8),
    16
  );
}

/**
 * 활성 zone 목록 조회 (SSOT: star_zones 테이블)
 * 코드 내 하드코딩 금지 — zone 추가는 DB INSERT만으로 반영
 * @param {object} db
 * @returns {Array<{zone_code, lat, lng}>}
 */
async function getActiveZones(db) {
  const result = await db.query(`
    SELECT zone_code, lat, lng
      FROM star_zones
     WHERE is_active = true
     ORDER BY zone_code
  `);

  if (!result.rows.length) {
    throw new Error('No active star zones — migration 051 + 054 적용 필요');
  }

  return result.rows;
}

/**
 * 별 생성 시 위치를 자동 할당한다.
 *
 * @param {object} db
 * @param {string} star_id   dt_stars.id (UUID)
 * @param {string} wish_id   dt_wishes.id (UUID)
 */
async function createStarLocation(db, star_id, wish_id) {
  const zones = await getActiveZones(db);
  const hash  = hashFunction(wish_id);

  // 1. zone 결정 (활성 zone 수 기준 — 확장 시 자동 반영)
  const zone = zones[hash % zones.length];

  // 2. slot 결정 + linear probing (충돌 방지)
  let slot = (hash >> 8) % 1000;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const check = await db.query(
      'SELECT 1 FROM star_locations WHERE zone_code = $1 AND slot_number = $2',
      [zone.zone_code, slot]
    );
    if (!check.rows.length) break;
    slot = (slot + 1) % 1000;
  }

  // 3. 미세 좌표 오프셋 (wish_id 기반, ±0.0005° 이내)
  const offsetLat = ((hash % 100) - 50) * 0.00001;
  const offsetLng = (((hash >> 8) % 100) - 50) * 0.00001;
  const finalLat  = parseFloat(zone.lat) + offsetLat;
  const finalLng  = parseFloat(zone.lng) + offsetLng;

  // 4. INSERT (star_id UNIQUE → 이중 생성 방지)
  await db.query(
    `INSERT INTO star_locations (star_id, zone_code, slot_number, lat, lng)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (star_id) DO NOTHING`,
    [star_id, zone.zone_code, slot, finalLat, finalLng]
  );
}

module.exports = { createStarLocation, hashFunction, getActiveZones };
