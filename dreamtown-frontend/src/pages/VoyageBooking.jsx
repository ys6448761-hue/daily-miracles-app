/**
 * VoyageBooking.jsx — /voyage/booking
 * 날짜 + 회차 선택 + 이름 + 연락처 → NicePay 결제
 * 회차: 오전 09:00~13:00 / 저녁 17:00~21:00
 * 금액: 주중 60,000 / 주말 89,000
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE ?? '';

const SESSIONS = [
  { id: 'morning', label: '오전', time: '09:00 ~ 13:00' },
  { id: 'evening', label: '저녁', time: '17:00 ~ 21:00' },
];

function calcAmount(dateStr) {
  if (!dateStr) return null;
  const day = new Date(dateStr).getDay();
  return (day === 0 || day === 6) ? 89000 : 60000;
}

function formatAmount(n) {
  return n?.toLocaleString('ko-KR') + '원';
}

// 오늘 이후 날짜만 허용
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function VoyageBooking() {
  const nav          = useNavigate();
  const { state }    = useLocation();

  // wish_id: state 우선, 없으면 sessionStorage
  const wishId   = state?.wish_id   ?? sessionStorage.getItem('voyage_wish_id')   ?? null;
  const wishText = state?.wish_text ?? '';

  const [date, setDate]       = useState('');
  const [session, setSession] = useState('');
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const amount  = calcAmount(date);
  const canPay  = date && session && name.trim() && phone.trim() && !loading;

  if (!wishId) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: '0 24px' }}>
          <p style={{ marginBottom: 16 }}>소원 정보를 찾을 수 없어요.</p>
          <button onClick={() => nav('/voyage')} style={{ color: 'rgba(255,215,106,0.75)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            처음으로 돌아가기 →
          </button>
        </div>
      </div>
    );
  }

  async function handlePay() {
    if (!canPay) return;
    setLoading(true);
    setError('');

    try {
      // 1. 예약 생성
      const bookingRes = await fetch(`${API}/api/voyage/booking`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ wish_id: wishId, customer_name: name.trim(), phone: phone.trim(), booking_date: date, session }),
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error || '예약 생성 실패');

      const bookingId = bookingData.booking.id;
      try { sessionStorage.setItem('voyage_booking_id', bookingId); } catch (_) {}

      // 2. 결제 요청
      const checkoutRes = await fetch(`${API}/api/voyage/payment/checkout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ booking_id: bookingId }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || '결제 요청 실패');

      // 3. NicePay 결제 페이지로 이동
      // payment_url = /pay?moid=xxx (기존 NicePay 라우트)
      window.location.href = checkoutData.payment_url;

    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', color: 'white', padding: '48px 24px' }}>
      <div style={{ maxWidth: 340, margin: '0 auto' }}>

        {/* 헤더 */}
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, marginBottom: 24 }}>
          ← 뒤로
        </button>

        <p style={{ fontSize: 11, color: 'rgba(255,215,106,0.6)', letterSpacing: '0.06em', marginBottom: 8 }}>
          ✦ 북은하 항해 예약
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>언제 항해할까요</h1>
        {wishText && (
          <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.55)', fontStyle: 'italic', marginBottom: 28 }}>
            &ldquo;{wishText}&rdquo;
          </p>
        )}

        {/* 날짜 */}
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
          날짜
        </label>
        <input
          type="date"
          value={date}
          min={minDate()}
          onChange={e => setDate(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${date ? 'rgba(255,215,106,0.4)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 12, padding: '12px 14px',
            color: 'white', fontSize: 14, outline: 'none',
            marginBottom: 20, colorScheme: 'dark',
          }}
        />

        {/* 회차 */}
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
          회차
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {SESSIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSession(s.id)}
              style={{
                padding: '14px 10px',
                borderRadius: 12,
                border: `1px solid ${session === s.id ? 'rgba(255,215,106,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: session === s.id ? 'rgba(255,215,106,0.08)' : 'rgba(255,255,255,0.03)',
                color: session === s.id ? 'rgba(255,215,106,0.95)' : 'rgba(255,255,255,0.55)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s',
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 11, opacity: 0.7 }}>{s.time}</p>
            </button>
          ))}
        </div>

        {/* 이름 */}
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
          이름
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="홍길동"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '12px 14px',
            color: 'white', fontSize: 14, outline: 'none', marginBottom: 12,
          }}
        />

        {/* 연락처 */}
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
          연락처
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="010-0000-0000"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '12px 14px',
            color: 'white', fontSize: 14, outline: 'none', marginBottom: 24,
          }}
        />

        {/* 금액 표시 */}
        {amount && (
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: 'rgba(255,215,106,0.06)',
            border: '1px solid rgba(255,215,106,0.18)',
            marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {new Date(date).getDay() === 0 || new Date(date).getDay() === 6 ? '주말' : '주중'} 항해
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,215,106,0.9)' }}>
              {formatAmount(amount)}
            </span>
          </div>
        )}

        {error && (
          <p style={{ fontSize: 12, color: 'rgba(255,100,100,0.8)', textAlign: 'center', marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* 결제 CTA */}
        <button
          onClick={handlePay}
          disabled={!canPay}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 9999,
            background: canPay ? '#FFD76A' : 'rgba(255,215,106,0.18)',
            color:      canPay ? '#0D1B2A'  : 'rgba(255,215,106,0.35)',
            fontSize: 16, fontWeight: 700, border: 'none',
            cursor: canPay ? 'pointer' : 'default', transition: 'all 0.2s',
          }}
        >
          {loading ? '처리 중...' : `결제하기${amount ? ` ${formatAmount(amount)}` : ''}`}
        </button>

      </div>
    </div>
  );
}
