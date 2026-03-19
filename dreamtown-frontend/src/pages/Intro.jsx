import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { track, getVariant } from "../utils/experiment";

const EXP_ID        = 'intro_cta_v1';
const SCREEN_EXP_ID = 'intro_screen_v1';  // A: 2단계, B: 1단계
const CTA_TEXT = { A: '시작하기', B: '내 빛 찾기' };

// 공유 링크 유입 시 direction 색 tint — 카드의 색감이 Intro까지 이어짐
const INTRO_TINT = {
  north: 'rgba(96,165,250,0.10)',
  east:  'rgba(245,158,11,0.12)',
  west:  'rgba(244,114,182,0.10)',
  south: 'rgba(52,211,153,0.10)',
};

export default function Intro() {
  const screenVariant = getVariant(SCREEN_EXP_ID);
  const [step, setStep] = useState(screenVariant === 'B' ? 2 : 1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?g=east 형태로 direction 전달받음 (리텐션 루프 진입점)
  const g    = searchParams.get('g');
  const tint = INTRO_TINT[g] || null;

  // A/B 실험 — variant 고정
  const variant = getVariant(EXP_ID);
  const ctaText = step === 1 ? '다음' : CTA_TEXT[variant];

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
    if (step === 1) {
      setStep(2);
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

        {/* 배경 — 이미지 파일 준비 전 CSS 그라디언트 placeholder */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: step === 1
              ? 'radial-gradient(ellipse at 50% 30%, rgba(120,100,220,0.35) 0%, rgba(30,20,60,0.90) 60%, #020008 100%)'
              : 'radial-gradient(ellipse at 50% 60%, rgba(80,160,220,0.30) 0%, rgba(20,30,55,0.90) 60%, #020008 100%)',
          }}
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
      <div className="text-center px-6 pb-20 space-y-4">
        {step === 1 && (
          <p className="text-lg opacity-90">
            소원은 별이 됩니다
          </p>
        )}

        {step === 2 && (
          <p className="text-lg opacity-90">
            오늘은 이 삶을 살아볼 수 있어요
          </p>
        )}
      </div>

      {/* 버튼 */}
      <button
        onClick={handleNext}
        className="mb-10 px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm"
      >
        {ctaText}
      </button>
    </div>
  );
}
