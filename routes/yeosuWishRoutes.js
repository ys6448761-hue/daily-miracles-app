/**
 * 여수 소원빌기 체험 MVP - API Routes
 *
 * POST   /api/yeosu/wish          - 소원 접수
 * GET    /api/yeosu/wish/products - 상품 목록
 * POST   /api/yeosu/wish/checkout - 결제 요청 (유료)
 * POST   /api/yeosu/wish/confirm-payment - 결제 확인
 * GET    /api/yeosu/wish/:id      - 결과물 조회
 * GET    /api/yeosu/wish/download/:token - 이미지 다운로드
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Pool } = require('pg');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

// DB 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 이미지 저장 경로
const YEOSU_WISH_IMAGE_DIR = path.join(__dirname, '..', 'public', 'images', 'yeosu-wishes');

// 폴더 생성 확인
function ensureImageDir() {
  if (!fs.existsSync(YEOSU_WISH_IMAGE_DIR)) {
    fs.mkdirSync(YEOSU_WISH_IMAGE_DIR, { recursive: true });
  }
}

// ═══════════════════════════════════════════════════════════
// 상품 정의
// ═══════════════════════════════════════════════════════════
const PRODUCTS = {
  FREE: {
    sku: 'FREE',
    name: '무료 체험',
    price: 0,
    duration: null,
    description: '소원그림 1장 무료 생성',
    features: ['AI 소원그림 1장', '30일 다운로드']
  },
  YW_BASIC_7: {
    sku: 'YW_BASIC_7',
    name: '베이직 7',
    price: 9900,
    duration: 7,
    description: '7일간 매일 응원 메시지',
    features: ['AI 소원그림 1장', '7일 응원 메시지', '30일 다운로드']
  },
  YW_PREMIUM_30: {
    sku: 'YW_PREMIUM_30',
    name: '프리미엄 30',
    price: 24900,
    duration: 30,
    description: '30일간 매일 응원 메시지',
    features: ['AI 소원그림 1장', '30일 응원 메시지', '30일 다운로드', '특별 축원문']
  }
};

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

/**
 * 고유 wish_id 생성 (YW-YYYYMMDD-XXXX)
 */
function generateWishId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `YW-${dateStr}-${randomPart}`;
}

/**
 * 다운로드 토큰 생성
 */
function generateDownloadToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * DALL-E 이미지 다운로드 및 저장
 */
function downloadAndSaveImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    ensureImageDir();
    const filePath = path.join(YEOSU_WISH_IMAGE_DIR, filename);
    const file = fs.createWriteStream(filePath);

    https.get(imageUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filePath);
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {});
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
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

/**
 * 여수 테마 소원그림 DALL-E 프롬프트 생성
 */
function buildYeosuWishPrompt(wishText) {
  return `
A magical, dreamlike digital illustration representing the wish: "${wishText}"

Setting: Beautiful Yeosu (여수) seascape at twilight
- Gentle ocean waves with bioluminescent glow
- Traditional Korean lanterns floating over water
- Distant silhouette of Dolsan Bridge with lights
- Stars and fireflies dancing in the sky

Style: Korean aesthetic, ethereal, hopeful
Mood: Peaceful, miraculous, wish-fulfilling energy
Colors: Deep purple, soft gold, ocean blue, warm amber

Important: NO text, NO words, NO letters, NO characters in the image.
`.trim();
}

/**
 * DALL-E 이미지 생성 (3회 재시도)
 */
async function generateWishImage(wishText, wishId) {
  const prompt = buildYeosuWishPrompt(wishText);
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[YeosuWish] Attempt ${attempt}: Generating image for ${wishId}`);

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });

      const dalleImageUrl = response.data[0].url;
      console.log(`[YeosuWish] Success on attempt ${attempt}`);

      // 이미지 저장
      const filename = `${wishId}.png`;
      await downloadAndSaveImage(dalleImageUrl, filename);
      console.log(`[YeosuWish] Image saved: ${filename}`);

      return {
        success: true,
        imageUrl: `/images/yeosu-wishes/${filename}`,
        filename: filename
      };

    } catch (apiError) {
      lastError = apiError;
      console.log(`[YeosuWish] Attempt ${attempt} failed:`, apiError.message);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // 3회 실패 시 Fallback
  console.log(`[YeosuWish] All attempts failed, using fallback for ${wishId}`);
  return {
    success: false,
    imageUrl: '/images/fallback/yeosu-wish-default.png',
    fallback: true,
    error: lastError?.message
  };
}

// ═══════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/yeosu/wish/products
 * 상품 목록 조회
 */
router.get('/products', (req, res) => {
  const productList = Object.values(PRODUCTS).map(p => ({
    sku: p.sku,
    name: p.name,
    price: p.price,
    duration: p.duration,
    description: p.description,
    features: p.features
  }));

  res.json({
    success: true,
    products: productList
  });
});

/**
 * POST /api/yeosu/wish
 * 소원 접수 (무료 또는 결제 대기)
 */
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      wish_text,
      photo_url,
      sku = 'FREE',
      is_group = false,
      group_size = 1,
      group_name,
      source = 'WEB'
    } = req.body;

    // 유효성 검사
    if (!customer_name || !customer_phone || !wish_text) {
      return res.status(400).json({
        success: false,
        error: '필수 정보를 입력해주세요. (이름, 전화번호, 소원)'
      });
    }

    if (wish_text.length > 100) {
      return res.status(400).json({
        success: false,
        error: '소원은 100자 이내로 입력해주세요.'
      });
    }

    const product = PRODUCTS[sku];
    if (!product) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 상품입니다.'
      });
    }

    // wish_id 및 토큰 생성
    const wish_id = generateWishId();
    const download_token = generateDownloadToken();
    const download_expires_at = new Date();
    download_expires_at.setDate(download_expires_at.getDate() + 30); // 30일 유효

    // 무료 상품인 경우 바로 PENDING (생성 대기)
    // 유료 상품인 경우 결제 대기 상태
    const initialStatus = product.price === 0 ? 'PENDING' : 'AWAITING_PAYMENT';

    // DB 저장
    const insertQuery = `
      INSERT INTO yeosu_wishes (
        wish_id, customer_name, customer_phone, customer_email,
        wish_text, photo_url, sku, amount,
        is_group, group_size, group_name,
        status, download_token, download_expires_at, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      wish_id,
      customer_name,
      customer_phone,
      customer_email || null,
      wish_text,
      photo_url || null,
      sku,
      product.price,
      is_group,
      group_size,
      group_name || null,
      initialStatus,
      download_token,
      download_expires_at,
      source
    ]);

    const wish = result.rows[0];

    // 무료인 경우 즉시 이미지 생성 시작 (비동기)
    if (product.price === 0) {
      // 비동기로 이미지 생성 시작
      processWishImage(wish_id).catch(err => {
        console.error(`[YeosuWish] Background image generation failed for ${wish_id}:`, err);
      });
    }

    res.json({
      success: true,
      wish_id: wish_id,
      status: initialStatus,
      product: {
        sku: product.sku,
        name: product.name,
        price: product.price
      },
      download_token: download_token,
      message: product.price === 0
        ? '소원이 접수되었습니다. 잠시 후 소원그림이 생성됩니다.'
        : '소원이 접수되었습니다. 결제를 진행해주세요.'
    });

  } catch (error) {
    console.error('[YeosuWish] 접수 오류:', error);
    res.status(500).json({
      success: false,
      error: '소원 접수 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 이미지 생성 처리 (비동기)
 */
async function processWishImage(wishId) {
  try {
    // 상태를 GENERATING으로 변경
    await pool.query(
      `UPDATE yeosu_wishes SET status = 'GENERATING', updated_at = NOW() WHERE wish_id = $1`,
      [wishId]
    );

    // 소원 정보 조회
    const wishResult = await pool.query(
      `SELECT wish_text FROM yeosu_wishes WHERE wish_id = $1`,
      [wishId]
    );

    if (wishResult.rows.length === 0) {
      throw new Error('소원을 찾을 수 없습니다.');
    }

    const wishText = wishResult.rows[0].wish_text;

    // DALL-E 이미지 생성
    const imageResult = await generateWishImage(wishText, wishId);

    // 결과 저장
    await pool.query(
      `UPDATE yeosu_wishes
       SET status = 'COMPLETED',
           result_image_url = $1,
           updated_at = NOW()
       WHERE wish_id = $2`,
      [imageResult.imageUrl, wishId]
    );

    console.log(`[YeosuWish] Image generation completed for ${wishId}`);
    return imageResult;

  } catch (error) {
    console.error(`[YeosuWish] Image generation failed for ${wishId}:`, error);

    // 실패 상태로 변경
    await pool.query(
      `UPDATE yeosu_wishes SET status = 'FAILED', updated_at = NOW() WHERE wish_id = $1`,
      [wishId]
    );

    throw error;
  }
}

/**
 * POST /api/yeosu/wish/checkout
 * 결제 요청 (유료 상품)
 */
router.post('/checkout', async (req, res) => {
  try {
    const { wish_id } = req.body;

    if (!wish_id) {
      return res.status(400).json({
        success: false,
        error: 'wish_id가 필요합니다.'
      });
    }

    // 소원 조회
    const wishResult = await pool.query(
      `SELECT * FROM yeosu_wishes WHERE wish_id = $1`,
      [wish_id]
    );

    if (wishResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '소원을 찾을 수 없습니다.'
      });
    }

    const wish = wishResult.rows[0];

    if (wish.amount === 0) {
      return res.status(400).json({
        success: false,
        error: '무료 상품은 결제가 필요하지 않습니다.'
      });
    }

    if (wish.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({
        success: false,
        error: '결제 대기 상태가 아닙니다.'
      });
    }

    const product = PRODUCTS[wish.sku];

    // TODO: 실제 PG 연동 시 결제 링크 생성
    // 현재는 테스트용 응답
    res.json({
      success: true,
      wish_id: wish_id,
      amount: wish.amount,
      order_name: `여수 소원빌기 - ${product?.name || wish.sku}`,
      customer_name: wish.customer_name,
      customer_phone: wish.customer_phone,
      // 테스트용: 실제 PG 연동 시 payment_url 제공
      payment_url: `/api/yeosu/wish/test-payment?wish_id=${wish_id}`,
      message: '결제 페이지로 이동합니다.'
    });

  } catch (error) {
    console.error('[YeosuWish] Checkout 오류:', error);
    res.status(500).json({
      success: false,
      error: '결제 요청 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /api/yeosu/wish/confirm-payment
 * 결제 확인 (PG 콜백 또는 테스트용)
 */
router.post('/confirm-payment', async (req, res) => {
  try {
    const { wish_id, payment_key, transaction_id } = req.body;

    if (!wish_id) {
      return res.status(400).json({
        success: false,
        error: 'wish_id가 필요합니다.'
      });
    }

    // 소원 조회
    const wishResult = await pool.query(
      `SELECT * FROM yeosu_wishes WHERE wish_id = $1`,
      [wish_id]
    );

    if (wishResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '소원을 찾을 수 없습니다.'
      });
    }

    const wish = wishResult.rows[0];

    if (wish.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({
        success: false,
        error: '결제 대기 상태가 아닙니다.',
        current_status: wish.status
      });
    }

    // 결제 완료 처리
    await pool.query(
      `UPDATE yeosu_wishes
       SET status = 'PENDING',
           pg_payment_key = $2,
           pg_transaction_id = $3,
           paid_at = NOW(),
           updated_at = NOW()
       WHERE wish_id = $1`,
      [wish_id, payment_key || null, transaction_id || null]
    );

    // 이미지 생성 시작 (비동기)
    processWishImage(wish_id).catch(err => {
      console.error(`[YeosuWish] Background image generation failed for ${wish_id}:`, err);
    });

    res.json({
      success: true,
      wish_id: wish_id,
      status: 'PENDING',
      message: '결제가 완료되었습니다. 소원그림이 생성됩니다.',
      download_token: wish.download_token
    });

  } catch (error) {
    console.error('[YeosuWish] 결제 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '결제 확인 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/yeosu/wish/test-payment
 * 테스트용 결제 처리 (개발용)
 */
router.get('/test-payment', async (req, res) => {
  const { wish_id } = req.query;

  if (!wish_id) {
    return res.status(400).send('wish_id가 필요합니다.');
  }

  // 바로 결제 완료 처리
  try {
    const wishResult = await pool.query(
      `SELECT * FROM yeosu_wishes WHERE wish_id = $1`,
      [wish_id]
    );

    if (wishResult.rows.length === 0) {
      return res.status(404).send('소원을 찾을 수 없습니다.');
    }

    const wish = wishResult.rows[0];

    // 결제 완료 처리
    await pool.query(
      `UPDATE yeosu_wishes
       SET status = 'PENDING',
           pg_payment_key = 'TEST_KEY',
           paid_at = NOW(),
           updated_at = NOW()
       WHERE wish_id = $1`,
      [wish_id]
    );

    // 이미지 생성 시작
    processWishImage(wish_id).catch(err => {
      console.error(`[YeosuWish] Test payment image gen failed:`, err);
    });

    // 결과 페이지로 리다이렉트
    res.redirect(`/yeosu-wish-result.html?id=${wish_id}&token=${wish.download_token}`);

  } catch (error) {
    console.error('[YeosuWish] Test payment error:', error);
    res.status(500).send('결제 처리 오류');
  }
});

/**
 * GET /api/yeosu/wish/:id
 * 소원 및 결과물 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // wish_id 또는 download_token으로 조회
    let query, params;
    if (id.startsWith('YW-')) {
      query = `SELECT * FROM yeosu_wishes WHERE wish_id = $1`;
      params = [id];
    } else {
      query = `SELECT * FROM yeosu_wishes WHERE download_token = $1`;
      params = [id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '소원을 찾을 수 없습니다.'
      });
    }

    const wish = result.rows[0];

    // 토큰 검증 (선택적)
    if (token && wish.download_token !== token) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    // 다운로드 만료 확인
    const isExpired = new Date() > new Date(wish.download_expires_at);

    const product = PRODUCTS[wish.sku];

    res.json({
      success: true,
      wish: {
        wish_id: wish.wish_id,
        customer_name: wish.customer_name,
        wish_text: wish.wish_text,
        status: wish.status,
        sku: wish.sku,
        product_name: product?.name || wish.sku,
        result_image_url: wish.result_image_url,
        download_expires_at: wish.download_expires_at,
        is_expired: isExpired,
        created_at: wish.created_at
      }
    });

  } catch (error) {
    console.error('[YeosuWish] 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '소원 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/yeosu/wish/download/:token
 * 이미지 다운로드 (토큰 인증)
 */
router.get('/download/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // 토큰으로 소원 조회
    const result = await pool.query(
      `SELECT * FROM yeosu_wishes WHERE download_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '유효하지 않은 다운로드 링크입니다.'
      });
    }

    const wish = result.rows[0];

    // 만료 확인
    if (new Date() > new Date(wish.download_expires_at)) {
      return res.status(410).json({
        success: false,
        error: '다운로드 링크가 만료되었습니다.'
      });
    }

    // 이미지 생성 완료 확인
    if (wish.status !== 'COMPLETED' || !wish.result_image_url) {
      return res.status(202).json({
        success: false,
        status: wish.status,
        error: wish.status === 'GENERATING'
          ? '소원그림 생성 중입니다. 잠시 후 다시 시도해주세요.'
          : '아직 소원그림이 준비되지 않았습니다.'
      });
    }

    // 다운로드 카운트 증가
    await pool.query(
      `UPDATE yeosu_wishes SET download_count = download_count + 1 WHERE wish_id = $1`,
      [wish.wish_id]
    );

    // 파일 전송
    const filename = `${wish.wish_id}.png`;
    const filePath = path.join(YEOSU_WISH_IMAGE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '이미지 파일을 찾을 수 없습니다.'
      });
    }

    res.download(filePath, `여수소원_${wish.customer_name}_${wish.wish_id}.png`);

  } catch (error) {
    console.error('[YeosuWish] 다운로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '다운로드 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/yeosu/wish/status/:id
 * 생성 상태 확인 (폴링용)
 */
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT wish_id, status, result_image_url FROM yeosu_wishes WHERE wish_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '소원을 찾을 수 없습니다.'
      });
    }

    const wish = result.rows[0];

    res.json({
      success: true,
      wish_id: wish.wish_id,
      status: wish.status,
      completed: wish.status === 'COMPLETED',
      result_image_url: wish.result_image_url
    });

  } catch (error) {
    console.error('[YeosuWish] 상태 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '상태 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
