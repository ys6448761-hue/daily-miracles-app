/**
 * Aurora5 - Dashboard Service
 * 운영 대시보드 데이터 서비스
 *
 * @version 1.0
 */

const db = require('../../database/db');

/**
 * 오늘 발송 예정 목록
 */
async function getTodayQueue() {
  const result = await db.query(`
    SELECT
      t.id as trial_id,
      t.phone,
      t.last_day_sent + 1 as next_day,
      t.next_send_at,
      t.ref_code,
      r.token,
      i.payload_norm->>'nickname' as nickname,
      i.payload_norm->>'wish' as wish_summary,
      i.created_at as registered_at
    FROM trials t
    JOIN mvp_results r ON r.token = t.token
    JOIN mvp_inbox i ON i.id = t.inbox_id
    WHERE t.active = TRUE
      AND t.last_day_sent < 7
      AND DATE(t.next_send_at AT TIME ZONE 'Asia/Seoul') = DATE(NOW() AT TIME ZONE 'Asia/Seoul')
    ORDER BY t.next_send_at
  `);

  return result.rows;
}

/**
 * 오늘 발송 완료 목록
 */
async function getTodaySent() {
  const result = await db.query(`
    SELECT
      s.trial_id,
      s.day,
      s.template_code,
      s.to_address,
      s.status,
      s.provider,
      s.created_at as sent_at,
      t.phone,
      i.payload_norm->>'nickname' as nickname
    FROM send_log s
    JOIN trials t ON t.id = s.trial_id
    JOIN mvp_inbox i ON i.id = t.inbox_id
    WHERE DATE(s.created_at AT TIME ZONE 'Asia/Seoul') = DATE(NOW() AT TIME ZONE 'Asia/Seoul')
    ORDER BY s.created_at DESC
  `);

  return result.rows;
}

/**
 * 실패 건 목록
 */
async function getFailedSends(limit = 20) {
  const result = await db.query(`
    SELECT
      s.id as log_id,
      s.trial_id,
      s.day,
      s.template_code,
      s.to_address,
      s.error,
      s.created_at,
      t.phone,
      i.payload_norm->>'nickname' as nickname
    FROM send_log s
    JOIN trials t ON t.id = s.trial_id
    JOIN mvp_inbox i ON i.id = t.inbox_id
    WHERE s.status = 'FAILED'
    ORDER BY s.created_at DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

/**
 * 일별 통계 (최근 N일)
 */
async function getDailyStats(days = 7) {
  const result = await db.query(`
    SELECT
      DATE(created_at AT TIME ZONE 'Asia/Seoul') as date,
      COUNT(*) FILTER (WHERE status = 'SENT') as sent,
      COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
      COUNT(*) FILTER (WHERE status = 'SKIPPED') as skipped,
      COUNT(DISTINCT trial_id) as unique_users
    FROM send_log
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at AT TIME ZONE 'Asia/Seoul')
    ORDER BY date DESC
  `);

  return result.rows;
}

/**
 * 여정 완주율
 */
async function getCompletionStats() {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE last_day_sent = 0) as day0,
      COUNT(*) FILTER (WHERE last_day_sent = 1) as day1,
      COUNT(*) FILTER (WHERE last_day_sent = 2) as day2,
      COUNT(*) FILTER (WHERE last_day_sent = 3) as day3,
      COUNT(*) FILTER (WHERE last_day_sent = 4) as day4,
      COUNT(*) FILTER (WHERE last_day_sent = 5) as day5,
      COUNT(*) FILTER (WHERE last_day_sent = 6) as day6,
      COUNT(*) FILTER (WHERE last_day_sent = 7) as completed,
      COUNT(*) as total
    FROM trials
  `);

  const stats = result.rows[0];

  // 완주율 계산
  const total = parseInt(stats.total) || 1;
  stats.completionRate = ((parseInt(stats.completed) / total) * 100).toFixed(1);

  return stats;
}

/**
 * 추천 코드 사용 통계
 */
async function getReferralStats() {
  const result = await db.query(`
    SELECT
      referred_by as referrer_code,
      COUNT(*) as referral_count
    FROM trials
    WHERE referred_by IS NOT NULL
    GROUP BY referred_by
    ORDER BY referral_count DESC
    LIMIT 10
  `);

  return result.rows;
}

/**
 * 누락자 감지 (발송 예정인데 발송 안 된 건)
 */
async function getMissedSends() {
  const result = await db.query(`
    SELECT
      t.id as trial_id,
      t.phone,
      t.last_day_sent + 1 as expected_day,
      t.next_send_at,
      i.payload_norm->>'nickname' as nickname
    FROM trials t
    JOIN mvp_inbox i ON i.id = t.inbox_id
    WHERE t.active = TRUE
      AND t.last_day_sent < 7
      AND t.next_send_at < NOW() - INTERVAL '2 hours'
      AND NOT EXISTS (
        SELECT 1 FROM send_log s
        WHERE s.trial_id = t.id
          AND s.day = t.last_day_sent + 1
          AND s.status = 'SENT'
          AND s.created_at > t.next_send_at - INTERVAL '1 hour'
      )
    ORDER BY t.next_send_at
  `);

  return result.rows;
}

/**
 * 전체 대시보드 데이터
 */
async function getFullDashboard() {
  const [
    todayQueue,
    todaySent,
    failedSends,
    dailyStats,
    completionStats,
    referralStats,
    missedSends
  ] = await Promise.all([
    getTodayQueue(),
    getTodaySent(),
    getFailedSends(10),
    getDailyStats(7),
    getCompletionStats(),
    getReferralStats(),
    getMissedSends()
  ]);

  return {
    summary: {
      todayQueueCount: todayQueue.length,
      todaySentCount: todaySent.length,
      failedCount: failedSends.length,
      missedCount: missedSends.length,
      completionRate: completionStats.completionRate + '%'
    },
    todayQueue,
    todaySent,
    failedSends,
    dailyStats,
    completionStats,
    referralStats,
    missedSends,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getTodayQueue,
  getTodaySent,
  getFailedSends,
  getDailyStats,
  getCompletionStats,
  getReferralStats,
  getMissedSends,
  getFullDashboard
};
