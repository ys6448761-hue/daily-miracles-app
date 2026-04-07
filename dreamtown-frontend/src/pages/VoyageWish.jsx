/**
 * VoyageWish.jsx — /voyage
 * "지금 떠오르는 것 하나" 소원 입력
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE ?? '';

export default function VoyageWish() {
  const nav = useNavigate();
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/voyage/wish`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ wish_text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요.');

      // session_key + wish_id 로컬 저장 (예약 화면에서 사용)
      try {
        sessionStorage.setItem('voyage_wish_id',    data.wish.id);
        sessionStorage.setItem('voyage_session_key', data.session_key);
      } catch (_) {}

      nav('/voyage/booking', { state: { wish_id: data.wish.id, wish_text: text.trim() } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1B2A',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 340 }}>

        {/* 헤더 */}
        <p style={{ fontSize: 11, color: 'rgba(255,215,106,0.6)', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 12 }}>
          ✦ 북은하 항해
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5, textAlign: 'center', marginBottom: 8 }}>
          지금 떠오르는 것<br />하나
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 36 }}>
          완벽하지 않아도 괜찮아요
        </p>

        {/* 입력 */}
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder="예: 더 용감해지고 싶어요"
          maxLength={120}
          rows={4}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${text ? 'rgba(255,215,106,0.4)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 16,
            padding: '16px',
            color: 'white',
            fontSize: 15,
            lineHeight: 1.65,
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'right', marginTop: 4 }}>
          {text.length}/120
        </p>

        {error && (
          <p style={{ fontSize: 12, color: 'rgba(255,100,100,0.8)', textAlign: 'center', marginTop: 8 }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '16px 0',
            borderRadius: 9999,
            background: (text.trim() && !loading) ? '#FFD76A' : 'rgba(255,215,106,0.18)',
            color:       (text.trim() && !loading) ? '#0D1B2A'  : 'rgba(255,215,106,0.35)',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: (text.trim() && !loading) ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '저장 중...' : '이걸로 충분합니다 ✦'}
        </button>

      </div>
    </div>
  );
}
