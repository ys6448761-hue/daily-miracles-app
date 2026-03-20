import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { track, getVariant } from "../utils/experiment";
import { gaIntroView, gaIntroCTAClick } from "../utils/gtag";

const EXP_ID        = 'intro_cta_v1';
const SCREEN_EXP_ID = 'intro_screen_v1';  // A: 전체 5단계, B: 마지막 1단계
const CTA_TEXT = { A: '시작하기', B: '내 빛 찾기' };

// import.meta.env.BASE_URL: dev='/', prod='/dreamtown/' — 경로 자동 대응
const BASE = import.meta.env.BASE_URL;

const STEPS = [
  { src: `${BASE}images/intro/intro-01-look.jpg`,      text: '소원을 떠올려보세요' },
  { src: `${BASE}images/intro/intro-02-write.jpg`,     text: '소원을 말하는 것만으로도' },
  { src: `${BASE}images/intro/intro-03-transform.jpg`, text: '소원은 별이 됩니다' },
  { src: `${BASE}images/intro/intro-04-choice.jpg`,    text: '오늘의 빛을 선택해요' },
  { src: `${BASE}images/intro/intro-05-result.jpg`,    text: '오늘은 이 삶을 살아볼 수 있어요' },
];

const LAST_STEP = STEPS.length;

// 공유 링크 유입 시 direction 색 tint — 카드의 색감이 Intro까지 이어짐
const INTRO_TINT = {
  north: 'rgba(96,165,250,0.10)',
  east:  'rgba(245,158,11,0.12)',
  west:  'rgba(244,114,182,0.10)',
  south: 'rgba(52,211,153,0.10)',
};

export default function Intro() {
  const screenVariant = getVariant(SCREEN_EXP_ID);
  // 항상 01-look부터 시작 — B variant도 01에서 시작 (이미지 순서 고정 원칙)
  const [step, setStep] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?g=east 형태로 direction 전달받음 (리텐션 루프 진입점)
  const g    = searchParams.get('g');
  const tint = INTRO_TINT[g] || null;

  // A/B 실험 — variant 고정
  const variant = getVariant(EXP_ID);
  const isLast  = step === LAST_STEP;
  const ctaText = isLast ? CTA_TEXT[variant] : '다음';

  const current = STEPS[step - 1];

  // screen_view 이벤트
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

  const handleNext = () => {
    if (!isLast) {
      setStep(s => s + 1);
    } else {
      track('cta_click', {
        experiment: EXP_ID,
        variant,
        screen_experiment: SCREEN_EXP_ID,
        screen_variant: screenVariant,
        text: ctaText,
        from_share: !!g,
        galaxy: g || null,
      });
      gaIntroCTAClick({ screenVariant, ctaText });
      // 별 zoom 트랜지션 시작 → 1200ms 후 Galaxy 이동
      setTransitioning(true);
      timerRef.current = setTimeout(() => navigate('/galaxy'), 1200);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">

      {/* 이미지 — step 변경 시 fade */}
      <AnimatePresence mode="wait">
        <motion.img
          key={step}
          src={current.src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      {/* 어둡게 덮기 */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 공유 유입 direction tint — 카드 색감의 여운 */}
      {tint && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: tint, mixBlendMode: 'screen' }}
        />
      )}

      {/* 텍스트 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="absolute bottom-28 w-full text-center px-6 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <p className="text-xl leading-relaxed">{current.text}</p>

          {/* 진행 점 (5단계 A 그룹만 표시) */}
          {screenVariant === 'A' && (
            <div className="flex justify-center gap-1.5 pt-3">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all duration-300 ${
                    i + 1 === step
                      ? 'w-4 h-1.5 bg-white/80'
                      : 'w-1.5 h-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 버튼 */}
      <button
        onClick={handleNext}
        disabled={transitioning}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm active:scale-95 transition-transform disabled:pointer-events-none whitespace-nowrap"
      >
        {ctaText}
      </button>

      {/* 별 zoom 트랜지션 오버레이 */}
      {transitioning && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="animate-star-zoom" />
        </div>
      )}
    </div>
  );
}
