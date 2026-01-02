/**
 * debateRoutes.js v3.2
 *
 * Aurora 5 내부 원탁토론 자동화 API
 *
 * v3.2 추가:
 * - Mode Branching (DECISION | EXPLORE)
 * - EXPLORE 전용 synth-lite 파이프라인
 * - EXPLORE 출력 포맷 (Insights 중심)
 *
 * v3.1 추가:
 * - Human Review Queue (RED → HOLD + 검토큐)
 * - Action 상태변경 이벤트
 * - 스케줄러 (리마인드/에스컬레이션)
 * - Idempotency (중복 생성 방지)
 * - 원자적 DB Write
 * - category/tags 자동 부여
 *
 * 파이프라인 순서:
 * [DECISION Mode - 기본]
 * Step 0: SafetyGate 선실행 (RED → HOLD + 검토큐)
 * Step 1: creative/data/cro 병렬 실행
 * Step 2: synth (코미) 종합 → DEC + Actions 생성
 * Step 3: 저장 (files + DB) + 알림
 *
 * [EXPLORE Mode]
 * Step 0: SafetyGate 선실행
 * Step 1: creative/data/cro 병렬 실행
 * Step 2: synth-lite → Insights 요약 (DEC/Actions 없음)
 * Step 3: 저장 (EXP 로그만)
 *
 * Role 표준:
 * - creative → 재미
 * - data → 루미
 * - cro → 여의보주
 * - gate → SafetyGate
 * - synth → 코미
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const EventEmitter = require("events");

// ===== 이벤트 버스 (알림/연동용) =====
const debateEvents = new EventEmitter();

// ===== 이벤트 핸들러 (알림/에스컬레이션) =====

// RED 신호 발생 시 즉시 알림
debateEvents.on('SAFETY_RED', async (data) => {
  console.log(`🚨 [알림] SAFETY RED 발생!`);
  console.log(`   토론 ID: ${data.debate_id}`);
  console.log(`   사유: ${data.reason}`);
  console.log(`   → 푸르미르님/코미에게 알림 발송 필요`);

  // TODO: 실제 알림 발송 (Solapi 연동)
  // await sendNotification({
  //   type: 'SAFETY_RED',
  //   recipient: 'ceo',
  //   message: `[긴급] 토론 ${data.debate_id} RED 판정 - ${data.reason}`
  // });
});

// 새 Action 생성 시 로깅
debateEvents.on('ACTION_CREATED', (data) => {
  console.log(`📋 [Action] 신규 생성: ${data.id}`);
  console.log(`   업무: ${data.task}`);
  console.log(`   담당: ${data.assignee} (${data.assignee_role})`);
  console.log(`   기한: ${data.deadline}`);
  console.log(`   우선순위: ${data.priority}`);
});

// 토론 완료 시 요약 알림
debateEvents.on('DEBATE_COMPLETED', (data) => {
  console.log(`✅ [토론 완료] ${data.debate_id}`);
  console.log(`   결정: ${data.final_decision}`);
  console.log(`   Action Items: ${data.action_count}개`);
  console.log(`   저장 위치: ${data.dec_file}`);
});

// P0 Action 생성 시 긴급 알림
debateEvents.on('P0_ACTION_CREATED', (data) => {
  console.log(`🔴 [긴급] P0 Action 생성됨!`);
  console.log(`   ID: ${data.id}`);
  console.log(`   업무: ${data.task}`);
  console.log(`   담당: ${data.assignee}`);
  console.log(`   기한: ${data.deadline}`);
});

// v3.1: Action 상태 변경 이벤트
debateEvents.on('ACTION_STATUS_CHANGED', (data) => {
  console.log(`📝 [Action 상태변경] ${data.id}: ${data.old_status} → ${data.new_status}`);
  if (data.blocked_reason) {
    console.log(`   차단 사유: ${data.blocked_reason}`);
  }
});

// v3.1: Action 완료 이벤트
debateEvents.on('ACTION_COMPLETED', (data) => {
  console.log(`✅ [Action 완료] ${data.id}`);
  console.log(`   업무: ${data.task}`);
  console.log(`   담당: ${data.assignee}`);
  console.log(`   완료일: ${data.completed_at}`);
});

// v3.1: Action 마감 임박 리마인드
debateEvents.on('ACTION_AT_RISK', (data) => {
  console.log(`⚠️ [마감 임박] ${data.id}`);
  console.log(`   업무: ${data.task}`);
  console.log(`   담당: ${data.assignee}`);
  console.log(`   기한: ${data.deadline}`);
  console.log(`   남은 시간: ${data.hours_remaining}시간`);
});

// v3.1: P0 Action 기한 초과 에스컬레이션
debateEvents.on('ACTION_OVERDUE', (data) => {
  console.log(`🚨 [기한 초과] P0 Action 에스컬레이션!`);
  console.log(`   ID: ${data.id}`);
  console.log(`   업무: ${data.task}`);
  console.log(`   담당: ${data.assignee}`);
  console.log(`   기한: ${data.deadline}`);
  console.log(`   → 코미에게 에스컬레이션`);
});

// v3.1: Human Review 큐 생성
debateEvents.on('REVIEW_TICKET_CREATED', (data) => {
  console.log(`📋 [검토 요청] 티켓 생성됨`);
  console.log(`   티켓 ID: ${data.ticket_id}`);
  console.log(`   토론 ID: ${data.debate_id}`);
  console.log(`   사유: ${data.reason}`);
  console.log(`   링크: /api/debate/review/${data.ticket_id}`);
});

// v3.2: EXPLORE 완료 이벤트
debateEvents.on('EXPLORE_COMPLETED', (data) => {
  console.log(`🔍 [EXPLORE 완료] ${data.exp_id}`);
  console.log(`   토론 ID: ${data.debate_id}`);
  console.log(`   주제: ${data.topic}`);
  console.log(`   관점 수: ${data.perspectives_count}개`);
  console.log(`   저장 위치: ${data.exp_file}`);
});

// ===== v3.2: Mode 상수 =====
const DEBATE_MODE = {
  DECISION: 'DECISION',  // 의사결정 필요 → DEC + Actions 생성
  EXPLORE: 'EXPLORE'     // 탐색/조사용 → Insights만 생성 (DEC/Actions 금지)
};

// ===== 설정 =====
const CONFIG = {
  outputDir: path.join(__dirname, "..", "docs", "debates"),
  decDir: path.join(__dirname, "..", "docs", "decisions"),
  actionsDir: path.join(__dirname, "..", "docs", "actions"),
  exploreDir: path.join(__dirname, "..", "docs", "explores"),  // v3.2: EXPLORE 모드 저장
  dbDir: path.join(__dirname, "..", "data", "debates"),  // 로컬 DB
  timeouts: {
    gate: 10000,     // SafetyGate 10초
    creative: 30000,
    data: 30000,
    cro: 30000,
    synth: 60000,
    synthLite: 30000,  // v3.2: synth-lite는 더 빠름
    total: 120000
  }
};

// 출력 디렉토리 생성
[CONFIG.outputDir, CONFIG.decDir, CONFIG.actionsDir, CONFIG.exploreDir, CONFIG.dbDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ===== Role 표준 정의 =====
const ROLES = {
  creative: { id: 'creative', persona: '재미', description: '창의적 아이디어' },
  data: { id: 'data', persona: '루미', description: '데이터 분석' },
  cro: { id: 'cro', persona: '여의보주', description: '고객/품질 관점' },
  gate: { id: 'gate', persona: 'SafetyGate', description: '안전 게이트' },
  synth: { id: 'synth', persona: '코미', description: '종합 및 결정' }
};

// ===== 유틸리티 함수 =====

function generateDebateId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `DEB-${year}-${month}${day}-${seq}`;
}

function generateDecId(debateId) {
  return debateId.replace('DEB-', 'DEC-');
}

// v3.2: EXPLORE ID 생성
function generateExpId(debateId) {
  return debateId.replace('DEB-', 'EXP-');
}

function generateActionId(index) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  return `ACT-${dateStr}-${String(index).padStart(3, '0')}`;
}

// v3.1: Review 티켓 ID 생성
function generateReviewTicketId() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `REV-${dateStr}-${seq}`;
}

// v3.1: Idempotency를 위한 request_id 생성 (해시)
function generateRequestId(topic, context, urgency) {
  const input = `${topic}|${context || ''}|${urgency || 'medium'}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// v3.1: Category 자동 분류
function classifyCategory(topic, context) {
  const text = `${topic} ${context || ''}`.toLowerCase();

  const categories = {
    '마케팅': ['마케팅', 'marketing', '홍보', '광고', '블로그', 'sns', '인스타', '캠페인', '프로모션'],
    '개발': ['개발', 'dev', 'api', '버그', 'bug', '코드', 'code', '서버', '배포', 'deploy'],
    '운영': ['운영', 'ops', '고객', 'customer', '응대', '문의', '클레임', '환불', '배송'],
    '브랜딩': ['브랜드', 'brand', '로고', 'logo', '디자인', 'design', '컨셉', '아이덴티티'],
    '전략': ['전략', 'strategy', '비전', '목표', '계획', 'plan', '분석', 'analysis']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => text.includes(kw))) {
      return category;
    }
  }
  return '일반';
}

// v3.1: Tags 자동 추출
function extractTags(topic, context) {
  const text = `${topic} ${context || ''}`.toLowerCase();
  const tags = [];

  const tagKeywords = {
    '긴급': ['긴급', 'urgent', '즉시', 'asap'],
    '신규': ['신규', 'new', '새로운', '추가'],
    '개선': ['개선', 'improve', '향상', '업그레이드'],
    '버그': ['버그', 'bug', '오류', 'error', '수정'],
    '고객': ['고객', 'customer', '소원이', '사용자'],
    '자동화': ['자동화', 'auto', '자동', 'automation'],
    '분석': ['분석', 'analysis', '데이터', 'data'],
    '테스트': ['테스트', 'test', '검증', 'verify']
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags.length > 0 ? tags : ['일반'];
}

// ===== 로컬 DB 함수 (Airtable 대체용) =====

// v3.1: 원자적 write (임시파일 → rename)
function atomicWriteJSON(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {
    // 실패 시 임시 파일 정리
    try { fs.unlinkSync(tempPath); } catch (ignore) {}
    throw e;
  }
}

function saveToLocalDB(table, record) {
  const tablePath = path.join(CONFIG.dbDir, `${table}.json`);
  let data = [];

  if (fs.existsSync(tablePath)) {
    try {
      data = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    } catch (e) {
      data = [];
    }
  }

  record.created_at = new Date().toISOString();
  record.updated_at = record.created_at;
  data.push(record);

  // v3.1: 원자적 write 사용
  atomicWriteJSON(tablePath, data);
  return record;
}

// v3.1: request_id로 기존 debate 찾기 (Idempotency)
function findDebateByRequestId(requestId) {
  const tablePath = path.join(CONFIG.dbDir, 'debates.json');
  if (!fs.existsSync(tablePath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    return data.find(d => d.request_id === requestId) || null;
  } catch (e) {
    return null;
  }
}

// v3.1: 레코드 업데이트
function updateInLocalDB(table, id, updates) {
  const tablePath = path.join(CONFIG.dbDir, `${table}.json`);
  if (!fs.existsSync(tablePath)) return null;

  try {
    let data = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    const index = data.findIndex(r => r.id === id || r.debate_id === id || r.ticket_id === id);
    if (index === -1) return null;

    const oldRecord = { ...data[index] };
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };

    atomicWriteJSON(tablePath, data);
    return { old: oldRecord, new: data[index] };
  } catch (e) {
    return null;
  }
}

function getFromLocalDB(table, filter = {}) {
  const tablePath = path.join(CONFIG.dbDir, `${table}.json`);

  if (!fs.existsSync(tablePath)) {
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));

    if (Object.keys(filter).length === 0) {
      return data;
    }

    return data.filter(record => {
      return Object.keys(filter).every(key => record[key] === filter[key]);
    });
  } catch (e) {
    return [];
  }
}

// ===== SafetyGate 에이전트 =====

async function runSafetyGate(topic, context) {
  console.log(`🛡️ Step 0: SafetyGate 실행...`);

  // RED 키워드 (즉시 중단)
  const redKeywords = [
    // 한국어
    '자살', '죽고싶', '죽고 싶', '자해', '목숨', '끝내고 싶',
    '사라지고 싶', '없어지고 싶', '포기하고 싶', '살기 싫',
    '불법', '사기', '해킹', '도박', '범죄', '폭행',
    // 영어
    'illegal', 'gambling', 'suicide', 'kill', 'hack', 'fraud', 'scam',
    'crime', 'murder', 'weapon', 'drug', 'narcotic'
  ];

  // YELLOW 키워드 (주의 필요)
  const yellowKeywords = [
    '빚', '대출', '파산', '신용불량',
    '암', '수술', '병원', '치료',
    '소송', '고소', '합의금',
    '이혼', '별거', '폭력', '학대'
  ];

  const fullText = `${topic} ${context || ''}`.toLowerCase();

  // RED 체크
  for (const keyword of redKeywords) {
    if (fullText.includes(keyword)) {
      return {
        role: 'gate',
        timestamp: new Date().toISOString(),
        safety_label: 'RED',
        safety_score: 0,
        reason: `위험 키워드 감지: "${keyword}"`,
        action: 'STOP',
        requires_human: true,
        confidence: 0.95
      };
    }
  }

  // YELLOW 체크
  for (const keyword of yellowKeywords) {
    if (fullText.includes(keyword)) {
      return {
        role: 'gate',
        timestamp: new Date().toISOString(),
        safety_label: 'YELLOW',
        safety_score: 50,
        reason: `주의 키워드 감지: "${keyword}"`,
        action: 'PROCEED_WITH_CAUTION',
        requires_human: false,
        confidence: 0.85
      };
    }
  }

  // GREEN
  return {
    role: 'gate',
    timestamp: new Date().toISOString(),
    safety_label: 'GREEN',
    safety_score: 100,
    reason: '안전 검토 통과',
    action: 'PROCEED',
    requires_human: false,
    confidence: 0.90
  };
}

// ===== 역할별 에이전트 (모의 응답) =====

async function runCreativeAgent(topic, context) {
  // TODO: 실제 Claude API 연동
  return {
    role: 'creative',
    persona: '재미',
    timestamp: new Date().toISOString(),
    ideas: [
      {
        id: 1,
        title: '창의적 접근 제안',
        description: '새로운 관점에서 문제를 바라보는 접근법',
        rationale: '기존 방식의 한계를 넘어서는 혁신 필요',
        feasibility: 'medium',
        impact: 'high'
      }
    ],
    recommendations: [
      { priority: 1, action: '파일럿 테스트 진행', expected_outcome: '리스크 최소화' }
    ],
    risks: [],
    confidence: 0.75
  };
}

async function runDataAgent(topic, context) {
  // TODO: 실제 Claude API 연동
  return {
    role: 'data',
    persona: '루미',
    timestamp: new Date().toISOString(),
    data_summary: {
      period: '최근 30일',
      scope: '관련 지표',
      key_metrics: {
        conversion_rate: { value: 3.2, unit: '%', trend: 'stable' },
        user_satisfaction: { value: 4.2, unit: '/5', trend: 'up' }
      }
    },
    insights: [
      { finding: '데이터 기반 분석이 필요함', significance: 'high' }
    ],
    recommendations: ['추가 데이터 수집 권장'],
    confidence: 0.80
  };
}

async function runCROAgent(topic, context) {
  // TODO: 실제 Claude API 연동
  return {
    role: 'cro',
    persona: '여의보주',
    timestamp: new Date().toISOString(),
    customer_perspective: {
      positive_impacts: [
        { aspect: '서비스 개선', description: '소원이 경험 향상 예상', affected_segments: ['전체'] }
      ],
      concerns: []
    },
    recommendations: [
      { priority: 1, action: '소원이 피드백 수집', customer_benefit: '니즈 파악' }
    ],
    communication_plan: {
      timing: '결정 후 즉시',
      channels: ['카카오톡'],
      key_messages: ['서비스 개선 안내']
    },
    confidence: 0.80
  };
}

// ===== Synthesizer (코미) =====

function runSynthesizer(debateId, decId, topic, context, safetyResult, parallelResults) {
  const { creative, data, cro } = parallelResults;

  // Action Items 생성 (담당자/기한 필수)
  const actionItems = [
    {
      id: generateActionId(1),
      task: '추가 데이터 수집 및 분석',
      assignee: data?.persona || '루미',
      assignee_role: 'data',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'P0',
      status: 'TODO',
      dependencies: [],
      success_criteria: '분석 리포트 완성',
      dec_id: decId,
      debate_id: debateId
    },
    {
      id: generateActionId(2),
      task: '소원이 의견 수렴',
      assignee: cro?.persona || '여의보주',
      assignee_role: 'cro',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'P1',
      status: 'TODO',
      dependencies: [],
      success_criteria: '피드백 10건 이상 수집',
      dec_id: decId,
      debate_id: debateId
    }
  ];

  // TBD 검증: 담당자/기한 없으면 TBD
  actionItems.forEach(item => {
    if (!item.assignee) item.assignee = 'TBD';
    if (!item.deadline) item.deadline = '미정';
  });

  return {
    role: 'synth',
    persona: '코미',
    timestamp: new Date().toISOString(),
    debate_id: debateId,
    topic: topic,
    safety_label: safetyResult.safety_label,
    synthesis: {
      consensus_points: [
        {
          point: '신중한 접근과 추가 검토 필요',
          supporting_roles: ['creative', 'data', 'cro'],
          confidence: 0.80
        }
      ],
      divergent_points: [],
      key_insights: [
        '데이터 기반 접근이 필요함',
        '소원이 관점이 최우선 고려사항',
        '안전성 확보 후 진행 권장'
      ]
    },
    decision: {
      id: decId,
      title: topic,
      summary: `${topic}에 대한 토론 결과, 조건부 진행이 권장됩니다.`,
      rationale: '팀 전원이 추가 검토 필요성에 동의하였으며, 안전성을 확보한 후 단계적으로 진행하는 것이 바람직합니다.',
      final_decision: safetyResult.safety_label === 'GREEN' ? 'Conditional Go' : 'No-Go',
      status: 'pending_approval',
      impact: 'medium',
      affected_areas: ['서비스', '운영']
    },
    action_items: actionItems,
    risks_acknowledged: [
      {
        risk: '충분한 검토 없이 진행 시 문제 발생 가능',
        mitigation: '단계적 진행 및 모니터링',
        owner: '코미'
      }
    ],
    next_steps: [
      '푸르미르님 승인 대기',
      '승인 후 ACT-001부터 순차 진행',
      '1주일 후 진행 상황 리뷰'
    ],
    approval_required: true,
    approvers: ['푸르미르'],
    confidence: 0.78
  };
}

// ===== v3.2: Hard Guardrail - EXPLORE 모드 DEC/Actions 생성 차단 =====

class ExploreGuardrailError extends Error {
  constructor(message, attemptedAction) {
    super(message);
    this.name = 'ExploreGuardrailError';
    this.attemptedAction = attemptedAction;
    this.statusCode = 403;
  }
}

function guardExploreMode(mode, action) {
  if (mode === DEBATE_MODE.EXPLORE) {
    const blockedActions = ['CREATE_DECISION', 'CREATE_ACTIONS', 'SAVE_DEC_FILE', 'SAVE_ACTIONS_FILE'];
    if (blockedActions.includes(action)) {
      const error = new ExploreGuardrailError(
        `[GUARDRAIL] EXPLORE 모드에서 ${action} 시도 차단됨`,
        action
      );
      console.error(`🚫 [Hard Guardrail] EXPLORE 모드 위반!`);
      console.error(`   시도된 액션: ${action}`);
      console.error(`   → DEC/Actions 생성은 DECISION 모드에서만 허용`);
      throw error;
    }
  }
  return true;
}

// ===== v3.2: Synthesizer Lite (EXPLORE 모드 전용) =====

function runSynthesizerLite(debateId, expId, topic, context, safetyResult, parallelResults) {
  const { creative, data, cro } = parallelResults;

  // 각 역할의 핵심 인사이트 수집
  const perspectives = [];

  // 재미(creative) 관점
  if (creative?.ideas?.length > 0) {
    perspectives.push({
      source: '재미',
      viewpoint: creative.ideas[0].title || '창의적 접근',
      insight: creative.ideas[0].description || creative.ideas[0].rationale || '새로운 관점 제시'
    });
  }

  // 루미(data) 관점
  if (data?.insights?.length > 0) {
    perspectives.push({
      source: '루미',
      viewpoint: '데이터 분석',
      insight: data.insights[0].finding || '데이터 기반 분석 필요'
    });
  }
  if (data?.recommendations?.length > 0) {
    perspectives.push({
      source: '루미',
      viewpoint: '추가 분석 권장',
      insight: data.recommendations[0]
    });
  }

  // 여의보주(cro) 관점
  if (cro?.customer_perspective?.positive_impacts?.length > 0) {
    perspectives.push({
      source: '여의보주',
      viewpoint: '소원이 영향',
      insight: cro.customer_perspective.positive_impacts[0].description
    });
  }
  if (cro?.recommendations?.length > 0) {
    perspectives.push({
      source: '여의보주',
      viewpoint: '고객 관점',
      insight: cro.recommendations[0].action
    });
  }

  // 최소 3개 관점 보장
  while (perspectives.length < 3) {
    perspectives.push({
      source: '코미',
      viewpoint: `보완 관점 ${perspectives.length + 1}`,
      insight: '추가 검토 필요'
    });
  }

  // 3줄 요약 생성
  const threeLinerSummary = [
    `주제: ${topic}`,
    `상태: ${safetyResult.safety_label} - ${perspectives.length}개 관점 수집됨`,
    `결론: 추가 탐색 및 검토 권장`
  ];

  // 다음에 확인할 질문들
  const followUpQuestions = [
    `"${topic}"의 구체적인 목표와 성공 지표는?`,
    '예상되는 리소스(비용/시간/인력)는 얼마나 되는가?',
    '우선순위가 높은 이유는? 다른 안건과의 비교는?',
    '실패 시 대안(Plan B)은 무엇인가?'
  ];

  // 결정이 필요해질 조건
  const decisionTriggers = [
    { condition: '예산 확보 완료', threshold: '투자 승인 필요 시 DECISION 전환' },
    { condition: '일정 확정', threshold: '마감일이 결정되면 Action 필요' },
    { condition: 'RED 해소', threshold: '안전 이슈 해결 후 진행 가능' },
    { condition: '소원이 피드백', threshold: '고객 반응 확인 후 방향 결정' }
  ];

  return {
    role: 'synth-lite',
    persona: '코미',
    timestamp: new Date().toISOString(),
    debate_id: debateId,
    exp_id: expId,
    mode: DEBATE_MODE.EXPLORE,
    topic: topic,
    context: context,
    safety_label: safetyResult.safety_label,

    // EXPLORE 전용 출력
    three_liner: threeLinerSummary,
    perspectives: perspectives.slice(0, 5),  // 최대 5개
    follow_up_questions: followUpQuestions,
    decision_triggers: decisionTriggers,

    // 메타 정보
    next_action: '추가 정보 수집 후 DECISION 모드로 전환 검토',
    can_convert_to_decision: true,
    related_debates: [],

    confidence: 0.70
  };
}

// ===== 마크다운 포맷터 =====

function formatDecMarkdown(output) {
  const { decision, synthesis, action_items, risks_acknowledged, next_steps, safety_label } = output;
  const impactEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
  const safetyEmoji = { GREEN: '🟢', YELLOW: '🟡', RED: '🔴' };
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  return `# ${decision.id}: ${decision.title}

> **상태:** ${decision.status} | **영향도:** ${impactEmoji[decision.impact] || '⚪'} ${decision.impact}
> **안전 판정:** ${safetyEmoji[safety_label] || '⚪'} ${safety_label}
> **최종 결정:** ${decision.final_decision}
> **생성일:** ${dateStr}
> **토론 ID:** ${output.debate_id}

---

## 요약

${decision.summary}

---

## 결정 사항

${decision.rationale}

---

## 핵심 인사이트

${synthesis.key_insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

---

## Action Items

| # | ID | 업무 | 담당 | 기한 | 우선순위 | 상태 |
|---|-----|------|------|------|----------|------|
${action_items.map((item, i) =>
  `| ${i + 1} | ${item.id} | ${item.task} | ${item.assignee} | ${item.deadline} | ${item.priority} | ${item.status} |`
).join('\n')}

---

## 리스크 및 대응

| 리스크 | 대응 방안 | 담당 |
|--------|----------|------|
${risks_acknowledged.map(risk =>
  `| ${risk.risk} | ${risk.mitigation} | ${risk.owner} |`
).join('\n')}

---

## 다음 단계

${next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

## 승인

${output.approvers.map(approver => `- [ ] ${approver}`).join('\n')}
- [x] 코미 (COO) - 초안 작성

---

*🤖 Generated by Aurora 5 Debate Process v3*
`;
}

function formatActionsMarkdown(decId, topic, items) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  return `# Action Items

> **관련 결정:** ${decId}
> **주제:** ${topic}
> **생성일:** ${dateStr}
> **총 항목:** ${items.length}개

---

## 전체 목록

| # | ID | 업무 | 담당 | 기한 | 우선순위 | 상태 |
|---|-----|------|------|------|----------|------|
${items.map((item, i) =>
  `| ${i + 1} | ${item.id} | ${item.task} | ${item.assignee} | ${item.deadline} | ${item.priority} | ${item.status} |`
).join('\n')}

---

## 상세 정보

${items.map(item => `### ${item.id}: ${item.task}

- **담당:** ${item.assignee} (${item.assignee_role || 'TBD'})
- **기한:** ${item.deadline}
- **우선순위:** ${item.priority}
- **상태:** ${item.status}
- **완료 기준:** ${item.success_criteria}
- **연결:** ${item.dec_id} / ${item.debate_id}
`).join('\n')}

---

*🤖 Generated by Aurora 5 Debate Process v3*
`;
}

// ===== v3.2: EXPLORE 마크다운 포맷터 =====

function formatExploreMarkdown(output) {
  const safetyEmoji = { GREEN: '🟢', YELLOW: '🟡', RED: '🔴' };
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  return `# ${output.exp_id}: ${output.topic}

> **모드:** 🔍 EXPLORE (탐색)
> **안전 판정:** ${safetyEmoji[output.safety_label] || '⚪'} ${output.safety_label}
> **생성일:** ${dateStr}
> **토론 ID:** ${output.debate_id}

---

## 📋 3줄 요약

${output.three_liner.map((line, i) => `${i + 1}. ${line}`).join('\n')}

---

## 💡 관점 (${output.perspectives.length}개)

${output.perspectives.map((p, i) => `### ${i + 1}. ${p.source}: ${p.viewpoint}

> ${p.insight}
`).join('\n')}

---

## ❓ 다음에 확인할 질문

${output.follow_up_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---

## 🚦 결정이 필요해질 조건

| 조건 | DECISION 전환 시점 |
|------|-------------------|
${output.decision_triggers.map(t => `| ${t.condition} | ${t.threshold} |`).join('\n')}

---

## 🔄 다음 액션

> ${output.next_action}

**DECISION 모드 전환 가능:** ${output.can_convert_to_decision ? '✅ 예' : '❌ 아니오'}

---

*🤖 Generated by Aurora 5 EXPLORE Mode v3.2*
*신뢰도: ${Math.round(output.confidence * 100)}%*
`;
}

// ===== 이벤트 핸들러 (알림/저장) =====

debateEvents.on('DEBATE_COMPLETED', (data) => {
  console.log(`📢 [Event] DEBATE_COMPLETED: ${data.debate_id}`);
});

debateEvents.on('ACTIONS_CREATED', (data) => {
  console.log(`📢 [Event] ACTIONS_CREATED: ${data.actions.length}개`);
  // TODO: 담당자별 알림 발송
  data.actions.forEach(action => {
    console.log(`   → ${action.assignee}에게 알림: ${action.task} (기한: ${action.deadline})`);
  });
});

debateEvents.on('SAFETY_RED', (data) => {
  console.log(`🚨 [Event] SAFETY_RED: ${data.debate_id} - 인간 검토 필요`);
  // TODO: 코미/CEO에게 긴급 알림
});

// ===== API 엔드포인트 =====

/**
 * POST /api/debate/run
 * 토론 실행 (v3 파이프라인)
 */
router.post("/run", async (req, res) => {
  const startTime = Date.now();
  const performance = {};

  try {
    const {
      topic,
      context,
      urgency = 'medium',
      mode = DEBATE_MODE.DECISION,  // v3.2: 기본값 DECISION
      decision_required = true,     // v3.2: DECISION 필요 여부
      data_requirements = [],
      approval_required = true
    } = req.body;

    // 입력 검증
    if (!topic || typeof topic !== 'string' || topic.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'invalid_topic',
        message: 'topic은 최소 5자 이상의 문자열이어야 합니다.'
      });
    }

    // v3.2: Mode 검증
    const validMode = Object.values(DEBATE_MODE).includes(mode) ? mode : DEBATE_MODE.DECISION;
    const isExploreMode = validMode === DEBATE_MODE.EXPLORE;

    // v3.1: Idempotency 체크 (중복 생성 방지)
    const requestId = generateRequestId(topic, context, urgency);
    const existingDebate = findDebateByRequestId(requestId);

    if (existingDebate) {
      console.log(`♻️ 중복 요청 감지: ${requestId} → 기존 debate 반환`);
      return res.json({
        success: true,
        duplicate: true,
        debate_id: existingDebate.debate_id,
        dec_id: existingDebate.dec_id || generateDecId(existingDebate.debate_id),
        message: '동일한 토론이 이미 존재합니다.',
        existing_status: existingDebate.status,
        request_id: requestId
      });
    }

    // v3.1: Category/Tags 자동 분류
    const category = classifyCategory(topic, context);
    const tags = extractTags(topic, context);

    const debateId = generateDebateId();
    const decId = generateDecId(debateId);
    const expId = generateExpId(debateId);  // v3.2: EXPLORE용 ID

    const modeEmoji = isExploreMode ? '🔍' : '⚖️';
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 토론 시작: ${debateId}`);
    console.log(`${modeEmoji} 모드: ${validMode}${isExploreMode ? ' (DEC/Actions 생성 안함)' : ''}`);
    console.log(`📋 주제: ${topic}`);
    console.log(`🏷️ 분류: ${category} | 태그: ${tags.join(', ')}`);
    console.log(`🔑 Request ID: ${requestId}`);
    console.log(`${'='.repeat(60)}\n`);

    // ===== Step 0: SafetyGate 선실행 =====
    const gateStart = Date.now();
    const safetyResult = await runSafetyGate(topic, context);
    performance.gate = { status: 'success', duration_ms: Date.now() - gateStart };

    console.log(`🛡️ SafetyGate 결과: ${safetyResult.safety_label}`);

    // RED면 즉시 중단 + Review Queue 생성
    if (safetyResult.safety_label === 'RED') {
      console.log(`🚨 RED 판정 - 파이프라인 중단`);

      // v3.1: Review 티켓 생성
      const ticketId = generateReviewTicketId();
      const reviewTicket = {
        ticket_id: ticketId,
        debate_id: debateId,
        topic,
        context,
        reason: safetyResult.reason,
        status: 'PENDING',
        assigned_to: ['코미', '여의보주'],
        priority: 'HIGH',
        review_link: `/api/debate/review/${ticketId}`
      };
      saveToLocalDB('review_queue', reviewTicket);

      // 이벤트 발행
      debateEvents.emit('SAFETY_RED', { debate_id: debateId, reason: safetyResult.reason });
      debateEvents.emit('REVIEW_TICKET_CREATED', reviewTicket);

      // DB 저장 (HOLD 상태)
      saveToLocalDB('debates', {
        debate_id: debateId,
        request_id: requestId,
        topic,
        context,
        category,
        tags,
        mode: validMode,  // v3.2: 모드
        decision_required: !isExploreMode,  // v3.2
        status: 'HOLD',  // v3.1: HOLD 상태
        human_review_required: true,  // v3.1: 인간 검토 필요
        review_ticket_id: ticketId,
        safety_label: 'RED',
        safety_reason: safetyResult.reason,
        participants: ['gate'],
        missing_roles: ['creative', 'data', 'cro', 'synth']
      });

      return res.status(403).json({
        success: false,
        debate_id: debateId,
        review_ticket_id: ticketId,  // v3.1: 검토 티켓 ID
        error: 'safety_red',
        message: 'SafetyGate RED 판정 - 토론 중단',
        safety_result: safetyResult,
        action_required: '인간 검토가 필요합니다. 코미에게 문의하세요.',
        execution_time_ms: Date.now() - startTime
      });
    }

    // ===== Step 1: 병렬 실행 (creative/data/cro) =====
    console.log(`⚡ Step 1: 병렬 토론 시작 (creative/data/cro)...`);
    const parallelStart = Date.now();

    const [creativeResult, dataResult, croResult] = await Promise.allSettled([
      runCreativeAgent(topic, context),
      runDataAgent(topic, context),
      runCROAgent(topic, context)
    ]);

    const parallelOutputs = {
      creative: creativeResult.status === 'fulfilled' ? creativeResult.value : null,
      data: dataResult.status === 'fulfilled' ? dataResult.value : null,
      cro: croResult.status === 'fulfilled' ? croResult.value : null
    };

    performance.creative = {
      status: creativeResult.status === 'fulfilled' ? 'success' : 'failed',
      duration_ms: Date.now() - parallelStart
    };
    performance.data = {
      status: dataResult.status === 'fulfilled' ? 'success' : 'failed',
      duration_ms: Date.now() - parallelStart
    };
    performance.cro = {
      status: croResult.status === 'fulfilled' ? 'success' : 'failed',
      duration_ms: Date.now() - parallelStart
    };

    // 실패한 역할 확인
    const missingRoles = [];
    if (!parallelOutputs.creative) missingRoles.push('creative');
    if (!parallelOutputs.data) missingRoles.push('data');
    if (!parallelOutputs.cro) missingRoles.push('cro');

    console.log(`✅ Step 1 완료 (실패: ${missingRoles.length > 0 ? missingRoles.join(', ') : '없음'})`);

    // ===== v3.2: Mode 분기 =====
    const BOM = '\ufeff';

    if (isExploreMode) {
      // ========== EXPLORE 모드 파이프라인 ==========

      // Step 2: synth-lite (Insights 요약만)
      console.log(`🔍 Step 2: synth-lite 시작 (EXPLORE 모드)...`);
      const synthStart = Date.now();

      const exploreOutput = runSynthesizerLite(
        debateId, expId, topic, context, safetyResult, parallelOutputs
      );

      performance.synthLite = { status: 'success', duration_ms: Date.now() - synthStart };
      console.log(`✅ Step 2 완료 (synth-lite)`);

      // Step 3: EXPLORE 저장 (DEC/Actions 생성 안함)
      console.log(`🔍 Step 3: EXPLORE 저장 (DEC/Actions 없음)...`);

      // 3-1: EXP 마크다운 저장
      const expMarkdown = formatExploreMarkdown(exploreOutput);
      const expFilePath = path.join(CONFIG.exploreDir, `${expId}.md`);
      fs.writeFileSync(expFilePath, BOM + expMarkdown, 'utf-8');

      // 3-2: DB 저장 (Debates - EXPLORE 전용)
      const debateRecord = {
        debate_id: debateId,
        request_id: requestId,
        topic,
        context,
        urgency,
        category,
        tags,
        mode: DEBATE_MODE.EXPLORE,  // v3.2
        decision_required: false,    // v3.2: EXPLORE는 결정 불필요
        status: 'DONE',
        safety_label: safetyResult.safety_label,
        participants: ['gate', 'creative', 'data', 'cro', 'synth-lite'],
        missing_roles: missingRoles,
        role_outputs: JSON.stringify({
          gate: safetyResult,
          creative: parallelOutputs.creative,
          data: parallelOutputs.data,
          cro: parallelOutputs.cro
        }),
        explore_id: expId,  // v3.2: DEC 대신 EXP
        // decision_id 없음 (EXPLORE 모드)
      };
      saveToLocalDB('debates', debateRecord);

      // 3-3: Explores 테이블 저장
      const exploreRecord = {
        exp_id: expId,
        debate_id: debateId,
        topic,
        three_liner: exploreOutput.three_liner,
        perspectives_count: exploreOutput.perspectives.length,
        can_convert_to_decision: exploreOutput.can_convert_to_decision,
        next_action: exploreOutput.next_action
      };
      saveToLocalDB('explores', exploreRecord);

      // 3-4: EXPLORE 완료 이벤트
      debateEvents.emit('EXPLORE_COMPLETED', {
        debate_id: debateId,
        exp_id: expId,
        topic: topic,
        perspectives_count: exploreOutput.perspectives.length,
        exp_file: expFilePath
      });

      const executionTime = Date.now() - startTime;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 EXPLORE 완료: ${debateId} → ${expId} (${executionTime}ms)`);
      console.log(`${'='.repeat(60)}\n`);

      // EXPLORE 응답
      return res.json({
        success: true,
        mode: DEBATE_MODE.EXPLORE,
        debate_id: debateId,
        exp_id: expId,
        topic: topic,
        safety_label: safetyResult.safety_label,

        // EXPLORE 전용 출력
        three_liner: exploreOutput.three_liner,
        perspectives: exploreOutput.perspectives,
        follow_up_questions: exploreOutput.follow_up_questions,
        decision_triggers: exploreOutput.decision_triggers,
        next_action: exploreOutput.next_action,
        can_convert_to_decision: exploreOutput.can_convert_to_decision,

        // 마크다운
        exp_markdown: expMarkdown,

        raw_outputs: {
          gate: safetyResult,
          creative: parallelOutputs.creative,
          data: parallelOutputs.data,
          cro: parallelOutputs.cro,
          synthLite: exploreOutput
        },
        files: {
          exp: expFilePath
          // dec, actions 없음
        },
        db_records: {
          debates: 1,
          explores: 1,
          decisions: 0,  // EXPLORE 모드에서는 0
          actions: 0     // EXPLORE 모드에서는 0
        },
        execution_time_ms: executionTime,
        agent_performance: performance,
        missing_roles: missingRoles
      });

    } else {
      // ========== DECISION 모드 파이프라인 (기존 로직) ==========

      // Step 2: Synthesizer (코미)
      console.log(`⚖️ Step 2: 코미 종합 시작 (DECISION 모드)...`);
      const synthStart = Date.now();

      const synthesizerOutput = runSynthesizer(
        debateId, decId, topic, context, safetyResult, parallelOutputs
      );

      performance.synth = { status: 'success', duration_ms: Date.now() - synthStart };
      console.log(`✅ Step 2 완료`);

      // Step 3: 저장 및 알림
      console.log(`⚖️ Step 3: 저장 및 알림 (DEC + Actions)...`);

      // v3.2: Hard Guardrail - EXPLORE 모드에서 DEC/Actions 생성 방어적 차단
      // (코드 버그로 EXPLORE 모드가 이 경로에 도달한 경우 차단)
      guardExploreMode(validMode, 'CREATE_DECISION');
      guardExploreMode(validMode, 'CREATE_ACTIONS');
      guardExploreMode(validMode, 'SAVE_DEC_FILE');
      guardExploreMode(validMode, 'SAVE_ACTIONS_FILE');

      // 3-1: 파일 저장 (UTF-8 BOM)
      const decMarkdown = formatDecMarkdown(synthesizerOutput);
      const actionsMarkdown = formatActionsMarkdown(decId, topic, synthesizerOutput.action_items);

      const decFilePath = path.join(CONFIG.decDir, `${decId}.md`);
      const actionsFilePath = path.join(CONFIG.actionsDir, `ACTIONS-${decId}.md`);

      fs.writeFileSync(decFilePath, BOM + decMarkdown, 'utf-8');
      fs.writeFileSync(actionsFilePath, BOM + actionsMarkdown, 'utf-8');

      // 3-2: DB 저장 (Debates)
      const debateRecord = {
        debate_id: debateId,
        request_id: requestId,
        topic,
        context,
        urgency,
        category,
        tags,
        mode: DEBATE_MODE.DECISION,  // v3.2
        decision_required: true,      // v3.2
        status: 'DONE',
        safety_label: safetyResult.safety_label,
        participants: ['gate', 'creative', 'data', 'cro', 'synth'],
        missing_roles: missingRoles,
        role_outputs: JSON.stringify({
          gate: safetyResult,
          creative: parallelOutputs.creative,
          data: parallelOutputs.data,
          cro: parallelOutputs.cro
        }),
        decision_id: decId
      };
      saveToLocalDB('debates', debateRecord);

      // 3-3: DB 저장 (Decisions)
      const decisionRecord = {
        dec_id: decId,
        debate_id: debateId,
        title: synthesizerOutput.decision.title,
        decision: synthesizerOutput.decision.final_decision,
        summary: synthesizerOutput.decision.summary,
        rationale: synthesizerOutput.decision.rationale,
        status: synthesizerOutput.decision.status,
        impact: synthesizerOutput.decision.impact,
        affected_areas: synthesizerOutput.decision.affected_areas.join(', ')
      };
      saveToLocalDB('decisions', decisionRecord);

      // 3-4: DB 저장 (Actions) + 이벤트 발행
      synthesizerOutput.action_items.forEach(action => {
        saveToLocalDB('actions', action);
        debateEvents.emit('ACTION_CREATED', action);
        if (action.priority === 'P0') {
          debateEvents.emit('P0_ACTION_CREATED', action);
        }
      });

      // 3-5: 토론 완료 이벤트
      debateEvents.emit('DEBATE_COMPLETED', {
        debate_id: debateId,
        dec_id: decId,
        topic: topic,
        final_decision: synthesizerOutput.decision.final_decision,
        action_count: synthesizerOutput.action_items.length,
        dec_file: decFilePath
      });

      const executionTime = Date.now() - startTime;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`⚖️ DECISION 완료: ${debateId} → ${decId} (${executionTime}ms)`);
      console.log(`${'='.repeat(60)}\n`);

      // DECISION 응답
      return res.json({
        success: true,
        mode: DEBATE_MODE.DECISION,
        debate_id: debateId,
        dec_id: decId,
        topic: topic,
        safety_label: safetyResult.safety_label,
        final_decision: synthesizerOutput.decision.final_decision,
        dec_markdown: decMarkdown,
        actions_markdown: actionsMarkdown,
        raw_outputs: {
          gate: safetyResult,
          creative: parallelOutputs.creative,
          data: parallelOutputs.data,
          cro: parallelOutputs.cro,
          synth: synthesizerOutput
        },
        files: {
          dec: decFilePath,
          actions: actionsFilePath
        },
        db_records: {
          debates: 1,
          decisions: 1,
          actions: synthesizerOutput.action_items.length
        },
        execution_time_ms: executionTime,
        agent_performance: performance,
        missing_roles: missingRoles
      });
    }

  } catch (error) {
    // v3.2: Hard Guardrail 에러 처리
    if (error instanceof ExploreGuardrailError) {
      console.error(`🚫 [Guardrail 403] ${error.message}`);
      return res.status(403).json({
        success: false,
        error: 'guardrail_violation',
        guardrail_type: 'EXPLORE_MODE_DEC_ACTIONS_BLOCKED',
        attempted_action: error.attemptedAction,
        message: error.message,
        hint: 'EXPLORE 모드에서는 DEC/Actions 생성이 금지됩니다. DECISION 모드를 사용하세요.',
        execution_time_ms: Date.now() - startTime
      });
    }

    console.error(`❌ 토론 실패:`, error);
    res.status(500).json({
      success: false,
      error: 'debate_failed',
      message: error.message,
      execution_time_ms: Date.now() - startTime
    });
  }
});

/**
 * GET /api/debate/status/:id
 */
router.get("/status/:id", (req, res) => {
  const { id } = req.params;

  // 로컬 DB에서 조회
  const debates = getFromLocalDB('debates', { debate_id: id });

  if (debates.length > 0) {
    const debate = debates[0];
    res.json({
      success: true,
      debate_id: id,
      status: debate.status,
      safety_label: debate.safety_label,
      decision_id: debate.decision_id,
      created_at: debate.created_at
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'not_found',
      message: `토론 ${id}를 찾을 수 없습니다.`
    });
  }
});

/**
 * GET /api/debate/list
 * v3.2: mode 필터 추가
 */
router.get("/list", (req, res) => {
  try {
    const { mode } = req.query;  // v3.2: mode 필터
    let debates = getFromLocalDB('debates');

    // v3.2: mode 필터링
    if (mode && Object.values(DEBATE_MODE).includes(mode)) {
      debates = debates.filter(d => d.mode === mode);
    }

    res.json({
      success: true,
      count: debates.length,
      debates: debates.map(d => ({
        debate_id: d.debate_id,
        topic: d.topic,
        mode: d.mode || 'DECISION',  // v3.2: 이전 데이터는 DECISION 기본값
        status: d.status,
        safety_label: d.safety_label,
        decision_id: d.decision_id,
        explore_id: d.explore_id,  // v3.2: EXPLORE 모드용
        created_at: d.created_at
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'list_failed',
      message: error.message
    });
  }
});

/**
 * GET /api/debate/explores
 * v3.2: EXPLORE 목록 조회
 */
router.get("/explores", (req, res) => {
  try {
    const explores = getFromLocalDB('explores');

    res.json({
      success: true,
      count: explores.length,
      explores: explores.map(e => ({
        exp_id: e.exp_id,
        debate_id: e.debate_id,
        topic: e.topic,
        three_liner: e.three_liner,
        perspectives_count: e.perspectives_count,
        can_convert_to_decision: e.can_convert_to_decision,
        next_action: e.next_action,
        created_at: e.created_at
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'explores_list_failed',
      message: error.message
    });
  }
});

/**
 * GET /api/debate/actions
 * Action Items 목록 (지연/담당자별 필터)
 */
router.get("/actions", (req, res) => {
  try {
    const { assignee, status, priority, overdue } = req.query;
    let actions = getFromLocalDB('actions');

    // 필터링
    if (assignee) {
      actions = actions.filter(a => a.assignee === assignee || a.assignee_role === assignee);
    }
    if (status) {
      actions = actions.filter(a => a.status === status);
    }
    if (priority) {
      actions = actions.filter(a => a.priority === priority);
    }
    if (overdue === 'true') {
      const now = new Date().toISOString().split('T')[0];
      actions = actions.filter(a => a.deadline < now && a.status !== 'DONE');
    }

    res.json({
      success: true,
      count: actions.length,
      actions: actions.sort((a, b) => {
        // P0 > P1 > P2, then by deadline
        const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'high': 0, 'medium': 1, 'low': 2 };
        const pA = priorityOrder[a.priority] || 3;
        const pB = priorityOrder[b.priority] || 3;
        if (pA !== pB) return pA - pB;
        return a.deadline.localeCompare(b.deadline);
      })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'actions_failed',
      message: error.message
    });
  }
});

/**
 * PATCH /api/debate/actions/:id
 * Action 상태 업데이트 (v3.1: 이벤트 발행 + 원자적 write)
 */
router.patch("/actions/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status, blocked_reason } = req.body;

    const tablePath = path.join(CONFIG.dbDir, 'actions.json');
    let actions = [];

    if (fs.existsSync(tablePath)) {
      actions = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    }

    const index = actions.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: `Action ${id}를 찾을 수 없습니다.`
      });
    }

    const oldStatus = actions[index].status;
    const oldAction = { ...actions[index] };

    if (status) actions[index].status = status;
    if (blocked_reason) actions[index].blocked_reason = blocked_reason;
    if (status === 'DONE') actions[index].completed_at = new Date().toISOString();
    actions[index].updated_at = new Date().toISOString();

    // v3.1: 원자적 write 사용
    atomicWriteJSON(tablePath, actions);

    // v3.1: 상태 변경 이벤트 발행
    if (status && status !== oldStatus) {
      debateEvents.emit('ACTION_STATUS_CHANGED', {
        id,
        old_status: oldStatus,
        new_status: status,
        blocked_reason,
        ...actions[index]
      });

      // DONE 완료 이벤트
      if (status === 'DONE') {
        debateEvents.emit('ACTION_COMPLETED', actions[index]);
      }
    }

    res.json({
      success: true,
      action: actions[index],
      previous_status: oldStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'update_failed',
      message: error.message
    });
  }
});

/**
 * GET /api/debate/review
 * v3.1: Review Queue 조회
 */
router.get("/review", (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;
    const tickets = getFromLocalDB('review_queue');

    const filtered = status === 'all'
      ? tickets
      : tickets.filter(t => t.status === status);

    res.json({
      success: true,
      count: filtered.length,
      tickets: filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'review_list_failed',
      message: error.message
    });
  }
});

/**
 * PATCH /api/debate/review/:id
 * v3.1: Review 티켓 상태 업데이트
 */
router.patch("/review/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, reviewed_by } = req.body;

    const result = updateInLocalDB('review_queue', id, {
      status,
      resolution,
      reviewed_by,
      reviewed_at: new Date().toISOString()
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: `Review 티켓 ${id}를 찾을 수 없습니다.`
      });
    }

    // 승인된 경우 원본 debate 상태 업데이트
    if (status === 'APPROVED') {
      updateInLocalDB('debates', result.new.debate_id, {
        status: 'RESUMED',
        human_review_required: false
      });
    }

    res.json({
      success: true,
      ticket: result.new
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'review_update_failed',
      message: error.message
    });
  }
});

// ===== v3.1: 스케줄러 (리마인드/에스컬레이션) =====

let schedulerInterval = null;

function checkActionsSchedule() {
  try {
    const actions = getFromLocalDB('actions');
    const now = new Date();

    actions.forEach(action => {
      if (action.status === 'DONE' || action.status === 'BLOCKED') return;

      const deadline = new Date(action.deadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      // 24시간 이내 = at-risk
      if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) {
        debateEvents.emit('ACTION_AT_RISK', {
          ...action,
          hours_remaining: Math.round(hoursUntilDeadline)
        });
      }

      // 기한 초과 + P0 = 에스컬레이션
      if (hoursUntilDeadline < 0 && action.priority === 'P0') {
        debateEvents.emit('ACTION_OVERDUE', action);
      }
    });
  } catch (error) {
    console.error('스케줄러 오류:', error.message);
  }
}

// 스케줄러 시작 (1시간마다)
function startScheduler() {
  if (schedulerInterval) return;

  console.log('⏰ [스케줄러] Action 모니터링 시작 (1시간 주기)');
  schedulerInterval = setInterval(checkActionsSchedule, 60 * 60 * 1000);

  // 서버 시작 시 즉시 1회 실행
  setTimeout(checkActionsSchedule, 5000);
}

// 스케줄러 중지
function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('⏰ [스케줄러] 중지됨');
  }
}

// 라우터 로드 시 스케줄러 자동 시작
startScheduler();

// ===== CEO 주간 리포트 연동 =====

let ceoReportService = null;
try {
  ceoReportService = require('../services/reports/ceoWeeklyReport');
  ceoReportService.startReportScheduler();
  console.log('📊 [Report] CEO 주간 리포트 서비스 로드 성공');
} catch (e) {
  console.warn('📊 [Report] CEO 주간 리포트 서비스 로드 실패:', e.message);
}

/**
 * GET /api/debate/reports/weekly/latest
 * 최신 CEO 주간 리포트 조회
 */
router.get("/reports/weekly/latest", (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '..', 'data', 'reports');
    if (!fs.existsSync(reportsDir)) {
      return res.json({ success: true, message: '리포트 없음', data: null });
    }

    const files = fs.readdirSync(reportsDir)
      .filter(f => f.startsWith('CEO-WEEKLY-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      return res.json({ success: true, message: '리포트 없음', data: null });
    }

    const latestFile = path.join(reportsDir, files[0]);
    const data = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

    res.json({
      success: true,
      file: files[0],
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'report_fetch_failed',
      message: error.message
    });
  }
});

/**
 * POST /api/debate/reports/weekly/run
 * CEO 주간 리포트 수동 생성
 */
router.post("/reports/weekly/run", (req, res) => {
  try {
    if (!ceoReportService) {
      return res.status(503).json({
        success: false,
        error: 'service_unavailable',
        message: 'CEO 리포트 서비스가 로드되지 않았습니다.'
      });
    }

    const result = ceoReportService.generateCeoWeeklyReport();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'report_generation_failed',
      message: error.message
    });
  }
});

// ===== Action 병목 분석 API =====

/**
 * GET /api/debate/actions/bottleneck
 * Action 병목 분석 (Overdue, At-risk, Blocked)
 */
router.get("/actions/bottleneck", (req, res) => {
  try {
    const actions = getFromLocalDB('actions');
    const now = new Date();

    const analysis = {
      overdue: [],      // 기한 초과
      atRisk24h: [],    // 24시간 이내 마감
      blocked48h: [],   // 48시간 이상 차단
      p0CommandCenter: []  // P0 현황판
    };

    actions.forEach(action => {
      if (action.status === 'DONE') return;

      const deadline = action.deadline ? new Date(action.deadline) : null;
      const updatedAt = action.updated_at ? new Date(action.updated_at) : null;

      // 기한 계산
      const hoursUntilDeadline = deadline ? (deadline - now) / (1000 * 60 * 60) : null;
      const delayHours = (deadline && hoursUntilDeadline < 0) ? Math.abs(Math.round(hoursUntilDeadline)) : 0;

      // 차단 시간 계산
      const blockedHours = (action.status === 'BLOCKED' && updatedAt)
        ? Math.round((now - updatedAt) / (1000 * 60 * 60))
        : 0;

      const enrichedAction = {
        ...action,
        is_overdue: deadline && hoursUntilDeadline < 0 ? 'YES' : 'NO',
        is_at_risk_24h: deadline && hoursUntilDeadline > 0 && hoursUntilDeadline <= 24 ? 'YES' : 'NO',
        delay_hours: delayHours,
        blocked_hours: blockedHours
      };

      // 분류
      if (enrichedAction.is_overdue === 'YES') {
        analysis.overdue.push(enrichedAction);
      }

      if (enrichedAction.is_at_risk_24h === 'YES') {
        analysis.atRisk24h.push(enrichedAction);
      }

      if (action.status === 'BLOCKED' && blockedHours >= 48) {
        analysis.blocked48h.push(enrichedAction);
      }

      if (action.priority === 'P0') {
        analysis.p0CommandCenter.push(enrichedAction);
      }
    });

    // 정렬
    analysis.overdue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1;
      return b.delay_hours - a.delay_hours;
    });

    analysis.atRisk24h.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    analysis.blocked48h.sort((a, b) => b.blocked_hours - a.blocked_hours);

    analysis.p0CommandCenter.sort((a, b) => {
      if (a.is_overdue !== b.is_overdue) return a.is_overdue === 'YES' ? -1 : 1;
      if (a.is_at_risk_24h !== b.is_at_risk_24h) return a.is_at_risk_24h === 'YES' ? -1 : 1;
      return new Date(a.deadline || '9999') - new Date(b.deadline || '9999');
    });

    res.json({
      success: true,
      summary: {
        overdueCount: analysis.overdue.length,
        atRiskCount: analysis.atRisk24h.length,
        blocked48hCount: analysis.blocked48h.length,
        p0OpenCount: analysis.p0CommandCenter.length
      },
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'bottleneck_analysis_failed',
      message: error.message
    });
  }
});

/**
 * GET /api/debate/decisions/bottleneck
 * Decision-level 병목 분석
 */
router.get("/decisions/bottleneck", (req, res) => {
  try {
    const decisions = getFromLocalDB('decisions');
    const actions = getFromLocalDB('actions');
    const now = new Date();

    const decisionBottlenecks = decisions.map(dec => {
      const linkedActions = actions.filter(a => a.dec_id === dec.dec_id);
      const openActions = linkedActions.filter(a => a.status !== 'DONE');
      const overdueActions = linkedActions.filter(a => {
        if (a.status === 'DONE' || !a.deadline) return false;
        return new Date(a.deadline) < now;
      });

      const isBottleneck = overdueActions.length >= 2 || openActions.length >= 5;

      return {
        dec_id: dec.dec_id,
        title: dec.title,
        decision: dec.decision,
        status: dec.status,
        open_actions_count: openActions.length,
        overdue_actions_count: overdueActions.length,
        is_bottleneck: isBottleneck ? 'YES' : 'NO',
        linked_actions: linkedActions.map(a => a.id)
      };
    }).filter(d => d.is_bottleneck === 'YES');

    // 심각도 순 정렬
    decisionBottlenecks.sort((a, b) => {
      if (a.overdue_actions_count !== b.overdue_actions_count) {
        return b.overdue_actions_count - a.overdue_actions_count;
      }
      return b.open_actions_count - a.open_actions_count;
    });

    res.json({
      success: true,
      count: decisionBottlenecks.length,
      bottlenecks: decisionBottlenecks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'decision_bottleneck_failed',
      message: error.message
    });
  }
});

// Export (테스트용)
router.scheduler = {
  start: startScheduler,
  stop: stopScheduler,
  check: checkActionsSchedule
};

router.reportService = ceoReportService;

module.exports = router;
