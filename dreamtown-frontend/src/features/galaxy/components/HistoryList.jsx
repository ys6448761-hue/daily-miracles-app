import HistoryItem from './HistoryItem';

export default function HistoryList({ logs }) {
  if (!logs.length) {
    return (
      <div className="text-center opacity-50">
        아직 남겨진 기록이 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {logs.map((log) => (
        <HistoryItem key={log.id} log={log} />
      ))}
    </div>
  );
}
