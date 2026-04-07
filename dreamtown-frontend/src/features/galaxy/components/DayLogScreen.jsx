import { LOG_OPTIONS } from '../constants/galaxyLogCopy';
import { useDayLogFlow } from '../hooks/useDayLogFlow';

// 인트로 화면 — "이 별을 더 또렷하게 만들기 위해..." (의미 선언)
function IntroScreen({ onStart }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 32px',
        gap: 0,
      }}
    >
      <p style={{ fontSize: 42, marginBottom: 20, lineHeight: 1 }}>🌱</p>
      <p style={{
        fontSize: 17,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.88)',
        lineHeight: 1.7,
        marginBottom: 10,
      }}>
        이 별을 더 또렷하게 만들기 위해<br />
        몇 가지를 물어볼게요
      </p>
      <p style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.38)',
        lineHeight: 1.6,
        marginBottom: 40,
      }}>
        분석이 아니라,<br />별이 자라는 과정이에요
      </p>
      <button
        onClick={onStart}
        style={{
          padding: '14px 40px',
          borderRadius: 9999,
          background: 'rgba(255,215,106,0.12)',
          border: '1px solid rgba(255,215,106,0.35)',
          color: 'rgba(255,215,106,0.9)',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '0.02em',
        }}
      >
        별 키우기 시작 ✦
      </button>
    </div>
  );
}

export default function DayLogScreen({ direction, onComplete }) {
  const {
    step,
    startQuestions,
    selectFeeling,
    selectHelp,
    selectGrowth,
  } = useDayLogFlow(onComplete, direction);

  const options = LOG_OPTIONS[direction] ?? LOG_OPTIONS['south'];
  const isQuestionStep = step === 'feeling' || step === 'help' || step === 'growth';

  return (
    <div className="w-full h-screen text-white flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#0D1B2A' }}>

      {/* 상단 고정바 — 질문 진행 중에만 표시 */}
      {isQuestionStep && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '14px 20px',
          textAlign: 'center',
          background: 'rgba(13,27,42,0.88)',
          borderBottom: '1px solid rgba(255,215,106,0.1)',
          backdropFilter: 'blur(8px)',
          zIndex: 50,
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.65)', letterSpacing: '0.04em' }}>
            🌱 당신의 별이 자라고 있어요
          </p>
        </div>
      )}

      {/* 인트로 — 의미 선언 */}
      {step === 'intro' && (
        <IntroScreen onStart={startQuestions} />
      )}

      {step === 'feeling' && (
        <Step
          label="🌱 별을 키우는 중"
          title="오늘의 느낌"
          options={options.feelings}
          onSelect={selectFeeling}
        />
      )}

      {step === 'help' && (
        <Step
          label="🌱 별을 키우는 중"
          title="어떤 도움이었나요"
          options={options.helps}
          onSelect={selectHelp}
        />
      )}

      {step === 'growth' && (
        <Step
          label="🌱 별을 키우는 중"
          title="오늘의 변화"
          options={options.growth}
          onSelect={selectGrowth}
        />
      )}

      {step === 'complete' && (
        <div className="text-center opacity-70">
          오늘의 별에 한 줄이 더해졌어요
        </div>
      )}
    </div>
  );
}

function Step({ label, title, options, onSelect }) {
  return (
    <div className="w-full max-w-md text-center" style={{ paddingTop: 48 }}>
      {/* 컨텍스트 라벨 */}
      <p style={{
        fontSize: 11,
        color: 'rgba(255,215,106,0.55)',
        letterSpacing: '0.06em',
        marginBottom: 8,
      }}>
        {label}
      </p>
      {/* 질문 제목 */}
      <p style={{
        fontSize: 16,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 24,
      }}>
        {title}
      </p>

      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className="py-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
