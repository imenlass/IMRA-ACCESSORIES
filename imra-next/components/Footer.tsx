import Image from 'next/image';
import Link from 'next/link';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        {/* Top: Brand + Newsletter */}
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">IMRA</span>
            <p className="brand-tag">FÉMININE • CRÉATIVE • HANDMADE</p>
            <p className="brand-text">
              Des bijoux uniques, faits main avec passion, pour sublimer chaque moment de votre
              vie.
            </p>
            <div className="socials">
              <a
                href="https://instagram.com/imra_accessories"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 21v-7.5h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.6V4.1A22.7 22.7 0 0 0 14.3 4c-2.4 0-4 1.5-4 4.1V10.4H7.6v3.1h2.7V21h3.2z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.3v6.4a5.7 5.7 0 1 1-5.7-5.7 5.6 5.6 0 0 1 1 .1v3.1a2.7 2.7 0 1 0 1.7 2.5V3z"/>
                </svg>
              </a>
              <a
                href="mailto:imraaccessories@gmail.com"
                aria-label="Email"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-newsletter">
            <h3>REJOIGNEZ LA MAISON</h3>
            <p>Recevez nos nouveautés et offres exclusives en avant-première.</p>
            <NewsletterForm />
          </div>
        </div>

        {/* Mid: Link columns */}
        <div className="footer-mid">
          <div className="footer-col">
            <h4>BOUTIQUE</h4>
            <ul>
              <li><Link href="/#products">Nouveautés</Link></li>
              <li><Link href="/#collections">Red Carpet</Link></li>
              <li><Link href="/#about">À propos</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>SERVICE CLIENT</h4>
            <ul>
              <li><Link href="/#contact">Nous contacter</Link></li>
              <li><Link href="/livraison-retours">Livraison &amp; retours</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/conditions-generales">Conditions générales</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>COMPTE</h4>
            <ul>
              <li><Link href="/auth/login">Se connecter</Link></li>
              <li><Link href="/auth/signup">Créer un compte</Link></li>
              <li><Link href="/account/profile">Mon profil</Link></li>
              <li><Link href="/account/orders">Mes commandes</Link></li>
            </ul>
          </div>
          <div className="footer-col footer-qr">
            <h4>QR CONTACT</h4>
            <Image
              src="/imra_accessories_qr.png"
              alt="QR code imra_accessories"
              width={110}
              height={110}
            />
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <div className="copyright">© 2026 IMRA — TOUS DROITS RÉSERVÉS</div>
          <div className="payment-strip">
            <span>Paiement à la livraison</span>
            <span className="dot">•</span>
            <span>Virement bancaire</span>
            <span className="dot">•</span>
            <span>Mobile money</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
