import html2canvas from 'html2canvas';
import { getVariant, track } from '../../../utils/experiment';
import { buildShareText } from '../constants/shareCopy';
import { gaShareClick, gaSaveClick } from '../../../utils/gtag';

const BASE_URL  = 'https://app.dailymiracles.kr';
const EXP_ID    = 'share_copy_v1';
const VARIANTS  = ['A', 'B', 'C'];

// 공유용 카드 캡처 (share-postcard) — blur 없는 초대장 버전
async function captureShareCard() {
  const target = document.getElementById('share-postcard');
  if (!target) return null;

  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 120));

  return html2canvas(target, {
    backgroundColor: null,
    scale: 3,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 5000,
    removeContainer: true,
  });
}

// 개인 카드 캡처 (dreamtown-postcard) — 화면 그대로 저장 (legacy, 미사용)
async function capturePersonalCard(setCaptureMode) {
  const target = document.getElementById('dreamtown-postcard');
  if (!target) return null;

  setCaptureMode(true);
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 120));

  const canvas = await html2canvas(target, {
    backgroundColor: null,
    scale: 3,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 5000,
    removeContainer: true,
  });

  setCaptureMode(false);
  return canvas;
}

export default function PostcardActions({ direction, onBack, setCaptureMode, message }) {
  // 공유 링크 — /intro?g={direction} 리텐션 루프
  const shareUrl = direction
    ? `${BASE_URL}/intro?g=${direction}`
    : `${BASE_URL}/intro`;

  // 카피 A/B/C 실험
  const variant   = getVariant(EXP_ID, VARIANTS);
  const shareText = buildShareText({ variant, direction, shareUrl });

  // 저장하기 — 공유용 카드(share-postcard) PNG 다운로드
  const handleSave = async () => {
    const canvas = await captureShareCard();
    if (!canvas) return;

    track('save_click', { direction });
    gaSaveClick({ direction });

    const link = document.createElement('a');
    link.download = `dreamtown-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 카톡으로 보내기 — 공유용 카드(share-postcard) 이미지 공유
  const handleShare = async () => {
    const canvas = await captureShareCard();
    if (!canvas) return;

    track('share_click', { experiment: EXP_ID, variant, direction });
    gaShareClick({ direction, method: 'native_share' });

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], 'dreamtown-postcard.png', { type: 'image/png' });

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      // 사용자 취소 등 무시
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-3 w-full max-w-sm">

      {/* 1순위 — 저장하기 */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-2xl bg-white/12 text-white font-medium tracking-wide hover:bg-white/18 active:bg-white/20 transition"
      >
        저장하기
      </button>

      {/* 2순위 — 카톡으로 보내기 */}
      <button
        type="button"
        onClick={handleShare}
        className="w-full py-3 rounded-2xl bg-white/7 text-white/85 hover:bg-white/12 active:bg-white/15 transition"
      >
        카톡으로 보내기
      </button>

      {/* 3순위 — 다시 보기 */}
      <button
        type="button"
        onClick={onBack}
        className="w-full py-2 rounded-2xl text-white/45 hover:text-white/65 transition text-sm"
      >
        다시 보기
      </button>

    </div>
  );
}
