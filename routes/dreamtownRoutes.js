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
const { classifyWish, notifyRedSignal } = require('../services/safetyFilter');
const { createStarLocation } = require('../services/starLocationService');
const { getEmotionTag }      = require('../services/emotionService');
const { generateStarMeaning } = require('../services/starMeaningService');
const { getStarStage }        = require('../services/starGrowthService');
const flow                    = require('../services/dreamtownFlowService');
const { assignVariantSmart, getUXConfig } = require('../services/experimentService');
const { getTriggerRecommendation }        = require('../services/aiRecommendationService');
const { getDay1Prompt }                   = require('../services/day1OnboardingService');
const { retentionCheck }                  = require('../middleware/retentionMiddleware');
const { determineStarMeta }               = require('../services/expoStarService');
const wishEmotionService                  = require('../services/dt/wishEmotionService');
const crypto = require('crypto');

function dtHashWishId(input) {
  return parseInt(
    crypto.createHash('md5').update(input).digest('hex').substring(0, 8),
    16
  );
}

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
  diamond:   'miracle',
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

    // ── flow 계측 (wish/create) ──────────────────────────────────
    try {
      await flow.log({ userId: String(userId), stage: 'wish', action: 'create', value: { channel: 'web', gemType: gem_type }, refId: String(wish.id) });
    } catch (e) { console.warn('flow log failed (wish/create)', e.message); }

    // 감정 한 줄 생성 (fire-and-forget — 응답 지연 없음)
    wishEmotionService.generateAndSave(wish.id, wish_text).catch(() => {});

    res.status(201).json({ wish_id: wish.id, status: wish.status, safety: wish.safety_level });

  } catch (err) {
    console.error('[DT] POST /wishes error:', err.message, '| code:', err.code, '| stack:', err.stack?.split('\n')[1]);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/wishes/with-star — 소원 + 별 동시 생성
// 입력: { user_id, content, gem_type }
// 출력: { wish: {...}, star: {...} }
// ─────────────────────────────────────────────
router.post('/wishes/with-star', async (req, res) => {
  try {
    const { user_id, content, gem_type } = req.body;
    const wish_text = content; // 요청 카드 필드명 매핑

    if (!user_id || !wish_text || !gem_type) {
      return res.status(400).json({ error: 'user_id, content, gem_type 필수' });
    }

    const validGems = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];
    if (!validGems.includes(gem_type.toLowerCase())) {
      return res.status(400).json({ error: `gem_type은 ${validGems.join('/')} 중 하나여야 합니다` });
    }

    // 안전 필터
    const safety = classifyWish(wish_text);
    if (safety.level === 'RED') {
      notifyRedSignal('dreamtown', wish_text, safety.reason).catch(() => {});
      return res.status(200).json({
        ok: false,
        safety: 'RED',
        care_message: '지금 많이 힘드신가요? 이 소원은 별로 만들어지지 않았어요.',
      });
    }

    // user 없으면 자동 생성
    const userCheck = await db.query('SELECT id FROM dt_users WHERE id = $1', [user_id]);
    if (userCheck.rowCount === 0) {
      await db.query('INSERT INTO dt_users (id, nickname) VALUES ($1, $2)', [user_id, 'Guest']);
    }

    // 소원 생성
    const wishResult = await db.query(
      `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status, safety_level)
       VALUES ($1, $2, $3, 'submitted', $4)
       RETURNING id, wish_text, gem_type, status, safety_level, created_at`,
      [user_id, wish_text, gem_type.toLowerCase(), safety.level]
    );
    const wish = wishResult.rows[0];

    // ── flow 계측 (wish/create) ──────────────────────────────────
    try {
      await flow.log({ userId: String(user_id), stage: 'wish', action: 'create', value: { channel: 'web', gemType: wish.gem_type }, refId: String(wish.id) });
    } catch (e) { console.warn('flow log failed (wish/create with-star)', e.message); }

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

    // star_seed + star 생성
    const seedResult = await db.query(
      `INSERT INTO dt_star_seeds (wish_id, seed_name, seed_state)
       VALUES ($1, $2, 'promoted') RETURNING id`,
      [wish.id, `${wish_text.slice(0, 10)} 씨앗`]
    );

    const starName = await makeStarName(wish.id, db);
    const emotionTag = getEmotionTag(wish_text);
    const isHidden = safety.level === 'YELLOW';

    const starResult = await db.query(
      `INSERT INTO dt_stars
         (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, star_stage, is_hidden, emotion_tag)
       VALUES ($1, $2, $3, $4, $5, $6, 'day1', $7, $8)
       RETURNING id, star_name, star_slug, star_stage, wish_id, created_at`,
      [user_id, wish.id, seedResult.rows[0].id, starName, `star-${Date.now()}`, galaxy.id, isHidden, emotionTag]
    );
    const star = starResult.rows[0];

    // ── flow 계측 (star/create) ──────────────────────────────────
    try {
      await flow.log({ userId: String(user_id), stage: 'star', action: 'create', value: { source: 'wish', gemType: wish.gem_type }, refId: String(star.id) });
    } catch (e) { console.warn('flow log failed (star/create with-star)', e.message); }

    // 위치 할당 (fire-and-forget)
    createStarLocation(db, star.id, wish.id).catch(e =>
      console.error('[DT] with-star location 실패:', e.message)
    );

    // wish status 업데이트
    await db.query("UPDATE dt_wishes SET status = 'converted_to_star' WHERE id = $1", [wish.id]);

    // ── A/B 실험: star_flow_layout_test — UX 분기 + 로그 ───
    const expVariant = await assignVariantSmart(String(user_id), 'star_flow_layout_test');
    const ux         = getUXConfig('star_flow_layout_test', expVariant) ?? { ctaPosition: 'bottom', emotionStep: 'after_star' };
    const CTA_TEXT   = { A: '지금 별을 만들어보세요', B: '당신의 별이 곧 시작됩니다' };
    // exposure + conversion (별 생성 성공 = 전환)
    Promise.all([
      flow.log({ userId: String(user_id), stage: 'experiment', action: 'exposure',
        value: { experiment: 'star_flow_layout_test', variant: expVariant } }),
      flow.log({ userId: String(user_id), stage: 'experiment', action: 'conversion',
        value: { experiment: 'star_flow_layout_test', variant: expVariant } }),
    ]).catch(() => {});

    // ── Day1 진입 브릿지 — 별 생성 완료 화면 = Day1 시작 화면 ─
    // 마지막 wish-checkin 감정 조회 (있으면 맞춤 프롬프트)
    let lastEmotion = null;
    try {
      const emoRes = await db.query(
        `SELECT value->>'state' AS state
         FROM dreamtown_flow
         WHERE user_id = $1 AND stage = 'wish' AND action = 'state_checkin'
         ORDER BY created_at DESC LIMIT 1`,
        [String(user_id)]
      );
      lastEmotion = emoRes.rows[0]?.state ?? null;
    } catch { /* 감정 없어도 default 제공 */ }

    const day1 = getDay1Prompt({ emotion: lastEmotion });

    // Day1 프롬프트 노출 로그 (KPI: shown vs started 비교)
    flow.log({
      userId: String(user_id),
      stage:  'growth',
      action: 'day1_prompt_shown',
      value:  { star_id: star.id, emotion: lastEmotion },
    }).catch(() => {});

    // ── AI 트리거 추천 (after_star) — 일일 상한 적용 ──────────
    const lumi = await getTriggerRecommendation(String(user_id), 'after_star');

    res.status(201).json({
      wish,
      star,
      day1,   // 별 생성 직후 Day1 시작 화면으로 연결 — 선택지 1개
      ux:   { variant: expVariant, ctaPosition: ux.ctaPosition, emotionStep: ux.emotionStep, ctaText: CTA_TEXT[expVariant] },
      lumi,
    });

  } catch (err) {
    console.error('[DT] POST /wishes/with-star error:', err.message);
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

    // 감정 태그 결정 (wish_text 기반, 결정론적)
    const emotionTag = getEmotionTag(wish.wish_text);

    // 한정 별 여부 자동 판별 (섬박람회 등 이벤트 기간 체크)
    const { star_rarity, source_event } = determineStarMeta();

    // star 생성
    const starResult = await db.query(
      `INSERT INTO dt_stars
         (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, star_stage, is_hidden, emotion_tag, star_rarity, source_event)
       VALUES ($1, $2, $3, $4, $5, $6, 'day1', $7, $8, $9, $10)
       RETURNING id, star_name, star_slug, star_stage, star_rarity, source_event, created_at`,
      [user_id, wish_id, seed.id, starName, starSlug, galaxy.id, isHidden, emotionTag, star_rarity, source_event]
    );
    const star = starResult.rows[0];

    // ── flow 계측 (star/create) ──────────────────────────────────
    try {
      await flow.log({ userId: String(user_id), stage: 'star', action: 'create', value: { source: 'wish', gemType: wish.gem_type }, refId: String(star.id) });
    } catch (e) { console.warn('flow log failed (star/create)', e.message); }

    // ── 별 위치 자동 할당 (wish_id 해시 기반, 결정론적) ────────────
    try {
      await createStarLocation(db, star.id, wish_id);
    } catch (locErr) {
      console.error('[DT] star_location 할당 실패 (별 생성은 유지):', locErr.message);
    }

    // ── 의미 문장 생성 (위치 + 감정 → 스토리) ───────────────────
    try {
      const locRow = await db.query(
        `SELECT sl.zone_code, sz.place_name
           FROM star_locations sl
           JOIN star_zones sz ON sz.zone_code = sl.zone_code
          WHERE sl.star_id = $1`,
        [star.id]
      );
      if (locRow.rowCount > 0) {
        const hash        = dtHashWishId(wish_id);
        const meaningText = generateStarMeaning({
          emotion_tag: emotionTag,
          zone:        locRow.rows[0],
          hash,
        });
        await db.query(
          'UPDATE dt_stars SET meaning_text = $1 WHERE id = $2',
          [meaningText, star.id]
        );
      }
    } catch (mErr) {
      console.error('[DT] meaning_text 생성 실패 (별 생성은 유지):', mErr.message);
    }

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

    // Day1 프롬프트 (감정 맞춤)
    let day1 = null;
    try {
      const emoRes = await db.query(
        `SELECT value->>'state' AS state FROM dreamtown_flow
          WHERE user_id = $1 AND stage = 'wish' AND action = 'state_checkin'
          ORDER BY created_at DESC LIMIT 1`,
        [String(user_id)]
      );
      day1 = getDay1Prompt({ emotion: emoRes.rows[0]?.state ?? null });
    } catch { day1 = getDay1Prompt({}); }

    // Day1 노출 로그
    flow.log({ userId: String(user_id), stage: 'growth', action: 'day1_prompt_shown',
      value: { star_id: star.id }, refId: String(star.id) }).catch(() => {});

    res.status(201).json({
      star_id:              star.id,
      star_name:            star.star_name,
      star_slug:            star.star_slug,
      galaxy:               galaxyCode,
      constellation:        null,
      birth_scene_version:  'v1',
      star_stage:           star.star_stage,
      star_rarity:          star.star_rarity,
      source_event:         star.source_event,
      day1,
      next:                 `/star-birth`,
    });

  } catch (err) {
    console.error('[DT] POST /stars/create error:', err.message, '| code:', err.code, '| stack:', err.stack?.split('\n')[1]);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// 공명 레벨 계산 헬퍼 (SSOT: 계산 레이어)
// count 0 → level 0 / 1 → 1 / 2~4 → 2 / 5+ → 3
// ─────────────────────────────────────────────
function getResonanceLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 4)  return 2;
  return 3;
}

function getResonanceLabel(level) {
  const LABELS = {
    0: '첫 마음을 기다리고 있어요',
    1: '첫 공명이 닿았어요',
    2: '공명이 쌓이고 있어요',
    3: '세 번의 공명이 이 별을 밝혔어요',
  };
  return LABELS[level] ?? LABELS[0];
}

// ─────────────────────────────────────────────
// POST /api/dt/resonance — 기적나눔 / 지혜나눔
// Body: { starId, type: "miracle"|"wisdom" }
// ─────────────────────────────────────────────
router.post('/resonance', async (req, res) => {
  const { starId, type } = req.body;
  if (!starId || !['miracle', 'wisdom'].includes(type)) {
    return res.status(400).json({ error: 'starId, type(miracle|wisdom) 필수' });
  }
  try {
    // 별 존재 확인
    const starCheck = await db.query(
      'SELECT id FROM dt_stars WHERE id = $1',
      [starId]
    );
    if (starCheck.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }

    // impact 테이블 upsert (miracle / wisdom 직접 누적)
    await db.query(
      `INSERT INTO impact (star_id, impact_type, count, updated_at)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (star_id, impact_type)
       DO UPDATE SET count = impact.count + 1, updated_at = CURRENT_TIMESTAMP`,
      [starId, type]
    );

    // 레벨업 감지 — resonance_count 컬럼 미적용 환경 graceful (42703 방어)
    let prevCount = 0;
    try {
      const prevStar = await db.query(
        'SELECT resonance_count FROM dt_stars WHERE id = $1',
        [starId]
      );
      prevCount = parseInt(prevStar.rows[0]?.resonance_count ?? 0, 10);
    } catch (colErr) {
      if (colErr.code !== '42703') throw colErr; // 컬럼 없음 외 에러는 전파
      // 42703: resonance_count 컬럼 미존재 → 레벨업 감지 건너뜀, 서비스 유지
      console.warn('[DT] resonance_count column missing, level detection skipped');
    }
    const prevLevel = getResonanceLevel(prevCount);

    // dt_stars.resonance_count 누적 + star_logs 기록 (constellation 선구축)
    // 42703 graceful: 컬럼 없으면 업데이트 건너뜀 (impact 저장은 이미 완료)
    try {
      await db.query(
        `UPDATE dt_stars
            SET resonance_count   = resonance_count + 1,
                last_resonated_at = NOW()
          WHERE id = $1`,
        [starId]
      );
    } catch (colErr) {
      if (colErr.code !== '42703') throw colErr;
      console.warn('[DT] resonance_count update skipped (column missing)');
    }

    // star_logs 기록 (42703 또는 star_logs 미존재 방어)
    try {
      await db.query(
        `INSERT INTO star_logs (star_id, action_type) VALUES ($1, 'resonance')`,
        [starId]
      );
    } catch (logErr) {
      console.warn('[DT] star_logs insert skipped:', logErr.message);
    }

    // 레벨업 여부 확인 및 로그 (마이그 058 미적용 환경 graceful)
    const newCount = prevCount + 1;
    const newLevel = getResonanceLevel(newCount);
    if (newLevel > prevLevel) {
      const requestId = crypto.randomUUID();
      try {
        await db.query(
          `INSERT INTO star_logs (star_id, action_type, payload)
           VALUES ($1, 'star_resonance_level_up', $2::jsonb)`,
          [starId, JSON.stringify({
            star_id:         starId,
            previous_level:  prevLevel,
            new_level:       newLevel,
            resonance_count: newCount,
            request_id:      requestId,
            timestamp:       new Date().toISOString(),
          })]
        );
      } catch (logErr) {
        console.warn('[DT] level_up log skipped (migration pending?):', logErr.message);
      }
    }

    // 최신 카운트 반환
    const counts = await db.query(
      `SELECT impact_type, count FROM impact
        WHERE star_id = $1 AND impact_type IN ('miracle','wisdom')`,
      [starId]
    );
    const result = { miracleCount: 0, wisdomCount: 0 };
    for (const row of counts.rows) {
      if (row.impact_type === 'miracle') result.miracleCount = row.count;
      if (row.impact_type === 'wisdom')  result.wisdomCount  = row.count;
    }

    res.json({
      ok: true,
      ...result,
      resonance_count: newCount,
      resonance_level: newLevel,
      resonance_label: getResonanceLabel(newLevel),
      level_up: newLevel > prevLevel,
    });
  } catch (err) {
    console.error('[DT] POST /resonance error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars?userId=xxx — 유저 별 목록
// retentionCheck: Day3/Day7 이탈 위험 감지 → retentionTrigger 주입
// ─────────────────────────────────────────────
router.get('/stars', retentionCheck, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const { rows } = await db.query(
      `SELECT s.id AS star_id, s.star_name, g.id AS galaxy_id
         FROM dt_stars s
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC`,
      [userId]
    );
    res.json({ stars: rows, retentionTrigger: req.retentionTrigger });
  } catch (err) {
    console.error('[DT] GET /stars error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
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
          AND (s.is_sample IS NOT TRUE)
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
          AND (s.is_sample IS NOT TRUE)
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

// ─────────────────────────────────────────────────────────────────────────
// GET /api/dt/stars/featured — 성장 루프 노출 구조 (자동 정렬, 수동 개입 불필요)
//
// hot (최대 3): resonance 테이블 기준, resonance_count > 0 필터
//   선발 기준: 전체 공명 분포를 상/중/하 구간으로 나눠 각 1개 대표 추출
//   정렬: resonance_count DESC, tiebreaker = latest_resonated_at DESC
//   금지: impact 테이블 사용 금지 (impact = 나눔 집계, resonance ≠ impact)
//
// fresh (최대 3): 48h 이내 탄생 + resonance 0개 — 첫 공명 진입점
// ─────────────────────────────────────────────────────────────────────────
router.get('/stars/featured', async (req, res) => {
  try {
    const [hotResult, freshResult] = await Promise.all([
      // hot: impact 테이블 집계 (DT 기적/지혜나눔 SSOT) → 상/중/하 구간 대표 1개씩 선발
      // impact 테이블: postDtResonance(miracle/wisdom) + 구공명 threshold 트리거(gratitude 등) 모두 집계
      db.query(`
        WITH scored AS (
          SELECT s.id          AS star_id,
                 s.star_name,
                 s.created_at,
                 g.code        AS galaxy_code,
                 g.name_ko     AS galaxy_name_ko,
                 COALESCE(SUM(i.count), 0)::int AS resonance_count,
                 MAX(i.updated_at)               AS latest_resonated_at,
                 COALESCE(COUNT(sl.id) FILTER (
                   WHERE sl.action_type = 'resonance'
                     AND sl.created_at >= NOW() - INTERVAL '24 hours'
                 ), 0)::int AS recent_growth
            FROM dt_stars   s
            JOIN dt_galaxies g ON g.id = s.galaxy_id
            LEFT JOIN impact    i  ON i.star_id  = s.id::text
            LEFT JOIN star_logs sl ON sl.star_id = s.id
           WHERE s.is_hidden = FALSE
             AND (s.is_sample IS NOT TRUE)
           GROUP BY s.id, s.star_name, s.created_at, g.code, g.name_ko
          HAVING COALESCE(SUM(i.count), 0) > 0
        ),
        windowed AS (
          SELECT *,
            ROW_NUMBER() OVER (
              ORDER BY (resonance_count * 0.7 + recent_growth * 1.5) DESC,
                       latest_resonated_at DESC NULLS LAST
            ) AS rn,
            COUNT(*) OVER () AS total_count
          FROM scored
        )
        SELECT star_id, star_name, created_at, galaxy_code, galaxy_name_ko, resonance_count
          FROM windowed
         WHERE rn = 1
            OR rn = GREATEST(2, (total_count + 1) / 2)
            OR rn = total_count
         ORDER BY rn
         LIMIT 3
      `),
      // fresh: 48h 이내 + impact 0개 — 첫 나눔 진입점
      db.query(`
        SELECT s.id          AS star_id,
               s.star_name,
               s.created_at,
               g.code        AS galaxy_code,
               g.name_ko     AS galaxy_name_ko
          FROM dt_stars   s
          JOIN dt_galaxies g ON g.id = s.galaxy_id
          LEFT JOIN impact i ON i.star_id = s.id::text
         WHERE s.is_hidden = FALSE
           AND (s.is_sample IS NOT TRUE)
           AND s.created_at >= NOW() - INTERVAL '48 hours'
         GROUP BY s.id, s.star_name, s.created_at, g.code, g.name_ko
        HAVING COALESCE(SUM(i.count), 0) = 0
         ORDER BY s.created_at DESC
         LIMIT 3
      `),
    ]);
    res.json({ hot: hotResult.rows, fresh: freshResult.rows });
  } catch (err) {
    console.error('[DT] GET /stars/featured error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/count — 전체 별 수
// ─────────────────────────────────────────────
router.get('/stars/count', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM dt_stars WHERE is_hidden = FALSE AND (is_sample IS NOT TRUE)'
    );
    res.json({ count: result.rows[0]?.count ?? 0 });
  } catch (err) {
    console.error('[DT] GET /stars/count error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/resonance-people — 공명 참여자 (익명, 최대 5명 + 총계)
// ─────────────────────────────────────────────
router.get('/stars/:id/resonance-people', async (req, res) => {
  try {
    const { id } = req.params;
    const [peopleResult, countResult] = await Promise.all([
      db.query(
        `SELECT DISTINCT user_id
           FROM user_events
          WHERE event_type = 'resonance_click'
            AND metadata->>'star_id' = $1
          LIMIT 5`,
        [id]
      ),
      db.query(
        `SELECT COUNT(DISTINCT user_id)::int AS total
           FROM user_events
          WHERE event_type = 'resonance_click'
            AND metadata->>'star_id' = $1`,
        [id]
      ),
    ]);
    res.json({
      people: peopleResult.rows.map(r => r.user_id),
      total:  countResult.rows[0]?.total ?? 0,
    });
  } catch (err) {
    console.error('[DT] GET /stars/:id/resonance-people error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/top-today — 오늘 유니크 공명 상위 3개
// ─────────────────────────────────────────────
router.get('/stars/top-today', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id AS star_id, s.star_name, w.wish_text, w.wish_emotion,
              t.resonance_users
         FROM (
           SELECT metadata->>'star_id' AS star_id,
                  COUNT(DISTINCT user_id)::int AS resonance_users
             FROM user_events
            WHERE event_type = 'resonance_click'
              AND created_at >= CURRENT_DATE
            GROUP BY metadata->>'star_id'
            ORDER BY resonance_users DESC
            LIMIT 3
         ) t
         JOIN dt_stars  s ON s.id::text = t.star_id
         JOIN dt_wishes w ON w.id = s.wish_id
        WHERE s.is_hidden = FALSE
          AND w.wish_text IS NOT NULL
        ORDER BY t.resonance_users DESC`
    );
    res.json({ stars: rows });
  } catch (err) {
    console.error('[DT] GET /stars/top-today error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/trending — 최근 30분 공명 활발 별 (최대 5개)
// ─────────────────────────────────────────────
router.get('/stars/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);
    const { rows } = await db.query(
      `SELECT s.id AS star_id, s.star_name, w.wish_text, w.wish_emotion,
              COUNT(*)::int AS recent_resonance
         FROM user_events ue
         JOIN dt_stars  s ON s.id::text = ue.metadata->>'star_id'
         JOIN dt_wishes w ON w.id = s.wish_id
        WHERE ue.event_type = 'resonance_click'
          AND ue.created_at >= NOW() - INTERVAL '30 minutes'
          AND w.wish_text IS NOT NULL
          AND s.is_hidden = FALSE
        GROUP BY s.id, s.star_name, w.wish_text, w.wish_emotion
        ORDER BY recent_resonance DESC
        LIMIT $1`,
      [limit]
    );
    res.json({ stars: rows });
  } catch (err) {
    console.error('[DT] GET /stars/trending error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id — 내 별 조회
// ─────────────────────────────────────────────
router.get('/stars/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // growth_log_text는 migration 035에서 추가 — 미적용 환경 graceful fallback
    // artifact_jobs LEFT JOIN — 최신 image job의 result_url + status 포함
    let result;
    let growthLogText = null;
    try {
      result = await db.query(
        `SELECT
           s.id              AS star_id,
           s.star_name,
           s.star_slug,
           s.star_stage,
           s.created_at,
           s.growth_log_text,
           s.star_rarity,
           s.source_event,
           w.wish_text,
           g.code            AS galaxy_code,
           g.name_ko         AS galaxy_name_ko,
           aj.result_url     AS wish_image_url,
           aj.status         AS artifact_status
         FROM dt_stars s
         LEFT JOIN dt_wishes   w  ON w.id = s.wish_id
         JOIN      dt_galaxies g  ON g.id = s.galaxy_id
         LEFT JOIN LATERAL (
           SELECT result_url, status
             FROM dt_artifact_jobs
            WHERE star_id = s.id AND type = 'image'
            ORDER BY created_at DESC
            LIMIT 1
         ) aj ON true
         WHERE s.id = $1`,
        [id]
      );
      if (result.rowCount > 0) growthLogText = result.rows[0].growth_log_text ?? null;
    } catch (colErr) {
      if (colErr.code !== '42703') throw colErr; // 42703 = undefined_column
      // migration 035 미적용 — growth_log_text 없이 재조회
      result = await db.query(
        `SELECT
           s.id              AS star_id,
           s.star_name,
           s.star_slug,
           s.star_stage,
           s.created_at,
           w.wish_text,
           g.code            AS galaxy_code,
           g.name_ko         AS galaxy_name_ko,
           aj.result_url     AS wish_image_url,
           aj.status         AS artifact_status
         FROM dt_stars s
         LEFT JOIN dt_wishes   w  ON w.id = s.wish_id
         JOIN      dt_galaxies g  ON g.id = s.galaxy_id
         LEFT JOIN LATERAL (
           SELECT result_url, status
             FROM dt_artifact_jobs
            WHERE star_id = s.id AND type = 'image'
            ORDER BY created_at DESC
            LIMIT 1
         ) aj ON true
         WHERE s.id = $1`,
        [id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }

    const row = result.rows[0];

    // ── 성장 단계 계산 (DB 저장 금지 — 항상 계산형) ─────────────
    const [impactResult, logResult] = await Promise.all([
      db.query(
        'SELECT COALESCE(SUM(count), 0)::int AS total FROM impact WHERE star_id = $1::text',
        [row.star_id]
      ),
      db.query(
        'SELECT COUNT(*)::int AS total FROM dt_voyage_logs WHERE star_id = $1',
        [row.star_id]
      ),
    ]);
    const growthStage = getStarStage({
      created_at:   row.created_at,
      impact_count: impactResult.rows[0].total,
      log_count:    logResult.rows[0].total,
    });

    // ── 각성 상태 조회 (migration 117 — 없으면 null graceful) ─────
    let awakeningData = { status: null, awakened_at: null, awakened_place: null, awaken_count: 0, origin_type: null, origin_place: null };
    try {
      const awR = await db.query(
        `SELECT status, awakened_at, awakened_place, awaken_count, origin_type, origin_place
           FROM dt_stars WHERE id = $1`,
        [row.star_id]
      );
      if (awR.rows[0]) awakeningData = awR.rows[0];
    } catch (_) { /* migration 117 미적용 — 무시 */ }

    res.json({
      star_id:          row.star_id,
      star_name:        row.star_name,
      wish_text:        row.wish_text,
      growth_log_text:  growthLogText,
      wish_image_url:   row.wish_image_url ?? null,
      artifact_status:  row.artifact_status ?? null,
      star_rarity:      row.star_rarity  ?? 'standard',
      source_event:     row.source_event ?? 'standard',
      galaxy: {
        code:    row.galaxy_code,
        name_ko: row.galaxy_name_ko,
      },
      constellation:  null,
      star_stage:     row.star_stage,
      created_at:     row.created_at,
      // 성장 단계 (계산형)
      growth_stage:   growthStage.stage,
      growth_days:    growthStage.days,
      growth_message: growthStage.message,
      // 각성 상태 (migration 117)
      status:          awakeningData.status ?? 'created',
      awakened_at:     awakeningData.awakened_at ?? null,
      awakened_place:  awakeningData.awakened_place ?? null,
      awaken_count:    awakeningData.awaken_count ?? 0,
      origin_type:     awakeningData.origin_type ?? null,
      origin_place:    awakeningData.origin_place ?? null,
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
            AND (is_sample IS NOT TRUE)
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
            AND (is_sample IS NOT TRUE)
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
// Body: { user_id, text } — 기존
//       { user_id, text, day_type, emotion_tag, help_tag, growth_message } — 구조화 확장 (migration 060)
// CASE 2: resonance_received 이후 owner 성장 기록 → connection_completed
// ─────────────────────────────────────────────
router.post('/stars/:id/growth-log', async (req, res) => {
  try {
    const starId  = req.params.id;
    const { user_id, text, day_type, emotion_tag, help_tag, growth_message } = req.body;

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

    // star_logs 기록 (constellation 선구축)
    await db.query(
      `INSERT INTO star_logs (star_id, action_type) VALUES ($1, 'record')`,
      [starId]
    );

    // ── growth_logs 구조화 기록 (migration 060, day_type 있을 때만) ──
    let growthLog = null;
    if (day_type != null) {
      try {
        const glResult = await db.query(
          `INSERT INTO growth_logs (star_id, day_type, emotion_tag, help_tag, growth_message)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, star_id, day_type, emotion_tag, help_tag, growth_message, created_at`,
          [starId, day_type, emotion_tag ?? null, help_tag ?? null, growth_message ?? text.trim()]
        );
        growthLog = glResult.rows[0];
      } catch (glErr) {
        if (glErr.code === '42P01') {
          console.warn('[DT] growth_logs 테이블 없음 — migration 060 미적용');
        } else {
          throw glErr;
        }
      }
    }

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

    res.json({ ok: true, ...(growthLog && { growth_log: growthLog }) });

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
    // 42P01 = undefined_table — migration 042 미적용 환경 graceful skip
    if (err.code === '42P01') {
      console.warn('[DT] aurora5_messages 테이블 없음 (migration 042 필요) — skip');
      return res.status(201).json({ ok: false, skipped: true });
    }
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

    // 3. 공명 수 — impact 테이블 기준 (DT 기적/지혜나눔 SSOT)
    //    breakdown: miracle(기적나눔) / wisdom(지혜나눔) 타입별 집계
    let resonanceCount = 0;
    let resonanceUsersCount = 0;
    let resonanceClickCount = 0;
    let resonanceBreakdown = { miracle: 0, wisdom: 0, total: 0 };
    try {
      const [resRow, clickRow] = await Promise.all([
        db.query(
          `SELECT
             COALESCE(SUM(count), 0)::int AS total,
             COALESCE(SUM(count) FILTER (WHERE impact_type = 'miracle'), 0)::int AS miracle,
             COALESCE(SUM(count) FILTER (WHERE impact_type = 'wisdom'),  0)::int AS wisdom
           FROM impact WHERE star_id = $1::text`,
          [id]
        ),
        db.query(
          `SELECT
             COUNT(DISTINCT user_id)::int        AS unique_users,
             COUNT(*)::int                        AS total_clicks
           FROM user_events
          WHERE event_type = 'resonance_click'
            AND metadata->>'star_id' = $1`,
          [id]
        ).catch(() => ({ rows: [{ unique_users: 0, total_clicks: 0 }] })),
      ]);
      const r = resRow.rows[0] ?? {};
      const c = clickRow.rows[0] ?? {};
      resonanceCount      = parseInt(r.total         ?? 0, 10);
      resonanceUsersCount = parseInt(c.unique_users  ?? 0, 10);
      resonanceClickCount = parseInt(c.total_clicks  ?? 0, 10);
      resonanceBreakdown = {
        miracle: parseInt(r.miracle ?? 0, 10),
        wisdom:  parseInt(r.wisdom  ?? 0, 10),
        total:   parseInt(r.total   ?? 0, 10),
      };
    } catch (_) { /* impact 테이블 없는 환경 graceful */ }

    // 4. 마일스톤 상태
    const milestoneStatus = {
      d7:   daysSinceBirth >= 7,
      d30:  daysSinceBirth >= 30,
      d100: daysSinceBirth >= 100,
      d365: daysSinceBirth >= 365,
    };

    res.json({
      days_since_birth:        daysSinceBirth,
      current_score:           currentScore,
      change_score_history:    changeScoreHistory,
      resonance_count:         resonanceCount,
      resonance_users_count:   resonanceUsersCount,
      resonance_click_count:   resonanceClickCount,
      resonance_breakdown:     resonanceBreakdown,
      milestone_status:        milestoneStatus,
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
    // growth_log_text는 migration 035에서 추가 — 미적용 환경 graceful fallback
    let detailGrowthLogText = null;
    let starQueryResult;
    try {
      starQueryResult = await db.query(
        `SELECT s.id AS star_id, s.star_name, s.star_stage, s.created_at,
                s.growth_log_text, w.wish_text, w.wish_emotion,
                s.journey_origin_public, s.journey_shift_public,
                s.journey_now_public, s.journey_visibility,
                g.code AS galaxy_code, g.name_ko AS galaxy_name_ko, u.nickname
           FROM dt_stars s
           LEFT JOIN dt_wishes   w ON w.id = s.wish_id
           JOIN      dt_galaxies g ON g.id = s.galaxy_id
           LEFT JOIN dt_users    u ON u.id = s.user_id
          WHERE s.id = $1`,
        [id]
      );
      if (starQueryResult.rowCount > 0) detailGrowthLogText = starQueryResult.rows[0].growth_log_text ?? null;
    } catch (colErr) {
      if (colErr.code !== '42703') throw colErr;
      starQueryResult = await db.query(
        `SELECT s.id AS star_id, s.star_name, s.star_stage, s.created_at,
                w.wish_text, w.wish_emotion,
                g.code AS galaxy_code, g.name_ko AS galaxy_name_ko, u.nickname
           FROM dt_stars s
           LEFT JOIN dt_wishes   w ON w.id = s.wish_id
           JOIN      dt_galaxies g ON g.id = s.galaxy_id
           LEFT JOIN dt_users    u ON u.id = s.user_id
          WHERE s.id = $1`,
        [id]
      );
    }
    const { rows, rowCount } = starQueryResult;
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

    // 4. 공명 수 — impact 테이블 기준 (DT 기적/지혜나눔 SSOT)
    let resonanceCount = 0;
    try {
      const { rows: resRows } = await db.query(
        `SELECT COALESCE(SUM(count), 0)::int AS total FROM impact WHERE star_id = $1::text`,
        [id]
      );
      resonanceCount = parseInt(resRows[0]?.total ?? 0, 10);
    } catch (_) { /* impact 테이블 없는 환경 graceful */ }

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
      wish_emotion:          star.wish_emotion ?? null,
      growth_log_text:       detailGrowthLogText,
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
      resonance_count:          resonanceCount,
      resonance_level:          getResonanceLevel(resonanceCount),
      resonance_label:          getResonanceLabel(getResonanceLevel(resonanceCount)),
      journey_origin_public:    star.journey_origin_public    ?? null,
      journey_shift_public:     star.journey_shift_public     ?? null,
      journey_now_public:       star.journey_now_public       ?? null,
      journey_visibility:       star.journey_visibility       ?? 'private',
    });
  } catch (err) {
    console.error('[DT] GET /stars/:id/detail error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/dt/stars/:id/journey-story — 공개용 항해 장면 저장 (소유자 전용)
// ─────────────────────────────────────────────
router.put('/stars/:id/journey-story', async (req, res) => {
  try {
    const { id } = req.params;
    const { origin, shift, now, visibility, user_id } = req.body;

    const { rows, rowCount } = await db.query('SELECT user_id FROM dt_stars WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    if (rows[0].user_id && user_id && rows[0].user_id !== user_id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const BLOCKED = ['죽고 싶', '자살', '자해', '사라지고 싶', '없어지고 싶', '죽어야'];
    for (const text of [origin, shift, now].filter(Boolean)) {
      if (BLOCKED.some(p => text.includes(p))) {
        return res.status(422).json({ error: 'blocked', message: '이 내용은 저장할 수 없어요. 혼자 감당하기 어려운 순간이라면 도움을 요청해주세요.' });
      }
    }

    const vis = ['private', 'public'].includes(visibility) ? visibility : 'private';
    await db.query(
      `UPDATE dt_stars
          SET journey_origin_public = $1,
              journey_shift_public  = $2,
              journey_now_public    = $3,
              journey_visibility    = $4
        WHERE id = $5`,
      [origin ?? null, shift ?? null, now ?? null, vis, id]
    );
    res.json({ ok: true, visibility: vis });
  } catch (err) {
    console.error('[DT] PUT /stars/:id/journey-story error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/journey-story — 항해 장면 조회 (소유자 전용)
// ─────────────────────────────────────────────
router.get('/stars/:id/journey-story', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows, rowCount } = await db.query(
      `SELECT journey_origin_public, journey_shift_public,
              journey_now_public, journey_visibility
         FROM dt_stars WHERE id = $1`,
      [id]
    );
    if (rowCount === 0) return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    res.json({
      origin:     rows[0].journey_origin_public ?? null,
      shift:      rows[0].journey_shift_public  ?? null,
      now:        rows[0].journey_now_public     ?? null,
      visibility: rows[0].journey_visibility    ?? 'private',
    });
  } catch (err) {
    console.error('[DT] GET /stars/:id/journey-story error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/similar — 추천 별 (랜덤 MVP)
// wish_text + wish_emotion 포함, 현재 별 제외
// ─────────────────────────────────────────────
router.get('/stars/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit ?? 3, 10), 6);
    const { rows } = await db.query(
      `SELECT s.id AS star_id, s.star_name, w.wish_text, w.wish_emotion
         FROM dt_stars s
         JOIN dt_wishes w ON w.id = s.wish_id
        WHERE s.id != $1
          AND w.wish_text IS NOT NULL
        ORDER BY RANDOM()
        LIMIT $2`,
      [id, limit]
    );
    res.json({ stars: rows });
  } catch (err) {
    console.error('[DT] GET /stars/:id/similar error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// 은하 전환 신호 계산 (내부 헬퍼)
// emotion / help_tag → galaxy score → signal
// 히스테리시스: 최근 5건만 사용
// ─────────────────────────────────────────────
const GALAXY_EMOTION_MAP = {
  '용기':        'challenge',
  '해보고싶다':  'challenge',
  '해보고 싶다': 'challenge',
  '정리됨':      'growth',
  '깨달음':      'growth',
  '따뜻함':      'relationship',
  '연결됨':      'relationship',
  '힘듦':        'healing',
  '위로':        'healing',
  '놓임':        'healing',
};
const GALAXY_HELP_MAP = {
  '실행': 'challenge',
  '결심': 'growth',
  '연결': 'relationship',
  '위로': 'healing',
  '쉼':   'healing',
};
const GALAXY_FLOW_MESSAGES = {
  challenge:    '요즘 무언가 시도하는 흐름이에요',
  growth:       '요즘 뭔가 정리되는 흐름이에요',
  relationship: '요즘 따뜻한 연결의 흐름이에요',
  healing:      '요즘 마음이 조금 놓이고 있는 흐름이에요',
};
// 우선순위: healing → growth → challenge → relationship
const GALAXY_PRIORITY = ['healing', 'growth', 'challenge', 'relationship'];

function calcGalaxySignal(logs) {
  const MIN_LOGS = 3;
  const THRESHOLD = 0.4;

  if (!logs || logs.length < MIN_LOGS) return { signal: 'miracle', scores: {}, can_transition: false };

  // 히스테리시스: 최근 5건만
  const recent = logs.slice(-5);
  const scores = { challenge: 0, growth: 0, relationship: 0, healing: 0 };

  for (const log of recent) {
    const eg = GALAXY_EMOTION_MAP[log.emotion?.trim()] ?? null;
    const hg = GALAXY_HELP_MAP[log.help_type?.trim()] ?? null;
    if (eg) scores[eg] += 1;
    if (hg) scores[hg] += 1;
  }

  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  if (total === 0) return { signal: 'miracle', scores, can_transition: false };

  const ratios = {};
  for (const [g, v] of Object.entries(scores)) ratios[g] = v / total;

  // 우선순위 순으로 임계치 체크 + 혼합 상태 보호 (2개 은하가 각각 35% 이상이면 유지)
  const overThreshold = GALAXY_PRIORITY.filter(g => ratios[g] >= THRESHOLD);
  const signal = overThreshold.length === 1 ? overThreshold[0] : 'miracle';

  return { signal, scores, ratios, can_transition: signal !== 'miracle' };
}

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/galaxy-signal — 은하 전환 신호 조회 (읽기 전용)
// 출력: { signal, can_transition, flow_message, scores, ratios }
// ─────────────────────────────────────────────
router.get('/stars/:id/galaxy-signal', async (req, res) => {
  try {
    const starId = req.params.id;

    const starCheck = await db.query('SELECT id FROM dt_stars WHERE id = $1', [starId]);
    if (starCheck.rowCount === 0) return res.status(404).json({ error: '별을 찾을 수 없습니다' });

    const logsResult = await db.query(
      `SELECT emotion, help_type FROM journey_logs
        WHERE journey_id IN (
          SELECT id FROM journeys WHERE user_id = (
            SELECT user_id FROM dt_stars WHERE id = $1
          )
        )
        ORDER BY created_at ASC`,
      [starId]
    );

    const { signal, scores, ratios, can_transition } = calcGalaxySignal(logsResult.rows);

    res.json({
      signal,
      can_transition,
      flow_message: can_transition ? GALAXY_FLOW_MESSAGES[signal] : null,
      scores,
      ratios,
      log_count: logsResult.rows.length,
    });

  } catch (err) {
    if (err.code === '42P01') return res.status(503).json({ error: 'journey_logs 또는 journeys 테이블 미적용' });
    console.error('[DT] GET /stars/:id/galaxy-signal error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/stars/:id/galaxy-signal/apply — 은하 전환 실제 적용
// can_transition=true일 때만 galaxy_id 업데이트
// 출력: { applied, signal, previous_galaxy, new_galaxy }
// ─────────────────────────────────────────────
router.post('/stars/:id/galaxy-signal/apply', async (req, res) => {
  try {
    const starId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id 필수' });

    // 소유자 확인
    const starResult = await db.query(
      `SELECT s.id, s.user_id, s.galaxy_id, g.code AS galaxy_code
         FROM dt_stars s
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE s.id = $1`,
      [starId]
    );
    if (starResult.rowCount === 0) return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    if (starResult.rows[0].user_id !== user_id) return res.status(403).json({ error: '본인의 별만 변경할 수 있습니다' });

    const star = starResult.rows[0];

    // 신호 계산
    const logsResult = await db.query(
      `SELECT emotion, help_type FROM journey_logs
        WHERE journey_id IN (SELECT id FROM journeys WHERE user_id = $1)
        ORDER BY created_at ASC`,
      [user_id]
    );
    const { signal, can_transition } = calcGalaxySignal(logsResult.rows);

    if (!can_transition) {
      return res.json({ applied: false, signal: 'miracle', reason: '아직 패턴이 형성되지 않았어요' });
    }

    if (star.galaxy_code === signal) {
      return res.json({ applied: false, signal, reason: '이미 같은 흐름 위에 있어요' });
    }

    // galaxy_id 조회 후 업데이트
    const galaxyRow = await db.query('SELECT id FROM dt_galaxies WHERE code = $1', [signal]);
    if (galaxyRow.rowCount === 0) return res.status(500).json({ error: '은하 데이터 없음' });

    await db.query('UPDATE dt_stars SET galaxy_id = $1 WHERE id = $2', [galaxyRow.rows[0].id, starId]);

    res.json({
      applied:          true,
      signal,
      flow_message:     GALAXY_FLOW_MESSAGES[signal],
      previous_galaxy:  star.galaxy_code,
      new_galaxy:       signal,
    });

  } catch (err) {
    if (err.code === '42P01') return res.status(503).json({ error: 'journey_logs 또는 journeys 테이블 미적용' });
    console.error('[DT] POST /stars/:id/galaxy-signal/apply error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// 은하별 추천 항로 매핑 (route_catalog에 없는 코드는 조회 시 자동 제외)
// ─────────────────────────────────────────────
const GALAXY_ROUTE_MAP = {
  healing:      { primary: 'yeosu_healing',    secondary: 'daily_basic',         reason: '요즘 마음을 조금 놓는 흐름이에요\n가볍게 하루를 기록해보는 것도 좋아요' },
  challenge:    { primary: 'north_challenge_core', secondary: 'yeosu_activity',  reason: '지금은 뭔가 해보고 싶은 흐름이에요\n작은 실행부터 시작해볼 수 있어요' },
  growth:       { primary: 'yeosu_reflection', secondary: 'daily_basic',         reason: '요즘 뭔가 정리되는 흐름이에요\n기록하면서 조금 또렷해질 수 있어요' },
  relationship: { primary: 'yeosu_social',     secondary: 'miracle_intro_route', reason: '요즘 따뜻한 연결이 느껴지는 흐름이에요\n함께하는 경험이 잘 맞을 것 같아요' },
  miracle:      { primary: 'miracle_intro_route', secondary: 'daily_basic',      reason: '일단 시작해보는 것만으로 충분해요\n작은 첫 걸음부터 함께해요' },
};

// ─────────────────────────────────────────────
// entry_mode 판단 헬퍼
// auto  : 명확한 단일 신호 (비율 ≥ 60%) + journey 이력 있음
// choose: miracle / 첫 사용자 / 비율 40~60% / miracle 계열 primary
// ─────────────────────────────────────────────
const MIRACLE_ROUTE_CODES = new Set(['miracle_intro_route', 'daily_basic']);
const AUTO_THRESHOLD = 0.6;

function calcEntryMode({ signal, ratios, journeyCount, primaryCode }) {
  if (signal === 'miracle')                        return { mode: 'choose', reason_code: 'no_signal' };
  if (journeyCount === 0)                          return { mode: 'choose', reason_code: 'first_user' };
  if (MIRACLE_ROUTE_CODES.has(primaryCode))        return { mode: 'choose', reason_code: 'miracle_route' };
  if ((ratios?.[signal] ?? 0) >= AUTO_THRESHOLD)  return { mode: 'auto',   reason_code: 'strong_signal' };
  return { mode: 'choose', reason_code: 'weak_signal' };
}

const ENTRY_MODE_MESSAGES = {
  auto:   '지금 흐름에 자연스럽게 연결됩니다',
  choose: '어떤 방향으로 시작할지 골라보세요',
};

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/route-recommendation — 은하 기반 항로 추천
// Query: ?journey_id=xxx (optional — 있으면 signal ranking 적용)
// 출력: { signal, reason, entry_mode, entry_message, primary, secondary, routes, ranking? }
// ─────────────────────────────────────────────
let recRankingService = null;
try { recRankingService = require('../services/recommendationRankingService'); } catch (_) {}

router.get('/stars/:id/route-recommendation', async (req, res) => {
  try {
    const starId    = req.params.id;
    const journeyId = req.query.journey_id ?? null; // optional — signal ranking용

    const starResult = await db.query('SELECT id, user_id FROM dt_stars WHERE id = $1', [starId]);
    if (starResult.rowCount === 0) return res.status(404).json({ error: '별을 찾을 수 없습니다' });

    const userId = starResult.rows[0].user_id;

    // 신호 계산 + journey 이력 수 (병렬)
    let signal = 'miracle';
    let ratios  = {};
    let journeyCount = 0;

    try {
      const [logsResult, jCountResult] = await Promise.all([
        db.query(
          `SELECT emotion, help_type FROM journey_logs
            WHERE journey_id IN (SELECT id FROM journeys WHERE user_id = $1)
            ORDER BY created_at ASC`,
          [userId]
        ),
        db.query('SELECT COUNT(*) AS cnt FROM journeys WHERE user_id = $1', [userId]),
      ]);
      const calc = calcGalaxySignal(logsResult.rows);
      signal        = calc.signal;
      ratios        = calc.ratios ?? {};
      journeyCount  = parseInt(jCountResult.rows[0].cnt, 10);
    } catch (_) { /* 테이블 미적용 시 miracle + choose */ }

    const mapping     = GALAXY_ROUTE_MAP[signal] ?? GALAXY_ROUTE_MAP.miracle;
    const { mode, reason_code } = calcEntryMode({
      signal,
      ratios,
      journeyCount,
      primaryCode: mapping.primary,
    });

    // ── Signal-Aware Ranking Layer ──────────────────────────────────
    let candidateCodes  = [mapping.primary, mapping.secondary].filter(Boolean);
    let rankingMeta     = null;

    if (journeyId && recRankingService) {
      try {
        const rankResult = await recRankingService.rank(candidateCodes, journeyId);
        if (rankResult.signal_used) {
          candidateCodes = rankResult.ranked;
          rankingMeta    = {
            signal_used:     true,
            dominant_context: rankResult.dominant?.context ?? null,
            dominant_emotion: rankResult.dominant?.emotion ?? null,
            top_score:        rankResult.top_score,
            score_breakdown:  rankResult.score_breakdown,
          };
          // 노출 기록 (fire-and-forget)
          recRankingService.recordExposure(journeyId, candidateCodes[0])
            .catch(e => console.error('[rec ranking] exposure 기록 실패:', e.message));
        }
      } catch (rankErr) {
        console.error('[rec ranking] ranking 실패 — 기존 순서 유지:', rankErr.message);
      }
    }
    // ── /Signal-Aware Ranking Layer ─────────────────────────────────

    const routeResult = await db.query(
      `SELECT route_code, route_name, theme
         FROM route_catalog
        WHERE route_code = ANY($1) AND active = TRUE
        ORDER BY array_position($1::text[], route_code)`,
      [candidateCodes]
    );

    res.json({
      signal,
      reason:        mapping.reason,
      entry_mode:    mode,                         // 'auto' | 'choose'
      entry_message: ENTRY_MODE_MESSAGES[mode],
      reason_code,                                 // 내부 디버그용
      primary:       candidateCodes[0] ?? mapping.primary,
      secondary:     candidateCodes[1] ?? mapping.secondary,
      routes:        routeResult.rows,
      ...(rankingMeta ? { ranking: rankingMeta } : {}),
    });

  } catch (err) {
    if (err.code === '42P01') return res.status(503).json({ error: 'route_catalog 미적용 — migration 062 실행 필요' });
    console.error('[DT] GET /stars/:id/route-recommendation error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/stars/:id/growth-summary — 별 성장 요약 집계
// 출력: { total_logs, latest, top_emotion, top_help, growth_sentences, summary_line }
// ─────────────────────────────────────────────
router.get('/stars/:id/growth-summary', async (req, res) => {
  try {
    const starId = req.params.id;

    // 별 존재 확인
    const starCheck = await db.query('SELECT id FROM dt_stars WHERE id = $1', [starId]);
    if (starCheck.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }

    // 전체 집계
    const aggResult = await db.query(
      `SELECT
         COUNT(*)                                              AS total_logs,
         mode() WITHIN GROUP (ORDER BY emotion_tag)           AS top_emotion,
         mode() WITHIN GROUP (ORDER BY help_tag)              AS top_help,
         MIN(created_at)                                      AS first_log_at,
         MAX(created_at)                                      AS last_log_at
       FROM growth_logs
       WHERE star_id = $1`,
      [starId]
    );
    const agg = aggResult.rows[0];

    // 최근 기록 1건
    const latestResult = await db.query(
      `SELECT day_type, emotion_tag, help_tag, growth_message, created_at
         FROM growth_logs
        WHERE star_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [starId]
    );

    // 성장 문장 목록 (최대 5건, 최신순)
    const sentencesResult = await db.query(
      `SELECT growth_message, created_at
         FROM growth_logs
        WHERE star_id = $1 AND growth_message IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 5`,
      [starId]
    );

    const totalLogs = parseInt(agg.total_logs, 10);

    // 대표 성장 문장 — 가장 긴 문장 선택 (내용이 많은 기록)
    const summaryLine = sentencesResult.rows.reduce((best, row) =>
      (row.growth_message?.length ?? 0) > (best?.length ?? 0) ? row.growth_message : best
    , null);

    res.json({
      total_logs:       totalLogs,
      first_log_at:     agg.first_log_at ?? null,
      last_log_at:      agg.last_log_at  ?? null,
      top_emotion:      agg.top_emotion  ?? null,
      top_help:         agg.top_help     ?? null,
      latest:           latestResult.rows[0] ?? null,
      growth_sentences: sentencesResult.rows.map(r => r.growth_message),
      summary_line:     summaryLine,
    });

  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'growth_logs 테이블 미적용 — migration 060 실행 필요' });
    }
    console.error('[DT] GET /stars/:id/growth-summary error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/journeys/start — 항로 시작 (route_catalog 연결)
// Body: { user_id, route_code }
// 출력: { journey: { id, route_code, started_at, completed_at } }
// ─────────────────────────────────────────────
router.post('/journeys/start', async (req, res) => {
  try {
    const { user_id, route_code } = req.body;

    if (!user_id || !route_code) {
      return res.status(400).json({ error: 'user_id, route_code 필수' });
    }

    // route_code 유효성 확인
    const routeCheck = await db.query(
      'SELECT route_code FROM route_catalog WHERE route_code = $1 AND active = TRUE',
      [route_code]
    );
    if (routeCheck.rowCount === 0) {
      return res.status(404).json({ error: `존재하지 않는 route_code: ${route_code}` });
    }

    const result = await db.query(
      `INSERT INTO journeys (user_id, route_code, status)
       VALUES ($1, $2, 'STARTED')
       RETURNING id, route_code, status, started_at, completed_at`,
      [user_id, route_code]
    );

    res.status(201).json({ journey: result.rows[0] });

  } catch (err) {
    if (err.code === '42P01') {
      console.warn('[DT] journeys 테이블 없음 — migration 064 미적용');
      return res.status(503).json({ error: 'journeys 테이블 미적용 — psql $DATABASE_URL -f database/migrations/064_journeys_route_code.sql' });
    }
    console.error('[DT] POST /journeys/start error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/journey-logs — 항로 반응 저장 (플랫 URL)
// Body: { journey_id, emotion, help_tag, growth_text }
// 출력: { log: { id, journey_id, emotion, help_tag, growth_text, created_at } }
// ─────────────────────────────────────────────
router.post('/journey-logs', async (req, res) => {
  try {
    const { journey_id, emotion, help_tag, growth_text } = req.body;

    if (!journey_id) {
      return res.status(400).json({ error: 'journey_id 필수' });
    }
    if (!emotion && !help_tag && !growth_text) {
      return res.status(400).json({ error: 'emotion, help_tag, growth_text 중 하나 이상 필요' });
    }

    // help_tag → help_type, growth_text → growth_line 으로 컬럼 매핑
    const result = await db.query(
      `INSERT INTO journey_logs (journey_id, emotion, help_type, growth_line)
       VALUES ($1, $2, $3, $4)
       RETURNING id, journey_id, emotion,
                 help_type   AS help_tag,
                 growth_line AS growth_text,
                 created_at`,
      [journey_id, emotion ?? null, help_tag ?? null, growth_text ?? null]
    );

    res.status(201).json({ log: result.rows[0] });

  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'journey_logs 테이블 미적용 — migration 061 실행 필요' });
    }
    console.error('[DT] POST /journey-logs error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/journey-logs?journey_id=... — 항로 반응 조회 (시간순)
// 출력: { logs: [...] }
// ─────────────────────────────────────────────
router.get('/journey-logs', async (req, res) => {
  try {
    const { journey_id } = req.query;

    if (!journey_id) {
      return res.status(400).json({ error: 'journey_id 쿼리 파라미터 필수' });
    }

    const result = await db.query(
      `SELECT id, journey_id, emotion,
              help_type   AS help_tag,
              growth_line AS growth_text,
              created_at
         FROM journey_logs
        WHERE journey_id = $1
        ORDER BY created_at ASC`,
      [journey_id]
    );

    res.json({ logs: result.rows });

  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'journey_logs 테이블 미적용 — migration 061 실행 필요' });
    }
    console.error('[DT] GET /journey-logs error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/journeys/from-recommendation — 추천 항로 → journey 자동 생성
// 중복 방지: user_id + status=STARTED 기준 기존 항로 있으면 재사용
// Body: { user_id, route_code }
// 출력: { journey: {...}, created: true|false }
// ─────────────────────────────────────────────
router.post('/journeys/from-recommendation', async (req, res) => {
  try {
    const { user_id, route_code } = req.body;

    if (!user_id || !route_code) {
      return res.status(400).json({ error: 'user_id, route_code 필수' });
    }

    // route_code 유효성 확인
    const routeCheck = await db.query(
      'SELECT route_code FROM route_catalog WHERE route_code = $1 AND active = TRUE',
      [route_code]
    );
    if (routeCheck.rowCount === 0) {
      return res.status(404).json({ error: `존재하지 않는 route_code: ${route_code}` });
    }

    // 중복 방지: 이미 STARTED 상태 journey 있으면 재사용
    const existing = await db.query(
      `SELECT id, route_code, status, started_at, completed_at
         FROM journeys
        WHERE user_id = $1 AND status = 'STARTED'
        LIMIT 1`,
      [user_id]
    );
    if (existing.rowCount > 0) {
      return res.status(200).json({ journey: existing.rows[0], created: false });
    }

    // 신규 생성
    const result = await db.query(
      `INSERT INTO journeys (user_id, route_code, status)
       VALUES ($1, $2, 'STARTED')
       RETURNING id, route_code, status, started_at, completed_at`,
      [user_id, route_code]
    );

    res.status(201).json({ journey: result.rows[0], created: true });

  } catch (err) {
    if (err.code === '42P01') {
      console.warn('[DT] journeys 테이블 없음 — migration 064/065 미적용');
      return res.status(503).json({ error: 'journeys 테이블 미적용 — migration 064, 065 실행 필요' });
    }
    console.error('[DT] POST /journeys/from-recommendation error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/journeys/:journeyId/log — 항로 로그 저장
// Body: { emotion, help_type, growth_line }
// 출력: { log: { id, journey_id, journeys_id, emotion, help_type, growth_line, created_at } }
// ─────────────────────────────────────────────
router.post('/journeys/:journeyId/log', async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { emotion, help_type, growth_line } = req.body;

    if (!emotion && !help_type && !growth_line) {
      return res.status(400).json({ error: 'emotion, help_type, growth_line 중 하나 이상 필요' });
    }

    // journeys 테이블에서 유효한 journey 확인 (migration 066 이후)
    let journeysId = null;
    try {
      const jCheck = await db.query(
        'SELECT id FROM journeys WHERE id = $1 AND status = $2',
        [journeyId, 'STARTED']
      );
      if (jCheck.rowCount > 0) journeysId = journeyId;
    } catch (_) { /* journeys 테이블 없으면 무시 */ }

    const result = await db.query(
      `INSERT INTO journey_logs (journey_id, journeys_id, emotion, help_type, growth_line)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, journey_id, journeys_id, emotion, help_type, growth_line, created_at`,
      [journeyId, journeysId, emotion ?? null, help_type ?? null, growth_line ?? null]
    );

    res.status(201).json({ log: result.rows[0] });

  } catch (err) {
    if (err.code === '42P01') {
      console.warn('[DT] journey_logs 테이블 없음 — migration 061 미적용');
      return res.status(503).json({ error: 'journey_logs 테이블 미적용 — psql $DATABASE_URL -f database/migrations/061_journey_logs.sql' });
    }
    if (err.code === '42703') {
      // journeys_id 컬럼 없음 (migration 066 미적용) — 구 컬럼으로 재시도
      try {
        const { journeyId: jId } = req.params;
        const { emotion, help_type, growth_line } = req.body;
        const result = await db.query(
          `INSERT INTO journey_logs (journey_id, emotion, help_type, growth_line)
           VALUES ($1, $2, $3, $4)
           RETURNING id, journey_id, emotion, help_type, growth_line, created_at`,
          [jId, emotion ?? null, help_type ?? null, growth_line ?? null]
        );
        return res.status(201).json({ log: result.rows[0] });
      } catch (retryErr) {
        console.error('[DT] journey_log retry error:', retryErr.message);
      }
    }
    console.error('[DT] POST /journeys/:journeyId/log error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dt/journeys/:journeyId/complete — 항로 완료 + 성장 데이터 변환
// journey_logs 집계 → growth_logs 1건 기록 + journeys.status=COMPLETED
// Body: { star_id, user_id }
// 출력: { journey, growth_log }
// ─────────────────────────────────────────────
router.post('/journeys/:journeyId/complete', async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { star_id, user_id } = req.body;

    if (!star_id || !user_id) {
      return res.status(400).json({ error: 'star_id, user_id 필수' });
    }

    // journey 확인
    const jResult = await db.query(
      'SELECT id, route_code, status FROM journeys WHERE id = $1 AND user_id = $2',
      [journeyId, user_id]
    );
    if (jResult.rowCount === 0) {
      return res.status(404).json({ error: 'journey를 찾을 수 없습니다' });
    }
    if (jResult.rows[0].status === 'COMPLETED') {
      return res.status(409).json({ error: '이미 완료된 journey입니다' });
    }

    // journey_logs 집계 (가장 많이 등장한 emotion / help_type)
    const logsResult = await db.query(
      `SELECT
         mode() WITHIN GROUP (ORDER BY emotion)   AS top_emotion,
         mode() WITHIN GROUP (ORDER BY help_type) AS top_help_type,
         string_agg(growth_line, ' / ' ORDER BY created_at) AS growth_summary
       FROM journey_logs
       WHERE journey_id = $1 AND growth_line IS NOT NULL`,
      [journeyId]
    );
    const agg = logsResult.rows[0];

    // growth_logs 변환 기록
    let growthLog = null;
    try {
      const glResult = await db.query(
        `INSERT INTO growth_logs (star_id, day_type, emotion_tag, help_tag, growth_message)
         VALUES ($1, 7, $2, $3, $4)
         RETURNING id, star_id, day_type, emotion_tag, help_tag, growth_message, created_at`,
        [star_id, agg.top_emotion ?? null, agg.top_help_type ?? null, agg.growth_summary ?? null]
      );
      growthLog = glResult.rows[0];
    } catch (glErr) {
      if (glErr.code !== '42P01') throw glErr;
      console.warn('[DT] growth_logs 테이블 없음 — migration 060 미적용, 변환 건너뜀');
    }

    // journey 완료 처리
    const completed = await db.query(
      `UPDATE journeys SET status = 'COMPLETED', completed_at = NOW()
       WHERE id = $1
       RETURNING id, route_code, status, started_at, completed_at`,
      [journeyId]
    );

    // K-지혜 — complete context 100% 노출
    let wisdom = null;
    try {
      const wRow = await db.query(
        `SELECT message FROM wisdom_pool w
          JOIN journeys j ON j.id = $1
          JOIN dt_galaxies g ON g.code = w.theme
          WHERE w.active = TRUE
          ORDER BY RANDOM() LIMIT 1`,
        [journeyId]
      );
      if (wRow.rowCount > 0) wisdom = wRow.rows[0].message;
    } catch (_) { /* wisdom_pool 미적용 무시 */ }

    res.json({ journey: completed.rows[0], growth_log: growthLog, wisdom });

  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'journeys 테이블 미적용 — migration 064, 065 실행 필요' });
    }
    console.error('[DT] POST /journeys/:journeyId/complete error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/wisdom/recommend — 은하 기반 K-지혜 추천
// Query: ?galaxy=healing  또는  ?star_id=uuid (star 기반 자동 감지)
// 출력: { message, intro }  — 은하명/출처 노출 없음
// ─────────────────────────────────────────────
// context별 노출 확률
const WISDOM_SHOW_PROB = { complete: 1.0, recommend: 0.5, star: 0.3 };

router.get('/wisdom/recommend', async (req, res) => {
  try {
    const context = req.query.context ?? 'star'; // complete | recommend | star
    const prob    = WISDOM_SHOW_PROB[context] ?? 0.3;
    const show    = Math.random() < prob;

    // show=false → 메시지 없이 즉시 반환 (complete는 항상 통과)
    if (!show) return res.json({ show: false, context });

    let galaxy = req.query.galaxy ?? null;

    if (!galaxy && req.query.star_id) {
      try {
        const starRow = await db.query('SELECT user_id FROM dt_stars WHERE id = $1', [req.query.star_id]);
        if (starRow.rowCount > 0) {
          const logsResult = await db.query(
            `SELECT emotion, help_type FROM journey_logs
              WHERE journey_id IN (SELECT id FROM journeys WHERE user_id = $1)
              ORDER BY created_at ASC`,
            [starRow.rows[0].user_id]
          );
          galaxy = calcGalaxySignal(logsResult.rows).signal;
        }
      } catch (_) {}
    }

    const result = galaxy && galaxy !== 'miracle'
      ? await db.query(
          'SELECT message FROM wisdom_pool WHERE theme = $1 AND active = TRUE ORDER BY RANDOM() LIMIT 1',
          [galaxy]
        )
      : await db.query(
          'SELECT message FROM wisdom_pool WHERE active = TRUE ORDER BY RANDOM() LIMIT 1'
        );

    if (result.rowCount === 0) return res.json({ show: false, context });

    res.json({ show: true, context, message: result.rows[0].message });

  } catch (err) {
    if (err.code === '42P01') return res.status(503).json({ error: 'wisdom_pool 미적용 — migration 068 실행 필요' });
    console.error('[DT] GET /wisdom/recommend error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dt/health — 헬스체크
// ─────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dreamtown-api', timestamp: new Date().toISOString() });
});

// ── POST /api/dt/upgrade — Day7 완주 직후 30일 여정 업그레이드 ─
// Body: { userId, starId }
// 원칙: Day7 완료 직후 1회만 — 강제 아님, 자연스러운 다음 단계
router.post('/upgrade', async (req, res) => {
  const { userId, starId } = req.body;
  if (!userId || !starId) return res.status(400).json({ error: 'userId, starId 필수' });

  // Day7 완료 확인 — 완주하지 않은 유저에게 제안 금지
  try {
    const { rows } = await db.query(
      `SELECT star_stage FROM dt_stars WHERE id = $1 AND user_id = $2`,
      [starId, userId]
    );
    if (!rows.length)               return res.status(404).json({ error: '별을 찾을 수 없어요' });
    if (rows[0].star_stage === 'day1') {
      return res.status(403).json({ error: 'Day7 완주 후 선택할 수 있어요' });
    }
  } catch (e) {
    console.error('[DT] upgrade star check error:', e.message);
  }

  // impact/upgrade_attempt 로그
  await flow.log({
    userId: String(userId),
    stage:  'impact',
    action: 'upgrade_attempt',
    value:  { star_id: starId, plan: '30day' },
    refId:  String(starId),
  }).catch(() => {});

  // NicePay 주문 생성
  let nicepayService;
  try {
    nicepayService = require('../services/nicepayService');
  } catch {
    return res.status(503).json({ error: '결제 서비스를 사용할 수 없습니다' });
  }

  try {
    const payment = await nicepayService.createPayment(24900, '소원꿈터 30일 여정');

    // dreamtown_flow에 order_id 저장 (콜백에서 day7_upgrade 감지용)
    await flow.log({
      userId: String(userId),
      stage:  'impact',
      action: 'upgrade_order_created',
      value:  { star_id: starId, order_id: payment.moid ?? payment.orderId, plan: '30day' },
      refId:  String(starId),
    }).catch(() => {});

    return res.json({
      ok:          true,
      payment_url: `/pay?moid=${encodeURIComponent(payment.moid ?? payment.orderId)}&amount=24900`,
      order_id:    payment.moid ?? payment.orderId,
      amount:      24900,
      plan:        '30day',
    });
  } catch (e) {
    console.error('[DT] upgrade NicePay error:', e.message);
    return res.status(500).json({ error: '결제 시작에 실패했습니다' });
  }
});

// ── POST /api/dt/stars/:id/complete — Day7 완주 확정 ────────────
// Body: { userId }
// 역할: star_stage day7 승격 + day7_complete 로그
router.post('/stars/:id/complete', async (req, res) => {
  const { id: starId } = req.params;
  const { userId }     = req.body;
  if (!userId) return res.status(400).json({ error: 'userId 필수' });

  try {
    // 이미 완료된 별인지 확인
    const { rows } = await db.query(
      `SELECT star_stage, user_id FROM dt_stars WHERE id = $1`,
      [starId]
    );
    if (!rows.length) return res.status(404).json({ error: '별을 찾을 수 없어요' });

    const star = rows[0];
    if (String(star.user_id) !== String(userId)) {
      return res.status(403).json({ error: '본인 별만 완료할 수 있어요' });
    }

    // 이미 day7 이상이면 중복 방지
    if (star.star_stage !== 'day1') {
      return res.json({ ok: true, already_completed: true, star_stage: star.star_stage });
    }

    // star_stage day1 → day7 승격
    await db.query(
      `UPDATE dt_stars SET star_stage = 'day7' WHERE id = $1`,
      [starId]
    );

    // day7_complete 로그
    await flow.log({
      userId: String(userId),
      stage:  'growth',
      action: 'day7_complete',
      value:  { star_id: starId, source: 'user_action' },
      refId:  String(starId),
    });

    return res.json({ ok: true, star_stage: 'day7', starId });
  } catch (e) {
    console.error('[DT] POST /stars/:id/complete error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

