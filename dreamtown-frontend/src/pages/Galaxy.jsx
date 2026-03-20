import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxySelectionScreen from '../features/galaxy/components/GalaxySelectionScreen';
import { POST_SELECTION } from '../features/galaxy/constants/galaxyCopy';
import { track } from '../utils/experiment';
import { useDreamtownStore } from '../store/dreamtownStore';

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function GalaxyPage() {
  const navigate = useNavigate();
  const { setDirection, setMessage, resetFlow } = useDreamtownStore();

  useEffect(() => {
    track('galaxy_enter');
    resetFlow(); // 새 사이클 시작 — 이전 선택 초기화
  }, []);

  return (
    <GalaxySelectionScreen
      onComplete={(direction) => {
        track('star_select', { direction });

        const message = getRandom(POST_SELECTION[direction]);

        // Store에 저장 (location.state 유실 시 복구 소스)
        setDirection(direction);
        setMessage(message);

        navigate('/day', {
          state: { direction, message },
        });
      }}
    />
  );
}
