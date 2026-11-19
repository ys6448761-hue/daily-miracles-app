'use strict';

// PHX-SOUL-QA-001 RC3 Route Exposure Gate (§52).
//
// Route Skeleton 실행과 route.days 노출은 아래 조건을 모두 만족할 때만 허용한다.
//   1) SOUL_ROUTE_SKELETON_ENABLED === '1'  (정확히 '1')
//   2) SOUL_QA_ISOLATED === '1'             (정확히 '1', 실제 격리가 검증된 테스트 하네스에서만 설정)
// 그 밖의 모든 값(미설정, 빈 값, 공백, 'true', '01' 등)은 OFF 처리한다 (Fail-Closed).
//
// 차단 우선순위 (환경 판정 실패 시 차단):
//   - NODE_ENV 가 'production' (대소문자 무시) → 차단
//   - Render 실행 환경 식별 변수가 하나라도 존재 → 차단
//
// 주의: 이 게이트는 실행 식별자일 뿐이다. DB·세션 격리의 증거가 아니다.
// 환경변수 이름은 인증 비밀값으로 취급하지 않는다.
// 기존 SOUL_HYBRID_V1 플래그와 독립적으로 동작한다.

const RENDER_RUNTIME_VARS = [
  'RENDER',
  'RENDER_SERVICE_ID',
  'RENDER_SERVICE_NAME',
  'RENDER_EXTERNAL_URL',
  'RENDER_GIT_COMMIT',
  'RENDER_GIT_BRANCH',
];

function _isExactOne(value) {
  return value === '1';
}

// env: 테스트 주입용. 기본값은 process.env.
function isRouteSkeletonEnabled(env = process.env) {
  if (!env) return false;

  // 차단 규칙은 활성화 여부보다 우선한다.
  const nodeEnv = typeof env.NODE_ENV === 'string' ? env.NODE_ENV.trim().toLowerCase() : '';
  if (nodeEnv === 'production') return false;

  for (const name of RENDER_RUNTIME_VARS) {
    if (env[name] !== undefined && env[name] !== null && String(env[name]) !== '') return false;
  }

  return _isExactOne(env.SOUL_ROUTE_SKELETON_ENABLED) && _isExactOne(env.SOUL_QA_ISOLATED);
}

module.exports = { isRouteSkeletonEnabled, RENDER_RUNTIME_VARS };
