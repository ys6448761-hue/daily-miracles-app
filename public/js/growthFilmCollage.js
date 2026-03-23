/**
 * 성장필름 콜라주 생성기 (AIL-105-P0)
 * Canvas API로 1080×1920 (9:16) 공유 카드 생성
 *
 * 패턴: shareCardGenerator.js 동일
 * ctx.roundRect 미지원 브라우저 대비 → _roundRect() 헬퍼 사용
 */

const GrowthFilmCollage = {
  W: 1080,
  H: 1920,
  THUMB_W: 480,
  THUMB_H: 480,
  GAP: 30,

  colors: {
    bg1: '#0f0a1e',
    bg2: '#1a1035',
    purple: '#9b87f5',
    pink: '#f5a7c6',
    gold: '#d4af37',
    white: '#ffffff',
    dim: 'rgba(10,5,20,0.65)'
  },

  /**
   * 콜라주 생성 (주 진입점)
   * @param {HTMLCanvasElement} canvas
   * @param {Object} filmData  - GET /api/challenge/:wishId/film 응답
   * @param {'my'|'share'} variant - 'my': 개인 보관용, 'share': 소셜 공유용
   * @returns {Promise<string>} dataURL (image/png)
   */
  async generate(canvas, filmData, variant = 'my') {
    canvas.width  = this.W;
    canvas.height = this.H;
    const ctx = canvas.getContext('2d');

    // 1. 배경
    this._drawBackground(ctx);

    // 2. 타이틀 (variant별 다른 텍스트)
    this._drawTitle(ctx, variant);

    // 3. Day 1/3/5/7 썸네일 그리드 (2×2)
    //    'my' 는 서브타이틀 추가로 그리드 시작 Y가 내려감
    const gridY = variant === 'my' ? 250 : 220;
    const thumbDays = [1, 3, 5, 7];
    const images = await this._loadThumbnails(filmData.base_image_url, thumbDays.length);
    this._drawGrid(ctx, filmData, thumbDays, images, gridY);

    // 그리드 하단 Y
    const gridBottom = gridY + this.THUMB_H * 2 + this.GAP;

    // 4. Day 7 action_line
    const day7 = filmData.days.find(d => d.day === 7);
    const hasActionLine = !!(day7 && day7.action_line);
    if (hasActionLine) {
      this._drawActionLine(ctx, day7.action_line, gridBottom + 90);
    }

    // 5. 피날레 문구
    this._drawFinale(ctx, gridBottom + (hasActionLine ? 280 : 130));

    // 6. 점수 요약
    this._drawScore(ctx, filmData.score, gridBottom + (hasActionLine ? 390 : 240));

    // 7. 브랜딩
    this._drawBranding(ctx, variant);

    return canvas.toDataURL('image/png', 1.0);
  },

  // ── 배경 ───────────────────────────────────────────────────────────────
  _drawBackground(ctx) {
    const { W, H } = this;

    // 다크 기본
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f0a1e');
    grad.addColorStop(0.5, '#1a1035');
    grad.addColorStop(1, '#12082a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 퍼플 글로우
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, W * 0.7);
    glow.addColorStop(0, 'rgba(155,135,245,0.12)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  },

  // ── 타이틀 ─────────────────────────────────────────────────────────────
  // variant='my'  : "7일의 성장 기록" + "당신의 실천이 만든 변화" 서브타이틀
  // variant='share': "🎬 7일 완주" + "Daily Miracles Challenge" 서브타이틀
  _drawTitle(ctx, variant = 'my') {
    const { W } = this;
    const y = variant === 'my' ? 110 : 100;

    ctx.save();
    ctx.textAlign = 'center';

    const titleGrad = ctx.createLinearGradient(W * 0.2, y, W * 0.8, y);
    titleGrad.addColorStop(0, '#c4aaff');
    titleGrad.addColorStop(1, '#f5a7c6');

    if (variant === 'share') {
      // Share 변형: 완주 배지 스타일
      ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = titleGrad;
      ctx.fillText('🎬 7일 완주', W / 2, y);

      ctx.font = '34px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(196,170,255,0.75)';
      ctx.fillText('Daily Miracles Challenge', W / 2, y + 52);

      ctx.strokeStyle = 'rgba(155,135,245,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.25, y + 80);
      ctx.lineTo(W * 0.75, y + 80);
      ctx.stroke();
    } else {
      // My 변형: 개인 성장 기록 타이틀
      ctx.font = 'bold 68px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = titleGrad;
      ctx.fillText('7일의 성장 기록', W / 2, y);

      ctx.font = '34px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(196,170,255,0.7)';
      ctx.fillText('당신의 실천이 만든 변화', W / 2, y + 52);

      ctx.strokeStyle = 'rgba(155,135,245,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.25, y + 80);
      ctx.lineTo(W * 0.75, y + 80);
      ctx.stroke();
    }

    ctx.restore();
  },

  // ── 썸네일 그리드 ──────────────────────────────────────────────────────
  _drawGrid(ctx, filmData, thumbDays, images, startY = 180) {
    const { W, THUMB_W, THUMB_H, GAP } = this;

    // 2×2 그리드, 수평 중앙 정렬
    const gridW = THUMB_W * 2 + GAP;
    const startX = (W - gridW) / 2;

    thumbDays.forEach((dayNum, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (THUMB_W + GAP);
      const y = startY + row * (THUMB_H + GAP);

      const img = images[i];
      const dayData = filmData.days.find(d => d.day === dayNum);
      const checkedIn = dayData && dayData.checked_in;

      // 썸네일 클리핑 (둥근 모서리)
      ctx.save();
      this._roundRect(ctx, x, y, THUMB_W, THUMB_H, 20);
      ctx.clip();

      if (img) {
        ctx.drawImage(img, x, y, THUMB_W, THUMB_H);
      } else {
        ctx.fillStyle = '#1a1035';
        ctx.fillRect(x, y, THUMB_W, THUMB_H);
      }

      // 미체크인 다크 오버레이
      if (!checkedIn) {
        ctx.fillStyle = this.colors.dim;
        ctx.fillRect(x, y, THUMB_W, THUMB_H);
      }

      ctx.restore();

      // 테두리
      ctx.save();
      this._roundRect(ctx, x, y, THUMB_W, THUMB_H, 20);
      ctx.strokeStyle = checkedIn
        ? 'rgba(155,135,245,0.5)'
        : 'rgba(155,135,245,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Day 라벨
      ctx.save();
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = checkedIn ? this.colors.purple : 'rgba(155,135,245,0.35)';
      ctx.textAlign = 'left';
      ctx.fillText(`Day ${dayNum}`, x + 14, y + THUMB_H - 14);
      ctx.restore();
    });
  },

  // ── Day 7 action_line ──────────────────────────────────────────────────
  _drawActionLine(ctx, text, y = 1310) {
    const { W } = this;
    const maxWidth = W * 0.78;

    ctx.save();
    ctx.font = '38px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(228,216,255,0.85)';
    ctx.textAlign = 'center';

    // 줄바꿈 처리
    const lines = this._wrapText(ctx, `"${text}"`, maxWidth);
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, y + i * 48);
    });
    ctx.restore();
  },

  // ── 피날레 문구 ────────────────────────────────────────────────────────
  _drawFinale(ctx, y = 1500) {
    const { W } = this;

    ctx.save();
    ctx.font = 'bold 52px -apple-system, sans-serif';
    ctx.fillStyle = this.colors.gold;
    ctx.textAlign = 'center';
    ctx.fillText('7일의 기록이 기적이 됩니다.', W / 2, y);
    ctx.restore();
  },

  // ── 점수 요약 ──────────────────────────────────────────────────────────
  _drawScore(ctx, score, y = 1620) {
    const { W } = this;

    ctx.save();
    ctx.font = '34px sans-serif';
    ctx.fillStyle = 'rgba(196,170,255,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(
      `체크인 ${score.checkin_count}  ·  응원 ${score.cheer_count}  ·  총점 ${score.total_points}`,
      W / 2,
      y
    );
    ctx.restore();
  },

  // ── 브랜딩 ─────────────────────────────────────────────────────────────
  // share 변형은 브랜딩을 더 돋보이게 (불투명도 높임)
  _drawBranding(ctx, variant = 'my') {
    const { W, H } = this;
    const y = H - 80;

    ctx.save();
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = variant === 'share'
      ? 'rgba(155,135,245,0.85)'
      : 'rgba(155,135,245,0.6)';
    ctx.fillText('Daily Miracles', W / 2, y);
    ctx.restore();
  },

  // ── 이미지 로드 ────────────────────────────────────────────────────────
  /**
   * 동일 base_image_url을 count장 로드 (썸네일은 모두 같은 이미지)
   */
  async _loadThumbnails(baseUrl, count) {
    const load = (src) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    return Promise.all(Array.from({ length: count }, () => load(baseUrl)));
  },

  // ── 둥근 사각형 (ctx.roundRect 미지원 대응) ───────────────────────────
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  // ── 텍스트 줄바꿈 ──────────────────────────────────────────────────────
  _wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    words.forEach(word => {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines;
  }
};
