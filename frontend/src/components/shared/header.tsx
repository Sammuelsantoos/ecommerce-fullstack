'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, LogOut, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/stores/cart-store';
import { clearAuth } from '@/lib/auth';

export function Header() {
  const router = useRouter();
  const { user, isAuth, mounted } = useAuth();
  const cartCount = useCart((s) => s.count());
  const [cartMounted, setCartMounted] = useState(false);

  useEffect(() => {
    setCartMounted(true);
  }, []);

  const logout = () => {
    clearAuth();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          TechStore
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/products" className="text-sm hover:underline">
            Produtos
          </Link>

          {mounted && isAuth && (
            <Link
              href="/orders"
              className="flex items-center gap-1 text-sm hover:underline"
            >
              <Package className="h-4 w-4" /> Pedidos
            </Link>
          )}

          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {mounted && cartMounted && cartCount > 0 && (
              <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                {cartCount}
              </Badge>
            )}
          </Link>

          {mounted && isAuth ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user?.name ?? 'User'}
              </span>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                <User className="mr-2 h-4 w-4" /> Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
