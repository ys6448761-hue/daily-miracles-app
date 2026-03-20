import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { track } from '../utils/experiment';
import { gaPostcardView } from '../utils/gtag';
import PostcardView from '../features/galaxy/components/PostcardView';
import PostcardActions from '../features/galaxy/components/PostcardActions';
import SharePostcard from '../features/galaxy/components/SharePostcard';
import { useDreamtownStore } from '../store/dreamtownStore';
import { POSTCARD_FALLBACK_MESSAGE } from '../constants/dreamtownFlow';
import { getStar } from '../api/dreamtown';

// 카드 배경 tint — PostcardView 주광원 색과 동일 계열, 극히 낮은 강도
const PAGE_TINT = {
  north: 'rgba(96,165,250,0.06)',
  east:  'rgba(245,158,11,0.07)',
  west:  'rgba(244,114,182,0.06)',
  south: 'rgba(52,211,153,0.06)',
};

export default function PostcardPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [captureMode, setCaptureMode] = useState(false);

  // location.state 우선, 없으면 store fallback (새로고침/직접 진입 대응)
  const store = useDreamtownStore();
  const direction  = state?.direction  ?? store.direction  ?? null;
  const message    = state?.message    ?? store.message    ?? POSTCARD_FALLBACK_MESSAGE;
  const growthLine = state?.growthLine ?? store.growthLine ?? '';

  // 별 데이터 — store 우선, 없으면 localStorage dt_star_id로 API 조회
  const [starName,       setStarName]       = useState(store.starName       ?? null);
  const [starGalaxyName, setStarGalaxyName] = useState(store.starGalaxyName ?? null);
  const [starCreatedAt,  setStarCreatedAt]  = useState(store.starCreatedAt  ?? null);

  const tint = (direction && PAGE_TINT[direction]) || 'transparent';

  useEffect(() => {
    track('postcard_complete', { direction });
    gaPostcardView({ direction });

    // store에 별 데이터 없으면 localStorage → API fallback
    if (!store.starName) {
      const starId = localStorage.getItem('dt_star_id');
      if (starId) {
        getStar(starId)
          .then((data) => {
            setStarName(data.star_name);
            setStarGalaxyName(data.galaxy?.name_ko ?? null);
            setStarCreatedAt(data.created_at);
            store.setStarData({
              starName:       data.star_name,
              starGalaxyName: data.galaxy?.name_ko ?? null,
              starCreatedAt:  data.created_at,
            });
          })
          .catch(() => { /* 별 없어도 postcard는 표시 */ });
      }
    }
  }, []);

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center px-6 py-10"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${tint}, rgba(0,0,0,0) 70%), #070b14` }}
    >
      {/* 화면용 개인 카드 */}
      <PostcardView
        direction={direction}
        message={message}
        growthLine={growthLine}
        captureMode={captureMode}
      />

      <PostcardActions
        direction={direction}
        onBack={() => navigate(-1)}
        setCaptureMode={setCaptureMode}
        message={message}
      />

      {/* 공유용 카드 — 화면 밖에 렌더, html2canvas 캡처 대상 */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}
      >
        <SharePostcard
          starName={starName}
          galaxyName={starGalaxyName}
          starCreatedAt={starCreatedAt}
          direction={direction}
        />
      </div>
    </div>
  );
}
