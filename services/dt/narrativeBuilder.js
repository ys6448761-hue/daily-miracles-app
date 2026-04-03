/**
 * services/dt/narrativeBuilder.js
 * Aurora5 서사 생성 — 챕터별 프롬프트 빌더
 *
 * SSOT 규칙:
 *   평가 금지 / 판단 금지 / 비교 금지
 *   방향 중심 / 변화 강조 / 따뜻하지만 절제된 문체
 *
 * MVP 챕터: Origin(1) · Growth(2) · Evolution(5)
 * Phase2 챕터: Wisdom(3) · Choice(4) · Resonance(6) · Voyage(7) · Closing(8)
 */

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── 로그 타입별 요약 ────────────────────────────────────────────
function summarizeLogs(logs) {
  const counts = {};
  logs.forEach(l => { counts[l.log_type] = (counts[l.log_type] || 0) + 1; });

  const first = logs[0];
  const last  = logs[logs.length - 1];

  const wisdomSamples = logs
    .filter(l => l.log_type === 'wisdom')
    .slice(0, 3)
    .map(l => l.payload?.preview || '')
    .filter(Boolean)
    .join(' / ');

  const choiceSamples = logs
    .filter(l => l.log_type === 'choice')
    .slice(0, 3)
    .map(l => l.payload?.choice_value || l.payload?.choice_type || '')
    .filter(Boolean)
    .join(', ');

  return {
    total:         logs.length,
    counts,
    first_at:      first?.created_at,
    last_at:       last?.created_at,
    wisdom_sample: wisdomSamples,
    choice_sample: choiceSamples,
  };
}

// ── Aurora5 공통 시스템 지시 ──────────────────────────────────
const AURORA5_SYSTEM = `당신은 Aurora5입니다.
소원꿈터의 별지기로서 한 사람의 변화 여정을 서사로 기록합니다.

절대 규칙:
- 평가 금지 ("잘했다", "틀렸다" 금지)
- 판단 금지 ("~해야 한다" 금지)
- 비교 금지 ("~보다 낫다" 금지)
- 방향 중심 — 어디로 향하는지만 비춘다
- 변화 강조 — 시작과 지금의 차이를 담는다
- 따뜻하지만 절제된 문체 (과장 금지)`;

// ── Chapter 1: Origin ─────────────────────────────────────────
async function buildOrigin(wishText, starName) {
  const prompt = `${AURORA5_SYSTEM}

[별 이름] ${starName}
[소원] "${wishText}"

이 소원이 태어난 순간을 서사로 기록하세요.

조건:
- "당신은 이런 흐름을 걸어왔습니다"로 시작
- 4~6문장
- 소원의 의미와 시작의 떨림을 담는다

출력 (서사 텍스트만):`;

  const res = await openai.chat.completions.create({
    model:       'gpt-4.1-mini',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  300,
    temperature: 0.8,
  });
  return res.choices[0].message.content.trim();
}

// ── Chapter 2: Growth ────────────────────────────────────────
async function buildGrowth(wishText, logSummary, reportSummary) {
  const prompt = `${AURORA5_SYSTEM}

[소원] "${wishText}"
[기록 통계] 총 ${logSummary.total}개 이벤트 | 지혜 ${logSummary.counts.wisdom || 0}회 | 선택 ${logSummary.counts.choice || 0}회
[지혜 흔적] ${logSummary.wisdom_sample || '없음'}
[선택 흔적] ${logSummary.choice_sample || '없음'}
[성장 요약] ${reportSummary || '기록 중'}

이 흐름에서 관찰되는 성장 과정을 서사로 기록하세요.

조건:
- 5~8문장
- 초기 상태 → 반복된 선택 → 현재 상태의 흐름
- 구체적인 행동 패턴을 언급한다

출력 (서사 텍스트만):`;

  const res = await openai.chat.completions.create({
    model:       'gpt-4.1-mini',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  400,
    temperature: 0.8,
  });
  return res.choices[0].message.content.trim();
}

// ── Chapter 5: Evolution ─────────────────────────────────────
async function buildEvolution(wishText, logSummary, changePoint) {
  const prompt = `${AURORA5_SYSTEM}

[소원] "${wishText}"
[전환점] ${changePoint || '아직 기록 중'}
[기간] ${logSummary.first_at ? new Date(logSummary.first_at).toLocaleDateString('ko-KR') : '?'} ~ ${logSummary.last_at ? new Date(logSummary.last_at).toLocaleDateString('ko-KR') : '현재'}

처음과 지금의 차이 — 이 별이 겪은 변화의 증거를 서사로 기록하세요.

조건:
- 4~6문장
- 변화가 일어났다는 사실만 기록 (가치 판단 없이)
- 마지막 문장은 앞으로의 방향을 조용히 가리킨다

출력 (서사 텍스트만):`;

  const res = await openai.chat.completions.create({
    model:       'gpt-4.1-mini',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  300,
    temperature: 0.8,
  });
  return res.choices[0].message.content.trim();
}

// ── 공개 빌더 ────────────────────────────────────────────────
async function buildNarrative(star, logs, report) {
  const wishText     = star.wish_text || '';
  const starName     = star.star_name || '이름 없는 별';
  const logSummary   = summarizeLogs(logs);
  const reportSummary = report?.summary || '';
  const changePoint   = report?.change_point || '';

  // 3개 챕터 병렬 생성
  const [originText, growthText, evolutionText] = await Promise.all([
    buildOrigin(wishText, starName),
    buildGrowth(wishText, logSummary, reportSummary),
    buildEvolution(wishText, logSummary, changePoint),
  ]);

  return {
    origin:    { chapter: 1, title: 'Origin — 소원이 별이 된 순간',     content: originText },
    growth:    { chapter: 2, title: 'Growth — 변화가 쌓여가는 과정',    content: growthText },
    evolution: { chapter: 5, title: 'Evolution — 변화의 증거',          content: evolutionText },
  };
}

module.exports = { buildNarrative };
