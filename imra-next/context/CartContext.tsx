'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Product } from '@/types';

const STORAGE_KEY = 'imra:cart:v1';

type CartState = { items: CartItem[] };

type Action =
  | { type: 'HYDRATE'; items: CartItem[] }
  | { type: 'ADD'; product: Product; quantity: number }
  | { type: 'SET_QTY'; product_id: string; quantity: number }
  | { type: 'REMOVE'; product_id: string }
  | { type: 'CLEAR' };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items };
    case 'ADD': {
      const existing = state.items.find((i) => i.product_id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === action.product.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            product_id: action.product.id,
            name: action.product.name,
            price: action.product.price,
            image_url: action.product.image_url,
            quantity: action.quantity,
          },
        ],
      };
    }
    case 'SET_QTY':
      return {
        items: state.items
          .map((i) =>
            i.product_id === action.product_id ? { ...i, quantity: action.quantity } : i
          )
          .filter((i) => i.quantity > 0),
      };
    case 'REMOVE':
      return { items: state.items.filter((i) => i.product_id !== action.product_id) };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  hydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: Product, quantity: number) => void;
  setQuantity: (product_id: string, quantity: number) => void;
  removeFromCart: (product_id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) dispatch({ type: 'HYDRATE', items: parsed });
      }
    } catch {
      // ignore — fresh cart
    }
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore quota errors
    }
  }, [state.items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const addToCart = useCallback((product: Product, quantity: number) => {
    if (quantity <= 0) return;
    dispatch({ type: 'ADD', product, quantity });
  }, []);

  const setQuantity = useCallback((product_id: string, quantity: number) => {
    dispatch({ type: 'SET_QTY', product_id, quantity: Math.max(0, quantity) });
  }, []);

  const removeFromCart = useCallback((product_id: string) => {
    dispatch({ type: 'REMOVE', product_id });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const count = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );
  const total = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items]
  );

  const value: CartContextValue = {
    items: state.items,
    count,
    total,
    isOpen,
    hydrated,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
