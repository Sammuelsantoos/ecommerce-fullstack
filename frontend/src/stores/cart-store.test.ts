import { beforeEach, describe, expect, it } from 'vitest';
import type { Product } from '@/types';
import { useCart } from './cart-store';

const product = (id: string, price: string): Product => ({
  id,
  name: `Produto ${id}`,
  description: '',
  price,
  stock: 10,
  categoryId: 'c1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('cart store', () => {
  beforeEach(() => {
    localStorage.clear();
    useCart.setState({ items: [] });
  });

  it('adds a new product with quantity 1 by default', () => {
    useCart.getState().add(product('p1', '10.00'));

    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it('accumulates quantity when the same product is added again', () => {
    const { add } = useCart.getState();
    add(product('p1', '10.00'), 2);
    add(product('p1', '10.00'), 3);

    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(5);
  });

  it('removes a product by id', () => {
    const { add, remove } = useCart.getState();
    add(product('p1', '10.00'));
    add(product('p2', '20.00'));
    remove('p1');

    expect(useCart.getState().items.map((i) => i.product.id)).toEqual(['p2']);
  });

  it('updates the quantity of a product', () => {
    const { add, updateQuantity } = useCart.getState();
    add(product('p1', '10.00'));
    updateQuantity('p1', 7);

    expect(useCart.getState().items[0].quantity).toBe(7);
  });

  it('computes total from string prices and count from quantities', () => {
    const { add } = useCart.getState();
    add(product('p1', '10.50'), 2);
    add(product('p2', '20.00'), 1);

    expect(useCart.getState().total()).toBe(41);
    expect(useCart.getState().count()).toBe(3);
  });

  it('clears the cart', () => {
    const { add, clear } = useCart.getState();
    add(product('p1', '10.00'));
    clear();

    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().total()).toBe(0);
  });

  it('persists items in localStorage under cart-storage', () => {
    useCart.getState().add(product('p1', '10.00'));

    const stored = JSON.parse(localStorage.getItem('cart-storage') ?? '{}');
    expect(stored.state.items).toHaveLength(1);
  });
});
