/**
 * RetryManager — 재시도/백오프 관리
 * AIL-2026-0219-VID-003
 *
 * 사용법:
 *   const result = await RetryManager.withRetry(
 *     () => callOpenAI(),
 *     RETRY_POLICIES.OPENAI_RUNWAY_NETWORK,
 *     { label: 'DALL-E 3 keyframe' }
 *   );
 */

const { RETRYABLE_ERROR_CODES } = require('./constants');

class RetryManager {
  /**
   * 재시도 가능 에러인지 판별
   */
  static isRetryable(error) {
    const msg = (error.message || '').toLowerCase();
    const code = error.code || '';
    const status = String(error.status || error.statusCode || '');

    return RETRYABLE_ERROR_CODES.some(rc => {
      const rcLower = rc.toLowerCase();
      return msg.includes(rcLower) || code === rc || status === rc;
    });
  }

  /**
   * 지연 시간 계산 (ms)
   */
  static calculateDelay(attempt, policy) {
    if (policy.strategy === 'exponential') {
      return policy.baseDelay * Math.pow(2, attempt);
    }
    // linear
    return policy.baseDelay * (attempt + 1);
  }

  /**
   * 비동기 sleep
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 재시도 래퍼
   * @param {Function} fn - 실행할 비동기 함수
   * @param {Object} policy - RETRY_POLICIES 중 하나
   * @param {Object} context - 로깅용 컨텍스트
   * @returns {{ success: boolean, result: any, attempts: number, lastError: Error|null }}
   */
  static async withRetry(fn, policy, context = {}) {
    const label = context.label || 'operation';
    const maxRetries = policy.maxRetries || 0;

    // 재시도 금지 정책 (Validator)
    if (maxRetries === 0) {
      try {
        const result = await fn();
        return { success: true, result, attempts: 1, lastError: null };
      } catch (error) {
        return {
          success: false,
          result: null,
          attempts: 1,
          lastError: error,
          rollbackTo: policy.rollbackTo || null,
        };
      }
    }

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        if (attempt > 0) {
          console.log(`  ✅ [RetryManager] ${label} 성공 (시도 ${attempt + 1}/${maxRetries + 1})`);
        }
        return { success: true, result, attempts: attempt + 1, lastError: null };
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries && RetryManager.isRetryable(error)) {
          const delay = RetryManager.calculateDelay(attempt, policy);
          console.log(
            `  🔄 [RetryManager] ${label} 실패 (시도 ${attempt + 1}/${maxRetries + 1}), ` +
            `${delay}ms 후 재시도: ${error.message}`
          );
          await RetryManager.sleep(delay);
        } else if (attempt < maxRetries && !RetryManager.isRetryable(error)) {
          // 재시도 불가 에러 → 즉시 중단
          console.log(
            `  ❌ [RetryManager] ${label} 재시도 불가 에러: ${error.message}`
          );
          break;
        }
      }
    }

    return {
      success: false,
      result: null,
      attempts: maxRetries + 1,
      lastError,
      rollbackTo: policy.rollbackTo || null,
    };
  }
}

module.exports = RetryManager;
