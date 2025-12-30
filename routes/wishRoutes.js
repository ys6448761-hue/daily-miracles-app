/**
 * 소원실현 API 라우트
 * POST /api/wishes - 소원 제출
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { generateWishAckMessage, generateRedAlertMessage } = require('../config/messageTemplates');
const { sendWishAck, sendRedAlert, isEnabled: isSolapiEnabled } = require('../services/solapiService');

// 데이터 저장 경로
const DATA_DIR = path.join(__dirname, '..', 'data', 'wishes');

// 폴더 생성 확인
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

/**
 * POST /api/wishes
 * 소원 제출
 */
router.post('/', async (req, res) => {
    try {
        const {
            name,
            birthdate,
            phone,
            gem,
            wish,
            privacy_agreed,
            marketing_agreed,
            created_at
        } = req.body;

        // 유효성 검사
        if (!name || !birthdate || !phone || !gem || !wish) {
            return res.status(400).json({
                success: false,
                message: '모든 필수 항목을 입력해주세요'
            });
        }

        if (!privacy_agreed) {
            return res.status(400).json({
                success: false,
                message: '개인정보 수집 동의가 필요합니다'
            });
        }

        // 전화번호 검증
        if (!/^01[0-9]{8,9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: '올바른 휴대폰 번호를 입력해주세요'
            });
        }

        // 보석 검증
        const validGems = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];
        if (!validGems.includes(gem)) {
            return res.status(400).json({
                success: false,
                message: '올바른 보석을 선택해주세요'
            });
        }

        // 신호등 자동 판정
        const trafficLight = classifyWish(wish);

        // 기적지수 계산
        const miracleScore = calculateMiracleScore();

        // 데이터 구성
        const wishData = {
            id: Date.now().toString(),
            name,
            birthdate,
            phone,
            gem,
            gem_meaning: getGemMeaning(gem),
            wish,
            privacy_agreed,
            marketing_agreed: marketing_agreed || false,
            created_at: created_at || new Date().toISOString(),
            status: 'pending', // pending, analyzed, completed
            traffic_light: trafficLight,
            miracleScore
        };

        // 파일 저장
        await ensureDataDir();
        const filename = `${wishData.id}_${name.replace(/\s/g, '_')}.json`;
        const filepath = path.join(DATA_DIR, filename);
        await fs.writeFile(filepath, JSON.stringify(wishData, null, 2), 'utf8');

        // 날짜별 집계 파일에도 추가
        const today = new Date().toISOString().split('T')[0];
        const dailyFile = path.join(DATA_DIR, `daily_${today}.json`);

        let dailyData = [];
        try {
            const existing = await fs.readFile(dailyFile, 'utf8');
            dailyData = JSON.parse(existing);
        } catch (err) {
            // 파일이 없으면 빈 배열
        }

        dailyData.push(wishData);
        await fs.writeFile(dailyFile, JSON.stringify(dailyData, null, 2), 'utf8');

        // 신호등 상태별 로깅
        const levelEmoji = { RED: '🔴', YELLOW: '🟡', GREEN: '🟢' };
        console.log(`[Wish] ${levelEmoji[trafficLight.level]} New wish: ${name} (${gem}) - ${trafficLight.level}`);

        // RED 신호 시 긴급 경고 및 알림
        if (trafficLight.level === 'RED') {
            console.log(`[ALERT] ⚠️ RED SIGNAL: ${trafficLight.reason}`);
            console.log(`[ALERT] Action Required: ${trafficLight.action}`);

            // 재미(CRO) 긴급 알림 메시지 생성 및 발송
            const redAlert = generateRedAlertMessage(wishData);
            console.log('[ALERT] CRO Notification:');
            console.log(redAlert);

            // Solapi로 RED 알림 발송
            if (isSolapiEnabled()) {
                const alertResult = await sendRedAlert(wishData);
                console.log('[ALERT] RED Alert 발송 결과:', alertResult.success ? '성공' : '실패');
            }
        }

        // ACK 메시지 발송 (GREEN/YELLOW만 즉시 발송)
        if (trafficLight.level !== 'RED') {
            const ackMessages = generateWishAckMessage(wishData);
            console.log('[ACK] Generated ACK message for:', name);

            // Solapi로 ACK 발송
            if (isSolapiEnabled()) {
                const ackResult = await sendWishAck(phone, wishData);
                console.log('[ACK] 발송 결과:', ackResult.success ? '성공' : ackResult.reason || '실패');
            } else {
                console.log('[ACK] Solapi 미설정 - 로그만 출력');
                console.log('[ACK] Kakao:', ackMessages.kakao.substring(0, 100) + '...');
            }
        }

        res.json({
            success: true,
            message: '소원이 성공적으로 전달되었습니다',
            wishId: wishData.id,
            miracleScore: miracleScore,
            trafficLight: trafficLight.level
        });

    } catch (error) {
        console.error('[Wish] Error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/wishes/today
 * 오늘 접수된 소원 목록 (관리자용)
 */
router.get('/today', async (req, res) => {
    try {
        await ensureDataDir();
        const today = new Date().toISOString().split('T')[0];
        const dailyFile = path.join(DATA_DIR, `daily_${today}.json`);

        let dailyData = [];
        try {
            const existing = await fs.readFile(dailyFile, 'utf8');
            dailyData = JSON.parse(existing);
        } catch (err) {
            // 파일이 없으면 빈 배열
        }

        res.json({
            success: true,
            date: today,
            count: dailyData.length,
            wishes: dailyData
        });

    } catch (error) {
        console.error('[Wish] Error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * 보석 의미 반환
 */
function getGemMeaning(gem) {
    const meanings = {
        ruby: '열정과 용기',
        sapphire: '안정과 지혜',
        emerald: '성장과 치유',
        diamond: '명확한 결단',
        citrine: '긍정 에너지와 소통'
    };
    return meanings[gem] || '';
}

/**
 * 신호등 자동 판정 로직
 * RED: 위험 - 즉시 대응 필요
 * YELLOW: 주의 - 검토 필요
 * GREEN: 정상 - 자동 처리 가능
 */
function classifyWish(wishText) {
    const text = wishText.toLowerCase();

    // RED 키워드 (위험 - 즉시 대응)
    const redKeywords = [
        '자살', '죽고싶', '죽고 싶', '죽을래', '죽을 래',
        '자해', '손목', '목숨', '끝내고 싶', '끝내고싶',
        '사라지고 싶', '사라지고싶', '없어지고 싶', '없어지고싶',
        '포기하고 싶', '힘들어서 못살', '살기 싫', '살기싫'
    ];

    for (const keyword of redKeywords) {
        if (text.includes(keyword)) {
            return {
                level: 'RED',
                reason: `위험 키워드 감지: "${keyword}"`,
                action: '즉시 재미(CRO) 알림 발송',
                priority: 1
            };
        }
    }

    // YELLOW 키워드 (주의 - 검토 필요)
    const yellowKeywords = [
        { keyword: '빚', category: '재정' },
        { keyword: '대출', category: '재정' },
        { keyword: '파산', category: '재정' },
        { keyword: '신용불량', category: '재정' },
        { keyword: '암', category: '건강' },
        { keyword: '수술', category: '건강' },
        { keyword: '병원', category: '건강' },
        { keyword: '치료', category: '건강' },
        { keyword: '소송', category: '법적' },
        { keyword: '고소', category: '법적' },
        { keyword: '합의금', category: '법적' },
        { keyword: '이혼', category: '가정' },
        { keyword: '별거', category: '가정' },
        { keyword: '양육권', category: '가정' },
        { keyword: '폭력', category: '위험' },
        { keyword: '학대', category: '위험' }
    ];

    for (const item of yellowKeywords) {
        if (text.includes(item.keyword)) {
            return {
                level: 'YELLOW',
                reason: `주의 키워드 감지 (${item.category}): "${item.keyword}"`,
                action: '24시간 내 재미(CRO) 검토',
                priority: 2
            };
        }
    }

    // GREEN: 일반 소원 (자동 처리 가능)
    return {
        level: 'GREEN',
        reason: '일반 소원',
        action: '자동 처리 및 응원 메시지 발송',
        priority: 3
    };
}

/**
 * 기적지수 계산 (1/1 특별 80-95점)
 */
function calculateMiracleScore() {
    return 80 + Math.floor(Math.random() * 16);
}

module.exports = router;
