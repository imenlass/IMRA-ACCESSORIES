import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import PageForm from '@/components/admin/PageForm';
import { createPageAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewPagePage() {
  await requireAdmin('/admin/pages/new');
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/pages" className="back-link">← Pages</Link>
          <h1 className="admin-page-title">Nouvelle page</h1>
        </div>
      </header>
      <div className="admin-card">
        <PageForm mode="create" action={createPageAction} />
      </div>
    </div>
  );
}
