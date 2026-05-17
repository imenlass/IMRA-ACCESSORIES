type Props = {
  label: string;
  value: string | number;
  unit?: string;
  /** Optional trend object — pass current and previous to render arrow + % */
  trend?: { current: number; previous: number };
  /** Optional caption shown below the value (e.g. "x commandes") */
  caption?: string;
  /** Optional icon character (gold ornament) */
  icon?: string;
  /** When true, the card is highlighted (slightly elevated, brighter border) */
  featured?: boolean;
};

function formatValue(v: string | number): string {
  if (typeof v === 'string') return v;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(v);
}

export default function KpiCard({
  label,
  value,
  unit,
  trend,
  caption,
  icon,
  featured,
}: Props) {
  let trendBlock: JSX.Element | null = null;
  if (trend) {
    if (trend.previous === 0 && trend.current === 0) {
      trendBlock = <span className="kpi-trend flat">— stable</span>;
    } else if (trend.previous === 0) {
      trendBlock = <span className="kpi-trend up">▲ nouveau</span>;
    } else {
      const delta = ((trend.current - trend.previous) / trend.previous) * 100;
      const rounded = Math.round(Math.abs(delta) * 10) / 10;
      if (delta > 0.5) {
        trendBlock = <span className="kpi-trend up">▲ +{rounded}%</span>;
      } else if (delta < -0.5) {
        trendBlock = <span className="kpi-trend down">▼ −{rounded}%</span>;
      } else {
        trendBlock = <span className="kpi-trend flat">— stable</span>;
      }
    }
  }

  return (
    <div className={`kpi-card ${featured ? 'is-featured' : ''}`}>
      <div className="kpi-card-head">
        <span className="kpi-card-label">{label}</span>
        {icon && <span className="kpi-card-icon" aria-hidden="true">{icon}</span>}
      </div>
      <div className="kpi-card-value">
        {formatValue(value)}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {(trendBlock || caption) && (
        <div className="kpi-card-meta">
          {trendBlock}
          {caption && <span className="kpi-card-caption">{caption}</span>}
        </div>
      )}
    </div>
  );
}
