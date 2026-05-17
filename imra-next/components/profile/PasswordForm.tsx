'use client';

import { useRef, useState } from 'react';
import { updatePasswordAction } from '@/app/account/profile/actions';
import Spinner from '@/components/Spinner';

export default function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      await updatePasswordAction(fd);
      setSuccess(true);
      formRef.current?.reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      if (msg.includes('NEXT_REDIRECT')) return;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="profile-form" noValidate>
      {error && <div className="profile-msg error">{error}</div>}
      {success && (
        <div className="profile-msg success">
          ✦ Mot de passe mis à jour avec succès.
        </div>
      )}

      <div className="profile-field">
        <label htmlFor="current_password">Mot de passe actuel</label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="profile-field">
        <label htmlFor="new_password">Nouveau mot de passe</label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <small>6 caractères minimum.</small>
      </div>

      <div className="profile-field">
        <label htmlFor="confirm_password">Confirmer le nouveau mot de passe</label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>

      <button type="submit" className="btn btn-dark btn-loading" disabled={submitting}>
        {submitting ? (
          <>
            <Spinner /> MISE À JOUR…
          </>
        ) : (
          'CHANGER LE MOT DE PASSE'
        )}
      </button>
    </form>
  );
}
