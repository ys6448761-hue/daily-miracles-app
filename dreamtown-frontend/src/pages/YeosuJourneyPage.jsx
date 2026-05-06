/**
 * YeosuJourneyPage.jsx — 여수 소원여정 Soft Pay 랜딩
 * route: /journey
 * from: star-view.html → "여수 소원여정 보기"
 *
 * 원칙: 결제 없음 / 가격 표시 / 예약·문의만 접수
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BENEFITS = [
  { icon: '🌊', text: '케이블카에서 시작한 소원과 연결된 여정' },
  { icon: '🌙', text: '여수 야경 특별 관람 코스 포함' },
  { icon: '✨', text: '소원그림 인화본 증정' },
  { icon: '📖', text: '여정 기록 디지털 북 제공' },
];

export default function YeosuJourneyPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const starId = params.get('star_id') || null;

  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/journey-inquiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:    name.trim(),
          phone:   phone.trim(),
          star_id: starId,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '접수 실패');
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <DoneScreen onBack={() => nav(-1)} />;

  return (
    <div style={S.page}>
      {/* 뒤로 */}
      <button onClick={() => nav(-1)} style={S.back}>←</button>

      {/* 헤더 */}
      <div style={S.header}>
        <p style={S.eyebrow}>YEOSU DREAM JOURNEY</p>
        <h1 style={S.title}>
          이 이야기를<br />이어가볼까요?
        </h1>
        <p style={S.desc}>
          케이블카에서 담은 소원이<br />여수 전체로 이어지는 여정입니다.
        </p>
      </div>

      {/* 가격 카드 */}
      <div style={S.priceCard}>
        <div style={S.priceRow}>
          <span style={S.priceLabel}>소원여정 1인</span>
          <span style={S.price}>₩35,000</span>
        </div>
        <div style={S.divider} />
        <div style={S.benefitList}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={S.benefitItem}>
              <span style={S.benefitIcon}>{b.icon}</span>
              <span style={S.benefitText}>{b.text}</span>
            </div>
          ))}
        </div>
        <p style={S.priceNote}>* 결제는 여정 확정 후 안내드립니다</p>
      </div>

      {/* 예약 폼 */}
      <form onSubmit={handleSubmit} style={S.form}>
        <p style={S.formLabel}>연락처를 남겨주시면<br />여정 안내를 드릴게요</p>

        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={e => setName(e.target.value)}
          style={S.input}
          maxLength={30}
          required
        />
        <input
          type="tel"
          placeholder="연락처 (010-0000-0000)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={S.input}
          maxLength={20}
          required
        />

        {error && <p style={S.error}>{error}</p>}

        <button
          type="submit"
          disabled={!name.trim() || !phone.trim() || loading}
          style={{
            ...S.submitBtn,
            opacity: (!name.trim() || !phone.trim() || loading) ? 0.4 : 1,
          }}
        >
          {loading ? '접수 중...' : '이 여정 예약하기'}
        </button>
      </form>
    </div>
  );
}

function DoneScreen({ onBack }) {
  return (
    <div style={{ ...S.page, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={S.doneIcon}>✦</div>
      <h2 style={S.doneTitle}>
        여정 안내를 위해<br />연락드릴게요.
      </h2>
      <p style={S.doneDesc}>
        당신의 소원이 이어질 시간을<br />준비하겠습니다.
      </p>
      <button onClick={onBack} style={S.doneBack}>← 돌아가기</button>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100dvh',
    background: 'linear-gradient(180deg, #060e1a 0%, #0a1628 100%)',
    color: '#fff',
    padding: '20px 20px 80px',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: 'sans-serif',
  },
  back: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 0',
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  header: { marginBottom: 32 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: '0.12em',
    color: 'rgba(100,160,255,0.7)',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.35,
    marginBottom: 12,
    color: '#fff',
  },
  desc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.7,
  },
  priceCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(100,160,255,0.18)',
    borderRadius: 20,
    padding: '22px 20px',
    marginBottom: 28,
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  price: {
    fontSize: 26,
    fontWeight: 800,
    color: '#7bc6ff',
    letterSpacing: '-0.02em',
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  benefitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 14,
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitIcon: { fontSize: 16, flexShrink: 0, marginTop: 1 },
  benefitText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
  },
  priceNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 15,
    padding: '14px 16px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  },
  error: {
    fontSize: 13,
    color: '#f87171',
    background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: 8,
    padding: '10px 14px',
    margin: 0,
  },
  submitBtn: {
    marginTop: 4,
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '18px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'sans-serif',
    transition: 'opacity 0.2s',
  },
  doneIcon: {
    fontSize: 48,
    color: 'rgba(100,160,255,0.6)',
    marginBottom: 28,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.45,
    marginBottom: 16,
    color: '#fff',
  },
  doneDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.75,
    marginBottom: 40,
  },
  doneBack: {
    background: 'none',
    border: '1.5px solid rgba(255,255,255,0.18)',
    borderRadius: 12,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    padding: '12px 28px',
    cursor: 'pointer',
    fontFamily: 'sans-serif',
  },
};
