import { motion } from 'framer-motion';

// ── 퍼널 바 차트 ─────────────────────────────────────────────────
// 각 단계의 상대 폭으로 드롭오프를 시각화
export default function FunnelChart({ funnel }) {
  if (!funnel) return null;

  const steps = [
    { key: 'star_created',         color: 'bg-star-gold/60' },
    { key: 'resonance_created',    color: 'bg-blue-400/60' },
    { key: 'impact_created',       color: 'bg-purple-400/60' },
    { key: 'connection_completed', color: 'bg-green-400/60' },
  ];

  const maxCount = Math.max(1, funnel[steps[0].key]?.count ?? 0);

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-6">
      <p className="text-white/50 text-xs mb-4">퍼널 흐름</p>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const step     = funnel[s.key] ?? {};
          const count    = step.count    ?? 0;
          const widthPct = maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 4;

          return (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/60 text-xs">{step.label ?? s.key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-xs font-medium">{count.toLocaleString()}</span>
                  {step.rate_pct !== undefined && step.rate_pct !== null && (
                    <span className="text-white/30 text-[11px]">{step.rate_pct}%</span>
                  )}
                </div>
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ delay: 0.1 * i, duration: 0.6, ease: 'easeOut' }}
                className={`h-2 rounded-full ${s.color}`}
              />
              {step.note && (
                <p className="text-white/20 text-[10px] mt-0.5">{step.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
