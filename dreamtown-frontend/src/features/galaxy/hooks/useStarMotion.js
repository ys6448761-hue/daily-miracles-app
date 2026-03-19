// 별의 감각 차이는 이 파일 외부에서 만들지 않는다 (DEC-2026-0319-002)
// @keyframes breath 는 index.css에 정의되어 있음
export function useStarMotion(preset) {
  const base = {
    animation: 'breath 5s ease-in-out infinite',
  };

  const presets = {
    challenge:    { transform: 'translateY(-2px)' },
    growth:       { transform: 'translateX(2px)' },
    relationship: { transform: 'translateX(1px)' },
    healing:      { transform: 'translateY(2px)' },
  };

  return {
    core: {
      ...base,
      ...presets[preset],
    },
    glow: {
      opacity: 0.6,
      filter: 'blur(12px)',
    },
  };
}
