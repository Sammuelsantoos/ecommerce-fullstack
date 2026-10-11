'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useCart } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!getToken()) {
      toast.error('Faça login para continuar');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      await api.post<Order>('/orders', {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });
      clear();
      toast.success('Pedido realizado com sucesso!');
      router.push('/orders');
    } catch {
      toast.error('Erro ao criar pedido. Verifique o estoque.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="container mx-auto p-8 text-center text-muted-foreground">
        Carrinho vazio.
      </p>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Finalizar compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.product.id} className="flex justify-between text-sm">
                <span>
                  {i.product.name} × {i.quantity}
                </span>
                <span>
                  {formatPrice(Number(i.product.price) * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-3 font-bold">
            <span>Total</span>
            <span>{formatPrice(total())}</span>
          </div>
          <Button
            className="w-full"
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Confirmar pedido'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
