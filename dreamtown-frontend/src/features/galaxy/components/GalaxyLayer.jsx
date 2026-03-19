import { useMemo } from "react";

export default function GalaxyLayer() {
  // 1차 복원: 소수 별만 먼저 배치 (과하지 않게)
  const stars = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5, // 0.5 ~ 2px
      opacity: Math.random() * 0.4 + 0.15, // 0.15 ~ 0.55
      delay: Math.random() * 4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* 1️⃣ Deep night base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020610] via-[#080e28] to-[#0f1a40]" />

      {/* 2️⃣ Nebula — 은은하게 1개만 */}
      <div
        className="absolute inset-[-10%] opacity-35 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 40% 45%, rgba(70,110,240,0.28), transparent 58%)",
        }}
      />

      {/* 3️⃣ Stars — 소수만 */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* 4️⃣ Vignette — 선택 별 집중도 확보 */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
    </div>
  );
}
