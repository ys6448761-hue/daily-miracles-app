/**
 * WatermarkService - 워터마크 + "예시 이미지" 오버레이 자동화
 *
 * 승인 조건: 출력 영상에 워터마크 + "예시 이미지" 표기 강제
 *
 * @version 1.0.0
 * @date 2026-01-27
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class WatermarkService {
  constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

    // 워터마크 설정
    this.config = {
      // "예시 이미지" 텍스트 설정
      sampleText: {
        text: '예시 이미지',
        fontsize: 32,
        fontcolor: 'white',
        borderw: 2,
        bordercolor: 'black',
        x: 30,
        y: 30
      },
      // 서비스 워터마크
      brandText: {
        text: '하루하루의 기적',
        fontsize: 24,
        fontcolor: 'white@0.7',
        x: '(w-text_w-30)',
        y: '(h-text_h-30)'
      },
      // AI 생성 고지
      aiNotice: {
        text: 'AI Generated Sample',
        fontsize: 18,
        fontcolor: 'white@0.5',
        x: 30,
        y: '(h-text_h-30)'
      }
    };
  }

  /**
   * FFmpeg drawtext 필터 생성
   * @param {Object} textConfig
   * @returns {string}
   */
  _createDrawTextFilter(textConfig) {
    const { text, fontsize, fontcolor, x, y, borderw, bordercolor } = textConfig;

    let filter = `drawtext=text='${text}':fontsize=${fontsize}:fontcolor=${fontcolor}:x=${x}:y=${y}`;

    if (borderw && bordercolor) {
      filter += `:borderw=${borderw}:bordercolor=${bordercolor}`;
    }

    return filter;
  }

  /**
   * 영상에 워터마크 + "예시 이미지" 오버레이 추가
   * @param {string} inputPath - 입력 영상 경로
   * @param {string} outputPath - 출력 영상 경로
   * @param {Object} options - 옵션
   * @returns {Promise<string>} 출력 파일 경로
   */
  async addWatermark(inputPath, outputPath, options = {}) {
    const {
      includeSampleText = true,
      includeBrand = true,
      includeAiNotice = true,
      customText = null
    } = options;

    // 필터 체인 구성
    const filters = [];

    // 1. "예시 이미지" 텍스트 (필수)
    if (includeSampleText) {
      filters.push(this._createDrawTextFilter(this.config.sampleText));
    }

    // 2. 브랜드 워터마크
    if (includeBrand) {
      filters.push(this._createDrawTextFilter(this.config.brandText));
    }

    // 3. AI 생성 고지
    if (includeAiNotice) {
      filters.push(this._createDrawTextFilter(this.config.aiNotice));
    }

    // 4. 커스텀 텍스트
    if (customText) {
      filters.push(this._createDrawTextFilter({
        text: customText,
        fontsize: 20,
        fontcolor: 'white@0.8',
        x: '(w-text_w)/2',
        y: 80
      }));
    }

    if (filters.length === 0) {
      // 필터가 없으면 그냥 복사
      await fs.copyFile(inputPath, outputPath);
      return outputPath;
    }

    const filterComplex = filters.join(',');

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', inputPath,
        '-vf', filterComplex,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '18',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        outputPath
      ];

      console.log(`  🏷️ 워터마크 추가 중...`);

      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`  ✅ 워터마크 추가 완료: ${path.basename(outputPath)}`);
          resolve(outputPath);
        } else {
          console.error(`  ❌ 워터마크 실패:`, stderr.slice(-500));
          reject(new Error(`FFmpeg watermark 실패 (code ${code})`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg 실행 오류: ${err.message}`));
      });
    });
  }

  /**
   * 이미지에 "예시 이미지" 오버레이 추가
   * @param {string} inputPath - 입력 이미지 경로
   * @param {string} outputPath - 출력 이미지 경로
   * @returns {Promise<string>}
   */
  async addImageWatermark(inputPath, outputPath) {
    const filters = [
      this._createDrawTextFilter(this.config.sampleText),
      this._createDrawTextFilter({
        ...this.config.brandText,
        fontsize: 18
      })
    ];

    const filterComplex = filters.join(',');

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', inputPath,
        '-vf', filterComplex,
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`이미지 워터마크 실패 (code ${code})`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg 실행 오류: ${err.message}`));
      });
    });
  }

  /**
   * Hero8 영상에 Runway 모션 + 워터마크 통합 처리
   * @param {string} inputVideo - 원본 영상
   * @param {string} outputVideo - 출력 영상
   * @param {Object} metadata - 메타데이터 (HERO 정보 등)
   * @returns {Promise<Object>}
   */
  async processRunwayOutput(inputVideo, outputVideo, metadata = {}) {
    const { heroId = 'HERO', topic = '' } = metadata;

    // 커스텀 텍스트로 HERO 정보 추가
    const customText = topic ? `${heroId} | ${topic}` : null;

    const result = await this.addWatermark(inputVideo, outputVideo, {
      includeSampleText: true,
      includeBrand: true,
      includeAiNotice: true,
      customText
    });

    // 파일 정보
    const stats = await fs.stat(outputVideo);

    return {
      path: outputVideo,
      size: stats.size,
      watermarked: true,
      sampleOnly: true,
      metadata: {
        heroId,
        topic,
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 워터마크 설정 커스터마이즈
   * @param {Object} customConfig
   */
  setConfig(customConfig) {
    this.config = {
      ...this.config,
      ...customConfig
    };
  }

  /**
   * 워터마크 없이 원본 유지 (내부 테스트용, 프로덕션 비활성화)
   * @param {string} inputPath
   * @param {string} outputPath
   * @returns {Promise<string>}
   */
  async copyWithoutWatermark(inputPath, outputPath) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GUARDRAIL_ERROR: 프로덕션 환경에서는 워터마크 없는 출력이 금지됩니다');
    }

    console.warn('⚠️ WARNING: 워터마크 없이 복사 (테스트 전용)');
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }
}

module.exports = WatermarkService;
