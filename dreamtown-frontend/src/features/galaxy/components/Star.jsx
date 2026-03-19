import { useStarMotion } from '../hooks/useStarMotion';

// direction별 미세 크기 차이 — 랜덤 대신 고정 오프셋 (re-render 안전)
const SIZE_OFFSET = { north: 0, east: 1, west: -1, south: 0.5 };

export default function Star({
  direction,
  motionPreset,
  position,
  isSelected,
  isDimmed,
  disabled,
  onSelect,
}) {
  const motion = useStarMotion(motionPreset);
  const coreSize = 14 + SIZE_OFFSET[direction];

  return (
    <button
      onClick={() => onSelect(direction)}
      disabled={disabled}
      className="absolute transition-all duration-700 ease-in-out group cursor-pointer"
      style={{
        ...position,
        opacity: isDimmed ? 0.25 : 1,
        transform: `${position.transform || ''} ${
          isSelected ? 'scale(1.06)' : 'scale(1)'
        }`,
      }}
    >
      {/* outer halo — 선택 시 pulse 리듬 빨라짐 (살아나는 연출) */}
      <div
        className="absolute rounded-full"
        style={{
          width: coreSize * 3.2,
          height: coreSize * 3.2,
          top: '50%',
          left: '50%',
          background: 'rgba(255,255,255,0.09)',
          filter: 'blur(12px)',
          animation: `star-halo-pulse ${isSelected ? '2.0s' : '3.8s'} ease-in-out infinite`,
        }}
      />

      {/* inner glow — hover 밝아짐 + 선택 시 완전 점등 */}
      <div
        className="absolute rounded-full transition-opacity duration-500 group-hover:opacity-100"
        style={{
          width: coreSize * 1.9,
          height: coreSize * 1.9,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.18)',
          filter: 'blur(4px)',
          opacity: isSelected ? 1 : 0.85,
        }}
      />

      {/* core — glow + hover 확대 + 선택 상태 최대 점등 */}
      <div
        className={`rounded-full bg-white transition-transform duration-300 group-hover:scale-125 ${
          isSelected ? 'star-core-glow-selected' : 'star-core-glow'
        }`}
        style={{
          width: coreSize,
          height: coreSize,
          ...motion.core,
        }}
      />
    </button>
  );
}
