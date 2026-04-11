/**
 * PartnerDashboard.jsx — 별들의 고향 파트너 대시보드
 * 경로: /partner/dashboard
 *
 * 모바일 375px 최적화 | Aurora5 톤 (#9B87F5, #0D1B2A)
 * JWT: localStorage['partner_jwt'] (7일 유효)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PARTNER_JWT_KEY = 'partner_jwt';

const S = {
  page: {
    minHeight: '100vh',
    background: '#0D1B2A',
    paddingBottom: 40,
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  header: {
    background: 'rgba(155, 135, 245, 0.08)',
    borderBottom: '1px solid rgba(155, 135, 245, 0.15)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#9B87F5',
  },
  headerSub: {
    fontSize: 11,
    color: '#7A6E9C',
    marginTop: 2,
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid rgba(155, 135, 245, 0.3)',
    borderRadius: 8,
    padding: '6px 12px',
    color: '#7A6E9C',
    fontSize: 12,
    cursor: 'pointer',
  },
  section: {
    padding: '20px',
    borderBottom: '1px solid rgba(155, 135, 245, 0.08)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#9B87F5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 4,
  },
  statsRow3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 4,
  },
  statBox: {
    background: 'rgba(155, 135, 245, 0.07)',
    border: '1px solid rgba(155, 135, 245, 0.13)',
    borderRadius: 12,
    padding: '14px 10px',
    textAlign: 'center',
  },
  statNum: {
    fontSize: 26,
    fontWeight: 800,
    color: '#9B87F5',
    display: 'block',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 11,
    color: '#7A6E9C',
    marginTop: 4,
    display: 'block',
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '16px 18px',
    borderRadius: 12,
    border: '1px solid rgba(155, 135, 245, 0.15)',
    background: 'rgba(155, 135, 245, 0.05)',
    color: '#E8E4F0',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  menuChevron: {
    color: '#9B87F5',
    fontSize: 16,
  },
  btn: {
    display: 'inline-block',
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: '#9B87F5',
    color: '#0D1B2A',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginRight: 8,
    marginBottom: 8,
  },
  btnOutline: {
    display: 'inline-block',
    padding: '10px 18px',
    borderRadius: 10,
    border: '1px solid rgba(155, 135, 245, 0.4)',
    background: 'transparent',
    color: '#9B87F5',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: 8,
    marginBottom: 8,
  },
  qrImage: {
    display: 'block',
    width: 180,
    height: 180,
    margin: '16px auto',
    borderRadius: 12,
    border: '2px solid rgba(155, 135, 245, 0.3)',
  },
  qrCode: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7A6E9C',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  starCard: {
    background: 'rgba(155, 135, 245, 0.06)',
    border: '1px solid rgba(155, 135, 245, 0.12)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#FFD700',
    marginBottom: 2,
  },
  starMeta: {
    fontSize: 11,
    color: '#7A6E9C',
    lineHeight: 1.5,
  },
  visitChip: {
    background: 'rgba(155, 135, 245, 0.15)',
    borderRadius: 20,
    padding: '4px 10px',
    fontSize: 12,
    color: '#9B87F5',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7A6E9C',
    fontSize: 14,
    padding: '24px 0',
  },
  errorBox: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#f87171',
    margin: '12px 20px 0',
  },
};

function fmtDate(d) {
  if (!d) return '—';
  return String(d).slice(0, 10).replace(/-/g, '.');
}

function fmtMoney(n) {
  if (!n) return '—';
  return n.toLocaleString('ko-KR') + '원';
}

// ── 별 카드 ────────────────────────────────────────────────────────────
function StarCard({ star }) {
  return (
    <div style={S.starCard}>
      <div>
        <div style={S.starName}>★ {star.star_name}</div>
        <div style={S.starMeta}>
          등록일: {fmtDate(star.hometown_confirmed_at)}<br />
          마지막 방문: {fmtDate(star.hometown_last_visit_at)}
        </div>
      </div>
      <div style={S.visitChip}>{star.hometown_visit_count ?? 0}회</div>
    </div>
  );
}

// ── 뷰 상태: 'dashboard' | 'stars' | 'qr' ─────────────────────────────
export default function PartnerDashboard() {
  const nav = useNavigate();
  const [view,       setView]       = useState('dashboard');
  const [data,       setData]       = useState(null);  // /api/partner/me
  const [stars,      setStars]      = useState([]);
  const [qrImage,    setQrImage]    = useState(null);
  const [qrCode,     setQrCode]     = useState(null);
  const [qrUrl,      setQrUrl]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [qrLoading,  setQrLoading]  = useState(false);
  const [error,      setError]      = useState('');

  const jwt = localStorage.getItem(PARTNER_JWT_KEY);
  const authHeader = { Authorization: `Bearer ${jwt}` };

  // ── 인증 확인 → 미로그인 시 로그인 / 약관 미동의 시 약관 페이지로 ──────
  useEffect(() => {
    if (!jwt) { nav('/partner/login', { replace: true }); return; }
    // 약관 동의 여부 확인
    fetch('/api/partner/terms-status', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.terms_agreed) nav('/partner/agreement', { replace: true }); })
      .catch(() => {});
  }, [jwt, nav]);

  // ── 대시보드 데이터 로드 ──────────────────────────────────────────────
  const loadMe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/partner/me', { headers: authHeader });
      if (r.status === 401) {
        localStorage.removeItem(PARTNER_JWT_KEY);
        nav('/partner/login', { replace: true });
        return;
      }
      const d = await r.json();
      if (!r.ok) { setError(d.error || '데이터 로드 실패'); return; }
      setData(d);
      if (d.partner?.hometown_qr_code) setQrCode(d.partner.hometown_qr_code);
    } catch {
      setError('서버 연결에 실패했어요');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStars = useCallback(async () => {
    try {
      const r = await fetch('/api/partner/stars', { headers: authHeader });
      if (!r.ok) return;
      const d = await r.json();
      setStars(d.stars || []);
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (jwt) loadMe(); }, [loadMe, jwt]);

  // ── 별자리 현황 뷰 진입 시 로드 ──────────────────────────────────────
  useEffect(() => {
    if (view === 'stars' && stars.length === 0) loadStars();
  }, [view, stars.length, loadStars]);

  // ── 로그아웃 ─────────────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await fetch('/api/partner/logout', { method: 'POST', headers: authHeader });
    } catch {}
    localStorage.removeItem(PARTNER_JWT_KEY);
    nav('/partner/login', { replace: true });
  }

  // ── QR 생성 ──────────────────────────────────────────────────────────
  async function handleGenerateQr() {
    setQrLoading(true);
    setError('');
    try {
      const r = await fetch('/api/partner/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'QR 생성 실패'); return; }
      setQrImage(d.qr_image_base64);
      setQrCode(d.qr_code);
      setQrUrl(d.qr_url);
    } catch {
      setError('QR 생성 중 오류가 발생했어요');
    } finally {
      setQrLoading(false);
    }
  }

  // ── QR 다운로드 ──────────────────────────────────────────────────────
  async function handleDownloadQr() {
    try {
      const r = await fetch('/api/partner/qr-download', { headers: authHeader });
      if (!r.ok) { setError('다운로드에 실패했어요'); return; }
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `hometown-qr-${qrCode || 'card'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('다운로드에 실패했어요');
    }
  }

  if (!jwt) return null;

  const partner = data?.partner;
  const stats   = data?.stats ?? {};

  // ── 로딩 ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ color: '#9B87F5', fontSize: 14 }}
        >
          별자리를 불러오는 중...
        </motion.div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={{ fontSize: 20 }}>🌟</span>
          <div>
            <div style={S.headerTitle}>
              {view === 'dashboard' && (partner?.name || '별들의 고향')}
              {view === 'stars'     && '별자리 현황'}
              {view === 'qr'       && 'QR 카드'}
            </div>
            {view === 'dashboard' && partner?.address && (
              <div style={S.headerSub}>{partner.address}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {view !== 'dashboard' && (
            <button style={S.logoutBtn} onClick={() => setView('dashboard')}>← 뒤로</button>
          )}
          {view === 'dashboard' && (
            <button style={S.logoutBtn} onClick={handleLogout}>로그아웃</button>
          )}
        </div>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      <AnimatePresence mode="wait">
        {/* ── 메인 대시보드 ── */}
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* 통계 */}
            <div style={S.section}>
              <div style={S.sectionTitle}>별자리 현황</div>
              <div style={S.statsRow}>
                <div style={{ ...S.statBox, gridColumn: '1 / -1' }}>
                  <span style={{ ...S.statNum, fontSize: 36, color: '#FFD700' }}>
                    {stats.star_count ?? 0}
                  </span>
                  <span style={S.statLabel}>탄생한 별 ✨</span>
                </div>
              </div>
              <div style={S.statsRow3}>
                <div style={S.statBox}>
                  <span style={{ ...S.statNum, fontSize: 20, color: '#60a5fa' }}>
                    {stats.today_visits ?? 0}
                  </span>
                  <span style={S.statLabel}>오늘 방문</span>
                </div>
                <div style={S.statBox}>
                  <span style={{ ...S.statNum, fontSize: 20, color: '#9B87F5' }}>
                    {stats.month_visits ?? 0}
                  </span>
                  <span style={S.statLabel}>이달 방문</span>
                </div>
                <div style={S.statBox}>
                  <span style={{ ...S.statNum, fontSize: 20, color: '#34d399' }}>
                    {stats.total_visits ?? 0}
                  </span>
                  <span style={S.statLabel}>전체 방문</span>
                </div>
              </div>
            </div>

            {/* 메뉴 */}
            <div style={S.section}>
              <div style={S.sectionTitle}>빠른 메뉴</div>

              <button style={S.menuBtn} onClick={() => setView('qr')}>
                <span>
                  <span style={S.menuIcon}>📇</span>
                  QR 카드 다운로드
                </span>
                <span style={S.menuChevron}>›</span>
              </button>

              <button style={S.menuBtn} onClick={() => setView('stars')}>
                <span>
                  <span style={S.menuIcon}>⭐</span>
                  별자리 현황 보기
                </span>
                <span style={S.menuChevron}>›</span>
              </button>

              <button style={S.menuBtn} onClick={() => nav('/partner/orders')}>
                <span>
                  <span style={S.menuIcon}>📦</span>
                  주문 관리
                </span>
                <span style={S.menuChevron}>›</span>
              </button>

              <button style={S.menuBtn} onClick={() => nav('/partner/settlement')}>
                <span>
                  <span style={S.menuIcon}>💰</span>
                  정산 내역
                </span>
                <span style={S.menuChevron}>›</span>
              </button>

              <button
                style={{ ...S.menuBtn, opacity: 0.5, cursor: 'not-allowed' }}
                disabled
              >
                <span>
                  <span style={S.menuIcon}>📊</span>
                  이달 리포트 보기
                  <span style={{ fontSize: 11, color: '#7A6E9C', marginLeft: 8 }}>준비 중</span>
                </span>
                <span style={S.menuChevron}>›</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── QR 카드 뷰 ── */}
        {view === 'qr' && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={S.section}>
              {qrImage ? (
                <>
                  <div style={S.qrCode}>{qrCode}</div>
                  <img src={qrImage} alt="Hometown QR" style={S.qrImage} />
                  {qrUrl && (
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#7A6E9C', marginBottom: 12, wordBreak: 'break-all' }}>
                      {qrUrl}
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <button style={S.btn} onClick={handleDownloadQr}>PNG 다운로드</button>
                    <button style={S.btnOutline} onClick={handleGenerateQr} disabled={qrLoading}>
                      재생성
                    </button>
                  </div>
                </>
              ) : qrCode ? (
                <>
                  <div style={S.qrCode}>{qrCode}</div>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button style={S.btn} onClick={handleGenerateQr} disabled={qrLoading}>
                      {qrLoading ? '생성 중...' : 'QR 이미지 불러오기'}
                    </button>
                    <button style={S.btnOutline} onClick={handleDownloadQr}>PNG 다운로드</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#7A6E9C', marginBottom: 20, lineHeight: 1.7 }}>
                    아직 QR 코드가 없어요.<br />
                    지금 생성하면 업체 QR 스티커에 사용할 수 있어요.
                  </div>
                  <button style={S.btn} onClick={handleGenerateQr} disabled={qrLoading}>
                    {qrLoading ? '생성 중...' : 'QR 코드 생성'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── 별자리 현황 뷰 ── */}
        {view === 'stars' && (
          <motion.div
            key="stars"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={S.section}>
              <div style={S.sectionTitle}>탄생한 별 ({stars.length})</div>
              {stars.length === 0 ? (
                <div style={S.emptyText}>아직 이 고향에 별이 없어요</div>
              ) : (
                stars.map(star => <StarCard key={star.id} star={star} />)
              )}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button style={S.btnOutline} onClick={loadStars}>새로고침</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
