/**
 * decisionEngine.js
 * 이벤트 → 에이전트 선택 규칙 (SSOT)
 *
 * Rule 1  STAR_CREATED          → starAgent + careAgent(day=1)
 * Rule 2  DAY_PASSED(day=3)     → kWisdomAgent + careAgent(mode=intervention)
 * Rule 3  NO_ACTIVITY           → careAgent(mode=checkin)
 * Rule 4  REPORT_READY          → narrativeAgent
 * Rule 5  DAY_6_UPSELL_READY    → monetizationAgent
 * Rule 6  PAYMENT_COMPLETED     → careAgent(mode=welcome_paid)
 */

const { makeLogger } = require('../../../utils/logger');
const log = makeLogger('decisionEngine');

/**
 * decide(eventType, payload) → [{ agentName, input }]
 * 에이전트 실행 목록 반환
 */
function decide(eventType, payload = {}) {
  switch (eventType) {

    case 'STAR_CREATED':
      return [
        { agentName: 'starAgent',  input: { ...payload } },
        { agentName: 'careAgent',  input: { ...payload, day: 1, mode: 'welcome' } },
      ];

    case 'DAY_PASSED': {
      const day = payload.day || 1;
      if (day === 3 && payload.no_activity) {
        return [
          { agentName: 'kWisdomAgent', input: { ...payload, phase: 'week' } },
          { agentName: 'careAgent',    input: { ...payload, day, mode: 'intervention' } },
        ];
      }
      if (day <= 7) {
        return [
          { agentName: 'careAgent', input: { ...payload, day, mode: 'daily' } },
        ];
      }
      return [];
    }

    case 'NO_ACTIVITY':
      return [
        { agentName: 'careAgent', input: { ...payload, mode: 'checkin' } },
      ];

    case 'REPORT_READY':
      return [
        { agentName: 'narrativeAgent', input: { ...payload } },
      ];

    case 'DAY_6_UPSELL_READY':
      return [
        { agentName: 'monetizationAgent', input: { ...payload, trigger: 'day6' } },
      ];

    case 'PAYMENT_COMPLETED':
      return [
        { agentName: 'careAgent', input: { ...payload, mode: 'welcome_paid' } },
      ];

    default:
      log.warn(`알 수 없는 이벤트 타입: ${eventType}`);
      return [];
  }
}

module.exports = { decide };
