/**
 * AdminQRCenter.jsx — 창립 파트너 QR 코드 다운로드 센터
 * 경로: /admin/qr-center
 * 보호: 어드민 토큰 (localStorage dt_admin_token)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ADMIN_TOKEN_KEY = 'dt_admin_token';

const GALAXY_COLOR = {
  healing:      '#6FCFB0',
  relationship: '#9B87F5',
  challenge:    '#F5A623',
  growth:       '#74C365',
  miracle:      '#FFD700',
};
const GALAXY_LABEL = {
  healing:      '치유',
  relationship: '관계',
  challenge:    '도전',
  growth:       '성장',
  miracle:      '기적',
};

export default function AdminQRCenter() {
  const [token,    setToken]    = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [authed,   setAuthed]   = useState(false);
  const [partners, setPartners] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [error,    setError]    = useState(null);

  // 토큰 확인 후 목록 로드
  function handleLogin(e) {
    e.preventDefault();
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    loadList(token);
  }

  async function loadList(t) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/admin/partner-qr-list', {
        headers: { 'X-Admin-Token': t },
      });
      if (r.status === 401) { setError('토큰이 올바르지 않아요'); setLoading(false); return; }
      const d = await r.json();
      setPartners(d.partners || []);
      setAuthed(true);
    } catch (err) {
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (t) { setToken(t); loadList(t); }
  }, []);

  async function downloadAll() {
    setZipLoading(true);
    try {
      const r = await fetch('/admin/partner-qr/download-all', {
        headers: { 'X-Admin-Token': token },
      });
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'DreamTown_Partners_QR.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
    setZipLoading(false);
  }

  function downloadOne(partnerId, businessName) {
    const a    = document.createElement('a');
    a.href     = `/admin/partner-qr/${partnerId}/download`;
    a.download = `QR_${partnerId}_${businessName}.png`;
    a.click();
  }

  // ── 로그인 화면 ────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: '#090F1E',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
        <h2 style={{ color: '#E8E4F0', fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
          파트너 QR 다운로드 센터
        </h2>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 320 }}>
          <input
            type="password"
            placeholder="어드민 토큰"
            value={token}
            onChange={e => setToken(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px',
              background: '#10172A', border: '1px solid rgba(155,135,245,0.3)',
              borderRadius: 12, color: '#E8E4F0', fontSize: 14,
              outline: 'none', boxSizing: 'border-box', marginBottom: 12,
            }}
          />
          {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              background: '#9B87F5', borderRadius: 12,
              border: 'none', color: '#fff', fontWeight: 700,
              fontSize: 15, cursor: 'pointer',
            }}
          >
            {loading ? '로딩 중...' : '입장'}
          </button>
        </form>
      </div>
    );
  }

  // ── 메인 화면 ──────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#090F1E',
      fontFamily: "'Noto Sans KR', sans-serif",
      color: '#E8E4F0', padding: '24px 16px',
    }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
          창립 파트너 QR 다운로드 센터
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          전체 {partners.length}개 파트너
        </p>
      </div>

      {/* ZIP 다운로드 버튼 */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={downloadAll}
        disabled={zipLoading}
        style={{
          display: 'block', width: '100%',
          padding: '14px 0', marginBottom: 28,
          background: zipLoading ? '#333' : 'linear-gradient(135deg, #9B87F5, #6FCFB0)',
          border: 'none', borderRadius: 14,
          color: '#fff', fontSize: 15, fontWeight: 800,
          cursor: zipLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {zipLoading
          ? '⏳ ZIP 생성 중...'
          : `📦 전체 ZIP 다운로드 (${partners.length}개)`
        }
      </motion.button>

      {/* 파트너 카드 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14,
      }}>
        {partners.map((p, i) => {
          const color = GALAXY_COLOR[p.galaxy_type] || '#9B87F5';
          return (
            <motion.div
              key={p.partner_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                background: '#10172A',
                border: `1px solid ${color}44`,
                borderRadius: 16,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* 파트너 ID */}
              <div style={{
                fontSize: 10, color: color, fontWeight: 700,
                letterSpacing: 0.5, fontFamily: 'monospace',
              }}>
                {p.partner_id}
              </div>

              {/* 업체명 */}
              <div style={{
                fontSize: 13, fontWeight: 800, textAlign: 'center', lineHeight: 1.3,
              }}>
                {p.business_name}
              </div>

              {/* 은하 라벨 */}
              <div style={{
                fontSize: 11, color, background: `${color}18`,
                padding: '2px 8px', borderRadius: 10,
              }}>
                {GALAXY_LABEL[p.galaxy_type] || p.galaxy_type} 은하
              </div>

              {/* QR 이미지 */}
              <img
                src={p.qr_image}
                alt={`QR ${p.partner_id}`}
                style={{
                  width: '100%', maxWidth: 140,
                  borderRadius: 10,
                  border: '2px solid rgba(255,255,255,0.08)',
                }}
              />

              {/* 스캔 URL */}
              <div style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)',
                wordBreak: 'break-all',
                textAlign: 'center',
                lineHeight: 1.5,
              }}>
                {p.scan_url}
              </div>

              {/* 개별 PNG 저장 버튼 */}
              <button
                onClick={() => downloadOne(p.partner_id, p.business_name)}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: `${color}22`,
                  border: `1px solid ${color}55`,
                  borderRadius: 10,
                  color,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                PNG 저장
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
