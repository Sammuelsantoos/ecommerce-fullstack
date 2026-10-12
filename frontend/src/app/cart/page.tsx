'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCart } from '@/stores/cart-store';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, remove, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Carrinho vazio</h1>
        <Link href="/products" className="mt-4 inline-block">
          <Button>Ver produtos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-2xl font-bold">Carrinho</h1>
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <Card key={product.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <img
                  src={
                    product.imageUrl ??
                    'https://placehold.co/100x100/e5e7eb/6b7280?text=Sem+Imagem'
                  }
                  alt={product.name}
                  className="h-16 w-16 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) =>
                    updateQuantity(product.id, Number(e.target.value))
                  }
                  className="w-16"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(total())}</span>
          </div>
          <div className="flex justify-between border-t pt-3 font-bold">
            <span>Total</span>
            <span>{formatPrice(total())}</span>
          </div>
          <Link href="/checkout" className="block">
            <Button className="w-full">Finalizar compra</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
