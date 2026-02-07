/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 정산 엔진 (Settlement Engine) - 메인 진입점
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AIL-정산-v2-final 구현
 * - 수익 배분 계산
 * - 풀별 분배
 * - 크리에이터/리믹스/추천 정산
 * - 환불/차지백 역분개
 */

const calculationService = require('./calculationService');
const distributionService = require('./distributionService');
const payoutService = require('./payoutService');
const constantsService = require('./constantsService');

module.exports = {
  // 계산
  calculation: calculationService,

  // 분배
  distribution: distributionService,

  // 지급
  payout: payoutService,

  // 상수
  constants: constantsService,

  // 초기화
  async init(db) {
    console.log('[Settlement] 엔진 초기화 중...');

    // DB 연결 주입
    calculationService.init(db);
    distributionService.init(db);
    payoutService.init(db);
    constantsService.init(db);

    // 상수 로드
    await constantsService.loadConstants();

    console.log('[Settlement] ✅ 엔진 초기화 완료');
  }
};
