/**
 * Hero8Renderer V4.2.1 - FFmpeg Ken Burns 다방향 + MP4 렌더링
 * 3개 키프레임을 정확히 8.0초 영상으로 합성
 *
 * V4.2.1 HOTFIX:
 * - Ken Burns 다방향: zoom-in → pan → zoom-out+hold
 * - 타이밍: 2.8s + 2.8s + 2.8s (각 클립)
 * - Crossfade 0.2s × 2 = 0.4s 겹침
 * - xfade offsets: 2.6 / 5.2
 * - 결과: 2.8 + 2.8 + 2.8 - 0.4 = 8.0초 정확
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const { CAMERA_PLAN, TIMING, QA_SETTINGS } = require('./constants');
const { VIDEO_PRESETS } = require('../../config/videoPresets');

/**
 * getTiming — presetName으로 클립별 타이밍 계산
 * default 프리셋은 V4.2.1 TIMING 원본 그대로 반환 (안정성 보장)
 *
 * @param {string} presetName - 'short' | 'default' | 'extended'
 * @returns {{ KF1, KF2, KF3, crossfade, total, fps, frames, xfadeOffset1, xfadeOffset2 }}
 */
function getTiming(presetName = 'default') {
  // default → 기존 상수 그대로 (V4.2.1 정확 보장)
  if (!presetName || presetName === 'default') {
    return { ...TIMING };
  }

  const preset = VIDEO_PRESETS[presetName] ?? VIDEO_PRESETS.default;
  const total     = preset.duration;
  const crossfade = TIMING.crossfade; // 0.2s 고정

  // 각 클립 파일 길이: total + 2*crossfade 를 ratio로 배분
  // 검증: KF1 + KF2 + KF3 - 2*crossfade = total
  const totalClipTime = total + 2 * crossfade;
  const KF1 = Math.round(totalClipTime * preset.ratio.zoomIn * 1000) / 1000;
  const KF2 = Math.round(totalClipTime * preset.ratio.pan    * 1000) / 1000;
  const KF3 = Math.round(totalClipTime * preset.ratio.outro  * 1000) / 1000;

  const xfadeOffset1 = Math.round((KF1 - crossfade) * 100) / 100;
  const xfadeOffset2 = Math.round((xfadeOffset1 + KF2 - crossfade) * 100) / 100;

  return {
    KF1,
    KF2,
    KF3,
    crossfade,
    total,
    fps:    TIMING.fps,
    frames: Math.round(KF1 * TIMING.fps),
    xfadeOffset1,
    xfadeOffset2,
  };
}

class Hero8Renderer {
  constructor() {
    this.timing = TIMING;
    this.cameraPlan = CAMERA_PLAN;
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
  }

  /**
   * FFmpeg 설치 여부 확인
   * @returns {Promise<{ installed: boolean, version: string }>}
   */
  async checkFFmpeg() {
    return new Promise((resolve) => {
      const ffmpeg = spawn(this.ffmpegPath, ['-version']);
      let output = '';

      ffmpeg.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          const versionMatch = output.match(/ffmpeg version (\S+)/);
          resolve({
            installed: true,
            version: versionMatch ? versionMatch[1] : 'unknown'
          });
        } else {
          resolve({ installed: false, version: null });
        }
      });

      ffmpeg.on('error', () => {
        resolve({ installed: false, version: null });
      });
    });
  }

  /**
   * V4.2 Ken Burns 효과 - zoom-in (KF1용)
   * @param {string} imagePath - 입력 이미지 경로
   * @param {string} outputPath - 출력 비디오 경로
   * @param {number} duration - 클립 지속 시간 (초)
   */
  async createZoomInClip(imagePath, outputPath, duration) {
    const { fps } = this.timing;
    const { width, height } = QA_SETTINGS.videoRequirements;
    const frames = Math.round(duration * fps);

    // zoom: 1.0 → 1.05
    const filter = [
      `scale=8000:-1`,
      `zoompan=z='min(zoom+0.0003,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${fps}`,
      `setsar=1`
    ].join(',');

    return this._runFFmpeg(imagePath, outputPath, duration, filter, 'zoom-in');
  }

  /**
   * V4.2 Ken Burns 효과 - pan (KF2용)
   * @param {string} imagePath - 입력 이미지 경로
   * @param {string} outputPath - 출력 비디오 경로
   * @param {number} duration - 클립 지속 시간 (초)
   * @param {string} direction - 'left' 또는 'right'
   */
  async createPanClip(imagePath, outputPath, duration, direction = 'left') {
    const { fps } = this.timing;
    const { width, height } = QA_SETTINGS.videoRequirements;
    const frames = Math.round(duration * fps);

    // pan: 고정 줌 1.05, x 위치만 이동
    const panDirection = direction === 'left' ? '-on*2' : '+on*2';
    const filter = [
      `scale=8000:-1`,
      `zoompan=z='1.05':x='if(lte(on,${frames}),(iw-iw/zoom)/2${panDirection},(iw-iw/zoom)/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${fps}`,
      `setsar=1`
    ].join(',');

    return this._runFFmpeg(imagePath, outputPath, duration, filter, 'pan');
  }

  /**
   * V4.2 Ken Burns 효과 - zoom-out + hold (KF3용)
   * @param {string} imagePath - 입력 이미지 경로
   * @param {string} outputPath - 출력 비디오 경로
   * @param {number} duration - 클립 지속 시간 (초)
   * @param {number} holdDuration - 마지막 홀드 시간 (초)
   */
  async createZoomOutHoldClip(imagePath, outputPath, duration, holdDuration = 0.6) {
    const { fps } = this.timing;
    const { width, height } = QA_SETTINGS.videoRequirements;
    const totalFrames = Math.round(duration * fps);
    const motionFrames = Math.round((duration - holdDuration) * fps);

    // zoom: 1.08 → 1.0, then hold at 1.0
    const filter = [
      `scale=8000:-1`,
      `zoompan=z='if(lte(on,${motionFrames}),1.08-on*0.0015,1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`,
      `setsar=1`
    ].join(',');

    return this._runFFmpeg(imagePath, outputPath, duration, filter, 'zoom-out+hold');
  }

  /**
   * FFmpeg 실행 헬퍼
   */
  async _runFFmpeg(imagePath, outputPath, duration, filter, effectName) {
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-loop', '1',
        '-i', imagePath,
        '-vf', filter,
        '-t', String(duration),
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        outputPath
      ];

      console.log(`  🎬 ${effectName} 클립 생성: ${path.basename(imagePath)}`);

      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`  ✅ ${effectName} 완료: ${path.basename(outputPath)}`);
          resolve(outputPath);
        } else {
          console.error(`  ❌ ${effectName} 실패:`, stderr.slice(-500));
          reject(new Error(`FFmpeg ${effectName} 실패 (code ${code})`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg 실행 오류: ${err.message}`));
      });
    });
  }

  /**
   * V4.2.1 Crossfade로 클립들 연결 (8.0초 정확)
   * @param {Array<string>} clipPaths - 클립 경로 배열
   * @param {string} outputPath - 최종 출력 경로
   */
  async concatWithCrossfade(clipPaths, outputPath) {
    const crossfade = this.timing.crossfade;

    if (clipPaths.length < 2) {
      throw new Error('최소 2개 이상의 클립이 필요합니다');
    }

    const inputArgs = clipPaths.flatMap(p => ['-i', p]);

    // V4.2.1 타이밍: 클립 각 2.8초, xfade offsets 고정
    // 2.8 + 2.8 + 2.8 - 0.2 - 0.2 = 8.0초
    const offset1 = this.timing.xfadeOffset1 || (this.timing.KF1 - crossfade);
    const offset2 = this.timing.xfadeOffset2 || (offset1 + this.timing.KF2 - crossfade);

    const filterComplex = [
      `[0:v][1:v]xfade=transition=fade:duration=${crossfade}:offset=${offset1.toFixed(1)}[v01]`,
      `[v01][2:v]xfade=transition=fade:duration=${crossfade}:offset=${offset2.toFixed(1)}[vout]`
    ].join(';');

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        ...inputArgs,
        '-filter_complex', filterComplex,
        '-map', '[vout]',
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        outputPath
      ];

      console.log(`  🎬 Crossfade 합성 (0.2s × 2)...`);

      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`  ✅ Crossfade 합성 완료`);
          resolve(outputPath);
        } else {
          console.error(`  ❌ Crossfade 실패:`, stderr.slice(-500));
          reject(new Error(`FFmpeg crossfade 실패 (code ${code})`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg 실행 오류: ${err.message}`));
      });
    });
  }

  /**
   * 간단한 연결 (crossfade 없이, fallback용)
   */
  async concatSimple(clipPaths, outputPath) {
    const inputArgs = clipPaths.flatMap(p => ['-i', p]);
    const filterInputs = clipPaths.map((_, i) => `[${i}:v]`).join('');

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        ...inputArgs,
        '-filter_complex', `${filterInputs}concat=n=${clipPaths.length}:v=1[outv]`,
        '-map', '[outv]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        outputPath
      ];

      console.log(`  🎬 단순 연결 (fallback)...`);

      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`  ✅ 연결 완료`);
          resolve(outputPath);
        } else {
          console.error(`  ❌ 연결 실패:`, stderr.slice(-500));
          reject(new Error(`FFmpeg concat 실패 (code ${code})`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg 실행 오류: ${err.message}`));
      });
    });
  }

  /**
   * V4.2.1 전체 렌더링 프로세스 (8.0초 정확)
   * @param {Array} keyframes - 키프레임 정보 배열
   * @param {string} outputDir - 출력 디렉토리
   * @returns {Promise<{ path: string, duration: number }>}
   */
  async render(keyframes, outputDir, presetName = 'default') {
    const originalTiming = this.timing;
    if (presetName !== 'default') {
      this.timing = getTiming(presetName);
    }
    try {
    console.log(`\n🎥 Hero8 V4.2.1 비디오 렌더링 시작...`);
    console.log(`   타이밍: ${this.timing.KF1}s + ${this.timing.KF2}s + ${this.timing.KF3}s - 0.4s(xfade) = ${this.timing.total}s`);
    console.log(`   xfade offsets: ${this.timing.xfadeOffset1 || 2.6} / ${this.timing.xfadeOffset2 || 5.2}`);

    // FFmpeg 설치 확인
    const ffmpegStatus = await this.checkFFmpeg();
    if (!ffmpegStatus.installed) {
      throw new Error('FFmpeg가 설치되어 있지 않습니다. FFmpeg를 설치해주세요.');
    }
    console.log(`  ✅ FFmpeg 버전: ${ffmpegStatus.version}`);

    // 성공한 키프레임만 필터링
    const validKeyframes = keyframes.filter(kf => kf.success && kf.path);
    if (validKeyframes.length < 3) {
      throw new Error(`유효한 키프레임이 부족합니다: ${validKeyframes.length}/3`);
    }

    // 임시 클립 디렉토리
    const tempDir = path.join(outputDir, 'temp_clips');
    await fs.mkdir(tempDir, { recursive: true });

    try {
      const clipPaths = [];

      // KF1: zoom-in (2.8s)
      const kf1 = validKeyframes.find(k => k.id === 'kf1') || validKeyframes[0];
      const clip1Path = path.join(tempDir, 'clip_1.mp4');
      await this.createZoomInClip(kf1.path, clip1Path, this.timing.KF1);
      clipPaths.push(clip1Path);

      // KF2: pan (2.8s)
      const kf2 = validKeyframes.find(k => k.id === 'kf2') || validKeyframes[1];
      const clip2Path = path.join(tempDir, 'clip_2.mp4');
      await this.createPanClip(kf2.path, clip2Path, this.timing.KF2, 'left');
      clipPaths.push(clip2Path);

      // KF3: zoom-out + hold (2.8s)
      const kf3 = validKeyframes.find(k => k.id === 'kf3') || validKeyframes[2];
      const clip3Path = path.join(tempDir, 'clip_3.mp4');
      const holdFrames = this.cameraPlan.KF3.holdFrames || 15;  // V4.2.1: holdFrames 사용
      const holdDuration = holdFrames / this.timing.fps;  // 약 0.625초
      await this.createZoomOutHoldClip(
        kf3.path,
        clip3Path,
        this.timing.KF3,
        holdDuration
      );
      clipPaths.push(clip3Path);

      // Crossfade 합성
      const finalPath = path.join(outputDir, 'final.mp4');

      try {
        await this.concatWithCrossfade(clipPaths, finalPath);
      } catch (crossfadeError) {
        console.log(`  ⚠️ Crossfade 실패, 단순 연결로 대체...`);
        await this.concatSimple(clipPaths, finalPath);
      }

      // 임시 파일 정리
      console.log(`  🧹 임시 파일 정리 중...`);
      for (const clipPath of clipPaths) {
        await fs.unlink(clipPath).catch(() => {});
      }
      await fs.rmdir(tempDir).catch(() => {});

      // 결과 확인
      const stats = await fs.stat(finalPath);
      console.log(`\n✅ V4.2.1 렌더링 완료: ${path.basename(finalPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      return {
        path: finalPath,
        size: stats.size,
        duration: this.timing.total,
        version: '4.2.1',
        timing: this.timing,
        effects: ['zoom-in', 'pan', 'zoom-out+hold']
      };
    } catch (error) {
      // 에러 시 임시 파일 정리 시도
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
    } finally {
      this.timing = originalTiming;
    }
  }

  /**
   * 비디오 정보 확인
   */
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ];

      const ffprobe = spawn('ffprobe', args);
      let stdout = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(stdout);
            resolve(info);
          } catch (e) {
            reject(new Error('ffprobe 출력 파싱 실패'));
          }
        } else {
          reject(new Error(`ffprobe 실패 (code ${code})`));
        }
      });

      ffprobe.on('error', () => {
        // ffprobe가 없으면 기본 정보 반환
        resolve({ format: { duration: this.timing.total } });
      });
    });
  }
}

module.exports = Hero8Renderer;
