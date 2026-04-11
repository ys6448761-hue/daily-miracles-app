'use strict';

/**
 * auroraInterviewService.js — Aurora5 파트너 면접 자동 심사
 *
 * 규칙 기반 심사 (GPT 없음 — 비용 Zero, 응답 즉각)
 * 확장: GPT 레이어 추가 시 evaluateWithGPT() 함수만 추가하면 됨.
 */

// 5문항 정의 — 프론트엔드와 SSOT 공유
const QUESTIONS = [
  {
    id: 'q1',
    text: '사장님의 공간은 어떤 곳인가요? 손님들이 이 공간에서 주로 어떤 감정을 경험하나요?',
    type: 'textarea',
    placeholder: '편하게 적어주세요',
  },
  {
    id: 'q2',
    text: '사장님 공간에 오는 손님들이 마음속에 어떤 소원을 품고 있을 것 같으신가요?',
    type: 'textarea',
    placeholder: '손님들의 마음을 상상해보세요',
  },
  {
    id: 'q3',
    text: '우리 플랫폼에는 4가지 별의 집이 있어요. 사장님 공간은 어디에 가장 가깝나요?',
    type: 'radio',
    options: [
      { value: 'healing',      label: '✦ 치유 — 잠깐 쉬고 싶은 마음' },
      { value: 'relationship', label: '✦ 관계 — 소중한 사람과 함께' },
      { value: 'challenge',    label: '✦ 도전 — 새로 시작하고 싶은 용기' },
      { value: 'growth',       label: '✦ 성장 — 이 순간을 기억하고 싶어' },
    ],
  },
  {
    id: 'q4',
    text: '별들의 고향 파트너로서 소원이들에게 어떤 경험을 드리고 싶으신가요?',
    type: 'textarea',
    placeholder: '한 문장으로 약속해주세요',
  },
  {
    id: 'q5',
    text: '마지막으로 확인해주세요',
    type: 'checkbox',
    options: [
      { id: 'op1', label: '현재 정상 영업 중입니다' },
      { id: 'op2', label: 'QR 카드를 손님이 보이는 곳에 놓을 수 있습니다' },
      { id: 'op3', label: '소원이 손님을 따뜻하게 맞이할 수 있습니다' },
    ],
  },
];

// 금지 키워드 — 세계관 충돌 즉시 거절
const FORBIDDEN_KEYWORDS = ['사주', '운세', '점술', '관상', '무당', '귀신', '저주'];

// 돈 중심 답변 감지 — 점수 차감
const MONEY_KEYWORDS = ['매출', '수익', '돈', '수수료', '광고', '마케팅'];

/**
 * 신청서 자동 심사
 * @param {Object} application
 * @returns {{ verdict: string, score: number, reason: string, galaxy_assigned: string }}
 */
function evaluateApplication(application) {
  let score = 0;
  const reasons = [];

  // ① Q5 기본 운영 조건 (필수 — 미통과 시 즉시 거절)
  const ops = application.q5_operations || {};
  if (!ops.op1 || !ops.op2 || !ops.op3) {
    return {
      verdict:        'rejected',
      score:          0,
      reason:         '운영 기본 조건 미충족',
      galaxy_assigned: application.q3_galaxy_choice || null,
    };
  }
  score += 40;
  reasons.push('Q5 운영 조건 통과 +40');

  // ② 금지 키워드 체크 (즉시 거절)
  const allText = [
    application.q1_space_intro   || '',
    application.q2_wish_connection || '',
    application.q4_promise        || '',
  ].join(' ');

  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (allText.includes(keyword)) {
      return {
        verdict:        'rejected',
        score:          0,
        reason:         `세계관 충돌 키워드 감지: "${keyword}"`,
        galaxy_assigned: application.q3_galaxy_choice || null,
      };
    }
  }
  score += 20;
  reasons.push('금지 키워드 없음 +20');

  // ③ 답변 성의 체크 (글자 수)
  const q1len = (application.q1_space_intro  || '').length;
  const q4len = (application.q4_promise      || '').length;

  if (q1len >= 30) { score += 20; reasons.push('Q1 성의 있는 답변 +20'); }
  else if (q1len >= 10) { score += 10; reasons.push('Q1 짧은 답변 +10'); }

  if (q4len >= 10) { score += 20; reasons.push('Q4 약속 작성 +20'); }
  else { reasons.push('Q4 약속 짧음'); }

  // ④ 돈 중심 답변 감지 — 점수 차감
  let moneyCount = 0;
  for (const kw of MONEY_KEYWORDS) {
    if ((application.q4_promise || '').includes(kw)) moneyCount++;
  }
  if (moneyCount >= 2) {
    score -= 20;
    reasons.push('Q4 상업적 키워드 감지 -20');
  }

  // ⑤ 최종 판정
  let verdict;
  if (score >= 80) {
    verdict = 'approved';
  } else if (score >= 60) {
    verdict = 'approved';   // 60+ 자동 승인 (여수 초기 단계 — 너그럽게)
  } else if (score >= 40) {
    verdict = 'manual';     // 수동 검토
  } else {
    verdict = 'rejected';
  }

  return {
    verdict,
    score,
    reason: reasons.join(' | '),
    galaxy_assigned: application.q3_galaxy_choice || null,
  };
}

module.exports = { QUESTIONS, evaluateApplication };
