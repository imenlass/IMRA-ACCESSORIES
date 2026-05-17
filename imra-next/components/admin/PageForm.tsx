'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';

type PageInitial = {
  slug?: string;
  title?: string;
  eyebrow?: string | null;
  content_html?: string;
  is_published?: boolean;
};

export default function PageForm({
  mode,
  initial = {},
  action,
}: {
  mode: 'create' | 'edit';
  initial?: PageInitial;
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

      <div className="admin-form-row">
        <label>
          <span>Slug (URL)</span>
          <input
            name="slug"
            type="text"
            defaultValue={initial.slug ?? ''}
            required
            pattern="[a-z0-9-]+"
            title="Lettres minuscules, chiffres, tirets"
          />
          <small>La page sera accessible à <code>/<span>{initial.slug ?? 'slug'}</span></code></small>
        </label>
        <label>
          <span>Titre</span>
          <input name="title" type="text" defaultValue={initial.title ?? ''} required />
        </label>
      </div>

      <label>
        <span>Eyebrow (sur-titre)</span>
        <input
          name="eyebrow"
          type="text"
          defaultValue={initial.eyebrow ?? ''}
          placeholder="INFORMATIONS"
        />
        <small>Petit texte en majuscules affiché au-dessus du titre.</small>
      </label>

      <label>
        <span>Contenu HTML</span>
        <textarea
          name="content_html"
          rows={20}
          defaultValue={initial.content_html ?? ''}
          required
          style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12 }}
        />
        <small>
          HTML brut accepté: <code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>.
        </small>
      </label>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={initial.is_published ?? true}
        />
        <span>Publié (visible sur le site)</span>
      </label>

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
            'CRÉER LA PAGE'
          ) : (
            'ENREGISTRER'
          )}
        </button>
      </div>
    </form>
  );
}
