/**
 * Aurora5 - Inbox Service
 * 인입 데이터 정규화 및 상태 관리
 *
 * @version 1.0
 */

const db = require('../../database/db');

// 상태 상수
const STATUS = {
  NEW: 'NEW',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
  FAILED: 'FAILED'
};

const MAX_RETRY = 2;

/**
 * 새 인입 데이터 생성
 * @param {Object} params
 * @param {string} params.source - 소스 (wix, api, manual)
 * @param {string} params.sourceId - 원본 시스템 ID
 * @param {string} params.type - 유형 (wish, problem, inquiry)
 * @param {Object} params.payload - 원본 데이터
 */
async function createInbox({ source = 'wix', sourceId, type = 'wish', payload }) {
  // 정규화
  const payloadNorm = normalizePayload(payload, type);

  const result = await db.query(`
    INSERT INTO mvp_inbox (source, source_id, type, payload, payload_norm, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [source, sourceId, type, JSON.stringify(payload), JSON.stringify(payloadNorm), STATUS.NEW]);

  console.log(`📥 Inbox created: #${result.rows[0].id} [${type}]`);
  return result.rows[0];
}

/**
 * 페이로드 정규화 - 다양한 폼 형식을 통일
 */
function normalizePayload(payload, type) {
  const norm = {
    nickname: null,
    phone: null,
    email: null,
    wish: null,
    problem: null,
    context: {}
  };

  // 닉네임 추출
  norm.nickname = payload.nickname
    || payload.name
    || payload.userName
    || payload['사용자명']
    || '익명';

  // 연락처 추출
  norm.phone = payload.phone
    || payload.contact
    || payload.mobile
    || payload['연락처']
    || payload['휴대폰'];

  norm.email = payload.email
    || payload['이메일'];

  // 소원/문제 추출
  if (type === 'wish') {
    norm.wish = payload.wish
      || payload.wishSummary
      || payload.goal
      || payload['소원']
      || payload['이루고싶은것'];
  } else if (type === 'problem') {
    norm.problem = payload.problem
      || payload.concern
      || payload.issue
      || payload['고민']
      || payload['문제'];
  }

  // 추가 컨텍스트
  norm.context = {
    situation: payload.situation || payload['상황'],
    tries: payload.tries || payload['시도한것'],
    constraints: payload.constraints || payload['제약사항'],
    importance: payload.importance || payload['중요도'],
    timeline: payload.timeline || payload.desiredPeriod || payload['기간'],
    region: payload.region || payload['지역'],
    groupSize: payload.groupSize || payload['인원']
  };

  // null 값 제거
  Object.keys(norm.context).forEach(key => {
    if (norm.context[key] === undefined) delete norm.context[key];
  });

  return norm;
}

/**
 * 상태 변경
 * @param {number} inboxId
 * @param {string} newStatus - NEW, PROCESSING, DONE, FAILED
 * @param {string} errorReason - 실패 사유 (FAILED일 때)
 */
async function updateStatus(inboxId, newStatus, errorReason = null) {
  const validTransitions = {
    'NEW': ['PROCESSING'],
    'PROCESSING': ['DONE', 'FAILED'],
    'FAILED': ['PROCESSING'] // 재시도
  };

  // 현재 상태 확인
  const current = await db.query('SELECT status, retry_count FROM mvp_inbox WHERE id = $1', [inboxId]);
  if (current.rows.length === 0) {
    throw new Error(`Inbox not found: ${inboxId}`);
  }

  const { status: currentStatus, retry_count } = current.rows[0];

  // 상태 전이 검증
  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
  }

  // 재시도 횟수 체크
  if (newStatus === 'PROCESSING' && currentStatus === 'FAILED') {
    if (retry_count >= MAX_RETRY) {
      throw new Error(`Max retry exceeded for inbox ${inboxId}`);
    }
  }

  // 업데이트
  const updateData = {
    status: newStatus,
    error_reason: errorReason,
    retry_count: newStatus === 'PROCESSING' && currentStatus === 'FAILED'
      ? retry_count + 1
      : retry_count
  };

  await db.query(`
    UPDATE mvp_inbox
    SET status = $1, error_reason = $2, retry_count = $3, updated_at = NOW()
    WHERE id = $4
  `, [updateData.status, updateData.error_reason, updateData.retry_count, inboxId]);

  console.log(`📝 Inbox #${inboxId}: ${currentStatus} → ${newStatus}`);
  return updateData;
}

/**
 * 처리 대기 중인 인박스 조회
 */
async function getPendingInboxes(limit = 10) {
  const result = await db.query(`
    SELECT * FROM mvp_inbox
    WHERE status = 'NEW'
    ORDER BY created_at ASC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

/**
 * 재시도 가능한 실패 건 조회
 */
async function getRetryableInboxes(limit = 5) {
  const result = await db.query(`
    SELECT * FROM mvp_inbox
    WHERE status = 'FAILED' AND retry_count < $1
    ORDER BY updated_at ASC
    LIMIT $2
  `, [MAX_RETRY, limit]);

  return result.rows;
}

/**
 * 인박스 상세 조회
 */
async function getInboxById(inboxId) {
  const result = await db.query('SELECT * FROM mvp_inbox WHERE id = $1', [inboxId]);
  return result.rows[0] || null;
}

/**
 * 통계 조회
 */
async function getStats() {
  const result = await db.query(`
    SELECT
      status,
      COUNT(*) as count,
      MIN(created_at) as oldest,
      MAX(created_at) as newest
    FROM mvp_inbox
    GROUP BY status
  `);

  const stats = {
    total: 0,
    byStatus: {}
  };

  result.rows.forEach(row => {
    stats.byStatus[row.status] = {
      count: parseInt(row.count),
      oldest: row.oldest,
      newest: row.newest
    };
    stats.total += parseInt(row.count);
  });

  return stats;
}

module.exports = {
  STATUS,
  createInbox,
  normalizePayload,
  updateStatus,
  getPendingInboxes,
  getRetryableInboxes,
  getInboxById,
  getStats
};
