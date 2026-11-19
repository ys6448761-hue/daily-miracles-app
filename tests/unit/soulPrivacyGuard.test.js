'use strict';
// PHX-SOUL-QA-001 §29 — Privacy Guard unit tests. All values are synthetic. No external calls.
const { sanitizeForExternal } = require('../../services/soulPrivacyGuard');

describe('전화번호 마스킹', () => {
  test.each([
    ['제 전화번호는 010-0000-0000인데 오동도 관람시간을 알려주세요.', '제 전화번호는 [전화번호]인데 오동도 관람시간을 알려주세요.'],
    ['연락처 010 1234 5678 로 준비물 알려줘', '연락처 [전화번호] 로 준비물 알려줘'],
    ['연락처 01012345678 준비물', '연락처 [전화번호] 준비물'],
    ['+82 10-1234-5678 여행 준비물', '[전화번호] 여행 준비물'],
    ['지역번호 02-123-4567 로 문의', '지역번호 [전화번호] 로 문의'],
  ])('형식 변형을 마스킹한다: %s', (input, expected) => {
    const r = sanitizeForExternal(input);
    expect(r.text).toBe(expected);
    expect(r.masked).toContain('PHONE');
    expect(r.blocked).toBe(false);
    expect(r.text).not.toMatch(/0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/);
  });
});

describe('이메일 마스킹', () => {
  test.each([
    ['문의 test.user+tag@example.co.kr 여행 준비물', '문의 [이메일] 여행 준비물'],
    ['mail to a@b.com about packing', 'mail to [이메일] about packing'],
  ])('형식 변형을 마스킹한다: %s', (input, expected) => {
    const r = sanitizeForExternal(input);
    expect(r.text).toBe(expected);
    expect(r.masked).toContain('EMAIL');
  });
});

describe('예약 식별자·번호 치환', () => {
  test('예약번호 값은 치환하고 질문은 남긴다', () => {
    const r = sanitizeForExternal('예약번호: AB12345 오동도 운영 시간 알려줘');
    expect(r.text).toBe('예약번호: [예약번호] 오동도 운영 시간 알려줘');
    expect(r.masked).toContain('RESERVATION');
  });
  test('9자리 이상 숫자 묶음은 번호로 치환한다', () => {
    const r = sanitizeForExternal('9876543210 번호로 여행 준비물 알려줘');
    expect(r.text).toContain('[번호]');
    expect(r.text).not.toContain('9876543210');
  });
});

describe('이름 치환', () => {
  test('자기소개 이름을 치환하고 조사는 남기지 않는다', () => {
    const r = sanitizeForExternal('제 이름은 김영희예요. 성인 3명 여수 2시간 여행 코스');
    expect(r.text).toBe('제 이름은 [이름]. 성인 3명 여수 2시간 여행 코스');
    expect(r.text).not.toContain('김영희');
    expect(r.masked).toContain('NAME');
  });
});

describe('주소 치환', () => {
  test('행정구역과 번지를 치환한다', () => {
    const r = sanitizeForExternal('여수시 돌산로 123 근처 준비물');
    expect(r.text).toBe('[주소] 근처 준비물');
    expect(r.masked).toContain('ADDRESS');
  });
});

describe('차단 (외부 호출 생략)', () => {
  test.each([
    ['주민번호 900101-1234567 로 등록해줘', 'RRN'],
    ['카드번호 1234-5678-9012-3456 결제', 'CARD'],
    ['계좌번호 알려줘 여행 준비', 'CREDENTIAL_WORD'],
    ['비밀번호 알려줘', 'CREDENTIAL_WORD'],
    ['토큰 eyJhbGciOi.abcdefghijk.xyz 로 조회', 'TOKEN'],
    ['Bearer abcdefghijklmnop 로 호출', 'TOKEN'],
  ])('차단한다: %s', (input, reason) => {
    const r = sanitizeForExternal(input);
    expect(r.blocked).toBe(true);
    expect(r.blockReason).toBe(reason);
  });
});

describe('여행 질문의 숫자는 개인정보로 오인하지 않는다', () => {
  test.each([
    '성인 가족 3명, 차 없이 2시간 여행 준비물 알려줘',
    '오동도 12:00 에 가능해? 가격 12,000원',
    '10:00-18:00 운영 확인',
    '아이 셋이 있어요 3명 여수 방문',
    '2026년 11월 19일 날씨',
  ])('변경 없이 통과한다: %s', (input) => {
    const r = sanitizeForExternal(input);
    expect(r.text).toBe(input);
    expect(r.masked).toEqual([]);
    expect(r.blocked).toBe(false);
  });
});

describe('입력 처리', () => {
  test('빈 입력과 null은 차단 없이 빈 문자열을 반환한다', () => {
    expect(sanitizeForExternal('')).toEqual({ text: '', masked: [], blocked: false, blockReason: null });
    expect(sanitizeForExternal(null).text).toBe('');
  });
  test('원문을 반환 객체에 두 번 복사하지 않는다 (masked는 유형 목록만)', () => {
    const r = sanitizeForExternal('010-1234-5678');
    expect(Object.keys(r).sort()).toEqual(['blockReason', 'blocked', 'masked', 'text']);
    expect(JSON.stringify(r.masked)).not.toContain('1234');
  });
  test('전역 정규식 상태에 영향받지 않는다 (반복 호출 결과 동일)', () => {
    const a = sanitizeForExternal('010-0000-0000 준비물');
    const b = sanitizeForExternal('010-0000-0000 준비물');
    expect(b).toEqual(a);
  });
});
