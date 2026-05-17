'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

type Props = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

export default function ProductDetailModal({ product, open, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const { addToCart, openCart } = useCart();
  const { toast } = useToast();

  // Reset qty + lock scroll while open
  useEffect(() => {
    if (open) {
      setQty(1);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, qty);
    toast(`${product.name} ajouté au panier`);
    onClose();
    openCart();
  };

  return (
    <div
      className={`pdp-backdrop ${open ? 'open' : ''}`}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={`pdp-modal ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="pdp-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>

        <div className="pdp-grid">
          <div className="pdp-image">
            <Image
              src={product.image_url}
              alt={product.name}
              width={720}
              height={720}
              priority
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div className="pdp-info">
            <div className="pdp-eyebrow">{product.collection.replace('-', ' ').toUpperCase()}</div>
            <h2 id="pdp-title">{product.name}</h2>
            <div className="pdp-price">
              {product.price} <span>{product.currency}</span>
            </div>

            {product.description && <p className="pdp-desc">{product.description}</p>}

            <ul className="pdp-features">
              <li><span>✦</span> Fait main avec passion</li>
              <li><span>◈</span> Matériaux premium</li>
              <li><span>◉</span> Livraison soignée</li>
              <li><span>❋</span> Emballage cadeau</li>
            </ul>

            <div className="pdp-stock">
              {product.stock > 5 ? (
                <span className="in-stock">● En stock</span>
              ) : product.stock > 0 ? (
                <span className="low-stock">● Plus que {product.stock} en stock</span>
              ) : (
                <span className="out-stock">● Rupture de stock</span>
              )}
            </div>

            <div className="pdp-actions">
              <div className="pdp-qty">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Diminuer"
                >
                  −
                </button>
                <span aria-live="polite">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label="Augmenter"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="btn btn-dark pdp-add"
                onClick={handleAdd}
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? 'INDISPONIBLE' : 'AJOUTER AU PANIER'}
              </button>
            </div>

            <div className="pdp-meta">
              <div><span className="key">Référence</span> <span className="val">{product.slug}</span></div>
              <div><span className="key">Collection</span> <span className="val">Red Carpet</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
