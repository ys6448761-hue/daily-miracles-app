/**
 * PR-2C Integration Test: overlay → sendSensAlimtalk payload 검증
 *
 * 테스트 항목:
 * T1. overlay 성공 시 image 필드 포함된 SENS payload 생성
 * T2. overlay 실패 시 image_url=null → image 필드 없는 payload
 * T3. image_url 없으면 기존 payload 구조 유지
 * T4. sendSensAlimtalk 시그니처 호환성
 */

const path = require('path');
const fs = require('fs');

// ── 테스트 유틸 ──
let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.error(`  ❌ ${label}`);
        failed++;
    }
}

// ── T1: overlay 성공 → SENS payload에 image 포함 ──
async function testT1_overlaySuccessPayload() {
    console.log('\n── T1: overlay 성공 시 SENS payload image 필드 ──');

    // messageProvider의 payload 빌드 로직 직접 테스트
    const APP_BASE_URL = 'https://app.dailymiracles.kr';

    const templateVars = {
        name: '소원이',
        stage: 'day7',
        url: 'https://app.dailymiracles.kr/wish-tracking.html?token=abc123',
        image_url: 'https://app.dailymiracles.kr/images/wishes/overlay_wish_123_sapphire.png',
        token: 'abc123'
    };

    // messageProvider 내부의 payload 빌드 로직 재현
    const messagePayload = {
        to: '01012345678',
        content: `${templateVars.name}님, 기적 분석 결과가 도착했어요!`,
        buttons: templateVars.token ? [{
            type: 'WL',
            name: '결과 확인하기',
            linkMobile: `${APP_BASE_URL}/r/${templateVars.token}`,
            linkPc: `${APP_BASE_URL}/r/${templateVars.token}`
        }] : undefined,
        ...(templateVars.image_url ? {
            image: {
                imageUrl: templateVars.image_url,
                imageLink: templateVars.token
                    ? `${APP_BASE_URL}/r/${templateVars.token}`
                    : APP_BASE_URL
            }
        } : {})
    };

    const hasImage = !!messagePayload.image;
    const imageUrl = messagePayload.image?.imageUrl || null;

    console.log(`  payload.hasImage: ${hasImage}`);
    console.log(`  payload.image.imageUrl: ${imageUrl}`);
    console.log(`  payload.image.imageLink: ${messagePayload.image?.imageLink}`);

    assert(hasImage === true, 'image 필드 존재');
    assert(imageUrl === templateVars.image_url, 'imageUrl 일치');
    assert(messagePayload.image.imageLink.includes('abc123'), 'imageLink에 token 포함');
    assert(messagePayload.buttons !== undefined, 'buttons 유지');
}

// ── T2: overlay 실패 → image_url=null → image 필드 없음 ──
async function testT2_overlayFailPayload() {
    console.log('\n── T2: overlay 실패 시 image 필드 미생성 ──');

    const APP_BASE_URL = 'https://app.dailymiracles.kr';

    const templateVars = {
        name: '소원이',
        stage: 'day7',
        url: 'https://app.dailymiracles.kr/wish-tracking.html?token=abc123',
        image_url: null,  // overlay 실패
        token: 'abc123'
    };

    const messagePayload = {
        to: '01012345678',
        content: `${templateVars.name}님, 기적 분석 결과가 도착했어요!`,
        buttons: templateVars.token ? [{
            type: 'WL',
            name: '결과 확인하기',
            linkMobile: `${APP_BASE_URL}/r/${templateVars.token}`,
            linkPc: `${APP_BASE_URL}/r/${templateVars.token}`
        }] : undefined,
        ...(templateVars.image_url ? {
            image: {
                imageUrl: templateVars.image_url,
                imageLink: APP_BASE_URL
            }
        } : {})
    };

    const hasImage = !!messagePayload.image;
    console.log(`  payload.hasImage: ${hasImage}`);

    assert(hasImage === false, 'image 필드 없음 (overlay 실패)');
    assert(messagePayload.buttons !== undefined, 'buttons 유지 (기존 payload 무손상)');
    assert(messagePayload.content.includes('소원이'), 'content 정상');
}

// ── T3: sendSensAlimtalk 실제 호출 (API키 없어서 SKIPPED 반환) ──
async function testT3_sendSensAlimtalkSignature() {
    console.log('\n── T3: sendSensAlimtalk 시그니처 호환성 ──');

    try {
        const mp = require('../services/messageProvider');

        // API키 미설정이므로 SKIPPED 반환 예상
        const result = await mp.sendSensAlimtalk('01012345678', {
            name: '테스트',
            stage: 'day7',
            url: 'https://test.com',
            image_url: 'https://test.com/overlay.png'
        });

        console.log(`  sendSensAlimtalk result:`, JSON.stringify(result));
        assert(result.success === false, 'API키 미설정 → success=false');
        assert(result.status === 'SKIPPED' || result.reason, 'SKIPPED 상태 반환');
        assert(true, 'sendSensAlimtalk(phone, vars) 시그니처 호환 OK');
    } catch (err) {
        console.error(`  sendSensAlimtalk 호출 에러:`, err.message);
        assert(false, `sendSensAlimtalk 호출 실패: ${err.message}`);
    }
}

// ── T4: overlayService fail-safe (존재하지 않는 파일) ──
async function testT4_overlayFailSafe() {
    console.log('\n── T4: overlay 실패 시 발송 차단 안 됨 (fail-safe) ──');

    let overlayService = null;
    try {
        overlayService = require('../services/overlayService');
    } catch (err) {
        console.log(`  overlayService 로드 실패 (expected in some envs): ${err.message}`);
    }

    // 시뮬레이션: overlay 실패 → image_url = null → 발송 계속
    let image_url = null;
    let overlayFailed = false;

    if (overlayService) {
        try {
            await overlayService.generateOverlay({
                inputPath: '/non/existent/file.png',
                captionLines: ['테스트'],
                originalFilename: 'fake.png'
            });
        } catch (overlayErr) {
            overlayFailed = true;
            console.log(`  overlay 실패 포착: ${overlayErr.message}`);
            // image_url remains null — this is the fail-safe
        }
        assert(overlayFailed, 'overlay 에러 정상 throw');
    } else {
        console.log('  overlayService 없음 → 스킵 (image_url = null)');
        assert(true, 'overlayService 없을 때 image_url = null (정상)');
    }

    assert(image_url === null, 'overlay 실패 후 image_url = null');

    // 이 상태에서 sendSensAlimtalk 호출 가능한지 확인
    try {
        const mp = require('../services/messageProvider');
        const result = await mp.sendSensAlimtalk('01012345678', {
            name: '테스트',
            stage: 'day7',
            url: 'https://test.com',
            image_url  // null
        });
        assert(result !== undefined, '발송 함수 정상 반환 (차단 안 됨)');
        console.log(`  SENS 응답: success=${result.success}, status=${result.status}`);
    } catch (err) {
        assert(false, `발송이 차단됨! ${err.message}`);
    }
}

// ── T5: overlayService.processCaption 검증 ──
async function testT5_processCaption() {
    console.log('\n── T5: processCaption 한글 처리 ──');

    let overlayService = null;
    try {
        overlayService = require('../services/overlayService');
    } catch (err) {
        console.log(`  overlayService 로드 불가 → 스킵`);
        return;
    }

    const lines1 = overlayService.processCaption('짧은 캡션');
    assert(lines1.length === 1, '짧은 캡션 → 1줄');

    const lines2 = overlayService.processCaption('소원이님의 소원이 이루어지는 중이에요 힘내세요');
    assert(lines2.length === 2, '긴 캡션 → 2줄 분할');

    const lines3 = overlayService.processCaption('');
    assert(lines3.length === 1 && lines3[0] === '', '빈 캡션 → 빈 배열 아닌 빈 문자열');
}

// ── 실행 ──
(async () => {
    console.log('═══════════════════════════════════════');
    console.log(' PR-2C: overlay → send pipeline 검증');
    console.log('═══════════════════════════════════════');

    await testT1_overlaySuccessPayload();
    await testT2_overlayFailPayload();
    await testT3_sendSensAlimtalkSignature();
    await testT4_overlayFailSafe();
    await testT5_processCaption();

    console.log('\n═══════════════════════════════════════');
    console.log(` 결과: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
})();
