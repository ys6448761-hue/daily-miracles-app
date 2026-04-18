'use strict';

const MAX = 100;
const _feed = [];

function add({ method, route, status, message, requestId }) {
  _feed.unshift({
    method:    method    || 'UNKNOWN',
    route:     route     || '/',
    status:    status    || 0,
    message:   message   || null,
    requestId: requestId || null,
    ts:        new Date().toISOString(),
  });
  if (_feed.length > MAX) _feed.length = MAX;
}

function get(limit = 20) {
  return _feed.slice(0, Math.min(limit, MAX));
}

module.exports = { add, get };
