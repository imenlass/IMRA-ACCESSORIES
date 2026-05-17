'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthOverlay from '../AuthOverlay';

const ITEMS: { href: string; label: string; icon: JSX.Element; match?: RegExp }[] = [
  {
    href: '/admin',
    label: 'Tableau de bord',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
    match: /^\/admin\/?$/,
  },
  {
    href: '/admin/products',
    label: 'Produits',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7L12 3 4 7v10l8 4 8-4z" />
        <path d="M4 7l8 4 8-4M12 11v10" />
      </svg>
    ),
    match: /^\/admin\/products/,
  },
  {
    href: '/admin/orders',
    label: 'Commandes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2l-2 4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z" />
        <path d="M4 6h16M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    match: /^\/admin\/orders/,
  },
  {
    href: '/admin/messages',
    label: 'Messages',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v12H5.5L4 17.5z" />
      </svg>
    ),
    match: /^\/admin\/messages/,
  },
  {
    href: '/admin/faqs',
    label: 'FAQ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01" />
      </svg>
    ),
    match: /^\/admin\/faqs/,
  },
  {
    href: '/admin/pages',
    label: 'Pages',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h6" />
      </svg>
    ),
    match: /^\/admin\/pages/,
  },
  {
    href: '/admin/profile',
    label: 'Mon profil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    match: /^\/admin\/profile/,
  },
];

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.replace('/');
    } finally {
      setTimeout(() => setSigningOut(false), 400);
    }
  }

  return (
    <>
      <button
        type="button"
        className="admin-mobile-trigger"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Menu admin"
      >
        ☰
      </button>

      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">IMRA</span>
          <span className="admin-brand-sub">ADMIN</span>
        </Link>

        <nav className="admin-nav">
          {ITEMS.map((item) => {
            const active = item.match
              ? item.match.test(pathname ?? '')
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link
            href="/"
            className="admin-back"
            target="_blank"
            rel="noopener noreferrer"
          >
            ↗ Voir le site
          </Link>
          <div className="admin-user">
            <div className="admin-user-email" title={email}>{email}</div>
            <button type="button" className="admin-signout" onClick={handleSignOut}>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <AuthOverlay open={signingOut} message="Déconnexion…" />
    </>
  );
}
