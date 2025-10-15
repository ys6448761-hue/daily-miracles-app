/**
 * 🎯 Smart Router
 *
 * 워크플로우를 지능적으로 분석하고 최적 경로로 실행
 *
 * 기능:
 * - 의도 파악 및 워크플로우 자동 선택
 * - 동적 라우팅 및 경로 조정
 * - 병렬 처리 자동화
 * - 조건부 실행
 * - 우선순위 관리
 */

const { info, error: logError } = require('../../config/logger');

class SmartRouter {
  constructor(config = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 5,
      timeout: config.timeout || 300000, // 5분
      retries: config.retries || 3,
      ...config
    };

    this.routes = new Map();
    this.activeExecutions = new Set();
  }

  /**
   * 라우트 등록
   * @param {string} name - 라우트 이름
   * @param {Object} workflow - 워크플로우 정의
   */
  registerRoute(name, workflow) {
    this.routes.set(name, workflow);
    info(`라우트 등록: ${name}`, {
      steps: workflow.steps.length,
      parallel: workflow.steps.filter(s => s.parallel).length
    });
  }

  /**
   * 워크플로우 실행
   * @param {Object} workflow - 실행할 워크플로우
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 실행 결과
   */
  async execute(workflow, context) {
    const executionId = this.generateExecutionId();
    this.activeExecutions.add(executionId);

    info(`워크플로우 실행: ${workflow.name}`, {
      executionId,
      steps: workflow.steps.length
    });

    try {
      // 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout: ${workflow.name}`)),
          this.config.timeout
        )
      );

      // 워크플로우 실행
      const executionPromise = this.executeSteps(workflow.steps, context);

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      info(`✅ 워크플로우 완료: ${workflow.name}`, { executionId });

      return result;
    } catch (error) {
      logError(`❌ 워크플로우 실패: ${workflow.name}`, {
        executionId,
        error: error.message
      });
      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * 단계별 실행
   * @param {Array} steps - 실행할 단계들
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 실행 결과
   */
  async executeSteps(steps, context) {
    const results = {};

    // 순차 실행 단계와 병렬 실행 단계 구분
    const sequentialSteps = steps.filter(step => !step.parallel);
    const parallelSteps = steps.filter(step => step.parallel);

    // 1. 순차 실행
    for (const step of sequentialSteps) {
      info(`단계 실행: ${step.name}`, { contextId: context.id });

      try {
        const startTime = Date.now();
        const result = await this.executeStep(step, context);
        const duration = Date.now() - startTime;

        results[step.name] = result;

        // 컨텍스트에 결과 저장
        await context.set(step.name, result);

        info(`✅ 단계 완료: ${step.name}`, {
          contextId: context.id,
          duration: `${duration}ms`
        });
      } catch (error) {
        logError(`❌ 단계 실패: ${step.name}`, {
          contextId: context.id,
          error: error.message
        });

        // 실패 시 retry 로직
        if (step.retry && this.config.retries > 0) {
          info(`재시도: ${step.name}`, {
            contextId: context.id,
            attempt: 1
          });

          const retryResult = await this.retryStep(
            step,
            context,
            this.config.retries
          );

          results[step.name] = retryResult;
        } else {
          throw error;
        }
      }
    }

    // 2. 병렬 실행
    if (parallelSteps.length > 0) {
      info(`병렬 단계 실행: ${parallelSteps.length}개`, {
        contextId: context.id,
        steps: parallelSteps.map(s => s.name)
      });

      const parallelResults = await this.executeParallel(
        parallelSteps,
        context
      );

      Object.assign(results, parallelResults);
    }

    return results;
  }

  /**
   * 단일 단계 실행
   * @param {Object} step - 실행할 단계
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<*>} 실행 결과
   */
  async executeStep(step, context) {
    // 조건부 실행 체크
    if (step.condition) {
      const shouldExecute = await step.condition(context);
      if (!shouldExecute) {
        info(`단계 스킵: ${step.name}`, { reason: 'condition not met' });
        return { skipped: true };
      }
    }

    // 핸들러 실행
    return await step.handler(context);
  }

  /**
   * 병렬 실행
   * @param {Array} steps - 병렬 실행할 단계들
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 실행 결과들
   */
  async executeParallel(steps, context) {
    const startTime = Date.now();

    // 동시 실행 수 제한
    const chunks = this.chunkArray(steps, this.config.maxConcurrent);
    const allResults = {};

    for (const chunk of chunks) {
      const promises = chunk.map(async step => {
        try {
          const result = await this.executeStep(step, context);
          await context.set(step.name, result);
          return { name: step.name, result, success: true };
        } catch (error) {
          logError(`병렬 단계 실패: ${step.name}`, {
            error: error.message
          });
          return { name: step.name, error: error.message, success: false };
        }
      });

      const chunkResults = await Promise.all(promises);

      chunkResults.forEach(({ name, result, error, success }) => {
        allResults[name] = success ? result : { error };
      });
    }

    const duration = Date.now() - startTime;
    info(`✅ 병렬 실행 완료: ${steps.length}개`, {
      contextId: context.id,
      duration: `${duration}ms`
    });

    return allResults;
  }

  /**
   * 단계 재시도
   * @param {Object} step - 재시도할 단계
   * @param {Object} context - 실행 컨텍스트
   * @param {number} maxRetries - 최대 재시도 횟수
   * @returns {Promise<*>} 실행 결과
   */
  async retryStep(step, context, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        info(`재시도 ${attempt}/${maxRetries}: ${step.name}`);

        // 지수 백오프 (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await this.delay(delay);

        const result = await this.executeStep(step, context);
        info(`✅ 재시도 성공: ${step.name}`, { attempt });
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          logError(`재시도 실패: ${step.name}`, {
            attempts: maxRetries,
            error: error.message
          });
          throw error;
        }
      }
    }
  }

  /**
   * 활성 실행 수 확인
   * @returns {number} 현재 실행 중인 워크플로우 수
   */
  getActiveCount() {
    return this.activeExecutions.size;
  }

  /**
   * 유틸리티: 배열 청크로 나누기
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 유틸리티: 지연
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 유틸리티: 실행 ID 생성
   */
  generateExecutionId() {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = SmartRouter;
