/**
 * HometownAdmin.jsx — 별의 고향 파트너 관리 어드민
 * 경로: /admin/hometown/:partnerId
 *
 * 모바일 375px 최적화 | Aurora5 톤 (#9B87F5, #0D1B2A)
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const TOKEN_KEY = 'dt_admin_token';

// ── 스타일 ──────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#0D1B2A',
    padding: '0 0 40px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  header: {
    background: 'rgba(155, 135, 245, 0.08)',
    borderBottom: '1px solid rgba(155, 135, 245, 0.15)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#9B87F5',
  },
  section: {
    padding: '20px',
    borderBottom: '1px solid rgba(155, 135, 245, 0.1)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#9B87F5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  statsRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    background: 'rgba(155, 135, 245, 0.07)',
    border: '1px solid rgba(155, 135, 245, 0.15)',
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
  gateWrap: {
    maxWidth: 320,
    margin: '80px auto 0',
    padding: '32px 24px',
    background: 'rgba(155, 135, 245, 0.07)',
    border: '1px solid rgba(155, 135, 245, 0.2)',
    borderRadius: 20,
    textAlign: 'center',
  },
  tokenInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid rgba(155, 135, 245, 0.3)',
    background: 'rgba(255,255,255,0.05)',
    color: '#E8E4F0',
    fontSize: 14,
    marginBottom: 12,
    boxSizing: 'border-box',
    outline: 'none',
  },
  tokenBtn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 10,
    border: 'none',
    background: '#9B87F5',
    color: '#0D1B2A',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  errorMsg: {
    color: '#f87171',
    fontSize: 13,
    marginTop: 12,
  },
};

// ── 날짜 포맷 헬퍼 ────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  const s = String(d).slice(0, 10);
  const [y, m, dd] = s.split('-');
  return `${y}.${m}.${dd}`;
}

// ── TokenGate ─────────────────────────────────────────────────────
function TokenGate({ onToken }) {
  const [val, setVal] = useState('');
  return (
    <div style={S.page}>
      <div style={S.gateWrap}>
        <div style={{ fontSize: 14, color: '#9B87F5', marginBottom: 12, fontWeight: 700 }}>
          별들의 고향 — 관리자 인증
        </div>
        <input
          type="password"
          placeholder="Admin Token"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && val && onToken(val)}
          style={S.tokenInput}
        />
        <button onClick={() => val && onToken(val)} style={S.tokenBtn}>
          확인
        </button>
      </div>
    </div>
  );
}

// ── 통계 바 ────────────────────────────────────────────────────────
function StatsBar({ starCount, todayVisits, totalVisits }) {
  const items = [
    { label: '탄생한 별', value: starCount ?? 0, color: '#FFD700' },
    { label: '오늘 방문', value: todayVisits ?? 0, color: '#60a5fa' },
    { label: '전체 방문', value: totalVisits ?? 0, color: '#9B87F5' },
  ];
  return (
    <div style={S.statsRow}>
      {items.map(it => (
        <div key={it.label} style={S.statBox}>
          <span style={{ ...S.statNum, color: it.color }}>{it.value}</span>
          <span style={S.statLabel}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── 별 카드 ────────────────────────────────────────────────────────
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

// ── 메인 컴포넌트 ────────────────────────────────────────────────────
export default function HometownAdmin() {
  const { partnerId } = useParams();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [authed, setAuthed] = useState(false);

  const [partner, setPartner]       = useState(null);
  const [stars, setStars]           = useState([]);
  const [todayVisits, setTodayVisits] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);

  const [qrImage, setQrImage]   = useState(null);
  const [qrCode, setQrCode]     = useState(null);
  const [qrUrl, setQrUrl]       = useState(null);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // 토큰 게이트 통과 시 저장 + 데이터 로드 트리거
  function handleToken(t) {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setAuthed(true);
  }

  const authHeader = () => ({ 'X-Admin-Token': token });

  // ── 데이터 로드 ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!partnerId || !token) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/hometown/admin/${partnerId}/stars`, {
        headers: authHeader(),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || `오류 (${r.status})`);
        return;
      }
      const d = await r.json();
      setPartner(d.partner || null);
      setStars(d.stars || []);
      setTodayVisits(d.today_visits ?? 0);
      setTotalVisits(d.total_visits ?? 0);

      // QR 코드 정보가 있으면 표시
      if (d.partner?.hometown_qr_code) {
        setQrCode(d.partner.hometown_qr_code);
      }
    } catch (err) {
      setError('데이터를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [partnerId, token]);

  useEffect(() => {
    if (token) {
      setAuthed(true);
      loadData();
    }
  }, [token, loadData]);

  // ── QR 생성 ──────────────────────────────────────────────────────
  async function handleGenerateQr() {
    setQrLoading(true);
    setError('');
    try {
      const r = await fetch('/api/hometown/admin/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ partner_id: partnerId }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'QR 생성 실패'); return; }
      setQrImage(d.qr_image_base64);
      setQrCode(d.qr_code);
      setQrUrl(d.qr_url);
    } catch (err) {
      setError('QR 생성 중 오류가 발생했어요');
    } finally {
      setQrLoading(false);
    }
  }

  // ── QR 다운로드 ──────────────────────────────────────────────────
  function handleDownloadQr() {
    const url = `/api/hometown/admin/${partnerId}/qr-download`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `hometown-qr-${qrCode || partnerId}.png`);
    // X-Admin-Token은 링크 다운로드에서는 헤더 첨부 불가 → fetch 방식 사용
    fetch(url, { headers: authHeader() })
      .then(r => r.blob())
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objUrl;
        link.download = `hometown-qr-${qrCode || partnerId}.png`;
        link.click();
        URL.revokeObjectURL(objUrl);
      })
      .catch(() => setError('다운로드에 실패했어요'));
  }

  if (!authed) return <TokenGate onToken={handleToken} />;

  return (
    <div style={S.page}>
      {/* 헤더 */}
      <div style={S.header}>
        <div>🏡</div>
        <div>
          <div style={S.headerTitle}>
            {partner ? partner.name : '별들의 고향'} — 관리자
          </div>
          {partner?.hometown_qr_code && (
            <div style={{ fontSize: 11, color: '#7A6E9C', fontFamily: 'monospace', marginTop: 2 }}>
              {partner.hometown_qr_code}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 20px' }}>
          <div style={S.errorMsg}>{error}</div>
        </div>
      )}

      {loading && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#7A6E9C', fontSize: 14 }}>
          불러오는 중...
        </div>
      )}

      {!loading && (
        <>
          {/* 통계 */}
          <div style={S.section}>
            <div style={S.sectionTitle}>통계</div>
            <StatsBar
              starCount={partner?.hometown_star_count}
              todayVisits={todayVisits}
              totalVisits={totalVisits}
            />
          </div>

          {/* QR 코드 섹션 */}
          <div style={S.section}>
            <div style={S.sectionTitle}>QR 코드</div>

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
                  <button style={S.btnOutline} onClick={handleDownloadQr}>
                    PNG 다운로드
                  </button>
                  <button style={S.btnOutline} onClick={handleGenerateQr} disabled={qrLoading}>
                    재생성
                  </button>
                </div>
              </>
            ) : partner?.hometown_qr_code ? (
              <>
                <div style={S.qrCode}>{partner.hometown_qr_code}</div>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button style={S.btn} onClick={handleGenerateQr} disabled={qrLoading}>
                    {qrLoading ? '생성 중...' : 'QR 이미지 불러오기'}
                  </button>
                  <button style={S.btnOutline} onClick={handleDownloadQr}>
                    PNG 다운로드
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#7A6E9C', marginBottom: 16 }}>
                  아직 QR 코드가 없어요.<br />지금 생성하면 파트너 QR 스티커에 사용할 수 있어요.
                </div>
                <button style={S.btn} onClick={handleGenerateQr} disabled={qrLoading}>
                  {qrLoading ? '생성 중...' : 'QR 코드 생성'}
                </button>
              </div>
            )}
          </div>

          {/* 별 목록 */}
          <div style={S.section}>
            <div style={S.sectionTitle}>탄생한 별 ({stars.length})</div>
            {stars.length === 0 ? (
              <div style={S.emptyText}>아직 이 고향에 별이 없어요</div>
            ) : (
              stars.map(star => <StarCard key={star.id} star={star} />)
            )}
          </div>

          {/* 새로고침 */}
          <div style={{ padding: '8px 20px', textAlign: 'center' }}>
            <button style={S.btnOutline} onClick={loadData}>
              새로고침
            </button>
          </div>
        </>
      )}
    </div>
  );
}
