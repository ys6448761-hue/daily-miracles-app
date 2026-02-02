/**
 * reportService.js
 * 신고 처리 서비스
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/reportService: DB 로드 실패:', error.message);
}

const wishService = require('./wishService');
const commentService = require('./commentService');

// 신고 사유
const REPORT_REASONS = [
  'spam',           // 스팸/광고
  'harassment',     // 괴롭힘/혐오
  'inappropriate',  // 부적절한 내용
  'personal_info',  // 개인정보 노출
  'other'           // 기타
];

// 자동 숨김 임계값
const AUTO_HIDE_THRESHOLD = 3;

/**
 * 신고 접수
 */
async function createReport(reporterId, { targetType, targetId, reason }) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  // 유효성 검사
  if (!['wish', 'comment'].includes(targetType)) {
    throw new Error('INVALID_TARGET_TYPE');
  }

  if (!REPORT_REASONS.includes(reason)) {
    throw new Error('INVALID_REASON');
  }

  // 중복 신고 체크
  const existing = await db.query(`
    SELECT id FROM harbor_reports
    WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3
  `, [reporterId, targetType, targetId]);

  if (existing.rows.length > 0) {
    throw new Error('ALREADY_REPORTED');
  }

  // 신고 저장
  const result = await db.query(`
    INSERT INTO harbor_reports (reporter_id, target_type, target_id, reason)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [reporterId, targetType, targetId, reason]);

  console.log(`🚨 신고 접수: type=${targetType}, id=${targetId}, reason=${reason}`);

  // 자동 숨김 처리 (임계값 초과 시)
  await checkAutoHide(targetType, targetId);

  return result.rows[0];
}

/**
 * 자동 숨김 체크
 */
async function checkAutoHide(targetType, targetId) {
  if (!db) return;

  // 해당 대상의 신고 수 조회
  const countResult = await db.query(`
    SELECT COUNT(*) FROM harbor_reports
    WHERE target_type = $1 AND target_id = $2
  `, [targetType, targetId]);

  const reportCount = parseInt(countResult.rows[0]?.count || 0, 10);

  if (reportCount >= AUTO_HIDE_THRESHOLD) {
    console.log(`⚠️ 자동 숨김: type=${targetType}, id=${targetId}, reports=${reportCount}`);

    if (targetType === 'wish') {
      await wishService.hideWish(targetId);
    } else if (targetType === 'comment') {
      await commentService.hideComment(targetId);

      // 댓글의 report_count 업데이트
      await db.query(`
        UPDATE harbor_comments SET report_count = $1 WHERE id = $2
      `, [reportCount, targetId]);
    }
  }
}

/**
 * 신고 목록 조회 (관리자용)
 */
async function getReports({ status = 'PENDING', limit = 50, offset = 0 } = {}) {
  if (!db) return [];

  const result = await db.query(`
    SELECT r.*, u.nickname as reporter_nickname
    FROM harbor_reports r
    LEFT JOIN users_anon u ON r.reporter_id = u.id
    WHERE r.status = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `, [status, limit, offset]);

  return result.rows;
}

/**
 * 신고 상태 업데이트 (관리자용)
 */
async function updateReportStatus(reportId, status) {
  if (!db) throw new Error('DB_NOT_AVAILABLE');

  if (!['PENDING', 'REVIEWED', 'DISMISSED'].includes(status)) {
    throw new Error('INVALID_STATUS');
  }

  const result = await db.query(`
    UPDATE harbor_reports SET status = $1 WHERE id = $2 RETURNING *
  `, [status, reportId]);

  return result.rows[0];
}

module.exports = {
  REPORT_REASONS,
  AUTO_HIDE_THRESHOLD,
  createReport,
  getReports,
  updateReportStatus
};
