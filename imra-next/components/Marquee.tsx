const ITEMS = [
  'FAIT MAIN',
  'MATÉRIAUX PREMIUM',
  'LIVRAISON MONDIALE',
  'EMBALLAGE LUXE',
  'PIÈCES UNIQUES',
  'SAVOIR-FAIRE ARTISANAL',
];

export default function Marquee() {
  // duplicate the list for seamless looping
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {items.map((label, i) => (
          <span className="marquee-item" key={`${label}-${i}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
