export default function RecentStarLogs({ logs }) {
  if (!logs.length) return null;

  return (
    <div className="w-full max-w-md mt-10">
      <p className="text-sm opacity-50 mb-4 text-center">
        나의 별에 남겨진 흐름
      </p>

      <div className="flex flex-col gap-4">
        {logs.map((log) => (
          <div key={log.id} className="p-4 bg-white/5 rounded-lg">
            <div className="text-xs opacity-40 mb-1">
              {new Date(log.createdAt).toLocaleDateString()}
            </div>
            <div className="opacity-80">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
