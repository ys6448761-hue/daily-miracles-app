/**
 * PartnerApply.jsx — 파트너 셀프 온보딩 신청 화면
 * 경로: /partner/apply
 * Aurora5 톤 | 모바일 375px 최적화
 *
 * Step 0: 기본 정보 (업체명·사장님 성함·연락처)
 * Step 1-5: Aurora5 면접 5문항
 * Submit → 심사 → /partner/apply/result
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONS = [
  {
    id: 'q1',
    text: '사장님의 공간은 어떤 곳인가요?\n손님들이 이 공간에서 주로 어떤 감정을 경험하나요?',
    type: 'textarea',
    placeholder: '편하게 적어주세요',
  },
  {
    id: 'q2',
    text: '사장님 공간에 오는 손님들이\n마음속에 어떤 소원을 품고 있을 것 같으신가요?',
    type: 'textarea',
    placeholder: '손님들의 마음을 상상해보세요',
  },
  {
    id: 'q3',
    text: '우리 플랫폼에는 4가지 별의 집이 있어요.\n사장님 공간은 어디에 가장 가깝나요?',
    type: 'radio',
    options: [
      { value: 'healing',      label: '✦ 치유 은하',      desc: '잠깐 쉬고 싶은 마음' },
      { value: 'relationship', label: '✦ 관계 은하',      desc: '소중한 사람과 함께' },
      { value: 'challenge',    label: '✦ 도전 은하',      desc: '새로 시작하고 싶은 용기' },
      { value: 'growth',       label: '✦ 성장 은하',      desc: '이 순간을 기억하고 싶어' },
    ],
  },
  {
    id: 'q4',
    text: '별들의 고향 파트너로서\n소원이들에게 어떤 경험을 드리고 싶으신가요?',
    type: 'textarea',
    placeholder: '한 문장으로 약속해주세요',
  },
  {
    id: 'q5',
    text: '마지막으로 확인해주세요',
    type: 'checkbox',
    options: [
      { id: 'op1', label: '현재 정상 영업 중입니다' },
      { id: 'op2', label: 'QR 카드를 손님이 보이는 곳에 놓을 수 있습니다' },
      { id: 'op3', label: '소원이 손님을 따뜻하게 맞이할 수 있습니다' },
    ],
  },
];

const S = {
  page:     { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', display: 'flex', flexDirection: 'column', paddingBottom: 40 },
  header:   { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '18px 20px', textAlign: 'center' },
  headerTitle: { fontSize: 17, fontWeight: 800, color: '#9B87F5' },
  headerSub:   { fontSize: 12, color: '#7A6E9C', marginTop: 4 },
  progress: { height: 3, background: 'rgba(155,135,245,0.15)' },
  progressBar: (pct) => ({ height: '100%', width: `${pct}%`, background: '#9B87F5', transition: 'width 0.4s ease' }),
  body:     { flex: 1, padding: '28px 20px 0' },
  stepNum:  { fontSize: 11, color: '#7A6E9C', fontWeight: 700, letterSpacing: 1, marginBottom: 12 },
  question: { fontSize: 17, fontWeight: 700, color: '#E8E4F0', lineHeight: 1.55, marginBottom: 20, whiteSpace: 'pre-line' },
  textarea: { width: '100%', minHeight: 120, background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.2)', borderRadius: 14, padding: '14px 16px', color: '#E8E4F0', fontSize: 14, lineHeight: 1.65, resize: 'none', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box' },
  radioCard: (sel) => ({ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, border: `1px solid ${sel ? 'rgba(155,135,245,0.5)' : 'rgba(155,135,245,0.15)'}`, background: sel ? 'rgba(155,135,245,0.1)' : 'rgba(155,135,245,0.04)', cursor: 'pointer', marginBottom: 10, transition: 'all 0.15s' }),
  radioDot: (sel) => ({ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? '#9B87F5' : 'rgba(155,135,245,0.35)'}`, background: sel ? '#9B87F5' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  checkRow: (sel) => ({ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, border: `1px solid ${sel ? 'rgba(155,135,245,0.45)' : 'rgba(155,135,245,0.12)'}`, background: sel ? 'rgba(155,135,245,0.08)' : 'transparent', cursor: 'pointer', marginBottom: 10, transition: 'all 0.15s' }),
  checkBox: (sel) => ({ width: 22, height: 22, borderRadius: 6, border: sel ? 'none' : '2px solid rgba(155,135,245,0.4)', background: sel ? '#9B87F5' : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }),
  input:    { width: '100%', background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.2)', borderRadius: 12, padding: '13px 16px', color: '#E8E4F0', fontSize: 14, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box', marginBottom: 12 },
  label:    { fontSize: 12, color: '#9B87F5', fontWeight: 700, marginBottom: 6 },
  nextBtn:  (ok) => ({ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: ok ? '#9B87F5' : 'rgba(155,135,245,0.2)', color: ok ? '#0D1B2A' : '#7A6E9C', fontSize: 16, fontWeight: 800, cursor: ok ? 'pointer' : 'not-allowed', transition: 'all 0.2s', marginTop: 24 }),
  backBtn:  { background: 'transparent', border: 'none', color: '#7A6E9C', fontSize: 13, cursor: 'pointer', marginTop: 12, display: 'block', textAlign: 'center', width: '100%' },
  error:    { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 12 },
};

export default function PartnerApply() {
  const nav = useNavigate();

  // step: -1 = 랜딩, 0 = 기본정보, 1~5 = 문항, 6 = 제출 중
  const [step, setStep] = useState(-1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 기본 정보
  const [basic, setBasic] = useState({ business_name: '', owner_name: '', phone: '' });

  // 답변
  const [answers, setAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '',
    q5: { op1: false, op2: false, op3: false },
  });

  const totalSteps = 6;  // 0(기본) + 5문항
  const progress   = step < 0 ? 0 : Math.round(((step + 1) / totalSteps) * 100);

  // ── 기본 정보 유효성 ──────────────────────────────────────────
  const basicOk = basic.business_name.trim().length >= 2
               && basic.owner_name.trim().length >= 2
               && basic.phone.trim().length >= 9;

  // ── 현재 문항 유효성 ──────────────────────────────────────────
  function stepOk() {
    if (step === 0) return basicOk;
    const q = QUESTIONS[step - 1];
    if (!q) return true;
    if (q.type === 'textarea')  return answers[q.id]?.trim().length >= 5;
    if (q.type === 'radio')     return !!answers[q.id];
    if (q.type === 'checkbox') {
      const ops = answers.q5;
      return ops.op1 && ops.op2 && ops.op3;
    }
    return true;
  }

  // ── 다음 단계 ────────────────────────────────────────────────
  function handleNext() {
    setError('');
    if (step === totalSteps - 1) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  }

  // ── 제출 ─────────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const body = {
        business_name:      basic.business_name.trim(),
        owner_name:         basic.owner_name.trim(),
        phone:              basic.phone.trim(),
        region_code:        'KR_YEOSU',
        q1_space_intro:     answers.q1,
        q2_wish_connection: answers.q2,
        q3_galaxy_choice:   answers.q3,
        q4_promise:         answers.q4,
        q5_operations:      answers.q5,
      };
      const r = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || '제출에 실패했어요.'); return; }

      nav('/partner/apply/result', {
        state: {
          application_id: d.application_id,
          verdict:        d.verdict,
          business_name:  basic.business_name,
          loginId:        d.loginId,
        },
        replace: true,
      });
    } catch {
      setError('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  // ── 랜딩 ──────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <div style={S.page}>
        <div style={{ ...S.header }}>
          <div style={S.headerTitle}>✦ 별들의 고향 파트너 신청</div>
          <div style={S.headerSub}>Aurora5 면접 심사 · 소요 5분</div>
        </div>
        <div style={{ padding: '40px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 20 }}>⭐</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#E8E4F0', textAlign: 'center', lineHeight: 1.45, marginBottom: 12 }}>
              사장님 공간을<br />
              <span style={{ color: '#9B87F5' }}>소원이들의 고향</span>으로<br />
              만들어드릴게요
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.7, marginBottom: 32 }}>
              5개 질문에 답해주시면<br />
              Aurora5가 심사 후 자동으로 계정을 만들어드려요
            </p>
            <div style={{ background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.15)', borderRadius: 14, padding: '16px 18px', marginBottom: 32 }}>
              {['소원이 손님 자동 유입', '별 탄생 QR 카드 발급', '월 정산 자동화', '파트너 어드민 대시보드'].map(t => (
                <div key={t} style={{ fontSize: 13, color: '#C4BAE0', marginBottom: 6 }}>✓ {t}</div>
              ))}
            </div>
            <button
              onClick={() => setStep(0)}
              style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: '#9B87F5', color: '#0D1B2A', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}
            >
              신청 시작하기 →
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── 현재 문항 렌더 ────────────────────────────────────────────
  const q = step >= 1 ? QUESTIONS[step - 1] : null;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerTitle}>✦ 파트너 신청</div>
        <div style={S.headerSub}>{step + 1} / {totalSteps} 단계</div>
      </div>
      <div style={S.progress}><div style={S.progressBar(progress)} /></div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          style={S.body}
        >
          {/* Step 0: 기본 정보 */}
          {step === 0 && (
            <>
              <div style={S.stepNum}>기본 정보</div>
              <div style={S.question}>사장님을 소개해주세요</div>

              <div style={S.label}>업체명</div>
              <input style={S.input} value={basic.business_name}
                onChange={e => setBasic(b => ({ ...b, business_name: e.target.value }))}
                placeholder="카페 별빛" />

              <div style={S.label}>사장님 성함</div>
              <input style={S.input} value={basic.owner_name}
                onChange={e => setBasic(b => ({ ...b, owner_name: e.target.value }))}
                placeholder="홍길동" />

              <div style={S.label}>연락처 (SMS 수신용)</div>
              <input style={S.input} type="tel" value={basic.phone}
                onChange={e => setBasic(b => ({ ...b, phone: e.target.value }))}
                placeholder="010-0000-0000" />
            </>
          )}

          {/* Step 1-2, 4: textarea */}
          {q && q.type === 'textarea' && (
            <>
              <div style={S.stepNum}>질문 {step} / 5</div>
              <div style={S.question}>{q.text}</div>
              <textarea
                style={S.textarea}
                value={answers[q.id]}
                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                placeholder={q.placeholder}
              />
              <p style={{ fontSize: 11, color: '#7A6E9C', marginTop: 6, textAlign: 'right' }}>
                {answers[q.id]?.length || 0}자
              </p>
            </>
          )}

          {/* Step 3: radio */}
          {q && q.type === 'radio' && (
            <>
              <div style={S.stepNum}>질문 {step} / 5</div>
              <div style={S.question}>{q.text}</div>
              {q.options.map(opt => (
                <div key={opt.value} style={S.radioCard(answers.q3 === opt.value)}
                  onClick={() => setAnswers(a => ({ ...a, q3: opt.value }))}>
                  <div style={S.radioDot(answers.q3 === opt.value)}>
                    {answers.q3 === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D1B2A' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#E8E4F0' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#7A6E9C', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Step 5: checkbox */}
          {q && q.type === 'checkbox' && (
            <>
              <div style={S.stepNum}>질문 {step} / 5</div>
              <div style={S.question}>{q.text}</div>
              {q.options.map(opt => (
                <div key={opt.id} style={S.checkRow(answers.q5[opt.id])}
                  onClick={() => setAnswers(a => ({ ...a, q5: { ...a.q5, [opt.id]: !a.q5[opt.id] } }))}>
                  <div style={S.checkBox(answers.q5[opt.id])}>
                    {answers.q5[opt.id] && <span style={{ fontSize: 13, color: '#0D1B2A', fontWeight: 800 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 14, color: '#E8E4F0', lineHeight: 1.5 }}>{opt.label}</div>
                </div>
              ))}
            </>
          )}

          {error && <div style={S.error}>{error}</div>}

          <button
            style={S.nextBtn(stepOk() && !loading)}
            onClick={handleNext}
            disabled={!stepOk() || loading}
          >
            {loading ? '심사 중...' : step === totalSteps - 1 ? '신청 완료 ✨' : '다음 →'}
          </button>

          {step > 0 && (
            <button style={S.backBtn} onClick={() => setStep(s => s - 1)}>
              ← 이전 질문
            </button>
          )}
          {step === 0 && (
            <button style={S.backBtn} onClick={() => setStep(-1)}>
              ← 처음으로
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
