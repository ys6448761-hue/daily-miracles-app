/**
 * MobileTicket.jsx — /ticket/:code
 *
 * 사용자의 모바일 이용권 화면
 * - QR 코드 크게 표시 (현장 제시용)
 * - 상태별 UI: ISSUED/ACTIVE → QR / VERIFIED → 대기 / REDEEMED → 완료
 * - 유효기간 카운트다운
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GalaxyToast from '../components/GalaxyToast.jsx';

const API = import.meta.env.VITE_API_BASE ?? '';

// 은하군별 accent 색상
const GALAXY_COLORS = {
  challenge: '#FFD76A',
  growth:    '#6AE8B8',
  relation:  '#A8B8FF',
  healing:   '#FFB8C8',
  miracle:   '#C8A8FF',
};

function formatKRW(n) {
  return n ? `₩${n.toLocaleString('ko-KR')}` : '';
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function daysLeft(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// 상태별 레이블
const STATUS_INFO = {
  ISSUED:    { label: '사용 가능',    color: 'rgba(255,255,255,0.7)',   bg: 'rgba(255,255,255,0.08)' },
  ACTIVE:    { label: '사용 가능',    color: 'rgba(100,232,184,0.9)',   bg: 'rgba(100,232,184,0.10)' },
  VERIFIED:  { label: '확인 완료',    color: 'rgba(255,215,106,0.9)',   bg: 'rgba(255,215,106,0.10)' },
  REDEEMED:  { label: '이용 완료',    color: 'rgba(155,135,245,0.9)',   bg: 'rgba(155,135,245,0.10)' },
  EXPIRED:   { label: '유효기간 만료', color: 'rgba(255,100,100,0.7)',  bg: 'rgba(255,100,100,0.08)' },
  CANCELLED: { label: '취소됨',       color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)' },
};

export default function MobileTicket() {
  const { code }                    = useParams();
  const [credential, setCredential] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');

  useEffect(() => {
    if (!code) return;
    fetch(`${API}/api/dt/credentials/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setCredential(data);
          // 방금 REDEEMED된 경우 toast_message 표시 (쿼리스트링 ?redeemed=1 로 구분)
          const justRedeemed = new URLSearchParams(window.location.search).get('redeemed');
          if (justRedeemed && data.status === 'REDEEMED' && data.toast_message) {
            setToast(data.toast_message);
          }
        } else {
          setError(data.error ?? '이용권을 불러올 수 없어요');
        }
      })
      .catch(() => setError('네트워크 오류가 발생했어요'))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} />;
  if (!credential) return null;

  const { benefit_name, face_value, galaxy_code, status,
          valid_until, qr_data_url, toast_message, redeemed_at } = credential;

  const accent = GALAXY_COLORS[galaxy_code] ?? '#FFD76A';
  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.ISSUED;
  const days = daysLeft(valid_until);
  const isUsable = ['ISSUED', 'ACTIVE', 'VERIFIED'].includes(status);

  return (
    <div style={pageStyle}>
      <GalaxyToast
        message={toast}
        galaxyCode={galaxy_code}
        onDone={() => setToast('')}
      />
      <div style={cardStyle}>

        {/* 헤더 */}
        <div style={headerStyle}>
          <p style={{ fontSize: 11, color: 'rgba(255,215,106,0.6)', letterSpacing: '0.08em' }}>
            ✦ DREAMTOWN
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginTop: 4, lineHeight: 1.4 }}>
            {benefit_name}
          </p>
          {face_value > 0 && (
            <p style={{ fontSize: 14, color: accent, marginTop: 4, fontWeight: 500 }}>
              {formatKRW(face_value)}
            </p>
          )}
        </div>

        {/* 상태 배지 */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <span style={{
            padding: '5px 14px', borderRadius: 999,
            fontSize: 12, fontWeight: 600,
            color:       statusInfo.color,
            background:  statusInfo.bg,
            border:      `1px solid ${statusInfo.color}`,
          }}>
            {statusInfo.label}
          </span>
        </div>

        {/* QR 코드 (사용 가능 상태) */}
        {isUsable && qr_data_url && (
          <div style={qrWrapStyle}>
            <img
              src={qr_data_url}
              alt="이용권 QR 코드"
              style={{ width: 220, height: 220, borderRadius: 12 }}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 10, textAlign: 'center' }}>
              이 화면을 현장 직원에게 보여주세요
            </p>
          </div>
        )}

        {/* VERIFIED 상태 */}
        {status === 'VERIFIED' && (
          <div style={statusBoxStyle}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>✓</p>
            <p style={{ fontSize: 15, color: 'rgba(255,215,106,0.9)', fontWeight: 500 }}>
              확인됐어요
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              잠시 후 이용이 시작됩니다
            </p>
          </div>
        )}

        {/* REDEEMED 상태 */}
        {status === 'REDEEMED' && (
          <div style={statusBoxStyle}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>✦</p>
            <p style={{ fontSize: 15, color: accent, fontWeight: 500, lineHeight: 1.6 }}>
              {toast_message ?? '이용이 완료됐어요'}
            </p>
            {redeemed_at && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                {formatDate(redeemed_at)} 이용
              </p>
            )}
          </div>
        )}

        {/* EXPIRED / CANCELLED */}
        {(status === 'EXPIRED' || status === 'CANCELLED') && (
          <div style={statusBoxStyle}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>—</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              {status === 'EXPIRED' ? '유효기간이 지난 이용권이에요' : '취소된 이용권이에요'}
            </p>
          </div>
        )}

        {/* 유효기간 */}
        {isUsable && valid_until && (
          <div style={infoRowStyle}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>유효기간</span>
            <span style={{ fontSize: 12, color: days <= 3 ? 'rgba(255,120,80,0.8)' : 'rgba(255,255,255,0.55)' }}>
              {formatDate(valid_until)}
              {days !== null && ` (${days}일 남음)`}
            </span>
          </div>
        )}

        {/* 이용권 코드 */}
        <div style={{ ...infoRowStyle, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>이용권 번호</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.05em' }}>{code}</span>
        </div>

      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={pageStyle}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>이용권을 불러오는 중...</p>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={pageStyle}>
      <p style={{ color: 'rgba(255,100,100,0.7)', fontSize: 14, textAlign: 'center', padding: '0 24px' }}>
        {message}
      </p>
    </div>
  );
}

// ── 스타일 ───────────────────────────────────────────────────────────

const pageStyle = {
  minHeight:      '100vh',
  background:     '#0A1628',
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  justifyContent: 'center',
  padding:        '32px 16px',
};

const cardStyle = {
  width:                '100%',
  maxWidth:             380,
  background:           'rgba(8, 18, 32, 0.95)',
  backdropFilter:       'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border:               '1px solid rgba(255,255,255,0.10)',
  borderRadius:         24,
  padding:              '28px 24px',
  boxSizing:            'border-box',
  boxShadow:            '0 20px 80px rgba(0,0,0,0.6)',
};

const headerStyle = {
  textAlign:    'center',
  marginBottom: 4,
};

const qrWrapStyle = {
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  margin:         '16px 0',
  padding:        '20px',
  background:     'rgba(255,255,255,0.03)',
  borderRadius:   16,
  border:         '1px solid rgba(255,255,255,0.07)',
};

const statusBoxStyle = {
  textAlign:    'center',
  padding:      '28px 16px',
  margin:       '12px 0',
};

const infoRowStyle = {
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'center',
  padding:        '8px 0',
};
