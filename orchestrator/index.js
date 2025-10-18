/**
 * 🌟 Aurora 5 Orchestrator
 *
 * Smart Routing + Context Sharing + Health Monitoring
 *
 * Daily Miracles MVP의 지능형 워크플로우 오케스트레이션 시스템
 */

const SmartRouter = require('./router/SmartRouter');
const ContextManager = require('./context/ContextManager');
const HealthMonitor = require('./monitor/HealthMonitor');
const config = require('./config/orchestratorConfig');
const { info, error: logError } = require('../config/logger');

class Orchestrator {
  constructor(options = {}) {
    this.config = { ...config, ...options };

    // 컴포넌트 초기화
    this.router = new SmartRouter(this.config.routing);
    this.contextManager = new ContextManager(this.config.context);
    this.healthMonitor = new HealthMonitor(this.config.monitoring);

    // 상태
    this.workflows = new Map();
    this.isInitialized = false;

    info('Aurora 5 Orchestrator 초기화 시작', {
      monitoring: this.config.monitoring.enabled,
      contextSharing: this.config.context.enabled,
      autoRecovery: this.config.recovery.enabled
    });
  }

  /**
   * Orchestrator 초기화
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔧 [DEBUG] Orchestrator 컴포넌트 초기화 중...');
      info('Orchestrator 컴포넌트 초기화 중...');

      // 헬스 모니터 시작
      if (this.config.monitoring.enabled) {
        console.log('🔧 [DEBUG] 헬스 모니터 시작 중...');
        await this.healthMonitor.start();
        console.log('🔧 [DEBUG] 헬스 모니터 시작 완료');
        info('헬스 모니터 시작됨');
      }

      // 컨텍스트 매니저 초기화
      if (this.config.context.enabled) {
        console.log('🔧 [DEBUG] 컨텍스트 매니저 초기화 중...');
        await this.contextManager.initialize();
        console.log('🔧 [DEBUG] 컨텍스트 매니저 초기화 완료');
        info('컨텍스트 매니저 초기화 완료');
      }

      // 기본 워크플로우 등록
      console.log('🔧 [DEBUG] 워크플로우 등록 중...');
      await this.registerDefaultWorkflows();
      console.log('🔧 [DEBUG] 워크플로우 등록 완료');

      this.isInitialized = true;
      info('✅ Aurora 5 Orchestrator 초기화 완료');
      console.log('✅ [DEBUG] Aurora 5 Orchestrator 초기화 완료');
    } catch (error) {
      console.error('❌ [DEBUG] Orchestrator 초기화 실패:', error);
      logError('Orchestrator 초기화 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 기본 워크플로우 등록
   */
  async registerDefaultWorkflows() {
    const workflows = [
      require('./workflows/storyWorkflow'),
      require('./workflows/problemWorkflow'),
      require('./workflows/miracleWorkflow'),
      require('./workflows/dailyMiraclesWorkflow')
    ];

    for (const workflow of workflows) {
      this.registerWorkflow(workflow);
    }

    info(`${workflows.length}개 워크플로우 등록 완료`);
  }

  /**
   * 워크플로우 등록
   * @param {Object} workflow - 워크플로우 정의
   */
  registerWorkflow(workflow) {
    if (!workflow.name) {
      throw new Error('워크플로우 이름이 필요합니다');
    }

    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('워크플로우 steps가 필요합니다');
    }

    this.workflows.set(workflow.name, workflow);
    this.router.registerRoute(workflow.name, workflow);

    info(`워크플로우 등록됨: ${workflow.name}`, {
      steps: workflow.steps.length,
      parallel: workflow.steps.filter(s => s.parallel).length
    });
  }

  /**
   * 워크플로우 실행
   * @param {string} workflowName - 실행할 워크플로우 이름
   * @param {Object} input - 입력 데이터
   * @returns {Promise<Object>} 실행 결과
   */
  async execute(workflowName, input = {}) {
    const startTime = Date.now();

    // 워크플로우 확인
    if (!this.workflows.has(workflowName)) {
      throw new Error(`워크플로우를 찾을 수 없습니다: ${workflowName}`);
    }

    const workflow = this.workflows.get(workflowName);

    // 컨텍스트 생성
    const context = await this.contextManager.createContext({
      workflowName,
      input,
      timestamp: new Date().toISOString()
    });

    info(`워크플로우 실행 시작: ${workflowName}`, {
      contextId: context.id,
      input: Object.keys(input)
    });

    try {
      // Smart Router를 통한 실행
      const result = await this.router.execute(workflow, context);

      const duration = Date.now() - startTime;

      // 메트릭 기록
      await this.healthMonitor.recordMetric({
        workflow: workflowName,
        status: 'success',
        duration,
        timestamp: new Date()
      });

      // onComplete 콜백 실행
      if (workflow.onComplete) {
        await workflow.onComplete(result, context);
      }

      info(`✅ 워크플로우 완료: ${workflowName}`, {
        contextId: context.id,
        duration: `${duration}ms`
      });

      return {
        success: true,
        result,
        context: {
          id: context.id,
          duration
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      // 에러 메트릭 기록
      await this.healthMonitor.recordMetric({
        workflow: workflowName,
        status: 'error',
        error: error.message,
        duration,
        timestamp: new Date()
      });

      logError(`❌ 워크플로우 실패: ${workflowName}`, {
        contextId: context.id,
        error: error.message,
        duration: `${duration}ms`
      });

      // onError 콜백 실행
      if (workflow.onError) {
        const recovery = await workflow.onError(error, context);

        // 재시도 요청
        if (recovery?.retry && this.config.recovery.enabled) {
          info(`재시도 시도: ${workflowName}`, { delay: recovery.delay });

          if (recovery.delay) {
            await this.delay(recovery.delay);
          }

          return this.execute(workflowName, input);
        }
      }

      throw error;
    } finally {
      // 컨텍스트 정리 (TTL 후 자동 삭제)
      await this.contextManager.scheduleCleanup(context.id);
    }
  }

  /**
   * 헬스체크 실행
   * @returns {Promise<Object>} 헬스 상태
   */
  async checkHealth() {
    return await this.healthMonitor.checkHealth();
  }

  /**
   * 메트릭 조회
   * @returns {Promise<Object>} 수집된 메트릭
   */
  async getMetrics() {
    return await this.healthMonitor.getMetrics();
  }

  /**
   * Express 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  middleware() {
    return async (req, res, next) => {
      // Orchestrator 인스턴스를 req에 추가
      req.orchestrator = this;

      // 요청 컨텍스트 생성
      req.context = await this.contextManager.createContext({
        requestId: req.id || this.generateId(),
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });

      next();
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    info('Orchestrator 종료 중...');

    if (this.healthMonitor) {
      await this.healthMonitor.stop();
    }

    if (this.contextManager) {
      await this.contextManager.cleanup();
    }

    info('✅ Orchestrator 종료 완료');
  }

  /**
   * 유틸리티: 지연
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 유틸리티: ID 생성
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 싱글톤 인스턴스 생성
let orchestratorInstance = null;

/**
 * Orchestrator 인스턴스 가져오기 (싱글톤)
 */
function getOrchestrator(options) {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator(options);
  }
  return orchestratorInstance;
}

module.exports = getOrchestrator();
module.exports.Orchestrator = Orchestrator;
module.exports.getOrchestrator = getOrchestrator;
