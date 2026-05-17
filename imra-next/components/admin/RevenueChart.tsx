'use client';

import { useMemo, useState } from 'react';

type Point = { day: string; revenue: number };

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n);
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function RevenueChart({ data }: { data: Point[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { max, avg, total, todayIdx } = useMemo(() => {
    const revs = data.map((d) => d.revenue);
    const m = Math.max(1, ...revs);
    const t = revs.reduce((s, v) => s + v, 0);
    const a = data.length ? t / data.length : 0;
    return { max: m, avg: a, total: t, todayIdx: data.length - 1 };
  }, [data]);

  if (data.length === 0) {
    return (
      <p className="admin-empty">Aucune donnée pour cette période.</p>
    );
  }

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="revenue-chart">
      <div className="revenue-chart-summary">
        <div>
          <span className="label">Total période</span>
          <span className="value">{fmt(total)} <small>DT</small></span>
        </div>
        <div>
          <span className="label">Moyenne / jour</span>
          <span className="value">{fmt(avg)} <small>DT</small></span>
        </div>
        <div>
          <span className="label">Aujourd&apos;hui</span>
          <span className="value">{fmt(data[todayIdx]?.revenue ?? 0)} <small>DT</small></span>
        </div>
      </div>

      <div className="revenue-chart-plot" onMouseLeave={() => setHoverIdx(null)}>
        {/* avg line */}
        {avg > 0 && (
          <div
            className="revenue-avg-line"
            style={{ bottom: `${(avg / max) * 100}%` }}
          >
            <span className="avg-label">moy.</span>
          </div>
        )}

        {/* bars */}
        <div className="revenue-bars">
          {data.map((d, i) => {
            const h = (d.revenue / max) * 100;
            const isToday = i === todayIdx;
            const isHover = hoverIdx === i;
            return (
              <div
                key={d.day}
                className={`revenue-bar-col ${isToday ? 'is-today' : ''} ${isHover ? 'is-hover' : ''}`}
                onMouseEnter={() => setHoverIdx(i)}
                onFocus={() => setHoverIdx(i)}
                tabIndex={0}
                role="img"
                aria-label={`${shortDate(d.day)}: ${fmt(d.revenue)} DT`}
              >
                <div
                  className="bar"
                  style={{ height: `${Math.max(2, h)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* tooltip */}
        {hovered && (
          <div
            className="revenue-tooltip"
            style={{ left: `${(hoverIdx! / Math.max(1, data.length - 1)) * 100}%` }}
          >
            <div className="amt">{fmt(hovered.revenue)} <small>DT</small></div>
            <div className="day">{shortDate(hovered.day)}</div>
          </div>
        )}
      </div>

      <div className="revenue-x-axis">
        {data.map((d, i) => {
          const date = new Date(d.day);
          const showLabel = i === 0 || i === todayIdx || i % 3 === 0;
          return (
            <span
              key={d.day}
              className={`x-tick ${i === todayIdx ? 'is-today' : ''}`}
            >
              {showLabel ? date.getDate() : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}
