'use strict';

/**
 * starContentConfig.js
 * 모든 UX 문구를 한 곳에서 관리 — 코드 수정 없이 튜닝 가능
 *
 * 튜닝 방법: 이 파일만 수정 → 서버 재시작 → 즉시 반영
 * A/B 테스트: EXPERIMENT_FLAGS.phase_variant / action_variant 를 "B" 로 변경
 */

// ── A/B 테스트 슬롯 ───────────────────────────────────────────────
const EXPERIMENT_FLAGS = {
  phase_variant:  'A', // 'A' | 'B'
  action_variant: 'A', // 'A' | 'B'
};

// ── Phase 메시지 (variant A/B 분기 가능) ─────────────────────────
const PHASE_MESSAGES = {
  A: {
    '시작':    ['이제 막 시작된 시간이에요'],
    '흔들림':  ['조금 흔들리고 있는 구간이에요'],
    '정리':    ['방향이 정리되고 있어요'],
    '실행 전': ['이제 움직일 준비가 됐어요'],
    '회복':    ['조금 괜찮아지고 있어요'],
    '전환':    ['무언가 바뀌고 있어요'],
    '성장':    ['이미 많이 올라왔어요'],
  },
  B: {
    '시작':    ['첫 발이 시작됐어요'],
    '흔들림':  ['흔들리는 건 살아있다는 뜻이에요'],
    '정리':    ['같은 자리에서 머물던 시간이 조금씩 흐르기 시작했어요'],
    '실행 전': ['한 발만 더 내딛으면 돼요'],
    '회복':    ['숨이 조금 쉬어지기 시작했어요'],
    '전환':    ['오늘은 뭔가 달라 보이는 날이에요'],
    '성장':    ['처음 있던 자리가 작아 보이기 시작해요'],
  },
};

// ── Next Action 메시지 ────────────────────────────────────────────
const ACTION_MESSAGES = {
  A: {
    '시작':    ['오늘 떠오르는 것 하나만 적어볼까요'],
    '흔들림':  ['지금 숨 한 번만 쉬어볼까요'],
    '정리':    ['지금은 하나만 정해볼까요'],
    '실행 전': ['10초만 행동해볼까요'],
    '회복':    ['지금 상태를 한 줄로 남겨볼까요'],
    '전환':    ['다음에 다르게 해볼 것 하나만 정해볼까요'],
    '성장':    ['처음과 지금을 한 줄로 비교해볼까요'],
    DEFAULT:   ['지금 하나만 해볼까요', '숨 한번만 쉬어볼까요', '한 줄만 적어볼까요'],
  },
  B: {
    '시작':    ['지금 마음속 첫 문장 하나만 써봐요'],
    '흔들림':  ['눈 감고 세 번만 숨 쉬어봐요'],
    '정리':    ['가장 중요한 것 딱 하나만 골라봐요'],
    '실행 전': ['지금 바로 시작, 10초만이요'],
    '회복':    ['이 느낌, 한 문장으로 남겨봐요'],
    '전환':    ['오늘 딱 하나만 다르게 해봐요'],
    '성장':    ['여기까지 온 나에게 한 마디 해봐요'],
    DEFAULT:   ['지금 하나만 해볼까요', '숨 한번만 쉬어볼까요', '한 줄만 적어볼까요'],
  },
};

// ── Question 문구 ─────────────────────────────────────────────────
const QUESTION_MESSAGES = {
  BLOCK: {
    text:    ['지금 뭐가 가장 걸리고 있나요?'],
    options: ['시간', '감정', '사람', '모르겠어요'],
  },
  EMOTION: {
    text:    ['지금 마음에 가장 가까운 건 무엇인가요?'],
    options: ['불안', '답답', '지침', '괜찮음'],
  },
  GROWTH: {
    text:    ['지금 느낌을 남겨볼까요?'],
    options: ['조금 가벼워졌어요', '조금 또렷해졌어요', '조금 용감해졌어요'],
  },
};

// ── Growth 문장 ───────────────────────────────────────────────────
const GROWTH_SENTENCES = [
  '조금 가벼워졌어요',
  '조금 또렷해졌어요',
  '조금 용감해졌어요',
];

// ── 랜덤 선택 ─────────────────────────────────────────────────────
function pickRandom(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 외부 접근용 헬퍼 (variant 자동 적용) ─────────────────────────
function getPhaseMessage(phase) {
  const variant = EXPERIMENT_FLAGS.phase_variant;
  const map     = PHASE_MESSAGES[variant] || PHASE_MESSAGES.A;
  return pickRandom(map[phase] || map['시작']);
}

function getNextAction(phase) {
  const variant = EXPERIMENT_FLAGS.action_variant;
  const map     = ACTION_MESSAGES[variant] || ACTION_MESSAGES.A;
  return pickRandom(map[phase] || map.DEFAULT);
}

function getQuestion(type) {
  const q = QUESTION_MESSAGES[type];
  if (!q) return null;
  return { text: pickRandom(q.text), options: q.options };
}

function getGrowthSentence() {
  return pickRandom(GROWTH_SENTENCES);
}

module.exports = {
  EXPERIMENT_FLAGS,
  PHASE_MESSAGES,
  ACTION_MESSAGES,
  QUESTION_MESSAGES,
  GROWTH_SENTENCES,
  pickRandom,
  getPhaseMessage,
  getNextAction,
  getQuestion,
  getGrowthSentence,
};
