/**
 * voyageAdminRoutes.js — 여수 항해 예약 관리 어드민 API
 *
 * GET  /api/admin/voyage/summary           — 오늘/전체/체크인 카운트
 * GET  /api/admin/voyage/bookings          — 예약 목록 (필터: date, type, status)
 * POST /api/admin/voyage/bookings/:id/checkin  — 체크인 처리
 * POST /api/admin/voyage/bookings/:id/notify   — 예약 확인 알림 발송
 * POST /api/admin/voyage/bookings/:id/cancel   — 예약 취소
 *
 * 인증: X-Admin-Token 헤더 (ADMIN_TOKEN 환경변수)
 * 삭제 API 없음 — is_active 또는 status='cancelled' 만 허용
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

let msg = null;
try {
  msg = require('../services/messageProvider');
} catch (e) {
  console.warn('[voyageAdmin] messageProvider 로드 실패 — 알림 비활성화');
}

// ── 관리자 인증 ───────────────────────────────────────────────────────
function adminGuard(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && token === process.env.ADMIN_TOKEN) return next();
  if (!process.env.ADMIN_TOKEN) return next();   // 로컬 개발: 토큰 미설정 시 통과
  return res.status(401).json({ error: '관리자 인증 필요' });
}
router.use(adminGuard);

// ── 날짜 범위 헬퍼 ────────────────────────────────────────────────────
function dateRange(type) {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  if (type === 'today') {
    const d = fmt(today);
    return { from: d, to: d };
  }
  if (type === 'week') {
    const day  = today.getDay();               // 0=일
    const mon  = new Date(today); mon.setDate(today.getDate() - ((day + 6) % 7));
    const sun  = new Date(mon);   sun.setDate(mon.getDate() + 6);
    return { from: fmt(mon), to: fmt(sun) };
  }
  return null; // 전체
}

// ── GET /summary ─────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { rows: [row] } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE booking_date = CURRENT_DATE
                           AND status IN ('confirmed','checked_in'))          AS today_count,
        COUNT(*) FILTER (WHERE status IN ('pending','confirmed','checked_in')) AS total_count,
        COUNT(*) FILTER (WHERE status = 'checked_in')                         AS checkin_count
      FROM voyage_bookings
    `);
    return res.json({
      today:   parseInt(row.today_count  ?? 0),
      total:   parseInt(row.total_count  ?? 0),
      checkin: parseInt(row.checkin_count ?? 0),
    });
  } catch (e) {
    console.error('[voyageAdmin] summary error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /bookings ─────────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  const { date, type, status } = req.query;

  const params = [];
  const conds  = ['1=1'];

  // date 필터: 'today' | 'week' | 특정날짜(YYYY-MM-DD) | 없음=전체
  if (date === 'today') {
    conds.push(`b.booking_date = CURRENT_DATE`);
  } else if (date === 'week') {
    conds.push(`b.booking_date BETWEEN CURRENT_DATE - INTERVAL '6 days' AND CURRENT_DATE + INTERVAL '6 days'`);
  } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    params.push(date);
    conds.push(`b.booking_date = $${params.length}`);
  }

  if (type && ['개인','단체'].includes(type)) {
    params.push(type);
    conds.push(`b.booking_type = $${params.length}`);
  }

  if (status) {
    const allowed = ['pending','confirmed','checked_in','cancelled'];
    const list = status.split(',').filter(s => allowed.includes(s));
    if (list.length) {
      params.push(list);
      conds.push(`b.status = ANY($${params.length})`);
    }
  }

  try {
    const { rows } = await db.query(`
      SELECT
        b.id,
        b.customer_name,
        b.phone,
        b.booking_date,
        b.session,
        b.party_size,
        b.booking_type,
        b.amount,
        b.status,
        b.paid_at,
        b.pg_order_id,
        b.reflection_answer,
        b.created_at,
        w.id         AS wish_id,
        w.wish_text,
        w.status     AS wish_status
      FROM voyage_bookings b
      JOIN voyage_wishes w ON w.id = b.wish_id
      WHERE ${conds.join(' AND ')}
      ORDER BY b.booking_date ASC, b.session ASC, b.created_at DESC
    `, params);

    return res.json({ ok: true, count: rows.length, bookings: rows });
  } catch (e) {
    console.error('[voyageAdmin] bookings error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── POST /bookings/:id/checkin ────────────────────────────────────────
router.post('/bookings/:id/checkin', async (req, res) => {
  const { id } = req.params;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [booking] } = await client.query(
      `SELECT id, wish_id, status FROM voyage_bookings WHERE id = $1`, [id]
    );
    if (!booking)            throw Object.assign(new Error('예약 없음'), { status: 404 });
    if (booking.status === 'cancelled')
      throw Object.assign(new Error('취소된 예약은 체크인 불가'), { status: 400 });
    if (booking.status === 'checked_in')
      throw Object.assign(new Error('이미 체크인 완료'), { status: 409 });

    await client.query(
      `UPDATE voyage_bookings SET status = 'checked_in', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    await client.query(
      `UPDATE voyage_wishes SET status = 'boarding_checked_in', updated_at = NOW() WHERE id = $1`,
      [booking.wish_id]
    );

    await client.query('COMMIT');

    // 이벤트 로그
    db.query(
      `INSERT INTO dt_events (event_name, params) VALUES ($1, $2)`,
      ['voyage_checkin', { booking_id: id, wish_id: booking.wish_id }]
    ).catch(() => {});

    return res.json({ ok: true, booking_id: id, status: 'checked_in' });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(e.status ?? 500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ── POST /bookings/:id/notify ─────────────────────────────────────────
router.post('/bookings/:id/notify', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: [booking] } = await db.query(
      `SELECT b.*, w.wish_text
       FROM voyage_bookings b
       JOIN voyage_wishes w ON w.id = b.wish_id
       WHERE b.id = $1`, [id]
    );
    if (!booking) return res.status(404).json({ error: '예약 없음' });

    const sessionLabel = booking.session === 'morning' ? '오전 세션 (09:00~13:00)' : '저녁 세션 (17:00~21:00)';
    const dateStr = String(booking.booking_date).slice(0, 10);

    // SMS 메시지 (알림톡 템플릿 미설정 시 fallback)
    const smsText =
      `[하루하루의 기적 드림]\n` +
      `✨ 예약이 확정되었습니다\n\n` +
      `고객명: ${booking.customer_name}님\n` +
      `상품: 여수 항해 여정\n` +
      `여행일: ${dateStr}\n` +
      `세션: ${sessionLabel}\n` +
      `인원: ${booking.party_size ?? 1}명\n` +
      `결제금액: ${Number(booking.amount).toLocaleString('ko-KR')}원\n\n` +
      `문의: 010-3819-6178\n` +
      `카카오채널: @dailymiracles`;

    let sent = false;
    let error = null;

    if (msg?.isEnabled()) {
      const templateCode = process.env.SENS_VOYAGE_NOTIFY_TEMPLATE_CODE;
      try {
        if (templateCode) {
          await msg.sendSensAlimtalk(booking.phone, {
            templateCode,
            customer_name: booking.customer_name,
            product_name:  '여수 항해 여정',
            travel_date:   dateStr,
            session:       sessionLabel,
            guests:        String(booking.party_size ?? 1),
            total_amount:  Number(booking.amount).toLocaleString('ko-KR'),
          });
        } else {
          await msg.sendSensSMS(booking.phone, smsText);
        }
        sent = true;
      } catch (e) {
        error = e.message;
        console.error('[voyageAdmin] notify 발송 실패:', e.message);
      }
    } else {
      console.log('[voyageAdmin] 메시지 비활성화 — 발송 스킵\n', smsText);
      sent = true; // 로컬: 스킵을 성공으로 처리
    }

    db.query(
      `INSERT INTO dt_events (event_name, params) VALUES ($1, $2)`,
      ['voyage_notify_sent', { booking_id: id, phone: booking.phone, sent, error }]
    ).catch(() => {});

    return res.json({ ok: sent, booking_id: id, error: error ?? undefined });
  } catch (e) {
    console.error('[voyageAdmin] notify error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── POST /bookings/:id/cancel ─────────────────────────────────────────
router.post('/bookings/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body ?? {};

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [booking] } = await client.query(
      `SELECT id, wish_id, status FROM voyage_bookings WHERE id = $1`, [id]
    );
    if (!booking)                   throw Object.assign(new Error('예약 없음'), { status: 404 });
    if (booking.status === 'cancelled')
      throw Object.assign(new Error('이미 취소된 예약'), { status: 409 });
    if (booking.status === 'checked_in')
      throw Object.assign(new Error('체크인 완료 예약은 취소 불가 — 수동 처리 필요'), { status: 400 });

    await client.query(
      `UPDATE voyage_bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    // 소원 상태를 draft_created로 복귀 (재예약 가능)
    await client.query(
      `UPDATE voyage_wishes SET status = 'draft_created', updated_at = NOW() WHERE id = $1`,
      [booking.wish_id]
    );

    await client.query('COMMIT');

    db.query(
      `INSERT INTO dt_events (event_name, params) VALUES ($1, $2)`,
      ['voyage_cancelled', { booking_id: id, wish_id: booking.wish_id, reason: reason ?? null }]
    ).catch(() => {});

    return res.json({ ok: true, booking_id: id, status: 'cancelled' });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(e.status ?? 500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
