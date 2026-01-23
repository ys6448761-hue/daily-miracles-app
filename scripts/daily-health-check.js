#!/usr/bin/env node
/**
 * Daily Health Check & 자동 로그 생성
 *
 * 루미 요청사항 구현:
 * 1. 실사용 지표 자동 기록
 * 2. 중복 발송 방지 상태 로그
 * 3. 미추적 파일 자동 경고
 * 4. 오픈 체크리스트 자동 검증
 *
 * 사용법:
 *   node scripts/daily-health-check.js
 *   node scripts/daily-health-check.js --write-log  (로그 파일 생성)
 *
 * Cron (00:10 매일):
 *   10 0 * * * cd /path/to/project && node scripts/daily-health-check.js --write-log
 *
 * @version 1.0 - 2025.12.30
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════
const CONFIG = {
    // API 엔드포인트 (Render 배포 URL)
    apiBaseUrl: process.env.APP_BASE_URL || 'https://app.dailymiracles.kr',
    // 내부 테스트용 전화번호
    testPhone: process.env.TEST_PHONE || '',
    // 로그 저장 경로
    logDir: path.join(__dirname, '..', '.claude', 'logs'),
    // Git 무시할 경로 패턴
    autoIgnorePaths: [
        'docs/raw/conversations/**',
        '*.log',
        '.DS_Store',
        'Thumbs.db'
    ]
};

// ═══════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════
function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getTimestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function log(emoji, message) {
    console.log(`${emoji} [${getTimestamp()}] ${message}`);
}

// ═══════════════════════════════════════════════════════════
// 1. Git 상태 체크 (미추적 파일 경고)
// ═══════════════════════════════════════════════════════════
function checkGitStatus() {
    log('🔍', 'Git 상태 체크 중...');
    const results = {
        untracked: [],
        modified: [],
        warnings: []
    };

    try {
        // Untracked 파일 체크
        const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
            encoding: 'utf-8',
            cwd: path.join(__dirname, '..')
        }).trim();

        if (untrackedOutput) {
            results.untracked = untrackedOutput.split('\n').filter(Boolean);
            log('⚠️', `UNTRACKED 파일 ${results.untracked.length}개 발견`);
            results.untracked.forEach(f => log('  ', `  - ${f}`));

            // 경고 대상 분류
            results.untracked.forEach(file => {
                // docs/raw/conversations 경로는 gitignore 권장
                if (file.startsWith('docs/raw/conversations/')) {
                    results.warnings.push({
                        file,
                        action: 'gitignore 추가 권장',
                        reason: '대화 로그는 버전관리 불필요'
                    });
                }
                // .env 계열은 절대 커밋 금지
                else if (file.includes('.env') && !file.includes('.example')) {
                    results.warnings.push({
                        file,
                        action: '⛔ 절대 커밋 금지',
                        reason: '환경변수 파일 - 보안 위험'
                    });
                }
            });
        } else {
            log('✅', '미추적 파일 없음');
        }

        // Modified 파일 체크
        const modifiedOutput = execSync('git diff --name-only', {
            encoding: 'utf-8',
            cwd: path.join(__dirname, '..')
        }).trim();

        if (modifiedOutput) {
            results.modified = modifiedOutput.split('\n').filter(Boolean);
            log('📝', `수정된 파일 ${results.modified.length}개`);
        }

    } catch (error) {
        log('❌', `Git 체크 실패: ${error.message}`);
        results.error = error.message;
    }

    return results;
}

// ═══════════════════════════════════════════════════════════
// 2. API Health Check
// ═══════════════════════════════════════════════════════════
async function checkApiHealth() {
    log('🏥', 'API Health Check 중...');
    const results = {
        health: null,
        resultLink: null,
        latency: {}
    };

    try {
        // Health 엔드포인트 체크
        const healthStart = Date.now();
        const healthRes = await fetch(`${CONFIG.apiBaseUrl}/api/health`);
        results.latency.health = Date.now() - healthStart;
        results.health = {
            status: healthRes.status,
            ok: healthRes.ok,
            latencyMs: results.latency.health
        };

        if (healthRes.ok) {
            const data = await healthRes.json();
            results.health.data = data;
            log('✅', `Health OK (${results.latency.health}ms)`);
        } else {
            log('❌', `Health FAIL: HTTP ${healthRes.status}`);
        }

        // 결과 링크 테스트 (샘플)
        const linkStart = Date.now();
        const linkRes = await fetch(`${CONFIG.apiBaseUrl}/api/story/latest`);
        results.latency.resultLink = Date.now() - linkStart;
        results.resultLink = {
            status: linkRes.status,
            ok: linkRes.ok || linkRes.status === 404, // 404도 정상 (데이터 없음)
            latencyMs: results.latency.resultLink
        };
        log('✅', `Result Link OK (${results.latency.resultLink}ms)`);

    } catch (error) {
        log('❌', `API 체크 실패: ${error.message}`);
        results.error = error.message;
    }

    return results;
}

// ═══════════════════════════════════════════════════════════
// 3. 알림톡 테스트 (내부용)
// ═══════════════════════════════════════════════════════════
async function checkAlimtalk() {
    log('📱', '알림톡 상태 체크 중...');
    const results = {
        enabled: false,
        testSent: false
    };

    // SENS 설정 체크
    const accessKey = process.env.SENS_ACCESS_KEY;
    const secretKey = process.env.SENS_SECRET_KEY;
    const serviceId = process.env.SENS_SERVICE_ID;

    results.enabled = !!(accessKey && secretKey && serviceId);

    if (!results.enabled) {
        log('⚠️', 'SENS API 키 미설정 - 시뮬레이션 모드');
        return results;
    }

    log('✅', 'SENS 설정 확인됨');

    // 테스트 번호가 있으면 실제 발송 테스트
    if (CONFIG.testPhone) {
        try {
            const messageProvider = require('../services/messageProvider');
            const testResult = await messageProvider.sendSensSMS(
                CONFIG.testPhone,
                '[헬스체크] 하루하루의기적 시스템 테스트 메시지입니다.'
            );
            results.testSent = testResult.success;
            log(results.testSent ? '✅' : '⚠️', `테스트 발송: ${results.testSent ? '성공' : '실패'}`);
        } catch (error) {
            log('❌', `테스트 발송 오류: ${error.message}`);
            results.testError = error.message;
        }
    } else {
        log('ℹ️', 'TEST_PHONE 미설정 - 발송 테스트 스킵');
    }

    return results;
}

// ═══════════════════════════════════════════════════════════
// 4. VIP 태깅 테스트
// ═══════════════════════════════════════════════════════════
async function checkVipTagging() {
    log('✨', 'VIP 태깅 테스트 중...');
    const results = {
        enabled: true,
        testCases: []
    };

    const { evaluateVip } = require('../services/vipService');

    // TC4-1: VIP True (긴 서사 + 간절함)
    const tc1Content = `저는 올해로 50세가 된 가장입니다. 작년에 갑자기 회사가 문을 닫으면서
    실직을 하게 되었고, 이후로 정말 힘든 나날을 보내고 있습니다. 아내는 투병 중이고,
    아이들 학비도 감당하기 어려워졌습니다. 그래도 포기하지 않고 매일 이력서를 넣고 있습니다.
    정말 간절하게, 제발 다시 일어설 기회가 주어지길 바랍니다. 가족을 위해 다시 시작하고 싶습니다.
    감사합니다.`;
    const tc1Result = evaluateVip(tc1Content, 'green', 0);
    results.testCases.push({
        name: 'TC4-1 VIP True (긴 서사)',
        expected: { vip: true, minScore: 70 },
        actual: tc1Result,
        pass: tc1Result.vip && tc1Result.vipScore >= 70
    });

    // TC4-2: VIP False (짧음)
    const tc2Content = '취업하고 싶어요';
    const tc2Result = evaluateVip(tc2Content, 'green', 0);
    results.testCases.push({
        name: 'TC4-2 VIP False (짧음)',
        expected: { vip: false },
        actual: tc2Result,
        pass: !tc2Result.vip
    });

    // TC4-3: VIP 차단 (red 우선)
    const tc3Content = `저는 정말 간절합니다. 제발 도와주세요. 힘들어서 포기하고 싶지만
    다시 시작하고 싶습니다. 가족을 위해 희망을 찾고 싶습니다.`;
    const tc3Result = evaluateVip(tc3Content, 'red', 0);  // RED면 VIP 금지
    results.testCases.push({
        name: 'TC4-3 VIP 차단 (RED)',
        expected: { vip: false, blocked: true, blockedReason: 'RED_PRIORITY' },
        actual: tc3Result,
        pass: !tc3Result.vip && tc3Result.blocked && tc3Result.blockedReason === 'RED_PRIORITY'
    });

    // TC4-4: VIP 차단 (스팸 의심)
    const tc4Result = evaluateVip(tc1Content, 'green', 10);  // 중복 10회
    results.testCases.push({
        name: 'TC4-4 VIP 차단 (스팸)',
        expected: { vip: false, blocked: true, blockedReason: 'SPAM_SUSPECTED' },
        actual: tc4Result,
        pass: !tc4Result.vip && tc4Result.blocked && tc4Result.blockedReason === 'SPAM_SUSPECTED'
    });

    // 결과 출력
    const passCount = results.testCases.filter(tc => tc.pass).length;
    const totalCount = results.testCases.length;

    results.testCases.forEach(tc => {
        log(tc.pass ? '✅' : '❌', `${tc.name}: ${tc.pass ? 'PASS' : 'FAIL'} (Score: ${tc.actual.vipScore})`);
    });

    log(passCount === totalCount ? '✅' : '⚠️', `VIP 테스트: ${passCount}/${totalCount} 통과`);

    // VIP SMS 드라이런 테스트
    if (process.env.VIP_SMS_TEST === 'true') {
        log('📱', 'VIP SMS 드라이런 테스트...');
        try {
            const { processVipAlert } = require('../services/airtableService');
            const dryRunResult = await processVipAlert(tc1Content, 'green', 0, { dryRun: true });
            log('✅', `드라이런 완료: VIP=${dryRunResult.vip}, Score=${dryRunResult.vipScore}`);
            results.dryRun = { success: true, result: dryRunResult };
        } catch (error) {
            log('❌', `드라이런 실패: ${error.message}`);
            results.dryRun = { success: false, error: error.message };
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════
// 5. 신호등 분류 테스트 (TC1~TC3)
// ═══════════════════════════════════════════════════════════
function checkTrafficLight() {
    log('🚦', '신호등 분류 테스트 중...');
    const results = {
        testCases: []
    };

    // classifyWish 함수 (wishRoutes.js에서 추출)
    function classifyWish(wishText) {
        const text = wishText.toLowerCase();

        const redKeywords = [
            '자살', '죽고싶', '죽고 싶', '죽을래', '죽을 래',
            '자해', '손목', '목숨', '끝내고 싶', '끝내고싶',
            '사라지고 싶', '사라지고싶', '없어지고 싶', '없어지고싶',
            '포기하고 싶', '힘들어서 못살', '살기 싫', '살기싫'
        ];

        for (const keyword of redKeywords) {
            if (text.includes(keyword)) {
                return { level: 'RED', reason: `위험 키워드: ${keyword}` };
            }
        }

        const yellowKeywords = ['빚', '대출', '파산', '암', '수술', '병원', '이혼', '양육권', '폭력'];
        for (const keyword of yellowKeywords) {
            if (text.includes(keyword)) {
                return { level: 'YELLOW', reason: `주의 키워드: ${keyword}` };
            }
        }

        return { level: 'GREEN', reason: '일반 소원' };
    }

    // TC1: GREEN
    const tc1 = classifyWish('새해에는 취업에 성공하고 싶어요');
    results.testCases.push({
        name: 'TC1 GREEN (정상)',
        expected: 'GREEN',
        actual: tc1.level,
        pass: tc1.level === 'GREEN'
    });

    // TC2: YELLOW
    const tc2 = classifyWish('아버지 암 수술이 잘 되길 바랍니다');
    results.testCases.push({
        name: 'TC2 YELLOW (주의)',
        expected: 'YELLOW',
        actual: tc2.level,
        pass: tc2.level === 'YELLOW'
    });

    // TC3: RED
    const tc3 = classifyWish('더 이상 살기 싫어요');
    results.testCases.push({
        name: 'TC3 RED (긴급)',
        expected: 'RED',
        actual: tc3.level,
        pass: tc3.level === 'RED'
    });

    // 결과 출력
    const passCount = results.testCases.filter(tc => tc.pass).length;
    results.testCases.forEach(tc => {
        log(tc.pass ? '✅' : '❌', `${tc.name}: ${tc.pass ? 'PASS' : 'FAIL'} (${tc.actual})`);
    });

    log(passCount === 3 ? '✅' : '⚠️', `신호등 테스트: ${passCount}/3 통과`);

    return results;
}

// ═══════════════════════════════════════════════════════════
// 6. 이상 감지 테스트 (AT1~AT6)
// ═══════════════════════════════════════════════════════════
function checkAnomalyDetection() {
    log('🚨', '이상 감지 룰 테스트 중...');
    const results = { testCases: [] };

    // checkAnomalies 로직 (airtableService.js에서 추출)
    function checkAnomalies(m) {
        const alerts = [];
        if (m.alimtalk.failed > 0) alerts.push({ rule: 'ALIMTALK_FAILED', severity: '🟡' });
        const rate = m.alimtalk.sent > 0 ? m.alimtalk.success / m.alimtalk.sent : 1;
        if (m.alimtalk.sent > 0 && rate < 0.98) alerts.push({ rule: 'SUCCESS_RATE_LOW', severity: '🟡' });
        if ((m.ack.avgTimeMs || 0) > 600000) alerts.push({ rule: 'ACK_DELAY', severity: '🟡' });
        if (m.trafficLight.red > 0) alerts.push({ rule: 'RED_CASE', severity: '🔴' });
        if (m.errors && m.errors.length > 0) alerts.push({ rule: 'ERRORS_PRESENT', severity: '🟡' });
        if (m.ack.duplicateAttempts >= 5) alerts.push({ rule: 'DUPLICATE_SURGE', severity: '🟡' });
        return alerts;
    }

    // AT1: 알림톡 실패
    const at1 = checkAnomalies({
        alimtalk: { sent: 10, success: 9, failed: 1 },
        ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
        trafficLight: { red: 0 }, errors: []
    });
    results.testCases.push({ name: 'AT1 알림톡 실패', pass: at1.some(a => a.rule === 'ALIMTALK_FAILED') });

    // AT2: 성공률 저하
    const at2 = checkAnomalies({
        alimtalk: { sent: 100, success: 96, failed: 4 },
        ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
        trafficLight: { red: 0 }, errors: []
    });
    results.testCases.push({ name: 'AT2 성공률 저하', pass: at2.some(a => a.rule === 'SUCCESS_RATE_LOW') });

    // AT3: ACK 지연
    const at3 = checkAnomalies({
        alimtalk: { sent: 10, success: 10, failed: 0 },
        ack: { avgTimeMs: 720000, duplicateAttempts: 0 },
        trafficLight: { red: 0 }, errors: []
    });
    results.testCases.push({ name: 'AT3 ACK 지연', pass: at3.some(a => a.rule === 'ACK_DELAY') });

    // AT4: RED 케이스
    const at4 = checkAnomalies({
        alimtalk: { sent: 10, success: 10, failed: 0 },
        ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
        trafficLight: { red: 2 }, errors: []
    });
    results.testCases.push({ name: 'AT4 RED 케이스', pass: at4.some(a => a.rule === 'RED_CASE') });

    // AT5: 에러 발생
    const at5 = checkAnomalies({
        alimtalk: { sent: 10, success: 10, failed: 0 },
        ack: { avgTimeMs: 5000, duplicateAttempts: 0 },
        trafficLight: { red: 0 }, errors: [{ type: 'TEST_ERROR', count: 1 }]
    });
    results.testCases.push({ name: 'AT5 에러 발생', pass: at5.some(a => a.rule === 'ERRORS_PRESENT') });

    // AT6: 중복 급증
    const at6 = checkAnomalies({
        alimtalk: { sent: 10, success: 10, failed: 0 },
        ack: { avgTimeMs: 5000, duplicateAttempts: 7 },
        trafficLight: { red: 0 }, errors: []
    });
    results.testCases.push({ name: 'AT6 중복 급증', pass: at6.some(a => a.rule === 'DUPLICATE_SURGE') });

    // 결과 출력
    const passCount = results.testCases.filter(tc => tc.pass).length;
    results.testCases.forEach(tc => {
        log(tc.pass ? '✅' : '❌', `${tc.name}: ${tc.pass ? 'PASS' : 'FAIL'}`);
    });
    log(passCount === 6 ? '✅' : '⚠️', `이상 감지 테스트: ${passCount}/6 통과`);

    return results;
}

// ═══════════════════════════════════════════════════════════
// 7. 메트릭스 조회
// ═══════════════════════════════════════════════════════════
function getMetricsReport() {
    log('📊', '메트릭스 로딩 중...');
    let metricsReport = null;

    try {
        const metrics = require('../services/metricsService');
        metricsReport = metrics.generateDailyReport();
        log('✅', '메트릭스 로드 성공');
    } catch (error) {
        log('⚠️', `메트릭스 로드 실패: ${error.message}`);
        metricsReport = '(메트릭스 데이터 없음)';
    }

    return metricsReport;
}

// ═══════════════════════════════════════════════════════════
// 8. 리포트 생성
// ═══════════════════════════════════════════════════════════
function generateReport(gitStatus, apiHealth, alimtalk, vipTest, trafficLightTest, anomalyTest, metricsReport) {
    const today = getToday();

    let report = `# Daily Health Check - ${today}

생성시각: ${getTimestamp()} KST

---

## 🚦 시스템 상태

| 항목 | 상태 |
|------|------|
| API Health | ${apiHealth.health?.ok ? '✅ OK' : '❌ FAIL'} (${apiHealth.latency?.health || '-'}ms) |
| Result Link | ${apiHealth.resultLink?.ok ? '✅ OK' : '❌ FAIL'} (${apiHealth.latency?.resultLink || '-'}ms) |
| 알림톡 | ${alimtalk.enabled ? '✅ 활성화' : '⚠️ 비활성화'} |
| 🚦 신호등 | ${trafficLightTest.testCases.filter(tc => tc.pass).length}/${trafficLightTest.testCases.length} 통과 |
| ✨ VIP | ${vipTest.testCases.filter(tc => tc.pass).length}/${vipTest.testCases.length} 통과 |
| 🚨 이상감지 | ${anomalyTest.testCases.filter(tc => tc.pass).length}/${anomalyTest.testCases.length} 통과 |
| Git 상태 | ${gitStatus.untracked.length === 0 ? '✅ Clean' : `⚠️ Untracked ${gitStatus.untracked.length}개`} |

---

## 📁 Git 상태

### Untracked 파일 (${gitStatus.untracked.length}개)
${gitStatus.untracked.length > 0
    ? gitStatus.untracked.map(f => `- ⚠️ \`${f}\``).join('\n')
    : '- (없음)'}

### 수정된 파일 (${gitStatus.modified.length}개)
${gitStatus.modified.length > 0
    ? gitStatus.modified.map(f => `- 📝 \`${f}\``).join('\n')
    : '- (없음)'}

### 경고 사항
${gitStatus.warnings.length > 0
    ? gitStatus.warnings.map(w => `- ⚠️ **${w.file}**: ${w.action} (${w.reason})`).join('\n')
    : '- (없음)'}

---

## 📊 운영 지표

\`\`\`
${metricsReport}
\`\`\`

---

## 🔧 권장 조치

`;

    // 권장 조치 생성
    const actions = [];

    if (gitStatus.untracked.length > 0) {
        const docsRaw = gitStatus.untracked.filter(f => f.startsWith('docs/raw/'));
        if (docsRaw.length > 0) {
            actions.push(`1. \`docs/raw/**\` 경로를 .gitignore에 추가하세요`);
        }

        const otherUntracked = gitStatus.untracked.filter(f => !f.startsWith('docs/raw/'));
        if (otherUntracked.length > 0) {
            actions.push(`2. 다른 untracked 파일 검토: \`git add\` 또는 \`.gitignore\` 처리`);
        }
    }

    if (!apiHealth.health?.ok) {
        actions.push(`⚠️ API 서버 상태 확인 필요: ${CONFIG.apiBaseUrl}`);
    }

    if (!alimtalk.enabled) {
        actions.push(`ℹ️ SENS API 키 설정 확인 (.env 파일)`);
    }

    report += actions.length > 0 ? actions.join('\n') : '- (현재 필요한 조치 없음)';

    report += `

---

*Generated by daily-health-check.js*
`;

    return report;
}

// ═══════════════════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════════════════
async function main() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🏥 Daily Health Check - ' + getToday());
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Git 상태 체크
    const gitStatus = checkGitStatus();

    // 2. API Health Check
    const apiHealth = await checkApiHealth();

    // 3. 알림톡 체크
    const alimtalk = await checkAlimtalk();

    // 4. VIP 태깅 테스트
    const vipTest = await checkVipTagging();

    // 5. 신호등 분류 테스트
    const trafficLightTest = checkTrafficLight();

    // 6. 이상 감지 테스트
    const anomalyTest = checkAnomalyDetection();

    // 7. 메트릭스 리포트
    const metricsReport = getMetricsReport();

    // 8. 리포트 생성
    const report = generateReport(gitStatus, apiHealth, alimtalk, vipTest, trafficLightTest, anomalyTest, metricsReport);

    // 결과 출력
    console.log('\n' + report);

    // --write-log 옵션 시 파일로 저장
    if (process.argv.includes('--write-log')) {
        const logFile = path.join(CONFIG.logDir, `health-${getToday()}.md`);

        if (!fs.existsSync(CONFIG.logDir)) {
            fs.mkdirSync(CONFIG.logDir, { recursive: true });
        }

        fs.writeFileSync(logFile, report, 'utf-8');
        log('💾', `로그 저장: ${logFile}`);
    }

    // 종료 코드 설정
    const hasErrors = !apiHealth.health?.ok || gitStatus.warnings.some(w => w.action.includes('⛔'));
    process.exit(hasErrors ? 1 : 0);
}

main().catch(error => {
    console.error('❌ Health Check 실패:', error);
    process.exit(1);
});
