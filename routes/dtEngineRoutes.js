/**
 * ═══════════════════════════════════════════════════════════
 * DreamTown Core Engine API — DEC-2026-0331-001
 * 등록 위치: /api/dt/engine
 *
 * POST   /star                Star Engine (소원→별→log→artifact)
 * POST   /wisdom              Aurora5 지혜 생성
 * POST   /choice              사용자 선택 기록
 * POST   /report              성장 리포트 생성
 * POST   /narrative           Narrative Engine (서사 생성 + 챕터 저장)
 * GET    /narrative/:starId   별의 서사 챕터 목록 조회
 * POST   /artifact            아티팩트 생성 큐 등록
 * GET    /artifact/:jobId     작업 상태 조회
 * GET    /star/:starId/logs   전체 dream_log 조회
 * ═══════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { makeLogger } = require('../utils/logger');

const starService      = require('../services/dt/starService');
const wisdomGenerator  = require('../services/dt/wisdomGenerator');
const choiceService    = require('../services/dt/choiceService');
const artifactService  = require('../services/dt/artifactService');
const logService       = require('../services/dt/logService');
const narrativeService    = require('../services/dt/narrativeService');
const wishJourneyEngine   = require('../services/dt/wishJourneyEngine');
const lifeSpotService     = require('../services/dt/lifeSpotService');
const starCareService     = require('../services/dt/starCareService');

const log = makeLogger('dtEngineRoutes');

// ── 별 존재 확인 헬퍼 ─────────────────────────────────────────
async function assertStarExists(starId) {
  const result = await db.query('SELECT id FROM dt_stars WHERE id = $1', [starId]);
  if (result.rows.length === 0) {
    const err = new Error('별을 찾을 수 없습니다');
    err.status = 404;
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════
// POST /star
// Star Engine: 소원 → 별 → Dream Log(origin) → Artifact Job(image)
// Body: { user_id, wish_text, gem_type?, yeosu_theme?, image_prompt? }
// ══════════════════════════════════════════════════════════════
router.post('/star', async (req, res) => {
  const { user_id, wish_text, gem_type, yeosu_theme, image_prompt } = req.body;

  if (!user_id || !wish_text) {
    return res.status(400).json({ error: 'user_id와 wish_text는 필수입니다' });
  }

  const validGems = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];
  if (gem_type && !validGems.includes(gem_type)) {
    return res.status(400).json({ error: `gem_type은 ${validGems.join('/')} 중 하나여야 합니다` });
  }

  try {
    const result = await starService.createStar(user_id, wish_text, {
      gem_type, yeosu_theme, image_prompt,
    });

    // 7일 케어 스케줄 자동 생성 (비동기 — 응답 블로킹 안 함)
    const { phone_number } = req.body;
    starCareService.scheduleStarCare(user_id, result.star.id, phone_number ?? null)
      .catch(e => log.warn('케어 스케줄 생성 실패 (계속)', { err: e.message }));

    return res.status(201).json({
      success: true,
      star:         result.star,
      wish_id:      result.wish.id,
      artifact_job: result.artifact_job,
      poll_url:     `/api/dt/engine/artifact/${result.artifact_job.id}`,
    });

  } catch (err) {
    log.error('star 생성 실패', { error: err.message });
    return res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /wisdom
// Aurora5 지혜 생성 + dream_log
// Body: { star_id, wish_text, phase? }
// ══════════════════════════════════════════════════════════════
router.post('/wisdom', async (req, res) => {
  const { star_id, wish_text, phase = 'day' } = req.body;

  if (!star_id || !wish_text) {
    return res.status(400).json({ error: 'star_id와 wish_text는 필수입니다' });
  }

  const validPhases = ['day', 'week', 'quarter', 'year'];
  if (!validPhases.includes(phase)) {
    return res.status(400).json({ error: `phase는 ${validPhases.join('/')} 중 하나여야 합니다` });
  }

  try {
    await assertStarExists(star_id);
    const wisdom = await wisdomGenerator.createWisdom(star_id, wish_text, phase);
    return res.status(201).json({ success: true, wisdom });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    log.error('wisdom 생성 실패', { error: err.message });
    return res.status(500).json({ error: '지혜 생성에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /choice
// 사용자 선택 기록 + dream_log
// Body: { star_id, choice_type, choice_value?, wisdom_id?, metadata? }
// ══════════════════════════════════════════════════════════════
router.post('/choice', async (req, res) => {
  const { star_id, choice_type, choice_value = '', wisdom_id = null, metadata = {} } = req.body;

  if (!star_id || !choice_type) {
    return res.status(400).json({ error: 'star_id와 choice_type은 필수입니다' });
  }

  try {
    await assertStarExists(star_id);
    const choice = await choiceService.createChoice(star_id, wisdom_id, choice_type, choice_value, metadata);
    return res.status(201).json({ success: true, choice });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    log.error('choice 기록 실패', { error: err.message });
    return res.status(500).json({ error: '선택 기록에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /report
// Growth Engine: 변화 분석 → summary 생성 → dt_growth_reports 저장
// Body: { star_id, period? }
// ══════════════════════════════════════════════════════════════
router.post('/report', async (req, res) => {
  const { star_id, period = 'week' } = req.body;

  if (!star_id) return res.status(400).json({ error: 'star_id는 필수입니다' });

  const validPeriods = ['week', 'month', 'quarter', 'year'];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ error: `period는 ${validPeriods.join('/')} 중 하나여야 합니다` });
  }

  try {
    await assertStarExists(star_id);

    // 해당 기간의 로그 수집
    const periodDays = { week: 7, month: 30, quarter: 90, year: 365 }[period];
    const logsResult = await db.query(
      `SELECT log_type, payload, created_at
       FROM dt_dream_logs
       WHERE star_id = $1
         AND created_at >= NOW() - INTERVAL '${periodDays} days'
       ORDER BY created_at ASC`,
      [star_id]
    );
    const logs = logsResult.rows;

    // 별 + 소원 텍스트 조회
    const starResult = await db.query(
      `SELECT s.star_name, w.wish_text
       FROM dt_stars s JOIN dt_wishes w ON s.wish_id = w.id
       WHERE s.id = $1`,
      [star_id]
    );
    const { star_name, wish_text } = starResult.rows[0] || {};

    // 지혜 + 선택 카운트
    const wisdomCount  = logs.filter(l => l.log_type === 'wisdom').length;
    const choiceCount  = logs.filter(l => l.log_type === 'choice').length;
    const voyageCount  = logs.filter(l => l.log_type === 'voyage').length;

    // Aurora5 분석 프롬프트
    const periodLabel = { week: '1주일', month: '1개월', quarter: '3개월', year: '1년' }[period];
    const analysisPrompt = `당신은 Aurora5입니다. 소원이의 ${periodLabel} 성장 여정을 분석합니다.

별 이름: ${star_name || '이름 없는 별'}
소원: "${wish_text || '알 수 없음'}"
기간: ${periodLabel}
기록된 이벤트: 총 ${logs.length}개 (지혜 ${wisdomCount}회, 선택 ${choiceCount}회, 여정 ${voyageCount}회)

JSON 형식으로 응답해주세요:
{
  "summary": "이 별이 ${periodLabel} 동안 걸어온 여정 요약 (2-3문장)",
  "pattern": "관찰된 행동/감정 패턴 (1문장)",
  "change_point": "가장 주목할 만한 변화 또는 전환점 (1문장)"
}`;

    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: analysisPrompt }],
      max_tokens: 400,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    let analysis = { summary: '', pattern: '', change_point: '' };
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch {
      analysis.summary = completion.choices[0].message.content.trim();
    }

    // dt_growth_reports 저장
    const reportResult = await db.query(
      `INSERT INTO dt_growth_reports (star_id, period, summary, pattern, change_point, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, period, summary, pattern, change_point, created_at`,
      [
        star_id, period,
        analysis.summary || '',
        analysis.pattern || '',
        analysis.change_point || '',
        JSON.stringify({ log_count: logs.length, wisdom_count: wisdomCount, choice_count: choiceCount }),
      ]
    );
    const report = reportResult.rows[0];

    // dream_log 기록
    await logService.createLog(star_id, 'growth', {
      report_id: report.id,
      period,
      log_count: logs.length,
    });

    return res.status(201).json({ success: true, report });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    log.error('report 생성 실패', { error: err.message });
    return res.status(500).json({ error: '리포트 생성에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /narrative
// Narrative Engine — 중복 방지 + 비동기 job
//   1. 24h 이내 done 챕터 존재 → 재사용 (200)
//   2. pending/processing job 존재 → 해당 job 반환 (200)
//   3. 없으면 새 job 생성 → 202
// Body: { star_id }
// ══════════════════════════════════════════════════════════════
router.post('/narrative', async (req, res) => {
  const { star_id } = req.body;
  if (!star_id) return res.status(400).json({ error: 'star_id는 필수입니다' });

  try {
    await assertStarExists(star_id);
    const result = await narrativeService.requestNarrative(star_id);

    if (result.reused) {
      return res.status(200).json({
        success: true,
        reused:  true,
        chapters: result.chapters,
      });
    }

    return res.status(202).json({
      success:  true,
      reused:   false,
      job_id:   result.job_id,
      status:   result.status,
      poll_url: `/api/dt/engine/narrative/job/${result.job_id}`,
    });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    log.error('narrative 요청 실패', { error: err.message });
    return res.status(500).json({ error: '서사 생성에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /narrative/job/:jobId
// Narrative job 상태 조회
// ══════════════════════════════════════════════════════════════
router.get('/narrative/job/:jobId', async (req, res) => {
  try {
    const job = await narrativeService.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'job을 찾을 수 없습니다' });
    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ error: 'job 조회에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /narrative/:starId
// 저장된 서사 챕터 목록 조회
// ══════════════════════════════════════════════════════════════
router.get('/narrative/:starId', async (req, res) => {
  try {
    await assertStarExists(req.params.starId);
    const narratives = await narrativeService.getNarratives(req.params.starId);
    return res.json({ success: true, narratives, count: narratives.length });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: '서사 조회에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /star/:starId/timeline
// 별의 전체 여정 타임라인 (책 UI 기반 데이터)
// ══════════════════════════════════════════════════════════════
router.get('/star/:starId/timeline', async (req, res) => {
  const { starId } = req.params;

  try {
    await assertStarExists(starId);

    // 병렬 조회
    const [starQ, logsQ, wisdomQ, choiceQ, reportQ, narrativeQ, artifactQ] = await Promise.all([
      db.query(
        `SELECT s.id, s.star_name, s.star_stage, s.created_at, w.wish_text, w.gem_type, g.name_ko AS galaxy
         FROM dt_stars s
         JOIN dt_wishes w ON s.wish_id = w.id
         JOIN dt_galaxies g ON s.galaxy_id = g.id
         WHERE s.id = $1`,
        [starId]
      ),
      db.query(
        `SELECT log_type, payload, created_at FROM dt_dream_logs
         WHERE star_id=$1 ORDER BY created_at ASC LIMIT 200`,
        [starId]
      ),
      db.query(
        `SELECT content, phase, created_at FROM dt_wisdom_logs
         WHERE star_id=$1 ORDER BY created_at DESC LIMIT 10`,
        [starId]
      ),
      db.query(
        `SELECT choice_type, choice_value, created_at FROM dt_choice_logs
         WHERE star_id=$1 ORDER BY created_at DESC LIMIT 20`,
        [starId]
      ),
      db.query(
        `SELECT period, summary, pattern, change_point, created_at FROM dt_growth_reports
         WHERE star_id=$1 ORDER BY created_at DESC LIMIT 5`,
        [starId]
      ),
      db.query(
        `SELECT chapter, title, content, created_at FROM dt_narrative_logs
         WHERE star_id=$1 ORDER BY chapter ASC`,
        [starId]
      ),
      db.query(
        `SELECT type, status, result_url, created_at FROM dt_artifact_jobs
         WHERE star_id=$1 AND status='done' ORDER BY created_at DESC LIMIT 5`,
        [starId]
      ),
    ]);

    const star = starQ.rows[0];

    // 이벤트 카운트 요약
    const logCounts = {};
    logsQ.rows.forEach(l => { logCounts[l.log_type] = (logCounts[l.log_type] || 0) + 1; });

    const daysSinceBirth = star
      ? Math.floor((Date.now() - new Date(star.created_at)) / 86400000)
      : 0;

    return res.json({
      success: true,
      star,
      stats: {
        days_since_birth: daysSinceBirth,
        log_counts:       logCounts,
        total_events:     logsQ.rows.length,
        wisdom_count:     wisdomQ.rows.length,
        choice_count:     choiceQ.rows.length,
        report_count:     reportQ.rows.length,
        chapter_count:    narrativeQ.rows.length,
        artifact_count:   artifactQ.rows.length,
      },
      wisdoms:    wisdomQ.rows,
      choices:    choiceQ.rows,
      reports:    reportQ.rows,
      chapters:   narrativeQ.rows,
      artifacts:  artifactQ.rows,
      dream_log:  logsQ.rows,
    });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    log.error('timeline 조회 실패', { error: err.message });
    return res.status(500).json({ error: '타임라인 조회에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /upgrade
// Monetization Agent CTA 조회 (프론트 렌더용)
// Query: ?star_id=
// ══════════════════════════════════════════════════════════════
router.get('/upgrade', async (req, res) => {
  const { star_id } = req.query;
  if (!star_id) return res.status(400).json({ error: 'star_id는 필수입니다' });

  try {
    await assertStarExists(star_id);
    // 가장 최근 monetization offer 조회
    const offerLog = await db.query(
      `SELECT payload FROM dt_dream_logs
       WHERE star_id=$1 AND log_type='voyage'
         AND payload->>'agent' = 'monetizationAgent'
       ORDER BY created_at DESC LIMIT 1`,
      [star_id]
    );
    if (offerLog.rows.length === 0) {
      return res.status(404).json({ offer_ready: false, message: '아직 업셀 제안이 없습니다' });
    }
    const payload = offerLog.rows[0].payload;
    return res.json({
      offer_ready:    true,
      offer_type:     payload.offer_type,
      headline:       payload.headline,
      cta_text:       payload.cta_text,
      payment_target: payload.payment_target,
      amount:         payload.amount,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: '업그레이드 정보 조회 실패' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /upgrade
// 업그레이드 결제 시작 → NicePay moid 생성 → /pay?moid= 반환
// Body: { star_id, plan }  또는 Query: ?star_id=&plan=
// ══════════════════════════════════════════════════════════════
router.post('/upgrade', async (req, res) => {
  const { star_id, plan = '30day' } = { ...req.query, ...req.body };
  if (!star_id) return res.status(400).json({ error: 'star_id는 필수입니다' });

  const PLAN_CONFIG = {
    'basic7': { amount:  9900, name: '소원꿈터 7일 여정' },
    '30day':  { amount: 24900, name: '소원꿈터 30일 여정' },
    'annual': { amount: 89000, name: '소원꿈터 1년 여정 + 책' },
  };
  const config = PLAN_CONFIG[plan];
  if (!config) return res.status(400).json({ error: `plan은 basic7/30day/annual 중 하나여야 합니다` });

  try {
    await assertStarExists(star_id);

    let nicepayService;
    try {
      nicepayService = require('../services/nicepayService');
    } catch {
      return res.status(503).json({ error: 'NicePay 서비스를 사용할 수 없습니다' });
    }

    const payment = await nicepayService.createPayment(config.amount, config.name);

    // dream_log에 결제 시작 기록
    await logService.createLog(star_id, 'voyage', {
      agent:      'monetizationAgent',
      event:      'upgrade_checkout_started',
      plan,
      amount:     config.amount,
      order_id:   payment.orderId,
    });

    return res.json({
      success:      true,
      payment_url:  `/pay?moid=${encodeURIComponent(payment.orderId)}&amount=${config.amount}`,
      order_id:     payment.orderId,
      amount:       config.amount,
      plan,
    });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    log.error('upgrade 결제 시작 실패', { error: err.message });
    return res.status(500).json({ error: '결제 시작에 실패했습니다' });
  }
});

// ── 결제 확인 헬퍼 (artifact 게이트) ─────────────────────────
async function assertPaymentConfirmed(starId) {
  const result = await db.query(`
    SELECT np.status
    FROM dt_dream_logs dl
    JOIN nicepay_payments np ON np.order_id = (dl.payload->>'order_id')
    WHERE dl.star_id = $1
      AND dl.payload->>'event' = 'upgrade_checkout_started'
      AND np.status = 'PAID'
    LIMIT 1
  `, [starId]);
  if (result.rows.length === 0) {
    const err = new Error('결제 완료 후 이미지를 생성할 수 있습니다');
    err.status = 402;
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════
// POST /artifact
// 아티팩트 생성 큐 등록 (202 Accepted)
// Body: { star_id, type, prompt? }
// ══════════════════════════════════════════════════════════════
router.post('/artifact', async (req, res) => {
  const { star_id, type = 'image', prompt = null } = req.body;

  if (!star_id) return res.status(400).json({ error: 'star_id는 필수입니다' });

  const validTypes = ['image', 'pdf', 'webtoon', 'video'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type은 ${validTypes.join('/')} 중 하나여야 합니다` });
  }
  if (type !== 'image') {
    return res.status(400).json({ error: `${type}은 Phase 2 이후 지원 예정`, supported: ['image'] });
  }

  try {
    await assertStarExists(star_id);
    await assertPaymentConfirmed(star_id);
    const job = await artifactService.createJob(star_id, type, prompt);
    await logService.createLog(star_id, 'artifact', { job_id: job.id, type });

    return res.status(202).json({
      success: true,
      job_id:   job.id,
      status:   'pending',
      poll_url: `/api/dt/engine/artifact/${job.id}`,
    });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    log.error('artifact 큐 등록 실패', { error: err.message });
    return res.status(500).json({ error: '아티팩트 생성 요청에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /artifact/:jobId
// 아티팩트 작업 상태 조회
// ══════════════════════════════════════════════════════════════
router.get('/artifact/:jobId', async (req, res) => {
  try {
    const job = await artifactService.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: '작업을 찾을 수 없습니다' });
    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ error: '상태 조회에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /star/:starId/logs
// 전체 dream_log 조회 (최신 100개)
// ══════════════════════════════════════════════════════════════
router.get('/star/:starId/logs', async (req, res) => {
  try {
    await assertStarExists(req.params.starId);
    const logs = await logService.getLogs(req.params.starId, 100);
    return res.json({ success: true, logs, count: logs.length });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: '로그 조회에 실패했습니다' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /journey
// Wish Journey Engine: 입력 1개 → (장소 반영) 상태/장면/행동/방향/기록
// Body: { user_id?, wish_text, user_state, life_spot_id?, history? }
// ══════════════════════════════════════════════════════════════
router.post('/journey', async (req, res) => {
  const { user_id, wish_text, user_state, life_spot_id, history } = req.body;

  if (!wish_text && !user_state) {
    return res.status(400).json({ error: 'wish_text 또는 user_state 중 하나는 필요합니다' });
  }

  try {
    // 장소 컨텍스트 조회 (없으면 null — 엔진은 계속 동작)
    const lifeSpot = user_id && life_spot_id
      ? await lifeSpotService.getSpotContext({ userId: user_id, lifeSpotId: life_spot_id })
      : null;

    const result = wishJourneyEngine.generateResponse({ wish_text, user_state, history, lifeSpot });

    // 장소 로그 저장 (비동기 — 응답 블로킹 안 함)
    if (user_id && lifeSpot) {
      lifeSpotService.saveLog({ userId: user_id, spotId: lifeSpot.id, engineResult: result })
        .then(() => lifeSpotService.touchSpot(lifeSpot.id))
        .catch(err => log.warn('spot 로그/통계 저장 실패', { err: err.message }));
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    log.error('journey 생성 실패', { err: err.message });
    return res.status(500).json({ error: '여정 생성에 실패했습니다' });
  }
});

module.exports = router;
