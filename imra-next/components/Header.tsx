'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AuthOverlay from './AuthOverlay';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { count, openCart, hydrated } = useCart();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on Escape, and lock body scroll while open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // The admin section has its own chrome — don't render the marketing header there.
  // (Early-return MUST come after every hook so React sees a stable hook count.)
  if (pathname?.startsWith('/admin')) return null;

  async function handleSignOut() {
    setMenuOpen(false);
    setSigningOut(true);
    try {
      await signOut();
      router.refresh();
      router.replace('/');
    } finally {
      // small grace period so the overlay doesn't flash off before navigation
      setTimeout(() => setSigningOut(false), 400);
    }
  }

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <nav className="site-nav">
            <div className="nav-links hide-mobile">
              <Link href="/">ACCUEIL</Link>
              <Link href="/#products">BOUTIQUE</Link>
              <Link href="/#collections">COLLECTIONS</Link>
              <Link href="/#about">À PROPOS</Link>
              <Link href="/#contact">CONTACT</Link>
            </div>

            <Link href="/" className="logo" aria-label="IMRA — Accueil">
              IMRA
            </Link>

            <div className="nav-links">
              {user ? (
                <>
                  <Link href="/account/profile" className="hide-mobile">
                    MON PROFIL
                  </Link>
                  <Link href="/account/orders" className="hide-mobile">
                    MES COMMANDES
                  </Link>
                  <button
                    type="button"
                    className="linklike hide-mobile"
                    onClick={() => {
                      void handleSignOut();
                    }}
                  >
                    DÉCONNEXION
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="hide-mobile">
                  CONNEXION
                </Link>
              )}
              <button
                type="button"
                className="cart-trigger"
                onClick={openCart}
                aria-label={`Panier (${count} article${count > 1 ? 's' : ''})`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="20" r="1.4" fill="currentColor" />
                  <circle cx="18" cy="20" r="1.4" fill="currentColor" />
                  <path d="M2.5 3.5h2.5l2.6 12.2a1.6 1.6 0 0 0 1.6 1.3h9.2a1.6 1.6 0 0 0 1.6-1.2L21.5 8H6.2" />
                </svg>
                {hydrated && count > 0 && (
                  <span key={count} className="cart-badge">
                    {count}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`hamburger show-mobile ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                <span /><span /><span />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div
        className={`mobile-menu ${menuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        <nav>
          <Link href="/" onClick={() => setMenuOpen(false)}>ACCUEIL</Link>
          <Link href="/#products" onClick={() => setMenuOpen(false)}>BOUTIQUE</Link>
          <Link href="/#collections" onClick={() => setMenuOpen(false)}>COLLECTIONS</Link>
          <Link href="/#about" onClick={() => setMenuOpen(false)}>À PROPOS</Link>
          <Link href="/#contact" onClick={() => setMenuOpen(false)}>CONTACT</Link>
          <div className="divider-line" />
          {user ? (
            <>
              <Link href="/account/profile" onClick={() => setMenuOpen(false)}>
                MON PROFIL
              </Link>
              <Link href="/account/orders" onClick={() => setMenuOpen(false)}>
                MES COMMANDES
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
              >
                DÉCONNEXION
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>CONNEXION</Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>CRÉER UN COMPTE</Link>
            </>
          )}
        </nav>
      </div>

      <AuthOverlay open={signingOut} message="Déconnexion…" />
    </>
  );
}
