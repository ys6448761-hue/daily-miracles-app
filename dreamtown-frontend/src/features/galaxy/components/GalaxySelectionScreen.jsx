import { useGalaxySelection } from '../hooks/useGalaxySelection';
import GalaxyLayer from './GalaxyLayer';
import StarField from './StarField';
import SelectionHint from './SelectionHint';
import SelectionTransition from './SelectionTransition';

export default function GalaxySelectionScreen({ onComplete }) {
  const { phase, selectedDirection, select } = useGalaxySelection(onComplete);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <GalaxyLayer />

      <StarField
        phase={phase}
        selectedDirection={selectedDirection}
        onSelect={select}
      />

      <SelectionHint phase={phase} selectedDirection={selectedDirection} />

      <SelectionTransition phase={phase} selectedDirection={selectedDirection} />
    </div>
  );
}
