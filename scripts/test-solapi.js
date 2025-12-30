/**
 * Solapi 알림톡 테스트 스크립트
 *
 * 사용법:
 *   node scripts/test-solapi.js
 *   node scripts/test-solapi.js 01012345678  (실제 번호로 테스트)
 */

require('dotenv').config();

const { sendMiracleResult, isEnabled } = require('../services/solapiService');

async function testMiracleResult() {
    console.log('='.repeat(50));
    console.log('🧪 Solapi 알림톡 테스트');
    console.log('='.repeat(50));

    // 환경변수 체크
    console.log('\n📋 환경변수 상태:');
    console.log(`  SOLAPI_API_KEY: ${process.env.SOLAPI_API_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`  SOLAPI_API_SECRET: ${process.env.SOLAPI_API_SECRET ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`  SOLAPI_PFID: ${process.env.SOLAPI_PFID || '❌ 미설정'}`);
    console.log(`  SOLAPI_TEMPLATE_MIRACLE_RESULT: ${process.env.SOLAPI_TEMPLATE_MIRACLE_RESULT || '❌ 미설정'}`);
    console.log(`  SENDER_PHONE: ${process.env.SENDER_PHONE || '18996117'}`);

    console.log(`\n🔌 Solapi 활성화 상태: ${isEnabled() ? '✅ 활성화' : '❌ 비활성화 (시뮬레이션 모드)'}`);

    // 테스트 데이터
    const testPhone = process.argv[2] || process.env.TEST_PHONE || '01012345678';
    const testName = '테스트소원이';
    const testScore = 85;
    const testLink = 'https://dailymiracles.kr/result/test123';

    console.log('\n📤 테스트 발송 시도:');
    console.log(`  - 수신번호: ${testPhone}`);
    console.log(`  - 이름: ${testName}`);
    console.log(`  - 점수: ${testScore}점`);
    console.log(`  - 링크: ${testLink}`);

    // 발송 시도
    console.log('\n⏳ 발송 중...\n');
    const result = await sendMiracleResult(testPhone, testName, testScore, testLink);

    console.log('\n📊 결과:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
        console.log('\n✅ 발송 성공!');
    } else if (result.simulated) {
        console.log('\n⚠️ 시뮬레이션 모드 (API 키 미설정)');
        console.log('실제 발송을 위해 .env에 SOLAPI_API_KEY와 SOLAPI_API_SECRET을 설정하세요.');
    } else {
        console.log('\n❌ 발송 실패:', result.reason || result.error);
    }

    console.log('\n' + '='.repeat(50));
}

testMiracleResult().catch(console.error);
