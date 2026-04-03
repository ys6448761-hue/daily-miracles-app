/**
 * agentRunner.js
 * 에이전트 실행 + dt_agent_runs 기록 담당
 *
 * ❌ 금지: 이벤트 없이 agent 직접 호출
 * ✅ 규칙: 반드시 이 runner를 통해서만 실행
 */

const db = require('../../../database/db');
const { makeLogger } = require('../../../utils/logger');
const log = makeLogger('agentRunner');

// 에이전트 레지스트리 — lazy require (순환 의존 방지)
const AGENT_REGISTRY = {
  starAgent:         () => require('../agents/starAgent'),
  careAgent:         () => require('../agents/careAgent'),
  kWisdomAgent:      () => require('../agents/kWisdomAgent'),
  narrativeAgent:    () => require('../agents/narrativeAgent'),
  monetizationAgent: () => require('../agents/monetizationAgent'),
};

/**
 * run(starId, agentName, input, eventId?) → output
 * 실행 결과를 dt_agent_runs에 기록
 */
async function run(starId, agentName, input = {}, eventId = null) {
  if (!AGENT_REGISTRY[agentName]) {
    throw new Error(`등록되지 않은 에이전트: ${agentName}`);
  }

  // dt_agent_runs 시작 기록
  const runResult = await db.query(
    `INSERT INTO dt_agent_runs
       (star_id, agent_name, trigger_event, status, input_payload)
     VALUES ($1, $2, $3, 'running', $4)
     RETURNING id`,
    [starId, agentName, eventId, JSON.stringify(input)]
  );
  const runId = runResult.rows[0].id;

  try {
    const agent = AGENT_REGISTRY[agentName]();
    const output = await agent.run(starId, input);

    await db.query(
      `UPDATE dt_agent_runs
       SET status='done', output_payload=$1, finished_at=NOW()
       WHERE id=$2`,
      [JSON.stringify(output || {}), runId]
    );

    log.info(`✅ ${agentName} 완료`, { star_id: starId, run_id: runId });
    return output;

  } catch (err) {
    await db.query(
      `UPDATE dt_agent_runs
       SET status='failed', error_message=$1, finished_at=NOW()
       WHERE id=$2`,
      [err.message, runId]
    );
    log.error(`❌ ${agentName} 실패`, { star_id: starId, run_id: runId, error: err.message });
    throw err;
  }
}

module.exports = { run };
