'use client';

import { useState } from 'react';
import { updatePersonalInfoAction } from '@/app/account/profile/actions';
import Spinner from '@/components/Spinner';

type Props = {
  initial: { full_name: string | null; phone: string | null; address: string | null };
};

export default function PersonalInfoForm({ initial }: Props) {
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
      await updatePersonalInfoAction(fd);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
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
      {success && <div className="profile-msg success">✦ Informations enregistrées.</div>}

      <div className="profile-field">
        <label htmlFor="full_name">Nom complet</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={initial.full_name ?? ''}
          autoComplete="name"
          placeholder="ex. Imen Bensalah"
        />
      </div>

      <div className="profile-field">
        <label htmlFor="phone">Téléphone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone ?? ''}
          autoComplete="tel"
          placeholder="ex. +216 23 372 526"
        />
      </div>

      <div className="profile-field">
        <label htmlFor="address">Adresse de livraison</label>
        <textarea
          id="address"
          name="address"
          rows={3}
          defaultValue={initial.address ?? ''}
          autoComplete="street-address"
          placeholder="Rue, ville, code postal, pays"
        />
      </div>

      <p className="profile-hint">
        Ces informations seront utilisées pour pré-remplir vos prochaines commandes.
      </p>

      <button type="submit" className="btn btn-dark btn-loading" disabled={submitting}>
        {submitting ? (
          <>
            <Spinner /> ENREGISTREMENT…
          </>
        ) : (
          'ENREGISTRER'
        )}
      </button>
    </form>
  );
}
