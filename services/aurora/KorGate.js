/**
 * Aurora KOR Gate (KOR-01~05)
 *
 * VID-003~004: 한글 자막 무결성 5단계 검증
 * 하나라도 실패 시 릴리즈 금지
 *
 * KOR-01: 한글 조합형 깨짐 여부 (U+FFFD, 분리형 자모 탐지)
 * KOR-02: 이모지 포함 시 정상 렌더 여부 (손상 시퀀스 탐지)
 * KOR-03: UTF-8 BOM 여부 (BOM = 즉시 실패)
 * KOR-04: ASS 파일 NFC 인코딩 무결성 (ZIP UTF-8 플래그 대체)
 * KOR-05: ASS 파일 내 폰트 명시 확인 (Fontname 라인 필수)
 */

'use strict';

// ── 상수 ─────────────────────────────────────────────────────────────────────
const HANGUL_RANGE   = /[\uAC00-\uD7AF]/;   // 한글 완성형
const JAMO_RANGE     = /[\u1100-\u11FF\u3130-\u318F]/; // 한글 낱자 (분리형)
const REPLACEMENT    = /\uFFFD/;             // Unicode 교체 문자 (깨짐)
const UTF8_BOM       = '\uFEFF';             // BOM
// ASS Style 라인: "Style: Default,Noto Sans KR,48,..."
// → 스타일명([^,]+) 이후 쉼표, 그 다음 폰트명([^,]+) 캡처
const FONT_NAME_LINE = /^Style:\s*[^,]+,([^,]+),/m;
const VALID_EMOJI_RANGE = /\p{Emoji}/u;

// 손상된 surrogate 탐지 (unpaired)
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/**
 * KOR-01: 한글 조합형 깨짐 여부
 * - U+FFFD 교체 문자 존재 시 FAIL
 * - 한글 분리 자모만 있고 완성형 없을 때 WARN (soft)
 */
function checkHangulIntegrity(text) {
  if (REPLACEMENT.test(text)) {
    return { pass: false, detail: 'U+FFFD 교체 문자 발견 (한글 깨짐)' };
  }

  const hasHangul = HANGUL_RANGE.test(text);
  const hasJamo   = JAMO_RANGE.test(text);

  // 분리형 자모만 있으면 조합 실패 가능성
  if (!hasHangul && hasJamo) {
    return { pass: false, detail: '한글 낱자만 존재, 완성형 조합 실패 가능성' };
  }

  return { pass: true, detail: hasHangul ? '한글 완성형 정상' : '한글 없음 (통과)' };
}

/**
 * KOR-02: 이모지 포함 시 정상 렌더 여부
 * - Lone surrogate 발견 시 FAIL
 * - 이모지 없으면 PASS (skip)
 */
function checkEmojiIntegrity(text) {
  if (LONE_SURROGATE.test(text)) {
    return { pass: false, detail: 'Unpaired surrogate 발견 (이모지 손상)' };
  }

  const hasEmoji = VALID_EMOJI_RANGE.test(text);
  if (!hasEmoji) {
    return { pass: true, detail: '이모지 없음 (해당 없음)' };
  }

  // 이모지가 있는 경우: NFC 적용 후 동일성 검사
  const normalized = text.normalize('NFC');
  if (normalized !== text) {
    return {
      pass:   false,
      detail: '이모지 포함 텍스트가 NFC 정규화 전후 불일치 (렌더 손상 위험)',
    };
  }

  return { pass: true, detail: `이모지 포함, 정상 인코딩 확인` };
}

/**
 * KOR-03: UTF-8 BOM 여부
 * - BOM(EF BB BF / U+FEFF) 시작 시 FAIL
 */
function checkNoBOM(text) {
  if (text.startsWith(UTF8_BOM)) {
    return { pass: false, detail: 'UTF-8 BOM 발견 (EF BB BF) — 제거 필요' };
  }
  return { pass: true, detail: 'BOM 없음' };
}

/**
 * KOR-04: ASS 파일 NFC 인코딩 무결성
 * (ZIP UTF-8 플래그의 Aurora 파이프라인 대체 검사)
 * - ASS 내용이 NFC 정규화 후 동일해야 PASS
 * - U+FFFD 포함 시 FAIL
 */
function checkAssEncoding(assContent) {
  if (!assContent) {
    return { pass: false, detail: 'ASS 내용이 비어있음' };
  }

  if (REPLACEMENT.test(assContent)) {
    return { pass: false, detail: 'ASS 파일에 U+FFFD 발견 (UTF-8 손상)' };
  }

  const normalized = assContent.normalize('NFC');
  if (normalized !== assContent) {
    return {
      pass:   false,
      detail: 'ASS 파일 내용이 NFC 정규화 전후 불일치 (UTF-8 플래그 손상 위험)',
    };
  }

  return { pass: true, detail: 'ASS NFC 인코딩 무결' };
}

/**
 * KOR-05: ASS 파일 내 폰트 명시 확인
 * - [V4+ Styles] 섹션에 Fontname 라인 필수
 * - "Noto Sans KR" 이어야 PASS (서비스 브랜드 폰트 고정)
 */
function checkAssFont(assContent) {
  if (!assContent) {
    return { pass: false, detail: 'ASS 내용이 비어있음' };
  }

  if (!assContent.includes('[V4+ Styles]')) {
    return { pass: false, detail: 'ASS [V4+ Styles] 섹션 없음' };
  }

  // Style: Default,Noto Sans KR,... 형식에서 폰트 추출
  const match = assContent.match(FONT_NAME_LINE);
  if (!match) {
    return { pass: false, detail: 'ASS Style 라인에서 폰트명 추출 실패' };
  }

  const fontName = match[1].trim();
  const isNotoKR = fontName.toLowerCase().includes('noto') &&
                   (fontName.toLowerCase().includes('kr') || fontName.toLowerCase().includes('cjk'));

  if (!isNotoKR) {
    return {
      pass:   false,
      detail: `ASS 폰트가 Noto Sans KR이 아님 (발견: "${fontName}")`,
    };
  }

  return { pass: true, detail: `ASS 폰트 확인: "${fontName}"` };
}

// ── 전체 실행 ─────────────────────────────────────────────────────────────────
/**
 * KOR Gate 전체 실행 (KOR-01 ~ KOR-05)
 *
 * @param {string} srtContent  SRT 원문 텍스트
 * @param {string} assContent  변환된 ASS 전체 내용
 * @returns {{ allPassed: boolean, passed: number, total: number, results: object[] }}
 */
function runKorGate(srtContent, assContent) {
  const checks = [
    { id: 'KOR-01', name: '한글 조합형 깨짐', fn: () => checkHangulIntegrity(srtContent) },
    { id: 'KOR-02', name: '이모지 렌더 무결',  fn: () => checkEmojiIntegrity(srtContent) },
    { id: 'KOR-03', name: 'UTF-8 BOM 금지',   fn: () => checkNoBOM(srtContent) },
    { id: 'KOR-04', name: 'ASS NFC 인코딩',   fn: () => checkAssEncoding(assContent) },
    { id: 'KOR-05', name: 'ASS 폰트 명시',    fn: () => checkAssFont(assContent) },
  ];

  const results = checks.map(({ id, name, fn }) => {
    try {
      const { pass, detail } = fn();
      return { id, name, pass, detail };
    } catch (err) {
      return { id, name, pass: false, detail: `검사 오류: ${err.message}` };
    }
  });

  const passed    = results.filter(r => r.pass).length;
  const allPassed = passed === results.length;

  return { allPassed, passed, total: results.length, results };
}

module.exports = {
  runKorGate,
  // 개별 노출 (단위 테스트용)
  checkHangulIntegrity,
  checkEmojiIntegrity,
  checkNoBOM,
  checkAssEncoding,
  checkAssFont,
};
