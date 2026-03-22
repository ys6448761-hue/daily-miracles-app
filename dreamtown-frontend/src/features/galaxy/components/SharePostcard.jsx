/**
 * SharePostcard — 외부 공유용 초대 카드 (AIL-DT-004)
 *
 * 비율: 9:16
 * 배경: #0D1B2A
 * ❌ 소원 원문 노출 없음 / blur 사용 금지 (html2canvas 캡처 대상)
 */

// 별 파티클 — 고정 좌표 (랜덤처럼 보이되 html2canvas에서 안정적)
const PARTICLES = [
  { top: '6%',  left: '14%', size: 2,   color: 'rgba(255,255,255,0.70)' },
  { top: '11%', left: '82%', size: 1.5, color: 'rgba(255,215,106,0.80)' },
  { top: '19%', left: '6%',  size: 1,   color: 'rgba(255,255,255,0.50)' },
  { top: '24%', left: '91%', size: 2.5, color: 'rgba(255,255,255,0.60)' },
  { top: '72%', left: '5%',  size: 2,   color: 'rgba(255,215,106,0.70)' },
  { top: '78%', left: '88%', size: 1.5, color: 'rgba(255,255,255,0.55)' },
  { top: '85%', left: '18%', size: 1,   color: 'rgba(255,255,255,0.45)' },
  { top: '88%', left: '72%', size: 2,   color: 'rgba(255,215,106,0.65)' },
  { top: '93%', left: '44%', size: 1.5, color: 'rgba(255,255,255,0.50)' },
];

// galaxy code → 한글 은하명
const GALAXY_NAME = {
  challenge:    '도전 은하',
  growth:       '성장 은하',
  healing:      '치유 은하',
  relationship: '관계 은하',
};

// direction → galaxy code fallback
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
  galaxyCode    = null,
  starCreatedAt = null,
  direction     = null,
}) {
  const galaxyLabel = galaxyName
    ?? (galaxyCode && GALAXY_NAME[galaxyCode])
    ?? DIRECTION_GALAXY[direction]
    ?? '미지의 은하';
  const daysSinceBirth = calcDaysSinceBirth(starCreatedAt);

  return (
    <div
      id="share-postcard"
      className="relative w-full max-w-sm overflow-hidden"
      style={{
        fontFamily:      "'Pretendard', 'Noto Sans KR', sans-serif",
        backgroundColor: '#0D1B2A',
        aspectRatio:     '9 / 16',
        borderRadius:    28,
      }}
    >
      {/* 별 파티클 */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top:             p.top,
            left:            p.left,
            width:           p.size,
            height:          p.size,
            backgroundColor: p.color,
          }}
        />
      ))}

      {/* 중앙 glow — #FFD76A */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 28% at 50% 50%, rgba(255,215,106,0.18) 0%, transparent 72%)',
        }}
      />

      {/* 브랜드 — 상단 */}
      <div className="absolute top-[7%] inset-x-0 text-center">
        <p style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(155,135,245,0.55)', textTransform: 'uppercase' }}>
          DreamTown
        </p>
      </div>

      {/* 별 이름 */}
      <div className="absolute inset-x-0 top-[20%] px-8 text-center">
        <p style={{ fontSize: 24, fontWeight: 600, color: '#FFD76A', lineHeight: 1.35, letterSpacing: '-0.02em' }}>
          {starName}
        </p>
      </div>

      {/* 중앙 별 아이콘 */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-8%' }}>
        <p style={{ fontSize: 20, color: 'rgba(255,215,106,0.70)' }}>✦</p>
      </div>

      {/* 은하 + 탄생일 */}
      <div className="absolute inset-x-0 text-center" style={{ top: '56%' }}>
        <p style={{ fontSize: 14, color: '#9B87F5', letterSpacing: '0.03em' }}>
          {galaxyLabel} · 별 탄생 D+{daysSinceBirth}일째
        </p>
      </div>

      {/* 구분선 */}
      <div
        className="absolute"
        style={{
          top:    '63%',
          left:   '20%',
          width:  '60%',
          height: '0.5px',
          backgroundColor: 'rgba(155,135,245,0.25)',
        }}
      />

      {/* 메인 카피 */}
      <div className="absolute inset-x-0 text-center" style={{ top: '67%' }}>
        <p style={{ fontSize: 12, color: '#C8C0E0' }}>
          {starName}의 소원이 별이 됐어요
        </p>
      </div>

      {/* 훅 카피 */}
      <div className="absolute inset-x-0 text-center" style={{ top: '73%' }}>
        <p style={{ fontSize: 10, color: '#8070A0' }}>
          당신의 소원은 어떤 별이 될까요?
        </p>
      </div>

    </div>
  );
}
