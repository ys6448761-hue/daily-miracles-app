/**
 * Experience Identity Model
 * 소원그림 생성 시 고객의 DreamTown Experience 자격을 명시적으로 정의
 *
 * 설계 원칙:
 * - 향후 DB 영속화를 전제
 * - 요청·로그에서 완전히 추적 가능
 * - Payment와의 느슨한 결합 (order_id로 검증만 함)
 */

const ExperienceType = {
  STARLIGHT_ROUTE: 'STARLIGHT_ROUTE',        // 기본 여행 플래닝
  AQUA_ADDON: 'AQUA_ADDON',                  // 아쿠아플라넷 추가 경험
  CABLECAR_TICKET: 'CABLECAR_TICKET',        // 해상케이블카 탑승권
  CRUISE_TICKET: 'CRUISE_TICKET',            // 크루즈 예약권
  CABLECAR_PHOTO_EXPERIENCE: 'CABLECAR_PHOTO_EXPERIENCE' // 향후: 케이블카 포토존
};

const ExperienceSource = {
  PURCHASE: 'PURCHASE',                      // 유료 구매
  GIFT: 'GIFT',                              // 선물/증정
  PARTNERSHIP: 'PARTNERSHIP',                // 파트너십
  SYSTEM_DEFAULT: 'SYSTEM_DEFAULT'           // 시스템 기본값
};

/**
 * Experience 객체 스키마
 * @typedef {Object} ExperienceCredential
 * @property {string} type - ExperienceType 중 하나
 * @property {string} source - ExperienceSource 중 하나
 * @property {string} [order_id] - NicePay order_id (PURCHASE인 경우 필수)
 * @property {string} [acquired_at] - ISO8601 timestamp
 * @property {Object} [metadata] - 향후 확장용
 */

/**
 * Experience 검증 스키마
 */
const ExperienceSchema = {
  type: (val) => Object.values(ExperienceType).includes(val),
  source: (val) => Object.values(ExperienceSource).includes(val),
  order_id: (val) => typeof val === 'string' && val.length > 0,
  acquired_at: (val) => !val || /^\d{4}-\d{2}-\d{2}T/.test(val)
};

/**
 * Experience Priority (Scene 결정 시 사용)
 * 숫자가 높을수록 우선
 */
const ExperiencePriority = {
  [ExperienceType.CABLECAR_PHOTO_EXPERIENCE]: 5,  // 미래 최고 우선
  [ExperienceType.CABLECAR_TICKET]: 4,
  [ExperienceType.AQUA_ADDON]: 3,
  [ExperienceType.CRUISE_TICKET]: 2,
  [ExperienceType.STARLIGHT_ROUTE]: 1
};

/**
 * Experience → Scene 매핑
 * YEOSU_ORIGIN은 기본값으로만 사용
 */
const ExperienceToScene = {
  [ExperienceType.CABLECAR_PHOTO_EXPERIENCE]: 'CABLECAR_PHOTO_SCENE',
  [ExperienceType.CABLECAR_TICKET]: 'CABLECAR_SCENE',
  [ExperienceType.AQUA_ADDON]: 'AQUA_SCENE',
  [ExperienceType.CRUISE_TICKET]: 'CRUISE_SCENE',
  [ExperienceType.STARLIGHT_ROUTE]: 'YEOSU_ORIGIN'
};

/**
 * SKU → 기본 Experience 매핑
 * yeosu_wishes.sku에서 SYSTEM_DEFAULT 자격 결정
 */
const SKUToDefaultExperience = {
  'FREE': ExperienceType.STARLIGHT_ROUTE,
  'YW_BASIC_7': ExperienceType.STARLIGHT_ROUTE,
  'YW_PREMIUM_30': ExperienceType.STARLIGHT_ROUTE
};

module.exports = {
  ExperienceType,
  ExperienceSource,
  ExperienceSchema,
  ExperiencePriority,
  ExperienceToScene,
  SKUToDefaultExperience
};
