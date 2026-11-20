'use strict';
/**
 * §88 — 고객 메시지의 "비 오는 날" 신호 감지 (순수 함수, I/O 없음).
 *
 * 목적: 고객이 직접 우천을 말한 경우에만 기존 travelGuideService._passesWeather 필터
 *       (context.weather.condition === 'rainy' → indoor/mixed 만 통과)가 동작하도록 연결한다.
 * 범위 밖: 실시간 날씨 API, 일기예보 연동. 고객 입력이 없으면 아무 값도 설정하지 않는다.
 */

const RAIN_PATTERN = /(비가?\s*(오|와|온|내리|옵|올)|우천|빗속|비\s*오는\s*날|장마)/;

function detectRainyIntent(message) {
  if (typeof message !== 'string' || message.length === 0) return false;
  return RAIN_PATTERN.test(message);
}

module.exports = { detectRainyIntent, RAIN_PATTERN };
