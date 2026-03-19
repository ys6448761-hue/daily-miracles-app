import { useStarMotion } from '../hooks/useStarMotion';

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
      <div
        className="w-4 h-4 rounded-full bg-white"
        style={motion.core}
      />
      <div
        className="absolute inset-0 rounded-full bg-white opacity-60"
        style={motion.glow}
      />
    </button>
  );
}
