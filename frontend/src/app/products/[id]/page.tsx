'use client';

export const dynamic = 'force-dynamic';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/stores/cart-store';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);

  useEffect(() => {
    api
      .get<Product>(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => toast.error('Produto não encontrado'));
  }, [id]);

  if (!product) return <p className="p-8">Carregando...</p>;

  return (
    <div className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <img
          src={
            product.imageUrl ??
            'https://placehold.co/600x600/e5e7eb/6b7280?text=Sem+Imagem'
          }
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-2 text-muted-foreground">{product.description}</p>
        <p className="mt-4 text-3xl font-bold">{formatPrice(product.price)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {product.stock > 0 ? `${product.stock} em estoque` : 'Sem estoque'}
        </p>

        <div className="mt-6 flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-20"
          />
          <Button
            disabled={product.stock === 0}
            onClick={() => {
              add(product, qty);
              toast.success('Adicionado ao carrinho');
              router.push('/cart');
            }}
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}
