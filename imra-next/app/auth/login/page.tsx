'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import AuthOverlay from '@/components/AuthOverlay';
import Spinner from '@/components/Spinner';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/account/orders';

  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If the user is already signed in (e.g. they used the browser back button
  // from /account/orders), redirect them where they were going.
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
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError(signInErr.message);
        setSubmitting(false);
        return;
      }
      // Force the server to re-render with the new auth cookies before navigating.
      router.refresh();
      // replace() so the login page isn't kept in browser history.
      router.replace(redirect);
      // keep the overlay visible until the navigation actually happens
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion.');
      setSubmitting(false);
    }
  }

  // While the auth context is still loading, or while we know the user is
  // already authenticated and we're about to redirect, show the overlay so the
  // user never sees the form flash.
  const fullPageLoading = (!authLoading && !!user) || submitting;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>
          Bon <em>retour</em>
        </h1>
        <p className="subtitle">CONNECTEZ-VOUS À VOTRE COMPTE</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="form-group">
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
          <button type="submit" className="btn btn-dark btn-loading" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner /> CONNEXION…
              </>
            ) : (
              'SE CONNECTER'
            )}
          </button>
        </form>

        <div className="alt">
          <Link href={`/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
            MOT DE PASSE OUBLIÉ ?
          </Link>
        </div>
        <div className="alt" style={{ marginTop: 10 }}>
          Pas encore de compte ?{' '}
          <Link href={`/auth/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
            S&apos;INSCRIRE
          </Link>
        </div>
        <div className="alt" style={{ marginTop: 10 }}>
          <Link href="/" style={{ color: '#888' }}>
            ← Retour à la boutique
          </Link>
        </div>
      </div>

      <AuthOverlay open={fullPageLoading} message="Connexion…" />
    </main>
  );
}
