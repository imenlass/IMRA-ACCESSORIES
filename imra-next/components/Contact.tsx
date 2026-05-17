import Reveal from './Reveal';
import ContactForm from './ContactForm';

export default function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <Reveal className="section-title">
          <span className="eyebrow">RESTONS EN CONTACT</span>
          <h2>
            Une <em>question</em> ?
          </h2>
          <p>Notre équipe est à votre écoute pour toute demande, sur-mesure ou conseil.</p>
        </Reveal>

        <div className="contact-grid">
          <Reveal className="contact-info">
            <div className="info-block">
              <div className="info-icon">✉</div>
              <h4>EMAIL</h4>
              <a href="mailto:imraaccessories@gmail.com">imraaccessories@gmail.com</a>
            </div>
            <div className="info-block">
              <div className="info-icon">◈</div>
              <h4>INSTAGRAM</h4>
              <a
                href="https://instagram.com/imra_accessories"
                target="_blank"
                rel="noopener noreferrer"
              >
                @imra_accessories
              </a>
            </div>
            <div className="info-block">
              <div className="info-icon">◉</div>
              <h4>LIVRAISON</h4>
              <span style={{ color: '#aaa', fontSize: 13 }}>Tunisie &amp; international</span>
            </div>
            <div className="info-block">
              <div className="info-icon">✦</div>
              <h4>SUR-MESURE</h4>
              <span style={{ color: '#aaa', fontSize: 13 }}>Pièces personnalisées sur demande</span>
            </div>
          </Reveal>

          <Reveal className="contact-form-wrap" delay={120}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
