/**
 * RunwayService - Runway Gen-3 Image-to-Video API 연동
 *
 * ✅ 승인 범위: 샘플 소원그림/가상 캐릭터(비식별)만
 * ⛔ 보류 범위: 실제 사용자 정면사진/얼굴사진 외부 AI 전송 금지
 *
 * 필수 조건:
 * - sampleOnly: true 플래그 강제
 * - 출력에 워터마크 + "예시 이미지" 표기
 *
 * @version 1.0.0
 * @date 2026-01-27
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');

const SampleGuardrail = require('./SampleGuardrail');
const WatermarkService = require('./WatermarkService');

class RunwayService {
  constructor() {
    this.apiKey = process.env.RUNWAY_API_KEY;
    this.baseUrl = 'https://api.runwayml.com/v1';

    // 가드레일 및 워터마크 서비스
    this.guardrail = new SampleGuardrail();
    this.watermark = new WatermarkService();

    // 기본 설정
    this.config = {
      model: 'gen3a_turbo',  // gen3a_turbo 또는 gen3a
      duration: 5,           // 5초 또는 10초
      ratio: '9:16',         // 세로 영상
      watermark: false       // Runway 워터마크 (우리가 별도 추가)
    };

    // 모션 프리셋 (재미가 확정할 시나리오용)
    this.motionPresets = {
      eyeBlink: {
        name: '눈깜빡',
        promptHint: 'subtle eye blink, gentle expression change',
        duration: 5
      },
      hairWind: {
        name: '머리카락 바람',
        promptHint: 'gentle hair movement in soft breeze, strands flowing',
        duration: 5
      },
      smile: {
        name: '미소',
        promptHint: 'gentle smile forming, warm expression, soft eye movement',
        duration: 5
      },
      breathe: {
        name: '숨결',
        promptHint: 'subtle breathing motion, gentle chest rise, calm atmosphere',
        duration: 5
      },
      paperPlane: {
        name: '종이비행기 들기',
        promptHint: 'slowly lifting paper airplane, gentle arm movement',
        duration: 5
      }
    };
  }

  /**
   * API 키 확인
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * 이미지를 Base64로 변환
   * @param {string} imagePath
   * @returns {Promise<string>}
   */
  async imageToBase64(imagePath) {
    const buffer = await fs.readFile(imagePath);
    return buffer.toString('base64');
  }

  /**
   * Runway API 호출 (HTTP)
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async _apiRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);

      const options = {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`Runway API Error: ${result.error || body}`));
            }
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }

  /**
   * 작업 상태 폴링
   * @param {string} taskId
   * @returns {Promise<Object>}
   */
  async pollTaskStatus(taskId) {
    return new Promise((resolve, reject) => {
      const url = new URL(`/v1/tasks/${taskId}`, this.baseUrl);

      const options = {
        method: 'GET',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Image-to-Video 생성 (가드레일 적용)
   *
   * @param {Object} params
   * @param {string} params.imagePath - 입력 이미지 경로
   * @param {string} params.motionPrompt - 모션 설명
   * @param {string} params.outputPath - 출력 경로
   * @param {boolean} params.sampleOnly - 샘플 전용 플래그 (필수 true)
   * @param {Object} params.metadata - 메타데이터
   * @returns {Promise<Object>}
   */
  async generateVideo(params) {
    const {
      imagePath,
      motionPrompt,
      outputPath,
      sampleOnly = true,
      metadata = {}
    } = params;

    console.log(`\n🎬 Runway I2V 시작...`);

    // ═══════════════════════════════════════════════════════════════
    // 가드레일 체크 (필수)
    // ═══════════════════════════════════════════════════════════════

    // 1. 샘플 플래그 강제
    this.guardrail.requireSampleFlag({ sampleOnly });

    // 2. 이미지 경로 검증
    const guardCheck = await this.guardrail.fullCheck(imagePath, { sampleOnly });
    if (!guardCheck.passed) {
      throw new Error(`GUARDRAIL_BLOCKED: ${guardCheck.error}`);
    }
    console.log(`  ✅ 가드레일 통과: ${guardCheck.validation.source}`);

    // 3. API 키 확인
    if (!this.isConfigured()) {
      throw new Error('RUNWAY_API_KEY가 설정되지 않았습니다. .env 파일에 추가하세요.');
    }

    // ═══════════════════════════════════════════════════════════════
    // Runway API 호출
    // ═══════════════════════════════════════════════════════════════

    // 이미지 Base64 변환
    const imageBase64 = await this.imageToBase64(imagePath);
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

    // API 요청
    console.log(`  📤 Runway API 호출 중...`);
    const createResponse = await this._apiRequest('/image_to_video', {
      model: this.config.model,
      promptImage: imageDataUrl,
      promptText: motionPrompt,
      duration: this.config.duration,
      ratio: this.config.ratio,
      watermark: this.config.watermark
    });

    const taskId = createResponse.id;
    console.log(`  📋 Task ID: ${taskId}`);

    // 상태 폴링
    console.log(`  ⏳ 영상 생성 대기 중...`);
    let status = 'PENDING';
    let result = null;
    let attempts = 0;
    const maxAttempts = 120;  // 최대 10분 대기

    while (status !== 'SUCCEEDED' && status !== 'FAILED' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));  // 5초 대기
      result = await this.pollTaskStatus(taskId);
      status = result.status;
      attempts++;

      if (attempts % 6 === 0) {
        console.log(`     ... ${Math.floor(attempts * 5 / 60)}분 경과 (상태: ${status})`);
      }
    }

    if (status === 'FAILED') {
      throw new Error(`Runway 생성 실패: ${result.error || 'Unknown error'}`);
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Runway 타임아웃: ${maxAttempts * 5}초 초과`);
    }

    // 영상 다운로드
    console.log(`  📥 영상 다운로드 중...`);
    const videoUrl = result.output[0];
    const tempVideoPath = outputPath.replace('.mp4', '_temp.mp4');

    await this._downloadVideo(videoUrl, tempVideoPath);

    // ═══════════════════════════════════════════════════════════════
    // 워터마크 추가 (필수)
    // ═══════════════════════════════════════════════════════════════

    console.log(`  🏷️ 워터마크 추가 중...`);
    const finalResult = await this.watermark.processRunwayOutput(
      tempVideoPath,
      outputPath,
      metadata
    );

    // 임시 파일 삭제
    await fs.unlink(tempVideoPath).catch(() => {});

    console.log(`  ✅ Runway I2V 완료: ${path.basename(outputPath)}`);

    return {
      success: true,
      path: finalResult.path,
      size: finalResult.size,
      duration: this.config.duration,
      taskId,
      watermarked: true,
      sampleOnly: true,
      guardrailSource: guardCheck.validation.source,
      metadata: finalResult.metadata
    };
  }

  /**
   * 영상 다운로드
   * @param {string} url
   * @param {string} outputPath
   * @returns {Promise<void>}
   */
  async _downloadVideo(url, outputPath) {
    return new Promise((resolve, reject) => {
      const file = fsSync.createWriteStream(outputPath);

      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 리다이렉트 처리
          https.get(response.headers.location, (res) => {
            res.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', reject);
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      }).on('error', reject);
    });
  }

  /**
   * 모션 프리셋으로 간편 생성
   * @param {string} imagePath
   * @param {string} presetName - 'eyeBlink', 'hairWind', 'smile', 'breathe', 'paperPlane'
   * @param {string} outputPath
   * @param {Object} metadata
   * @returns {Promise<Object>}
   */
  async generateWithPreset(imagePath, presetName, outputPath, metadata = {}) {
    const preset = this.motionPresets[presetName];
    if (!preset) {
      throw new Error(`알 수 없는 프리셋: ${presetName}. 가능한 값: ${Object.keys(this.motionPresets).join(', ')}`);
    }

    console.log(`  🎯 모션 프리셋: ${preset.name}`);

    return this.generateVideo({
      imagePath,
      motionPrompt: preset.promptHint,
      outputPath,
      sampleOnly: true,
      metadata: {
        ...metadata,
        motionPreset: presetName,
        motionName: preset.name
      }
    });
  }

  /**
   * Hero8 키프레임에 모션 추가
   * @param {Array} keyframes - Hero8 키프레임 배열
   * @param {string} outputDir - 출력 디렉토리
   * @param {Object} hero - HERO 정보
   * @returns {Promise<Array>}
   */
  async addMotionToKeyframes(keyframes, outputDir, hero = {}) {
    const results = [];

    // 모션 매핑 (KF별 다른 모션)
    const motionMap = {
      kf1: 'breathe',     // WIDE: 숨결
      kf2: 'paperPlane',  // MEDIUM: 종이비행기 들기
      kf3: 'smile'        // CLOSE: 미소
    };

    for (const kf of keyframes) {
      if (!kf.success || !kf.path) continue;

      const presetName = motionMap[kf.id] || 'breathe';
      const outputPath = path.join(outputDir, `${kf.id}_motion.mp4`);

      try {
        const result = await this.generateWithPreset(
          kf.path,
          presetName,
          outputPath,
          {
            heroId: hero.id || 'HERO',
            topic: hero.topic || '',
            keyframeId: kf.id,
            shot: kf.shot
          }
        );

        results.push({
          keyframeId: kf.id,
          ...result
        });
      } catch (error) {
        console.error(`  ⚠️ ${kf.id} 모션 생성 실패:`, error.message);
        results.push({
          keyframeId: kf.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 사용 가능한 모션 프리셋 목록
   * @returns {Object}
   */
  getMotionPresets() {
    return this.motionPresets;
  }

  /**
   * 설정 확인
   * @returns {Object}
   */
  getConfig() {
    return {
      configured: this.isConfigured(),
      model: this.config.model,
      duration: this.config.duration,
      ratio: this.config.ratio,
      guardrails: {
        sampleOnly: true,
        watermarkRequired: true,
        allowedFolders: this.guardrail.allowedFolders,
        blockedFolders: this.guardrail.blockedFolders
      },
      motionPresets: Object.keys(this.motionPresets)
    };
  }
}

module.exports = RunwayService;
