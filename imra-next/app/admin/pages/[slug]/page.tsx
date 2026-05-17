import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import PageForm from '@/components/admin/PageForm';
import { updatePageAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditPagePage({ params }: { params: { slug: string } }) {
  const { supabase } = await requireAdmin(`/admin/pages/${params.slug}`);

  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (error || !data) notFound();

  const bound = updatePageAction.bind(null, params.slug);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/pages" className="back-link">← Pages</Link>
          <h1 className="admin-page-title">{data.title}</h1>
          <p className="admin-page-sub">
            <code>/{data.slug}</code>
          </p>
        </div>
        <Link
          href={`/${data.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          VOIR LA PAGE ↗
        </Link>
      </header>
      <div className="admin-card">
        <PageForm mode="edit" initial={data} action={bound} />
      </div>
    </div>
  );
}
