import { useState } from 'react';

export function useGalaxySelection(onComplete) {
  const [phase, setPhase] = useState('idle');
  const [selectedDirection, setSelectedDirection] = useState(null);

  const select = (direction) => {
    if (phase !== 'idle') return;

    setSelectedDirection(direction);
    setPhase('selecting');

    setTimeout(() => {
      setPhase('transitioning');
    }, 120);

    setTimeout(() => {
      setPhase('complete');
      onComplete?.(direction);
    }, 800);
  };

  return {
    phase,
    selectedDirection,
    select,
  };
}
