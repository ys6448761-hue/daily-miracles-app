/**
 * ?뚯썝 異붿쟻 API ?쇱슦??
 *
 * @purpose ?섑궎?ㅽ떛 ?깆옣 硫붿빱?덉쬁 #2: ?곗씠??蹂듬━
 *
 * ?붾뱶?ъ씤??
 * - GET  /api/wish-tracking/respond/:token - 異붿쟻 ?묐떟 ?섏씠吏 ?곗씠??
 * - POST /api/wish-tracking/respond/:token - 異붿쟻 ?묐떟 ?쒖텧
 * - GET  /api/wish-tracking/stats - ?꾩껜 ?깃났瑜??듦퀎
 * - GET  /api/wish-tracking/stats/:category - 移댄뀒怨좊━蹂??깃났瑜?
 * - POST /api/wish-tracking/batch/send - 諛곗튂 諛쒖넚 (愿由ъ옄)
 */

const express = require('express');
const router = express.Router();

// ?쒕퉬???몄뒪?댁뒪 (server.js?먯꽌 二쇱엯)
let trackingService = null;
let messageProvider = null;

// 오버레이 서비스 (tolerant loading)
let overlayService = null;
try {
    overlayService = require('../services/overlayService');
} catch (err) {
    console.warn('[WishTracking] overlayService 로드 실패:', err.message);
}

/**
 * ?쒕퉬??珥덇린??(server.js?먯꽌 ?몄텧)
 */
router.init = function(services) {
    trackingService = services.trackingService;
    messageProvider = services.messageProvider;
    console.log('[WishTracking] ?쇱슦??珥덇린???꾨즺');
};

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 異붿쟻 ?묐떟 ?섏씠吏
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

/**
 * GET /api/wish-tracking/respond/:token
 * 異붿쟻 ?묐떟 ?섏씠吏 ?곗씠??議고쉶
 */
router.get('/respond/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!trackingService) {
            return res.status(503).json({
                success: false,
                error: 'service_unavailable',
                message: '異붿쟻 ?쒕퉬?ㅺ? 珥덇린?붾릺吏 ?딆븯?듬땲??'
            });
        }

        // 異붿쟻 ?붿껌 議고쉶
        const request = await trackingService.getTrackingRequestByToken(token);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'not_found',
                message: '?좏슚?섏? ?딄굅??留뚮즺??留곹겕?낅땲??'
            });
        }

        // ?대엺 湲곕줉
        await trackingService.markRequestOpened(request.id);

        // 鍮꾩듂???뚯썝 ?듦퀎
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
        console.error('[WishTracking] ?묐떟 ?섏씠吏 議고쉶 ?ㅽ뙣:', error.message);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: '?쒕쾭 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.'
        });
    }
});

/**
 * POST /api/wish-tracking/respond/:token
 * 異붿쟻 ?묐떟 ?쒖텧
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

        // ?좏슚??寃??
        if (!realized_status) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: '?ㅽ쁽 ?곹깭瑜??좏깮?댁＜?몄슂.'
            });
        }

        const validStatuses = ['realized', 'partial', 'not_yet', 'gave_up'];
        if (!validStatuses.includes(realized_status)) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: '?좏슚?섏? ?딆? ?ㅽ쁽 ?곹깭?낅땲??'
            });
        }

        // 異붿쟻 ?붿껌 議고쉶
        const request = await trackingService.getTrackingRequestByToken(token);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'not_found',
                message: '?좏슚?섏? ?딄굅??留뚮즺??留곹겕?낅땲??'
            });
        }

        // ?묐떟 ???
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

        // ?묒썝 硫붿떆吏 ?앹꽦
        const encouragement = getResponseEncouragement(realized_status);

        res.json({
            success: true,
            message: '?뚯쨷???묐떟 媛먯궗?⑸땲??',
            encouragement,
            data: {
                response_id: result.response.id
            }
        });

    } catch (error) {
        console.error('[WishTracking] ?묐떟 ?쒖텧 ?ㅽ뙣:', error.message);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: '?쒕쾭 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.'
        });
    }
});

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// ?듦퀎 議고쉶
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

/**
 * GET /api/wish-tracking/stats
 * ?꾩껜 ?깃났瑜??듦퀎
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
        console.error('[WishTracking] ?듦퀎 議고쉶 ?ㅽ뙣:', error.message);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

/**
 * GET /api/wish-tracking/stats/:category
 * 移댄뀒怨좊━蹂??깃났瑜?
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
        console.error('[WishTracking] 移댄뀒怨좊━ ?듦퀎 議고쉶 ?ㅽ뙣:', error.message);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 諛곗튂 ?묒뾽 (愿由ъ옄??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

/**
 * POST /api/wish-tracking/batch/send
 * 異붿쟻 硫붿떆吏 諛곗튂 諛쒖넚 (愿由ъ옄 ?좏겙 ?꾩슂)
 */
router.post('/batch/send', async (req, res) => {
    try {
        // 愿由ъ옄 ?몄쬆
        const authToken = req.headers['x-admin-token'] || req.query.token;
        const expectedToken = process.env.ADMIN_TOKEN;

        if (!expectedToken || authToken !== expectedToken) {
            return res.status(403).json({
                success: false,
                error: 'forbidden',
                message: '愿由ъ옄 沅뚰븳???꾩슂?⑸땲??'
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
                message: 'stage??day7, day30, day90 以??섎굹?ъ빞 ?⑸땲??'
            });
        }

        // 諛쒖넚 ???議고쉶
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

        // ?ㅼ젣 諛쒖넚
        const results = { sent: 0, failed: 0, errors: [] };
        const baseUrl = process.env.APP_BASE_URL || 'https://dailymiracles.kr';

        for (const target of targets) {
            try {
                // 異붿쟻 ?붿껌 ?앹꽦
                const request = await trackingService.createTrackingRequest(target.id, stage);

                const responseUrl = `${baseUrl}/wish-tracking.html?token=${request.response_token}`;
                const message = buildTrackingMessage(stage, target.name, responseUrl);

                // overlay image generation (fail-safe: never blocks send)
                let image_url = null;
                if (overlayService && target.image_filename) {
                    try {
                        const captionLines = overlayService.processCaption(
                            `${target.name || '소원이'}님의 소원이 이루어지는 중`
                        );
                        const overlayResult = await overlayService.generateOverlay({
                            inputPath: require('path').join(__dirname, '..', 'public', 'images', 'wishes', target.image_filename),
                            captionLines,
                            originalFilename: target.image_filename
                        });
                        image_url = `${baseUrl}${overlayResult.overlay_url}`;
                    } catch (overlayErr) {
                        console.error(`[WishTracking] OVERLAY_FAILED wish_id=${target.id}:`, overlayErr.message);
                    }
                }

                const sendResult = await messageProvider.sendSensAlimtalk(
                    target.phone,
                    {
                        name: target.name || '소원이',
                        stage: getStageLabel(stage),
                        url: responseUrl,
                        image_url
                    }
                );

                if (sendResult.success) {
                    results.sent++;
                } else {
                    // alimtalk failed -> SMS fallback
                    await messageProvider.sendSensSMS(
                        target.phone,
                        message
                    );
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
        console.error('[WishTracking] 諛곗튂 諛쒖넚 ?ㅽ뙣:', error.message);
        res.status(500).json({ success: false, error: 'server_error', message: error.message });
    }
});

/**
 * GET /api/wish-tracking/batch/pending
 * 諛쒖넚 ?湲?嫄댁닔 議고쉶
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
        console.error('[WishTracking] ?湲?嫄댁닔 議고쉶 ?ㅽ뙣:', error.message);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// ?ы띁 ?⑥닔
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function getStageLabel(stage) {
    const labels = {
        day7: '7일',
        day30: '30일',
        day90: '90일'
    };
    return labels[stage] || stage;
}

function buildTrackingMessage(stage, name, url) {
    const stageLabel = getStageLabel(stage);
    const safeName = name || '소원이';
    const safeUrl = url || '';

    if (stage === 'day7') {
        return `[하루하루의 기적] ${safeName}님, 소원을 빈 지 ${stageLabel}이 되었어요! 30초만 알려주세요 😊\n\n${safeUrl}`;
    }
    if (stage === 'day30') {
        return `[하루하루의 기적] ${safeName}님, 한 달이 지났어요! 소원이 어떻게 되어가고 있나요? ✨\n\n${safeUrl}`;
    }
    if (stage === 'day90') {
        return `[하루하루의 기적] ${safeName}님, 90일이 지났어요! 30초만에 알려주세요 😊\n\n${safeUrl}\n\n(30초면 충분해요)`;
    }
    return `[하루하루의 기적] ${safeName}님, 소원 진행 상황을 알려주세요!\n\n${safeUrl}`;
}

module.exports = router;
