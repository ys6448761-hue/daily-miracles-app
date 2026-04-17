/**
 * promiseRoutes.js — 약속 기록 (Promise Records) API
 *
 * Base path: /api/promise
 *
 * POST /upload          → 사진 업로드 (public 외부, /api/promise/photo/:f 로 서빙)
 * GET  /photo/:filename → 사진 파일 서빙
 * POST /                → 기록 생성
 * GET  /list            → 내 기록 목록 (user_id 일치 체크)
 * GET  /:id/meta        → 잠금 상태 (내용 미포함)
 * POST /:id/open        → 열기 시도 — GPS(1순위) → 문자열 일치(2순위)
 *                         응답: LOCKED_LOCATION | LOCKED_TIME | OPEN
 *
 * 보안 원칙:
 *  - 사진 파일: uploads/ (public 외부) → URL 직접 접근 불가
 *  - 위치 검증: DB location_id × 서버사이드 좌표 × GPS 거리 (조작 차단)
 *  - user_id: list 조회 시 일치 체크 / open은 위치 잠금이 인증
 */

'use strict';

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

// ── 서버사이드 장소 좌표 (조작 불가) ──────────────────────────────
// 현장 확인 후 좌표 보정 필요 (오차 ±50m 이내)
const LOCATION_COORDS = {
  'yeosu-cablecar':  { lat: 34.7487, lng: 127.7437, name: '여수 해상 케이블카' },
  'yeosu-aqua':      { lat: 34.7317, lng: 127.7417, name: '여수 아쿠아플라넷' },
  'yeosu-yacht':     { lat: 34.7413, lng: 127.7369, name: '여수 야경 요트' },
  'yeosu-odongdo':   { lat: 34.7264, lng: 127.7456, name: '여수 오동도' },
  'yeosu-hyangiram': { lat: 34.6819, lng: 127.7895, name: '향일암' },
};

// 위치 검증 반경 (env로 조정 가능)
const PROMISE_RADIUS_M = parseInt(process.env.PROMISE_RADIUS_M || '200', 10);

// ── Haversine 거리 계산 (미터) ────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlam = ((lng2 - lng1) * Math.PI) / 180;
  const a    = Math.sin(dphi / 2) ** 2
             + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── 사진 업로드 설정 (public 외부 — 직접 URL 접근 차단) ──────────
const photoDir = path.join(process.cwd(), 'uploads', 'promise-photos');
if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });

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
  // URL은 /api/promise/photo/{filename} — 직접 public 노출 없음
  const photo_url = `/api/promise/photo/${req.file.filename}`;
  res.json({ success: true, photo_url });
});

// ── GET /photo/:filename — 사진 서빙 (uploads/ → 스트림) ──────────
router.get('/photo/:filename', (req, res) => {
  // 경로 탐색(path traversal) 방어: basename만 허용
  const filename = path.basename(req.params.filename);
  const filePath = path.join(photoDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: '파일을 찾을 수 없어요' });
  }

  // 다운로드 강제 방지 — inline 표시 (img 태그용)
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.sendFile(filePath);
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

// ── GET /list — 목록 (user_id 일치 체크) ─────────────────────────
router.get('/list', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, error: 'user_id 필요' });

    const result = await db.query(
      `SELECT id, location_id, emotion_text, photo_url,
              status, open_at, created_at, opened_at, opened_count
       FROM promise_records
       WHERE user_id = $1          -- ③ user_id 일치 체크
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
      success:       true,
      id:            rec.id,
      location_id:   rec.location_id,
      status:        rec.status,
      open_at:       rec.open_at,
      created_at:    rec.created_at,
      time_unlocked: timeOk,
      days_left:     timeOk ? 0 : Math.ceil((new Date(rec.open_at).getTime() - now) / 86400000),
      opened_count:  rec.opened_count ?? 0,
      ever_opened:   !!rec.first_opened_at,
    });
  } catch (e) {
    console.error('GET /api/promise/:id/meta error:', e.message);
    res.status(500).json({ success: false, error: '상태 조회 실패' });
  }
});

// ── POST /:id/open — 열기 시도 ──────────────────────────────────────
// body: { user_id, location_id(현재), lat?, lng? }
//
// 위치 검증 우선순위:
//   1순위: GPS 거리 (클라이언트 lat/lng + 서버사이드 좌표 → haversine)
//   2순위: location_id 문자열 일치 (GPS 없을 때 fallback)
//   → 서버가 LOCATION_COORDS를 갖고 있어 location_id 조작 의미 없음
router.post('/:id/open', async (req, res) => {
  try {
    const { user_id, location_id: current_loc, lat, lng } = req.body;

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

    // ── 1. 시간 잠금 (시간 미도달 시 위치 체크 없이 반환) ──────────
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

    // ── 2. 위치 잠금 ────────────────────────────────────────────────
    const knownCoords = LOCATION_COORDS[rec.location_id];

    // 2-A. GPS 검증 (1순위) — 클라이언트 GPS + 서버 좌표로 거리 계산
    if (knownCoords && lat != null && lng != null) {
      const distM = Math.round(haversine(knownCoords.lat, knownCoords.lng, lat, lng));
      if (distM > PROMISE_RADIUS_M) {
        console.log(`[promise] 위치 잠금(GPS) | id=${rec.id} | dist=${distM}m | radius=${PROMISE_RADIUS_M}m`);
        return res.json({
          success:     true,
          lock_state:  'LOCKED_LOCATION',
          message:     '이곳에서만 열립니다',
          distance_m:  distM,
          radius_m:    PROMISE_RADIUS_M,
          location_id: rec.location_id,
          created_at:  rec.created_at,
          open_at:     rec.open_at,
        });
      }
      // GPS 통과 → 개봉
    } else {
      // 2-B. 문자열 일치 (2순위 fallback — GPS 없을 때)
      // 클라이언트가 loc 파라미터를 보내지 않으면 잠금 유지
      if (!current_loc || rec.location_id !== current_loc) {
        console.log(`[promise] 위치 잠금(str) | id=${rec.id} | db=${rec.location_id} | req=${current_loc || '없음'}`);
        return res.json({
          success:     true,
          lock_state:  'LOCKED_LOCATION',
          message:     '이곳에서만 열립니다',
          location_id: rec.location_id,
          created_at:  rec.created_at,
          open_at:     rec.open_at,
        });
      }
    }

    // ── 3. 개봉 ──────────────────────────────────────────────────────
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
      success:           true,
      lock_state:        'OPEN',
      is_first_open:     isFirst,
      id:                rec.id,
      location_id:       rec.location_id,
      emotion_text:      rec.emotion_text,
      message_to_future: rec.message_to_future,
      photo_url:         rec.photo_url,
      created_at:        rec.created_at,
      open_at:           rec.open_at,
      opened_count:      (rec.opened_count ?? 0) + 1,
    });
  } catch (e) {
    console.error('POST /api/promise/:id/open error:', e.message);
    res.status(500).json({ success: false, error: '기록 열기 실패' });
  }
});

module.exports = router;
