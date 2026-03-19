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
      className="absolute transition-all duration-700 ease-in-out"
      style={{
        ...position,
        opacity: isDimmed ? 0.25 : 1,
        transform: `${position.transform || ''} ${
          isSelected ? 'scale(1.06)' : 'scale(1)'
        }`,
      }}
    >
      {/* outer halo */}
      <div
        className="absolute rounded-full"
        style={{
          width: coreSize * 3.2,
          height: coreSize * 3.2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.07)',
          filter: 'blur(10px)',
          ...motion.glow,
        }}
      />

      {/* inner glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: coreSize * 1.9,
          height: coreSize * 1.9,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.18)',
          filter: 'blur(4px)',
        }}
      />

      {/* core */}
      <div
        className="rounded-full bg-white"
        style={{
          width: coreSize,
          height: coreSize,
          ...motion.core,
        }}
      />
    </button>
  );
}
