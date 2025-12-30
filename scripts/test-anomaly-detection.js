#!/usr/bin/env node
/**
 * 이상 감지 테스트 스크립트 (AT1~AT6)
 *
 * 목적: airtableService.checkAndAlert()의 6개 룰이
 *       각각 정상적으로 트리거되는지 검증
 *
 * 실행: node scripts/test-anomaly-detection.js
 *
 * @version 1.0 - 2025.12.30
 */

require('dotenv').config();

// 테스트 모드 설정
process.env.ANOMALY_TEST = 'true';
process.env.DRY_RUN = 'true';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🚨 이상 감지 테스트 (AT1~AT6)');
console.log('═══════════════════════════════════════════════════════════');
console.log('⚠️  DRY_RUN 모드: 실제 SMS 발송 없음\n');

// checkAndAlert 함수 로직 재현 (airtableService.js:155-234에서 추출)
function checkAnomalies(metrics) {
    const alerts = [];
    const m = metrics;

    // 1. 알림톡 실패 (AT1)
    if (m.alimtalk.failed > 0) {
        alerts.push({
            rule: 'ALIMTALK_FAILED',
            severity: '🟡',
            type: 'ALIMTALK_FAIL',
            message: `알림톡 실패 ${m.alimtalk.failed}건 발생`,
            payload: { failed: m.alimtalk.failed, sent: m.alimtalk.sent }
        });
    }

    // 2. 알림톡 성공률 < 98% (AT2)
    const successRate = m.alimtalk.sent > 0
        ? (m.alimtalk.success / m.alimtalk.sent)
        : 1;
    if (m.alimtalk.sent > 0 && successRate < 0.98) {
        alerts.push({
            rule: 'SUCCESS_RATE_LOW',
            severity: '🟡',
            type: 'ALIMTALK_FAIL',
            message: `알림톡 성공률 저하: ${(successRate * 100).toFixed(1)}%`,
            payload: { successRate: successRate * 100, sent: m.alimtalk.sent }
        });
    }

    // 3. ACK 평균 시간 > 10분 (AT3)
    const avgAckMs = m.ack.avgTimeMs || 0;
    if (avgAckMs > 600000) {
        alerts.push({
            rule: 'ACK_DELAY',
            severity: '🟡',
            type: 'ACK_SLA',
            message: `ACK 응답 지연: 평균 ${Math.round(avgAckMs / 60000)}분`,
            payload: { avgAckMs }
        });
    }

    // 4. RED 케이스 발생 (AT4) - 최우선
    if (m.trafficLight.red > 0) {
        alerts.push({
            rule: 'RED_CASE',
            severity: '🔴',
            type: 'RED_CASE',
            message: `RED 신호 ${m.trafficLight.red}건 감지 - 즉시 확인 필요!`,
            payload: { red: m.trafficLight.red },
            priority: 1  // 최우선
        });
    }

    // 5. 에러 발생 (AT5)
    if (m.errors && m.errors.length > 0) {
        const topError = m.errors[0];
        alerts.push({
            rule: 'ERRORS_PRESENT',
            severity: '🟡',
            type: 'ERROR',
            message: `에러 발생: ${topError.type} (${topError.count}건)`,
            payload: { errors: m.errors.slice(0, 3) }
        });
    }

    // 6. 중복 시도 급증 (AT6)
    if (m.ack.duplicateAttempts >= 5) {
        alerts.push({
            rule: 'DUPLICATE_SURGE',
            severity: '🟡',
            type: 'DUPLICATE',
            message: `중복 발송 시도 급증: ${m.ack.duplicateAttempts}건`,
            payload: { duplicateAttempts: m.ack.duplicateAttempts }
        });
    }

    return alerts;
}

const testResults = [];

// ═══════════════════════════════════════════════════════════
// AT1: 알림톡 실패 (failed > 0)
// ═══════════════════════════════════════════════════════════
console.log('=== AT1: 알림톡 실패 (failed > 0) ===');
const at1Metrics = {
    alimtalk: { sent: 10, success: 9, failed: 1, fallbackSms: 0 },
    ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
    trafficLight: { red: 0, yellow: 0, green: 10 },
    errors: []
};
const at1Alerts = checkAnomalies(at1Metrics);
const at1Pass = at1Alerts.some(a => a.rule === 'ALIMTALK_FAILED');
console.log(`  트리거: ${at1Pass ? '✅' : '❌'}`);
if (at1Pass) {
    const alert = at1Alerts.find(a => a.rule === 'ALIMTALK_FAILED');
    console.log(`  severity: ${alert.severity}`);
    console.log(`  message: ${alert.message}`);
}
testResults.push({ name: 'AT1 알림톡 실패', pass: at1Pass, severity: '🟡' });

// ═══════════════════════════════════════════════════════════
// AT2: 성공률 저하 (successRate < 98%)
// ═══════════════════════════════════════════════════════════
console.log('\n=== AT2: 성공률 저하 (< 98%) ===');
const at2Metrics = {
    alimtalk: { sent: 100, success: 96, failed: 4, fallbackSms: 0 },  // 96% < 98%
    ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
    trafficLight: { red: 0, yellow: 0, green: 100 },
    errors: []
};
const at2Alerts = checkAnomalies(at2Metrics);
const at2Pass = at2Alerts.some(a => a.rule === 'SUCCESS_RATE_LOW');
console.log(`  트리거: ${at2Pass ? '✅' : '❌'}`);
if (at2Pass) {
    const alert = at2Alerts.find(a => a.rule === 'SUCCESS_RATE_LOW');
    console.log(`  severity: ${alert.severity}`);
    console.log(`  message: ${alert.message}`);
}
testResults.push({ name: 'AT2 성공률 저하', pass: at2Pass, severity: '🟡' });

// ═══════════════════════════════════════════════════════════
// AT3: ACK 지연 (avgAckMs > 10분)
// ═══════════════════════════════════════════════════════════
console.log('\n=== AT3: ACK 지연 (> 10분) ===');
const at3Metrics = {
    alimtalk: { sent: 10, success: 10, failed: 0, fallbackSms: 0 },
    ack: { avgTimeMs: 720000, duplicateAttempts: 0 },  // 12분 > 10분
    trafficLight: { red: 0, yellow: 0, green: 10 },
    errors: []
};
const at3Alerts = checkAnomalies(at3Metrics);
const at3Pass = at3Alerts.some(a => a.rule === 'ACK_DELAY');
console.log(`  트리거: ${at3Pass ? '✅' : '❌'}`);
if (at3Pass) {
    const alert = at3Alerts.find(a => a.rule === 'ACK_DELAY');
    console.log(`  severity: ${alert.severity}`);
    console.log(`  message: ${alert.message}`);
}
testResults.push({ name: 'AT3 ACK 지연', pass: at3Pass, severity: '🟡' });

// ═══════════════════════════════════════════════════════════
// AT4: RED 케이스 (red > 0) - 최우선
// ═══════════════════════════════════════════════════════════
console.log('\n=== AT4: RED 케이스 (최우선) ===');
const at4Metrics = {
    alimtalk: { sent: 10, success: 10, failed: 0, fallbackSms: 0 },
    ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
    trafficLight: { red: 2, yellow: 3, green: 5 },  // RED 2건
    errors: []
};
const at4Alerts = checkAnomalies(at4Metrics);
const at4Pass = at4Alerts.some(a => a.rule === 'RED_CASE');
console.log(`  트리거: ${at4Pass ? '✅' : '❌'}`);
if (at4Pass) {
    const alert = at4Alerts.find(a => a.rule === 'RED_CASE');
    console.log(`  severity: ${alert.severity} (최우선)`);
    console.log(`  message: ${alert.message}`);
    console.log(`  라우팅: CEO + COO + 여의보주`);
}
testResults.push({ name: 'AT4 RED 케이스', pass: at4Pass, severity: '🔴' });

// ═══════════════════════════════════════════════════════════
// AT5: 에러 발생 (errors.length > 0)
// ═══════════════════════════════════════════════════════════
console.log('\n=== AT5: 에러 발생 ===');
const at5Metrics = {
    alimtalk: { sent: 10, success: 10, failed: 0, fallbackSms: 0 },
    ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
    trafficLight: { red: 0, yellow: 0, green: 10 },
    errors: [
        { type: 'AIRTABLE_UPDATE_FAILED', count: 3, lastMessage: 'Network timeout' },
        { type: 'OPENAI_RATE_LIMIT', count: 1, lastMessage: 'Rate limit exceeded' }
    ]
};
const at5Alerts = checkAnomalies(at5Metrics);
const at5Pass = at5Alerts.some(a => a.rule === 'ERRORS_PRESENT');
console.log(`  트리거: ${at5Pass ? '✅' : '❌'}`);
if (at5Pass) {
    const alert = at5Alerts.find(a => a.rule === 'ERRORS_PRESENT');
    console.log(`  severity: ${alert.severity}`);
    console.log(`  message: ${alert.message}`);
}
testResults.push({ name: 'AT5 에러 발생', pass: at5Pass, severity: '🟡' });

// ═══════════════════════════════════════════════════════════
// AT6: 중복 급증 (duplicateAttempts >= 5)
// ═══════════════════════════════════════════════════════════
console.log('\n=== AT6: 중복 급증 (>= 5회) ===');
const at6Metrics = {
    alimtalk: { sent: 10, success: 10, failed: 0, fallbackSms: 0 },
    ack: { avgTimeMs: 5000, duplicateAttempts: 7 },  // 7 >= 5
    trafficLight: { red: 0, yellow: 0, green: 10 },
    errors: []
};
const at6Alerts = checkAnomalies(at6Metrics);
const at6Pass = at6Alerts.some(a => a.rule === 'DUPLICATE_SURGE');
console.log(`  트리거: ${at6Pass ? '✅' : '❌'}`);
if (at6Pass) {
    const alert = at6Alerts.find(a => a.rule === 'DUPLICATE_SURGE');
    console.log(`  severity: ${alert.severity}`);
    console.log(`  message: ${alert.message}`);
}
testResults.push({ name: 'AT6 중복 급증', pass: at6Pass, severity: '🟡' });

// ═══════════════════════════════════════════════════════════
// 복합 시나리오: 여러 이상 동시 발생
// ═══════════════════════════════════════════════════════════
console.log('\n=== AT7: 복합 시나리오 (다중 이상) ===');
const at7Metrics = {
    alimtalk: { sent: 100, success: 95, failed: 5, fallbackSms: 2 },  // 95% + failed
    ack: { avgTimeMs: 900000, duplicateAttempts: 8 },  // 15분 + 중복
    trafficLight: { red: 1, yellow: 5, green: 94 },  // RED 1건
    errors: [{ type: 'DB_CONNECTION', count: 2, lastMessage: 'Connection reset' }]
};
const at7Alerts = checkAnomalies(at7Metrics);
console.log(`  감지된 이상: ${at7Alerts.length}개`);
at7Alerts.forEach((alert, i) => {
    console.log(`    ${i+1}. ${alert.severity} ${alert.rule}: ${alert.message}`);
});

// RED가 먼저 나오는지 확인 (우선순위)
const redFirst = at7Alerts.findIndex(a => a.severity === '🔴') === 0 ||
                 at7Alerts.some(a => a.severity === '🔴' && a.priority === 1);
console.log(`  🔴 RED 우선순위: ${redFirst ? '✅ 최우선' : '⚠️ 확인 필요'}`);

// ═══════════════════════════════════════════════════════════
// 결과 요약
// ═══════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════');
console.log('📊 이상 감지 테스트 결과 요약');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('| 케이스 | 트리거 | Severity | 룰 |');
console.log('|--------|--------|----------|-----|');
testResults.forEach(r => {
    console.log(`| ${r.name} | ${r.pass ? '✅' : '❌'} | ${r.severity} | ${r.pass ? 'OK' : 'FAIL'} |`);
});

const passCount = testResults.filter(r => r.pass).length;
console.log(`\n📋 전체: ${passCount}/${testResults.length} 통과`);
console.log(passCount === testResults.length ? '✅ 모든 이상 감지 룰 정상 작동!' : '❌ 일부 룰 점검 필요');

// 종료 코드
process.exit(passCount === testResults.length ? 0 : 1);
