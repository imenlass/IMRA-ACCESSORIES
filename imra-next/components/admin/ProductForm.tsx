'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';
import type { Product } from '@/types';

type Props = {
  mode: 'create' | 'edit';
  initial?: Partial<Product>;
  action: (fd: FormData) => Promise<void>;
};

export default function ProductForm({ mode, initial = {}, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initial.image_url ?? null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      await action(fd);
      // server action redirects on success; nothing else needed
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue.';
      // Next.js redirects throw a special error; only surface actual errors.
      if (msg.includes('NEXT_REDIRECT')) return;
      setError(msg);
      setSubmitting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImagePreview(URL.createObjectURL(f));
  }

  return (
    <form onSubmit={onSubmit} className="admin-form" noValidate>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-form-grid">
        <div className="admin-form-col">
          <label>
            <span>Nom</span>
            <input name="name" type="text" defaultValue={initial.name ?? ''} required />
          </label>

          <label>
            <span>Slug (URL)</span>
            <input
              name="slug"
              type="text"
              defaultValue={initial.slug ?? ''}
              required
              pattern="[a-z0-9-]+"
              title="Lettres minuscules, chiffres et tirets uniquement"
            />
          </label>

          <label>
            <span>Description</span>
            <textarea name="description" rows={4} defaultValue={initial.description ?? ''} />
          </label>

          <div className="admin-form-row">
            <label>
              <span>Prix</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initial.price ?? 0}
                required
              />
            </label>
            <label>
              <span>Devise</span>
              <input name="currency" type="text" defaultValue={initial.currency ?? 'DT'} />
            </label>
            <label>
              <span>Stock</span>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={initial.stock ?? 999}
                required
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              <span>Collection</span>
              <input
                name="collection"
                type="text"
                defaultValue={initial.collection ?? 'red-carpet'}
              />
            </label>
            <label>
              <span>Ordre d&apos;affichage</span>
              <input
                name="display_order"
                type="number"
                defaultValue={initial.display_order ?? 0}
              />
            </label>
          </div>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial.is_active ?? true}
            />
            <span>Actif (visible sur la boutique)</span>
          </label>
        </div>

        <div className="admin-form-col">
          <label>
            <span>Image (upload)</span>
            <input
              type="file"
              name="image_file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onFileChange}
            />
            <small>Sera uploadée dans le bucket <code>product-images</code>.</small>
          </label>

          <label>
            <span>OU URL d&apos;image existante</span>
            <input
              name="image_url"
              type="url"
              defaultValue={initial.image_url ?? ''}
              placeholder="https://..."
            />
          </label>

          {imagePreview && (
            <div className="admin-image-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Aperçu" />
            </div>
          )}
        </div>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="btn"
          onClick={() => router.back()}
          disabled={submitting}
        >
          ANNULER
        </button>
        <button type="submit" className="btn btn-dark btn-loading" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner /> ENREGISTREMENT…
            </>
          ) : mode === 'create' ? (
            'CRÉER LE PRODUIT'
          ) : (
            'ENREGISTRER LES MODIFICATIONS'
          )}
        </button>
      </div>
    </form>
  );
}
