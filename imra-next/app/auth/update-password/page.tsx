'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import AuthOverlay from '@/components/AuthOverlay';
import Spinner from '@/components/Spinner';

export const dynamic = 'force-dynamic';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // The user lands here AFTER clicking the password-reset link in their email
  // and going through /auth/callback, which exchanges the recovery code and
  // gives them a temporary session. If somehow there is no session, show a
  // friendly explanation rather than a confusing form.
  useEffect(() => {
    if (!authLoading && !user) {
      setError(
        "Lien expiré ou invalide. Demandez un nouveau lien de réinitialisation."
      );
    }
  }, [authLoading, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!user) {
      setError('Vous devez être connecté via le lien de réinitialisation.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        setError(updErr.message);
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      // Refresh server-side so layout sees the freshly-confirmed session,
      // then redirect to the orders area.
      setTimeout(() => {
        router.refresh();
        router.replace('/account/orders');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-already-block">
            <div className="icon">✦</div>
            <h2>
              Mot de passe <em>mis à jour</em>
            </h2>
            <p>
              Votre nouveau mot de passe est actif. Redirection vers votre compte…
            </p>
          </div>
        </div>
        <AuthOverlay open={true} message="Redirection…" />
      </main>
    );
  }

  // If the session is missing, show an inline recovery prompt
  if (!authLoading && !user) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-already-block">
            <div className="icon">◆</div>
            <h2>Lien <em>expiré</em></h2>
            <p>
              Ce lien de réinitialisation n&apos;est plus valide ou a déjà été utilisé.
              Demandez un nouveau lien pour continuer.
            </p>
            <Link href="/auth/forgot-password" className="btn btn-dark">
              DEMANDER UN NOUVEAU LIEN
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>
          Nouveau <em>mot de passe</em>
        </h1>
        <p className="subtitle">
          {user?.email ? `POUR ${user.email.toUpperCase()}` : 'CHOISISSEZ UN NOUVEAU MOT DE PASSE'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="new-password">NOUVEAU MOT DE PASSE</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">CONFIRMER LE MOT DE PASSE</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-dark btn-loading"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner /> MISE À JOUR…
              </>
            ) : (
              'METTRE À JOUR LE MOT DE PASSE'
            )}
          </button>
        </form>
      </div>

      <AuthOverlay open={submitting} message="Mise à jour…" />
    </main>
  );
}
