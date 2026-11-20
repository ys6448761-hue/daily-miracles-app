'use strict';
// §88 — 고객 메시지 우천 신호 감지 + soyeowoolService 연결 확인

const fs = require('fs');
const path = require('path');
const { detectRainyIntent } = require('../../services/travelWeatherIntent');

describe('§88 detectRainyIntent', () => {
  test.each([
    '비 오는 날 어디 가지?',
    '비가 와도 갈 만한 곳',
    '우천시 어디 좋아?',
    '비 올 것 같은데 뭐 하지',
    '비오는 날 실내',
    '장마철 여행',
  ])('우천 신호 있음: %s', (msg) => {
    expect(detectRainyIntent(msg)).toBe(true);
  });

  test.each([
    '비행기 타고 왔어',
    '비싼 곳 추천해줘',
    '비 안 오면 바다 보고 싶어',
    '여수밤바다를 볼 수 있는 곳',
    '',
  ])('우천 신호 없음: %s', (msg) => {
    expect(detectRainyIntent(msg)).toBe(false);
  });

  test('비문자열 입력은 false', () => {
    expect(detectRainyIntent(undefined)).toBe(false);
    expect(detectRainyIntent(null)).toBe(false);
  });
});

describe('§88 soyeowoolService 연결', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../services/soyeowoolService.js'), 'utf8');

  test('detectRainyIntent 가 handleTravelRequest 의 message 로 호출되고 weather 를 설정한다', () => {
    expect(src).toMatch(/const \{ detectRainyIntent \} = require\('\.\/travelWeatherIntent'\)/);
    expect(src).toMatch(/if \(detectRainyIntent\(message\)\) \{\s*baseDomainContext\.weather = \{ condition: 'rainy' \};/);
  });
});
