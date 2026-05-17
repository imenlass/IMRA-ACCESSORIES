import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import DeleteRowButton from '@/components/admin/DeleteRowButton';
import { deleteFaqAction } from './actions';

export const dynamic = 'force-dynamic';

type Faq = {
  id: string;
  question: string;
  answer: string;
  position: number;
  is_published: boolean;
};

export default async function AdminFaqsPage() {
  const { supabase } = await requireAdmin('/admin/faqs');

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('position', { ascending: true });

  const faqs = (data ?? []) as Faq[];

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">FAQ</h1>
          <p className="admin-page-sub">{faqs.length} entrée{faqs.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/faqs/new" className="btn btn-dark">+ NOUVELLE QUESTION</Link>
      </header>

      {error && <div className="admin-error">{error.message}</div>}

      <div className="admin-card admin-card-flush">
        {faqs.length === 0 ? (
          <p className="admin-empty" style={{ padding: 30 }}>Aucune question.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Question</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f.id}>
                  <td className="admin-dim">{f.position}</td>
                  <td>
                    <Link href={`/admin/faqs/${f.id}`} className="admin-link">
                      <span dangerouslySetInnerHTML={{ __html: f.question }} />
                    </Link>
                  </td>
                  <td>
                    <span className={`pill ${f.is_published ? 'delivered' : 'cancelled'}`}>
                      {f.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="admin-row-actions">
                      <Link href={`/admin/faqs/${f.id}`} className="admin-link">Modifier</Link>
                      <DeleteRowButton
                        action={deleteFaqAction}
                        id={f.id}
                        confirmMessage="Supprimer cette question ?"
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
