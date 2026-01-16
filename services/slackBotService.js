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

// Decision Service (Task 5)
let decisionService = null;
try {
  decisionService = require('./decisionService');
} catch (e) {
  console.warn('[SlackBot] decisionService 로드 실패:', e.message);
}

// Judge Service (Task 6-7)
let judgeService = null;
try {
  judgeService = require('./judgeService');
} catch (e) {
  console.warn('[SlackBot] judgeService 로드 실패:', e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

// 허용된 채널 ID (운영 잠금 - 2026-01-16)
const ALLOWED_CHANNEL_IDS = [
  'C0A8CRE7MQF',  // #aurora5-hq
  'C0A8CRLJW6B',  // #aurora5-dev
  'C0A8CRP3K5M',  // #aurora5-ops
];

// 채널명 패턴 매칭 (백업용)
const ALLOWED_CHANNELS = [
  ...ALLOWED_CHANNEL_IDS,
  'aurora5-hq',
  'aurora5-dev',
  'aurora5-ops',
];

// 채널 제한 활성화 (운영 모드)
const ALLOW_ALL_CHANNELS = false;

// 역할 키워드 매핑 (우선순위 순서로 정렬)
const ROLE_KEYWORDS = {
  // 코미 (KOMI) - 기본값
  '코미': 'komi',
  'comi': 'komi',
  'COO': 'komi',
  // 루미 (LUMI)
  '루미': 'lumi',
  'lumi': 'lumi',
  '분석': 'lumi',
  '데이터': 'lumi',
  // 재미 (JAEMI)
  '재미': 'jaemi',
  'jaemi': 'jaemi',
  'CRO': 'jaemi',
  // 여의보주 (JU) - "주" 단독도 매칭
  '여의보주': 'ju',
  '보주': 'ju',
  '주': 'ju',
  '검수': 'ju',
  '품질': 'ju'
};

// 역할별 시스템 프롬프트 (표준 포맷)
const ROLE_PROMPTS = {
  komi: `당신은 Aurora5 팀의 COO "코미"입니다.

역할:
- 팀 일정/우선순위 조율
- 의사결정(DEC) 문서화
- 팀 동기화 및 공지

응답 규칙:
1. 요청을 "요청 카드" 형식으로 정리
2. 담당자/기한/검증기준 명시
3. P0/P1/P2 우선순위 판단
4. DEC가 필요하면 푸르미르님 태그 제안

응답 포맷 (KOMI 표준):
📋 [요청 정리]
• 목적: {한 줄 요약}
• 결과물: {구체적 산출물}
• 영향도: {🔴P0/🟡P1/🟢P2}

👥 [추천 담당]
• 담당: {팀원}
• 기한: {YYYY-MM-DD}
• 검증: {완료 조건}

📌 [다음 액션]
{누가 무엇을 언제까지}`,

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

응답 포맷 (LUMI 표준):
🔍 [진단]
• 현재 상태: {데이터 기반 현황}
• 문제점: {발견된 이슈}

📊 [지표]
• 핵심 KPI: {측정 항목}
• 목표치: {숫자}
• 임계값: {정상/경고/위험}

💡 [가설]
• {데이터 기반 추론}

🧪 [다음 실험]
• {검증할 내용}
• 구현 담당: Claude Code`,

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

응답 포맷 (JAEMI 표준):
💡 [아이디어]
• 소원이 니즈: {핵심 욕구}
• 핵심 메시지: {한 줄}

✍️ [카피 제안]
• A안: {옵션 1}
• B안: {옵션 2}
• 추천: {선택 + 이유}

📐 [형식]
• 포맷: {이미지/텍스트/영상}
• 톤: {따뜻한/유쾌한/진지한}

🚫 [금지선]
• {브랜드에 맞지 않는 표현}`,

  ju: `당신은 Aurora5 팀의 품질 검수 담당 "여의보주"(주)입니다.

역할:
- 콘텐츠 품질 검토
- 메시지 톤/철학 검수
- 소원이 관점 감성 체크
- 브랜드 일관성 확인
- 짧은 영감 제공

응답 규칙:
1. "소원이가 이걸 받으면 어떤 기분일까?" 관점
2. 간결하고 영감을 주는 답변
3. 브랜드 가치(기적, 희망, 따뜻함) 기준
4. 불필요한 말 없이 핵심만

응답 포맷 (JU 표준):
✨ [영감]
{짧은 영감 한 줄}

🎯 [행동]
{지금 당장 할 수 있는 한 가지}`,

  // 기본값 = KOMI
  default: `당신은 Aurora5 팀의 COO "코미"입니다.

역할:
- 팀 요청 정리 및 분류
- 적절한 담당자 제안
- 요청 카드 형식으로 정리

응답 규칙:
1. 요청 내용을 명확히 정리
2. 담당자 제안 (코미/루미/재미/주/Claude Code)
3. 우선순위 판단 (P0/P1/P2)

응답 포맷 (KOMI 표준):
📋 [요청 정리]
• 목적: {한 줄 요약}
• 결과물: {구체적 산출물}
• 영향도: {🔴P0/🟡P1/🟢P2}

👥 [추천 담당]
• 담당: {팀원}
• 기한: {YYYY-MM-DD}

📌 [다음 액션]
{누가 무엇을}`
};

// 응답 완료된 스레드 추적 (메모리 캐시, 1시간 TTL)
const respondedThreads = new Map();
const THREAD_TTL = 60 * 60 * 1000; // 1시간

// ═══════════════════════════════════════════════════════════════════════════
// Task 1: event_id 중복 방지 (Slack 재전송용, 60초 TTL)
// ═══════════════════════════════════════════════════════════════════════════
const processedEvents = new Map();
const EVENT_TTL = 60 * 1000; // 60초 (Slack 재전송 방지)

/**
 * 이벤트 중복 체크 (event_id 또는 channel+event_ts 조합)
 * @param {Object} event - Slack 이벤트
 * @returns {boolean} - 이미 처리된 이벤트면 true
 */
function isDuplicateEvent(event) {
  // event_id가 있으면 우선 사용, 없으면 channel+ts 조합
  const eventKey = event.event_id || `${event.channel}:${event.event_ts || event.ts}`;

  if (processedEvents.has(eventKey)) {
    const processed = processedEvents.get(eventKey);
    if (Date.now() - processed.timestamp < EVENT_TTL) {
      console.log(`⚠️ duplicate_event_ignored: ${eventKey}`);
      return true;
    }
    processedEvents.delete(eventKey);
  }

  return false;
}

/**
 * 이벤트 처리 완료 표시
 */
function markEventAsProcessed(event) {
  const eventKey = event.event_id || `${event.channel}:${event.event_ts || event.ts}`;
  processedEvents.set(eventKey, { timestamp: Date.now() });

  // 오래된 항목 정리 (500개 초과 시)
  if (processedEvents.size > 500) {
    const now = Date.now();
    for (const [k, v] of processedEvents.entries()) {
      if (now - v.timestamp > EVENT_TTL) {
        processedEvents.delete(k);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// P1 Hotfix v2: Rate-limit (연타 방지, 10초 TTL) + message_ts 중복 체크
// 핵심: check-and-mark를 원자적으로 처리
// ═══════════════════════════════════════════════════════════════════════════
const rateLimitCache = new Map();
const messageTsCache = new Map();  // message_ts 기반 중복 체크
const RATE_LIMIT_TTL = 10 * 1000;  // v2: 5초 → 10초로 증가
const MESSAGE_TS_TTL = 60 * 1000;  // message_ts는 60초

/**
 * 텍스트 정규화 (멘션 제거 + 소문자 + 공백 정리)
 */
function normalizeText(text) {
  return (text || '')
    .replace(/<@[A-Z0-9]+>/g, '')  // 멘션 제거
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')          // 연속 공백 → 단일 공백
    .substring(0, 100);            // 최대 100자
}

/**
 * 간단한 해시 생성
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * message_ts 기반 중복 체크 (1차 방어선)
 * Slack 메시지의 고유 timestamp로 동일 메시지 재처리 방지
 */
function isDuplicateMessageTs(messageTs) {
  if (!messageTs) return false;

  const now = Date.now();

  // 이미 처리된 message_ts인지 확인
  if (messageTsCache.has(messageTs)) {
    console.log(`⚠️ duplicate_message_ts: ${messageTs}`);
    return true;
  }

  // 캐시에 추가 (즉시 마킹)
  messageTsCache.set(messageTs, now);

  // 오래된 항목 정리
  if (messageTsCache.size > 500) {
    for (const [ts, timestamp] of messageTsCache.entries()) {
      if (now - timestamp > MESSAGE_TS_TTL) {
        messageTsCache.delete(ts);
      }
    }
  }

  return false;
}

/**
 * Rate-limit 체크 + 즉시 마킹 (원자적 처리)
 * v3: command 기반 키 (ping/status/config는 변형 무관하게 동일 키)
 * @param {string} channel - 채널 ID
 * @param {string} user - 사용자 ID
 * @param {string} text - 메시지 텍스트
 * @param {string|null} command - 감지된 커맨드 (ping/status/config) - v3 추가
 * @returns {boolean} - rate-limited면 true
 */
function checkAndMarkRateLimit(channel, user, text, command = null) {
  // v3: command가 있으면 command 기반 키, 없으면 text hash 기반
  let key;
  if (command) {
    // ping/status/config 등 운영 커맨드는 변형 무관하게 동일 키
    key = `${channel}:${user}:cmd:${command}`;
  } else {
    // 일반 메시지는 text hash 기반
    const normalized = normalizeText(text);
    const textHash = simpleHash(normalized);
    key = `${channel}:${user}:${textHash}`;
  }

  const now = Date.now();

  // 이미 캐시에 있고 TTL 내라면 rate-limited
  if (rateLimitCache.has(key)) {
    const cached = rateLimitCache.get(key);
    if (now - cached.timestamp < RATE_LIMIT_TTL) {
      console.log(`⚠️ rate_limited: ${key} (${now - cached.timestamp}ms ago)`);
      return true;
    }
  }

  // 통과 → 즉시 마킹 (다음 요청은 rate-limited)
  rateLimitCache.set(key, { timestamp: now });
  console.log(`✅ rate_limit_marked: ${key}`);

  // 오래된 항목 정리 (300개 초과 시)
  if (rateLimitCache.size > 300) {
    for (const [k, v] of rateLimitCache.entries()) {
      if (now - v.timestamp > RATE_LIMIT_TTL) {
        rateLimitCache.delete(k);
      }
    }
  }

  return false;
}

/**
 * [DEPRECATED] 개별 체크 함수 - 하위 호환성 유지
 */
function isRateLimited(channel, user, text) {
  const normalized = normalizeText(text);
  const textHash = simpleHash(normalized);
  const key = `${channel}:${user}:${textHash}`;
  const now = Date.now();

  if (rateLimitCache.has(key)) {
    const cached = rateLimitCache.get(key);
    if (now - cached.timestamp < RATE_LIMIT_TTL) {
      return true;
    }
  }
  return false;
}

/**
 * [DEPRECATED] 개별 마킹 함수 - 하위 호환성 유지
 */
function markAsRateLimited(channel, user, text) {
  const normalized = normalizeText(text);
  const textHash = simpleHash(normalized);
  const key = `${channel}:${user}:${textHash}`;
  rateLimitCache.set(key, { timestamp: Date.now() });
}

/**
 * Slack 재전송 헤더 체크 (X-Slack-Retry-Num)
 * @param {Object} headers - HTTP 헤더
 * @returns {boolean} - 재전송이면 true
 */
function isSlackRetry(headers) {
  const retryNum = headers?.['x-slack-retry-num'];
  if (retryNum && parseInt(retryNum, 10) > 0) {
    console.log(`⚠️ slack_retry_ignored: retry_num=${retryNum}`);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// Task 4: 이벤트 통계 (최근 1시간)
// ═══════════════════════════════════════════════════════════════════════════
const eventStats = {
  total: 0,
  success: 0,
  failed: 0,
  responseTimes: [],
  lastEvent: null,
  hourlyEvents: [] // 최근 1시간 이벤트 타임스탬프
};

/**
 * 이벤트 통계 기록
 */
function recordEventStat(success, responseTime) {
  const now = Date.now();
  eventStats.total++;
  if (success) eventStats.success++;
  else eventStats.failed++;

  eventStats.responseTimes.push(responseTime);
  eventStats.lastEvent = now;
  eventStats.hourlyEvents.push(now);

  // 1시간 이상 된 데이터 정리
  const oneHourAgo = now - 60 * 60 * 1000;
  eventStats.hourlyEvents = eventStats.hourlyEvents.filter(t => t > oneHourAgo);

  // 응답시간 최근 100개만 유지
  if (eventStats.responseTimes.length > 100) {
    eventStats.responseTimes = eventStats.responseTimes.slice(-100);
  }
}

/**
 * 이벤트 통계 조회
 */
function getEventStats() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const hourlyCount = eventStats.hourlyEvents.filter(t => t > oneHourAgo).length;

  const avgResponseTime = eventStats.responseTimes.length > 0
    ? Math.round(eventStats.responseTimes.reduce((a, b) => a + b, 0) / eventStats.responseTimes.length)
    : 0;

  const successRate = eventStats.total > 0
    ? Math.round((eventStats.success / eventStats.total) * 100)
    : 100;

  const lastEventAgo = eventStats.lastEvent
    ? Math.round((now - eventStats.lastEvent) / 1000)
    : null;

  return {
    hourlyCount,
    successRate,
    avgResponseTime,
    lastEventAgo
  };
}

// 서버 시작 시간 (uptime 계산용)
const SERVER_START_TIME = Date.now();

// ═══════════════════════════════════════════════════════════════════════════
// 운영 커맨드 (status, config, ping)
// ═══════════════════════════════════════════════════════════════════════════

const OPS_COMMANDS = ['status', 'config', 'ping'];

/**
 * 운영 커맨드 감지
 * @param {string} text - 멘션 텍스트
 * @returns {string|null} - 커맨드명 또는 null
 */
function detectOpsCommand(text) {
  const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim().toLowerCase();

  for (const cmd of OPS_COMMANDS) {
    if (cleanText === cmd || cleanText.startsWith(cmd + ' ')) {
      return cmd;
    }
  }

  return null;
}

/**
 * 환경변수 마스킹 (민감값 보호)
 * @param {string} value - 원본 값
 * @param {number} showChars - 표시할 앞글자 수
 * @returns {string} - 마스킹된 값
 */
function maskSensitiveValue(value, showChars = 4) {
  if (!value) return '(not set)';
  if (value.length <= showChars) return '*'.repeat(value.length);
  return value.substring(0, showChars) + '*'.repeat(Math.min(8, value.length - showChars));
}

/**
 * @Aurora5 status - 시스템 상태 출력 (이벤트 통계 포함)
 */
async function handleStatusCommand() {
  const startTime = Date.now();

  // 서비스 상태 체크
  const services = {
    notion: process.env.NOTION_API_KEY ? '✅' : '❌',
    toss: process.env.TOSS_SECRET_KEY ? '✅' : '❌',
    sens: (process.env.SENS_ACCESS_KEY && process.env.SENS_SERVICE_ID) ? '✅' : '❌',
    openai: process.env.OPENAI_API_KEY ? '✅' : '❌',
    slack: process.env.SLACK_BOT_TOKEN ? '✅' : '❌',
    database: process.env.DATABASE_URL ? '✅' : '❌'
  };

  // Uptime 계산
  const uptimeMs = Date.now() - SERVER_START_TIME;
  const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
  const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

  // 메모리 사용량
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  // 이벤트 통계
  const stats = getEventStats();
  const lastEventStr = stats.lastEventAgo !== null
    ? `${stats.lastEventAgo}초 전`
    : '없음';

  // 품질 통계 (Judge)
  let qualityStr = '';
  if (judgeService && judgeService.getQualityStats) {
    const qStats = judgeService.getQualityStats();
    qualityStr = `\n🎯 *품질 (Judge):*
• Pass율: ${qStats.passRate}
• 승급률: ${qStats.upgradeRate}
• Fail Top3: ${qStats.failTop3.join(', ')}`;
  }

  // 응답 시간
  const responseTime = Date.now() - startTime;

  return `📊 *Aurora5 시스템 상태*

🕐 *Uptime:* ${uptimeHours}h ${uptimeMinutes}m | 💾 *Mem:* ${memMB}MB

📈 *최근 1시간 이벤트:*
• 이벤트 수: ${stats.hourlyCount}회
• 성공률: ${stats.successRate}%
• 평균 응답: ${stats.avgResponseTime}ms
• 마지막: ${lastEventStr}
${qualityStr}

📡 *서비스:* Notion${services.notion} Toss${services.toss} SENS${services.sens} OpenAI${services.openai} Slack${services.slack} DB${services.database}

🤖 *봇:*
• 스레드 캐시: ${respondedThreads.size}개
• 이벤트 캐시: ${processedEvents.size}개
• 채널: ${ALLOW_ALL_CHANNELS ? '전체 허용' : ALLOWED_CHANNEL_IDS.length + '개 채널'}
• 버전: 2.1 (Judge 캐스케이드)

⚡ *응답시간:* ${responseTime}ms
_${new Date().toLocaleString('ko-KR')}_`;
}

/**
 * @Aurora5 config - 설정 출력 (민감값 마스킹)
 */
async function handleConfigCommand() {
  const config = {
    // 환경
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000',

    // API 키 (마스킹)
    OPENAI_API_KEY: maskSensitiveValue(process.env.OPENAI_API_KEY, 7),
    SLACK_BOT_TOKEN: maskSensitiveValue(process.env.SLACK_BOT_TOKEN, 10),
    SLACK_SIGNING_SECRET: maskSensitiveValue(process.env.SLACK_SIGNING_SECRET, 4),
    NOTION_API_KEY: maskSensitiveValue(process.env.NOTION_API_KEY, 6),
    TOSS_SECRET_KEY: maskSensitiveValue(process.env.TOSS_SECRET_KEY, 5),

    // SENS (마스킹)
    SENS_ACCESS_KEY: maskSensitiveValue(process.env.SENS_ACCESS_KEY, 4),
    SENS_SERVICE_ID: maskSensitiveValue(process.env.SENS_SERVICE_ID, 5),

    // 채널 설정
    ALLOW_ALL_CHANNELS: ALLOW_ALL_CHANNELS ? 'true' : 'false',
    ALLOWED_CHANNELS: ALLOWED_CHANNELS.join(', ')
  };

  let output = `⚙️ *Aurora5 설정 정보*\n\n`;
  output += `🌍 *환경:*\n`;
  output += `• NODE_ENV: \`${config.NODE_ENV}\`\n`;
  output += `• PORT: \`${config.PORT}\`\n\n`;

  output += `🔑 *API 키 (마스킹):*\n`;
  output += `• OPENAI: \`${config.OPENAI_API_KEY}\`\n`;
  output += `• SLACK_TOKEN: \`${config.SLACK_BOT_TOKEN}\`\n`;
  output += `• SLACK_SECRET: \`${config.SLACK_SIGNING_SECRET}\`\n`;
  output += `• NOTION: \`${config.NOTION_API_KEY}\`\n`;
  output += `• TOSS: \`${config.TOSS_SECRET_KEY}\`\n`;
  output += `• SENS_KEY: \`${config.SENS_ACCESS_KEY}\`\n`;
  output += `• SENS_ID: \`${config.SENS_SERVICE_ID}\`\n\n`;

  output += `📢 *채널 설정:*\n`;
  output += `• 전체 허용: \`${config.ALLOW_ALL_CHANNELS}\`\n`;
  output += `• 허용 목록: \`${config.ALLOWED_CHANNELS}\`\n\n`;

  output += `_⚠️ 민감값은 마스킹되어 표시됩니다_`;

  return output;
}

/**
 * @Aurora5 ping - pong + 응답시간
 */
async function handlePingCommand(startTime) {
  const responseTime = Date.now() - startTime;

  return `🏓 pong! (${responseTime}ms)`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 서명 검증
// ═══════════════════════════════════════════════════════════════════════════

function verifySlackSignature(rawBody, headers) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.warn('⚠️ SLACK_SIGNING_SECRET not configured - 검증 스킵');
    return true; // 개발 환경에서는 통과
  }

  const timestamp = headers['x-slack-request-timestamp'];
  const slackSignature = headers['x-slack-signature'];

  // 디버그: 헤더 존재 여부
  if (!timestamp || !slackSignature) {
    console.warn('❌ 서명 검증 실패: 헤더 누락', {
      hasTimestamp: !!timestamp,
      hasSignature: !!slackSignature
    });
    return false;
  }

  // 5분 이상 된 요청 거부 (리플레이 공격 방지)
  // Slack timestamp는 seconds 단위
  const nowSeconds = Math.floor(Date.now() / 1000);
  const requestAge = nowSeconds - parseInt(timestamp, 10);

  if (requestAge > 300) { // 5분 = 300초
    console.warn('❌ 서명 검증 실패: 타임스탬프 만료', {
      requestAge: `${requestAge}초 전`,
      timestamp,
      nowSeconds
    });
    return false;
  }

  // rawBody가 Buffer면 string으로 변환
  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

  const sigBasestring = `v0:${timestamp}:${bodyString}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  // 디버그 로그 (시그니처 앞 12자만)
  const computed8 = mySignature.substring(0, 15);
  const received8 = slackSignature.substring(0, 15);

  console.log('🔐 서명 검증 시도:', {
    bodyLength: bodyString.length,
    timestamp,
    requestAge: `${requestAge}초`,
    computedPrefix: computed8,
    receivedPrefix: received8,
    match: computed8 === received8 ? '✅' : '❌'
  });

  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(slackSignature)
    );
  } catch (err) {
    console.warn('❌ 서명 비교 실패:', err.message);
    return false;
  }
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
// OpenAI API 호출 (Judge 캐스케이드 통합)
// ═══════════════════════════════════════════════════════════════════════════

async function generateResponse(role, userMessage, context = '') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const systemPrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.default;

  // Task 6: Judge 캐스케이드 사용 (judgeService가 있으면)
  if (judgeService && judgeService.generateWithCascade) {
    console.log(`🔄 [Cascade] ${role} 모드 - Judge 캐스케이드 활성화`);
    return await judgeService.generateWithCascade(role, userMessage, systemPrompt, context);
  }

  // Fallback: 기존 방식
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
// Task 3: 스레드 컨텍스트 (conversations.replies)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 스레드 메시지 조회 (최근 10개, 2000자 제한)
 * @param {string} channel - 채널 ID
 * @param {string} threadTs - 스레드 타임스탬프
 * @returns {string} - 요약된 컨텍스트
 */
async function getThreadContext(channel, threadTs) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || !threadTs) return '';

  try {
    const response = await fetch(
      `https://slack.com/api/conversations.replies?channel=${channel}&ts=${threadTs}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    if (!data.ok || !data.messages || data.messages.length <= 1) {
      return '';
    }

    // 최근 메시지들 (현재 메시지 제외하고 역순으로)
    const messages = data.messages.slice(0, -1); // 마지막(현재) 메시지 제외

    // 컨텍스트 구성 (2000자 제한)
    let context = '';
    for (const msg of messages) {
      const cleanText = msg.text?.replace(/<@[A-Z0-9]+>/g, '@user').substring(0, 300) || '';
      const line = `- ${cleanText}\n`;

      if ((context + line).length > 2000) break;
      context += line;
    }

    // 로그에는 길이만 (원문 X)
    if (context) {
      console.log(`📜 스레드 컨텍스트 로드: ${messages.length}개 메시지, ${context.length}자`);
    }

    return context;
  } catch (error) {
    console.error('스레드 컨텍스트 조회 실패:', error.message);
    return '';
  }
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

async function handleSlackEvent(event, channelInfo = null, headers = {}) {
  const eventStartTime = Date.now();
  console.log('🔔 Slack 이벤트 수신:', JSON.stringify(event, null, 2));

  const { type, channel, user, text, ts, thread_ts, event_id, event_ts } = event;

  // app_mention 이벤트만 처리
  if (type !== 'app_mention') {
    console.log(`⚠️ app_mention이 아님: ${type}`);
    return { handled: false, reason: 'not_app_mention' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // P1 Hotfix v2: 1차 방어선 - message_ts 중복 체크 (즉시 마킹)
  // Slack 메시지 고유 ID로 동일 이벤트 재처리 완전 차단
  // ═══════════════════════════════════════════════════════════════════════════
  if (isDuplicateMessageTs(ts)) {
    return { handled: false, reason: 'duplicate_message_ts' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // P1 Hotfix: X-Slack-Retry-Num 헤더 체크 (Slack 재전송 무시)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isSlackRetry(headers)) {
    return { handled: false, reason: 'slack_retry' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Task 1: event_id 중복 방지 (60초 TTL)
  // ═══════════════════════════════════════════════════════════════════════════
  const eventForDedup = { event_id, channel, event_ts: event_ts || ts };
  if (isDuplicateEvent(eventForDedup)) {
    return { handled: false, reason: 'duplicate_event' };
  }

  console.log(`📨 멘션 감지: channel=${channel}, user=${user}, text="${text?.substring(0, 50)}..."`);

  // 채널 허용 여부 확인
  const channelName = channelInfo?.name || '';
  console.log(`📍 채널 정보: ID=${channel}, name=${channelName}`);

  if (!isAllowedChannel(channel, channelName)) {
    console.log(`⚠️ 허용되지 않은 채널: ${channel} (${channelName})`);
    return { handled: false, reason: 'channel_not_allowed' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // v3: 운영 커맨드 먼저 감지 (rate-limit 키 결정용)
  // ═══════════════════════════════════════════════════════════════════════════
  const opsCommand = detectOpsCommand(text);

  // ═══════════════════════════════════════════════════════════════════════════
  // P1 Hotfix v3: 2차 방어선 - Rate-limit (command 기반 키, 10초 TTL)
  // ping/status/config는 텍스트 변형 무관하게 동일 키로 처리
  // ═══════════════════════════════════════════════════════════════════════════
  if (checkAndMarkRateLimit(channel, user, text, opsCommand)) {
    return { handled: false, reason: 'rate_limited' };
  }

  // 스레드 기준 (thread_ts가 없으면 ts 사용)
  const threadTs = thread_ts || ts;

  // ═══════════════════════════════════════════════════════════════════════════
  // 운영 커맨드 처리 (status, config, ping)
  // ═══════════════════════════════════════════════════════════════════════════
  if (opsCommand) {
    console.log(`🔧 운영 커맨드 감지: ${opsCommand}`);
    markEventAsProcessed(eventForDedup);
    // v2: markAsRateLimited 제거 - checkAndMarkRateLimit에서 이미 처리됨

    let response;
    try {
      switch (opsCommand) {
        case 'status':
          response = await handleStatusCommand();
          break;
        case 'config':
          response = await handleConfigCommand();
          break;
        case 'ping':
          response = await handlePingCommand(eventStartTime);
          break;
        default:
          response = `❓ 알 수 없는 커맨드: ${opsCommand}`;
      }

      await postSlackMessage(channel, response, threadTs);
      const responseTime = Date.now() - eventStartTime;
      recordEventStat(true, responseTime);
      console.log(`✅ 운영 커맨드 응답 완료: ${opsCommand} (${responseTime}ms)`);
      return { handled: true, command: opsCommand, threadTs };

    } catch (error) {
      console.error(`❌ 운영 커맨드 오류 (${opsCommand}):`, error);
      recordEventStat(false, Date.now() - eventStartTime);
      await postSlackMessage(channel, `❌ 커맨드 실행 오류: ${error.message}`, threadTs);
      return { handled: false, reason: 'command_error', error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Task 5: 결정문 트리거 처리
  // ═══════════════════════════════════════════════════════════════════════════
  if (decisionService) {
    // "✅ Final:" 감지 → 결정문 확정
    if (decisionService.isFinalTrigger(text)) {
      console.log(`📜 Final 트리거 감지`);
      markEventAsProcessed(eventForDedup);

      const finalMessage = decisionService.extractFinalMessage(text);
      const latestDraftId = await decisionService.getLatestDraftId();

      if (latestDraftId) {
        const result = await decisionService.finalizeDecision(latestDraftId, finalMessage);
        const responseTime = Date.now() - eventStartTime;
        recordEventStat(result.success, responseTime);

        await postSlackMessage(channel, result.message, threadTs);
        return { handled: true, action: 'decision_finalize', decisionId: latestDraftId, threadTs };
      } else {
        await postSlackMessage(channel, '⚠️ 확정할 Draft 결정문이 없습니다.', threadTs);
        return { handled: false, reason: 'no_draft_found' };
      }
    }

    // "결정문 생성" 감지 → 결정문 Draft 생성
    if (decisionService.isDecisionTrigger(text)) {
      console.log(`📜 Decision 트리거 감지`);
      markEventAsProcessed(eventForDedup);

      const topic = decisionService.extractDecisionTopic(text);
      const slackThreadLink = `slack://channel?team=&id=${channel}&message=${ts}`;

      const result = await decisionService.appendDecisionDraft(topic, slackThreadLink);
      const responseTime = Date.now() - eventStartTime;
      recordEventStat(result.success, responseTime);

      if (result.success) {
        await postSlackMessage(channel, result.message, threadTs);
        markThreadAsResponded(threadTs, channel);
        return { handled: true, action: 'decision_draft', decisionId: result.decisionId, threadTs };
      } else {
        await postSlackMessage(channel, `❌ 결정문 생성 실패: ${result.error}`, threadTs);
        return { handled: false, reason: 'decision_error', error: result.error };
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 일반 AI 응답 (중복 방지 적용)
  // ═══════════════════════════════════════════════════════════════════════════

  // 스레드 중복 응답 방지 (같은 스레드에 2번 응답 X)
  if (hasRespondedToThread(threadTs, channel)) {
    console.log(`⚠️ 이미 응답한 스레드: ${threadTs}`);
    return { handled: false, reason: 'already_responded' };
  }

  // 이벤트 처리 시작 표시
  markEventAsProcessed(eventForDedup);
  // v2: markAsRateLimited 제거 - checkAndMarkRateLimit에서 이미 처리됨

  // 역할 감지
  const role = detectRole(text);
  console.log(`🎭 감지된 역할: ${role}`);

  // 멘션 텍스트에서 봇 ID 제거
  const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

  // ═══════════════════════════════════════════════════════════════════════════
  // Task 3: 스레드 컨텍스트 (후속 질문 시 맥락 유지)
  // ═══════════════════════════════════════════════════════════════════════════
  let context = await getTeamContext();

  // 스레드 내 답글인 경우 이전 대화 컨텍스트 추가
  if (thread_ts) {
    const threadContext = await getThreadContext(channel, thread_ts);
    if (threadContext) {
      context += `\n\n📜 이전 대화:\n${threadContext}`;
    }
  }

  try {
    // AI 응답 생성
    const response = await generateResponse(role, cleanText, context);

    // Slack 스레드에 응답
    await postSlackMessage(channel, response, threadTs);

    // 스레드 응답 완료 표시
    markThreadAsResponded(threadTs, channel);

    const responseTime = Date.now() - eventStartTime;
    recordEventStat(true, responseTime);
    console.log(`✅ 응답 완료: 채널=${channel}, 스레드=${threadTs}, 역할=${role} (${responseTime}ms)`);

    return { handled: true, role, threadTs };

  } catch (error) {
    console.error(`❌ AI 응답 오류:`, error);
    recordEventStat(false, Date.now() - eventStartTime);
    await postSlackMessage(channel, `❌ 응답 생성 오류: ${error.message}`, threadTs);
    return { handled: false, reason: 'ai_error', error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // 서명 검증
  verifySlackSignature,
  // 이벤트 처리
  handleSlackEvent,
  isAllowedChannel,
  // 역할/커맨드 감지
  detectRole,
  detectOpsCommand,
  // 중복 방지 (event_id)
  isDuplicateEvent,
  markEventAsProcessed,
  hasRespondedToThread,
  markThreadAsResponded,
  // Rate-limit (P1 Hotfix v2)
  checkAndMarkRateLimit,  // v2: 원자적 check-and-mark
  isDuplicateMessageTs,   // v2: message_ts 중복 체크
  isRateLimited,          // deprecated: 하위 호환
  markAsRateLimited,      // deprecated: 하위 호환
  isSlackRetry,
  // AI 응답
  generateResponse,
  // Slack API
  postSlackMessage,
  getChannelInfo,
  getThreadContext,
  // 컨텍스트
  getTeamContext,
  // 운영 커맨드
  handleStatusCommand,
  handleConfigCommand,
  handlePingCommand,
  // 통계
  getEventStats,
  recordEventStat,
  // 유틸
  maskSensitiveValue,
  // 상수
  ALLOWED_CHANNEL_IDS,
  ALLOWED_CHANNELS,
  ROLE_KEYWORDS,
  ROLE_PROMPTS,
  OPS_COMMANDS,
  RATE_LIMIT_TTL
};
