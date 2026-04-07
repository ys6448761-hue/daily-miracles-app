/**
 * VoyageStatus.jsx — /voyage/:id
 * 항해 상태 화면 (문구 1줄 + 상태별 다음 행동)
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE ?? '';

// 결제 완료 후 confirm 처리 (NicePay return 파라미터 감지)
async function handlePaymentReturn(bookingId) {
  const params = new URLSearchParams(window.location.search);
  const authResultCode = params.get('AuthResultCode') || params.get('authResultCode');
  const paymentKey     = params.get('AuthToken')      || params.get('tid') || params.get('TID');
  const tid            = params.get('TID')            || params.get('tid');

  if (!authResultCode || !bookingId) return false;

  // 성공 코드 (NicePay: '0000')
  if (authResultCode !== '0000') return false;

  try {
    const res = await fetch(`${API}/api/voyage/payment/confirm`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ booking_id: bookingId, payment_key: paymentKey, transaction_id: tid }),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export default function VoyageStatus() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      // NicePay 결제 완료 파라미터 감지 → confirm 처리
      const bookingId = sessionStorage.getItem('voyage_booking_id');
      await handlePaymentReturn(bookingId);

      try {
        const res  = await fetch(`${API}/api/voyage/${id}/status`);
        const json = await res.json();
        if (res.ok) setData(json);
      } catch (_) {}
      setLoading(false);
    }
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStarCreate() {
    setActionLoading(true);
    try {
      const res  = await fetch(`${API}/api/voyage/${id}/star`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.star_id) {
        // 기존 StarBirth 화면 재사용
        const starState = {
            starId:         json.star_id,
            starName:       json.star_name,
            galaxy:         json.galaxy,          // 'challenge' (내부값)
            galaxyDisplay:  json.galaxy_display,  // '북은하' (노출값)
            gemType:        'ruby',
            wishText:       data?.wish_text ?? '',
          };
          try { sessionStorage.setItem('dt_recent_star', JSON.stringify(starState)); } catch (_) {}
          nav('/star-birth', { state: starState });
      }
    } catch (_) {}
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>항해를 불러오는 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>항해를 찾을 수 없어요.</p>
        <button onClick={() => nav('/voyage')} style={{ color: 'rgba(255,215,106,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          처음으로 →
        </button>
      </div>
    );
  }

  const { wish_text, status, status_line, booking, star_id } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>

        {/* 별 아이콘 */}
        <p style={{ fontSize: 52, marginBottom: 20 }}>✦</p>

        {/* 소원 */}
        <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.6)', fontStyle: 'italic', marginBottom: 16 }}>
          &ldquo;{wish_text}&rdquo;
        </p>

        {/* 상태 문구 1줄 */}
        <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>
          {status_line}
        </p>

        {/* 예약 정보 */}
        {booking && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>
            {booking.booking_date} · {booking.session === 'morning' ? '오전 09:00~13:00' : '저녁 17:00~21:00'}
          </p>
        )}

        {/* 상태별 행동 버튼 */}
        {status === 'voyage_completed' && !star_id && (
          <button
            onClick={handleStarCreate}
            disabled={actionLoading}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 9999,
              background: '#FFD76A', color: '#0D1B2A',
              fontSize: 16, fontWeight: 700, border: 'none',
              cursor: actionLoading ? 'wait' : 'pointer',
              boxShadow: '0 0 28px 6px rgba(255,215,106,0.2)',
            }}
          >
            {actionLoading ? '별을 만드는 중...' : '별 만들기 ✦'}
          </button>
        )}

        {status === 'star_created' && star_id && (
          <button
            onClick={() => nav(`/star/${star_id}`)}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 9999,
              background: '#FFD76A', color: '#0D1B2A',
              fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            내 별 보러가기 ✦
          </button>
        )}

        {status === 'booking_confirmed' && (
          <button
            onClick={() => nav(`/voyage/${id}/reflection`)}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 9999,
              background: '#FFD76A', color: '#0D1B2A',
              fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            항해 회고하기 ✦
          </button>
        )}

      </div>
    </div>
  );
}
