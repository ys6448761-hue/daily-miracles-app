'use strict';

/**
 * emotionService.js
 *
 * wish_text 기반 감정 태그(emotion_tag) 결정론적 생성.
 * 별의 감정 DNA — 이후 의미 문장 / 성장 메시지 / 추천 콘텐츠의 기반.
 *
 * 절대 규칙:
 *   ❌ AI 호출 금지
 *   ❌ 랜덤 금지
 *   ✅ 100% deterministic (동일 텍스트 → 동일 태그)
 *
 * 우선순위: 위에서 아래 순서로 첫 매칭 반환
 * fallback: 'growth'
 */

// ── 키워드 룰 (우선순위 순) ──────────────────────────────────────
// 실 wish_text 데이터 기반으로 확장
const RULES = [
  {
    tag: 'self_love',
    keywords: ['사랑하고싶', '사랑하고 싶', '나를 사랑', '나를 더 사랑', '자신을 사랑', '스스로를 사랑', '자존감', '나 자신', '자기 자신', '사랑받'],
  },
  {
    tag: 'joy',
    keywords: ['행복', '즐거', '기쁨', '웃음', '설레', '신나', '즐길', '행복하'],
  },
  {
    tag: 'healing',
    keywords: ['힘들', '지치', '아프', '치유', '쉬고', '위로', '회복', '상처', '버티', '힘내', '우울', '외로', '고통', '슬프'],
  },
  {
    tag: 'courage',
    keywords: ['도전', '시작', '두려', '용기', '해보고', '해내', '극복', '무서', '겁나', '못 했던', '첫', '새로운'],
  },
  {
    tag: 'decision',
    keywords: ['결정', '선택', '그만', '포기', '방향', '결심', '결단', '바꾸', '떠나', '끝내'],
  },
  {
    tag: 'connection',
    keywords: ['관계', '연결', '가족', '친구', '사람', '함께', '곁에', '그립', '따뜻함', '사이', '연인', '부모', '자녀', '혼자', '외톨'],
  },
  {
    tag: 'growth',
    keywords: ['성장', '변화', '나아', '발전', '더 나은', '어제보다', '조금씩', '꾸준', '노력', '목표', '꿈'],
  },
];

/**
 * wish_text → emotion_tag
 * @param {string|null} text  소원 원문
 * @returns {string}          emotion_tag
 */
function getEmotionTag(text) {
  if (!text) return 'growth';

  const t = text.toLowerCase();

  for (const { tag, keywords } of RULES) {
    if (keywords.some(kw => t.includes(kw))) return tag;
  }

  return 'growth'; // fallback
}

module.exports = { getEmotionTag };
