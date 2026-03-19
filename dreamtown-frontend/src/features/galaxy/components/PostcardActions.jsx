import html2canvas from 'html2canvas';
import { getVariant, track } from '../../../utils/experiment';
import { buildShareText } from '../constants/shareCopy';

const BASE_URL  = 'https://app.dailymiracles.kr';
const EXP_ID    = 'share_copy_v1';
const VARIANTS  = ['A', 'B', 'C'];

// 카드 캡처 → canvas 반환 (저장 + 공유 공통 사용)
async function captureCard(setCaptureMode) {
  const target = document.getElementById('dreamtown-postcard');
  if (!target) return null;

  setCaptureMode(true);
  await new Promise((r) => setTimeout(r, 50));

  const canvas = await html2canvas(target, {
    backgroundColor: null,
    scale: 3,
    useCORS: true,
    logging: false,
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

  // 저장하기 — PNG 다운로드
  const handleSave = async () => {
    const canvas = await captureCard(setCaptureMode);
    if (!canvas) return;

    track('save_click', { direction });

    const link = document.createElement('a');
    link.download = `dreamtown-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 카톡으로 보내기 — 이미지 파일 공유 우선, 텍스트 fallback
  const handleShare = async () => {
    const canvas = await captureCard(setCaptureMode);
    if (!canvas) return;

    track('share_click', {
      experiment: EXP_ID,
      variant,
      direction,
    });

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
