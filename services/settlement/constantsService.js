/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 정산 상수 서비스
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DB에서 상수 로드 및 메모리 캐싱
 * 런타임 변경 없이 코드 수정 불필요
 */

let db = null;

// 기본값 (DB 로드 실패 시 폴백)
const DEFAULT_CONSTANTS = {
  // 배분 비율 (Anchor 기준)
  PLATFORM_RATE: 0.55,
  CREATOR_POOL_RATE: 0.30,
  GROWTH_POOL_RATE: 0.10,
  RISK_POOL_RATE: 0.05,

  // 크리에이터 풀 내부
  CREATOR_ORIGINAL_RATE: 0.70,
  CREATOR_REMIX_RATE: 0.20,
  CREATOR_CURATION_RATE: 0.10,
  REMIX_MAX_DEPTH: 3,

  // 성장 풀 내부
  GROWTH_REFERRER_RATE: 0.07,
  GROWTH_CAMPAIGN_RATE: 0.03,

  // 정책
  HOLD_DAYS: 14,
  MIN_PAYOUT: 10000,
  MAX_MONTHLY_DEDUCTION_RATE: 0.10,

  // PG 수수료
  PG_FEE_RATE: 0.033,
};

// 메모리 캐시
let CONSTANTS = { ...DEFAULT_CONSTANTS };

// ═══════════════════════════════════════════════════════════════════════════
// DB에서 상수 로드
// ═══════════════════════════════════════════════════════════════════════════
async function loadConstants() {
  if (!db) {
    console.warn('[Settlement] DB 없음 - 기본 상수 사용');
    return CONSTANTS;
  }

  try {
    const result = await db.query('SELECT key, value FROM settlement_constants');

    result.rows.forEach(row => {
      const key = row.key.toUpperCase();
      const value = parseFloat(row.value);
      if (!isNaN(value)) {
        CONSTANTS[key] = value;
      }
    });

    console.log('[Settlement] 상수 로드 완료:', Object.keys(CONSTANTS).length + '개');
    return CONSTANTS;
  } catch (error) {
    console.error('[Settlement] 상수 로드 실패:', error.message);
    return DEFAULT_CONSTANTS;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수 조회
// ═══════════════════════════════════════════════════════════════════════════
function get(key) {
  return CONSTANTS[key.toUpperCase()] ?? DEFAULT_CONSTANTS[key.toUpperCase()];
}

function getAll() {
  return { ...CONSTANTS };
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수 업데이트 (관리자용)
// ═══════════════════════════════════════════════════════════════════════════
async function update(key, value, description = null) {
  if (!db) throw new Error('DB not initialized');

  const upperKey = key.toUpperCase();

  await db.query(`
    INSERT INTO settlement_constants (key, value, description, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      description = COALESCE(EXCLUDED.description, settlement_constants.description),
      updated_at = NOW()
  `, [upperKey, value, description]);

  // 캐시 업데이트
  CONSTANTS[upperKey] = parseFloat(value);

  return { key: upperKey, value: CONSTANTS[upperKey] };
}

module.exports = {
  init: (database) => { db = database; },
  loadConstants,
  get,
  getAll,
  update,
  DEFAULT: DEFAULT_CONSTANTS
};
