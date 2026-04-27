/**
 * kakaoShare — 카카오 SDK 공유 유틸
 *
 * 환경변수: VITE_KAKAO_JS_KEY (Render 대시보드에서 설정)
 *
 * KAKAO_ENABLED: Kakao Developers 플랫폼 도메인 등록 + JS Key 검증 완료 후 true로 변경
 *   체크리스트:
 *   1. https://developers.kakao.com → 내 앱 → 플랫폼 → Web → https://app.dailymiracles.kr 등록
 *   2. 앱 키 → JavaScript 키 복사 (REST API 키 아님)
 *   3. Render 환경변수 VITE_KAKAO_JS_KEY = 위 JS 키
 */
const KAKAO_ENABLED = true;

import { gaDtShareSuccess } from './gtag';

const DREAMTOWN_URL = 'https://app.dailymiracles.kr/dreamtown?entry=invite';
const OG_IMAGE_URL  = 'https://app.dailymiracles.kr/images/dreamtown-og-v4.jpg';

// ── 별 공유 썸네일 3종 (public/og/) ───────────────────────────────────────
const BASE = 'https://app.dailymiracles.kr/og';
const STAR_THUMBNAILS = {
  courage: `${BASE}/star-courage.png`, // 보라 — 용기/도전/꿈
  rest:    `${BASE}/star-rest.png`,    // 청록 — 쉬고 싶음/지침/힐링
  clarity: `${BASE}/star-clarity.png`, // 금빛 — 정리/결심/감사
};

// wish_text 키워드 → 썸네일 자동 매칭
function pickStarThumbnail(wishText = '') {
  const t = wishText;
  if (/용기|도전|두렵|무서|겁나|꿈|열고|시작|시작하|바꾸|이루|성공|취업|직장/.test(t)) return STAR_THUMBNAILS.courage;
  if (/쉬|쉽|힘들|지쳐|지침|아프|아파|회복|혼자|외로|힐링|여행|떠나|바다|카페|여유/.test(t)) return STAR_THUMBNAILS.rest;
  if (/정리|결심|감사|고마|가족|관계|사랑|고백|연인|행복|건강|소중|감사/.test(t)) return STAR_THUMBNAILS.clarity;
  return STAR_THUMBNAILS.courage; // 기본값
}

export function initKakao() {
  if (!KAKAO_ENABLED) {
    console.info('[Kakao] 비활성 (KAKAO_ENABLED=false) — navigator.share/clipboard fallback 사용');
    return false;
  }
  if (!window.Kakao) {
    console.error('[Kakao] ❌ window.Kakao 없음 — CDN 스크립트 로드 실패. index.html <script> 태그 확인');
    return false;
  }
  if (!window.Kakao.isInitialized()) {
    const key = import.meta.env.VITE_KAKAO_JS_KEY || '8557586f56efb74719c1738c31beda97';
    if (!key) {
      console.error('[Kakao] ❌ VITE_KAKAO_JS_KEY 미설정 — dreamtown-frontend/.env 또는 Render 대시보드 환경변수 확인');
      return false;
    }
    try {
      window.Kakao.init(key);
    } catch (e) {
      console.error('[Kakao] ❌ Kakao.init() 실패:', e.message, '| key 앞 6자:', key.slice(0, 6));
      return false;
    }
    if (!window.Kakao.isInitialized()) {
      console.error('[Kakao] ❌ init() 호출 후에도 isInitialized=false — JavaScript 키 타입 확인 (네이티브/REST 키는 사용 불가)');
      return false;
    }
    console.log('[Kakao] ✅ init 완료 | key 앞 6자:', key.slice(0, 6));
  }
  return true;
}

/**
 * @param {{ starId: string, starName: string, wishText: string }} params
 */
export function shareStarBirth({ starId, starName = '나의 별', wishText = '' }) {
  const inviteUrl = `https://app.dailymiracles.kr/dreamtown?entry=invite&starId=${starId}`;
  const desc = wishText
    ? `"${wishText.length > 30 ? wishText.slice(0, 30) + '…' : wishText}"`
    : '소원이 별이 되는 순간';

  try {
    if (!initKakao()) throw new Error('Kakao not available');

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title:       `"${starName}"`,
        description: `${desc} · 드림타운에서 당신의 별도 만들어보세요`,
        imageUrl:    OG_IMAGE_URL,
        link: {
          mobileWebUrl: inviteUrl,
          webUrl:       inviteUrl,
        },
      },
      buttons: [
        {
          title: '별 구경하기',
          link: {
            mobileWebUrl: inviteUrl,
            webUrl:       inviteUrl,
          },
        },
      ],
    });
    // Kakao SDK는 fire-and-forget — 다이얼로그 노출이 곧 성공 의도
    gaDtShareSuccess({ starId, method: 'kakao' });
  } catch {
    const text = `"${starName}" — ${desc}\n드림타운에서 당신의 별도 만들어보세요\n${inviteUrl}`;
    if (navigator.share) {
      navigator.share({ text })
        .then(() => gaDtShareSuccess({ starId, method: 'native' }))
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      gaDtShareSuccess({ starId, method: 'clipboard' });
    }
  }
}

/**
 * @param {{ starId: string, wishText: string }} params
 */
export function shareStarDetail({ starId, wishText = '' }) {
  const starUrl   = `https://app.dailymiracles.kr/star/${starId}`;
  const thumbnail = pickStarThumbnail(wishText);
  const truncated = wishText.length > 40 ? wishText.slice(0, 40) + '…' : wishText;
  const desc = truncated
    ? `"${truncated}"\n이 순간이 별로 남았습니다. 함께 이어가볼까요?`
    : '이 순간이 별로 남았습니다. 함께 이어가볼까요?';

  try {
    if (!initKakao()) throw new Error('Kakao not available');

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title:       '여수에서 시작된 하나의 마음 ✨',
        description: desc,
        imageUrl:    thumbnail,
        link: {
          mobileWebUrl: starUrl,
          webUrl:       starUrl,
        },
      },
      buttons: [
        {
          title: '별 보러가기',
          link: {
            mobileWebUrl: starUrl,
            webUrl:       starUrl,
          },
        },
      ],
    });
    gaDtShareSuccess({ starId, method: 'kakao' });
  } catch {
    const text = `여수에서 시작된 하나의 마음 ✨\n${desc}\n${starUrl}`;
    if (navigator.share) {
      navigator.share({ title: '여수에서 시작된 하나의 마음 ✨', text, url: starUrl })
        .then(() => gaDtShareSuccess({ starId, method: 'native' }))
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      gaDtShareSuccess({ starId, method: 'clipboard' });
    }
  }
}

/**
 * @param {{ starName: string, galaxyName: string, dayCount: number }} params
 */
export function sharePostcard({ starName = '이름 없는 별', galaxyName = '미지의 은하', dayCount = 1 }) {
  try {
    if (!initKakao()) throw new Error('Kakao not available');

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title:       `"${starName}"`,
        description: `${galaxyName} · D+${dayCount}일째 · 당신의 소원은 어떤 별이 될까요?`,
        imageUrl:    OG_IMAGE_URL,
        link: {
          mobileWebUrl: DREAMTOWN_URL,
          webUrl:       DREAMTOWN_URL,
        },
      },
      buttons: [
        {
          title: '내 별 만들기',
          link: {
            mobileWebUrl: DREAMTOWN_URL,
            webUrl:       DREAMTOWN_URL,
          },
        },
      ],
    });
  } catch {
    // Kakao SDK 미로딩 or 키 미설정 — navigator.share fallback
    const text = `"${starName}" — ${galaxyName} · D+${dayCount}일째\n당신의 소원은 어떤 별이 될까요?\n${DREAMTOWN_URL}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  }
}
