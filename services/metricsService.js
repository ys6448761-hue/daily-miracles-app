/**
 * 실사용 지표 수집 서비스
 *
 * 루미 요청사항 구현:
 * 1. 오늘 인입 수 (Wishes Inbox NEW count)
 * 2. 알림톡 성공/실패 수 (success_rate)
 * 3. 🔴/🟡/🟢 분포
 * 4. 평균 ACK 시간(SLA)
 * 5. 장애/에러 Top 3
 * 6. 중복 발송 방지 상태
 *
 * @version 1.0 - 2025.12.30
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── serverless 감지 ──
const IS_SERVERLESS = !!(
    process.env.VERCEL ||
    process.env.NOW_REGION ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
);

// ── persistence 플래그: serverless에서는 파일 쓰기 경로 진입 자체를 차단 ──
const METRICS_PERSIST = !IS_SERVERLESS;

// 메트릭스 저장 경로 (serverless에서는 사용되지 않음)
const METRICS_DIR = METRICS_PERSIST
    ? path.join(__dirname, '..', 'data', 'metrics')
    : path.join(os.tmpdir(), 'daily-miracles', 'metrics');
const DAILY_METRICS_FILE = () => path.join(METRICS_DIR, `metrics-${getToday()}.json`);

// 인메모리 메트릭스 (서버 시작 후 누적)
let todayMetrics = {
    date: getToday(),
    wishes: {
        total: 0,
        new: 0,
        processed: 0,
        wantMessage: 0,      // 7일 메시지 선택 수
        noMessage: 0         // 7일 메시지 미선택 수
    },
    trafficLight: {
        red: 0,
        yellow: 0,
        green: 0
    },
    alimtalk: {
        sent: 0,
        success: 0,
        failed: 0,
        fallbackSms: 0
    },
    ack: {
        eligible: 0,         // ACK 대상 (want_message + contact)
        sent: 0,             // 실제 발송
        avgTimeMs: 0,
        duplicateAttempts: 0,
        totalTimeMs: 0
    },
    vip: {
        total: 0,
        byTrafficLight: {
            green: 0,
            yellow: 0
        },
        avgScore: 0,
        totalScore: 0
    },
    gem: {
        recommended: {},     // gem 추천 분포
        selected: {},        // gem 선택 분포
        changed: 0           // 추천에서 변경한 수
    },
    upgrade: {
        birthdateProvided: 0,   // 최초 접수 시 생년월일 입력 수
        birthdateNotProvided: 0, // 최초 접수 시 생년월일 미입력 수
        upgradeClicked: 0,       // 업그레이드 CTA 클릭 수
        upgradeCompleted: 0      // 업그레이드 완료 (생년월일 저장) 수
    },
    errors: [],
    startedAt: new Date().toISOString()
};

function getToday() {
    return new Date().toISOString().split('T')[0];
}

/**
 * 디렉토리 안전 생성 — METRICS_PERSIST=false면 진입하지 않음
 */
function ensureDir() {
    if (!METRICS_PERSIST) return false;
    try {
        if (!fs.existsSync(METRICS_DIR)) {
            fs.mkdirSync(METRICS_DIR, { recursive: true });
        }
        return true;
    } catch (err) {
        console.warn('[Metrics] 디렉토리 생성 실패 (인메모리 계속):', err.message);
        return false;
    }
}

/**
 * 날짜 변경 체크 및 리셋
 */
function checkDateReset() {
    const today = getToday();
    if (todayMetrics.date !== today) {
        // 이전 날짜 메트릭스 저장
        saveMetrics();
        // 새 날짜로 리셋
        todayMetrics = {
            date: today,
            wishes: { total: 0, new: 0, processed: 0, wantMessage: 0, noMessage: 0 },
            trafficLight: { red: 0, yellow: 0, green: 0 },
            alimtalk: { sent: 0, success: 0, failed: 0, fallbackSms: 0 },
            ack: { eligible: 0, sent: 0, avgTimeMs: 0, duplicateAttempts: 0, totalTimeMs: 0 },
            vip: { total: 0, byTrafficLight: { green: 0, yellow: 0 }, avgScore: 0, totalScore: 0 },
            gem: { recommended: {}, selected: {}, changed: 0 },
            upgrade: { birthdateProvided: 0, birthdateNotProvided: 0, upgradeClicked: 0, upgradeCompleted: 0 },
            errors: [],
            startedAt: new Date().toISOString()
        };
    }
}

/**
 * 메트릭스 파일 저장 (서버리스 환경에서는 skip)
 */
function saveMetrics() {
    // 평균 ACK 시간 계산
    if (todayMetrics.ack.sent > 0) {
        todayMetrics.ack.avgTimeMs = Math.round(todayMetrics.ack.totalTimeMs / todayMetrics.ack.sent);
    }

    // 알림톡 성공률 계산
    todayMetrics.alimtalk.successRate = todayMetrics.alimtalk.sent > 0
        ? ((todayMetrics.alimtalk.success / todayMetrics.alimtalk.sent) * 100).toFixed(1) + '%'
        : 'N/A';

    todayMetrics.savedAt = new Date().toISOString();

    if (!ensureDir()) return; // 서버리스이거나 mkdir 실패 시 인메모리만 유지

    try {
        const filepath = DAILY_METRICS_FILE();
        fs.writeFileSync(filepath, JSON.stringify(todayMetrics, null, 2), 'utf-8');
        console.log(`[Metrics] 저장됨: ${filepath}`);
    } catch (err) {
        console.warn('[Metrics] 파일 저장 실패 (인메모리 유지):', err.message);
    }
}

/**
 * 메트릭스 로드 — persistence 비활성 시 진입 금지
 */
function loadMetrics() {
    if (!METRICS_PERSIST) {
        console.log('[Metrics] serverless 환경 — metrics persistence 비활성화 (인메모리 전용)');
        return;
    }

    if (!ensureDir()) return;

    const filepath = DAILY_METRICS_FILE();
    try {
        if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, 'utf-8');
            const loaded = JSON.parse(content);

            todayMetrics = {
                ...loaded,
                wishes: {
                    total: 0, new: 0, processed: 0, wantMessage: 0, noMessage: 0,
                    ...loaded.wishes
                },
                ack: {
                    eligible: 0, sent: 0, avgTimeMs: 0, duplicateAttempts: 0, totalTimeMs: 0,
                    ...loaded.ack
                },
                gem: loaded.gem || { recommended: {}, selected: {}, changed: 0 },
                upgrade: loaded.upgrade || { birthdateProvided: 0, birthdateNotProvided: 0, upgradeClicked: 0, upgradeCompleted: 0 }
            };

            console.log(`[Metrics] 로드됨: ${filepath}`);
        }
    } catch (e) {
        console.warn('[Metrics] 로드 실패 (인메모리 모드):', e.message);
    }
}

// ═══════════════════════════════════════════════════════════
// 메트릭스 기록 함수들
// ═══════════════════════════════════════════════════════════

/**
 * 소원 인입 기록
 * @param {string} status - 'new' | 'processed'
 * @param {boolean} wantMessage - 7일 메시지 수신 여부
 */
function recordWishInbox(status = 'new', wantMessage = false) {
    checkDateReset();
    todayMetrics.wishes.total++;
    if (status === 'new') {
        todayMetrics.wishes.new++;
    } else if (status === 'processed') {
        todayMetrics.wishes.processed++;
    }
    // 7일 메시지 선택 분리 집계
    if (wantMessage) {
        todayMetrics.wishes.wantMessage++;
    } else {
        todayMetrics.wishes.noMessage++;
    }
}

/**
 * 신호등 분류 기록
 */
function recordTrafficLight(color) {
    checkDateReset();
    const c = color.toLowerCase();
    if (c === 'red') todayMetrics.trafficLight.red++;
    else if (c === 'yellow') todayMetrics.trafficLight.yellow++;
    else if (c === 'green') todayMetrics.trafficLight.green++;
}

/**
 * 알림톡 발송 기록
 */
function recordAlimtalk(success, fallbackSms = false) {
    checkDateReset();
    todayMetrics.alimtalk.sent++;
    if (success) {
        todayMetrics.alimtalk.success++;
    } else {
        todayMetrics.alimtalk.failed++;
    }
    if (fallbackSms) {
        todayMetrics.alimtalk.fallbackSms++;
    }
}

/**
 * ACK 대상 기록 (want_message + contact 존재)
 */
function recordAckEligible() {
    checkDateReset();
    todayMetrics.ack.eligible++;
}

/**
 * ACK 발송 기록
 * @param {number} responseTimeMs - 응답 시간 (ms)
 * @param {boolean} isDuplicate - 중복 발송 시도 여부
 */
function recordAck(responseTimeMs, isDuplicate = false) {
    checkDateReset();
    todayMetrics.ack.sent++;
    todayMetrics.ack.totalTimeMs += responseTimeMs;
    if (isDuplicate) {
        todayMetrics.ack.duplicateAttempts++;
    }
}

/**
 * gem 추천/선택 기록
 * @param {string} recommended - 추천된 gem
 * @param {string} selected - 선택된 gem
 */
function recordGem(recommended, selected) {
    checkDateReset();

    // 추천 분포
    if (recommended) {
        todayMetrics.gem.recommended[recommended] = (todayMetrics.gem.recommended[recommended] || 0) + 1;
    }

    // 선택 분포
    if (selected) {
        todayMetrics.gem.selected[selected] = (todayMetrics.gem.selected[selected] || 0) + 1;
    }

    // 변경 여부
    if (recommended && selected && recommended !== selected) {
        todayMetrics.gem.changed++;
    }
}

/**
 * 생년월일 입력 여부 기록 (최초 접수 시)
 * @param {boolean} provided - 생년월일 입력 여부
 */
function recordBirthdateProvided(provided) {
    checkDateReset();
    if (provided) {
        todayMetrics.upgrade.birthdateProvided++;
    } else {
        todayMetrics.upgrade.birthdateNotProvided++;
    }
}

/**
 * 업그레이드 CTA 클릭 기록
 */
function recordUpgradeClick() {
    checkDateReset();
    todayMetrics.upgrade.upgradeClicked++;
}

/**
 * 업그레이드 완료 기록 (생년월일 저장)
 */
function recordUpgradeComplete() {
    checkDateReset();
    todayMetrics.upgrade.upgradeCompleted++;
}

/**
 * 에러 기록
 * @param {string} errorType - 에러 유형
 * @param {string} message - 에러 메시지
 */
function recordError(errorType, message) {
    checkDateReset();

    // 기존 에러 찾기
    const existing = todayMetrics.errors.find(e => e.type === errorType);
    if (existing) {
        existing.count++;
        existing.lastOccurred = new Date().toISOString();
        existing.lastMessage = message;
    } else {
        todayMetrics.errors.push({
            type: errorType,
            count: 1,
            firstOccurred: new Date().toISOString(),
            lastOccurred: new Date().toISOString(),
            lastMessage: message
        });
    }

    // Top 3만 유지 (count 기준 정렬)
    todayMetrics.errors.sort((a, b) => b.count - a.count);
    if (todayMetrics.errors.length > 10) {
        todayMetrics.errors = todayMetrics.errors.slice(0, 10);
    }
}

/**
 * VIP 태깅 기록
 * @param {string} trafficLight - 신호등 색상 ('green' | 'yellow')
 * @param {number} vipScore - VIP 점수 (0-100)
 */
function recordVipTagged(trafficLight, vipScore) {
    checkDateReset();
    todayMetrics.vip.total++;
    todayMetrics.vip.totalScore += vipScore;

    // 신호등별 VIP 카운트
    const tl = trafficLight.toLowerCase();
    if (tl === 'green') {
        todayMetrics.vip.byTrafficLight.green++;
    } else if (tl === 'yellow') {
        todayMetrics.vip.byTrafficLight.yellow++;
    }
}

/**
 * 현재 메트릭스 조회
 */
function getMetrics() {
    checkDateReset();

    // 평균 ACK 시간 계산 (발송 기준)
    const avgAckTime = todayMetrics.ack.sent > 0
        ? Math.round(todayMetrics.ack.totalTimeMs / todayMetrics.ack.sent)
        : 0;

    // 성공률 계산
    const successRate = todayMetrics.alimtalk.sent > 0
        ? ((todayMetrics.alimtalk.success / todayMetrics.alimtalk.sent) * 100).toFixed(1)
        : 0;

    // VIP 평균 점수 계산
    const avgVipScore = todayMetrics.vip.total > 0
        ? Math.round(todayMetrics.vip.totalScore / todayMetrics.vip.total)
        : 0;

    // 7일 메시지 선택률
    const wantMessageRate = todayMetrics.wishes.total > 0
        ? ((todayMetrics.wishes.wantMessage / todayMetrics.wishes.total) * 100).toFixed(1)
        : 0;

    // gem 변경률 (추천 대비)
    const totalRecommended = Object.values(todayMetrics.gem.recommended).reduce((a, b) => a + b, 0);
    const gemChangeRate = totalRecommended > 0
        ? ((todayMetrics.gem.changed / totalRecommended) * 100).toFixed(1)
        : 0;

    // 업그레이드 지표 계산
    const totalBirthdate = todayMetrics.upgrade.birthdateProvided + todayMetrics.upgrade.birthdateNotProvided;
    const birthdateProvidedRate = totalBirthdate > 0
        ? ((todayMetrics.upgrade.birthdateProvided / totalBirthdate) * 100).toFixed(1)
        : 0;

    // 업그레이드 클릭률 (생년월일 미입력 대상)
    const upgradeClickRate = todayMetrics.upgrade.birthdateNotProvided > 0
        ? ((todayMetrics.upgrade.upgradeClicked / todayMetrics.upgrade.birthdateNotProvided) * 100).toFixed(1)
        : 0;

    // 업그레이드 완료율 (클릭 대비)
    const upgradeCompleteRate = todayMetrics.upgrade.upgradeClicked > 0
        ? ((todayMetrics.upgrade.upgradeCompleted / todayMetrics.upgrade.upgradeClicked) * 100).toFixed(1)
        : 0;

    return {
        ...todayMetrics,
        computed: {
            avgAckTimeMs: avgAckTime,
            avgAckMsEligibleOnly: avgAckTime,  // ACK 대상 기준 평균
            alimtalkSuccessRate: successRate + '%',
            errorTop3: todayMetrics.errors.slice(0, 3),
            avgVipScore,
            wantMessageRate: wantMessageRate + '%',
            gemChangeRate: gemChangeRate + '%',
            birthdateProvidedRate: birthdateProvidedRate + '%',
            upgradeClickRate: upgradeClickRate + '%',
            upgradeCompleteRate: upgradeCompleteRate + '%'
        }
    };
}

/**
 * 일일 리포트 문자열 생성
 */
function generateDailyReport() {
    const m = getMetrics();
    const tl = m.trafficLight;
    const total = tl.red + tl.yellow + tl.green || 1;

    return `
═══════════════════════════════════════════════════════════
📊 일일 운영 지표 - ${m.date}
═══════════════════════════════════════════════════════════

📥 소원 인입
   • 총 인입: ${m.wishes.total}건
   • NEW: ${m.wishes.new}건
   • 처리완료: ${m.wishes.processed}건
   • 💌 7일 메시지 선택: ${m.wishes.wantMessage}건 (${m.computed.wantMessageRate})
   • 📝 메시지 미선택: ${m.wishes.noMessage}건

🚦 신호등 분포
   • 🔴 RED: ${tl.red}건 (${((tl.red/total)*100).toFixed(1)}%)
   • 🟡 YELLOW: ${tl.yellow}건 (${((tl.yellow/total)*100).toFixed(1)}%)
   • 🟢 GREEN: ${tl.green}건 (${((tl.green/total)*100).toFixed(1)}%)

📤 알림톡 발송
   • 발송: ${m.alimtalk.sent}건
   • 성공: ${m.alimtalk.success}건 (${m.computed.alimtalkSuccessRate})
   • 실패: ${m.alimtalk.failed}건
   • SMS 폴백: ${m.alimtalk.fallbackSms}건

⏱️ ACK 성능 (7일 메시지 대상 기준)
   • ACK 대상: ${m.ack.eligible}건
   • 발송: ${m.ack.sent}건
   • 평균 응답: ${m.computed.avgAckMsEligibleOnly}ms
   • 중복 시도: ${m.ack.duplicateAttempts}건

💎 gem 추천 분석
   • 추천→선택 변경률: ${m.computed.gemChangeRate}
   • 추천 분포: ${JSON.stringify(m.gem.recommended)}
   • 선택 분포: ${JSON.stringify(m.gem.selected)}

⚠️ 에러 Top 3
${m.computed.errorTop3.length > 0
    ? m.computed.errorTop3.map((e, i) => `   ${i+1}. ${e.type}: ${e.count}건`).join('\n')
    : '   (에러 없음)'}

✨ VIP (Human Touch)
   • VIP 태깅: ${m.vip.total}건
   • 🟢 GREEN VIP: ${m.vip.byTrafficLight.green}건
   • 🟡 YELLOW VIP: ${m.vip.byTrafficLight.yellow}건
   • 평균 VIP 점수: ${m.computed.avgVipScore}점

🎯 정밀 맞춤 업그레이드
   • 생년월일 입력률: ${m.computed.birthdateProvidedRate} (${m.upgrade.birthdateProvided}/${m.upgrade.birthdateProvided + m.upgrade.birthdateNotProvided}건)
   • 업그레이드 클릭률: ${m.computed.upgradeClickRate} (${m.upgrade.upgradeClicked}건)
   • 업그레이드 완료율: ${m.computed.upgradeCompleteRate} (${m.upgrade.upgradeCompleted}건)

═══════════════════════════════════════════════════════════
생성시각: ${new Date().toISOString()}
`;
}

// 초기화 시 기존 메트릭스 로드
loadMetrics();

// 5분마다 자동 저장 (serverless에서는 setInterval 무의미하므로 skip)
if (METRICS_PERSIST) {
    setInterval(() => {
        saveMetrics();
    }, 5 * 60 * 1000);
}

module.exports = {
    recordWishInbox,
    recordTrafficLight,
    recordAlimtalk,
    recordAckEligible,
    recordAck,
    recordGem,
    recordBirthdateProvided,
    recordUpgradeClick,
    recordUpgradeComplete,
    recordError,
    recordVipTagged,
    getMetrics,
    generateDailyReport,
    saveMetrics
};
