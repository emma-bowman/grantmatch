interface Stat {
  label: string;
  value: string;
  sub?: string;
}

export default function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="grant-card text-center py-5"
        >
          <div
            className="text-2xl font-normal"
            style={{
              fontFamily: "Georgia, 'Playfair Display', serif",
              color: "var(--color-text-primary)",
            }}
          >
            {stat.value}
          </div>
          <div
            className="text-xs mt-1 uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}
          >
            {stat.label}
          </div>
          {stat.sub && (
            <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {stat.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
