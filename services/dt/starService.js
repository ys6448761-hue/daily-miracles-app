/**
 * services/dt/starService.js
 * Star Engine — 소원 → 별 생성 → Dream Log 시작 → Artifact Job 등록
 * Rule 1: 모든 데이터는 star_id에 연결된다
 */

const db = require('../../database/db');
const logService = require('./logService');
const artifactService = require('./artifactService');
const { makeLogger } = require('../../utils/logger');

// 순환 의존 방지 — lazy require
function getOrchestrator() {
  try { return require('./orchestrator/dtOrchestrator'); } catch { return null; }
}

const log = makeLogger('starService');

// gem_type → galaxy code 매핑
const GEM_GALAXY_MAP = {
  ruby:     'challenge',
  sapphire: 'growth',
  emerald:  'healing',
  diamond:  'miracle',
  citrine:  'relationship',
};

// 간단한 star name 생성 (랜덤)
const NATURE = ['바람','새벽','노을','햇살','별빛','달빛','파도','숲길','아침','은하'];
const ACTION = ['빛나는','흐르는','피어나는','걷는','품은','지키는','반짝이는','떠오르는'];

function randomStarName() {
  const n = NATURE[Math.floor(Math.random() * NATURE.length)];
  const a = ACTION[Math.floor(Math.random() * ACTION.length)];
  const code = n.charCodeAt(n.length - 1) - 44032;
  const particle = (code >= 0 && code % 28 !== 0) ? '을' : '를';
  return `${n}${particle} ${a} 별`;
}

/**
 * createStar — Star Engine 진입점
 *
 * @param {string} userId
 * @param {string} wishText
 * @param {object} opts  { gem_type?, yeosu_theme?, image_prompt? }
 * @returns {{ star, wish, dream_log_id, artifact_job }}
 */
async function createStar(userId, wishText, opts = {}) {
  const { gem_type = 'ruby', yeosu_theme = null, image_prompt = null } = opts;

  // ── 1. user 보장 ───────────────────────────────────────────
  const userCheck = await db.query('SELECT id FROM dt_users WHERE id = $1', [userId]);
  if (userCheck.rowCount === 0) {
    await db.query(
      'INSERT INTO dt_users (id, nickname) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [userId, 'Guest']
    );
  }

  // ── 2. wish 생성 ───────────────────────────────────────────
  const wishResult = await db.query(
    `INSERT INTO dt_wishes (user_id, wish_text, gem_type, yeosu_theme, status)
     VALUES ($1, $2, $3, $4, 'submitted')
     RETURNING id, wish_text`,
    [userId, wishText, gem_type, yeosu_theme]
  );
  const wish = wishResult.rows[0];

  // ── 3. star_seed 생성 ──────────────────────────────────────
  const seedResult = await db.query(
    `INSERT INTO dt_star_seeds (wish_id, seed_state) VALUES ($1, 'born') RETURNING id`,
    [wish.id]
  );
  const seedId = seedResult.rows[0].id;

  // ── 4. galaxy 조회 ─────────────────────────────────────────
  const galaxyCode = GEM_GALAXY_MAP[gem_type] || 'challenge';
  const galaxyResult = await db.query(
    `SELECT id FROM dt_galaxies WHERE code = $1 LIMIT 1`,
    [galaxyCode]
  );
  const galaxyId = galaxyResult.rows[0]?.id;
  if (!galaxyId) throw new Error(`galaxy not found: ${galaxyCode}`);

  // ── 5. star 생성 ───────────────────────────────────────────
  const starName = randomStarName();
  const starResult = await db.query(
    `INSERT INTO dt_stars (user_id, wish_id, star_seed_id, galaxy_id, star_name, star_stage)
     VALUES ($1, $2, $3, $4, $5, 'day1')
     RETURNING id, star_name, star_stage, created_at`,
    [userId, wish.id, seedId, galaxyId, starName]
  );
  const star = starResult.rows[0];

  // ── 6. wish 상태 → converted_to_star ──────────────────────
  await db.query(
    `UPDATE dt_wishes SET status = 'converted_to_star' WHERE id = $1`,
    [wish.id]
  );

  // ── 7. Dream Log — origin 기록 ────────────────────────────
  const dreamLogId = await logService.createLog(star.id, 'origin', {
    wish_id:   wish.id,
    wish_text: wishText,
    gem_type,
    galaxy:    galaxyCode,
  });

  // ── 8. Artifact Job — image 생성 큐 등록 ──────────────────
  const artifactJob = await artifactService.createJob(star.id, 'image', image_prompt);

  // ── 9. STAR_CREATED 이벤트 발행 (orchestrator) ───────────
  const orchestrator = getOrchestrator();
  if (orchestrator) {
    orchestrator.emitEvent(star.id, 'STAR_CREATED', {
      wish_id:   wish.id,
      wish_text: wishText,
      gem_type,
    }).catch(err => log.warn('STAR_CREATED 이벤트 발행 실패', { error: err.message }));
  }

  log.info('star 생성 완료', {
    star_id:       star.id,
    star_name:     starName,
    wish_id:       wish.id,
    artifact_job:  artifactJob.id,
  });

  return { star, wish, dream_log_id: dreamLogId, artifact_job: artifactJob };
}

module.exports = { createStar };
