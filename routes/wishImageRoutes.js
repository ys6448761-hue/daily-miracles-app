/**
 * 소원그림 생성 API
 * POST /api/wish-image/generate - DALL-E 3로 소원그림 생성 + 영구 저장
 * GET /api/wish-image/status - OpenAI API 상태 체크
 */

const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

module.exports = router;
