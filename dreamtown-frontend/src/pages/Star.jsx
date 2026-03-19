import { getLogs } from '../features/galaxy/utils/logStorage';
import { getStarGrowth } from '../features/galaxy/utils/starGrowth';
import StarGrowthView from '../features/galaxy/components/StarGrowthView';
import GrowthSummary from '../features/galaxy/components/GrowthSummary';
import RecentStarLogs from '../features/galaxy/components/RecentStarLogs';

export default function StarPage() {
  const logs = getLogs();
  const growth = getStarGrowth(logs);

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 py-10 flex flex-col items-center">

      <GrowthSummary stage={growth.stage} />

      <StarGrowthView stage={growth.stage} />

      <RecentStarLogs logs={growth.recentLogs} />

    </div>
  );
}
