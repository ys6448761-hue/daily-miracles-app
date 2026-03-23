/**
 * VideoJobOrchestrator — 상태머신 코어
 * AIL-2026-0219-VID-003
 *
 * QUEUED → BUILD → VALIDATE → RENDER → SUBTITLE → PACKAGE → DELIVER → DONE
 *
 * 기존 Hero8 서비스에 위임만 — 로직 중복 없음.
 * Phase 2+에서 SUBTITLE, CIx 등 점진적 확장.
 */

const { STATES, TRANSITIONS, RETRY_POLICIES, ERROR_CODES } = require('./constants');
const RetryManager = require('./RetryManager');
const VideoJobStore = require('./VideoJobStore');
const SubtitleConverter = require('./SubtitleConverter');
const FontManager = require('./FontManager');
const SubtitleBurnIn = require('./SubtitleBurnIn');
const KoreanIntegrityGate = require('./KoreanIntegrityGate');

const fsPromises = require('fs').promises;
const nodePath = require('path');

// 기존 서비스 로딩 (tolerant)
let Hero8Builder = null;
let ImageGenerator = null;
let Hero8Renderer = null;
let Packager = null;
let AdCreativeBuilder = null;
let AdCreativeValidator = null;

try { Hero8Builder = require('../hero8/Hero8Builder'); } catch (_) {}
try { ImageGenerator = require('../hero8/ImageGenerator'); } catch (_) {}
try { Hero8Renderer = require('../hero8/Hero8Renderer'); } catch (_) {}
try { Packager = require('../hero8/Packager'); } catch (_) {}
try { AdCreativeBuilder = require('../adCreative/AdCreativeBuilder'); } catch (_) {}
try { AdCreativeValidator = require('../adCreative/AdCreativeValidator'); } catch (_) {}

class VideoJobOrchestrator {
  constructor() {
    this.store = new VideoJobStore();
  }

  /**
   * 전이 유효성 검사
   */
  validateTransition(from, to) {
    const allowed = TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(
        `${ERROR_CODES.INVALID_TRANSITION}: ${from} → ${to} 불가. 허용: [${(allowed || []).join(', ')}]`
      );
    }
  }

  /**
   * 상태 전이 + DB 업데이트
   */
  async transitionTo(requestId, newState, meta = {}) {
    const job = await this.store.getJob(requestId);
    if (!job) throw new Error(`Job not found: ${requestId}`);
    this.validateTransition(job.status, newState);
    const updated = await this.store.updateState(requestId, newState, meta);
    console.log(`  📌 [VideoJob] ${requestId} → ${newState}`);
    return updated;
  }

  /**
   * 메인 실행 — POST 한 번으로 DONE까지
   */
  async execute(jobData) {
    // 1. Job 생성
    const job = await this.store.createJob(jobData);
    const rid = job.request_id;
    console.log(`\n🎬 [VideoJob] 시작: ${rid} (${job.job_type})`);

    try {
      // QUEUED → BUILD
      await this.transitionTo(rid, STATES.BUILD);
      const buildResult = await this._doBuild(job);

      // BUILD → VALIDATE
      await this.transitionTo(rid, STATES.VALIDATE);
      const validateResult = await this._doValidate(rid, buildResult, job);

      // VALIDATE 실패 → BUILD 롤백 (재시도 금지)
      if (!validateResult.pass) {
        await this.transitionTo(rid, STATES.BUILD);
        // 롤백 후 1회 재빌드
        const rebuild = await this._doBuild(job);
        await this.transitionTo(rid, STATES.VALIDATE);
        const revalidate = await this._doValidate(rid, rebuild, job);
        if (!revalidate.pass) {
          return await this.store.failJob(rid, ERROR_CODES.VALIDATION_FAILED, 'Validation failed after rollback');
        }
      }

      // VALIDATE → RENDER
      await this.transitionTo(rid, STATES.RENDER);
      const renderResult = await this._doRender(rid, buildResult, job);

      // RENDER → SUBTITLE
      await this.transitionTo(rid, STATES.SUBTITLE);
      const subtitleResult = await this._doSubtitle(rid, buildResult, renderResult, job);

      // SUBTITLE → PACKAGE
      await this.transitionTo(rid, STATES.PACKAGE);
      const packageResult = await this._doPackage(rid, buildResult, renderResult, subtitleResult, job);

      // PACKAGE → DELIVER
      await this.transitionTo(rid, STATES.DELIVER);
      const deliverResult = await this._doDeliver(rid, packageResult, job);

      // DELIVER → DONE
      await this.transitionTo(rid, STATES.DONE, {
        meta_json: deliverResult.meta || {},
        output_dir: deliverResult.outputDir || null,
      });

      console.log(`✅ [VideoJob] 완료: ${rid}`);
      return await this.store.getJob(rid);

    } catch (error) {
      console.error(`❌ [VideoJob] 실패: ${rid} — ${error.message}`);
      return await this.store.failJob(
        rid,
        error.errorCode || ERROR_CODES.UNKNOWN_ERROR,
        error.message
      );
    }
  }

  // ═══════════════════════════════════════════════════════
  // 단계별 핸들러 (기존 서비스에 위임)
  // ═══════════════════════════════════════════════════════

  /**
   * BUILD: 스토리 빌드 + 프롬프트 생성
   */
  async _doBuild(job) {
    if (job.job_type === 'adCreative' && AdCreativeBuilder) {
      const configId = job.config_id;
      if (!configId) throw Object.assign(new Error('config_id 필수'), { errorCode: ERROR_CODES.BUILD_FAILED });
      return { type: 'adCreative', creative: AdCreativeBuilder.build(configId) };
    }

    if (!Hero8Builder) {
      throw Object.assign(new Error('Hero8Builder 미로드'), { errorCode: ERROR_CODES.BUILD_FAILED });
    }

    const retryResult = await RetryManager.withRetry(
      async () => {
        const validation = Hero8Builder.validateInput({ hero_id: job.hero_id, topic: job.topic, mood: job.mood });
        if (!validation.valid) throw new Error(`입력 검증 실패: ${validation.errors.join(', ')}`);
        return Hero8Builder.build({ hero_id: job.hero_id, topic: job.topic, mood: job.mood });
      },
      RETRY_POLICIES.OPENAI_RUNWAY_NETWORK,
      { label: 'Hero8Builder.build' }
    );

    if (!retryResult.success) {
      throw Object.assign(retryResult.lastError || new Error('Build failed'), { errorCode: ERROR_CODES.BUILD_FAILED });
    }

    return { type: 'hero8', build: retryResult.result };
  }

  /**
   * VALIDATE: 가이드 검증
   */
  async _doValidate(requestId, buildResult, job) {
    if (buildResult.type === 'adCreative' && AdCreativeValidator) {
      const validation = AdCreativeValidator.validateAll(buildResult.creative);
      await this.store.updateState(requestId, STATES.VALIDATE, {
        meta_json: { validation_result: { pass: validation.pass, passed: validation.passed, total: validation.total } },
      });
      return validation;
    }

    // Hero8 — 기본 유효성 (빌드 결과 존재 확인)
    const build = buildResult.build;
    const pass = !!(build && build.storyCard && build.keyframePrompts && build.keyframePrompts.length === 3);
    return { pass, passed: pass ? 1 : 0, total: 1 };
  }

  /**
   * RENDER: 이미지 생성 + 영상 합성
   */
  async _doRender(requestId, buildResult, job) {
    // Phase 1: 기본 구조만 (실제 렌더는 Hero8 파이프라인에 위임)
    if (buildResult.type === 'adCreative') {
      // adCreative는 프롬프트만 생성 — 렌더 불필요 (사용자가 외부 도구에서 실행)
      return { rendered: false, reason: 'adCreative prompts only' };
    }

    if (!ImageGenerator || !Hero8Renderer) {
      throw Object.assign(new Error('ImageGenerator/Hero8Renderer 미로드'), { errorCode: ERROR_CODES.RENDER_FAILED });
    }

    const retryResult = await RetryManager.withRetry(
      async () => {
        const imgGen = new ImageGenerator();
        const renderer = new Hero8Renderer();
        const packager = new Packager();
        const outputDir = await packager.createOutputDir(job.request_id);

        // 키프레임 생성
        const keyframes = await imgGen.generateKeyframes(buildResult.build.keyframePrompts, outputDir);
        // 영상 합성
        const videoPath = await renderer.render(keyframes.map(kf => kf.path), outputDir);

        return { outputDir, keyframes, videoPath };
      },
      RETRY_POLICIES.OPENAI_RUNWAY_NETWORK,
      { label: 'Render pipeline' }
    );

    if (!retryResult.success) {
      throw Object.assign(retryResult.lastError || new Error('Render failed'), { errorCode: ERROR_CODES.RENDER_FAILED });
    }

    return retryResult.result;
  }

  /**
   * SUBTITLE: SRT → ASS → BurnIn → KOR Gate 전체 체인
   *
   * 1. SRT NFC + LF 정규화
   * 2. SubtitleConverter.srtToAss()
   * 3. FontManager.resolve() — hard fail
   * 4. SubtitleBurnIn (FFmpeg ass= 필터, 영상 있을 때만)
   * 5. KoreanIntegrityGate.runAll()
   * 6. KOR 실패 → CIx critical + FAILED
   */
  async _doSubtitle(requestId, buildResult, renderResult, job) {
    // adCreative: 프롬프트 전용 — 자막 파이프라인 불필요
    if (buildResult.type === 'adCreative') {
      return { subtitles: buildResult.creative.subtitles, format: 'json' };
    }

    const rawSubtitles = buildResult.build ? buildResult.build.subtitles : null;
    if (!rawSubtitles || !rawSubtitles.srt) {
      throw Object.assign(
        new Error('SRT 자막 없음'),
        { errorCode: ERROR_CODES.SUBTITLE_FAILED }
      );
    }

    // 1. NFC normalize + LF normalize
    const srtContent = rawSubtitles.srt.normalize('NFC').replace(/\r\n/g, '\n');
    console.log('  🔤 [SUBTITLE] SRT NFC+LF 정규화 완료');

    // 2. SRT → ASS 변환
    const assContent = SubtitleConverter.srtToAss(srtContent);
    console.log('  🔤 [SUBTITLE] SRT → ASS 변환 완료');

    // 3. 폰트 해석 — hard fail (시스템 폰트 fallback 절대 금지)
    const fontPath = FontManager.resolve();
    console.log(`  🔤 [SUBTITLE] 폰트 해석: ${fontPath}`);

    // 4. FFmpeg burn-in (렌더된 영상이 있을 때만)
    let burnInResult = null;
    if (renderResult && renderResult.videoPath) {
      const assPath = renderResult.videoPath.replace(/\.\w+$/, '.ass');
      await fsPromises.writeFile(assPath, assContent, 'utf-8');

      const outputPath = renderResult.videoPath.replace(/\.\w+$/, '_subtitled.mp4');
      const burnIn = new SubtitleBurnIn();

      const retryResult = await RetryManager.withRetry(
        async () => burnIn.burnIn(renderResult.videoPath, assPath, outputPath),
        RETRY_POLICIES.FFMPEG_RENDER,
        { label: 'SubtitleBurnIn' }
      );

      if (!retryResult.success) {
        throw Object.assign(
          retryResult.lastError || new Error('Subtitle burn-in failed'),
          { errorCode: ERROR_CODES.SUBTITLE_FAILED }
        );
      }

      burnInResult = retryResult.result;
      console.log('  🔤 [SUBTITLE] FFmpeg burn-in 완료');
      if (burnInResult.stderr) {
        console.log(`  🔤 [SUBTITLE] FFmpeg stderr: ${burnInResult.stderr.slice(0, 200)}`);
      }
    }

    // 5. KOR Gate 실행
    const korContext = {
      assContent,
      originalContent: srtContent,
    };

    // KOR-01 UTF-8 왕복 (outputDir 있을 때만)
    if (renderResult && renderResult.outputDir) {
      const verifyDir = nodePath.join(renderResult.outputDir, 'subtitles');
      try { await fsPromises.mkdir(verifyDir, { recursive: true }); } catch (_) {}
      korContext.filePath = nodePath.join(verifyDir, '_kor01_verify.srt');
    }

    // KOR-03 FFmpeg stderr
    if (burnInResult && burnInResult.stderr) {
      korContext.ffmpegStderr = burnInResult.stderr;
    }

    // KOR-05 렌더 프레임
    if (burnInResult && burnInResult.outputPath) {
      korContext.videoPath = burnInResult.outputPath;
    }

    const korResult = await KoreanIntegrityGate.runAll(korContext);
    console.log(`  🔤 [SUBTITLE] KOR Gate: ${korResult.passed}/${korResult.total} PASS`);

    // 6. KOR 실패 → CIx-Video critical + FAILED
    if (!korResult.pass) {
      const failDetails = korResult.results
        .filter(r => !r.pass)
        .map(r => `${r.id}: ${r.detail}`)
        .join('; ');
      throw Object.assign(
        new Error(`KOR Gate 실패: ${failDetails}`),
        { errorCode: ERROR_CODES.KOR_INTEGRITY_FAIL }
      );
    }

    return {
      srtContent,
      assContent,
      fontPath,
      burnInResult,
      korGateResult: korResult,
      subtitles: {
        ...rawSubtitles,
        srt: srtContent,
        ass: assContent,
      },
      format: 'ass',
    };
  }

  /**
   * PACKAGE: 패키징 (ZIP + UTF-8 무결성 검증)
   */
  async _doPackage(requestId, buildResult, renderResult, subtitleResult, job) {
    if (buildResult.type === 'adCreative') {
      return { packaged: false, reason: 'adCreative prompts only', outputDir: null };
    }

    if (!Packager) {
      throw Object.assign(new Error('Packager 미로드'), { errorCode: ERROR_CODES.PACKAGE_FAILED });
    }

    const packager = new Packager();
    const outputDir = renderResult.outputDir;
    const build = buildResult.build;

    const result = await packager.package({
      requestId: job.request_id,
      storyCard: build.storyCard,
      keyframes: renderResult.keyframes || [],
      subtitles: subtitleResult.subtitles,
      video: { duration: 8 },
      outputDir,
    });

    return { ...result, outputDir };
  }

  /**
   * DELIVER: 최종 전달 (URL 생성)
   */
  async _doDeliver(requestId, packageResult, job) {
    const outputDir = packageResult.outputDir;
    return {
      outputDir,
      meta: packageResult.meta || {},
      downloadUrl: outputDir ? `/output/${job.request_id}/output.zip` : null,
      videoUrl: outputDir ? `/output/${job.request_id}/final.mp4` : null,
    };
  }
}

module.exports = VideoJobOrchestrator;
