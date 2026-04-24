/**
 * kakaoShare — 카카오 SDK 공유 유틸
 *
 * 환경변수: VITE_KAKAO_JS_KEY (Render 대시보드에서 설정)
 */
import { gaDtShareSuccess } from './gtag';

const DREAMTOWN_URL = 'https://app.dailymiracles.kr/dreamtown?entry=invite';
const OG_IMAGE_URL  = 'https://app.dailymiracles.kr/images/dreamtown-og-v4.jpg';

export function initKakao() {
  if (!window.Kakao) {
    console.error('[Kakao] ❌ window.Kakao 없음 — CDN 스크립트 로드 실패. index.html <script> 태그 확인');
    return false;
  }
  if (!window.Kakao.isInitialized()) {
    const key = import.meta.env.VITE_KAKAO_JS_KEY;
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
 * @param {{ starId: string, starName: string, wishText: string }} params
 */
export function shareStarDetail({ starId, starName = '나의 별', wishText = '' }) {
  const starUrl = `https://app.dailymiracles.kr/star/${starId}?source=share`;
  const desc = wishText
    ? `"${wishText.length > 30 ? wishText.slice(0, 30) + '…' : wishText}"`
    : '소원이 별이 되는 순간';

  try {
    if (!initKakao()) throw new Error('Kakao not available');

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title:       `⭐ "${starName}"`,
        description: `${desc} · 이 별에 마음을 나눠보세요`,
        imageUrl:    OG_IMAGE_URL,
        link: {
          mobileWebUrl: starUrl,
          webUrl:       starUrl,
        },
      },
      buttons: [
        {
          title: '별 보러 가기',
          link: {
            mobileWebUrl: starUrl,
            webUrl:       starUrl,
          },
        },
      ],
    });
    gaDtShareSuccess({ starId, method: 'kakao' });
  } catch {
    const text = `⭐ "${starName}"\n${desc}\n이 별에 마음을 나눠보세요\n${starUrl}`;
    if (navigator.share) {
      navigator.share({ title: starName, text, url: starUrl })
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
