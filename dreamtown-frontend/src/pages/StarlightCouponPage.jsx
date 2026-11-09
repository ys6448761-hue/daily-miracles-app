import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// 테스트용 가상 가맹점 목록 (Production 미적용)
const TEST_VENUES = {
  'test_jokbal':    { name: '가상 족발집 (테스트)', emoji: '🍖' },
  'test_naengmyeon':{ name: '가상 냉면집 (테스트)',  emoji: '🍜' },
};

const API = '/api/starlight-coupon';

export default function StarlightCouponPage() {
  const [searchParams] = useSearchParams();
  const from    = searchParams.get('from')    || '';
  const venueId = searchParams.get('venue')   || '';

  const [phase, setPhase]     = useState('issue');   // issue | view | redeem | done | error
  const [couponId, setCouponId] = useState(null);
  const [coupon, setCoupon]   = useState(null);
  const [pin, setPin]         = useState('');
  const [msg, setMsg]         = useState('');
  const [loading, setLoading] = useState(false);

  const venue = TEST_VENUES[venueId] || { name: venueId || '제휴 가맹점', emoji: '🏪' };

  // 쿠폰 발급
  const issueCoupon = useCallback(async () => {
    if (!venueId) { setMsg('venue 파라미터가 없습니다.'); setPhase('error'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_source: from || 'kenny', venue_id: venueId }),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      setCouponId(data.coupon_id);
      await loadCoupon(data.coupon_id);
    } catch (e) {
      setMsg(e.message || '쿠폰 발급에 실패했습니다.');
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [from, venueId]);

  const loadCoupon = useCallback(async (id) => {
    const r = await fetch(`${API}/${id}`);
    const data = await r.json();
    if (!data.ok) throw new Error(data.error);
    setCoupon(data.coupon);
    setPhase(data.coupon.is_used ? 'done' : 'view');
  }, []);

  useEffect(() => { issueCoupon(); }, []);

  const handleRedeem = async () => {
    if (!pin) { setMsg('확인번호를 입력해주세요.'); return; }
    setLoading(true);
    setMsg('');
    try {
      const r = await fetch(`${API}/${couponId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, venue_id: venueId }),
      });
      const data = await r.json();
      if (!data.ok) {
        setMsg(data.error || '확인번호가 올바르지 않습니다.');
        return;
      }
      setPhase('done');
    } catch {
      setMsg('사용 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.star}>✦</span>
          <span style={styles.title}>DreamTown 별빛쿠폰</span>
        </div>

        <div style={styles.venueBadge}>
          <span>{venue.emoji}</span>
          <span>{venue.name}</span>
        </div>

        {phase === 'issue' && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.hint}>쿠폰을 준비하고 있어요...</p>
          </div>
        )}

        {phase === 'view' && coupon && (
          <>
            <div style={styles.couponBox}>
              <p style={styles.couponLabel}>케니호텔 × DreamTown 식사 혜택</p>
              <p style={styles.couponDesc}>식사 후 직원에게 이 화면을 보여주세요.</p>
              <div style={styles.pinPrompt}>
                <p style={styles.pinLabel}>직원이 확인번호를 입력합니다</p>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="확인번호 입력"
                  value={pin}
                  onChange={e => { setPin(e.target.value); setMsg(''); }}
                  style={styles.pinInput}
                  maxLength={6}
                />
                {msg && <p style={styles.errMsg}>{msg}</p>}
                <button
                  onClick={handleRedeem}
                  disabled={loading || !pin}
                  style={{ ...styles.btn, opacity: (loading || !pin) ? 0.5 : 1 }}
                >
                  {loading ? '처리 중...' : '사용 완료 처리'}
                </button>
              </div>
            </div>
            <p style={styles.issuedAt}>발급: {new Date(coupon.issued_at).toLocaleString('ko-KR')}</p>
            <p style={styles.couponId}>쿠폰번호: {coupon.id.slice(0, 8).toUpperCase()}</p>
          </>
        )}

        {phase === 'done' && (
          <div style={styles.doneBox}>
            <div style={styles.doneIcon}>✓</div>
            <p style={styles.doneTitle}>사용 완료</p>
            <p style={styles.doneDesc}>쿠폰이 사용되었습니다.<br />DreamTown을 즐겨주셔서 감사합니다 ✦</p>
          </div>
        )}

        {phase === 'error' && (
          <div style={styles.errBox}>
            <p style={styles.errTitle}>쿠폰 오류</p>
            <p style={styles.hint}>{msg || '문제가 발생했습니다. 호텔 프런트에 문의해주세요.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: '100dvh',
    background: 'linear-gradient(160deg, #0d0d1a 0%, #1a1030 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,215,120,0.25)',
    borderRadius: '20px',
    padding: '32px 24px',
    maxWidth: '360px',
    width: '100%',
    color: '#fff',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '20px',
  },
  star: { color: '#FFD67A', fontSize: '1.2rem' },
  title: { fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.3px' },
  venueBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,215,120,0.10)',
    border: '1px solid rgba(255,215,120,0.20)',
    borderRadius: '50px',
    padding: '6px 14px',
    fontSize: '0.875rem',
    marginBottom: '24px',
    width: 'fit-content',
  },
  center: { textAlign: 'center', padding: '32px 0' },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid rgba(255,215,120,0.2)',
    borderTopColor: '#FFD67A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 12px',
  },
  hint: { fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 },
  couponBox: {
    background: 'rgba(255,215,120,0.06)',
    border: '1px dashed rgba(255,215,120,0.30)',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '12px',
  },
  couponLabel: { fontWeight: 700, fontSize: '1rem', margin: '0 0 4px' },
  couponDesc: { fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px' },
  pinPrompt: { display: 'flex', flexDirection: 'column', gap: '10px' },
  pinLabel: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 },
  pinInput: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '1.25rem',
    letterSpacing: '0.3em',
    padding: '12px 14px',
    textAlign: 'center',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  errMsg: { fontSize: '0.8rem', color: '#FF7070', margin: 0 },
  btn: {
    background: '#FFD67A',
    color: '#130b1e',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 700,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    width: '100%',
  },
  issuedAt: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: '8px 0 2px', textAlign: 'center' },
  couponId: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: 0, textAlign: 'center' },
  doneBox: { textAlign: 'center', padding: '24px 0' },
  doneIcon: {
    width: '56px', height: '56px',
    background: 'rgba(100,220,120,0.15)',
    border: '2px solid rgba(100,220,120,0.4)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.5rem',
    margin: '0 auto 16px',
    color: '#6EDC6E',
  },
  doneTitle: { fontWeight: 700, fontSize: '1.1rem', margin: '0 0 8px' },
  doneDesc: { fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 },
  errBox: { textAlign: 'center', padding: '24px 0' },
  errTitle: { fontWeight: 700, color: '#FF7070', margin: '0 0 8px' },
};
