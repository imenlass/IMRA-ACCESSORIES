'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';

type FaqInitial = {
  question?: string;
  answer?: string;
  position?: number;
  is_published?: boolean;
};

export default function FaqForm({
  mode,
  initial = {},
  action,
}: {
  mode: 'create' | 'edit';
  initial?: FaqInitial;
  action: (fd: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      await action(fd);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      if (msg.includes('NEXT_REDIRECT')) return;
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-form" noValidate>
      {error && <div className="admin-error">{error}</div>}

      <label>
        <span>Question</span>
        <input name="question" type="text" defaultValue={initial.question ?? ''} required />
        <small>HTML autorisé pour formatage léger (ex. <code>&amp;nbsp;</code>)</small>
      </label>

      <label>
        <span>Réponse</span>
        <textarea name="answer" rows={6} defaultValue={initial.answer ?? ''} required />
        <small>HTML autorisé. Les balises <code>&lt;a&gt;</code>, <code>&lt;strong&gt;</code>, etc. sont rendues.</small>
      </label>

      <div className="admin-form-row">
        <label>
          <span>Position</span>
          <input
            name="position"
            type="number"
            defaultValue={initial.position ?? 0}
            min={0}
          />
        </label>
        <label className="admin-checkbox" style={{ alignSelf: 'end' }}>
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={initial.is_published ?? true}
          />
          <span>Publié</span>
        </label>
      </div>

      <div className="admin-form-actions">
        <button type="button" className="btn" onClick={() => router.back()} disabled={submitting}>
          ANNULER
        </button>
        <button type="submit" className="btn btn-dark btn-loading" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner /> ENREGISTREMENT…
            </>
          ) : mode === 'create' ? (
            'CRÉER'
          ) : (
            'ENREGISTRER'
          )}
        </button>
      </div>
    </form>
  );
}
