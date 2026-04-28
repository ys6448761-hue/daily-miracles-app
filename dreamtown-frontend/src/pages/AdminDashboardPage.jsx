/**
 * AdminDashboardPage.jsx — 운영 관제판 (P0)
 * 경로: /admin
 * 인증: ?key=ADMIN_API_KEY
 */

import { useEffect, useState, useCallback } from 'react';

// ── 별공방 Config — 새 별공방 추가 시 여기만 수정 ────────────────
const WORKSHOP_CONFIGS = [
  {
    name:         '케이블카 별공방',
    locationCode: 'yeosu_cablecar',
    userUrl:      '/star-entry.html?loc=yeosu_cablecar',
    adminUrl:     '/admin/cablecar',
    qrUrl:        '/star-entry.html?loc=yeosu_cablecar&qr=1',
    status:       'testing',
  },
  {
    name:         '라또아 별공방',
    locationCode: 'lattoa_cafe',
    userUrl:      '/star-entry.html?loc=lattoa_cafe',
    adminUrl:     '/admin/location/lattoa_cafe',
    qrUrl:        '/star-entry.html?loc=lattoa_cafe&qr=1',
    status:       'testing',
  },
];

const STATUS_LABELS = { ready: '준비중', testing: '테스트중', running: '운영중' };
const STATUS_STYLE  = {
  ready:   { bg: 'rgba(100,100,140,0.15)', color: '#6b6b90', border: 'rgba(100,100,140,0.3)' },
  testing: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  running: { bg: 'rgba(74,222,128,0.10)',  color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
};

const S = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    padding: '24px 20px 60px',
    fontFamily: "'Noto Sans KR', monospace",
    color: '#c9c9d4',
  },
  header: { marginBottom: 28 },
  title: { fontSize: 18, fontWeight: 800, color: '#e8e4f0', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#4a4a60' },
  grid: { display: 'grid', gap: 16 },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '18px 20px',
  },
  cardTitle: { fontSize: 11, fontWeight: 700, color: '#6a5fa0', letterSpacing: '0.1em', marginBottom: 14 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, color: '#5a5a78' },
  value: { fontSize: 12, color: '#b0aac8', fontFamily: 'monospace' },
  badge: (ok) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.12)',
    color: ok ? '#4ade80' : '#f87171',
    border: `1px solid ${ok ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
  }),
  errRow: {
    padding: '8px 10px', borderRadius: 8, marginBottom: 6,
    background: 'rgba(255,255,255,0.02)', fontSize: 11, fontFamily: 'monospace',
    display: 'grid', gridTemplateColumns: '48px 52px 1fr 110px', gap: 8, alignItems: 'center',
  },
  errStatus: (s) => ({
    fontWeight: 700,
    color: s >= 500 ? '#f87171' : s >= 400 ? '#fb923c' : '#6a5fa0',
  }),
  statNum: { fontSize: 28, fontWeight: 900, color: '#a78bfa', lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#4a4a60', marginTop: 4 },
  refreshBtn: {
    background: 'none', border: '1px solid rgba(167,139,250,0.2)',
    color: '#a78bfa', fontSize: 11, borderRadius: 8, padding: '5px 14px',
    cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
  },
  authBox: {
    maxWidth: 340, margin: '80px auto', padding: '32px 24px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(167,139,250,0.15)',
    borderRadius: 18, textAlign: 'center',
  },
  input: {
    width: '100%', padding: '11px 14px', borderRadius: 10, marginTop: 16,
    border: '1px solid rgba(167,139,250,0.2)', background: 'rgba(255,255,255,0.04)',
    color: '#e8e4f0', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box',
    outline: 'none',
  },
  submitBtn: {
    display: 'block', width: '100%', marginTop: 12,
    padding: '11px 0', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#7b5ce5,#a78bfa)',
    color: '#fff', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
  },
  wBtn: (color) => ({
    padding: '11px 8px',
    background: `${color}22`,
    border: `1px solid ${color}55`,
    borderRadius: 10,
    color,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Noto Sans KR', sans-serif",
    cursor: 'pointer',
    textAlign: 'center',
    WebkitTapHighlightColor: 'transparent',
  }),
};

function fmt(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { hour12: false });
}
function uptimeStr(sec) {
  if (!sec) return '-';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

// ── 카드 1: Deploy Status ────────────────────────────────────────
function DeployCard({ deploy }) {
  const deploys = deploy?.renderApi;
  const latest  = Array.isArray(deploys) ? deploys[0] : null;

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>1️⃣  DEPLOY STATUS</div>
      <div style={S.row}>
        <span style={S.label}>현재 커밋</span>
        <span style={{ ...S.value, color: '#c084fc' }}>{deploy?.commit?.slice(0, 8) || '-'}</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>브랜치</span>
        <span style={S.value}>{deploy?.branch || '-'}</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>서버 시작</span>
        <span style={S.value}>{fmt(deploy?.serverStart)}</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>가동 시간</span>
        <span style={S.value}>{uptimeStr(deploy?.uptimeSec)}</span>
      </div>
      {latest && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
          <div style={S.row}>
            <span style={S.label}>Render 최근 배포</span>
            <span style={S.badge(latest.deploy?.status === 'live')}>{latest.deploy?.status || '-'}</span>
          </div>
          <div style={S.row}>
            <span style={S.label}>배포 시각</span>
            <span style={S.value}>{fmt(latest.deploy?.createdAt)}</span>
          </div>
        </>
      )}
      {!deploy?.renderApi && (
        <div style={{ fontSize: 11, color: '#3a3a52', marginTop: 8 }}>
          ⚠ RENDER_API_KEY + RENDER_SERVICE_ID 미설정 — Render API 연결 안 됨
        </div>
      )}
      {deploy?.renderApi?.error && (
        <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>
          Render API 오류: {deploy.renderApi.error}
        </div>
      )}
    </div>
  );
}

// ── 카드 2: Service Health ───────────────────────────────────────
function HealthCard({ health }) {
  const ok = health?.db === 'ok';
  return (
    <div style={{ ...S.card, borderColor: ok ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.2)' }}>
      <div style={S.cardTitle}>2️⃣  SERVICE HEALTH</div>
      <div style={S.row}>
        <span style={S.label}>API 서버</span>
        <span style={S.badge(true)}>OK</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>DB 연결</span>
        <span style={S.badge(ok)}>{health?.db ?? '알 수 없음'}</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>DB 응답</span>
        <span style={S.value}>{health?.dbMs != null ? `${health.dbMs}ms` : '-'}</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>마지막 체크</span>
        <span style={S.value}>{fmt(health?.checkedAt)}</span>
      </div>
      {health?.error && (
        <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>{health.error}</div>
      )}
    </div>
  );
}

// ── 카드 3: Error Feed ───────────────────────────────────────────
function ErrorFeedCard({ errors }) {
  if (!errors?.length) {
    return (
      <div style={S.card}>
        <div style={S.cardTitle}>3️⃣  ERROR FEED (최근 20개)</div>
        <div style={{ fontSize: 12, color: '#3a3a52', textAlign: 'center', padding: '16px 0' }}>
          에러 없음 ✓
        </div>
      </div>
    );
  }
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>3️⃣  ERROR FEED (최근 {errors.length}개)</div>
      <div style={{ overflowX: 'auto' }}>
        {errors.map((e, i) => (
          <div key={i} style={S.errRow}>
            <span style={{ color: '#5a5a78', fontSize: 10 }}>{e.method}</span>
            <span style={S.errStatus(e.status)}>{e.status}</span>
            <span style={{ color: '#8080a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.route}
            </span>
            <span style={{ color: '#3a3a52', fontSize: 10 }}>
              {e.ts ? new Date(e.ts).toLocaleTimeString('ko-KR', { hour12: false }) : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 카드 4: Core User Flow ───────────────────────────────────────
function FlowCard({ flowStats }) {
  if (!flowStats) {
    return (
      <div style={S.card}>
        <div style={S.cardTitle}>4️⃣  CORE USER FLOW — Promise (최근 1시간)</div>
        <div style={{ fontSize: 12, color: '#3a3a52' }}>DB 미연결 또는 테이블 없음</div>
      </div>
    );
  }
  if (flowStats.error) {
    return (
      <div style={S.card}>
        <div style={S.cardTitle}>4️⃣  CORE USER FLOW — Promise (최근 1시간)</div>
        <div style={{ fontSize: 11, color: '#f87171' }}>{flowStats.error}</div>
      </div>
    );
  }
  const stats = [
    { label: '/promise/create 성공', val: flowStats.created1h },
    { label: '사진 포함 생성', val: flowStats.withPhoto1h },
    { label: '/promise/:id/open 성공', val: flowStats.opened1h },
  ];
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>4️⃣  CORE USER FLOW — Promise (최근 1시간)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {stats.map(({ label, val }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={S.statNum}>{val ?? '-'}</div>
            <div style={S.statLabel}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 카드 5: Alert Center ─────────────────────────────────────────
function AlertCard({ alerts, errors }) {
  const err5xx = errors?.filter(e => e.status >= 500) ?? [];
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>5️⃣  ALERT CENTER</div>
      <div style={S.row}>
        <span style={S.label}>Slack 웹훅</span>
        <span style={S.badge(alerts?.slackConfigured)}>{alerts?.slackConfigured ? '설정됨' : '미설정'}</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>Render API</span>
        <span style={S.badge(alerts?.renderApiConfigured)}>{alerts?.renderApiConfigured ? '설정됨' : '미설정'}</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>5xx 에러 (최근)</span>
        <span style={{ ...S.badge(alerts?.recentErrors500 === 0), minWidth: 32, textAlign: 'center' }}>
          {alerts?.recentErrors500 ?? 0}
        </span>
      </div>
      {err5xx.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
          {err5xx.slice(0, 3).map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: '#f87171', marginBottom: 4, fontFamily: 'monospace' }}>
              {e.method} {e.route} → {e.status} [{e.ts?.slice(11, 19)}]
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── 별공방 카드 (단일) ────────────────────────────────────────────
function WorkshopCard({ config, stats, adminKey }) {
  const s  = stats?.[config.locationCode] ?? {};
  const sc = STATUS_STYLE[config.status] ?? STATUS_STYLE.ready;
  const open = url => window.open(url, '_blank');

  // 관리자 페이지 URL — /admin/location/* 경로는 ?token= 자동 첨부
  const adminHref = (() => {
    const base = config.adminUrl;
    if (!adminKey) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}token=${encodeURIComponent(adminKey)}`;
  })();

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '16px 18px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e4f0' }}>{config.name}</div>
          <div style={{ fontSize: 10, color: '#4a4a60', marginTop: 2, fontFamily: 'monospace' }}>{config.locationCode}</div>
        </div>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
          {STATUS_LABELS[config.status] ?? config.status}
        </span>
      </div>

      {/* 오늘 지표 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '10px 0', marginBottom: 14, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: '오늘 별', val: s.stars   ?? '-' },
          { label: 'Moment',  val: s.moments ?? '-' },
          { label: '공유',    val: s.shares  ?? '-' },
        ].map(({ label, val }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={S.statNum}>{val}</div>
            <div style={S.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <button onClick={() => open(config.userUrl)}  style={S.wBtn('#3b82f6')}>사용자 페이지</button>
        <button onClick={() => open(adminHref)} style={S.wBtn('#7c3aed')}>관리자 페이지</button>
      </div>
      <button onClick={() => open(config.qrUrl)} style={{ ...S.wBtn('#059669'), width: '100%' }}>QR 테스트</button>
    </div>
  );
}

// ── 별공방 운영센터 섹션 ──────────────────────────────────────────
function WorkshopCenterSection({ adminKey }) {
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const locs = WORKSHOP_CONFIGS.map(c => c.locationCode).join(',');
    try {
      const r = await fetch(
        `/api/admin/dashboard/workshop-stats?key=${encodeURIComponent(adminKey)}&locations=${encodeURIComponent(locs)}`
      );
      const d = await r.json();
      if (d.success) setStats(d.stats ?? {});
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, fontSize: 13, marginBottom: 16 }}>🌌 별공방 운영센터</div>
      {loading ? (
        <div style={{ fontSize: 12, color: '#3a3a52', textAlign: 'center', padding: '12px 0' }}>로딩 중...</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {WORKSHOP_CONFIGS.map(config => (
            <WorkshopCard key={config.locationCode} config={config} stats={stats} adminKey={adminKey} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [key,       setKey]       = useState(() => {
    const p = new URLSearchParams(window.location.search).get('key');
    return p || sessionStorage.getItem('admin_key') || '';
  });
  const [inputKey,  setInputKey]  = useState('');
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async (k) => {
    const token = k || key;
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/admin/dashboard/status?key=${encodeURIComponent(token)}`);
      if (r.status === 401) { setError('인증 실패 — 키를 확인하세요'); setLoading(false); return; }
      const d = await r.json();
      setData(d);
      setLastFetch(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  // 자동 갱신 30초
  useEffect(() => {
    if (!key) return;
    fetchData(key);
    const id = setInterval(() => fetchData(key), 30_000);
    return () => clearInterval(id);
  }, [key, fetchData]);

  // 인증 전
  if (!key) {
    return (
      <div style={S.page}>
        <div style={S.authBox}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#e8e4f0', marginBottom: 6 }}>운영 관제판</div>
          <div style={{ fontSize: 12, color: '#4a4a60', marginBottom: 4 }}>ADMIN_API_KEY를 입력하세요</div>
          <input
            style={S.input}
            type="password"
            placeholder="admin key"
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { sessionStorage.setItem('admin_key', inputKey); setKey(inputKey); }}}
          />
          <button style={S.submitBtn} onClick={() => { sessionStorage.setItem('admin_key', inputKey); setKey(inputKey); }}>
            접속
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={{ ...S.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={S.title}>운영 관제판</div>
          <div style={S.subtitle}>
            {loading ? '갱신 중...' : lastFetch ? `마지막 갱신: ${lastFetch}` : ''}
            {' · '}자동 갱신 30초
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.refreshBtn} onClick={() => fetchData(key)}>새로고침</button>
          <button style={{ ...S.refreshBtn, color: '#4a4a60', borderColor: 'rgba(255,255,255,0.06)' }}
            onClick={() => { sessionStorage.removeItem('admin_key'); setKey(''); }}>
            로그아웃
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* 별공방 운영센터 — 독립 fetch, 항상 표시 */}
      <div style={{ marginBottom: 16 }}>
        <WorkshopCenterSection adminKey={key} />
      </div>

      {!data && loading && (
        <div style={{ textAlign: 'center', color: '#4a4a60', fontSize: 13, paddingTop: 40 }}>로딩 중...</div>
      )}

      {data && (
        <div style={S.grid}>
          <DeployCard  deploy={data.deploy} />
          <HealthCard  health={data.health} />
          <ErrorFeedCard errors={data.errors} />
          <FlowCard    flowStats={data.flowStats} />
          <AlertCard   alerts={data.alerts} errors={data.errors} />
        </div>
      )}
    </div>
  );
}
