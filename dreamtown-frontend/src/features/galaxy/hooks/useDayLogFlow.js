import { useState } from 'react';
import { useDreamtownStore } from '../../../store/dreamtownStore';
import { gaDayFeelingSelect, gaDayChangeSelect } from '../../../utils/gtag';

export function useDayLogFlow(onComplete, direction = null) {
  const [step, setStep] = useState('intro');
  const [feeling, setFeelingLocal] = useState(null);
  const [helpTag, setHelpTagLocal] = useState(null);
  const [growthLine, setGrowthLineLocal] = useState(null);

  const { setFeeling, setHelpTag, setGrowthLine } = useDreamtownStore();

  const startQuestions = () => setStep('feeling');

  const selectFeeling = (value) => {
    setFeelingLocal(value);
    setFeeling(value);  // store SSOT
    gaDayFeelingSelect({ feeling: value, direction });
    setStep('help');
  };

  const selectHelp = (value) => {
    setHelpTagLocal(value);
    setHelpTag(value);  // store SSOT
    setStep('growth');
  };

  const selectGrowth = (value) => {
    setGrowthLineLocal(value);
    setGrowthLine(value);  // store SSOT
    gaDayChangeSelect({ change: value, direction });

    setStep('complete');

    const log = {
      feeling,
      helpTag,
      growthLine: value,
      createdAt: new Date().toISOString(),
    };

    onComplete?.(log);
  };

  const goBack = () => {
    if (step === 'growth') setStep('help');
    else if (step === 'help') setStep('feeling');
  };

  return {
    step,
    feeling,
    helpTag,
    growthLine,
    startQuestions,
    selectFeeling,
    selectHelp,
    selectGrowth,
    goBack,
  };
}
