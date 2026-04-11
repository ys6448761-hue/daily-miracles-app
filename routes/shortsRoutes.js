/**
 * shortsRoutes.js
 * YouTube Shorts 자동 생성 파이프라인 API
 *
 * 설계:
 *  - 신규 엔진 없음: ShortsManifestBuilder → Hero8Builder → ImageGenerator
 *    → ShortsRenderer(Hero8Renderer 재사용) → ShortsPackager(Packager 재사용)
 *  - 비동기 202 패턴 (storyboardRoutes/hero8Routes 동일)
 *  - in-memory 상태 관리 (VideoJobStore 미사용 — 경량)
 *
 * Endpoints:
 *   GET  /api/shorts/templates        — 사용 가능한 템플릿 목록
 *   POST /api/shorts/generate         — Short 1개 생성 (async 202)
 *   GET  /api/shorts/status/:id       — 생성 상태 폴링
 *   POST /api/shorts/sample           — 샘플 3종 자동 생성 (async 202)
 */

const express = require('express');
const router  = express.Router();
const { randomUUID } = require('crypto');

const { listTemplates }           = require('../services/shorts/ShortsTemplateRegistry');
const { buildManifest, buildSampleManifests } = require('../services/shorts/ShortsManifestBuilder');
const ShortsRenderer              = require('../services/shorts/ShortsRenderer');
const ShortsPackager              = require('../services/shorts/ShortsPackager');
const Hero8Builder                = require('../services/hero8/Hero8Builder');
const ImageGenerator              = require('../services/hero8/ImageGenerator');

// ── in-memory 작업 상태 저장소 ─────────────────────────────────────
const shortsJobs = new Map();
// { requestId → { status, manifest, result, error, createdAt } }

// ── 내부 파이프라인 실행 ────────────────────────────────────────────
/**
 * 매니페스트의 첫 번째 씬 하나를 실제 렌더링
 * @param {string} requestId
 * @param {Object} manifest  - ShortsManifestBuilder.buildManifest() 결과
 */
async function runShortsJob(requestId, manifest) {
  const job = shortsJobs.get(requestId);
  job.status = 'running';

  try {
    const scene    = manifest.scenes[0];
    const packager = new ShortsPackager();

    // 1. 출력 디렉토리
    const outputDir = await packager.createOutputDir(requestId);

    // 2. 스토리 빌드 (Hero8Builder 재사용)
    const builder = new Hero8Builder();
    const { storyCard, kfPrompts, subtitles } = builder.build({
      hero_id: scene.promptSeed || 'HERO1',
      topic:   scene.text,
      mood:    scene.mood || 'calm',
      tier:    'free',
    });

    // 3. 키프레임 이미지 생성 (DALL-E 3)
    const imageGenerator = new ImageGenerator();
    const keyframes = await imageGenerator.generateKeyframes(kfPrompts, outputDir);

    // 4. 렌더링 (Hero8Renderer, short preset 6초 9:16)
    const renderer = new ShortsRenderer();
    const video    = await renderer.render(keyframes, outputDir);

    // 5. 패키징 (thumbnail + metadata.json + zip)
    const result = await packager.package({
      requestId,
      storyCard,
      keyframes,
      subtitles,
      video,
      outputDir,
      shorts_metadata: manifest.shorts_metadata,
    });

    job.status = 'done';
    job.result = {
      requestId,
      templateId:      manifest.templateId,
      title:           manifest.title,
      durationPreset:  manifest.durationPreset,
      aspectRatio:     manifest.aspectRatio,
      urls:            result.urls,
      shorts_metadata: result.shorts_metadata,
      outputDir,
    };

    console.log(`✅ [Shorts] ${requestId} 완료 — ${manifest.title}`);

  } catch (err) {
    job.status = 'failed';
    job.error  = err.message;
    console.error(`❌ [Shorts] ${requestId} 실패:`, err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /api/shorts/templates — 템플릿 목록
// ═══════════════════════════════════════════════════════════════
router.get('/templates', (req, res) => {
  res.json({ templates: listTemplates() });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/shorts/generate — Short 1개 생성
// Body: { templateId, wishText?, heroId?, mood? }
// ═══════════════════════════════════════════════════════════════
router.post('/generate', async (req, res) => {
  const { templateId, wishText, heroId, mood } = req.body || {};

  if (!templateId) {
    return res.status(400).json({ error: 'templateId is required' });
  }

  let manifest;
  try {
    manifest = buildManifest({ templateId, wishText, heroId, mood });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const requestId = randomUUID();
  shortsJobs.set(requestId, {
    status:    'queued',
    manifest,
    result:    null,
    error:     null,
    createdAt: new Date().toISOString(),
  });

  // 비동기 실행
  setImmediate(() => runShortsJob(requestId, manifest));

  res.status(202).json({
    requestId,
    status:     'queued',
    templateId: manifest.templateId,
    title:      manifest.title,
    status_url: `/api/shorts/status/${requestId}`,
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/shorts/status/:id — 상태 폴링
// ═══════════════════════════════════════════════════════════════
router.get('/status/:id', (req, res) => {
  const job = shortsJobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    requestId:  req.params.id,
    status:     job.status,
    templateId: job.manifest?.templateId,
    title:      job.manifest?.title,
    createdAt:  job.createdAt,
    result:     job.status === 'done'    ? job.result : undefined,
    error:      job.status === 'failed'  ? job.error  : undefined,
  });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/shorts/sample — 샘플 3종 자동 생성
// 템플릿: single_wish(HERO1), question_prompt(HERO2), brand_close(HERO4)
// ═══════════════════════════════════════════════════════════════
router.post('/sample', async (req, res) => {
  const manifests = buildSampleManifests();

  const jobs = manifests.map(manifest => {
    const requestId = randomUUID();
    shortsJobs.set(requestId, {
      status:    'queued',
      manifest,
      result:    null,
      error:     null,
      createdAt: new Date().toISOString(),
    });
    setImmediate(() => runShortsJob(requestId, manifest));
    return {
      requestId,
      templateId: manifest.templateId,
      title:      manifest.title,
      status_url: `/api/shorts/status/${requestId}`,
    };
  });

  console.log(`🎬 [Shorts] 샘플 3종 생성 시작: ${jobs.map(j => j.templateId).join(', ')}`);

  res.status(202).json({
    message: '샘플 3종 생성 시작됨 (비동기)',
    total:   jobs.length,
    jobs,
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/shorts/jobs — 전체 작업 목록 (최신 20개)
// ═══════════════════════════════════════════════════════════════
router.get('/jobs', (req, res) => {
  const all = Array.from(shortsJobs.entries())
    .map(([requestId, job]) => ({
      requestId,
      status:     job.status,
      templateId: job.manifest?.templateId,
      title:      job.manifest?.title,
      createdAt:  job.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  res.json({ total: all.length, jobs: all });
});

module.exports = router;
