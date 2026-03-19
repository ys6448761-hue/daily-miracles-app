import { getLogs } from '../features/galaxy/utils/logStorage';
import HistoryList from '../features/galaxy/components/HistoryList';

export default function HistoryPage() {
  const logs = getLogs();

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-center mb-10 opacity-70">
        나의 별에 남겨진 기록
      </h1>

      <HistoryList logs={logs} />
    </div>
  );
}
