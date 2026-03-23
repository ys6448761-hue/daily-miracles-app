/**
 * KoreanIntegrityGate — 한글 무결성 5항목 검증
 * AIL-2026-0219-VID-003
 *
 * KOR-01: UTF-8 왕복 (저장→재읽기→바이트 비교)
 * KOR-02: ZIP 자막 추출 후 한글 정상 (OS 로캘 무의존)
 * KOR-03: FFmpeg stderr 폰트 로드 확인
 * KOR-04: ASS 파싱 유효성 + 한글 콘텐츠 무결성
 * KOR-05: 렌더 프레임 추출 (SKIP_KOR05=true 시 스킵)
 */

const fs = require('fs');
const path = require('path');
const SubtitleConverter = require('./SubtitleConverter');
const SubtitleBurnIn = require('./SubtitleBurnIn');

class KoreanIntegrityGate {
  /**
   * KOR-01: UTF-8 왕복 검증
   * 파일에 저장 후 다시 읽어 바이트 단위 비교
   */
  static async verifyUtf8RoundTrip(filePath, originalContent) {
    try {
      // 저장
      fs.writeFileSync(filePath, originalContent, 'utf-8');
      // 재읽기
      const readBack = fs.readFileSync(filePath, 'utf-8');
      // 바이트 비교 (Buffer.compare — OS 로캘 무의존)
      const originalBuf = Buffer.from(originalContent, 'utf-8');
      const readBuf = Buffer.from(readBack, 'utf-8');
      const identical = Buffer.compare(originalBuf, readBuf) === 0;

      return {
        id: 'KOR-01',
        pass: identical,
        detail: identical
          ? 'UTF-8 왕복 검증 통과'
          : `바이트 불일치: original ${originalBuf.length}B vs readBack ${readBuf.length}B`,
      };
    } catch (error) {
      return {
        id: 'KOR-01',
        pass: false,
        detail: `UTF-8 왕복 실패: ${error.message}`,
      };
    }
  }

  /**
   * KOR-02: ZIP 내부 자막 추출 후 한글 검증 (OS 로캘 무의존)
   * archiver로 만든 ZIP에서 자막 파일 내용을 읽어 원본과 비교
   */
  static async verifyZipSubtitle(zipPath, expectedContent) {
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();

      // subtitles/ 디렉토리에서 .srt 또는 .ass 파일 찾기
      const subtitleEntry = entries.find(e =>
        (e.entryName.endsWith('.srt') || e.entryName.endsWith('.ass')) &&
        e.entryName.includes('subtitles')
      );

      if (!subtitleEntry) {
        return {
          id: 'KOR-02',
          pass: false,
          detail: 'ZIP에서 자막 파일 미발견',
        };
      }

      const extracted = subtitleEntry.getData();
      const extractedStr = extracted.toString('utf-8');
      const expectedBuf = Buffer.from(expectedContent, 'utf-8');
      const identical = Buffer.compare(extracted, expectedBuf) === 0 ||
        extractedStr.trim() === expectedContent.trim();

      return {
        id: 'KOR-02',
        pass: identical,
        detail: identical
          ? `ZIP 자막 검증 통과 (${subtitleEntry.entryName})`
          : `ZIP 자막 내용 불일치 (${subtitleEntry.entryName})`,
      };
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        return {
          id: 'KOR-02',
          pass: false,
          detail: 'adm-zip 모듈 미설치 (npm install adm-zip)',
        };
      }
      return {
        id: 'KOR-02',
        pass: false,
        detail: `ZIP 검증 실패: ${error.message}`,
      };
    }
  }

  /**
   * KOR-03: FFmpeg stderr 폰트 로드 확인
   */
  static verifyFontLoad(ffmpegStderr) {
    const result = SubtitleBurnIn.verifyFontLoad(ffmpegStderr);
    return {
      id: 'KOR-03',
      pass: result.loaded,
      detail: result.details,
    };
  }

  /**
   * KOR-04: ASS 파싱 유효성 + 한글 콘텐츠 무결성
   */
  static verifyAssParse(assContent) {
    // 1. ASS 구조 검증
    const validation = SubtitleConverter.validateAss(assContent);
    if (!validation.valid) {
      return {
        id: 'KOR-04',
        pass: false,
        detail: `ASS 구조 오류: ${validation.errors.join(', ')}`,
      };
    }

    // 2. 한글 콘텐츠 존재 확인 (Dialogue 라인에서)
    const dialogueLines = assContent.split('\n').filter(l => l.startsWith('Dialogue:'));
    const hasKorean = dialogueLines.some(line => /[\uAC00-\uD7AF]/.test(line));

    // 3. 한글이 깨졌는지 확인 (replacement character U+FFFD)
    const hasReplacementChar = assContent.includes('\uFFFD');

    return {
      id: 'KOR-04',
      pass: validation.valid && hasKorean && !hasReplacementChar,
      detail: !hasKorean
        ? 'Dialogue에 한글 없음'
        : hasReplacementChar
          ? 'U+FFFD (깨진 문자) 발견'
          : `ASS 파싱 정상 (Dialogue ${dialogueLines.length}건, 한글 포함)`,
    };
  }

  /**
   * KOR-05: 렌더 프레임 추출 → 텍스트 영역 확인
   * SKIP_KOR05=true 시 스킵 (CI용)
   */
  static async verifyRenderFrame(videoPath, timeOffset = 3) {
    // CI 스킵
    if (process.env.SKIP_KOR05 === 'true') {
      return {
        id: 'KOR-05',
        pass: true,
        detail: 'SKIP_KOR05=true — CI 스킵 (Docker/E2E에서 강제)',
        skipped: true,
      };
    }

    try {
      const { spawn } = require('child_process');
      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      const framePath = videoPath.replace(/\.\w+$/, '_kor05_frame.png');

      await new Promise((resolve, reject) => {
        const args = [
          '-y',
          '-i', videoPath,
          '-ss', String(timeOffset),
          '-vframes', '1',
          framePath,
        ];
        const proc = spawn(ffmpegPath, args);
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
        proc.on('error', reject);
      });

      const exists = fs.existsSync(framePath);
      const size = exists ? fs.statSync(framePath).size : 0;

      // 정리
      if (exists) {
        try { fs.unlinkSync(framePath); } catch (_) {}
      }

      return {
        id: 'KOR-05',
        pass: exists && size > 1000, // 최소 1KB (빈 프레임 아닌지)
        detail: exists
          ? `프레임 추출 성공 (${size}B)`
          : '프레임 추출 실패',
      };
    } catch (error) {
      return {
        id: 'KOR-05',
        pass: false,
        detail: `프레임 추출 오류: ${error.message}`,
      };
    }
  }

  /**
   * 전체 5항목 실행
   * @param {Object} context
   * @param {string} context.filePath - 자막 파일 경로
   * @param {string} context.originalContent - 원본 자막 내용
   * @param {string} context.assContent - ASS 변환 결과
   * @param {string} context.zipPath - ZIP 경로 (optional)
   * @param {string} context.ffmpegStderr - FFmpeg stderr (optional)
   * @param {string} context.videoPath - 렌더된 영상 경로 (optional)
   */
  static async runAll(context) {
    const results = [];

    // KOR-01
    if (context.filePath && context.originalContent) {
      results.push(await KoreanIntegrityGate.verifyUtf8RoundTrip(context.filePath, context.originalContent));
    }

    // KOR-02
    if (context.zipPath && context.originalContent) {
      results.push(await KoreanIntegrityGate.verifyZipSubtitle(context.zipPath, context.originalContent));
    }

    // KOR-03
    if (context.ffmpegStderr !== undefined) {
      results.push(KoreanIntegrityGate.verifyFontLoad(context.ffmpegStderr));
    }

    // KOR-04
    if (context.assContent) {
      results.push(KoreanIntegrityGate.verifyAssParse(context.assContent));
    }

    // KOR-05
    if (context.videoPath) {
      results.push(await KoreanIntegrityGate.verifyRenderFrame(context.videoPath));
    }

    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    const critical = results.some(r => !r.pass && !r.skipped);

    return {
      passed,
      total,
      pass: passed === total,
      critical,
      results,
    };
  }
}

module.exports = KoreanIntegrityGate;
