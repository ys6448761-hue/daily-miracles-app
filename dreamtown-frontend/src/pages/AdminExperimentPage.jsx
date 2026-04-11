/**
 * AdminExperimentPage.jsx — 루미 A/B 실험 Day4~7 승자 판정 대시보드
 *
 * 경로: /admin/experiment
 * 인증: localStorage 'dt_admin_key' 또는 입력
 */

import { useState, useEffect, useCallback } from 'react';

const ADMIN_KEY_STORAGE = 'dt_admin_key';

// ── 색상 맵 ────────────────────────────────────────────────────────
const CASE_STYLE = {
  green:  { bg: '#052e16', border: '#16a34a', badge: '#22c55e', text: '완벽한 승리 — B 채택' },
  yellow: { bg: '#422006', border: '#d97706', badge: '#f59e0b', text: '클릭만 잘됨 — 결제 UX 수정' },
  red:    { bg: '#2d0707', border: '#dc2626', badge: '#ef4444', text: '과한 UX — A 유지' },
  purple: { bg: '#1e1b4b', border: '#7c3aed', badge: '#a78bfa', text: '애매한 경우 — 표본 확장' },
};

const STAGE_LABEL = { day1: 'Day 1 감동 직후', day3: 'Day 3 몰입 중간', limit: 'Limit 도달' };

function pct(v) { return v !== null && v !== undefined ? `${Number(v).toFixed(1)}%` : '—'; }
function delta(v) {
  if (v === null || v === undefined) return <span style={{ color: '#6b7280' }}>—</span>;
  const n = Number(v);
  const color = n > 0 ? '#22c55e' : n < 0 ? '#ef4444' : '#9ca3af';
  return <span style={{ color, fontWeight: 700 }}>{n >= 0 ? '+' : ''}{n.toFixed(1)}%p</span>;
}

// ── 판정 카드 ──────────────────────────────────────────────────────
function VerdictCard({ verdict }) {
  if (!verdict) return null;
  const style = CASE_STYLE[verdict.color] ?? CASE_STYLE.purple;

  return (
    <div style={{ background: style.bg, border: `2px solid ${style.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ background: style.badge, color: '#000', fontWeight: 800, fontSize: 11, padding: '3px 10px', borderRadius: 99 }}>
          CASE {verdict.case}
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{verdict.label}</span>
        {verdict.winner && (
          <span style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 900, color: style.badge }}>
            승자: {verdict.winner}
          </span>
        )}
      </div>
      <p style={{ color: '#d1d5db', fontSize: 14, marginBottom: 14 }}>{verdict.action}</p>

      {/* CTR / CVR 비교 */}
      {verdict.a && verdict.b && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'CTR (클릭률)', a: verdict.a.ctr_pct, b: verdict.b.ctr_pct, delta: verdict.ctr_delta },
            { label: 'CVR (결제율) ★', a: verdict.a.cvr_pct, b: verdict.b.cvr_pct, delta: verdict.cvr_delta },
            { label: '표본 수', a: verdict.a.sample, b: verdict.b.sample, delta: null },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>{m.label}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, color: '#e5e7eb' }}>A: {m.label === '표본 수' ? m.a : pct(m.a)}</span>
                <span style={{ fontSize: 13, color: style.badge }}>B: {m.label === '표본 수' ? m.b : pct(m.b)}</span>
              </div>
              {m.delta !== null && (
                <div style={{ marginTop: 4, textAlign: 'right', fontSize: 13 }}>{delta(m.delta)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#6b7280', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
        결정 기준: {verdict.decided_by ?? 'CVR'} — "클릭은 관심이고, 결제는 확신이다"
        {verdict.sample !== null && ` | 누적 표본 ${verdict.sample}명`}
      </p>
    </div>
  );
}

// ── 스테이지별 인사이트 ────────────────────────────────────────────
function StageInsights({ insights }) {
  if (!insights?.length) return (
    <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 0' }}>스테이지 데이터 없음 (노출 발생 후 표시)</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {insights.map(ins => (
        <div key={ins.stage} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>
              {STAGE_LABEL[ins.stage] ?? ins.stage}
            </span>
            <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
              <span>CTR {delta(ins.ctr_delta)}</span>
              <span>CVR {delta(ins.cvr_delta)}</span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#a78bfa', fontStyle: 'italic' }}>→ {ins.insight}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
            <span>A: CTR {pct(ins.a?.ctr_pct)} / CVR {pct(ins.a?.cvr_pct)} (노출 {ins.a?.exposed ?? 0}명)</span>
            <span>B: CTR {pct(ins.b?.ctr_pct)} / CVR {pct(ins.b?.cvr_pct)} (노출 {ins.b?.exposed ?? 0}명)</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Funnel 테이블 ──────────────────────────────────────────────────
function FunnelTable({ rows }) {
  if (!rows?.length) return <p style={{ color: '#6b7280', fontSize: 13 }}>데이터 없음</p>;

  // group별로 묶기
  const byGroup = {};
  for (const r of rows) {
    if (!byGroup[r.group_name]) byGroup[r.group_name] = {};
    byGroup[r.group_name][r.event_name] = parseInt(r.count ?? 0);
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <th style={{ textAlign: 'left', color: '#9ca3af', padding: '4px 8px' }}>그룹</th>
          {['upgrade_prompt_shown','upgrade_clicked','purchase_completed'].map(e => (
            <th key={e} style={{ textAlign: 'right', color: '#9ca3af', padding: '4px 8px', fontSize: 11 }}>
              {e.replace('upgrade_', '').replace('_', ' ')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(byGroup).map(([g, events]) => (
          <tr key={g} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <td style={{ padding: '6px 8px', fontWeight: 700, color: g === 'B' ? '#a78bfa' : '#e5e7eb' }}>{g}</td>
            {['upgrade_prompt_shown','upgrade_clicked','purchase_completed'].map(e => (
              <td key={e} style={{ textAlign: 'right', padding: '6px 8px', color: '#d1d5db' }}>
                {events[e] ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────
export default function AdminExperimentPage() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) ?? '');
  const [authed,   setAuthed]   = useState(false);
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchStats = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dt/ai-unlock/admin/stats', {
        headers: { 'x-admin-key': key },
      });
      if (res.status === 401) {
        setAuthed(false);
        setError('인증 실패 — Admin Key를 확인해주세요');
        return;
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
      setLastFetch(new Date().toLocaleTimeString('ko-KR'));
      localStorage.setItem(ADMIN_KEY_STORAGE, key);
    } catch (e) {
      setError('데이터 로드 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_KEY_STORAGE);
    if (saved) fetchStats(saved);
  }, [fetchStats]);

  // ── 인증 전 화면 ───────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#111827', borderRadius: 16, padding: 32, width: 320, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>실험 대시보드</h2>
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>루미 A/B 실험 · Day4~7 승자 판정</p>
          {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}
          <input
            type="password"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStats(adminKey)}
            placeholder="Admin Key"
            style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button
            onClick={() => fetchStats(adminKey)}
            disabled={loading}
            style={{ width: '100%', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? '로딩...' : '입장'}
          </button>
        </div>
      </div>
    );
  }

  const exp = data?.experiment;
  const verdict = exp?.verdict;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '24px 16px', maxWidth: 700, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>루미 실험 판정표</h1>
          <p style={{ color: '#9ca3af', fontSize: 12, margin: '4px 0 0' }}>
            {exp?.experiment_key ?? 'ai_upsell_v1'} · 최근 30일 · 마지막 갱신 {lastFetch}
          </p>
        </div>
        <button
          onClick={() => fetchStats(adminKey)}
          disabled={loading}
          style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            color: '#9ca3af', padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}
        >
          {loading ? '...' : '새로고침'}
        </button>
      </div>

      {/* ── 1. 승자 판정 ────────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          승자 판정 (CVR 기준)
        </h2>
        <VerdictCard verdict={verdict} />
      </section>

      {/* ── 2. 스테이지별 인사이트 ──────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Stage별 분석 (진짜 인사이트)
        </h2>
        <StageInsights insights={verdict?.stage_insights} />
      </section>

      {/* ── 3. 그룹별 Funnel ────────────────────────────────────── */}
      <section style={{ marginBottom: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 20px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          그룹별 Funnel
        </h2>
        <FunnelTable rows={exp?.funnel_by_group} />
      </section>

      {/* ── 4. 구매 매출 ────────────────────────────────────────── */}
      <section style={{ marginBottom: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 20px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          구매 매출 (30일)
        </h2>
        {data?.purchases?.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['상품', '건수', '매출(원)', '총 지급 콜'].map(h => (
                  <th key={h} style={{ textAlign: h === '상품' ? 'left' : 'right', color: '#9ca3af', padding: '4px 8px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.purchases.map(p => (
                <tr key={p.product_type} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '6px 8px', color: '#e5e7eb' }}>{p.product_type}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', color: '#d1d5db' }}>{p.count}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', color: '#22c55e', fontWeight: 700 }}>
                    ₩{parseInt(p.revenue_krw ?? 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', color: '#9ca3af' }}>{p.total_calls_granted}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} style={{ padding: '8px 8px 4px', color: '#9ca3af', fontSize: 12 }}>합계</td>
                <td style={{ textAlign: 'right', padding: '8px 8px 4px', color: '#22c55e', fontWeight: 800, fontSize: 15 }}>
                  ₩{data.purchases.reduce((s, p) => s + parseInt(p.revenue_krw ?? 0), 0).toLocaleString()}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        ) : <p style={{ color: '#6b7280', fontSize: 13 }}>구매 없음</p>}
      </section>

      {/* ── 5. 절대 금지 원칙 ────────────────────────────────────── */}
      <section style={{ background: '#1c0000', border: '1px solid #7f1d1d', borderRadius: 12, padding: '14px 18px' }}>
        <p style={{ fontSize: 12, color: '#fca5a5', fontWeight: 700, marginBottom: 6 }}>절대 금지</p>
        <p style={{ fontSize: 12, color: '#fca5a5' }}>❌ "느낌상 B가 좋아 보여서" &nbsp;|&nbsp; ❌ "클릭 많으니까 B"</p>
        <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>→ 반드시 CVR 숫자로만 판단. 최소 30명 이상.</p>
      </section>
    </div>
  );
}
