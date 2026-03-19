import { useLocation, useNavigate } from 'react-router-dom';
import DayLogScreen from '../features/galaxy/components/DayLogScreen';
import { saveLog } from '../features/galaxy/utils/logStorage';

export default function DayPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const direction = state?.direction;
  const message = state?.message;

  return (
    <div className="relative w-full h-screen bg-black text-white">
      <div className="absolute top-20 w-full text-center opacity-80">
        {message}
      </div>

      <DayLogScreen
        direction={direction}
        onComplete={(log) => {
          const saved = saveLog({
            direction,
            message,
            ...log,
          });

          navigate('/postcard', {
            state: {
              message,
              growthLine: saved.growthLine,
            },
          });
        }}
      />
    </div>
  );
}
