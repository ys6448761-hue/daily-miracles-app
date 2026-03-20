import html2canvas from 'html2canvas';
import { getVariant, track } from '../../../utils/experiment';
import { gaShareClick, gaSaveClick } from '../../../utils/gtag';
import { sharePostcard } from '../../../utils/kakaoShare';
import { useDreamtownStore } from '../../../store/dreamtownStore';

// 공유용 카드 캡처 (share-postcard) — 저장하기 전용
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

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1,
  );
}

const EXP_ID   = 'share_copy_v1';
const VARIANTS = ['A', 'B', 'C'];

export default function PostcardActions({ direction, onBack, setCaptureMode }) {
  const variant = getVariant(EXP_ID, VARIANTS);

  const { starName, starGalaxyName, starCreatedAt } = useDreamtownStore();

  // 저장하기 — share-postcard PNG 다운로드
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

  // 카톡으로 보내기 — Kakao SDK 공유
  const handleShare = () => {
    track('share_click', { experiment: EXP_ID, variant, direction });
    gaShareClick({ direction, method: 'kakao_sdk' });

    sharePostcard({
      starName:   starName   ?? '이름 없는 별',
      galaxyName: starGalaxyName ?? '미지의 은하',
      dayCount:   calcDaysSinceBirth(starCreatedAt),
    });
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
