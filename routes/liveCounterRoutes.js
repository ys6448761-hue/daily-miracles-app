/**
 * 실시간 카운터 API 라우트
 *
 * @purpose 하키스틱 성장 메커니즘 #4: 네트워크 효과
 *
 * 엔드포인트:
 * - GET  /api/live/stats        - 프론트엔드용 간단 통계
 * - GET  /api/live/stats/full   - 전체 상세 통계 (관리자)
 * - POST /api/live/heartbeat    - 사용자 활동 기록
 * - POST /api/live/wishing      - 소원 작성 시작/완료
 */

const express = require('express');
const router = express.Router();

// 서비스 인스턴스 (server.js에서 주입)
let counterService = null;

/**
 * 서비스 초기화
 */
router.init = function(service) {
    counterService = service;
    console.log('[LiveCounter] 라우터 초기화 완료');
};

// ═══════════════════════════════════════════════════════════════════════════
// 통계 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/live/stats
 * 프론트엔드용 간단 통계
 */
router.get('/stats', async (req, res) => {
    try {
        if (!counterService) {
            // 서비스 없으면 기본값 반환
            return res.json({
                success: true,
                data: {
                    activeNow: 1,
                    wishingNow: 0,
                    todayWishes: 0,
                    topCategory: null,
                    totalWishes: 0,
                    timestamp: new Date().toISOString()
                }
            });
        }

        const stats = await counterService.getSimpleStats();

        // CORS 허용 (프론트엔드 위젯용)
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'public, max-age=10'); // 10초 캐시

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('[LiveCounter] 통계 조회 실패:', error.message);
        res.status(500).json({
            success: false,
            error: 'server_error'
        });
    }
});

/**
 * GET /api/live/stats/full
 * 전체 상세 통계 (관리자용)
 */
router.get('/stats/full', async (req, res) => {
    try {
        if (!counterService) {
            return res.status(503).json({
                success: false,
                error: 'service_unavailable'
            });
        }

        const stats = await counterService.getLiveStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('[LiveCounter] 전체 통계 조회 실패:', error.message);
        res.status(500).json({
            success: false,
            error: 'server_error'
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 활동 기록
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/live/heartbeat
 * 사용자 활동 기록 (5분마다 호출)
 */
router.post('/heartbeat', (req, res) => {
    try {
        const { sessionId, page } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId required'
            });
        }

        if (counterService) {
            counterService.recordActivity(sessionId, page);
        }

        res.json({ success: true });

    } catch (error) {
        console.error('[LiveCounter] heartbeat 실패:', error.message);
        res.status(500).json({ success: false });
    }
});

/**
 * POST /api/live/wishing
 * 소원 작성 시작/완료 기록
 */
router.post('/wishing', (req, res) => {
    try {
        const { sessionId, action } = req.body;

        if (!sessionId || !action) {
            return res.status(400).json({
                success: false,
                error: 'sessionId and action required'
            });
        }

        if (counterService) {
            if (action === 'start') {
                counterService.startWishing(sessionId);
            } else if (action === 'finish') {
                counterService.finishWishing(sessionId);
            }
        }

        res.json({ success: true });

    } catch (error) {
        console.error('[LiveCounter] wishing 기록 실패:', error.message);
        res.status(500).json({ success: false });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// SSE (Server-Sent Events) 실시간 업데이트
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/live/stream
 * 실시간 통계 스트림 (SSE)
 */
router.get('/stream', async (req, res) => {
    // SSE 헤더 설정
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    res.flushHeaders();

    // 초기 데이터 전송
    const sendStats = async () => {
        try {
            if (counterService) {
                const stats = await counterService.getSimpleStats();
                res.write(`data: ${JSON.stringify(stats)}\n\n`);
            }
        } catch (error) {
            console.error('[LiveCounter] SSE 전송 실패:', error.message);
        }
    };

    // 즉시 한 번 전송
    await sendStats();

    // 10초마다 업데이트
    const interval = setInterval(sendStats, 10000);

    // 연결 종료 시 정리
    req.on('close', () => {
        clearInterval(interval);
    });
});

module.exports = router;
