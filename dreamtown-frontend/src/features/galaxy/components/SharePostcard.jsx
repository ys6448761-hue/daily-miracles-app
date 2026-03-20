/**
 * SharePostcard — 외부 공유용 초대 카드
 *
 * 목적: "내 경험 회고" 가 아닌 "상대가 눌러보고 싶어지는 초대장"
 *
 * 핵심 원칙:
 * ✅ 별 이름이 메인 훅
 * ✅ 은하 / D+ 은은하게 보조
 * ✅ 하단 훅: "당신의 소원은 어떤 별이 될까요?"
 * ❌ 개인 감정 회고 문장 금지
 * ❌ blur 사용 금지 (html2canvas 캡처 대상)
 *
 * 비율: 4:5 (1080×1350)
 */

const DIRECTION_THEME = {
  north: { r: 140, g: 185, b: 255, lightPos: '50% 8%'  },
  east:  { r: 245, g: 195, b:  85, lightPos: '88% 44%' },
  west:  { r: 240, g: 140, b: 195, lightPos: '12% 44%' },
  south: { r:  80, g: 210, b: 175, lightPos: '50% 88%' },
};
const NEUTRAL = { r: 185, g: 205, b: 255, lightPos: '50% 22%' };

// direction → 은하명 fallback (API galaxyName 없을 때 사용)
const DIRECTION_GALAXY = {
  north: '도전 은하',
  east:  '성장 은하',
  west:  '관계 은하',
  south: '치유 은하',
};

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1,
  );
}

export default function SharePostcard({
  starName      = '이름 없는 별',
  galaxyName    = null,
  starCreatedAt = null,
  direction     = null,
}) {
  const { r, g, b, lightPos } = DIRECTION_THEME[direction] || NEUTRAL;
  const galaxyLabel     = galaxyName ?? DIRECTION_GALAXY[direction] ?? '미지의 은하';
  const daysSinceBirth  = calcDaysSinceBirth(starCreatedAt);

  return (
    <div
      id="share-postcard"
      className="relative w-full max-w-sm aspect-[4/5] rounded-[28px] overflow-hidden bg-[#070b14]"
      style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}
    >
      {/* 배경 광원 — blur 없이 opacity로만 표현 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(44% 38% at ${lightPos}, rgba(${r},${g},${b},0.22) 0%, rgba(${r},${g},${b},0) 70%),
            radial-gradient(36% 30% at 82% 44%, rgba(${r},${g},${b},0.08) 0%, rgba(${r},${g},${b},0) 72%),
            radial-gradient(36% 30% at 18% 44%, rgba(${r},${g},${b},0.08) 0%, rgba(${r},${g},${b},0) 72%),
            radial-gradient(40% 34% at 50% 82%, rgba(${r},${g},${b},0.10) 0%, rgba(${r},${g},${b},0) 70%)
          `,
        }}
      />

      {/* 별 광원 — 중앙 고정 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full"
            style={{
              width: 180,
              height: 180,
              background: `rgba(${r},${g},${b},0.10)`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 100,
              height: 100,
              background: `rgba(${r},${g},${b},0.14)`,
            }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: `rgba(${r},${g},${b},0.85)` }}
          />
        </div>
      </div>

      {/* 비네트 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(8,10,18,0) 0%, rgba(5,7,13,0.20) 58%, rgba(3,4,8,0.50) 100%)',
        }}
      />

      {/* 브랜드 — 상단 */}
      <div className="absolute top-[8%] inset-x-0 text-center">
        <p
          className="text-[11px] tracking-[0.22em] uppercase"
          style={{ color: `rgba(${r},${g},${b},0.55)` }}
        >
          DreamTown
        </p>
      </div>

      {/* 별 이름 — 메인 훅 */}
      <div className="absolute inset-x-0 top-[22%] px-8 text-center">
        <p
          className="text-[26px] font-semibold leading-snug tracking-[-0.02em]"
          style={{
            color: 'rgba(255,255,255,0.95)',
            textShadow: `0 0 24px rgba(${r},${g},${b},0.50), 0 1px 12px rgba(0,0,0,0.60)`,
          }}
        >
          {starName}
        </p>
        <p
          className="mt-2 text-[15px]"
          style={{ color: `rgba(${r},${g},${b},0.75)` }}
        >
          ✦
        </p>
      </div>

      {/* 은하 + D+ */}
      <div className="absolute inset-x-0 top-[48%] text-center space-y-1">
        <p
          className="text-[13px] tracking-wide"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          {galaxyLabel}
        </p>
        <p
          className="text-[12px]"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          탄생 D+{daysSinceBirth}
        </p>
      </div>

      {/* 훅 카피 — 하단 */}
      <div className="absolute inset-x-0 bottom-[14%] px-8 text-center space-y-2">
        <p
          className="text-[15px] leading-relaxed"
          style={{
            color: 'rgba(255,255,255,0.80)',
            textShadow: '0 1px 8px rgba(0,0,0,0.50)',
          }}
        >
          당신의 소원은 어떤 별이 될까요?
        </p>
        <p
          className="text-[11px] tracking-wide"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          나도 별을 만나보기
        </p>
      </div>
    </div>
  );
}
