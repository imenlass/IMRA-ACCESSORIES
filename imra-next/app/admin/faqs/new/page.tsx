import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import FaqForm from '@/components/admin/FaqForm';
import { createFaqAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewFaqPage() {
  await requireAdmin('/admin/faqs/new');
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/faqs" className="back-link">← FAQ</Link>
          <h1 className="admin-page-title">Nouvelle question</h1>
        </div>
      </header>
      <div className="admin-card">
        <FaqForm mode="create" action={createFaqAction} />
      </div>
    </div>
  );
}
