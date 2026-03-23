/**
 * 기적지수 공유 카드 생성기
 * Canvas API를 사용해 SNS 공유용 이미지를 자동 생성합니다.
 *
 * frontend-design 스킬 적용:
 * - Daily Miracles 브랜드 컬러
 * - 유기적 그라디언트 배경
 * - 독특한 타이포그래피
 * - 노이즈 텍스처 효과
 */

const ShareCardGenerator = {
    // 브랜드 컬러
    colors: {
        primary: '#9B87F5',
        secondary: '#F5A7C6',
        accent: '#6E59A5',
        deep: '#4A3B7C',
        background: '#FFF5F7',
        white: '#FFFFFF',
        gold: '#D4AF37'
    },

    // 카드 사이즈 프리셋
    sizes: {
        instagram: { width: 1080, height: 1080 },  // 인스타 피드
        instagramStory: { width: 1080, height: 1920 },  // 인스타 스토리
        kakao: { width: 800, height: 400 },  // 카카오톡 미리보기
        og: { width: 1200, height: 630 }  // Open Graph (링크 미리보기)
    },

    /**
     * 공유 카드 생성
     * @param {Object} data - 기적지수 데이터
     * @param {string} preset - 사이즈 프리셋 ('instagram', 'kakao', 'og')
     * @returns {Promise<string>} - Base64 이미지 데이터
     */
    async generate(data, preset = 'instagram') {
        const size = this.sizes[preset] || this.sizes.instagram;
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');

        // 1. 배경 그리기
        this.drawBackground(ctx, size);

        // 2. 노이즈 텍스처 오버레이
        this.drawNoiseOverlay(ctx, size);

        // 3. 장식 요소
        this.drawDecorations(ctx, size);

        // 4. 메인 콘텐츠
        await this.drawContent(ctx, size, data);

        // 5. CTA (Call to Action)
        this.drawCTA(ctx, size);

        // 6. 브랜드 워터마크
        this.drawWatermark(ctx, size);

        return canvas.toDataURL('image/png', 1.0);
    },

    /**
     * 그라디언트 배경
     */
    drawBackground(ctx, size) {
        const { width, height } = size;

        // 메인 그라디언트
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#FFF5F7');
        gradient.addColorStop(0.5, '#F8F0FF');
        gradient.addColorStop(1, '#FFF0F5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 유기적 원형 그라디언트 오버레이
        const circles = [
            { x: width * 0.2, y: height * 0.3, r: width * 0.4, color: 'rgba(155, 135, 245, 0.15)' },
            { x: width * 0.8, y: height * 0.2, r: width * 0.3, color: 'rgba(245, 167, 198, 0.2)' },
            { x: width * 0.5, y: height * 0.8, r: width * 0.35, color: 'rgba(110, 89, 165, 0.1)' }
        ];

        circles.forEach(circle => {
            const radialGradient = ctx.createRadialGradient(
                circle.x, circle.y, 0,
                circle.x, circle.y, circle.r
            );
            radialGradient.addColorStop(0, circle.color);
            radialGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = radialGradient;
            ctx.fillRect(0, 0, width, height);
        });
    },

    /**
     * 노이즈 텍스처 오버레이
     */
    drawNoiseOverlay(ctx, size) {
        const { width, height } = size;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 8;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }

        ctx.putImageData(imageData, 0, 0);
    },

    /**
     * 장식 요소
     */
    drawDecorations(ctx, size) {
        const { width, height } = size;

        // 상단 곡선 장식
        ctx.beginPath();
        ctx.moveTo(0, height * 0.15);
        ctx.bezierCurveTo(
            width * 0.3, height * 0.1,
            width * 0.7, height * 0.2,
            width, height * 0.12
        );
        ctx.lineTo(width, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();

        const topGradient = ctx.createLinearGradient(0, 0, width, height * 0.2);
        topGradient.addColorStop(0, this.colors.primary);
        topGradient.addColorStop(1, this.colors.secondary);
        ctx.fillStyle = topGradient;
        ctx.fill();

        // 반짝이는 별 장식
        const stars = [
            { x: width * 0.1, y: height * 0.25, size: 12 },
            { x: width * 0.85, y: height * 0.35, size: 8 },
            { x: width * 0.15, y: height * 0.7, size: 10 },
            { x: width * 0.9, y: height * 0.75, size: 14 }
        ];

        stars.forEach(star => {
            this.drawStar(ctx, star.x, star.y, star.size);
        });
    },

    /**
     * 별 그리기
     */
    drawStar(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);

        // 4갈래 별
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.moveTo(0, 0);
            ctx.lineTo(size * 0.3, size * 0.3);
            ctx.lineTo(0, size);
            ctx.lineTo(-size * 0.3, size * 0.3);
            ctx.lineTo(0, 0);
        }

        const starGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        starGradient.addColorStop(0, this.colors.gold);
        starGradient.addColorStop(1, 'rgba(212, 175, 55, 0.3)');
        ctx.fillStyle = starGradient;
        ctx.fill();

        ctx.restore();
    },

    /**
     * 메인 콘텐츠 (기적지수)
     */
    async drawContent(ctx, size, data) {
        const { width, height } = size;
        const { miracleIndex = 75, userName = '', wish = '' } = data;

        // 타이틀
        ctx.textAlign = 'center';
        ctx.fillStyle = this.colors.deep;

        // 타이틀 텍스트 (철학 반영: 과학적 근거 강조)
        ctx.font = `300 ${width * 0.035}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillText('AI 가능성 분석', width / 2, height * 0.28);

        // 기적지수 원형 디스플레이
        const circleY = height * 0.5;
        const circleRadius = width * 0.18;

        // 외곽 글로우
        ctx.shadowColor = this.colors.primary;
        ctx.shadowBlur = 40;

        // 그라디언트 원
        const circleGradient = ctx.createLinearGradient(
            width / 2 - circleRadius, circleY - circleRadius,
            width / 2 + circleRadius, circleY + circleRadius
        );
        circleGradient.addColorStop(0, this.colors.primary);
        circleGradient.addColorStop(1, this.colors.accent);

        ctx.beginPath();
        ctx.arc(width / 2, circleY, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = circleGradient;
        ctx.fill();

        // 그림자 리셋
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // 내부 테두리
        ctx.beginPath();
        ctx.arc(width / 2, circleY, circleRadius * 0.88, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 기적지수 숫자
        ctx.fillStyle = this.colors.white;
        ctx.font = `800 ${width * 0.12}px "Playfair Display", Georgia, serif`;
        ctx.fillText(miracleIndex.toString(), width / 2, circleY + width * 0.04);

        // "%" 라벨 (철학 반영: 가능성 퍼센트로 표현)
        ctx.font = `400 ${width * 0.025}px "Noto Sans KR", sans-serif`;
        ctx.fillText('%', width / 2, circleY + width * 0.09);

        // 사용자 이름 (있을 경우)
        if (userName) {
            ctx.fillStyle = this.colors.deep;
            ctx.font = `600 ${width * 0.04}px "Noto Sans KR", sans-serif`;
            ctx.fillText(`AI가 분석한 ${userName}님의 가능성`, width / 2, height * 0.72);
        }

        // 과학적 근거 문구 (철학 DoD 반영)
        ctx.fillStyle = this.colors.accent;
        ctx.globalAlpha = 0.8;
        ctx.font = `400 ${width * 0.022}px "Noto Sans KR", sans-serif`;
        if (wish) {
            ctx.fillText(`"${wish}"의 실현 가능성`, width / 2, height * 0.76);
        } else {
            ctx.fillText('5,000명의 데이터가 알려준 과학적 실현 확률', width / 2, height * 0.76);
        }
        ctx.globalAlpha = 1;

        // 응원 메시지
        const encouragement = this.getEncouragement(miracleIndex);
        ctx.fillStyle = this.colors.accent;
        ctx.font = `400 ${width * 0.028}px "Noto Sans KR", sans-serif`;

        // 긴 텍스트 줄바꿈
        const lines = this.wrapText(ctx, encouragement, width * 0.7);
        lines.forEach((line, index) => {
            ctx.fillText(line, width / 2, height * 0.78 + (index * width * 0.04));
        });
    },

    /**
     * 기적지수에 따른 응원 메시지
     */
    getEncouragement(index) {
        if (index >= 80) return '놀라운 가능성이 당신 안에 있어요!';
        if (index >= 60) return '긍정적인 변화가 시작되고 있어요!';
        if (index >= 40) return '꾸준한 실천이 기적을 만들어요!';
        return '작은 변화가 큰 기적이 됩니다!';
    },

    /**
     * 텍스트 줄바꿈
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        words.forEach(char => {
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    },

    /**
     * CTA (Call to Action)
     */
    drawCTA(ctx, size) {
        const { width, height } = size;

        // CTA 버튼 배경
        const btnWidth = width * 0.5;
        const btnHeight = height * 0.06;
        const btnX = (width - btnWidth) / 2;
        const btnY = height * 0.86;
        const btnRadius = btnHeight / 2;

        // 버튼 그라디언트
        const btnGradient = ctx.createLinearGradient(btnX, btnY, btnX + btnWidth, btnY);
        btnGradient.addColorStop(0, this.colors.secondary);
        btnGradient.addColorStop(1, this.colors.primary);

        // 둥근 사각형 그리기
        ctx.beginPath();
        ctx.moveTo(btnX + btnRadius, btnY);
        ctx.lineTo(btnX + btnWidth - btnRadius, btnY);
        ctx.arc(btnX + btnWidth - btnRadius, btnY + btnRadius, btnRadius, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(btnX + btnRadius, btnY + btnHeight);
        ctx.arc(btnX + btnRadius, btnY + btnRadius, btnRadius, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();

        ctx.fillStyle = btnGradient;
        ctx.fill();

        // CTA 텍스트 (철학 DoD: "무료" + "AI" 키워드 포함)
        ctx.fillStyle = this.colors.white;
        ctx.font = `600 ${width * 0.028}px "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('나의 가능성 무료 AI 분석 →', width / 2, btnY + btnHeight * 0.65);
    },

    /**
     * 브랜드 워터마크
     */
    drawWatermark(ctx, size) {
        const { width, height } = size;

        // 로고/브랜드명
        ctx.textAlign = 'center';
        ctx.fillStyle = this.colors.accent;
        ctx.globalAlpha = 0.7;
        ctx.font = `italic 400 ${width * 0.025}px "Playfair Display", Georgia, serif`;
        ctx.fillText('Daily Miracles', width / 2, height * 0.95);

        // URL
        ctx.font = `400 ${width * 0.018}px "Noto Sans KR", sans-serif`;
        ctx.fillText('dailymiracles.kr', width / 2, height * 0.975);

        ctx.globalAlpha = 1;
    },

    /**
     * 이미지 다운로드
     */
    download(dataUrl, filename = 'miracle-index-card.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    },

    /**
     * 공유 모달 표시
     */
    async showShareModal(data) {
        // 기존 모달 제거
        const existingModal = document.getElementById('share-card-modal');
        if (existingModal) existingModal.remove();

        // 추천인 코드 추출 (없으면 기본 URL)
        const refCode = data.refCode || '';
        const shareUrl = refCode
            ? `https://dailymiracles.kr/questions.html?ref=${refCode}`
            : 'https://dailymiracles.kr/questions.html';

        // 이미지 생성
        const imageData = await this.generate(data, 'instagram');

        // 모달 HTML
        const modal = document.createElement('div');
        modal.id = 'share-card-modal';
        modal.innerHTML = `
            <div class="share-modal-overlay">
                <div class="share-modal-content">
                    <button class="share-modal-close">&times;</button>
                    <h3>기적지수 공유하기</h3>
                    <div class="share-card-preview">
                        <img src="${imageData}" alt="기적지수 카드" />
                    </div>
                    <div class="share-buttons">
                        <button class="share-btn share-download" data-action="download">
                            <span>📥</span> 이미지 저장
                        </button>
                        <button class="share-btn share-kakao" data-action="kakao">
                            <span>💬</span> 카카오톡
                        </button>
                        <button class="share-btn share-instagram" data-action="instagram">
                            <span>📷</span> 인스타그램
                        </button>
                        <button class="share-btn share-copy" data-action="copy">
                            <span>🔗</span> 링크 복사
                        </button>
                    </div>
                    <p class="share-tip">💡 이미지를 저장한 후 SNS에 공유해보세요!</p>
                </div>
            </div>
            <style>
                .share-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    padding: 20px;
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .share-modal-content {
                    background: white;
                    border-radius: 24px;
                    padding: 32px;
                    max-width: 420px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: slideUp 0.3s ease;
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .share-modal-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                .share-modal-close:hover {
                    background: #f0f0f0;
                    color: #333;
                }
                .share-modal-content h3 {
                    text-align: center;
                    font-size: 22px;
                    color: #333;
                    margin-bottom: 24px;
                }
                .share-card-preview {
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(155, 135, 245, 0.2);
                    margin-bottom: 24px;
                }
                .share-card-preview img {
                    width: 100%;
                    display: block;
                }
                .share-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .share-btn {
                    padding: 14px 16px;
                    border-radius: 12px;
                    border: none;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .share-btn span {
                    font-size: 18px;
                }
                .share-download {
                    background: linear-gradient(135deg, #9B87F5, #6E59A5);
                    color: white;
                }
                .share-download:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(155, 135, 245, 0.4);
                }
                .share-kakao {
                    background: #FEE500;
                    color: #3C1E1E;
                }
                .share-kakao:hover {
                    background: #F5DC00;
                }
                .share-instagram {
                    background: linear-gradient(135deg, #833AB4, #E1306C, #F77737);
                    color: white;
                }
                .share-instagram:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(225, 48, 108, 0.4);
                }
                .share-copy {
                    background: #f0f0f0;
                    color: #333;
                }
                .share-copy:hover {
                    background: #e0e0e0;
                }
                .share-tip {
                    text-align: center;
                    font-size: 13px;
                    color: #888;
                }
            </style>
        `;

        document.body.appendChild(modal);

        // 이벤트 바인딩
        modal.querySelector('.share-modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.share-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) modal.remove();
        });

        // 공유 버튼 이벤트
        modal.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;

                switch (action) {
                    case 'download':
                        this.download(imageData, `기적지수-${data.miracleIndex}점.png`);
                        this.showToast('이미지가 저장되었습니다!');
                        break;

                    case 'kakao':
                        // 카카오 공유 (Kakao SDK 필요)
                        if (window.Kakao && window.Kakao.Share) {
                            window.Kakao.Share.sendDefault({
                                objectType: 'feed',
                                content: {
                                    title: `AI가 분석한 나의 가능성 ${data.miracleIndex}%`,
                                    description: '5,000명의 데이터 기반 과학적 실현 확률 분석',
                                    imageUrl: imageData,
                                    link: {
                                        mobileWebUrl: shareUrl,
                                        webUrl: shareUrl
                                    }
                                },
                                buttons: [{
                                    title: '나의 가능성 무료 AI 분석',
                                    link: {
                                        mobileWebUrl: shareUrl,
                                        webUrl: shareUrl
                                    }
                                }]
                            });
                        } else {
                            this.download(imageData);
                            this.showToast('이미지를 저장 후 카카오톡에서 공유해주세요!');
                        }
                        break;

                    case 'instagram':
                        this.download(imageData, `기적지수-${data.miracleIndex}점.png`);
                        this.showToast('이미지를 저장했어요! 인스타그램에서 공유해주세요.');
                        break;

                    case 'copy':
                        await navigator.clipboard.writeText(shareUrl);
                        this.showToast('링크가 복사되었습니다!');
                        break;
                }
            });
        });
    },

    /**
     * 토스트 메시지
     */
    showToast(message) {
        const existingToast = document.querySelector('.share-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'share-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 14px 28px;
            border-radius: 100px;
            font-size: 14px;
            z-index: 10001;
            animation: toastIn 0.3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes toastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
};

// 전역 export
window.ShareCardGenerator = ShareCardGenerator;
