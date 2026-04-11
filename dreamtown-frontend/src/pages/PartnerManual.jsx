/**
 * PartnerManual.jsx — /partner/manual
 *
 * QR 스캔 불가 환경(낚시배·요트·야외)용 수동 검증 화면
 *
 * 3단계 플로우:
 *   STEP 1 — 파트너 코드 + PIN 입력
 *   STEP 2 — 이용권 코드 입력 + 조회
 *   STEP 3 — 이용권 확인 + [사용 완료 처리] 버튼
 */

import { useState } from 'react';
import GalaxyToast from '../components/GalaxyToast.jsx';

const API = import.meta.env.VITE_API_BASE ?? '';

const STATUS_INFO = {
  ISSUED:    { label: '사용 가능',    ok: true  },
  ACTIVE:    { label: '사용 가능',    ok: true  },
  VERIFIED:  { label: '확인됨',       ok: true  },
  REDEEMED:  { label: '이미 사용 완료', ok: false },
  EXPIRED:   { label: '유효기간 만료', ok: false },
  CANCELLED: { label: '취소된 이용권', ok: false },
};

const STEP = { AUTH: 1, LOOKUP: 2, CONFIRM: 3 };

export default function PartnerManual() {
  const [step,        setStep]       = useState(STEP.AUTH);
  const [partnerCode, setPartnerCode] = useState(import.meta.env.VITE_PARTNER_CODE ?? '');
  const [pin,         setPin]        = useState('');
  const [credCode,    setCredCode]   = useState('');
  const [credential,  setCredential] = useState(null);
  const [busy,        setBusy]       = useState(false);
  const [toast,       setToast]      = useState('');
  const [error,       setError]      = useState('');
  const [done,        setDone]       = useState(false);

  // ── STEP 1: PIN 인증 ────────────────────────────────────────────────
  // PIN은 서버에서 검증하므로 여기서는 입력값만 보관 후 STEP 2로 이동
  function handleAuth(e) {
    e.preventDefault();
    if (!partnerCode.trim() || !pin.trim()) {
      setError('파트너 코드와 PIN을 모두 입력해주세요');
      return;
    }
    setError('');
    setStep(STEP.LOOKUP);
  }

  // ── STEP 2: 이용권 조회 ─────────────────────────────────────────────
  async function handleLookup(e) {
    e.preventDefault();
    if (!credCode.trim()) { setError('이용권 번호를 입력해주세요'); return; }

    setBusy(true);
    setError('');
    try {
      const res  = await fetch(`${API}/api/dt/credentials/${credCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (data.ok) {
        setCredential(data);
        setStep(STEP.CONFIRM);
      } else {
        setError(data.error ?? '이용권을 찾을 수 없어요');
      }
    } catch {
      setError('네트워크 오류가 발생했어요');
    } finally {
      setBusy(false);
    }
  }

  // ── STEP 3: 수동 redeem ─────────────────────────────────────────────
  async function handleRedeem() {
    if (!credential) return;
    setBusy(true);
    setError('');
    try {
      const res  = await fetch(
        `${API}/api/dt/credentials/${credential.credential_code}/manual-redeem`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            partner_code:  partnerCode.trim(),
            partner_pin:   pin,
            manual_reason: 'no_scanner',
          }),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setToast(data.toast_message ?? '이용이 완료됐어요 ✦');
        setDone(true);
        setCredential(prev => ({ ...prev, status: 'REDEEMED' }));
      } else {
        if (data.code === 'WRONG_PIN') {
          // PIN 틀림 → STEP 1로 되돌아감
          setStep(STEP.AUTH);
          setPin('');
          setError('PIN이 일치하지 않아요. 다시 입력해주세요.');
        } else {
          setError(data.error ?? '처리에 실패했어요');
        }
      }
    } catch {
      setError('네트워크 오류가 발생했어요');
    } finally {
      setBusy(false);
    }
  }

  // ── 초기화 ──────────────────────────────────────────────────────────
  function handleReset() {
    setStep(STEP.AUTH);
    setPin('');
    setCredCode('');
    setCredential(null);
    setError('');
    setDone(false);
  }

  const statusInfo = credential ? (STATUS_INFO[credential.status] ?? { label: credential.status, ok: false }) : null;

  return (
    <Wrapper>
      <GalaxyToast
        message={toast}
        galaxyCode={credential?.galaxy_code}
        onDone={() => setToast('')}
      />

      <div style={cardStyle}>
        {/* 헤더 */}
        <div style={headerRow}>
          <p style={headerLabel}>DREAMTOWN · 수동 검증</p>
          <StepDots current={step} />
        </div>

        {/* ── STEP 1: 파트너 코드 + PIN ── */}
        {step === STEP.AUTH && (
          <form onSubmit={handleAuth} style={formStyle}>
            <p style={sectionTitle}>파트너 코드 & PIN 입력</p>

            <label style={labelStyle}>파트너 코드</label>
            <input
              style={inputStyle}
              value={partnerCode}
              onChange={e => setPartnerCode(e.target.value)}
              placeholder="partner_yeosu_001"
              autoComplete="off"
            />

            <label style={labelStyle}>PIN 번호</label>
            <input
              style={inputStyle}
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              maxLength={8}
              autoComplete="current-password"
            />

            {error && <p style={errorStyle}>{error}</p>}

            <button type="submit" style={primaryBtn}>
              다음 →
            </button>
          </form>
        )}

        {/* ── STEP 2: 이용권 코드 입력 ── */}
        {step === STEP.LOOKUP && (
          <form onSubmit={handleLookup} style={formStyle}>
            <p style={sectionTitle}>이용권 번호 입력</p>
            <p style={hintStyle}>이용권 번호를 직접 입력하거나 사용자 화면을 보고 입력해주세요</p>

            <label style={labelStyle}>이용권 번호</label>
            <input
              style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              value={credCode}
              onChange={e => setCredCode(e.target.value.toUpperCase())}
              placeholder="BNF-20260409-XXXX"
              autoComplete="off"
              autoFocus
            />

            {error && <p style={errorStyle}>{error}</p>}

            <button type="submit" disabled={busy} style={primaryBtn}>
              {busy ? '조회 중...' : '이용권 조회'}
            </button>

            <button type="button" onClick={() => { setStep(STEP.AUTH); setError(''); }} style={backBtn}>
              ← 돌아가기
            </button>
          </form>
        )}

        {/* ── STEP 3: 이용권 확인 + 처리 ── */}
        {step === STEP.CONFIRM && credential && (
          <div style={formStyle}>
            <p style={sectionTitle}>이용권 확인</p>

            {/* 상태 배지 */}
            <div style={{
              display: 'inline-block',
              padding: '4px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 600, marginBottom: 16,
              background: statusInfo?.ok ? 'rgba(100,232,184,0.12)' : 'rgba(255,80,80,0.10)',
              color:      statusInfo?.ok ? 'rgba(100,232,184,0.9)'  : 'rgba(255,100,100,0.8)',
              border:     `1px solid ${statusInfo?.ok ? 'rgba(100,232,184,0.3)' : 'rgba(255,100,100,0.25)'}`,
            }}>
              {statusInfo?.label ?? credential.status}
            </div>

            {/* 이용권 정보 */}
            <p style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>
              {credential.benefit_name}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,215,106,0.7)', marginBottom: 20 }}>
              {credential.face_value > 0
                ? `₩${credential.face_value.toLocaleString('ko-KR')}`
                : '무료'}
            </p>

            <div style={infoRow}>
              <span style={infoLabel}>이용권 번호</span>
              <span style={infoValue}>{credential.credential_code}</span>
            </div>
            {credential.valid_until && (
              <div style={infoRow}>
                <span style={infoLabel}>유효기간</span>
                <span style={infoValue}>
                  {new Date(credential.valid_until).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}

            {error && <p style={{ ...errorStyle, marginTop: 12 }}>{error}</p>}

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {done ? (
                <>
                  <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(100,232,184,0.9)', fontWeight: 500 }}>
                    ✦ 사용 완료 처리됐습니다
                  </p>
                  <button onClick={handleReset} style={primaryBtn}>
                    다음 이용권 처리하기
                  </button>
                </>
              ) : statusInfo?.ok ? (
                <>
                  <button onClick={handleRedeem} disabled={busy} style={{ ...primaryBtn, background: '#FFD76A', color: '#0D1B2A', border: 'none' }}>
                    {busy ? '처리 중...' : '사용 완료 처리 ✦'}
                  </button>
                  <button onClick={() => { setStep(STEP.LOOKUP); setCredential(null); setError(''); }} style={backBtn}>
                    ← 다른 이용권
                  </button>
                </>
              ) : (
                <button onClick={() => { setStep(STEP.LOOKUP); setCredential(null); setError(''); }} style={backBtn}>
                  ← 다른 이용권 입력
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

// ── 단계 표시 점 ──────────────────────────────────────────────────────
function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: n === current
            ? 'rgba(100,232,184,0.8)'
            : n < current
              ? 'rgba(100,232,184,0.35)'
              : 'rgba(255,255,255,0.12)',
        }} />
      ))}
    </div>
  );
}

// ── 레이아웃 ──────────────────────────────────────────────────────────
function Wrapper({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0A1628',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      {children}
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────
const cardStyle = {
  width: '100%', maxWidth: 380,
  background:   'rgba(8,18,32,0.97)',
  border:       '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20,
  padding:      '24px 20px',
  boxSizing:    'border-box',
};

const headerRow   = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 };
const headerLabel = { fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' };
const formStyle   = { display: 'flex', flexDirection: 'column' };
const sectionTitle = { fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 4 };
const hintStyle   = { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 };
const labelStyle  = { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6, marginTop: 14 };

const inputStyle = {
  width: '100%', padding: '13px 14px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white', fontSize: 15,
  boxSizing: 'border-box',
  outline: 'none',
};

const primaryBtn = {
  width: '100%', padding: '15px 0', borderRadius: 9999, marginTop: 20,
  background: 'rgba(100,232,184,0.15)',
  border: '1px solid rgba(100,232,184,0.4)',
  color: 'rgba(100,232,184,0.9)',
  fontSize: 15, fontWeight: 600, cursor: 'pointer',
};

const backBtn = {
  width: '100%', padding: '11px 0', borderRadius: 9999,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'rgba(255,255,255,0.35)',
  fontSize: 13, cursor: 'pointer',
};

const errorStyle = { fontSize: 13, color: 'rgba(255,100,100,0.8)', textAlign: 'center', marginTop: 10 };

const infoRow   = { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const infoLabel = { fontSize: 12, color: 'rgba(255,255,255,0.3)' };
const infoValue = { fontSize: 12, color: 'rgba(255,255,255,0.65)' };
