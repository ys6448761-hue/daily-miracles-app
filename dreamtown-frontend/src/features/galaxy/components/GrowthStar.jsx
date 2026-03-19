/**
 * GrowthStar — 기록이 쌓일수록 별빛이 깊어진다
 *
 * 표현 원칙 (DEC-2026-0319-004):
 * - 빛의 층(layer) + 후광(glow) + 잔광(afterglow) 깊이로 성장 표현
 * - 레벨/점수/퍼센트 없음
 * - logCount가 많을수록 glow가 넓어지고 레이어가 진해진다
 */
export default function GrowthStar({ logCount }) {
  // 기록 수에 따라 빛 깊이 단계: 0~2 / 3~6 / 7~13 / 14+
  const depth = logCount === 0 ? 0
    : logCount < 3  ? 1
    : logCount < 7  ? 2
    : logCount < 14 ? 3
    : 4;

  const glowSize  = [48, 72, 100, 132, 168][depth];
  const coreOpacity = [0.55, 0.70, 0.82, 0.92, 1.0][depth];
  const layerOpacity = [0, 0.10, 0.18, 0.26, 0.34][depth];

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>

      {/* 잔광 — 가장 바깥 */}
      <div
        className="absolute rounded-full"
        style={{
          width: glowSize * 2.4,
          height: glowSize * 2.4,
          background: `radial-gradient(circle, rgba(200,220,255,${layerOpacity * 0.5}) 0%, rgba(180,200,255,0) 70%)`,
          filter: 'blur(24px)',
          transition: 'all 1200ms ease-in-out',
        }}
      />

      {/* 후광 — 중간 */}
      <div
        className="absolute rounded-full"
        style={{
          width: glowSize * 1.6,
          height: glowSize * 1.6,
          background: `radial-gradient(circle, rgba(220,235,255,${layerOpacity * 0.8}) 0%, rgba(200,220,255,0) 70%)`,
          filter: 'blur(12px)',
          transition: 'all 1200ms ease-in-out',
        }}
      />

      {/* 별 코어 */}
      <div
        className="absolute rounded-full bg-white"
        style={{
          width: 16,
          height: 16,
          opacity: coreOpacity,
          boxShadow: `0 0 ${glowSize * 0.5}px rgba(255,255,255,0.6)`,
          animation: 'breath 5s ease-in-out infinite',
          transition: 'all 1200ms ease-in-out',
        }}
      />
    </div>
  );
}
