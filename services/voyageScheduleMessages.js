/**
 * DreamTown — Voyage Schedule Messages
 * 별 탄생 시 D+1~D+7 Aurora5 응원메시지 풀 (은하별 5개, 6~7일차 순환)
 * MyStar.jsx AURORA5_MESSAGES와 동기화 유지
 */

const AURORA5_POOL = {
  growth: [
    '오늘도 한 걸음 움직였군요.\n성장은 방향이 아니라 움직임에서 시작돼요.\n지금 이 방향이 맞는지 몰라도 괜찮아요.',
    '어떤 날은 앞이 아니라 옆으로 가기도 해요.\n그것도 성장이에요.\n오늘 어디로든 한 발 내딛어봐요.',
    '결과보다 과정이 쌓이고 있어요.\n보이지 않아도 분명히요.\n오늘 한 가지, 완벽하지 않아도 시작해봐요.',
    '움직임이 곧 방향을 만들어요.\n멈춰 있을 때보다 조금 나아갈 때 길이 보여요.\n오늘 가장 작은 것 하나를 해봐요.',
    '성장은 느리게 오는 것 같아도,\n돌아보면 이미 멀리 와 있어요.\n오늘도 그 길 위에 있어요.',
  ],
  challenge: [
    '두려워도 여기까지 왔어요.\n두려움은 약함이 아니라 진지함의 증거예요.\n오늘 딱 하나만 더 해봐요.',
    '도전은 결과가 아니라 시작 자체로 완성돼요.\n시작했다는 것, 그게 이미 대단한 거예요.\n오늘도 그 용기를 기억해봐요.',
    '무서운 건 당연해요.\n두려움이 있다는 건 그만큼 원한다는 뜻이에요.\n오늘 그 마음을 그대로 안고 한 발만요.',
    '실패도 하나의 데이터예요.\n틀린 게 아니라 알게 된 거예요.\n오늘 무엇을 알게 됐나요?',
    '아직 안 됐다고 멈출 필요 없어요.\n여기까지 온 것 자체가 이미 성공이에요.\n오늘도 그 흐름 위에 있어요.',
  ],
  healing: [
    '스스로에게 다정해지는 연습,\n가장 오래 걸리는 항해예요.\n오늘도 한 번 더 해봤나요?',
    '치유는 고치는 게 아니라 받아들이는 거예요.\n지금 이 상태도 괜찮아요.\n오늘 자신에게 한 마디 건네봐요.',
    '아프다고 말하는 것도 용기예요.\n외면하지 않았다는 것, 그것만으로도 충분해요.\n오늘 하나, 자신에게 쉬는 시간을 줘요.',
    '서두르지 않아도 돼요.\n마음은 각자의 속도로 회복해요.\n오늘 가장 편한 방식으로 쉬어봐요.',
    '버텼다는 게 얼마나 대단한 일인지,\n본인은 잘 모를 거예요.\n오늘은 그냥 그 자체로 잘 했어요.',
  ],
  relationship: [
    '관계는 가까워지려는 마음에서 시작돼요.\n그 마음이 있다는 것만으로도 이미 연결돼 있어요.\n오늘 한 사람에게 먼저 말 걸어봐요.',
    '말하지 않아도 전해지는 게 있어요.\n하지만 말했을 때 더 잘 닿아요.\n오늘 전하지 못한 한 마디를 꺼내봐요.',
    '연결은 거리가 아니라 방향으로 가까워져요.\n지금 그 마음의 방향이 맞아요.\n오늘 작은 손짓 하나를 해봐요.',
    '혼자가 편한 날도 있어요.\n그럼에도 닿고 싶은 마음이 있다면,\n그 마음 자체가 소중한 거예요.',
    '관계에서 용기는 먼저 다가가는 것이에요.\n어색해도 괜찮아요.\n오늘 그 한 발을 내딛어봐요.',
  ],
};

const WISDOM_TAGS = {
  growth:       '실천',
  challenge:    '버팀',
  healing:      '자기다스림',
  relationship: '관계',
};

/**
 * 은하 코드 + day_number(1~7) → { message, tag }
 * 5개 풀에서 순환 (day 6 → index 0, day 7 → index 1)
 */
function getScheduleItem(galaxyCode, dayNumber) {
  const pool = AURORA5_POOL[galaxyCode] ?? AURORA5_POOL.growth;
  const tag  = WISDOM_TAGS[galaxyCode]  ?? '실천';
  return {
    message: pool[(dayNumber - 1) % pool.length],
    tag,
  };
}

/**
 * 은하 코드 → D+1~D+7 스케줄 아이템 배열
 */
function buildScheduleItems(galaxyCode) {
  return Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    ...getScheduleItem(galaxyCode, i + 1),
  }));
}

module.exports = { buildScheduleItems, getScheduleItem };
