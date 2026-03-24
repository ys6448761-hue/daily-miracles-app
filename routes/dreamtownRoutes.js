/**
 * DreamTown API Routes — P0
 *
 * POST /api/dt/wishes              소원 생성
 * POST /api/dt/stars/create        별 생성 (wish → star)
 * GET  /api/dt/stars/:id           내 별 조회
 * GET  /api/dt/galaxies            은하 목록
 * GET  /api/dt/galaxies/:code      은하 상세 + constellations + stories
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const fs = require('fs');
const path = require('path');
const { classifyWish, notifyRedSignal } = require('../services/safetyFilter');

// ── 044 startup migration (기적 은하 추가) — PostgreSQL 환경에서만 실행 ──
if (process.env.DATABASE_URL) {
  try {
    const INSERT_MIRACLE = `
      INSERT INTO dt_galaxies (code, name_ko, name_en, direction, description, sort_order)
      VALUES ('miracle','기적 은하','Miracle Galaxy','중심','하나의 은하에 담기지 않는 가장 순수하고 간절한 소원',5)
      ON CONFLICT (code) DO NOTHING;
    `;
    const UPDATE_DIAMOND = `
      UPDATE dt_stars
      SET galaxy_id = (SELECT id FROM dt_galaxies WHERE code = 'miracle')
      WHERE galaxy_id = (SELECT id FROM dt_galaxies WHERE code = 'growth')
        AND id IN (
          SELECT s.id FROM dt_stars s
          JOIN dt_wishes w ON s.wish_id = w.id
          WHERE w.gem_type = 'diamond'
        );
    `;
    db.query(INSERT_MIRACLE)
      .then(() => db.query(UPDATE_DIAMOND))
      .then(() => console.log('[Migration] 044_add_miracle_galaxy 완료'))
      .catch(err => console.log('[Migration] 044 스킵:', err.message));
  } catch (err) {
    console.log('[Migration] 044 초기화 실패 (서버 계속 실행):', err.message);
  }
}
const { emitKpiEvent, KPI_EVENTS, isConnectionCompleted, hasResonanceReceived } = require('../services/kpiEventEmitter');
const { sendSensSMS } = require('../services/messageProvider');
const { buildScheduleItems } = require('../services/voyageScheduleMessages');

// ── 별 이름 자동 생성 (인디언 작명법, AI 없음) ──────────────────────
// 형식: [자연어] + [을/를] + [행동어] + 별  (50 × 40 = 2000 조합)
const NATURE_WORDS = [
  '바람',     '새벽',     '노을',     '햇살',     '빛',
  '별빛',     '밤',       '구름',     '하늘',     '숲',
  '길',       '파도',     '비',       '강',       '꽃',
  '들판',     '산',       '바다',     '달빛',     '아침',
  '저녁',     '이슬',     '물결',     '햇빛',     '은하',
  '별무리',   '달',       '바람결',   '물빛',     '솔바람',  // 구름길 → 솔바람
  '밤하늘',   '별하늘',   '갯바람',   '숲길',     '은빛',    // 파도결 → 갯바람
  '별바다',   '달그림자', '바람노래', '새벽길',   '노을빛',
  '안개',     '별구름',   '물안개',   '여울',     '달무리',  // 비구름→안개, 별강→여울, 달노을→달무리
  '별이슬',   '새소리',   '달빛길',   '별안개',   '햇살빛',
];
const ACTION_WORDS = [
  '걷는',       '기다리는', '깨우는',     '비추는',   '건너온',
  '찾아온',     '머무는',   '흐르는',     '품은',     '지키는',
  '안아주는',   '따르는',   '담은',       '빛나는',   '깨어나는',
  '만나는',     '이어주는', '일렁이는',   '건너가는', '들려주는',  // 흔드는 → 일렁이는
  '속삭이는',   '반짝이는', '지나가는',   '피어나는', '흘러가는',
  '감싸는',     '이끄는',   '떠오르는',   '지켜보는', '이어오는',  // 불러오는 → 이어오는
  '물들이는',   '밝히는',   '스미는',     '잠드는',   '향하는',    // 깊어지는→물들이는, 닿아오는→스미는
  '돌아온',     '찾은',     '간직한',     '열어주는', '숨쉬는',    // 담아내는→간직한, 보여주는→열어주는
];
const FALLBACK_NAMES = ['조용히 빛나는 별', '첫 빛을 품은 별'];

// 한국어 받침 여부로 을/를 자동 선택
function getParticle(word) {
  const code = word.charCodeAt(word.length - 1) - 44032;
  return (code >= 0 && code % 28 !== 0) ? '을' : '를';
}

// index → 이름 문자열
function buildStarName(index) {
  const total = NATURE_WORDS.length * ACTION_WORDS.length;
  const i = ((index % total) + total) % total;
  const nature = NATURE_WORDS[Math.floor(i / ACTION_WORDS.length)];
  const action = ACTION_WORDS[i % ACTION_WORDS.length];
  // 예외: 여울(idx 43) + 물들이는(idx 30) 조합은 별도 이름
  if (nature === '여울' && action === '물들이는') return '여울에 깃든 별';
  return `${nature}${getParticle(nature)} ${action} 별`;
}

// wish_id 기반 결정론적 선택 + 전역 중복 체크
async function makeStarName(wishId, dbConn) {
  try {
    const hex = String(wishId).replace(/-/g, '').slice(0, 8);
    const baseIndex = parseInt(hex, 16);
    if (isNaN(baseIndex)) return FALLBACK_NAMES[0];

    const total = NATURE_WORDS.length * ACTION_WORDS.length;
    for (let offset = 0; offset < total; offset++) {
      const name = buildStarName(baseIndex + offset);
      const dup = await dbConn.query(
        'SELECT id FROM dt_stars WHERE star_name = $1 LIMIT 1', [name]
      );
      if (dup.rowCount === 0) return name;
    }
    // 195개 모두 사용됨 (매우 희박) → fallback
    return FALLBACK_NAMES[baseIndex % FALLBACK_NAMES.length];
  } catch {
    return '첫 빛을 품은 별';
  }
}

// gem_type → galaxy code 분류표
const GEM_GALAXY_MAP = {
  ruby:      'challenge',
  sapphire:  'growth',
  emerald:   'healing',
  diamond:   'growth',
  citrine:   'relationship',
};

// ─────────────────────────────────────────────
// POST /api/dt/wishes — 소원 생성
// ─────────────────────────────────────────────
router.post('/wishes', async (req, res) => {
  console.log('[DT] POST /wishes 진입 | body:', JSON.stringify(req.body));
  try {
    const { user_id, wish_text, gem_type, yeosu_theme } = req.body;

    if (!user_id || !wish_text || !gem_type) {
      return res.status(400).json({ error: 'user_id, wish_text, gem_type 필수' });
    }

    const validGems = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];
    if (!validGems.includes(gem_type)) {
      return res.status(400).json({ error: `gem_type은 ${validGems.join('/')} 중 하나여야 합니다` });
    }

    // ── 안전 필터 (신호등) ──────────────────────────────────────────
    const safety = classifyWish(wish_text);

    if (safety.level === 'RED') {
      // RED: DB 저장 안 함, 운영 알림 발송, 케어 메시지 반환
      notifyRedSignal('dreamtown', wish_text, safety.reason).catch(() => {});
      console.warn('[DT] RED signal — wish blocked:', safety.reason);
      return res.status(200).json({
        ok:           false,
        safety:       'RED',
        care_message: '지금 많이 힘드신가요? 이 소원은 별로 만들어지지 않았어요. 혼자 감당하기 어려운 마음이라면 가까운 사람이나 전문 상담(☎️ 1393)에 연락해보세요.',
      });
    }

    // user 없으면 자동 생성 (Prototype: 게스트 허용)
    let userId = user_id;
    const userCheck = await db.query('SELECT id FROM dt_users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      const newUser = await db.query(
        'INSERT INTO dt_users (id, nickname) VALUES ($1, $2) RETURNING id',
        [userId, 'Guest']
      );
      userId = newUser.rows[0].id;
    }

    const result = await db.query(
      `INSERT INTO dt_wishes (user_id, wish_text, gem_type, yeosu_theme, status, safety_level)
       VALUES ($1, $2, $3, $4, 'submitted', $5)
       RETURNING id, status, safety_level`,
      [userId, wish_text, gem_type, yeosu_theme || null, safety.level]
    );

    const wish = result.rows[0];
    if (safety.level === 'YELLOW') {
      console.warn('[DT] YELLOW signal — wish saved with safety flag:', safety.reason);
    }
    res.status(201).json({ wish_id: wish.id, status: wish.status, safety: wish.safety_level });

  } catch (err) {
    console.error('[DT] POST /wishes error:', err.message, '| code:', err.code, '| stack:', err.stack?.split('\n')[1]);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/stars/create — 별 생성
// ─────────────────────────────────────────────
router.post('/stars/create', async (req, res) => {
  console.log('[DT] POST /stars/create 진입 | body:', JSON.stringify(req.body));
  try {
    const { wish_id, user_id, phone_number } = req.body;

    if (!wish_id || !user_id) {
      return res.status(400).json({ error: 'wish_id, user_id 필수' });
    }

    // 소원 조회
    const wishResult = await db.query(
      'SELECT * FROM dt_wishes WHERE id = $1 AND user_id = $2',
      [wish_id, user_id]
    );
    if (wishResult.rowCount === 0) {
      return res.status(404).json({ error: '소원을 찾을 수 없습니다' });
    }
    const wish = wishResult.rows[0];

    // galaxy 분류
    const galaxyCode = GEM_GALAXY_MAP[wish.gem_type] || 'growth';
    const galaxyResult = await db.query(
      'SELECT id, code FROM dt_galaxies WHERE code = $1',
      [galaxyCode]
    );
    if (galaxyResult.rowCount === 0) {
      return res.status(500).json({ error: '은하 데이터 없음 — seed 데이터를 확인하세요' });
    }
    const galaxy = galaxyResult.rows[0];

    // star_seed 생성
    const seedName = `${wish.wish_text.slice(0, 10)} 씨앗`;
    const seedResult = await db.query(
      `INSERT INTO dt_star_seeds (wish_id, seed_name, seed_state)
       VALUES ($1, $2, 'promoted')
       RETURNING id`,
      [wish_id, seedName]
    );
    const seed = seedResult.rows[0];

    const starName = await makeStarName(wish_id, db);
    const starSlug = `star-${Date.now()}`;

    // YELLOW 소원 → 별도 is_hidden=true (광장 미노출)
    const isHidden = wish.safety_level === 'YELLOW';

    // star 생성
    const starResult = await db.query(
      `INSERT INTO dt_stars
         (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, star_stage, is_hidden)
       VALUES ($1, $2, $3, $4, $5, $6, 'day1', $7)
       RETURNING id, star_name, star_slug, star_stage, created_at`,
      [user_id, wish_id, seed.id, starName, starSlug, galaxy.id, isHidden]
    );
    const star = starResult.rows[0];

    // wish status 업데이트
    await db.query(
      "UPDATE dt_wishes SET status = 'converted_to_star' WHERE id = $1",
      [wish_id]
    );

    // ── 탄생 축하 SMS (phone_number 있을 때, 중복 방지) ─────────────
    if (phone_number) {
      // 중복 방지: aurora5_messages에 이미 탄생 메시지가 있는지 확인
      const dupCheck = await db.query(
        `SELECT id FROM aurora5_messages
          WHERE star_id = $1 AND message LIKE '%탄생했어요%'
          LIMIT 1`,
        [star.id]
      );

      if (dupCheck.rowCount === 0) {
        const smsText =
          `🌟 ${star.star_name}이 탄생했어요!\n\n` +
          `소원이님의 소원별이\n드림타운 우주에서 빛나기 시작했어요.\n\n` +
          `지금 내 별을 만나러 가볼까요? ✦\n→ https://app.dailymiracles.kr/dreamtown\n\n` +
          `하루하루의 기적 드림`;

        // SMS 발송 fire-and-forget
        sendSensSMS(phone_number, smsText).catch(e =>
          console.error('[DT] 탄생 SMS 발송 실패:', e.message)
        );

        // aurora5_messages 저장
        db.query(
          `INSERT INTO aurora5_messages (star_id, user_id, message, wisdom_tag)
           VALUES ($1, $2, $3, '실천')`,
          [star.id, user_id, smsText]
        ).catch(e => console.error('[DT] aurora5_messages 저장 실패:', e.message));
      } else {
        console.log('[DT] 탄생 SMS 중복 — star_id:', star.id);
      }
    }

    // ── D+1~7 항해 스케줄 자동 생성 (fire-and-forget) ───────────
    const scheduleItems = buildScheduleItems(galaxyCode);
    Promise.all(scheduleItems.map(item =>
      db.query(
        `INSERT INTO dt_voyage_schedule
           (star_id, user_id, phone_number, day_number, message_text, wisdom_tag, scheduled_at)
         VALUES ($1, $2, $3, $4, $5, $6,
           ((($7::timestamptz AT TIME ZONE 'Asia/Seoul')::date + $4::int * INTERVAL '1 day' + INTERVAL '8 hours') AT TIME ZONE 'Asia/Seoul'))
         ON CONFLICT (star_id, day_number) DO NOTHING`,
        [star.id, user_id, phone_number ?? null, item.dayNumber, item.message, item.tag, star.created_at]
      ).catch(e => console.error('[DT] voyage schedule insert 실패 day', item.dayNumber, e.message))
    )).catch(() => {});

    // ── KPI: star_created (서버 사이드 emit) ────────────────────
    emitKpiEvent({
      eventName:  KPI_EVENTS.STAR_CREATED,
      userId:     user_id,
      starId:     star.id,
      wishId:     wish_id,
      visibility: isHidden ? 'hidden' : 'public',
      safetyBand: wish.safety_level ?? 'GREEN',
      source:     'star_create_route',
      extra:      { galaxy: galaxyCode, gem_type: wish.gem_type },
    }).catch(() => {});

    res.status(201).json({
      star_id:              star.id,
      star_name:            star.star_name,
      star_slug:            star.star_slug,
      galaxy:               galaxyCode,
      constellation:        null,
      birth_scene_version:  'v1',
      star_stage:           star.star_stage,
    });

  } catch (err) {
    console.error('[DT] POST /stars/create error:', err.message, '| code:', err.code, '| stack:', err.stack?.split('\n')[1]);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/recent — 광장 최근 별 목록
// ─────────────────────────────────────────────
router.get('/stars/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
    const galaxy = req.query.galaxy ?? null; // 은하 필터 (optional)
    const result = await db.query(
      `SELECT s.id AS star_id, s.star_name, s.star_stage, s.created_at,
              g.code AS galaxy_code, g.name_ko AS galaxy_name_ko
         FROM dt_stars s
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE s.is_hidden = FALSE
          AND ($2::text IS NULL OR g.code = $2)
        ORDER BY s.created_at DESC
        LIMIT $1`,
      [limit, galaxy]
    );
    res.json({ stars: result.rows });
  } catch (err) {
    console.error('[DT] GET /stars/recent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/today — 오늘(KST) 탄생 별 (최대 3개)
// ─────────────────────────────────────────────
router.get('/stars/today', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id AS star_id, s.star_name, s.created_at,
              g.code AS galaxy_code, g.name_ko AS galaxy_name_ko
         FROM dt_stars s
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE s.is_hidden = FALSE
          AND s.created_at >= (NOW() AT TIME ZONE 'Asia/Seoul')::date AT TIME ZONE 'Asia/Seoul'
        ORDER BY s.created_at DESC
        LIMIT 3`
    );
    res.json({ stars: result.rows });
  } catch (err) {
    console.error('[DT] GET /stars/today error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id — 내 별 조회
// ─────────────────────────────────────────────
router.get('/stars/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         s.id              AS star_id,
         s.star_name,
         s.star_slug,
         s.star_stage,
         s.created_at,
         s.growth_log_text,
         w.wish_text,
         g.code            AS galaxy_code,
         g.name_ko         AS galaxy_name_ko
       FROM dt_stars s
       LEFT JOIN dt_wishes   w ON w.id = s.wish_id
       JOIN      dt_galaxies g ON g.id = s.galaxy_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }

    const row = result.rows[0];
    res.json({
      star_id:          row.star_id,
      star_name:        row.star_name,
      wish_text:        row.wish_text,
      growth_log_text:  row.growth_log_text ?? null,
      wish_image_url:   null,
      galaxy: {
        code:    row.galaxy_code,
        name_ko: row.galaxy_name_ko,
      },
      constellation: null,
      star_stage:    row.star_stage,
      created_at:    row.created_at,
    });

  } catch (err) {
    console.error('[DT] GET /stars/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/galaxies — 은하 목록
// ─────────────────────────────────────────────
router.get('/galaxies', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT code, name_ko, name_en, direction FROM dt_galaxies WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ galaxies: result.rows });
  } catch (err) {
    console.error('[DT] GET /galaxies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/galaxies/:code — 은하 상세
// ─────────────────────────────────────────────
router.get('/galaxies/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const galaxyResult = await db.query(
      'SELECT id, code, name_ko, name_en, direction, description FROM dt_galaxies WHERE code = $1 AND is_active = true',
      [code]
    );
    if (galaxyResult.rowCount === 0) {
      return res.status(404).json({ error: '은하를 찾을 수 없습니다' });
    }
    const galaxy = galaxyResult.rows[0];

    // constellations + stories (P1 테이블이 없으면 빈 배열 반환)
    let constellations = [];
    try {
      const constResult = await db.query(
        'SELECT id, code, name_ko, name_en FROM dt_constellations WHERE galaxy_id = $1',
        [galaxy.id]
      );
      for (const c of constResult.rows) {
        const storiesResult = await db.query(
          'SELECT id, title, story_text FROM dt_constellation_stories WHERE constellation_id = $1 LIMIT 5',
          [c.id]
        );
        constellations.push({ ...c, stories: storiesResult.rows });
      }
    } catch {
      // P1 테이블 미생성 시 graceful fallback
    }

    res.json({
      code:           galaxy.code,
      name_ko:        galaxy.name_ko,
      name_en:        galaxy.name_en,
      direction:      galaxy.direction,
      description:    galaxy.description,
      constellations,
    });

  } catch (err) {
    console.error('[DT] GET /galaxies/:code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/galaxies/:code/stars — 같은 은하 별 목록
// ─────────────────────────────────────────────
router.get('/galaxies/:code/stars', async (req, res) => {
  try {
    const { code } = req.params;
    const limit   = Math.min(parseInt(req.query.limit  ?? '5', 10), 20);
    const exclude = req.query.exclude ?? null;

    const galaxyResult = await db.query(
      'SELECT id FROM dt_galaxies WHERE code = $1 AND is_active = true',
      [code]
    );
    if (galaxyResult.rowCount === 0) {
      return res.status(404).json({ error: '은하를 찾을 수 없습니다' });
    }
    const galaxyId = galaxyResult.rows[0].id;

    let starsResult;
    if (exclude) {
      starsResult = await db.query(
        `SELECT id AS star_id, star_name, created_at
           FROM dt_stars
          WHERE galaxy_id = $1
            AND id <> $2::uuid
            AND is_hidden = FALSE
          ORDER BY created_at DESC
          LIMIT $3`,
        [galaxyId, exclude, limit]
      );
    } else {
      starsResult = await db.query(
        `SELECT id AS star_id, star_name, created_at
           FROM dt_stars
          WHERE galaxy_id = $1
            AND is_hidden = FALSE
          ORDER BY created_at DESC
          LIMIT $2`,
        [galaxyId, limit]
      );
    }

    res.json({ stars: starsResult.rows });

  } catch (err) {
    console.error('[DT] GET /galaxies/:code/stars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/stars/:id/growth-log — 성장 기록 저장
// Body: { user_id, text }
// CASE 2: resonance_received 이후 owner 성장 기록 → connection_completed
// ─────────────────────────────────────────────
router.post('/stars/:id/growth-log', async (req, res) => {
  try {
    const starId  = req.params.id;
    const { user_id, text } = req.body;

    if (!user_id || !text?.trim()) {
      return res.status(400).json({ error: 'user_id, text 필수' });
    }

    // 별 소유자 확인 + 컨텍스트 조회
    const starResult = await db.query(
      `SELECT s.id, s.user_id AS owner_id, s.is_hidden, s.wish_id,
              w.safety_level
         FROM dt_stars  s
         JOIN dt_wishes w ON w.id = s.wish_id
        WHERE s.id = $1`,
      [starId]
    );
    if (starResult.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }
    const star = starResult.rows[0];

    if (star.owner_id !== user_id) {
      return res.status(403).json({ error: '본인의 별만 기록할 수 있습니다' });
    }

    // 성장 기록 저장 (upsert 방식 — 덮어쓰기 허용)
    await db.query(
      `UPDATE dt_stars
          SET growth_log_text  = $1,
              growth_logged_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [text.trim(), starId]
    );

    // ── KPI: growth_logged ───────────────────────────────────────
    emitKpiEvent({
      eventName:  KPI_EVENTS.GROWTH_LOGGED,
      userId:     user_id,
      starId,
      wishId:     star.wish_id,
      visibility: star.is_hidden ? 'hidden' : 'public',
      safetyBand: star.safety_level ?? 'GREEN',
      source:     'growth_log_route',
    }).catch(() => {});

    // ── KPI: connection_completed CASE 2 (owner 성장 기록 기반) ──
    // resonance_received 이후 owner가 성장 기록 → 연결 완료 (최초 1회)
    const [received, alreadyCompleted] = await Promise.all([
      hasResonanceReceived(starId),
      isConnectionCompleted(starId),
    ]);

    if (received && !alreadyCompleted) {
      emitKpiEvent({
        eventName:  KPI_EVENTS.CONNECTION_COMPLETED,
        userId:     user_id,
        starId,
        wishId:     star.wish_id,
        visibility: star.is_hidden ? 'hidden' : 'public',
        safetyBand: star.safety_level ?? 'GREEN',
        source:     'owner_growth_log',
        extra:      { case: 2 },
      }).catch(() => {});
    }

    res.json({ ok: true });

  } catch (err) {
    console.error('[DT] POST /stars/:id/growth-log error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// VoyageLog — 문제-행동-결과 추론 테이블
// ─────────────────────────────────────────────

// 감정 → 오늘의 상황/문제 자동 추론 (갤럭시 로그 options 기반)
const PROBLEM_MAP = {
  // Day.jsx 항해 감정
  '용기났어요':              '도전하기 어려운 순간이 있었다',
  '해볼 수 있을 것 같아요':  '불확실함 앞에서 멈추는 순간이 있었다',
  '조금 앞으로 가고 싶어졌어요': '앞으로 나아가지 못하는 느낌이 들었다',
  '정리됐어요':              '생각이 복잡하게 얽혀 있었다',
  '이해가 됐어요':           '이해가 잘 되지 않는 부분이 있었다',
  '조금 또렷해졌어요':       '방향이 흐릿하게 느껴졌다',
  '마음이 닿았어요':         '연결되지 않는 느낌이 들었다',
  '조금 표현해보고 싶어졌어요': '표현하기 어려운 마음이 있었다',
  '거리감이 편안해졌어요':   '거리감이 불편하게 느껴졌다',
  '숨이 놓였어요':           '지치고 무거운 마음이 쌓여 있었다',
  '조금 쉬고 싶어졌어요':    '쉬지 못하고 긴장된 상태였다',
  '마음이 잔잔해졌어요':     '마음이 어수선하게 흔들리고 있었다',
  // 공명(resonance) 감정 — source: 'resonance' 시 사용
  '좀 편해졌어요':           '다른 별의 소원이 마음에 닿았다',
  '좀 용기났어요':           '다른 별의 소원에서 용기를 받았다',
  '좀 정리됐어요':           '다른 별의 소원이 생각을 정리해줬다',
  '좀 믿고 싶어졌어요':      '다른 별의 소원이 믿음을 불러일으켰다',
};

// 도움 태그 → 취한 행동 자동 추론
const ACTION_MAP = {
  '결심':   '결심하고 마음을 모았다',
  '실행':   '작은 실행을 시도했다',
  '돌파':   '막히는 것을 밀고 나갔다',
  '이해':   '천천히 이해하려고 했다',
  '정리':   '생각을 하나씩 정리했다',
  '깨달음': '깨달음의 순간을 받아들였다',
  '연결':   '마음을 열고 연결하려 했다',
  '표현':   '조심스럽게 표현해보았다',
  '거리조절': '거리를 조절하며 관계를 돌봤다',
  '위로':   '스스로를 위로했다',
  '쉼':     '잠깐 멈추고 쉬었다',
  '내려놓기': '내려놓기를 시도했다',
  '공명':   '공명을 남기고 마음을 나눴다',  // resonance source
};

function inferVoyageStructure(emotion, tag, growth) {
  return {
    problem: PROBLEM_MAP[emotion] ?? `${emotion}고 느끼는 상황이 있었다`,
    action:  ACTION_MAP[tag]     ?? `${tag}을(를) 실천했다`,
    result:  growth ?? null,
  };
}

// POST /api/dt/voyage-logs — 항해 로그 저장 (emotion → problem/action/result 자동 추론)
router.post('/voyage-logs', async (req, res) => {
  try {
    const { user_id, star_id = null, emotion, tag, growth, source = 'voyage' } = req.body;

    if (!user_id || !emotion || !tag || !growth) {
      return res.status(400).json({ error: 'user_id, emotion, tag, growth 필수' });
    }

    const { problem, action, result } = inferVoyageStructure(emotion, tag, growth);

    const { rows } = await db.query(
      `INSERT INTO dt_voyage_logs
         (user_id, star_id, emotion, tag, growth, problem, action, result, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [user_id, star_id, emotion, tag, growth, problem, action, result, source]
    );

    res.status(201).json({ ok: true, log_id: rows[0].id, problem, action, result });

  } catch (err) {
    console.error('[DT] POST /voyage-logs error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dt/stars/:id/voyage-logs — 별의 항해 로그 목록 (D+ 포함, 최근 10개)
router.get('/stars/:id/voyage-logs', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.id, v.emotion, v.tag, v.growth, v.source, v.logged_at,
              GREATEST(1, FLOOR(
                EXTRACT(EPOCH FROM (v.logged_at - s.created_at)) / 86400
              )::int + 1) AS day_number
         FROM dt_voyage_logs v
         JOIN dt_stars s ON s.id = v.star_id
        WHERE v.star_id = $1
        ORDER BY v.logged_at DESC
        LIMIT 10`,
      [req.params.id]
    );
    res.json({ logs: rows });
  } catch (err) {
    console.error('[DT] GET /stars/:id/voyage-logs error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/stars/:id/aurora5-message — Aurora5 메시지 저장
// Aurora5 메시지는 현재 은하 기반 로컬 생성
// 추후 K-지혜 파이프라인 연결 예정
// wisdom_tag 기준 패턴 분석 → K-지혜 문장 생성
// ─────────────────────────────────────────────
router.post('/stars/:id/aurora5-message', async (req, res) => {
  try {
    const { id: starId } = req.params;
    const { user_id, message, wisdom_tag } = req.body;
    if (!message) return res.status(400).json({ error: 'message 필수' });

    const { rows } = await db.query(
      `INSERT INTO aurora5_messages (star_id, user_id, message, wisdom_tag)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [starId, user_id ?? null, message, wisdom_tag ?? null]
    );
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('[DT] POST /aurora5-message error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// Gift 선물 카피 텍스트 (AI 없음, 룰 기반)
// ─────────────────────────────────────────────
const GIFT_COPIES = {
  lover:  '별을 따다 주고 싶었는데, 네 별을 만들었어',
  parent: '당신이 걷는 모든 길에 빛이 있기를 바라요',
  friend: '넌 이미 별을 닮았어. 이 별이 너한테 어울려',
};

// POST /api/dt/stars/:id/gift — 선물 생성 (소유자 확인 + 마킹)
router.post('/stars/:id/gift', async (req, res) => {
  try {
    const { id: starId } = req.params;
    const { user_id, gift_copy_type } = req.body;

    if (!user_id || !gift_copy_type) {
      return res.status(400).json({ error: 'user_id, gift_copy_type 필수' });
    }
    if (!GIFT_COPIES[gift_copy_type]) {
      return res.status(400).json({ error: 'gift_copy_type은 lover/parent/friend 중 하나' });
    }

    // 별 조회 + 소유자 확인
    const { rows } = await db.query(
      `SELECT s.id, s.user_id, s.star_name, g.code AS galaxy_code, g.name_ko AS galaxy_name
         FROM dt_stars s
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE s.id = $1`, [starId]
    );
    if (rows.length === 0) return res.status(404).json({ error: '별을 찾을 수 없어요' });
    const star = rows[0];
    if (star.user_id !== user_id) return res.status(403).json({ error: '내 별만 선물할 수 있어요' });

    // 선물 마킹
    await db.query(
      `UPDATE dt_stars
          SET is_gifted = true, gifted_at = NOW(), gift_copy_type = $2
        WHERE id = $1`,
      [starId, gift_copy_type]
    );

    res.json({
      success: true,
      gift_card: {
        star_name:  star.star_name,
        galaxy:     star.galaxy_code,
        galaxy_ko:  star.galaxy_name,
        copy_type:  gift_copy_type,
        copy_text:  GIFT_COPIES[gift_copy_type],
      },
    });
  } catch (err) {
    console.error('[DT] POST /stars/:id/gift error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dt/gift/:star_id — 수신자 선물 카드 조회 (공개, view_count 증가)
router.get('/gift/:star_id', async (req, res) => {
  try {
    const { star_id } = req.params;

    const { rows } = await db.query(
      `SELECT s.star_name, s.is_gifted, s.gift_copy_type, s.gift_view_count,
              g.code AS galaxy_code, g.name_ko AS galaxy_name
         FROM dt_stars s
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE s.id = $1`, [star_id]
    );
    if (rows.length === 0 || !rows[0].is_gifted) {
      return res.status(404).json({ error: '선물을 찾을 수 없어요' });
    }
    const star = rows[0];

    // view_count 증가 (fire-and-forget)
    db.query('UPDATE dt_stars SET gift_view_count = gift_view_count + 1 WHERE id = $1', [star_id])
      .catch(() => {});

    res.json({
      star_name:  star.star_name,
      galaxy:     { code: star.galaxy_code, name_ko: star.galaxy_name },
      copy_text:  GIFT_COPIES[star.gift_copy_type] ?? '',
      view_count: star.gift_view_count,
    });
  } catch (err) {
    console.error('[DT] GET /gift/:star_id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/today-schedule
// 오늘(KST) 해당하는 Aurora5 스케줄 메시지 반환
// ─────────────────────────────────────────────
router.get('/stars/:id/today-schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT day_number, message_text, wisdom_tag, scheduled_at
         FROM dt_voyage_schedule
        WHERE star_id = $1
          AND DATE(scheduled_at AT TIME ZONE 'Asia/Seoul')
              = (NOW() AT TIME ZONE 'Asia/Seoul')::date
        ORDER BY day_number
        LIMIT 1`,
      [id]
    );
    const schedule = rows[0] ?? null;

    // 앱 표시 마킹 (fire-and-forget)
    if (schedule) {
      db.query(
        `UPDATE dt_voyage_schedule SET is_shown_in_app = TRUE
          WHERE star_id = $1 AND day_number = $2`,
        [id, schedule.day_number]
      ).catch(() => {});
    }

    res.json({ schedule });
  } catch (err) {
    console.error('[DT] GET /stars/:id/today-schedule error:', err.message);
    // 테이블 미존재 등 — graceful fallback
    res.json({ schedule: null });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/admin/backfill-voyage-schedules
// 기존 별 소급 적용 — dt_voyage_schedule 없는 별 조회 후 미래 일차만 생성
// ─────────────────────────────────────────────
router.post('/admin/backfill-voyage-schedules', async (req, res) => {
  try {
    // dt_voyage_schedule이 아예 없는 별만 대상
    const { rows: stars } = await db.query(
      `SELECT s.id, s.user_id, s.created_at, g.code AS galaxy_code
         FROM dt_stars s
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE NOT EXISTS (
          SELECT 1 FROM dt_voyage_schedule vs WHERE vs.star_id = s.id
        )
        LIMIT 200`
    );

    let created = 0;
    let skipped = 0;

    for (const star of stars) {
      const items = buildScheduleItems(star.galaxy_code);
      for (const item of items) {
        // 이미 지난 일차 스킵
        const scheduledAt = new Date(star.created_at);
        scheduledAt.setDate(scheduledAt.getDate() + item.dayNumber);
        // 대략적인 미래 체크 (정확한 KST 계산은 DB에서 처리)
        if (scheduledAt < new Date()) { skipped++; continue; }

        await db.query(
          `INSERT INTO dt_voyage_schedule
             (star_id, user_id, day_number, message_text, wisdom_tag, scheduled_at)
           VALUES ($1, $2, $3, $4, $5,
             ((($6::timestamptz AT TIME ZONE 'Asia/Seoul')::date + $3::int * INTERVAL '1 day' + INTERVAL '8 hours') AT TIME ZONE 'Asia/Seoul'))
           ON CONFLICT (star_id, day_number) DO NOTHING`,
          [star.id, star.user_id, item.dayNumber, item.message, item.tag, star.created_at]
        ).catch(() => {});
        created++;
      }
    }

    res.json({ ok: true, stars_processed: stars.length, schedules_created: created, skipped });
  } catch (err) {
    console.error('[DT] POST /admin/backfill-voyage-schedules error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/stats
// My Star 요약 통계 — 카드/마일스톤/변화지수 차트용
// ─────────────────────────────────────────────
router.get('/stars/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. 별 생성일
    const starRow = await db.query(
      'SELECT created_at FROM dt_stars WHERE id = $1', [id]
    );
    if (starRow.rowCount === 0) return res.status(404).json({ error: '별을 찾을 수 없어요' });

    const createdAt = new Date(starRow.rows[0].created_at);
    const daysSinceBirth = Math.max(
      1,
      Math.floor((Date.now() - createdAt.getTime()) / 86400000) + 1
    );

    // 2. 변화지수 히스토리 — 날짜별 로그 수 기반 (voyage/daily 소스만, 공명 제외)
    const logsRow = await db.query(
      `SELECT
         (logged_at AT TIME ZONE 'Asia/Seoul')::date AS log_date,
         COUNT(*) AS cnt
       FROM dt_voyage_logs
       WHERE star_id = $1
         AND source != 'resonance'
       GROUP BY log_date
       ORDER BY log_date ASC`,
      [id]
    );
    const changeScoreHistory = logsRow.rows.map(r => ({
      date:  r.log_date,
      score: Math.min(100, 50 + parseInt(r.cnt, 10) * 10),
    }));
    const currentScore = changeScoreHistory.length > 0
      ? changeScoreHistory[changeScoreHistory.length - 1].score
      : 50;

    // 3. 공명 수 (resonance 테이블 — star_id TEXT)
    let resonanceCount = 0;
    let resonanceUsersCount = 0;
    try {
      const resRow = await db.query(
        `SELECT COUNT(*) AS total, COUNT(DISTINCT user_id) AS users
           FROM resonance WHERE star_id = $1::text`,
        [id]
      );
      resonanceCount      = parseInt(resRow.rows[0]?.total ?? 0, 10);
      resonanceUsersCount = parseInt(resRow.rows[0]?.users ?? 0, 10);
    } catch (_) { /* resonance 테이블 없는 환경 graceful */ }

    // 4. 마일스톤 상태
    const milestoneStatus = {
      d7:   daysSinceBirth >= 7,
      d30:  daysSinceBirth >= 30,
      d100: daysSinceBirth >= 100,
      d365: daysSinceBirth >= 365,
    };

    res.json({
      days_since_birth:      daysSinceBirth,
      current_score:         currentScore,
      change_score_history:  changeScoreHistory,
      resonance_count:       resonanceCount,
      resonance_users_count: resonanceUsersCount,
      milestone_status:      milestoneStatus,
    });
  } catch (err) {
    console.error('[DT] GET /stars/:id/stats error:', err.message);
    res.status(500).json({ error: '통계 조회에 실패했어요' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/detail — 공개 별 상세 (StarDetail 전용)
// 닉네임 / 마일스톤 / 항해 로그 1개 / Aurora5 오늘 메시지 / 공명 수 통합 반환
// ─────────────────────────────────────────────
router.get('/stars/:id/detail', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. 별 + 닉네임 (dt_users 조인)
    const { rows, rowCount } = await db.query(
      `SELECT
         s.id              AS star_id,
         s.star_name,
         s.star_stage,
         s.created_at,
         s.growth_log_text,
         w.wish_text,
         g.code            AS galaxy_code,
         g.name_ko         AS galaxy_name_ko,
         u.nickname
       FROM dt_stars s
       LEFT JOIN dt_wishes   w ON w.id = s.wish_id
       JOIN      dt_galaxies g ON g.id = s.galaxy_id
       LEFT JOIN dt_users    u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id]
    );
    if (rowCount === 0) return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    const star = rows[0];

    const daysSinceBirth = Math.max(
      1,
      Math.floor((Date.now() - new Date(star.created_at).getTime()) / 86400000) + 1
    );
    const nickname = star.nickname || '소원이';

    // 2. 오늘 Aurora5 스케줄 메시지
    const { rows: schedRows } = await db.query(
      `SELECT day_number, message_text
         FROM dt_voyage_schedule
        WHERE star_id = $1
          AND DATE(scheduled_at AT TIME ZONE 'Asia/Seoul')
              = (NOW() AT TIME ZONE 'Asia/Seoul')::date
        ORDER BY day_number LIMIT 1`,
      [id]
    );
    const todaySchedule = schedRows[0] ?? null;

    // 3. 최근 항해 로그 1개 (daily / null source만)
    const { rows: logRows } = await db.query(
      `SELECT v.id,
              v.growth              AS situation_text,
              v.tag                 AS wisdom_tag,
              v.logged_at,
              GREATEST(1, FLOOR(EXTRACT(EPOCH FROM (v.logged_at - s.created_at)) / 86400)::int + 1) AS day_num
         FROM dt_voyage_logs v
         JOIN dt_stars s ON s.id = v.star_id
        WHERE v.star_id = $1
          AND (v.source = 'daily' OR v.source IS NULL)
        ORDER BY v.logged_at DESC LIMIT 1`,
      [id]
    );
    const latestLog = logRows[0] ?? null;
    if (latestLog) {
      const d = new Date(latestLog.logged_at);
      latestLog.log_date = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }

    // 4. 공명 수
    let resonanceCount = 0;
    try {
      const { rows: resRows } = await db.query(
        `SELECT COUNT(*) AS total FROM resonance WHERE star_id = $1::text`,
        [id]
      );
      resonanceCount = parseInt(resRows[0]?.total ?? 0, 10);
    } catch (_) { /* resonance 테이블 없는 환경 graceful */ }

    // 5. 마일스톤 상태 (날짜 포함)
    const MILESTONES = [1, 7, 30, 100, 365];
    const milestoneStatus = MILESTONES.map(day => {
      const d = new Date(star.created_at);
      d.setDate(d.getDate() + day - 1);
      return {
        day,
        reached: daysSinceBirth >= day,
        date: `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
      };
    });

    res.json({
      star_id:               star.star_id,
      star_name:             star.star_name,
      star_stage:            star.star_stage,
      wish_text:             star.wish_text ?? null,
      growth_log_text:       star.growth_log_text ?? null,
      galaxy: {
        code:    star.galaxy_code,
        name_ko: star.galaxy_name_ko,
      },
      created_at:            star.created_at,
      birth_date:            star.created_at,   // 프론트 양쪽 키 호환
      days_since_birth:      daysSinceBirth,
      nickname,
      milestone_status:      milestoneStatus,
      today_aurora5_message: todaySchedule?.message_text ?? null,
      today_aurora5_day:     todaySchedule?.day_number ?? null,
      latest_voyage_log:     latestLog,
      resonance_count:       resonanceCount,
    });
  } catch (err) {
    console.error('[DT] GET /stars/:id/detail error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/health — 헬스체크
// ─────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dreamtown-api', timestamp: new Date().toISOString() });
});

module.exports = router;
