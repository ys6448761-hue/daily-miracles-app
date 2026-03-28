/**
 * API 에러 분류 + request_id 생성 유틸
 */

export function classifyError(err) {
  if (err instanceof SyntaxError) return 'Validation';
  if (err instanceof TypeError)   return 'Runtime';

  if (err instanceof Error) {
    const msg = err.message ?? '';
    if (msg.includes('JSON') || msg.includes('parse'))         return 'Validation';
    if (msg.includes('fetch') || msg.includes('ECONNREFUSED')) return 'External';
    if (msg.includes('undefined') || msg.includes('null'))     return 'Runtime';
    if (msg.includes('Unauthorized') || msg.includes('403'))   return 'Auth';
  }

  return 'Unknown';
}

export function makeRequestId() {
  return crypto.randomUUID();
}
