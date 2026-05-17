'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AuthOverlay from '@/components/AuthOverlay';
import Spinner from '@/components/Spinner';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      // After clicking the email link, Supabase delivers the user to our
      // /auth/callback?redirect=/auth/update-password handler, which exchanges
      // the recovery code and forwards them to the "set new password" page.
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/auth/update-password')}`
          : undefined;

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetErr) {
        setError(resetErr.message);
        setSubmitting(false);
        return;
      }

      // Supabase intentionally returns success for unknown emails (anti-enum).
      // We mirror that by always showing the "if an account exists" message.
      setSent(true);
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.');
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-already-block">
            <div className="icon">✉</div>
            <h2>
              Email <em>envoyé</em>
            </h2>
            <p>
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous
              recevrez un lien pour réinitialiser votre mot de passe dans quelques minutes.
              Pensez à vérifier vos spams.
            </p>
            <Link href="/auth/login" className="btn btn-dark">
              RETOUR À LA CONNEXION
            </Link>
            <button
              type="button"
              className="auth-already-back"
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
            >
              Renvoyer à une autre adresse
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>
          Mot de passe <em>oublié</em>
        </h1>
        <p className="subtitle">RÉINITIALISER VOTRE MOT DE PASSE</p>

        {error && <div className="auth-error">{error}</div>}

        <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.7, marginBottom: 18, fontWeight: 300 }}>
          Entrez l&apos;adresse email de votre compte. Nous vous enverrons un lien pour choisir
          un nouveau mot de passe.
        </p>

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
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-dark btn-loading"
            disabled={submitting || !email}
          >
            {submitting ? (
              <>
                <Spinner /> ENVOI…
              </>
            ) : (
              "ENVOYER LE LIEN"
            )}
          </button>
        </form>

        <div className="alt">
          Vous vous en souvenez ?{' '}
          <Link href="/auth/login">SE CONNECTER</Link>
        </div>
        <div className="alt" style={{ marginTop: 10 }}>
          <Link href="/" style={{ color: '#888' }}>
            ← Retour à la boutique
          </Link>
        </div>
      </div>

      <AuthOverlay open={submitting} message="Envoi du lien…" />
    </main>
  );
}
