/**
 * GrowthLog — 최근 기록 3개 조용히 표시
 *
 * 원칙 (DEC-2026-0319-004):
 * - 3개 제한 유지 (히스토리 부담 없이 현재에 집중)
 * - direction 라벨 노출 금지
 * - 날짜/시간보다 경험 문장 중심
 */
export default function GrowthLog({ logs }) {
  const recent = logs.slice(0, 3);

  if (!recent.length) {
    return (
      <p className="text-center text-white/30 text-sm">
        아직 남겨진 기록이 없어요
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {recent.map((log) => (
        <div key={log.id} className="px-4 py-3 rounded-xl bg-white/5">
          <p className="text-white/70 text-sm mb-1">{log.message}</p>
          <p className="text-white/40 text-xs">{log.feeling} · {log.growthLine}</p>
        </div>
      ))}
    </div>
  );
}
