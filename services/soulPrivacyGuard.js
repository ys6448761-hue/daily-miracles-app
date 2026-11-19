'use strict';

// PHX-SOUL-QA-001 §29 — Privacy Guard for external LLM calls.
// 외부 LLM으로 보내기 직전에 적용한다. Feature Flag와 무관하게 모든 SOUL 외부 호출 경로가 사용한다.
// 원칙: 여행 질문의 핵심 문장은 남기고 식별 값만 치환한다. 식별자·인증정보가 남으면 외부 호출을 생략한다.
// 주의: 이 모듈은 원문을 저장하거나 로그에 남기지 않는다. 반환값의 text만 외부로 보낸다.
// 한계: 이름(자기소개 패턴), 주소(행정구역 패턴), 자유 서술 민감정보는 완전히 탐지하지 못한다. (Evidence §29 잔여 위험)

const PHONE = /(?<![\d-])(?:\+?82[-.\s]?)?(?:0?1[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}(?![\d-])/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
// 검사용 비전역 사본 (전역 정규식의 test()는 lastIndex 상태를 바꾸므로 사용하지 않는다)
const PHONE_TEST = new RegExp(PHONE.source);
const EMAIL_TEST = new RegExp(EMAIL.source);
const RRN = /(?<!\d)\d{6}[-\s]?[1-8]\d{6}(?!\d)/;
const CARD = /(?<!\d)\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}(?!\d)/;
const TOKEN = /(eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}|sk-[A-Za-z0-9]{16,}|Bearer\s+[A-Za-z0-9._-]{10,})/i;
const RESERVATION = /((?:예약|주문|결제|접수|확인)\s*(?:번호|코드|ID|id|아이디)\s*(?:은|는|이|가)?\s*[:：]?\s*)([A-Za-z0-9-]{4,})/g;
const CREDENTIAL_WORD = /(계좌\s*번호|계좌번호|비밀번호|패스워드|인증\s*번호|인증코드|OTP|카드\s*번호|주민\s*등록\s*번호|주민번호|여권\s*번호)/i;
const LONG_DIGITS = /(?<!\d)\d{9,}(?!\d)/g;
const SELF_NAME = /((?:제|저의|고객)\s*(?:이름|성함)\s*(?:은|는|이|가)\s*)[가-힣]{2,4}(?=(?:이에요|예요|입니다|이야|야)?(?:\s|$|[.,!?]))(?:이에요|예요|입니다|이야|야)?/g;
const ADDRESS = /[가-힣]{1,6}(?:특별시|광역시|특별자치시|특별자치도|도|시|군|구)\s*[가-힣0-9]{1,8}(?:구|시|군|읍|면|동|로|길)\s*[가-힣0-9-]{0,12}\s*\d{1,5}(?:-\d{1,5})?(?:번지|번길)?/g;

// sanitizeForExternal(text) → { text, masked, blocked, blockReason }
//   masked: 치환된 항목 유형 목록 (값은 포함하지 않는다)
//   blocked: true면 외부 LLM 호출을 생략하고 내부 답변을 사용한다
// 마스킹 중 예외가 나면 원문을 보내지 않도록 차단으로 처리한다 (fail-closed).
function sanitizeForExternal(input) {
  try {
    return _sanitize(input);
  } catch (_) {
    return { text: '', masked: [], blocked: true, blockReason: 'SANITIZE_ERROR' };
  }
}

function _sanitize(input) {
  const src = String(input == null ? '' : input);
  const masked = [];
  let blockReason = null;

  if (RRN.test(src)) blockReason = 'RRN';
  else if (CARD.test(src)) blockReason = 'CARD';
  else if (TOKEN.test(src)) blockReason = 'TOKEN';
  else if (CREDENTIAL_WORD.test(src)) blockReason = 'CREDENTIAL_WORD';

  let t = src;
  const replaceAll = (re, rep, type) => {
    const before = t;
    t = t.replace(re, rep);
    if (t !== before) masked.push(type);
  };
  replaceAll(EMAIL, '[이메일]', 'EMAIL');
  replaceAll(PHONE, '[전화번호]', 'PHONE');
  replaceAll(RESERVATION, (m, pre) => `${pre}[예약번호]`, 'RESERVATION');
  replaceAll(SELF_NAME, (m, pre) => `${pre}[이름]`, 'NAME');
  replaceAll(ADDRESS, '[주소]', 'ADDRESS');
  replaceAll(LONG_DIGITS, '[번호]', 'LONG_DIGITS');

  // 치환 후에도 식별자가 남으면 차단 (예: 전화 패턴이 치환되지 않은 경우의 안전망)
  if (!blockReason && (PHONE_TEST.test(t) || EMAIL_TEST.test(t))) blockReason = 'RESIDUAL_IDENTIFIER';

  return { text: t, masked, blocked: blockReason !== null, blockReason };
}

// 내부 안내 문구 (차단 시 외부 호출 없이 반환)
const BLOCKED_NOTICE = '개인정보나 인증정보가 포함되어 있어 외부로 전송하지 않았어요. 여행 조건(인원, 이동수단, 시간, 장소)만 알려주시면 이어서 도와드릴게요.';

module.exports = { sanitizeForExternal, BLOCKED_NOTICE };
