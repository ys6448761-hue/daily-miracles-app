/**
 * 실시간 카운터 위젯
 * 네트워크 효과를 위한 "함께하는 느낌" UI 컴포넌트
 *
 * @purpose 하키스틱 성장 메커니즘 #4: 네트워크 효과
 *
 * 사용법:
 * 1. <script src="/js/liveCounter.js"></script>
 * 2. <div id="live-counter"></div>
 * 3. LiveCounter.init() 또는 자동 초기화
 */

const LiveCounter = {
    // 설정
    config: {
        apiUrl: '/api/live/stats',
        heartbeatUrl: '/api/live/heartbeat',
        wishingUrl: '/api/live/wishing',
        updateInterval: 30000,     // 30초마다 업데이트
        heartbeatInterval: 60000,  // 1분마다 heartbeat
        containerId: 'live-counter',
        position: 'bottom-right',  // bottom-right, bottom-left, top-right, top-left, inline
        theme: 'light',            // light, dark, gradient
        showDetails: true,
        animate: true
    },

    // 상태
    state: {
        sessionId: null,
        data: null,
        initialized: false,
        updateTimer: null,
        heartbeatTimer: null
    },

    /**
     * 초기화
     */
    init(options = {}) {
        // 설정 병합
        Object.assign(this.config, options);

        // 세션 ID 생성/복구
        this.state.sessionId = this.getOrCreateSessionId();

        // 컨테이너 확인/생성
        this.ensureContainer();

        // 초기 데이터 로드
        this.fetchStats();

        // 주기적 업데이트 시작
        this.startAutoUpdate();

        // Heartbeat 시작
        this.startHeartbeat();

        // 페이지 이탈 시 정리
        window.addEventListener('beforeunload', () => this.cleanup());

        this.state.initialized = true;
        console.log('[LiveCounter] 초기화 완료');
    },

    /**
     * 세션 ID 생성/복구
     */
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('dm_session_id');
        if (!sessionId) {
            sessionId = 'ses_' + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('dm_session_id', sessionId);
        }
        return sessionId;
    },

    /**
     * 컨테이너 확인/생성
     */
    ensureContainer() {
        let container = document.getElementById(this.config.containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = this.config.containerId;
            document.body.appendChild(container);
        }

        // 위치 스타일 적용
        if (this.config.position !== 'inline') {
            container.style.cssText = this.getPositionStyle();
        }
    },

    /**
     * 위치 스타일
     */
    getPositionStyle() {
        const positions = {
            'bottom-right': 'position:fixed;bottom:20px;right:20px;z-index:9999;',
            'bottom-left': 'position:fixed;bottom:20px;left:20px;z-index:9999;',
            'top-right': 'position:fixed;top:20px;right:20px;z-index:9999;',
            'top-left': 'position:fixed;top:20px;left:20px;z-index:9999;'
        };
        return positions[this.config.position] || '';
    },

    /**
     * 통계 가져오기
     */
    async fetchStats() {
        try {
            const response = await fetch(this.config.apiUrl);
            const result = await response.json();

            if (result.success) {
                this.state.data = result.data;
                this.render();
            }
        } catch (error) {
            console.warn('[LiveCounter] 통계 로드 실패:', error.message);
            // 기본값으로 렌더링
            this.state.data = {
                activeNow: 1,
                wishingNow: 0,
                todayWishes: 0,
                topCategory: null,
                totalWishes: 0
            };
            this.render();
        }
    },

    /**
     * 렌더링
     */
    render() {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;

        const { data } = this.state;
        if (!data) return;

        const themeStyles = this.getThemeStyles();
        const animateClass = this.config.animate ? 'live-counter-animate' : '';

        container.innerHTML = `
            <style>
                .live-counter-widget {
                    font-family: 'Noto Sans KR', -apple-system, sans-serif;
                    font-size: 13px;
                    ${themeStyles.container}
                    border-radius: 16px;
                    padding: 14px 18px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    min-width: 200px;
                    transition: all 0.3s ease;
                }
                .live-counter-widget:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(155, 135, 245, 0.2);
                }
                .live-counter-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .live-counter-pulse {
                    width: 8px;
                    height: 8px;
                    background: #4CAF50;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                .live-counter-title {
                    ${themeStyles.title}
                    font-weight: 600;
                    font-size: 14px;
                }
                .live-counter-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .live-counter-stat {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    ${themeStyles.text}
                }
                .live-counter-stat .icon {
                    font-size: 14px;
                }
                .live-counter-stat .value {
                    font-weight: 700;
                    color: #9B87F5;
                }
                .live-counter-animate .live-counter-stat .value {
                    animation: countUp 0.5s ease-out;
                }
                @keyframes countUp {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .live-counter-footer {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid ${themeStyles.borderColor};
                    font-size: 11px;
                    ${themeStyles.footer}
                    text-align: center;
                }
                .live-counter-cta {
                    display: inline-block;
                    margin-top: 8px;
                    padding: 6px 12px;
                    background: linear-gradient(135deg, #9B87F5, #F5A7C6);
                    color: white;
                    text-decoration: none;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .live-counter-cta:hover {
                    transform: scale(1.05);
                }
            </style>
            <div class="live-counter-widget ${animateClass}">
                <div class="live-counter-header">
                    <span class="live-counter-pulse"></span>
                    <span class="live-counter-title">지금 함께하는 중</span>
                </div>
                <div class="live-counter-stats">
                    ${this.renderActiveUsers(data)}
                    ${this.renderTodayWishes(data)}
                    ${this.renderTopCategory(data)}
                </div>
                ${this.config.showDetails ? this.renderFooter(data) : ''}
            </div>
        `;
    },

    /**
     * 활성 사용자 렌더링
     */
    renderActiveUsers(data) {
        const count = data.activeNow || 1;
        const wishing = data.wishingNow || 0;

        let text = `<span class="value">${count}명</span>이 접속 중`;
        if (wishing > 0) {
            text += ` (${wishing}명 소원 작성 중)`;
        }

        return `
            <div class="live-counter-stat">
                <span class="icon">👥</span>
                <span>${text}</span>
            </div>
        `;
    },

    /**
     * 오늘 소원 수 렌더링
     */
    renderTodayWishes(data) {
        const count = data.todayWishes || 0;

        if (count === 0) {
            return `
                <div class="live-counter-stat">
                    <span class="icon">✨</span>
                    <span>오늘의 첫 번째 소원이 되어보세요!</span>
                </div>
            `;
        }

        return `
            <div class="live-counter-stat">
                <span class="icon">✨</span>
                <span>오늘 <span class="value">${count}명</span>이 소원을 빌었어요</span>
            </div>
        `;
    },

    /**
     * 인기 카테고리 렌더링
     */
    renderTopCategory(data) {
        if (!data.topCategory) return '';

        const { name, percentage } = data.topCategory;
        const emoji = this.getCategoryEmoji(name);

        return `
            <div class="live-counter-stat">
                <span class="icon">${emoji}</span>
                <span>이번 달 인기: <span class="value">${name}</span> (${percentage}%)</span>
            </div>
        `;
    },

    /**
     * 푸터 렌더링
     */
    renderFooter(data) {
        const total = data.totalWishes || 0;

        return `
            <div class="live-counter-footer">
                지금까지 ${total.toLocaleString()}개의 소원이 빌어졌어요
                <br>
                <a href="./questions.html" class="live-counter-cta">나도 소원 빌기 ✨</a>
            </div>
        `;
    },

    /**
     * 테마 스타일
     */
    getThemeStyles() {
        const themes = {
            light: {
                container: 'background: white; border: 1px solid rgba(155, 135, 245, 0.2);',
                title: 'color: #333;',
                text: 'color: #666;',
                footer: 'color: #888;',
                borderColor: 'rgba(0, 0, 0, 0.1)'
            },
            dark: {
                container: 'background: #1a1a2e; border: 1px solid rgba(155, 135, 245, 0.3);',
                title: 'color: #fff;',
                text: 'color: rgba(255, 255, 255, 0.8);',
                footer: 'color: rgba(255, 255, 255, 0.6);',
                borderColor: 'rgba(255, 255, 255, 0.1)'
            },
            gradient: {
                container: 'background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,245,247,0.95)); border: 1px solid rgba(155, 135, 245, 0.3);',
                title: 'color: #6E59A5;',
                text: 'color: #555;',
                footer: 'color: #888;',
                borderColor: 'rgba(155, 135, 245, 0.2)'
            }
        };
        return themes[this.config.theme] || themes.light;
    },

    /**
     * 카테고리 이모지
     */
    getCategoryEmoji(name) {
        const emojis = {
            '건강': '💪',
            '커리어': '💼',
            '관계': '💕',
            '재정': '💰',
            '자기계발': '📚'
        };
        return emojis[name] || '✨';
    },

    /**
     * 자동 업데이트 시작
     */
    startAutoUpdate() {
        if (this.state.updateTimer) {
            clearInterval(this.state.updateTimer);
        }

        this.state.updateTimer = setInterval(() => {
            this.fetchStats();
        }, this.config.updateInterval);
    },

    /**
     * Heartbeat 시작
     */
    startHeartbeat() {
        if (this.state.heartbeatTimer) {
            clearInterval(this.state.heartbeatTimer);
        }

        // 즉시 한 번 전송
        this.sendHeartbeat();

        // 주기적 전송
        this.state.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat();
        }, this.config.heartbeatInterval);
    },

    /**
     * Heartbeat 전송
     */
    async sendHeartbeat() {
        try {
            await fetch(this.config.heartbeatUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.state.sessionId,
                    page: window.location.pathname
                })
            });
        } catch (error) {
            // 무시 (네트워크 오류)
        }
    },

    /**
     * 소원 작성 시작 알림
     */
    async notifyWishingStart() {
        try {
            await fetch(this.config.wishingUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.state.sessionId,
                    action: 'start'
                })
            });
        } catch (error) {
            // 무시
        }
    },

    /**
     * 소원 작성 완료 알림
     */
    async notifyWishingFinish() {
        try {
            await fetch(this.config.wishingUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.state.sessionId,
                    action: 'finish'
                })
            });
        } catch (error) {
            // 무시
        }
    },

    /**
     * 정리
     */
    cleanup() {
        if (this.state.updateTimer) {
            clearInterval(this.state.updateTimer);
        }
        if (this.state.heartbeatTimer) {
            clearInterval(this.state.heartbeatTimer);
        }
    },

    /**
     * 위젯 숨기기
     */
    hide() {
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.style.display = 'none';
        }
    },

    /**
     * 위젯 보이기
     */
    show() {
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.style.display = 'block';
        }
    }
};

// 자동 초기화 (DOMContentLoaded 후)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // live-counter 요소가 있으면 자동 초기화
        if (document.getElementById('live-counter')) {
            LiveCounter.init();
        }
    });
} else {
    // 이미 로드됨
    if (document.getElementById('live-counter')) {
        LiveCounter.init();
    }
}

// 전역 export
window.LiveCounter = LiveCounter;
