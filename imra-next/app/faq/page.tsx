import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/Footer';
import FaqAccordion from '@/components/FaqAccordion';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FAQ — IMRA',
  description: 'Réponses aux questions les plus fréquentes sur IMRA Accessories.',
};

export default async function FaqPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('id, question, answer')
    .eq('is_published', true)
    .order('position', { ascending: true });

  const items = data ?? [];

  return (
    <>
      <main className="site-page">
        <div className="container" style={{ maxWidth: 820 }}>
          <Link href="/" className="back-link">
            ← Retour à la boutique
          </Link>

          <div className="site-page-eyebrow">VOS QUESTIONS</div>
          <h1 className="site-page-title">
            Foire aux <em>questions</em>
          </h1>
          <div className="divider" style={{ marginBottom: 50 }}>
            <span>◆</span>
          </div>

          {error ? (
            <p style={{ color: '#ff9090', textAlign: 'center' }}>{error.message}</p>
          ) : (
            <FaqAccordion items={items} />
          )}

          <div className="faq-cta">
            <p>
              Vous n&apos;avez pas trouvé votre réponse&nbsp;?
            </p>
            <Link href="/#contact" className="btn">
              NOUS CONTACTER
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
