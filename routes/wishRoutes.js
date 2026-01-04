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
const {
    recordWishInbox,
    recordTrafficLight,
    recordAckEligible,
    recordGem,
    recordBirthdateProvided,
    recordUpgradeClick,
    recordUpgradeComplete
} = require('../services/metricsService');
const { logEvent, EVENT_TYPES } = require('../services/eventLogger');

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
            gem_recommended,     // 소원 기반 추천값 (프론트에서 전송)
            wish,
            want_message,        // 7일 메시지 수신 여부
            privacy_agreed,
            marketing_agreed,
            created_at
        } = req.body;

        // 기본 필수 검사 (이름, 소원만 필수 / 생년월일은 선택)
        if (!name || !wish) {
            return res.status(400).json({
                success: false,
                message: '이름과 소원은 필수 입력입니다'
            });
        }

        // 전화번호 정규화 (숫자만 추출)
        const rawPhone = phone || '';
        const normalizedPhone = rawPhone.replace(/[^0-9]/g, '');

        // 전화번호 로깅 (디버깅용)
        if (rawPhone) {
            console.log('[Wish] Phone validation:', {
                rawPhone: rawPhone.substring(0, 3) + '****' + rawPhone.slice(-4),
                normalizedPhone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.slice(-4),
                rawLength: rawPhone.length,
                normalizedLength: normalizedPhone.length
            });
        }

        // 7일 메시지 선택 시 추가 검사
        if (want_message) {
            if (!normalizedPhone) {
                return res.status(400).json({
                    success: false,
                    message: '7일 메시지를 받으려면 연락처를 입력해주세요'
                });
            }

            // 전화번호 검증 (정규화된 번호로, 정확히 11자리)
            if (normalizedPhone.length !== 11) {
                console.log('[Wish] Phone rejected - invalid length:', {
                    rawPhone: rawPhone,
                    normalizedPhone: normalizedPhone,
                    length: normalizedPhone.length,
                    expected: 11
                });
                return res.status(400).json({
                    success: false,
                    message: `올바른 휴대폰 번호를 입력해주세요 (11자리, 현재: ${normalizedPhone.length}자리)`
                });
            }

            // 01X로 시작하는지 확인
            if (!/^01[0-9]/.test(normalizedPhone)) {
                console.log('[Wish] Phone rejected - invalid prefix:', { normalizedPhone });
                return res.status(400).json({
                    success: false,
                    message: '올바른 휴대폰 번호를 입력해주세요 (01X로 시작)'
                });
            }

            if (!privacy_agreed || !marketing_agreed) {
                return res.status(400).json({
                    success: false,
                    message: '7일 메시지를 받으려면 개인정보 및 마케팅 수신에 동의해주세요'
                });
            }
        }

        // 보석 폴백 기본값 처리 (citrine)
        const validGems = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];
        const finalGem = validGems.includes(gem) ? gem : 'citrine';

        if (!gem || !validGems.includes(gem)) {
            console.log(`[Wish] gem 미선택/유효하지 않음, 기본값 citrine 적용 (입력: ${gem})`);
        }

        // 신호등 자동 판정
        const trafficLight = classifyWish(wish);

        // 기적지수 계산
        const miracleScore = calculateMiracleScore();

        // gem 추천 로그용 필드 계산
        const gemRecommended = gem_recommended || null;  // 프론트에서 추천한 값
        const gemSelected = gem || null;                  // 사용자가 선택한 값
        const gemChanged = gemRecommended && gemSelected && gemRecommended !== gemSelected;

        // 데이터 구성
        const wishData = {
            id: Date.now().toString(),
            name,
            birthdate: birthdate || null,  // 선택 항목
            phone: normalizedPhone || null,  // 정규화된 전화번호 (숫자만)
            gem: finalGem,
            gem_meaning: getGemMeaning(finalGem),
            gem_recommended: gemRecommended,    // 추천값
            gem_selected: gemSelected,          // 사용자 선택값
            gem_changed: gemChanged,            // 추천에서 변경 여부
            wish,
            want_message: want_message || false,
            privacy_agreed: privacy_agreed || false,
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

        // 메트릭스 기록
        recordWishInbox('new', want_message);
        recordTrafficLight(trafficLight.level);
        recordGem(gemRecommended, gemSelected);
        recordBirthdateProvided(!!birthdate);  // 생년월일 입력 여부
        if (want_message && phone) {
            recordAckEligible();  // ACK 대상 카운트
        }

        // 마케팅 이벤트 로깅: trial_start (7일 메시지 수신 = 무료 체험 시작)
        if (want_message && normalizedPhone) {
            logEvent(EVENT_TYPES.TRIAL_START, {
                wish_id: wishData.id,
                user_name: name,
                phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.slice(-4),
                gem: finalGem,
                traffic_light: trafficLight.level
            }, { source: 'wishRoutes' }).catch(err => {
                console.error('[Event] trial_start 로깅 실패:', err.message);
            });
        }

        // 신호등 상태별 로깅
        const levelEmoji = { RED: '🔴', YELLOW: '🟡', GREEN: '🟢' };
        const msgIcon = want_message ? '💌' : '📝';
        console.log(`[Wish] ${levelEmoji[trafficLight.level]} ${msgIcon} New wish: ${name} (${finalGem}) - ${trafficLight.level}`);

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

        // ACK 메시지 발송 (GREEN/YELLOW만 즉시 발송, normalizedPhone이 있을 때만)
        if (trafficLight.level !== 'RED' && normalizedPhone && want_message) {
            const ackMessages = generateWishAckMessage(wishData);
            console.log('[ACK] Generated ACK message for:', name, '→', normalizedPhone.substring(0, 3) + '****');

            // Solapi로 ACK 발송
            if (isSolapiEnabled()) {
                const ackResult = await sendWishAck(normalizedPhone, wishData);
                console.log('[ACK] 발송 결과:', ackResult.success ? '성공' : ackResult.reason || '실패');
            } else {
                console.log('[ACK] Solapi 미설정 - 로그만 출력');
                console.log('[ACK] Kakao:', ackMessages.kakao.substring(0, 100) + '...');
            }
        } else if (!want_message) {
            console.log('[ACK] 7일 메시지 미선택 - ACK 발송 건너뜀');
        } else if (!normalizedPhone) {
            console.log('[ACK] 전화번호 없음 - ACK 발송 건너뜀');
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
 * POST /api/wishes/metrics/upgrade-click
 * 업그레이드 CTA 클릭 메트릭 기록
 */
router.post('/metrics/upgrade-click', async (req, res) => {
    try {
        recordUpgradeClick();
        console.log('[Upgrade] CTA 클릭 기록됨');
        res.json({ success: true });
    } catch (error) {
        console.error('[Upgrade] 클릭 메트릭 기록 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

/**
 * POST /api/wishes/upgrade-birthdate
 * 업그레이드 - 생년월일 저장
 */
router.post('/upgrade-birthdate', async (req, res) => {
    try {
        const { wishId, birthdate } = req.body;

        if (!wishId || !birthdate) {
            return res.status(400).json({
                success: false,
                message: '소원 ID와 생년월일이 필요합니다'
            });
        }

        // 생년월일 형식 검증 (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
            return res.status(400).json({
                success: false,
                message: '올바른 생년월일 형식이 아닙니다 (YYYY-MM-DD)'
            });
        }

        await ensureDataDir();

        // 개별 파일 찾기 및 업데이트
        const files = await fs.readdir(DATA_DIR);
        const wishFile = files.find(f => f.startsWith(wishId + '_'));

        if (!wishFile) {
            return res.status(404).json({
                success: false,
                message: '해당 소원을 찾을 수 없습니다'
            });
        }

        const filepath = path.join(DATA_DIR, wishFile);
        const content = await fs.readFile(filepath, 'utf8');
        const wishData = JSON.parse(content);

        // 생년월일 업데이트
        wishData.birthdate = birthdate;
        wishData.birthdate_upgraded_at = new Date().toISOString();

        await fs.writeFile(filepath, JSON.stringify(wishData, null, 2), 'utf8');

        // 일별 파일도 업데이트
        const today = new Date().toISOString().split('T')[0];
        const dailyFile = path.join(DATA_DIR, `daily_${today}.json`);

        try {
            const dailyContent = await fs.readFile(dailyFile, 'utf8');
            const dailyData = JSON.parse(dailyContent);
            const idx = dailyData.findIndex(w => w.id === wishId);
            if (idx >= 0) {
                dailyData[idx].birthdate = birthdate;
                dailyData[idx].birthdate_upgraded_at = wishData.birthdate_upgraded_at;
                await fs.writeFile(dailyFile, JSON.stringify(dailyData, null, 2), 'utf8');
            }
        } catch (err) {
            // 일별 파일 업데이트 실패는 무시 (크리티컬하지 않음)
        }

        // 메트릭 기록
        recordUpgradeComplete();
        console.log(`[Upgrade] 생년월일 저장 완료: ${wishId} → ${birthdate}`);

        res.json({
            success: true,
            message: '생년월일이 저장되었습니다',
            wishId,
            birthdate
        });

    } catch (error) {
        console.error('[Upgrade] 생년월일 저장 오류:', error);
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
