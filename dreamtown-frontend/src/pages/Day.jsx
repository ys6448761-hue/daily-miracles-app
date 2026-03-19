import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DayLogScreen from '../features/galaxy/components/DayLogScreen';
import { saveLog } from '../features/galaxy/utils/logStorage';

// 선택 은하 잔광 — SelectionTransition 색계열 절반 강도
const AFTERGLOW_COLOR = {
  north: 'rgba(96,165,250,0.10)',
  east:  'rgba(245,158,11,0.13)',
  west:  'rgba(244,114,182,0.10)',
  south: 'rgba(52,211,153,0.10)',
};

// Before → Transition → After  (0ms / 800ms / 1600ms)
// 감정 흐름이 끊기지 않도록 반드시 유지
export default function DayPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('before'); // before | transitioning | after
  const [afterglow, setAfterglow] = useState(true); // 진입 잔광

  const direction = state?.direction;
  const message = state?.message;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transitioning'), 800);
    const t2 = setTimeout(() => setPhase('after'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // 60ms 후 잔광 fade-out 시작 (CSS transition 1.4s)
  useEffect(() => {
    const t = setTimeout(() => setAfterglow(false), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">

      {/* 진입 잔광 — 선택 은하 색이 약하게 이어짐 */}
      {direction && AFTERGLOW_COLOR[direction] && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: AFTERGLOW_COLOR[direction],
            opacity: afterglow ? 1 : 0,
            transition: 'opacity 1.4s ease-out',
            zIndex: 5,
          }}
        />
      )}

      {/* Before / Transition — 메시지 전면 */}
      <div
        className="absolute inset-0 flex items-center justify-center px-8 text-center pointer-events-none"
        style={{
          opacity: phase === 'after' ? 0 : 1,
          transition: 'opacity 800ms ease-in-out',
          zIndex: 20,
        }}
      >
        <p className="text-xl leading-relaxed opacity-90">{message}</p>
      </div>

      {/* After — 로그 UI */}
      <div
        style={{
          opacity: phase === 'after' ? 1 : 0,
          transition: 'opacity 600ms ease-in-out',
        }}
      >
        {/* 상단 문장 잔류 */}
        <div className="absolute top-20 w-full text-center opacity-60 text-sm pointer-events-none">
          {message}
        </div>

        <DayLogScreen
          direction={direction}
          onComplete={(log) => {
            const saved = saveLog({
              direction,
              message,
              ...log,
            });

            navigate('/postcard', {
              state: {
                message,
                growthLine: saved.growthLine,
              },
            });
          }}
        />
      </div>
    </div>
  );
}
