import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import DeleteRowButton from '@/components/admin/DeleteRowButton';
import { deletePageAction } from './actions';

export const dynamic = 'force-dynamic';

type SitePage = {
  slug: string;
  title: string;
  eyebrow: string | null;
  is_published: boolean;
  updated_at: string;
};

export default async function AdminPagesPage() {
  const { supabase } = await requireAdmin('/admin/pages');

  const { data, error } = await supabase
    .from('site_pages')
    .select('slug, title, eyebrow, is_published, updated_at')
    .order('updated_at', { ascending: false });

  const pages = (data ?? []) as SitePage[];

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pages</h1>
          <p className="admin-page-sub">{pages.length} page{pages.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/pages/new" className="btn btn-dark">+ NOUVELLE PAGE</Link>
      </header>

      {error && <div className="admin-error">{error.message}</div>}

      <div className="admin-card admin-card-flush">
        {pages.length === 0 ? (
          <p className="admin-empty" style={{ padding: 30 }}>Aucune page.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Titre</th>
                <th>Mis à jour</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.slug}>
                  <td>
                    <Link href={`/admin/pages/${p.slug}`} className="admin-link">
                      <code>/{p.slug}</code>
                    </Link>
                  </td>
                  <td>{p.title}</td>
                  <td className="admin-dim">
                    {new Date(p.updated_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>
                    <span className={`pill ${p.is_published ? 'delivered' : 'cancelled'}`}>
                      {p.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="admin-row-actions">
                      <Link href={`/admin/pages/${p.slug}`} className="admin-link">Modifier</Link>
                      <Link
                        href={`/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-link"
                      >
                        Voir
                      </Link>
                      <DeleteRowButton
                        action={deletePageAction}
                        id={p.slug}
                        confirmMessage={`Supprimer la page "${p.title}" ?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
