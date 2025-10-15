/**
 * ⚙️ Orchestrator 설정
 *
 * Aurora 5 Orchestrator의 모든 설정을 관리
 */

module.exports = {
  // 모니터링 설정
  monitoring: {
    enabled: true,
    interval: 30000, // 30초마다 헬스체크
    alerts: {
      notion: true,   // Notion 알림 활성화
      console: true   // 콘솔 알림 활성화
    }
  },

  // 라우팅 설정
  routing: {
    maxConcurrent: 5,     // 최대 동시 실행 수
    timeout: 300000,      // 5분 타임아웃
    retries: 3,           // 재시도 횟수
    retryDelay: 1000      // 재시도 지연 (ms)
  },

  // 컨텍스트 설정
  context: {
    enabled: true,
    ttl: 3600000,         // 1시간 후 자동 삭제
    maxSize: 10485760,    // 최대 10MB
    cleanup: {
      enabled: true,
      interval: 600000    // 10분마다 정리
    }
  },

  // 복구 설정
  recovery: {
    enabled: true,
    autoRetry: true,
    maxAttempts: 3
  },

  // 성능 설정
  performance: {
    caching: true,
    compression: false
  },

  // 로깅 설정
  logging: {
    enabled: true,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    structured: true
  }
};
