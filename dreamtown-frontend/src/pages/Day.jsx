import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DayLogScreen from '../features/galaxy/components/DayLogScreen';
import { saveLog } from '../features/galaxy/utils/logStorage';

// Before → Transition → After  (0ms / 800ms / 1600ms)
// 감정 흐름이 끊기지 않도록 반드시 유지
export default function DayPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('before'); // before | transitioning | after

  const direction = state?.direction;
  const message = state?.message;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transitioning'), 800);
    const t2 = setTimeout(() => setPhase('after'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">

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
