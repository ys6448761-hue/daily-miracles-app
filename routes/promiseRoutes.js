/**
 * promiseRoutes.js — 약속 기록 (Promise Records) API
 *
 * Base path: /api/promise
 *
 * POST /upload              → 사진 업로드 (multer)
 * POST /                    → 기록 생성
 * GET  /list                → 내 기록 목록
 * GET  /:id                 → 기록 열기 (LOCKED_LOCATION | LOCKED_TIME | OPEN)
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
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error('이미지 파일만 업로드할 수 있어요'), ok);
  },
});

// ── POST /upload ────────────────────────────────────────────────────
router.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '파일이 없습니다' });
  }
  const photo_url = `/promise-photos/${req.file.filename}`;
  res.json({ success: true, photo_url });
});

// ── POST / ─────────────────────────────────────────────────────────
// body: { user_id, location_id, emotion_text, photo_url?, open_at? }
router.post('/', async (req, res) => {
  try {
    const { user_id, location_id, emotion_text, photo_url, open_at } = req.body;

    if (!user_id)      return res.status(400).json({ success: false, error: 'user_id 필요' });
    if (!location_id)  return res.status(400).json({ success: false, error: 'location_id 필요' });
    if (!emotion_text) return res.status(400).json({ success: false, error: 'emotion_text 필요' });

    const openAt = open_at
      ? new Date(open_at)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90일 후

    const result = await db.query(
      `INSERT INTO promise_records
         (user_id, location_id, emotion_text, photo_url, status, open_at)
       VALUES ($1, $2, $3, $4, 'SEALED', $5)
       RETURNING id, status, open_at, created_at`,
      [user_id, location_id, emotion_text, photo_url || null, openAt]
    );

    const row = result.rows[0];
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

// ── GET /list ──────────────────────────────────────────────────────
// query: user_id
router.get('/list', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, error: 'user_id 필요' });

    const result = await db.query(
      `SELECT id, location_id, emotion_text, photo_url, status, open_at, created_at, opened_at
       FROM promise_records
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    // 각 기록의 lock 상태 계산
    const now = Date.now();
    const records = result.rows.map(r => {
      const canOpen = new Date(r.open_at).getTime() <= now;
      return {
        ...r,
        lock_state: r.status === 'SEALED'
          ? (canOpen ? 'READY' : 'LOCKED_TIME')
          : 'OPEN',
        days_left: r.status === 'SEALED' && !canOpen
          ? Math.ceil((new Date(r.open_at).getTime() - now) / (24 * 60 * 60 * 1000))
          : 0,
      };
    });

    res.json({ success: true, records });
  } catch (e) {
    console.error('GET /api/promise/list error:', e.message);
    res.status(500).json({ success: false, error: '목록 조회 실패' });
  }
});

// ── GET /:id ────────────────────────────────────────────────────────
// query: user_id, location_id (현재 위치의 location_id)
// 응답: LOCKED_LOCATION | LOCKED_TIME | OPEN
router.get('/:id', async (req, res) => {
  try {
    const { id }          = req.params;
    const { user_id, location_id: current_location } = req.query;

    const result = await db.query(
      `SELECT id, user_id, location_id, emotion_text, photo_url,
              status, open_at, created_at, opened_at
       FROM promise_records WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '기록을 찾을 수 없어요' });
    }

    const rec = result.rows[0];

    // 1. 위치 확인
    if (current_location && rec.location_id !== current_location) {
      return res.json({
        success:    true,
        lock_state: 'LOCKED_LOCATION',
        message:    '이곳에서만 열립니다',
        location_id: rec.location_id,
        created_at: rec.created_at,
        open_at:    rec.open_at,
      });
    }

    // 2. 시간 확인
    const now = Date.now();
    if (new Date(rec.open_at).getTime() > now) {
      const daysLeft = Math.ceil(
        (new Date(rec.open_at).getTime() - now) / (24 * 60 * 60 * 1000)
      );
      return res.json({
        success:    true,
        lock_state: 'LOCKED_TIME',
        message:    `${daysLeft}일 후에 열립니다`,
        days_left:  daysLeft,
        open_at:    rec.open_at,
        created_at: rec.created_at,
        location_id: rec.location_id,
      });
    }

    // 3. 개봉 — 처음이면 opened_at 기록
    let firstOpened = false;
    if (!rec.opened_at) {
      firstOpened = true;
      await db.query(
        `UPDATE promise_records SET status='OPEN', opened_at = NOW() WHERE id = $1`,
        [id]
      );
    }

    res.json({
      success:     true,
      lock_state:  'OPEN',
      first_open:  firstOpened,
      id:          rec.id,
      location_id: rec.location_id,
      emotion_text: rec.emotion_text,
      photo_url:   rec.photo_url,
      created_at:  rec.created_at,
      open_at:     rec.open_at,
      opened_at:   rec.opened_at || new Date().toISOString(),
    });
  } catch (e) {
    console.error('GET /api/promise/:id error:', e.message);
    res.status(500).json({ success: false, error: '기록 열기 실패' });
  }
});

module.exports = router;
