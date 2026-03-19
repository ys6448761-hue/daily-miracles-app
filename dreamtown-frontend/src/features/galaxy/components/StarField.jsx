import Star from './Star';
import { STAR_CONFIGS } from '../constants/galaxyLayout';

export default function StarField({ phase, selectedDirection, onSelect }) {
  return (
    <>
      {STAR_CONFIGS.map((star) => {
        const isSelected = selectedDirection === star.direction;
        const isDimmed =
          selectedDirection && selectedDirection !== star.direction;
        return (
          <Star
            key={star.direction}
            {...star}
            isSelected={isSelected}
            isDimmed={isDimmed}
            disabled={phase !== 'idle'}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );
}
