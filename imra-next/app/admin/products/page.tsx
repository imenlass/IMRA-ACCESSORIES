import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import AdminSearch from '@/components/admin/AdminSearch';
import AdminAdvancedFilters from '@/components/admin/AdminAdvancedFilters';
import AdminRangeFilter from '@/components/admin/AdminRangeFilter';
import AdminDateRangeFilter from '@/components/admin/AdminDateRangeFilter';
import AdminSelectFilter from '@/components/admin/AdminSelectFilter';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

type Search = {
  q?: string;
  active?: string;
  stock?: string;
  collection?: string;
  priceMin?: string;
  priceMax?: string;
  stockMin?: string;
  stockMax?: string;
  from?: string;
  to?: string;
};

// Strip characters that break Supabase's PostgREST .or() syntax.
function sanitize(s: string): string {
  return s.replace(/[,()*]/g, ' ').trim();
}

const PRIMARY_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'active:true', label: 'Actifs' },
  { key: 'active:false', label: 'Inactifs' },
  { key: 'stock:low', label: 'Stock faible' },
  { key: 'stock:out', label: 'Rupture' },
] as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { supabase } = await requireAdmin('/admin/products');

  // Build query
  let query = supabase.from('products').select('*', { count: 'exact' });

  // Search
  if (searchParams.q) {
    const q = sanitize(searchParams.q);
    if (q) {
      const like = `%${q}%`;
      query = query.or(
        `name.ilike.${like},slug.ilike.${like},description.ilike.${like},collection.ilike.${like}`
      );
    }
  }

  // Primary chips
  if (searchParams.active === 'true') query = query.eq('is_active', true);
  if (searchParams.active === 'false') query = query.eq('is_active', false);
  if (searchParams.stock === 'in') query = query.gt('stock', 5);
  if (searchParams.stock === 'low') query = query.gt('stock', 0).lte('stock', 5);
  if (searchParams.stock === 'out') query = query.eq('stock', 0);

  // Advanced
  if (searchParams.collection) query = query.eq('collection', searchParams.collection);
  if (searchParams.priceMin) query = query.gte('price', Number(searchParams.priceMin));
  if (searchParams.priceMax) query = query.lte('price', Number(searchParams.priceMax));
  if (searchParams.stockMin) query = query.gte('stock', Number(searchParams.stockMin));
  if (searchParams.stockMax) query = query.lte('stock', Number(searchParams.stockMax));
  if (searchParams.from) query = query.gte('created_at', searchParams.from);
  if (searchParams.to) query = query.lte('created_at', `${searchParams.to}T23:59:59`);

  query = query.order('display_order', { ascending: true });

  const { data, error, count } = await query;
  const products = (data ?? []) as Product[];

  // Build the collection-filter option list from existing collections
  const { data: collectionsData } = await supabase
    .from('products')
    .select('collection')
    .order('collection');
  const uniqueCollections = Array.from(
    new Set((collectionsData ?? []).map((c: { collection: string }) => c.collection))
  ).map((c) => ({ value: c, label: c }));

  // Active chip resolver
  const currentChip = (() => {
    if (searchParams.active === 'true') return 'active:true';
    if (searchParams.active === 'false') return 'active:false';
    if (searchParams.stock === 'low') return 'stock:low';
    if (searchParams.stock === 'out') return 'stock:out';
    return 'all';
  })();

  function chipHref(key: string) {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set('q', searchParams.q);
    // preserve advanced filters
    if (searchParams.collection) sp.set('collection', searchParams.collection);
    if (searchParams.priceMin) sp.set('priceMin', searchParams.priceMin);
    if (searchParams.priceMax) sp.set('priceMax', searchParams.priceMax);
    if (searchParams.stockMin) sp.set('stockMin', searchParams.stockMin);
    if (searchParams.stockMax) sp.set('stockMax', searchParams.stockMax);
    if (searchParams.from) sp.set('from', searchParams.from);
    if (searchParams.to) sp.set('to', searchParams.to);

    if (key.startsWith('active:')) sp.set('active', key.split(':')[1]);
    else if (key.startsWith('stock:')) sp.set('stock', key.split(':')[1]);
    // 'all' = no chip param

    return `/admin/products${sp.toString() ? `?${sp.toString()}` : ''}`;
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Produits</h1>
          <p className="admin-page-sub">
            {count ?? products.length} produit{(count ?? products.length) > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-dark">
          + NOUVEAU PRODUIT
        </Link>
      </header>

      {/* ── Filter bar ── */}
      <section className="admin-filter-bar">
        <AdminSearch placeholder="Rechercher par nom, slug, description, collection…" />
        <div className="admin-tabs">
          {PRIMARY_FILTERS.map((f) => (
            <Link
              key={f.key}
              href={chipHref(f.key)}
              className={`admin-tab ${currentChip === f.key ? 'active' : ''}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <AdminAdvancedFilters
          controlledParams={[
            'collection',
            'priceMin',
            'priceMax',
            'stockMin',
            'stockMax',
            'from',
            'to',
          ]}
          keepParams={['q', 'active', 'stock']}
        >
          <div className="adv-grid">
            <AdminSelectFilter
              label="Collection"
              param="collection"
              options={uniqueCollections}
              placeholder="Toutes collections"
            />
            <AdminRangeFilter
              label="Prix"
              paramMin="priceMin"
              paramMax="priceMax"
              unit="DT"
              step="0.01"
            />
            <AdminRangeFilter
              label="Stock"
              paramMin="stockMin"
              paramMax="stockMax"
              step="1"
            />
            <AdminDateRangeFilter label="Date de création" />
          </div>
        </AdminAdvancedFilters>
      </section>

      {error && <div className="admin-error">{error.message}</div>}

      <div className="admin-card admin-card-flush">
        {products.length === 0 ? (
          <p className="admin-empty" style={{ padding: 40 }}>
            Aucun produit ne correspond à vos critères.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Nom</th>
                <th>Slug</th>
                <th>Collection</th>
                <th style={{ textAlign: 'right' }}>Prix</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt={p.name} className="admin-thumb" />
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}`} className="admin-link">
                      {p.name}
                    </Link>
                  </td>
                  <td className="admin-dim">{p.slug}</td>
                  <td className="admin-dim">{p.collection}</td>
                  <td style={{ textAlign: 'right', color: 'var(--gold)' }}>
                    {Number(p.price).toFixed(2)} {p.currency}
                  </td>
                  <td style={{ textAlign: 'right' }} className={p.stock === 0 ? 'admin-warn' : ''}>
                    {p.stock}
                  </td>
                  <td>
                    <span className={`pill ${p.is_active ? 'delivered' : 'cancelled'}`}>
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="admin-row-actions">
                      <Link href={`/admin/products/${p.id}`} className="admin-link">
                        Modifier
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
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
