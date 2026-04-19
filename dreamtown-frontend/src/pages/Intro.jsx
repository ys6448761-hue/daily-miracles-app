import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { track, getVariant } from "../utils/experiment";
import { gaIntroView, gaIntroCTAClick } from "../utils/gtag";

const EXP_ID        = 'intro_cta_v1';
const SCREEN_EXP_ID = 'intro_screen_v1';

const PHASES = [
  "여수 바다에는\n소원을 품으면 별이 된다는\n이야기가 있습니다",
  "지금 마음속에 있는\n그 한 가지 소원",
  "당신의 소원을\n용궁으로 안내합니다",
];

const PHASE_DURATION = 3200; // ms — 다음 단계로 자동 전환

export default function Intro() {
  const screenVariant = getVariant(SCREEN_EXP_ID);
  const variant       = getVariant(EXP_ID);
  const [phase, setPhase]               = useState(0); // 0~2 텍스트, 3 = CTA
  const [transitioning, setTransitioning] = useState(false);
  const timerRef  = useRef(null);
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const g    = searchParams.get('g');

  useEffect(() => {
    track('screen_view', {
      screen: 'intro',
      experiment: EXP_ID,
      variant,
      screen_experiment: SCREEN_EXP_ID,
      screen_variant: screenVariant,
      from_share: !!g,
      galaxy: g || null,
    });
    gaIntroView({ screenVariant });
  }, []);

  // 타이머 정리
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // 텍스트 단계 자동 전환
  useEffect(() => {
    if (phase < PHASES.length) {
      timerRef.current = setTimeout(() => setPhase(p => p + 1), PHASE_DURATION);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  // 화면 탭으로 다음 단계 건너뛰기
  function handleTap() {
    if (phase < PHASES.length) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase(p => p + 1);
    }
  }

  function handleCTA(type) {
    track('cta_click', {
      experiment: EXP_ID,
      variant,
      screen_experiment: SCREEN_EXP_ID,
      screen_variant: screenVariant,
      text: type,
      from_share: !!g,
      galaxy: g || null,
    });
    gaIntroCTAClick({ screenVariant, ctaText: type });

    if (type === 'wish') {
      setTransitioning(true);
      timerRef.current = setTimeout(() => navigate('/wish'), 800);
    } else {
      navigate('/stars');
    }
  }

  const isCTA = phase >= PHASES.length;

  return (
    <div
      className="relative w-full h-screen bg-black text-white overflow-hidden"
      onClick={!isCTA ? handleTap : undefined}
      style={{ cursor: !isCTA ? 'pointer' : 'default' }}
    >
      {/* 영상 배경 */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.72 }}
      >
        <source src="/videos/intro-yeosu-entry-v1.mp4" type="video/mp4" />
      </video>

      {/* 어둡게 덮기 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 텍스트 단계 */}
      <AnimatePresence mode="wait">
        {!isCTA && (
          <motion.div
            key={phase}
            className="absolute inset-0 flex items-center justify-center px-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.7 }}
          >
            <p
              className="text-center text-white/95"
              style={{
                fontSize: 'clamp(17px, 4.5vw, 21px)',
                whiteSpace: 'pre-line',
                lineHeight: 1.80,
                letterSpacing: '-0.01em',
                fontWeight: 400,
                textShadow: '0 2px 20px rgba(0,0,0,0.75)',
              }}
            >
              {PHASES[phase]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 진행 점 */}
      {!isCTA && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex gap-2"
          style={{ bottom: 52 }}
        >
          {PHASES.map((_, i) => (
            <span
              key={i}
              className="block rounded-full transition-all duration-300"
              style={{
                width:      i === phase ? 18 : 6,
                height:     6,
                background: i === phase
                  ? 'rgba(255,215,106,0.85)'
                  : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      )}

      {/* 건너뛰기 */}
      {!isCTA && (
        <button
          onClick={e => {
            e.stopPropagation();
            if (timerRef.current) clearTimeout(timerRef.current);
            setPhase(PHASES.length);
          }}
          className="absolute top-5 right-5 text-xs px-3 py-1.5"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        >
          건너뛰기
        </button>
      )}

      {/* CTA 버튼 */}
      <AnimatePresence>
        {isCTA && (
          <motion.div
            className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-14"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <button
              onClick={() => handleCTA('wish')}
              className="w-full max-w-xs py-4 rounded-full text-base font-bold"
              style={{
                background:  '#FFD76A',
                color:       '#0D1B2A',
                boxShadow:   '0 0 32px 8px rgba(255,215,106,0.28)',
                border:      'none',
              }}
            >
              내 소원 남기기 ✦
            </button>
            <button
              onClick={() => handleCTA('browse')}
              className="w-full max-w-xs py-4 rounded-full text-sm"
              style={{
                background:     'rgba(255,255,255,0.07)',
                border:         '1px solid rgba(255,255,255,0.18)',
                color:          'rgba(255,255,255,0.60)',
                backdropFilter: 'blur(8px)',
              }}
            >
              다른 별 보기
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 전환 오버레이 */}
      {transitioning && (
        <div className="fixed inset-0 z-50 bg-black pointer-events-none"
             style={{ opacity: 0.85 }} />
      )}
    </div>
  );
}
