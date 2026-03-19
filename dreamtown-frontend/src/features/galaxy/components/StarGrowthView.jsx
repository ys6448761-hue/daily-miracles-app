export default function StarGrowthView({ stage }) {
  return (
    <div className="my-16 relative flex items-center justify-center">

      {/* Core star */}
      <div className="w-16 h-16 rounded-full bg-white z-10" />

      {/* Glow layers */}
      {stage >= 1 && (
        <div className="absolute w-32 h-32 rounded-full bg-white/10 blur-xl" />
      )}

      {stage >= 2 && (
        <div className="absolute w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      )}

      {stage >= 3 && (
        <div className="absolute w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      )}

      {stage >= 4 && (
        <div className="absolute w-80 h-80 rounded-full bg-white/10 blur-[100px]" />
      )}

    </div>
  );
}
