export default function HistoryItem({ log }) {
  const date = new Date(log.createdAt).toLocaleDateString();

  return (
    <div className="p-5 rounded-xl bg-white/5">

      <div className="text-xs opacity-40 mb-2">
        {date}
      </div>

      <div className="mb-3 opacity-80">
        {log.message}
      </div>

      <div className="text-sm opacity-60">
        {log.feeling} · {log.helpTag}
      </div>

      <div className="text-sm opacity-80 mt-2">
        {log.growthLine}
      </div>

    </div>
  );
}
