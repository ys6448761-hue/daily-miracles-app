import { motion } from 'framer-motion';

const EVENT_META = {
  star_created:         { emoji: '⭐', label: '별 생성' },
  growth_logged:        { emoji: '📝', label: '성장 기록' },
  resonance_created:    { emoji: '✦',  label: '공명' },
  impact_created:       { emoji: '🌟', label: '나눔 생성' },
  resonance_received:   { emoji: '💫', label: '공명 수신' },
  connection_completed: { emoji: '🔗', label: '연결 완료' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d}일 전`;
  if (h > 0)  return `${h}시간 전`;
  if (m > 0)  return `${m}분 전`;
  return '방금';
}

// ── 최근 이벤트 스트림 ─────────────────────────────────────────────
export default function TodayActions({ actions = [] }) {
  if (!actions.length) {
    return (
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-6">
        <p className="text-white/50 text-xs mb-2">최근 이벤트</p>
        <p className="text-white/25 text-xs text-center py-4">아직 이벤트 없음</p>
      </div>
    );
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-6">
      <p className="text-white/50 text-xs mb-3">최근 이벤트</p>
      <div className="space-y-2">
        {actions.slice(0, 15).map((a, i) => {
          const meta = EVENT_META[a.event] ?? { emoji: '·', label: a.event };
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.02 * i }}
              className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0"
            >
              <span className="text-base w-5 text-center flex-shrink-0">{meta.emoji}</span>
              <span className="text-white/70 text-xs flex-1">{meta.label}</span>
              {a.source && (
                <span className="text-white/20 text-[10px] hidden sm:block">{a.source}</span>
              )}
              <span className="text-white/30 text-[11px] flex-shrink-0">{timeAgo(a.created_at)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
