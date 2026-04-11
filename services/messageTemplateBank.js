/**
 * messageTemplateBank.js — DreamTown Day 2-6 메시지 템플릿 뱅크
 *
 * 원칙:
 *   - AI는 감동의 순간(Day1 Origin, 첫 지혜, 개입 메시지)에만 호출
 *   - 반복 구간(Day 2-6 daily)은 이 템플릿이 책임
 *   - 은하별(galaxy_code) × 일차(day) × 메시지유형 구조
 *
 * galaxy_code: healing | challenge | relation | growth | miracle
 * message_type: daily | checkin | wisdom | restart
 */

'use strict';

// ── 은하별 페르소나 ────────────────────────────────────────────────────
const GALAXY_PERSONA = {
  healing:   { name: '치유의 은하', tone: '따뜻하고 포근하게', emoji: '🌙' },
  challenge: { name: '도전의 은하', tone: '용기 있게 나아가도록', emoji: '🔥' },
  relation:  { name: '관계의 은하', tone: '연결과 공명을 강조하며', emoji: '✨' },
  growth:    { name: '성장의 은하', tone: '조금씩 더 나아가고 있음을 상기시키며', emoji: '🌱' },
  miracle:   { name: '기적의 은하', tone: '특별한 순간이 이미 시작됐음을 느끼게', emoji: '💫' },
};

// ── Day 2-6 daily 메시지 (은하 × 일차) ───────────────────────────────
const DAILY_TEMPLATES = {
  healing: {
    2: (n) => `🌙 ${n} Day2\n어제보다 조금 더 쉬어가도 괜찮아요.\n오늘은 그냥 있는 그대로를 느껴보세요.`,
    3: (n) => `🌙 ${n} Day3\n멈춤도 여정의 일부예요.\n조용히 별을 떠올려보는 것만으로도 충분합니다.`,
    4: (n) => `🌙 ${n} Day4\n회복에는 속도가 없어요.\n오늘도 소원꿈터에서 당신의 별이 기다리고 있어요.`,
    5: (n) => `🌙 ${n} Day5\n쉬는 것도 소원을 향한 걸음이에요.\n당신이 돌아올 때 별은 더 밝게 빛날 거예요.`,
    6: (n) => `🌙 ${n} Day6\n일주일이 거의 다 됐어요.\n오늘 하루만 더, 소원을 곁에 두어보세요.`,
  },
  challenge: {
    2: (n) => `🔥 ${n} Day2\n도전은 하루 만에 완성되지 않아요.\n오늘도 한 발짝, 어제보다 조금만 더.`,
    3: (n) => `🔥 ${n} Day3\n3일을 버텼다는 건 쉬운 일이 아니에요.\n소원꿈터가 당신의 용기를 기록하고 있습니다.`,
    4: (n) => `🔥 ${n} Day4\n불편함이 느껴진다면, 그게 성장의 증거예요.\n오늘도 멈추지 않은 당신에게 박수를 보냅니다.`,
    5: (n) => `🔥 ${n} Day5\n도전의 별은 포기하지 않는 사람에게 빛납니다.\n오늘도 그 빛을 놓치지 마세요.`,
    6: (n) => `🔥 ${n} Day6\n일주일의 끝이 보여요.\n지금 이 순간이, 나중에 가장 자랑스러운 기억이 될 거예요.`,
  },
  relation: {
    2: (n) => `✨ ${n} Day2\n모든 관계는 작은 순간에서 시작돼요.\n오늘 한 사람에게 먼저 다가가 보는 건 어떨까요?`,
    3: (n) => `✨ ${n} Day3\n공명은 한 번의 만남으로 오지 않아요.\n오늘도 연결의 씨앗을 심어보세요.`,
    4: (n) => `✨ ${n} Day4\n관계의 별은 기다려주는 사람에게 빛납니다.\n당신이 떠올리는 그 사람, 오늘 한번 생각해 보세요.`,
    5: (n) => `✨ ${n} Day5\n진심은 언제나 전해져요.\n오늘도 소원을 향해 조용히 걸어가고 있는 당신을 응원합니다.`,
    6: (n) => `✨ ${n} Day6\n관계의 변화는 천천히 찾아와요.\n포기하지 않는 것 자체가 이미 기적입니다.`,
  },
  growth: {
    2: (n) => `🌱 ${n} Day2\n성장은 보이지 않는 곳에서 먼저 시작돼요.\n오늘도 뿌리를 내리고 있는 중입니다.`,
    3: (n) => `🌱 ${n} Day3\n3일이 지났어요. 달라진 게 없어 보여도 괜찮아요.\n변화는 안에서 먼저 일어나거든요.`,
    4: (n) => `🌱 ${n} Day4\n성장의 별은 꾸준한 사람에게 빛납니다.\n오늘도 어제보다 조금 더, 충분해요.`,
    5: (n) => `🌱 ${n} Day5\n배움에는 끝이 없고, 당신은 이미 배우고 있어요.\n소원꿈터가 그 여정을 함께 기록합니다.`,
    6: (n) => `🌱 ${n} Day6\n일주일의 마지막이 가까워요.\n오늘 하루, 스스로에게 "잘 해냈어"라고 말해주세요.`,
  },
  miracle: {
    2: (n) => `💫 ${n} Day2\n기적은 준비된 사람에게 찾아온다고 해요.\n오늘도 준비하는 당신에게 별이 빛납니다.`,
    3: (n) => `💫 ${n} Day3\n특별한 일은 평범한 하루 속에 숨어 있어요.\n오늘도 눈을 크게 뜨고 걸어가 보세요.`,
    4: (n) => `💫 ${n} Day4\n기적의 별은 믿는 사람에게 응답해요.\n당신의 소원은 이미 우주에 기록됐습니다.`,
    5: (n) => `💫 ${n} Day5\n가장 특별한 기적은, 포기하지 않는 것이에요.\n오늘도 그 기적을 만들고 있어요.`,
    6: (n) => `💫 ${n} Day6\n일주일을 함께했어요.\n이 여정 자체가 이미 하나의 기적입니다.`,
  },
};

// ── Day 2-6 지혜 템플릿 (은하 × 일차) ────────────────────────────────
const WISDOM_TEMPLATES = {
  healing: {
    2: '쉬는 것도 움직임입니다. 오늘은 멈춤 속에서 답을 찾아보세요.',
    3: '회복은 조용히, 안에서 먼저 일어납니다.',
    4: '피로를 인정하는 것도 용기입니다.',
    5: '오늘 하루, 스스로를 조금 더 너그럽게 대해보세요.',
    6: '한 주를 버텼다는 것 자체가 힘입니다.',
  },
  challenge: {
    2: '완벽하지 않아도 괜찮습니다. 시작했다는 것이 이미 절반입니다.',
    3: '불편함은 성장의 신호입니다. 오늘의 어려움을 기록해 두세요.',
    4: '속도보다 방향이 중요합니다. 지금 어디를 향하고 있나요?',
    5: '지치는 것은 진심으로 임하고 있다는 증거입니다.',
    6: '이번 주의 도전을 돌아보세요. 작은 변화가 쌓이고 있습니다.',
  },
  relation: {
    2: '모든 깊은 관계는 작은 관심에서 시작됩니다.',
    3: '먼저 이해하려는 마음이 관계를 바꿉니다.',
    4: '진심은 시간이 걸려도 반드시 전해집니다.',
    5: '연결은 완성되는 것이 아니라, 계속 만들어 가는 것입니다.',
    6: '이 한 주 동안 떠올린 그 사람에게, 오늘 한 발짝 다가가 보세요.',
  },
  growth: {
    2: '보이지 않는 곳에서 뿌리가 먼저 자랍니다.',
    3: '오늘 배운 것을 내일의 나에게 편지로 써보세요.',
    4: '실패는 성장의 반대가 아니라, 성장의 재료입니다.',
    5: '어제의 나보다 조금 더 알게 된 것이 있다면, 그것으로 충분합니다.',
    6: '성장은 한 방향으로만 가지 않아도 됩니다.',
  },
  miracle: {
    2: '기적은 기다리는 것이 아니라, 준비하는 사람에게 찾아옵니다.',
    3: '평범한 하루에도 특별한 순간은 숨어 있습니다.',
    4: '믿음은 아직 보이지 않는 것을 향해 걸어가는 것입니다.',
    5: '오늘 하루, 기적이 일어날 가능성에 마음을 열어두세요.',
    6: '포기하지 않은 것 자체가 이미 기적입니다.',
  },
};

// ── 재시작 유도 템플릿 (이탈 감지 시, AI 미사용) ─────────────────────
const RESTART_TEMPLATES = {
  healing: [
    (n) => `🌙 ${n}, 돌아와도 괜찮아요.\n소원꿈터는 언제나 여기 있어요.`,
    (n) => `🌙 잠깐 쉬었다고 해서 소원이 사라지지 않아요.\n${n}의 별이 기다리고 있습니다.`,
  ],
  challenge: [
    (n) => `🔥 ${n}, 다시 시작하기 딱 좋은 날이에요.\n한 발짝만 더, 가능해요.`,
    (n) => `🔥 멈춘 게 아니라 잠시 숨고른 거예요.\n${n}의 도전은 아직 끝나지 않았어요.`,
  ],
  relation: [
    (n) => `✨ ${n}, 관계는 타이밍이 아니에요.\n지금 돌아와도 늦지 않았습니다.`,
    (n) => `✨ 소원꿈터가 ${n}을 기다리고 있어요.\n오늘, 한번 들어와 보세요.`,
  ],
  growth: [
    (n) => `🌱 ${n}, 성장에는 쉬어가는 구간도 있어요.\n다시 시작해도 괜찮습니다.`,
    (n) => `🌱 돌아온 것 자체가 성장의 증거예요.\n${n}의 별이 여기서 기다리고 있어요.`,
  ],
  miracle: [
    (n) => `💫 ${n}, 기적은 포기하지 않는 사람에게 찾아와요.\n오늘 다시 시작해 보세요.`,
    (n) => `💫 소원은 사라지지 않아요.\n${n}, 언제든 돌아오면 됩니다.`,
  ],
};

// ── 체크인 유도 (활동 없는 날) ────────────────────────────────────────
const CHECKIN_TEMPLATES = {
  healing:   (n) => `🌙 ${n}의 별이 오늘 기다리고 있어요.\n잠깐 들어와 기록을 남겨보세요.`,
  challenge: (n) => `🔥 ${n}, 오늘 도전 기록을 남겨볼까요?\n작은 기록이 큰 변화를 만들어요.`,
  relation:  (n) => `✨ ${n}, 오늘 소원꿈터에서 잠깐 이야기해요.\n당신의 이야기가 궁금해요.`,
  growth:    (n) => `🌱 ${n}, 오늘 배운 것을 기록해 두세요.\n성장의 발자국을 남겨볼까요?`,
  miracle:   (n) => `💫 ${n}, 오늘 기적 같은 순간이 있었나요?\n소원꿈터에 기록해 보세요.`,
};

// ── 공개 API ──────────────────────────────────────────────────────────

/**
 * getDailyTemplate(galaxy, day, starName)
 * Day 2-6 daily 메시지 반환. Day가 범위 밖이면 null.
 */
function getDailyTemplate(galaxy, day, starName) {
  const g = GALAXY_PERSONA[galaxy] ? galaxy : 'healing';
  const tmpl = DAILY_TEMPLATES[g]?.[day];
  return tmpl ? tmpl(starName) : null;
}

/**
 * getWisdomTemplate(galaxy, day)
 * Day 2-6 지혜 메시지 반환. Day가 범위 밖이면 null.
 */
function getWisdomTemplate(galaxy, day) {
  const g = GALAXY_PERSONA[galaxy] ? galaxy : 'healing';
  return WISDOM_TEMPLATES[g]?.[day] ?? null;
}

/**
 * getRestartTemplate(galaxy, starName)
 * 이탈 방지 재시작 메시지 (랜덤 선택)
 */
function getRestartTemplate(galaxy, starName) {
  const g = GALAXY_PERSONA[galaxy] ? galaxy : 'healing';
  const pool = RESTART_TEMPLATES[g] ?? RESTART_TEMPLATES.healing;
  return pool[Math.floor(Math.random() * pool.length)](starName);
}

/**
 * getCheckinTemplate(galaxy, starName)
 * 체크인 유도 메시지
 */
function getCheckinTemplate(galaxy, starName) {
  const g = GALAXY_PERSONA[galaxy] ? galaxy : 'healing';
  return (CHECKIN_TEMPLATES[g] ?? CHECKIN_TEMPLATES.healing)(starName);
}

/**
 * isTemplateEligible(step, day)
 * AI 없이 템플릿으로 처리 가능한지 여부
 */
function isTemplateEligible(step, day) {
  if (step === 'daily'   && day >= 2 && day <= 6) return true;
  if (step === 'wisdom'  && day >= 2 && day <= 6) return true;
  if (step === 'restart') return true;
  if (step === 'checkin') return true;
  return false;
}

module.exports = {
  getDailyTemplate,
  getWisdomTemplate,
  getRestartTemplate,
  getCheckinTemplate,
  isTemplateEligible,
  GALAXY_PERSONA,
};
