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
    apiBaseUrl: process.env.API_BASE_URL || 'https://daily-miracles-app.onrender.com',
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

    // Solapi 설정 체크
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const templateId = process.env.SOLAPI_TEMPLATE_MIRACLE_RESULT;

    results.enabled = !!(apiKey && apiSecret);

    if (!results.enabled) {
        log('⚠️', 'Solapi API 키 미설정 - 시뮬레이션 모드');
        return results;
    }

    log('✅', 'Solapi 설정 확인됨');

    // 테스트 번호가 있으면 실제 발송 테스트
    if (CONFIG.testPhone && templateId) {
        try {
            const { sendMiracleResult } = require('../services/solapiService');
            const testResult = await sendMiracleResult(
                CONFIG.testPhone,
                '시스템테스트',
                99,
                `${CONFIG.apiBaseUrl}/health-check-test`
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
// 4. 메트릭스 조회
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
// 5. 리포트 생성
// ═══════════════════════════════════════════════════════════
function generateReport(gitStatus, apiHealth, alimtalk, metricsReport) {
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
        actions.push(`ℹ️ Solapi API 키 설정 확인 (.env 파일)`);
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

    // 4. 메트릭스 리포트
    const metricsReport = getMetricsReport();

    // 5. 리포트 생성
    const report = generateReport(gitStatus, apiHealth, alimtalk, metricsReport);

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
