export default function SelectionTransition({ phase, selectedDirection }) {
  if (phase !== 'transitioning' || !selectedDirection) return null;

  const anchorMap = {
    north: { x: '50%', y: '18%' },
    east:  { x: '82%', y: '44%' },
    west:  { x: '18%', y: '44%' },
    south: { x: '50%', y: '82%' },
  };

  const anchor = anchorMap[selectedDirection];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Selected star glow spreading outward */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at ${anchor.x} ${anchor.y},
              rgba(255,255,255,0.16) 0%,
              rgba(220,230,255,0.10) 10%,
              rgba(170,195,255,0.06) 22%,
              rgba(120,150,220,0.03) 36%,
              rgba(0,0,0,0) 62%
            )
          `,
          opacity: 1,
          animation: 'selection-glow 820ms ease-out forwards',
        }}
      />

      {/* Soft atmospheric bloom */}
      <div
        className="absolute inset-[-8%]"
        style={{
          background: `
            radial-gradient(
              ellipse at ${anchor.x} ${anchor.y},
              rgba(210,225,255,0.10) 0%,
              rgba(180,205,245,0.06) 20%,
              rgba(120,150,220,0.025) 42%,
              rgba(0,0,0,0) 72%
            )
          `,
          filter: 'blur(28px)',
          opacity: 0.9,
          animation: 'selection-bloom 820ms ease-out forwards',
        }}
      />

      {/* Gentle screen veil, lighter than bg-black/40 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at ${anchor.x} ${anchor.y},
              rgba(6,8,14,0.02) 0%,
              rgba(6,8,14,0.10) 26%,
              rgba(4,6,10,0.22) 58%,
              rgba(3,4,8,0.34) 100%
            )
          `,
          animation: 'selection-veil 820ms ease-out forwards',
        }}
      />
    </div>
  );
}
