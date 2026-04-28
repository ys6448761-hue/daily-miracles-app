/**
 * LocationAdmin.jsx — 별공방 장소별 관리자 페이지
 * 경로: /admin/location/:loc?token=
 *
 * Tab 1: 대시보드  — KPI·감정TOP3·최근 별 요약
 * Tab 2: 오늘 현황 — 오늘 생성된 별 목록
 * Tab 3: 별 현황   — 전체 별 목록 (상태 필터)
 * Tab 4: QR / 운영 — QR 이미지·운영 설정
 *
 * 집계 SSOT: stars.origin_location
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

// ── 감정값 정규화 ─────────────────────────────────────────────────
const EMOTION_KO = {
  calm: '편안함', peaceful: '편안함', relaxed: '편안함',
  excited: '설렘', excitement: '설렘',
  hopeful: '기대', hope: '기대',
  clarity: '정리됨', clear: '정리됨',
  happy: '행복', happiness: '행복',
  grateful: '감사', gratitude: '감사',
  energetic: '활기', energy: '활기',
  sad: '슬픔', sadness: '슬픔',
  anxious: '불안', anxiety: '불안',
  joy: '기쁨', love: '사랑',
  proud: '뿌듯함', longing: '그리움', nostalgia: '그리움',
};
function normalizeEmotion(val) {
  if (!val || val.trim() === '') return null;
  if (/[^\x09\x0A\x0D\x20-\x7E가-힣ㄱ-ㆎᄀ-ᇿ]/.test(val)) return null;
  const t = val.trim();
  return EMOTION_KO[t.toLowerCase()] ?? t;
}

// ── 보석 라벨 ─────────────────────────────────────────────────────
const GEM_LABEL = {
  ruby: '루비', sapphire: '사파이어', emerald: '에메랄드',
  diamond: '다이아몬드', amethyst: '아메시스트', pearl: '진주',
  topaz: '토파즈', opal: '오팔', garnet: '가넷', aquamarine: '아쿠아마린',
};
function gemLabel(val) {
  if (!val) return '미선택';
  return GEM_LABEL[val.toLowerCase()] ?? val;
}

// ── 상태 라벨 ─────────────────────────────────────────────────────
const STATUS_LABEL = {
  'PRE-ON': '생성됨', 'ON': '저장 완료',
  'CREATED': '생성됨', 'SAVED': '저장 완료',
  'SHARED': '공유됨',  'FAILED': '실패',
};
function statusLabel(val) {
  return STATUS_LABEL[(val || '').toUpperCase()] ?? STATUS_LABEL[val] ?? val ?? '-';
}

// ── 시각 포맷 ─────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtRelative(iso) {
  if (!iso) return '-';
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return '방금';
  if (diff < 60) return `${diff}분 전`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `${h}시간 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ── 장소 아이콘 ───────────────────────────────────────────────────
const PLACE_EMOJI = {
  lattoa_cafe: '☕', lattoa: '☕',
  forestland: '🌿', paransi: '🌊',
  'yeosu-cablecar': '🚡', yeosu_cablecar: '🚡',
};

// ── 스타일 ────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#0A0E1A', color: '#E8E4F0', fontFamily: "'Noto Sans KR', sans-serif", padding: '0 0 60px' },
  header: { background: 'rgba(255,215,106,0.06)', borderBottom: '1px solid rgba(255,215,106,0.12)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: 800, color: '#E8E4F0' },
  badge: { fontSize: 10, fontWeight: 700, color: '#FFD76A', background: 'rgba(255,215,106,0.1)', border: '1px solid rgba(255,215,106,0.2)', padding: '3px 10px', borderRadius: 20 },
  tabs: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 16px', gap: 4 },
  tab: (a) => ({ padding: '12px 14px', fontSize: 12, fontWeight: a ? 700 : 500, color: a ? '#FFD76A' : 'rgba(255,255,255,0.4)', borderBottom: a ? '2px solid #FFD76A' : '2px solid transparent', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: -1 }),
  body: { padding: '16px 20px' },
  kpiGrid: (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginBottom: 14 }),
  kpiCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' },
  kpiVal: { fontSize: 24, fontWeight: 700, color: '#FFD76A', lineHeight: 1.1 },
  kpiLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  section: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px', marginBottom: 14 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  pill: (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'ON' || s === 'SAVED')  return { fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(74,222,128,0.25)' };
    if (s === 'SHARED')               return { fontSize: 10, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(96,165,250,0.25)' };
    if (s === 'FAILED')               return { fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.25)' };
    return { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' };
  },
  filterBtn: (a) => ({ padding: '5px 12px', borderRadius: 20, fontSize: 12, background: a ? 'rgba(255,215,106,0.15)' : 'rgba(255,255,255,0.05)', border: a ? '1px solid rgba(255,215,106,0.35)' : '1px solid rgba(255,255,255,0.1)', color: a ? '#FFD76A' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' },
  td: { padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' },
  errBox: { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#f87171' },
  spin: { textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  dlBtn: { display: 'inline-block', marginTop: 14, padding: '11px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #FFD76A, #e6b800)', color: '#1a1200', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", textDecoration: 'none' },
};

// ── 인증 레이어 ───────────────────────────────────────────────────
function useLocationToken(urlToken, loc) {
  const [token,  setToken]  = useState(() => urlToken || localStorage.getItem('loc_admin_token') || '');
  const [authed, setAuthed] = useState(false);
  const [input,  setInput]  = useState('');

  const tryAuth = useCallback(async (t) => {
    const checkLoc = loc || 'lattoa_cafe';
    const res = await fetch(`/api/admin/dt/location/${encodeURIComponent(checkLoc)}/ops?token=${encodeURIComponent(t)}`);
    if (res.ok || res.status === 503) {
      localStorage.setItem('loc_admin_token', t);
      setToken(t); setAuthed(true);
    } else {
      alert('토큰이 올바르지 않습니다.');
    }
  }, [loc]);

  useEffect(() => {
    if (token) tryAuth(token);
    else setAuthed(false);
  }, []); // eslint-disable-line

  return { token, authed, input, setInput, tryAuth };
}

// ── fetch helper ─────────────────────────────────────────────────
function useFetch(url, token, enabled = true) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    if (!enabled || !url) return;
    setLoading(true); setError('');
    try {
      const sep = url.includes('?') ? '&' : '?';
      const r = await fetch(`${url}${sep}token=${encodeURIComponent(token)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.status);
      setData(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url, token, enabled]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ── Tab 1: 대시보드 ──────────────────────────────────────────────
function DashboardTab({ loc, token }) {
  const { data, loading, error } = useFetch(`/api/admin/dt/location/${encodeURIComponent(loc)}`, token);

  if (loading) return <div style={S.spin}>불러오는 중…</div>;
  if (error)   return <div style={S.errBox}>오류: {error}</div>;
  if (!data)   return null;

  const normalizedEmotions = (data.emotion_top3 ?? [])
    .map(e => ({ ...e, emotion: normalizeEmotion(e.emotion) }))
    .filter(e => e.emotion !== null);
  const maxEmo = normalizedEmotions[0]?.count ?? 1;
  const emotionMissing = data.emotion_missing ?? 0;

  return (
    <div>
      <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.5)', marginBottom: 16, lineHeight: 1.6 }}>
        오늘 {data.place_label}에서 탄생한 별과 소원이들의 감정 흐름을 확인합니다.
      </p>

      {/* KPI 1행 */}
      <div style={S.kpiGrid(3)}>
        {[
          { label: '오늘 별 생성', value: data.today_count,    unit: '개' },
          { label: '누적 별',      value: data.total_count,    unit: '개' },
          { label: '총 공명',      value: data.resonance_total, unit: '회' },
        ].map(({ label, value, unit }) => (
          <div key={label} style={S.kpiCard}>
            <div style={S.kpiVal}>{value}</div>
            <div style={S.kpiLabel}>{unit} · {label}</div>
          </div>
        ))}
      </div>

      {/* KPI 2행 */}
      <div style={S.kpiGrid(3)}>
        {[
          { label: '공유 클릭',   value: data.share_count > 0 ? data.share_count : '-', unit: data.share_count > 0 ? '회' : '', dim: data.share_count === 0 },
          { label: '감정 미기록', value: emotionMissing, unit: '건', dim: false },
          { label: '최근 생성',   value: data.last_star_at ? fmtRelative(data.last_star_at) : '-', unit: '', dim: !data.last_star_at, small: true },
        ].map(({ label, value, unit, dim, small }) => (
          <div key={label} style={{ ...S.kpiCard, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: small ? 13 : 20, fontWeight: 700, color: dim ? 'rgba(255,255,255,0.2)' : '#FFD76A', lineHeight: 1.2 }}>
              {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>{unit}</span>}
            </div>
            <div style={S.kpiLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* 대표 문장 */}
      <div style={{ background: 'rgba(255,215,106,0.07)', border: '1px solid rgba(255,215,106,0.18)', borderRadius: 16, padding: '14px 18px', marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.9)', lineHeight: 1.7 }}>✦ {data.summary_sentence}</p>
      </div>

      {/* 감정 TOP3 */}
      <div style={S.section}>감정 TOP 3</div>
      <div style={S.card}>
        {normalizedEmotions.length > 0 ? normalizedEmotions.slice(0, 3).map(({ emotion, count }, i) => (
          <div key={emotion} style={{ marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{['🥇','🥈','🥉'][i]} {emotion}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,215,106,0.7)' }}>{count}개</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((count / maxEmo) * 100)}%` }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                style={{ height: '100%', background: 'rgba(255,215,106,0.6)', borderRadius: 99 }}
              />
            </div>
          </div>
        )) : <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>감정 데이터 없음</p>}
        {emotionMissing > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>감정 미기록</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{emotionMissing}건</span>
          </div>
        )}
      </div>

      {/* 최근 탄생 별 */}
      {data.recent_stars?.length > 0 && (
        <>
          <div style={S.section}>최근 탄생 별</div>
          <div style={S.card}>
            {data.recent_stars.map((star, i) => {
              const emo = normalizeEmotion(star.wish_emotion ?? star.emotion);
              return (
                <div key={i} style={{ paddingBottom: i < data.recent_stars.length - 1 ? 12 : 0, marginBottom: i < data.recent_stars.length - 1 ? 12 : 0, borderBottom: i < data.recent_stars.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 6, fontWeight: 600 }}>✦ {star.star_name}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
                    {[
                      { label: '감정', value: emo ?? '미기록', dim: !emo },
                      { label: '보석', value: gemLabel(star.gem_type) },
                      { label: '상태', value: statusLabel(star.status) },
                      { label: '생성', value: fmtTime(star.created_at) },
                    ].map(({ label, value, dim }) => (
                      <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{label}:</span>
                        <span style={{ fontSize: 11, color: dim ? 'rgba(255,255,255,0.25)' : 'rgba(255,215,106,0.6)' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {star.resonance_count > 0 && <p style={{ fontSize: 10, color: 'rgba(255,215,106,0.4)', marginTop: 4 }}>공명 {star.resonance_count}회</p>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab 2: 오늘 현황 ─────────────────────────────────────────────
function TodayTab({ loc, token }) {
  const { data, loading, error, reload } = useFetch(`/api/admin/dt/location/${encodeURIComponent(loc)}/today`, token);

  if (loading) return <div style={S.spin}>불러오는 중…</div>;
  if (error)   return <div style={S.errBox}>오류: {error} <button onClick={reload} style={{ marginLeft: 8, cursor: 'pointer', color: '#f87171', background: 'none', border: 'none' }}>재시도</button></div>;
  if (!data)   return null;

  const stars = data.stars ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>오늘 탄생한 별 <span style={{ color: '#FFD76A' }}>{stars.length}개</span></p>
        <button onClick={reload} style={{ ...S.filterBtn(false), fontSize: 11, padding: '3px 10px' }}>↻ 새로고침</button>
      </div>

      {stars.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
          오늘 아직 탄생한 별이 없습니다
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['별 이름', '감정', '보석', '상태', '생성 시각'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stars.map((s) => {
                const emo = normalizeEmotion(s.emotion);
                return (
                  <tr key={s.id}>
                    <td style={{ ...S.td, fontWeight: 700, color: '#E8E4F0' }}>{s.star_name}</td>
                    <td style={{ ...S.td, color: emo ? 'rgba(255,215,106,0.7)' : 'rgba(255,255,255,0.25)' }}>{emo ?? '미기록'}</td>
                    <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)' }}>{gemLabel(s.gem_type)}</td>
                    <td style={S.td}><span style={S.pill(s.status)}>{statusLabel(s.status)}</span></td>
                    <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{fmtTime(s.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: 별 현황 ────────────────────────────────────────────────
function StarsTab({ loc, token }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const baseUrl = `/api/admin/dt/location/${encodeURIComponent(loc)}/stars`;
  const url = statusFilter === 'all' ? baseUrl : `${baseUrl}?status=${statusFilter}`;

  const { data, loading, error, reload } = useFetch(url, token);

  const STATUS_OPTS = [
    { key: 'all',    label: '전체' },
    { key: 'ON',     label: '저장 완료' },
    { key: 'PRE-ON', label: '생성됨' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          기준: <code style={{ color: '#FFD76A' }}>origin_location = '{loc}'</code>
        </div>
        {data && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>총 {data.total}개</div>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUS_OPTS.map(o => (
          <button key={o.key} style={S.filterBtn(statusFilter === o.key)} onClick={() => setStatusFilter(o.key)}>
            {o.label}
          </button>
        ))}
        <button onClick={reload} style={{ ...S.filterBtn(false), marginLeft: 'auto' }}>↻</button>
      </div>

      {loading && <div style={S.spin}>불러오는 중…</div>}
      {error   && <div style={S.errBox}>오류: {error}</div>}
      {!loading && !error && data && (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['별 이름', '감정', '보석', '상태', '소원 (요약)', '생성일시'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.stars ?? []).map((s) => {
                const emo = normalizeEmotion(s.emotion);
                return (
                  <tr key={s.id}>
                    <td style={{ ...S.td, fontWeight: 700, color: '#E8E4F0' }}>{s.star_name}</td>
                    <td style={{ ...S.td, color: emo ? 'rgba(255,215,106,0.7)' : 'rgba(255,255,255,0.25)' }}>{emo ?? '미기록'}</td>
                    <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)' }}>{gemLabel(s.gem_type)}</td>
                    <td style={S.td}><span style={S.pill(s.status)}>{statusLabel(s.status)}</span></td>
                    <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)', maxWidth: 160 }}>
                      {s.wish_preview ? `"${s.wish_preview}${s.wish_preview.length >= 60 ? '…' : ''}"` : <span style={{ opacity: 0.3 }}>-</span>}
                    </td>
                    <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                      {new Date(s.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
              {(data.stars ?? []).length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 24 }}>해당 조건의 별이 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── QR 캔버스 생성 + PNG 다운로드 ────────────────────────────────
function QRSection({ url, loc }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    setReady(false);
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(() => setReady(true)).catch(console.error);
  }, [url]);

  const handleDownload = () => {
    if (!canvasRef.current || !ready) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${loc}_star_workshop_qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ borderRadius: 8, background: '#fff', padding: 4, display: 'block', margin: '0 auto' }} />
      {url && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all', lineHeight: 1.5 }}>
          {url}
        </div>
      )}
      {ready && (
        <button onClick={handleDownload} style={S.dlBtn}>
          PNG 다운로드
        </button>
      )}
    </div>
  );
}

// ── Tab 4: QR / 운영 ─────────────────────────────────────────────
function OpsTab({ loc, token }) {
  const { data, loading, error } = useFetch(`/api/admin/dt/location/${encodeURIComponent(loc)}/ops`, token);

  if (loading) return <div style={S.spin}>불러오는 중…</div>;
  if (error)   return <div style={S.errBox}>오류: {error}</div>;
  if (!data)   return null;

  const { qr_url, ssot_field, stats, origin_location } = data;

  return (
    <div>
      {/* QR 생성 (동적 캔버스) */}
      <div style={S.section}>현재 활성 QR</div>
      <div style={{ ...S.card, textAlign: 'center' }}>
        <QRSection url={qr_url} loc={loc} />
      </div>

      {/* 운영 상태 */}
      <div style={S.section}>운영 상태</div>
      <div style={S.card}>
        {[
          { key: '집계 기준 필드 (SSOT)', val: ssot_field },
          { key: '집계 값', val: `origin_location = '${origin_location}'` },
          { key: 'QR 연결 URL', val: qr_url },
        ].map(r => (
          <div key={r.key} style={S.row}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{r.key}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#E8E4F0', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{r.val}</div>
          </div>
        ))}
      </div>

      {/* 전체 별 통계 */}
      <div style={S.section}>전체 별 통계</div>
      <div style={S.kpiGrid(3)}>
        {[
          { label: '전체 별',  value: stats.total_stars },
          { label: '저장 완료', value: stats.activated },
          { label: '생성됨',   value: stats.pending },
        ].map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiVal}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* 확장 가이드 */}
      <div style={S.section}>신규 별공방 확장 방법</div>
      <div style={{ ...S.card, fontSize: 12, lineHeight: 1.9, color: 'rgba(255,255,255,0.5)' }}>
        <div style={{ marginBottom: 8, color: '#FFD76A', fontWeight: 700 }}>새 별공방 장소 추가 시 (예: hamel, odongjae)</div>
        <div>① QR URL: <code style={{ color: '#E8E4F0' }}>/star-entry.html?loc=hamel</code></div>
        <div>② <code style={{ color: '#E8E4F0' }}>adminLocationRoutes.js</code> LOCATION_META에 <code style={{ color: '#E8E4F0' }}>hamel: &#123;…&#125;</code> 키 추가</div>
        <div>③ 집계: <code style={{ color: '#E8E4F0' }}>stars WHERE origin_location = 'hamel'</code> — 별도 라우트 불필요</div>
        <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.3)' }}>→ stars.origin_location 기반 단일 테이블, 파라미터화만으로 확장 가능</div>
      </div>
    </div>
  );
}

// ── 로그인 화면 ───────────────────────────────────────────────────
function LoginScreen({ emoji, placeName, input, setInput, tryAuth }) {
  return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>{emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{placeName} 별공방 운영</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>관리자 토큰을 입력하세요</div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tryAuth(input)}
          type="password"
          placeholder="Admin Token"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E8E4F0', fontSize: 14, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 10, boxSizing: 'border-box' }}
        />
        <button
          onClick={() => tryAuth(input)}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #FFD76A, #e6b800)', color: '#1a1200', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          접속
        </button>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'today',     label: '오늘 현황' },
  { key: 'stars',     label: '별 현황' },
  { key: 'ops',       label: 'QR / 운영' },
];

export default function LocationAdmin() {
  const { loc }        = useParams();
  const [searchParams] = useSearchParams();
  const urlToken       = searchParams.get('token') ?? '';

  const { token, authed, input, setInput, tryAuth } = useLocationToken(urlToken, loc);
  const [activeTab, setActiveTab] = useState('dashboard');

  const emoji     = PLACE_EMOJI[loc] ?? '✦';
  const placeName = loc === 'lattoa_cafe' || loc === 'lattoa' ? '라또아 카페'
                  : loc === 'yeosu_cablecar' || loc === 'yeosu-cablecar' ? '여수 해상 케이블카'
                  : loc === 'forestland'  ? '포레스트랜드'
                  : loc === 'paransi'     ? '파란시'
                  : loc;

  if (!authed) {
    return <LoginScreen emoji={emoji} placeName={placeName} input={input} setInput={setInput} tryAuth={tryAuth} />;
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.title}>{emoji} {placeName} 별공방 운영</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            stars.origin_location = '{loc}'
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={S.badge}>별공방 Admin</span>
          <a href="/admin" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>대시보드</a>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {activeTab === 'dashboard' && <DashboardTab loc={loc} token={token} />}
        {activeTab === 'today'     && <TodayTab     loc={loc} token={token} />}
        {activeTab === 'stars'     && <StarsTab     loc={loc} token={token} />}
        {activeTab === 'ops'       && <OpsTab       loc={loc} token={token} />}
      </div>
    </div>
  );
}
