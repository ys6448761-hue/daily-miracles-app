'use strict';

/**
 * starMeaningService.js
 *
 * 별의 감정(emotion_tag) + 위치(zone)를 결합하여
 * "왜 이 위치인가"를 설명하는 의미 문장 생성.
 *
 * 데이터 → 스토리 전환 지점:
 *   위치(PR-1) + 감정(PR-2) → 의미(PR-3)
 *
 * 절대 규칙:
 *   ❌ GPT 호출 금지
 *   ❌ 랜덤 금지
 *   ✅ wish_id 해시 기반 100% deterministic
 */

// ── 템플릿 (5종) ────────────────────────────────────────────────
const TEMPLATES = [
  '당신의 [emotion]은 [meaning]과 닮아 [place]에 자리 잡았습니다',
  '당신의 [emotion]이 [meaning]을 향해 흐르며 [place] 위에 빛나고 있습니다',
  '당신은 [emotion]을 선택했고, 그 선택은 [meaning]으로 이어져 [place]에 닿았습니다',
  '지금의 당신은 [emotion]을 지나 [meaning]에 가까워지고 있습니다. 그 길 위에 [place]가 있습니다',
  '당신의 [emotion]은 [meaning]을 향해 가고 있고, 그 시작이 [place]에서 빛나고 있습니다',
];

// ── 감정 태그 → 한국어 ──────────────────────────────────────────
const EMOTION_MAP = {
  self_love:  '자기사랑',
  healing:    '회복',
  courage:    '용기',
  decision:   '결단',
  connection: '연결',
  growth:     '성장',
  joy:        '기쁨',
};

// ── zone_code → 의미 문구 ───────────────────────────────────────
const ZONE_MEANING = {
  'S-1': '다시 시작하는 마음',
  'S-2': '다시 이어지는 관계',
  'S-3': '조용히 빛나는 안정',
  'W-1': '열려 있는 만남',
  'W-2': '따뜻하게 이어지는 감정',
  'W-3': '일상 속 연결',
  'N-1': '첫 걸음을 내딛는 용기',
  'N-2': '더 높이 오르는 의지',
  'N-3': '넓어지는 시야',
  'E-1': '살아나는 성장',
  'E-2': '확장되는 관점',
  'E-3': '맑아지는 통찰',
};

/**
 * hash → 템플릿 선택 (5종 순환)
 * @param {number} hash  uint32
 * @returns {string}
 */
function pickTemplate(hash) {
  return TEMPLATES[hash % TEMPLATES.length];
}

// ── 한국어 받침 → 조사 선택 ────────────────────────────────────
function hasBatchim(word) {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}

function josa(word, pairs) {
  // pairs: '은/는' | '이/가' | '을/를' | '과/와'
  const [withB, withoutB] = pairs.split('/');
  return word + (hasBatchim(word) ? withB : withoutB);
}

/**
 * 감정 + 위치 → 의미 문장
 *
 * @param {object} params
 * @param {string} params.emotion_tag  dt_stars.emotion_tag
 * @param {object} params.zone         { zone_code, place_name }
 * @param {number} params.hash         wish_id 기반 uint32 해시
 * @returns {string}
 */
function generateStarMeaning({ emotion_tag, zone, hash }) {
  const emotion = EMOTION_MAP[emotion_tag] ?? '성장';
  const meaning = ZONE_MEANING[zone.zone_code] ?? '의미 있는 변화';
  const place   = zone.place_name;

  // 조사 포함 치환 (순서 중요 — 패턴 긴 것 먼저)
  return pickTemplate(hash)
    .replace('[emotion]은', josa(emotion, '은/는'))
    .replace('[emotion]이', josa(emotion, '이/가'))
    .replace('[emotion]을', josa(emotion, '을/를'))
    .replace('[meaning]과', josa(meaning, '과/와'))
    .replace('[meaning]을', josa(meaning, '을/를'))
    .replace('[meaning]', meaning)
    .replace('[emotion]', emotion)
    .replace('[place]',   place);
}

module.exports = { generateStarMeaning, pickTemplate };
