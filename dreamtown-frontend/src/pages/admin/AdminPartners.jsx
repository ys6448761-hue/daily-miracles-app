/**
 * AdminPartners.jsx — 슈퍼어드민 파트너 관리
 * 경로: /admin/partners
 * 보호: ADMIN_TOKEN (X-Admin-Token 헤더)
 *
 * v2: 지역 탭 + 통계 카드 2줄 + 등급 테두리 강화
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'dt_admin_token';

const GRADE = {
  star:    { icon: '🌟', label: '스타',  color: '#FFD700', bg: 'rgba(255,215,0,0.10)',  border: 'rgba(255,215,0,0.45)' },
  normal:  { icon: '✅', label: '일반',  color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.35)' },
  warning: { icon: '⚠️', label: '주의',  color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.40)' },
  danger:  { icon: '❌', label: '위험',  color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.40)' },
};

const CAT_LABEL = { cafe:'카페', restaurant:'식당', night:'나이트', activity:'체험', transport:'교통', accommodation:'숙소', etc:'기타' };

// 지역 탭 정의
const REGIONS = [
  { code: '',       label: '전체',    flag: '🗺️',  ready: true  },
  { code: 'yeosu',  label: '여수',    flag: '🇰🇷', ready: true  },
  { code: 'busan',  label: '부산',    flag: '🌊',  ready: false },
  { code: 'jeju',   label: '제주',    flag: '🍊',  ready: false },
  { code: 'seoul',  label: '서울',    flag: '🏙️',  ready: false },
  { code: 'global', label: '글로벌',  flag: '🌍',  ready: false },
];

const S = {
  page:       { minHeight: '100vh', background: '#0A1628', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 60 },
  header:     { background: 'rgba(155,135,245,0.1)', borderBottom: '1px solid rgba(155,135,245,0.2)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title:      { fontSize: 17, fontWeight: 800, color: '#9B87F5' },
  subtitle:   { fontSize: 11, color: '#7A6E9C', marginTop: 2 },

  // 지역 탭
  tabs:       { display: 'flex', gap: 6, padding: '12px 20px', overflowX: 'auto', scrollbarWidth: 'none' },
  tab:        (active, ready) => ({
    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: ready ? 'pointer' : 'default',
    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
    background: active ? '#9B87F5' : ready ? 'rgba(155,135,245,0.1)' : 'rgba(100,100,120,0.1)',
    color: active ? '#0D1B2A' : ready ? '#9B87F5' : '#5a5a70',
    opacity: ready ? 1 : 0.55,
  }),
  tabBadge:   { fontSize: 10, marginLeft: 4, opacity: 0.75 },

  // 등급 요약 (1줄)
  gradeRow:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 20px 8px' },
  gCard:      (g) => ({ background: GRADE[g].bg, border: `1px solid ${GRADE[g].border}`, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }),
  gIcon:      { fontSize: 16, display: 'block', marginBottom: 2 },
  gCount:     (g) => ({ fontSize: 20, fontWeight: 800, color: GRADE[g].color }),
  gLabel:     { fontSize: 10, color: '#7A6E9C' },

  // 통계 (2줄)
  statsRow:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 20px 12px' },
  sCard:      { background: 'rgba(155,135,245,0.05)', border: '1px solid rgba(155,135,245,0.1)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' },
  sVal:       { fontSize: 16, fontWeight: 800, color: '#E8E4F0', display: 'block' },
  sLabel:     { fontSize: 10, color: '#7A6E9C', marginTop: 2 },

  evalBtn:    { margin: '0 20px 12px', padding: '12px', borderRadius: 12, border: 'none', background: '#9B87F5', color: '#0D1B2A', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: 'calc(100% - 40px)' },

  // 파트너 카드
  card:       (grade) => ({
    margin: '0 20px 10px',
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${GRADE[grade]?.border || 'rgba(155,135,245,0.12)'}`,
    borderRadius: 14, overflow: 'hidden',
  }),
  cardHead:   { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(155,135,245,0.08)' },
  nameWrap:   { display: 'flex', alignItems: 'center', gap: 8 },
  pName:      { fontSize: 15, fontWeight: 700, color: '#E8E4F0' },
  catTag:     { fontSize: 11, color: '#7A6E9C', background: 'rgba(155,135,245,0.08)', padding: '2px 7px', borderRadius: 8 },
  gradePill:  (g) => ({ fontSize: 12, fontWeight: 700, color: GRADE[g].color, background: GRADE[g].bg, border: `1px solid ${GRADE[g].border}`, padding: '3px 10px', borderRadius: 12 }),
  cardBody:   { padding: '10px 16px' },
  metaRow:    { display: 'flex', gap: 12, fontSize: 12, color: '#9B87F5', marginBottom: 8, flexWrap: 'wrap' },
  metaItem:   { display: 'flex', alignItems: 'center', gap: 3 },
  metaVal:    { color: '#E8E4F0', fontWeight: 700 },
  scoreWrap:  { marginBottom: 10 },
  scoreLabel: { fontSize: 11, color: '#7A6E9C', marginBottom: 4, display: 'flex', justifyContent: 'space-between' },
  scoreBar:   { height: 5, borderRadius: 3, background: 'rgba(155,135,245,0.1)', overflow: 'hidden' },
  scoreFill:  (score, g) => ({ height: '100%', width: `${Math.min(Number(score) || 0, 100)}%`, background: GRADE[g]?.color || '#9B87F5', transition: 'width 0.6s ease' }),
  btnRow:     { display: 'flex', gap: 6 },
  btn:        (color) => ({ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${color}55`, background: `${color}11`, color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }),

  // 상세 패널
  detailWrap: { background: 'rgba(155,135,245,0.04)', margin: '0 20px 10px', borderRadius: 14, padding: 16 },
  dRow:       { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(155,135,245,0.06)', fontSize: 13 },
  dKey:       { color: '#7A6E9C' },
  dVal:       { color: '#E8E4F0', fontWeight: 600 },
  evalHist:   { background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 },
  secTitle:   { fontSize: 11, color: '#9B87F5', fontWeight: 700, margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 },

  // 모달
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 900, display: 'flex', alignItems: 'flex-end' },
  modal:      { width: '100%', maxWidth: 448, margin: '0 auto', background: '#1a2a3a', borderRadius: '16px 16px 0 0', padding: '24px 20px 40px' },
  mTitle:     { fontSize: 16, fontWeight: 700, color: '#E8E4F0', marginBottom: 16 },
  mInput:     { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(155,135,245,0.25)', background: 'rgba(255,255,255,0.04)', color: '#E8E4F0', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
  mBtn:       (color) => ({ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: color, color: '#0D1B2A', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }),
  mCancel:    { width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(155,135,245,0.2)', background: 'transparent', color: '#9B87F5', fontSize: 13, cursor: 'pointer' },

  // 기타
  tokenWrap:  { minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  tokenCard:  { background: 'rgba(155,135,245,0.08)', border: '1px solid rgba(155,135,245,0.2)', borderRadius: 20, padding: '32px 24px', width: '100%', maxWidth: 340 },
  emptyRegion:{ textAlign: 'center', padding: '60px 20px', color: '#7A6E9C' },
  toast:      { position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1a2a3a', border: '1px solid rgba(155,135,245,0.3)', borderRadius: 12, padding: '10px 20px', fontSize: 13, color: '#E8E4F0', zIndex: 1000, whiteSpace: 'nowrap' },
};

function fmtDate(s) {
  if (!s) return '-';
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── TokenGate ──────────────────────────────────────────────────────────────
function TokenGate({ onAuth }) {
  const [val, setVal] = useState('');
  return (
    <div style={S.tokenWrap}>
      <div style={S.tokenCard}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#9B87F5' }}>파트너 어드민</div>
          <div style={{ fontSize: 12, color: '#7A6E9C', marginTop: 4 }}>어드민 토큰을 입력해주세요</div>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (val.trim()) onAuth(val.trim()); }}>
          <input type="password" placeholder="Admin Token" value={val} onChange={e => setVal(e.target.value)}
            style={{ ...S.mInput, marginBottom: 16 }} autoFocus />
          <button type="submit" style={S.mBtn('#9B87F5')}>입장</button>
        </form>
      </div>
    </div>
  );
}

// ── 메인 ───────────────────────────────────────────────────────────────────
export default function AdminPartners() {
  const nav = useNavigate();
  const [adminToken,  setAdminToken]  = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [authFailed,  setAuthFailed]  = useState(false);

  const [region,      setRegion]      = useState(''); // city_code or ''
  const [partners,    setPartners]    = useState([]);
  const [summary,     setSummary]     = useState({ star: 0, normal: 0, warning: 0, danger: 0 });
  const [stats,       setStats]       = useState({ total_stars: 0, total_visits: 0, new_stars_this_month: 0, avg_return_rate: 0 });
  const [regionCounts, setRegionCounts] = useState({});
  const [loading,     setLoading]     = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);

  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [modal,       setModal]       = useState(null);
  const [modalInput,  setModalInput]  = useState('');
  const [modalLoading,setModalLoading]= useState(false);
  const [toast,       setToast]       = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }
  function authH() { return { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }; }

  const loadPartners = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    const qs = region ? `?city_code=${region}` : '';
    try {
      const r = await fetch(`/api/admin/partners${qs}`, { headers: authH() });
      if (r.status === 403) { setAuthFailed(true); return; }
      const d = await r.json();
      setPartners(d.partners || []);
      setSummary(d.summary  || {});
      setStats(d.stats || {});
      setRegionCounts(d.region_counts || {});
      setAuthFailed(false);
    } catch { showToast('데이터 로드 실패'); }
    finally  { setLoading(false); }
  }, [adminToken, region]);

  useEffect(() => { if (adminToken) loadPartners(); }, [adminToken, region]);

  function handleAuth(t) { sessionStorage.setItem(ADMIN_TOKEN_KEY, t); setAdminToken(t); }

  async function handleEvaluateAll() {
    if (!confirm('전체 파트너 평가를 실행하시겠어요?')) return;
    setEvalLoading(true);
    try {
      const r = await fetch('/api/admin/evaluate-all', { method: 'POST', headers: authH(), body: '{}' });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || '평가 실패'); return; }
      showToast(`✅ ${d.count}개 파트너 평가 완료`);
      loadPartners();
    } catch { showToast('평가 실패'); }
    finally  { setEvalLoading(false); }
  }

  async function loadDetail(partner) {
    setDetailLoading(true);
    try {
      const r = await fetch(`/api/admin/partners/${partner.id}`, { headers: authH() });
      setDetail(await r.json());
    } catch { showToast('상세 로드 실패'); }
    finally  { setDetailLoading(false); }
  }

  async function handleModalAction() {
    if (!modal) return;
    setModalLoading(true);
    try {
      let r;
      const { type, partner } = modal;
      if (type === 'warn')      r = await fetch(`/api/admin/partners/${partner.id}/warn`,     { method: 'POST',  headers: authH(), body: JSON.stringify({ message: modalInput || undefined }) });
      if (type === 'terminate') r = await fetch(`/api/admin/partners/${partner.id}/terminate`, { method: 'POST',  headers: authH(), body: JSON.stringify({ reason: modalInput }) });
      if (type === 'grade')     r = await fetch(`/api/admin/partners/${partner.id}/grade`,     { method: 'PATCH', headers: authH(), body: JSON.stringify({ grade: modal.grade, reason: modalInput }) });
      if (type === 'evaluate')  r = await fetch(`/api/admin/partners/${partner.id}/evaluate`,  { method: 'POST',  headers: authH(), body: '{}' });

      const d = await r.json();
      if (!r.ok) { showToast(d.error || '처리 실패'); return; }
      showToast('✅ 처리 완료');
      setModal(null); setModalInput('');
      loadPartners();
    } catch { showToast('서버 오류'); }
    finally  { setModalLoading(false); }
  }

  if (!adminToken || authFailed) return <TokenGate onAuth={handleAuth} />;

  const currentRegion = REGIONS.find(r => r.code === region);
  const isReadyRegion = currentRegion?.ready !== false;

  return (
    <div style={S.page}>
      {/* 헤더 */}
      <div style={S.header}>
        <div>
          <div style={S.title}>여수 파트너 현황</div>
          <div style={S.subtitle}>전체 {partners.length}곳 {region && `· ${currentRegion?.label}`}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => nav('/admin/qr-center')}
            style={{ background: 'rgba(155,135,245,0.12)', border: '1px solid rgba(155,135,245,0.3)', borderRadius: 8, color: '#9B87F5', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '5px 10px' }}>
            📱 QR
          </button>
          <button style={{ background: 'none', border: 'none', color: '#7A6E9C', cursor: 'pointer', fontSize: 12 }}
            onClick={() => { sessionStorage.removeItem(ADMIN_TOKEN_KEY); setAdminToken(''); }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 지역 탭 */}
      <div style={S.tabs}>
        {REGIONS.map(r => {
          const cnt = r.code ? (regionCounts[r.code] || 0) : Object.values(regionCounts).reduce((a, b) => a + b, 0);
          const active = region === r.code;
          return (
            <button key={r.code} style={S.tab(active, r.ready)}
              onClick={() => { if (r.ready) { setRegion(r.code); setDetail(null); } }}>
              {r.flag} {r.label}
              {r.ready && cnt > 0 && <span style={S.tabBadge}>({cnt})</span>}
              {!r.ready && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>준비중</span>}
            </button>
          );
        })}
      </div>

      {/* 준비중 지역 */}
      {!isReadyRegion ? (
        <div style={S.emptyRegion}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{currentRegion?.flag}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#9B87F5', marginBottom: 6 }}>
            {currentRegion?.label} 준비 중
          </div>
          <div style={{ fontSize: 13 }}>파트너 모집 예정입니다 ✨</div>
        </div>
      ) : (
        <>
          {/* 등급 카드 — 1줄 */}
          <div style={S.gradeRow}>
            {['danger','warning','normal','star'].map(g => (
              <div key={g} style={S.gCard(g)}>
                <span style={S.gIcon}>{GRADE[g].icon}</span>
                <div style={S.gCount(g)}>{summary[g] ?? 0}</div>
                <div style={S.gLabel}>{GRADE[g].label}</div>
              </div>
            ))}
          </div>

          {/* 통계 카드 — 2줄 */}
          <div style={S.statsRow}>
            {[
              { val: stats.total_stars ?? 0,           label: '총 별 탄생' },
              { val: stats.total_visits ?? 0,          label: '총 방문' },
              { val: stats.new_stars_this_month ?? 0,  label: '이달 신규 별' },
              { val: `${stats.avg_return_rate ?? 0}%`, label: '평균 재방문율' },
            ].map(({ val, label }) => (
              <div key={label} style={S.sCard}>
                <span style={S.sVal}>{val}</span>
                <span style={S.sLabel}>{label}</span>
              </div>
            ))}
          </div>

          {/* 전체 평가 버튼 */}
          <button style={S.evalBtn} onClick={handleEvaluateAll} disabled={evalLoading}>
            {evalLoading ? '평가 중...' : '🔄 전체 평가 실행'}
          </button>

          {/* 파트너 목록 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#7A6E9C' }}>불러오는 중...</div>
          ) : partners.length === 0 ? (
            <div style={S.emptyRegion}>
              <div style={{ fontSize: 13 }}>등록된 파트너가 없어요</div>
            </div>
          ) : partners.map((p, i) => {
            const grade = p.grade || 'normal';
            const gi    = GRADE[grade];
            const score = Number(p.total_score ?? 0);
            const isOpen = detail?.partner?.id === p.id;

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {/* 카드 */}
                <div style={S.card(grade)}>
                  <div style={S.cardHead}>
                    <div style={S.nameWrap}>
                      <span style={S.pName}>{p.name}</span>
                      <span style={S.catTag}>{CAT_LABEL[p.category] || p.category}</span>
                      {!p.is_active && <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: 6 }}>해지</span>}
                    </div>
                    <span style={S.gradePill(grade)}>{gi.icon} {gi.label}</span>
                  </div>

                  <div style={S.cardBody}>
                    {/* 지표 행 */}
                    <div style={S.metaRow}>
                      <span style={S.metaItem}>⭐ <span style={S.metaVal}>{p.hometown_star_count ?? 0}</span>개</span>
                      <span style={S.metaItem}>🔍 <span style={S.metaVal}>{p.qr_scan_count ?? p.month_visits ?? 0}</span>회</span>
                      <span style={S.metaItem}>↩️ <span style={S.metaVal}>{p.return_rate != null ? `${Number(p.return_rate).toFixed(0)}%` : '-'}</span></span>
                      <span style={S.metaItem}>👤 <span style={S.metaVal}>{p.total_visits ?? 0}</span>방문</span>
                      {p.last_login_at && <span style={{ fontSize: 11, color: '#5a5a70' }}>로그인 {fmtDate(p.last_login_at)}</span>}
                    </div>

                    {/* 점수 바 */}
                    {p.total_score != null && (
                      <div style={S.scoreWrap}>
                        <div style={S.scoreLabel}>
                          <span>종합 점수</span>
                          <span style={{ color: gi.color, fontWeight: 700 }}>{score}점</span>
                        </div>
                        <div style={S.scoreBar}>
                          <div style={S.scoreFill(score, grade)} />
                        </div>
                      </div>
                    )}

                    {/* 버튼 */}
                    <div style={S.btnRow}>
                      <button style={S.btn('#9B87F5')} onClick={() => { if (isOpen) setDetail(null); else loadDetail(p); }}>
                        {isOpen ? '닫기' : '상세'}
                      </button>
                      <button style={S.btn('#60a5fa')} onClick={() => setModal({ type: 'evaluate', partner: p })}>평가</button>
                      <button style={S.btn('#FBBF24')} onClick={() => { setModal({ type: 'warn',      partner: p }); setModalInput(''); }}>경고</button>
                      <button style={S.btn('#f87171')} onClick={() => { setModal({ type: 'terminate', partner: p }); setModalInput(''); }}>해지</button>
                    </div>
                  </div>
                </div>

                {/* 상세 패널 */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div style={S.detailWrap}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}>
                      {detailLoading ? (
                        <div style={{ color: '#7A6E9C', fontSize: 13, textAlign: 'center', padding: 16 }}>로드 중...</div>
                      ) : detail && (
                        <>
                          {/* 기본 정보 */}
                          <div style={S.secTitle}>기본 정보</div>
                          {[
                            ['주소',       detail.partner.address || '-'],
                            ['연락처',     detail.partner.phone || '-'],
                            ['마지막 로그인', fmtDate(detail.partner.last_login_at)],
                            ['구독',       detail.partner.is_subscribed ? '✅ 구독 중' : '미구독'],
                            ['지역',       detail.partner.city_name || detail.partner.city_code || '-'],
                          ].map(([k, v]) => (
                            <div key={k} style={S.dRow}>
                              <span style={S.dKey}>{k}</span>
                              <span style={S.dVal}>{v}</span>
                            </div>
                          ))}

                          {/* 평가 이력 */}
                          {detail.evaluations?.length > 0 && (
                            <>
                              <div style={S.secTitle}>평가 이력</div>
                              {detail.evaluations.map(ev => {
                                const eg = GRADE[ev.grade] || GRADE.normal;
                                return (
                                  <div key={ev.id} style={S.evalHist}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                      <span style={{ fontSize: 12, color: '#C4BAE0' }}>
                                        {new Date(ev.eval_month).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                                      </span>
                                      <span style={{ fontSize: 12, color: eg.color, fontWeight: 700 }}>{eg.icon} {Number(ev.total_score).toFixed(1)}점</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#7A6E9C', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                      <span>재방문 {Number(ev.return_rate).toFixed(0)}%</span>
                                      <span>QR {ev.qr_scan_count}회</span>
                                      <span>처리율 {Number(ev.order_process_rate).toFixed(0)}%</span>
                                      <span>감정 {Number(ev.sentiment_score).toFixed(0)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* 소속 별 */}
                          {detail.stars?.length > 0 && (
                            <>
                              <div style={S.secTitle}>소속 별 TOP 5</div>
                              {detail.stars.map(s => (
                                <div key={s.id} style={S.dRow}>
                                  <span style={S.dKey}>⭐ {s.star_name}</span>
                                  <span style={S.dVal}>방문 {s.hometown_visit_count}회</span>
                                </div>
                              ))}
                            </>
                          )}

                          {/* 등급 수동 변경 */}
                          <div style={S.secTitle}>등급 수동 변경</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {['star','normal','warning','danger'].map(gr => (
                              <button key={gr}
                                style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: `1px solid ${GRADE[gr].border}`, background: (detail.partner.grade === gr) ? GRADE[gr].bg : 'transparent', color: GRADE[gr].color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => { setModal({ type: 'grade', partner: detail.partner, grade: gr }); setModalInput(''); }}>
                                {GRADE[gr].icon}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </>
      )}

      {/* 모달 */}
      <AnimatePresence>
        {modal && (
          <motion.div style={S.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setModal(null)}>
            <motion.div style={S.modal} initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}>

              {modal.type === 'warn' && <>
                <div style={S.mTitle}>⚠️ 경고 알림 발송</div>
                <div style={{ fontSize: 13, color: '#C4BAE0', marginBottom: 12 }}>{modal.partner.name}</div>
                <textarea style={{ ...S.mInput, height: 80, resize: 'none' }}
                  placeholder="경고 메시지 (비워두면 기본 메시지)"
                  value={modalInput} onChange={e => setModalInput(e.target.value)} />
                <button style={S.mBtn('#FBBF24')} onClick={handleModalAction} disabled={modalLoading}>
                  {modalLoading ? '발송 중...' : '경고 발송'}
                </button>
              </>}

              {modal.type === 'terminate' && <>
                <div style={S.mTitle}>❌ 계약 해지</div>
                <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{modal.partner.name} — 되돌릴 수 없어요</div>
                <input style={S.mInput} placeholder="해지 사유 (필수)"
                  value={modalInput} onChange={e => setModalInput(e.target.value)} />
                <button style={S.mBtn('#f87171')} onClick={handleModalAction} disabled={modalLoading}>
                  {modalLoading ? '처리 중...' : '계약 해지 확정'}
                </button>
              </>}

              {modal.type === 'grade' && <>
                <div style={S.mTitle}>{GRADE[modal.grade]?.icon} 등급 변경 → {GRADE[modal.grade]?.label}</div>
                <div style={{ fontSize: 13, color: '#C4BAE0', marginBottom: 12 }}>{modal.partner.name}</div>
                <input style={S.mInput} placeholder="변경 사유 (선택)"
                  value={modalInput} onChange={e => setModalInput(e.target.value)} />
                <button style={S.mBtn(GRADE[modal.grade]?.color || '#9B87F5')} onClick={handleModalAction} disabled={modalLoading}>
                  {modalLoading ? '처리 중...' : '등급 변경'}
                </button>
              </>}

              {modal.type === 'evaluate' && <>
                <div style={S.mTitle}>🔄 수동 평가 실행</div>
                <div style={{ fontSize: 13, color: '#C4BAE0', marginBottom: 20 }}>
                  {modal.partner.name}<br />
                  <span style={{ fontSize: 11, color: '#7A6E9C' }}>이번 달 데이터 기준으로 즉시 평가합니다</span>
                </div>
                <button style={S.mBtn('#9B87F5')} onClick={handleModalAction} disabled={modalLoading}>
                  {modalLoading ? '평가 중...' : '평가 실행'}
                </button>
              </>}

              <button style={S.mCancel} onClick={() => setModal(null)}>취소</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div style={S.toast} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
