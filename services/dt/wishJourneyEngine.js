'use strict';

/**
 * wishJourneyEngine.js
 * 입력 1개 → 상태 분류 → (장소 반영) 장면/행동 → 방향 → 질문(조건부) → 성장 기록
 */

const cfg = require('./config/starContentConfig');

// ── 1. 상태 분류 엔진 ─────────────────────────────────────────────
const STATE_RULES = [
  { state: 'ANXIETY',    keywords: ['불안', '겁', '두렵', '무서', '떨려'] },
  { state: 'BLOCKED',    keywords: ['못 하겠', '힘들', '지쳐', '포기', '막막'] },
  { state: 'SEARCHING',  keywords: ['모르겠', '방향', '뭘 해야', '길을', '어디로'] },
  { state: 'RELATION',   keywords: ['사람', '관계', '친구', '가족', '사랑', '연인'] },
  { state: 'HESITATION', keywords: ['해야 하는데', '해야 할것 같', '시작해야', '하려고'] },
  { state: 'RECOVERY',   keywords: ['괜찮아', '좀 나아', '나아지', '회복', '쉬고'] },
  { state: 'TRANSITION', keywords: ['바꾸고', '새로운', '전환', '변화', '달라지'] },
  { state: 'GROWTH',     keywords: ['성장', '발전', '나아가', '목표', '이루'] },
];

function classifyState(text) {
  if (!text) return 'SEARCHING';
  for (const rule of STATE_RULES) {
    if (rule.keywords.some(k => text.includes(k))) return rule.state;
  }
  return 'SEARCHING';
}

// ── 2. 장면 엔진 (state + spot_type 반영) ────────────────────────
const SPOT_SCENES = {
  ANXIETY: {
    home:    ['익숙한 공간인데도 마음이 조용히 떨리고 있어요'],
    work:    ['해야 할 것들 사이에서 마음이 먼저 흔들리고 있어요'],
    cafe:    ['사람들 사이에 있어도 혼자인 느낌이 드는 시간이에요'],
    outdoor: ['바람이 조금 세게 불고 있어요, 괜찮아요'],
    transit: ['어딘가로 이동하는 중인데, 마음이 그보다 더 빠르게 움직이고 있어요'],
    default: ['비가 막 그친 바다 위, 물결이 아직 조금 남아 있어요'],
  },
  BLOCKED: {
    home:    ['익숙한 방 안에서 아무것도 하기 어려운 시간이에요'],
    work:    ['해야 할 게 있는데 손이 움직이질 않는 시간이에요'],
    cafe:    ['컵을 앞에 두고 아무것도 안 하고 있는 시간이에요'],
    outdoor: ['걷고는 있는데 발이 왜 여기 있는지 모르겠는 시간이에요'],
    transit: ['멈춰 있는 것도 아닌데 앞으로 나아가는 느낌이 없어요'],
    default: ['아무도 없는 케이블카 정류장, 다음 출발을 기다리고 있어요'],
  },
  SEARCHING: {
    home:    ['익숙한 방 안에 머물러 있는데, 생각만 조금 길어지고 있어요'],
    work:    ['해야 할 것들 사이에서 마음만 잠깐 멈춰 서 있는 시간이에요'],
    cafe:    ['사람들 소리 사이에서 혼자 생각이 더 또렷해지지 못하고 맴돌고 있어요'],
    outdoor: ['발을 옮기는데 어디로 가는지 잘 모르겠는 시간이에요'],
    transit: ['이동하는 중인데, 방향은 정해져 있는데 마음이 아직 따라오지 못하고 있어요'],
    default: ['길이 두 갈래로 나뉘는 곳에서 잠깐 멈춰 있는 시간이에요'],
  },
  RELATION: {
    home:    ['같은 공간에 있어도 마음은 멀리 있는 것 같은 시간이에요'],
    work:    ['옆에 있지만 말이 잘 안 되는 시간이에요'],
    cafe:    ['마주 앉아 있어도 속마음이 닿지 않는 시간이에요'],
    outdoor: ['나란히 걷고 있지만 속도가 조금 달라요'],
    transit: ['같은 방향인데, 마음의 거리가 조금 있어요'],
    default: ['같은 길을 걷지만 속도가 다른 두 사람이 있어요'],
  },
  HESITATION: {
    home:    ['시작할 준비가 다 됐는데 손이 멈춰 있는 시간이에요'],
    work:    ['지금 바로 해야 하는 것 앞에서 잠깐 멈춰 있어요'],
    cafe:    ['모든 게 준비됐는데, 시작 버튼만 아직이에요'],
    outdoor: ['출발선 앞에 서 있는데 발이 아직 떨어지지 않았어요'],
    transit: ['타야 하는 걸 알면서 아직 올라타지 못한 시간이에요'],
    default: ['출발 직전 배, 밧줄 하나가 아직 남아 있어요'],
  },
  RECOVERY: {
    home:    ['집에 돌아온 것 같은 느낌, 조금 숨이 쉬어지고 있어요'],
    work:    ['잠깐 괜찮아진 틈이 생겼어요'],
    cafe:    ['따뜻한 컵 하나가 지금 딱 맞는 시간이에요'],
    outdoor: ['걷다 보니 조금 가벼워진 것 같아요'],
    transit: ['이동하면서 조금씩 풀리고 있어요'],
    default: ['잔잔해진 바다 위에 빛이 번지고 있어요'],
  },
  TRANSITION: {
    home:    ['오늘은 이 공간이 조금 달라 보이는 시간이에요'],
    work:    ['이전과 조금 다른 방식으로 하루가 시작되고 있어요'],
    cafe:    ['평소와 다른 자리에 앉아 있는 기분이에요'],
    outdoor: ['같은 길인데 오늘은 다른 게 보이기 시작해요'],
    transit: ['같은 노선인데 오늘은 다른 방향을 보고 있어요'],
    default: ['불이 하나 둘 켜지며 마을이 드러나고 있어요'],
  },
  GROWTH: {
    home:    ['이 공간에서 이만큼 왔다는 게 느껴지는 시간이에요'],
    work:    ['이전의 나라면 못 했을 것 같은 걸 지금 하고 있어요'],
    cafe:    ['여기 앉아서 생각해보니, 많이 달라진 게 느껴져요'],
    outdoor: ['걷다 보니 처음보다 훨씬 멀리 왔다는 게 보여요'],
    transit: ['이동하면서 보니 출발점이 멀어져 있어요'],
    default: ['위에서 내려다보니 처음 있던 자리가 작아 보이기 시작해요'],
  },
};

// 장소 없을 때 fallback
const DEFAULT_SCENES = {
  ANXIETY:    '돌산대교 위, 한 차만 잠시 멈춰 있는 시간이에요',
  BLOCKED:    '파도가 잦아든 방파제 위, 멀리 불빛이 켜지기 시작해요',
  SEARCHING:  '안개 속 방파제 끝, 등대가 멀리서 깜빡이고 있어요',
  RELATION:   '여수 밤바다 벤치, 두 잔의 커피가 식어가고 있어요',
  HESITATION: '발걸음이 멈춘 선착장 앞, 배는 이미 엔진이 켜져 있어요',
  RECOVERY:   '폭풍 다음 날 아침, 파도가 낮아지고 하늘이 열리고 있어요',
  TRANSITION: '해가 지는 방향으로 걷기 시작하는 사람이 있어요',
  GROWTH:     '산 정상에서 보니 올라온 길이 선명하게 보여요',
};

function pickScene(state, lifeSpot) {
  const spotType = lifeSpot?.spot_type;
  const pool     = spotType
    ? (SPOT_SCENES[state]?.[spotType] || SPOT_SCENES[state]?.default)
    : null;

  if (pool && pool.length > 0) return pool[0];
  return DEFAULT_SCENES[state] || DEFAULT_SCENES.SEARCHING;
}

// ── 3. 행동 엔진 (state + spot_type 반영, 항상 1개) ─────────────
const SPOT_ACTIONS = {
  ANXIETY: {
    home:    '창문을 열고 바깥 공기를 한 번만 느껴보세요',
    work:    '잠깐 자리를 벗어나 물 한 잔 가져와 보세요',
    cafe:    '컵을 두 손으로 감싸 쥐고 숨 한 번만 깊게 쉬어보세요',
    outdoor: '잠깐 멈추고 발 아래 땅을 느껴보세요',
    transit: '눈을 감고 숨 한 번만 깊게 쉬어보세요',
    default: '눈을 감고 숨 한 번만 깊게 쉬어보세요',
  },
  BLOCKED: {
    home:    '자리에서 일어나 방 안을 한 바퀴만 걸어보세요',
    work:    '모니터에서 눈을 떼고 잠깐 스트레칭해보세요',
    cafe:    '컵을 한 모금 마시고, 다시 앉아보세요',
    outdoor: '그냥 한 발짝만 더 걸어보세요',
    transit: '차창 밖을 바라보며 지나가는 것 하나만 기억해보세요',
    default: '자리에서 일어나보세요',
  },
  SEARCHING: {
    home:    '창문을 한번 열고, 떠오르는 것 3개만 적어보세요',
    work:    '모니터에서 눈을 떼고, 지금 가장 중요한 것 1개만 적어보세요',
    cafe:    '컵을 두 손으로 잡고, 지금 떠오르는 생각 1개만 붙잡아보세요',
    outdoor: '걸으면서 떠오르는 것 3개를 속으로 말해보세요',
    transit: '이동하면서 지금 머릿속에 있는 것 중 하나만 골라보세요',
    default: '노트에 떠오르는 것 3개만 적어보세요',
  },
  RELATION: {
    home:    "그 사람에게 문자 한 줄 보내보세요: '나는 지금 이런 마음이야'",
    work:    '지금 하고 싶은 말을 메모로 한 줄만 써보세요',
    cafe:    "옆에 있다면 한 마디만 꺼내보세요: '나 요즘 좀 힘들어'",
    outdoor: '걸으면서 그 사람에게 하고 싶은 말을 속으로 한 번 해보세요',
    transit: '문자 한 줄 쓰고, 보낼지 말지는 나중에 결정해도 돼요',
    default: "한 문장만 보내보세요: '나는 지금 이런 마음이야'",
  },
  HESITATION: {
    home:    '지금 있는 자리에서 10초만 행동해보세요',
    work:    '지금 해야 하는 것 중 가장 작은 것 하나만 시작해보세요',
    cafe:    '노트 앱 열고 첫 줄만 써보세요',
    outdoor: '그냥 걸어가보세요, 생각은 나중에 해도 돼요',
    transit: '도착하면 바로 할 것 하나만 정해보세요',
    default: '지금 바로 10초만 행동해보세요',
  },
  RECOVERY: {
    home:    '지금 이 편안함을 한 문장으로 기록해보세요',
    work:    '잠깐 쉬는 지금, 이 느낌을 메모해두세요',
    cafe:    '지금 이 여유로운 순간을 한 줄로 남겨보세요',
    outdoor: '지금 느끼는 것을 속으로 한 번 말해보세요',
    transit: '지금 상태를 한 문장으로 마음속에 새겨보세요',
    default: '지금 상태를 한 문장으로 남겨보세요',
  },
  TRANSITION: {
    home:    '오늘 바꾸고 싶은 것 하나만 적어보세요',
    work:    '다음에 다르게 해보고 싶은 것 하나만 정해보세요',
    cafe:    '이 변화를 한 줄로 기록해보세요',
    outdoor: '걸으면서 달라진 것 하나를 떠올려보세요',
    transit: '도착하면 하나만 다르게 해보기로 결심해보세요',
    default: '다음 행동 하나만 정해보세요',
  },
  GROWTH: {
    home:    '처음과 지금을 비교해 한 줄로 써보세요',
    work:    '오늘 잘한 것 하나만 인정해보세요',
    cafe:    '이 성장을 한 줄로 기록해보세요',
    outdoor: '걷다 보니 달라진 게 느껴지는 것 하나를 말해보세요',
    transit: '이동하면서 지금까지 잘한 것 하나를 떠올려보세요',
    default: '처음과 지금을 한 줄로 비교해보세요',
  },
};

function pickAction(state, lifeSpot) {
  const spotType = lifeSpot?.spot_type;
  return (spotType && SPOT_ACTIONS[state]?.[spotType])
    || SPOT_ACTIONS[state]?.default
    || SPOT_ACTIONS[state]?.default;
}

// ── 4. 방향 메시지 ────────────────────────────────────────────────
const DIRECTIONS = {
  ANXIETY:    '두려움이 있다는 건 이미 시작선에 와 있다는 뜻이에요',
  BLOCKED:    '지금은 멈춰 있는 게 아니라 준비 중일 수 있어요',
  SEARCHING:  '방향을 찾는 건 원래 이렇게 시작됩니다',
  RELATION:   '관계는 맞추는 게 아니라 알아가는 과정이에요',
  HESITATION: '변화는 첫 움직임에서 시작됩니다',
  RECOVERY:   '조금 괜찮아졌다면 그걸로 충분합니다',
  TRANSITION: '이건 전환의 순간일 수 있어요',
  GROWTH:     '이미 충분히 멀리 와 있습니다',
};

// ── 5. 브릿지 메시지 ─────────────────────────────────────────────
const BRIDGE_MESSAGES = {
  ANXIETY:    '지금은 그 사이에 머물러 있는 시간이에요',
  BLOCKED:    '움직임이 없는 것처럼 보여도, 안에서는 뭔가 쌓이고 있어요',
  SEARCHING:  '아직 모르는 게 당연한 시간이에요',
  RELATION:   '마음의 속도가 다르다는 게 틀린 게 아니에요',
  HESITATION: '멈춰 있는 게 아니라 이미 그 앞까지 와 있어요',
  RECOVERY:   '괜찮아지는 것도 용기가 필요합니다',
  TRANSITION: '지금 이 낯선 느낌이 변화의 신호일 수 있어요',
  GROWTH:     '여기까지 오는 데 얼마나 많은 날이 있었는지 기억하세요',
};

// ── 6. Question Trigger 엔진 (문구는 config에서 관리) ───────────
const QUESTIONS = cfg.QUESTION_MESSAGES;

function last3StatesSame(currentState, history) {
  if (!Array.isArray(history) || history.length < 2) return false;
  return history.slice(-2).every(h => h.state === currentState);
}

function shouldTriggerQuestion({ state, history }) {
  if ((state === 'BLOCKED' || state === 'SEARCHING') && last3StatesSame(state, history)) {
    return { needed: true, type: 'BLOCK' };
  }
  if (state === 'ANXIETY') {
    return { needed: true, type: 'EMOTION' };
  }
  if (state === 'RECOVERY' || state === 'GROWTH') {
    return { needed: true, type: 'GROWTH' };
  }
  return { needed: false, type: null };
}

// ── 7. Growth SSOT 스키마 ─────────────────────────────────────────
const EMOTION_SIGNALS = {
  ANXIETY:    '두려움이 앞에 있음',
  BLOCKED:    '정체되어 있음',
  SEARCHING:  '정리되지 않음',
  RELATION:   '연결을 원함',
  HESITATION: '실행 직전 망설임',
  RECOVERY:   '조금씩 나아지는 중',
  TRANSITION: '변화의 흐름 안에 있음',
  GROWTH:     '성장이 느껴지는 순간',
};

const HELP_TAGS = {
  ANXIETY:    '위로',
  BLOCKED:    '정리',
  SEARCHING:  '정리',
  RELATION:   '연결',
  HESITATION: '결심',
  RECOVERY:   '위로',
  TRANSITION: '결심',
  GROWTH:     '실행',
};

function generateGrowth(state) {
  return {
    state,
    emotion_signal:  EMOTION_SIGNALS[state] || '알 수 없음',
    help_tag:        HELP_TAGS[state]        || '정리',
    growth_sentence: cfg.getGrowthSentence(),
    timestamp:       new Date().toISOString(),
  };
}

// ── 8. 응답 생성기 ────────────────────────────────────────────────
function generateResponse({ wish_text = '', user_state = '', history = [], lifeSpot = null }) {
  const inputText    = `${wish_text} ${user_state}`.trim();
  const state        = classifyState(inputText);
  const scene        = pickScene(state, lifeSpot);
  const action       = pickAction(state, lifeSpot);
  const direction    = DIRECTIONS[state];
  const message      = BRIDGE_MESSAGES[state];
  const questionMeta = shouldTriggerQuestion({ state, history });
  const question     = questionMeta.needed
    ? { ...cfg.getQuestion(questionMeta.type), needed: true, type: questionMeta.type }
    : null;
  const growth = generateGrowth(state);

  const life_spot = lifeSpot
    ? { id: lifeSpot.id, spot_name: lifeSpot.spot_name, spot_type: lifeSpot.spot_type }
    : null;

  return { state, scene, message, action, direction, life_spot, question, growth };
}

module.exports = {
  classifyState,
  pickScene,
  pickAction,
  shouldTriggerQuestion,
  generateGrowth,
  generateResponse,
  STATES:     STATE_RULES.map(r => r.state),
  SPOT_SCENES,
  SPOT_ACTIONS,
  DIRECTIONS,
  QUESTIONS,
};
