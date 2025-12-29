/**
 * 소원실현 API 라우트
 * POST /api/wishes - 소원 제출
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

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
            status: 'pending' // pending, analyzed, completed
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

        console.log(`[Wish] New wish received: ${name} (${gem})`);

        res.json({
            success: true,
            message: '소원이 성공적으로 전달되었습니다',
            wishId: wishData.id
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

module.exports = router;
