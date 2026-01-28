/**
 * SampleGuardrail - 샘플 이미지 전용 가드레일
 *
 * 승인 범위: 샘플 소원그림/가상 캐릭터(비식별)만 허용
 * 보류 범위: 실제 사용자 정면사진/얼굴사진 외부 AI 전송 금지
 *
 * @version 1.0.0
 * @date 2026-01-27
 */

const path = require('path');
const fs = require('fs').promises;

class SampleGuardrail {
  constructor() {
    // 허용된 소스 폴더 (화이트리스트)
    this.allowedFolders = [
      'assets/samples',
      'assets/heroes',
      'output',  // Hero8에서 생성된 키프레임
      'temp/samples'
    ];

    // 허용된 파일명 패턴
    this.allowedPatterns = [
      /^sample_/i,
      /^hero_/i,
      /^kf[123]\./i,      // Hero8 키프레임
      /^keyframe_/i,
      /^sowoni_sample/i,
      /^test_/i
    ];

    // 금지된 키워드 (사용자 업로드 의심)
    this.blockedKeywords = [
      'user_',
      'upload_',
      'photo_',
      'selfie',
      'face_',
      'portrait_',
      'customer_',
      'client_'
    ];

    // 금지된 폴더
    this.blockedFolders = [
      'uploads',
      'user_photos',
      'customers',
      'faces'
    ];
  }

  /**
   * 이미지 경로가 샘플인지 검증
   * @param {string} imagePath - 이미지 파일 경로
   * @returns {{ allowed: boolean, reason: string, source: string }}
   */
  validate(imagePath) {
    const normalizedPath = imagePath.replace(/\\/g, '/').toLowerCase();
    const fileName = path.basename(imagePath).toLowerCase();
    const dirName = path.dirname(normalizedPath);

    // 1. 금지된 폴더 체크
    for (const blocked of this.blockedFolders) {
      if (normalizedPath.includes(blocked)) {
        return {
          allowed: false,
          reason: `BLOCKED_FOLDER: '${blocked}' 폴더의 파일은 외부 AI로 전송할 수 없습니다`,
          source: 'user_upload_suspected'
        };
      }
    }

    // 2. 금지된 키워드 체크
    for (const keyword of this.blockedKeywords) {
      if (fileName.includes(keyword)) {
        return {
          allowed: false,
          reason: `BLOCKED_KEYWORD: '${keyword}' 패턴의 파일은 사용자 사진으로 의심되어 차단됩니다`,
          source: 'user_photo_suspected'
        };
      }
    }

    // 3. 허용된 폴더 체크
    const isAllowedFolder = this.allowedFolders.some(folder =>
      normalizedPath.includes(folder.toLowerCase())
    );

    // 4. 허용된 파일명 패턴 체크
    const isAllowedPattern = this.allowedPatterns.some(pattern =>
      pattern.test(fileName)
    );

    // Hero8 output 폴더의 키프레임은 허용
    if (normalizedPath.includes('output/') && /kf[123]\.jpg$/i.test(fileName)) {
      return {
        allowed: true,
        reason: 'Hero8 생성 키프레임 (샘플)',
        source: 'hero8_keyframe'
      };
    }

    // 허용된 폴더이거나 허용된 패턴이면 통과
    if (isAllowedFolder || isAllowedPattern) {
      return {
        allowed: true,
        reason: '샘플 이미지 확인됨',
        source: 'sample_verified'
      };
    }

    // 기본: 차단
    return {
      allowed: false,
      reason: `UNVERIFIED: 검증되지 않은 이미지입니다. 샘플 폴더(${this.allowedFolders.join(', ')})의 이미지만 사용 가능합니다`,
      source: 'unverified'
    };
  }

  /**
   * 다수의 이미지 경로 검증
   * @param {string[]} imagePaths - 이미지 경로 배열
   * @returns {{ allAllowed: boolean, results: Array, blockedCount: number }}
   */
  validateAll(imagePaths) {
    const results = imagePaths.map(p => ({
      path: p,
      ...this.validate(p)
    }));

    const blockedResults = results.filter(r => !r.allowed);

    return {
      allAllowed: blockedResults.length === 0,
      results,
      blockedCount: blockedResults.length,
      blockedPaths: blockedResults.map(r => r.path)
    };
  }

  /**
   * 샘플 플래그 강제 확인
   * @param {Object} options - 요청 옵션
   * @returns {boolean}
   */
  requireSampleFlag(options) {
    // SAMPLE_ONLY 플래그가 반드시 true여야 함
    if (options.sampleOnly !== true && options.SAMPLE_ONLY !== true) {
      throw new Error(
        'GUARDRAIL_ERROR: Runway I2V는 샘플 이미지 전용입니다. ' +
        'sampleOnly: true 플래그를 설정하세요. ' +
        '실제 사용자 사진은 2차 승인 전까지 사용 불가합니다.'
      );
    }
    return true;
  }

  /**
   * 이미지 파일 존재 및 크기 확인
   * @param {string} imagePath
   * @returns {Promise<{ exists: boolean, size: number }>}
   */
  async checkFile(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      return {
        exists: true,
        size: stats.size,
        isFile: stats.isFile()
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
        isFile: false
      };
    }
  }

  /**
   * 전체 가드레일 체크 (검증 + 플래그 + 파일 존재)
   * @param {string} imagePath
   * @param {Object} options
   * @returns {Promise<{ passed: boolean, validation: Object, file: Object }>}
   */
  async fullCheck(imagePath, options = {}) {
    // 1. 샘플 플래그 강제
    this.requireSampleFlag({ ...options, sampleOnly: options.sampleOnly ?? true });

    // 2. 경로 검증
    const validation = this.validate(imagePath);
    if (!validation.allowed) {
      return {
        passed: false,
        validation,
        file: null,
        error: validation.reason
      };
    }

    // 3. 파일 존재 확인
    const file = await this.checkFile(imagePath);
    if (!file.exists) {
      return {
        passed: false,
        validation,
        file,
        error: `FILE_NOT_FOUND: ${imagePath}`
      };
    }

    return {
      passed: true,
      validation,
      file,
      error: null
    };
  }
}

module.exports = SampleGuardrail;
