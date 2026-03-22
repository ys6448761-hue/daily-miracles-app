import { LOG_OPTIONS } from '../constants/galaxyLogCopy';
import { useDayLogFlow } from '../hooks/useDayLogFlow';

export default function DayLogScreen({ direction, onComplete }) {
  const {
    step,
    selectFeeling,
    selectHelp,
    selectGrowth,
  } = useDayLogFlow(onComplete, direction);

  const options = LOG_OPTIONS[direction] ?? LOG_OPTIONS['south'];

  return (
    <div className="w-full h-screen text-white flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#0D1B2A' }}>

      {step === 'feeling' && (
        <Step
          title="오늘의 느낌"
          options={options.feelings}
          onSelect={selectFeeling}
        />
      )}

      {step === 'help' && (
        <Step
          title="어떤 도움이었나요"
          options={options.helps}
          onSelect={selectHelp}
        />
      )}

      {step === 'growth' && (
        <Step
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

function Step({ title, options, onSelect }) {
  return (
    <div className="w-full max-w-md text-center">
      <p className="mb-6 opacity-60">{title}</p>

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
