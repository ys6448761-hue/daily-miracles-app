/**
 * PartnerVerify.jsx — /partner/verify
 *
 * 파트너(현장 직원)용 QR 스캔 검증 화면
 *
 * 진입 방식 2가지:
 *   A) 카메라 스캔 모드 (기본) — html5-qrcode로 QR 인식 → token 추출 → 자동 조회
 *   B) URL 파라미터 모드 (?token=xxx) — 기존 방식 fallback
 *
 * 상태 흐름:
 *   SCAN → LOADING → RESULT (verify / redeem 버튼)
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import GalaxyToast from '../components/GalaxyToast.jsx';

const API              = import.meta.env.VITE_API_BASE ?? '';
const DEFAULT_PARTNER  = import.meta.env.VITE_PARTNER_CODE ?? 'partner_yeosu_001';

const QR_REGION_ID = 'partner-qr-reader';

// QR URL에서 token 추출 — "/scan/{token}" 패턴 또는 쿼리스트링 ?token=
function extractToken(raw) {
  try {
    const url   = new URL(raw);
    const parts = url.pathname.split('/');
    const idx   = parts.indexOf('scan');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    return url.searchParams.get('token') ?? null;
  } catch {
    // raw가 URL이 아닌 순수 token 문자열인 경우
    return raw.trim() || null;
  }
}

const STATUS_LABEL = {
  ISSUED:    '사용 가능 ✓',
  ACTIVE:    '사용 가능 ✓',
  VERIFIED:  '확인됨 — 사용 완료 대기',
  REDEEMED:  '이미 사용 완료',
  EXPIRED:   '유효기간 만료',
  CANCELLED: '취소된 이용권',
};

// ── 화면 단계 ─────────────────────────────────────────────────────────
// 'scan'    — 카메라 뷰파인더
// 'loading' — 스캔 후 조회 중
// 'result'  — 이용권 정보 + 버튼
const STEP = { SCAN: 'scan', LOADING: 'loading', RESULT: 'result' };

export default function PartnerVerify() {
  const [params]  = useSearchParams();
  const urlToken  = params.get('token');

  const [step,       setStep]       = useState(urlToken ? STEP.LOADING : STEP.SCAN);
  const [credential, setCredential] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast,      setToast]      = useState('');
  const [message,    setMessage]    = useState('');
  const [error,      setError]      = useState('');

  const scannerRef   = useRef(null);
  const scannedOnce  = useRef(false); // 중복 인식 방지

  // ── 카메라 스캐너 시작 ──────────────────────────────────────────────
  useEffect(() => {
    if (step !== STEP.SCAN) return;

    const scanner = new Html5Qrcode(QR_REGION_ID);
    scannerRef.current = scanner;
    scannedOnce.current = false;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        if (scannedOnce.current) return;
        scannedOnce.current = true;

        scanner.stop().catch(() => {});
        const token = extractToken(decodedText);
        if (token) {
          fetchCredential(token);
        } else {
          setError('유효하지 않은 QR 코드예요');
          setStep(STEP.SCAN);
          scannedOnce.current = false;
        }
      },
      () => {} // 인식 실패 무시 (프레임마다 호출)
    ).catch(() => {
      setError('카메라를 사용할 수 없어요. 권한을 허용해주세요.');
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [step]);

  // ── URL token으로 바로 조회 ─────────────────────────────────────────
  useEffect(() => {
    if (urlToken) fetchCredential(urlToken);
  }, [urlToken]);

  // ── 이용권 조회 ─────────────────────────────────────────────────────
  async function fetchCredential(token) {
    setStep(STEP.LOADING);
    setError('');
    try {
      const res  = await fetch(`${API}/api/dt/credentials/scan/${token}`);
      const data = await res.json();
      if (data.ok) {
        setCredential(data);
        setStep(STEP.RESULT);
      } else {
        setError(data.error ?? '이용권을 확인할 수 없어요');
        setStep(STEP.SCAN);
        scannedOnce.current = false;
      }
    } catch {
      setError('네트워크 오류가 발생했어요');
      setStep(STEP.SCAN);
      scannedOnce.current = false;
    }
  }

  // ── verify ──────────────────────────────────────────────────────────
  async function handleVerify() {
    if (!credential) return;
    setActionBusy(true);
    setMessage('');
    try {
      const res  = await fetch(`${API}/api/dt/credentials/${credential.credential_code}/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ partner_code: DEFAULT_PARTNER }),
      });
      const data = await res.json();
      if (data.ok) {
        setCredential(prev => ({ ...prev, status: 'VERIFIED', can_verify: false, can_redeem: true }));
        setMessage('✓ 검증이 완료됐습니다');
      } else {
        setError(data.error ?? '검증에 실패했어요');
      }
    } catch {
      setError('네트워크 오류가 발생했어요');
    } finally {
      setActionBusy(false);
    }
  }

  // ── redeem ──────────────────────────────────────────────────────────
  async function handleRedeem() {
    if (!credential) return;
    setActionBusy(true);
    setMessage('');
    try {
      const res  = await fetch(`${API}/api/dt/credentials/${credential.credential_code}/redeem`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ partner_code: DEFAULT_PARTNER }),
      });
      const data = await res.json();
      if (data.ok) {
        setCredential(prev => ({ ...prev, status: 'REDEEMED', can_verify: false, can_redeem: false }));
        setToast(data.toast_message ?? '이용이 완료됐어요 ✦');
        setMessage('✦ 사용 완료 처리됐습니다');
      } else {
        setError(data.error ?? '사용 완료 처리에 실패했어요');
      }
    } catch {
      setError('네트워크 오류가 발생했어요');
    } finally {
      setActionBusy(false);
    }
  }

  // ── 다시 스캔 ───────────────────────────────────────────────────────
  function handleRescan() {
    setCredential(null);
    setMessage('');
    setError('');
    setStep(STEP.SCAN);
  }

  // ── 렌더 ────────────────────────────────────────────────────────────
  const isOk = credential && ['ISSUED', 'ACTIVE', 'VERIFIED'].includes(credential.status);

  return (
    <Wrapper>
      <GalaxyToast
        message={toast}
        galaxyCode={credential?.galaxy_code}
        onDone={() => setToast('')}
      />

      <div style={cardStyle}>
        {/* 헤더 */}
        <p style={headerLabel}>DREAMTOWN · 파트너 검증</p>

        {/* ── 스캔 단계 ── */}
        {step === STEP.SCAN && (
          <>
            <p style={stepTitle}>QR 코드를 카메라에 비춰주세요</p>

            {/* 뷰파인더 */}
            <div style={viewfinderWrap}>
              <div id={QR_REGION_ID} style={{ width: '100%' }} />
              {/* 모서리 가이드 */}
              <div style={cornerTL} /><div style={cornerTR} />
              <div style={cornerBL} /><div style={cornerBR} />
            </div>

            {error && <p style={errorText}>{error}</p>}

            <p style={hintText}>카메라 권한을 허용하면 자동으로 인식돼요</p>
          </>
        )}

        {/* ── 로딩 단계 ── */}
        {step === STEP.LOADING && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={hintText}>이용권 확인 중...</p>
          </div>
        )}

        {/* ── 결과 단계 ── */}
        {step === STEP.RESULT && credential && (
          <>
            {/* 상태 배지 */}
            <div style={{
              display: 'inline-block',
              padding: '4px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 600,
              background: isOk ? 'rgba(100,232,184,0.12)' : 'rgba(255,255,255,0.06)',
              color:      isOk ? 'rgba(100,232,184,0.9)'  : 'rgba(255,255,255,0.4)',
              border:     `1px solid ${isOk ? 'rgba(100,232,184,0.3)' : 'rgba(255,255,255,0.1)'}`,
              marginBottom: 16,
            }}>
              {STATUS_LABEL[credential.status] ?? credential.status}
            </div>

            {/* 이용권 정보 */}
            <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 4 }}>
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

            {/* 메시지 */}
            {message && (
              <p style={{ fontSize: 14, color: 'rgba(100,232,184,0.9)', textAlign: 'center', margin: '16px 0', fontWeight: 500 }}>
                {message}
              </p>
            )}
            {error && <p style={errorText}>{error}</p>}

            {/* 액션 버튼 */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {credential.can_verify && (
                <button onClick={handleVerify} disabled={actionBusy} style={primaryBtn}>
                  {actionBusy ? '처리 중...' : 'QR 확인 완료'}
                </button>
              )}
              {credential.can_redeem && (
                <button
                  onClick={handleRedeem}
                  disabled={actionBusy}
                  style={{ ...primaryBtn, background: '#FFD76A', color: '#0D1B2A', border: 'none' }}
                >
                  {actionBusy ? '처리 중...' : '사용 완료 처리 ✦'}
                </button>
              )}

              {/* 다시 스캔 */}
              <button onClick={handleRescan} style={rescanBtn}>
                다른 QR 스캔하기
              </button>
            </div>
          </>
        )}
      </div>
    </Wrapper>
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

const headerLabel = {
  fontSize: 10, color: 'rgba(255,255,255,0.25)',
  letterSpacing: '0.1em', marginBottom: 16,
};

const stepTitle = {
  fontSize: 14, color: 'rgba(255,255,255,0.7)',
  textAlign: 'center', marginBottom: 16,
};

const viewfinderWrap = {
  position: 'relative',
  borderRadius: 12, overflow: 'hidden',
  marginBottom: 16,
  background: 'rgba(0,0,0,0.3)',
};

// 모서리 가이드 공통 스타일
const cornerBase = {
  position: 'absolute', width: 20, height: 20,
  borderColor: 'rgba(100,232,184,0.7)', borderStyle: 'solid',
  pointerEvents: 'none',
};
const cornerTL = { ...cornerBase, top: 8, left: 8,  borderWidth: '2px 0 0 2px' };
const cornerTR = { ...cornerBase, top: 8, right: 8, borderWidth: '2px 2px 0 0' };
const cornerBL = { ...cornerBase, bottom: 8, left: 8,  borderWidth: '0 0 2px 2px' };
const cornerBR = { ...cornerBase, bottom: 8, right: 8, borderWidth: '0 2px 2px 0' };

const hintText  = { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' };
const errorText = { fontSize: 12, color: 'rgba(255,100,100,0.8)',  textAlign: 'center', margin: '12px 0' };

const infoRow   = { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const infoLabel = { fontSize: 12, color: 'rgba(255,255,255,0.3)' };
const infoValue = { fontSize: 12, color: 'rgba(255,255,255,0.65)' };

const primaryBtn = {
  width: '100%', padding: '14px 0', borderRadius: 9999,
  background: 'rgba(100,232,184,0.15)',
  border: '1px solid rgba(100,232,184,0.4)',
  color: 'rgba(100,232,184,0.9)',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const rescanBtn = {
  width: '100%', padding: '11px 0', borderRadius: 9999,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.35)',
  fontSize: 13, cursor: 'pointer', marginTop: 4,
};
