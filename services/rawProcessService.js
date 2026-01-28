/**
 * rawProcessService.js
 *
 * RAW 콘텐츠 가공 서비스
 * - sanitize: PII/토큰 마스킹
 * - LLM: 요약/키워드/액션/결정 추출
 * - Slack: 요약 포스트
 * - Idempotency: 중복 방지
 *
 * @version 1.0
 * @date 2026-01-20
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// 환경변수
// ═══════════════════════════════════════════════════════════════════════════

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_RAW_DIGEST = process.env.SLACK_CHANNEL_RAW_DIGEST || process.env.SLACK_CHANNEL_CHAT_LOGS || 'C0A9DS4T0D8';

// ═══════════════════════════════════════════════════════════════════════════
// Idempotency 캐시 (메모리 기반, 1시간 TTL)
// ═══════════════════════════════════════════════════════════════════════════

const idempotencyCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

function generateIdempotencyKey(driveUrl, content) {
  const payload = (driveUrl || '') + (content || '').slice(0, 500);
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

function checkIdempotency(key) {
  const cached = idempotencyCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  return null;
}

function setIdempotency(key, data) {
  idempotencyCache.set(key, {
    ...data,
    timestamp: Date.now()
  });

  // 오래된 캐시 정리 (10% 확률)
  if (Math.random() < 0.1) {
    const now = Date.now();
    for (const [k, v] of idempotencyCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        idempotencyCache.delete(k);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sanitize (PII/토큰 마스킹)
// ═══════════════════════════════════════════════════════════════════════════

function sanitizeText(text) {
  if (!text) return '';

  let result = text;

  // 전화번호 마스킹 (010-1234-5678 → 010****5678)
  result = result.replace(/(\d{3})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g, (match, p1, p2, p3) => {
    return p1 + '****' + p3;
  });

  // 이메일 마스킹 (user@domain.com → u***r@domain.com)
  result = result.replace(/([a-zA-Z0-9])([a-zA-Z0-9._-]*)([a-zA-Z0-9])@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match, first, middle, last, domain) => {
      return first + '***' + last + '@' + domain;
    }
  );

  // API 키/토큰 마스킹
  const tokenPatterns = [
    /sk-[a-zA-Z0-9]{20,}/g,           // OpenAI
    /xoxb-[a-zA-Z0-9-]+/g,            // Slack bot
    /xoxp-[a-zA-Z0-9-]+/g,            // Slack user
    /ghp_[a-zA-Z0-9]{36,}/g,          // GitHub PAT
    /github_pat_[a-zA-Z0-9_]{22,}/g,  // GitHub PAT new
    /pat[a-zA-Z0-9]{21,}/g,           // Airtable PAT
    /key[a-zA-Z0-9]{20,}/gi,          // Generic API key
    /Bearer\s+[a-zA-Z0-9._-]+/g       // Bearer tokens
  ];

  for (const pattern of tokenPatterns) {
    result = result.replace(pattern, (match) => {
      const prefix = match.slice(0, 4);
      return prefix + '****';
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM 요약 (GPT-4o-mini)
// ═══════════════════════════════════════════════════════════════════════════

const LLM_SYSTEM_PROMPT = `당신은 콘텐츠 분석 전문가입니다. 주어진 텍스트를 분석하여 정확히 아래 JSON 형식으로만 응답하세요.

출력 형식 (JSON):
{
  "summary": "핵심 내용을 1줄로 요약 (50자 이내)",
  "summary_5words": "파일명용 5단어 이내 요약 (한글, 띄어쓰기 없이 언더스코어)",
  "tags": ["필수태그1개", "선택태그0-2개"],
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "actions": [
    {"who": "담당자", "what": "할 일", "when": "기한", "priority": "HIGH|MEDIUM|LOW"}
  ],
  "decisions": [
    {"decision": "결정 내용", "owner": "결정자", "due": "적용일"}
  ],
  "doc_type": "SYSTEM|DECISION|CONTENT|NOTE",
  "sensitivity": "PRIVATE|INTERNAL"
}

## 태그 체계 (반드시 이 태그만 사용!)

필수 태그 (반드시 1개 선택):
- #전략: 방향성, 의사결정, 비전, 마케팅 전략
- #기술: 개발, 시스템, API, 코드, 버그, 배포
- #운영: 프로세스, 루틴, 워크플로우, 팀 관리
- #콘텐츠: 메시지, 디자인, 카피, 영상, 대본
- #분석: 데이터, 인사이트, 리서치, 시장 조사
- #고객: 소원이, 피드백, VOC, 사용자 반응

선택 태그 (해당 시 0-2개 추가):
- #긴급: 24시간 내 액션 필요
- #검증됨: 실제 적용 후 효과 확인됨

## doc_type 분류 기준:
- SYSTEM: 배포, 에러, 버그, API, 서버, 코드 관련
- DECISION: 결정, 정책, 승인, 합의 관련
- CONTENT: 콘텐츠, 영상, 대본, 유튜브 관련
- NOTE: 그 외 일반 메모/기록

## 규칙:
- tags 배열에는 반드시 필수 태그 1개 포함
- summary_5words는 파일명에 사용할 5단어 이내 요약 (예: 베타테스트_피드백_수집방법)
- actions/decisions가 없으면 빈 배열 []로
- 반드시 유효한 JSON만 출력. 설명이나 마크다운 없이 JSON만.`;

async function processWithLLM(content, title, category) {
  if (!OPENAI_API_KEY) {
    console.warn('[RawProcess] OpenAI API 키 미설정 - fallback 사용');
    return createFallbackResult(content, title, category);
  }

  try {
    const userPrompt = `제목: ${title || '(없음)'}
카테고리: ${category || '(없음)'}

내용:
${content.slice(0, 4000)}`;  // 토큰 제한

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: LLM_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content?.trim();

    if (!resultText) {
      throw new Error('LLM 응답 없음');
    }

    // JSON 파싱 시도
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 형식 아님');
    }

    const result = JSON.parse(jsonMatch[0]);

    // 필수 필드 검증/보정
    const validTags = ['#전략', '#기술', '#운영', '#콘텐츠', '#분석', '#고객', '#긴급', '#검증됨'];
    const tags = Array.isArray(result.tags)
      ? result.tags.filter(t => validTags.includes(t)).slice(0, 3)
      : [inferTagFromDocType(inferDocType(category, content))];

    // 태그가 비어있으면 doc_type 기반 추론
    if (tags.length === 0) {
      tags.push(inferTagFromDocType(inferDocType(category, content)));
    }

    // keywords: LLM 결과 우선, 없으면 fallback 생성
    const llmKeywords = Array.isArray(result.keywords) ? result.keywords.slice(0, 5) : [];
    const finalKeywords = llmKeywords.length > 0
      ? llmKeywords
      : generateFallbackKeywords(title, result.summary || '', content);

    return {
      summary: result.summary || content.slice(0, 50) + '...',
      summary_5words: result.summary_5words || generateSummary5Words(title, content),
      tags: tags,
      keywords: finalKeywords,
      actions: Array.isArray(result.actions) ? result.actions.slice(0, 5) : [],
      decisions: Array.isArray(result.decisions) ? result.decisions.slice(0, 3) : [],
      doc_type: ['SYSTEM', 'DECISION', 'CONTENT', 'NOTE'].includes(result.doc_type)
        ? result.doc_type : inferDocType(category, content),
      sensitivity: ['PRIVATE', 'INTERNAL'].includes(result.sensitivity)
        ? result.sensitivity : 'INTERNAL'
    };

  } catch (error) {
    console.error('[RawProcess] LLM 처리 실패:', error.message);
    return createFallbackResult(content, title, category);
  }
}

/**
 * doc_type에서 기본 태그 추론
 */
function inferTagFromDocType(docType) {
  const mapping = {
    'SYSTEM': '#기술',
    'DECISION': '#전략',
    'CONTENT': '#콘텐츠',
    'NOTE': '#운영'
  };
  return mapping[docType] || '#운영';
}

/**
 * Fallback 키워드 생성 (summary/title/content 기반)
 * LLM이 키워드를 반환하지 않았을 때 사용
 */
function generateFallbackKeywords(title, summary, content) {
  const keywords = new Set();

  // 1. 패턴 매칭 키워드 (기존 extractSimpleKeywords 로직)
  const patternKeywords = extractSimpleKeywords(content);
  patternKeywords.forEach(k => keywords.add(k));

  // 2. title에서 명사 추출 (2-10자)
  if (title) {
    const titleWords = title
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && w.length <= 10);
    titleWords.slice(0, 2).forEach(w => keywords.add(w));
  }

  // 3. summary에서 명사 추출
  if (summary) {
    const summaryWords = summary
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && w.length <= 10);
    summaryWords.slice(0, 2).forEach(w => keywords.add(w));
  }

  // 4. content에서 자주 등장하는 단어 (최후 수단)
  if (keywords.size < 3 && content) {
    const contentWords = content
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && w.length <= 12);

    // 빈도 계산
    const freq = {};
    contentWords.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    // 빈도 순 정렬 후 상위 추가
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    sorted.slice(0, 5 - keywords.size).forEach(w => keywords.add(w));
  }

  // 최소 1개 보장
  if (keywords.size === 0) {
    keywords.add('기록');
  }

  return Array.from(keywords).slice(0, 5);
}

/**
 * 파일명용 5단어 요약 생성
 */
function generateSummary5Words(title, content) {
  // 제목이 있으면 제목 기반, 없으면 내용 기반
  const source = title || content.slice(0, 100);

  // 특수문자 제거, 공백을 언더스코어로
  let summary = source
    .replace(/[^\w\s가-힣]/g, '')  // 특수문자 제거
    .trim()
    .split(/\s+/)                   // 공백으로 분리
    .slice(0, 5)                    // 5단어로 제한
    .join('_');

  // 너무 길면 자르기
  if (summary.length > 50) {
    summary = summary.slice(0, 50);
  }

  return summary || 'untitled';
}

function createFallbackResult(content, title, category) {
  const docType = inferDocType(category, content);
  const summary = (title || content.slice(0, 50)).trim() + (content.length > 50 ? '...' : '');

  // keywords: fallback 로직 적용
  const keywords = generateFallbackKeywords(title, summary, content);

  return {
    summary: summary,
    summary_5words: generateSummary5Words(title, content),
    tags: [inferTagFromDocType(docType)],
    keywords: keywords,
    actions: [],
    decisions: [],
    doc_type: docType,
    sensitivity: 'INTERNAL'
  };
}

function inferDocType(category, content) {
  const lowerContent = (content || '').toLowerCase();
  const lowerCategory = (category || '').toLowerCase();

  if (['시스템', 'system'].includes(lowerCategory) ||
      /배포|에러|버그|api|서버|코드|deploy|error|bug/.test(lowerContent)) {
    return 'SYSTEM';
  }
  if (['의사결정', 'decision'].includes(lowerCategory) ||
      /결정|정책|승인|합의|확정/.test(lowerContent)) {
    return 'DECISION';
  }
  if (['콘텐츠', 'content'].includes(lowerCategory) ||
      /대본|유튜브|영상|콘텐츠|스크립트/.test(lowerContent)) {
    return 'CONTENT';
  }
  return 'NOTE';
}

function extractSimpleKeywords(content) {
  if (!content) return [];

  const keywords = [];

  // 확장된 키워드 패턴 (도메인별)
  const keywordPatterns = {
    // 기술
    '배포': /배포|deploy|릴리즈|release/i,
    '에러': /에러|error|버그|bug|오류|장애/i,
    'API': /api|엔드포인트|endpoint|라우트|route/i,
    '서버': /서버|server|render|vercel|호스팅/i,
    'DB': /db|database|데이터베이스|쿼리|query/i,
    '프론트': /프론트|frontend|react|vue|ui|ux/i,

    // 운영
    '결정': /결정|정책|승인|합의|확정/i,
    '회의': /회의|미팅|meeting|논의|토론/i,
    '프로세스': /프로세스|워크플로우|workflow|절차/i,

    // 콘텐츠
    '콘텐츠': /콘텐츠|content|영상|대본|스크립트/i,
    '마케팅': /마케팅|marketing|캠페인|광고|프로모션/i,
    'SNS': /sns|소셜|인스타|페이스북|트위터/i,

    // 분석
    '지표': /지표|metric|kpi|전환율|리텐션/i,
    '분석': /분석|analysis|데이터|통계|리포트/i,

    // 고객
    '고객': /고객|customer|사용자|user|소원이/i,
    'VOC': /voc|피드백|feedback|문의|불만/i,

    // 도구
    'Slack': /슬랙|slack/i,
    'Airtable': /에어테이블|airtable/i,
    'Wix': /wix|윅스/i,
    'Drive': /drive|드라이브|구글/i,
    'GitHub': /github|깃허브|깃헙|repo/i
  };

  for (const [keyword, pattern] of Object.entries(keywordPatterns)) {
    if (pattern.test(content)) {
      keywords.push(keyword);
    }
    if (keywords.length >= 5) break;
  }

  return keywords;
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 전송
// ═══════════════════════════════════════════════════════════════════════════

async function postToSlack(result, driveUrl, title) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('[RawProcess] Slack 토큰 미설정 - 전송 스킵');
    return { success: false, reason: 'no_token' };
  }

  try {
    // 메시지 블록 구성 (header 대신 section+mrkdwn 사용 - 한글 인코딩 호환성)
    const safeTitle = String(title || '새 문서').normalize('NFC');

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:page_facing_up: *${safeTitle}*`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*요약*\n${result.summary}`
        }
      }
    ];

    // 태그 (표준화된 분류)
    if (result.tags && result.tags.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*태그*: ${result.tags.map(t => '`' + t + '`').join(' ')}`
        }
      });
    }

    // 키워드 (상세 분류)
    if (result.keywords && result.keywords.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*키워드*: ${result.keywords.map(k => '`' + k + '`').join(' ')}`
        }
      });
    }

    // Actions (최대 3개)
    if (result.actions && result.actions.length > 0) {
      const actionText = result.actions.slice(0, 3).map((a, i) =>
        `${i + 1}. ${a.what} (${a.who || '미정'}, ${a.priority || 'MEDIUM'})`
      ).join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Actions*\n${actionText}`
        }
      });
    }

    // Decisions
    if (result.decisions && result.decisions.length > 0) {
      const decText = result.decisions.map((d, i) =>
        `${i + 1}. ${d.decision} (${d.owner || '미정'})`
      ).join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Decisions*\n${decText}`
        }
      });
    }

    // 메타 정보 + 링크
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📁 ${result.doc_type} | 🔒 ${result.sensitivity} | <${driveUrl}|Drive에서 열기>`
        }
      ]
    });

    // Slack API 호출 (UTF-8 charset 명시)
    const payload = JSON.stringify({
      channel: SLACK_CHANNEL_RAW_DIGEST,
      blocks: blocks,
      text: `📄 ${title || '새 문서'}: ${result.summary}`  // fallback
    });

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
      },
      body: payload
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Slack API 오류');
    }

    return {
      success: true,
      ts: data.ts,
      channel: data.channel
    };

  } catch (error) {
    console.error('[RawProcess] Slack 전송 실패:', error.message);
    return { success: false, reason: error.message };
  }
}

// 스레드 댓글 (중복 시)
async function postThreadReply(channelId, threadTs, message) {
  if (!SLACK_BOT_TOKEN) return { success: false };

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel: channelId,
        thread_ts: threadTs,
        text: message
      })
    });

    const data = await response.json();
    return { success: data.ok, ts: data.ts };

  } catch (error) {
    return { success: false, reason: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 처리 함수
// ═══════════════════════════════════════════════════════════════════════════

async function processRawContent(payload) {
  const { drive_url, title, category, content, created_at, source } = payload;

  // 필수 검증
  if (!content || !content.trim()) {
    return {
      success: false,
      error: 'content가 비어있습니다.'
    };
  }

  // Idempotency 체크
  const idempotencyKey = generateIdempotencyKey(drive_url, content);
  const cached = checkIdempotency(idempotencyKey);

  if (cached) {
    console.log('[RawProcess] Idempotency hit:', idempotencyKey);

    // 이미 처리됨 - 스레드 댓글만 (옵션)
    if (cached.slack_ts && cached.slack_channel) {
      await postThreadReply(
        cached.slack_channel,
        cached.slack_ts,
        `🔄 재처리 요청됨 (${new Date().toLocaleString('ko-KR')})`
      );
    }

    return {
      success: true,
      duplicate: true,
      summary: cached.summary,
      summary_5words: cached.summary_5words,
      tags: cached.tags,
      keywords: cached.keywords,
      actions: cached.actions,
      decisions: cached.decisions,
      doc_type: cached.doc_type,
      sensitivity: cached.sensitivity,
      slack_ts: cached.slack_ts
    };
  }

  // 1. Sanitize
  const sanitizedContent = sanitizeText(content);

  // 2. LLM 처리
  const llmResult = await processWithLLM(sanitizedContent, title, category);

  // 3. Slack 전송
  const slackResult = await postToSlack(llmResult, drive_url, title);

  // 4. 캐시 저장
  const result = {
    success: true,
    summary: llmResult.summary,
    summary_5words: llmResult.summary_5words,
    tags: llmResult.tags,
    keywords: llmResult.keywords,
    actions: llmResult.actions,
    decisions: llmResult.decisions,
    doc_type: llmResult.doc_type,
    sensitivity: llmResult.sensitivity,
    slack_ts: slackResult.success ? slackResult.ts : null,
    slack_channel: slackResult.success ? slackResult.channel : null
  };

  setIdempotency(idempotencyKey, result);

  console.log('[RawProcess] 처리 완료:', {
    title: title || '(없음)',
    doc_type: llmResult.doc_type,
    slack: slackResult.success ? 'OK' : 'SKIP'
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  processRawContent,
  sanitizeText,
  generateIdempotencyKey
};
