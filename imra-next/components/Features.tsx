import Reveal from './Reveal';

const FEATURES = [
  { icon: '✦', title: 'FAIT MAIN AVEC PASSION', text: 'Chaque bijou est une pièce unique' },
  { icon: '◈', title: 'MATÉRIAUX PREMIUM', text: 'Qualité premium garantie' },
  { icon: '◉', title: 'LIVRAISON RAPIDE', text: 'Partout dans le monde' },
  { icon: '❋', title: 'EMBALLAGE LUXE', text: 'Parfait pour offrir' },
];

export default function Features() {
  return (
    <div className="features">
      <div className="container">
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} className="feature" delay={i * 80}>
              <div className="feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
