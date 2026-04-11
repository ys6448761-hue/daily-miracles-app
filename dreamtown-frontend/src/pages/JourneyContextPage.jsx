/**
 * JourneyContextPage.jsx — 날짜/인원/지역 입력
 * 경로: /journey/context?wish_id=...
 *
 * 이벤트: save_journey_context
 * 다음 화면: /journey/recommend?wish_id=...&context_id=...
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const DATE_OPTIONS = [
  { value: 'today',     label: '오늘',       icon: '☀️' },
  { value: 'this_week', label: '이번 주',     icon: '📅' },
  { value: 'weekend',   label: '이번 주말',   icon: '🌙' },
  { value: 'custom',    label: '날짜 미정',   icon: '✨' },
];

const PEOPLE_OPTIONS = [
  { value: 'solo',    label: '혼자',     icon: '🙋' },
  { value: 'couple',  label: '둘이서',   icon: '💑' },
  { value: 'family',  label: '가족과',   icon: '👨‍👩‍👧' },
  { value: 'friends', label: '친구들과', icon: '👫' },
  { value: 'group',   label: '단체로',   icon: '👥' },
];

const CITY_OPTIONS = [
  { value: 'yeosu', label: '여수', icon: '🌊' },
];

function OptionGrid({ options, value, onChange }) {
  return (
    <div style={styles.optionGrid}>
      {options.map(o => (
        <button
          key={o.value} type="button"
          onClick={() => onChange(o.value)}
          style={{
            ...styles.optionBtn,
            borderColor:  value === o.value ? '#60a5fa' : '#1e2d3d',
            background:   value === o.value ? '#1e3a5f' : '#0d1b2a',
            color:        value === o.value ? '#f0f4ff' : '#9ca3af',
          }}
        >
          <span style={{ fontSize: 20 }}>{o.icon}</span>
          <span style={{ fontSize: 12, marginTop: 4 }}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function JourneyContextPage() {
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const wishId    = params.get('wish_id');

  const [dateType,   setDateType]   = useState('this_week');
  const [peopleType, setPeopleType] = useState('couple');
  const [cityCode,   setCityCode]   = useState('yeosu');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  if (!wishId) {
    return (
      <div style={styles.page}>
        <div style={{ color: '#f87171', padding: 20 }}>wish_id 없음. 소원부터 입력해주세요.</div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/journey-contexts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ wish_id: wishId, city_code: cityCode, date_type: dateType, people_type: peopleType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '저장 실패');
      navigate(`/journey/recommend?wish_id=${wishId}&context_id=${data.context_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.back}>← 뒤로</button>

      <div style={styles.header}>
        <div style={styles.subtitle}>여정 설정</div>
        <h1 style={styles.title}>언제, 누구와<br />떠나실 건가요?</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.sectionLabel}>📅 언제</div>
        <OptionGrid options={DATE_OPTIONS} value={dateType} onChange={setDateType} />

        <div style={styles.sectionLabel}>👥 누구와</div>
        <OptionGrid options={PEOPLE_OPTIONS} value={peopleType} onChange={setPeopleType} />

        <div style={styles.sectionLabel}>📍 어디서</div>
        <OptionGrid options={CITY_OPTIONS} value={cityCode} onChange={setCityCode} />

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit" disabled={loading}
          style={{ ...styles.submitBtn, opacity: loading ? 0.5 : 1 }}
        >
          {loading ? '찾는 중...' : '여정 추천 받기'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#060e1a', color: '#f0f4ff',
    padding: '20px 20px 60px', fontFamily: 'sans-serif',
  },
  back: {
    background: 'none', border: 'none', color: '#60a5fa',
    fontSize: 14, cursor: 'pointer', padding: '4px 0', marginBottom: 24,
  },
  header: { marginBottom: 28 },
  subtitle: { fontSize: 12, color: '#60a5fa', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 800, lineHeight: 1.4, margin: 0 },
  form: { display: 'flex', flexDirection: 'column' },
  sectionLabel: { fontSize: 13, color: '#9ca3af', marginTop: 20, marginBottom: 10, fontWeight: 600 },
  optionGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  optionBtn: {
    flex: '1 0 calc(33% - 8px)', minWidth: 80,
    border: '1.5px solid', borderRadius: 10, padding: '12px 8px',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
    transition: 'all 0.15s', fontFamily: 'sans-serif',
  },
  error: {
    background: '#2d0707', border: '1px solid #dc2626', color: '#f87171',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, margin: '12px 0',
  },
  submitBtn: {
    marginTop: 28, background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: 14, padding: '16px',
    fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%',
  },
};
