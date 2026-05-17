'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import ProductDetailModal from './ProductDetailModal';

export default function ProductCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const { addToCart, openCart } = useCart();
  const { toast } = useToast();

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(99, q + 1));

  const handleAdd = () => {
    if (qty <= 0) return;
    addToCart(product, qty);
    toast(`${product.name} ajouté au panier`);
    setQty(1);
    openCart();
  };

  return (
    <>
      <article className="card">
        <button
          type="button"
          className="card-img"
          onClick={() => setModalOpen(true)}
          aria-label={`Voir les détails de ${product.name}`}
        >
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={260}
            priority={false}
            style={{ height: 260, width: '100%', objectFit: 'cover' }}
          />
          <div className="card-overlay">
            <span>VOIR</span>
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="card-tag">Rupture proche</span>
          )}
        </button>
        <div className="card-content">
          <h3>
            <button
              type="button"
              className="card-name-link"
              onClick={() => setModalOpen(true)}
            >
              {product.name}
            </button>
          </h3>
          <div className="price">
            {product.price} {product.currency}
          </div>
          <div className="card-controls">
            <button
              type="button"
              className="qty-btn"
              onClick={dec}
              aria-label={`Diminuer la quantité de ${product.name}`}
            >
              −
            </button>
            <input
              type="number"
              className="qty-input"
              value={qty}
              min={1}
              max={99}
              readOnly
              aria-label={`Quantité de ${product.name}`}
            />
            <button
              type="button"
              className="qty-btn"
              onClick={inc}
              aria-label={`Augmenter la quantité de ${product.name}`}
            >
              +
            </button>
            <button
              type="button"
              className="add-to-cart"
              onClick={handleAdd}
              aria-label={`Ajouter ${product.name} au panier`}
              title="Ajouter au panier"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="20" r="1.4" fill="currentColor" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" />
                <path d="M2.5 3.5h2.5l2.6 12.2a1.6 1.6 0 0 0 1.6 1.3h9.2a1.6 1.6 0 0 0 1.6-1.2L21.5 8H6.2" />
              </svg>
            </button>
          </div>
        </div>
      </article>

      <ProductDetailModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
