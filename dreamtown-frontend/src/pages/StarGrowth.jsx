/**
 * StarGrowth — 별 성장 화면
 *
 * "내가 얼마나 했는지"가 아니라
 * "내 소원이 어떻게 살아남았는지"를 보여주는 화면
 *
 * DEC-2026-0319-004
 */
import { getLogs } from '../features/galaxy/utils/logStorage';
import GrowthStar from '../features/galaxy/components/GrowthStar';
import GrowthLog from '../features/galaxy/components/GrowthLog';

export default function StarGrowthPage() {
  const logs = getLogs();

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center px-6 py-14">

      {/* 중앙 별 */}
      <div className="flex-1 flex items-center justify-center">
        <GrowthStar logCount={logs.length} />
      </div>

      {/* 최근 기록 3개 */}
      <div className="w-full max-w-md pb-8">
        <GrowthLog logs={logs} />
      </div>

    </div>
  );
}
