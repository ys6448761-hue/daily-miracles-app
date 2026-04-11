'use strict';

/**
 * partnerEvalService.js — 파트너 업체 평가 엔진
 *
 * 5개 지표 → 가중 합산 → 등급 결정
 *
 * ① 재방문율       visits/stars 비율  가중치 40점
 * ② QR 스캔 횟수   hometown_visits    가중치 20점
 * ③ 주문 처리율    shipped/total      가중치 20점
 * ④ 어드민 로그인  last_login_at 기준 가중치 10점
 * ⑤ 감정 점수      방문 후 whisper    가중치 10점
 *
 * 등급:
 *   80+ → star    🌟
 *   60+ → normal  ✅
 *   40+ → warning ⚠️
 *   <40 → danger  ❌
 */

const db  = require('../database/db');
let msg = null;
try { msg = require('./messageProvider'); } catch {}

const GRADE_THRESHOLDS = [
  { min: 80, grade: 'star' },
  { min: 60, grade: 'normal' },
  { min: 40, grade: 'warning' },
  { min: 0,  grade: 'danger' },
];

const GRADE_LABEL = {
  star:    '🌟 스타',
  normal:  '✅ 일반',
  warning: '⚠️ 주의',
  danger:  '❌ 위험',
};

function toGrade(score) {
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (score >= min) return grade;
  }
  return 'danger';
}

// 월 첫날 DATE 문자열
function monthStart(month) {
  if (month) return month; // 이미 'YYYY-MM-DD' 형식이면 그대로
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * 단일 파트너 평가
 * @param {string} partner_id
 * @param {string|null} month  'YYYY-MM-01' 형식, null이면 이번 달
 * @returns {object} 평가 결과
 */
async function evaluatePartner(partner_id, month = null) {
  const evalMonth = monthStart(month);
  const nextMonth = new Date(evalMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().slice(0, 10);

  // ─── ① 재방문율 (40점) ───────────────────────────────────────────────
  // 별 수 대비 2회 이상 방문한 별 비율
  const visitR = await db.query(`
    SELECT
      COUNT(DISTINCT s.id)                                          AS total_stars,
      COUNT(DISTINCT CASE WHEN hv.visit_count >= 2 THEN s.id END)  AS returning_stars
    FROM dt_stars s
    LEFT JOIN (
      SELECT star_id, COUNT(*) AS visit_count
        FROM hometown_visits
       WHERE partner_id = $1
         AND visited_at >= $2 AND visited_at < $3
       GROUP BY star_id
    ) hv ON hv.star_id = s.id
    WHERE s.hometown_partner_id = $1
  `, [partner_id, evalMonth, nextMonthStr]);

  const totalStars     = Number(visitR.rows[0]?.total_stars ?? 0);
  const returningStars = Number(visitR.rows[0]?.returning_stars ?? 0);
  const return_rate    = totalStars > 0 ? (returningStars / totalStars) * 100 : 0;
  const score_return   = Math.min((return_rate / 50) * 40, 40); // 50% 재방문 = 만점

  // ─── ② QR 스캔 횟수 (20점) ──────────────────────────────────────────
  const qrR = await db.query(`
    SELECT COUNT(*) AS cnt
      FROM hometown_visits
     WHERE partner_id = $1
       AND visited_at >= $2 AND visited_at < $3
  `, [partner_id, evalMonth, nextMonthStr]);

  const qr_scan_count = Number(qrR.rows[0]?.cnt ?? 0);
  const score_qr      = Math.min((qr_scan_count / 30) * 20, 20); // 30회 = 만점

  // ─── ③ 주문 처리율 (20점) ───────────────────────────────────────────
  const orderR = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status != 'cancelled')          AS total_orders,
      COUNT(*) FILTER (WHERE status IN ('shipped','delivered')) AS processed_orders
    FROM dt_shop_orders
    WHERE partner_id = $1
      AND created_at >= $2 AND created_at < $3
  `, [partner_id, evalMonth, nextMonthStr]).catch(() => ({ rows: [{}] }));

  const totalOrders     = Number(orderR.rows[0]?.total_orders ?? 0);
  const processedOrders = Number(orderR.rows[0]?.processed_orders ?? 0);
  const order_process_rate = totalOrders > 0 ? (processedOrders / totalOrders) * 100 : 80; // 주문 없으면 기본 80점
  const score_order     = (order_process_rate / 100) * 20;

  // ─── ④ 어드민 로그인 횟수 (10점) ────────────────────────────────────
  // last_login_at이 이번 달 내에 있는 계정 수로 대리 측정
  const loginR = await db.query(`
    SELECT COUNT(*) AS cnt
      FROM partner_accounts
     WHERE partner_id = $1
       AND last_login_at >= $2 AND last_login_at < $3
  `, [partner_id, evalMonth, nextMonthStr]).catch(() => ({ rows: [{ cnt: 0 }] }));

  const admin_login_count = Number(loginR.rows[0]?.cnt ?? 0);
  const score_login       = Math.min((admin_login_count / 5) * 10, 10); // 5회 = 만점

  // ─── ⑤ 감정 점수 (10점) ────────────────────────────────────────────
  // 이 파트너 소속 별들의 journey_logs whisper 감정 비율
  const sentimentR = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE jl.emotion_tag IN ('hope','gratitude','relief','joy'))  AS positive,
      COUNT(*) FILTER (WHERE jl.emotion_tag IN ('fear','anger','despair','sadness')) AS negative,
      COUNT(*)                                                                        AS total
    FROM journey_logs jl
    JOIN dt_stars s ON s.id::TEXT = jl.star_id
    WHERE s.hometown_partner_id = $1
      AND jl.created_at >= $2 AND jl.created_at < $3
  `, [partner_id, evalMonth, nextMonthStr]).catch(() => ({ rows: [{}] }));

  const sentRows    = sentimentR.rows[0] || {};
  const posCount    = Number(sentRows.positive ?? 0);
  const negCount    = Number(sentRows.negative ?? 0);
  const totCount    = Number(sentRows.total    ?? 0);
  const sentiment_score = totCount > 0 ? (posCount / totCount) * 100 : 70; // 기록 없으면 기본 70
  const score_sentiment = (sentiment_score / 100) * 10;

  // ─── 종합 점수 + 등급 ────────────────────────────────────────────────
  const total_score = Math.round(
    (score_return + score_qr + score_order + score_login + score_sentiment) * 10
  ) / 10;
  const grade = toGrade(total_score);

  // ─── DB 저장 (upsert) ────────────────────────────────────────────────
  await db.query(`
    INSERT INTO partner_evaluations
      (partner_id, eval_month, return_rate, qr_scan_count, order_process_rate,
       admin_login_count, sentiment_score, total_score, grade)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (partner_id, eval_month) DO UPDATE SET
      return_rate        = EXCLUDED.return_rate,
      qr_scan_count      = EXCLUDED.qr_scan_count,
      order_process_rate = EXCLUDED.order_process_rate,
      admin_login_count  = EXCLUDED.admin_login_count,
      sentiment_score    = EXCLUDED.sentiment_score,
      total_score        = EXCLUDED.total_score,
      grade              = EXCLUDED.grade
  `, [partner_id, evalMonth, return_rate.toFixed(2), qr_scan_count,
      order_process_rate.toFixed(2), admin_login_count,
      sentiment_score.toFixed(2), total_score, grade]);

  return {
    partner_id,
    eval_month: evalMonth,
    return_rate:        Math.round(return_rate * 10) / 10,
    qr_scan_count,
    order_process_rate: Math.round(order_process_rate * 10) / 10,
    admin_login_count,
    sentiment_score:    Math.round(sentiment_score * 10) / 10,
    total_score,
    grade,
  };
}

/**
 * 전체 파트너 일괄 평가
 */
async function evaluateAllPartners(month = null) {
  const evalMonth = monthStart(month);

  const partnersR = await db.query(
    `SELECT id, name, phone, grade FROM dt_partners WHERE is_active = TRUE ORDER BY created_at`
  );

  const results = [];
  for (const partner of partnersR.rows) {
    try {
      const result = await evaluatePartner(partner.id, evalMonth);
      const prevGrade = partner.grade || 'normal';

      // dt_partners.grade 업데이트
      await db.query(
        `UPDATE dt_partners SET grade = $1, grade_updated_at = NOW() WHERE id = $2`,
        [result.grade, partner.id]
      );

      // 등급 변경 시 이력 기록
      if (prevGrade !== result.grade) {
        await db.query(`
          INSERT INTO partner_status_logs (partner_id, previous_status, new_status, reason, changed_by)
          VALUES ($1, $2, $3, $4, 'system')
        `, [partner.id, prevGrade, result.grade,
            `월별 자동 평가 (${evalMonth}) — 총점 ${result.total_score}`]);
      }

      // warning/danger 알림 발송
      if ((result.grade === 'warning' || result.grade === 'danger') && partner.phone) {
        const gradeLabel = result.grade === 'warning' ? '⚠️ 주의' : '❌ 위험';
        const msg_text = `[DreamTown 파트너 알림]\n이달 평가 결과: ${gradeLabel} 단계\n\n재방문율: ${result.return_rate}%\nQR 스캔: ${result.qr_scan_count}회\n\n1개월 내 개선되지 않으면\n파트너십이 종료될 수 있어요.\n문의: 010-3819-6178`;

        if (msg && msg.isEnabled()) {
          await msg.sendSensSMS(partner.phone, msg_text).catch(() => {});
        }
      }

      results.push({ ...result, partner_name: partner.name, ok: true });
    } catch (err) {
      console.error(`[partnerEvalService] ${partner.name} 평가 실패:`, err.message);
      results.push({ partner_id: partner.id, partner_name: partner.name, ok: false, error: err.message });
    }
  }

  return { eval_month: evalMonth, count: results.length, results };
}

module.exports = { evaluatePartner, evaluateAllPartners, toGrade, GRADE_LABEL };
