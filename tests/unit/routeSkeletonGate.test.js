'use strict';

/**
 * PHX-SOUL-QA-001 §52 Route Exposure Gate — 환경 매트릭스 (Fail-Closed)
 * 허용 조건: SOUL_ROUTE_SKELETON_ENABLED === '1' AND SOUL_QA_ISOLATED === '1' AND 운영 판정 없음.
 */

const { isRouteSkeletonEnabled, RENDER_RUNTIME_VARS } = require('../../services/routeSkeletonGate');

const QA_ON = { SOUL_ROUTE_SKELETON_ENABLED: '1', SOUL_QA_ISOLATED: '1' };

describe('Route Exposure Gate — 활성화 조건', () => {
  test('모든 환경변수 미설정 → 차단', () => {
    expect(isRouteSkeletonEnabled({})).toBe(false);
  });

  test('Route 플래그만 ON → 차단', () => {
    expect(isRouteSkeletonEnabled({ SOUL_ROUTE_SKELETON_ENABLED: '1' })).toBe(false);
  });

  test('QA 식별자만 ON → 차단', () => {
    expect(isRouteSkeletonEnabled({ SOUL_QA_ISOLATED: '1' })).toBe(false);
  });

  test('두 값 모두 정확히 "1"인 격리 하네스 → 허용', () => {
    expect(isRouteSkeletonEnabled({ ...QA_ON })).toBe(true);
  });

  test('두 값 ON + NODE_ENV 가 development/test/미설정 → 허용', () => {
    expect(isRouteSkeletonEnabled({ ...QA_ON, NODE_ENV: 'development' })).toBe(true);
    expect(isRouteSkeletonEnabled({ ...QA_ON, NODE_ENV: 'test' })).toBe(true);
  });
});

describe('Route Exposure Gate — 잘못된 값 Fail-Closed', () => {
  const badValues = ['true', 'yes', 'on', '0', '', ' 1', '1 ', '01', '1.0', 'TRUE', '2', 'y'];

  test.each(badValues)('ROUTE 플래그 값 %p → 차단', (v) => {
    expect(isRouteSkeletonEnabled({ SOUL_ROUTE_SKELETON_ENABLED: v, SOUL_QA_ISOLATED: '1' })).toBe(false);
  });

  test.each(badValues)('QA 식별자 값 %p → 차단', (v) => {
    expect(isRouteSkeletonEnabled({ SOUL_ROUTE_SKELETON_ENABLED: '1', SOUL_QA_ISOLATED: v })).toBe(false);
  });

  test('env 자체가 없으면 차단', () => {
    expect(isRouteSkeletonEnabled(null)).toBe(false);
    expect(isRouteSkeletonEnabled(undefined)).toBe(false);
  });
});

describe('Route Exposure Gate — 운영 차단 우선', () => {
  test('Production + 두 값 ON → 차단', () => {
    expect(isRouteSkeletonEnabled({ ...QA_ON, NODE_ENV: 'production' })).toBe(false);
  });

  test('NODE_ENV 대소문자·공백 변형도 production으로 차단', () => {
    expect(isRouteSkeletonEnabled({ ...QA_ON, NODE_ENV: 'PRODUCTION' })).toBe(false);
    expect(isRouteSkeletonEnabled({ ...QA_ON, NODE_ENV: ' Production ' })).toBe(false);
  });

  test.each(RENDER_RUNTIME_VARS)('Render 실행 식별 변수 %s 존재 + 두 값 ON → 차단', (name) => {
    expect(isRouteSkeletonEnabled({ ...QA_ON, [name]: 'x' })).toBe(false);
  });

  test('Render 식별 변수가 빈 문자열이면 Render로 보지 않는다 (나머지 조건 판정)', () => {
    expect(isRouteSkeletonEnabled({ ...QA_ON, RENDER: '' })).toBe(true);
  });

  test('Hybrid 플래그는 게이트 판정에 영향을 주지 않는다', () => {
    expect(isRouteSkeletonEnabled({ ...QA_ON, SOUL_HYBRID_V1: '1' })).toBe(true);
    expect(isRouteSkeletonEnabled({ ...QA_ON, SOUL_HYBRID_V1: '0' })).toBe(true);
    expect(isRouteSkeletonEnabled({ SOUL_HYBRID_V1: '1' })).toBe(false);
  });
});
