'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useCart } from './CartContext';

type Toast = { id: number; message: string; kind: 'success' | 'error' };

type ToastContextValue = {
  toast: (message: string, kind?: 'success' | 'error') => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // The cart drawer occupies the right side of the screen when open, where
  // toasts normally appear. Mirror the toast stack to the left in that case
  // so they don't cover the checkout button.
  const { isOpen: cartOpen } = useCart();

  const toast = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className={`toast-stack ${cartOpen ? 'is-cart-open' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
            <span className="accent">◆</span> {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
