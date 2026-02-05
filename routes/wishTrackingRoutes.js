/**
 * 소원 추적 API 라우트
 *
 * @purpose 하키스틱 성장 메커니즘 #2: 데이터 복리
 *
 * 엔드포인트:
 * - GET  /api/wish-tracking/respond/:token - 추적 응답 페이지 데이터
 * - POST /api/wish-tracking/respond/:token - 추적 응답 제출
 * - GET  /api/wish-tracking/stats - 전체 성공률 통계
 * - GET  /api/wish-tracking/stats/:category - 카테고리별 성공률
 * - POST /api/wish-tracking/batch/send - 배치 발송 (관리자)
 */

const express = require('express');
const router = express.Router();

// 서비스 인스턴스 (server.js에서 주입)
let trackingService = null;
let messageProvider = null;

/**
 * 서비스 초기화 (server.js에서 호출)
 */
router.init = function(services) {
    trackingService = services.trackingService;
    messageProvider = services.messageProvider;
    console.log('[WishTracking] 라우터 초기화 완료');
};

// ═══════════════════════════════════════════════════════════════════════════
// 추적 응답 페이지
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/wish-tracking/respond/:token
 * 추적 응답 페이지 데이터 조회
 */
router.get('/respond/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!trackingService) {
            return res.status(503).json({
                success: false,
                error: 'service_unavailable',
                message: '추적 서비스가 초기화되지 않았습니다.'
            });
        }

        // 추적 요청 조회
        const request = await trackingService.getTrackingRequestByToken(token);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'not_found',
                message: '유효하지 않거나 만료된 링크입니다.'
            });
        }

        // 열람 기록
        await trackingService.markRequestOpened(request.id);

        // 비슷한 소원 통계
        const similarStats = await trackingService.getSimilarWishStats(
            request.wish_category,
            request.miracle_index
        );

        res.json({
            success: true,
            data: {
                name: request.name,
                wish_text: request.wish_text,
                miracle_index: request.miracle_index,
                wish_category: request.wish_category,
                tracking_stage: request.tracking_stage,
                created_at: request.sent_at,
                similar_stats: similarStats
            }
        });

    } catch (error) {
        console.error('[WishTracking] 응답 페이지 조회 실패:', error.message);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: '서버 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/wish-tracking/respond/:token
 * 추적 응답 제출
 */
router.post('/respond/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const {
            realized_status,
            realized_percent,
            what_helped,
            what_blocked,
            would_recommend,
            satisfaction,
            feedback
        } = req.body;

        if (!trackingService) {
            return res.status(503).json({
                success: false,
                error: 'service_unavailable'
            });
        }

        // 유효성 검사
        if (!realized_status) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: '실현 상태를 선택해주세요.'
            });
        }

        const validStatuses = ['realized', 'partial', 'not_yet', 'gave_up'];
        if (!validStatuses.includes(realized_status)) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: '유효하지 않은 실현 상태입니다.'
            });
        }

        // 추적 요청 조회
        const request = await trackingService.getTrackingRequestByToken(token);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'not_found',
                message: '유효하지 않거나 만료된 링크입니다.'
            });
        }

        // 응답 저장
        const result = await trackingService.saveTrackingResponse({
            tracking_request_id: request.id,
            realized_status,
            realized_percent: realized_status === 'partial' ? realized_percent : null,
            what_helped,
            what_blocked,
            would_recommend,
            satisfaction,
            feedback,
            ip_address: req.ip || req.headers['x-forwarded-for'],
            user_agent: req.headers['user-agent']
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: 'save_error',
                message: result.error
            });
        }

        // 응원 메시지 생성
        const encouragement = getResponseEncouragement(realized_status);

        res.json({
            success: true,
            message: '소중한 응답 감사합니다!',
            encouragement,
            data: {
                response_id: result.response.id
            }
        });

    } catch (error) {
        console.error('[WishTracking] 응답 제출 실패:', error.message);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 통계 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/wish-tracking/stats
 * 전체 성공률 통계
 */
router.get('/stats', async (req, res) => {
    try {
        if (!trackingService) {
            return res.status(503).json({ success: false, error: 'service_unavailable' });
        }

        const stats = await trackingService.getOverallStats();

        res.json({
            success: true,
            data: {
                overall: stats,
                updated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[WishTracking] 통계 조회 실패:', error.message);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

/**
 * GET /api/wish-tracking/stats/:category
 * 카테고리별 성공률
 */
router.get('/stats/:category', async (req, res) => {
    try {
        const { category } = req.params;

        if (!trackingService) {
            return res.status(503).json({ success: false, error: 'service_unavailable' });
        }

        const stats = await trackingService.getSuccessRateByCategory(category);

        res.json({
            success: true,
            data: {
                category,
                patterns: stats
            }
        });

    } catch (error) {
        console.error('[WishTracking] 카테고리 통계 조회 실패:', error.message);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 배치 작업 (관리자용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/wish-tracking/batch/send
 * 추적 메시지 배치 발송 (관리자 토큰 필요)
 */
router.post('/batch/send', async (req, res) => {
    try {
        // 관리자 인증
        const authToken = req.headers['x-admin-token'] || req.query.token;
        const expectedToken = process.env.ADMIN_TOKEN;

        if (!expectedToken || authToken !== expectedToken) {
            return res.status(403).json({
                success: false,
                error: 'forbidden',
                message: '관리자 권한이 필요합니다.'
            });
        }

        if (!trackingService || !messageProvider) {
            return res.status(503).json({ success: false, error: 'service_unavailable' });
        }

        const { stage, dry_run = true } = req.body;

        if (!stage || !['day7', 'day30', 'day90'].includes(stage)) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: 'stage는 day7, day30, day90 중 하나여야 합니다.'
            });
        }

        // 발송 대상 조회
        const targets = await trackingService.getTrackingTargets(stage);

        if (dry_run) {
            return res.json({
                success: true,
                dry_run: true,
                stage,
                target_count: targets.length,
                targets: targets.map(t => ({
                    id: t.id,
                    name: t.name,
                    created_at: t.created_at
                }))
            });
        }

        // 실제 발송
        const results = { sent: 0, failed: 0, errors: [] };
        const baseUrl = process.env.APP_BASE_URL || 'https://dailymiracles.kr';

        for (const target of targets) {
            try {
                // 추적 요청 생성
                const request = await trackingService.createTrackingRequest(target.id, stage);

                // 메시지 발송
                const responseUrl = `${baseUrl}/wish-tracking.html?token=${request.response_token}`;
                const message = buildTrackingMessage(stage, target.name, responseUrl);

                const sendResult = await messageProvider.sendKakao({
                    to: target.phone,
                    templateCode: process.env.SENS_TRACKING_TEMPLATE_CODE || 'tracking_default',
                    variables: {
                        name: target.name || '소원이',
                        stage: getStageLabel(stage),
                        url: responseUrl
                    }
                });

                if (sendResult.success) {
                    results.sent++;
                } else {
                    // 알림톡 실패 시 SMS 대체
                    await messageProvider.sendSMS({
                        to: target.phone,
                        text: message
                    });
                    results.sent++;
                }

            } catch (error) {
                results.failed++;
                results.errors.push({
                    wish_id: target.id,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            stage,
            results
        });

    } catch (error) {
        console.error('[WishTracking] 배치 발송 실패:', error.message);
        res.status(500).json({ success: false, error: 'server_error', message: error.message });
    }
});

/**
 * GET /api/wish-tracking/batch/pending
 * 발송 대기 건수 조회
 */
router.get('/batch/pending', async (req, res) => {
    try {
        if (!trackingService) {
            return res.status(503).json({ success: false, error: 'service_unavailable' });
        }

        const counts = await trackingService.getPendingTrackingCount();

        res.json({
            success: true,
            data: counts
        });

    } catch (error) {
        console.error('[WishTracking] 대기 건수 조회 실패:', error.message);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼 함수
// ═══════════════════════════════════════════════════════════════════════════

function getStageLabel(stage) {
    const labels = {
        day7: '7일',
        day30: '한 달',
        day90: '3개월'
    };
    return labels[stage] || stage;
}

function buildTrackingMessage(stage, name, url) {
    const stageLabel = getStageLabel(stage);
    return `[하루하루의 기적] ${name || '소원이'}님, ${stageLabel}이 지났어요!\n\n` +
           `소원은 어떻게 되어가고 있나요?\n` +
           `간단한 응답으로 알려주세요 👇\n\n` +
           `${url}\n\n` +
           `(응답 시간: 30초)`;
}

function getResponseEncouragement(status) {
    const messages = {
        realized: '🎉 축하드려요! 소원이 실현되었군요! 당신의 노력이 빛났습니다.',
        partial: '💪 절반의 성공도 대단해요! 계속 나아가면 반드시 완성됩니다.',
        not_yet: '🌱 아직 진행 중이시군요. 포기하지 않는 것이 가장 큰 힘입니다.',
        gave_up: '💜 괜찮아요. 때로는 방향을 바꾸는 것도 용기입니다. 새로운 소원을 빌어보세요.'
    };
    return messages[status] || '소중한 응답 감사합니다!';
}

module.exports = router;
