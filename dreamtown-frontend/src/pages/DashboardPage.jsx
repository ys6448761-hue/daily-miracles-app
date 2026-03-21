/**
 * DashboardPage — DreamTown KPI 내부 대시보드
 *
 * 정본: DB (dt_kpi_events)
 * GA4는 보조 참고용
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDashboard } from '../api/dreamtown.js';
import NorthStarCards from '../components/NorthStarCards.jsx';
import FunnelChart from '../components/FunnelChart.jsx';
import TodayActions from '../components/TodayActions.jsx';

const RANGES = [
  { key: 'today', label: '오늘' },
  { key: '7d',    label: '7일' },
  { key: '30d',   label: '30일' },
];

function SafetyBadge({ safety }) {
  if (!safety) return null;
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-4">
      <p className="text-white/50 text-xs mb-3">안전 필터</p>
      <div className="flex gap-3">
        <div className="flex-1 text-center">
          <p className="text-red-400 text-xl font-bold">{safety.red_blocked ?? 0}</p>
          <p className="text-white/30 text-xs">RED 차단</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-yellow-400 text-xl font-bold">{safety.yellow_hidden ?? 0}</p>
          <p className="text-white/30 text-xs">YELLOW 비공개</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-green-400 text-xl font-bold">{safety.green_passed ?? 0}</p>
          <p className="text-white/30 text-xs">GREEN 통과</p>
        </div>
      </div>
    </div>
  );
}

function StageMetrics({ stage }) {
  if (!stage) return null;
  const items = [
    { key: 'growth_logged', label: '성장 기록', value: stage.growth_logged?.count ?? 0, rate: stage.growth_logged?.rate_pct },
    { key: 'milestone_day7', label: 'Day 7 재방문', value: stage.milestone_day7?.count ?? 0, note: stage.milestone_day7?.note },
    { key: 'quick_click_rate', label: '빠른 클릭률', value: 'TODO' },
    { key: 'expand_rate', label: '확장률', value: 'TODO' },
  ];

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-4">
      <p className="text-white/50 text-xs mb-3">스테이지 지표</p>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
            <div>
              <p className="text-white/70 text-sm">{item.label}</p>
              {item.note && <p className="text-white/25 text-[11px]">{item.note}</p>}
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${item.value === 'TODO' ? 'text-white/20' : 'text-white'}`}>
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </p>
              {item.rate !== undefined && (
                <p className="text-white/30 text-[11px]">{item.rate}%</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange]   = useState('7d');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getDashboard(range)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-10">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-white/40 text-xs">DreamTown</p>
        <h1 className="text-xl font-bold text-white mt-1">KPI 대시보드</h1>
        <p className="text-white/30 text-xs mt-0.5">정본: DB (dt_kpi_events)</p>
      </motion.div>

      {/* 범위 선택 */}
      <div className="flex gap-2 mb-6">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              range === r.key
                ? 'bg-dream-purple text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/30 text-sm">불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4">
          <p className="text-red-400 text-sm">조회 실패: {error}</p>
        </div>
      )}

      {!loading && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <NorthStarCards funnel={data.funnel} northStar={data.north_star} />
          <FunnelChart funnel={data.funnel} />
          <StageMetrics stage={data.stage_metrics} />
          <SafetyBadge safety={data.safety} />
          <TodayActions actions={data.today_actions} />

          {/* 메타 */}
          <p className="text-white/15 text-[11px] text-center mt-2">
            {data.meta?.range_start?.slice(0, 16)} 이후 | {data.meta?.source_of_truth}
          </p>
        </motion.div>
      )}
    </div>
  );
}
