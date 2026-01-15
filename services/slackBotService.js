/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Slack Bot Service - Aurora5 팀 자동 응답 봇
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 기능:
 *   1. @오로라5 멘션 감지 → 스레드 자동 응답
 *   2. 역할 키워드(코미/루미/재미/여의보주) → 페르소나별 응답
 *   3. 허용 채널 제한 (#aurora5-hq, #aurora5-dev, #aurora5-ops)
 *   4. 스레드당 1회 응답 (중복 방지)
 *
 * 환경변수:
 *   - SLACK_BOT_TOKEN
 *   - SLACK_SIGNING_SECRET
 *   - OPENAI_API_KEY
 *
 * 작성일: 2026-01-15
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

// 허용된 채널 (채널명 또는 ID)
// 채널 ID 또는 이름 일부 매칭
const ALLOWED_CHANNELS = [
  'aurora5-hq',
  'aurora5-dev',
  'aurora5-ops',
  'aurora5',  // 부분 매칭용
  'hq',       // 부분 매칭용
  // 개발/테스트 모드: 모든 채널 허용하려면 아래 주석 해제
  // '*'
];

// 개발 모드에서는 모든 채널 허용
const ALLOW_ALL_CHANNELS = process.env.NODE_ENV !== 'production' || process.env.SLACK_ALLOW_ALL_CHANNELS === 'true';

// 역할 키워드 매핑
const ROLE_KEYWORDS = {
  '코미': 'comi',
  'comi': 'comi',
  'COO': 'comi',
  '루미': 'lumi',
  'lumi': 'lumi',
  '분석': 'lumi',
  '데이터': 'lumi',
  '재미': 'jaemi',
  'jaemi': 'jaemi',
  'CRO': 'jaemi',
  '여의보주': 'yeoiboju',
  '보주': 'yeoiboju',
  '검수': 'yeoiboju',
  '품질': 'yeoiboju'
};

// 역할별 시스템 프롬프트
const ROLE_PROMPTS = {
  comi: `당신은 Aurora5 팀의 COO "코미"입니다.

역할:
- 팀 일정/우선순위 조율
- 의사결정(DEC) 문서화
- 팀 동기화 및 공지

응답 규칙:
1. 요청을 "요청 카드" 형식으로 정리
2. 담당자/기한/검증기준 명시
3. P0/P1/P2 우선순위 판단
4. DEC가 필요하면 푸르미르님 태그 제안

응답 포맷:
📋 [요청 정리]
• 목적: {한 줄 요약}
• 결과물: {구체적 산출물}
• 영향도: {🔴P0/🟡P1/🟢P2}
• 담당: {팀원}
• 기한: {YYYY-MM-DD}
• 검증: {완료 조건}

📌 다음 액션: {누가 무엇을}`,

  lumi: `당신은 Aurora5 팀의 데이터 분석가 "루미"입니다.

역할:
- 지표/분석 설계
- GA4 이벤트 스펙
- 임계값/대시보드 설정
- 데이터 기반 인사이트

응답 규칙:
1. 데이터 관점에서 요청 분석
2. 측정 가능한 KPI 제안
3. 필요한 이벤트/필드 명시
4. 구현은 Claude Code 담당 표기

응답 포맷:
📊 [분석 요청 정리]
• 측정 목표: {무엇을 알고 싶은지}
• 필요 데이터: {이벤트/필드}
• 임계값: {정상/경고/위험 기준}
• 시각화: {차트 유형}

🔧 구현 담당: Claude Code
📅 기한 제안: {날짜}`,

  jaemi: `당신은 Aurora5 팀의 CRO "재미"입니다.

역할:
- 소원이 응대/공감
- 창의적 아이디어 제안
- 카피/디자인 방향
- SNS 콘텐츠 기획

응답 규칙:
1. 소원이(고객) 관점 우선
2. 감성적이고 따뜻한 톤
3. 창의적 대안 2-3개 제시
4. 브랜드 톤앤매너 유지

응답 포맷:
💡 [아이디어 정리]
• 소원이 니즈: {핵심 욕구}
• 제안 A: {옵션 1}
• 제안 B: {옵션 2}
• 추천: {A/B 중 선택 + 이유}

🎨 다음 단계: {구체적 액션}`,

  yeoiboju: `당신은 Aurora5 팀의 품질 검수 담당 "여의보주"입니다.

역할:
- 콘텐츠 품질 검토
- 메시지 톤/철학 검수
- 소원이 관점 감성 체크
- 브랜드 일관성 확인

응답 규칙:
1. "소원이가 이걸 받으면 어떤 기분일까?" 관점
2. 수정이 필요하면 구체적 제안
3. OK면 승인 + 이유
4. 브랜드 가치(기적, 희망, 따뜻함) 기준

응답 포맷:
🔍 [품질 검토]
• 검토 항목: {무엇을 봤는지}
• 판정: ✅ 승인 / ⚠️ 수정 필요 / ❌ 재작업
• 피드백: {구체적 의견}
• 수정 제안: {있다면}

📝 최종 의견: {한 줄}`,

  default: `당신은 Aurora5 팀의 AI 어시스턴트입니다.

역할:
- 팀 요청 정리 및 분류
- 적절한 담당자 제안
- 요청 카드 형식으로 정리

응답 규칙:
1. 요청 내용을 명확히 정리
2. 담당자 제안 (코미/루미/재미/여의보주/Claude Code)
3. 우선순위 판단 (P0/P1/P2)

응답 포맷:
📋 [요청 정리]
• 요청 내용: {요약}
• 추천 담당: {팀원}
• 우선순위: {P0/P1/P2}
• 다음 액션: {제안}`
};

// 응답 완료된 스레드 추적 (메모리 캐시, 1시간 TTL)
const respondedThreads = new Map();
const THREAD_TTL = 60 * 60 * 1000; // 1시간

// ═══════════════════════════════════════════════════════════════════════════
// Slack 서명 검증
// ═══════════════════════════════════════════════════════════════════════════

function verifySlackSignature(req) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.warn('⚠️ SLACK_SIGNING_SECRET not configured');
    return true; // 개발 환경에서는 통과
  }

  const timestamp = req.headers['x-slack-request-timestamp'];
  const slackSignature = req.headers['x-slack-signature'];

  if (!timestamp || !slackSignature) {
    return false;
  }

  // 5분 이상 된 요청 거부 (리플레이 공격 방지)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${req.rawBody}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(slackSignature)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 채널 허용 여부 확인
// ═══════════════════════════════════════════════════════════════════════════

function isAllowedChannel(channelId, channelName) {
  // 개발/테스트 모드에서는 모든 채널 허용
  if (ALLOW_ALL_CHANNELS) {
    console.log(`✅ 채널 허용 (ALLOW_ALL_CHANNELS): ${channelId} / ${channelName}`);
    return true;
  }

  // 채널 ID 또는 이름으로 확인
  const allowed = ALLOWED_CHANNELS.some(pattern =>
    pattern === '*' ||
    pattern === channelId ||
    pattern === channelName ||
    channelName?.toLowerCase().includes(pattern.toLowerCase()) ||
    channelId?.includes(pattern)
  );

  console.log(`🔍 채널 허용 체크: ${channelId} / ${channelName} → ${allowed ? '✅' : '❌'}`);
  return allowed;
}

// ═══════════════════════════════════════════════════════════════════════════
// 역할 감지
// ═══════════════════════════════════════════════════════════════════════════

function detectRole(text) {
  const lowerText = text.toLowerCase();

  for (const [keyword, role] of Object.entries(ROLE_KEYWORDS)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return role;
    }
  }

  return 'default';
}

// ═══════════════════════════════════════════════════════════════════════════
// 중복 응답 방지
// ═══════════════════════════════════════════════════════════════════════════

function hasRespondedToThread(threadTs, channelId) {
  const key = `${channelId}:${threadTs}`;
  const responded = respondedThreads.get(key);

  if (responded) {
    // TTL 체크
    if (Date.now() - responded.timestamp < THREAD_TTL) {
      return true;
    }
    respondedThreads.delete(key);
  }

  return false;
}

function markThreadAsResponded(threadTs, channelId) {
  const key = `${channelId}:${threadTs}`;
  respondedThreads.set(key, { timestamp: Date.now() });

  // 오래된 항목 정리 (1000개 초과 시)
  if (respondedThreads.size > 1000) {
    const now = Date.now();
    for (const [k, v] of respondedThreads.entries()) {
      if (now - v.timestamp > THREAD_TTL) {
        respondedThreads.delete(k);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OpenAI API 호출
// ═══════════════════════════════════════════════════════════════════════════

async function generateResponse(role, userMessage, context = '') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const systemPrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.default;

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  // 컨텍스트가 있으면 추가
  if (context) {
    messages.push({
      role: 'system',
      content: `현재 팀 상황:\n${context}`
    });
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '응답을 생성하지 못했습니다.';
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 메시지 발송
// ═══════════════════════════════════════════════════════════════════════════

async function postSlackMessage(channel, text, threadTs = null) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error('SLACK_BOT_TOKEN not configured');
  }

  const body = {
    channel,
    text,
    ...(threadTs && { thread_ts: threadTs })
  };

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// 채널 정보 조회
// ═══════════════════════════════════════════════════════════════════════════

async function getChannelInfo(channelId) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(`https://slack.com/api/conversations.info?channel=${channelId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data.ok ? data.channel : null;
  } catch (error) {
    console.error('채널 정보 조회 실패:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 컨텍스트 생성 (Snapshot/DEC/P0 액션)
// ═══════════════════════════════════════════════════════════════════════════

async function getTeamContext() {
  // 간단한 컨텍스트 (실제로는 AURORA_STATUS.md 등에서 읽어올 수 있음)
  return `
📊 현재 P0 액션:
• GA4 로더 삽입 필요
• SOLAPI 환경변수 확인 필요
• wishes 테이블 마이그레이션 필요

📌 최근 DEC:
• DEC-006: Ops Agent 운영 체계 승인됨
`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 이벤트 핸들러
// ═══════════════════════════════════════════════════════════════════════════

async function handleSlackEvent(event, channelInfo = null) {
  console.log('🔔 Slack 이벤트 수신:', JSON.stringify(event, null, 2));

  const { type, channel, user, text, ts, thread_ts } = event;

  // app_mention 이벤트만 처리
  if (type !== 'app_mention') {
    console.log(`⚠️ app_mention이 아님: ${type}`);
    return { handled: false, reason: 'not_app_mention' };
  }

  console.log(`📨 멘션 감지: channel=${channel}, user=${user}, text="${text}"`);

  // 채널 허용 여부 확인
  const channelName = channelInfo?.name || '';
  console.log(`📍 채널 정보: ID=${channel}, name=${channelName}`);

  if (!isAllowedChannel(channel, channelName)) {
    console.log(`⚠️ 허용되지 않은 채널: ${channel} (${channelName})`);
    return { handled: false, reason: 'channel_not_allowed' };
  }

  // 스레드 기준 (thread_ts가 없으면 ts 사용)
  const threadTs = thread_ts || ts;

  // 중복 응답 방지
  if (hasRespondedToThread(threadTs, channel)) {
    console.log(`⚠️ 이미 응답한 스레드: ${threadTs}`);
    return { handled: false, reason: 'already_responded' };
  }

  // 역할 감지
  const role = detectRole(text);
  console.log(`🎭 감지된 역할: ${role}`);

  // 멘션 텍스트에서 봇 ID 제거
  const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

  // 컨텍스트 가져오기
  const context = await getTeamContext();

  // AI 응답 생성
  const response = await generateResponse(role, cleanText, context);

  // Slack 스레드에 응답
  await postSlackMessage(channel, response, threadTs);

  // 스레드 응답 완료 표시
  markThreadAsResponded(threadTs, channel);

  console.log(`✅ 응답 완료: 채널=${channel}, 스레드=${threadTs}, 역할=${role}`);

  return { handled: true, role, threadTs };
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  verifySlackSignature,
  handleSlackEvent,
  isAllowedChannel,
  detectRole,
  hasRespondedToThread,
  markThreadAsResponded,
  generateResponse,
  postSlackMessage,
  getChannelInfo,
  getTeamContext,
  ALLOWED_CHANNELS,
  ROLE_KEYWORDS,
  ROLE_PROMPTS
};
