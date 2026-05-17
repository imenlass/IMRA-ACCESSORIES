export default function ProductsSkeleton() {
  return (
    <section id="products">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">SÉLECTION EXCLUSIVE</span>
          <h2>
            COLLECTION <em>Red Carpet</em>
          </h2>
          <p>L&apos;élégance pour vos moments d&apos;exception.</p>
        </div>

        <div className="divider">
          <span>◆</span>
        </div>

        <div className="products" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-img" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line short" />
              <div className="skeleton-pad-bottom" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
