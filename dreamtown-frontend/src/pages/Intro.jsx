import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { track, getVariant } from "../utils/experiment";

const EXP_ID        = 'intro_cta_v1';
const SCREEN_EXP_ID = 'intro_screen_v1';  // A: 전체 5단계, B: 마지막 1단계
const CTA_TEXT = { A: '시작하기', B: '내 빛 찾기' };

const STEPS = [
  { src: '/images/intro/intro-01-look.jpg',      text: '소원을 떠올려보세요' },
  { src: '/images/intro/intro-02-write.jpg',     text: '소원을 말하는 것만으로도' },
  { src: '/images/intro/intro-03-transform.jpg', text: '소원은 별이 됩니다' },
  { src: '/images/intro/intro-04-choice.jpg',    text: '오늘의 빛을 선택해요' },
  { src: '/images/intro/intro-05-result.jpg',    text: '오늘은 이 삶을 살아볼 수 있어요' },
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
  // A: 1번부터 (5단계 전체), B: 마지막부터 (1단계)
  const [step, setStep] = useState(screenVariant === 'B' ? LAST_STEP : 1);
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
  }, []);

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
      navigate("/galaxy");
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col justify-between items-center">

      {/* 이미지 영역 */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">

        <img
          key={step}
          src={current.src}
          alt=""
          className="absolute w-full h-full object-cover opacity-90 transition-opacity duration-700"
        />

        {/* 어둡게 덮기 */}
        <div className="absolute inset-0 bg-black/40" />

        {/* 공유 유입 direction tint — 카드 색감의 여운 */}
        {tint && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: tint, mixBlendMode: 'screen' }}
          />
        )}
      </div>

      {/* 텍스트 */}
      <div className="text-center px-6 pb-6 space-y-2">
        <p key={step} className="text-lg opacity-90 leading-relaxed">
          {current.text}
        </p>

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
      </div>

      {/* 버튼 */}
      <button
        onClick={handleNext}
        className="mb-10 px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm active:scale-95 transition-transform"
      >
        {ctaText}
      </button>
    </div>
  );
}
