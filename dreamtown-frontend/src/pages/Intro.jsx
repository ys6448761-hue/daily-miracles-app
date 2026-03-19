import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// 공유 링크 유입 시 direction 색 tint — 카드의 색감이 Intro까지 이어짐
const INTRO_TINT = {
  north: 'rgba(96,165,250,0.10)',
  east:  'rgba(245,158,11,0.12)',
  west:  'rgba(244,114,182,0.10)',
  south: 'rgba(52,211,153,0.10)',
};

export default function Intro() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?g=east 형태로 direction 전달받음 (리텐션 루프 진입점)
  const g = searchParams.get('g');
  const tint = INTRO_TINT[g] || null;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      navigate("/galaxy");
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col justify-between items-center">

      {/* 이미지 영역 */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">

        {step === 1 && (
          <img
            src="/images/intro-wish.jpg"
            alt="소원이 별이 되는 장면"
            className="absolute w-full h-full object-cover opacity-90 transition-opacity duration-700"
          />
        )}

        {step === 2 && (
          <img
            src="/images/intro-transform.jpg"
            alt="변화된 소원이"
            className="absolute w-full h-full object-cover opacity-90 transition-opacity duration-700"
          />
        )}

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
        {step === 1 ? "다음" : "시작하기"}
      </button>
    </div>
  );
}
