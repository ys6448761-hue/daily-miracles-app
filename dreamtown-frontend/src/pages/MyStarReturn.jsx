import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * /my-star — 개인 복귀 진입점 (Personal Return)
 *
 * 정책:
 *  - localStorage에 별이 있으면 선택형 복귀 UI 노출
 *  - 강제 이동 없음 — "내 별로 복귀" 또는 "새 별 만들기" 선택
 *  - 별이 없으면 /intro로 (onboarding)
 */
export default function MyStarReturn() {
  const navigate = useNavigate();
  const [starId, setStarId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dt_active_star_id');
    if (!saved) {
      navigate('/intro', { replace: true });
      return;
    }
    setStarId(saved);
    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0D1B2A] px-6">
      <div className="mb-12 text-center">
        <div
          className="mx-auto mb-6 h-3 w-3 rounded-full bg-[#9B87F5]"
          style={{ boxShadow: '0 0 18px 5px rgba(155,135,245,0.4)' }}
        />
        <p className="text-sm text-white/50">이전에 만든 별이 있어요</p>
        <p className="mt-2 text-xs text-white/25">어떻게 할까요?</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => navigate(`/my-star/${starId}`)}
          className="w-full rounded-full bg-[#9B87F5] py-3.5 text-sm font-medium text-white"
        >
          내 별로 복귀
        </button>
        <button
          onClick={() => navigate('/intro')}
          className="w-full rounded-full border border-white/15 py-3.5 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          새 별 만들기
        </button>
      </div>
    </main>
  );
}
