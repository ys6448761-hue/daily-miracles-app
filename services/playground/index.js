/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 소원놀이터 (Playground Engine) - 메인 진입점
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AIL-Implementation v1
 * - Philosophy Score 계산
 * - 점수 기반 공개/추천/피드 노출
 * - 도움 중심 배지/크레딧 지급
 * - 악용(자극/낚시) 퍼짐 차단
 */

const artifactService = require('./artifactService');
const scoreService = require('./scoreService');
const feedService = require('./feedService');
const rewardService = require('./rewardService');
const shareService = require('./shareService');
const templateService = require('./templateService');

module.exports = {
  // 아티팩트 (창작물)
  artifact: artifactService,

  // 철학 점수
  score: scoreService,

  // 피드/추천
  feed: feedService,

  // 배지/크레딧
  reward: rewardService,

  // 공유
  share: shareService,

  // 템플릿
  template: templateService,

  // 초기화
  async init(db) {
    console.log('[Playground] 엔진 초기화 중...');

    // DB 연결 주입
    artifactService.init(db);
    scoreService.init(db);
    feedService.init(db);
    rewardService.init(db);
    shareService.init(db);
    templateService.init(db);

    console.log('[Playground] ✅ 엔진 초기화 완료');
  }
};
