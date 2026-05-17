import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import KpiCard from '@/components/admin/KpiCard';
import RevenueChart from '@/components/admin/RevenueChart';
import StatusDonut from '@/components/admin/StatusDonut';
import TopProducts from '@/components/admin/TopProducts';

export const dynamic = 'force-dynamic';

type Stats = {
  month_revenue: number;
  previous_month_revenue: number;
  total_revenue: number;
  month_orders: number;
  previous_month_orders: number;
  avg_order_value: number;
  unique_customers: number;
  orders_by_status: Record<string, number>;
  pending_orders: number;
  totals: { products: number; orders: number; unread_messages: number; admins: number };
  top_products: { product_id: string | null; name: string; quantity: number; revenue: number }[];
  recent_orders: {
    id: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }[];
  daily_revenue: { day: string; revenue: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatToday(): string {
  const d = new Date();
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);
}

export default async function AdminDashboard() {
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_stats');

  if (error || !data) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Tableau de bord</h1>
        <div className="admin-error">
          {error?.message ?? 'Impossible de charger les statistiques.'}
        </div>
        <p style={{ color: '#888', fontSize: 13, marginTop: 14 }}>
          Si vous venez d&apos;ajouter de nouveaux champs au RPC, exécutez{' '}
          <code>supabase/enhance-admin-stats.sql</code> dans Supabase.
        </p>
      </div>
    );
  }

  const stats = data as Stats;
  const firstName = (user.email ?? '').split('@')[0];
  const pendingOrders = stats.pending_orders ?? 0;
  const unreadMessages = stats.totals.unread_messages ?? 0;
  const hasActions = pendingOrders > 0 || unreadMessages > 0;

  return (
    <div className="admin-page">
      {/* ─── Greeting + date ─── */}
      <header className="admin-greeting">
        <div>
          <h1 className="admin-page-title">
            {greeting()}, <em>{firstName}</em>
          </h1>
          <p className="admin-page-sub">{formatToday()} · Voici votre boutique en bref.</p>
        </div>
      </header>

      {/* ─── Action card (pending things to do) ─── */}
      {hasActions && (
        <div className="admin-action-card">
          <div className="action-icon">✦</div>
          <div className="action-body">
            <div className="action-title">À traiter</div>
            <div className="action-items">
              {pendingOrders > 0 && (
                <Link href="/admin/orders?status=pending" className="action-chip">
                  <strong>{pendingOrders}</strong>
                  commande{pendingOrders > 1 ? 's' : ''} en attente
                </Link>
              )}
              {unreadMessages > 0 && (
                <Link href="/admin/messages?filter=unread" className="action-chip">
                  <strong>{unreadMessages}</strong>
                  message{unreadMessages > 1 ? 's' : ''} non lu{unreadMessages > 1 ? 's' : ''}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI grid (5 cards with trends) ─── */}
      <section className="kpi-grid">
        <KpiCard
          label="Revenu ce mois"
          value={stats.month_revenue}
          unit="DT"
          icon="◆"
          trend={{ current: stats.month_revenue, previous: stats.previous_month_revenue }}
          caption={`vs ${fmt(stats.previous_month_revenue)} DT le mois dernier`}
          featured
        />
        <KpiCard
          label="Revenu total"
          value={stats.total_revenue}
          unit="DT"
          caption={`sur ${stats.totals.orders} commande${stats.totals.orders > 1 ? 's' : ''}`}
        />
        <KpiCard
          label="Panier moyen"
          value={stats.avg_order_value}
          unit="DT"
          caption="par commande non annulée"
        />
        <KpiCard
          label="Commandes ce mois"
          value={stats.month_orders}
          trend={{ current: stats.month_orders, previous: stats.previous_month_orders }}
          caption={`${stats.previous_month_orders} le mois dernier`}
        />
        <KpiCard
          label="Clients uniques"
          value={stats.unique_customers}
          caption={`${stats.totals.products} produit${stats.totals.products > 1 ? 's' : ''} actifs`}
        />
      </section>

      {/* ─── Revenue chart (full width) ─── */}
      <section className="admin-card admin-card-padded">
        <header className="admin-card-header">
          <h2>Revenu — 14 derniers jours</h2>
          <span className="admin-dim">Survolez les barres pour le détail</span>
        </header>
        <RevenueChart data={stats.daily_revenue} />
      </section>

      {/* ─── Status bars + Top products ─── */}
      <div className="admin-row">
        <section className="admin-card">
          <header className="admin-card-header">
            <h2>Commandes par statut</h2>
            <Link href="/admin/orders" className="admin-link">Tout voir →</Link>
          </header>
          <StatusDonut counts={stats.orders_by_status} />
        </section>

        <section className="admin-card">
          <header className="admin-card-header">
            <h2>Top produits</h2>
            <Link href="/admin/products" className="admin-link">Catalogue →</Link>
          </header>
          <TopProducts items={stats.top_products} />
        </section>
      </div>

      {/* ─── Recent orders ─── */}
      <section className="admin-card admin-card-flush">
        <header className="admin-card-header" style={{ padding: '20px 24px 0' }}>
          <h2>Dernières commandes</h2>
          <Link href="/admin/orders" className="admin-link">Voir toutes →</Link>
        </header>
        {stats.recent_orders.length === 0 ? (
          <p className="admin-empty" style={{ padding: 30 }}>Aucune commande pour le moment.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="admin-link">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td>{o.customer_name}</td>
                  <td className="admin-dim">
                    {new Date(o.created_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>
                    <span className={`pill ${o.status}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--gold)' }}>
                    {fmt(o.total)} DT
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
