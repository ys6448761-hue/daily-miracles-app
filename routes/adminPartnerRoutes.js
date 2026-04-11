'use strict';

/**
 * adminPartnerRoutes.js — 슈퍼어드민 파트너 관리 API
 *
 * 인증: X-Admin-Token 헤더 (ADMIN_TOKEN 환경변수)
 *
 * GET  /api/admin/partners                전체 파트너 목록 (등급순)
 * GET  /api/admin/partners/:id            파트너 상세 + 평가이력
 * POST /api/admin/partners/:id/evaluate   수동 평가 실행
 * PATCH /api/admin/partners/:id/grade     수동 등급 변경
 * POST /api/admin/partners/:id/warn       경고 알림톡 발송
 * POST /api/admin/partners/:id/terminate  계약 해지
 * POST /api/admin/evaluate-all            전체 파트너 일괄 평가
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

let evalSvc = null;
try { evalSvc = require('../services/partnerEvalService'); } catch {}

let msg = null;
try { msg = require('../services/messageProvider'); } catch {}

// ── 어드민 인증 미들웨어 ───────────────────────────────────────────────────
function adminGuard(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.admin_token;
  if (token && token === process.env.ADMIN_TOKEN) return next();
  if (!process.env.ADMIN_TOKEN) return next(); // 로컬 개발: 미설정 시 통과
  return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
}

router.use(adminGuard);

const GRADE_ORDER = ['danger', 'warning', 'normal', 'star'];

// ─────────────────────────────────────────────────────────────────────────
// GET /api/admin/partners
// ─────────────────────────────────────────────────────────────────────────
router.get('/partners', async (req, res) => {
  try {
    const r = await db.query(`
      SELECT
        p.id, p.name, p.category, p.address, p.phone,
        p.is_active, p.grade, p.grade_updated_at,
        p.hometown_star_count, p.is_subscribed,
        -- 이번 달 방문 수
        (SELECT COUNT(*) FROM hometown_visits hv
          WHERE hv.partner_id = p.id
            AND hv.visited_at >= date_trunc('month', NOW())) AS month_visits,
        -- 최근 평가 점수
        pe.total_score, pe.return_rate, pe.qr_scan_count,
        pe.order_process_rate, pe.admin_login_count,
        pe.eval_month,
        -- 파트너 계정 마지막 로그인
        (SELECT MAX(pa.last_login_at) FROM partner_accounts pa WHERE pa.partner_id = p.id) AS last_login_at
      FROM dt_partners p
      LEFT JOIN partner_evaluations pe
        ON pe.partner_id = p.id
        AND pe.eval_month = date_trunc('month', NOW())::DATE
      ORDER BY p.is_active DESC, p.created_at
    `);

    // danger→warning→normal→star 순 정렬
    const sorted = [...r.rows].sort((a, b) => {
      const ai = GRADE_ORDER.indexOf(a.grade || 'normal');
      const bi = GRADE_ORDER.indexOf(b.grade || 'normal');
      return ai - bi;
    });

    // 등급별 카운트
    const summary = { star: 0, normal: 0, warning: 0, danger: 0 };
    for (const p of sorted) summary[p.grade || 'normal'] = (summary[p.grade || 'normal'] || 0) + 1;

    return res.json({ partners: sorted, summary, total: sorted.length });
  } catch (err) {
    console.error('[admin/partners] 오류:', err);
    return res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/admin/partners/:id
// ─────────────────────────────────────────────────────────────────────────
router.get('/partners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pR = await db.query(
      `SELECT p.*, r.city_name
         FROM dt_partners p
         LEFT JOIN dt_regions r ON r.city_code = p.city_code
        WHERE p.id = $1`,
      [id]
    );
    if (!pR.rows[0]) return res.status(404).json({ error: '업체를 찾을 수 없습니다.' });

    // 평가 이력 (최근 6개월)
    const evalR = await db.query(
      `SELECT * FROM partner_evaluations WHERE partner_id = $1 ORDER BY eval_month DESC LIMIT 6`,
      [id]
    );

    // 상태 변경 이력
    const logsR = await db.query(
      `SELECT * FROM partner_status_logs WHERE partner_id = $1 ORDER BY changed_at DESC LIMIT 20`,
      [id]
    );

    // 파트너 계정 목록
    const acctR = await db.query(
      `SELECT id, email, login_id, is_active, last_login_at, created_at FROM partner_accounts WHERE partner_id = $1`,
      [id]
    );

    // 별 목록 (상위 5개)
    const starsR = await db.query(
      `SELECT id, star_name, hometown_visit_count, hometown_confirmed_at
         FROM dt_stars WHERE hometown_partner_id = $1
        ORDER BY hometown_visit_count DESC LIMIT 5`,
      [id]
    );

    return res.json({
      partner:      pR.rows[0],
      evaluations:  evalR.rows,
      status_logs:  logsR.rows,
      accounts:     acctR.rows,
      stars:        starsR.rows,
    });
  } catch (err) {
    console.error('[admin/partners/:id] 오류:', err);
    return res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/admin/partners/:id/evaluate
// ─────────────────────────────────────────────────────────────────────────
router.post('/partners/:id/evaluate', async (req, res) => {
  const { id } = req.params;
  const { month } = req.body;

  if (!evalSvc) return res.status(503).json({ error: '평가 서비스 로드 실패' });

  try {
    // 기존 등급 조회
    const prevR = await db.query(`SELECT grade FROM dt_partners WHERE id = $1`, [id]);
    const prevGrade = prevR.rows[0]?.grade || 'normal';

    const result = await evalSvc.evaluatePartner(id, month || null);

    // dt_partners 업데이트
    await db.query(
      `UPDATE dt_partners SET grade = $1, grade_updated_at = NOW() WHERE id = $2`,
      [result.grade, id]
    );

    // 등급 변경 시 이력
    if (prevGrade !== result.grade) {
      await db.query(`
        INSERT INTO partner_status_logs (partner_id, previous_status, new_status, reason, changed_by)
        VALUES ($1, $2, $3, $4, 'admin')
      `, [id, prevGrade, result.grade, `수동 평가 실행 — 총점 ${result.total_score}`]);
    }

    return res.json({ ok: true, result });
  } catch (err) {
    console.error('[admin/partners/:id/evaluate] 오류:', err);
    return res.status(500).json({ error: '평가 실패', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/partners/:id/grade
// Body: { grade, reason }
// ─────────────────────────────────────────────────────────────────────────
router.patch('/partners/:id/grade', async (req, res) => {
  const { id } = req.params;
  const { grade, reason } = req.body;

  const validGrades = ['star', 'normal', 'warning', 'danger'];
  if (!validGrades.includes(grade)) {
    return res.status(400).json({ error: '유효하지 않은 등급입니다.', valid: validGrades });
  }

  try {
    const prevR = await db.query(`SELECT grade, name, phone FROM dt_partners WHERE id = $1`, [id]);
    const partner = prevR.rows[0];
    if (!partner) return res.status(404).json({ error: '업체를 찾을 수 없습니다.' });

    await db.query(
      `UPDATE dt_partners SET grade = $1, grade_updated_at = NOW() WHERE id = $2`,
      [grade, id]
    );

    await db.query(`
      INSERT INTO partner_status_logs (partner_id, previous_status, new_status, reason, changed_by)
      VALUES ($1, $2, $3, $4, 'admin')
    `, [id, partner.grade || 'normal', grade, reason || '어드민 수동 변경']);

    // warning/danger 이동 시 알림
    if ((grade === 'warning' || grade === 'danger') && partner.phone && msg && msg.isEnabled()) {
      const label = grade === 'warning' ? '⚠️ 주의' : '❌ 위험';
      await msg.sendSensSMS(partner.phone,
        `[DreamTown 파트너 알림]\n등급이 ${label} 단계로 변경됐어요.\n사유: ${reason || '어드민 검토'}\n\n문의: 010-3819-6178`
      ).catch(() => {});
    }

    return res.json({ ok: true, grade });
  } catch (err) {
    console.error('[admin/partners/:id/grade] 오류:', err);
    return res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/admin/partners/:id/warn
// ─────────────────────────────────────────────────────────────────────────
router.post('/partners/:id/warn', async (req, res) => {
  const { id } = req.params;
  const { message: customMsg } = req.body;

  try {
    const pR = await db.query(`SELECT name, phone FROM dt_partners WHERE id = $1`, [id]);
    const partner = pR.rows[0];
    if (!partner) return res.status(404).json({ error: '업체를 찾을 수 없습니다.' });
    if (!partner.phone) return res.status(400).json({ error: '연락처가 등록되지 않았습니다.' });

    const smsText = customMsg || `[DreamTown 파트너 알림]\n${partner.name} 업체에 경고 알림이 발송됩니다.\n\n파트너십 유지 기준을 충족해주세요.\n재방문율 및 QR 활성화를 개선해주시면 좋겠어요.\n\n문의: 010-3819-6178`;

    let sent = false;
    if (msg && msg.isEnabled()) {
      await msg.sendSensSMS(partner.phone, smsText);
      sent = true;
    }

    await db.query(`
      INSERT INTO partner_status_logs (partner_id, previous_status, new_status, reason, changed_by)
      VALUES ($1, NULL, 'warned', $2, 'admin')
    `, [id, '경고 알림 발송']);

    return res.json({ ok: true, sent, phone: partner.phone });
  } catch (err) {
    console.error('[admin/partners/:id/warn] 오류:', err);
    return res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/admin/partners/:id/terminate
// ─────────────────────────────────────────────────────────────────────────
router.post('/partners/:id/terminate', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const pR = await client.query(
      `SELECT name, phone, grade FROM dt_partners WHERE id = $1`, [id]
    );
    const partner = pR.rows[0];
    if (!partner) { await client.query('ROLLBACK'); return res.status(404).json({ error: '업체를 찾을 수 없습니다.' }); }

    // dt_partners 비활성화
    await client.query(
      `UPDATE dt_partners SET is_active = FALSE, grade = 'danger', grade_updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // 소속 별의 hometown_partner_id는 유지하되 confirmed_at 제거 (고향 표시 "운영 중단")
    // → 프론트에서 is_active=FALSE 파트너는 "이 고향은 현재 운영 중단됐어요" 표시
    await client.query(
      `UPDATE dt_stars SET hometown_confirmed_at = NULL WHERE hometown_partner_id = $1`,
      [id]
    );

    // 이력 기록
    await client.query(`
      INSERT INTO partner_status_logs (partner_id, previous_status, new_status, reason, changed_by)
      VALUES ($1, $2, 'terminated', $3, 'admin')
    `, [id, partner.grade || 'normal', reason || '계약 해지']);

    await client.query('COMMIT');

    // 해지 알림
    if (partner.phone && msg && msg.isEnabled()) {
      await msg.sendSensSMS(partner.phone,
        `[DreamTown 파트너 알림]\n${partner.name} 업체의 파트너 계약이 해지 처리됐습니다.\n사유: ${reason || '계약 해지'}\n\n문의: 010-3819-6178`
      ).catch(() => {});
    }

    return res.json({ ok: true, partner_id: id, terminated: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin/partners/:id/terminate] 오류:', err);
    return res.status(500).json({ error: '해지 처리 실패', detail: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/admin/evaluate-all
// ─────────────────────────────────────────────────────────────────────────
router.post('/evaluate-all', async (req, res) => {
  const { month } = req.body;

  if (!evalSvc) return res.status(503).json({ error: '평가 서비스 로드 실패' });

  try {
    const result = await evalSvc.evaluateAllPartners(month || null);
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[admin/evaluate-all] 오류:', err);
    return res.status(500).json({ error: '일괄 평가 실패', detail: err.message });
  }
});

module.exports = router;
