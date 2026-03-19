/**
 * SelectionTransition — 별 선택 순간 "빛이 내려오는 경험"
 *
 * 3-layer 구조:
 *  1. beam    — 상단에서 방사광이 퍼지며 나타남 (scaleY 0.5 → 1 → fade)
 *  2. fall    — 빛이 위에서 아래로 흘러내림 (translateY -30% → 0 → 20%)
 *  3. overlay — 화면 전체에 색이 자연스럽게 감쌈 (opacity 0 → 0.25 → 0.15)
 *
 * 금지: ❌ 번쩍 ❌ 강한 플래시 ❌ 빠른 깜빡임
 * 허용: ✅ 위에서 내려옴 ✅ 부드럽게 감쌈 ✅ "선택됐다" 느낌
 */

const DIRECTION_COLORS = {
  north: 'rgba(96,165,250,0.18)',   // 도전 — 청
  east:  'rgba(245,158,11,0.22)',   // 성장 — 금
  west:  'rgba(244,114,182,0.18)',  // 관계 — 핑크
  south: 'rgba(52,211,153,0.18)',   // 치유 — 민트
};

export default function SelectionTransition({ phase, selectedDirection }) {
  if (phase !== 'transitioning' || !selectedDirection) return null;

  const color = DIRECTION_COLORS[selectedDirection];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">

      {/* ① 상단 빛 — 위에서 방사광이 내려옴 */}
      <div
        className="absolute top-0 left-0 right-0 h-[120vh] blur-3xl animate-beam"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)`,
        }}
      />

      {/* ② 내려오는 빔 — 빛이 위에서 아래로 흘러내림 */}
      <div
        className="absolute top-0 left-0 w-full h-full animate-fall"
        style={{
          background: `linear-gradient(to bottom, ${color}, transparent 60%)`,
        }}
      />

      {/* ③ 전체 tint — 선택한 색이 화면 전체를 부드럽게 감쌈 */}
      <div
        className="absolute inset-0 animate-overlay"
        style={{ background: color }}
      />
    </div>
  );
}
