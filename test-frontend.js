// ═══════════════════════════════════════════════════════════
// Frontend Test Script
// 프론트엔드 API 호출 시뮬레이션
// ═══════════════════════════════════════════════════════════

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// ═══════════════════════════════════════════════════════════
// Test Data (프론트엔드에서 보낼 데이터)
// ═══════════════════════════════════════════════════════════

const testData = {
  user: {
    name: '김지수',
    wish: '10kg 감량하기',
    category: '건강',
    phone: '010-1234-5678'
  }
};

// ═══════════════════════════════════════════════════════════
// HTTP Request Helper
// ═══════════════════════════════════════════════════════════

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
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
// Test Function
// ═══════════════════════════════════════════════════════════

async function testFrontendFlow() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 프론트엔드 플로우 테스트');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  console.log('📝 테스트 데이터:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 API 호출 시작...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const startTime = Date.now();

  // 진행 상황 표시
  let dots = 0;
  const progressInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    const dotString = '.'.repeat(dots);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r⏳ 생성 중${dotString.padEnd(3)}  ${elapsed}초 경과`);
  }, 500);

  try {
    const result = await makeRequest('/api/roadmap/generate', 'POST', testData);

    clearInterval(progressInterval);
    console.log('\r\n');

    const totalTime = Date.now() - startTime;

    if (result.success) {
      console.log('✅ 성공!');
      console.log('');
      console.log('📊 결과:');
      console.log(`   세션 ID: ${result.sessionId}`);
      console.log(`   PDF URL: ${result.data.pdfUrl}`);
      console.log(`   템플릿: ${result.data.template}`);
      console.log(`   기적지수: ${result.data.miracleScore}`);
      console.log(`   카톡 발송: ${result.data.kakaoSent ? '✅' : '❌'}`);
      console.log('');
      console.log('⏱️  타이밍:');
      console.log(`   전체: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}초)`);
      console.log(`   콘텐츠 생성: ${result.timing.contentGeneration}ms`);
      console.log(`   PDF 생성: ${result.timing.pdfGeneration}ms`);
      console.log(`   카톡 발송: ${result.timing.kakaoSend}ms`);
      console.log('');

      // 30초 이내 체크
      if (totalTime <= 30000) {
        console.log('🎯 목표 달성! (30초 이내)');
      } else {
        console.log('⚠️  30초 초과:', ((totalTime - 30000) / 1000).toFixed(1), '초');
      }

    } else {
      console.log('❌ 실패');
      console.log(`   에러: ${result.error}`);
      console.log(`   시간: ${totalTime}ms`);
    }

  } catch (error) {
    clearInterval(progressInterval);
    console.log('\r\n');
    console.error('❌ 테스트 실패:', error.message);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ 테스트 완료');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

// ═══════════════════════════════════════════════════════════
// Execute
// ═══════════════════════════════════════════════════════════

console.log('🔍 서버 확인 중...');

const healthCheck = http.get(`${BASE_URL}/api/health`, (res) => {
  if (res.statusCode === 200 || res.statusCode === 503) {
    console.log('✅ 서버 실행 중');
    console.log('');

    testFrontendFlow().catch(console.error);
  } else {
    console.error('❌ 서버가 응답하지 않습니다');
    console.error('   먼저 "npm run dev"로 서버를 시작하세요');
    process.exit(1);
  }
});

healthCheck.on('error', (error) => {
  console.error('❌ 서버에 연결할 수 없습니다');
  console.error('   먼저 "npm run dev"로 서버를 시작하세요');
  console.error('   에러:', error.message);
  process.exit(1);
});
