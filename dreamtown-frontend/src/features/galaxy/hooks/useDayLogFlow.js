import { useState } from 'react';

export function useDayLogFlow(onComplete) {
  const [step, setStep] = useState('feeling');
  const [feeling, setFeeling] = useState(null);
  const [helpTag, setHelpTag] = useState(null);
  const [growthLine, setGrowthLine] = useState(null);

  const selectFeeling = (value) => {
    setFeeling(value);
    setStep('help');
  };

  const selectHelp = (value) => {
    setHelpTag(value);
    setStep('growth');
  };

  const selectGrowth = (value) => {
    setGrowthLine(value);
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
    selectFeeling,
    selectHelp,
    selectGrowth,
    goBack,
  };
}
