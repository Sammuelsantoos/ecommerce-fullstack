import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          existing.quantity += quantity;
        } else {
          items.push({ product, quantity });
        }
        set({ items });
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.product.id !== productId) }),
      updateQuantity: (productId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i,
          ),
        }),
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce(
          (acc, i) => acc + Number(i.product.price) * i.quantity,
          0,
        ),
      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    { name: 'cart-storage' },
  ),
);
