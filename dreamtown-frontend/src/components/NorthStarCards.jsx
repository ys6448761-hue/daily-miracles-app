import { motion } from 'framer-motion';

// ── 대시보드 상단 4개 KPI 카드 ────────────────────────────────────
export default function NorthStarCards({ funnel, northStar }) {
  const cards = [
    {
      key:   'star_created',
      emoji: '⭐',
      label: funnel?.star_created?.label ?? '별 생성',
      value: funnel?.star_created?.count ?? 0,
      rate:  null,
      cls:   'border-star-gold/30',
    },
    {
      key:   'resonance_created',
      emoji: '✦',
      label: funnel?.resonance_created?.label ?? '공명 발생',
      value: funnel?.resonance_created?.count ?? 0,
      rate:  funnel?.resonance_created?.rate_pct,
      cls:   'border-blue-400/30',
    },
    {
      key:   'impact_created',
      emoji: '🌟',
      label: funnel?.impact_created?.label ?? '나눔 생성',
      value: funnel?.impact_created?.count ?? 0,
      rate:  funnel?.impact_created?.rate_pct,
      cls:   'border-purple-400/30',
    },
    {
      key:   'connection_completed',
      emoji: '🔗',
      label: funnel?.connection_completed?.label ?? '연결 완료',
      value: funnel?.connection_completed?.count ?? 0,
      rate:  funnel?.connection_completed?.rate_pct,
      cls:   'border-green-400/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* North Star 메인 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 bg-star-gold/10 border border-star-gold/30 rounded-2xl p-4"
      >
        <p className="text-star-gold/60 text-[11px] uppercase tracking-wider mb-1">North Star</p>
        <p className="text-white/80 text-sm mb-2">{northStar?.label ?? '공명 받은 별'}</p>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-star-gold">{northStar?.value ?? 0}</span>
          <span className="text-white/40 text-sm mb-0.5">별</span>
          {northStar?.rate_pct > 0 && (
            <span className="text-star-gold/70 text-sm mb-0.5">({northStar.rate_pct}%)</span>
          )}
        </div>
        <p className="text-white/30 text-[11px] mt-1">{northStar?.description}</p>
      </motion.div>

      {/* 퍼널 4개 카드 */}
      {cards.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * (i + 1) }}
          className={`bg-white/3 border ${c.cls} rounded-2xl p-3`}
        >
          <p className="text-lg mb-1">{c.emoji}</p>
          <p className="text-white/50 text-[11px] mb-1">{c.label}</p>
          <p className="text-white font-semibold text-xl">{c.value.toLocaleString()}</p>
          {c.rate !== null && c.rate !== undefined && (
            <p className="text-white/30 text-[11px] mt-0.5">전환 {c.rate}%</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
