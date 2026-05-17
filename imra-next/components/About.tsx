import Reveal from './Reveal';

export default function About() {
  return (
    <section id="about" className="about">
      <div className="about-bg" />
      <div className="container">
        <Reveal className="about-content">
          <span
            className="eyebrow"
            style={{
              display: 'block',
              marginBottom: 20,
              color: 'var(--gold)',
              letterSpacing: 5,
              fontSize: 11,
              fontWeight: 300,
            }}
          >
            NOTRE HISTOIRE
          </span>
          <h2>
            L&apos;UNIVERS <em>IMRA</em>
          </h2>
          <p>
            IMRA, c&apos;est l&apos;alliance de la féminité, de la créativité et du savoir-faire
            artisanal. Chaque bijou est pensé et réalisé à la main pour révéler votre éclat unique.
          </p>
          <a href="#products" className="btn">
            EN SAVOIR PLUS
          </a>
        </Reveal>
      </div>
    </section>
  );
}
