/**
 * PartnerAgreement.jsx — 파트너 첫 로그인 약관 동의
 * 경로: /partner/agreement
 * Aurora5 톤 | 모바일 375px 최적화
 * v1.1: 체크박스 4개, 제4조 수익배분 변동, 제10조 ⑥ 운영철학 해지권 추가
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const S = {
  page:     { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', display: 'flex', flexDirection: 'column' },
  header:   { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '18px 20px', textAlign: 'center' },
  headerTitle: { fontSize: 17, fontWeight: 800, color: '#9B87F5' },
  headerSub:   { fontSize: 12, color: '#7A6E9C', marginTop: 4 },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '20px 20px 0' },
  termsBox: { background: 'rgba(155,135,245,0.05)', border: '1px solid rgba(155,135,245,0.13)', borderRadius: 14, padding: '18px 16px', marginBottom: 20, fontSize: 13, color: '#C4BAE0', lineHeight: 1.8 },
  termsTitle: { fontSize: 14, fontWeight: 800, color: '#E8E4F0', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(155,135,245,0.12)' },
  article:  { marginBottom: 16 },
  artTitle: { fontSize: 13, fontWeight: 700, color: '#9B87F5', marginBottom: 6 },
  artBody:  { fontSize: 12, color: '#C4BAE0', lineHeight: 1.9 },
  highlight:{ color: '#FFD700', fontWeight: 700 },
  newBadge: { display: 'inline-block', background: 'rgba(155,135,245,0.2)', border: '1px solid rgba(155,135,245,0.4)', borderRadius: 6, padding: '1px 7px', fontSize: 10, color: '#9B87F5', fontWeight: 700, marginLeft: 6, verticalAlign: 'middle' },
  divider:  { height: 1, background: 'rgba(155,135,245,0.1)', margin: '16px 0' },
  checkSection: { background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.15)', borderRadius: 14, padding: '16px', marginBottom: 20 },
  checkTitle: { fontSize: 12, fontWeight: 700, color: '#9B87F5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(155,135,245,0.08)', cursor: 'pointer' },
  checkRowLast: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', cursor: 'pointer' },
  checkbox: (checked) => ({
    width: 22, height: 22, borderRadius: 6, border: checked ? 'none' : '2px solid rgba(155,135,245,0.4)',
    background: checked ? '#9B87F5' : 'transparent', flexShrink: 0, marginTop: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
  }),
  checkLabel: { fontSize: 14, color: '#E8E4F0', fontWeight: 600, lineHeight: 1.45 },
  checkSub:   { fontSize: 11, color: '#7A6E9C', marginTop: 2 },
  stickyBar: { padding: '16px 20px 32px', background: 'rgba(13,27,42,0.97)', borderTop: '1px solid rgba(155,135,245,0.12)', backdropFilter: 'blur(10px)' },
  agreeBtn: (enabled) => ({
    width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
    background: enabled ? '#9B87F5' : 'rgba(155,135,245,0.2)',
    color: enabled ? '#0D1B2A' : '#7A6E9C',
    fontSize: 16, fontWeight: 800, cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
  }),
  error: { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 10 },
};

// v1.1 — 체크박스 4개
const CHECKS = [
  { id: 'terms',            label: 'DreamTown 별들의 고향 이용약관에 동의합니다.', sub: '필수', required: true },
  { id: 'revenue',          label: '수익 배분 비율을 확인하고 동의합니다.',        sub: '필수', required: true },
  { id: 'revenue_variable', label: '수익 배분 비율이 시장 상황에 따라 변동될 수 있음을 확인하고 동의합니다.', sub: '필수 — 제4조', required: true, isNew: true },
  { id: 'privacy',          label: '소원이 개인정보 보호 의무에 동의합니다.',       sub: '필수', required: true },
];

const INITIAL_CHECKED = { terms: false, revenue: false, revenue_variable: false, privacy: false };

export default function PartnerAgreement() {
  const nav = useNavigate();
  const jwt = localStorage.getItem('partner_jwt');

  const [checked,  setChecked]  = useState(INITIAL_CHECKED);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const allChecked = CHECKS.every(c => checked[c.id]);

  function toggle(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAll() {
    const next = !allChecked;
    setChecked({ terms: next, revenue: next, revenue_variable: next, privacy: next });
  }

  async function handleAgree() {
    if (!allChecked) return;
    if (!jwt) { nav('/partner/login'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/partner/terms-agree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          terms_version:            'v1.1',
          agreed_clause_4_variable: checked.revenue_variable,
          agreed_clause_10_6:       true,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || '처리에 실패했어요.'); return; }
      nav('/partner/dashboard', { replace: true });
    } catch {
      setError('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.headerTitle}>📋 파트너 이용약관</div>
        <div style={S.headerSub}>DreamTown × 별들의 고향 파트너 계약서 v1.1</div>
      </div>

      {/* 스크롤 영역 */}
      <div style={S.scrollArea}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={S.termsBox}>
            <div style={S.termsTitle}>DreamTown 파트너 이용약관 v1.1</div>

            <div style={S.article}>
              <div style={S.artTitle}>제1조 (목적)</div>
              <div style={S.artBody}>
                본 약관은 DreamTown(이하 '플랫폼')과 파트너 업체 간의 별들의 고향 서비스 운영 및
                특산품 판매에 관한 권리·의무를 규정합니다.
              </div>
            </div>

            <div style={S.divider} />

            <div style={S.article}>
              <div style={S.artTitle}>제2조 (수익 배분)</div>
              <div style={S.artBody}>
                <span style={S.highlight}>로컬 상품</span> (특산품·굿즈·식품)<br />
                　파트너 <span style={S.highlight}>85%</span> · DreamTown 15%<br /><br />
                <span style={S.highlight}>여행 상품</span> (체험·투어)<br />
                　파트너 <span style={S.highlight}>15~20%</span> · DreamTown 80~85%<br /><br />
                <span style={S.highlight}>이벤트 상품</span> (기획 협업)<br />
                　파트너 <span style={S.highlight}>80%</span> · DreamTown 20%
              </div>
            </div>

            <div style={S.divider} />

            <div style={S.article}>
              <div style={S.artTitle}>제3조 (정산)</div>
              <div style={S.artBody}>
                매월 말일 기준으로 집계하며,<br />
                익월 <span style={S.highlight}>5일 이내</span> 등록 계좌로 입금합니다.<br />
                최소 정산 금액: 10,000원 (미달 시 다음 달 이월)
              </div>
            </div>

            <div style={S.divider} />

            {/* ── v1.1 신규 조항 ── */}
            <div style={{ ...S.article, background: 'rgba(155,135,245,0.04)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={S.artTitle}>
                제4조 (수익 배분 변동)
                <span style={S.newBadge}>NEW</span>
              </div>
              <div style={S.artBody}>
                제2조의 수익 배분 비율은 <span style={S.highlight}>시장 상황, 플랫폼 운영 여건, 정책 변경</span>에 따라
                사전 고지(30일) 후 변경될 수 있습니다.<br />
                파트너는 변경 고지 수령 후 30일 이내에 계약 해지를 요청할 수 있습니다.
              </div>
            </div>

            <div style={S.divider} />

            <div style={S.article}>
              <div style={S.artTitle}>제5조 (개인정보 보호)</div>
              <div style={S.artBody}>
                소원이의 <span style={S.highlight}>개인정보 및 소원 내용</span>은<br />
                절대 외부에 공개하거나 마케팅에 활용할 수 없습니다.<br />
                위반 시 즉시 계약 해지 및 법적 조치가 취해질 수 있습니다.
              </div>
            </div>

            <div style={S.divider} />

            <div style={S.article}>
              <div style={S.artTitle}>제6조 (QR 코드 사용)</div>
              <div style={S.artBody}>
                발급된 QR은 <span style={S.highlight}>해당 업체에서만 사용</span> 가능합니다.<br />
                타 업체 양도·복제·온라인 배포는 금지됩니다.
              </div>
            </div>

            <div style={S.divider} />

            <div style={{ ...S.article, background: 'rgba(155,135,245,0.04)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={S.artTitle}>
                제10조 ⑥ (운영 철학 부적합 해지)
                <span style={S.newBadge}>NEW</span>
              </div>
              <div style={S.artBody}>
                DreamTown은 파트너 업체가 플랫폼 운영 철학(소원·감동·진정성)에 현저히 부합하지 않는다고
                판단되는 경우, <span style={S.highlight}>사전 경고 1회</span> 후 계약을 해지할 수 있습니다.<br />
                이 경우 이미 발생한 정산금은 정상 지급됩니다.
              </div>
            </div>
          </div>

          {/* 체크박스 섹션 */}
          <div style={S.checkSection}>
            <div style={S.checkTitle}>필수 동의 항목</div>

            {/* 전체 동의 */}
            <div style={{ ...S.checkRow, marginBottom: 4 }} onClick={toggleAll}>
              <div style={S.checkbox(allChecked)}>
                {allChecked && <span style={{ fontSize: 14, color: '#0D1B2A', fontWeight: 800 }}>✓</span>}
              </div>
              <div>
                <div style={{ ...S.checkLabel, color: '#9B87F5' }}>전체 동의</div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(155,135,245,0.15)', margin: '8px 0 4px' }} />

            {CHECKS.map((c, i) => (
              <div
                key={c.id}
                style={i < CHECKS.length - 1 ? S.checkRow : S.checkRowLast}
                onClick={() => toggle(c.id)}
              >
                <div style={S.checkbox(checked[c.id])}>
                  {checked[c.id] && <span style={{ fontSize: 14, color: '#0D1B2A', fontWeight: 800 }}>✓</span>}
                </div>
                <div>
                  <div style={S.checkLabel}>
                    {c.label}
                    {c.isNew && <span style={S.newBadge}>NEW</span>}
                  </div>
                  <div style={S.checkSub}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 고정 하단 */}
      <div style={S.stickyBar}>
        {error && <div style={S.error}>{error}</div>}
        <motion.button
          style={S.agreeBtn(allChecked)}
          whileTap={allChecked ? { scale: 0.97 } : {}}
          onClick={handleAgree}
          disabled={!allChecked || loading}
        >
          {loading ? '처리 중...' : '모두 동의하고 시작하기'}
        </motion.button>
      </div>
    </div>
  );
}
