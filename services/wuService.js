/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WU Service — Aurora5 통합 엔진 비즈니스 로직
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 가드레일:
 *   [1] Q15: DB가 세션 SSOT. 인메모리 Map은 원문 임시 보관만.
 *   [2] TTL 30분. 만료 시 410. Resume 없음(Q4).
 *   [3] Q3+Q13: AI 1회. keywords 포함. 원문 절대 DB 저장 금지.
 *   [4] Q12: RED → session.status='paused' in DB. /complete 차단(409).
 *   [5] Q7: share_id 생성만. OG는 별도.
 *   [6] 질문은 content/wu/*.ko.json에서 로드.
 *
 * @since 2026-02-13
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// 의존성 (tolerant loading)
// ═══════════════════════════════════════════════════════════════════════════

let db = null;
try {
  db = require('../database/db');
} catch (e) {
  console.warn('[WU] DB 로드 실패:', e.message);
}

let miracleScoreEngine = null;
try {
  miracleScoreEngine = require('./miracleScoreEngine');
} catch (e) {
  console.warn('[WU] miracleScoreEngine 로드 실패:', e.message);
}

let featureFlags = null;
try {
  featureFlags = require('../config/featureFlags');
} catch (e) {
  console.warn('[WU] featureFlags 로드 실패:', e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수
// ═══════════════════════════════════════════════════════════════════════════

const SESSION_TTL_MS = 30 * 60 * 1000; // 30분
const MAX_ANSWER_LENGTH = 1000;

const SESSION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
};

// ═══════════════════════════════════════════════════════════════════════════
// RED/YELLOW 안전 게이트 (wishIntakeService 패턴 재사용)
// ═══════════════════════════════════════════════════════════════════════════

const RISK_PATTERNS = {
  RED: {
    selfHarm: [/죽고\s*싶/, /자살/, /자해/, /목숨/, /끝내고\s*싶/, /생을\s*마감/],
    violence: [/죽이겠/, /때리겠/, /폭행/, /학대/, /협박/],
    illegal: [/마약/, /사기/, /불법\s*촬영/, /몰카/],
    hate: [/혐오/, /비하/, /폭력\s*선동/],
  },
  YELLOW: {
    medical: [/진단해\s*줘/, /치료해\s*줘/, /약\s*추천/, /처방/],
    manipulation: [/통제/, /복수/, /협박\s*메시지/, /조작/],
    vulnerable: [/미성년/, /초등학생/, /중학생/, /고등학생/],
  },
};

const FALSE_POSITIVE_PATTERNS = [
  /싶지\s*않/, /하지\s*않/, /안\s*할/,
  /["'「」].*["'」]/, /했었/, /했다고/,
];

// ═══════════════════════════════════════════════════════════════════════════
// 질문 콘텐츠 로더 (가드레일 [6]: JSON에서 로드)
// ═══════════════════════════════════════════════════════════════════════════

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'wu');
const questionCache = new Map();

/**
 * WU 유형+로케일의 질문 목록 로드
 * @param {string} wuType - 'REL', 'SELF_ST_TXT', ...
 * @param {string} locale - 'ko' (기본)
 * @returns {Object|null} 질문 콘텐츠 객체
 */
function loadQuestions(wuType, locale = 'ko') {
  const cacheKey = `${wuType}_${locale}`;
  if (questionCache.has(cacheKey)) return questionCache.get(cacheKey);

  // 파일명 패턴: REL_001.ko.json, SELF_ST_TXT.ko.json 등
  const candidates = [
    `${wuType}_001.${locale}.json`,
    `${wuType}.${locale}.json`,
  ];

  for (const filename of candidates) {
    const filePath = path.join(CONTENT_DIR, filename);
    try {
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        questionCache.set(cacheKey, content);
        console.log(`[WU] 질문 로드 완료: ${filename}`);
        return content;
      }
    } catch (e) {
      console.error(`[WU] 질문 파일 로드 실패: ${filename}`, e.message);
    }
  }

  console.warn(`[WU] 질문 파일 없음: ${wuType}.${locale}`);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 인메모리 세션 (원문 임시 보관 전용 — DB가 SSOT)
// ═══════════════════════════════════════════════════════════════════════════

// Map<sessionId, { answers: [{idx, text, key}], expiresAt: number }>
const rawAnswerMap = new Map();

/** 인메모리에 원문 임시 저장 */
function storeRawAnswer(sessionId, idx, key, text) {
  let entry = rawAnswerMap.get(sessionId);
  if (!entry) {
    entry = { answers: [], expiresAt: Date.now() + SESSION_TTL_MS };
    rawAnswerMap.set(sessionId, entry);
  }
  entry.answers.push({ idx, key, text });
}

/** 인메모리 원문 조회 (complete 시 AI에 전달) */
function getRawAnswers(sessionId) {
  const entry = rawAnswerMap.get(sessionId);
  return entry ? entry.answers : [];
}

/** 인메모리 원문 즉시 삭제 (complete/abandon 후) */
function purgeRawAnswers(sessionId) {
  rawAnswerMap.delete(sessionId);
}

// 30초마다 만료된 인메모리 엔트리 정리
setInterval(() => {
  const now = Date.now();
  for (const [sid, entry] of rawAnswerMap.entries()) {
    if (now > entry.expiresAt) {
      rawAnswerMap.delete(sid);
    }
  }
}, 30000);

// ═══════════════════════════════════════════════════════════════════════════
// 안전 게이트 (가드레일 [4])
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 텍스트 안전 검사
 * @returns {{ level: 'RED'|'YELLOW'|'GREEN', category?: string, keyword?: string }}
 */
function checkSafety(text) {
  if (!text) return { level: 'GREEN' };

  const normalized = text.toLowerCase().trim();

  // 오탐 체크
  for (const fp of FALSE_POSITIVE_PATTERNS) {
    if (fp.test(normalized)) return { level: 'GREEN' };
  }

  // RED 검사
  for (const [category, patterns] of Object.entries(RISK_PATTERNS.RED)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return { level: 'RED', category, keyword: normalized.match(pattern)?.[0] };
      }
    }
  }

  // YELLOW 검사
  for (const [category, patterns] of Object.entries(RISK_PATTERNS.YELLOW)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return { level: 'YELLOW', category };
      }
    }
  }

  return { level: 'GREEN' };
}

// ═══════════════════════════════════════════════════════════════════════════
// DB 연산
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 소원이 프로필 upsert (가드레일 [1])
 */
async function ensureProfile(phoneHash, nickname, birthYearMonth) {
  const result = await db.query(
    `SELECT upsert_sowon_profile($1, $2, $3, TRUE, FALSE) AS id`,
    [phoneHash, nickname || null, birthYearMonth || null]
  );
  return result.rows[0].id;
}

/**
 * DB에 세션 생성 (가드레일 [1]: DB = SSOT)
 */
async function createDbSession(profileId, wuType) {
  const result = await db.query(
    `INSERT INTO wu_sessions (profile_id, wu_type, status, started_at, expires_at)
     VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 minutes')
     RETURNING session_id, expires_at`,
    [profileId, wuType]
  );
  return result.rows[0];
}

/**
 * DB 세션 조회 + 만료 체크
 * @returns {Object|null} 세션 또는 null(만료/미존재)
 */
async function getDbSession(sessionId) {
  // 먼저 만료 처리
  await db.query(
    `UPDATE wu_sessions SET status = 'expired'
     WHERE session_id = $1 AND status = 'active' AND expires_at < NOW()`,
    [sessionId]
  );

  const result = await db.query(
    `SELECT session_id, profile_id, wu_type, status,
            current_question_idx, answer_count, risk_level,
            started_at, expires_at, completed_at, share_id
     FROM wu_sessions WHERE session_id = $1`,
    [sessionId]
  );

  const row = result.rows[0];
  if (!row) return null;

  // 추가 방어: DB UPDATE 미작동 시에도 앱 레벨에서 만료 감지
  if (row.status === 'active' && new Date(row.expires_at) < new Date()) {
    await db.query(
      `UPDATE wu_sessions SET status = 'expired' WHERE session_id = $1 AND status = 'active'`,
      [sessionId]
    );
    row.status = 'expired';
  }

  return row;
}

/**
 * DB 세션 상태 업데이트
 */
async function updateDbSession(sessionId, fields) {
  const sets = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(fields)) {
    sets.push(`${key} = $${idx}`);
    values.push(val);
    idx++;
  }
  values.push(sessionId);

  await db.query(
    `UPDATE wu_sessions SET ${sets.join(', ')} WHERE session_id = $${idx}`,
    values
  );
}

/**
 * WU 이벤트 기록 (wu_events)
 */
async function recordEvent(sessionId, profileId, eventType, wuType, payload = {}) {
  await db.query(
    `INSERT INTO wu_events (session_id, sowon_profile_id, event_type, wu_type, payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, profileId, eventType, wuType, JSON.stringify(payload)]
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI 호출 (가드레일 [3]: 1회만, keywords 포함)
// ═══════════════════════════════════════════════════════════════════════════

let openaiClient = null;

function getOpenAI() {
  if (openaiClient) return openaiClient;
  try {
    const OpenAI = require('openai');
    openaiClient = new OpenAI();
    return openaiClient;
  } catch (e) {
    console.warn('[WU] OpenAI 로드 실패:', e.message);
    return null;
  }
}

/**
 * AI 1회 호출: 응원 + 인사이트 + 다음 WU 힌트 + 키워드 추출
 * @param {string} wuType
 * @param {string} category
 * @param {Object} efScores
 * @param {Array} rawAnswers - 인메모리 원문 (AI에만 전달, DB 저장 안 함)
 * @returns {Object} { encouragement, insight, next_wu_hint, keywords }
 */
async function callAI(wuType, category, efScores, rawAnswers) {
  const openai = getOpenAI();

  // AI 불가 시 룰 기반 폴백
  if (!openai) {
    return generateFallbackResponse(wuType, category, efScores, rawAnswers);
  }

  const answersContext = rawAnswers
    .map(a => `Q${a.idx + 1}(${a.key}): ${a.text}`)
    .join('\n');

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `당신은 소원이 심리 분석 엔진입니다.
아래 WU 응답을 분석하여 JSON으로만 응답하세요.
- encouragement: 따뜻한 응원 문장 (50자 이내)
- insight: 핵심 인사이트 (30자 이내)
- next_wu_hint: 다음 추천 WU 유형 코드 (REL/SELF_ST_TXT/CAREER/HEALTH/MONEY/GROWTH 중 택1)
- keywords: 응답에서 추출한 핵심 키워드 3~5개 (개인 식별 정보 제외)

절대 금지: 사주/점술/운세 용어, 과도한 약속, 실명 언급
톤: 따뜻하지만 전문적, 희망적이지만 현실적`
        },
        {
          role: 'user',
          content: `WU유형: ${wuType}
카테고리: ${category}
EF점수: ${JSON.stringify(efScores)}

응답:
${answersContext}

JSON으로만 응답:`
        }
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // PII 필터: 전화번호, 이메일, 1글자 토큰 제거
      const PII_PATTERNS = [/\d{2,}/, /@/, /^.$/];
      const safeKeywords = (Array.isArray(parsed.keywords) ? parsed.keywords : [])
        .slice(0, 5)
        .filter(kw => typeof kw === 'string' && kw.length >= 2
          && !PII_PATTERNS.some(p => p.test(kw)));

      return {
        encouragement: (parsed.encouragement || '').slice(0, 60),
        insight: (parsed.insight || '').slice(0, 40),
        next_wu_hint: parsed.next_wu_hint || 'SELF_ST_TXT',
        keywords: safeKeywords,
      };
    }
  } catch (e) {
    console.error('[WU] AI 호출 실패:', e.message);
  }

  // 파싱 실패 시 폴백
  return generateFallbackResponse(wuType, category, efScores, rawAnswers);
}

/**
 * AI 불가 시 룰 기반 폴백 응답
 */
function generateFallbackResponse(wuType, category, efScores, rawAnswers) {
  // 간단한 키워드 추출 (빈도 기반)
  const keywords = extractKeywordsRule(rawAnswers.map(a => a.text).join(' '));

  const encouragements = {
    REL: '관계를 돌아보는 용기가 이미 큰 한 걸음이에요.',
    SELF_ST_TXT: '멈추고 돌아본 3분이 당신을 지켜줄 거예요.',
  };

  return {
    encouragement: encouragements[wuType] || '오늘의 작은 발걸음이 내일의 기적이 됩니다.',
    insight: `${category || '자기이해'} 영역에서 성장 가능성이 보여요.`,
    next_wu_hint: wuType === 'REL' ? 'SELF_ST_TXT' : 'REL',
    keywords,
  };
}

/**
 * 룰 기반 키워드 추출 (AI 폴백용)
 */
function extractKeywordsRule(text) {
  const stopWords = new Set([
    '있다', '없다', '것', '수', '이', '그', '저', '나', '너',
    '우리', '하다', '되다', '같다', '좋다', '싶다', '않다',
    '예', '네', '아니', '없음', '모르겠다',
  ]);

  const words = text
    .replace(/[0-9.,!?~\-""''「」]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w));

  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// ═══════════════════════════════════════════════════════════════════════════
// 공개 API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * WU 세션 시작
 */
async function startSession(phoneHash, wuType, nickname, birthYearMonth) {
  // 1. 프로필 upsert
  const profileId = await ensureProfile(phoneHash, nickname, birthYearMonth);

  // 2. DB 세션 생성
  const session = await createDbSession(profileId, wuType);

  // 3. WU_START 이벤트
  await recordEvent(
    session.session_id, profileId, 'WU_START', wuType,
    { wu_type: wuType }
  );

  // 4. 질문 로드
  const content = loadQuestions(wuType);
  if (!content) {
    throw new Error(`질문 콘텐츠 없음: ${wuType}`);
  }

  const firstQ = content.questions[0];

  return {
    sessionId: session.session_id,
    profileId,
    expiresAt: session.expires_at,
    question: {
      idx: firstQ.idx,
      key: firstQ.key,
      text: firstQ.text,
      guide: firstQ.guide,
      category_hint: firstQ.category_hint,
      input_type: firstQ.input_type || null,
      total: content.question_count,
    },
    progress: 0,
    wuTitle: content.title,
  };
}

/**
 * 답변 제출
 */
async function submitAnswer(sessionId, answerText) {
  // 1. DB 세션 조회 + 만료 체크
  const session = await getDbSession(sessionId);

  if (!session) {
    return { error: 'session_not_found', status: 404 };
  }

  if (session.status === 'expired') {
    purgeRawAnswers(sessionId);
    return { error: 'session_expired', status: 410 };
  }

  if (session.status === 'paused') {
    return { error: 'session_paused_safety', status: 409 };
  }

  if (session.status !== 'active') {
    return { error: `invalid_status: ${session.status}`, status: 400 };
  }

  // 2. 답변 길이 검증
  if (answerText && answerText.length > MAX_ANSWER_LENGTH) {
    return { error: 'answer_too_long', status: 400 };
  }

  const text = (answerText || '').trim();

  // 3. 안전 게이트 (가드레일 [4])
  const safety = checkSafety(text);

  if (safety.level === 'RED') {
    // DB 세션 상태 paused로 변경
    await updateDbSession(sessionId, {
      status: SESSION_STATUS.PAUSED,
      risk_level: 'RED',
    });

    // RED 이벤트 기록
    await recordEvent(
      sessionId, session.profile_id, 'RED_DETECTED', session.wu_type,
      {
        question_idx: session.current_question_idx,
        category: safety.category,
        action: 'session_paused',
      }
    );

    // 인메모리 원문 삭제
    purgeRawAnswers(sessionId);

    return {
      paused: true,
      reason: 'safety',
      helpline: '정신건강위기상담전화 1393',
    };
  }

  // 4. 질문 콘텐츠 로드
  const content = loadQuestions(session.wu_type);
  const currentIdx = session.current_question_idx;
  const currentQ = content.questions[currentIdx];

  // 5. 인메모리에 원문 임시 저장 (DB에는 원문 미저장)
  storeRawAnswer(sessionId, currentIdx, currentQ.key, text);

  // 6. DB 이벤트 기록 (메타데이터만, 원문 없음)
  await recordEvent(
    sessionId, session.profile_id, 'ANSWER_SUBMIT', session.wu_type,
    {
      question_idx: currentIdx,
      question_key: currentQ.key,
      answer_length: text.length,
      risk_level: safety.level,
    }
  );

  // 7. DB 세션 진행 업데이트
  const nextIdx = currentIdx + 1;
  const newAnswerCount = session.answer_count + 1;
  const isLast = nextIdx >= content.question_count;

  await updateDbSession(sessionId, {
    current_question_idx: nextIdx,
    answer_count: newAnswerCount,
    risk_level: safety.level === 'YELLOW' ? 'YELLOW' : session.risk_level,
  });

  // 8. 마지막 질문이면 ready_to_complete 시그널
  if (isLast) {
    return {
      readyToComplete: true,
      progress: 1,
      riskLevel: safety.level,
      answerCount: newAnswerCount,
    };
  }

  // 9. 다음 질문 반환
  const nextQ = content.questions[nextIdx];
  return {
    question: {
      idx: nextQ.idx,
      key: nextQ.key,
      text: nextQ.text,
      guide: nextQ.guide,
      category_hint: nextQ.category_hint,
      input_type: nextQ.input_type || null,
      total: content.question_count,
    },
    progress: newAnswerCount / content.question_count,
    riskLevel: safety.level,
    answerCount: newAnswerCount,
  };
}

/**
 * WU 완료 처리 (가드레일 [3]: AI 1회, keywords 포함)
 */
async function completeSession(sessionId) {
  // 1. DB 세션 조회
  const session = await getDbSession(sessionId);

  if (!session) {
    return { error: 'session_not_found', status: 404 };
  }

  if (session.status === 'expired') {
    purgeRawAnswers(sessionId);
    return { error: 'session_expired', status: 410 };
  }

  // 가드레일 [4]: paused 상태에서 complete 차단
  if (session.status === 'paused') {
    return { error: 'session_paused_safety', status: 409 };
  }

  if (session.status !== 'active') {
    return { error: `invalid_status: ${session.status}`, status: 400 };
  }

  // 2. 인메모리 원문 가져오기
  const rawAnswers = getRawAnswers(sessionId);
  if (rawAnswers.length === 0) {
    return { error: 'no_answers', status: 400 };
  }

  // 3. 질문 콘텐츠에서 카테고리 힌트 확보
  const content = loadQuestions(session.wu_type);
  const primaryCategory = content?.questions?.[0]?.category_hint || 'self';

  // 4. EF 계산 (miracleScoreEngine, 룰 기반)
  const combinedText = rawAnswers.map(a => a.text).join(' ');
  let efResult = { final_score: 65, energy_type: 'citrine' };

  if (miracleScoreEngine) {
    efResult = miracleScoreEngine.calculateUnifiedScore({
      content: combinedText,
      name: '', // 익명
      mode: rawAnswers.length >= 5 ? 'quick' : 'wish',
    });
  }

  // EF 점수: 결정론적 계산 (Math.random 금지)
  // WU 유형별 가중치로 5차원 분화
  const EF_WEIGHTS = {
    REL:          { vitality: 0.8, relationship: 1.2, growth: 1.0, resolve: 0.9, stability: 1.1 },
    SELF_ST_TXT:  { vitality: 1.0, relationship: 1.1, growth: 1.2, resolve: 1.0, stability: 0.7 },
  };
  const weights = EF_WEIGHTS[session.wu_type] || { vitality: 1, relationship: 1, growth: 1, resolve: 1, stability: 1 };
  const base = efResult.final_score || 65;

  const efScores = {
    vitality:     Math.min(100, Math.max(0, Math.round(base * weights.vitality))),
    relationship: Math.min(100, Math.max(0, Math.round(base * weights.relationship))),
    growth:       Math.min(100, Math.max(0, Math.round(base * weights.growth))),
    resolve:      Math.min(100, Math.max(0, Math.round(base * weights.resolve))),
    stability:    Math.min(100, Math.max(0, Math.round(base * weights.stability))),
  };

  // 5. AI 1회 호출 (가드레일 [3]: 키워드 포함)
  const aiResponse = await callAI(session.wu_type, primaryCategory, efScores, rawAnswers);

  // 6. 인메모리 원문 즉시 삭제 (가드레일 [3])
  purgeRawAnswers(sessionId);

  // 7. AI 호출 이벤트 기록
  await recordEvent(
    sessionId, session.profile_id, 'AI_CALLED', session.wu_type,
    { model: 'gpt-4o-mini', purpose: 'encouragement+keywords' }
  );

  // 8. share_id 생성 (가드레일 [5]: 생성만, OG는 별도)
  const shareId = crypto.randomBytes(12).toString('hex');

  // 9. DB complete_wu() 호출
  const durationSec = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

  const completeResult = await db.query(
    `SELECT complete_wu($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) AS result_id`,
    [
      sessionId,                                   // p_session_id
      session.profile_id,                          // p_profile_id
      session.wu_type,                             // p_wu_type
      aiResponse.keywords,                         // p_keywords (TEXT[])
      primaryCategory,                             // p_category
      JSON.stringify(efScores),                    // p_ef_scores (JSONB)
      efResult.final_score,                        // p_miracle_score
      efResult.energy_type || 'citrine',           // p_energy_type
      JSON.stringify({                             // p_ai_response (JSONB)
        encouragement: aiResponse.encouragement,
        insight: aiResponse.insight,
        next_wu_hint: aiResponse.next_wu_hint,
      }),
      durationSec,                                 // p_duration_sec
      session.answer_count,                        // p_answer_count
    ]
  );

  // 10. DB 세션 상태 → completed + share_id
  await updateDbSession(sessionId, {
    status: SESSION_STATUS.COMPLETED,
    completed_at: new Date().toISOString(),
    share_id: shareId,
  });

  // 11. WU_COMPLETE 이벤트
  await recordEvent(
    sessionId, session.profile_id, 'WU_COMPLETE', session.wu_type,
    { duration_sec: durationSec, answer_count: session.answer_count }
  );

  return {
    resultId: completeResult.rows[0]?.result_id,
    miracleScore: efResult.final_score,
    efScores,
    energyType: efResult.energy_type || 'citrine',
    energyName: miracleScoreEngine?.ENERGY_TYPES?.[efResult.energy_type]?.name || '시트린',
    aiResponse: {
      encouragement: aiResponse.encouragement,
      insight: aiResponse.insight,
      next_wu_hint: aiResponse.next_wu_hint,
    },
    keywords: aiResponse.keywords,
    shareId,
    durationSec,
  };
}

/**
 * WU 이탈 처리
 */
async function abandonSession(sessionId) {
  const session = await getDbSession(sessionId);
  if (!session) return { error: 'session_not_found', status: 404 };

  if (session.status !== 'active' && session.status !== 'paused') {
    return { error: `invalid_status: ${session.status}`, status: 400 };
  }

  const rawAnswers = getRawAnswers(sessionId);
  const durationSec = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

  // DB 세션 → abandoned
  await updateDbSession(sessionId, { status: SESSION_STATUS.ABANDONED });

  // 이벤트 기록
  await recordEvent(
    sessionId, session.profile_id, 'WU_ABANDON', session.wu_type,
    {
      last_question_idx: session.current_question_idx,
      duration_sec: durationSec,
      answer_count: rawAnswers.length,
    }
  );

  // 인메모리 원문 즉시 삭제
  purgeRawAnswers(sessionId);

  return { abandoned: true };
}

/**
 * 세션 상태 조회 (DB SSOT)
 */
async function getSession(sessionId) {
  return await getDbSession(sessionId);
}

/**
 * 프로필 대시보드 조회
 */
async function getProfile(profileId) {
  const result = await db.query(
    `SELECT * FROM v_sowon_dashboard WHERE profile_id = $1`,
    [profileId]
  );
  return result.rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  startSession,
  submitAnswer,
  completeSession,
  abandonSession,
  getSession,
  getProfile,
  checkSafety,
  loadQuestions,
  SESSION_STATUS,
  MAX_ANSWER_LENGTH,
};
