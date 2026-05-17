import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import FaqForm from '@/components/admin/FaqForm';
import { updateFaqAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditFaqPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin(`/admin/faqs/${params.id}`);

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();

  const bound = updateFaqAction.bind(null, params.id);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/faqs" className="back-link">← FAQ</Link>
          <h1 className="admin-page-title">Modifier la question</h1>
        </div>
      </header>
      <div className="admin-card">
        <FaqForm mode="edit" initial={data} action={bound} />
      </div>
    </div>
  );
}
