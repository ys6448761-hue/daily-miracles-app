// ═══════════════════════════════════════════════════════════
// Kakao Talk API Service
// 카카오톡 메시지 전송
// ═══════════════════════════════════════════════════════════

const https = require('https');
const http = require('http');

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════

const KAKAO_CONFIG = {
  // 알리고 API (간편한 카카오톡 발송 서비스)
  aligo: {
    enabled: !!process.env.ALIGO_API_KEY,
    apiKey: process.env.ALIGO_API_KEY,
    userId: process.env.ALIGO_USER_ID,
    senderKey: process.env.ALIGO_SENDER_KEY,
    url: 'https://kakaoapi.aligo.in/akv10/alimtalk/send/'
  },

  // 카카오 비즈니스 API (공식)
  kakao: {
    enabled: !!process.env.KAKAO_API_KEY,
    apiKey: process.env.KAKAO_API_KEY,
    url: 'https://kapi.kakao.com/v2/api/talk/memo/default/send'
  }
};

// ═══════════════════════════════════════════════════════════
// Message Templates
// ═══════════════════════════════════════════════════════════

function buildRoadmapMessage(userData, pdfUrl) {
  return {
    title: '🎁 30일 기적 로드맵이 도착했어요!',
    body: `${userData.name}님, 안녕하세요!

Aurora 5가 ${userData.name}님만을 위한
특별한 30일 로드맵을 만들었어요.

📋 목표: ${userData.wish}

지금 바로 확인하고
첫 번째 단계를 시작해보세요! ✨

Aurora 5가 매일 응원할게요 💜`,
    pdfUrl: pdfUrl,
    buttons: [
      {
        title: '로드맵 열기',
        type: 'webLink',
        url: pdfUrl
      }
    ]
  };
}

// ═══════════════════════════════════════════════════════════
// Send via Aligo (알리고)
// ═══════════════════════════════════════════════════════════

async function sendViaAligo(phone, message) {
  if (!KAKAO_CONFIG.aligo.enabled) {
    console.log('⚠️  알리고 API 설정이 없습니다');
    return { success: false, error: 'Aligo API not configured' };
  }

  try {
    const data = {
      apikey: KAKAO_CONFIG.aligo.apiKey,
      userid: KAKAO_CONFIG.aligo.userId,
      senderkey: KAKAO_CONFIG.aligo.senderKey,
      tpl_code: 'roadmap_delivery', // 사전 등록된 템플릿 코드
      sender: '15441111', // 발신번호
      receiver_1: phone.replace(/-/g, ''),
      subject_1: message.title,
      message_1: message.body,
      button_1: JSON.stringify({
        button: message.buttons.map(btn => ({
          name: btn.title,
          type: btn.type === 'webLink' ? 'WL' : 'AL',
          url_mobile: btn.url,
          url_pc: btn.url
        }))
      })
    };

    const result = await makeHttpRequest(
      KAKAO_CONFIG.aligo.url,
      'POST',
      data
    );

    console.log('✅ 알리고 발송 성공');
    return {
      success: true,
      provider: 'aligo',
      result: result
    };

  } catch (error) {
    console.error('❌ 알리고 발송 실패:', error);
    return {
      success: false,
      provider: 'aligo',
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Send via Kakao Official API
// ═══════════════════════════════════════════════════════════

async function sendViaKakao(phone, message) {
  if (!KAKAO_CONFIG.kakao.enabled) {
    console.log('⚠️  카카오 API 설정이 없습니다');
    return { success: false, error: 'Kakao API not configured' };
  }

  try {
    const data = {
      template_object: JSON.stringify({
        object_type: 'text',
        text: message.body,
        link: {
          web_url: message.pdfUrl,
          mobile_web_url: message.pdfUrl
        },
        button_title: message.buttons[0]?.title || '확인'
      })
    };

    const result = await makeHttpRequest(
      KAKAO_CONFIG.kakao.url,
      'POST',
      data,
      {
        'Authorization': `Bearer ${KAKAO_CONFIG.kakao.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    );

    console.log('✅ 카카오 발송 성공');
    return {
      success: true,
      provider: 'kakao',
      result: result
    };

  } catch (error) {
    console.error('❌ 카카오 발송 실패:', error);
    return {
      success: false,
      provider: 'kakao',
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Mock Send (개발/테스트용)
// ═══════════════════════════════════════════════════════════

async function sendMock(phone, message) {
  console.log('📱 [MOCK] 카카오톡 발송 시뮬레이션');
  console.log(`받는 사람: ${phone}`);
  console.log(`제목: ${message.title}`);
  console.log(`내용:\n${message.body}`);
  console.log(`PDF URL: ${message.pdfUrl}`);

  // 시뮬레이션 딜레이
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    provider: 'mock',
    message: 'Mock message sent successfully'
  };
}

// ═══════════════════════════════════════════════════════════
// Main Send Function (Auto-select provider)
// ═══════════════════════════════════════════════════════════

async function sendKakaoMessage(userData, pdfUrl) {
  const startTime = Date.now();

  try {
    console.log(`📱 카카오톡 발송 시작: ${userData.phone}`);

    // 메시지 빌드
    const message = buildRoadmapMessage(userData, pdfUrl);

    // 발송 시도 (우선순위대로)
    let result;

    if (KAKAO_CONFIG.aligo.enabled) {
      result = await sendViaAligo(userData.phone, message);
    } else if (KAKAO_CONFIG.kakao.enabled) {
      result = await sendViaKakao(userData.phone, message);
    } else {
      // API 설정이 없으면 Mock 사용
      console.log('⚠️  실제 카카오톡 API 미설정, Mock 모드 사용');
      result = await sendMock(userData.phone, message);
    }

    const elapsed = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ 카카오톡 발송 완료: ${elapsed}ms`);
    } else {
      console.error(`❌ 카카오톡 발송 실패: ${result.error}`);
    }

    return {
      ...result,
      time: elapsed
    };

  } catch (error) {
    console.error('❌ 카카오톡 발송 오류:', error);
    return {
      success: false,
      error: error.message,
      time: Date.now() - startTime
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Retry Logic
// ═══════════════════════════════════════════════════════════

async function sendWithRetry(userData, pdfUrl, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 카카오톡 발송 시도 ${attempt}/${maxRetries}`);

    const result = await sendKakaoMessage(userData, pdfUrl);

    if (result.success) {
      return result;
    }

    if (attempt < maxRetries) {
      const delay = attempt * 1000; // 1초, 2초, 3초...
      console.log(`⏳ ${delay}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts`,
    attempts: maxRetries
  };
}

// ═══════════════════════════════════════════════════════════
// HTTP Request Helper
// ═══════════════════════════════════════════════════════════

function makeHttpRequest(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    // POST data를 쿼리 스트링으로 변환
    const postData = Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = lib.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (method === 'POST') {
      req.write(postData);
    }

    req.end();
  });
}

// ═══════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════

module.exports = {
  sendKakaoMessage,
  sendWithRetry,
  buildRoadmapMessage,
  KAKAO_CONFIG
};
