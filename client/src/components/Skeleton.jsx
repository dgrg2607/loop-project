// Shimmering placeholder blocks shown while data loads, so the layout
// doesn't jump and the page feels responsive instead of blank.
export function SkeletonBlock({ height = 16, width = '100%', radius = 6 }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function SkeletonStatGrid() {
  return (
    <div className="stat-grid">
      {[0, 1, 2, 3].map((i) => (
        <div className="stat-card" key={i}>
          <SkeletonBlock height={11} width="60%" />
          <div style={{ height: 8 }} />
          <SkeletonBlock height={26} width="40%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel({ height = 280 }) {
  return (
    <div className="panel">
      <SkeletonBlock height={14} width="35%" />
      <div style={{ height: 16 }} />
      <SkeletonBlock height={height} radius={10} />
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div className="table-wrap">
      <div style={{ padding: '1rem 1.2rem' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ marginBottom: '0.7rem' }}>
            <SkeletonBlock height={14} width={`${85 - i * 4}%`} />
          </div>
        ))}
      </div>
    </div>
  );
}
