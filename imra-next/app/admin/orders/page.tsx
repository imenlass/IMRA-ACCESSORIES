import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import AdminSearch from '@/components/admin/AdminSearch';
import AdminAdvancedFilters from '@/components/admin/AdminAdvancedFilters';
import AdminRangeFilter from '@/components/admin/AdminRangeFilter';
import AdminDateRangeFilter from '@/components/admin/AdminDateRangeFilter';
import AdminSelectFilter from '@/components/admin/AdminSelectFilter';
import type { OrderWithItems } from '@/types';

export const dynamic = 'force-dynamic';

type Search = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  totalMin?: string;
  totalMax?: string;
  userType?: string; // 'guest' | 'registered'
};

const STATUS_FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'shipped', label: 'Expédiées' },
  { key: 'delivered', label: 'Livrées' },
  { key: 'cancelled', label: 'Annulées' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

function sanitize(s: string): string {
  return s.replace(/[,()*]/g, ' ').trim();
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { supabase } = await requireAdmin('/admin/orders');

  let query = supabase
    .from('orders')
    .select('*, order_items(quantity)', { count: 'exact' });

  if (searchParams.q) {
    const q = sanitize(searchParams.q);
    if (q) {
      const like = `%${q}%`;
      // Also match the short reference (first 8 hex chars of the UUID).
      // We compare case-insensitively against the order id's text form.
      query = query.or(
        `customer_name.ilike.${like},customer_email.ilike.${like},customer_phone.ilike.${like},customer_address.ilike.${like},id::text.ilike.${like}`
      );
    }
  }

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.from) query = query.gte('created_at', searchParams.from);
  if (searchParams.to) query = query.lte('created_at', `${searchParams.to}T23:59:59`);
  if (searchParams.totalMin) query = query.gte('total', Number(searchParams.totalMin));
  if (searchParams.totalMax) query = query.lte('total', Number(searchParams.totalMax));
  if (searchParams.userType === 'guest') query = query.is('user_id', null);
  if (searchParams.userType === 'registered') query = query.not('user_id', 'is', null);

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;
  const orders = (data ?? []) as (OrderWithItems & {
    order_items: { quantity: number }[];
  })[];

  function statusHref(key: string) {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set('q', searchParams.q);
    if (searchParams.from) sp.set('from', searchParams.from);
    if (searchParams.to) sp.set('to', searchParams.to);
    if (searchParams.totalMin) sp.set('totalMin', searchParams.totalMin);
    if (searchParams.totalMax) sp.set('totalMax', searchParams.totalMax);
    if (searchParams.userType) sp.set('userType', searchParams.userType);
    if (key !== 'all') sp.set('status', key);
    return `/admin/orders${sp.toString() ? `?${sp.toString()}` : ''}`;
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Commandes</h1>
          <p className="admin-page-sub">
            {count ?? orders.length} commande{(count ?? orders.length) > 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* ── Filter bar ── */}
      <section className="admin-filter-bar">
        <AdminSearch placeholder="Rechercher par nom, email, téléphone, adresse ou réf…" />
        <div className="admin-tabs">
          {STATUS_FILTERS.map((f) => {
            const active = (searchParams.status ?? 'all') === f.key;
            return (
              <Link
                key={f.key}
                href={statusHref(f.key)}
                className={`admin-tab ${active ? 'active' : ''}`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <AdminAdvancedFilters
          controlledParams={['from', 'to', 'totalMin', 'totalMax', 'userType']}
          keepParams={['q', 'status']}
        >
          <div className="adv-grid">
            <AdminDateRangeFilter label="Date de commande" />
            <AdminRangeFilter
              label="Total"
              paramMin="totalMin"
              paramMax="totalMax"
              unit="DT"
              step="0.01"
            />
            <AdminSelectFilter
              label="Type de client"
              param="userType"
              options={[
                { value: 'guest', label: 'Invité (sans compte)' },
                { value: 'registered', label: 'Avec compte' },
              ]}
              placeholder="Tous"
            />
          </div>
        </AdminAdvancedFilters>
      </section>

      {error && <div className="admin-error">{error.message}</div>}

      <div className="admin-card admin-card-flush">
        {orders.length === 0 ? (
          <p className="admin-empty" style={{ padding: 40 }}>
            Aucune commande ne correspond à vos critères.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Client</th>
                <th>Email</th>
                <th style={{ textAlign: 'right' }}>Articles</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const itemCount = o.order_items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="admin-link">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="admin-dim">
                      {new Date(o.created_at).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>{o.customer_name}</td>
                    <td className="admin-dim">{o.customer_email}</td>
                    <td style={{ textAlign: 'right' }}>{itemCount}</td>
                    <td style={{ textAlign: 'right', color: 'var(--gold)' }}>
                      {Number(o.total).toFixed(2)} {o.currency}
                    </td>
                    <td>
                      <span className={`pill ${o.status}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
