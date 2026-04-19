/**
 * AdminJourneyDashboard.jsx — Journey 운영 통제실
 * 경로: /admin/journey?key=ADMIN_KEY&role=lumi
 * 역할별 기본 탭: 푸르미르=Overview, 루미=Stars, 코미/여의보주=Risk, 재미=Content
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const BASE = '/api/admin/dashboard';
const ROLE_DEFAULT_TAB = { 푸르미르: 'overview', 루미: 'stars', 코미: 'risk', 재미: 'content', 여의보주: 'risk' };

const S = {
  page:    { minHeight: '100vh', background: '#0a0a0f', padding: '20px 16px 60px', fontFamily: "'Noto Sans KR', monospace", color: '#c9c9d4' },
  header:  { marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:   { fontSize: 16, fontWeight: 800, color: '#e8e4f0' },
  tabs:    { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
  tab:     (active) => ({ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: active ? '#6a5fa0' : 'rgba(255,255,255,0.05)', color: active ? '#fff' : '#5a5a78' }),
  card:    { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 14 },
  cardH:   { fontSize: 10, fontWeight: 700, color: '#6a5fa0', letterSpacing: '0.1em', marginBottom: 12 },
  grid6:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 4 },
  metric:  { textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 },
  metricN: { fontSize: 22, fontWeight: 800, color: '#e8e4f0' },
  metricL: { fontSize: 10, color: '#4a4a60', marginTop: 3 },
  row:     { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11 },
  badge:   (ok) => ({ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.12)', color: ok ? '#4ade80' : '#f87171' }),
  warn:    { color: '#f87171' },
  ok:      { color: '#4ade80' },
  muted:   { color: '#3a3a52' },
  btn:     { padding: '5px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'rgba(106,95,160,0.3)', color: '#a09acd', marginTop: 8 },
};

// ── 공통 fetch ────────────────────────────────────────────────────
async function apiFetch(path, key) {
  try {
    const r = await fetch(`${BASE}/${path}${key ? `?key=${key}` : ''}`);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// ── 탭 패널들 ─────────────────────────────────────────────────────

function OverviewTab({ data, loading }) {
  if (loading) return <div style={S.muted}>로딩 중...</div>;
  if (!data?.today) return <div style={S.muted}>데이터 없음</div>;
  const t = data.today;
  const metrics = [
    { n: t.new_wishes,           l: '신규 소원이' },
    { n: t.red_count,            l: '즉시 대응', warn: t.red_count > 0 },
    { n: `${t.action_click_rate}%`, l: 'action 클릭률' },
    { n: `${t.question_answer_rate}%`, l: '질문 응답률' },
    { n: `${t.revisit_rate}%`,   l: '재방문률' },
    { n: t.growth_entries,       l: '성장 진입', ok: t.growth_entries > 0 },
  ];
  return (
    <div>
      <div style={S.cardH}>오늘의 핵심 상태</div>
      <div style={S.grid6}>
        {metrics.map(({ n, l, warn, ok }) => (
          <div key={l} style={S.metric}>
            <div style={{ ...S.metricN, color: warn ? '#f87171' : ok ? '#4ade80' : '#e8e4f0' }}>{n}</div>
            <div style={S.metricL}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.muted, fontSize: 10, marginTop: 8 }}>갱신: {data.ts?.slice(11,19)}</div>
    </div>
  );
}

function StarsTab({ data, loading, apiKey }) {
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    apiFetch('stars', apiKey).then(setDetail);
  }, [apiKey]);

  if (loading || !detail) return <div style={S.muted}>로딩 중...</div>;
  const s = detail.stars || {};
  const phases = Object.entries(s.phase_distribution || {}).sort((a,b) => b[1]-a[1]);

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardH}>Phase 분포</div>
        {phases.map(([ph, n]) => (
          <div key={ph} style={S.row}>
            <span>{ph}</span>
            <span style={['흔들림','정리'].includes(ph) ? S.warn : S.ok}>{n}명</span>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardH}>전환 흐름</div>
        {[['정체', s.stagnant_count, true], ['회복', s.recovery_count, false], ['전환', s.transition_count, false], ['성장', s.growth_count, false]].map(([l, n, warn]) => (
          <div key={l} style={S.row}>
            <span>{l}</span>
            <span style={warn && n > 0 ? S.warn : S.ok}>{n ?? '-'}명</span>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={() => apiFetch('risk-users?type=stagnant', apiKey).then(d => alert(JSON.stringify(d?.users?.slice(0,3), null, 2)))}>
        정체 사용자 보기
      </button>
    </div>
  );
}

function RiskTab({ apiKey }) {
  const [data, setData] = useState(null);
  const [type, setType] = useState('stagnant');
  useEffect(() => {
    apiFetch(`risk-users?type=${type}`, apiKey).then(setData);
  }, [type, apiKey]);

  const users = data?.users || [];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['stagnant','dropoff'].map(t => (
          <button key={t} style={S.tab(type === t)} onClick={() => setType(t)}>
            {t === 'stagnant' ? '3일 정체' : '이탈 위험'}
          </button>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardH}>위험 사용자 ({users.length}명)</div>
        {users.length === 0
          ? <div style={S.muted}>해당 없음</div>
          : users.map((u, i) => (
            <div key={i} style={{ ...S.row, flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
              <span style={{ color: '#f87171', fontSize: 10 }}>{String(u.user_id).slice(0,8)}…</span>
              <span style={S.muted}>{u.risk_reason} → {u.recommended_action}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function PlacesTab({ apiKey }) {
  const [data, setData] = useState(null);
  useEffect(() => { apiFetch('places', apiKey).then(setData); }, [apiKey]);

  if (!data) return <div style={S.muted}>로딩 중...</div>;
  const p = data.places || {};
  return (
    <div>
      <div style={S.card}>
        <div style={S.cardH}>TOP 장소 유형</div>
        {(p.top_spots || []).map((r, i) => (
          <div key={i} style={S.row}><span>{r.spot_type}</span><span>{r.count}건</span></div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardH}>흔들림 많은 장소</div>
        {(p.unstable_spots || []).map((r, i) => (
          <div key={i} style={S.row}><span>{r.spot_name}</span><span style={S.warn}>{r.state} {r.count}건</span></div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardH}>회복 많은 장소</div>
        {(p.recovery_spots || []).map((r, i) => (
          <div key={i} style={S.row}><span>{r.spot_name}</span><span style={S.ok}>{r.state} {r.count}건</span></div>
        ))}
      </div>
    </div>
  );
}

function ContentTab({ apiKey }) {
  const [data, setData] = useState(null);
  useEffect(() => { apiFetch('content', apiKey).then(setData); }, [apiKey]);

  if (!data) return <div style={S.muted}>로딩 중...</div>;
  const c = data.content || {};
  return (
    <div>
      <div style={S.card}>
        <div style={S.cardH}>질문 응답률 (7일)</div>
        {(c.question_performance || []).map((r, i) => (
          <div key={i} style={S.row}>
            <span>{r.question_type}</span>
            <span style={r.answer_rate > 50 ? S.ok : S.warn}>{r.answer_rate}% ({r.answered}/{r.shown})</span>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardH}>Action 클릭률 (7일)</div>
        {(c.action_performance || []).map((r, i) => (
          <div key={i} style={S.row}>
            <span>{r.phase || '-'}</span>
            <span style={r.click_rate > 30 ? S.ok : S.warn}>{r.click_rate}% ({r.clicked}/{r.views})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationsTab({ apiKey }) {
  const [data, setData] = useState(null);
  useEffect(() => { apiFetch('operations', apiKey).then(setData); }, [apiKey]);

  if (!data) return <div style={S.muted}>로딩 중...</div>;
  const o = data.operations || {};
  const rows = [
    { l: 'DB 상태',           v: o.db_status, ok: o.db_status === 'ok' },
    { l: '오늘 이벤트 수',    v: o.events_today },
    { l: '오늘 daily log 수', v: o.daily_logs_today },
    { l: 'summary 갱신 수',   v: o.summaries_refreshed },
    { l: '마지막 갱신',       v: o.last_updated_at?.slice(11,19) },
  ];
  return (
    <div style={S.card}>
      <div style={S.cardH}>시스템 운영 상태</div>
      {rows.map(({ l, v, ok }) => (
        <div key={l} style={S.row}>
          <span>{l}</span>
          {ok !== undefined
            ? <span style={S.badge(ok)}>{v}</span>
            : <span style={{ color: '#b0aac8', fontFamily: 'monospace' }}>{v ?? '-'}</span>
          }
        </div>
      ))}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'stars',       label: 'Stars' },
  { id: 'places',      label: 'Places' },
  { id: 'risk',        label: 'Risk' },
  { id: 'content',     label: 'Content' },
  { id: 'operations',  label: 'Ops' },
];

export default function AdminJourneyDashboard() {
  const [params]    = useSearchParams();
  const apiKey      = params.get('key') || '';
  const role        = params.get('role') || '푸르미르';
  const defaultTab  = ROLE_DEFAULT_TAB[role] || 'overview';

  const [tab, setTab]       = useState(defaultTab);
  const [overview, setOv]   = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    apiFetch('overview', apiKey).then(d => { setOv(d); setLoading(false); });
  }, [apiKey]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.title}>🌌 Journey 운영 통제실</div>
          <div style={{ fontSize: 10, color: '#3a3a52' }}>role: {role}</div>
        </div>
        <button style={S.btn} onClick={refresh}>새로고침</button>
      </div>

      {/* 상단: Overview 카드 항상 표시 */}
      <div style={S.card}>
        <OverviewTab data={overview} loading={loading} />
      </div>

      {/* 탭 */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'overview'   && <OverviewTab   data={overview} loading={loading} />}
      {tab === 'stars'      && <StarsTab      data={overview} loading={loading} apiKey={apiKey} />}
      {tab === 'places'     && <PlacesTab     apiKey={apiKey} />}
      {tab === 'risk'       && <RiskTab       apiKey={apiKey} />}
      {tab === 'content'    && <ContentTab    apiKey={apiKey} />}
      {tab === 'operations' && <OperationsTab apiKey={apiKey} />}
    </div>
  );
}
