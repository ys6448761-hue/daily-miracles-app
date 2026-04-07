/**
 * VoyageReflection.jsx — /voyage/:id/reflection
 * 회고: "조금 가벼워졌나요?" — lighter / clearer / braver
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE ?? '';

const CHOICES = [
  { id: 'lighter', emoji: '🕊️', label: '조금 가벼워졌어요',  sub: '무거운 것을 내려놓은 것 같아요' },
  { id: 'clearer', emoji: '🔭', label: '조금 더 또렷해졌어요', sub: '흐릿하던 것이 선명해진 것 같아요' },
  { id: 'braver',  emoji: '🌊', label: '조금 더 용감해졌어요', sub: '두려운 것에 한 발 다가간 것 같아요' },
];

export default function VoyageReflection() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit() {
    if (!selected || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/voyage/${id}/reflection`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ answer: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      nav(`/voyage/${id}`, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0D1B2A', color: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 340 }}>

        {/* 헤더 */}
        <p style={{ fontSize: 11, color: 'rgba(255,215,106,0.6)', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 12 }}>
          ✦ 항해 회고
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5, textAlign: 'center', marginBottom: 32 }}>
          조금 가벼워졌나요?
        </h1>

        {/* 선택지 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {CHOICES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                padding: '18px 16px',
                borderRadius: 16,
                border: `1px solid ${selected === c.id ? 'rgba(255,215,106,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: selected === c.id ? 'rgba(255,215,106,0.08)' : 'rgba(255,255,255,0.03)',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.18s',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>{c.emoji}</span>
              <div>
                <p style={{
                  fontSize: 15, fontWeight: 500, marginBottom: 3,
                  color: selected === c.id ? 'rgba(255,215,106,0.95)' : 'rgba(255,255,255,0.8)',
                }}>
                  {c.label}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                  {c.sub}
                </p>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'rgba(255,100,100,0.8)', textAlign: 'center', marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!selected || loading}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 9999,
            background: (selected && !loading) ? '#FFD76A' : 'rgba(255,215,106,0.18)',
            color:      (selected && !loading) ? '#0D1B2A'  : 'rgba(255,215,106,0.35)',
            fontSize: 16, fontWeight: 700, border: 'none',
            cursor: (selected && !loading) ? 'pointer' : 'default', transition: 'all 0.2s',
          }}
        >
          {loading ? '저장 중...' : '이 마음으로 별을 만들어요 ✦'}
        </button>

      </div>
    </div>
  );
}
