/**
 * ShortsPackager.js
 * Packager 재사용 + Shorts 전용 추가물:
 *   1. thumbnail.jpg — ffmpeg 첫 프레임 추출
 *   2. metadata.json — YouTube Shorts 업로드용 메타데이터
 *
 * 신규 FFmpeg 로직: thumbnail 추출만 추가 (1줄 커맨드)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs   = require('fs').promises;

const Packager = require('../hero8/Packager');

class ShortsPackager {
  constructor() {
    this._packager   = new Packager();
    this.ffmpegPath  = process.env.FFMPEG_PATH || 'ffmpeg';
  }

  /** Packager.createOutputDir 위임 */
  async createOutputDir(requestId) {
    return this._packager.createOutputDir(requestId);
  }

  /**
   * 썸네일 추출 (첫 프레임 → thumbnail.jpg)
   * @param {string} videoPath  - final.mp4 경로
   * @param {string} outputDir  - 출력 디렉토리
   * @returns {Promise<string>}  thumbnail.jpg 절대 경로
   */
  async extractThumbnail(videoPath, outputDir) {
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');

    return new Promise((resolve, reject) => {
      // -ss 0: 첫 프레임, -frames:v 1: 1장만, -q:v 2: 고품질 JPEG
      const args = [
        '-y',
        '-ss', '0',
        '-i', videoPath,
        '-frames:v', '1',
        '-q:v', '2',
        thumbnailPath,
      ];

      const ff = spawn(this.ffmpegPath, args);
      let stderr = '';
      ff.stderr.on('data', d => { stderr += d.toString(); });

      ff.on('close', code => {
        if (code === 0) {
          console.log(`  🖼️  썸네일 추출 완료: thumbnail.jpg`);
          resolve(thumbnailPath);
        } else {
          console.warn(`  ⚠️  썸네일 추출 실패 (code ${code}) — 스킵`);
          resolve(null); // 썸네일 실패는 non-fatal
        }
      });

      ff.on('error', () => {
        console.warn('  ⚠️  FFmpeg 미설치 — 썸네일 스킵');
        resolve(null);
      });
    });
  }

  /**
   * metadata.json 작성 (YouTube Shorts 업로드용)
   * @param {Object} opts
   * @param {string} opts.outputDir
   * @param {Object} opts.shorts_metadata  - ShortsManifestBuilder의 shorts_metadata
   * @param {Object} opts.video            - Hero8Renderer render 결과
   * @param {string} [opts.thumbnailPath]  - thumbnail.jpg 경로 (없으면 null)
   * @param {string} opts.requestId
   * @returns {Promise<Object>} 저장된 메타데이터
   */
  async writeMetadata({ outputDir, shorts_metadata, video, thumbnailPath, requestId }) {
    const metadata = {
      requestId,
      generated_at: new Date().toISOString(),
      platform: 'youtube_shorts',
      aspect_ratio: shorts_metadata.aspectRatio   || '9:16',
      duration_preset: shorts_metadata.durationPreset || 'short',
      duration_sec: video?.duration || 6,
      title:        shorts_metadata.title,
      description:  shorts_metadata.description,
      hashtags:     shorts_metadata.hashtags || [],
      cta_text:     shorts_metadata.ctaText  || '',
      files: {
        video:     `final.mp4`,
        thumbnail: thumbnailPath ? 'thumbnail.jpg' : null,
        zip:       'output.zip',
      },
      download_urls: {
        video:     `/output/${requestId}/final.mp4`,
        thumbnail: thumbnailPath ? `/output/${requestId}/thumbnail.jpg` : null,
        zip:       `/output/${requestId}/output.zip`,
      },
    };

    const metaPath = path.join(outputDir, 'metadata.json');
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`  📋 metadata.json 생성 완료`);
    return metadata;
  }

  /**
   * Shorts 전체 패키징
   *
   * @param {Object} params
   * @param {string} params.requestId
   * @param {Object} params.storyCard       - Hero8Builder.build() 결과
   * @param {Array}  params.keyframes       - ImageGenerator 결과
   * @param {Object} params.subtitles       - Hero8Builder subtitles
   * @param {Object} params.video           - ShortsRenderer.render() 결과
   * @param {string} params.outputDir
   * @param {Object} params.shorts_metadata - ShortsManifestBuilder의 shorts_metadata
   * @returns {Promise<Object>} 패키징 결과
   */
  async package(params) {
    const { requestId, storyCard, keyframes, subtitles, video, outputDir, shorts_metadata } = params;

    // 1. Hero8 표준 패키징 (자막 + meta.json + zip)
    const base = await this._packager.package({
      requestId, storyCard, keyframes, subtitles, video, outputDir,
    });

    // 2. 썸네일 추출
    const thumbnailPath = await this.extractThumbnail(base.files.video, outputDir);

    // 3. Shorts metadata.json
    const metadata = await this.writeMetadata({
      outputDir,
      shorts_metadata,
      video,
      thumbnailPath,
      requestId,
    });

    return {
      ...base,
      files: {
        ...base.files,
        thumbnail: thumbnailPath || null,
        shortsMetadata: path.join(outputDir, 'metadata.json'),
      },
      urls: {
        ...base.urls,
        thumbnail: thumbnailPath ? `/output/${requestId}/thumbnail.jpg` : null,
      },
      shorts_metadata: metadata,
    };
  }
}

module.exports = ShortsPackager;
