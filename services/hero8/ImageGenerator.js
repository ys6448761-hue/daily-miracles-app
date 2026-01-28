/**
 * ImageGenerator - DALL-E 키프레임 이미지 생성 + QA
 * 3개 키프레임 병렬 생성 및 품질 검증
 */

const { OpenAI } = require('openai');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const { QA_SETTINGS } = require('./constants');

class ImageGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * DALL-E 3로 이미지 생성
   * @param {string} prompt - 이미지 생성 프롬프트
   * @returns {Promise<string>} 이미지 URL
   */
  async generateImage(prompt) {
    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1792',  // 9:16 비율 (세로형)
        quality: 'hd',
        style: 'vivid'
      });

      return response.data[0].url;
    } catch (error) {
      console.error('DALL-E 이미지 생성 실패:', error.message);
      throw new Error(`이미지 생성 실패: ${error.message}`);
    }
  }

  /**
   * URL에서 이미지 다운로드
   * @param {string} url - 이미지 URL
   * @param {string} outputPath - 저장 경로
   */
  async downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, (response) => {
        // 리다이렉트 처리
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          this.downloadImage(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`이미지 다운로드 실패: HTTP ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            await fs.writeFile(outputPath, buffer);
            resolve(outputPath);
          } catch (err) {
            reject(err);
          }
        });
        response.on('error', reject);
      });

      request.on('error', reject);
      request.setTimeout(60000, () => {
        request.destroy();
        reject(new Error('이미지 다운로드 타임아웃'));
      });
    });
  }

  /**
   * 이미지를 1080x1920 (9:16)으로 리사이즈
   * @param {string} inputPath - 입력 이미지 경로
   * @param {string} outputPath - 출력 이미지 경로
   */
  async resizeImage(inputPath, outputPath) {
    const { width, height } = QA_SETTINGS.imageRequirements;

    await sharp(inputPath)
      .resize(width || 1080, height || 1920, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 95 })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * 이미지 QA Gate 검증
   * @param {string} imagePath - 이미지 경로
   * @returns {Promise<{ passed: boolean, score: number, details: Object }>}
   */
  async qaCheck(imagePath) {
    const requirements = QA_SETTINGS.imageRequirements;
    const details = {};
    let score = 100;

    try {
      // 파일 존재 여부
      const stats = await fs.stat(imagePath);
      details.fileSize = stats.size;

      // 파일 크기 검사
      if (stats.size < requirements.minFileSize) {
        score -= 20;
        details.fileSizeStatus = 'too_small';
      } else if (stats.size > requirements.maxFileSize) {
        score -= 10;
        details.fileSizeStatus = 'too_large';
      } else {
        details.fileSizeStatus = 'ok';
      }

      // 이미지 메타데이터 확인
      const metadata = await sharp(imagePath).metadata();
      details.width = metadata.width;
      details.height = metadata.height;
      details.format = metadata.format;

      // 해상도 검사
      if (metadata.width < requirements.minWidth) {
        score -= 15;
        details.widthStatus = 'below_minimum';
      } else {
        details.widthStatus = 'ok';
      }

      if (metadata.height < requirements.minHeight) {
        score -= 15;
        details.heightStatus = 'below_minimum';
      } else {
        details.heightStatus = 'ok';
      }

      // 비율 검사 (9:16)
      const expectedRatio = 9 / 16;
      const actualRatio = metadata.width / metadata.height;
      const ratioDiff = Math.abs(expectedRatio - actualRatio);

      if (ratioDiff > 0.05) {
        score -= 10;
        details.aspectRatioStatus = 'incorrect';
      } else {
        details.aspectRatioStatus = 'ok';
      }

      details.score = score;
      details.passed = score >= QA_SETTINGS.minScore;

      return {
        passed: details.passed,
        score,
        details
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * 3개 키프레임 병렬 생성
   * @param {Array} kfPrompts - 키프레임 프롬프트 배열
   * @param {string} outputDir - 출력 디렉토리
   * @returns {Promise<Array>} 생성된 이미지 정보 배열
   */
  async generateKeyframes(kfPrompts, outputDir) {
    // 출력 디렉토리 생성
    const keyframesDir = path.join(outputDir, 'keyframes');
    await fs.mkdir(keyframesDir, { recursive: true });

    console.log(`📸 3개 키프레임 병렬 생성 시작...`);

    // 병렬 생성
    const results = await Promise.all(
      kfPrompts.map(async (kf, index) => {
        const kfId = kf.id || `kf${index + 1}`;
        console.log(`  🎨 ${kfId} 생성 중...`);

        try {
          // 1. DALL-E로 이미지 생성
          const imageUrl = await this.generateImage(kf.prompt);
          console.log(`  ✅ ${kfId} 생성 완료`);

          // 2. 이미지 다운로드
          const tempPath = path.join(keyframesDir, `${kfId}_temp.jpg`);
          await this.downloadImage(imageUrl, tempPath);

          // 3. 리사이즈 (1080x1920)
          const finalPath = path.join(keyframesDir, `${kfId}.jpg`);
          await this.resizeImage(tempPath, finalPath);

          // 4. 임시 파일 삭제
          await fs.unlink(tempPath).catch(() => {});

          // 5. QA 검증
          const qa = await this.qaCheck(finalPath);
          console.log(`  🔍 ${kfId} QA: ${qa.passed ? '통과' : '실패'} (${qa.score}점)`);

          return {
            id: kfId,
            role: kf.role,
            path: finalPath,
            url: imageUrl,
            qa,
            success: true
          };
        } catch (error) {
          console.error(`  ❌ ${kfId} 생성 실패:`, error.message);
          return {
            id: kfId,
            role: kf.role,
            error: error.message,
            success: false
          };
        }
      })
    );

    // 결과 요약
    const successCount = results.filter(r => r.success).length;
    const passedQA = results.filter(r => r.success && r.qa?.passed).length;

    console.log(`📊 키프레임 생성 결과: ${successCount}/3 성공, ${passedQA}/3 QA 통과`);

    return results;
  }

  /**
   * 단일 키프레임 재생성 (QA 실패 시 재시도)
   * @param {Object} kfPrompt - 키프레임 프롬프트
   * @param {string} outputDir - 출력 디렉토리
   * @param {number} maxRetries - 최대 재시도 횟수
   */
  async regenerateKeyframe(kfPrompt, outputDir, maxRetries = 2) {
    const keyframesDir = path.join(outputDir, 'keyframes');
    let lastResult = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`  🔄 ${kfPrompt.id} 재생성 시도 ${attempt}/${maxRetries}`);

      try {
        const imageUrl = await this.generateImage(kfPrompt.prompt);
        const tempPath = path.join(keyframesDir, `${kfPrompt.id}_temp_${attempt}.jpg`);
        await this.downloadImage(imageUrl, tempPath);

        const finalPath = path.join(keyframesDir, `${kfPrompt.id}.jpg`);
        await this.resizeImage(tempPath, finalPath);
        await fs.unlink(tempPath).catch(() => {});

        const qa = await this.qaCheck(finalPath);

        lastResult = {
          id: kfPrompt.id,
          role: kfPrompt.role,
          path: finalPath,
          url: imageUrl,
          qa,
          success: true,
          attempt
        };

        if (qa.passed) {
          console.log(`  ✅ ${kfPrompt.id} 재생성 성공 (시도 ${attempt})`);
          return lastResult;
        }
      } catch (error) {
        lastResult = {
          id: kfPrompt.id,
          role: kfPrompt.role,
          error: error.message,
          success: false,
          attempt
        };
      }
    }

    console.log(`  ⚠️ ${kfPrompt.id} 최대 재시도 횟수 초과`);
    return lastResult;
  }
}

module.exports = ImageGenerator;
