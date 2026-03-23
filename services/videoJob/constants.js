/**
 * VideoJob Constants — 상태머신 + 재시도 정책
 * AIL-2026-0219-VID-003
 */

// ═══════════════════════════════════════════════════════
// 상태 enum
// ═══════════════════════════════════════════════════════
const STATES = {
  QUEUED:   'QUEUED',
  BUILD:    'BUILD',
  VALIDATE: 'VALIDATE',
  RENDER:   'RENDER',
  SUBTITLE: 'SUBTITLE',
  PACKAGE:  'PACKAGE',
  DELIVER:  'DELIVER',
  DONE:     'DONE',
  FAILED:   'FAILED',
};

// ═══════════════════════════════════════════════════════
// 합법 전이 맵: source → [targets]
// ═══════════════════════════════════════════════════════
const TRANSITIONS = {
  [STATES.QUEUED]:   [STATES.BUILD,    STATES.FAILED],
  [STATES.BUILD]:    [STATES.VALIDATE, STATES.FAILED],
  [STATES.VALIDATE]: [STATES.RENDER,   STATES.BUILD,  STATES.FAILED], // BUILD = rollback
  [STATES.RENDER]:   [STATES.SUBTITLE, STATES.FAILED],
  [STATES.SUBTITLE]: [STATES.PACKAGE,  STATES.FAILED],
  [STATES.PACKAGE]:  [STATES.DELIVER,  STATES.FAILED],
  [STATES.DELIVER]:  [STATES.DONE,     STATES.FAILED],
  [STATES.DONE]:     [],
  [STATES.FAILED]:   [],
};

// ═══════════════════════════════════════════════════════
// 재시도 정책
// ═══════════════════════════════════════════════════════
const RETRY_POLICIES = {
  // OpenAI / Runway / Network 오류
  OPENAI_RUNWAY_NETWORK: {
    maxRetries: 5,
    baseDelay: 1000,
    strategy: 'exponential', // 1s → 2s → 4s → 8s → 16s
  },
  // FFmpeg 렌더 실패
  FFMPEG_RENDER: {
    maxRetries: 2,
    baseDelay: 1000,
    strategy: 'linear', // 1s → 2s
    preRetryActions: ['fontPathRecheck', 'assRegenerate'],
  },
  // Validator 실패 — 재시도 금지, BUILD로 롤백
  VALIDATOR_FAIL: {
    maxRetries: 0,
    rollbackTo: STATES.BUILD,
  },
};

// ═══════════════════════════════════════════════════════
// 재시도 가능 에러 코드 (네트워크/일시적 오류)
// ═══════════════════════════════════════════════════════
const RETRYABLE_ERROR_CODES = [
  'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND',
  'EPIPE', 'EHOSTUNREACH', 'ERR_SOCKET_TIMEOUT',
  'rate_limit_exceeded', '429', '500', '502', '503', '504',
];

// ═══════════════════════════════════════════════════════
// 에러 코드 분류
// ═══════════════════════════════════════════════════════
const ERROR_CODES = {
  BUILD_FAILED:         'BUILD_FAILED',
  VALIDATION_FAILED:    'VALIDATION_FAILED',
  RENDER_FAILED:        'RENDER_FAILED',
  SUBTITLE_FAILED:      'SUBTITLE_FAILED',
  PACKAGE_FAILED:       'PACKAGE_FAILED',
  DELIVER_FAILED:       'DELIVER_FAILED',
  KOR_INTEGRITY_FAIL:   'KOR_INTEGRITY_FAIL',
  FONT_NOT_FOUND:       'FONT_NOT_FOUND',
  ZIP_UTF8_CORRUPTION:  'ZIP_UTF8_CORRUPTION',
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
  INVALID_TRANSITION:   'INVALID_TRANSITION',
  UNKNOWN_ERROR:        'UNKNOWN_ERROR',
};

module.exports = {
  STATES,
  TRANSITIONS,
  RETRY_POLICIES,
  RETRYABLE_ERROR_CODES,
  ERROR_CODES,
};
