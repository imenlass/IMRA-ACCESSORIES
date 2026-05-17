import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import OrderStatusManager from '@/components/admin/OrderStatusManager';
import type { OrderWithItems } from '@/types';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin(`/admin/orders/${params.id}`);

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(image_url))')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const order = data as OrderWithItems & {
    order_items: (OrderWithItems['order_items'][number] & {
      products: { image_url: string } | null;
    })[];
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/orders" className="back-link">
            ← Commandes
          </Link>
          <h1 className="admin-page-title">
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="admin-page-sub">
            Passée le{' '}
            {new Date(order.created_at).toLocaleString('fr-FR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
        </div>
        <span className={`pill ${order.status}`}>{STATUS_LABEL[order.status] ?? order.status}</span>
      </header>

      <div className="admin-row">
        <section className="admin-card admin-card-wide">
          <h2>Articles</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Produit</th>
                <th style={{ textAlign: 'right' }}>Prix</th>
                <th style={{ textAlign: 'right' }}>Quantité</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {it.products?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.products.image_url} alt="" className="admin-thumb" />
                    ) : (
                      <div className="admin-thumb admin-thumb-empty">◆</div>
                    )}
                  </td>
                  <td>{it.product_name}</td>
                  <td style={{ textAlign: 'right' }}>
                    {Number(it.unit_price).toFixed(2)} {order.currency}
                  </td>
                  <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right', color: 'var(--gold)' }}>
                    {(Number(it.unit_price) * it.quantity).toFixed(2)} {order.currency}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 500 }}>Total</td>
                <td style={{ textAlign: 'right', color: 'var(--gold)', fontSize: 18, fontFamily: "'Cormorant Garamond', serif" }}>
                  {Number(order.total).toFixed(2)} {order.currency}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <aside className="admin-card">
          <h2>Client</h2>
          <dl className="admin-dl">
            <dt>Nom</dt><dd>{order.customer_name}</dd>
            <dt>Email</dt><dd><a href={`mailto:${order.customer_email}`}>{order.customer_email}</a></dd>
            <dt>Téléphone</dt><dd><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></dd>
            <dt>Adresse</dt><dd>{order.customer_address}</dd>
            {order.notes && (
              <>
                <dt>Notes</dt><dd>{order.notes}</dd>
              </>
            )}
            <dt>Compte</dt>
            <dd>{order.user_id ? <span className="admin-dim">{order.user_id.slice(0, 8)}…</span> : <em>Invité</em>}</dd>
          </dl>

          <hr className="admin-hr" />

          <h2>Gestion</h2>
          <OrderStatusManager
            orderId={order.id}
            initialStatus={order.status as 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'}
          />
        </aside>
      </div>
    </div>
  );
}
