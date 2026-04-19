import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getOrCreateUserId,
  getStarPageSummary,
  logUserEvent,
  checkRevisit,
  USER_EVENTS,
  getDay8Status,
  postDay8Choose,
  requestDay8Payment,
} from '../api/dreamtown.js';

// ── 상태 → 색상 (수채화 감성) ────────────────────────────────────
const STATE_COLOR = {
  SEARCHING:  'bg-gray-300',
  BLOCKED:    'bg-gray-600',
  ANXIETY:    'bg-red-200',
  RECOVERY:   'bg-sky-200',
  GROWTH:     'bg-blue-400',
  HESITATION: 'bg-yellow-300',
  TRANSITION: 'bg-violet-300',
  RELATION:   'bg-pink-200',
};

// ── 서브 컴포넌트 5개 ─────────────────────────────────────────────

function StarHeader({ phase, message }) {
  return (
    <div className="pt-14 pb-8 text-center px-6">
      <div className="text-xs text-gray-400 tracking-widest mb-2">지금은</div>
      <div className="text-2xl font-semibold text-gray-900">{phase}</div>
      <div className="mt-3 text-sm text-gray-500 leading-relaxed">{message}</div>
    </div>
  );
}

function StarFlow({ flow }) {
  if (!flow || flow.length === 0) return null;
  return (
    <div className="px-6 pb-8">
      <div className="flex gap-3 justify-center items-end">
        {flow.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${STATE_COLOR[item.state] ?? 'bg-gray-300'}`} />
            <div className="text-[10px] text-gray-400">{item.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarPattern({ insight }) {
  if (!insight) return null;
  return (
    <div className="mx-6 mb-8 px-5 py-4 bg-gray-50 rounded-2xl">
      <div className="text-xs text-gray-400 mb-2">나의 공간 패턴</div>
      <div className="text-sm text-gray-600 leading-relaxed">{insight}</div>
    </div>
  );
}

function StarGrowthBlock({ message }) {
  return (
    <div className="px-6 pb-8 text-center">
      <div className="text-lg font-medium text-gray-800">{message}</div>
    </div>
  );
}

function StarAction({ text, onClick }) {
  return (
    <div className="px-6 pb-12">
      <button
        onClick={onClick}
        className="w-full py-4 rounded-2xl bg-gray-900 text-white text-sm font-medium active:scale-95 transition-transform"
      >
        {text}
      </button>
    </div>
  );
}

// ── Day 8 전환 오버레이 ────────────────────────────────────────────
function Day8Overlay({ message, options, onChoose, choosing }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center pb-0">
      <div className="w-full max-w-md bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-xl">
        <div className="text-center mb-6">
          <div className="text-xs text-gray-400 tracking-widest mb-2">8일째 별이에요</div>
          <div className="text-lg font-semibold text-gray-900 leading-snug">{message}</div>
        </div>
        <div className="space-y-3">
          {options.map(opt => (
            <button
              key={opt.type}
              disabled={choosing}
              onClick={() => onChoose(opt.type)}
              className="w-full py-4 rounded-2xl border border-gray-200 text-sm text-gray-700 font-medium
                         active:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Day 8 결제 설명 화면 ──────────────────────────────────────────
function Day8PaymentScreen({ onPay, onBack, paying }) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-md mx-auto">
      <button
        onClick={onBack}
        className="absolute top-5 left-5 text-gray-400 text-sm"
      >
        ←
      </button>
      <div className="flex-1 flex flex-col justify-center px-8 text-center">
        <div className="text-4xl mb-8">✨</div>
        <div className="text-xl font-semibold text-gray-900 mb-4 leading-snug">
          이 흐름을 계속 이어가기 위해<br />
          작은 도움을 받고 있어요
        </div>
        <div className="text-sm text-gray-500 leading-relaxed mb-2">
          매일 오전 10시, 당신의 별이<br />
          조용히 안부를 전할 거예요
        </div>
        <div className="text-xs text-gray-400 mt-1">월 9,900원</div>
      </div>
      <div className="px-6 pb-12">
        <button
          onClick={onPay}
          disabled={paying}
          className="w-full py-4 rounded-2xl bg-gray-900 text-white text-sm font-medium
                     active:scale-95 transition-transform disabled:opacity-60"
        >
          {paying ? '결제창 연결 중...' : '이 흐름 계속 이어가기'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          나이스페이 안전 결제 · 언제든 해지 가능
        </p>
      </div>
    </div>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse px-6 pt-14 space-y-6">
      <div className="h-6 bg-gray-100 rounded w-1/2 mx-auto" />
      <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
      <div className="flex gap-3 justify-center pt-4">
        {[...Array(5)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-gray-100" />)}
      </div>
      <div className="h-16 bg-gray-50 rounded-2xl" />
      <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto" />
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────
export default function StarSummaryPage() {
  const navigate          = useNavigate();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [day8, setDay8]           = useState(null);  // { show_transition, message, options }
  const [choosing, setChoosing]   = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [paying, setPaying]       = useState(false);
  const questionLogged    = useRef(false);

  useEffect(() => {
    const userId = getOrCreateUserId();

    // 이벤트 1: 페이지 진입
    logUserEvent({ userId, eventType: USER_EVENTS.STAR_PAGE_VIEW });

    // 이벤트 6: 재방문 감지
    checkRevisit(userId);

    // Day 8 전환 상태 조회 (비동기 — 별 요약과 병렬)
    getDay8Status(userId).then(d8 => {
      if (d8?.show_transition) setDay8(d8);
    });

    getStarPageSummary(userId)
      .then(res => {
        setData(res);

        // 이벤트 2: phase 노출
        if (res?.star?.phase) {
          logUserEvent({
            userId,
            eventType: USER_EVENTS.PHASE_EXPOSED,
            metadata:  { phase: res.star.phase },
          });
        }

        // 이벤트 4: 질문 노출 (question이 있을 때)
        if (res?.question && !questionLogged.current) {
          questionLogged.current = true;
          logUserEvent({
            userId,
            eventType: USER_EVENTS.QUESTION_SHOWN,
            metadata:  { type: res.question.type },
          });
        }
      })
      .catch(() => setError('잠시 연결이 안 됐어요. 다시 시도해봐요.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-white"><Skeleton /></div>;

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center text-sm text-gray-400">{error}</div>
    </div>
  );

  const { star, flow, pattern, growth, next_action, question } = data;
  const userId = getOrCreateUserId();

  function handleActionClick() {
    // 이벤트 3: 행동 버튼 클릭
    logUserEvent({
      userId,
      eventType: USER_EVENTS.ACTION_CLICKED,
      metadata:  { phase: star.phase, action_text: next_action?.text },
    });
    navigate('/wish/input');
  }

  function handleQuestionAnswer(answer) {
    // 이벤트 5: 질문 응답
    logUserEvent({
      userId,
      eventType: USER_EVENTS.QUESTION_ANSWERED,
      metadata:  { type: question?.type, answer },
    });
  }

  async function handleDay8Choose(choice) {
    if (choosing) return;
    setChoosing(true);
    try {
      const result = await postDay8Choose({ userId, choice });
      if (choice === 'continue' && result?.payment_required) {
        // 결제 설명 화면으로 전환 (오버레이 닫고 결제 화면 열기)
        setDay8(null);
        setShowPaymentScreen(true);
      } else {
        setDay8(null);
      }
    } catch {
      // 실패해도 오버레이 유지 — 사용자 재선택 가능
    } finally {
      setChoosing(false);
    }
  }

  async function handlePayNow() {
    if (paying) return;
    setPaying(true);
    try {
      const result = await requestDay8Payment(userId);
      if (result?.redirect_url) {
        window.location.href = result.redirect_url;
      }
    } catch {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">

      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 text-gray-400 text-sm"
      >
        ←
      </button>

      {/* 1. 현재 상태 */}
      <StarHeader phase={star.phase} message={star.phase_message} />

      {/* 2. 최근 흐름 */}
      <StarFlow flow={flow} />

      {/* 3. 공간 패턴 */}
      <StarPattern insight={pattern?.insight} />

      {/* 4. 성장 문장 */}
      <StarGrowthBlock message={growth?.message} />

      {/* 질문 블록 (조건부) */}
      {question && (
        <div className="mx-6 mb-6 px-5 py-4 bg-gray-50 rounded-2xl">
          <div className="text-sm text-gray-700 mb-3">{question.text}</div>
          <div className="flex flex-wrap gap-2">
            {question.options.map(opt => (
              <button
                key={opt}
                onClick={() => handleQuestionAnswer(opt)}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 active:bg-gray-100"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. 다음 행동 */}
      <div className="mt-auto">
        <StarAction text={next_action?.text} onClick={handleActionClick} />
      </div>

      {/* Day 8 전환 오버레이 */}
      {day8?.show_transition && (
        <Day8Overlay
          message={day8.message}
          options={day8.options}
          onChoose={handleDay8Choose}
          choosing={choosing}
        />
      )}

      {/* Day 8 결제 설명 화면 */}
      {showPaymentScreen && (
        <Day8PaymentScreen
          onPay={handlePayNow}
          onBack={() => setShowPaymentScreen(false)}
          paying={paying}
        />
      )}

    </div>
  );
}
