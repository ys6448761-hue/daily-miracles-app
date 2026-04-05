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
 *   동일 wish_id → 항상 동일 zone / offset 계산
 *   slot 충돌 → linear probing (DB UNIQUE 제약 준수)
 */

const ZONES = [
  'S-1', 'S-2', 'S-3',
  'W-1', 'W-2', 'W-3',
  'N-1', 'N-2', 'N-3',
  'E-1', 'E-2', 'E-3',
];

/**
 * UUID 문자열 → 부호 없는 32비트 정수 해시 (djb2 변형)
 * 하이픈 제거 후 charCode 기반 순수 계산.
 * @param {string} wishId  UUID v4 string
 * @returns {number}       0 이상 정수
 */
function hashWishId(wishId) {
  const str = wishId.replace(/-/g, '');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  return hash;
}

/**
 * 별 생성 시 위치를 자동 할당한다.
 *
 * - 이미 할당된 경우(UNIQUE star_id 충돌) → 조용히 무시
 * - slot 충돌 → linear probing (최대 1000회)
 * - 실패해도 별 생성 롤백하지 않음 (호출부에서 try/catch)
 *
 * @param {object} db       pg client / pool
 * @param {object} params
 * @param {string} params.starId   dt_stars.id (UUID)
 * @param {string} params.wishId   dt_wishes.id (UUID)
 */
async function assignStarLocation(db, { starId, wishId }) {
  const hash = hashWishId(wishId);

  // 1. zone 결정
  const zoneCode = ZONES[hash % ZONES.length];

  // 2. zone 중심 좌표 조회
  const zoneResult = await db.query(
    'SELECT lat, lng FROM star_zones WHERE zone_code = $1',
    [zoneCode]
  );
  if (zoneResult.rowCount === 0) {
    throw new Error(`star_zones에 zone_code=${zoneCode} 없음 — migration 051 적용 필요`);
  }
  const zone = zoneResult.rows[0];

  // 3. slot 결정 (linear probing)
  let slot = (hash >>> 8) % 1000;
  let found = false;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const exists = await db.query(
      'SELECT 1 FROM star_locations WHERE zone_code = $1 AND slot_number = $2',
      [zoneCode, slot]
    );
    if (exists.rowCount === 0) { found = true; break; }
    slot = (slot + 1) % 1000;
  }
  if (!found) {
    throw new Error(`zone=${zoneCode} slot 1000개 모두 사용 중 — 확장 필요`);
  }

  // 4. 미세 좌표 오프셋 (wish_id 기반, ±0.0005° 범위)
  const offsetLat = ((hash % 100) - 50) * 0.00001;
  const offsetLng = (((hash >>> 8) % 100) - 50) * 0.00001;
  const finalLat  = parseFloat(zone.lat) + offsetLat;
  const finalLng  = parseFloat(zone.lng) + offsetLng;

  // 5. INSERT (star_id UNIQUE → 이중 생성 방지)
  await db.query(
    `INSERT INTO star_locations (star_id, zone_code, slot_number, lat, lng)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (star_id) DO NOTHING`,
    [starId, zoneCode, slot, finalLat, finalLng]
  );
}

module.exports = { assignStarLocation, hashWishId };
