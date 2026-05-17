type Item = {
  product_id: string | null;
  name: string;
  quantity: number;
  revenue: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);
}

export default function TopProducts({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="admin-empty">Pas encore de ventes.</p>;
  }

  const maxRevenue = Math.max(1, ...items.map((i) => i.revenue));

  return (
    <ol className="top-products-list">
      {items.map((p, i) => {
        const pct = (p.revenue / maxRevenue) * 100;
        return (
          <li key={`${p.product_id}-${i}`} className="top-product-row">
            <span className="rank">{String(i + 1).padStart(2, '0')}</span>
            <div className="info">
              <div className="name-line">
                <span className="name">{p.name}</span>
                <span className="qty">×{p.quantity}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="rev">{fmt(p.revenue)} DT</span>
          </li>
        );
      })}
    </ol>
  );
}
