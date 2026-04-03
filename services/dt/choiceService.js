/**
 * services/dt/choiceService.js
 * 사용자 선택 기록 전담
 */

const db = require('../../database/db');
const logService = require('./logService');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('choiceService');

async function createChoice(starId, wisdomId, choiceType, choiceValue = '', metadata = {}) {
  const result = await db.query(
    `INSERT INTO dt_choice_logs (star_id, wisdom_id, choice_type, choice_value, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, choice_type, choice_value, created_at`,
    [starId, wisdomId, choiceType, choiceValue, JSON.stringify(metadata)]
  );
  const choice = result.rows[0];

  await logService.createLog(starId, 'choice', {
    choice_id: choice.id,
    choice_type: choiceType,
    choice_value: choiceValue,
    wisdom_id: wisdomId,
  });

  log.info('choice 저장', { star_id: starId, choice_id: choice.id, type: choiceType });
  return choice;
}

module.exports = { createChoice };
