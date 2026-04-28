/**
 * AdminCablecarPage.jsx — 케이블카 별공방 운영 관리
 * 경로: /admin/cablecar
 *
 * Tab 1: 오늘 현황  — 신규 별, 활성화, 최근 피드
 * Tab 2: 별 현황    — stars.origin_location='yeosu_cablecar' 전체 목록
 * Tab 3: QR/운영    — QR 이미지, 연결 URL, 결제 상태
 *
 * 집계 SSOT: stars.origin_location = 'yeosu_cablecar'
 */

import { useState, useEffect, useCallback } from 'react';

// ── 스타일 ─────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#0A0E1A',
    color: '#E8E4F0',
    fontFamily: "'Noto Sans KR', sans-serif",
    padding: '0 0 60px',
  },
  header: {
    background: 'rgba(155,135,245,0.08)',
    borderBottom: '1px solid rgba(155,135,245,0.15)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: 800, color: '#E8E4F0' },
  badge: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
    color: '#9B87F5', background: 'rgba(155,135,245,0.12)',
    border: '1px solid rgba(155,135,245,0.25)',
    padding: '3px 10px', borderRadius: 20,
  },
  tabs: {
    display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 16px', gap: 4,
  },
  tab: (active) => ({
    padding: '12px 16px', fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? '#9B87F5' : 'rgba(255,255,255,0.4)',
    borderBottom: active ? '2px solid #9B87F5' : '2px solid transparent',
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
    marginBottom: -1,
  }),
  body: { padding: '16px 20px' },
  kpiRow: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  kpiCard: {
    flex: '1 1 120px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '14px 16px',
  },
  kpiValue: { fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 },
  kpiLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 10, marginTop: 20,
  },
  feedCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '10px 14px', marginBottom: 8,
    display: 'flex', alignItems: 'flex-start', gap: 10,
  },
  statusPill: (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'ON')     return { fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)',  padding: '2px 8px', borderRadius: 10, flexShrink: 0, border: '1px solid rgba(74,222,128,0.25)' };
    if (s === 'PRE-ON') return { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' };
    return               { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 10, flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' };
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    textAlign: 'left', padding: '8px 10px',
    color: 'rgba(255,255,255,0.35)', fontWeight: 600,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '9px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    verticalAlign: 'top',
  },
  filterRow: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filterBtn: (active) => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12,
    background: active ? 'rgba(155,135,245,0.2)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(155,135,245,0.4)' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#9B87F5' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
  }),
  opsCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '20px',
    marginBottom: 14,
  },
  opsRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  opsKey: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  opsVal: { fontSize: 13, fontWeight: 600, color: '#E8E4F0' },
  dlBtn: {
    display: 'inline-block', marginTop: 14,
    padding: '11px 20px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #9B87F5, #6B4FD8)',
    color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
    textDecoration: 'none',
  },
  errBox: {
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 10, padding: '12px 16px', marginBottom: 14,
    fontSize: 13, color: '#f87171',
  },
  spin: { textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 },
};

// ── 인증 레이어 ──────────────────────────────────────────────────────
function useAdminToken() {
  const [token, setToken] = useState(
    () => localStorage.getItem('dt_admin_token') || ''
  );
  const [authed, setAuthed] = useState(false);
  const [input,  setInput]  = useState('');

  const tryAuth = useCallback(async (t) => {
    const res = await fetch('/api/admin/cablecar/ops', {
      headers: { 'x-admin-token': t },
    });
    if (res.ok || res.status === 503) {
      localStorage.setItem('dt_admin_token', t);
      setToken(t); setAuthed(true);
    } else {
      alert('토큰이 올바르지 않습니다.');
    }
  }, []);

  useEffect(() => {
    if (token) tryAuth(token);
    else setAuthed(false);
  }, []); // eslint-disable-line

  return { token, authed, input, setInput, tryAuth };
}

// ── 공통 fetch helper ─────────────────────────────────────────────
function useFetch(url, token, enabled = true) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    if (!enabled || !url) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(url, { headers: { 'x-admin-token': token } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.status);
      setData(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url, token, enabled]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ── Tab 1: 오늘 현황 ─────────────────────────────────────────────
function TodayTab({ token }) {
  const { data, loading, error, reload } = useFetch('/api/admin/cablecar/today', token);

  const fmt = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div style={S.spin}>불러오는 중…</div>;
  if (error)   return <div style={S.errBox}>오류: {error} <button onClick={reload} style={{ marginLeft: 8, cursor: 'pointer', color: '#f87171', background: 'none', border: 'none' }}>재시도</button></div>;
  if (!data)   return null;

  const { kpi, feed } = data;

  return (
    <div>
      {/* 오늘 KPI */}
      <div style={S.sectionTitle}>오늘</div>
      <div style={S.kpiRow}>
        {[
          { value: kpi.new_today,      label: '신규 별 생성',  accent: '#9B87F5' },
          { value: kpi.awakened_today, label: '오늘 활성화',   accent: '#4ade80' },
        ].map(k => (
          <div key={k.label} style={{ ...S.kpiCard, borderColor: `${k.accent}30` }}>
            <div style={{ ...S.kpiValue, color: k.accent }}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* 누적 KPI */}
      <div style={S.sectionTitle}>누적</div>
      <div style={S.kpiRow}>
        {[
          { value: kpi.total_all,      label: '전체 별' },
          { value: kpi.total_awakened, label: '활성화' },
          { value: kpi.total_pending,  label: '미활성' },
        ].map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiValue}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* 최근 피드 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={S.sectionTitle}>최근 진입 피드</div>
        <button onClick={reload} style={{ ...S.filterBtn(false), fontSize: 11, padding: '3px 10px', border: 'none' }}>
          새로고침 ↻
        </button>
      </div>
      {feed.map((f) => (
        <div key={f.id} style={S.feedCard}>
          <div>
            <span style={S.statusPill(f.status)}>{f.status}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E8E4F0', marginBottom: 2 }}>
              {f.star_name}
            </div>
            {f.wish_preview && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                "{f.wish_preview}{f.wish_preview?.length >= 40 ? '…' : ''}"
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
            {fmt(f.created_at)}
          </div>
        </div>
      ))}
      {feed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
          아직 진입 이력이 없습니다
        </div>
      )}
    </div>
  );
}

// ── Tab 2: 별 현황 ────────────────────────────────────────────────
function StarsTab({ token }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const url = statusFilter === 'all'
    ? '/api/admin/cablecar/stars'
    : `/api/admin/cablecar/stars?status=${statusFilter}`;

  const { data, loading, error, reload } = useFetch(url, token);

  const fmtDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const STATUS_OPTS = [
    { key: 'all',    label: '전체' },
    { key: 'ON',     label: '활성화' },
    { key: 'PRE-ON', label: '미활성' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          기준: <code style={{ color: '#9B87F5' }}>origin_location = 'yeosu_cablecar'</code>
        </div>
        {data && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            총 {data.total}개
          </div>
        )}
      </div>

      <div style={S.filterRow}>
        {STATUS_OPTS.map(o => (
          <button key={o.key} style={S.filterBtn(statusFilter === o.key)}
            onClick={() => setStatusFilter(o.key)}>
            {o.label}
          </button>
        ))}
        <button onClick={reload} style={{ ...S.filterBtn(false), marginLeft: 'auto' }}>↻</button>
      </div>

      {loading && <div style={S.spin}>불러오는 중…</div>}
      {error   && <div style={S.errBox}>오류: {error}</div>}
      {!loading && !error && data && (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['별 이름', '상태', '소원 (요약)', '생성일시'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.stars.map((s) => (
                <tr key={s.id}>
                  <td style={S.td}>
                    <span style={{ fontWeight: 700, color: '#E8E4F0' }}>{s.star_name}</span>
                  </td>
                  <td style={S.td}>
                    <span style={S.statusPill(s.status)}>{s.status}</span>
                  </td>
                  <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)', maxWidth: 200 }}>
                    {s.wish_preview
                      ? `"${s.wish_preview}${s.wish_preview.length >= 60 ? '…' : ''}"`
                      : <span style={{ opacity: 0.3 }}>-</span>}
                  </td>
                  <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                    {fmtDate(s.created_at)}
                  </td>
                </tr>
              ))}
              {data.stars.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 24 }}>
                    해당 조건의 별이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: QR / 운영 설정 ────────────────────────────────────────
function OpsTab({ token }) {
  const { data, loading, error } = useFetch('/api/admin/cablecar/ops', token);

  if (loading) return <div style={S.spin}>불러오는 중…</div>;
  if (error)   return <div style={S.errBox}>오류: {error}</div>;
  if (!data)   return null;

  const { payment_enabled, qr_url, qr_image_path, qr_download_name, stats, ssot_field } = data;

  return (
    <div>
      {/* QR 이미지 */}
      <div style={S.sectionTitle}>현재 활성 QR</div>
      <div style={{ ...S.opsCard, textAlign: 'center' }}>
        <img
          src={qr_image_path}
          alt="케이블카 체험 입장 QR"
          style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', padding: 4 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>
          {qr_url}
        </div>
        <a href={qr_image_path} download={qr_download_name} style={S.dlBtn}>
          PNG 다운로드
        </a>
      </div>

      {/* 운영 상태 */}
      <div style={S.sectionTitle}>운영 상태</div>
      <div style={S.opsCard}>
        {[
          {
            key: '결제 시스템 (CABLECAR_PAYMENT_ENABLED)',
            val: payment_enabled ? '🟢 활성' : '🔴 비활성 (무료 운영 중)',
            accent: payment_enabled ? '#4ade80' : '#f87171',
          },
          { key: '집계 기준 필드 (SSOT)', val: ssot_field },
          { key: '집계 값', val: `origin_location = 'yeosu_cablecar'` },
          { key: 'QR 연결 URL', val: qr_url },
        ].map((r) => (
          <div key={r.key} style={S.opsRow}>
            <div style={S.opsKey}>{r.key}</div>
            <div style={{ ...S.opsVal, color: r.accent || '#E8E4F0', fontSize: 12, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>
              {r.val}
            </div>
          </div>
        ))}
      </div>

      {/* 집계 통계 */}
      <div style={S.sectionTitle}>전체 별 통계</div>
      <div style={S.kpiRow}>
        {[
          { value: stats.total_stars, label: '전체 별' },
          { value: stats.awakened,    label: '활성화' },
          { value: stats.pending,     label: '미활성' },
        ].map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiValue}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* 확장 가이드 */}
      <div style={S.sectionTitle}>신규 별공방 확장 방법</div>
      <div style={{ ...S.opsCard, fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.5)' }}>
        <div style={{ marginBottom: 8, color: '#9B87F5', fontWeight: 700 }}>새 별공방 장소 추가 시 (예: hamel, odongjae)</div>
        <div>① QR URL: <code style={{ color: '#E8E4F0' }}>/star-entry.html?loc=hamel</code></div>
        <div>② <code style={{ color: '#E8E4F0' }}>star-entry.html</code> LOC_CONFIG에 <code style={{ color: '#E8E4F0' }}>hamel: &#123;…&#125;</code> 키 추가</div>
        <div>③ <code style={{ color: '#E8E4F0' }}>AdminDashboardPage.jsx</code> WORKSHOP_CONFIGS에 <code style={{ color: '#E8E4F0' }}>locationCode: 'hamel'</code> 추가</div>
        <div>④ 집계: <code style={{ color: '#E8E4F0' }}>stars WHERE origin_location = 'hamel'</code> — 별도 라우트 불필요</div>
        <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.3)' }}>→ stars.origin_location 기반 단일 테이블, 파라미터화만으로 확장 가능</div>
      </div>
    </div>
  );
}

// ── 로그인 화면 ───────────────────────────────────────────────────
function LoginScreen({ input, setInput, tryAuth }) {
  return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚡</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>케이블카 별공방 운영</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
          관리자 토큰을 입력하세요
        </div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tryAuth(input)}
          type="password"
          placeholder="Admin Token"
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#E8E4F0', fontSize: 14, outline: 'none',
            fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 10, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={() => tryAuth(input)}
          style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #9B87F5, #6B4FD8)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          접속
        </button>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'today', label: '오늘 현황' },
  { key: 'stars', label: '별 현황' },
  { key: 'ops',   label: 'QR / 운영' },
];

export default function AdminCablecarPage() {
  const { token, authed, input, setInput, tryAuth } = useAdminToken();
  const [activeTab, setActiveTab] = useState('today');

  if (!authed) {
    return <LoginScreen input={input} setInput={setInput} tryAuth={tryAuth} />;
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.title}>🚡 케이블카 별공방 운영</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            /admin/cablecar · stars.origin_location = 'yeosu_cablecar'
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={S.badge}>별공방 Admin</span>
          <a href="/admin" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
            대시보드
          </a>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {activeTab === 'today' && <TodayTab token={token} />}
        {activeTab === 'stars' && <StarsTab token={token} />}
        {activeTab === 'ops'   && <OpsTab   token={token} />}
      </div>
    </div>
  );
}
