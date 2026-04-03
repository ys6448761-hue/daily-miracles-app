/**
 * utils/logger.js — DreamTown structured logger
 * context 기반 prefix + JSON payload 출력
 */

const IS_PROD = process.env.NODE_ENV === 'production';

function _format(level, context, message, data) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level}] [${context}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${IS_PROD ? JSON.stringify(data) : JSON.stringify(data, null, 2)}`;
  }
  return `${prefix} ${message}`;
}

function makeLogger(context) {
  return {
    info:  (msg, data) => console.log(_format('INFO ', context, msg, data)),
    warn:  (msg, data) => console.warn(_format('WARN ', context, msg, data)),
    error: (msg, data) => console.error(_format('ERROR', context, msg, data)),
    debug: (msg, data) => { if (!IS_PROD) console.log(_format('DEBUG', context, msg, data)); },
  };
}

module.exports = { makeLogger };
