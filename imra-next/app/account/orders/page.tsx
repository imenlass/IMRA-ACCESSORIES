import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/Footer';
import type { OrderWithItems } from '@/types';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/account/orders');
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  const orders = (data ?? []) as OrderWithItems[];

  return (
    <>
      <main className="account-page">
        <div className="container">
          <h1>
            Mes <em>Commandes</em>
          </h1>
          <p className="subtitle">{user.email}</p>

          {error && (
            <div className="auth-error" style={{ marginBottom: 20 }}>
              {error.message}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="orders-empty">
              <div className="icon">◆</div>
              <p>Vous n&apos;avez pas encore passé de commande.</p>
              <Link href="/" className="btn">
                DÉCOUVRIR LA BOUTIQUE
              </Link>
            </div>
          ) : (
            <div className="orders-stack">
              {orders.map((order) => {
                const itemsCount = order.order_items?.reduce(
                  (s, i) => s + (i.quantity || 0),
                  0
                ) ?? 0;
                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="order-card-link"
                  >
                    <article className="order-card">
                      <div className="order-card-header">
                        <div>
                          <div className="order-id">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="order-date">
                            {new Date(order.created_at).toLocaleString('fr-FR', {
                              dateStyle: 'long',
                              timeStyle: 'short',
                            })}
                          </div>
                        </div>
                        <span className={`order-status ${order.status}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>

                      <div className="order-card-summary">
                        <div className="summary-line">
                          {order.order_items?.slice(0, 2).map((it) => (
                            <span key={it.id}>
                              {it.product_name} × {it.quantity}
                            </span>
                          ))}
                          {(order.order_items?.length ?? 0) > 2 && (
                            <span className="more">
                              +{(order.order_items!.length - 2)} autres
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="order-card-footer">
                        <span className="count">
                          {itemsCount} article{itemsCount > 1 ? 's' : ''}
                        </span>
                        <span className="total-amount">
                          {Number(order.total).toFixed(2)} {order.currency}
                        </span>
                        <span className="chevron" aria-hidden="true">→</span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
