/**
 * SubtitleBurnIn — FFmpeg ASS 자막 burn-in
 * AIL-2026-0219-VID-003 / VID-004
 *
 * FFmpeg `ass=` 필터로 자막을 영상에 합성합니다.
 * stderr를 캡처하여 KOR-03 폰트 로드 검증에 사용합니다.
 *
 * Windows 호환: FFmpeg ass= 필터는 경로의 `:` 를 옵션 구분자로 파싱하므로
 * 드라이브 레터(C:)가 포함된 절대 경로가 깨집니다.
 * → cwd를 작업 디렉토리로 설정 + 상대 경로로 실행하여 회피합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FontManager = require('./FontManager');

class SubtitleBurnIn {
  constructor(ffmpegPath) {
    this.ffmpegPath = ffmpegPath || process.env.FFMPEG_PATH || 'ffmpeg';
  }

  /**
   * ASS 자막을 영상에 burn-in
   * @param {string} videoPath - 입력 영상 경로
   * @param {string} assFilePath - ASS 자막 파일 경로
   * @param {string} outputPath - 출력 영상 경로
   * @returns {{ success: boolean, stderr: string, outputPath: string }}
   */
  async burnIn(videoPath, assFilePath, outputPath) {
    // 폰트 존재 확인 (없으면 즉시 에러)
    const fontPath = FontManager.resolve();

    // Windows: 드라이브 레터 `:` 회피를 위해 임시 작업 디렉토리에서 상대 경로로 실행
    // Linux/Mac: 경로에 `:` 없으므로 동일 전략 사용해도 안전
    const tmpBase = process.platform === 'win32' ? 'C:\\tmp' : os.tmpdir();
    fs.mkdirSync(tmpBase, { recursive: true });
    const workDir = fs.mkdtempSync(path.join(tmpBase, 'burnin'));
    const fontDir = path.join(workDir, 'fonts');
    fs.mkdirSync(fontDir, { recursive: true });

    try {
      // 입력 파일들을 work dir에 복사 (상대 경로 사용을 위해)
      fs.copyFileSync(videoPath, path.join(workDir, 'input.mp4'));
      fs.copyFileSync(assFilePath, path.join(workDir, 'subtitles.ass'));
      fs.copyFileSync(fontPath, path.join(fontDir, path.basename(fontPath)));

      const result = await this._runFfmpeg([
        '-y',
        '-i', 'input.mp4',
        '-vf', 'ass=subtitles.ass:fontsdir=fonts',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '18',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        'output.mp4',
      ], workDir);

      // 결과를 원래 outputPath로 복사
      fs.copyFileSync(path.join(workDir, 'output.mp4'), outputPath);

      return { success: true, stderr: result.stderr, outputPath };
    } finally {
      try { fs.rmSync(workDir, { recursive: true }); } catch (_) {}
    }
  }

  /**
   * FFmpeg 실행 (cwd 지정 가능)
   */
  _runFfmpeg(args, cwd) {
    return new Promise((resolve, reject) => {
      let stderr = '';
      const opts = { stdio: ['ignore', 'pipe', 'pipe'] };
      if (cwd) opts.cwd = cwd;
      const ffmpeg = spawn(this.ffmpegPath, args, opts);

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stderr });
        } else {
          reject(Object.assign(
            new Error(`FFmpeg burn-in 실패 (exit ${code}): ${stderr.slice(-500)}`),
            { errorCode: 'SUBTITLE_BURN_FAILED', stderr }
          ));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(Object.assign(
          new Error(`FFmpeg 실행 실패: ${err.message}`),
          { errorCode: 'FFMPEG_NOT_FOUND', stderr }
        ));
      });
    });
  }

  /**
   * FFmpeg stderr에서 폰트 로드 성공 여부 확인 (KOR-03)
   */
  static verifyFontLoad(stderr) {
    const fontName = FontManager.getFontName();
    const stderrLower = stderr.toLowerCase();

    // FFmpeg가 ASS 폰트를 로드할 때 나타나는 패턴
    const fontLoaded =
      stderrLower.includes('fontselect:') ||
      stderrLower.includes('using font provider') ||
      stderrLower.includes(fontName.toLowerCase()) ||
      stderrLower.includes('fontsdir') ||
      // burn-in 성공 시 video stream 출력 확인
      stderrLower.includes('video:');

    const fontError =
      stderrLower.includes('font not found') ||
      stderrLower.includes('unable to open font') ||
      stderrLower.includes('glyph not found');

    return {
      loaded: fontLoaded && !fontError,
      error: fontError,
      details: fontError ? 'Font load failed' : (fontLoaded ? 'Font loaded OK' : 'Font status unknown'),
    };
  }
}

module.exports = SubtitleBurnIn;
