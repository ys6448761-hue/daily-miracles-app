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

// ── Aurora5 코멘트 — emotion_text 키워드 기반 동적 생성 ──────────────
// 조회마다 msgs 배열에서 랜덤 선택 → 동일 데이터 재조회 시 변경됨
const AURORA5_MAP = [
  { kw: ['용기', '두렵', '무서', '겁나', '도전', '시작하', '바꾸', '이루'],
    msgs: [
      '용기는 갑자기 생기는 힘이 아니라,\n작은 한 걸음을 선택할 때 조용히 피어나는 마음이에요.',
      '두려움과 함께 내딛은 첫 걸음,\n그것이 이미 가장 큰 용기예요.',
    ] },
  { kw: ['사랑', '좋아', '연인', '고백', '관계', '그 사람'],
    msgs: [
      '사랑은 완벽한 순간을 기다리는 게 아니에요.\n지금 이 마음을 솔직히 내보이는 것에서 시작돼요.',
      '이 마음을 꺼낸 것만으로도,\n이미 충분히 용감한 거예요.',
    ] },
  { kw: ['건강', '몸', '아프', '아파', '병', '회복'],
    msgs: [
      '몸이 보내는 신호에 귀 기울이는 것,\n그것도 자신을 사랑하는 방법이에요.',
      '지금 이 순간 쉬어가는 것도\n앞으로 나아가는 방법이에요.',
    ] },
  { kw: ['돈', '직업', '취업', '직장', '성공', '꿈', '열고', '카페', '가게', '창업'],
    msgs: [
      '원하는 것에 가까워지는 길은\n오늘 할 수 있는 가장 작은 것부터 시작돼요.',
      '이 마음을 봉인한 오늘이,\n그 꿈의 첫 번째 페이지예요.',
    ] },
  { kw: ['가족', '부모', '엄마', '아빠', '형', '언니', '동생', '남편', '아내'],
    msgs: [
      '가장 가까운 마음이 때로 가장 어렵죠.\n그 마음을 꺼낸 것만으로도 충분히 용감해요.',
      '이 마음이 전해지길,\nAurora5가 함께 바라고 있어요.',
    ] },
  { kw: ['여행', '떠나', '새로', '변화', '바다', '케이블카', '여수'],
    msgs: [
      '새로운 곳으로 나아가려는 마음,\nAurora5가 이 별과 함께 그 길을 바라고 있어요.',
      '여수에서 시작된 이 마음,\n오랫동안 기억될 거예요.',
    ] },
  { kw: ['외로', '혼자', '쓸쓸', '힘들', '지쳐', '지침', '쉬고'],
    msgs: [
      '지금 이 마음을 꺼낸 것이 시작이에요.\n혼자가 아니라는 걸, 이 기록이 기억해줄 거예요.',
      '지쳐있을 때도 이 마음을 담은 당신,\n그것만으로 이미 충분해요.',
    ] },
  { kw: ['감사', '고마', '행복', '기쁘', '소중', '사랑해'],
    msgs: [
      '이 감사함이 봉인된 오늘,\n시간이 지나도 빛날 거예요.',
      '기쁜 마음을 기록으로 남긴 것,\n미래의 당신에게 큰 선물이 될 거예요.',
    ] },
];

const AURORA5_DEFAULTS = [
  '여수에서 남긴 이 마음,\nAurora5가 함께 기억하고 있어요.',
  '이 순간을 봉인한 당신,\n미래의 자신에게 보내는 가장 솔직한 편지예요.',
  '작은 결심 하나가\n큰 변화의 시작이 되기도 해요.',
];

function getAuroraComment(text = '') {
  if (text) {
    for (const entry of AURORA5_MAP) {
      if (entry.kw.some(k => text.includes(k))) {
        return entry.msgs[Math.floor(Math.random() * entry.msgs.length)];
      }
    }
  }
  return AURORA5_DEFAULTS[Math.floor(Math.random() * AURORA5_DEFAULTS.length)];
}

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
    console.log('[promise] POST body:', JSON.stringify(req.body));
    const {
      user_id, location_id, emotion_text,
      message_to_future = null,
      photo_url    = null,
      created_lat  = null,
      created_lng  = null,
      open_at,
    } = req.body;

    if (!user_id)      return res.status(400).json({ success: false, error: 'user_id 필요' });
    if (!emotion_text) return res.status(400).json({ success: false, error: 'emotion_text 필요' });
    const resolvedLocationId = location_id || 'yeosu-cablecar';

    const openAt = open_at
      ? new Date(open_at)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // INSERT — aurora_comment 제외 (migration 139 미적용 환경 대비)
    const result = await db.query(
      `INSERT INTO promise_records
         (user_id, location_id, emotion_text, message_to_future,
          photo_url, created_lat, created_lng, status, open_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'SEALED', $8)
       RETURNING id, status, open_at, created_at`,
      [
        user_id, resolvedLocationId, emotion_text, message_to_future,
        photo_url, created_lat, created_lng, openAt,
      ]
    );

    const row = result.rows[0];
    console.log(`[promise] 생성 | id=${row.id} | loc=${resolvedLocationId} | user=${user_id}`);

    // aurora_comment 별도 저장 (migration 139 컬럼 없으면 graceful skip)
    const generatedComment = getAuroraComment(emotion_text);
    let savedComment = null;
    try {
      await db.query(
        `UPDATE promise_records SET aurora_comment = $1 WHERE id = $2`,
        [generatedComment, row.id]
      );
      savedComment = generatedComment;
    } catch (auroraErr) {
      console.warn('[promise] aurora_comment 저장 skip (migration 139 미적용?):', auroraErr.message);
    }

    res.json({
      success:        true,
      promise_id:     row.id,
      status:         row.status,
      open_at:        row.open_at,
      created_at:     row.created_at,
      aurora_comment: savedComment,
    });
  } catch (e) {
    console.error('POST /api/promise error:', e.message, e.stack);
    res.status(500).json({ success: false, error: `저장 실패: ${e.message}` });
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

// ── GET /create — 정적 경로 가드 (/:id 계열보다 반드시 위) ──────────
// 'create'가 /:id/meta 로 매칭되어 UUID 파싱 오류(500) 발생하는 것을 차단
router.get('/create', (_req, res) => {
  res.status(405).json({ success: false, error: '기록 생성은 POST /api/promise 를 사용하세요' });
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
              photo_url, status, open_at, created_at, first_opened_at, opened_count,
              aurora_comment
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
      aurora_comment:    rec.aurora_comment ?? getAuroraComment(rec.emotion_text),
    });
  } catch (e) {
    console.error('POST /api/promise/:id/open error:', e.message);
    res.status(500).json({ success: false, error: '기록 열기 실패' });
  }
});

module.exports = router;
