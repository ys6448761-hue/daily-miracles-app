/**
 * kakaoShare — 카카오 SDK 공유 유틸
 *
 * 환경변수: VITE_KAKAO_JS_KEY (Render 대시보드에서 설정)
 */
import { gaDtShareSuccess } from './gtag';

const DREAMTOWN_URL = 'https://app.dailymiracles.kr/dreamtown?entry=invite';
const OG_IMAGE_URL  = 'https://app.dailymiracles.kr/images/dreamtown-og-v4.jpg';

function initKakao() {
  if (!window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    const key = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!key) return false;
    window.Kakao.init(key);
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
