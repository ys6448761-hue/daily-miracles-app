import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
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
  const nav = useNavigate();

  const { starName, starGalaxyName, starCreatedAt } = useDreamtownStore();

  const myStarId = localStorage.getItem('dt_star_id');

  // 저장하기 — share-postcard PNG 다운로드 (에러 시 무시)
  const handleSave = async () => {
    try {
      const canvas = await captureShareCard();
      if (!canvas) return;

      track('save_click', { direction });
      gaSaveClick({ direction });

      const link = document.createElement('a');
      link.download = `dreamtown-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (_) {
      // 저장 실패 시 조용히 무시 (모바일 환경에서 발생 가능)
    }
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

      {/* 1순위 — 내 별 보러 가기 */}
      {myStarId && (
        <button
          type="button"
          onClick={() => nav(`/my-star/${myStarId}`)}
          className="w-full py-4 rounded-2xl bg-dream-purple hover:bg-purple-500 text-white font-bold text-lg transition"
        >
          내 별 보러 가기 ✦
        </button>
      )}

      {/* 2순위 — 저장하기 */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-2xl bg-white/10 text-white/70 font-medium tracking-wide hover:bg-white/15 active:bg-white/20 transition text-sm"
      >
        저장하기
      </button>

      {/* 3순위 — 카톡으로 보내기 */}
      <button
        type="button"
        onClick={handleShare}
        className="w-full py-3 rounded-2xl bg-white/5 text-white/55 hover:bg-white/10 active:bg-white/12 transition text-sm"
      >
        카톡으로 보내기
      </button>

    </div>
  );
}
