/**
 * VoyageAdmin.jsx — 여수 항해 예약 관리 어드민
 * 경로: /admin/voyage
 *
 * 모바일 375px 최적화 | Aurora5 톤 (#9B87F5)
 */

import { useState, useEffect, useCallback } from 'react';

const API = '/api/admin/voyage';
const TOKEN_KEY = 'dt_admin_token';

const STATUS_CONFIG = {
  pending:    { label: '결제대기', dot: '#f59e0b', bg: '#422006' },
  confirmed:  { label: '예약확정', dot: '#60a5fa', bg: '#1e3a5f' },
  checked_in: { label: '체크인완료', dot: '#22c55e', bg: '#052e16' },
  cancelled:  { label: '취소',     dot: '#6b7280', bg: '#1f2937' },
};

const SESSION_LABEL = {
  morning: '오전 세션 (09:00~13:00)',
  evening: '저녁 세션 (17:00~21:00)',
};

// ── 유틸 ──────────────────────────────────────────────────────────────
function krw(v) { return Number(v || 0).toLocaleString('ko-KR') + '원'; }
function fmtDate(d) {
  if (!d) return '—';
  const s = String(d).slice(0, 10);
  const [y, m, dd] = s.split('-');
  const day = ['일','월','화','수','목','금','토'][new Date(s).getDay()];
  return `${m}/${dd}(${day})`;
}

// ── 토큰 입력 폼 ─────────────────────────────────────────────────────
function TokenGate({ onToken }) {
  const [val, setVal] = useState('');
  return (
    <div style={S.page}>
      <div style={S.gateWrap}>
        <div style={{ fontSize: 14, color: '#9B87F5', marginBottom: 12, fontWeight: 700 }}>예약 관리 — 관리자 인증</div>
        <input
          type="password" placeholder="Admin Token"
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && val && onToken(val)}
          style={S.tokenInput}
        />
        <button
          onClick={() => val && onToken(val)}
          style={S.tokenBtn}
        >확인</button>
      </div>
    </div>
  );
}

// ── 요약 바 ───────────────────────────────────────────────────────────
function SummaryBar({ summary }) {
  const items = [
    { label: '오늘 예약', value: summary.today ?? 0, color: '#60a5fa' },
    { label: '전체',      value: summary.total ?? 0, color: '#9B87F5' },
    { label: '체크인',    value: summary.checkin ?? 0, color: '#22c55e' },
  ];
  return (
    <div style={S.summaryBar}>
      {items.map(it => (
        <div key={it.label} style={S.summaryItem}>
          <span style={{ ...S.summaryNum, color: it.color }}>{it.value}</span>
          <span style={S.summaryLabel}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── 필터 탭 ───────────────────────────────────────────────────────────
function TabRow({ options, value, onChange }) {
  return (
    <div style={S.tabRow}>
      {options.map(o => (
        <button
          key={o.value} onClick={() => onChange(o.value)}
          style={{ ...S.tab, ...(value === o.value ? S.tabActive : {}) }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── 예약 카드 ─────────────────────────────────────────────────────────
function BookingCard({ booking, token, onRefresh }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  async function doAction(action) {
    setLoadingAction(action);
    try {
      const res = await fetch(`${API}/bookings/${booking.id}/${action}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body:    action === 'cancel' ? JSON.stringify({ reason: '관리자 취소' }) : '{}',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `${action} 실패`);
      if (action === 'notify') {
        alert(data.ok ? '알림이 발송됐어요.' : `발송 실패: ${data.error}`);
      }
      onRefresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingAction(null);
      setShowCancel(false);
    }
  }

  return (
    <div style={{ ...S.card, borderColor: cfg.dot + '40' }}>
      {/* 헤더 */}
      <div style={S.cardHeader}>
        <span style={{ ...S.badge, background: cfg.bg, color: cfg.dot }}>
          ● {cfg.label}
        </span>
        <span style={S.cardDate}>{fmtDate(booking.booking_date)}</span>
      </div>

      {/* 고객 정보 */}
      <div style={S.customerRow}>
        <span style={S.customerName}>{booking.customer_name}</span>
        <a href={`tel:${booking.phone}`} style={S.phone}>{booking.phone}</a>
      </div>

      {/* 예약 상세 */}
      <div style={S.detailRow}>
        <span style={S.detailChip}>{booking.booking_type}</span>
        <span style={S.detailChip}>{booking.party_size ?? 1}인</span>
        <span style={S.detailChip}>{krw(booking.amount)}</span>
      </div>
      <div style={S.sessionLabel}>{SESSION_LABEL[booking.session] ?? booking.session}</div>

      {/* 소원 텍스트 (접혀 있음) */}
      {booking.wish_text && (
        <div style={S.wishText}>"{booking.wish_text}"</div>
      )}

      {/* 액션 버튼 */}
      {booking.status !== 'cancelled' && (
        <div style={S.actionRow}>
          {booking.status !== 'checked_in' && (
            <button
              onClick={() => doAction('checkin')}
              disabled={!!loadingAction}
              style={{ ...S.actionBtn, ...S.btnCheckin }}
            >
              {loadingAction === 'checkin' ? '처리중...' : '체크인'}
            </button>
          )}
          <button
            onClick={() => doAction('notify')}
            disabled={!!loadingAction}
            style={{ ...S.actionBtn, ...S.btnNotify }}
          >
            {loadingAction === 'notify' ? '발송중...' : '알림톡'}
          </button>
          {booking.status !== 'checked_in' && (
            <button
              onClick={() => setShowCancel(true)}
              disabled={!!loadingAction}
              style={{ ...S.actionBtn, ...S.btnCancel }}
            >
              취소
            </button>
          )}
        </div>
      )}

      {/* 취소 확인 팝업 */}
      {showCancel && (
        <div style={S.confirmBox}>
          <div style={{ fontSize: 13, color: '#f0f4ff', marginBottom: 10 }}>
            {booking.customer_name}님 예약을 취소할까요?<br />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>환불은 수동 처리됩니다.</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => doAction('cancel')} style={{ ...S.actionBtn, ...S.btnCancel, flex: 1 }}>
              {loadingAction === 'cancel' ? '처리중...' : '취소 확정'}
            </button>
            <button onClick={() => setShowCancel(false)} style={{ ...S.actionBtn, flex: 1, background: '#1f2937' }}>
              돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────
export default function VoyageAdmin() {
  const [token,    setToken]    = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [summary,  setSummary]  = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // 필터 상태
  const [dateTab,   setDateTab]   = useState('today');  // today | week | all
  const [typeTab,   setTypeTab]   = useState('전체');
  const [statusTab, setStatusTab] = useState('active'); // active | all

  function handleToken(t) {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }

  const headers = token ? { 'x-admin-token': token } : {};

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qp = new URLSearchParams();
      if (dateTab !== 'all')  qp.set('date', dateTab);
      if (typeTab !== '전체') qp.set('type', typeTab);
      if (statusTab === 'active') qp.set('status', 'pending,confirmed,checked_in');

      const [sumRes, listRes] = await Promise.all([
        fetch(`${API}/summary`, { headers }),
        fetch(`${API}/bookings?${qp.toString()}`, { headers }),
      ]);

      if (sumRes.status === 401 || listRes.status === 401) {
        setToken('');
        localStorage.removeItem(TOKEN_KEY);
        return;
      }

      const [sumData, listData] = await Promise.all([sumRes.json(), listRes.json()]);
      setSummary(sumData);
      setBookings(listData.bookings ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, dateTab, typeTab, statusTab]);

  useEffect(() => { if (token) load(); }, [load, token]);

  if (!token) return <TokenGate onToken={handleToken} />;

  const DATE_TABS   = [{ value: 'today', label: '오늘' }, { value: 'week', label: '이번주' }, { value: 'all', label: '전체' }];
  const TYPE_TABS   = [{ value: '전체', label: '전체' }, { value: '개인', label: '개인' }, { value: '단체', label: '단체' }];
  const STATUS_TABS = [{ value: 'active', label: '진행중' }, { value: 'all', label: '전체' }];

  return (
    <div style={S.page}>
      {/* 헤더 */}
      <div style={S.header}>
        <span style={S.headerTitle}>예약 관리</span>
        <button onClick={load} style={S.refreshBtn}>{loading ? '↻' : '↺'} 새로고침</button>
      </div>

      {/* 요약 바 */}
      <SummaryBar summary={summary} />

      {/* 필터 */}
      <TabRow options={DATE_TABS}   value={dateTab}   onChange={setDateTab} />
      <TabRow options={TYPE_TABS}   value={typeTab}   onChange={setTypeTab} />
      <TabRow options={STATUS_TABS} value={statusTab} onChange={setStatusTab} />

      {/* 에러 */}
      {error && (
        <div style={S.errorBox}>{error}</div>
      )}

      {/* 목록 */}
      {loading && <div style={S.emptyMsg}>불러오는 중...</div>}

      {!loading && bookings.length === 0 && (
        <div style={S.emptyMsg}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌙</div>
          예약이 없습니다
        </div>
      )}

      {!loading && bookings.map(b => (
        <BookingCard key={b.id} booking={b} token={token} onRefresh={load} />
      ))}

      {/* 하단 여백 */}
      <div style={{ height: 40 }} />
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh', background: '#060e1a', color: '#f0f4ff',
    padding: '0 0 40px', fontFamily: 'sans-serif', maxWidth: 430, margin: '0 auto',
  },
  // 인증 게이트
  gateWrap: {
    margin: '80px 24px 0', background: '#0d1b2a', border: '1px solid #9B87F540',
    borderRadius: 14, padding: '28px 20px',
  },
  tokenInput: {
    width: '100%', background: '#060e1a', border: '1px solid #1e2d3d',
    borderRadius: 8, color: '#f0f4ff', fontSize: 14, padding: '10px 12px',
    boxSizing: 'border-box', marginBottom: 10,
  },
  tokenBtn: {
    width: '100%', background: '#9B87F5', color: '#fff', border: 'none',
    borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  // 헤더
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 16px 12px', borderBottom: '1px solid #1e2d3d',
  },
  headerTitle: { fontSize: 17, fontWeight: 800, color: '#f0f4ff' },
  refreshBtn: {
    background: 'none', border: '1px solid #1e2d3d', color: '#60a5fa',
    borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
  },
  // 요약 바
  summaryBar: {
    display: 'flex', borderBottom: '1px solid #1e2d3d', padding: '12px 0',
  },
  summaryItem: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  summaryNum:   { fontSize: 22, fontWeight: 800 },
  summaryLabel: { fontSize: 10, color: '#6b7280' },
  // 필터 탭
  tabRow: {
    display: 'flex', gap: 6, padding: '8px 16px 0',
  },
  tab: {
    flex: 1, background: '#0d1b2a', border: '1px solid #1e2d3d',
    color: '#6b7280', borderRadius: 8, padding: '7px 4px', fontSize: 12,
    cursor: 'pointer', fontFamily: 'sans-serif',
  },
  tabActive: {
    background: '#1e2d3d', color: '#9B87F5', borderColor: '#9B87F5',
    fontWeight: 700,
  },
  // 예약 카드
  card: {
    margin: '10px 16px 0', background: '#0a1628',
    border: '1px solid', borderRadius: 14, padding: '14px 16px',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px' },
  cardDate: { fontSize: 13, color: '#9ca3af', fontWeight: 600 },
  customerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  customerName: { fontSize: 16, fontWeight: 800, color: '#f0f4ff' },
  phone: { fontSize: 13, color: '#60a5fa', textDecoration: 'none' },
  detailRow: { display: 'flex', gap: 6, marginBottom: 4 },
  detailChip: {
    background: '#1e2d3d', color: '#9ca3af', fontSize: 11,
    borderRadius: 6, padding: '3px 8px',
  },
  sessionLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  wishText: {
    fontSize: 12, color: '#7dd3fc', fontStyle: 'italic',
    borderLeft: '2px solid #9B87F540', paddingLeft: 10, marginBottom: 10,
    lineHeight: 1.5,
  },
  // 액션
  actionRow: { display: 'flex', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, border: 'none', borderRadius: 8, padding: '9px 4px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif',
  },
  btnCheckin: { background: '#052e16', color: '#22c55e' },
  btnNotify:  { background: '#1e3a5f', color: '#60a5fa' },
  btnCancel:  { background: '#2d0707', color: '#f87171' },
  // 취소 확인 박스
  confirmBox: {
    marginTop: 10, background: '#1f2937', borderRadius: 10, padding: '12px',
  },
  // 기타
  errorBox: {
    margin: '10px 16px', background: '#2d0707', border: '1px solid #dc2626',
    color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13,
  },
  emptyMsg: {
    textAlign: 'center', color: '#6b7280', fontSize: 14,
    padding: '60px 20px',
  },
};
