/**
 * Experience Validator
 * API 요청에서 전달된 experiences 배열 검증
 * - 스키마 검증
 * - order_id ↔ payment 검증 (DB 조회)
 * - 향후 DB 저장 전제로 설계
 */

const { ExperienceSchema, ExperienceSource } = require('../config/experienceIdentity');

let db = null;
try {
  db = require('../database/db');
} catch (err) {
  console.warn('[ExperienceValidator] DB 로드 실패:', err.message);
}

/**
 * Experience 객체 구조 검증 (스키마)
 * @param {Object} exp - Experience 객체
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateExperienceSchema(exp) {
  const errors = [];

  if (!exp || typeof exp !== 'object') {
    return { valid: false, errors: ['Experience is not an object'] };
  }

  if (!exp.type) {
    errors.push('type is required');
  } else if (!ExperienceSchema.type(exp.type)) {
    errors.push(`type "${exp.type}" is not valid`);
  }

  if (!exp.source) {
    errors.push('source is required');
  } else if (!ExperienceSchema.source(exp.source)) {
    errors.push(`source "${exp.source}" is not valid`);
  }

  // PURCHASE 소스의 경우 order_id 필수
  if (exp.source === ExperienceSource.PURCHASE) {
    if (!exp.order_id) {
      errors.push('order_id is required for PURCHASE source');
    } else if (!ExperienceSchema.order_id(exp.order_id)) {
      errors.push('order_id is invalid (must be non-empty string)');
    }
  }

  // acquired_at은 선택사항이지만 ISO8601 형식 체크
  if (exp.acquired_at && !ExperienceSchema.acquired_at(exp.acquired_at)) {
    errors.push('acquired_at is not ISO8601 format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 모든 experiences 배열 검증
 * @param {Array} experiences - Experience 객체 배열
 * @param {string} [requestId] - 로깅용 request ID
 * @returns {Promise<Object>} { valid: boolean, errors: string[], validated: Array }
 */
async function validateExperiences(experiences, requestId = 'unknown') {
  const rid = requestId;
  const allErrors = [];
  const validated = [];

  // 입력 검증
  if (!Array.isArray(experiences)) {
    console.warn(`[ExperienceValidator] [${rid}] experiences is not an array`);
    return {
      valid: false,
      errors: ['experiences must be an array'],
      validated: []
    };
  }

  if (experiences.length === 0) {
    console.log(`[ExperienceValidator] [${rid}] empty experiences array (valid, will use defaults)`);
    return {
      valid: true,
      errors: [],
      validated: []
    };
  }

  // 각 experience 검증
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const schemaResult = validateExperienceSchema(exp);

    if (!schemaResult.valid) {
      schemaResult.errors.forEach(err => {
        allErrors.push(`[${i}] ${err}`);
      });
      continue;
    }

    // PURCHASE 소스: order_id ↔ dt_payments 검증
    if (exp.source === ExperienceSource.PURCHASE) {
      try {
        if (!db) {
          throw new Error('DB not available');
        }

        const paymentResult = await db.query(
          'SELECT id, status, amount FROM dt_payments WHERE order_id = $1 LIMIT 1',
          [exp.order_id]
        );

        if (paymentResult.rows.length === 0) {
          allErrors.push(`[${i}] order_id "${exp.order_id}" not found in dt_payments`);
          continue;
        }

        const payment = paymentResult.rows[0];
        if (payment.status !== 'paid') {
          allErrors.push(`[${i}] order_id "${exp.order_id}" has status "${payment.status}" (expected "paid")`);
          continue;
        }

        console.log(
          `[ExperienceValidator] [${rid}] [${i}] Verified order_id=${exp.order_id}, amount=${payment.amount}`
        );

      } catch (dbError) {
        console.warn(
          `[ExperienceValidator] [${rid}] [${i}] DB check failed for order_id ${exp.order_id}:`,
          dbError.message
        );
        allErrors.push(`[${i}] Failed to verify order_id (DB error: ${dbError.message})`);
        continue;
      }
    }

    // 검증 통과
    validated.push(exp);
  }

  const isValid = allErrors.length === 0 && validated.length > 0;

  if (!isValid && allErrors.length > 0) {
    console.warn(`[ExperienceValidator] [${rid}] Validation errors: ${allErrors.join(', ')}`);
  }

  return {
    valid: isValid,
    errors: allErrors,
    validated
  };
}

/**
 * 요청 중 Experience Identity를 위해 사용할 기본값 생성
 * @param {string} sku - yeosu_wishes.sku 또는 product SKU
 * @param {string} source - SYSTEM_DEFAULT 등
 * @returns {Array} - Default experience array
 */
function getDefaultExperiences(sku, source = ExperienceSource.SYSTEM_DEFAULT) {
  const { SKUToDefaultExperience } = require('../config/experienceIdentity');
  const type = SKUToDefaultExperience[sku] || 'STARLIGHT_ROUTE';

  return [
    {
      type,
      source,
      acquired_at: new Date().toISOString()
    }
  ];
}

module.exports = {
  validateExperienceSchema,
  validateExperiences,
  getDefaultExperiences
};
