/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Chat Log Service - 대화 내용 요약 및 Slack/Airtable 저장
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 기능:
 * - PII/Token 마스킹 (sanitize)
 * - LLM 요약 (GPT-4o-mini)
 * - Slack 포맷팅 및 전송
 * - Airtable 저장
 * - Idempotency (Memory Map + Airtable)
 *
 * 작성일: 2026-01-18
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// 환경 설정
// ═══════════════════════════════════════════════════════════════════════════

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Slack 채널
const SLACK_CHANNEL_CHAT_LOGS = process.env.SLACK_CHANNEL_CHAT_LOGS || 'C0A8CRLJW6B';

// Airtable 테이블
const TABLE_CHAT_LOGS = process.env.AIRTABLE_TABLE_CHAT_LOGS || 'Chat Logs';

// Idempotency 캐시 (메모리 기반, 1시간 TTL)
const idempotencyCache = new Map();
const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000; // 1시간

// 캐시 정리 (10분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of idempotencyCache.entries()) {
    if (now - data.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════
// UTF-8 문자열 정규화 (repoPulseService 패턴)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * UTF-8 문자열 sanitize - 깨진 문자 제거/대체
 */
function sanitizeUtf8(str, fallback = '(없음)') {
  if (str === null || str === undefined) {
    return fallback;
  }

  let result = String(str);

  // 1. 서로게이트 쌍 문제 해결 (잘못된 유니코드)
  result = result.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

  // 2. NULL 문자 제거
  result = result.replace(/\x00/g, '');

  // 3. 제어 문자 제거 (탭, 줄바꿈 제외)
  result = result.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 4. 빈 문자열이면 fallback
  if (result.trim() === '') {
    return fallback;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// PII/Token 마스킹
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 전화번호 마스킹: 010-1234-5678 → 010****5678
 */
function maskPhone(text) {
  // 다양한 전화번호 패턴
  return text
    // 010-1234-5678, 010.1234.5678, 010 1234 5678
    .replace(/(\d{3})[-.\s]?(\d{4})[-.\s]?(\d{4})/g, '$1****$3')
    // 02-123-4567, 031-1234-5678
    .replace(/(\d{2,3})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g, '$1****$3');
}

/**
 * 이메일 마스킹: user@domain.com → u***r@domain.com
 */
function maskEmail(text) {
  return text.replace(
    /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match, local, domain) => {
      if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
      }
      return `${local[0]}***${local[local.length - 1]}@${domain}`;
    }
  );
}

/**
 * API 토큰/시크릿 마스킹
 * - OpenAI: sk-****
 * - Slack Bot: xoxb-****
 * - Slack User: xoxp-****
 * - GitHub PAT: ghp_****, github_pat_****
 * - Airtable PAT: pat****
 * - Bearer 토큰: Bearer ****
 */
function maskTokens(text) {
  return text
    // OpenAI API Key
    .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-****')
    // Slack Bot Token
    .replace(/xoxb-[a-zA-Z0-9-]+/g, 'xoxb-****')
    // Slack User Token
    .replace(/xoxp-[a-zA-Z0-9-]+/g, 'xoxp-****')
    // GitHub PAT (new format)
    .replace(/github_pat_[a-zA-Z0-9_]+/g, 'github_pat_****')
    // GitHub PAT (old format)
    .replace(/ghp_[a-zA-Z0-9]+/g, 'ghp_****')
    // Airtable PAT
    .replace(/pat[a-zA-Z0-9.]+/g, 'pat****')
    // Bearer Token
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ****')
    // Generic API Key patterns
    .replace(/api[_-]?key[=:]\s*["']?[a-zA-Z0-9_-]{20,}["']?/gi, 'api_key=****')
    // Generic Secret patterns
    .replace(/secret[=:]\s*["']?[a-zA-Z0-9_-]{20,}["']?/gi, 'secret=****');
}

/**
 * 종합 Sanitize 함수: PII + Token 마스킹
 */
function sanitizeText(text) {
  if (!text) return '';

  let result = sanitizeUtf8(text, '');
  result = maskPhone(result);
  result = maskEmail(result);
  result = maskTokens(result);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Idempotency Key 생성
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Idempotency Key 생성
 * Key: SHA256(topic + text.slice(0,500)).slice(0,32)
 */
function generateIdempotencyKey(topic, conversationText) {
  const input = `${topic || ''}${(conversationText || '').slice(0, 500)}`;
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return hash.slice(0, 32);
}

// ═══════════════════════════════════════════════════════════════════════════
// Airtable API 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

async function airtableRequest(tableName, method = 'GET', body = null, recordId = null, queryParams = null) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('[ChatLog] Airtable 미설정 - 시뮬레이션 모드');
    return { success: false, simulated: true };
  }

  let url = recordId
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

  if (queryParams) {
    url += `?${queryParams}`;
  }

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error(`[ChatLog] Airtable ${method} 오류:`, data.error?.message || data.error);
      return { success: false, error: data.error, status: response.status };
    }

    return { success: true, data, recordId: data.id };
  } catch (error) {
    console.error(`[ChatLog] Airtable ${method} 실패:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Airtable에서 idempotency_key로 기존 레코드 조회
 */
async function findByIdempotencyKey(idempotencyKey) {
  const filterFormula = `{log_id} = "${idempotencyKey}"`;
  const queryParams = `filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`;

  const result = await airtableRequest(TABLE_CHAT_LOGS, 'GET', null, null, queryParams);

  if (!result.success || result.simulated) {
    return null;
  }

  const records = result.data?.records || [];
  return records.length > 0 ? records[0] : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack API 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

async function postToSlack(channel, blocks, text) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('[ChatLog] Slack 토큰 미설정 - 시뮬레이션');
    return { success: false, simulated: true, ok: false };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ channel, blocks, text })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[ChatLog] Slack 전송 실패:', data.error);
      return { success: false, ok: false, error: data.error };
    }

    return { success: true, ok: true, ts: data.ts, channel: data.channel };
  } catch (error) {
    console.error('[ChatLog] Slack 전송 오류:', error.message);
    return { success: false, ok: false, error: error.message };
  }
}

/**
 * 기존 Slack 메시지에 스레드 댓글 추가
 */
async function replyToSlack(channel, threadTs, text) {
  if (!SLACK_BOT_TOKEN) {
    return { success: false, simulated: true };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        channel,
        thread_ts: threadTs,
        text
      })
    });

    const data = await response.json();
    return { success: data.ok, ts: data.ts };
  } catch (error) {
    console.error('[ChatLog] Slack 댓글 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM 요약 (GPT-4o-mini)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LLM을 사용한 대화 요약
 * @param {string} conversationText - 대화 내용
 * @param {string} topic - 주제
 * @returns {Object} { summary, decisions, actions, topics }
 */
async function summarizeWithLLM(conversationText, topic) {
  if (!OPENAI_API_KEY) {
    console.warn('[ChatLog] OpenAI API Key 미설정 - fallback 사용');
    return getFallbackSummary(topic);
  }

  const systemPrompt = `당신은 대화 내용을 분석하여 핵심을 추출하는 전문가입니다.
다음 대화 내용을 분석하여 JSON 형식으로 응답하세요:

{
  "summary": "한 줄 요약 (50자 이내)",
  "decisions": ["결정된 사항 1", "결정된 사항 2"],
  "actions": ["실행 항목 1", "실행 항목 2"],
  "topics": ["키워드1", "키워드2", "키워드3"]
}

규칙:
- summary: 핵심을 한 문장으로 요약
- decisions: 확정된 결정 사항만 (없으면 빈 배열)
- actions: 다음에 해야 할 일 (없으면 빈 배열)
- topics: 관련 키워드 3-5개`;

  const userPrompt = `주제: ${topic || '(주제 없음)'}

대화 내용:
${conversationText.slice(0, 4000)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[ChatLog] OpenAI API 오류:', errorData.error?.message);
      return getFallbackSummary(topic);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getFallbackSummary(topic);
    }

    // JSON 파싱 시도
    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || `${topic} 관련 대화`,
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : []
      };
    } catch (parseError) {
      console.error('[ChatLog] JSON 파싱 실패:', parseError.message);
      return getFallbackSummary(topic);
    }

  } catch (error) {
    console.error('[ChatLog] LLM 요약 실패:', error.message);
    return getFallbackSummary(topic);
  }
}

/**
 * LLM 실패 시 Fallback 요약
 */
function getFallbackSummary(topic) {
  return {
    summary: topic ? `${topic} 관련 대화 로그` : '대화 로그 저장됨',
    decisions: [],
    actions: [],
    topics: []
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 메시지 포맷
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chat Log Slack 블록 생성
 */
function formatChatLogBlocks(data) {
  const { topic, owner, summary, decisions, actions, topics, sensitivity, createdAt } = data;

  const sensitivityEmoji = {
    'PUBLIC': '🌍',
    'INTERNAL': '🔒',
    'SENSITIVE': '🔴'
  };

  const emoji = sensitivityEmoji[sensitivity] || '📝';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${topic || 'Chat Log'}`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Owner*\n${owner || '(미지정)'}` },
        { type: 'mrkdwn', text: `*Sensitivity*\n${sensitivity || 'INTERNAL'}` }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Summary*\n${summary}`
      }
    }
  ];

  // Decisions 섹션 (있는 경우만)
  if (decisions && decisions.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Decisions*\n${decisions.map(d => `• ${d}`).join('\n')}`
      }
    });
  }

  // Actions 섹션 (있는 경우만)
  if (actions && actions.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Actions*\n${actions.map(a => `☐ ${a}`).join('\n')}`
      }
    });
  }

  // Topics 태그
  if (topics && topics.length > 0) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🏷️ ${topics.join(' | ')}`
        }
      ]
    });
  }

  // 타임스탬프
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `📅 ${new Date(createdAt || Date.now()).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
      }
    ]
  });

  return blocks;
}

// ═══════════════════════════════════════════════════════════════════════════
// Airtable 저장
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chat Log를 Airtable에 저장
 */
async function saveChatLog(logData) {
  const fields = {
    log_id: logData.logId,
    topic: logData.topic || '',
    owner: logData.owner || '',
    sensitivity: logData.sensitivity || 'INTERNAL',
    summary: logData.summary || '',
    decisions_json: JSON.stringify(logData.decisions || []),
    actions_json: JSON.stringify(logData.actions || []),
    topics: (logData.topics || []).join(', '),
    conversation_sanitized: logData.conversationSanitized || '',
    slack_ts: logData.slackTs || '',
    idempotency_key: logData.idempotencyKey || '',
    created_at: new Date().toISOString()
  };

  const result = await airtableRequest(TABLE_CHAT_LOGS, 'POST', { fields });

  if (result.simulated) {
    console.log(`[ChatLog] [시뮬레이션] Chat Log 저장: ${logData.logId}`);
    return { success: true, simulated: true, logId: logData.logId };
  }

  if (result.success) {
    console.log(`[ChatLog] Chat Log 저장 완료: ${logData.logId}`);
    return { success: true, logId: logData.logId, recordId: result.data.id };
  }

  return { success: false, error: result.error };
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 함수: Chat Log 저장
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chat Log 저장 메인 함수
 * @param {Object} params
 * @param {string} params.conversation_text - 대화 내용
 * @param {string} params.topic - 주제
 * @param {string} params.owner - 작성자
 * @param {string} params.sensitivity - PUBLIC | INTERNAL | SENSITIVE
 */
async function saveChatLogFull(params) {
  const { conversation_text, topic, owner, sensitivity = 'INTERNAL' } = params;

  if (!conversation_text) {
    return { success: false, error: 'conversation_text is required' };
  }

  // 1. Idempotency Key 생성
  const idempotencyKey = generateIdempotencyKey(topic, conversation_text);
  const logId = idempotencyKey; // log_id = idempotency_key

  console.log(`[ChatLog] 처리 시작: topic="${topic}", key=${idempotencyKey.slice(0, 8)}...`);

  // 2. Memory Cache 중복 체크
  if (idempotencyCache.has(idempotencyKey)) {
    const cached = idempotencyCache.get(idempotencyKey);
    console.log(`[ChatLog] Memory 중복 감지: ${idempotencyKey.slice(0, 8)}...`);

    // 기존 Slack 스레드에 댓글 (옵션)
    if (cached.slackTs && cached.slackChannel) {
      await replyToSlack(cached.slackChannel, cached.slackTs, '⚠️ Duplicate request detected');
    }

    return {
      success: true,
      status: 'duplicate',
      source: 'memory_cache',
      slack_ts: cached.slackTs,
      airtable_record_id: cached.airtableRecordId,
      log_id: logId
    };
  }

  // 3. Airtable 중복 체크
  const existingRecord = await findByIdempotencyKey(idempotencyKey);
  if (existingRecord) {
    console.log(`[ChatLog] Airtable 중복 감지: ${idempotencyKey.slice(0, 8)}...`);

    // Memory Cache에도 추가
    idempotencyCache.set(idempotencyKey, {
      timestamp: Date.now(),
      slackTs: existingRecord.fields?.slack_ts,
      slackChannel: SLACK_CHANNEL_CHAT_LOGS,
      airtableRecordId: existingRecord.id
    });

    // 기존 Slack 스레드에 댓글 (옵션)
    const existingSlackTs = existingRecord.fields?.slack_ts;
    if (existingSlackTs) {
      await replyToSlack(SLACK_CHANNEL_CHAT_LOGS, existingSlackTs, '⚠️ Duplicate request detected');
    }

    return {
      success: true,
      status: 'duplicate',
      source: 'airtable',
      slack_ts: existingSlackTs,
      airtable_record_id: existingRecord.id,
      log_id: logId
    };
  }

  // 4. Sanitize (PII/Token 마스킹)
  const conversationSanitized = sanitizeText(conversation_text);

  // 5. LLM 요약
  const llmResult = await summarizeWithLLM(conversationSanitized, topic);

  // 6. Slack 전송
  const slackData = {
    topic,
    owner,
    sensitivity,
    summary: llmResult.summary,
    decisions: llmResult.decisions,
    actions: llmResult.actions,
    topics: llmResult.topics,
    createdAt: new Date().toISOString()
  };

  const blocks = formatChatLogBlocks(slackData);
  const slackResult = await postToSlack(
    SLACK_CHANNEL_CHAT_LOGS,
    blocks,
    `📝 ${topic || 'Chat Log'}: ${llmResult.summary}`
  );

  // 7. Airtable 저장
  const airtableData = {
    logId,
    topic,
    owner,
    sensitivity,
    summary: llmResult.summary,
    decisions: llmResult.decisions,
    actions: llmResult.actions,
    topics: llmResult.topics,
    conversationSanitized,
    slackTs: slackResult.ts || '',
    idempotencyKey
  };

  const airtableResult = await saveChatLog(airtableData);

  // 8. Memory Cache 업데이트
  idempotencyCache.set(idempotencyKey, {
    timestamp: Date.now(),
    slackTs: slackResult.ts,
    slackChannel: slackResult.channel || SLACK_CHANNEL_CHAT_LOGS,
    airtableRecordId: airtableResult.recordId
  });

  console.log(`[ChatLog] 저장 완료: log_id=${logId.slice(0, 8)}..., slack_ts=${slackResult.ts || 'N/A'}`);

  return {
    success: true,
    status: 'saved',
    log_id: logId,
    slack_ts: slackResult.ts || null,
    slack_posted: slackResult.ok === true,
    airtable_record_id: airtableResult.recordId || null,
    airtable_saved: airtableResult.success,
    summary: llmResult.summary,
    decisions_count: llmResult.decisions.length,
    actions_count: llmResult.actions.length,
    simulated: airtableResult.simulated || slackResult.simulated || false
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  saveChatLogFull,
  // 개별 함수 (테스트용)
  sanitizeText,
  sanitizeUtf8,
  maskPhone,
  maskEmail,
  maskTokens,
  generateIdempotencyKey,
  summarizeWithLLM,
  formatChatLogBlocks
};
