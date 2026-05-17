'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import AuthOverlay from '@/components/AuthOverlay';
import Spinner from '@/components/Spinner';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/admin';

  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If they're already signed in, hop straight through. The /admin layout
  // will refuse non-admin users on its own, sending them to /not-admin.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [authLoading, user, redirect, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        setSubmitting(false);
        return;
      }
      router.refresh();
      router.replace(redirect);
      // keep overlay visible through the navigation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion.');
      setSubmitting(false);
    }
  }

  const fullPageLoading = (!authLoading && !!user) || submitting;

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <div className="ornament">✦</div>
          <div className="mark">IMRA</div>
          <div className="sub">ADMINISTRATION</div>
        </div>

        <div className="admin-login-divider" aria-hidden="true">
          <span />◆<span />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="admin-login-field">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoFocus
              required
            />
          </div>
          <div className="admin-login-field">
            <label htmlFor="password">MOT DE PASSE</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-dark btn-loading admin-login-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner /> CONNEXION…
              </>
            ) : (
              'SE CONNECTER'
            )}
          </button>
        </form>

        <div className="admin-login-meta">
          <div>Accès réservé à l&apos;équipe IMRA.</div>
          <Link href="/">← Retour à la boutique</Link>
        </div>
      </div>

      <AuthOverlay open={fullPageLoading} message="Accès administration…" />
    </main>
  );
}
