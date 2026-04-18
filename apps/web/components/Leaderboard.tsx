type Item = {
  rank: number;
  sessionId: string;
  attemptsCount: number;
  clearTimeMs: number;
};

export function Leaderboard({ items }: { items: Item[] }) {
  if (!items.length) return <p className="small">아직 기록이 없습니다.</p>;

  return (
    <div className="leaderboard">
      {items.map((item) => (
        <div key={`${item.sessionId}-${item.rank}`} className="leaderItem">
          <strong>#{item.rank}</strong>
          <span>{item.sessionId}</span>
          <span>{item.attemptsCount}회</span>
          <span>{(item.clearTimeMs / 1000).toFixed(1)}초</span>
        </div>
      ))}
    </div>
  );
}
