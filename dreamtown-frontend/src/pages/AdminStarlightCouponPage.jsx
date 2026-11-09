import React, { useState, useEffect, useCallback } from 'react';

const API = '/api/admin/starlight-coupons';

function getKey() {
  return sessionStorage.getItem('admin_key') || '';
}

export default function AdminStarlightCouponPage() {
  const [key, setKey]       = useState(getKey());
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [stats, setStats]   = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [venue, setVenue]   = useState('');
  const [err, setErr]       = useState('');

  const fetchData = useCallback(async (adminKey) => {
    setLoading(true);
    setErr('');
    try {
      const qs = venue ? `?venue=${encodeURIComponent(venue)}&key=${encodeURIComponent(adminKey)}` : `?key=${encodeURIComponent(adminKey)}`;
      const [sRes, lRes] = await Promise.all([
        fetch(`${API}/stats?key=${encodeURIComponent(adminKey)}`),
        fetch(`${API}/list${qs}`),
      ]);
      const sData = await sRes.json();
      const lData = await lRes.json();
      if (!sData.ok) throw new Error(sData.error);
      if (!lData.ok) throw new Error(lData.error);
      setStats(sData.stats);
      setCoupons(lData.coupons);
      setAuthed(true);
    } catch (e) {
      setErr(e.message || '조회 실패');
      if (e.message?.includes('인증')) { setAuthed(false); }
    } finally {
      setLoading(false);
    }
  }, [venue]);

  const handleLogin = async () => {
    setAuthErr('');
    if (!key) { setAuthErr('관리자 키를 입력하세요.'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/stats?key=${encodeURIComponent(key)}`);
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      sessionStorage.setItem('admin_key', key);
      setStats(data.stats);
      setAuthed(true);
      await fetchData(key);
    } catch (e) {
      setAuthErr(e.message || '인증 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed && key) fetchData(key);
  }, [venue]);

  if (!authed) {
    return (
      <div style={s.wrap}>
        <div style={s.loginCard}>
          <h2 style={s.loginTitle}>✦ 별빛쿠폰 관리자</h2>
          <input
            type="password"
            placeholder="관리자 키"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={s.input}
          />
          {authErr && <p style={s.errMsg}>{authErr}</p>}
          <button onClick={handleLogin} disabled={loading} style={s.btn}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.container}>
        <h1 style={s.heading}>✦ 별빛쿠폰 대시보드</h1>

        {/* Stats */}
        {stats && (
          <div style={s.statsRow}>
            <StatCard label="총 발급" value={stats.total_issued} />
            <StatCard label="조회됨" value={stats.total_viewed} />
            <StatCard label="사용 완료" value={stats.total_used} />
            <StatCard label="사용률" value={`${stats.use_rate}%`} />
          </div>
        )}

        {/* Filter */}
        <div style={s.filterRow}>
          <input
            placeholder="venue_id 필터 (선택)"
            value={venue}
            onChange={e => setVenue(e.target.value)}
            style={{ ...s.input, flex: 1 }}
          />
          <button onClick={() => fetchData(key)} disabled={loading} style={s.refreshBtn}>
            {loading ? '...' : '새로고침'}
          </button>
        </div>

        {err && <p style={s.errMsg}>{err}</p>}

        {/* Table */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['쿠폰 ID', '호텔', '가맹점', '발급', '조회', '상태'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 && (
                <tr><td colSpan={6} style={s.empty}>쿠폰 없음</td></tr>
              )}
              {coupons.map(c => (
                <tr key={c.id} style={s.tr}>
                  <td style={s.td}><code style={s.code}>{c.id.slice(0, 8).toUpperCase()}</code></td>
                  <td style={s.td}>{c.hotel_source}</td>
                  <td style={s.td}>{c.venue_id}</td>
                  <td style={s.td}>{fmtDate(c.issued_at)}</td>
                  <td style={s.td}>{c.viewed_at ? fmtDate(c.viewed_at) : <span style={s.muted}>미조회</span>}</td>
                  <td style={s.td}>
                    {c.is_used
                      ? <span style={s.badgeUsed}>사용완료</span>
                      : <span style={s.badgeReady}>미사용</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={s.note}>최대 100건 표시 · Production 활성화 전 테스트 데이터만 표시됩니다</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={s.statCard}>
      <p style={s.statValue}>{value}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const s = {
  wrap: {
    minHeight: '100dvh',
    background: '#0d0d1a',
    color: '#fff',
    fontFamily: "'Pretendard', sans-serif",
    padding: '24px 16px',
  },
  loginCard: {
    maxWidth: '340px', margin: '80px auto',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,215,120,0.2)',
    borderRadius: '16px',
    padding: '32px 24px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  loginTitle: { margin: '0 0 8px', fontWeight: 700, fontSize: '1.1rem' },
  container: { maxWidth: '900px', margin: '0 auto' },
  heading: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px',
  },
  statCard: {
    background: 'rgba(255,215,120,0.08)',
    border: '1px solid rgba(255,215,120,0.18)',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  statValue: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px', color: '#FFD67A' },
  statLabel: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '16px' },
  input: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px 14px',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    background: '#FFD67A', color: '#130b1e', border: 'none',
    borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer',
  },
  refreshBtn: {
    background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' },
  th: {
    padding: '10px 12px', textAlign: 'left',
    color: 'rgba(255,255,255,0.4)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontWeight: 500,
  },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '10px 12px', verticalAlign: 'middle' },
  code: { fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' },
  muted: { color: 'rgba(255,255,255,0.3)' },
  badgeUsed: {
    background: 'rgba(100,220,120,0.15)', color: '#6EDC6E',
    border: '1px solid rgba(100,220,120,0.3)',
    borderRadius: '50px', padding: '2px 10px', fontSize: '0.75rem',
  },
  badgeReady: {
    background: 'rgba(255,215,120,0.10)', color: '#FFD67A',
    border: '1px solid rgba(255,215,120,0.25)',
    borderRadius: '50px', padding: '2px 10px', fontSize: '0.75rem',
  },
  errMsg: { color: '#FF7070', fontSize: '0.8rem', margin: '4px 0 0' },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' },
  note: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '12px' },
};
