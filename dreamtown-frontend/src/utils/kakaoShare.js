/**
 * kakaoShare — 카카오 SDK 공유 유틸
 *
 * 환경변수: VITE_KAKAO_JS_KEY (Render 대시보드에서 설정)
 */

const DREAMTOWN_URL = 'https://app.dailymiracles.kr/dreamtown?entry=invite';
const OG_IMAGE_URL  = 'https://app.dailymiracles.kr/images/dreamtown-og.jpg';

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
