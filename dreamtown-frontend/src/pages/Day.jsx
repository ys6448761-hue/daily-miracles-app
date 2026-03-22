import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DayLogScreen from '../features/galaxy/components/DayLogScreen';
import SilhouetteScene from '../features/day/components/SilhouetteScene';
import { saveLog } from '../features/galaxy/utils/logStorage';
import { useDreamtownStore } from '../store/dreamtownStore';
import { postVoyageLog } from '../api/dreamtown.js';
import { POSTCARD_FALLBACK_MESSAGE } from '../constants/dreamtownFlow';

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
  const [textVisible, setTextVisible] = useState(false); // 실루엣보다 300ms 뒤에 텍스트 등장

  // location.state 우선, 없으면 store fallback (새로고침/직접 진입 대응)
  const store = useDreamtownStore();
  const direction = state?.direction ?? store.direction;
  const message   = state?.message   ?? store.message ?? POSTCARD_FALLBACK_MESSAGE;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transitioning'), 800);
    const t2 = setTimeout(() => setPhase('after'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // 실루엣 등장(즉시) → 300ms 후 텍스트 등장 → "드러난다" 순서 확보
  useEffect(() => {
    const t = setTimeout(() => setTextVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative w-full h-screen text-white overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>

      {/* z-0 — 진입 잔광 */}
      <DayAfterglow galaxy={direction} />

      {/* z-5 — 소원이 실루엣 + 선택 색 스며듦 */}
      <SilhouetteScene galaxy={direction} />

      {/* z-10 — 콘텐츠 */}
      <div className="relative z-10 w-full h-full">

        {/* Before / Transition — 메시지 전면 (실루엣 300ms 뒤 등장) */}
        <div
          className="absolute inset-0 flex items-center justify-center px-8 text-center pointer-events-none"
          style={{
            opacity: (!textVisible || phase === 'after') ? 0 : 1,
            transition: 'opacity 700ms ease-in-out',
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

              // VoyageLog: emotion/tag/growth → problem/action/result 자동 추론 저장 (fire-and-forget)
              const starId = localStorage.getItem('dt_star_id');
              if (starId && log.feeling && log.helpTag && log.growthLine) {
                postVoyageLog(starId, {
                  emotion: log.feeling,
                  tag:     log.helpTag,
                  growth:  log.growthLine,
                }).catch(() => {});
              }

              navigate('/postcard', {
                state: {
                  direction,
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
