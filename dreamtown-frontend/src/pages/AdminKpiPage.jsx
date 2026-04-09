/**
 * AdminKpiPage.jsx — Aurora 5 Claude Code KPI 대시보드
 * 경로: /admin/kpi
 *
 * 측정 지표: 재시도율 / 평균 턴 수 / 평균 응답 길이
 * 루미 판정: 성공 / 부분 성공 / 변화 없음 / 즉시 롤백
 */

import { useState, useEffect, useCallback } from 'react';

const ADMIN_KEY_STORAGE = 'dt_admin_key';

// ── 목표 기준 (루미 SSOT) ─────────────────────────────────────────
const GOALS = {
  retry_rate_pct:      { label: '재시도율', unit: '%', target: '≥30% 감소', better: 'lower', color: '#f87171' },
  avg_turns:           { label: '평균 턴 수', unit: '턴', target: '20~40% 감소', better: 'lower', color: '#60a5fa' },
  avg_response_length: { label: '평균 응답 길이', unit: '자', target: '30~50% 감소', better: 'lower', color: '#a78bfa' },
};

const VERDICT_STYLE = {
  success:           { bg: '#052e16', border: '#16a34a', badge: '#22c55e', text: '성공' },
  partial:           { bg: '#422006', border: '#d97706', badge: '#f59e0b', text: '부분 성공' },
  no_change:         { bg: '#1c1c2e', border: '#6366f1', badge: '#818cf8', text: '변화 없음' },
  rollback:          { bg: '#2d0707', border: '#dc2626', badge: '#ef4444', text: '즉시 롤백' },
  insufficient_data: { bg: '#111827', border: '#374151', badge: '#9ca3af', text: '데이터 수집 중' },
};

function num(v, decimals = 1) {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(decimals);
}

function DeltaBadge({ current, baseline, better = 'lower' }) {
  if (!baseline || !current) return <span style={{ color: '#6b7280', fontSize: 11 }}>기준선 없음</span>;
  const delta = ((current - baseline) / baseline) * 100;
  const improved = better === 'lower' ? delta < 0 : delta > 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: improved ? '#22c55e' : '#ef4444' }}>
      {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
      {improved ? ' ✓' : ' ✗'}
    </span>
  );
}

function KpiCard({ key: _k, metricKey, summary, baseline }) {
  const g = GOALS[metricKey];
  if (!g) return null;
  const val      = parseFloat(summary?.[metricKey] ?? 0);
  const baseVal  = baseline?.[metricKey] != null ? parseFloat(baseline[metricKey]) : null;

  return (
    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{g.label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color: g.color, margin: '4px 0' }}>
        {num(val, metricKey === 'avg_response_length' ? 0 : 1)}
        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280', marginLeft: 4 }}>{g.unit}</span>
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#4b5563' }}>목표: {g.target}</span>
        <DeltaBadge current={val} baseline={baseVal} better={g.better} />
      </div>
      {baseVal !== null && (
        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>기준: {num(baseVal, metricKey === 'avg_response_length' ? 0 : 1)} {g.unit}</p>
      )}
    </div>
  );
}

function VerdictCard({ verdict, goals }) {
  if (!verdict) return null;
  const style = VERDICT_STYLE[verdict.status] ?? VERDICT_STYLE.insufficient_data;

  return (
    <div style={{ background: style.bg, border: `2px solid ${style.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ background: style.badge, color: '#000', fontWeight: 800, fontSize: 11, padding: '3px 10px', borderRadius: 99 }}>
          {style.text}
        </span>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{verdict.message}</span>
      </div>

      {goals && Object.keys(goals).some(k => goals[k]) && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          {Object.entries(goals).map(([k, g]) => g && (
            <div key={k} style={{ fontSize: 12, color: '#d1d5db' }}>
              {GOALS[k]?.label ?? k}: {' '}
              <span style={{ color: g.achieved ? '#22c55e' : '#f87171', fontWeight: 700 }}>
                {g.achieved ? `${g.target} ✓` : `미달 (${g.target})`}
              </span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
        "클릭은 관심이고, 결제는 확신이다" — 재시도는 컨텍스트 손실, 완료는 팀 기억력이다
      </p>
    </div>
  );
}

function TrendTable({ trend }) {
  if (!trend?.length) return <p style={{ color: '#6b7280', fontSize: 13 }}>데이터 없음</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {['날짜', '시작', '재시도', '완료', '재시도율', '평균 턴'].map(h => (
            <th key={h} style={{ padding: '4px 8px', color: '#9ca3af', textAlign: h === '날짜' ? 'left' : 'right', fontSize: 11 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {trend.map(r => (
          <tr key={r.kst_date} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <td style={{ padding: '6px 8px', color: '#e5e7eb' }}>{r.kst_date}</td>
            <td style={{ textAlign: 'right', padding: '6px 8px', color: '#9ca3af' }}>{r.starts}</td>
            <td style={{ textAlign: 'right', padding: '6px 8px', color: r.retries > 0 ? '#f87171' : '#9ca3af' }}>{r.retries}</td>
            <td style={{ textAlign: 'right', padding: '6px 8px', color: '#22c55e' }}>{r.completes}</td>
            <td style={{ textAlign: 'right', padding: '6px 8px', color: parseFloat(r.retry_rate_pct ?? 0) > 30 ? '#f59e0b' : '#9ca3af' }}>
              {r.retry_rate_pct ?? '—'}%
            </td>
            <td style={{ textAlign: 'right', padding: '6px 8px', color: '#60a5fa' }}>{r.avg_turns ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── 기준선 입력 모달 ──────────────────────────────────────────────
function BaselineModal({ onClose, onSave, adminKey }) {
  const [form, setForm] = useState({ retry_rate_pct: '', avg_turns: '', avg_response_length: '', note: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/ops/metrics/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          retry_rate_pct:      parseFloat(form.retry_rate_pct) || null,
          avg_turns:           parseFloat(form.avg_turns) || null,
          avg_response_length: parseFloat(form.avg_response_length) || null,
          note: form.note || '수동 기준선 설정',
        }),
      });
      onSave();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 360 }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>개선 전 기준선 입력</h3>
        {[
          { key: 'retry_rate_pct', label: '재시도율 (%)', placeholder: '예: 45.0' },
          { key: 'avg_turns', label: '평균 턴 수', placeholder: '예: 8.5' },
          { key: 'avg_response_length', label: '평균 응답 길이 (자)', placeholder: '예: 2400' },
          { key: 'note', label: '메모', placeholder: '예: ops-check PR 적용 전' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input
              type="text"
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                padding: '8px 10px', color: '#fff', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#374151', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer' }}>취소</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? '저장 중...' : '기준선 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function AdminKpiPage() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) ?? '');
  const [authed,   setAuthed]   = useState(false);
  const [kpiData,  setKpiData]  = useState(null);
  const [verdict,  setVerdict]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [days,     setDays]     = useState(7);
  const [showBaseline, setShowBaseline] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAll = useCallback(async (key) => {
    setLoading(true); setError(null);
    try {
      const [kRes, vRes] = await Promise.all([
        fetch(`/api/ops/metrics/kpi?days=${days}`, { headers: { 'x-admin-key': key } }),
        fetch('/api/ops/metrics/verdict', { headers: { 'x-admin-key': key } }),
      ]);
      if (kRes.status === 401) { setAuthed(false); setError('인증 실패'); return; }
      const [kJson, vJson] = await Promise.all([kRes.json(), vRes.json()]);
      setKpiData(kJson);
      setVerdict(vJson);
      setAuthed(true);
      setLastFetch(new Date().toLocaleTimeString('ko-KR'));
      localStorage.setItem(ADMIN_KEY_STORAGE, key);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_KEY_STORAGE);
    if (saved) fetchAll(saved);
  }, [fetchAll]);

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#111827', borderRadius: 16, padding: 32, width: 320, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Aurora 5 KPI</h2>
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>재시도율 · 턴 수 · 응답 길이</p>
          {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchAll(adminKey)}
            placeholder="Admin Key"
            style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
          <button onClick={() => fetchAll(adminKey)} disabled={loading}
            style={{ width: '100%', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? '...' : '입장'}
          </button>
        </div>
      </div>
    );
  }

  const summary  = kpiData?.summary;
  const baseline = verdict?.baseline;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '24px 16px', maxWidth: 720, margin: '0 auto' }}>
      {showBaseline && <BaselineModal onClose={() => setShowBaseline(false)} onSave={() => fetchAll(adminKey)} adminKey={adminKey} />}

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Aurora 5 KPI</h1>
          <p style={{ color: '#9ca3af', fontSize: 12, margin: '4px 0 0' }}>
            Claude Code 컨텍스트 최적화 효과 측정 · 최근 {days}일 · {lastFetch}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={days} onChange={e => setDays(Number(e.target.value))} onBlur={() => fetchAll(adminKey)}
            style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
            {[1,3,7,14,30].map(d => <option key={d} value={d}>{d}일</option>)}
          </select>
          <button onClick={() => setShowBaseline(true)}
            style={{ background: '#374151', border: 'none', borderRadius: 8, color: '#9ca3af', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
            기준선 설정
          </button>
          <button onClick={() => fetchAll(adminKey)} disabled={loading}
            style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#9ca3af', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
            {loading ? '...' : '새로고침'}
          </button>
        </div>
      </div>

      {/* 루미 판정 */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          루미 판정 (숫자로만)
        </h2>
        <VerdictCard verdict={verdict?.verdict} goals={verdict?.goals} />
      </section>

      {/* KPI 카드 3개 */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          핵심 지표 3개
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.keys(GOALS).map(k => (
            <KpiCard key={k} metricKey={k} summary={summary} baseline={baseline} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 14, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>완료 작업 <strong style={{ color: '#fff' }}>{summary?.tasks_completed ?? '—'}</strong></span>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>총 재시도 <strong style={{ color: '#f87171' }}>{summary?.total_retries ?? '—'}</strong></span>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>평균 소요 <strong style={{ color: '#60a5fa' }}>{summary?.avg_duration_sec ?? '—'}초</strong></span>
        </div>
      </section>

      {/* 일별 트렌드 */}
      <section style={{ marginBottom: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 20px' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          일별 트렌드
        </h2>
        <TrendTable trend={kpiData?.trend} />
      </section>

      {/* 분석 SQL */}
      <section style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          직접 분석 SQL (루미용)
        </h2>
        <pre style={{ fontSize: 11, color: '#a5f3fc', lineHeight: 1.7, overflow: 'auto', margin: 0 }}>{`-- 1. 재시도율
SELECT
  COUNT(*) FILTER (WHERE event_type='task_retry')::float /
  NULLIF(COUNT(*) FILTER (WHERE event_type='task_start'), 0) * 100 AS retry_rate_pct
FROM agent_metrics WHERE created_at >= NOW() - INTERVAL '7 days';

-- 2. 평균 턴 수
SELECT ROUND(AVG((value->>'turns')::int), 1) AS avg_turns
FROM agent_metrics WHERE event_type='task_complete';

-- 3. 평균 응답 길이
SELECT ROUND(AVG((value->>'response_length')::int), 0) AS avg_response_length
FROM agent_metrics WHERE event_type='response_metrics';`}</pre>
      </section>

      {/* 절대 금지 */}
      <section style={{ marginTop: 20, background: '#1c0000', border: '1px solid #7f1d1d', borderRadius: 12, padding: '14px 18px' }}>
        <p style={{ fontSize: 12, color: '#fca5a5' }}>
          ❌ 측정 안 하면 "좋아진 줄 착각" &nbsp;|&nbsp;
          ❌ 30명 미만 샘플로 결론 내리기 &nbsp;|&nbsp;
          ❌ 느낌으로 판단
        </p>
        <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>→ 반드시 숫자로만. 1일 수집 후 루미 판정.</p>
      </section>
    </div>
  );
}
