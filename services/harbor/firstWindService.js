/**
 * firstWindService.js
 * 첫 바람 시스템 (소원 작성 후 30초 내 자동 응원)
 *
 * SLA: p50 < 30초, p95 < 60초
 */

let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ harbor/firstWindService: DB 로드 실패:', error.message);
}

const notificationService = require('./notificationService');

// OpenAI API (기존 설정 재사용)
let openaiService = null;
try {
  openaiService = require('../openaiService');
} catch (error) {
  console.warn('⚠️ firstWindService: OpenAI 서비스 로드 실패:', error.message);
}

// 첫 바람 프리셋 (AI 실패 시 fallback)
const FIRST_WIND_PRESETS = [
  '당신의 소원을 진심으로 응원해요. 꼭 이뤄지길 바랍니다!',
  '소원을 품은 당신의 용기가 멋져요. 함께 응원할게요!',
  '좋은 일이 생길 거예요. 소원이 현실이 되길!',
  '당신의 간절함이 느껴져요. 분명 좋은 결과가 있을 거예요.',
  '소원을 빌어주셔서 감사해요. 함께 바람을 불어드릴게요!',
  '따뜻한 바람이 당신의 소원을 향해 불어가요.',
  '소원이 이뤄지는 그 순간을 상상해봐요. 곧 현실이 될 거예요!',
  '당신의 소원에 첫 바람을 보내드려요. 힘내세요!',
  '소원을 품고 나아가는 당신을 응원합니다.',
  '좋은 기운을 담아 첫 바람을 보내드려요!'
];

// 메트릭스 (p50, p95 계산용)
const latencyMetrics = [];

/**
 * 첫 바람 생성 (비동기)
 * POST /harbor/wishes 성공 직후 호출
 */
async function generateFirstWind(wishId, wishContent, userId) {
  if (!db) {
    console.warn('⚠️ 첫 바람 생성 실패: DB 없음');
    return null;
  }

  const startTime = Date.now();

  try {
    // 이미 첫 바람이 있는지 확인 (idempotent)
    const existing = await db.query(
      'SELECT id FROM first_wind_logs WHERE wish_id = $1',
      [wishId]
    );

    if (existing.rows.length > 0) {
      console.log(`⚠️ 첫 바람 이미 존재: wish=${wishId}`);
      return null;
    }

    // 메시지 생성 (AI 또는 프리셋)
    let message;
    let windType = 'AI';

    try {
      message = await generateAIEncouragement(wishContent);
    } catch (error) {
      console.warn('⚠️ AI 생성 실패, 프리셋 사용:', error.message);
      message = getRandomPreset();
      windType = 'AI'; // 프리셋도 AI로 표기 (사용자에겐 "소원이(항해사)"로 표시)
    }

    const latencyMs = Date.now() - startTime;

    // DB 저장
    await db.query(`
      INSERT INTO first_wind_logs (wish_id, message, wind_type, latency_ms)
      VALUES ($1, $2, $3, $4)
    `, [wishId, message, windType, latencyMs]);

    // 알림 생성
    await notificationService.createNotification(userId, {
      type: 'first_wind',
      title: '🌬️ 첫 바람이 불어왔어요!',
      body: message,
      data: { wishId }
    });

    // 메트릭스 기록
    latencyMetrics.push(latencyMs);
    if (latencyMetrics.length > 1000) {
      latencyMetrics.shift(); // 최근 1000개만 유지
    }

    console.log(`🌬️ 첫 바람 생성: wish=${wishId}, latency=${latencyMs}ms`);

    return { message, latencyMs, windType };

  } catch (error) {
    console.error('❌ 첫 바람 생성 실패:', error.message);
    throw error;
  }
}

/**
 * AI 응원 메시지 생성
 */
async function generateAIEncouragement(wishContent) {
  if (!openaiService) {
    throw new Error('OPENAI_SERVICE_NOT_AVAILABLE');
  }

  const prompt = `당신은 따뜻하고 공감하는 응원 메시지 작성자입니다.
아래 소원에 대해 짧고 따뜻한 응원 메시지를 작성해주세요.

소원: "${wishContent}"

규칙:
- 100자 이내로 작성
- 조언하지 말고 순수하게 응원만
- "~해야", "~하지 마" 같은 표현 금지
- 따뜻하고 희망적인 톤 유지
- "AI"라는 단어 사용 금지

응원 메시지:`;

  const response = await openaiService.chat({
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.7
  });

  return response.content?.trim() || getRandomPreset();
}

/**
 * 랜덤 프리셋 선택
 */
function getRandomPreset() {
  const index = Math.floor(Math.random() * FIRST_WIND_PRESETS.length);
  return FIRST_WIND_PRESETS[index];
}

/**
 * 첫 바람 조회
 */
async function getFirstWind(wishId) {
  if (!db) return null;

  const result = await db.query(
    'SELECT * FROM first_wind_logs WHERE wish_id = $1',
    [wishId]
  );

  return result.rows[0] || null;
}

/**
 * SLA 메트릭스 조회
 */
function getLatencyMetrics() {
  if (latencyMetrics.length === 0) {
    return { p50: 0, p95: 0, count: 0 };
  }

  const sorted = [...latencyMetrics].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);

  return {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    count: sorted.length,
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
  };
}

module.exports = {
  FIRST_WIND_PRESETS,
  generateFirstWind,
  getFirstWind,
  getLatencyMetrics
};
