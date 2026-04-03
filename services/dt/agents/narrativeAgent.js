/**
 * narrativeAgent.js
 * REPORT_READY 트리거 → Narrative Engine 실행
 *
 * narrativeService.requestNarrative() 위임
 * 중복 방지는 narrativeService 내부에서 처리
 */

const { requestNarrative } = require('../narrativeService');
const { makeLogger } = require('../../../utils/logger');
const log = makeLogger('narrativeAgent');

async function run(starId, input = {}) {
  const result = await requestNarrative(starId);

  log.info('narrative 요청 완료', {
    star_id: starId,
    reused:  result.reused,
    job_id:  result.job_id,
  });

  return {
    job_id:  result.job_id,
    reused:  result.reused,
    status:  result.status || (result.reused ? 'reused' : 'queued'),
  };
}

module.exports = { run };
