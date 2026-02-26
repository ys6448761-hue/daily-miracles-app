/**
 * 소원 추적 서비스
 * 바이럴 루프 & 데이터 복리를 위한 핵심 서비스
 *
 * @purpose 하키스틱 성장 메커니즘 #2: 데이터 복리
 *
 * 주요 기능:
 * 1. 소원 등록 (wish_entries)
 * 2. 추적 질문 발송 (day7, day30, day90)
 * 3. 응답 수집 및 분석
 * 4. 성공 패턴 집계
 */

const crypto = require('crypto');

class WishTrackingService {
    constructor(pool) {
        this.pool = pool;

        // 추적 단계별 설정 (철학 DoD: 4단계 구조 - 과학적 근거 → 데이터 → 액션 → 따뜻한 톤)
        this.trackingStages = {
            day7: {
                days: 7,
                message: '[하루하루의 기적] AI 분석 데이터에 따르면, 7일째가 신경과학적으로 습관 형성의 첫 번째 전환점이에요. 지금까지의 변화를 함께 체크해볼까요?'
            },
            day30: {
                days: 30,
                message: '[하루하루의 기적] 30일 전 시작한 여정! 집단지성 데이터 기준, 이 시점에서 73%의 소원이들이 긍정적 변화를 경험했어요. 당신은 어떤가요?'
            },
            day90: {
                days: 90,
                message: '[하루하루의 기적] 90일, 대단한 여정이에요! 뇌과학 연구에 따르면 90일은 새로운 습관이 완전히 자리잡는 시점이에요. 당신의 기적을 들려주세요'
            }
        };

        // 소원 카테고리 키워드
        this.categoryKeywords = {
            health: ['건강', '다이어트', '운동', '체중', '금연', '금주', '수면', '몸', '체력'],
            career: ['취업', '이직', '승진', '사업', '창업', '직장', '업무', '일', '커리어', '면접'],
            relationship: ['연애', '결혼', '이별', '사랑', '친구', '가족', '부모', '자녀', '관계'],
            money: ['돈', '재정', '투자', '저축', '빚', '부자', '월급', '수입', '경제'],
            self: ['자기계발', '공부', '시험', '자격증', '영어', '학습', '성장', '습관'],
            other: []
        };
    }

    /**
     * 전화번호 해시 생성 (익명 분석용)
     */
    hashPhone(phone) {
        if (!phone) return null;
        return crypto.createHash('sha256').update(phone).digest('hex');
    }

    /**
     * 추적 토큰 생성
     */
    generateToken() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * 소원 카테고리 자동 분류
     */
    classifyWish(wishText) {
        const text = wishText.toLowerCase();

        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            if (category === 'other') continue;
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }

        return 'other';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 소원 등록
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 소원 등록 (DB에 저장)
     */
    async createWishEntry(data) {
        const {
            name,
            phone,
            wish_text,
            miracle_index,
            traffic_light,
            energy_type,
            gem_type,
            want_message,
            privacy_agreed,
            marketing_agreed,
            image_filename
        } = data;

        const phoneHash = this.hashPhone(phone);
        const wishCategory = this.classifyWish(wish_text);
        const trackingToken = this.generateToken();

        const query = `
            INSERT INTO wish_entries (
                name, phone, phone_hash, wish_text, wish_category,
                miracle_index, traffic_light, energy_type, gem_type,
                want_message, privacy_agreed, marketing_agreed, tracking_token,
                image_filename
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            name, phone, phoneHash, wish_text, wishCategory,
            miracle_index, traffic_light, energy_type, gem_type,
            want_message || false, privacy_agreed || false, marketing_agreed || false,
            trackingToken,
            image_filename || null
        ];

        try {
            const result = await this.pool.query(query, values);
            console.log(`[WishTracking] 소원 등록 완료: ID=${result.rows[0].id}, category=${wishCategory}`);
            return { success: true, entry: result.rows[0] };
        } catch (error) {
            console.error('[WishTracking] 소원 등록 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 소원 조회 (토큰으로)
     */
    async getWishByToken(token) {
        const query = `SELECT * FROM wish_entries WHERE tracking_token = $1`;
        const result = await this.pool.query(query, [token]);
        return result.rows[0] || null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 추적 질문 발송
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 추적 질문 발송 대상 조회
     */
    async getTrackingTargets(stage) {
        const stageConfig = this.trackingStages[stage];
        if (!stageConfig) {
            throw new Error(`Invalid tracking stage: ${stage}`);
        }

        // 해당 일수가 지난 소원 중 아직 추적 요청이 없는 것
        const query = `
            SELECT we.*
            FROM wish_entries we
            WHERE we.want_message = TRUE
              AND we.phone IS NOT NULL
              AND we.created_at <= NOW() - INTERVAL '${stageConfig.days} days'
              AND we.created_at > NOW() - INTERVAL '${stageConfig.days + 3} days'
              AND NOT EXISTS (
                  SELECT 1 FROM wish_tracking_requests wtr
                  WHERE wtr.wish_entry_id = we.id
                    AND wtr.tracking_stage = $1
              )
            ORDER BY we.created_at ASC
            LIMIT 100
        `;

        const result = await this.pool.query(query, [stage]);
        return result.rows;
    }

    /**
     * 추적 요청 생성
     */
    async createTrackingRequest(wishEntryId, stage, messageId = null) {
        const responseToken = this.generateToken();
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후 만료

        const query = `
            INSERT INTO wish_tracking_requests (
                wish_entry_id, phone_hash, tracking_stage,
                message_id, response_token, token_expires_at
            )
            SELECT
                $1,
                we.phone_hash,
                $2,
                $3,
                $4,
                $5
            FROM wish_entries we WHERE we.id = $1
            RETURNING *
        `;

        const result = await this.pool.query(query, [
            wishEntryId, stage, messageId, responseToken, tokenExpires
        ]);

        return result.rows[0];
    }

    /**
     * 추적 요청 조회 (토큰으로)
     */
    async getTrackingRequestByToken(token) {
        const query = `
            SELECT wtr.*, we.name, we.wish_text, we.miracle_index, we.wish_category
            FROM wish_tracking_requests wtr
            JOIN wish_entries we ON wtr.wish_entry_id = we.id
            WHERE wtr.response_token = $1
              AND wtr.token_expires_at > NOW()
              AND wtr.status != 'responded'
        `;

        const result = await this.pool.query(query, [token]);
        return result.rows[0] || null;
    }

    /**
     * 추적 요청 열람 기록
     */
    async markRequestOpened(requestId) {
        const query = `
            UPDATE wish_tracking_requests
            SET status = 'opened', opened_at = NOW()
            WHERE id = $1 AND status = 'sent'
            RETURNING *
        `;

        const result = await this.pool.query(query, [requestId]);
        return result.rows[0];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 응답 수집
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 추적 응답 저장
     */
    async saveTrackingResponse(data) {
        const {
            tracking_request_id,
            realized_status,
            realized_percent,
            what_helped,
            what_blocked,
            would_recommend,
            satisfaction,
            feedback,
            ip_address,
            user_agent
        } = data;

        // 트랜잭션 시작
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // 1. 응답 저장
            const responseQuery = `
                INSERT INTO wish_tracking_responses (
                    tracking_request_id, wish_entry_id,
                    realized_status, realized_percent,
                    what_helped, what_blocked, would_recommend,
                    satisfaction, feedback,
                    ip_address, user_agent
                )
                SELECT
                    $1,
                    wtr.wish_entry_id,
                    $2, $3, $4, $5, $6, $7, $8, $9, $10
                FROM wish_tracking_requests wtr
                WHERE wtr.id = $1
                RETURNING *
            `;

            const responseResult = await client.query(responseQuery, [
                tracking_request_id,
                realized_status,
                realized_percent || null,
                what_helped || null,
                what_blocked || null,
                would_recommend,
                satisfaction || null,
                feedback || null,
                ip_address || null,
                user_agent || null
            ]);

            // 2. 추적 요청 상태 업데이트
            await client.query(`
                UPDATE wish_tracking_requests
                SET status = 'responded', responded_at = NOW()
                WHERE id = $1
            `, [tracking_request_id]);

            await client.query('COMMIT');

            console.log(`[WishTracking] 응답 저장 완료: request=${tracking_request_id}, status=${realized_status}`);

            // 3. 성공 패턴 갱신 (백그라운드)
            this.updateSuccessPatterns().catch(err => {
                console.error('[WishTracking] 성공 패턴 갱신 실패:', err.message);
            });

            return { success: true, response: responseResult.rows[0] };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[WishTracking] 응답 저장 실패:', error.message);
            return { success: false, error: error.message };

        } finally {
            client.release();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 성공 패턴 분석
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 성공 패턴 집계 테이블 갱신
     */
    async updateSuccessPatterns() {
        const query = `
            INSERT INTO wish_success_patterns (
                wish_category, miracle_index_range, tracking_stage,
                total_count, realized_count, partial_count, not_yet_count, gave_up_count,
                success_rate, last_updated
            )
            SELECT
                we.wish_category,
                CASE
                    WHEN we.miracle_index BETWEEN 50 AND 59 THEN '50-59'
                    WHEN we.miracle_index BETWEEN 60 AND 69 THEN '60-69'
                    WHEN we.miracle_index BETWEEN 70 AND 79 THEN '70-79'
                    WHEN we.miracle_index BETWEEN 80 AND 89 THEN '80-89'
                    WHEN we.miracle_index BETWEEN 90 AND 100 THEN '90-100'
                    ELSE 'unknown'
                END as miracle_index_range,
                wtr.tracking_stage,
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE wtr2.realized_status = 'realized') as realized_count,
                COUNT(*) FILTER (WHERE wtr2.realized_status = 'partial') as partial_count,
                COUNT(*) FILTER (WHERE wtr2.realized_status = 'not_yet') as not_yet_count,
                COUNT(*) FILTER (WHERE wtr2.realized_status = 'gave_up') as gave_up_count,
                ROUND(
                    (COUNT(*) FILTER (WHERE wtr2.realized_status = 'realized') +
                     COUNT(*) FILTER (WHERE wtr2.realized_status = 'partial') * 0.5
                    ) * 100.0 / NULLIF(COUNT(*), 0),
                    2
                ) as success_rate,
                NOW()
            FROM wish_entries we
            JOIN wish_tracking_requests wtr ON we.id = wtr.wish_entry_id
            JOIN wish_tracking_responses wtr2 ON wtr.id = wtr2.tracking_request_id
            GROUP BY we.wish_category, miracle_index_range, wtr.tracking_stage
            ON CONFLICT (wish_category, miracle_index_range, tracking_stage)
            DO UPDATE SET
                total_count = EXCLUDED.total_count,
                realized_count = EXCLUDED.realized_count,
                partial_count = EXCLUDED.partial_count,
                not_yet_count = EXCLUDED.not_yet_count,
                gave_up_count = EXCLUDED.gave_up_count,
                success_rate = EXCLUDED.success_rate,
                last_updated = NOW()
        `;

        await this.pool.query(query);
        console.log('[WishTracking] 성공 패턴 갱신 완료');
    }

    /**
     * 카테고리별 성공률 조회
     */
    async getSuccessRateByCategory(category) {
        const query = `
            SELECT * FROM wish_success_patterns
            WHERE wish_category = $1
            ORDER BY tracking_stage, miracle_index_range
        `;

        const result = await this.pool.query(query, [category]);
        return result.rows;
    }

    /**
     * 전체 성공률 통계
     */
    async getOverallStats() {
        const query = `
            SELECT
                tracking_stage,
                SUM(total_count) as total,
                SUM(realized_count) as realized,
                SUM(partial_count) as partial,
                SUM(not_yet_count) as not_yet,
                SUM(gave_up_count) as gave_up,
                ROUND(
                    (SUM(realized_count) + SUM(partial_count) * 0.5) * 100.0 / NULLIF(SUM(total_count), 0),
                    1
                ) as overall_success_rate
            FROM wish_success_patterns
            GROUP BY tracking_stage
            ORDER BY tracking_stage
        `;

        const result = await this.pool.query(query);
        return result.rows;
    }

    /**
     * "비슷한 소원 N명 중 X% 성공" 메시지 생성
     */
    async getSimilarWishStats(category, miracleIndex) {
        const indexRange = this.getIndexRange(miracleIndex);

        const query = `
            SELECT * FROM wish_success_patterns
            WHERE wish_category = $1
              AND miracle_index_range = $2
              AND tracking_stage = 'day30'
        `;

        const result = await this.pool.query(query, [category, indexRange]);

        if (result.rows.length > 0 && result.rows[0].total_count >= 10) {
            const { total_count, success_rate } = result.rows[0];
            return {
                hasData: true,
                message: `비슷한 소원을 빈 ${total_count}명 중 ${success_rate}%가 실현했어요!`,
                total: total_count,
                successRate: success_rate
            };
        }

        return {
            hasData: false,
            message: '아직 충분한 데이터가 모이지 않았어요. 당신의 응답이 도움이 됩니다!'
        };
    }

    /**
     * 기적지수 범위 계산
     */
    getIndexRange(miracleIndex) {
        if (miracleIndex >= 90) return '90-100';
        if (miracleIndex >= 80) return '80-89';
        if (miracleIndex >= 70) return '70-79';
        if (miracleIndex >= 60) return '60-69';
        return '50-59';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 배치 작업용
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 만료된 토큰 정리
     */
    async cleanupExpiredTokens() {
        const query = `
            UPDATE wish_tracking_requests
            SET status = 'expired'
            WHERE token_expires_at < NOW()
              AND status IN ('sent', 'opened')
        `;

        const result = await this.pool.query(query);
        console.log(`[WishTracking] 만료 토큰 정리: ${result.rowCount}건`);
        return result.rowCount;
    }

    /**
     * 추적 발송 대기 건수 조회
     */
    async getPendingTrackingCount() {
        const counts = {};

        for (const stage of Object.keys(this.trackingStages)) {
            const targets = await this.getTrackingTargets(stage);
            counts[stage] = targets.length;
        }

        return counts;
    }
}

module.exports = WishTrackingService;
