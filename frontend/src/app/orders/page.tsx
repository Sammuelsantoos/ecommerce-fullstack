'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  PAID: 'default',
  SHIPPED: 'default',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api
      .get<Order[]>('/orders/me')
      .then((r) => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <p className="container mx-auto p-8">Carregando...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">
          Você ainda não fez nenhum pedido.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">
                  Pedido #{o.id.slice(0, 8)}
                </CardTitle>
                <Badge variant={statusVariant[o.status]}>{o.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {o.items.map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span>
                        {i.product?.name ?? 'Produto'} × {i.quantity}
                      </span>
                      <span>
                        {formatPrice(Number(i.price) * i.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t pt-3 font-bold">
                  <span>Total</span>
                  <span>{formatPrice(o.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
