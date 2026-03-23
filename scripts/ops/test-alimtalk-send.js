#!/usr/bin/env node
/**
 * PR-2C 실제 발송 테스트 (1건)
 *
 * 사용법:
 *   node scripts/ops/test-alimtalk-send.js 01012345678
 *
 * 필수 환경변수:
 *   SENS_ACCESS_KEY, SENS_SECRET_KEY, SENS_SERVICE_ID,
 *   SENS_CHANNEL_ID, SENS_TEMPLATE_CODE
 *
 * 테스트 내용:
 *   1) overlay 이미지 있는 알림톡 발송 (image 첨부)
 *   2) overlay 실패 시뮬레이션 (텍스트만 발송)
 */

const path = require('path');

// .env 로드 (로컬 테스트용)
try { require('dotenv').config({ path: path.join(__dirname, '../../.env') }); } catch {}

const messageProvider = require('../../services/messageProvider');

const TEST_PHONE = process.argv[2];
if (!TEST_PHONE) {
    console.error('사용법: node scripts/ops/test-alimtalk-send.js <전화번호>');
    console.error('예시:  node scripts/ops/test-alimtalk-send.js 01012345678');
    process.exit(1);
}

// 환경변수 체크
const config = messageProvider.getConfig();
console.log('\n📋 환경변수 상태:', JSON.stringify(config, null, 2));

if (!config.sensConfigured) {
    console.error('\n❌ SENS API 키가 설정되지 않았습니다.');
    console.error('아래 환경변수를 설정하세요:');
    console.error('  SENS_ACCESS_KEY');
    console.error('  SENS_SECRET_KEY');
    console.error('  SENS_SERVICE_ID');
    console.error('  SENS_TEMPLATE_CODE');
    process.exit(1);
}

(async () => {
    console.log('\n═══════════════════════════════════════');
    console.log(' PR-2C: 실제 알림톡 발송 테스트');
    console.log('═══════════════════════════════════════');

    // ── TEST 1: image_url 포함 발송 ──
    console.log('\n── TEST 1: overlay 이미지 포함 발송 ──');
    console.log(`  수신번호: ${TEST_PHONE}`);

    const APP_BASE_URL = config.appBaseUrl;
    const fakeOverlayUrl = `${APP_BASE_URL}/images/wishes/overlay_test.png`;

    try {
        const result1 = await messageProvider.sendSensAlimtalk(TEST_PHONE, {
            name: '테스트소원이',
            score: 85,
            token: 'test-token-001',
            image_url: fakeOverlayUrl
        });

        console.log('\n  📤 SENS 응답 (with image):');
        console.log(`    success:   ${result1.success}`);
        console.log(`    status:    ${result1.status}`);
        console.log(`    messageId: ${result1.messageId}`);
        console.log(`    requestId: ${result1.requestId || 'N/A'}`);
        console.log(`    channel:   ${result1.channel || 'N/A'}`);
        console.log(`    hasImage:  true`);
        console.log(`    imageUrl:  ${fakeOverlayUrl}`);

        if (result1.success) {
            console.log('\n  ✅ TEST 1 PASSED: 이미지 포함 알림톡 발송 성공');
        } else {
            console.log(`\n  ⚠️ TEST 1: 발송 실패 (reason: ${result1.reason || result1.statusCode || 'unknown'})`);
        }
    } catch (err) {
        console.error(`\n  ❌ TEST 1 ERROR: ${err.message}`);
    }

    // ── TEST 2: image_url=null (overlay 실패 시뮬레이션) ──
    console.log('\n── TEST 2: overlay 실패 시뮬레이션 (텍스트만) ──');

    try {
        const result2 = await messageProvider.sendSensAlimtalk(TEST_PHONE, {
            name: '테스트소원이',
            score: 85,
            token: 'test-token-002',
            image_url: null  // overlay 실패
        });

        console.log('\n  📤 SENS 응답 (no image):');
        console.log(`    success:   ${result2.success}`);
        console.log(`    status:    ${result2.status}`);
        console.log(`    messageId: ${result2.messageId}`);
        console.log(`    requestId: ${result2.requestId || 'N/A'}`);
        console.log(`    channel:   ${result2.channel || 'N/A'}`);
        console.log(`    hasImage:  false`);

        if (result2.success) {
            console.log('\n  ✅ TEST 2 PASSED: 텍스트 알림톡 발송 성공 (overlay 실패해도 차단 안 됨)');
        } else {
            console.log(`\n  ⚠️ TEST 2: 발송 실패 (reason: ${result2.reason || result2.statusCode || 'unknown'})`);
        }
    } catch (err) {
        console.error(`\n  ❌ TEST 2 ERROR: ${err.message}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log(' 테스트 완료');
    console.log(' 카카오톡에서 수신 확인 → 이미지 썸네일 노출 여부 체크');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
})();
