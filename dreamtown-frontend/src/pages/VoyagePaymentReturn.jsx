/**
 * VoyagePaymentReturn.jsx — /voyage/payment/result
 * NicePay 결제 완료 콜백 처리 전용 페이지
 *
 * NicePay → POST/GET /voyage/payment/result?AuthResultCode=0000&...
 * → POST /api/voyage/payment/confirm
 * → /voyage/:wish_id
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE ?? '';

export default function VoyagePaymentReturn() {
  const nav = useNavigate();
  const [status, setStatus] = useState('processing'); // processing | success | fail

  useEffect(() => {
    async function processReturn() {
      const params = new URLSearchParams(window.location.search);

      // NicePay 공통 결과 파라미터
      const authResultCode = params.get('AuthResultCode') ?? params.get('resultCode');
      const authToken      = params.get('AuthToken');
      const tid            = params.get('TID') ?? params.get('tid');

      // sessionStorage에서 예약 정보 복원
      const bookingId = sessionStorage.getItem('voyage_booking_id');
      const wishId    = sessionStorage.getItem('voyage_wish_id');

      if (!bookingId || !wishId) {
        // booking 정보 없음 → 홈으로
        nav('/', { replace: true });
        return;
      }

      // 결제 실패
      if (authResultCode && authResultCode !== '0000') {
        setStatus('fail');
        setTimeout(() => nav(`/voyage/booking`, { replace: true }), 2500);
        return;
      }

      // 결제 확인 API 호출
      try {
        const res = await fetch(`${API}/api/voyage/payment/confirm`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            booking_id:     bookingId,
            payment_key:    authToken ?? null,
            transaction_id: tid ?? null,
          }),
        });
        if (res.ok) {
          setStatus('success');
          sessionStorage.removeItem('voyage_booking_id');
          setTimeout(() => nav(`/voyage/${wishId}`, { replace: true }), 1500);
        } else {
          setStatus('fail');
          setTimeout(() => nav(`/voyage/${wishId}`, { replace: true }), 2500);
        }
      } catch (_) {
        setStatus('fail');
        setTimeout(() => nav(`/voyage/${wishId}`, { replace: true }), 2500);
      }
    }

    processReturn();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh', background: '#0D1B2A', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 48, marginBottom: 20 }}>
        {status === 'processing' ? '⏳' : status === 'success' ? '✦' : '✕'}
      </p>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>
        {status === 'processing' && '결제를 확인하는 중이에요...'}
        {status === 'success'    && '결제가 완료됐어요. 항해로 이동합니다.'}
        {status === 'fail'       && '결제에 문제가 생겼어요. 다시 시도해주세요.'}
      </p>
    </div>
  );
}
