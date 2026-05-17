import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import Reveal from './Reveal';

export const dynamic = 'force-dynamic';

async function fetchProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to load products:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function ProductsSection() {
  const products = await fetchProducts();

  return (
    <section id="products">
      <div className="container">
        <Reveal className="section-title">
          <span className="eyebrow">SÉLECTION EXCLUSIVE</span>
          <h2>
            COLLECTION <em>Red Carpet</em>
          </h2>
          <p>L&apos;élégance pour vos moments d&apos;exception.</p>
        </Reveal>

        <Reveal className="divider">
          <span>◆</span>
        </Reveal>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
            <p>Aucun produit disponible pour le moment.</p>
            <p style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>
              (Si vous configurez Supabase pour la première fois, exécutez{' '}
              <code>supabase/schema.sql</code>.)
            </p>
          </div>
        ) : (
          <div className="products">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
