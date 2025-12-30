/**
 * 소원그림 생성 API
 * POST /api/wish-image/generate - DALL-E 3로 소원그림 생성 + 영구 저장
 * POST /api/wish-image/watermark - 워터마크 삽입
 * GET /api/wish-image/status - OpenAI API 상태 체크
 * GET /api/wish-image/list - 저장된 이미지 목록
 */

const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 이미지 저장 경로
const WISHES_IMAGE_DIR = path.join(__dirname, '..', 'public', 'images', 'wishes');

// 폴더 생성 확인
function ensureImageDir() {
  if (!fs.existsSync(WISHES_IMAGE_DIR)) {
    fs.mkdirSync(WISHES_IMAGE_DIR, { recursive: true });
  }
}

// 보석별 색상 매핑
const gemColors = {
  ruby: { primary: 'deep red', secondary: 'golden', keyword: '열정과 용기' },
  sapphire: { primary: 'deep blue', secondary: 'silver', keyword: '안정과 지혜' },
  emerald: { primary: 'emerald green', secondary: 'golden', keyword: '성장과 치유' },
  diamond: { primary: 'white crystal', secondary: 'rainbow', keyword: '명확한 결단' },
  citrine: { primary: 'warm yellow', secondary: 'orange', keyword: '긍정 에너지' }
};

// Fallback 이미지 경로
const fallbackImages = {
  ruby: '/images/fallback/ruby.png',
  sapphire: '/images/fallback/sapphire.png',
  emerald: '/images/fallback/emerald.png',
  diamond: '/images/fallback/diamond.png',
  citrine: '/images/fallback/citrine.png'
};

/**
 * DALL-E 이미지 다운로드 및 로컬 저장
 * @param {string} imageUrl - DALL-E 생성 이미지 URL
 * @param {string} filename - 저장할 파일명
 * @returns {Promise<string>} - 로컬 저장 경로
 */
function downloadAndSaveImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(WISHES_IMAGE_DIR, filename);
    const file = fs.createWriteStream(filePath);

    https.get(imageUrl, (response) => {
      // 리다이렉트 처리
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filePath);
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {}); // 실패 시 파일 삭제
          reject(err);
        });
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // 실패 시 파일 삭제
      reject(err);
    });
  });
}

/**
 * POST /api/wish-image/generate
 * 소원그림 생성 + 영구 저장
 */
router.post('/generate', async (req, res) => {
  try {
    const { wish_content, gem_type, style = 'miracle_fusion' } = req.body;

    // 유효성 검사
    if (!wish_content) {
      return res.status(400).json({
        success: false,
        error: '소원 내용이 필요합니다.'
      });
    }

    const colors = gemColors[gem_type] || gemColors.ruby;

    const prompt = `
      A hopeful, magical illustration representing: "${wish_content}"

      Style: Cosmic universe background with ${colors.primary} and ${colors.secondary} tones
      Mood: Hopeful, bright, inspiring, miraculous
      Elements: Stars, soft light rays, gentle sparkles, symbolizing ${colors.keyword}
      Art style: Digital art, dreamy, ethereal, Korean aesthetic

      No text, no words, no letters, no characters
    `.trim();

    // 재시도 로직 (최대 3회)
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[WishImage] Attempt ${attempt}: Generating image for gem_type=${gem_type}`);

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });

        const dalleImageUrl = response.data[0].url;
        console.log(`[WishImage] Success on attempt ${attempt}`);

        // 이미지 다운로드 및 영구 저장
        ensureImageDir();
        const timestamp = Date.now();
        const filename = `wish_${timestamp}_${gem_type || 'ruby'}.png`;

        try {
          await downloadAndSaveImage(dalleImageUrl, filename);
          console.log(`[WishImage] Image saved: ${filename}`);

          // 영구 URL 반환
          const permanentUrl = `/images/wishes/${filename}`;

          return res.json({
            success: true,
            image_url: permanentUrl,
            original_url: dalleImageUrl,
            filename: filename,
            prompt_used: prompt,
            gem_type: gem_type,
            attempt: attempt,
            permanent: true
          });
        } catch (saveError) {
          console.error(`[WishImage] Failed to save image:`, saveError.message);
          // 저장 실패 시 원본 URL 반환 (2시간 만료)
          return res.json({
            success: true,
            image_url: dalleImageUrl,
            prompt_used: prompt,
            gem_type: gem_type,
            attempt: attempt,
            permanent: false,
            save_error: saveError.message
          });
        }

      } catch (apiError) {
        lastError = apiError;
        console.log(`[WishImage] Attempt ${attempt} failed:`, apiError.message);

        if (attempt < 3) {
          // 재시도 전 대기 (2초)
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // 3회 모두 실패 시 Fallback
    console.log('[WishImage] All attempts failed, using fallback image');
    return res.json({
      success: true,
      image_url: fallbackImages[gem_type] || fallbackImages.ruby,
      prompt_used: prompt,
      gem_type: gem_type,
      fallback: true,
      permanent: true,
      error_message: lastError?.message
    });

  } catch (error) {
    console.error('[WishImage] Error:', error);
    res.status(500).json({
      success: false,
      error: '소원그림 생성 중 오류가 발생했습니다.',
      fallback_url: fallbackImages.ruby
    });
  }
});

/**
 * GET /api/wish-image/status
 * OpenAI API 상태 체크 (Risk Guardian용)
 */
router.get('/status', async (req, res) => {
  try {
    // 간단한 API 연결 테스트
    const models = await openai.models.list();
    res.json({
      status: 'ok',
      service: 'openai',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'error',
      service: 'openai',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wish-image/list
 * 저장된 소원그림 목록 조회
 */
router.get('/list', (req, res) => {
  try {
    ensureImageDir();
    const files = fs.readdirSync(WISHES_IMAGE_DIR)
      .filter(f => f.endsWith('.png'))
      .map(f => ({
        filename: f,
        url: `/images/wishes/${f}`,
        created: fs.statSync(path.join(WISHES_IMAGE_DIR, f)).mtime
      }))
      .sort((a, b) => b.created - a.created);

    res.json({
      success: true,
      count: files.length,
      images: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/wish-image/watermark
 * 이미지에 워터마크 삽입
 * 요청: {
 *   image_path: string,
 *   image_url: string,
 *   text: string (기본값: '하루하루의 기적 | 예시 이미지'),
 *   position: 'bottom-right' | 'bottom-left' | 'bottom-center' (기본값: 'bottom-right'),
 *   opacity: 0.3-0.7 (기본값: 0.4),
 *   size_percent: 5-10 (기본값: 6, 원본 대비 %)
 * }
 */
router.post('/watermark', async (req, res) => {
  try {
    const {
      image_path,
      image_url,
      text = '하루하루의 기적 | 예시 이미지',
      position = 'bottom-right',
      opacity = 0.4,
      size_percent = 6
    } = req.body;

    let inputPath;

    // image_path가 주어진 경우 (로컬 파일)
    if (image_path) {
      // /images/wishes/xxx.png 형태를 실제 경로로 변환
      if (image_path.startsWith('/images/wishes/')) {
        inputPath = path.join(WISHES_IMAGE_DIR, path.basename(image_path));
      } else {
        inputPath = image_path;
      }

      if (!fs.existsSync(inputPath)) {
        return res.status(404).json({
          success: false,
          error: '이미지 파일을 찾을 수 없습니다.'
        });
      }
    }
    // image_url이 주어진 경우 (원격 URL)
    else if (image_url) {
      ensureImageDir();
      const tempFilename = `temp_${Date.now()}.png`;
      inputPath = await downloadAndSaveImage(image_url, tempFilename);
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'image_path 또는 image_url이 필요합니다.'
      });
    }

    // 출력 파일명 생성
    const timestamp = Date.now();
    const outputFilename = `wish_watermarked_${timestamp}.png`;
    const outputPath = path.join(WISHES_IMAGE_DIR, outputFilename);

    // 이미지 메타데이터 가져오기
    const metadata = await sharp(inputPath).metadata();
    const imageWidth = metadata.width || 1024;
    const imageHeight = metadata.height || 1024;

    // 크기 계산 (원본 대비 %)
    const clampedSizePercent = Math.max(5, Math.min(10, size_percent));
    const fontSize = Math.floor(imageWidth * clampedSizePercent / 100);
    const padding = Math.floor(imageWidth / 40);

    // 투명도 클램프 (0.3 ~ 0.7)
    const clampedOpacity = Math.max(0.3, Math.min(0.7, opacity));
    const shadowOpacity = clampedOpacity * 0.4;

    // 위치별 좌표 및 정렬 계산
    let textX, textAnchor;
    switch (position) {
      case 'bottom-left':
        textX = padding;
        textAnchor = 'start';
        break;
      case 'bottom-center':
        textX = imageWidth / 2;
        textAnchor = 'middle';
        break;
      case 'bottom-right':
      default:
        textX = imageWidth - padding;
        textAnchor = 'end';
        break;
    }
    const textY = imageHeight - padding;

    const watermarkSvg = `
      <svg width="${imageWidth}" height="${imageHeight}">
        <style>
          .watermark {
            font-family: 'Noto Sans KR', Arial, sans-serif;
            font-size: ${fontSize}px;
            fill: white;
            fill-opacity: ${clampedOpacity};
            text-anchor: ${textAnchor};
          }
          .shadow {
            font-family: 'Noto Sans KR', Arial, sans-serif;
            font-size: ${fontSize}px;
            fill: black;
            fill-opacity: ${shadowOpacity};
            text-anchor: ${textAnchor};
          }
        </style>
        <text x="${textX + 2}" y="${textY + 2}" class="shadow">${text}</text>
        <text x="${textX}" y="${textY}" class="watermark">${text}</text>
      </svg>
    `;

    // 이미지에 워터마크 합성
    await sharp(inputPath)
      .composite([{
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0
      }])
      .toFile(outputPath);

    console.log(`[WishImage] Watermark added: ${outputFilename} (position: ${position}, opacity: ${clampedOpacity})`);

    // 임시 파일 삭제 (URL에서 다운로드한 경우)
    if (image_url && inputPath.includes('temp_')) {
      fs.unlink(inputPath, () => {});
    }

    res.json({
      success: true,
      original_path: image_path || image_url,
      watermarked_url: `/images/wishes/${outputFilename}`,
      filename: outputFilename,
      watermark_text: text,
      settings: {
        position,
        opacity: clampedOpacity,
        size_percent: clampedSizePercent
      }
    });

  } catch (error) {
    console.error('[WishImage] Watermark error:', error);
    res.status(500).json({
      success: false,
      error: '워터마크 삽입 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * POST /api/wish-image/generate-with-watermark
 * 소원그림 생성 + 자동 워터마크 (광고용)
 */
router.post('/generate-with-watermark', async (req, res) => {
  try {
    const { wish_content, gem_type, watermark_text = '하루하루의 기적 | 예시 이미지' } = req.body;

    if (!wish_content) {
      return res.status(400).json({
        success: false,
        error: '소원 내용이 필요합니다.'
      });
    }

    const colors = gemColors[gem_type] || gemColors.ruby;

    const prompt = `
      A hopeful, magical illustration representing: "${wish_content}"

      Style: Cosmic universe background with ${colors.primary} and ${colors.secondary} tones
      Mood: Hopeful, bright, inspiring, miraculous
      Elements: Stars, soft light rays, gentle sparkles, symbolizing ${colors.keyword}
      Art style: Digital art, dreamy, ethereal, Korean aesthetic

      No text, no words, no letters, no characters
    `.trim();

    // DALL-E 3 이미지 생성
    let dalleImageUrl;
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[WishImage+WM] Attempt ${attempt}: Generating image`);

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });

        dalleImageUrl = response.data[0].url;
        console.log(`[WishImage+WM] Image generated on attempt ${attempt}`);
        break;

      } catch (apiError) {
        lastError = apiError;
        console.log(`[WishImage+WM] Attempt ${attempt} failed:`, apiError.message);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // 생성 실패 시 Fallback
    if (!dalleImageUrl) {
      return res.json({
        success: true,
        image_url: fallbackImages[gem_type] || fallbackImages.ruby,
        watermarked_url: fallbackImages[gem_type] || fallbackImages.ruby,
        gem_type: gem_type,
        fallback: true,
        error_message: lastError?.message
      });
    }

    // 이미지 다운로드
    ensureImageDir();
    const timestamp = Date.now();
    const originalFilename = `wish_${timestamp}_${gem_type || 'ruby'}.png`;
    const originalPath = path.join(WISHES_IMAGE_DIR, originalFilename);

    await downloadAndSaveImage(dalleImageUrl, originalFilename);
    console.log(`[WishImage+WM] Original saved: ${originalFilename}`);

    // 워터마크 추가
    const watermarkedFilename = `wish_${timestamp}_${gem_type || 'ruby'}_ad.png`;
    const watermarkedPath = path.join(WISHES_IMAGE_DIR, watermarkedFilename);

    const metadata = await sharp(originalPath).metadata();
    const imageWidth = metadata.width || 1024;
    const imageHeight = metadata.height || 1024;
    const fontSize = Math.floor(imageWidth / 30);
    const padding = Math.floor(imageWidth / 40);

    const watermarkSvg = `
      <svg width="${imageWidth}" height="${imageHeight}">
        <style>
          .watermark {
            font-family: 'Noto Sans KR', sans-serif;
            font-size: ${fontSize}px;
            fill: white;
            fill-opacity: 0.7;
            text-anchor: end;
          }
          .shadow {
            font-family: 'Noto Sans KR', sans-serif;
            font-size: ${fontSize}px;
            fill: black;
            fill-opacity: 0.3;
            text-anchor: end;
          }
        </style>
        <text x="${imageWidth - padding + 2}" y="${imageHeight - padding + 2}" class="shadow">${watermark_text}</text>
        <text x="${imageWidth - padding}" y="${imageHeight - padding}" class="watermark">${watermark_text}</text>
      </svg>
    `;

    await sharp(originalPath)
      .composite([{
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0
      }])
      .toFile(watermarkedPath);

    console.log(`[WishImage+WM] Watermarked saved: ${watermarkedFilename}`);

    res.json({
      success: true,
      image_url: `/images/wishes/${originalFilename}`,
      watermarked_url: `/images/wishes/${watermarkedFilename}`,
      original_filename: originalFilename,
      watermarked_filename: watermarkedFilename,
      gem_type: gem_type,
      watermark_text: watermark_text,
      permanent: true
    });

  } catch (error) {
    console.error('[WishImage+WM] Error:', error);
    res.status(500).json({
      success: false,
      error: '소원그림 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

module.exports = router;
