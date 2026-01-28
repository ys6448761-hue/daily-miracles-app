/**
 * Packager V4.2.1 - meta.json 및 zip 패키지 생성
 * Hero8 생성물 최종 패키징
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const archiver = require('archiver');

class Packager {
  constructor() {
    this.baseOutputDir = path.join(process.cwd(), 'output');
  }

  /**
   * 출력 디렉토리 생성
   * @param {string} requestId - 요청 ID
   * @returns {Promise<string>} 생성된 디렉토리 경로
   */
  async createOutputDir(requestId) {
    const outputDir = path.join(this.baseOutputDir, requestId);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(path.join(outputDir, 'keyframes'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'subtitles'), { recursive: true });

    return outputDir;
  }

  /**
   * 자막 파일 저장
   * @param {Object} subtitles - { txt, srt, json }
   * @param {string} outputDir - 출력 디렉토리
   */
  async saveSubtitles(subtitles, outputDir) {
    const subtitlesDir = path.join(outputDir, 'subtitles');

    await Promise.all([
      fs.writeFile(path.join(subtitlesDir, 'subtitles.txt'), subtitles.txt, 'utf-8'),
      fs.writeFile(path.join(subtitlesDir, 'subtitles.srt'), subtitles.srt, 'utf-8'),
      fs.writeFile(path.join(subtitlesDir, 'subtitles.json'), JSON.stringify(subtitles.json, null, 2), 'utf-8')
    ]);

    console.log(`  📝 자막 파일 저장 완료`);
  }

  /**
   * meta.json 생성
   * @param {Object} data - 메타데이터
   * @param {string} outputDir - 출력 디렉토리
   */
  async generateMeta(data, outputDir) {
    const {
      requestId,
      storyCard,
      keyframes,
      video,
      createdAt
    } = data;

    const meta = {
      version: '4.2.1',
      system: 'hero8',
      request_id: requestId,
      created_at: createdAt || new Date().toISOString(),

      // 스토리 정보 (V4.2.1 구조)
      story: {
        topic: storyCard.topic,
        hero_id: storyCard.heroId,
        location: storyCard.location,
        location_ko: storyCard.locationKo,
        time: storyCard.time,
        mood: storyCard.mood?.name || storyCard.mood,
        character: storyCard.character?.nameKo || storyCard.character?.name || 'Sowoni',
        total_duration: storyCard.totalDuration,
        timing: storyCard.timing
      },

      // 키프레임 정보 (V4.2.1: 구도 + 프레이밍 포함)
      keyframes: keyframes.map((kf, idx) => ({
        id: kf.id,
        role: kf.role,
        shot: ['WIDE', 'MEDIUM', 'CLOSE'][idx],
        framing: kf.framing || null,
        filename: `keyframes/${kf.id}.jpg`,
        qa_score: kf.qa?.score || null,
        qa_passed: kf.qa?.passed || false
      })),

      // 비디오 정보 (V4.2.1 - 정확히 8.0초)
      video: {
        filename: 'final.mp4',
        duration: video?.duration || 8,
        size_bytes: video?.size || null,
        resolution: '1080x1920',
        fps: 24,
        codec: 'h264',
        version: video?.version || '4.2.1',
        effects: video?.effects || ['zoom-in', 'pan', 'zoom-out+hold']
      },

      // 자막 정보
      subtitles: {
        txt: 'subtitles/subtitles.txt',
        srt: 'subtitles/subtitles.srt',
        json: 'subtitles/subtitles.json'
      },

      // 다운로드 URL (상대 경로)
      download_urls: {
        video: `/output/${requestId}/final.mp4`,
        package: `/output/${requestId}/output.zip`
      }
    };

    const metaPath = path.join(outputDir, 'meta.json');
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    console.log(`  📋 meta.json 생성 완료`);
    return meta;
  }

  /**
   * output.zip 생성
   * @param {string} outputDir - 출력 디렉토리
   * @returns {Promise<string>} zip 파일 경로
   */
  async createZip(outputDir) {
    const zipPath = path.join(outputDir, 'output.zip');

    return new Promise((resolve, reject) => {
      const output = fsSync.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`  📦 ZIP 생성 완료: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // 포함할 파일들
      const filesToInclude = [
        'final.mp4',
        'meta.json'
      ];

      // 메인 파일 추가
      filesToInclude.forEach(file => {
        const filePath = path.join(outputDir, file);
        if (fsSync.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      });

      // keyframes 폴더 추가
      const keyframesDir = path.join(outputDir, 'keyframes');
      if (fsSync.existsSync(keyframesDir)) {
        archive.directory(keyframesDir, 'keyframes');
      }

      // subtitles 폴더 추가
      const subtitlesDir = path.join(outputDir, 'subtitles');
      if (fsSync.existsSync(subtitlesDir)) {
        archive.directory(subtitlesDir, 'subtitles');
      }

      archive.finalize();
    });
  }

  /**
   * 전체 패키징 프로세스
   * @param {Object} params
   * @returns {Promise<Object>} 패키징 결과
   */
  async package(params) {
    const {
      requestId,
      storyCard,
      keyframes,
      subtitles,
      video,
      outputDir
    } = params;

    console.log(`\n📦 패키징 시작...`);

    // 1. 자막 저장
    if (subtitles) {
      await this.saveSubtitles(subtitles, outputDir);
    }

    // 2. meta.json 생성
    const meta = await this.generateMeta({
      requestId,
      storyCard,
      keyframes,
      video,
      createdAt: new Date().toISOString()
    }, outputDir);

    // 3. ZIP 생성
    const zipPath = await this.createZip(outputDir);

    // 4. 결과 정리
    const result = {
      requestId,
      outputDir,
      files: {
        video: path.join(outputDir, 'final.mp4'),
        meta: path.join(outputDir, 'meta.json'),
        zip: zipPath,
        subtitles: {
          txt: path.join(outputDir, 'subtitles', 'subtitles.txt'),
          srt: path.join(outputDir, 'subtitles', 'subtitles.srt'),
          json: path.join(outputDir, 'subtitles', 'subtitles.json')
        },
        keyframes: keyframes.filter(k => k.success).map(k => k.path)
      },
      urls: meta.download_urls,
      meta
    };

    console.log(`✅ 패키징 완료`);
    return result;
  }

  /**
   * 출력물 정리 (만료된 파일 삭제)
   * @param {number} maxAgeHours - 최대 보관 시간 (시간)
   */
  async cleanup(maxAgeHours = 24) {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    try {
      const entries = await fs.readdir(this.baseOutputDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const dirPath = path.join(this.baseOutputDir, entry.name);
        const stats = await fs.stat(dirPath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.rm(dirPath, { recursive: true, force: true });
          console.log(`🗑️ 만료된 출력물 삭제: ${entry.name}`);
        }
      }
    } catch (error) {
      // output 디렉토리가 없으면 무시
      if (error.code !== 'ENOENT') {
        console.error('정리 작업 실패:', error.message);
      }
    }
  }
}

module.exports = Packager;
