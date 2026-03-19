/**
 * SilhouetteScene — /day 첫 장면, "빛이 소원이에게 스며드는" 연출
 *
 * 시각 원칙:
 * ✅ 실루엣 — 몸체는 거의 검정/딥네이비
 * ✅ rim light — 선택 색이 가장자리에 10~22% 수준으로만
 * ✅ 뒤쪽 glow — 선택 색 blur로 존재감 연출
 * ❌ 강하게 채색된 옷, 전면 주인공 노출
 *
 * 등장: y 18→0, scale 0.98→1, opacity 0→1 (1.1s ease-out)
 */

import { motion } from 'framer-motion';

// 가장자리 rim light — 선택 색 10~22% 수준
const RIM_COLORS = {
  north: 'rgba(96,165,250,0.22)',
  east:  'rgba(245,158,11,0.24)',
  west:  'rgba(244,114,182,0.22)',
  south: 'rgba(52,211,153,0.22)',
};

// 뒤쪽 glow — rim보다 연하게
const GLOW_COLORS = {
  north: 'rgba(96,165,250,0.16)',
  east:  'rgba(245,158,11,0.18)',
  west:  'rgba(244,114,182,0.16)',
  south: 'rgba(52,211,153,0.16)',
};

export default function SilhouetteScene({ galaxy }) {
  const rim  = RIM_COLORS[galaxy]  || 'rgba(255,255,255,0.14)';
  const glow = GLOW_COLORS[galaxy] || 'rgba(255,255,255,0.12)';

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className="relative mt-10 h-[320px] w-[220px]"
      >
        {/* ① 뒤쪽 glow — 선택 색이 공간에 번짐 */}
        <div
          className="absolute inset-0 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${glow}, transparent 68%)`,
          }}
        />

        {/* ② 몸체 실루엣 — 딥네이비 + 선택 색 rim light */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,16,28,0.92), rgba(6,10,18,0.98))',
            boxShadow: `0 0 0 1px ${rim}, 0 0 28px ${glow}`,
            clipPath:
              'polygon(50% 3%, 60% 8%, 67% 18%, 71% 28%, 75% 42%, 82% 62%, 78% 88%, 22% 88%, 18% 62%, 25% 42%, 29% 28%, 33% 18%, 40% 8%)',
          }}
        />

        {/* ③ 상단 머리/어깨 광원 — rim color 집중 */}
        <div
          className="absolute left-1/2 top-[18%] h-[120px] w-[120px] -translate-x-1/2 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${rim}, transparent 72%)`,
            opacity: 0.7,
          }}
        />
      </motion.div>
    </div>
  );
}
