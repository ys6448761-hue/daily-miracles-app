/**
 * 🗄️ Context Manager
 *
 * 워크플로우 전체에서 상태를 실시간으로 공유하고 관리
 *
 * 기능:
 * - 중앙 저장소: 모든 워크플로우 상태 중앙 관리
 * - 실시간 동기화: 변경사항 즉시 반영
 * - 트랜잭션 지원: 데이터 일관성 보장
 * - 이력 추적: 모든 변경 기록 보존
 * - TTL 지원: 자동 정리
 */

const { info, error: logError } = require('../../config/logger');

class Context {
  constructor(id, data = {}) {
    this.id = id;
    this.data = { ...data };
    this.history = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.duration = 0;
  }

  /**
   * 값 설정
   * @param {string} key - 키
   * @param {*} value - 값
   */
  async set(key, value) {
    const oldValue = this.data[key];
    this.data[key] = value;
    this.updatedAt = new Date();

    // 변경 이력 기록
    this.history.push({
      action: 'set',
      key,
      oldValue,
      newValue: value,
      timestamp: new Date()
    });

    return value;
  }

  /**
   * 값 가져오기
   * @param {string} key - 키
   * @returns {*} 값
   */
  async get(key) {
    return this.data[key];
  }

  /**
   * 모든 데이터 가져오기
   * @returns {Object} 전체 데이터
   */
  async getAll() {
    return { ...this.data };
  }

  /**
   * 값 존재 여부 확인
   * @param {string} key - 키
   * @returns {boolean}
   */
  has(key) {
    return key in this.data;
  }

  /**
   * 값 삭제
   * @param {string} key - 키
   */
  async delete(key) {
    const value = this.data[key];
    delete this.data[key];
    this.updatedAt = new Date();

    this.history.push({
      action: 'delete',
      key,
      value,
      timestamp: new Date()
    });

    return true;
  }

  /**
   * 이력 조회
   * @returns {Array} 변경 이력
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * 컨텍스트 요약
   * @returns {Object} 요약 정보
   */
  getSummary() {
    this.duration = Date.now() - this.createdAt.getTime();

    return {
      id: this.id,
      keys: Object.keys(this.data),
      historyCount: this.history.length,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      duration: `${this.duration}ms`
    };
  }
}

class ContextManager {
  constructor(config = {}) {
    this.config = {
      ttl: config.ttl || 3600000, // 1시간
      maxSize: config.maxSize || 10485760, // 10MB
      enabled: config.enabled !== false,
      ...config
    };

    this.contexts = new Map();
    this.cleanupTimers = new Map();
  }

  /**
   * 초기화
   */
  async initialize() {
    info('ContextManager 초기화 중...');

    if (!this.config.enabled) {
      info('ContextManager 비활성화됨');
      return;
    }

    // 주기적인 정리 작업 시작
    this.startCleanupScheduler();

    info('✅ ContextManager 초기화 완료', {
      ttl: `${this.config.ttl}ms`,
      maxSize: `${this.config.maxSize} bytes`
    });
  }

  /**
   * 컨텍스트 생성
   * @param {Object} data - 초기 데이터
   * @returns {Context} 생성된 컨텍스트
   */
  async createContext(data = {}) {
    const id = this.generateContextId();
    const context = new Context(id, data);

    this.contexts.set(id, context);

    info(`컨텍스트 생성: ${id}`, {
      keys: Object.keys(data)
    });

    // TTL 타이머 설정
    this.scheduleCleanup(id);

    return context;
  }

  /**
   * 컨텍스트 조회
   * @param {string} id - 컨텍스트 ID
   * @returns {Context|null} 컨텍스트 또는 null
   */
  async getContext(id) {
    return this.contexts.get(id) || null;
  }

  /**
   * 컨텍스트 삭제
   * @param {string} id - 컨텍스트 ID
   */
  async deleteContext(id) {
    const context = this.contexts.get(id);

    if (context) {
      this.contexts.delete(id);

      // 타이머 정리
      if (this.cleanupTimers.has(id)) {
        clearTimeout(this.cleanupTimers.get(id));
        this.cleanupTimers.delete(id);
      }

      info(`컨텍스트 삭제: ${id}`, context.getSummary());
    }
  }

  /**
   * 컨텍스트 정리 예약
   * @param {string} id - 컨텍스트 ID
   */
  scheduleCleanup(id) {
    // 기존 타이머 취소
    if (this.cleanupTimers.has(id)) {
      clearTimeout(this.cleanupTimers.get(id));
    }

    // 새 타이머 설정
    const timer = setTimeout(() => {
      this.deleteContext(id);
      info(`컨텍스트 자동 정리 (TTL): ${id}`);
    }, this.config.ttl);

    this.cleanupTimers.set(id, timer);
  }

  /**
   * 정리 스케줄러 시작
   */
  startCleanupScheduler() {
    // 10분마다 만료된 컨텍스트 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 600000); // 10분

    info('컨텍스트 정리 스케줄러 시작됨');
  }

  /**
   * 만료된 컨텍스트 정리
   */
  async cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, context] of this.contexts.entries()) {
      const age = now - context.createdAt.getTime();

      if (age > this.config.ttl) {
        await this.deleteContext(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      info(`만료된 컨텍스트 정리: ${cleaned}개`);
    }
  }

  /**
   * 트랜잭션 실행
   * @param {Function} callback - 트랜잭션 콜백
   * @param {Context} context - 컨텍스트
   * @returns {Promise<*>} 트랜잭션 결과
   */
  async transaction(callback, context) {
    // 현재 상태 백업
    const backup = { ...context.data };

    try {
      const result = await callback(context);
      info(`트랜잭션 성공: ${context.id}`);
      return result;
    } catch (error) {
      // 롤백
      context.data = backup;
      logError(`트랜잭션 실패 (롤백): ${context.id}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 통계 조회
   * @returns {Object} 컨텍스트 통계
   */
  getStats() {
    const contexts = Array.from(this.contexts.values());

    return {
      total: contexts.length,
      oldest: contexts.length > 0
        ? Math.min(...contexts.map(c => c.createdAt.getTime()))
        : null,
      newest: contexts.length > 0
        ? Math.max(...contexts.map(c => c.createdAt.getTime()))
        : null,
      totalHistoryCount: contexts.reduce(
        (sum, c) => sum + c.history.length,
        0
      )
    };
  }

  /**
   * 전체 정리
   */
  async cleanup() {
    info('ContextManager 정리 중...');

    // 정리 스케줄러 중지
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 모든 타이머 정리
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }

    // 모든 컨텍스트 삭제
    this.contexts.clear();
    this.cleanupTimers.clear();

    info('✅ ContextManager 정리 완료');
  }

  /**
   * 유틸리티: 컨텍스트 ID 생성
   */
  generateContextId() {
    return `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ContextManager;
module.exports.Context = Context;
