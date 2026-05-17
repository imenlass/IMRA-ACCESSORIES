'use client';

import { useState } from 'react';
import { updateEmailAction } from '@/app/account/profile/actions';
import Spinner from '@/components/Spinner';

export default function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      const next = String(fd.get('new_email') ?? '').trim();
      if (next.toLowerCase() === currentEmail.toLowerCase()) {
        throw new Error('Cette adresse est déjà votre email actuel.');
      }
      await updateEmailAction(fd);
      setPendingEmail(next);
      setNewEmail('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      if (msg.includes('NEXT_REDIRECT')) return;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="profile-form" noValidate>
      {error && <div className="profile-msg error">{error}</div>}
      {pendingEmail && (
        <div className="profile-msg info">
          ✉ Un email de confirmation a été envoyé à{' '}
          <strong>{pendingEmail}</strong>. Cliquez le lien dans cet email pour finaliser le
          changement. Tant que vous ne l&apos;avez pas fait, votre email reste{' '}
          <strong>{currentEmail}</strong>.
        </div>
      )}

      <div className="profile-field">
        <label htmlFor="current_email">Email actuel</label>
        <input id="current_email" type="email" value={currentEmail} disabled />
      </div>

      <div className="profile-field">
        <label htmlFor="new_email">Nouvelle adresse email</label>
        <input
          id="new_email"
          name="new_email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          autoComplete="email"
          required
          placeholder="nouvelle@email.com"
        />
      </div>

      <p className="profile-hint">
        Pour des raisons de sécurité, un email de confirmation sera envoyé à la nouvelle
        adresse. Votre adresse actuelle restera active tant que vous n&apos;avez pas confirmé.
      </p>

      <button type="submit" className="btn btn-dark btn-loading" disabled={submitting || !newEmail}>
        {submitting ? (
          <>
            <Spinner /> ENVOI…
          </>
        ) : (
          "METTRE À JOUR L'EMAIL"
        )}
      </button>
    </form>
  );
}
