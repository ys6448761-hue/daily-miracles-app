import { useNavigate } from 'react-router-dom';
import GalaxySelectionScreen from '../features/galaxy/components/GalaxySelectionScreen';
import { POST_SELECTION } from '../features/galaxy/constants/galaxyCopy';

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function GalaxyPage() {
  const navigate = useNavigate();

  return (
    <GalaxySelectionScreen
      onComplete={(direction) => {
        const message = getRandom(POST_SELECTION[direction]);

        navigate('/day', {
          state: {
            direction,
            message,
          },
        });
      }}
    />
  );
}
