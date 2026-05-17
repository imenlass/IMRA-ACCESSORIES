import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Reveal from './Reveal';

export const dynamic = 'force-dynamic';

async function fetchCollectionHero(collection: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('image_url')
    .eq('collection', collection)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.image_url ?? null;
}

export default async function Collections() {
  const heroImg = await fetchCollectionHero('red-carpet');

  return (
    <section
      id="collections"
      style={{ background: 'var(--bg-section)', paddingTop: 100, paddingBottom: 100 }}
    >
      <div className="container">
        <Reveal className="section-title">
          <span className="eyebrow">UNIVERS</span>
          <h2>
            NOS <em>Collections</em>
          </h2>
        </Reveal>

        <div className="collections-grid">
          <Reveal className="collection">
            <Link href="/#products" style={{ display: 'block' }}>
              {heroImg ? (
                <Image
                  src={heroImg}
                  alt="Collection Red Carpet"
                  width={500}
                  height={450}
                  style={{ height: 450, width: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    height: 450,
                    width: '100%',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)',
                    opacity: 0.3,
                    fontSize: 48,
                  }}
                >
                  ◆
                </div>
              )}
              <div className="overlay">
                <div>
                  <h3>RED CARPET</h3>
                  <div className="overlay-cta">Découvrir</div>
                </div>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
