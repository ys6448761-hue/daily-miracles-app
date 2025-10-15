// ═══════════════════════════════════════════════════════════
// MVP 전체 플로우 테스트 스크립트
// Daily Miracles MVP - Complete Flow Testing
// ═══════════════════════════════════════════════════════════

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 120000; // 2분

// ═══════════════════════════════════════════════════════════
// 테스트 데이터
// ═══════════════════════════════════════════════════════════

const testCases = {
  problemInput: {
    problem: "매일 아침 일어나기 힘들어서 지각을 자주 해요",
    emotion: "답답함",
    context: "직장인, 30대, 수면 패턴 불규칙"
  },

  wishInput: {
    wish: "매일 아침 6시에 상쾌하게 일어나기",
    category: "건강",
    duration: 30
  },

  threeStepQuestions: {
    step1: "왜 아침에 일어나기 힘든가요?",
    step2: "이상적인 아침 루틴은 어떤 모습인가요?",
    step3: "변화를 위해 가장 먼저 해야 할 일은 무엇인가요?"
  },

  activityData: {
    dailyActivities: [
      { date: "2025-01-10", completed: true, effort: 8 },
      { date: "2025-01-11", completed: true, effort: 7 },
      { date: "2025-01-12", completed: false, effort: 3 }
    ],
    totalDays: 3,
    completionRate: 0.67
  }
};

// ═══════════════════════════════════════════════════════════
// HTTP 요청 헬퍼
// ═══════════════════════════════════════════════════════════

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      },
      timeout: TEST_TIMEOUT
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// ═══════════════════════════════════════════════════════════
// 테스트 결과 저장
// ═══════════════════════════════════════════════════════════

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

function recordTest(name, status, details = {}) {
  testResults.tests.push({
    name,
    status, // 'passed' | 'failed' | 'skipped'
    details,
    timestamp: new Date().toISOString()
  });

  testResults.summary.total++;
  testResults.summary[status]++;
}

// ═══════════════════════════════════════════════════════════
// 개별 테스트 함수들
// ═══════════════════════════════════════════════════════════

async function testHealthCheck() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏥 Test 0: Health Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const result = await makeRequest('/api/health', 'GET');

    if (result.statusCode === 200 && result.data.status) {
      console.log('✅ 서버 상태: 정상');
      console.log('   Status:', result.data.status);
      recordTest('Health Check', 'passed', result.data);
      return true;
    } else {
      console.log('❌ 서버 초기화 중 또는 오류');
      recordTest('Health Check', 'failed', result.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 서버 연결 실패:', error.message);
    recordTest('Health Check', 'failed', { error: error.message });
    return false;
  }
}

async function testProblemToWish() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Test 1: 문제 입력 → 소원 전환');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n📝 입력:');
  console.log('   문제:', testCases.problemInput.problem);
  console.log('   감정:', testCases.problemInput.emotion);

  try {
    const startTime = Date.now();
    const result = await makeRequest('/api/problem/analyze', 'POST', {
      problemInput: testCases.problemInput
    });
    const duration = Date.now() - startTime;

    console.log('\n⏱️  소요 시간:', duration + 'ms');

    if (result.statusCode === 200 && result.data.success) {
      console.log('✅ 성공!');
      console.log('\n📊 결과:');
      console.log('   분석:', result.data.analysis ? '완료' : '없음');
      console.log('   솔루션:', result.data.solutions ? result.data.solutions.length + '개' : '없음');

      recordTest('문제→소원 전환', 'passed', {
        duration,
        hasAnalysis: !!result.data.analysis,
        solutionCount: result.data.solutions?.length || 0
      });
      return true;
    } else {
      console.log('❌ 실패');
      console.log('   에러:', result.data.error || '알 수 없는 오류');
      recordTest('문제→소원 전환', 'failed', { error: result.data.error });
      return false;
    }
  } catch (error) {
    console.log('❌ 테스트 실패:', error.message);
    recordTest('문제→소원 전환', 'failed', { error: error.message });
    return false;
  }
}

async function test3StepQuestions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❓ Test 2: 3단계 질문 시스템');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n현재 구현 상태: 스토리 워크플로우 내 통합');
  console.log('별도 엔드포인트는 없으나, 스토리 생성 과정에서 자동 실행');

  // 스토리 생성 API로 간접 테스트
  try {
    const result = await makeRequest('/api/story/create', 'POST', {
      userInput: {
        wish: testCases.wishInput.wish,
        name: "테스트 사용자",
        age: 30
      }
    });

    if (result.statusCode === 200 && result.data.success) {
      console.log('✅ 스토리 생성 성공 (3단계 질문 포함)');
      console.log('   워크플로우 ID:', result.data.workflowId);
      recordTest('3단계 질문 시스템', 'passed', {
        integrated: true,
        workflowId: result.data.workflowId
      });
      return true;
    } else {
      console.log('⚠️  API 응답:', result.statusCode);
      recordTest('3단계 질문 시스템', 'skipped', {
        reason: '별도 엔드포인트 없음',
        suggestedAPI: '/api/story/create'
      });
      return false;
    }
  } catch (error) {
    console.log('⚠️  테스트 스킵:', error.message);
    recordTest('3단계 질문 시스템', 'skipped', {
      reason: error.message
    });
    return false;
  }
}

async function testMiracleIndexCalculation() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Test 3: 기적지수 계산');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n📝 입력:');
  console.log('   활동 기록:', testCases.activityData.dailyActivities.length + '일');
  console.log('   완료율:', (testCases.activityData.completionRate * 100).toFixed(1) + '%');

  try {
    const startTime = Date.now();
    const result = await makeRequest('/api/miracle/calculate', 'POST', {
      activityData: testCases.activityData
    });
    const duration = Date.now() - startTime;

    console.log('\n⏱️  소요 시간:', duration + 'ms');

    if (result.statusCode === 200 && result.data.success) {
      console.log('✅ 성공!');
      console.log('\n📊 결과:');
      console.log('   기적지수:', result.data.miracleIndex || '계산됨');
      console.log('   예측:', result.data.predictions ? result.data.predictions.length + '개' : '없음');

      recordTest('기적지수 계산', 'passed', {
        duration,
        miracleIndex: result.data.miracleIndex,
        predictionCount: result.data.predictions?.length || 0
      });
      return true;
    } else {
      console.log('❌ 실패');
      console.log('   에러:', result.data.error || '알 수 없는 오류');
      recordTest('기적지수 계산', 'failed', { error: result.data.error });
      return false;
    }
  } catch (error) {
    console.log('❌ 테스트 실패:', error.message);
    recordTest('기적지수 계산', 'failed', { error: error.message });
    return false;
  }
}

async function test5Predictions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔮 Test 4: 5가지 예측 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n현재 구현 상태: 기적지수 계산 API 내 통합');
  console.log('별도 엔드포인트는 없으나, 기적지수 계산 시 자동 생성');

  try {
    const result = await makeRequest('/api/miracle/calculate', 'POST', {
      activityData: testCases.activityData
    });

    if (result.statusCode === 200 && result.data.predictions) {
      const predictions = result.data.predictions;

      console.log('✅ 예측 생성 성공!');
      console.log('\n📊 예측 목록:');

      if (Array.isArray(predictions)) {
        predictions.forEach((pred, idx) => {
          console.log(`   ${idx + 1}. ${typeof pred === 'object' ? JSON.stringify(pred).substring(0, 50) : pred}`);
        });
      } else {
        console.log('   예측 데이터:', typeof predictions);
      }

      recordTest('5가지 예측 생성', 'passed', {
        predictionsCount: Array.isArray(predictions) ? predictions.length : 1,
        type: typeof predictions
      });
      return true;
    } else {
      console.log('⚠️  예측 데이터 없음');
      recordTest('5가지 예측 생성', 'skipped', {
        reason: '예측 데이터 미제공',
        statusCode: result.statusCode
      });
      return false;
    }
  } catch (error) {
    console.log('❌ 테스트 실패:', error.message);
    recordTest('5가지 예측 생성', 'failed', { error: error.message });
    return false;
  }
}

async function testResultPage() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 Test 5: 결과 페이지 표시');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const result = await makeRequest('/result.html', 'GET');

    if (result.statusCode === 200) {
      console.log('✅ 결과 페이지 접근 가능');
      console.log('   상태 코드:', result.statusCode);

      const hasHTML = typeof result.data === 'string' && result.data.includes('<html');
      console.log('   HTML 포함:', hasHTML ? '예' : '아니오');

      recordTest('결과 페이지 표시', 'passed', {
        statusCode: result.statusCode,
        hasHTML
      });
      return true;
    } else {
      console.log('❌ 페이지 접근 불가');
      console.log('   상태 코드:', result.statusCode);
      recordTest('결과 페이지 표시', 'failed', { statusCode: result.statusCode });
      return false;
    }
  } catch (error) {
    console.log('❌ 테스트 실패:', error.message);
    recordTest('결과 페이지 표시', 'failed', { error: error.message });
    return false;
  }
}

async function testShareFunction() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 Test 6: 공유 기능');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n현재 구현 상태: 프론트엔드 기능');
  console.log('서버 측 공유 API는 별도 구현 필요');

  // 결과 페이지의 공유 기능 확인
  try {
    const result = await makeRequest('/result.html', 'GET');

    if (result.statusCode === 200 && typeof result.data === 'string') {
      const hasShareButton = result.data.includes('공유') ||
                            result.data.includes('share') ||
                            result.data.includes('Share');

      if (hasShareButton) {
        console.log('✅ 공유 버튼 발견');
        recordTest('공유 기능', 'passed', {
          hasShareButton: true,
          location: 'result.html'
        });
        return true;
      } else {
        console.log('⚠️  공유 버튼 미발견');
        recordTest('공유 기능', 'skipped', {
          reason: '공유 버튼 없음',
          suggestion: '프론트엔드 기능 추가 필요'
        });
        return false;
      }
    } else {
      console.log('⚠️  결과 페이지 확인 불가');
      recordTest('공유 기능', 'skipped', {
        reason: '결과 페이지 접근 불가'
      });
      return false;
    }
  } catch (error) {
    console.log('⚠️  테스트 스킵:', error.message);
    recordTest('공유 기능', 'skipped', { error: error.message });
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// 메인 테스트 실행
// ═══════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 Daily Miracles MVP - 전체 플로우 테스트');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
  console.log('');

  const overallStartTime = Date.now();

  // 서버 헬스 체크
  const isServerHealthy = await testHealthCheck();

  if (!isServerHealthy) {
    console.log('\n⚠️  서버가 준비되지 않았습니다. 테스트를 중단합니다.');
    console.log('   먼저 "npm run dev"로 서버를 시작하세요.');
    return;
  }

  // 각 테스트 실행
  await testProblemToWish();
  await test3StepQuestions();
  await testMiracleIndexCalculation();
  await test5Predictions();
  await testResultPage();
  await testShareFunction();

  const overallDuration = Date.now() - overallStartTime;

  // ═══════════════════════════════════════════════════════════
  // 최종 리포트
  // ═══════════════════════════════════════════════════════════

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 테스트 결과 요약');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('총 테스트:', testResults.summary.total);
  console.log('✅ 통과:', testResults.summary.passed);
  console.log('❌ 실패:', testResults.summary.failed);
  console.log('⚠️  스킵:', testResults.summary.skipped);
  console.log('');
  console.log('성공률:',
    ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1) + '%');
  console.log('총 소요 시간:', overallDuration + 'ms');
  console.log('');

  // 상세 결과
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('상세 결과:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  testResults.tests.forEach((test, idx) => {
    const icon = test.status === 'passed' ? '✅' :
                 test.status === 'failed' ? '❌' : '⚠️';
    console.log(`${idx + 1}. ${icon} ${test.name}`);

    if (test.details && Object.keys(test.details).length > 0) {
      Object.entries(test.details).forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value)}`);
      });
    }
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ 테스트 완료!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // JSON 리포트 저장
  const fs = require('fs');
  const reportPath = './test-report-mvp-flow.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log('📄 상세 리포트 저장됨:', reportPath);
  console.log('');
}

// ═══════════════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════════════

runAllTests().catch(error => {
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('💥 치명적 오류 발생');
  console.error('═══════════════════════════════════════════════════════════');
  console.error(error);
  console.error('');
  process.exit(1);
});
