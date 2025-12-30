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

// 메트릭스 저장 경로
const METRICS_DIR = path.join(__dirname, '..', 'data', 'metrics');
const DAILY_METRICS_FILE = () => path.join(METRICS_DIR, `metrics-${getToday()}.json`);

// 인메모리 메트릭스 (서버 시작 후 누적)
let todayMetrics = {
    date: getToday(),
    wishes: {
        total: 0,
        new: 0,
        processed: 0
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
        sent: 0,
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
    errors: [],
    startedAt: new Date().toISOString()
};

function getToday() {
    return new Date().toISOString().split('T')[0];
}

/**
 * 디렉토리 확인 및 생성
 */
function ensureDir() {
    if (!fs.existsSync(METRICS_DIR)) {
        fs.mkdirSync(METRICS_DIR, { recursive: true });
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
            wishes: { total: 0, new: 0, processed: 0 },
            trafficLight: { red: 0, yellow: 0, green: 0 },
            alimtalk: { sent: 0, success: 0, failed: 0, fallbackSms: 0 },
            ack: { sent: 0, avgTimeMs: 0, duplicateAttempts: 0, totalTimeMs: 0 },
            vip: { total: 0, byTrafficLight: { green: 0, yellow: 0 }, avgScore: 0, totalScore: 0 },
            errors: [],
            startedAt: new Date().toISOString()
        };
    }
}

/**
 * 메트릭스 파일 저장
 */
function saveMetrics() {
    ensureDir();
    const filepath = DAILY_METRICS_FILE();

    // 평균 ACK 시간 계산
    if (todayMetrics.ack.sent > 0) {
        todayMetrics.ack.avgTimeMs = Math.round(todayMetrics.ack.totalTimeMs / todayMetrics.ack.sent);
    }

    // 알림톡 성공률 계산
    todayMetrics.alimtalk.successRate = todayMetrics.alimtalk.sent > 0
        ? ((todayMetrics.alimtalk.success / todayMetrics.alimtalk.sent) * 100).toFixed(1) + '%'
        : 'N/A';

    todayMetrics.savedAt = new Date().toISOString();

    fs.writeFileSync(filepath, JSON.stringify(todayMetrics, null, 2), 'utf-8');
    console.log(`[Metrics] 저장됨: ${filepath}`);
}

/**
 * 메트릭스 로드 (서버 재시작 시)
 */
function loadMetrics() {
    ensureDir();
    const filepath = DAILY_METRICS_FILE();

    if (fs.existsSync(filepath)) {
        try {
            const content = fs.readFileSync(filepath, 'utf-8');
            todayMetrics = JSON.parse(content);
            console.log(`[Metrics] 로드됨: ${filepath}`);
        } catch (e) {
            console.error('[Metrics] 로드 실패:', e.message);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 메트릭스 기록 함수들
// ═══════════════════════════════════════════════════════════

/**
 * 소원 인입 기록
 */
function recordWishInbox(status = 'new') {
    checkDateReset();
    todayMetrics.wishes.total++;
    if (status === 'new') {
        todayMetrics.wishes.new++;
    } else if (status === 'processed') {
        todayMetrics.wishes.processed++;
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

    // 평균 ACK 시간 계산
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

    return {
        ...todayMetrics,
        computed: {
            avgAckTimeMs: avgAckTime,
            alimtalkSuccessRate: successRate + '%',
            errorTop3: todayMetrics.errors.slice(0, 3),
            avgVipScore
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

🚦 신호등 분포
   • 🔴 RED: ${tl.red}건 (${((tl.red/total)*100).toFixed(1)}%)
   • 🟡 YELLOW: ${tl.yellow}건 (${((tl.yellow/total)*100).toFixed(1)}%)
   • 🟢 GREEN: ${tl.green}건 (${((tl.green/total)*100).toFixed(1)}%)

📤 알림톡 발송
   • 발송: ${m.alimtalk.sent}건
   • 성공: ${m.alimtalk.success}건 (${m.computed.alimtalkSuccessRate})
   • 실패: ${m.alimtalk.failed}건
   • SMS 폴백: ${m.alimtalk.fallbackSms}건

⏱️ ACK 성능
   • 발송: ${m.ack.sent}건
   • 평균 응답: ${m.computed.avgAckTimeMs}ms
   • 중복 시도: ${m.ack.duplicateAttempts}건

⚠️ 에러 Top 3
${m.computed.errorTop3.length > 0
    ? m.computed.errorTop3.map((e, i) => `   ${i+1}. ${e.type}: ${e.count}건`).join('\n')
    : '   (에러 없음)'}

✨ VIP (Human Touch)
   • VIP 태깅: ${m.vip.total}건
   • 🟢 GREEN VIP: ${m.vip.byTrafficLight.green}건
   • 🟡 YELLOW VIP: ${m.vip.byTrafficLight.yellow}건
   • 평균 VIP 점수: ${m.computed.avgVipScore}점

═══════════════════════════════════════════════════════════
생성시각: ${new Date().toISOString()}
`;
}

// 초기화 시 기존 메트릭스 로드
loadMetrics();

// 5분마다 자동 저장
setInterval(() => {
    saveMetrics();
}, 5 * 60 * 1000);

module.exports = {
    recordWishInbox,
    recordTrafficLight,
    recordAlimtalk,
    recordAck,
    recordError,
    recordVipTagged,
    getMetrics,
    generateDailyReport,
    saveMetrics
};
