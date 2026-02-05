/**
 * 실시간 카운터 서비스
 * 네트워크 효과를 위한 "함께하는 느낌" 제공
 *
 * @purpose 하키스틱 성장 메커니즘 #4: 네트워크 효과
 *
 * 주요 기능:
 * 1. 현재 접속자 수 (메모리 기반, 5분 TTL)
 * 2. 오늘 소원 수 (DB 기반)
 * 3. 이번 달 인기 카테고리
 * 4. 전체 누적 통계
 */

class LiveCounterService {
    constructor(pool) {
        this.pool = pool;

        // 메모리 기반 실시간 카운터 (Redis 대용)
        this.activeUsers = new Map(); // sessionId -> { lastSeen, page }
        this.wishingNow = new Map();  // sessionId -> timestamp (소원 작성 중)

        // 카운터 설정
        this.config = {
            activeUserTTL: 5 * 60 * 1000,    // 5분
            wishingTTL: 10 * 60 * 1000,       // 10분 (소원 작성 중)
            cleanupInterval: 60 * 1000        // 1분마다 정리
        };

        // 캐시 (DB 쿼리 최소화)
        this.cache = {
            todayStats: null,
            todayStatsUpdated: 0,
            monthlyStats: null,
            monthlyStatsUpdated: 0,
            totalStats: null,
            totalStatsUpdated: 0
        };

        this.cacheTTL = {
            today: 30 * 1000,      // 30초
            monthly: 5 * 60 * 1000, // 5분
            total: 10 * 60 * 1000   // 10분
        };

        // 정기 정리 시작
        this.startCleanup();

        console.log('[LiveCounter] 서비스 초기화 완료');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 실시간 접속자 관리 (메모리 기반)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 사용자 활동 기록 (heartbeat)
     */
    recordActivity(sessionId, page = 'unknown') {
        this.activeUsers.set(sessionId, {
            lastSeen: Date.now(),
            page
        });
    }

    /**
     * 소원 작성 시작
     */
    startWishing(sessionId) {
        this.wishingNow.set(sessionId, Date.now());
        this.recordActivity(sessionId, 'wish-form');
    }

    /**
     * 소원 작성 완료
     */
    finishWishing(sessionId) {
        this.wishingNow.delete(sessionId);
    }

    /**
     * 현재 활성 사용자 수
     */
    getActiveUserCount() {
        this.cleanupExpired();
        return this.activeUsers.size;
    }

    /**
     * 현재 소원 작성 중인 사용자 수
     */
    getWishingNowCount() {
        this.cleanupExpired();
        return this.wishingNow.size;
    }

    /**
     * 페이지별 활성 사용자 수
     */
    getActiveUsersByPage() {
        this.cleanupExpired();

        const pageCount = {};
        for (const [, data] of this.activeUsers) {
            const page = data.page || 'unknown';
            pageCount[page] = (pageCount[page] || 0) + 1;
        }

        return pageCount;
    }

    /**
     * 만료된 세션 정리
     */
    cleanupExpired() {
        const now = Date.now();

        // 활성 사용자 정리
        for (const [sessionId, data] of this.activeUsers) {
            if (now - data.lastSeen > this.config.activeUserTTL) {
                this.activeUsers.delete(sessionId);
            }
        }

        // 소원 작성 중 정리
        for (const [sessionId, timestamp] of this.wishingNow) {
            if (now - timestamp > this.config.wishingTTL) {
                this.wishingNow.delete(sessionId);
            }
        }
    }

    /**
     * 정기 정리 시작
     */
    startCleanup() {
        setInterval(() => {
            this.cleanupExpired();
        }, this.config.cleanupInterval);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DB 기반 통계 (캐시 적용)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 오늘 통계
     */
    async getTodayStats() {
        const now = Date.now();

        // 캐시 확인
        if (this.cache.todayStats && now - this.cache.todayStatsUpdated < this.cacheTTL.today) {
            return this.cache.todayStats;
        }

        try {
            // wish_entries 테이블이 있는 경우
            const result = await this.pool.query(`
                SELECT
                    COUNT(*) as total_wishes,
                    COUNT(DISTINCT phone_hash) as unique_users,
                    COUNT(*) FILTER (WHERE miracle_index >= 70) as high_index_count
                FROM wish_entries
                WHERE created_at >= CURRENT_DATE
            `);

            const stats = {
                totalWishes: parseInt(result.rows[0]?.total_wishes || 0),
                uniqueUsers: parseInt(result.rows[0]?.unique_users || 0),
                highIndexCount: parseInt(result.rows[0]?.high_index_count || 0),
                updatedAt: new Date().toISOString()
            };

            this.cache.todayStats = stats;
            this.cache.todayStatsUpdated = now;

            return stats;

        } catch (error) {
            // 테이블이 없는 경우 파일 기반 카운트 (fallback)
            console.warn('[LiveCounter] DB 쿼리 실패, 기본값 반환:', error.message);
            return this.getFallbackTodayStats();
        }
    }

    /**
     * 파일 기반 오늘 통계 (DB 없을 때 fallback)
     */
    async getFallbackTodayStats() {
        const fs = require('fs').promises;
        const path = require('path');

        try {
            const dataDir = path.join(__dirname, '..', 'data', 'wishes');
            const today = new Date().toISOString().split('T')[0];

            const files = await fs.readdir(dataDir);
            const todayFiles = files.filter(f => f.startsWith(today));

            return {
                totalWishes: todayFiles.length,
                uniqueUsers: todayFiles.length, // 대략적 추정
                highIndexCount: Math.floor(todayFiles.length * 0.3),
                updatedAt: new Date().toISOString(),
                source: 'file'
            };

        } catch (error) {
            return {
                totalWishes: 0,
                uniqueUsers: 0,
                highIndexCount: 0,
                updatedAt: new Date().toISOString(),
                source: 'default'
            };
        }
    }

    /**
     * 이번 달 통계
     */
    async getMonthlyStats() {
        const now = Date.now();

        // 캐시 확인
        if (this.cache.monthlyStats && now - this.cache.monthlyStatsUpdated < this.cacheTTL.monthly) {
            return this.cache.monthlyStats;
        }

        try {
            // 카테고리별 집계
            const categoryResult = await this.pool.query(`
                SELECT
                    wish_category,
                    COUNT(*) as count
                FROM wish_entries
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY wish_category
                ORDER BY count DESC
            `);

            // 총 건수
            const totalResult = await this.pool.query(`
                SELECT COUNT(*) as total
                FROM wish_entries
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `);

            const total = parseInt(totalResult.rows[0]?.total || 0);
            const categories = categoryResult.rows.map(row => ({
                category: row.wish_category,
                count: parseInt(row.count),
                percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0
            }));

            const stats = {
                total,
                categories,
                topCategory: categories[0] || null,
                updatedAt: new Date().toISOString()
            };

            this.cache.monthlyStats = stats;
            this.cache.monthlyStatsUpdated = now;

            return stats;

        } catch (error) {
            console.warn('[LiveCounter] 월간 통계 쿼리 실패:', error.message);
            return {
                total: 0,
                categories: [],
                topCategory: null,
                updatedAt: new Date().toISOString()
            };
        }
    }

    /**
     * 전체 누적 통계
     */
    async getTotalStats() {
        const now = Date.now();

        // 캐시 확인
        if (this.cache.totalStats && now - this.cache.totalStatsUpdated < this.cacheTTL.total) {
            return this.cache.totalStats;
        }

        try {
            const result = await this.pool.query(`
                SELECT
                    COUNT(*) as total_wishes,
                    COUNT(DISTINCT phone_hash) as total_users,
                    AVG(miracle_index) as avg_miracle_index,
                    MIN(created_at) as first_wish_at
                FROM wish_entries
            `);

            // 성공률 (추적 응답 기반)
            let successRate = null;
            try {
                const successResult = await this.pool.query(`
                    SELECT
                        COUNT(*) as total,
                        COUNT(*) FILTER (WHERE realized_status IN ('realized', 'partial')) as success
                    FROM wish_tracking_responses
                `);
                const total = parseInt(successResult.rows[0]?.total || 0);
                const success = parseInt(successResult.rows[0]?.success || 0);
                if (total >= 10) {
                    successRate = Math.round((success / total) * 100);
                }
            } catch (e) {
                // 추적 테이블 없으면 무시
            }

            const stats = {
                totalWishes: parseInt(result.rows[0]?.total_wishes || 0),
                totalUsers: parseInt(result.rows[0]?.total_users || 0),
                avgMiracleIndex: Math.round(parseFloat(result.rows[0]?.avg_miracle_index || 0)),
                successRate,
                firstWishAt: result.rows[0]?.first_wish_at,
                updatedAt: new Date().toISOString()
            };

            this.cache.totalStats = stats;
            this.cache.totalStatsUpdated = now;

            return stats;

        } catch (error) {
            console.warn('[LiveCounter] 전체 통계 쿼리 실패:', error.message);
            return {
                totalWishes: 0,
                totalUsers: 0,
                avgMiracleIndex: 0,
                successRate: null,
                updatedAt: new Date().toISOString()
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 통합 API용 메서드
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * 전체 실시간 통계 조회
     */
    async getLiveStats() {
        const [todayStats, monthlyStats, totalStats] = await Promise.all([
            this.getTodayStats(),
            this.getMonthlyStats(),
            this.getTotalStats()
        ]);

        return {
            realtime: {
                activeUsers: this.getActiveUserCount(),
                wishingNow: this.getWishingNowCount(),
                byPage: this.getActiveUsersByPage()
            },
            today: todayStats,
            monthly: monthlyStats,
            total: totalStats,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 프론트엔드용 간단 통계
     */
    async getSimpleStats() {
        const todayStats = await this.getTodayStats();
        const monthlyStats = await this.getMonthlyStats();

        return {
            // "지금 N명이 함께"
            activeNow: this.getActiveUserCount(),
            wishingNow: this.getWishingNowCount(),

            // "오늘 N명이 소원을 빌었어요"
            todayWishes: todayStats.totalWishes,

            // "이번 달 가장 많은 소원"
            topCategory: monthlyStats.topCategory ? {
                name: this.getCategoryLabel(monthlyStats.topCategory.category),
                percentage: monthlyStats.topCategory.percentage
            } : null,

            // "지금까지 N개의 소원"
            totalWishes: (await this.getTotalStats()).totalWishes,

            timestamp: new Date().toISOString()
        };
    }

    /**
     * 카테고리 한글 라벨
     */
    getCategoryLabel(category) {
        const labels = {
            health: '건강',
            career: '커리어',
            relationship: '관계',
            money: '재정',
            self: '자기계발',
            other: '기타'
        };
        return labels[category] || category;
    }

    /**
     * 카테고리 이모지
     */
    getCategoryEmoji(category) {
        const emojis = {
            health: '💪',
            career: '💼',
            relationship: '💕',
            money: '💰',
            self: '📚',
            other: '✨'
        };
        return emojis[category] || '✨';
    }
}

module.exports = LiveCounterService;
