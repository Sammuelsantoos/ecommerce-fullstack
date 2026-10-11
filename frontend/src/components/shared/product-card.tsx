'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCart } from '@/stores/cart-store';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="aspect-square overflow-hidden rounded-md bg-muted">
          <img
            src={
              product.imageUrl ??
              'https://placehold.co/400x400/e5e7eb/6b7280?text=Sem+Imagem'
            }
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="font-semibold">{formatPrice(product.price)}</span>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}`}>
            <Button variant="outline" size="sm">
              Ver
            </Button>
          </Link>
          <Button
            size="sm"
            disabled={product.stock === 0}
            onClick={() => {
              add(product);
              toast.success('Adicionado ao carrinho');
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
