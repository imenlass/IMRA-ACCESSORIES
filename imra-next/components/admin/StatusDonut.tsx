const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmées',
  shipped: 'Expédiées',
  delivered: 'Livrées',
  cancelled: 'Annulées',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#e8c97a',
  confirmed: '#8fd4a8',
  shipped: '#80c4f0',
  delivered: '#a0e5b0',
  cancelled: '#ff9090',
};

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const R = 42;                              // donut radius (viewBox is 100x100)
const STROKE = 11;                         // donut thickness
const CIRC = 2 * Math.PI * R;              // ≈ 263.89
const GAP = 1.2;                           // small px gap between segments

export default function StatusDonut({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const total = STATUS_ORDER.reduce((sum, k) => sum + (counts[k] || 0), 0);

  // Build the segments we'll actually draw (count > 0).
  const visible = STATUS_ORDER
    .map((key) => ({
      key,
      label: STATUS_LABELS[key],
      color: STATUS_COLORS[key],
      count: counts[key] ?? 0,
    }))
    .filter((s) => s.count > 0);

  // Compute each segment's stroke length + dashoffset.
  // dashoffset is negative because we want the segment to start
  // where the previous one ended (clockwise from 12 o'clock).
  let cumulative = 0;
  const arcs = visible.map((seg) => {
    const length = (seg.count / Math.max(1, total)) * CIRC;
    const arc = { ...seg, length: Math.max(0.5, length - (visible.length > 1 ? GAP : 0)), offset: -cumulative };
    cumulative += length;
    return arc;
  });

  return (
    <div className="status-donut-row">
      <div className="status-donut-wrap" role="img" aria-label={`${total} commandes au total`}>
        <svg className="status-donut" viewBox="0 0 100 100" aria-hidden="true">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="rgba(212, 166, 79, 0.08)"
            strokeWidth={STROKE}
          />
          {/* Status segments */}
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.length} ${CIRC - arc.length}`}
              strokeDashoffset={arc.offset}
              transform="rotate(-90 50 50)"
              strokeLinecap="butt"
            />
          ))}
          {/* When total is 0, draw a subtle dashed indicator */}
          {total === 0 && (
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="rgba(212, 166, 79, 0.2)"
              strokeWidth={STROKE}
              strokeDasharray="2 4"
            />
          )}
        </svg>
        <div className="status-donut-center">
          <div className="total">{total}</div>
          <div className="label">commande{total > 1 ? 's' : ''}</div>
        </div>
      </div>

      <ul className="status-legend">
        {STATUS_ORDER.map((key) => {
          const count = counts[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li key={key} className={count === 0 ? 'is-zero' : ''}>
              <span
                className="dot"
                style={{ background: STATUS_COLORS[key] }}
                aria-hidden="true"
              />
              <span className="label">{STATUS_LABELS[key]}</span>
              <span className="pct">{count > 0 ? `${pct}%` : '—'}</span>
              <span className="count">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
