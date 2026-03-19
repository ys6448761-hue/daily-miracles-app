import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxySelectionScreen from '../features/galaxy/components/GalaxySelectionScreen';
import { POST_SELECTION } from '../features/galaxy/constants/galaxyCopy';
import { track } from '../utils/experiment';

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function GalaxyPage() {
  const navigate = useNavigate();

  useEffect(() => {
    track('galaxy_enter');
  }, []);

  return (
    <GalaxySelectionScreen
      onComplete={(direction) => {
        track('star_select', { direction });

        const message = getRandom(POST_SELECTION[direction]);

        navigate('/day', {
          state: { direction, message },
        });
      }}
    />
  );
}
