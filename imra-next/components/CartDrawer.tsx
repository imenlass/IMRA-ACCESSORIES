'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createClient } from '@/lib/supabase/client';
import Spinner from './Spinner';

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

const EMPTY_FORM: CheckoutForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

export default function CartDrawer() {
  const { items, total, isOpen, closeCart, removeFromCart, setQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  // We keep the customer email after submission so we can pre-fill the
  // sign-in / sign-up pages — letting the user claim the order they just
  // placed as a guest.
  const [lastCustomerEmail, setLastCustomerEmail] = useState<string>('');

  // When a logged-in user opens the cart, pre-fill the checkout form from
  // their profile (name / phone / address) + their auth email. Only fills
  // fields the user hasn't already typed in this session, so we never
  // overwrite their in-progress edits.
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;

      setForm((f) => ({
        ...f,
        email: f.email || user.email || '',
        name: f.name || profile?.full_name || '',
        phone: f.phone || profile?.phone || '',
        address: f.address || profile?.address || '',
      }));
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  // Reset to cart view when reopening (after a previous success)
  useEffect(() => {
    if (isOpen && stage === 'success' && items.length > 0) {
      setStage('cart');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function update<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Votre panier est vide.');
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Veuillez remplir tous les champs requis.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const { data: orderId, error: rpcErr } = await supabase.rpc('create_order', {
        p_customer_name: form.name.trim(),
        p_customer_email: form.email.trim(),
        p_customer_phone: form.phone.trim(),
        p_customer_address: form.address.trim(),
        p_notes: form.notes.trim(),
        p_items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });

      if (rpcErr || !orderId) {
        throw new Error(rpcErr?.message ?? 'Impossible de créer la commande.');
      }

      // For logged-in users: mirror the just-entered contact info back into
      // their profile so it pre-fills next time AND shows in /account/profile.
      // RLS already restricts this upsert to the caller's own row.
      // We fire-and-forget — the order itself succeeded, so even if this fails
      // we don't want to surface an error to the user.
      if (user?.id) {
        void supabase.from('profiles').upsert(
          {
            id: user.id,
            full_name: form.name.trim() || null,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
          },
          { onConflict: 'id' }
        );
      }

      setLastOrderId(orderId as unknown as string);
      setLastCustomerEmail(form.email.trim());
      setStage('success');
      clearCart();
      setForm(EMPTY_FORM);
      toast('Commande envoyée avec succès !');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Don't render the cart drawer inside the admin section
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <div
        className={`cart-backdrop ${isOpen ? 'open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className={`cart-drawer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
      >
        <div className="cart-drawer-header">
          <h2>
            {stage === 'cart' && 'Votre Panier'}
            {stage === 'checkout' && 'Finaliser'}
            {stage === 'success' && 'Merci !'}
          </h2>
          <button type="button" className="close-cart" onClick={closeCart} aria-label="Fermer le panier">
            ×
          </button>
        </div>

        <div className="cart-drawer-body">
          {stage === 'success' && (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ fontSize: 48, color: 'var(--gold)', marginBottom: 14 }}>✦</div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 26,
                  color: 'white',
                  marginBottom: 12,
                  fontWeight: 400,
                }}
              >
                Commande confirmée
              </h3>
              <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
                Nous vous contacterons sous peu pour finaliser la livraison.
              </p>
              {lastOrderId && (
                <p style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>
                  Réf : <span style={{ color: 'var(--gold)' }}>{lastOrderId.slice(0, 8)}</span>
                </p>
              )}
              {user ? (
                <Link
                  href="/account/orders"
                  className="btn"
                  style={{ marginTop: 20, display: 'inline-block' }}
                  onClick={closeCart}
                >
                  VOIR MES COMMANDES
                </Link>
              ) : (
                <div className="success-auth-block">
                  <p className="success-auth-hint">
                    Pour suivre cette commande et accéder à votre historique :
                  </p>
                  <div className="success-auth-row">
                    <Link
                      href={`/auth/login?email=${encodeURIComponent(lastCustomerEmail)}&redirect=${encodeURIComponent('/account/orders')}`}
                      className="btn"
                      onClick={closeCart}
                    >
                      SE CONNECTER
                    </Link>
                    <Link
                      href={`/auth/signup?email=${encodeURIComponent(lastCustomerEmail)}&redirect=${encodeURIComponent('/account/orders')}`}
                      className="btn btn-dark"
                      onClick={closeCart}
                    >
                      CRÉER UN COMPTE
                    </Link>
                  </div>
                  <p className="success-auth-fineprint">
                    Votre commande sera automatiquement associée à votre compte si vous utilisez
                    l&apos;email <strong>{lastCustomerEmail}</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {stage !== 'success' && items.length === 0 && (
            <div className="cart-empty">
              <div className="icon">🛒</div>
              Votre panier est vide
            </div>
          )}

          {stage !== 'success' && items.length > 0 && (
            <>
              {items.map((item) => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-img">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={64}
                      height={64}
                      style={{ width: 64, height: 64, objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{item.price.toFixed(2)} DT</div>
                    <div className="cart-item-qty">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                        aria-label="Diminuer"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                        aria-label="Augmenter"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="cart-item-total">
                      {(item.price * item.quantity).toFixed(2)} DT
                    </div>
                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.product_id)}
                      aria-label={`Retirer ${item.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {stage === 'checkout' && (
                <form className="order-form" onSubmit={submitOrder} noValidate>
                  {error && <div className="error">{error}</div>}
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                    autoComplete="name"
                  />
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    type="tel"
                    placeholder="Numéro de téléphone"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    required
                    autoComplete="tel"
                  />
                  <input
                    type="text"
                    placeholder="Adresse de livraison"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    required
                    autoComplete="street-address"
                  />
                  <textarea
                    placeholder="Notes (optionnel)"
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-dark btn-loading"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner /> ENVOI…
                      </>
                    ) : (
                      'CONFIRMER LA COMMANDE'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setStage('cart')}
                    disabled={submitting}
                    style={{ marginTop: 4 }}
                  >
                    RETOUR AU PANIER
                  </button>
                  {!user && (
                    <p style={{ color: '#777', fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                      <Link href="/auth/login" onClick={closeCart} style={{ color: 'var(--gold)' }}>
                        Connectez-vous
                      </Link>{' '}
                      pour suivre vos commandes.
                    </p>
                  )}
                </form>
              )}
            </>
          )}
        </div>

        {stage === 'cart' && items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-total-row">
              <span className="label">Total</span>
              <span className="value">{total.toFixed(2)} DT</span>
            </div>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => setStage('checkout')}
            >
              PASSER LA COMMANDE
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
