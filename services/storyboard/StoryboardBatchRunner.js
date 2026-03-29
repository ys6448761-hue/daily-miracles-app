/**
 * StoryboardBatchRunner.js
 * SeriesManifest → Hero8 파이프라인 순차 실행
 *
 * 설계 원칙:
 *  - Hero8 기존 로직 무변경 (얹는다)
 *  - processHero8V421 패턴 동일 적용
 *  - durationPreset → Hero8Renderer.render(keyframes, outputDir, presetName) 경유
 *  - 각 scene을 독립적인 job으로 생성 (병렬화 여지 유지)
 */

const { loadSeriesManifest } = require('./SeriesManifestLoader');
const Hero8Builder            = require('../hero8/Hero8Builder');
const ImageGenerator          = require('../hero8/ImageGenerator');
const Hero8Renderer           = require('../hero8/Hero8Renderer');
const Packager                = require('../hero8/Packager');

/**
 * scene 1개 렌더링
 * @param {Object} scene        - { sceneId, text, promptSeed, mood? }
 * @param {string} durationPreset - 'short' | 'default' | 'extended'
 * @returns {Promise<Object>}
 */
async function runSceneJob(scene, durationPreset) {
  // 1. 스토리 빌드
  const builder = new Hero8Builder();
  const { storyCard, kfPrompts, subtitles } = builder.build({
    hero_id: scene.promptSeed || 'HERO1',
    topic:   scene.text,
    mood:    scene.mood   || 'calm',
    tier:    'free',
  });

  // 2. 출력 디렉토리
  const packager = new Packager();
  const outputDir = await packager.createOutputDir(scene.sceneId);

  // 3. 키프레임 이미지 생성
  const imageGenerator = new ImageGenerator();
  const keyframes = await imageGenerator.generateKeyframes(kfPrompts, outputDir);

  // 4. 비디오 렌더 (durationPreset 경유)
  const renderer = new Hero8Renderer();
  const video = await renderer.render(keyframes, outputDir, durationPreset);

  return {
    sceneId: scene.sceneId,
    storyCard,
    keyframes,
    video,
    subtitles,
  };
}

/**
 * @param {string} seriesId - manifest 파일 ID (e.g. "dt-global-001")
 * @returns {Promise<{ seriesId, durationPreset, total, results: Array }>}
 */
async function runStoryboardBatch(seriesId) {
  const manifest = loadSeriesManifest(seriesId);
  const { scenes = [], durationPreset = 'default' } = manifest;

  if (scenes.length === 0) {
    throw new Error(`Manifest "${seriesId}" 에 scenes가 없습니다.`);
  }

  console.log(`\n🎬 StoryboardBatch 시작: ${seriesId} (${scenes.length}씬, preset=${durationPreset})`);

  const results = [];

  for (const scene of scenes) {
    console.log(`  ▶ Scene ${scene.sceneId}: "${scene.text}"`);
    const job = await runSceneJob(scene, durationPreset);
    results.push(job);
    console.log(`  ✅ Scene ${scene.sceneId} 완료 → ${job.video.path}`);
  }

  return {
    seriesId,
    durationPreset,
    total:   results.length,
    results,
  };
}

module.exports = { runStoryboardBatch };
