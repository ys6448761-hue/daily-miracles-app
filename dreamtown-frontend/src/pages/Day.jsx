import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DayLogScreen from '../features/galaxy/components/DayLogScreen';
import { saveLog } from '../features/galaxy/utils/logStorage';

// 소원이 실루엣 aura 색상 — 잔광보다 약간 강한 존재감
const SILHOUETTE_AURA = {
  north: 'rgba(96,165,250,0.14)',
  east:  'rgba(245,158,11,0.16)',
  west:  'rgba(244,114,182,0.14)',
  south: 'rgba(52,211,153,0.14)',
};

// 소원이 실루엣 — 선택 색 aura + 흰 발광 형태, 텍스트 뒤에 위치
function DaySilhouette({ direction, phase }) {
  if (!direction || !SILHOUETTE_AURA[direction]) return null;
  const aura = SILHOUETTE_AURA[direction];

  return (
    // 외부: phase 기반 fade-out (before→after 800ms)
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: phase === 'after' ? 0 : 1,
        transition: 'opacity 800ms ease-in-out',
      }}
    >
      {/* 내부: seep-in 2.5s — 색이 서서히 스며듦 */}
      <div className="animate-seep absolute inset-0">

        {/* ① 방향 색 aura — 넓고 흐린 발광 타원 */}
        <div
          className="absolute"
          style={{
            top: '50%', left: '50%',
            width: 200, height: 280,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse at 50% 38%, ${aura} 0%, transparent 68%)`,
            filter: 'blur(48px)',
          }}
        />

        {/* ② 흰 실루엣 형태 — 존재감만 남긴 발광 */}
        <div
          className="absolute"
          style={{
            top: '50%', left: '50%',
            width: 60, height: 90,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 60%, transparent 80%)',
            filter: 'blur(14px)',
          }}
        />

      </div>
    </div>
  );
}

// 선택 은하 잔광 색상 — SelectionTransition 동일 계열
const GALAXY_OVERLAY = {
  north: 'rgba(96,165,250,0.12)',
  east:  'rgba(245,158,11,0.14)',
  west:  'rgba(244,114,182,0.12)',
  south: 'rgba(52,211,153,0.12)',
};

// 잔광 컴포넌트 — 시작은 "조금 보인다", 끝은 "완전히 사라진다"
function DayAfterglow({ galaxy }) {
  if (!galaxy || !GALAXY_OVERLAY[galaxy]) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 animate-afterglow"
      style={{ background: GALAXY_OVERLAY[galaxy] }}
    />
  );
}

// Before → Transition → After  (0ms / 800ms / 1600ms)
// 감정 흐름이 끊기지 않도록 반드시 유지
export default function DayPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('before'); // before | transitioning | after

  const direction = state?.direction;
  const message   = state?.message;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transitioning'), 800);
    const t2 = setTimeout(() => setPhase('after'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <main className="relative w-full h-screen bg-black text-white overflow-hidden">

      {/* 진입 잔광 — 선택 은하 색이 약하게 이어지다 1.8s 후 소멸 */}
      <DayAfterglow galaxy={direction} />

      <div className="relative z-10 w-full h-full">

        {/* 소원이 실루엣 — 메시지 텍스트 뒤에 발광 형태로 자리잡음 */}
        <DaySilhouette direction={direction} phase={phase} />

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
    </main>
  );
}
