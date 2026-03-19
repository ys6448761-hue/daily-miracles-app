export default function GalaxyLayer({ phase, selectedDirection }) {
  const isTransitioning = phase === 'transitioning' || phase === 'complete';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base background */}
      <div className="absolute inset-0 bg-[#04070d]" />

      {/* Watercolor wash */}
      <div
        className="absolute inset-[-12%]"
        style={{
          background: `
            radial-gradient(42% 36% at 50% 18%, rgba(185, 205, 255, 0.10) 0%, rgba(185, 205, 255, 0) 70%),
            radial-gradient(38% 32% at 82% 44%, rgba(185, 220, 255, 0.08) 0%, rgba(185, 220, 255, 0) 72%),
            radial-gradient(38% 32% at 18% 44%, rgba(215, 205, 255, 0.08) 0%, rgba(215, 205, 255, 0) 72%),
            radial-gradient(42% 36% at 50% 82%, rgba(215, 235, 255, 0.09) 0%, rgba(215, 235, 255, 0) 70%)
          `,
          filter: 'blur(48px)',
          opacity: isTransitioning ? 0.72 : 0.86,
          transform: isTransitioning ? 'scale(1.03)' : 'scale(1)',
          transition: 'opacity 800ms ease-in-out, transform 800ms ease-in-out',
        }}
      />

      {/* Soft mist layer */}
      <div
        className="absolute inset-[-10%]"
        style={{
          background: `
            radial-gradient(30% 24% at 30% 28%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%),
            radial-gradient(26% 22% at 68% 30%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)
          `,
          filter: 'blur(32px)',
          opacity: isTransitioning ? 0.6 : 0.8,
          transition: 'opacity 800ms ease-in-out',
        }}
      />

      {/* Directional flows */}
      <DirectionalFlow direction="north" active={selectedDirection === 'north'} />
      <DirectionalFlow direction="east"  active={selectedDirection === 'east'} />
      <DirectionalFlow direction="west"  active={selectedDirection === 'west'} />
      <DirectionalFlow direction="south" active={selectedDirection === 'south'} />

      {/* Star dust */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isTransitioning ? 0.24 : 0.38,
          backgroundImage: `
            radial-gradient(circle at 20% 24%, rgba(255,255,255,0.72) 0 1px, transparent 1.5px),
            radial-gradient(circle at 74% 18%, rgba(255,255,255,0.55) 0 1px, transparent 1.5px),
            radial-gradient(circle at 82% 62%, rgba(255,255,255,0.62) 0 1px, transparent 1.5px),
            radial-gradient(circle at 34% 76%, rgba(255,255,255,0.45) 0 1px, transparent 1.5px),
            radial-gradient(circle at 54% 48%, rgba(255,255,255,0.55) 0 1px, transparent 1.5px),
            radial-gradient(circle at 12% 58%, rgba(255,255,255,0.34) 0 1px, transparent 1.5px)
          `,
          filter: 'blur(0.25px)',
          transition: 'opacity 800ms ease-in-out',
        }}
      />

      {/* Vignette / veil */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(8,10,18,0) 0%, rgba(5,7,13,0.26) 55%, rgba(3,4,8,0.58) 100%)',
          opacity: isTransitioning ? 1 : 0.76,
          transition: 'opacity 800ms ease-in-out',
        }}
      />
    </div>
  );
}

function DirectionalFlow({ direction, active }) {
  const config = {
    north: {
      style: {
        top: '6%',
        left: '50%',
        width: '28%',
        height: '34%',
        transform: 'translateX(-50%) rotate(-4deg)',
      },
      background:
        'radial-gradient(ellipse at 50% 85%, rgba(195,220,255,0.13) 0%, rgba(195,220,255,0.06) 34%, rgba(195,220,255,0) 74%)',
    },
    east: {
      style: {
        top: '28%',
        right: '4%',
        width: '34%',
        height: '30%',
        transform: 'rotate(8deg)',
      },
      background:
        'radial-gradient(ellipse at 12% 50%, rgba(185,225,255,0.12) 0%, rgba(185,225,255,0.05) 34%, rgba(185,225,255,0) 74%)',
    },
    west: {
      style: {
        top: '28%',
        left: '4%',
        width: '34%',
        height: '30%',
        transform: 'rotate(-8deg)',
      },
      background:
        'radial-gradient(ellipse at 88% 50%, rgba(220,210,255,0.12) 0%, rgba(220,210,255,0.05) 34%, rgba(220,210,255,0) 74%)',
    },
    south: {
      style: {
        bottom: '6%',
        left: '50%',
        width: '30%',
        height: '36%',
        transform: 'translateX(-50%) rotate(3deg)',
      },
      background:
        'radial-gradient(ellipse at 50% 15%, rgba(215,235,255,0.12) 0%, rgba(215,235,255,0.05) 34%, rgba(215,235,255,0) 74%)',
    },
  };

  const current = config[direction];

  return (
    <div
      className="absolute"
      style={{
        ...current.style,
        background: current.background,
        filter: 'blur(42px)',
        opacity: active ? 0.95 : 0.55,
        transition: 'opacity 800ms ease-in-out, transform 800ms ease-in-out',
      }}
    />
  );
}
