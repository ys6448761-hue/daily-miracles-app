import { useState } from 'react';
import { useDreamtownStore } from '../../../store/dreamtownStore';

export function useDayLogFlow(onComplete) {
  const [step, setStep] = useState('feeling');
  const [feeling, setFeelingLocal] = useState(null);
  const [helpTag, setHelpTagLocal] = useState(null);
  const [growthLine, setGrowthLineLocal] = useState(null);

  const { setFeeling, setHelpTag, setGrowthLine } = useDreamtownStore();

  const selectFeeling = (value) => {
    setFeelingLocal(value);
    setFeeling(value);  // store SSOT
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
