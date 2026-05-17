import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/Footer';
import type { Order, OrderItem } from '@/types';

type OrderItemWithProduct = OrderItem & {
  products: { image_url: string; slug: string } | null;
};
type OrderDetailData = Order & { order_items: OrderItemWithProduct[] };

export const dynamic = 'force-dynamic';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/account/orders/${params.id}`);
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(image_url, slug))')
    .eq('id', params.id)
    .single();

  if (error || !data) notFound();
  const order = data as OrderDetailData;

  const currentStep = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);
  const isCancelled = order.status === 'cancelled';

  return (
    <>
      <main className="account-page">
        <div className="container" style={{ maxWidth: 960 }}>
          <Link href="/account/orders" className="back-link">
            ← Toutes mes commandes
          </Link>

          <div className="order-detail-header">
            <div>
              <div className="eyebrow" style={{ color: 'var(--gold)', letterSpacing: 5, fontSize: 11, marginBottom: 8 }}>
                COMMANDE
              </div>
              <h1>#{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Passée le{' '}
                {new Date(order.created_at).toLocaleString('fr-FR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <span className={`order-status ${order.status}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {!isCancelled ? (
            <div className="status-timeline">
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`step ${i <= currentStep ? 'done' : ''} ${i === currentStep ? 'current' : ''}`}
                >
                  <div className="dot">
                    {i < currentStep ? '✓' : i === currentStep ? '●' : ''}
                  </div>
                  <div className="label">{STATUS_LABELS[step]}</div>
                  {i < STATUS_STEPS.length - 1 && <div className="line" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="status-cancelled-banner">
              Cette commande a été annulée.
            </div>
          )}

          <div className="detail-grid">
            <section className="detail-block">
              <h2>Articles</h2>
              {order.order_items.map((item) => (
                <div key={item.id} className="detail-item">
                  <div className="detail-item-img">
                    {item.products?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.products.image_url} alt={item.product_name} />
                    ) : (
                      <div className="placeholder">◆</div>
                    )}
                  </div>
                  <div className="detail-item-info">
                    <div className="name">{item.product_name}</div>
                    <div className="meta">
                      {Number(item.unit_price).toFixed(2)} {order.currency} × {item.quantity}
                    </div>
                  </div>
                  <div className="detail-item-total">
                    {(Number(item.unit_price) * item.quantity).toFixed(2)} {order.currency}
                  </div>
                </div>
              ))}

              <div className="detail-totals">
                <div className="row">
                  <span>Sous-total</span>
                  <span>{Number(order.total).toFixed(2)} {order.currency}</span>
                </div>
                <div className="row">
                  <span>Livraison</span>
                  <span style={{ color: 'var(--gold)' }}>À convenir</span>
                </div>
                <div className="row total">
                  <span>Total</span>
                  <span>{Number(order.total).toFixed(2)} {order.currency}</span>
                </div>
              </div>
            </section>

            <aside className="detail-block side">
              <h2>Livraison</h2>
              <dl className="detail-dl">
                <dt>Nom</dt>
                <dd>{order.customer_name}</dd>
                <dt>Email</dt>
                <dd>{order.customer_email}</dd>
                <dt>Téléphone</dt>
                <dd>{order.customer_phone}</dd>
                <dt>Adresse</dt>
                <dd>{order.customer_address}</dd>
                {order.notes && (
                  <>
                    <dt>Notes</dt>
                    <dd>{order.notes}</dd>
                  </>
                )}
              </dl>

              <div className="detail-cta-block">
                <p style={{ color: '#888', fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
                  Une question sur cette commande ? Notre équipe se tient à votre disposition.
                </p>
                <Link href="/#contact" className="btn">
                  NOUS CONTACTER
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
