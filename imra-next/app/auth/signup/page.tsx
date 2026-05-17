'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import AuthOverlay from '@/components/AuthOverlay';
import Spinner from '@/components/Spinner';

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/account/orders';

  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // When Supabase silently rejects a signup for an existing email, we don't
  // get an error — we get a success-shaped response with an empty `identities`
  // array. We track that case explicitly to show a clear "sign in instead" UX.
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [authLoading, user, redirect, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailAlreadyRegistered(null);

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
              : undefined,
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setSubmitting(false);
        return;
      }

      // If email confirmation is OFF, Supabase returns a session right away.
      if (data.session) {
        router.refresh();
        router.replace(redirect);
        return; // keep overlay until navigation
      }

      // Supabase quirk: when the email is already registered, it returns
      // SUCCESS with data.user populated but `identities` empty — and sends
      // no email. Detect this so we can route the user to sign-in instead.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        setEmailAlreadyRegistered(email.trim());
        setSubmitting(false);
        return;
      }

      setSuccess(
        'Compte créé ! Vérifiez vos emails pour confirmer votre adresse, puis connectez-vous.'
      );
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
      setSubmitting(false);
    }
  }

  const fullPageLoading = (!authLoading && !!user) || submitting;

  // Specific UI when the email is already taken — guide them to sign-in
  // or to reset their password (covers the case where they checked out as
  // a guest before, an account got created, and they don't remember the
  // password / never set one).
  if (emailAlreadyRegistered) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-already-block">
            <div className="icon">◆</div>
            <h2>
              Compte <em>existant</em>
            </h2>
            <p>
              Un compte existe déjà avec l&apos;adresse{' '}
              <strong>{emailAlreadyRegistered}</strong>. Vous pouvez vous connecter, ou
              recevoir un lien pour définir un nouveau mot de passe si vous ne vous en
              souvenez pas.
            </p>
            <Link
              href={`/auth/login?email=${encodeURIComponent(emailAlreadyRegistered)}&redirect=${encodeURIComponent(redirect)}`}
              className="btn btn-dark"
            >
              SE CONNECTER À LA PLACE
            </Link>
            <Link
              href={`/auth/forgot-password?email=${encodeURIComponent(emailAlreadyRegistered)}`}
              className="btn"
              style={{ marginTop: 8 }}
            >
              RÉINITIALISER LE MOT DE PASSE
            </Link>
            <button
              type="button"
              className="auth-already-back"
              onClick={() => {
                setEmailAlreadyRegistered(null);
                setEmail('');
              }}
            >
              Utiliser une autre adresse
            </button>
          </div>
        </div>
        <AuthOverlay open={fullPageLoading} message="Création du compte…" />
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>
          Créer un <em>compte</em>
        </h1>
        <p className="subtitle">REJOIGNEZ LA MAISON IMRA</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

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
            <label htmlFor="password">MOT DE PASSE (6+ CARACTÈRES)</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-dark btn-loading" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner /> CRÉATION…
              </>
            ) : (
              "S'INSCRIRE"
            )}
          </button>
        </form>

        <div className="alt">
          Déjà un compte ?{' '}
          <Link href={`/auth/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
            SE CONNECTER
          </Link>
        </div>
        <div className="alt" style={{ marginTop: 10 }}>
          <Link href="/" style={{ color: '#888' }}>
            ← Retour à la boutique
          </Link>
        </div>
      </div>

      <AuthOverlay open={fullPageLoading} message="Création du compte…" />
    </main>
  );
}
