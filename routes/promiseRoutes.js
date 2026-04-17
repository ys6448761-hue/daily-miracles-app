/**
 * promiseRoutes.js — 약속 기록 (Promise Records) API
 *
 * Base path: /api/promise
 *
 * POST /upload        → 사진 업로드
 * POST /              → 기록 생성 (location_id + GPS + emotion_text + message_to_future)
 * GET  /list          → 내 기록 목록
 * GET  /:id/meta      → 잠금 상태만 (내용 미포함)
 * POST /:id/open      → 열기 시도 (LOCKED_LOCATION | LOCKED_TIME | OPEN)
 */

const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer   = require('multer');

let db;
try {
  db = require('../database/db');
} catch (e) {
  console.error('❌ promiseRoutes: DB 로드 실패', e.message);
}

// ── 사진 업로드 설정 ────────────────────────────────────────────────
const photoDir = path.join(process.cwd(), 'public', 'promise-photos');
if (!fs.existsSync(photoDir)) {
  fs.mkdirSync(photoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, photoDir),
  filename:    (_req,  file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('이미지 파일만 업로드할 수 있어요'), ok);
  },
});

// ── POST /upload ────────────────────────────────────────────────────
router.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '파일이 없습니다' });
  res.json({ success: true, photo_url: `/promise-photos/${req.file.filename}` });
});

// ── POST / — 기록 생성 ────────────────────────────────────────────
// body: { user_id, location_id, emotion_text, message_to_future?,
//         photo_url?, created_lat?, created_lng?, open_at? }
router.post('/', async (req, res) => {
  try {
    const {
      user_id, location_id, emotion_text,
      message_to_future = null,
      photo_url    = null,
      created_lat  = null,
      created_lng  = null,
      open_at,
    } = req.body;

    if (!user_id)      return res.status(400).json({ success: false, error: 'user_id 필요' });
    if (!location_id)  return res.status(400).json({ success: false, error: 'location_id 필요' });
    if (!emotion_text) return res.status(400).json({ success: false, error: 'emotion_text 필요' });

    const openAt = open_at
      ? new Date(open_at)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `INSERT INTO promise_records
         (user_id, location_id, emotion_text, message_to_future,
          photo_url, created_lat, created_lng, status, open_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'SEALED', $8)
       RETURNING id, status, open_at, created_at`,
      [
        user_id, location_id, emotion_text, message_to_future,
        photo_url, created_lat, created_lng, openAt,
      ]
    );

    const row = result.rows[0];
    console.log(`[promise] 생성 | id=${row.id} | loc=${location_id} | user=${user_id}`);
    res.json({
      success:    true,
      promise_id: row.id,
      status:     row.status,
      open_at:    row.open_at,
      created_at: row.created_at,
    });
  } catch (e) {
    console.error('POST /api/promise error:', e.message);
    res.status(500).json({ success: false, error: '저장 실패' });
  }
});

// ── GET /list — 목록 ────────────────────────────────────────────────
router.get('/list', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, error: 'user_id 필요' });

    const result = await db.query(
      `SELECT id, location_id, emotion_text, photo_url,
              status, open_at, created_at, opened_at, opened_count
       FROM promise_records
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    const now = Date.now();
    const records = result.rows.map(r => {
      const canOpen = new Date(r.open_at).getTime() <= now;
      return {
        ...r,
        lock_state: r.status === 'OPEN'
          ? 'OPEN'
          : canOpen ? 'READY' : 'LOCKED_TIME',
        days_left: r.status !== 'OPEN' && !canOpen
          ? Math.ceil((new Date(r.open_at).getTime() - now) / 86400000)
          : 0,
      };
    });

    res.json({ success: true, records });
  } catch (e) {
    console.error('GET /api/promise/list error:', e.message);
    res.status(500).json({ success: false, error: '목록 조회 실패' });
  }
});

// ── GET /:id/meta — 잠금 상태 (내용 미포함) ─────────────────────────
router.get('/:id/meta', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, location_id, status, open_at, created_at,
              first_opened_at, opened_count
       FROM promise_records WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: '기록을 찾을 수 없어요' });
    }
    const rec = result.rows[0];
    const now = Date.now();
    const timeOk = new Date(rec.open_at).getTime() <= now;

    res.json({
      success:         true,
      id:              rec.id,
      location_id:     rec.location_id,
      status:          rec.status,
      open_at:         rec.open_at,
      created_at:      rec.created_at,
      time_unlocked:   timeOk,
      days_left:       timeOk ? 0 : Math.ceil((new Date(rec.open_at).getTime() - now) / 86400000),
      opened_count:    rec.opened_count ?? 0,
      ever_opened:     !!rec.first_opened_at,
    });
  } catch (e) {
    console.error('GET /api/promise/:id/meta error:', e.message);
    res.status(500).json({ success: false, error: '상태 조회 실패' });
  }
});

// ── POST /:id/open — 열기 시도 ────────────────────────────────────
// body: { user_id, location_id (현재 장소) }
router.post('/:id/open', async (req, res) => {
  try {
    const { user_id, location_id: current_loc } = req.body;

    const result = await db.query(
      `SELECT id, user_id, location_id, emotion_text, message_to_future,
              photo_url, status, open_at, created_at, first_opened_at, opened_count
       FROM promise_records WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: '기록을 찾을 수 없어요' });
    }
    const rec = result.rows[0];

    // 1. 위치 잠금
    if (current_loc && rec.location_id !== current_loc) {
      return res.json({
        success:     true,
        lock_state:  'LOCKED_LOCATION',
        message:     '이곳에서만 열립니다',
        location_id: rec.location_id,
        created_at:  rec.created_at,
        open_at:     rec.open_at,
      });
    }

    // 2. 시간 잠금
    const now = Date.now();
    if (new Date(rec.open_at).getTime() > now) {
      const daysLeft = Math.ceil((new Date(rec.open_at).getTime() - now) / 86400000);
      return res.json({
        success:     true,
        lock_state:  'LOCKED_TIME',
        message:     `${daysLeft}일 후에 열립니다`,
        days_left:   daysLeft,
        open_at:     rec.open_at,
        created_at:  rec.created_at,
        location_id: rec.location_id,
      });
    }

    // 3. 개봉 ── opened_count 증가, 최초 시 first_opened_at 기록
    const isFirst = !rec.first_opened_at;
    await db.query(
      `UPDATE promise_records
       SET status          = 'OPEN',
           opened_count    = opened_count + 1,
           first_opened_at = COALESCE(first_opened_at, NOW()),
           opened_at       = NOW()
       WHERE id = $1`,
      [rec.id]
    ).catch(() => {});

    console.log(`[promise] 개봉 | id=${rec.id} | first=${isFirst} | count=${(rec.opened_count ?? 0) + 1}`);

    res.json({
      success:          true,
      lock_state:       'OPEN',
      is_first_open:    isFirst,
      id:               rec.id,
      location_id:      rec.location_id,
      emotion_text:     rec.emotion_text,
      message_to_future: rec.message_to_future,
      photo_url:        rec.photo_url,
      created_at:       rec.created_at,
      open_at:          rec.open_at,
      opened_count:     (rec.opened_count ?? 0) + 1,
    });
  } catch (e) {
    console.error('POST /api/promise/:id/open error:', e.message);
    res.status(500).json({ success: false, error: '기록 열기 실패' });
  }
});

module.exports = router;
