/**
 * AdminAiDashboard.jsx — AI 비용 대시보드
 * 경로: /admin/ai-cost
 *
 * 섹션: KPI 카드 / 소스 분포 / 기능별 비용 / 상위 유저 / 일별 트렌드
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/admin/ai-cost';
const ADMIN_KEY_STORAGE = 'dt_admin_key';

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function krw(v) {
  if (!v && v !== 0) return '—';
  return Number(v).toLocaleString('ko-KR') + '원';
}
function num(v, d = 0) {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(d);
}

// ── KPI 카드 ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = '#60a5fa' }) {
  return (
    <div style={{
      background: '#0d1b2a', border: `1px solid ${color}40`,
      borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── 소스 분포 도넛 (텍스트) ───────────────────────────────────────────────────
const SRC_COLOR = { ai: '#f87171', cache: '#22c55e', template: '#60a5fa', fallback: '#f59e0b' };
const SRC_LABEL = { ai: 'AI 직접', cache: '캐시', template: '템플릿', fallback: '폴백' };

function SourceBreakdown({ src }) {
  const total = Object.values(src).reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {Object.entries(src).map(([k, v]) => {
        const pct = Math.round((v / total) * 100);
        return (
          <div key={k} style={{
            background: '#0d1b2a', border: `1px solid ${SRC_COLOR[k]}40`,
            borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 100, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: SRC_COLOR[k], marginBottom: 4 }}>{SRC_LABEL[k]}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff' }}>{pct}%</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{v.toLocaleString()}건</div>
          </div>
        );
      })}
    </div>
  );
}

// ── 기능별 테이블 ─────────────────────────────────────────────────────────────
function FeatureTable({ rows }) {
  const maxCost = Math.max(...rows.map(r => r.cost), 1);
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ color: '#6b7280', fontSize: 11, textAlign: 'left' }}>
          <th style={{ padding: '6px 8px' }}>기능</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>호출</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>캐시</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>비용</th>
          <th style={{ padding: '6px 8px', width: 80 }}>비율</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const barPct = Math.round((r.cost / maxCost) * 100);
          const cacheRate = r.calls > 0 ? Math.round((r.cache_hits / r.calls) * 100) : 0;
          return (
            <tr key={i} style={{ borderTop: '1px solid #1e2d3d' }}>
              <td style={{ padding: '8px 8px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 11 }}>{r.feature}</td>
              <td style={{ padding: '8px 8px', textAlign: 'right', color: '#9ca3af' }}>{r.calls.toLocaleString()}</td>
              <td style={{ padding: '8px 8px', textAlign: 'right', color: '#22c55e' }}>{cacheRate}%</td>
              <td style={{ padding: '8px 8px', textAlign: 'right', color: '#f87171' }}>{krw(r.cost)}</td>
              <td style={{ padding: '8px 8px' }}>
                <div style={{ height: 6, background: '#1e2d3d', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barPct}%`, background: '#f87171', borderRadius: 3 }} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── 상위 유저 테이블 ──────────────────────────────────────────────────────────
function TopUserTable({ rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ color: '#6b7280', fontSize: 11, textAlign: 'left' }}>
          <th style={{ padding: '6px 8px' }}>#</th>
          <th style={{ padding: '6px 8px' }}>유저 ID</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>호출</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>비용</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: '1px solid #1e2d3d' }}>
            <td style={{ padding: '8px 8px', color: '#6b7280' }}>{i + 1}</td>
            <td style={{ padding: '8px 8px', color: '#93c5fd', fontFamily: 'monospace', fontSize: 11 }}>{r.user_id}</td>
            <td style={{ padding: '8px 8px', textAlign: 'right', color: '#9ca3af' }}>{r.calls.toLocaleString()}</td>
            <td style={{ padding: '8px 8px', textAlign: 'right', color: '#f87171' }}>{krw(r.cost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── 일별 트렌드 바 차트 ────────────────────────────────────────────────────────
function TrendChart({ rows }) {
  if (!rows || rows.length === 0) return <div style={{ color: '#6b7280', fontSize: 13, padding: 16 }}>데이터 없음</div>;
  const maxCost = Math.max(...rows.map(r => parseFloat(r.cost)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, paddingTop: 8 }}>
      {rows.map((r, i) => {
        const h = Math.max(4, Math.round((parseFloat(r.cost) / maxCost) * 88));
        const d = String(r.day).slice(5); // MM-DD
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div title={`${d}\n비용: ${krw(r.cost)}\n호출: ${r.total_calls}건\n캐시: ${r.cache_hits}건`}
              style={{ width: '100%', height: h, background: '#f87171', borderRadius: '3px 3px 0 0', cursor: 'pointer' }} />
            <div style={{ fontSize: 9, color: '#6b7280', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 28 }}>{d}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── 섹션 래퍼 ────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background: '#0a1628', border: '1px solid #1e2d3d', borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 700, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function AdminAiDashboard() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || '');
  const [keyInput, setKeyInput] = useState('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (key, d) => {
    setLoading(true);
    setError(null);
    try {
      const headers = key ? { 'x-admin-token': key } : {};
      const [mainRes, trendRes] = await Promise.all([
        fetch(`${API_BASE}?days=${d}`, { headers }),
        fetch(`${API_BASE}/trend?days=${d}`, { headers }),
      ]);
      if (!mainRes.ok) throw new Error(`${mainRes.status} ${mainRes.statusText}`);
      const [main, trendData] = await Promise.all([mainRes.json(), trendRes.json()]);
      setData(main);
      setTrend(trendData.trend || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(adminKey, days);
  }, [fetchData, adminKey, days]);

  function handleKeySubmit(e) {
    e.preventDefault();
    localStorage.setItem(ADMIN_KEY_STORAGE, keyInput);
    setAdminKey(keyInput);
  }

  const PAGE = { minHeight: '100vh', background: '#060e1a', color: '#f0f4ff', padding: '16px 16px 40px', fontFamily: 'sans-serif' };
  const H1   = { fontSize: 18, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 };
  const SUB  = { fontSize: 12, color: '#6b7280', marginBottom: 20 };

  return (
    <div style={PAGE}>
      <div style={H1}>AI 비용 대시보드</div>
      <div style={SUB}>어디서 돈이 새는지 한눈에 — /admin/ai-cost</div>

      {/* 토큰 입력 */}
      {!adminKey && (
        <form onSubmit={handleKeySubmit} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="password" placeholder="Admin Token"
            value={keyInput} onChange={e => setKeyInput(e.target.value)}
            style={{ flex: 1, background: '#0d1b2a', border: '1px solid #1e2d3d', color: '#f0f4ff', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
          />
          <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>확인</button>
        </form>
      )}

      {/* 기간 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[7, 14, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            style={{ background: days === d ? '#2563eb' : '#0d1b2a', color: days === d ? '#fff' : '#9ca3af',
              border: '1px solid #1e2d3d', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
            {d}일
          </button>
        ))}
        <button onClick={() => fetchData(adminKey, days)}
          style={{ marginLeft: 'auto', background: '#0d1b2a', color: '#60a5fa', border: '1px solid #2563eb40', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
          새로고침
        </button>
      </div>

      {loading && <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: 40 }}>로딩 중...</div>}
      {error && <div style={{ color: '#f87171', fontSize: 13, background: '#2d0707', border: '1px solid #dc2626', borderRadius: 10, padding: 16, marginBottom: 16 }}>오류: {error}</div>}

      {data && (
        <>
          {/* KPI 카드 */}
          <Section title={`KPI 요약 — 최근 ${days}일`}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <KpiCard label="오늘 비용" value={krw(data.today_cost)} color="#f87171" />
              <KpiCard label="이번 달 비용" value={krw(data.monthly_cost)} color="#f59e0b" />
              <KpiCard label={`${days}일 비용`} value={krw(data.period_cost)} color="#a78bfa" />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <KpiCard label="총 호출 수" value={data.total_calls.toLocaleString() + '건'} color="#60a5fa" />
              <KpiCard label="유니크 유저" value={data.unique_users.toLocaleString() + '명'} color="#34d399" />
              <KpiCard label="유저당 평균" value={num(data.avg_calls_per_user, 1) + '회'} color="#f0f4ff" />
            </div>
          </Section>

          {/* 소스 분포 */}
          <Section title="호출 소스 분포">
            <SourceBreakdown src={data.source_breakdown} />
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10 }}>
              AI 직접: 실제 OpenAI 호출 · 캐시: 7일 캐시 적중 · 템플릿: model='template' · 폴백: budget/limit 초과 시 기본 응답
            </div>
          </Section>

          {/* 기능별 비용 */}
          {data.feature_usage.length > 0 && (
            <Section title="기능별 호출 + 비용 (Top 20)">
              <FeatureTable rows={data.feature_usage} />
            </Section>
          )}

          {/* 상위 유저 */}
          {data.top_users.length > 0 && (
            <Section title="Top 10 유저 (호출 수 기준)">
              <TopUserTable rows={data.top_users} />
            </Section>
          )}

          {/* 일별 트렌드 */}
          {trend && (
            <Section title={`일별 비용 트렌드 — 최근 ${days}일`}>
              <TrendChart rows={trend} />
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>바 위에 마우스를 올리면 상세 수치 확인</div>
            </Section>
          )}

          <div style={{ fontSize: 10, color: '#374151', textAlign: 'right', marginTop: 8 }}>
            생성: {new Date(data.generated).toLocaleString('ko-KR')}
          </div>
        </>
      )}
    </div>
  );
}
