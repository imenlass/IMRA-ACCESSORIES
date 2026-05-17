import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Footer from './Footer';

type Props = { slug: string };

export default async function SitePage({ slug }: Props) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_pages')
    .select('slug, title, eyebrow, content_html')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return (
    <>
      <main className="site-page">
        <div className="container" style={{ maxWidth: 860 }}>
          <Link href="/" className="back-link">
            ← Retour à la boutique
          </Link>

          {data.eyebrow && <div className="site-page-eyebrow">{data.eyebrow}</div>}
          <h1 className="site-page-title">{data.title}</h1>
          <div className="divider" style={{ marginBottom: 50 }}>
            <span>◆</span>
          </div>

          <article
            className="site-page-content"
            dangerouslySetInnerHTML={{ __html: data.content_html }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
