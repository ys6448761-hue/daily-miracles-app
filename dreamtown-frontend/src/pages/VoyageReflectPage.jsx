/**
 * VoyageReflectPage — 여행 이후 별 변화 기록 (3단 선택)
 * 경로: /voyage-reflect?starId=xxx
 *
 * StarDetail에서 travelLog.needs_reflection=true 조건 충족 시 진입.
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { postTravelReflection } from '../api/dreamtown.js';

const STEPS = [
  {
    key:      'emotion',
    label:    '여수에서의 감정',
    question: '그곳에서 어떤 감정이 가장 컸나요?',
    choices:  ['편안했어요', '설레었어요', '새로워졌어요'],
  },
  {
    key:      'meaning',
    label:    '여행의 의미',
    question: '이 여행이 당신에게 어떤 의미였나요?',
    choices:  ['충전이 됐어요', '새로운 시작이 느껴졌어요', '나를 돌아봤어요'],
  },
  {
    key:      'change',
    label:    '별의 변화',
    question: '여행 이후, 소원에 어떤 변화가 생겼나요?',
    choices:  ['소원이 더 뚜렷해진 것 같아요', '마음이 한결 가벼워졌어요', '앞으로 나아갈 것 같아요'],
  },
];

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #060812 0%, #0D1228 60%, #0A1E3A 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px 60px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  header: {
    width: '100%',
    maxWidth: 360,
    paddingTop: 56,
    paddingBottom: 28,
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    background: 'rgba(91,200,192,0.12)',
    border: '1px solid rgba(91,200,192,0.25)',
    fontSize: 11,
    fontWeight: 700,
    color: '#5BC8C0',
    letterSpacing: '0.08em',
    marginBottom: 16,
  },
  headline: {
    fontSize: 20,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  subline: {
    fontSize: 13,
    color: '#7A6E9C',
    lineHeight: 1.7,
  },
  stepWrap: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#5BC8C0',
    letterSpacing: '0.08em',
    marginBottom: 8,
  },
  stepQ: {
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 14,
    lineHeight: 1.5,
  },
  choiceBtn: (selected, accent) => ({
    display: 'block',
    width: '100%',
    padding: '13px 16px',
    marginBottom: 8,
    borderRadius: 14,
    border: selected ? `1.5px solid ${accent}` : '1px solid rgba(255,255,255,0.08)',
    background: selected ? `${accent}15` : 'rgba(255,255,255,0.02)',
    color: selected ? accent : 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: selected ? 700 : 400,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Noto Sans KR', sans-serif",
    transition: 'all 0.18s ease',
  }),
  submitBtn: (enabled) => ({
    width: '100%',
    maxWidth: 360,
    padding: '15px 0',
    borderRadius: 9999,
    border: 'none',
    background: enabled
      ? 'linear-gradient(135deg, #5BC8C0 0%, #3BA8A0 100%)'
      : 'rgba(255,255,255,0.06)',
    color: enabled ? '#fff' : 'rgba(255,255,255,0.25)',
    fontSize: 15,
    fontWeight: 700,
    cursor: enabled ? 'pointer' : 'default',
    fontFamily: "'Noto Sans KR', sans-serif",
    marginTop: 8,
  }),
  resultWrap: {
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
    paddingTop: 40,
  },
  resultStar: {
    fontSize: 48,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  resultDesc: {
    fontSize: 13,
    color: '#7A6E9C',
    lineHeight: 1.8,
    marginBottom: 32,
  },
};

const ACCENT = '#5BC8C0';

export default function VoyageReflectPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const starId = searchParams.get('starId');

  const [answers, setAnswers]   = useState({ emotion: null, meaning: null, change: null });
  const [done, setDone]         = useState(false);
  const [saving, setSaving]     = useState(false);

  const allSelected = answers.emotion && answers.meaning && answers.change;

  const handleSubmit = async () => {
    if (!allSelected || saving) return;
    setSaving(true);
    try {
      if (starId) {
        await postTravelReflection(starId, {
          emotion_label: answers.emotion,
          meaning_label: answers.meaning,
          change_label:  answers.change,
        });
      }
    } catch (_) {
      // fire-and-forget — 저장 실패해도 완료 화면 표시
    }
    setDone(true);
    setSaving(false);
  };

  if (done) {
    return (
      <div style={S.page}>
        <motion.div
          style={S.resultWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={S.resultStar}>✨</div>
          <div style={S.resultTitle}>
            이 별은,<br />여수에서 한 번 더 빛났어요
          </div>
          <div style={S.resultDesc}>
            {answers.emotion} · {answers.meaning}<br />
            {answers.change}
          </div>
          <button
            onClick={() => starId ? nav(`/star/${starId}`) : nav('/home')}
            style={S.submitBtn(true)}
          >
            별로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <motion.div
        style={S.header}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div style={S.badge}>여수 이후 이야기</div>
        <div style={S.headline}>
          여행이 남긴 것들을<br />별에 기록해요
        </div>
        <div style={S.subline}>
          3가지를 선택하면, 당신의 별이<br />조금 더 빛나게 됩니다
        </div>
      </motion.div>

      <AnimatePresence>
        {STEPS.map((step, i) => (
          <motion.div
            key={step.key}
            style={S.stepWrap}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
          >
            <div style={S.stepLabel}>{`0${i + 1}. ${step.label}`}</div>
            <div style={S.stepQ}>{step.question}</div>
            {step.choices.map(choice => (
              <button
                key={choice}
                onClick={() => setAnswers(a => ({ ...a, [step.key]: choice }))}
                style={S.choiceBtn(answers[step.key] === choice, ACCENT)}
              >
                {choice}
              </button>
            ))}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        onClick={handleSubmit}
        style={S.submitBtn(allSelected)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        disabled={!allSelected || saving}
      >
        {saving ? '기록 중...' : '별에 기록하기'}
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={() => starId ? nav(`/star/${starId}`) : nav('/home')}
        style={{
          marginTop: 16,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        ← 나중에 하기
      </motion.button>
    </div>
  );
}
