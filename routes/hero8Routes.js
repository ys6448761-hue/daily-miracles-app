/**
 * Hero8 Routes V4.2.1 - 정확히 8.0초 완성형 영상 생성 API
 * POST /api/video/hero8 - 영상 생성
 * GET /api/video/hero8/health - 헬스체크
 * GET /api/video/hero8/heroes - HERO 목록
 *
 * V4.2.1 HOTFIX:
 * - 8.0초 정확히 고정 (2.8+2.8+2.8-0.4)
 * - "college student" 제거 → "adult Korean woman"
 * - HERO별 완전 프롬프트 세트
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 서비스 로딩
let Hero8Builder = null;
let ImageGenerator = null;
let Hero8Renderer = null;
let Packager = null;
let constants = null;
let RunwayService = null;
let SampleGuardrail = null;

try {
  Hero8Builder = require('../services/hero8/Hero8Builder');
  ImageGenerator = require('../services/hero8/ImageGenerator');
  Hero8Renderer = require('../services/hero8/Hero8Renderer');
  Packager = require('../services/hero8/Packager');
  constants = require('../services/hero8/constants');
  RunwayService = require('../services/hero8/RunwayService');
  SampleGuardrail = require('../services/hero8/SampleGuardrail');
  console.log('✅ Hero8 V4.2.1 서비스 모듈 로드 완료');
  console.log('✅ Runway I2V + 가드레일 서비스 로드 완료');
} catch (error) {
  console.error('❌ Hero8 서비스 모듈 로드 실패:', error.message);
}

// 진행 중인 작업 추적
const activeJobs = new Map();

/**
 * GET /api/video/hero8/health
 * V4.2.1 시스템 헬스체크
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    version: '4.2.1',
    timestamp: new Date().toISOString(),
    services: {
      builder: Hero8Builder !== null,
      imageGenerator: ImageGenerator !== null,
      renderer: Hero8Renderer !== null,
      packager: Packager !== null
    },
    ffmpeg: { installed: false, version: null },
    openai: { configured: !!process.env.OPENAI_API_KEY },
    features: {
      heroes: constants ? Object.keys(constants.HEROES).length : 0,
      timing: constants ? constants.TIMING : null,
      cameraEffects: ['zoom-in', 'pan', 'zoom-out+hold']
    }
  };

  // FFmpeg 체크
  if (Hero8Renderer) {
    try {
      const renderer = new Hero8Renderer();
      const ffmpegStatus = await renderer.checkFFmpeg();
      health.ffmpeg = ffmpegStatus;
    } catch (e) {
      health.ffmpeg = { installed: false, error: e.message };
    }
  }

  // 전체 상태 판단
  const allServicesOk = Object.values(health.services).every(v => v);
  health.status = allServicesOk && health.ffmpeg.installed && health.openai.configured
    ? 'ok'
    : 'degraded';

  res.json(health);
});

/**
 * GET /api/video/hero8/heroes
 * 사용 가능한 HERO 목록 (V4.2.1)
 */
router.get('/heroes', (req, res) => {
  if (!constants) {
    return res.status(503).json({
      success: false,
      error: 'constants_not_loaded'
    });
  }

  const heroes = Object.entries(constants.HEROES).map(([id, hero]) => ({
    id,
    topic: hero.topic,
    location: hero.location,
    locationKo: hero.locationKo,
    time: hero.time,
    mood: hero.mood,
    subtitles: hero.subtitles,
    yeosuAnchors: hero.yeosuAnchors
  }));

  res.json({
    success: true,
    version: '4.2.1',
    count: heroes.length,
    heroes
  });
});

/**
 * GET /api/video/hero8/options
 * V4.2.1 옵션 조회 (무드, 가드레일 등)
 */
router.get('/options', (req, res) => {
  if (!constants) {
    return res.status(503).json({
      success: false,
      error: 'constants_not_loaded'
    });
  }

  res.json({
    success: true,
    version: '4.2.1',
    heroes: Object.keys(constants.HEROES),
    moods: Object.entries(constants.MOODS).map(([id, data]) => ({
      id,
      name: data.name,
      atmosphere: data.atmosphere
    })),
    timing: constants.TIMING,
    framing: constants.FRAMING,
    cameraEffects: constants.CAMERA_PLAN,
    guardrails: {
      character: constants.CHARACTER_DNA.characterLock,
      style: constants.STYLE_GUARDRAIL.styleLock,
      textZero: constants.TEXT_ZERO_LOCK.promptTail
    }
  });
});

/**
 * POST /api/video/hero8
 * V4.2.1 영상 생성 메인 API (정확히 8.0초)
 *
 * Request Body:
 * {
 *   "hero_id": "HERO1",        // HERO1~HERO5
 *   "topic": "오동도 아침",
 *   "mood": "calm",            // calm/hopeful/romantic/cozy/reflective/fresh
 *   "tier": "free"
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();

  console.log(`\n🎬 [${requestId}] Hero8 V4.2.1 영상 생성 요청`);

  // 서비스 로드 확인
  if (!Hero8Builder || !ImageGenerator || !Hero8Renderer || !Packager) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable',
      message: 'Hero8 서비스가 로드되지 않았습니다'
    });
  }

  try {
    const { hero_id = 'HERO1', topic, mood = 'calm', tier = 'free' } = req.body;

    // 입력 검증
    const validation = Hero8Builder.validateInput({ hero_id, topic, mood });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        errors: validation.errors
      });
    }

    // 작업 추적 시작
    activeJobs.set(requestId, {
      status: 'processing',
      heroId: hero_id,
      startedAt: new Date().toISOString(),
      stage: 'initializing'
    });

    // 비동기 모드 체크
    const asyncMode = req.query.async === 'true';

    if (asyncMode) {
      res.json({
        success: true,
        request_id: requestId,
        status: 'processing',
        message: 'Hero8 V4.2.1 영상 생성이 시작되었습니다.',
        status_url: `/api/video/hero8/status/${requestId}`
      });

      // 백그라운드 처리
      processHero8V421(requestId, { hero_id, topic, mood, tier }).catch(err => {
        console.error(`[${requestId}] 백그라운드 처리 실패:`, err);
        activeJobs.set(requestId, {
          status: 'failed',
          error: err.message
        });
      });

      return;
    }

    // 동기 모드: 완료까지 대기
    const result = await processHero8V421(requestId, { hero_id, topic, mood, tier });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [${requestId}] V4.2.1 완료 (${elapsed}초)`);

    res.json({
      success: true,
      version: '4.2.1',
      request_id: requestId,
      hero_id,
      elapsed_seconds: parseFloat(elapsed),
      download_url: result.urls.package,
      video_url: result.urls.video,
      meta: result.meta
    });

  } catch (error) {
    console.error(`❌ [${requestId}] 처리 실패:`, error);

    activeJobs.set(requestId, {
      status: 'failed',
      error: error.message
    });

    const statusCode = error.message.includes('금지된') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      request_id: requestId,
      error: error.name || 'processing_error',
      message: error.message
    });
  }
});

/**
 * GET /api/video/hero8/status/:id
 * 작업 상태 조회
 */
router.get('/status/:id', (req, res) => {
  const { id } = req.params;
  const job = activeJobs.get(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'job_not_found',
      message: `작업 ID ${id}를 찾을 수 없습니다`
    });
  }

  res.json({
    success: true,
    request_id: id,
    ...job
  });
});

/**
 * Hero8 V4.2.1 처리 메인 로직 (8.0초 정확)
 */
async function processHero8V421(requestId, input) {
  const updateStatus = (stage, details = {}) => {
    activeJobs.set(requestId, {
      status: 'processing',
      stage,
      heroId: input.hero_id,
      ...details,
      updatedAt: new Date().toISOString()
    });
  };

  // 1. V4.2.1 스토리 빌드 (HERO 직접 프롬프트)
  updateStatus('building_story');
  console.log(`  📝 [${requestId}] V4.2.1 스토리 빌드 (${input.hero_id})...`);

  const builder = new Hero8Builder();
  const { storyCard, kfPrompts, motionPrompts, subtitles, hero } = builder.build(input);

  console.log(`     HERO: ${hero.locationKo} (${hero.time})`);
  console.log(`     구도: WIDE → MEDIUM → CLOSE`);
  console.log(`     타이밍: 2.8+2.8+2.8-0.4 = 8.0초`);

  // 2. 출력 디렉토리 생성
  updateStatus('preparing_output');
  const packager = new Packager();
  const outputDir = await packager.createOutputDir(requestId);

  // 3. V4.2.1 이미지 생성 (구도 차이 강제)
  updateStatus('generating_images', { total: 3, shots: ['WIDE', 'MEDIUM', 'CLOSE'] });
  console.log(`  🎨 [${requestId}] V4.2.1 키프레임 생성 (WIDE→MEDIUM→CLOSE)...`);

  const imageGenerator = new ImageGenerator();
  const keyframes = await imageGenerator.generateKeyframes(kfPrompts, outputDir);

  // QA 실패한 키프레임 재생성
  const failedKeyframes = keyframes.filter(kf => !kf.success || !kf.qa?.passed);
  for (const failedKf of failedKeyframes) {
    const kfPrompt = kfPrompts.find(p => p.id === failedKf.id);
    if (kfPrompt) {
      const regenerated = await imageGenerator.regenerateKeyframe(kfPrompt, outputDir);
      const index = keyframes.findIndex(k => k.id === failedKf.id);
      if (index !== -1) {
        keyframes[index] = regenerated;
      }
    }
  }

  // 4. V4.2.1 비디오 렌더링 (다방향 Ken Burns, 8.0초)
  updateStatus('rendering_video', { effects: ['zoom-in', 'pan', 'zoom-out+hold'] });
  console.log(`  🎥 [${requestId}] V4.2.1 렌더링 (zoom-in→pan→zoom-out+hold)...`);

  const renderer = new Hero8Renderer();
  const video = await renderer.render(keyframes, outputDir);

  // 5. 패키징
  updateStatus('packaging');
  console.log(`  📦 [${requestId}] 패키징...`);

  const result = await packager.package({
    requestId,
    storyCard,
    keyframes,
    subtitles,
    video,
    outputDir
  });

  // 완료 상태 업데이트
  activeJobs.set(requestId, {
    status: 'completed',
    version: '4.2.1',
    heroId: input.hero_id,
    completedAt: new Date().toISOString(),
    download_url: result.urls.package,
    video_url: result.urls.video
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════
// Runway I2V 엔드포인트 (샘플 전용)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/video/hero8/runway/config
 * Runway 설정 및 가드레일 상태 확인
 */
router.get('/runway/config', (req, res) => {
  if (!RunwayService) {
    return res.status(503).json({
      success: false,
      error: 'runway_not_loaded'
    });
  }

  const runway = new RunwayService();
  res.json({
    success: true,
    ...runway.getConfig()
  });
});

/**
 * GET /api/video/hero8/runway/presets
 * 사용 가능한 모션 프리셋 목록
 */
router.get('/runway/presets', (req, res) => {
  if (!RunwayService) {
    return res.status(503).json({
      success: false,
      error: 'runway_not_loaded'
    });
  }

  const runway = new RunwayService();
  res.json({
    success: true,
    presets: runway.getMotionPresets()
  });
});

/**
 * POST /api/video/hero8/runway/motion
 * 샘플 이미지에 모션 추가 (가드레일 적용)
 *
 * Request Body:
 * {
 *   "imagePath": "output/{requestId}/keyframes/kf1.jpg",
 *   "preset": "smile",           // eyeBlink/hairWind/smile/breathe/paperPlane
 *   "sampleOnly": true,          // 필수 true
 *   "heroId": "HERO1",
 *   "topic": "오동도 아침"
 * }
 */
router.post('/runway/motion', async (req, res) => {
  const requestId = uuidv4();

  if (!RunwayService) {
    return res.status(503).json({
      success: false,
      error: 'runway_not_loaded'
    });
  }

  try {
    const {
      imagePath,
      preset = 'smile',
      sampleOnly = true,
      heroId = 'HERO',
      topic = ''
    } = req.body;

    // 입력 검증
    if (!imagePath) {
      return res.status(400).json({
        success: false,
        error: 'imagePath is required'
      });
    }

    // 가드레일 플래그 강제
    if (sampleOnly !== true) {
      return res.status(400).json({
        success: false,
        error: 'GUARDRAIL_ERROR: sampleOnly must be true',
        message: '실제 사용자 사진은 2차 승인 전까지 사용 불가합니다'
      });
    }

    console.log(`\n🎬 [${requestId}] Runway I2V 모션 생성 요청`);
    console.log(`   이미지: ${imagePath}`);
    console.log(`   프리셋: ${preset}`);

    // Runway 서비스 실행
    const runway = new RunwayService();

    // 출력 경로 설정
    const outputDir = require('path').dirname(imagePath);
    const baseName = require('path').basename(imagePath, '.jpg');
    const outputPath = require('path').join(outputDir, `${baseName}_motion.mp4`);

    const result = await runway.generateWithPreset(
      imagePath,
      preset,
      outputPath,
      { heroId, topic }
    );

    console.log(`✅ [${requestId}] Runway I2V 완료`);

    res.json({
      success: true,
      request_id: requestId,
      ...result
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Runway 실패:`, error.message);

    const statusCode = error.message.includes('GUARDRAIL') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      request_id: requestId,
      error: error.name || 'runway_error',
      message: error.message
    });
  }
});

/**
 * POST /api/video/hero8/runway/keyframes
 * Hero8 키프레임 전체에 모션 추가
 *
 * Request Body:
 * {
 *   "requestId": "a5fb054e-...",  // Hero8 생성 결과 ID
 *   "sampleOnly": true
 * }
 */
router.post('/runway/keyframes', async (req, res) => {
  const jobId = uuidv4();

  if (!RunwayService) {
    return res.status(503).json({
      success: false,
      error: 'runway_not_loaded'
    });
  }

  try {
    const { requestId, sampleOnly = true } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'requestId is required (Hero8 생성 결과 ID)'
      });
    }

    if (sampleOnly !== true) {
      return res.status(400).json({
        success: false,
        error: 'GUARDRAIL_ERROR: sampleOnly must be true'
      });
    }

    console.log(`\n🎬 [${jobId}] Runway 전체 키프레임 모션 생성`);

    // 키프레임 경로 구성
    const path = require('path');
    const fs = require('fs').promises;
    const outputDir = path.join(process.cwd(), 'output', requestId);

    // 키프레임 확인
    const keyframes = [];
    for (const id of ['kf1', 'kf2', 'kf3']) {
      const kfPath = path.join(outputDir, 'keyframes', `${id}.jpg`);
      try {
        await fs.access(kfPath);
        keyframes.push({
          id,
          path: kfPath,
          success: true,
          shot: ['WIDE', 'MEDIUM', 'CLOSE'][['kf1', 'kf2', 'kf3'].indexOf(id)]
        });
      } catch (e) {
        console.log(`  ⚠️ ${id}.jpg 없음`);
      }
    }

    if (keyframes.length === 0) {
      return res.status(404).json({
        success: false,
        error: `키프레임을 찾을 수 없습니다: ${outputDir}`
      });
    }

    // meta.json에서 HERO 정보 가져오기
    let hero = {};
    try {
      const metaPath = path.join(outputDir, 'meta.json');
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const meta = JSON.parse(metaContent);
      hero = {
        id: meta.story?.hero_id,
        topic: meta.story?.topic
      };
    } catch (e) {
      // meta.json 없어도 진행
    }

    // Runway 모션 생성
    const runway = new RunwayService();
    const results = await runway.addMotionToKeyframes(keyframes, outputDir, hero);

    console.log(`✅ [${jobId}] Runway 전체 완료: ${results.filter(r => r.success).length}/${keyframes.length}`);

    res.json({
      success: true,
      job_id: jobId,
      source_request_id: requestId,
      total: keyframes.length,
      completed: results.filter(r => r.success).length,
      results
    });

  } catch (error) {
    console.error(`❌ [${jobId}] Runway 키프레임 실패:`, error.message);

    res.status(500).json({
      success: false,
      job_id: jobId,
      error: error.message
    });
  }
});

/**
 * POST /api/video/hero8/guardrail/check
 * 이미지 경로 가드레일 사전 검증
 */
router.post('/guardrail/check', async (req, res) => {
  if (!SampleGuardrail) {
    return res.status(503).json({
      success: false,
      error: 'guardrail_not_loaded'
    });
  }

  const { imagePath, imagePaths } = req.body;

  const guardrail = new SampleGuardrail();

  if (imagePaths && Array.isArray(imagePaths)) {
    const result = guardrail.validateAll(imagePaths);
    return res.json({
      success: result.allAllowed,
      ...result
    });
  }

  if (imagePath) {
    const result = await guardrail.fullCheck(imagePath, { sampleOnly: true });
    return res.json({
      success: result.passed,
      ...result
    });
  }

  res.status(400).json({
    success: false,
    error: 'imagePath or imagePaths required'
  });
});

module.exports = router;
