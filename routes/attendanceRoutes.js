/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Attendance Routes — Living Wisdom 출석 API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Endpoints:
 *   POST /api/attendance/ping   — 출석 이벤트 기록 (open / pay_success)
 *   GET  /api/attendance/state  — 유저 체온/스트릭 조회
 *
 * Auth: x-api-key 헤더 (RENDER_LW_API_KEY 환경변수)
 *
 * @since 2026-02-14
 */

const express = require('express');
const router = express.Router();

// ─────────────────────────────────────────────────────
// 의존성 (tolerant loading)
// ─────────────────────────────────────────────────────
let attendanceService = null;
try {
  attendanceService = require('../services/attendanceService');
  console.log('✅ Attendance 서비스 로드 성공');
} catch (error) {
  console.error('❌ Attendance 서비스 로드 실패:', error.message);
}

// ─────────────────────────────────────────────────────
// API Key 검증 미들웨어
// ─────────────────────────────────────────────────────
const LW_API_KEY = process.env.RENDER_LW_API_KEY;

function verifyApiKey(req, res, next) {
  if (!LW_API_KEY) {
    // 키 미설정 시 bypass (개발 환경)
    return next();
  }

  const key = req.headers['x-api-key'];
  if (!key || key !== LW_API_KEY) {
    return res.status(401).json({ ok: false, error: 'INVALID_API_KEY' });
  }
  next();
}

// ─────────────────────────────────────────────────────
// POST /api/attendance/ping
// ─────────────────────────────────────────────────────
router.post('/ping', verifyApiKey, async (req, res) => {
  if (!attendanceService) {
    return res.status(503).json({ ok: false, error: 'SERVICE_UNAVAILABLE' });
  }

  const { eventType, page, userId } = req.body;

  // userId 필수 (로그인 강제)
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'LOGIN_REQUIRED' });
  }

  // eventType 검증
  if (!eventType || !['open', 'pay_success'].includes(eventType)) {
    return res.status(400).json({ ok: false, error: 'INVALID_EVENT_TYPE' });
  }

  try {
    const result = await attendanceService.ping(userId, eventType, page);
    res.json(result);
  } catch (err) {
    console.error('❌ attendance/ping 오류:', err);
    res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

// ─────────────────────────────────────────────────────
// GET /api/attendance/state?userId=xxx
// ─────────────────────────────────────────────────────
router.get('/state', verifyApiKey, async (req, res) => {
  if (!attendanceService) {
    return res.status(503).json({ ok: false, error: 'SERVICE_UNAVAILABLE' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'LOGIN_REQUIRED' });
  }

  try {
    const state = await attendanceService.getState(userId);
    res.json({ ok: true, ...state });
  } catch (err) {
    console.error('❌ attendance/state 오류:', err);
    res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
