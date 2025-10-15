// ═══════════════════════════════════════════════════════════
// Roadmap API Test Script
// ═══════════════════════════════════════════════════════════

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// ═══════════════════════════════════════════════════════════
// Test Data
// ═══════════════════════════════════════════════════════════

const testUsers = [
  {
    name: '김지수',
    wish: '10kg 감량하기',
    category: '건강',
    age: 28,
    gender: '여성',
    phone: '010-1234-5678'
  },
  {
    name: '박민준',
    wish: '개발자로 이직하기',
    category: '커리어',
    age: 32,
    gender: '남성',
    phone: '010-2345-6789'
  }
];

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

    req.write(postData);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════
// Test Functions
// ═══════════════════════════════════════════════════════════

async function testSingleGeneration() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 1: 단일 PDF 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const startTime = Date.now();

  try {
    const result = await makeRequest('/api/roadmap/generate', 'POST', {
      user: testUsers[0]
    });

    const elapsed = Date.now() - startTime;

    if (result.success) {
      console.log('✅ 성공!');
      console.log(`   시간: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}초)`);
      console.log(`   PDF URL: ${result.data.pdfUrl}`);
      console.log(`   템플릿: ${result.data.template}`);
      console.log(`   기적지수: ${result.data.miracleScore}`);
      console.log(`   카톡 발송: ${result.data.kakaoSent ? '성공' : '실패/스킵'}`);
    } else {
      console.log('❌ 실패:', result.error);
    }

    console.log('');
    console.log(`📊 성능 분석:`);
    console.log(`   콘텐츠 생성: ${result.timing?.contentGeneration}ms`);
    console.log(`   PDF 생성: ${result.timing?.pdfGeneration}ms`);
    console.log(`   카톡 발송: ${result.timing?.kakaoSend}ms`);

    return result;

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return null;
  }
}

async function testMultipleGeneration() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 2: 다중 PDF 생성 (병렬)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const startTime = Date.now();

  try {
    const promises = testUsers.map(user =>
      makeRequest('/api/roadmap/generate', 'POST', { user })
    );

    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;

    const successCount = results.filter(r => r.success).length;

    console.log('✅ 완료!');
    console.log(`   총 시간: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}초)`);
    console.log(`   성공: ${successCount}/${testUsers.length}`);
    console.log(`   평균 시간: ${(elapsed / testUsers.length).toFixed(0)}ms`);

    results.forEach((result, index) => {
      if (result.success) {
        console.log(`   ${index + 1}. ${testUsers[index].name}: ${result.timing.total}ms`);
      } else {
        console.log(`   ${index + 1}. ${testUsers[index].name}: 실패`);
      }
    });

    return results;

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return null;
  }
}

async function testSampleGeneration() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 3: 샘플 PDF 4개 생성 (전체 템플릿)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const startTime = Date.now();

  try {
    const result = await makeRequest('/api/roadmap/test/samples', 'POST', {});
    const elapsed = Date.now() - startTime;

    if (result.success) {
      console.log('✅ 성공!');
      console.log(`   총 시간: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}초)`);
      console.log(`   생성된 샘플: ${result.statistics.total}개`);
      console.log(`   평균 시간: ${result.statistics.averageTime.toFixed(0)}ms`);
      console.log('');
      console.log('   생성된 파일:');
      result.samples.forEach((sample, index) => {
        console.log(`   ${index + 1}. ${sample.user} (${sample.template}): ${sample.time}ms`);
      });
    } else {
      console.log('❌ 실패:', result.error);
    }

    return result;

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// Run All Tests
// ═══════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎯 30일 기적 로드맵 API 테스트 시작');
  console.log('═══════════════════════════════════════════════════════');

  // Test 1: 단일 생성
  await testSingleGeneration();

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: 병렬 생성
  await testMultipleGeneration();

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: 샘플 생성
  await testSampleGeneration();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ 모든 테스트 완료!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

// ═══════════════════════════════════════════════════════════
// Execute
// ═══════════════════════════════════════════════════════════

// Check if server is running
console.log('🔍 서버 확인 중...');

const healthCheck = http.get('http://localhost:3000/api/health', (res) => {
  if (res.statusCode === 200 || res.statusCode === 503) {
    console.log('✅ 서버 실행 중\n');
    runAllTests().catch(console.error);
  } else {
    console.error('❌ 서버가 응답하지 않습니다');
    console.error('   먼저 "npm run dev"로 서버를 시작하세요');
    process.exit(1);
  }
});

healthCheck.on('error', (error) => {
  console.error('❌ 서버에 연결할 수 없습니다');
  console.error('   먼저 "npm run dev"로 서버를 시작하세요');
  process.exit(1);
});
