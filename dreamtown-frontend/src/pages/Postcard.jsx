import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { track } from '../utils/experiment';
import PostcardView from '../features/galaxy/components/PostcardView';
import PostcardActions from '../features/galaxy/components/PostcardActions';

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

  const direction  = state?.direction  ?? null;
  const message    = state?.message    ?? '오늘은 조용히 빛나도 괜찮습니다';
  const growthLine = state?.growthLine ?? '';

  const tint = (direction && PAGE_TINT[direction]) || 'transparent';

  useEffect(() => {
    track('postcard_complete', { direction });
  }, []);

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center px-6 py-10"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${tint}, rgba(0,0,0,0) 70%), #070b14` }}
    >
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
    </div>
  );
}
