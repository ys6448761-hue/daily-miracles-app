/**
 * retentionMiddleware.js
 *
 * userId가 있는 요청마다 Day3/Day7 이탈 위험 상태를 감지해
 * req.retentionTrigger = 'day3' | 'day7' | null 로 주입한다.
 *
 * 사용:
 *   router.get('/stars', retentionCheck, handler)
 */

'use strict';

const { getRetentionState } = require('../services/retentionService');

async function retentionCheck(req, res, next) {
  const userId = req.query.userId || req.body?.userId || req.body?.user_id;

  if (!userId) {
    req.retentionTrigger = null;
    return next();
  }

  try {
    req.retentionTrigger = await getRetentionState(userId);
  } catch {
    req.retentionTrigger = null;
  }

  next();
}

module.exports = { retentionCheck };
