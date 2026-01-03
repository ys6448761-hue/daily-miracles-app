/**
 * 배치 처리 시스템 API
 * 대량 소원 처리, 메시지 발송, 분석 등 배치 작업 관리
 *
 * @version 1.0 - 2026.01.03
 */

const express = require('express');
const router = express.Router();

// ========== 서비스 로딩 ==========
let airtableService = null;
try {
    airtableService = require('../services/airtableService');
} catch (error) {
    console.warn('[Batch] Airtable 서비스 로드 실패');
}

let metricsService = null;
try {
    metricsService = require('../services/metricsService');
} catch (error) {
    console.warn('[Batch] Metrics 서비스 로드 실패');
}

// ========== 상수 ==========
const BATCH_STATUS = {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    PARTIAL: 'PARTIAL',     // 일부 성공
    CANCELLED: 'CANCELLED'
};

const BATCH_TYPES = {
    // 소원 처리
    WISH_ANALYSIS: {
        id: 'wish_analysis',
        name: '소원 분석',
        description: '대기 중인 소원 일괄 분석',
        maxConcurrent: 5,
        retryLimit: 3
    },
    WISH_IMAGE: {
        id: 'wish_image',
        name: '소원그림 생성',
        description: '소원그림 일괄 생성',
        maxConcurrent: 3,
        retryLimit: 2
    },

    // 메시지 발송
    MESSAGE_ACK: {
        id: 'message_ack',
        name: 'ACK 발송',
        description: '초동응답 메시지 일괄 발송',
        maxConcurrent: 10,
        retryLimit: 3
    },
    MESSAGE_7DAY: {
        id: 'message_7day',
        name: '7일 메시지',
        description: '7일 응원 메시지 발송',
        maxConcurrent: 10,
        retryLimit: 3
    },
    MESSAGE_CAMPAIGN: {
        id: 'message_campaign',
        name: '캠페인 발송',
        description: '마케팅 캠페인 메시지 발송',
        maxConcurrent: 20,
        retryLimit: 2
    },

    // 분석 및 리포트
    DAILY_REPORT: {
        id: 'daily_report',
        name: '일일 리포트',
        description: '일일 메트릭스 리포트 생성',
        maxConcurrent: 1,
        retryLimit: 2
    },
    SIGNAL_SCAN: {
        id: 'signal_scan',
        name: '신호등 스캔',
        description: '전체 소원 신호등 재판정',
        maxConcurrent: 10,
        retryLimit: 1
    },

    // 데이터 정리
    DATA_CLEANUP: {
        id: 'data_cleanup',
        name: '데이터 정리',
        description: '오래된 데이터 정리',
        maxConcurrent: 1,
        retryLimit: 1
    },
    SYNC_AIRTABLE: {
        id: 'sync_airtable',
        name: 'Airtable 동기화',
        description: 'Airtable 데이터 동기화',
        maxConcurrent: 5,
        retryLimit: 3
    }
};

// ========== 인메모리 저장소 ==========
const batches = new Map();
const batchQueue = [];
let isProcessing = false;

// ========== 유틸리티 ==========

/**
 * 배치 ID 생성
 */
function generateBatchId(type) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BATCH-${type.toUpperCase()}-${dateStr}-${random}`;
}

/**
 * 배치 작업 생성
 */
function createBatch(type, items, options = {}) {
    const batchConfig = BATCH_TYPES[type];
    if (!batchConfig) {
        throw new Error(`Unknown batch type: ${type}`);
    }

    const batchId = generateBatchId(batchConfig.id);
    const batch = {
        batch_id: batchId,
        type: batchConfig.id,
        type_name: batchConfig.name,
        status: BATCH_STATUS.PENDING,
        total_items: items.length,
        processed: 0,
        succeeded: 0,
        failed: 0,
        items: items.map((item, index) => ({
            index,
            data: item,
            status: 'pending',
            attempts: 0,
            result: null,
            error: null
        })),
        options: {
            maxConcurrent: options.maxConcurrent || batchConfig.maxConcurrent,
            retryLimit: options.retryLimit || batchConfig.retryLimit,
            ...options
        },
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        progress: 0
    };

    batches.set(batchId, batch);
    return batch;
}

/**
 * 단일 아이템 처리 (시뮬레이션)
 */
async function processItem(batch, itemIndex) {
    const item = batch.items[itemIndex];
    item.status = 'processing';
    item.attempts++;

    try {
        // 처리 시간 시뮬레이션 (100-500ms)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

        // 랜덤 실패 시뮬레이션 (5% 확률)
        if (Math.random() < 0.05) {
            throw new Error('Random processing error');
        }

        // 타입별 처리 로직 (시뮬레이션)
        let result;
        switch (batch.type) {
            case 'wish_analysis':
                result = {
                    miracle_index: 50 + Math.floor(Math.random() * 51),
                    analyzed_at: new Date().toISOString()
                };
                break;
            case 'wish_image':
                result = {
                    image_url: `https://example.com/images/${item.data.wish_id || itemIndex}.png`,
                    generated_at: new Date().toISOString()
                };
                break;
            case 'message_ack':
            case 'message_7day':
            case 'message_campaign':
                result = {
                    sent: true,
                    message_id: `MSG-${Date.now()}-${itemIndex}`,
                    sent_at: new Date().toISOString()
                };
                break;
            case 'daily_report':
                result = {
                    report_generated: true,
                    metrics: { total: 100, processed: 95 }
                };
                break;
            case 'signal_scan':
                result = {
                    signal: ['green', 'yellow', 'red'][Math.floor(Math.random() * 3)],
                    scanned_at: new Date().toISOString()
                };
                break;
            default:
                result = { processed: true };
        }

        item.status = 'completed';
        item.result = result;
        batch.succeeded++;

    } catch (error) {
        // 재시도 가능한지 확인
        if (item.attempts < batch.options.retryLimit) {
            item.status = 'retry';
            item.error = error.message;
        } else {
            item.status = 'failed';
            item.error = error.message;
            batch.failed++;
        }
    }

    batch.processed++;
    batch.progress = Math.round((batch.processed / batch.total_items) * 100);
}

/**
 * 배치 실행
 */
async function executeBatch(batch) {
    batch.status = BATCH_STATUS.RUNNING;
    batch.started_at = new Date().toISOString();

    console.log(`[Batch] 시작: ${batch.batch_id} (${batch.total_items}개)`);

    const maxConcurrent = batch.options.maxConcurrent;

    // 청크 단위로 병렬 처리
    for (let i = 0; i < batch.items.length; i += maxConcurrent) {
        const chunk = batch.items.slice(i, i + maxConcurrent);
        const promises = chunk.map((_, idx) => processItem(batch, i + idx));
        await Promise.all(promises);

        // 진행 상황 로그
        if (batch.processed % 10 === 0 || batch.processed === batch.total_items) {
            console.log(`[Batch] ${batch.batch_id}: ${batch.progress}% (${batch.processed}/${batch.total_items})`);
        }
    }

    // 재시도 처리
    const retryItems = batch.items.filter(item => item.status === 'retry');
    for (const item of retryItems) {
        await processItem(batch, item.index);
    }

    // 완료 상태 결정
    batch.completed_at = new Date().toISOString();
    if (batch.failed === 0) {
        batch.status = BATCH_STATUS.COMPLETED;
    } else if (batch.succeeded === 0) {
        batch.status = BATCH_STATUS.FAILED;
    } else {
        batch.status = BATCH_STATUS.PARTIAL;
    }

    console.log(`[Batch] 완료: ${batch.batch_id} (성공: ${batch.succeeded}, 실패: ${batch.failed})`);

    return batch;
}

/**
 * 큐 프로세서
 */
async function processQueue() {
    if (isProcessing || batchQueue.length === 0) return;

    isProcessing = true;

    while (batchQueue.length > 0) {
        const batchId = batchQueue.shift();
        const batch = batches.get(batchId);

        if (batch && batch.status === BATCH_STATUS.PENDING) {
            await executeBatch(batch);
        }
    }

    isProcessing = false;
}

// ========== API 엔드포인트 ==========

/**
 * GET /api/batch/types
 * 배치 작업 유형 목록
 */
router.get('/types', (req, res) => {
    const types = Object.entries(BATCH_TYPES).map(([key, config]) => ({
        key,
        ...config
    }));

    res.json({
        success: true,
        count: types.length,
        types
    });
});

/**
 * POST /api/batch/create
 * 배치 작업 생성
 */
router.post('/create', (req, res) => {
    try {
        const { type, items, options } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                error: 'type is required',
                available_types: Object.keys(BATCH_TYPES)
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'items array is required and must not be empty'
            });
        }

        const batch = createBatch(type, items, options);

        console.log(`[Batch] 생성됨: ${batch.batch_id} (${items.length}개 아이템)`);

        res.json({
            success: true,
            batch_id: batch.batch_id,
            type: batch.type,
            total_items: batch.total_items,
            status: batch.status,
            message: 'Batch created. Use /api/batch/:id/start to execute.'
        });

    } catch (error) {
        console.error('[Batch] 생성 오류:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/batch/:id/start
 * 배치 작업 시작
 */
router.post('/:id/start', async (req, res) => {
    try {
        const batch = batches.get(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        if (batch.status !== BATCH_STATUS.PENDING) {
            return res.status(400).json({
                success: false,
                error: `Batch is already ${batch.status}`
            });
        }

        const { async: runAsync } = req.body;

        if (runAsync) {
            // 비동기 실행 (큐에 추가)
            batchQueue.push(batch.batch_id);
            processQueue(); // 큐 프로세서 시작

            res.json({
                success: true,
                batch_id: batch.batch_id,
                status: 'queued',
                message: 'Batch queued for execution. Use /api/batch/:id/status to check progress.'
            });
        } else {
            // 동기 실행
            await executeBatch(batch);

            res.json({
                success: true,
                batch_id: batch.batch_id,
                status: batch.status,
                total_items: batch.total_items,
                succeeded: batch.succeeded,
                failed: batch.failed,
                duration_ms: new Date(batch.completed_at) - new Date(batch.started_at)
            });
        }

    } catch (error) {
        console.error('[Batch] 시작 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/batch/:id/status
 * 배치 상태 조회
 */
router.get('/:id/status', (req, res) => {
    const batch = batches.get(req.params.id);

    if (!batch) {
        return res.status(404).json({
            success: false,
            error: 'Batch not found'
        });
    }

    res.json({
        success: true,
        batch_id: batch.batch_id,
        type: batch.type,
        type_name: batch.type_name,
        status: batch.status,
        progress: batch.progress,
        total_items: batch.total_items,
        processed: batch.processed,
        succeeded: batch.succeeded,
        failed: batch.failed,
        created_at: batch.created_at,
        started_at: batch.started_at,
        completed_at: batch.completed_at
    });
});

/**
 * GET /api/batch/:id/items
 * 배치 아이템 상세 조회
 */
router.get('/:id/items', (req, res) => {
    const batch = batches.get(req.params.id);

    if (!batch) {
        return res.status(404).json({
            success: false,
            error: 'Batch not found'
        });
    }

    const { status: filterStatus, limit = 50, offset = 0 } = req.query;

    let items = batch.items;
    if (filterStatus) {
        items = items.filter(item => item.status === filterStatus);
    }

    const paginatedItems = items.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
        success: true,
        batch_id: batch.batch_id,
        total_items: items.length,
        returned: paginatedItems.length,
        items: paginatedItems.map(item => ({
            index: item.index,
            status: item.status,
            attempts: item.attempts,
            result: item.result,
            error: item.error
        }))
    });
});

/**
 * POST /api/batch/:id/cancel
 * 배치 취소
 */
router.post('/:id/cancel', (req, res) => {
    const batch = batches.get(req.params.id);

    if (!batch) {
        return res.status(404).json({
            success: false,
            error: 'Batch not found'
        });
    }

    if (batch.status === BATCH_STATUS.COMPLETED || batch.status === BATCH_STATUS.CANCELLED) {
        return res.status(400).json({
            success: false,
            error: `Cannot cancel batch with status: ${batch.status}`
        });
    }

    batch.status = BATCH_STATUS.CANCELLED;
    batch.completed_at = new Date().toISOString();

    // 큐에서 제거
    const queueIndex = batchQueue.indexOf(batch.batch_id);
    if (queueIndex > -1) {
        batchQueue.splice(queueIndex, 1);
    }

    console.log(`[Batch] 취소됨: ${batch.batch_id}`);

    res.json({
        success: true,
        batch_id: batch.batch_id,
        status: batch.status,
        message: 'Batch cancelled'
    });
});

/**
 * GET /api/batch/list
 * 배치 목록 조회
 */
router.get('/list', (req, res) => {
    const { status: filterStatus, type: filterType, limit = 20 } = req.query;

    let batchList = Array.from(batches.values());

    if (filterStatus) {
        batchList = batchList.filter(b => b.status === filterStatus);
    }
    if (filterType) {
        batchList = batchList.filter(b => b.type === filterType);
    }

    batchList = batchList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, parseInt(limit));

    res.json({
        success: true,
        count: batchList.length,
        queue_length: batchQueue.length,
        batches: batchList.map(b => ({
            batch_id: b.batch_id,
            type: b.type,
            type_name: b.type_name,
            status: b.status,
            progress: b.progress,
            total_items: b.total_items,
            succeeded: b.succeeded,
            failed: b.failed,
            created_at: b.created_at
        }))
    });
});

/**
 * POST /api/batch/run-quick
 * 빠른 배치 실행 (생성 + 즉시 실행)
 */
router.post('/run-quick', async (req, res) => {
    try {
        const { type, items, options } = req.body;

        if (!type || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'type and items are required'
            });
        }

        const batch = createBatch(type, items, options);
        await executeBatch(batch);

        res.json({
            success: true,
            batch_id: batch.batch_id,
            type: batch.type,
            status: batch.status,
            total_items: batch.total_items,
            succeeded: batch.succeeded,
            failed: batch.failed,
            duration_ms: new Date(batch.completed_at) - new Date(batch.started_at),
            failed_items: batch.items
                .filter(item => item.status === 'failed')
                .map(item => ({
                    index: item.index,
                    error: item.error
                }))
        });

    } catch (error) {
        console.error('[Batch] run-quick 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/batch/stats
 * 배치 통계
 */
router.get('/stats', (req, res) => {
    const stats = {
        total_batches: batches.size,
        by_status: {},
        by_type: {},
        total_items_processed: 0,
        total_succeeded: 0,
        total_failed: 0,
        queue_length: batchQueue.length
    };

    for (const batch of batches.values()) {
        // 상태별
        stats.by_status[batch.status] = (stats.by_status[batch.status] || 0) + 1;

        // 타입별
        stats.by_type[batch.type] = (stats.by_type[batch.type] || 0) + 1;

        // 합계
        stats.total_items_processed += batch.processed;
        stats.total_succeeded += batch.succeeded;
        stats.total_failed += batch.failed;
    }

    res.json({
        success: true,
        stats
    });
});

module.exports = router;
