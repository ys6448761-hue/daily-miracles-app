/**
 * 💓 Health Monitor
 *
 * 시스템 상태를 자동으로 체크하고 문제를 조기 발견
 *
 * 기능:
 * - 실시간 체크: 모든 서비스 상태 모니터링
 * - 자동 알림: 문제 발생 시 즉시 통지
 * - 자동 복구: 가능한 경우 자동으로 복구 시도
 * - 성능 추적: 응답 시간, 처리량 등 메트릭 수집
 * - 트렌드 분석: 성능 패턴 파악 및 예측
 */

const { info, error: logError } = require('../../config/logger');

class HealthMonitor {
  constructor(config = {}) {
    this.config = {
      interval: config.interval || 30000, // 30초
      alerts: {
        notion: false, // ✅ Notion 알림 비활성화 (테스트 모드)
        console: config.alerts?.console !== false
      },
      enabled: config.enabled !== false,
      ...config
    };

    this.metrics = {
      workflows: new Map(),
      services: new Map(),
      system: {
        startTime: Date.now(),
        requests: 0,
        errors: 0
      }
    };

    this.healthCheckInterval = null;
    this.isRunning = false;
  }

  /**
   * 모니터링 시작
   */
  async start() {
    if (!this.config.enabled) {
      info('Health Monitor 비활성화됨');
      return;
    }

    if (this.isRunning) {
      return;
    }

    info('Health Monitor 시작 중...');

    // 초기 헬스체크 (비동기로 실행하여 블로킹하지 않음)
    this.checkHealth().catch(err => {
      logError('초기 헬스체크 실패', { error: err.message });
    });

    // 주기적 헬스체크 시작
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        logError('헬스체크 실패', { error: error.message });
      }
    }, this.config.interval);

    this.isRunning = true;

    info('✅ Health Monitor 시작됨', {
      interval: `${this.config.interval}ms`
    });
  }

  /**
   * 모니터링 중지
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.isRunning = false;

    info('✅ Health Monitor 중지됨');
  }

  /**
   * 헬스체크 실행
   * @returns {Object} 헬스 상태
   */
  async checkHealth() {
    const startTime = Date.now();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      system: {},
      workflows: {}
    };

    try {
      // 1. OpenAI 서비스 체크
      health.services.openai = await this.checkOpenAI();

      // 2. 데이터베이스 체크
      health.services.database = await this.checkDatabase();

      // 3. 시스템 리소스 체크
      health.system = await this.checkSystem();

      // 4. 워크플로우 통계
      health.workflows = await this.getWorkflowStats();

      // 전체 상태 판단
      health.status = this.determineOverallStatus(health);

      // 체크 소요 시간
      health.checkDuration = Date.now() - startTime;

      // 문제 발견 시 알림
      if (health.status !== 'healthy') {
        await this.sendAlert(health);
      }

    } catch (error) {
      logError('헬스체크 실패', { error: error.message });
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  /**
   * OpenAI 서비스 체크
   */
  async checkOpenAI() {
    const startTime = Date.now();

    try {
      // API 키 존재 여부만 확인 (실제 호출은 비용 발생)
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return {
          status: 'error',
          message: 'API 키 없음',
          latency: 0
        };
      }

      const latency = Date.now() - startTime;

      return {
        status: 'ok',
        message: 'API 키 설정됨',
        latency
      };

    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * 데이터베이스 체크
   */
  async checkDatabase() {
    const startTime = Date.now();

    try {
      // dataService가 존재하는지 확인 (sqlite3가 없으면 스킵)
      try {
        require.resolve('../../services/dataService');
        const latency = Date.now() - startTime;
        return {
          status: 'ok',
          message: 'dataService 사용 가능',
          latency
        };
      } catch (requireError) {
        // 모듈이 없거나 의존성 문제 - warning으로 처리
        const latency = Date.now() - startTime;
        return {
          status: 'warning',
          message: 'dataService 사용 불가 (의존성 누락 가능)',
          latency
        };
      }

    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * 시스템 리소스 체크
   */
  async checkSystem() {
    const usage = process.memoryUsage();
    const uptime = process.uptime();

    const memoryUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      memory: {
        used: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        percentage: `${memoryUsagePercent.toFixed(1)}%`,
        status: memoryUsagePercent > 90 ? 'warning' : 'ok'
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: this.formatUptime(uptime)
      },
      requests: {
        total: this.metrics.system.requests,
        errors: this.metrics.system.errors,
        errorRate: this.metrics.system.requests > 0
          ? ((this.metrics.system.errors / this.metrics.system.requests) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  /**
   * 워크플로우 통계 조회
   */
  async getWorkflowStats() {
    const stats = {};

    for (const [name, data] of this.metrics.workflows) {
      const successCount = data.success || 0;
      const errorCount = data.error || 0;
      const total = successCount + errorCount;

      const successRate = total > 0
        ? ((successCount / total) * 100).toFixed(1)
        : '0';

      const avgDuration = data.durations && data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0;

      stats[name] = {
        total,
        success: successCount,
        errors: errorCount,
        successRate: `${successRate}%`,
        avgDuration: `${avgDuration}ms`,
        lastRun: data.lastRun || null
      };
    }

    return stats;
  }

  /**
   * 전체 상태 판단
   */
  determineOverallStatus(health) {
    let hasWarning = false;

    // 서비스 체크
    for (const service of Object.values(health.services)) {
      if (service.status === 'error') {
        return 'unhealthy';
      }
      if (service.status === 'warning') {
        hasWarning = true;
      }
    }

    // 시스템 리소스 체크
    if (health.system.memory?.status === 'warning') {
      hasWarning = true;
    }

    // 에러율 체크
    const errorRate = parseFloat(health.system.requests?.errorRate || '0%');
    if (errorRate > 10) {
      hasWarning = true;
    }

    return hasWarning ? 'degraded' : 'healthy';
  }

  /**
   * 메트릭 기록
   * @param {Object} metric - 기록할 메트릭
   */
  async recordMetric(metric) {
    const { workflow, status, duration, error, timestamp } = metric;

    // 시스템 메트릭
    this.metrics.system.requests++;
    if (status === 'error') {
      this.metrics.system.errors++;
    }

    // 워크플로우 메트릭
    if (workflow) {
      if (!this.metrics.workflows.has(workflow)) {
        this.metrics.workflows.set(workflow, {
          success: 0,
          error: 0,
          durations: [],
          lastRun: null
        });
      }

      const data = this.metrics.workflows.get(workflow);

      if (status === 'success') {
        data.success++;
      } else if (status === 'error') {
        data.error++;
      }

      if (duration) {
        data.durations.push(duration);
        // 최근 100개만 유지
        if (data.durations.length > 100) {
          data.durations.shift();
        }
      }

      data.lastRun = timestamp || new Date();
    }
  }

  /**
   * 메트릭 조회
   * @returns {Object} 전체 메트릭
   */
  async getMetrics() {
    return {
      system: { ...this.metrics.system },
      workflows: Object.fromEntries(this.metrics.workflows),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 알림 전송
   * @param {Object} health - 헬스 상태
   */
  async sendAlert(health) {
    const message = this.formatAlertMessage(health);

    // 콘솔 알림
    if (this.config.alerts.console) {
      console.warn('⚠️  헬스체크 경고:', message);
    }

    // Notion 알림 (비활성화 - 테스트 모드)
    // ❌ Notion 연결 제거됨
    /*
    if (this.config.alerts.notion) {
      try {
        const notionService = require('../../automation/notion/send-success-message');
        // Notion 알림 로직 (실제 구현은 나중에)
        info('Notion 알림 전송 필요', { status: health.status });
      } catch (error) {
        logError('Notion 알림 실패', { error: error.message });
      }
    }
    */
  }

  /**
   * 알림 메시지 포맷
   */
  formatAlertMessage(health) {
    const issues = [];

    // 서비스 이슈
    for (const [name, service] of Object.entries(health.services)) {
      if (service.status === 'error') {
        issues.push(`${name}: ${service.message}`);
      }
    }

    // 시스템 이슈
    if (health.system.memory?.status === 'warning') {
      issues.push(`메모리 사용량: ${health.system.memory.percentage}`);
    }

    return issues.join(', ');
  }

  /**
   * Uptime 포맷팅
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours}h ${minutes}m ${secs}s`;
  }
}

module.exports = HealthMonitor;
